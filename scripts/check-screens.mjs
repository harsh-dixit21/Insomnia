import assert from 'node:assert/strict';
import {createServer} from 'vite';
import React from 'react';
import {renderToString} from 'react-dom/server';
// Server-side component smoke check; no browser, effects, or network requests.
globalThis.location={hash:'#dashboard'};
globalThis.document={hidden:false};
const server=await createServer({server:{middlewareMode:true}});
try {
 const {WorkspaceProvider}=await server.ssrLoadModule('/src/components/workspace/store.tsx');
 const {default:Dashboard}=await server.ssrLoadModule('/src/components/ui/app-1.tsx');
 const {AuthPage}=await server.ssrLoadModule('/src/components/ui/auth-page.tsx');
 const auth=renderToString(React.createElement(WorkspaceProvider,null,React.createElement(AuthPage)));
 assert.ok(auth.includes('Your ProofPlan workspace'));
 for(const route of ['dashboard','evaluations','new','workloads','requirements','tests','evidence','companies','reports','activity','settings','blockers','evaluation/EVAL-001']){
  location.hash='#'+route;
  const html=renderToString(React.createElement(WorkspaceProvider,null,React.createElement(Dashboard)));
  assert.ok(html.includes('ProofPlan'),`${route} must show its product identity`);
  assert.ok(!html.includes('FDR-'),`${route} must not contain old financial records`);
 }
 console.log('Screen render check passed: auth and all 13 workspace routes.');
}finally{await server.close();delete globalThis.location;delete globalThis.document;}
