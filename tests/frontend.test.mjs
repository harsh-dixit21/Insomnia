import {test,after} from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {createServer} from 'vite';
import React from 'react';
const dom=new JSDOM('<!doctype html><html><body></body></html>',{url:'http://127.0.0.1:5190/portal/#dashboard',pretendToBeVisual:true});
for(const key of ['window','document','location','history','HTMLElement','Event','CustomEvent','navigator','FormData'])Object.defineProperty(globalThis,key,{value:dom.window[key],configurable:true,writable:true});
globalThis.IS_REACT_ACT_ENVIRONMENT=true;
const {render,cleanup,act,fireEvent,screen}=await import('@testing-library/react');
const vite=await createServer({optimizeDeps:{noDiscovery:true,entries:[]},server:{middlewareMode:true,hmr:false,ws:false}});
const {WorkspaceProvider,useWorkspace}=await vite.ssrLoadModule('/src/components/workspace/store.tsx');
const {WorkloadEditor}=await vite.ssrLoadModule('/src/components/workspace/editors.tsx');
const {api}=await vite.ssrLoadModule('/src/lib/api.ts');
const {emptyWorkspace,createEvaluation,dashboardInsights}=await vite.ssrLoadModule('/src/lib/workspace-data.ts');
const originalFetch=globalThis.fetch;
after(async()=>{cleanup();globalThis.fetch=originalFetch;await vite.close();dom.window.close();});
const session=(revision=0,name='Original workspace',state=emptyWorkspace())=>({user:{id:'alice',name:'Alice',email:'alice@example.test',workspaceId:'alice',access:'owner'},csrf:'test-csrf',state:{...state,settings:{...state.settings,workspace:name}},revision,insights:dashboardInsights(state)});
const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json'}});
async function setup(children){
 const requests=[];let context;
 globalThis.fetch=(path,options)=>new Promise(resolve=>requests.push({path,options,resolve}));
 function Probe(){context=useWorkspace();return React.createElement('output',null,`${context.status}:${context.revision}`);}
 render(React.createElement(WorkspaceProvider,null,React.createElement(Probe),children));
 assert.equal(requests[0].path,'/api/session');
 const respond=async(index,data,status=200)=>{await act(async()=>{requests[index].resolve(json(data,status));});};
 return {requests,respond,get context(){return context;}};
}

test('a refresh started before a save cannot roll back the saved revision',async()=>{
 const f=await setup();try{
  await f.respond(0,session());let refresh,save;
  act(()=>{refresh=f.context.refresh();});
  act(()=>{save=f.context.update(s=>{s.settings.workspace='Saved workspace';},'Updated name.');});
  assert.equal(f.requests[2].options.method,'PUT');assert.equal(f.requests[2].options.headers['X-Workspace-Id'],'alice');
  await f.context.refresh();assert.equal(f.requests.length,3,'focus refresh must wait while a save is pending');
  await f.respond(2,session(1,'Saved workspace'));assert.equal(await save,true);
  await f.respond(1,session(0,'Old response'));await refresh;
  assert.equal(f.context.revision,1);assert.equal(f.context.state.settings.workspace,'Saved workspace');
 }finally{cleanup();}
});

test('out-of-order refresh responses keep the most recent request',async()=>{
 const f=await setup();try{await f.respond(0,session());let older,newer;act(()=>{older=f.context.refresh();newer=f.context.refresh();});await f.respond(2,session(3,'Latest'));await newer;await f.respond(1,session(2,'Outdated'));await older;assert.equal(f.context.revision,3);assert.equal(f.context.state.settings.workspace,'Latest');}finally{cleanup();}
});

test('incomplete session responses cannot sign in or crash the dashboard',async()=>{
 const f=await setup();try{await f.respond(0,{user:{id:'alice'}});assert.equal(f.context.user,null);assert.equal(f.context.status,'offline');assert.match(f.context.notice,/incomplete/);}finally{cleanup();}
});

test('an expired session in a direct API feature clears workspace data immediately',async()=>{
 const state=emptyWorkspace();createEvaluation(state,{company:'QA buyer',name:'Evaluation',platform:'Oracle',owner:'Alice',deadline:'2026-12-01',requirements:'Check report correctness'},'TEST');
 const f=await setup();try{await f.respond(0,session(0,'Private',state));assert.equal(f.context.insights.counts.evaluations,1);let request;act(()=>{request=api('/api/integrations').catch(error=>error);});await f.respond(1,{error:'Sign in to access your workspace.'},401);assert.equal((await request).status,401);assert.equal(f.context.user,null);assert.equal(f.context.state.evaluations.length,0);assert.equal(f.context.insights.counts.evaluations,0);assert.equal(location.hash,'#auth');}finally{cleanup();}
});

test('connection recovery replaces the obsolete offline message',async()=>{
 const f=await setup();try{await f.respond(0,{error:'Service unavailable'},503);assert.equal(f.context.status,'offline');let retry;act(()=>{retry=f.context.refresh();});await f.respond(1,session());await retry;assert.equal(f.context.status,'ready');assert.match(f.context.notice,/Connection restored/);}finally{cleanup();}
});

test('a report form preserves rejected input and clears only after server confirmation',async()=>{
 const state=emptyWorkspace();createEvaluation(state,{company:'QA buyer',name:'Evaluation',platform:'Oracle',owner:'Alice',deadline:'2026-12-01',requirements:'Check report correctness'},'TEST');
 const f=await setup(React.createElement(WorkloadEditor,{evaluationId:'TEST'}));try{
  await f.respond(0,session(0,'QA',state));
  fireEvent.change(screen.getByLabelText('Report name'),{target:{value:'Portfolio report'}});fireEvent.change(screen.getByLabelText('Baseline seconds'),{target:{value:'10'}});fireEvent.change(screen.getByLabelText('Target seconds'),{target:{value:'2'}});
  fireEvent.submit(screen.getByRole('button',{name:'Add report'}).closest('form'));
  await f.respond(1,{error:'A report with this name already exists.'},400);assert.equal(screen.getByLabelText('Report name').value,'Portfolio report');
  fireEvent.submit(screen.getByRole('button',{name:'Add report'}).closest('form'));const next=JSON.parse(f.requests[2].options.body).state;await f.respond(2,session(1,'QA',next));assert.equal(screen.getByLabelText('Report name').value,'');assert.equal(f.context.state.workloads.length,1);
 }finally{cleanup();}
});
