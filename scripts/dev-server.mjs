import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const publicRoot = path.join(root, 'public');
const port = Number(process.env.PORT || 3000);
const mime = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml'
};

function resolveRequest(pathname) {
  const decoded = decodeURIComponent(pathname);
  if (decoded === '/' || decoded === '/index.html') return path.join(root, 'index.html');
  if (decoded === '/manus-routes.json' || decoded === '/robots.txt' || decoded === '/sitemap.xml' || decoded.startsWith('/assets/')) {
    return path.join(publicRoot, decoded.slice(1));
  }
  const target = path.resolve(root, `.${decoded}`);
  return target.startsWith(`${root}${path.sep}`) ? target : null;
}

createServer(async (request, response) => {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    response.writeHead(405, { Allow: 'GET, HEAD' }).end();
    return;
  }
  let pathname;
  try { pathname = new URL(request.url, 'http://localhost').pathname; }
  catch { response.writeHead(400).end('Bad request'); return; }
  let target;
  try { target = resolveRequest(pathname); }
  catch { response.writeHead(400).end('Bad request'); return; }
  if (!target) { response.writeHead(404).end('Not found'); return; }
  try {
    const info = await stat(target);
    if (!info.isFile()) throw new Error('Not a file');
    const body = await readFile(target);
    response.writeHead(200, {
      'Content-Type': mime[path.extname(target).toLowerCase()] || 'application/octet-stream',
      'Content-Length': body.length,
      'Cache-Control': 'no-cache'
    });
    response.end(request.method === 'HEAD' ? undefined : body);
  } catch {
    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Not found');
  }
}).listen(port, '0.0.0.0', () => {
  console.log(`Eastlink homepage listening on http://0.0.0.0:${port}`);
});
