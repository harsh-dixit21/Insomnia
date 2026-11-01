import {createApp} from './app.mjs';
import {serviceConfig} from './config.mjs';
import {resolve,extname} from 'node:path';import {fileURLToPath} from 'node:url';
import {stat} from 'node:fs/promises';import {createReadStream} from 'node:fs';
const root=fileURLToPath(new URL('../',import.meta.url));
const dev=process.argv.includes('--dev'),port=Number(process.env.INSOMNIA_PORT||5181),host=process.env.INSOMNIA_HOST||'127.0.0.1';
let vite,localOidc;
const local=(dev||process.env.INSOMNIA_LOCAL_SERVICES==='true')&&['127.0.0.1','localhost','::1'].includes(host);
const config=serviceConfig(process.env,{local});

const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.pdf':'application/pdf','.mp4':'video/mp4','.png':'image/png','.svg':'image/svg+xml','.woff2':'font/woff2','.ttf':'font/ttf'};
async function frontend(req,res){
 let publicPath;try{publicPath=decodeURIComponent(new URL(req.url,'http://localhost').pathname);}catch{res.writeHead(400);return res.end('Invalid path.');}
 if(/(?:^|[/\\])(?:\.data|\.reference|\.git|\.env(?:\.[^/\\]*)?|server)(?:[/\\]|$)|\.sqlite(?:-[^/\\]*)?$/i.test(publicPath)){res.writeHead(404);return res.end('Not found.');}
 if(dev&&!vite){res.writeHead(503,{'Content-Type':'text/plain; charset=utf-8','Retry-After':'1'});return res.end('Insomnia is starting. Retry in a moment.');}
 if(dev)return vite.middlewares(req,res,()=>{res.writeHead(404);res.end('Not found.');});
 if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);return res.end();}
 try{const path=decodeURIComponent(new URL(req.url,'http://localhost').pathname),dist=resolve(root,'dist'),file=resolve(dist,'.'+(path.endsWith('/')?path+'index.html':path));if(!file.startsWith(dist+((process.platform==='win32')?'\\':'/')))throw new Error();const info=await stat(file);if(!info.isFile())throw new Error();const type=mime[extname(file)]||'application/octet-stream';res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Content-Type',type);res.setHeader('Accept-Ranges','bytes');
  if(req.headers.range){const match=/^bytes=(\d+)-(\d*)$/.exec(req.headers.range);if(!match)throw new Error();const start=Number(match[1]),end=match[2]?Math.min(Number(match[2]),info.size-1):info.size-1;if(start>end||start>=info.size){res.writeHead(416,{'Content-Range':`bytes */${info.size}`});return res.end();}res.writeHead(206,{'Content-Range':`bytes ${start}-${end}/${info.size}`,'Content-Length':end-start+1});if(req.method==='HEAD')return res.end();createReadStream(file,{start,end}).pipe(res);
  }else{res.writeHead(200,{'Content-Length':info.size});if(req.method==='HEAD')return res.end();createReadStream(file).pipe(res);}
 }catch{res.writeHead(404);res.end('Not found. Run npm run build before npm start.');}
}
const app=createApp({dbPath:process.env.INSOMNIA_DB||resolve(root,'.data/insomnia.sqlite'),secureCookie:process.env.INSOMNIA_SECURE_COOKIE==='true',allowedOrigin:process.env.INSOMNIA_ORIGIN,frontend,config});
let closing=false;
async function cleanup(){if(closing)return;closing=true;try{await vite?.close();}finally{try{await localOidc?.close();}finally{await app.close();}}}
try{
 // Claim the application port before starting any secondary services. A second
 // invocation exits cleanly without opening another HMR or identity listener.
 await new Promise((resolve,reject)=>{app.server.once('error',reject);app.server.listen(port,host,()=>{app.server.removeListener('error',reject);resolve();});});
if(local&&!config.oidc.issuer&&process.env.INSOMNIA_LOCAL_SSO!=='false'){
 const {createLocalOidc}=await import('./local-oidc.mjs');
 localOidc=await createLocalOidc({port:Number(process.env.INSOMNIA_SSO_PORT||5182),origin:config.origin});
 Object.assign(config.oidc,{issuer:localOidc.issuer,clientId:localOidc.credentials.clientId,secret:localOidc.credentials.clientSecret,allowHttp:true,label:'Local development SSO'});
 console.log('Local SSO enabled; development credentials are in .data/local-sso.json.');
}
 if(dev){const{createServer}=await import('vite');vite=await createServer({root,server:{middlewareMode:{server:app.server},hmr:{server:app.server}},appType:'mpa'});}
 console.log(`Insomnia ${dev?'development':'production'} server: http://${host}:${port}/\nSQLite persistence enabled; API and UI share one origin.`);
 app.server.on('error',error=>{console.error(`Insomnia server error: ${error.code||'unknown'}. Stop and restart the server.`);void cleanup().finally(()=>{process.exitCode=1;});});
}catch(error){
 await cleanup();
 if(error.code==='EADDRINUSE'){
  console.error(`Port ${error.port||port} is already in use.\nIf Insomnia is already running, open ${config.origin}/portal/#auth\nTo start it in this terminal, stop the existing server with Ctrl+C first.\nFor a separate instance, set INSOMNIA_PORT (and INSOMNIA_SSO_PORT for local SSO) in .env.`);
 }else console.error(`Insomnia could not start: ${error.message}`);
 process.exitCode=1;
}
async function shutdown(){await cleanup();process.exit(0);}
process.once('SIGINT',shutdown);process.once('SIGTERM',shutdown);
