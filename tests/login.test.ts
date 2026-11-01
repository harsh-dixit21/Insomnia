import {test} from 'node:test';
import assert from 'node:assert/strict';
import {ApiError,readApiResponse} from '../src/lib/api-response.ts';
import {api,setCsrf} from '../src/lib/api.ts';

test('API decoder rejects HTML, invalid JSON and false success responses',async()=>{
 for(const response of [new Response('<html>UI fallback</html>',{headers:{'Content-Type':'text/html'}}),new Response('{',{headers:{'Content-Type':'application/json'}}),...['null','[]','{"error":"Unavailable"}'].map(body=>new Response(body,{headers:{'Content-Type':'application/json'}}))]){
  await assert.rejects(readApiResponse(response),ApiError);
 }
 await assert.rejects(readApiResponse(new Response('{"error":"Invalid email or password."}',{status:401,headers:{'Content-Type':'application/json'}})),(error:unknown)=>error instanceof ApiError&&error.status===401&&error.message==='Invalid email or password.');
 assert.deepEqual(await readApiResponse(new Response('{"user":null}',{headers:{'Content-Type':'application/json; charset=utf-8'}})),{user:null});
});

test('login requests preserve credentials and convert connection failures into retryable errors',async()=>{
 const original=globalThis.fetch;
 try{
  setCsrf('test-csrf');
  globalThis.fetch=async(path,options)=>{assert.equal(path,'/api/auth/login');assert.equal(options?.credentials,'same-origin');assert.equal((options?.headers as Record<string,string>)['X-CSRF-Token'],'test-csrf');assert.equal(options?.body,JSON.stringify({email:'test@example.test',password:'test-password'}));return new Response('{"user":{"id":"test"}}',{headers:{'Content-Type':'application/json'}});};
  assert.deepEqual(await api('/api/auth/login',{method:'POST',body:{email:'test@example.test',password:'test-password'}}),{user:{id:'test'}});
  globalThis.fetch=async()=>{throw new TypeError('fetch failed');};
  await assert.rejects(api('/api/session'),(error:unknown)=>error instanceof ApiError&&error.status===503&&/retry/i.test(error.message));
 }finally{globalThis.fetch=original;setCsrf('');}
});
