import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {createServer} from 'node:net';
import {mkdtemp,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';

async function listen(server,port=0){await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(port,'127.0.0.1',resolve);});return server.address().port;}
function launch(port,db,extra={}){
 const child=spawn(process.execPath,['--experimental-strip-types','server/index.mjs','--dev'],{windowsHide:true,env:{...process.env,INSOMNIA_HOST:'127.0.0.1',INSOMNIA_PORT:String(port),INSOMNIA_DB:db,INSOMNIA_LOCAL_SSO:'false',OIDC_ISSUER:'',OIDC_CLIENT_ID:'',...extra},stdio:['ignore','pipe','pipe']});
 let output='';let readyResolve;let readyReject;
 const ready=new Promise((resolve,reject)=>{readyResolve=resolve;readyReject=reject;});
 const timer=setTimeout(()=>{child.kill();readyReject(new Error('Startup timed out.'));},15000);
 for(const stream of [child.stdout,child.stderr])stream.on('data',chunk=>{output+=chunk;if(output.includes('development server:')){clearTimeout(timer);readyResolve();}});
 const exited=new Promise(resolve=>child.once('exit',code=>{clearTimeout(timer);readyResolve();resolve(code);}));
 child.once('error',error=>{clearTimeout(timer);readyReject(error);});
 return {child,ready,exited,output:()=>output,async stop(){if(child.exitCode===null&&child.signalCode===null){child.kill();await exited;}}};
}

test('startup handles occupied app ports and shares HMR with HTTP',async t=>{
 const directory=await mkdtemp(join(tmpdir(),'insomnia-startup-'));const blocker=createServer();const port=await listen(blocker);let first,duplicate,occupied,hmrBlocker;
 try{
  await t.test('an occupied application port exits with instructions and no stack trace',async()=>{
   occupied=launch(port,join(directory,'occupied.sqlite'),{INSOMNIA_LOCAL_SSO:'true',INSOMNIA_SSO_PORT:String(port)});
   await occupied.ready;assert.equal(await occupied.exited,1);assert.match(occupied.output(),new RegExp(`Port ${port} is already in use`));assert.match(occupied.output(),/Ctrl\+C/);assert.doesNotMatch(occupied.output(),/Unhandled|WebSocket server error|Local SSO enabled/);assert.equal(blocker.listening,true);
  });
  await new Promise(resolve=>blocker.close(resolve));
  // If another local Vite already owns 24678, leave it untouched. Either way,
  // the test verifies this app starts without needing that legacy HMR port.
  hmrBlocker=createServer();try{await listen(hmrBlocker,24678);}catch(error){if(error.code!=='EADDRINUSE')throw error;hmrBlocker=null;}
  await t.test('HTTP and the live HMR WebSocket work on the same port',async()=>{
   first=launch(port,join(directory,'running.sqlite'));await first.ready;assert.match(first.output(),/development server:/);assert.doesNotMatch(first.output(),/WebSocket server error/);
   const base=`http://127.0.0.1:${port}`;assert.equal((await fetch(base+'/api/health')).status,200);assert.equal((await fetch(base+'/portal/')).status,200);
   const client=await(await fetch(base+'/@vite/client')).text();const token=client.match(/const wsToken = "([^"]+)"/)[1];
   const socket=new WebSocket(`ws://127.0.0.1:${port}/?token=${token}`,'vite-hmr');
   try{await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(new Error('HMR handshake timed out.')),5000);socket.addEventListener('message',event=>{try{assert.equal(JSON.parse(event.data).type,'connected');clearTimeout(timer);resolve();}catch(error){clearTimeout(timer);reject(error);}},{once:true});socket.addEventListener('error',()=>{clearTimeout(timer);reject(new Error('HMR handshake failed.'));},{once:true});});}finally{socket.close();}
  });
  await t.test('a duplicate launch leaves the existing app healthy',async()=>{
   duplicate=launch(port,join(directory,'duplicate.sqlite'));await duplicate.ready;assert.equal(await duplicate.exited,1);assert.match(duplicate.output(),/already in use/);assert.doesNotMatch(duplicate.output(),/Unhandled|WebSocket server error/);assert.equal((await fetch(`http://127.0.0.1:${port}/api/session`)).status,200);
  });
 }finally{
  await occupied?.stop();await duplicate?.stop();await first?.stop();if(blocker.listening)await new Promise(resolve=>blocker.close(resolve));if(hmrBlocker?.listening)await new Promise(resolve=>hmrBlocker.close(resolve));await rm(directory,{recursive:true,force:true});
 }
});
