import { chromium } from 'playwright-core';
import path from 'node:path'; import fs from 'node:fs'; import { fileURLToPath, pathToFileURL } from 'node:url';
const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const base = process.env.URL || pathToFileURL(path.join(root, 'index.html')).href;
const out = path.join(root, 'tests-out'); fs.mkdirSync(out, { recursive: true });
let fails = 0; const fail = m => { fails++; console.log('  FALLA:', m); };
// Perfil de prueba (sin dibujo: la página lo dibuja sola al cargar).
const PERFIL = { v: 1, n: 'Juli', e: 'adventurer', o: { adventurer: { hair: 'long03', hairColor: 'ac6511', skinColor: 'f2d3b1', eyes: 'variant05', eyebrows: 'variant03', mouth: 'variant10', glasses: null, earrings: null, features: null } }, fondo: 'cielo', marco: 'arcoiris', ins: 'estrella', color: '#9b7bff' };
const conPerfil = p => p.addInitScript(x => { if (!localStorage.getItem('portalPerfil')) localStorage.setItem('portalPerfil', x); }, JSON.stringify(PERFIL));
const b = await chromium.launch({ channel: process.env.CANAL || 'msedge', headless: true });
for (const [w, h] of [[1366, 768], [1024, 600], [390, 844]]) {
  const ctx = await b.newContext({ viewport: { width: w, height: h } }); const p = await ctx.newPage(); await conPerfil(p);
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); }); p.on('requestfailed', r => errs.push('no carga ' + r.url()));
  for (const [hash, name] of [['', 'inicio'], ['#/scjm', 'scjm'], ['#/scjm/6', 'scjm-6'], ['#/mta/5', 'mta-5'], ['#/scjm/inicial', 'scjm-inicial']]) {
    await p.goto(base.split('#')[0] + hash); await p.waitForTimeout(900);
    if (await p.isVisible('#pf')) fail(`${w}x${h} ${name}: aparece el editor de perfil con un perfil ya guardado`);
    if (!hash && !(await p.textContent('h1')).includes('Juli')) fail(`${w}x${h}: el saludo no usa el apodo`);
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
// Perfil: la primera vez aparece el editor; se arma, queda guardado al recargar y se puede editar.
for (const [w, h] of [[1366, 768], [1024, 600], [390, 844]]) {
  const ctx = await b.newContext({ viewport: { width: w, height: h } }); const p = await ctx.newPage(); const v = `perfil ${w}x${h}`;
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); }); p.on('requestfailed', r => errs.push('no carga ' + r.url()));
  const shot = n => p.screenshot({ path: path.join(out, `perfil-${w}x${h}-${n}.png`) });
  const guardado = () => p.evaluate(() => JSON.parse(localStorage.getItem('portalPerfil')));
  await p.goto(base.split('#')[0]); await p.waitForTimeout(1800);
  if (!(await p.isVisible('#pf'))) { fail(v + ': no aparece el editor la primera vez'); await ctx.close(); continue; }
  const r = await p.evaluate(() => { const b = document.querySelector('.pfb').getBoundingClientRect(); return { b: Math.round(b.bottom - innerHeight), r: Math.round(b.right - innerWidth), l: b.left, t: b.top, sx: document.documentElement.scrollWidth - innerWidth }; });
  if (r.b > 0 || r.r > 0 || r.l < 0 || r.t < 0 || r.sx > 0) fail(v + ': el editor no entra en la pantalla ' + JSON.stringify(r));
  if (await p.locator('#pf .opts img').count() < 4) fail(v + ': faltan las miniaturas de estilos');
  await shot('nuevo');
  await p.click('#pf [data-ok]'); await p.waitForTimeout(300);
  if (!(await p.textContent('#pf .thanks')).includes('nombre')) fail(v + ': deja guardar sin nombre');
  if (await guardado()) fail(v + ': guardó un perfil sin nombre');
  await p.fill('#pfNombre', 'Juli');
  await p.click('#pf .tabs [data-t="1"]'); await p.waitForTimeout(200);
  const n = await p.locator('#pf .opts button').count(); if (n < 5) fail(v + ': la pestaña Pelo muestra ' + n + ' opciones');
  await p.click('#pf .opts [data-i="3"]'); await p.waitForTimeout(200);
  if (!(await p.getAttribute('#pf .opts [data-i="3"]', 'class')).includes('on')) fail(v + ': no queda marcada la opción elegida');
  await shot('pelo');
  await p.click('#pf .tabs button >> text=Fondo'); await p.click('#pf .opts [data-i="8"]'); await p.waitForTimeout(150);
  await p.click('#pf .tabs button >> text=Marco'); await p.waitForTimeout(150); await shot('marco');
  await p.click('#pf [data-azar]'); await p.waitForTimeout(1200);
  await p.click('#pf [data-ok]'); await p.waitForTimeout(500);
  if (!(await p.isVisible('#pf .pfd'))) fail(v + ': no aparece el festejo al terminar');
  await shot('listo'); await p.waitForTimeout(2400);
  if (await p.isVisible('#pf')) fail(v + ': el editor no se cierra después de guardar');
  let g = await guardado();
  if (!g || g.n !== 'Juli' || !String(g.img).startsWith('data:image/svg')) fail(v + ': no se guardó bien el perfil ' + JSON.stringify(g && { n: g.n, e: g.e }));
  if (!(await p.textContent('#me')).includes('Juli')) fail(v + ': el encabezado no muestra el apodo');
  if (!(await p.textContent('h1')).includes('Juli')) fail(v + ': el saludo no usa el apodo');
  await p.reload(); await p.waitForTimeout(1500);
  if (await p.isVisible('#pf')) fail(v + ': vuelve a aparecer el editor después de guardar');
  if (!(await p.textContent('#me')).includes('Juli') || !(await p.isVisible('#me img'))) fail(v + ': al recargar no aparece el perfil');
  await shot('guardado');
  await p.click('#me'); await p.waitForTimeout(800);
  if (!(await p.isVisible('#pf')) || (await p.inputValue('#pfNombre')) !== 'Juli') fail(v + ': tocar el avatar no abre el perfil para editarlo');
  await p.click('#pf .tabs [data-t="0"]'); await p.click('#pf .opts [data-i="2"]'); await p.fill('#pfNombre', 'Juli M');
  await p.click('#pf [data-ok]'); await p.waitForTimeout(2800);
  g = await guardado(); if (!g || g.n !== 'Juli M' || g.e !== 'lorelei') fail(v + ': no se guardó la edición ' + JSON.stringify(g && { n: g.n, e: g.e }));
  await p.click('.hola .yo', { force: true }); await p.waitForTimeout(500); await p.keyboard.press('Escape'); await p.waitForTimeout(300);
  if (await p.isVisible('#pf')) fail(v + ': Escape no cierra el editor');
  if (await p.evaluate(() => location.hash.length > 2)) fail(v + ': Escape cambió de página');
  await shot('editado');
  errs.forEach(e => fail(`${v} consola: ${e}`));
  await ctx.close();
}
// Cerrar sin guardar: no vuelve a aparecer mientras siga abierta la página.
{
  const ctx = await b.newContext({ viewport: { width: 1366, height: 768 } }); const p = await ctx.newPage();
  await p.goto(base.split('#')[0]); await p.waitForTimeout(1800);
  await p.click('#pf [data-x]'); await p.waitForTimeout(300);
  if (await p.isVisible('#pf')) fail('perfil: la cruz no cierra el editor');
  await p.reload(); await p.waitForTimeout(1500);
  if (await p.isVisible('#pf')) fail('perfil: insiste después de cerrarlo');
  if (!(await p.textContent('#me')).includes('Mi perfil')) fail('perfil: sin perfil no aparece el botón "Mi perfil"');
  await ctx.close();
}
// Ideas: con un formulario simulado, la invitación aparece sola, se abre la ventana y se envía la idea.
{
  const ctx = await b.newContext({ viewport: { width: 1366, height: 768 } }); const p = await ctx.newPage();
  await conPerfil(p);
  await p.addInitScript(() => { window.RINCON = { form: 'PRUEBA', campos: { tipo: '111', clase: '222', idea: '333' } }; localStorage.setItem('portalClase', JSON.stringify('scjm/6')); });
  let body = null;
  await p.route('https://docs.google.com/**', async r => { body = r.request().postData() || ''; await r.fulfill({ status: 200, body: 'ok' }); });
  await p.goto(base.split('#')[0]); await p.waitForTimeout(4300);
  if (!(await p.isVisible('#ideaToast'))) fail('ideas: no aparece la invitación');
  await p.screenshot({ path: path.join(out, 'ideas-invitacion.png') });
  await p.click('#ideaToast [data-open]'); await p.waitForTimeout(400);
  await p.click('#fIdea .send'); await p.waitForTimeout(400);
  if (!(await p.textContent('#fIdea .thanks')).includes('Escribí tu idea')) fail('ideas: no aparece el aviso propio con la idea vacía');
  if (body) fail('ideas: mandó una idea vacía');
  await p.screenshot({ path: path.join(out, 'ideas-vacia.png') });
  await p.fill('#fIdea textarea', 'Un juego de detectives en el espacio');
  await p.screenshot({ path: path.join(out, 'ideas-ventana.png') });
  await p.route('https://docs.google.com/**', async r => { body = r.request().postData() || ''; await new Promise(x => setTimeout(x, 900)); await r.fulfill({ status: 200, body: 'ok' }); });
  await p.click('#fIdea .send'); await p.waitForTimeout(700);
  if (!(await p.isVisible('#fIdea .viaje'))) fail('ideas: no aparece el viaje de la idea');
  await p.screenshot({ path: path.join(out, 'ideas-viajando.png') });
  await p.waitForTimeout(2600);
  if (!(await p.isVisible('#fIdea .done'))) fail('ideas: no aparece la animación de enviado');
  await p.screenshot({ path: path.join(out, 'ideas-enviada.png') }); await p.waitForTimeout(400);
  if (!body || !body.includes('Un juego de detectives') || !body.includes('entry.222') || !body.includes('scjm 6') || body.includes('Juli')) fail('ideas: no se envió bien: ' + body);
  await p.goto(base.split('#')[0] + '#/scjm/6'); await p.waitForTimeout(500);
  if (await p.isVisible('#ideaBtn')) fail('ideas: el botón aparece fuera del inicio');
  await ctx.close();
}
await b.close(); console.log(fails ? fails + ' problema(s)' : 'Todo en orden.'); process.exit(fails ? 1 : 0);
