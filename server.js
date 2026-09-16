import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const publicFiles = new Map([
  ['/', ['index.html', 'text/html']],
  ['/index.html', ['index.html', 'text/html']],
  ['/style.css', ['style.css', 'text/css']],
  ['/app.js', ['app.js', 'text/javascript']],
  ['/worker.js', ['worker.js', 'text/javascript']],
]);

export function createServer() {
  return http.createServer(async (request, response) => {
    response.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    response.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
    response.setHeader('X-Content-Type-Options', 'nosniff');
    const file = publicFiles.get(new URL(request.url, 'http://localhost').pathname);
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
  const port = Number(process.env.PORT || 3000);
  createServer().listen(port, () => console.log(`PythOnline is available at http://localhost:${port}`));
}
