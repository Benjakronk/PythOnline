import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from './server.js';

test('serves the workspace with shared-memory headers and restricts file access', async () => {
  const server = createServer();
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    for (const path of ['/', '/app.js', '/i18n.js', '/worker.js', '/style.css', '/isolation.js', '/isolation-sw.js', '/pwa.js', '/manifest.webmanifest', '/icons/icon.svg', '/icons/icon-192.png', '/icons/icon-512.png']) {
      const response = await fetch(base + path);
      assert.equal(response.status, 200);
      assert.equal(response.headers.get('Cross-Origin-Opener-Policy'), 'same-origin');
      assert.equal(response.headers.get('Cross-Origin-Embedder-Policy'), 'require-corp');
      assert.ok((await response.text()).length > 0);
    }
    for (const path of ['/package.json', '/server.js', '/.env', '/..%2fpackage.json']) {
      assert.equal((await fetch(base + path)).status, 404);
    }
  } finally { await new Promise((resolve) => server.close(resolve)); }
});
