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
  console.log('Render checks passed: both heroes, primary action, TechText, and MeadowScene.');
} finally {
  await server.close();
}
