import { chromium } from 'playwright-core';
import path from 'node:path'; import fs from 'node:fs'; import { fileURLToPath, pathToFileURL } from 'node:url';
const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const base = process.env.URL || pathToFileURL(path.join(root, 'index.html')).href;
const out = path.join(root, 'tests-out'); fs.mkdirSync(out, { recursive: true });
let fails = 0; const fail = m => { fails++; console.log('  FALLA:', m); };
const b = await chromium.launch({ channel: process.env.CANAL || 'msedge', headless: true });
for (const [w, h] of [[1366, 768], [1024, 600], [390, 844]]) {
  const ctx = await b.newContext({ viewport: { width: w, height: h } }); const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); }); p.on('requestfailed', r => errs.push('no carga ' + r.url()));
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
  const n = await p.locator('.game').count(); if (n !== 3) fail(`${w}x${h}: MTA 6.º muestra ${n} juegos`);
  await p.evaluate(() => localStorage.setItem('portalRecientes', JSON.stringify([{ s: 'rumor', w: 'scjm/6', t: 1 }, { s: 'helvecio-boveda', w: 'mta/5', t: 0 }])));
  await p.click('.crumb >> text=Inicio'); await p.waitForTimeout(700);
  if ((await p.locator('.badge.go').count()) !== 2) fail(`${w}x${h}: no aparece Seguir jugando`);
  await p.screenshot({ path: path.join(out, `${w}x${h}-inicio-seguir.png`), fullPage: w < 600 });
  await p.fill('#q', 'helvecio'); await p.waitForTimeout(300);
  const hits = await p.locator('#results .game').count(); if (hits !== 4) fail(`${w}x${h}: buscar helvecio dio ${hits}`);
  await p.screenshot({ path: path.join(out, `${w}x${h}-busqueda.png`), fullPage: w < 600 });
  await p.fill('#q', '');
  await p.keyboard.press('Escape'); await p.goto(base.split('#')[0] + '#/scjm/6'); await p.waitForTimeout(500); await p.keyboard.press('Escape'); await p.waitForTimeout(300);
  if (!(await p.evaluate(() => location.hash === '#/scjm'))) fail(`${w}x${h}: Escape no vuelve atrás`);
  errs.forEach(e => fail(`${w}x${h} consola: ${e}`));
  await ctx.close();
}
// Ideas: con un formulario simulado, la invitación aparece sola, se abre la ventana y se envía la idea.
{
  const ctx = await b.newContext({ viewport: { width: 1366, height: 768 } }); const p = await ctx.newPage();
  await p.addInitScript(() => { window.RINCON = { form: 'PRUEBA', campos: { tipo: '111', clase: '222', idea: '333' } }; localStorage.setItem('portalClase', JSON.stringify('scjm/6')); });
  let body = null;
  await p.route('https://docs.google.com/**', async r => { body = r.request().postData() || ''; await r.fulfill({ status: 200, body: 'ok' }); });
  await p.goto(base.split('#')[0]); await p.waitForTimeout(4300);
  if (!(await p.isVisible('#ideaToast'))) fail('ideas: no aparece la invitación');
  await p.screenshot({ path: path.join(out, 'ideas-invitacion.png') });
  await p.click('#ideaToast [data-open]'); await p.waitForTimeout(400);
  await p.fill('#fIdea textarea', 'Un juego de detectives en el espacio');
  await p.screenshot({ path: path.join(out, 'ideas-ventana.png') });
  await p.click('#fIdea .send'); await p.waitForTimeout(800);
  if (!body || !body.includes('Un juego de detectives') || !body.includes('entry.222') || !body.includes('scjm 6')) fail('ideas: no se envió bien: ' + body);
  await p.goto(base.split('#')[0] + '#/scjm/6'); await p.waitForTimeout(500);
  if (await p.isVisible('#ideaBtn')) fail('ideas: el botón aparece fuera del inicio');
  await ctx.close();
  const c2 = await b.newContext({ viewport: { width: 1366, height: 768 } }); const p2 = await c2.newPage();
  await p2.goto(base.split('#')[0]); await p2.waitForTimeout(800);
  if (await p2.locator('#ideaBtn').count()) fail('ideas: aparece sin formulario configurado');
  await c2.close();
}
await b.close(); console.log(fails ? fails + ' problema(s)' : 'Todo en orden.'); process.exit(fails ? 1 : 0);
