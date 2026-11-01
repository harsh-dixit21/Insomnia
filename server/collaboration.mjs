import {randomBytes,createHash,randomUUID} from 'node:crypto';
const hash=value=>createHash('sha256').update(value).digest('hex');
export function createCollaboration(ctx){
 const{db,config,mailer,json,readJson,fail,workspace,limited}=ctx;
 db.exec(`CREATE TABLE IF NOT EXISTS workspace_members(owner_id TEXT NOT NULL REFERENCES users(id),user_id TEXT NOT NULL REFERENCES users(id),role TEXT NOT NULL CHECK(role IN ('editor','viewer')),PRIMARY KEY(owner_id,user_id));
 CREATE TABLE IF NOT EXISTS workspace_invites(id TEXT PRIMARY KEY,owner_id TEXT NOT NULL REFERENCES users(id),email TEXT NOT NULL,role TEXT NOT NULL CHECK(role IN ('editor','viewer')),token_hash TEXT NOT NULL UNIQUE,expires_at INTEGER NOT NULL);
 CREATE TABLE IF NOT EXISTS team_audit(id TEXT PRIMARY KEY,owner_id TEXT NOT NULL,actor_id TEXT NOT NULL,action TEXT NOT NULL,created_at TEXT NOT NULL);`);
 if(!db.prepare('PRAGMA table_info(sessions)').all().some(c=>c.name==='workspace_id'))db.exec('ALTER TABLE sessions ADD COLUMN workspace_id TEXT');
 const audit=(session,action)=>db.prepare('INSERT INTO team_audit VALUES(?,?,?,?,?)').run(randomUUID(),session.workspace_id,session.id,action,new Date().toISOString());
 const role=(userId,ownerId)=>userId===ownerId?'owner':db.prepare('SELECT role FROM workspace_members WHERE owner_id=? AND user_id=?').get(ownerId,userId)?.role;
 return {role,async route(req,res,url,session){
  const path=url.pathname,method=req.method,owner=session.workspace_id;
  if(path==='/api/team'&&method==='GET'){
   const workspaces=[{id:session.id,name:workspace(session.id).state.settings.workspace,role:'owner'},...db.prepare('SELECT m.owner_id AS id,m.role,w.state_json FROM workspace_members m JOIN workspaces w ON w.user_id=m.owner_id WHERE m.user_id=?').all(session.id).map(w=>({id:w.id,role:w.role,name:JSON.parse(w.state_json).settings.workspace}))];
   const members=[{...db.prepare('SELECT id,email,name FROM users WHERE id=?').get(owner),role:'owner'},...db.prepare('SELECT u.id,u.email,u.name,m.role FROM workspace_members m JOIN users u ON u.id=m.user_id WHERE m.owner_id=?').all(owner)];
   const invitations=session.access==='owner'?db.prepare('SELECT id,email,role,expires_at FROM workspace_invites WHERE owner_id=? AND expires_at>?').all(owner,Date.now()):[];
   json(res,200,{workspaces,current:owner,access:session.access,members,invitations,events:db.prepare('SELECT a.id,a.action,a.created_at AS date,u.name AS actor FROM team_audit a JOIN users u ON u.id=a.actor_id WHERE owner_id=? ORDER BY a.created_at DESC LIMIT 50').all(owner)});return true;
  }
  if(path==='/api/team/switch'&&method==='POST'){
   const body=await readJson(req);if(typeof body.workspaceId!=='string'||!role(session.id,body.workspaceId))fail(403,'You do not have access to this workspace.');
   db.prepare('UPDATE sessions SET workspace_id=? WHERE token_hash=?').run(body.workspaceId,session.token_hash);json(res,200,{ok:true});return true;
  }
  if(path==='/api/team/accept'&&method==='POST'){
   const body=await readJson(req);if(typeof body.token!=='string'||!/^[a-f0-9]{64}$/.test(body.token))fail(400,'Invalid invitation.');
   const invitation=db.prepare('SELECT * FROM workspace_invites WHERE token_hash=? AND expires_at>?').get(hash(body.token),Date.now());
   if(!invitation||invitation.email!==session.email||invitation.owner_id===session.id)fail(400,'Invitation is invalid, expired, or belongs to another email.');
   db.exec('BEGIN IMMEDIATE');try{db.prepare('INSERT INTO workspace_members VALUES(?,?,?) ON CONFLICT(owner_id,user_id) DO UPDATE SET role=excluded.role').run(invitation.owner_id,session.id,invitation.role);db.prepare('DELETE FROM workspace_invites WHERE id=?').run(invitation.id);db.exec('COMMIT');}catch(error){db.exec('ROLLBACK');throw error;}
   audit({...session,workspace_id:invitation.owner_id},`${session.email} accepted an invitation as ${invitation.role}.`);json(res,200,{ok:true});return true;
  }
  if(path==='/api/team/invite'&&method==='POST'){
   if(session.access!=='owner')fail(403,'Only the workspace owner can invite members.');
   const body=await readJson(req),email=limited(body.email,'Email',254).toLowerCase();if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||email===session.email||!['editor','viewer'].includes(body.role))fail(400,'Choose a valid email and editor or viewer access.');
   if(mailer.mode==='unconfigured')fail(503,'Configure email delivery before inviting members.');
   const token=randomBytes(32).toString('hex'),id=randomUUID();db.prepare('DELETE FROM workspace_invites WHERE owner_id=? AND email=?').run(owner,email);
   db.prepare('INSERT INTO workspace_invites VALUES(?,?,?,?,?,?)').run(id,owner,email,body.role,hash(token),Date.now()+172800000);
   try{await mailer.send({to:email,subject:'Invitation to an Insomnia workspace',text:`${session.name} invited you as ${body.role}. Sign in using ${email}, then accept this invitation. It expires in 48 hours.\n\n${config.origin}/portal/#invite/${token}`});}catch{db.prepare('DELETE FROM workspace_invites WHERE id=?').run(id);fail(503,'Invitation email could not be delivered. Check mail configuration and retry.');}
   audit(session,`Invited ${email} as ${body.role}.`);json(res,200,{ok:true,message:mailer.mode==='local-outbox'?'Invitation saved to the local development outbox.':'Invitation email requested.'});return true;
  }
  if(path==='/api/team/member'&&['PUT','DELETE'].includes(method)){
   if(session.access!=='owner')fail(403,'Only the workspace owner can change access.');const body=await readJson(req);if(body.userId===owner)fail(400,'The workspace owner cannot be removed.');
   if(!db.prepare('SELECT 1 FROM workspace_members WHERE owner_id=? AND user_id=?').get(owner,body.userId))fail(404,'Member not found.');
   if(method==='DELETE')db.prepare('DELETE FROM workspace_members WHERE owner_id=? AND user_id=?').run(owner,body.userId);
   else{if(!['editor','viewer'].includes(body.role))fail(400,'Choose editor or viewer access.');db.prepare('UPDATE workspace_members SET role=? WHERE owner_id=? AND user_id=?').run(body.role,owner,body.userId);}
   audit(session,`${method==='DELETE'?'Removed':'Changed access for'} member ${body.userId}${method==='PUT'?` to ${body.role}`:''}.`);json(res,200,{ok:true});return true;
  }
  if(path==='/api/team/invite'&&method==='DELETE'){
   if(session.access!=='owner')fail(403,'Only the workspace owner can revoke invitations.');const body=await readJson(req);db.prepare('DELETE FROM workspace_invites WHERE owner_id=? AND id=?').run(owner,body.id);audit(session,'Revoked a pending invitation.');json(res,200,{ok:true});return true;
  }
  return false;
 }};
}
