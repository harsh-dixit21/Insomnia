// Loopback-only development identity provider. Never run this in production.
import {createServer} from 'node:http';
import {randomBytes,createHash,scryptSync,timingSafeEqual,generateKeyPairSync,sign} from 'node:crypto';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {dirname} from 'node:path';
const hash=v=>createHash('sha256').update(v).digest('base64url');
const b64=v=>Buffer.from(JSON.stringify(v)).toString('base64url');
export async function createLocalOidc({port=5182,origin='http://127.0.0.1:5181',credentialsFile='.data/local-sso.json'}={}){
 let credentials;
 try{credentials=JSON.parse(await readFile(credentialsFile,'utf8'));}catch(error){if(error.code!=='ENOENT')throw error;credentials={email:'demo@insomnia.local',password:randomBytes(18).toString('base64url'),clientId:'insomnia-local',clientSecret:randomBytes(32).toString('hex')};await mkdir(dirname(credentialsFile),{recursive:true});await writeFile(credentialsFile,JSON.stringify(credentials,null,2),{mode:0o600});}
 const{privateKey,publicKey}=generateKeyPairSync('rsa',{modulusLength:2048}),kid=randomBytes(12).toString('hex'),jwk={...publicKey.export({format:'jwk'}),kid,use:'sig',alg:'RS256'},flows=new Map(),codes=new Map(),attempts=new Map();
 const salt=randomBytes(16),passwordHash=scryptSync(credentials.password,salt,64);let issuer=`http://127.0.0.1:${port}`;
 const json=(res,status,value)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(value));};
 const server=createServer(async(req,res)=>{
  try{
   // no-referrer makes browsers serialize Origin as "null" on this form POST.
   // same-origin preserves the strict origin check without leaking to other hosts.
   const url=new URL(req.url,issuer);res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','same-origin');
   for(const map of [flows,codes])for(const[key,value]of map)if(value.expires<Date.now())map.delete(key);
   if(url.pathname==='/.well-known/openid-configuration')return json(res,200,{issuer,authorization_endpoint:`${issuer}/authorize`,token_endpoint:`${issuer}/token`,jwks_uri:`${issuer}/jwks`,response_types_supported:['code'],subject_types_supported:['public'],id_token_signing_alg_values_supported:['RS256'],token_endpoint_auth_methods_supported:['client_secret_post'],code_challenge_methods_supported:['S256']});
   if(url.pathname==='/jwks')return json(res,200,{keys:[jwk]});
   if(url.pathname==='/authorize'&&req.method==='GET'){
    const p=url.searchParams;if(p.get('client_id')!==credentials.clientId||p.get('redirect_uri')!==`${origin}/api/auth/sso/callback`||p.get('response_type')!=='code'||p.get('code_challenge_method')!=='S256'||!p.get('code_challenge')||!p.get('state')||!p.get('nonce'))return json(res,400,{error:'invalid_request'});
    const token=randomBytes(32).toString('hex');flows.set(token,{params:Object.fromEntries(p),expires:Date.now()+600000});res.setHeader('Set-Cookie',`insomnia_local_idp=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=600`);
    res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Content-Security-Policy':`default-src 'none'; style-src 'unsafe-inline'; form-action 'self' ${new URL(origin).origin}; frame-ancestors 'none'; base-uri 'none'`});return res.end(`<!doctype html><html><meta name="viewport" content="width=device-width"><title>Insomnia Local SSO</title><style>body{font:16px system-ui;background:#171717;color:#eee;max-width:420px;margin:12vh auto;padding:24px}label,input,button{display:block;margin:12px 0}input,button{box-sizing:border-box;width:100%;padding:12px;border-radius:6px}p{line-height:1.6;color:#bbb}</style><h1>Insomnia Local SSO</h1><p>This is a development identity provider on your computer. Credentials are in <code>.data/local-sso.json</code>. It uses signed ID tokens and PKCE, but does not represent an enterprise identity service.</p><form method="post" action="/authorize"><label>Email<input name="email" type="email" autocomplete="username" required></label><label>Password<input name="password" type="password" autocomplete="current-password" required></label><input type="hidden" name="flow" value="${token}"><button>Sign in to local SSO</button></form></html>`);
   }
   let raw='';for await(const chunk of req){raw+=chunk;if(raw.length>10000)return json(res,413,{error:'request_too_large'});}const body=new URLSearchParams(raw);
   if(url.pathname==='/authorize'&&req.method==='POST'){
    if(req.headers.origin!==issuer){console.warn('Local SSO origin rejected:',req.headers.origin||'(missing)','expected:',issuer);return json(res,403,{error:'invalid_origin'});}
    const token=body.get('flow'),flow=flows.get(token),cookie=req.headers.cookie?.split(';').map(s=>s.trim()).find(s=>s.startsWith('insomnia_local_idp='))?.slice('insomnia_local_idp='.length);
    if(!flow||token!==cookie)return json(res,400,{error:'invalid_flow'});
    const key=req.socket.remoteAddress,now=Date.now(),rate=attempts.get(key)||{count:0,expires:now+900000};if(rate.expires<now){rate.count=0;rate.expires=now+900000;}attempts.set(key,rate);if(++rate.count>20)return json(res,429,{error:'rate_limited'});
    const candidate=scryptSync(body.get('password')||'',salt,64);if(body.get('email')!==credentials.email||!timingSafeEqual(candidate,passwordHash))return json(res,401,{error:'invalid_credentials'});
    flows.delete(token);const code=randomBytes(32).toString('hex');codes.set(code,{...flow,expires:Date.now()+60000});const callback=new URL(flow.params.redirect_uri);callback.searchParams.set('code',code);callback.searchParams.set('state',flow.params.state);callback.searchParams.set('iss',issuer);res.writeHead(302,{Location:callback.href});return res.end();
   }
   if(url.pathname==='/token'&&req.method==='POST'){
    const code=body.get('code'),flow=codes.get(code);codes.delete(code);
    if(!flow||body.get('grant_type')!=='authorization_code'||body.get('client_id')!==credentials.clientId||body.get('client_secret')!==credentials.clientSecret||body.get('redirect_uri')!==flow.params.redirect_uri||hash(body.get('code_verifier')||'')!==flow.params.code_challenge)return json(res,400,{error:'invalid_grant'});
    const now=Math.floor(Date.now()/1000),header=b64({alg:'RS256',kid,typ:'JWT'}),payload=b64({iss:issuer,sub:'local-demo-user',aud:credentials.clientId,iat:now,exp:now+300,nonce:flow.params.nonce,email:credentials.email,email_verified:true,name:'Local SSO Demo'}),input=`${header}.${payload}`,signature=sign('RSA-SHA256',Buffer.from(input),privateKey).toString('base64url');return json(res,200,{access_token:randomBytes(32).toString('hex'),token_type:'Bearer',expires_in:300,id_token:`${input}.${signature}`});
   }
   json(res,404,{error:'not_found'});
  }catch{json(res,400,{error:'invalid_request'});}
 });
 await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(port,'127.0.0.1',resolve);});issuer=`http://127.0.0.1:${server.address().port}`;
 return {issuer,credentials,server,async close(){server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}};
}
