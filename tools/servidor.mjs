// Servidor local que imita el sitio publicado: / = portal, /lumi/ y /rumor/ = sus juegos.
// Uso en pruebas: import { servir } from './servidor.mjs'; const s = await servir(8765); ... s.close();
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const MAP = [['/lumi/', path.join(root, '..', 'lumi-isla', 'docs')], ['/rumor/', path.join(root, '..', 'el-rumor', 'docs')], ['/', root]];
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css', '.woff2': 'font/woff2', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg' };
export function servir(port = 8765) {
  return new Promise(res => {
    const s = http.createServer((req, out) => {
      const u = decodeURIComponent(req.url.split('?')[0].split('#')[0]);
      const [pre, dir] = MAP.find(([p]) => u.startsWith(p));
      let f = path.join(dir, u.slice(pre.length));
      if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, 'index.html');
      if (!f.startsWith(dir) || !fs.existsSync(f)) { out.writeHead(404); return out.end('no'); }
      out.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' });
      fs.createReadStream(f).pipe(out);
    });
    s.listen(port, () => res(s));
  });
}
