import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = normalize(join(fileURLToPath(new URL('.', import.meta.url)), '..'));
const port = Number(process.env.ISIKSADE_PORT || 8788);

const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8'
};

function safePath(pathname) {
  const decoded = decodeURIComponent(pathname).replace(/^\/+/, '');
  const resolved = normalize(join(root, decoded));
  return resolved.startsWith(root) ? resolved : null;
}

async function resolveFile(pathname) {
  if (pathname === '/') return join(root, 'index.html');

  const direct = safePath(pathname);
  if (!direct) return null;

  const candidates = extname(direct)
    ? [direct]
    : [direct + '.html', join(direct, 'index.html')];

  for (const candidate of candidates) {
    try {
      if ((await stat(candidate)).isFile()) return candidate;
    } catch {}
  }
  return null;
}

createServer(async (request, response) => {
  try {
    const url = new URL(request.url || '/', 'http://localhost');
    const file = await resolveFile(url.pathname);

    if (!file) {
      response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      response.end('404 — Sayfa bulunamadı');
      return;
    }

    response.writeHead(200, {
      'Content-Type': types[extname(file).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff'
    });
    response.end(await readFile(file));
  } catch (error) {
    response.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('500 — Yerel sunucu hatası');
    console.error(error);
  }
}).listen(port, () => {
  console.log(`Işık & Sade yerel önizleme: http://localhost:${port}`);
  console.log('Temiz URL desteği aktif: /is-hukuku → /is-hukuku.html');
});
