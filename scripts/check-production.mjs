import assert from 'node:assert/strict';import {spawn} from 'node:child_process';import {createServer} from 'node:net';import {mkdtemp,rm} from 'node:fs/promises';import {tmpdir} from 'node:os';import {join} from 'node:path';import {DatabaseSync,backup} from 'node:sqlite';
const external=process.argv[2];let processHandle,directory;
async function start(port,db){
 const child=spawn(process.execPath,['--experimental-strip-types','server/index.mjs'],{windowsHide:true,env:{...process.env,INSOMNIA_PORT:String(port),INSOMNIA_HOST:'127.0.0.1',INSOMNIA_DB:db,INSOMNIA_ORIGIN:`http://127.0.0.1:${port}`,INSOMNIA_SECURE_COOKIE:'false',INSOMNIA_LOCAL_SERVICES:'false',OIDC_ISSUER:'',OIDC_CLIENT_ID:'',SMTP_HOST:'',OLLAMA_MODEL:'',TAVILY_API_KEY:'',IOMETE_SQLALCHEMY_URL:''},stdio:['ignore','pipe','pipe']});
 await new Promise((resolve,reject)=>{const timer=setTimeout(()=>{child.kill();reject(new Error('Production startup timed out.'));},15000);child.on('error',error=>{clearTimeout(timer);reject(error);});child.once('exit',code=>{clearTimeout(timer);reject(new Error(`Production server exited (${code}).`));});child.stdout.on('data',chunk=>{if(String(chunk).includes('production server:')){clearTimeout(timer);resolve();}});child.stderr.resume();});return child;
}
async function stop(){if(processHandle){const child=processHandle;processHandle=null;await new Promise(resolve=>{child.once('exit',resolve);child.kill();});}}
try{
 let base=external;
 if(!base){directory=await mkdtemp(join(tmpdir(),'insomnia-production-'));const reserve=createServer();await new Promise(resolve=>reserve.listen(0,'127.0.0.1',resolve));const port=reserve.address().port;await new Promise(resolve=>reserve.close(resolve));base=`http://127.0.0.1:${port}`;processHandle=await start(port,join(directory,'test.sqlite'));}
 else assert.equal(new URL(base).protocol,'https:','Remote production checks require HTTPS.');
 base=base.replace(/\/$/,'');
 const health=await fetch(base+'/api/health');assert.equal(health.status,200);assert.equal((await health.json()).status,'ok');assert.equal(health.headers.get('cache-control'),'no-store');
 const portal=await fetch(base+'/portal/');assert.equal(portal.status,200);const html=await portal.text();assert.match(html,/Insomnia/);const script=html.match(/src="([^"]+\.js)"/)[1];assert.equal((await fetch(new URL(script,base))).status,200);
 const pdf=await fetch(base+'/docs/insomnia-documentation.pdf');assert.equal(pdf.status,200);assert.match(pdf.headers.get('content-type'),/application\/pdf/);
 for(const path of ['/.env','/.data/insomnia.sqlite','/server/app.mjs','/.git/config'])assert.equal((await fetch(base+path)).status,404,path);
 assert.equal((await fetch(base+'/api/workspace')).status,401);
 if(!external){
  const request=async(path,body,auth)=>{const response=await fetch(base+path,{method:body?'POST':'GET',headers:{'Content-Type':'application/json','X-Insomnia-Request':'1',Origin:base,...(auth?{Cookie:auth.cookie,'X-CSRF-Token':auth.csrf}:{})},...(body?{body:JSON.stringify(body)}:{})});return {response,data:await response.json()};};
  const signup=await request('/api/auth/signup',{email:'production-smoke@example.test',name:'Production smoke',password:'a-long-test-password'});assert.equal(signup.response.status,200);const auth={cookie:signup.response.headers.get('set-cookie').split(';')[0],csrf:signup.data.csrf};
  const services=await request('/api/integrations',null,auth);assert.equal(services.data.sql.mode,'unconfigured');assert.equal(services.data.mail.mode,'unconfigured');assert.equal(services.data.sso.configured,false);
  const db=new DatabaseSync(join(directory,'test.sqlite'));await backup(db,join(directory,'backup.sqlite'));db.close();const restored=new DatabaseSync(join(directory,'backup.sqlite'));assert.equal(restored.prepare('PRAGMA integrity_check').get().integrity_check,'ok');assert.equal(restored.prepare('SELECT COUNT(*) AS n FROM users').get().n,1);restored.close();
  await stop();processHandle=await start(new URL(base).port,join(directory,'backup.sqlite'));assert.equal((await request('/api/session',null,auth)).data.user.email,'production-smoke@example.test');
 }
 console.log(external?'Remote production HTTP smoke checks passed. Verify provider credentials, DNS, TLS policy, backups and capacity separately.':'Production build serving, API guards, private-file protection, restart and SQLite backup/restore passed. Public deployment was not performed.');
}finally{await stop();if(directory)await rm(directory,{recursive:true,force:true});}
