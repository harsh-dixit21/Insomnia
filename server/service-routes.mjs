import {randomUUID} from 'node:crypto';
export function createServiceRoutes(ctx){
 const{db,config,integrations,mailer,json,readJson,limited,fail,workspace}=ctx;
 db.exec(`CREATE TABLE IF NOT EXISTS integration_runs(id TEXT PRIMARY KEY,owner_id TEXT NOT NULL REFERENCES users(id),actor_id TEXT NOT NULL REFERENCES users(id),kind TEXT NOT NULL,input_json TEXT NOT NULL,result_json TEXT NOT NULL,created_at TEXT NOT NULL);`);
 const active=new Set();const calls=new Map();
 return async(req,res,url,session)=>{
  const path=url.pathname,owner=session.workspace_id;
  if(path==='/api/integrations'&&req.method==='GET'){json(res,200,{...integrations.status(),mail:{mode:mailer.mode},runs:db.prepare('SELECT id,kind,input_json,result_json,created_at FROM integration_runs WHERE owner_id=? ORDER BY created_at DESC LIMIT 20').all(owner).map(r=>({id:r.id,kind:r.kind,input:JSON.parse(r.input_json),result:JSON.parse(r.result_json),created:r.created_at}))});return true;}
  if(path==='/api/operations'&&req.method==='GET'){
   if(session.access!=='owner')fail(403,'Only the workspace owner can view operational readiness.');
   const integrity=db.prepare('PRAGMA quick_check').get().quick_check==='ok';
   const checks=[{name:'Database integrity',ok:integrity},{name:'HTTPS public origin',ok:config.origin.startsWith('https:')},{name:'Secure session cookies',ok:ctx.secureCookie},{name:'Persistent database',ok:ctx.dbPath!==':memory:'},{name:'External mail transport',ok:mailer.mode==='smtp'},{name:'Local development services disabled',ok:!config.local}];
   json(res,200,{checks,ready:checks.every(c=>c.ok),note:'Runtime checks do not prove public DNS, TLS termination, backups, restore drills or load capacity. Run the deployment smoke check against the deployed URL.'});return true;
  }
  const kind=path.split('/').at(-1);
  if(req.method!=='POST'||!['sql','research','assistant'].includes(kind)||!path.startsWith('/api/integrations/'))return false;
  if(session.access==='viewer')fail(403,'Viewer access is read-only. Ask an editor to run an integration.');
  if(active.has(owner))fail(409,'An integration is already running in this workspace. Wait for it to finish.');
  const now=Date.now();for(const[key,value]of calls)if(now-value.start>60000)calls.delete(key);const rate=calls.get(session.id)||{start:now,count:0};if(++rate.count>10)fail(429,'Limit of ten integration requests per minute reached. Retry shortly.');calls.set(session.id,rate);
  const body=await readJson(req);let result,input;active.add(owner);
  try{
   if(kind==='sql'){input={sql:limited(body.sql,'SQL',20000)};result=await integrations.query(input.sql);}
   if(kind==='research'){input={company:limited(body.company,'Company',150)};result=await integrations.research(input.company);}
   if(kind==='assistant'){input={question:limited(body.question,'Question',4000),evaluationId:typeof body.evaluationId==='string'?body.evaluationId:''};const current=workspace(owner);const evaluation=current.state.evaluations.find(e=>e.id===input.evaluationId);if(input.evaluationId&&!evaluation)fail(404,'Evaluation not found.');result=await integrations.assistant(input.question,evaluation?{evaluation,tests:current.state.tests.filter(t=>t.evaluationId===evaluation.id)}:{});}
   // Recheck membership after asynchronous provider work, so revocation takes effect immediately.
   const currentRole=ctx.collaboration.role(session.id,owner);if(!currentRole||currentRole==='viewer')fail(403,'Workspace edit access was revoked.');
   const run={id:randomUUID(),kind,input,result,created:new Date().toISOString()};db.prepare('INSERT INTO integration_runs VALUES(?,?,?,?,?,?,?)').run(run.id,owner,session.id,kind,JSON.stringify(input),JSON.stringify(result),run.created);
   db.prepare('DELETE FROM integration_runs WHERE owner_id=? AND id NOT IN (SELECT id FROM integration_runs WHERE owner_id=? ORDER BY created_at DESC LIMIT 100)').run(owner,owner);
   json(res,200,{run});return true;
  }finally{active.delete(owner);}
 };
}
