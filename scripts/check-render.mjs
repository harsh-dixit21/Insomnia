import assert from 'node:assert/strict';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { createServer } from 'vite';

const server = await createServer({ server: { middlewareMode: true } });
try {
  const { default: App } = await server.ssrLoadModule('/src/App.jsx');
  const html = renderToString(React.createElement(App));
  assert.ok(html.includes('Clarity before commitment.'), 'First hero must render');
  assert.ok(html.includes('Built on proof.'), 'Second hero must render');
  assert.ok(html.includes('Map your evaluation'), 'Primary action must render');

  const { default: TechText } = await server.ssrLoadModule('/src/TechText.jsx');
  assert.ok(renderToString(React.createElement(TechText, { text: 'commitment.' })).includes('<canvas'));
  const { default: MeadowScene } = await server.ssrLoadModule('/src/MeadowScene.jsx');
  assert.ok(renderToString(React.createElement(MeadowScene, {
    motion: { current: { progress: 0, reduced: false } },
    paused: { current: false },
  })).includes('webgl-scene'));
  const { default: ErrorBoundary } = await server.ssrLoadModule('/src/ErrorBoundary.jsx');
  const recovery = new ErrorBoundary({});
  recovery.state = ErrorBoundary.getDerivedStateFromError(new Error('Example render failure'));
  const recoveryHtml = renderToString(recovery.render());
  assert.ok(recoveryHtml.includes('role="alert"'), 'Render failures must show an accessible recovery message');
  assert.ok(recoveryHtml.includes('Reload ProofPlan'), 'Recovery must offer a retry action');
  assert.ok(renderToString(React.createElement(ErrorBoundary, null, 'Healthy page')).includes('Healthy page'));
  console.log('Render checks passed: heroes, components, and error recovery.');
} finally {
  await server.close();
}
