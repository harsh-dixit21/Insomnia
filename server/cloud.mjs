import {neon} from '@neondatabase/serverless';
import {randomBytes,randomUUID,createHash,scrypt,timingSafeEqual} from 'node:crypto';
import {promisify} from 'node:util';
import {emptyWorkspace,validateWorkspace,dashboardInsights} from '../src/lib/workspace-data.ts';
const derive=promisify(scrypt), hash=value=>createHash('sha256').update(value).digest('hex');
let schema;
export default async function cloud(req,res){
 const json=(status,data)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(data));};
 const fail=(status,message)=>{throw Object.assign(new Error(message),{status});};
 try{
  const sql=neon(process.env.DATABASE_URL);
  schema??=sql.transaction(`CREATE TABLE IF NOT EXISTS cloud_users(id text PRIMARY KEY,email text UNIQUE NOT NULL,name text NOT NULL,password_hash text NOT NULL);
CREATE TABLE IF NOT EXISTS cloud_sessions(token_hash text PRIMARY KEY,user_id text REFERENCES cloud_users(id),csrf text NOT NULL,expires_at bigint NOT NULL);
CREATE TABLE IF NOT EXISTS cloud_workspaces(user_id text PRIMARY KEY REFERENCES cloud_users(id),state_json text NOT NULL,revision integer NOT NULL DEFAULT 0);
CREATE TABLE IF NOT EXISTS cloud_attempts(key text PRIMARY KEY,count integer NOT NULL,until_at bigint NOT NULL);`.split(';').filter(q=>q.trim()).map(q=>sql.query(q))).catch(e=>{schema=undefined;throw e;});
  await schema;
  const url=new URL(req.url,'https://insomnia-iomete.vercel.app');
  const path='/api/'+(url.searchParams.get('__path')||url.pathname.replace(/^\/api\//,''));
  const mutation=!['GET','HEAD','OPTIONS'].includes(req.method);
  if(mutation){
   const origin=req.headers.origin;
   const expected=process.env.INSOMNIA_ORIGIN||'https://insomnia-iomete.vercel.app';
   if(origin&&origin!==expected)fail(403,'Cross-origin requests are not allowed.');
   if(req.headers['x-insomnia-request']!=='1')fail(403,'Missing application request header.');
  }
  let body={};
  if(mutation){
   if(!req.headers['content-type']?.startsWith('application/json'))fail(415,'Use application/json.');
   if(req.body!==undefined)body=typeof req.body==='string'?JSON.parse(req.body):Buffer.isBuffer(req.body)?JSON.parse(req.body.toString()):req.body;
   else{let raw='';for await(const chunk of req){raw+=chunk;if(raw.length>5000000)fail(413,'Request too large.');}body=JSON.parse(raw||'{}');}
   if(!body||typeof body!=='object'||Array.isArray(body))fail(400,'Invalid JSON body.');
  }
  const token=req.headers.cookie?.split(';').map(v=>v.trim()).find(v=>v.startsWith('insomnia_session='))?.split('=')[1];
  let session;
  if(token&&/^[a-f0-9]{64}$/.test(token))session=(await sql`SELECT u.*,s.csrf,s.token_hash FROM cloud_sessions s JOIN cloud_users u ON u.id=s.user_id WHERE s.token_hash=${hash(token)} AND s.expires_at>${Date.now()}`)[0];
  const account=u=>({id:u.id,name:u.name,email:u.email,workspaceId:u.id,access:'owner'});
  const workspace=async id=>{const [row]=await sql`SELECT * FROM cloud_workspaces WHERE user_id=${id}`;const state=validateWorkspace(JSON.parse(row.state_json));return {state,revision:row.revision,insights:dashboardInsights(state)};};
  const cookie=(value,age=604800)=>res.setHeader('Set-Cookie',`insomnia_session=${value}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${age}`);
  if(path==='/api/health')return json(200,{status:'ok',storage:'postgres',authentication:true});
  if(path==='/api/session'&&req.method==='GET')return json(200,session?{user:account(session),csrf:session.csrf,...await workspace(session.id)}:{user:null});
  if(req.method==='POST'&&['/api/auth/signup','/api/auth/login'].includes(path)){
   const email=typeof body.email==='string'?body.email.trim().toLowerCase():'';
   const password=body.password;
   if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||email.length>254||typeof password!=='string'||password.length<12||password.length>128)fail(400,'Use a valid email and a password of 12–128 characters.');
   const ip=String(req.headers['x-vercel-forwarded-for']||req.headers['x-forwarded-for']||req.socket?.remoteAddress||'unknown').split(',')[0];
   const key=hash(ip+':'+email), now=Date.now();
   const [limit]=await sql`INSERT INTO cloud_attempts(key,count,until_at) VALUES(${key},1,${now+900000}) ON CONFLICT(key) DO UPDATE SET count=CASE WHEN cloud_attempts.until_at<${now} THEN 1 ELSE cloud_attempts.count+1 END,until_at=CASE WHEN cloud_attempts.until_at<${now} THEN ${now+900000} ELSE cloud_attempts.until_at END RETURNING count`;
   if(limit.count>20)fail(429,'Too many attempts. Try again in 15 minutes.');
   let user;
   if(path.endsWith('signup')){
    const name=typeof body.name==='string'?body.name.trim():'';if(!name||name.length>100)fail(400,'Enter a name of up to 100 characters.');
    const salt=randomBytes(16).toString('hex'), encoded=salt+':'+(await derive(password,salt,64)).toString('hex');
    user={id:randomUUID(),email,name};const state=emptyWorkspace();state.settings.workspace=`${name}'s IOMETE workspace`;
    try{await sql.transaction([sql`INSERT INTO cloud_users VALUES(${user.id},${email},${name},${encoded})`,sql`INSERT INTO cloud_workspaces VALUES(${user.id},${JSON.stringify(state)},0)`]);}catch(e){if(e.code==='23505')fail(409,'This account already exists. Please sign in.');throw e;}
   }else{
    [user]=await sql`SELECT * FROM cloud_users WHERE email=${email}`;
    const [salt,expected]=(user?.password_hash||'missing:'+ '0'.repeat(128)).split(':');
    const actual=await derive(password,salt,64);
    if(!timingSafeEqual(actual,Buffer.from(expected,'hex'))||!user)fail(401,'Invalid email or password.');
   }
   const fresh=randomBytes(32).toString('hex'), csrf=randomBytes(24).toString('hex');
   await sql`INSERT INTO cloud_sessions VALUES(${hash(fresh)},${user.id},${csrf},${Date.now()+604800000})`;
   cookie(fresh);return json(200,{user:account(user),csrf,...await workspace(user.id)});
  }
  if(!session)fail(401,'Sign in to access your workspace.');
  if(req.headers['x-workspace-id']&&req.headers['x-workspace-id']!==session.id)fail(409,'Your workspace changed. Refresh and retry.');
  if(mutation&&req.headers['x-csrf-token']!==session.csrf)fail(403,'Session verification failed. Refresh and retry.');
  if(path==='/api/auth/logout'&&req.method==='POST'){await sql`DELETE FROM cloud_sessions WHERE token_hash=${session.token_hash}`;cookie('',0);return json(200,{ok:true});}
  if(path==='/api/workspace'&&req.method==='GET')return json(200,await workspace(session.id));
  if(path==='/api/insights'&&req.method==='GET')return json(200,(await workspace(session.id)).insights);
  if(path==='/api/audit'&&req.method==='GET')return json(200,{events:(await workspace(session.id)).state.events});
  if(path==='/api/workspace'&&req.method==='PUT'){
   const current=await workspace(session.id);if(body.revision!==current.revision)fail(409,'The workspace changed. Refresh and retry.');
   const state=validateWorkspace(body.state);
   for(const report of state.artifacts){const old=current.state.artifacts.find(a=>a.id===report.id);if(!old||JSON.stringify(old)!==JSON.stringify(report))fail(400,'Tool reports must be generated by the server.');}
   const action=typeof body.action==='string'?body.action.trim().slice(0,300):'Updated workspace';
   state.events=[{id:randomUUID(),action,date:new Date().toISOString()},...current.state.events].slice(0,2000);
   const encoded=JSON.stringify(state);if(Buffer.byteLength(encoded)>4000000)fail(413,'Workspace exceeds 4 MB.');
   const rows=await sql`UPDATE cloud_workspaces SET state_json=${encoded},revision=revision+1 WHERE user_id=${session.id} AND revision=${body.revision} RETURNING revision`;
   if(!rows.length)fail(409,'The workspace changed. Refresh and retry.');return json(200,{state,revision:rows[0].revision,insights:dashboardInsights(state)});
  }
  fail(501,'This feature has not yet been migrated to the Vercel backend.');
 }catch(error){const status=error.status||500;if(status===500)console.error('Cloud API failure',error.code||error.name,error.message);return json(status,{error:status===500?'The server could not complete the request. Please retry.':error.message});}
}
