import { chromium } from 'playwright-core'; import fs from 'node:fs'; import path from 'node:path';
import { servir } from './servidor.mjs';
const M = JSON.parse(fs.readFileSync('tools/juegos.json', 'utf8'));
const slugs = []; for (const c of M.colegios) for (const k of c.clases) for (const j of k.juegos) if (j.src) slugs.push(j.slug);
const s = await servir(8765); const b = await chromium.launch({ channel: 'msedge', headless: true });
const ctx = await b.newContext({ viewport: { width: 1366, height: 768 } }); fs.mkdirSync('tests-out/volver', { recursive: true });
const errs = [];
for (const sl of slugs) { const p = await ctx.newPage(); p.on('pageerror', e => errs.push(sl + ': ' + e.message)); await p.goto(`http://localhost:8765/j/${sl}/`); await p.waitForTimeout(2500);
  const ok = await p.evaluate(() => !!document.getElementById('volver-portal')); if (!ok) errs.push(sl + ': sin botón');
  await p.screenshot({ path: `tests-out/volver/${sl}.png` }); await p.close(); }
const imgs = slugs.map(sl => `<figure><img src="data:image/png;base64,${fs.readFileSync(`tests-out/volver/${sl}.png`).toString('base64')}"><figcaption>${sl}</figcaption></figure>`).join('');
const sheet = await ctx.newPage(); await sheet.setViewportSize({ width: 1600, height: 1400 });
await sheet.setContent(`<style>body{margin:0;display:grid;grid-template-columns:repeat(4,1fr);gap:6px;font:12px sans-serif}img{width:100%;display:block}figure{margin:0}</style>${imgs}`);
await sheet.screenshot({ path: 'tests-out/volver-hoja.png', fullPage: true });
await b.close(); s.close(); console.log(errs.length ? errs.join('\n') : 'todos con botón');
