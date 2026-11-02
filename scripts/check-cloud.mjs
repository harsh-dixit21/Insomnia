import assert from 'node:assert/strict';

// Read-only smoke checks: no account creation, credentials, or database writes.
const base = new URL(process.argv[2] || 'https://insomnia-iomete.vercel.app');
if (!['https:', 'http:'].includes(base.protocol) || base.username || base.password || base.pathname !== '/' || base.search || base.hash) {
  throw new Error('Pass an HTTP(S) origin without credentials, a path, or a query.');
}
async function request(path, status, type) {
  const response = await fetch(new URL(path, base), {redirect:'manual', signal:AbortSignal.timeout(20000)});
  assert.equal(response.status, status, `${path}: expected ${status}, received ${response.status} (a redirect may indicate deployment protection)`);
  assert.ok(response.headers.get('content-type')?.includes(type), `${path}: expected ${type}`);
  return response;
}
const checks = [
  ['Landing page', async () => {
    const html = await (await request('/', 200, 'text/html')).text();
    assert.match(html, /\/docs\/insomnia-documentation\.pdf/, 'Documentation link is missing');
  }],
  ['Portal entry point', async () => {
    const html = await (await request('/portal/', 200, 'text/html')).text();
    assert.match(html, /<script[^>]*\bsrc=/i, 'Portal JavaScript entry point is missing');
  }],
  ['Documentation PDF', async () => {
    const bytes = Buffer.from(await (await request('/docs/insomnia-documentation.pdf', 200, 'application/pdf')).arrayBuffer());
    assert.equal(bytes.subarray(0, 5).toString(), '%PDF-', 'Documentation response is not a PDF');
  }],
  ['Backend health', async () => {
    const health = await (await request('/api/health', 200, 'application/json')).json();
    assert.equal(health.status, 'ok');
    assert.ok(['postgres', 'sqlite'].includes(health.storage), 'Backend did not report supported storage');
  }],
  ['Anonymous session', async () => {
    const session = await (await request('/api/session', 200, 'application/json')).json();
    assert.equal(session.user, null, 'Anonymous request received a signed-in user');
  }],
  ['Private workspace guard', async () => {
    const body = await (await request('/api/workspace', 401, 'application/json')).json();
    assert.equal(typeof body.error, 'string', 'Private route must explain why access was denied');
  }],
];
const results = await Promise.allSettled(checks.map(async ([label, run]) => {
  await run();
  return label;
}));
let failures = 0;
results.forEach((result, index) => {
  if (result.status === 'fulfilled') console.log(`PASS ${result.value}`);
  else { failures++; console.error(`FAIL ${checks[index][0]}: ${result.reason.message}`); }
});
console.log(`${checks.length - failures}/${checks.length} checks passed for ${base.origin}.`);
console.log('These checks do not verify authenticated workflows or external integrations.');
if (failures) process.exitCode = 1;
