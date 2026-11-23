import { chromium } from 'playwright-core'; import { servir } from './servidor.mjs';
let fails = 0; const fail = m => { fails++; console.log('  FALLA:', m); };
const s = await servir(8765); const b = await chromium.launch({ channel: 'msedge', headless: true });
const ctx = await b.newContext({ viewport: { width: 1366, height: 768 } }); const p = await ctx.newPage();
const errs = []; p.on('pageerror', e => errs.push(e.message));
await p.goto('http://localhost:8765/'); await p.evaluate(() => localStorage.setItem('portalClase', JSON.stringify('scjm/6')));
for (const g of ['colla-2', 'detective-pixel', 'robotito-pintor']) {
  await p.goto(`http://localhost:8765/j/${g}/`); await p.waitForTimeout(1200);
  await p.click('#volver-portal .home'); await p.waitForTimeout(300);
  if (!(await p.isVisible('#volver-portal .ask'))) fail(g + ': no pregunta');
  if (g === 'colla-2') { await p.screenshot({ path: 'tests-out/volver-pregunta.png' }); await p.click('#volver-portal .no'); await p.waitForTimeout(200); if (await p.isVisible('#volver-portal .ask')) fail('no se cierra con Seguir jugando'); if (!p.url().includes('/j/colla-2/')) fail('Seguir jugando salió del juego'); continue; }
  await p.click('#volver-portal .si'); await p.waitForURL('**/#/scjm/6', { timeout: 5000 }).catch(() => fail(g + ': no volvió a la clase, quedó en ' + p.url()));
}
await p.goto('http://localhost:8765/lumi/'); await p.waitForTimeout(1500);
const box = await p.locator('#volver-portal').boundingBox(); if (!box || box.x < 56) fail('lumi: botón mal ubicado ' + JSON.stringify(box));
for (let i = 0; i < 3; i++) await p.mouse.click(12, 12);
if (!(await p.isVisible('#panel'))) fail('lumi: el rincón docente dejó de andar'); await p.click('#pClose');
await p.screenshot({ path: 'tests-out/volver-lumi.png' });
await p.goto('http://localhost:8765/rumor/'); await p.waitForTimeout(1500);
const bt = await p.evaluate(() => __rumor.button('portal')); if (!bt) fail('rumor: no está el botón Juegos'); else { await p.screenshot({ path: 'tests-out/volver-rumor.png' }); await p.mouse.click(bt.x, bt.y); await p.waitForURL('**/#/scjm/6', { timeout: 5000 }).catch(() => fail('rumor: no volvió')); }
errs.forEach(e => fail('error: ' + e));
await b.close(); s.close(); console.log(fails ? fails + ' problema(s)' : 'Todo en orden.'); process.exit(fails ? 1 : 0);
