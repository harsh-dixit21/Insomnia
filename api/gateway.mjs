import http from 'node:http';
import https from 'node:https';

// Keep the browser and its HttpOnly session cookie on the Vercel origin.
// SQLite and long-lived services run exclusively on the persistent backend.
export default function gateway(req, res) {
  const fail = (status, error) => {
    if (res.headersSent) return res.destroy();
    res.writeHead(status, {'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});
    res.end(JSON.stringify({error}));
  };
  let backend;
  try {
    backend = new URL(process.env.INSOMNIA_BACKEND_URL);
    if (backend.protocol !== 'https:' || backend.username || backend.password || backend.pathname !== '/' || backend.search || backend.hash) throw new Error();
  } catch {
    return fail(503, 'The hosted backend is not connected yet. Please try again after the administrator completes backend setup.');
  }
  const incoming = new URL(req.url, 'https://insomnia.invalid');
  const route = incoming.searchParams.get('__path') || incoming.pathname.replace(/^\/api\//, '');
  // Prevent path traversal or routing outside the backend API.
  if (!/^[a-zA-Z0-9/_-]+$/.test(route) || route.includes('//')) return fail(400, 'Invalid API path.');
  incoming.searchParams.delete('__path');
  const target = new URL('/api/' + route, backend);
  target.search = incoming.searchParams.toString();
  const headers = {};
  for (const name of ['accept','content-type','cookie','origin','x-insomnia-request','x-csrf-token','x-workspace-id']) {
    if (req.headers[name]) headers[name] = req.headers[name];
  }
  // Vercel can supply a parsed body; native Node tests supply a request stream.
  const body = req.body === undefined ? undefined : Buffer.isBuffer(req.body) ? req.body : Buffer.from(typeof req.body === 'string' ? req.body : JSON.stringify(req.body));
  if (body) headers['content-length'] = String(body.length);
  const upstream = (target.protocol === 'https:' ? https : http).request(target, {method:req.method, headers}, response => {
    const output = {'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
    for (const name of ['content-type','content-disposition','set-cookie','location','retry-after']) {
      if (response.headers[name]) output[name] = response.headers[name];
    }
    res.writeHead(response.statusCode || 502, output);
    response.on('error', () => res.destroy());
    response.pipe(res);
  });
  const deadline = setTimeout(() => upstream.destroy(new Error('Backend deadline exceeded')), 95000);
  upstream.on('close', () => clearTimeout(deadline));
  upstream.on('error', () => fail(502, 'The hosted backend is temporarily unavailable. Please try again shortly.'));
  res.on('close', () => { if (!res.writableFinished) upstream.destroy(); });
  if (body !== undefined) upstream.end(body);
  else req.pipe(upstream);
}
