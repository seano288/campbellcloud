// A tiny static server over dist-site, so a tour can run against the production build with its service workers.
//   npx tsx tools/math-bots/serve.ts 5211
import { createReadStream, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '../../dist-site'), port = Number(process.argv[2] ?? 5211);
const TYPES: Record<string, string> = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.mp3': 'audio/mpeg', '.wasm': 'application/wasm', '.woff': 'font/woff', '.woff2': 'font/woff2',
};
createServer((req, res) => {
  const path = decodeURIComponent((req.url ?? '/').split('?')[0]!);
  let file = join(root, normalize(path));
  try { if (statSync(file).isDirectory()) file = join(file, 'index.html'); statSync(file); } catch { res.writeHead(404).end('not found'); return; }
  res.writeHead(200, { 'Content-Type': TYPES[extname(file)] ?? 'application/octet-stream', 'Cache-Control': 'no-cache' });
  createReadStream(file).pipe(res);
}).listen(port, () => console.log(`http://localhost:${port}/`));
