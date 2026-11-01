import test from 'node:test';
import assert from 'node:assert/strict';
import https from 'node:https';
import {PassThrough, Writable} from 'node:stream';
import {EventEmitter} from 'node:events';
import gateway from '../api/gateway.mjs';

function response(){
 const chunks=[];
 const res=new Writable({write(chunk,encoding,done){chunks.push(chunk);done();}});
 res.writeHead=(status,headers)=>{res.status=status;res.headers=headers;res.headersSent=true;};
 res.text=()=>Buffer.concat(chunks).toString();
 return res;
}
test('gateway returns JSON 503 until a secure backend origin is configured',()=>{
 const original=process.env.INSOMNIA_BACKEND_URL;
 try{for(const value of ['', 'http://example.com','https://example.com/secret','https://user:pass@example.com']){
  process.env.INSOMNIA_BACKEND_URL=value;const res=response();gateway({url:'/api/health',headers:{}},res);
  assert.equal(res.status,503);assert.match(JSON.parse(res.text()).error,/backend/);
 }}finally{if(original===undefined)delete process.env.INSOMNIA_BACKEND_URL;else process.env.INSOMNIA_BACKEND_URL=original;}
});
test('gateway forwards parsed mutation body, session and CSRF scope without following redirects',async(t)=>{
 const original=process.env.INSOMNIA_BACKEND_URL;process.env.INSOMNIA_BACKEND_URL='https://backend.example';
 t.after(()=>{if(original===undefined)delete process.env.INSOMNIA_BACKEND_URL;else process.env.INSOMNIA_BACKEND_URL=original;});
 let forwarded;
 t.mock.method(https,'request',(url,options,callback)=>{
  forwarded={url:String(url),options};const upstream=new EventEmitter();
  upstream.destroy=()=>{};
  upstream.end=body=>{forwarded.body=body.toString();const reply=new PassThrough();reply.statusCode=302;reply.headers={'set-cookie':['insomnia_session=secret; HttpOnly; Secure; Path=/'],'location':'https://identity.example/login'};callback(reply);reply.end();upstream.emit('close');};
  return upstream;
 });
 const res=response();const finished=new Promise(resolve=>res.on('finish',resolve));
 gateway({url:'/api/gateway?__path=auth/login&next=dashboard',method:'POST',body:{email:'test@example.com'},headers:{origin:'https://site.example',cookie:'insomnia_session=old','x-csrf-token':'csrf','x-workspace-id':'workspace','x-insomnia-request':'1','content-type':'application/json'}},res);
 await finished;
 assert.equal(forwarded.url,'https://backend.example/api/auth/login?next=dashboard');
 assert.equal(forwarded.options.headers['x-csrf-token'],'csrf');assert.equal(forwarded.options.headers['x-workspace-id'],'workspace');
 assert.equal(forwarded.options.headers.cookie,'insomnia_session=old');assert.equal(JSON.parse(forwarded.body).email,'test@example.com');
 assert.equal(res.status,302);assert.equal(res.headers.location,'https://identity.example/login');assert.match(res.headers['set-cookie'][0],/HttpOnly; Secure/);
});
