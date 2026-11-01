import * as oidc from 'openid-client';
import {randomBytes,createHash,randomUUID} from 'node:crypto';

const hash=value=>createHash('sha256').update(value).digest('hex');
export function createIdentity(ctx){
 const{db,config,mailer,fail,json,readJson,authLimit,passwordHash,startSession,account,workspace,createUser}=ctx;
 db.exec(`CREATE TABLE IF NOT EXISTS reset_tokens(token_hash TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id),expires_at INTEGER NOT NULL);
 CREATE TABLE IF NOT EXISTS oidc_identities(issuer TEXT NOT NULL,subject TEXT NOT NULL,user_id TEXT NOT NULL REFERENCES users(id),PRIMARY KEY(issuer,subject));
 CREATE TABLE IF NOT EXISTS oidc_flows(state_hash TEXT PRIMARY KEY,browser_hash TEXT NOT NULL,verifier TEXT NOT NULL,nonce TEXT NOT NULL,link_user TEXT,link_session TEXT,expires_at INTEGER NOT NULL);`);
 let discovery;
 async function provider(){
  if(!config.oidc.issuer||!config.oidc.clientId)fail(503,'SSO is not configured. Sign in with email and password.');
  discovery||=oidc.discovery(new URL(config.oidc.issuer),config.oidc.clientId,config.oidc.secret,undefined,{...(config.oidc.allowHttp?{execute:[oidc.allowInsecureRequests]}:{})}).then(value=>{oidc.enableNonRepudiationChecks(value);return value;}).catch(()=>{discovery=null;fail(503,'SSO provider is unavailable. Check its issuer and client configuration.');});
  return discovery;
 }
 return async(req,res,url,session)=>{
  const method=req.method;
  if(method==='GET'&&url.pathname==='/api/auth/options'){json(res,200,{sso:!!config.oidc.issuer&&!!config.oidc.clientId,ssoLabel:config.oidc.label,passwordReset:mailer.mode!=='unconfigured',mailMode:mailer.mode});return true;}
  if(method==='POST'&&url.pathname==='/api/auth/forgot'){
   authLimit(req);const body=await readJson(req);const email=typeof body.email==='string'?body.email.trim().toLowerCase():'';
   if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||email.length>254)fail(400,'Enter a valid email address.');
   if(mailer.mode==='unconfigured')fail(503,'Password reset delivery is not configured. Contact your server administrator.');
   const user=db.prepare('SELECT id FROM users WHERE email=?').get(email);
   // Return the same public response for existing and unknown accounts.
   if(user){const token=randomBytes(32).toString('hex');db.prepare('DELETE FROM reset_tokens WHERE user_id=? OR expires_at<=?').run(user.id,Date.now());db.prepare('INSERT INTO reset_tokens VALUES(?,?,?)').run(hash(token),user.id,Date.now()+1800000);
    try{await mailer.send({to:email,subject:'Reset your Insomnia password',text:`A password reset was requested. This link expires in 30 minutes and works once.\n\n${config.origin}/portal/#reset/${token}\n\nIgnore this message if you did not request it.`});}catch{db.prepare('DELETE FROM reset_tokens WHERE token_hash=?').run(hash(token));/* Avoid account enumeration on delivery errors. */}
   }
   json(res,200,{ok:true,message:mailer.mode==='local-outbox'?'If this account exists, a reset message was saved to the local development outbox (.data/mail).':'If this account exists, a reset email has been requested.'});return true;
  }
  if(method==='POST'&&url.pathname==='/api/auth/reset'){
   authLimit(req);const body=await readJson(req);
   if(typeof body.token!=='string'||!/^[a-f0-9]{64}$/.test(body.token)||typeof body.password!=='string'||body.password.length<12||body.password.length>128)fail(400,'Use a valid reset link and a password of 12–128 characters.');
   const row=db.prepare('SELECT * FROM reset_tokens WHERE token_hash=? AND expires_at>?').get(hash(body.token),Date.now());if(!row)fail(400,'This reset link is invalid or expired. Request a new one.');
   const encoded=await passwordHash(body.password);
   db.exec('BEGIN IMMEDIATE');try{const consumed=db.prepare('DELETE FROM reset_tokens WHERE token_hash=? AND expires_at>?').run(hash(body.token),Date.now());if(!consumed.changes)fail(400,'This reset link has already been used.');db.prepare('UPDATE users SET password_hash=? WHERE id=?').run(encoded,row.user_id);db.prepare('DELETE FROM sessions WHERE user_id=?').run(row.user_id);db.prepare('DELETE FROM reset_tokens WHERE user_id=?').run(row.user_id);db.exec('COMMIT');}catch(error){db.exec('ROLLBACK');throw error;}
   json(res,200,{ok:true,message:'Password updated. Sign in with your new password.'});return true;
  }
  if(method==='GET'&&url.pathname==='/api/auth/sso/start'){
   authLimit(req);const providerConfig=await provider();const state=oidc.randomState(),nonce=oidc.randomNonce(),verifier=oidc.randomPKCECodeVerifier(),browserToken=randomBytes(32).toString('hex');
   db.prepare('DELETE FROM oidc_flows WHERE expires_at<=?').run(Date.now());db.prepare('INSERT INTO oidc_flows VALUES(?,?,?,?,?,?,?)').run(hash(state),hash(browserToken),verifier,nonce,session?.id||null,session?.token_hash||null,Date.now()+600000);
   const authUrl=oidc.buildAuthorizationUrl(providerConfig,{redirect_uri:`${config.origin}/api/auth/sso/callback`,response_type:'code',scope:'openid email profile',state,nonce,code_challenge:await oidc.calculatePKCECodeChallenge(verifier),code_challenge_method:'S256'});
   res.setHeader('Set-Cookie',`insomnia_oidc=${browserToken}; HttpOnly; SameSite=Lax; Path=/api/auth/sso; Max-Age=600${config.origin.startsWith('https:')?'; Secure':''}`);res.writeHead(302,{Location:authUrl.href});res.end();return true;
  }
  if(method==='GET'&&url.pathname==='/api/auth/sso/callback'){
   res.setHeader('Set-Cookie','insomnia_oidc=; HttpOnly; SameSite=Lax; Path=/api/auth/sso; Max-Age=0');
   const state=url.searchParams.get('state'),browserToken=req.headers.cookie?.split(';').map(v=>v.trim()).find(v=>v.startsWith('insomnia_oidc='))?.slice('insomnia_oidc='.length);
   const flow=state&&db.prepare('SELECT * FROM oidc_flows WHERE state_hash=? AND expires_at>?').get(hash(state),Date.now());
   if(!flow||!browserToken||flow.browser_hash!==hash(browserToken))fail(400,'SSO verification expired or failed. Start sign-in again.');
   db.prepare('DELETE FROM oidc_flows WHERE state_hash=?').run(hash(state));
   let claims;
   try{const tokens=await oidc.authorizationCodeGrant(await provider(),new URL(req.url,config.origin),{pkceCodeVerifier:flow.verifier,expectedState:state,expectedNonce:flow.nonce,idTokenExpected:true});claims=tokens.claims();}catch{fail(401,'SSO verification failed. Start sign-in again or use your password.');}
   if(!claims?.sub||claims.email_verified!==true||typeof claims.email!=='string')fail(403,'SSO must provide a verified email address.');
   const email=claims.email.trim().toLowerCase();if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||email.length>254)fail(403,'SSO returned an invalid email address.');
   let user=db.prepare('SELECT u.* FROM oidc_identities i JOIN users u ON u.id=i.user_id WHERE i.issuer=? AND i.subject=?').get(config.oidc.issuer,claims.sub);
   if(!user){
    const existing=db.prepare('SELECT * FROM users WHERE email=?').get(email);
    if(existing){const active=flow.link_session&&db.prepare('SELECT user_id FROM sessions WHERE token_hash=? AND expires_at>?').get(flow.link_session,Date.now());if(flow.link_user!==existing.id||active?.user_id!==existing.id)fail(409,'Sign in with your password, then link SSO from Settings.');user=existing;}
    else user=await createUser({id:randomUUID(),email,name:String(claims.name||email.split('@')[0]).slice(0,100),encoded:await passwordHash(randomBytes(32).toString('hex'))});
    db.prepare('INSERT INTO oidc_identities VALUES(?,?,?)').run(config.oidc.issuer,claims.sub,user.id);
   }
   startSession(res,user.id);res.writeHead(302,{Location:`${config.origin}/portal/#dashboard`});res.end();return true;
  }
  return false;
 };
}
