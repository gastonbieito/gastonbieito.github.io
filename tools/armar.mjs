// Arma el portal: copia cada juego a j/<slug>/index.html, saca una captura de su primera pantalla
// como portada (img/<slug>.jpg) y genera datos.js para la página.
//   node tools/armar.mjs   copia los juegos y genera datos.js (las portadas se dibujan solas en la página)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from 'playwright-core';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const M = JSON.parse(fs.readFileSync(path.join(root, 'tools', 'juegos.json'), 'utf8'));
const local = { lumi: '../lumi-isla/dist/index.html', lumi2: '../lumi-isla/dist/2/index.html', rumor: '../el-rumor/dist/index.html' };
const juegos = [];
for (const c of M.colegios) for (const k of c.clases) for (const j of k.juegos) {
  if (j.src) {
    const from = path.join(M.origen, j.src);
    fs.mkdirSync(path.join(root, 'j', j.slug), { recursive: true });
    // Copia el juego y le agrega el botón para volver al portal (esquina elegida en juegos.json, "volver").
    const tag = `<script src="/volver.js" data-pos="${j.volver || 'bl'}"${j.volverY ? ` data-y="${j.volverY}"` : ''}></script>` +
      // Lamparita para mandar ideas y opiniones sin volver al portal (idea.js). En Inicial no, porque todavía no escriben.
      (k.id === 'inicial' ? '' : `\n<script src="/idea.js"></script>`);
    let html = fs.readFileSync(from, 'utf8');
    const at = html.lastIndexOf('</body>');
    html = at >= 0 ? html.slice(0, at) + tag + '\n' + html.slice(at) : html + '\n' + tag + '\n';
    fs.writeFileSync(path.join(root, 'j', j.slug, 'index.html'), html);
    j.href = `j/${j.slug}/`;
    j.file = from;
  } else { j.href = j.url; j.file = path.join(root, local[j.slug]); }
  juegos.push(j);
}
// Minijuegos: van en el inicio, debajo de las clases, para todos los colegios (ej. Las teclas de Bit).
for (const j of M.minijuegos || []) {
  const from = path.join(M.origen, j.src);
  fs.mkdirSync(path.join(root, 'j', j.slug), { recursive: true });
  let html = fs.readFileSync(from, 'utf8');
  const tag = '<script src="/volver.js" data-pos="bl"></script>\n<script src="/idea.js"></script>', at = html.lastIndexOf('</body>');
  html = at >= 0 ? html.slice(0, at) + tag + '\n' + html.slice(at) : html + '\n' + tag + '\n';
  fs.writeFileSync(path.join(root, 'j', j.slug, 'index.html'), html);
  j.href = `j/${j.slug}/`; juegos.push(j);
}
const minijuegos = (M.minijuegos || []).map(({ slug, titulo, desc, href, nuevo }) => ({ slug, titulo, desc, href, nuevo: nuevo || false }));
const datos = { minijuegos, colegios: M.colegios.map(c => ({ ...c, clases: c.clases.map(k => ({ ...k, juegos: k.juegos.map(({ slug, titulo, desc, href, nuevo }) => ({ slug, titulo, desc, href, nuevo: nuevo || false })) })) })) };
fs.writeFileSync(path.join(root, 'datos.js'), '// Generado por tools/armar.mjs a partir de tools/juegos.json\nwindow.JUEGOS = ' + JSON.stringify(datos, null, 1) + ';\n');
console.log(`${juegos.length} juegos copiados y datos.js generado.`);

if (process.argv[2] === 'fotos') { // ya no se usan: las portadas son tipográficas
  const b = await chromium.launch({ channel: 'msedge', headless: true });
  const ctx = await b.newContext({ viewport: { width: 1280, height: 720 } });
  fs.mkdirSync(path.join(root, 'img'), { recursive: true });
  // Portada diseñada: fondo con el color de la clase, título grande y la captura del juego inclinada.
  const color = {};
  for (const c of M.colegios) for (const k of c.clases) for (const j of k.juegos) color[j.slug] = k.color;
  const esc = s => s.replace(/[<>&]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c]));
  const cover = await ctx.newPage();
  await cover.setViewportSize({ width: 960, height: 540 });
  for (const j of juegos) {
    const p = await ctx.newPage();
    try {
      await p.goto(pathToFileURL(j.file).href);
      await p.waitForTimeout(2800);
      const shot = (await p.screenshot({ type: 'jpeg', quality: 85 })).toString('base64');
      const c = color[j.slug], words = j.titulo.split(' ');
      await cover.setContent(`<html><head><style>
@font-face{font-family:N;font-weight:800;src:url(${pathToFileURL(path.join(root, 'fonts', 'nunito-latin-800-normal.woff2')).href})}
body{margin:0;width:960px;height:540px;overflow:hidden;font-family:N,'Segoe UI',sans-serif;background:radial-gradient(circle at 20% 15%,rgba(255,255,255,.35),transparent 45%),linear-gradient(135deg,${c},color-mix(in srgb,${c} 62%,#2a1d6e))}
.dots{position:absolute;inset:0;background-image:radial-gradient(rgba(255,255,255,.18) 2.5px,transparent 3px);background-size:34px 34px}
.t{position:absolute;left:46px;top:50%;transform:translateY(-50%);width:390px;color:#fff;font-weight:800;font-size:${j.titulo.length > 22 ? 52 : 62}px;line-height:1.02;letter-spacing:-1px;text-shadow:0 5px 0 rgba(0,0,0,.18)}
.s{position:absolute;right:-70px;top:70px;width:600px;height:338px;border-radius:26px;background:url(data:image/jpeg;base64,${shot}) center/cover;border:8px solid #fff;box-shadow:0 26px 50px rgba(20,10,60,.45);transform:rotate(-6deg)}
</style></head><body><div class="dots"></div><div class="s"></div><div class="t">${esc(j.titulo)}</div></body></html>`);
      await cover.waitForTimeout(150);
      await cover.screenshot({ path: path.join(root, 'img', j.slug + '.jpg'), type: 'jpeg', quality: 82 });
      console.log('  portada:', j.slug);
    } catch (e) { console.log('  sin portada:', j.slug, e.message); }
    await p.close();
  }
  await b.close();
}
