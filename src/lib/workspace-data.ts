import {seed,blockers,readiness,type State} from './insomnia.ts';
import {knowledge} from './knowledge.ts';
export function emptyWorkspace():State{return {version:1,evaluations:[],tests:[],workloads:[],events:[],artifacts:[],measurements:[],sample:false,settings:{workspace:'My IOMETE workspace',reminderDays:7}};}
export const workspaceStorageKey='insomnia-workspace-v1';
// Compatibility only: retain access to data saved before the product rename.
const legacyStorageKey='proofplan-workspace-v1';
export function readStoredWorkspace(storage:Pick<Storage,'getItem'|'setItem'>):State{
 const current=storage.getItem(workspaceStorageKey);
 if(current)return validateWorkspace(JSON.parse(current));
 const legacy=storage.getItem(legacyStorageKey);
 if(!legacy)return emptyWorkspace();
 const state=validateWorkspace(JSON.parse(legacy));
 if(state.settings.workspace==='ProofPlan demo workspace')state.settings.workspace='Insomnia demo workspace';
 try{storage.setItem(workspaceStorageKey,JSON.stringify(state));}catch{/* Keep recovered data usable if storage is full. */}
 return state;
}
const text=(v:unknown)=>typeof v==='string'&&v.length<=100000;
const num=(v:unknown)=>typeof v==='number'&&Number.isFinite(v)&&v>=0;
const validDate=(v:unknown)=>text(v)&&Number.isFinite(Date.parse(v as string))&&(!/^\d{4}-\d{2}-\d{2}$/.test(v as string)||new Date(v as string).toISOString().slice(0,10)===v);
const unique=(rows:{id:string}[])=>new Set(rows.map(r=>r.id)).size===rows.length;
export function validateWorkspace(value:unknown):State{
 if(!value||typeof value!=='object')throw new Error('Invalid workspace file.');const s=value as State;
 const arrays=[s.evaluations,s.tests,s.workloads,s.events,s.artifacts||[],s.measurements||[]];
 if(s.version!==1||!arrays.every(a=>Array.isArray(a)&&a.length<=20000&&a.every(r=>r&&text(r.id)&&r.id.trim())&&unique(a)))throw new Error('Invalid workspace version, rows, or duplicate IDs.');
 if(!s.settings||(!text(s.settings.workspace)||!s.settings.workspace.trim())||!Number.isInteger(s.settings.reminderDays)||s.settings.reminderDays<1||s.settings.reminderDays>90)throw new Error('Invalid workspace settings.');
 for(const e of s.evaluations)if(![e.id,e.company,e.name,e.platform,e.owner,e.requirements].every(v=>text(v)&&v.trim())||!validDate(e.deadline)||!validDate(e.created)||!['Draft','Planning','Ready for evaluation'].includes(e.status))throw new Error('Complete evaluation fields and valid dates.');
 const ids=new Set(s.evaluations.map(e=>e.id));
 const reportNames=new Set<string>();
 for(const w of s.workloads){if(!ids.has(w.evaluationId)||!text(w.report)||!w.report.trim()||!num(w.baseline)||!num(w.target)||w.target<=0||typeof w.critical!=='boolean')throw new Error('Invalid workload.');const key=JSON.stringify([w.evaluationId,w.report.trim().toLowerCase()]);if(reportNames.has(key))throw new Error('Report names must be unique within an evaluation. Rename the duplicate report and retry.');reportNames.add(key);}
 for(const t of s.tests)if(!ids.has(t.evaluationId)||![t.name,t.criterion,t.owner,t.result].every(text)||!['Proposed','Passed','Failed'].includes(t.status)||(t.status!=='Proposed'&&!t.result.trim()))throw new Error('Invalid test or missing recorded result.');
 for(const e of s.events)if(!text(e.action)||!validDate(e.date))throw new Error('Invalid activity event.');
 for(const a of s.artifacts||[])if(!ids.has(a.evaluationId)||!['explainer','fit','deployment','business','call','demo','security','benchmark','migration'].includes(a.tool)||!validDate(a.created)||!a.inputs||!Object.values(a.inputs).every(text)||!a.result||![a.result.title,a.result.summary].every(text)||!Array.isArray(a.result.sections)||a.result.sections.length>1000||!a.result.sections.every(c=>c&&text(c.heading)&&Array.isArray(c.lines)&&c.lines.length<=2000&&c.lines.every(text))||!Array.isArray(a.result.sourceIds)||!a.result.sourceIds.every(id=>knowledge.some(f=>f.id===id)))throw new Error('Invalid saved tool report.');
 for(const m of s.measurements||[])if(!ids.has(m.evaluationId)||!s.workloads.some(w=>w.id===m.workloadId&&w.evaluationId===m.evaluationId)||!num(m.seconds)||!Number.isInteger(m.concurrency)||m.concurrency<1||typeof m.correct!=='boolean'||!validDate(m.date))throw new Error('Invalid benchmark measurement.');
 return {version:1,evaluations:s.evaluations,workloads:s.workloads,tests:s.tests,events:s.events,settings:s.settings,artifacts:s.artifacts||[],measurements:s.measurements||[],sample:typeof s.sample==='boolean'?s.sample:true};
}
export function planningActivity(state:State,weeks=8,now=new Date()){
 const today=new Date(now);today.setHours(0,0,0,0);
 return Array.from({length:weeks},(_,i)=>{const start=new Date(today);start.setDate(today.getDate()-(weeks-1-i)*7-6);const end=new Date(start);end.setDate(start.getDate()+7);const inRange=(date:string)=>{const t=Date.parse(date);return t>=+start&&t<+end;};return {week:start.toLocaleDateString('en-GB',{day:'numeric',month:'short'}),opened:state.events.filter(e=>inRange(e.date)).length,completed:state.artifacts.filter(a=>inRange(a.created)).length};});
}
export function dashboardInsights(state:State){return {alerts:blockers(state),activity:planningActivity(state),readiness:Object.fromEntries(state.evaluations.map(e=>[e.id,readiness(state,e.id)])),counts:{evaluations:state.evaluations.length,proposed:state.tests.filter(t=>t.status==='Proposed').length,unassigned:state.tests.filter(t=>!t.owner||t.owner==='Unassigned').length}};}
export type DashboardInsights=ReturnType<typeof dashboardInsights>;
export function createEvaluation(state:State,fields:{company:string;name:string;platform:string;owner:string;deadline:string;requirements:string},id:string){
 if(![fields.company,fields.name,fields.platform,fields.owner,fields.requirements].every(v=>text(v)&&v.trim())||!validDate(fields.deadline))throw new Error('Complete all evaluation fields and a valid target date.');
 if(state.evaluations.some(e=>e.id===id))throw new Error('Duplicate evaluation ID.');
 state.evaluations.push({...fields,id,status:'Planning',created:new Date().toISOString().slice(0,10)});
 state.tests.push(...seed().tests.slice(0,3).map((t,index)=>({...t,id:`${id}-${index}`,evaluationId:id,owner:index===2?'Unassigned':fields.owner})));
}
