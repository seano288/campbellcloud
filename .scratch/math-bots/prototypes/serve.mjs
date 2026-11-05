// Review server for the prototypes: static files with byte ranges (Safari video needs them). node serve.mjs [port]
import { createServer } from 'node:http';
import { createReadStream, statSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';
const root = import.meta.dirname, port = +(process.argv[2] ?? 5190);
const types = { '.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.wasm':'application/wasm','.png':'image/png','.jpg':'image/jpeg','.mp4':'video/mp4','.webm':'video/webm','.ktx2':'image/ktx2','.glb':'model/gltf-binary','.bin':'application/octet-stream','.env':'application/octet-stream' };
createServer((req, res) => {
  let p = normalize(decodeURIComponent(req.url.split('?')[0]));
  if (p.endsWith('/')) p += 'index.html';
  const f = join(root, p);
  let s; try { s = statSync(f); if (!f.startsWith(root) || s.isDirectory()) throw 0; } catch { res.writeHead(404).end('not found'); return; }
  const h = { 'Content-Type': types[extname(f)] ?? 'application/octet-stream', 'Accept-Ranges': 'bytes' };
  const m = /bytes=(\d*)-(\d*)/.exec(req.headers.range ?? '');
  if (m) {
    const a = m[1] ? +m[1] : s.size - +m[2], b = m[1] && m[2] ? +m[2] : s.size - 1;
    res.writeHead(206, { ...h, 'Content-Range': `bytes ${a}-${b}/${s.size}`, 'Content-Length': b - a + 1 });
    createReadStream(f, { start: a, end: b }).pipe(res);
  } else { res.writeHead(200, { ...h, 'Content-Length': s.size }); createReadStream(f).pipe(res); }
}).listen(port, '0.0.0.0', () => console.log(`http://localhost:${port}/`));
