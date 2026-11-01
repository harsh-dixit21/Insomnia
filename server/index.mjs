import {createApp} from './app.mjs';
import {resolve,extname} from 'node:path';import {fileURLToPath} from 'node:url';
import {stat} from 'node:fs/promises';import {createReadStream} from 'node:fs';
const root=fileURLToPath(new URL('../',import.meta.url));
const dev=process.argv.includes('--dev'),port=Number(process.env.INSOMNIA_PORT||5181),host=process.env.INSOMNIA_HOST||'127.0.0.1';
let vite;
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.pdf':'application/pdf','.mp4':'video/mp4','.png':'image/png','.svg':'image/svg+xml','.woff2':'font/woff2','.ttf':'font/ttf'};
async function frontend(req,res){
 let publicPath;try{publicPath=decodeURIComponent(new URL(req.url,'http://localhost').pathname);}catch{res.writeHead(400);return res.end('Invalid path.');}
 if(/(?:^|[/\\])(?:\.data|\.reference|\.git|\.env(?:\.[^/\\]*)?|server)(?:[/\\]|$)|\.sqlite(?:-[^/\\]*)?$/i.test(publicPath)){res.writeHead(404);return res.end('Not found.');}
 if(dev)return vite.middlewares(req,res,()=>{res.writeHead(404);res.end('Not found.');});
 if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);return res.end();}
 try{const path=decodeURIComponent(new URL(req.url,'http://localhost').pathname),dist=resolve(root,'dist'),file=resolve(dist,'.'+(path.endsWith('/')?path+'index.html':path));if(!file.startsWith(dist+((process.platform==='win32')?'\\':'/')))throw new Error();const info=await stat(file);if(!info.isFile())throw new Error();const type=mime[extname(file)]||'application/octet-stream';res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Content-Type',type);res.setHeader('Accept-Ranges','bytes');
  if(req.headers.range){const match=/^bytes=(\d+)-(\d*)$/.exec(req.headers.range);if(!match)throw new Error();const start=Number(match[1]),end=match[2]?Math.min(Number(match[2]),info.size-1):info.size-1;if(start>end||start>=info.size){res.writeHead(416,{'Content-Range':`bytes */${info.size}`});return res.end();}res.writeHead(206,{'Content-Range':`bytes ${start}-${end}/${info.size}`,'Content-Length':end-start+1});if(req.method==='HEAD')return res.end();createReadStream(file,{start,end}).pipe(res);
  }else{res.writeHead(200,{'Content-Length':info.size});if(req.method==='HEAD')return res.end();createReadStream(file).pipe(res);}
 }catch{res.writeHead(404);res.end('Not found. Run npm run build before npm start.');}
}
if(dev){const{createServer}=await import('vite');vite=await createServer({root,server:{middlewareMode:true},appType:'mpa'});}
const app=createApp({dbPath:process.env.INSOMNIA_DB||resolve(root,'.data/insomnia.sqlite'),secureCookie:process.env.INSOMNIA_SECURE_COOKIE==='true',allowedOrigin:process.env.INSOMNIA_ORIGIN,frontend});
app.server.listen(port,host,()=>console.log(`Insomnia ${dev?'development':'production'} server: http://${host}:${port}/\nSQLite persistence enabled; API and UI share one origin.`));
async function shutdown(){await vite?.close();await app.close();process.exit(0);}
process.once('SIGINT',shutdown);process.once('SIGTERM',shutdown);
