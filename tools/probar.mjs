import { chromium } from 'playwright-core';
import path from 'node:path'; import fs from 'node:fs'; import { fileURLToPath, pathToFileURL } from 'node:url';
const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const base = process.env.URL || pathToFileURL(path.join(root, 'index.html')).href;
const out = path.join(root, 'tests-out'); fs.mkdirSync(out, { recursive: true });
let fails = 0; const fail = m => { fails++; console.log('  FALLA:', m); };
const b = await chromium.launch({ channel: process.env.CANAL || 'msedge', headless: true });
for (const [w, h] of [[1366, 768], [1024, 600], [390, 844]]) {
  const ctx = await b.newContext({ viewport: { width: w, height: h } }); const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  for (const [hash, name] of [['', 'inicio'], ['#/scjm', 'scjm'], ['#/scjm/6', 'scjm-6'], ['#/mta/5', 'mta-5'], ['#/scjm/inicial', 'scjm-inicial']]) {
    await p.goto(base.split('#')[0] + hash); await p.waitForTimeout(900);
    const sx = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    if (sx > 0) fail(`${w}x${h} ${name}: se desborda ${sx}px a lo ancho`);
    const broken = await p.evaluate(() => [...document.images].filter(i => i.complete && !i.naturalWidth).length + [...document.querySelectorAll('.shot')].filter(s => !s.style.backgroundImage).length);
    if (broken) fail(`${w}x${h} ${name}: ${broken} imágenes rotas`);
    await p.screenshot({ path: path.join(out, `${w}x${h}-${name}.png`), fullPage: w < 600 });
  }
  // Navegación: inicio -> colegio -> clase -> volver con "Seguir en".
  await p.goto(base.split('#')[0]); await p.click('[data-colegio="mta"]'); await p.waitForTimeout(500); await p.click('[data-clase="mta/6"]'); await p.waitForTimeout(500);
  const n = await p.locator('.game').count(); if (n !== 2) fail(`${w}x${h}: MTA 6.º muestra ${n} juegos`);
  await p.click('.crumb >> text=Inicio'); await p.waitForTimeout(500);
  if (!(await p.locator('[data-resume]').count())) fail(`${w}x${h}: no aparece "Seguir en"`);
  errs.forEach(e => fail(`${w}x${h} consola: ${e}`));
  await ctx.close();
}
await b.close(); console.log(fails ? fails + ' problema(s)' : 'Todo en orden.'); process.exit(fails ? 1 : 0);
