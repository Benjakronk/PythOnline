import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const publicFiles = new Map([
  ['/', ['index.html', 'text/html']],
  ['/index.html', ['index.html', 'text/html']],
  ['/style.css', ['style.css', 'text/css']],
  ['/app.js', ['app.js', 'text/javascript']],
  ['/i18n.js', ['i18n.js', 'text/javascript']],
  ['/worker.js', ['worker.js', 'text/javascript']],
  ['/isolation.js', ['isolation.js', 'text/javascript']],
  ['/isolation-sw.js', ['isolation-sw.js', 'text/javascript']],
]);

export function createServer({ isolation = true, basePath = '' } = {}) {
  return http.createServer(async (request, response) => {
    if (isolation) {
      response.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
      response.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
    }
    response.setHeader('X-Content-Type-Options', 'nosniff');
    const path = new URL(request.url, 'http://localhost').pathname;
    const file = path.startsWith(basePath + '/') ? publicFiles.get(path.slice(basePath.length)) : undefined;
    if (!file) { response.writeHead(404).end('Not found'); return; }
    try {
      const content = await readFile(new URL(file[0], import.meta.url));
      response.writeHead(200, { 'Content-Type': `${file[1]}; charset=utf-8` });
      response.end(content);
    } catch {
      response.writeHead(500).end('Unable to load file');
    }
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const pages = process.argv.includes('--pages');
  const port = Number(process.env.PORT || (pages ? 3001 : 3000));
  createServer({ isolation: !pages, basePath: pages ? '/PythOnline' : '' }).listen(port, () => console.log(`PythOnline is available at http://localhost:${port}${pages ? '/PythOnline/' : ''}`));
}
