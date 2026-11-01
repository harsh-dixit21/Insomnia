import {createContext,useContext,useState,useRef,useEffect,type ReactNode} from 'react';
import type {State} from '@/lib/insomnia';
import {emptyWorkspace,validateWorkspace,readStoredWorkspace,dashboardInsights,type DashboardInsights} from '@/lib/workspace-data';
import {api,ApiError,setCsrf,downloadFromApi,setWorkspaceScope} from '@/lib/api';
import type {Artifact,ToolId} from '@/lib/workbench';
export type Role='Buyer'|'Sales engineer'|'Security lead';
export type User={id:string;email:string;name:string;workspaceId?:string;access?:'owner'|'editor'|'viewer'};
type Snapshot={state:State;revision:number;insights:DashboardInsights};
type Session=Partial<Snapshot>&{user:User|null;csrf?:string};
type ActionResult=Partial<Snapshot>&{artifact?:Artifact;questions?:string;count?:number};
type ContextValue={state:State;insights:DashboardInsights;role:Role;setRole:(r:Role)=>void;notice:string;notify:(message:string)=>void;update:(fn:(s:State)=>void,action:string)=>Promise<boolean>;reset:()=>Promise<boolean>;clear:()=>Promise<boolean>;restore:(data:unknown)=>Promise<boolean>;user:User|null;busy:boolean;status:'loading'|'ready'|'offline';revision:number;refresh:()=>Promise<void>;authenticate:(mode:'signup'|'login',fields:{name?:string;email:string;password:string})=>Promise<boolean>;logout:()=>Promise<void>;executeTool:(tool:ToolId,inputs:Record<string,string>,evaluationId:string)=>Promise<Artifact|null>;importCsv:(kind:'workloads'|'measurements'|'questionnaire',csv:string,evaluationId:string)=>Promise<ActionResult|null>;exportData:(kind:string,id?:string)=>Promise<void>;migrateLocal:()=>Promise<boolean>};
const Context=createContext<ContextValue|null>(null);
export function WorkspaceProvider({children,initialState}:{children:ReactNode;initialState?:State}){
 const[state,setState]=useState(initialState||emptyWorkspace),[user,setUser]=useState<User|null>(null),[role,setRole]=useState<Role>('Buyer'),[notice,notify]=useState(''),[busy,setBusy]=useState(false),[status,setStatus]=useState<'loading'|'ready'|'offline'>('loading'),[revision,setRevision]=useState(0);
 const[insights,setInsights]=useState(()=>dashboardInsights(state));
 const current=useRef(state),rev=useRef(0),pending=useRef(false);const sessionEpoch=useRef(0),connection=useRef(status);connection.current=status;
 function apply(data:Snapshot){
  const state=validateWorkspace(data.state);
  if(!Number.isInteger(data.revision)||data.revision<0||!data.insights||!data.insights.counts||!Array.isArray(data.insights.activity)||!Array.isArray(data.insights.alerts))throw new ApiError(502,'The workspace response was incomplete. Please retry.');
  current.current=state;rev.current=data.revision;setState(state);setRevision(data.revision);setInsights(data.insights);
 }
 function clearSession(){sessionEpoch.current++;const empty=emptyWorkspace();setUser(null);setCsrf('');setWorkspaceScope('');current.current=empty;rev.current=0;setState(empty);setRevision(0);setInsights(dashboardInsights(empty));}
 function acceptSession(data:Session){
  if(!data.user||typeof data.user.id!=='string'||typeof data.user.email!=='string'||typeof data.csrf!=='string'||!data.csrf)throw new ApiError(502,'The sign-in response was incomplete. Please retry.');
  apply(data as Snapshot);setCsrf(data.csrf);setWorkspaceScope(data.user.workspaceId||data.user.id);setUser(data.user);
 }
 async function refresh(force=false){
  if(pending.current&&!force)return;
  const epoch=++sessionEpoch.current;
  try{
   const data=await api<Session>('/api/session');if(epoch!==sessionEpoch.current)return;
   if(data.user===null)clearSession();else acceptSession(data);
   if(connection.current==='offline')notify('Connection restored. Your workspace is up to date.');setStatus('ready');
  }catch(error){if(epoch!==sessionEpoch.current)return;setStatus('offline');notify(error instanceof Error?error.message:'Unable to refresh the workspace. Please retry.');}
 }
 useEffect(()=>{void refresh();},[]);
 useEffect(()=>{const expired=()=>{clearSession();setStatus('ready');notify('Your session expired. Sign in again to continue.');location.hash='auth';};window.addEventListener('insomnia-session-expired',expired);return()=>window.removeEventListener('insomnia-session-expired',expired);},[]);
 useEffect(()=>{const onFocus=()=>{if(!pending.current)void refresh();};window.addEventListener('focus',onFocus);const timer=setInterval(()=>{if(!document.hidden&&!pending.current)void refresh();},30000);return()=>{window.removeEventListener('focus',onFocus);clearInterval(timer);};},[]);
 async function handleError(error:unknown){
  notify(error instanceof Error?error.message:'Request failed.');
  if(error instanceof ApiError&&error.status===409){await refresh(true);notify('The workspace changed in another session. Latest data loaded; review your inputs before retrying.');}
  else if(error instanceof ApiError&&error.status===401){clearSession();setStatus('ready');location.hash='auth';}
  else if(error instanceof ApiError&&error.status>=502)setStatus('offline');
 }
 async function perform(fn:()=>Promise<ActionResult>):Promise<ActionResult|null>{
  if(user?.access==='viewer'){notify('Viewer access is read-only. Ask the workspace owner for editor access.');return null;}
  if(pending.current){notify('Wait for the current server operation to finish.');return null;}
  pending.current=true;setBusy(true);sessionEpoch.current++;
  try{const data=await fn();if(data.state!==undefined&&data.revision!==undefined)apply(data as Snapshot);setStatus('ready');notify(data.questions?'Questionnaire parsed by the server. Run the review to save an answer report.':'Saved to the server.');return data;}
  catch(error){await handleError(error);return null;}finally{pending.current=false;setBusy(false);}
 }
 async function update(fn:(s:State)=>void,action:string){return !!await perform(async()=>{const next=structuredClone(current.current);fn(next);validateWorkspace(next);return api<ActionResult>('/api/workspace',{method:'PUT',body:{state:next,revision:rev.current,action}});});}
 async function authenticate(mode:'signup'|'login',fields:{name?:string;email:string;password:string}){
  if(pending.current)return false;pending.current=true;setBusy(true);notify('');sessionEpoch.current++;
  try{acceptSession(await api<Session>(`/api/auth/${mode}`,{method:'POST',body:fields}));setStatus('ready');notify('Signed in. Workspace loaded from the server.');return true;}
  catch(error){await handleError(error);return false;}finally{pending.current=false;setBusy(false);}
 }
 async function logout(){if(pending.current)return;pending.current=true;setBusy(true);sessionEpoch.current++;try{await api('/api/auth/logout',{method:'POST',body:{}});clearSession();setStatus('ready');location.hash='auth';notify('Signed out.');}catch(error){await handleError(error);}finally{pending.current=false;setBusy(false);}}
 async function reset(){if(!confirm('Replace the server workspace with sample data? Export a backup first if needed.'))return false;return !!await perform(()=>api('/api/workspace/reset',{method:'POST',body:{mode:'sample',revision:rev.current}}));}
 async function clear(){if(!confirm('Clear this account workspace? Export a backup first if needed.'))return false;return !!await perform(()=>api('/api/workspace/reset',{method:'POST',body:{mode:'empty',revision:rev.current}}));}
 async function restore(data:unknown){try{const next=validateWorkspace(data);if(!confirm('Replace the server workspace with this backup?'))return false;return !!await perform(()=>api('/api/workspace/restore',{method:'POST',body:{state:next,revision:rev.current}}));}catch(error){notify(error instanceof Error?error.message:'Invalid backup.');return false;}}
 async function executeTool(tool:ToolId,inputs:Record<string,string>,evaluationId:string){const result=await perform(()=>api('/api/tools/run',{method:'POST',body:{tool,inputs,evaluationId,revision:rev.current}}));return result?.artifact||null;}
 async function importCsv(kind:'workloads'|'measurements'|'questionnaire',csv:string,evaluationId:string){return perform(()=>api('/api/import',{method:'POST',body:{kind,csv,evaluationId,revision:rev.current}}));}
 async function exportData(kind:string,id?:string){try{await downloadFromApi(kind,id);notify('Export downloaded from the server.');}catch(error){await handleError(error);}}
 async function migrateLocal(){try{const old=readStoredWorkspace(localStorage);if(!old.evaluations.length){notify('No previous browser evaluations were found.');return false;}return await restore(old);}catch(error){notify(error instanceof Error?error.message:'Unable to read browser data.');return false;}}
 return <Context.Provider value={{state,insights,role,setRole,notice,notify,update,reset,clear,restore,user,busy,status,revision,refresh,authenticate,logout,executeTool,importCsv,exportData,migrateLocal}}>{children}</Context.Provider>;
}
export function useWorkspace(){const value=useContext(Context);if(!value)throw new Error('Workspace provider required');return value;}
