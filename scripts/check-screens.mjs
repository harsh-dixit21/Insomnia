import assert from 'node:assert/strict';
import {createServer} from 'vite';
import React from 'react';
import {renderToString} from 'react-dom/server';
// Server-side component smoke check; no browser, effects, or network requests.
globalThis.location={hash:'#dashboard'};
globalThis.document={hidden:false};
const server=await createServer({server:{middlewareMode:true}});
try {
 const {WorkspaceProvider}=await server.ssrLoadModule('/src/components/workspace/store.tsx');
 const {default:Dashboard}=await server.ssrLoadModule('/src/components/ui/app-1.tsx');
 const {AuthPage}=await server.ssrLoadModule('/src/components/ui/auth-page.tsx');
 const {seed}=await server.ssrLoadModule('/src/lib/insomnia.ts');
 const {runTool}=await server.ssrLoadModule('/src/lib/workbench.ts');
 const sample=seed();
 sample.artifacts.push({id:'screen-report',evaluationId:sample.evaluations[0].id,tool:'fit',inputs:{oracle:'true'},created:new Date().toISOString(),result:runTool('fit',{oracle:'true'},sample,sample.evaluations[0].id)});
 globalThis.localStorage={getItem:()=>JSON.stringify(sample)};
 const auth=renderToString(React.createElement(WorkspaceProvider,null,React.createElement(AuthPage)));
 assert.ok(auth.includes('Your Insomnia workspace'));
 const routes=['dashboard','evaluations','new','workloads','requirements','tests','evidence','companies','reports','activity','settings','blockers','evaluation/EVAL-001','explainer','fit','deployment','business','call','demo','security','benchmark','migration','saved'];
 for(const route of routes){
  location.hash='#'+route;
  const html=renderToString(React.createElement(WorkspaceProvider,null,React.createElement(Dashboard)));
  assert.ok(html.includes('Insomnia'),`${route} must show its product identity`);
  assert.ok(!html.includes('FDR-'),`${route} must not contain old financial records`);
 }
 globalThis.localStorage={getItem:()=>null};
 for(const route of routes){location.hash='#'+route;const html=renderToString(React.createElement(WorkspaceProvider,null,React.createElement(Dashboard)));assert.ok(html.includes('Insomnia'));}
 console.log(`Screen render check passed: auth and ${routes.length} routes with populated and empty workspaces.`);
}finally{await server.close();delete globalThis.location;delete globalThis.document;delete globalThis.localStorage;}
