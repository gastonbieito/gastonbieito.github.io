// Arma avatar/dicebear.js: la librería DiceBear (https://github.com/dicebear/dicebear) con los cuatro estilos
// del portal, en un solo archivo que la página carga desde el propio sitio (no pide nada a internet).
// Uso: npm install && node tools/avatar.mjs
import { build } from 'esbuild';
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const estilos = { adventurer: 'adventurer', bigSmile: 'big-smile', lorelei: 'lorelei', notionists: 'notionists' };
const entrada = `import { createAvatar } from '@dicebear/core';\n` +
  Object.entries(estilos).map(([k, p]) => `import * as ${k} from '@dicebear/${p}';`).join('\n') +
  `\nwindow.DiceBear = { createAvatar, estilos: { ${Object.keys(estilos).join(', ')} } };\n`;
await build({ stdin: { contents: entrada, resolveDir: root }, bundle: true, minify: true, format: 'iife', target: 'es2017', outfile: path.join(root, 'avatar/dicebear.js'), legalComments: 'eof' });
// Licencias de la librería y de cada diseño, copiadas tal cual.
const lic = ['core', ...Object.values(estilos)].map(p => `===== @dicebear/${p} =====\n` + fs.readFileSync(path.join(root, 'node_modules/@dicebear', p, 'LICENSE'), 'utf8')).join('\n\n');
fs.writeFileSync(path.join(root, 'avatar/LICENCIAS.txt'), 'Avatares hechos con DiceBear (https://www.dicebear.com). Los dibujos se usan sin cambios, combinando sus partes.\n\n' + lic);
console.log('avatar/dicebear.js', (fs.statSync(path.join(root, 'avatar/dicebear.js')).size / 1024).toFixed(0) + ' KB');
