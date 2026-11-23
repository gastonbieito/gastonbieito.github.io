// Arma el portal: copia cada juego a j/<slug>/index.html, saca una captura de su primera pantalla
// como portada (img/<slug>.jpg) y genera datos.js para la página.
//   node tools/armar.mjs            todo
//   node tools/armar.mjs sin-fotos  solo copia y datos
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from 'playwright-core';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const M = JSON.parse(fs.readFileSync(path.join(root, 'tools', 'juegos.json'), 'utf8'));
const local = { lumi: '../lumi-isla/dist/index.html', rumor: '../el-rumor/dist/index.html' };
const juegos = [];
for (const c of M.colegios) for (const k of c.clases) for (const j of k.juegos) {
  if (j.src) {
    const from = path.join(M.origen, j.src);
    fs.mkdirSync(path.join(root, 'j', j.slug), { recursive: true });
    fs.copyFileSync(from, path.join(root, 'j', j.slug, 'index.html'));
    j.href = `j/${j.slug}/`;
    j.file = from;
  } else { j.href = j.url; j.file = path.join(root, local[j.slug]); }
  juegos.push(j);
}
const datos = { colegios: M.colegios.map(c => ({ ...c, clases: c.clases.map(k => ({ ...k, juegos: k.juegos.map(({ slug, titulo, desc, href, nuevo }) => ({ slug, titulo, desc, href, nuevo: !!nuevo })) })) })) };
fs.writeFileSync(path.join(root, 'datos.js'), '// Generado por tools/armar.mjs a partir de tools/juegos.json\nwindow.JUEGOS = ' + JSON.stringify(datos, null, 1) + ';\n');
console.log(`${juegos.length} juegos copiados y datos.js generado.`);

if (process.argv[2] !== 'sin-fotos') {
  const b = await chromium.launch({ channel: 'msedge', headless: true });
  const ctx = await b.newContext({ viewport: { width: 960, height: 540 } });
  fs.mkdirSync(path.join(root, 'img'), { recursive: true });
  for (const j of juegos) {
    const p = await ctx.newPage();
    try {
      await p.goto(pathToFileURL(j.file).href);
      await p.waitForTimeout(2800);
      await p.screenshot({ path: path.join(root, 'img', j.slug + '.jpg'), type: 'jpeg', quality: 78 });
      console.log('  portada:', j.slug);
    } catch (e) { console.log('  sin portada:', j.slug, e.message); }
    await p.close();
  }
  await b.close();
}
