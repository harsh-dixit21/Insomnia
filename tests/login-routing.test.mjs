import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createServer,preview,loadConfigFromFile} from 'vite';
import {createApp} from '../server/app.mjs';

test('development and preview forward the complete login lifecycle to the backend',async()=>{
 const directory=await mkdtemp(join(tmpdir(),'insomnia-login-'));
 const app=createApp({dbPath:join(directory,'test.sqlite')});
 let frontend;
 try{
  await new Promise(resolve=>app.server.listen(0,'127.0.0.1',resolve));
  const backend=`http://127.0.0.1:${app.server.address().port}`;
  const loaded=await loadConfigFromFile({command:'serve',mode:'development'});
  assert.deepEqual(loaded.config.preview.proxy,loaded.config.server.proxy);
  assert.equal(loaded.config.server.proxy['/api'].changeOrigin,false);
  await writeFile(join(directory,'index.html'),'<html>Preview fixture</html>');
  for(const mode of ['development','preview']){
   const proxy=structuredClone(loaded.config.server.proxy);proxy['/api'].target=backend;
   if(mode==='development'){frontend=await createServer({server:{host:'127.0.0.1',port:0,hmr:false,ws:false,proxy}});await frontend.listen();}
   else frontend=await preview({build:{outDir:directory},preview:{host:'127.0.0.1',port:0,proxy}});
   const http=frontend.httpServer;const base=`http://127.0.0.1:${http.address().port}`;
   const request=async(path,{body,cookie,csrf}={})=>{
    const response=await fetch(base+path,{method:body?'POST':'GET',headers:{Origin:base,'Content-Type':'application/json','X-Insomnia-Request':'1',...(cookie?{Cookie:cookie}:{}),...(csrf?{'X-CSRF-Token':csrf}:{})},...(body?{body:JSON.stringify(body)}:{})});
    assert.match(response.headers.get('content-type'),/application\/json/);
    return {response,data:await response.json()};
   };
   assert.equal((await request('/api/session')).data.user,null);
   const credentials={email:`${mode}@example.test`,password:'a-long-test-password'};
   const signup=await request('/api/auth/signup',{body:{...credentials,name:'Proxy test'}});
   assert.equal(signup.response.status,200);assert.ok(signup.data.csrf);
   let cookie=signup.response.headers.get('set-cookie').split(';')[0];
   assert.equal((await request('/api/session',{cookie})).data.user.email,credentials.email);
   assert.equal((await request('/api/auth/logout',{body:{},cookie,csrf:signup.data.csrf})).response.status,200);
   assert.equal((await request('/api/session',{cookie})).data.user,null);
   const wrong=await request('/api/auth/login',{body:{...credentials,password:'wrong-long-password'}});
   assert.equal(wrong.response.status,401);
   const login=await request('/api/auth/login',{body:{...credentials,email:` ${credentials.email.toUpperCase()} `}});
   assert.equal(login.response.status,200);assert.ok(login.data.state);assert.ok(login.data.insights);
   cookie=login.response.headers.get('set-cookie').split(';')[0];
   assert.equal((await request('/api/session',{cookie})).data.user.email,credentials.email);
   assert.equal((await request('/api/workspace',{cookie})).response.status,200);
   if(frontend.close)await frontend.close();else await new Promise(resolve=>http.close(resolve));
   frontend=null;
  }
 }finally{
  if(frontend?.close)await frontend.close();else if(frontend)await new Promise(resolve=>frontend.httpServer.close(resolve));
  await app.close();await rm(directory,{recursive:true,force:true});
 }
});
