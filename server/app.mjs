import {createServer} from 'node:http';
import {DatabaseSync} from 'node:sqlite';
import {randomBytes,createHash,scrypt,timingSafeEqual,randomUUID} from 'node:crypto';
import {promisify} from 'node:util';
import {mkdirSync} from 'node:fs';
import {dirname} from 'node:path';
import {emptyWorkspace,validateWorkspace,dashboardInsights} from '../src/lib/workspace-data.ts';
import {planMarkdown,importWorkloads,parseCsv,seed} from '../src/lib/insomnia.ts';
import {runTool,toolDefinitions,importMeasurements,artifactMarkdown} from '../src/lib/workbench.ts';
import {serviceConfig} from './config.mjs';
import {createMailer} from './mail.mjs';
import {createIntegrations} from './integrations.mjs';
import {createIdentity} from './identity.mjs';
import {createCollaboration} from './collaboration.mjs';
import {createServiceRoutes} from './service-routes.mjs';

const derive=promisify(scrypt),hash=value=>createHash('sha256').update(value).digest('hex');
export class HttpError extends Error{constructor(status,message){super(message);this.status=status;}}
const fail=(status,message)=>{throw new HttpError(status,message);};
const object=value=>value&&typeof value==='object'&&!Array.isArray(value);
const limited=(value,label,max=1000)=>{if(typeof value!=='string'||!value.trim()||value.length>max)fail(400,`${label} is required (maximum ${max} characters).`);return value.trim();};
const validEmail=email=>typeof email==='string'&&email.length<=254&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
async function passwordHash(password,salt=randomBytes(16).toString('hex')){const key=await derive(password,salt,64);return `${salt}:${key.toString('hex')}`;}
async function verifyPassword(password,encoded){const[salt,expected]=encoded.split(':');const actual=await derive(password,salt,64);return timingSafeEqual(actual,Buffer.from(expected,'hex'));}
async function readJson(req){if(!req.headers['content-type']?.startsWith('application/json'))fail(415,'Use application/json.');if(Number(req.headers['content-length'])>5_000_000){req.resume();fail(413,'Request is too large (maximum 5 MB).');}let size=0;const chunks=[];for await(const chunk of req.iterator({destroyOnReturn:false})){size+=chunk.length;if(size>5_000_000){req.resume();fail(413,'Request is too large (maximum 5 MB).');}chunks.push(chunk);}try{const value=JSON.parse(Buffer.concat(chunks).toString('utf8'));if(!object(value))fail(400,'Expected a JSON object.');return value;}catch(error){if(error instanceof HttpError)throw error;fail(400,'Invalid JSON body.');}}

export function createApp({dbPath=':memory:',secureCookie=false,frontend,allowedOrigin,config=serviceConfig()}={}){
 if(dbPath!==':memory:')mkdirSync(dirname(dbPath),{recursive:true});
 const db=new DatabaseSync(dbPath);db.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;
 CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY,email TEXT NOT NULL UNIQUE,name TEXT NOT NULL,password_hash TEXT NOT NULL,created_at TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS sessions(token_hash TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,csrf TEXT NOT NULL,expires_at INTEGER NOT NULL);
 CREATE TABLE IF NOT EXISTS workspaces(user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,state_json TEXT NOT NULL,revision INTEGER NOT NULL DEFAULT 0);
 CREATE TABLE IF NOT EXISTS audit(id TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id),action TEXT NOT NULL,created_at TEXT NOT NULL,revision INTEGER NOT NULL);
 CREATE INDEX IF NOT EXISTS audit_user ON audit(user_id,created_at);`);
 const attempts=new Map();let dummyPassword;
 const cookie=(token,clear=false)=>`insomnia_session=${clear?'':token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${clear?0:604800}${secureCookie?'; Secure':''}`;
 const json=(res,status,data)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(data));};
 function getSession(req){const token=req.headers.cookie?.split(';').map(s=>s.trim()).find(s=>s.startsWith('insomnia_session='))?.slice('insomnia_session='.length);if(!token||!/^[a-f0-9]{64}$/.test(token))return null;const session=db.prepare('SELECT s.token_hash,s.csrf,s.expires_at,s.workspace_id,u.id,u.email,u.name FROM sessions s JOIN users u ON s.user_id=u.id WHERE s.token_hash=? AND s.expires_at>?').get(hash(token),Date.now());if(!session)return null;session.workspace_id=session.workspace_id||session.id;session.access=collaboration.role(session.id,session.workspace_id);if(!session.access){session.workspace_id=session.id;session.access='owner';}return session;}
 function account(session){return {id:session.id,email:session.email,name:session.name,workspaceId:session.workspace_id||session.id,access:session.access||'owner'};}
 function workspace(userId){const row=db.prepare('SELECT state_json,revision FROM workspaces WHERE user_id=?').get(userId);const state=validateWorkspace(JSON.parse(row.state_json));return {state,revision:row.revision,insights:dashboardInsights(state)};}
 function requireRevision(value,current){if(!Number.isInteger(value)||value!==current)fail(409,'The workspace changed in another session. Refresh and retry your change.');}
 function save(userId,next,revision,action,{imported=false}={}){
  const current=workspace(userId);requireRevision(revision,current.revision);const valid=validateWorkspace(next);const event={id:randomUUID(),action:limited(action,'Action',300),date:new Date().toISOString()};
  valid.events=[event,...(imported?valid.events.map(e=>({...e,action:`Imported history: ${e.action}`.slice(0,100000)})):current.state.events)].slice(0,2000);
  if(Buffer.byteLength(JSON.stringify(valid))>4_000_000)fail(413,'Workspace exceeds 4 MB. Export an archive and remove older tool reports or measurements before saving.');
  db.exec('BEGIN IMMEDIATE');try{const result=db.prepare('UPDATE workspaces SET state_json=?,revision=revision+1 WHERE user_id=? AND revision=?').run(JSON.stringify(valid),userId,revision);if(result.changes!==1)fail(409,'Workspace revision conflict. Refresh and retry.');db.prepare('INSERT INTO audit VALUES(?,?,?,?,?)').run(event.id,userId,event.action,event.date,revision+1);db.exec('COMMIT');}catch(error){db.exec('ROLLBACK');throw error;}
  return {state:valid,revision:revision+1,insights:dashboardInsights(valid)};
 }
 function authLimit(req){const key=req.socket.remoteAddress||'local',now=Date.now();for(const[k,v]of attempts)if(v.until<now)attempts.delete(k);const entry=attempts.get(key)||{count:0,until:now+900000};if(++entry.count>20)fail(429,'Too many authentication attempts. Try again in 15 minutes.');attempts.set(key,entry);}
 function startSession(res,userId){const token=randomBytes(32).toString('hex'),csrf=randomBytes(24).toString('hex');db.prepare('DELETE FROM sessions WHERE expires_at<=?').run(Date.now());db.prepare('INSERT INTO sessions(token_hash,user_id,csrf,expires_at) VALUES(?,?,?,?)').run(hash(token),userId,csrf,Date.now()+604800000);const existing=res.getHeader('Set-Cookie');res.setHeader('Set-Cookie',existing?[...(Array.isArray(existing)?existing:[existing]),cookie(token)]:cookie(token));return csrf;}
 function createUser({id,email,name,encoded}){db.exec('BEGIN IMMEDIATE');try{db.prepare('INSERT INTO users VALUES(?,?,?,?,?)').run(id,email,name,encoded,new Date().toISOString());const initial=emptyWorkspace();initial.settings.workspace=`${name}'s IOMETE workspace`;db.prepare('INSERT INTO workspaces VALUES(?,?,0)').run(id,JSON.stringify(initial));db.exec('COMMIT');return {id,email,name};}catch(error){db.exec('ROLLBACK');if(String(error).includes('UNIQUE'))fail(409,'Unable to create an account with these details. Try signing in.');throw error;}}
 const mailer=createMailer(config),integrations=createIntegrations(config);
 const context={db,config,dbPath,secureCookie,mailer,integrations,fail,json,readJson,authLimit,passwordHash,startSession,account,workspace,createUser,limited};
 const collaboration=createCollaboration(context);context.collaboration=collaboration;
 const identity=createIdentity(context),services=createServiceRoutes(context);
 const server=createServer(async(req,res)=>{
  const url=new URL(req.url||'/','http://localhost');
  if(!url.pathname.startsWith('/api/')){if(frontend)return frontend(req,res);return json(res,404,{error:'Not found.'});}
  res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');
  try{
   const method=req.method||'GET',mutation=!['GET','HEAD','OPTIONS'].includes(method);
   if(mutation){const expected=allowedOrigin||`http://${req.headers.host}`;if(req.headers.origin&&req.headers.origin!==expected)fail(403,'Cross-origin requests are not allowed.');if(req.headers['x-insomnia-request']!=='1')fail(403,'Missing application request header.');}
   if(method==='GET'&&url.pathname==='/api/health')return json(res,200,{status:'ok',storage:'sqlite',tools:toolDefinitions.map(t=>t.id),clusterExecution:!!config.iomete.url,companyResearch:!!config.research.key,aiProvider:!!config.llm.model});
   const session=getSession(req);
   if(await identity(req,res,url,session))return;
   if(method==='GET'&&url.pathname==='/api/session')return json(res,200,session?{user:account(session),csrf:session.csrf,...workspace(session.workspace_id)}:{user:null});
   if(method==='POST'&&['/api/auth/signup','/api/auth/login'].includes(url.pathname)){
    authLimit(req);const body=await readJson(req);const normalizedEmail=typeof body.email==='string'?body.email.trim().toLowerCase():body.email;if(!validEmail(normalizedEmail)||typeof body.password!=='string'||body.password.length<12||body.password.length>128)fail(400,'Use a valid email and a password of 12–128 characters.');const email=normalizedEmail;let user;
    if(url.pathname.endsWith('signup')){
     const name=limited(body.name,'Name',100),id=randomUUID(),encoded=await passwordHash(body.password);user=createUser({id,email,name,encoded});
    }else{user=db.prepare('SELECT * FROM users WHERE email=?').get(email);dummyPassword||=await passwordHash('not-a-real-account-password');const valid=await verifyPassword(body.password,user?.password_hash||dummyPassword);if(!user||!valid)fail(401,'Invalid email or password.');}
    const csrf=startSession(res,user.id);return json(res,200,{user:account(user),csrf,...workspace(user.id)});
   }
   if(!session)fail(401,'Sign in to access your workspace.');
   if(url.pathname!=='/api/session'&&req.headers['x-workspace-id']&&req.headers['x-workspace-id']!==session.workspace_id)fail(409,'Your active workspace changed. Refresh before making another change.');
   if(mutation&&req.headers['x-csrf-token']!==session.csrf)fail(403,'Session verification failed. Refresh and retry.');
   if(await collaboration.route(req,res,url,session))return;
   if(await services(req,res,url,session))return;
   if(mutation&&session.access==='viewer'&&url.pathname!=='/api/auth/logout')fail(403,'Viewer access is read-only. Ask the workspace owner for editor access.');
   if(method==='POST'&&url.pathname==='/api/auth/logout'){db.prepare('DELETE FROM sessions WHERE token_hash=?').run(session.token_hash);res.setHeader('Set-Cookie',cookie('',true));return json(res,200,{ok:true});}
   if(method==='GET'&&url.pathname==='/api/workspace')return json(res,200,workspace(session.workspace_id));
   if(method==='GET'&&url.pathname==='/api/insights')return json(res,200,workspace(session.workspace_id).insights);
   if(method==='GET'&&url.pathname==='/api/audit')return json(res,200,{events:db.prepare('SELECT id,action,created_at AS date,revision FROM audit WHERE user_id=? ORDER BY revision DESC LIMIT 2000').all(session.workspace_id)});
   if(method==='PUT'&&url.pathname==='/api/workspace'){
    const body=await readJson(req),current=workspace(session.workspace_id);requireRevision(body.revision,current.revision);const next=validateWorkspace(body.state);
    // Tool outputs are immutable server products. Generic edits may delete them,
    // but cannot create or rewrite a result supplied by the client.
    for(const report of next.artifacts){const old=current.state.artifacts.find(a=>a.id===report.id);if(!old||JSON.stringify(old)!==JSON.stringify(report))fail(400,'Tool reports must be generated through the server tool endpoint.');}
    return json(res,200,save(session.workspace_id,next,body.revision,body.action));
   }
   if(method==='POST'&&url.pathname==='/api/tools/run'){
    const body=await readJson(req),current=workspace(session.workspace_id);requireRevision(body.revision,current.revision);const definition=toolDefinitions.find(t=>t.id===body.tool);if(!definition||!object(body.inputs)||Object.keys(body.inputs).length>30||!Object.values(body.inputs).every(v=>typeof v==='string'&&v.length<=100000))fail(400,'Invalid tool or inputs.');
    for(const f of definition.fields){const value=body.inputs[f.key];if(f.required&&!value?.trim())fail(400,`${f.label} is required.`);if(f.kind==='select'&&!f.options.includes(value))fail(400,`Choose a valid ${f.label}.`);if(f.kind==='checkbox'&&value!==undefined&&!['true','false'].includes(value))fail(400,'Invalid checkbox input.');}
    const result=runTool(body.tool,body.inputs,current.state,body.evaluationId),artifact={id:randomUUID(),evaluationId:body.evaluationId,tool:body.tool,inputs:body.inputs,result,created:new Date().toISOString()};current.state.artifacts.unshift(artifact);
    return json(res,200,{...save(session.workspace_id,current.state,body.revision,`Generated ${definition.name} for ${body.evaluationId}.`),artifact});
   }
   if(method==='POST'&&url.pathname==='/api/import'){
    const body=await readJson(req),current=workspace(session.workspace_id);requireRevision(body.revision,current.revision);if(typeof body.csv!=='string'||body.csv.length>2_000_000)fail(400,'Use a CSV under 2 MB.');if(!current.state.evaluations.some(e=>e.id===body.evaluationId))fail(404,'Evaluation not found.');let count;
    if(body.kind==='workloads'){const rows=importWorkloads(body.csv,body.evaluationId);current.state.workloads.push(...rows);count=rows.length;}else if(body.kind==='measurements'){const rows=importMeasurements(body.csv,current.state,body.evaluationId);current.state.measurements.push(...rows);count=rows.length;}else if(body.kind==='questionnaire'){const[header,...rows]=parseCsv(body.csv);if(header?.length!==1||header[0].trim().toLowerCase()!=='question'||!rows.length||rows.length>500||rows.some(r=>r.length!==1))fail(400,'Use one question column and 1–500 rows. Quote fields containing commas.');return json(res,200,{questions:rows.map(r=>r[0]).join('\n')});}else fail(400,'Unknown import type.');
    return json(res,200,{...save(session.workspace_id,current.state,body.revision,`Imported ${count} ${body.kind} for ${body.evaluationId}.`),count});
   }
   if(method==='POST'&&url.pathname==='/api/workspace/restore'){
    const body=await readJson(req),current=workspace(session.workspace_id);requireRevision(body.revision,current.revision);const next=validateWorkspace(body.state);
    // Imported reports are explicitly marked as unverified historical snapshots.
    next.artifacts=next.artifacts.map(a=>({...a,result:{...a.result,summary:`Imported snapshot (not generated by this server): ${a.result.summary}`}}));
    return json(res,200,save(session.workspace_id,next,body.revision,'Restored a workspace backup.',{imported:true}));
   }
   if(method==='POST'&&url.pathname==='/api/workspace/reset'){
    const body=await readJson(req);if(!['empty','sample'].includes(body.mode))fail(400,'Choose empty or sample reset.');return json(res,200,save(session.workspace_id,body.mode==='sample'?seed():emptyWorkspace(),body.revision,body.mode==='sample'?'Loaded sample workspace.':'Started an empty workspace.'));
   }
   if(method==='GET'&&url.pathname==='/api/export'){
    const {state}=workspace(session.workspace_id),kind=url.searchParams.get('kind'),id=url.searchParams.get('id');let content,type='text/markdown; charset=utf-8',name='insomnia.md';
    if(kind==='backup'){content=JSON.stringify(state,null,2);type='application/json; charset=utf-8';name='insomnia-workspace.json';}
    else if(kind==='plan'){if(!state.evaluations.some(e=>e.id===id))fail(404,'Evaluation not found.');content=planMarkdown(state,id);name=`insomnia-evaluation.md`;}
    else if(kind==='plans'){content=state.evaluations.map(e=>planMarkdown(state,e.id)).join('\n\n---\n\n');name='insomnia-evaluations.md';}
    else if(kind==='report'){const report=state.artifacts.find(a=>a.id===id);if(!report)fail(404,'Report not found.');content=artifactMarkdown(report);name='insomnia-tool-report.md';}
    else if(kind==='reports'){content=state.artifacts.map(artifactMarkdown).join('\n\n---\n\n');name='insomnia-tool-reports.md';}else fail(400,'Unknown export type.');
    res.writeHead(200,{'Content-Type':type,'Content-Disposition':`attachment; filename="${name}"`,'Cache-Control':'no-store'});return res.end(content);
   }
   fail(404,'API route not found.');
  }catch(error){const status=error instanceof HttpError?error.status:400;json(res,status,{error:status>=500?'The server could not complete this request.':error.message||'Invalid request.'});}
 });
 server.requestTimeout=30000;server.headersTimeout=15000;
 return {server,db,close:async()=>{server.closeAllConnections();await new Promise(resolve=>server.close(resolve));db.close();}};
}
