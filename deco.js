// Detalles de decoración del portal (no cambian cómo funciona nada; si molestan, se saca este archivo).
// Fijos: tarjetas que se inclinan con brillo, fondo que acompaña al mouse, robotito que mira el cursor.
// Al azar: dato curioso del día (lo dice el robot), sorpresas según la fecha, bichito que a veces cruza.
// Para probar una fecha: ?fecha=2026-12-20
(function () {
  'use strict';
  var QUIETO = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var m = /[?&]fecha=(\d{4})-(\d\d)-(\d\d)/.exec(location.search);
  var HOY = m ? new Date(+m[1], +m[2] - 1, +m[3]) : new Date();
  var DIA = Math.floor((HOY - new Date(HOY.getFullYear(), 0, 0)) / 864e5);
  function tono(f, d, v, dl) {
    try {
      var a = tono.ac || (tono.ac = new (window.AudioContext || window.webkitAudioContext)()), t = a.currentTime + (dl || 0), o = a.createOscillator(), g = a.createGain();
      o.type = 'sine'; o.frequency.value = f; g.gain.setValueAtTime(.0001, t); g.gain.linearRampToValueAtTime(v || .04, t + .01);
      g.gain.exponentialRampToValueAtTime(.0001, t + d); o.connect(g); g.connect(a.destination); o.start(t); o.stop(t + d + .05);
    } catch (e) { }
  }
  function silencio() { try { return JSON.parse(localStorage.getItem('portalMute') || 'false'); } catch (e) { return false; } }

  var css = document.createElement('style');
  css.textContent =
    '.glare{position:absolute;inset:0;pointer-events:none;border-radius:inherit;opacity:0;transition:opacity .25s;background:radial-gradient(circle at var(--gx,50%) var(--gy,50%),rgba(255,255,255,.45),rgba(255,255,255,0) 55%);mix-blend-mode:soft-light;z-index:2}' +
    '.tile:hover .glare{opacity:1}' +
    '.blobs{transition:transform 1.2s cubic-bezier(.2,.8,.2,1)}' +
    '@keyframes drift2{0%{transform:translate(0,0) scale(1)}50%{transform:translate(70px,-50px) scale(1.12)}100%{transform:translate(-40px,40px) scale(.95)}}' +
    '.blobs i{animation:drift2 26s ease-in-out infinite alternate}.blobs i:nth-child(2){animation-duration:31s;animation-delay:-8s}.blobs i:nth-child(3){animation-duration:36s;animation-delay:-15s}.blobs i:nth-child(4){animation-duration:22s;animation-delay:-4s}' +
    '.robo{position:relative;flex:none;margin-left:auto;width:52px;height:52px;border:0;padding:0;background:none;cursor:pointer}' +
    '.robo + .me{margin-left:0}' +
    '.robo svg{width:100%;height:100%;overflow:visible;transition:transform .25s cubic-bezier(.34,1.56,.64,1)}' +
    '.robo:hover svg{transform:rotate(-6deg)}.robo.salta svg{animation:roboSalta .6s cubic-bezier(.34,1.56,.64,1)}' +
    '@keyframes roboSalta{40%{transform:translateY(-14px) rotate(8deg)}}' +
    '.robo .ant{animation:ant 2.4s ease-in-out infinite;transform-origin:26px 12px}@keyframes ant{50%{transform:rotate(12deg)}}' +
    '.robo .ojos{animation:parpadeo 4.6s infinite;transform-box:fill-box;transform-origin:center}@keyframes parpadeo{0%,92%,100%{transform:scaleY(1)}95%{transform:scaleY(.12)}}' +
    '.robo .cuerpo{transition:fill .4s}' +
    '.globo{position:absolute;top:60px;right:-10px;width:290px;padding:14px 18px 15px;border-radius:18px;background:#fff;color:#24204a;font:700 15px/1.45 Nunito,"Segoe UI",sans-serif;text-wrap:pretty;text-align:left;box-shadow:0 10px 30px rgba(36,32,74,.2);cursor:default;animation:globo .35s cubic-bezier(.34,1.56,.64,1);z-index:6}' +
    '.globo::before{content:"";position:absolute;top:-7px;right:30px;width:14px;height:14px;background:#fff;transform:rotate(45deg)}' +
    '.globo b{display:block;color:#7b5cff;font-size:15px;font-weight:800;margin-bottom:5px}' +
    '.globo .pa{display:inline-block;white-space:nowrap}.globo .le{display:inline-block;animation:tiembla 1.1s ease-in-out infinite}' +
    '@keyframes tiembla{0%,100%{transform:translate(0,0) rotate(0)}25%{transform:translate(.5px,-.6px) rotate(1.2deg)}50%{transform:translate(-.4px,.4px) rotate(-1deg)}75%{transform:translate(.3px,.5px) rotate(.8deg)}}' +
    '@keyframes globo{from{opacity:0;transform:translateY(-8px) scale(.9)}}' +
    '.estrellas{position:fixed;inset:0;pointer-events:none;z-index:0;overflow:hidden}' +
    '.estrellas i{position:absolute;top:-30px;font-style:normal;animation:cae linear infinite;opacity:.8}' +
    '@keyframes cae{to{transform:translateY(110vh) rotate(360deg)}}' +
    '.banderines{position:fixed;left:0;right:0;height:40px;pointer-events:none;z-index:4}' +
    '.bicho{position:fixed;bottom:6px;left:-60px;width:44px;height:36px;z-index:4;cursor:pointer;animation:camina 11s linear forwards}' +
    '.bicho svg{width:100%;height:100%;image-rendering:pixelated}.bicho .p2{display:none}.bicho.paso .p1{display:none}.bicho.paso .p2{display:inline}' +
    '.bicho.salta{animation-play-state:paused}.bicho.salta svg{animation:roboSalta .5s}' +
    '@keyframes camina{to{left:calc(100vw + 60px)}}';
  document.head.appendChild(css);

  /* ---------- Tarjetas que se inclinan hacia el cursor, con un reflejo ---------- */
  if (!QUIETO) {
    var actual = null;
    document.addEventListener('mousemove', function (e) {
      var t = e.target.closest && e.target.closest('.tile');
      if (actual && actual !== t) { actual.style.transform = ''; actual = null; }
      if (!t) return;
      actual = t;
      if (!t.querySelector('.glare')) { var g = document.createElement('span'); g.className = 'glare'; t.appendChild(g); }
      var r = t.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      t.style.setProperty('--gx', x * 100 + '%'); t.style.setProperty('--gy', y * 100 + '%');
      t.style.transform = 'translateY(-4px) perspective(800px) rotateX(' + ((.5 - y) * 7).toFixed(2) + 'deg) rotateY(' + ((x - .5) * 9).toFixed(2) + 'deg)';
    });
    document.addEventListener('mousedown', function (e) { var t = e.target.closest && e.target.closest('.tile'); if (t) t.style.transform = 'translateY(2px) scale(.98)'; });
    // El fondo acompaña un poquito al mouse.
    var blobs = document.querySelector('.blobs');
    if (blobs) document.addEventListener('mousemove', function (e) {
      blobs.style.transform = 'translate(' + ((e.clientX / innerWidth - .5) * -30).toFixed(1) + 'px,' + ((e.clientY / innerHeight - .5) * -24).toFixed(1) + 'px)';
    });
  }

  /* ---------- Robotito que mira el mouse y cuenta un dato curioso ---------- */
  var DATOS = [
    'El primer mouse, de 1964, era una cajita de madera con dos ruedas.',
    'La palabra "bug" para los errores se hizo famosa cuando encontraron una polilla dentro de una compu, en 1947.',
    'Ada Lovelace escribió el primer programa de la historia, ¡en 1843!',
    'La primera página web de la historia todavía se puede visitar: info.cern.ch.',
    'Las compus guardan todo con unos y ceros: fotos, música y hasta este texto.',
    'Un píxel es un puntito de color. Tu pantalla tiene millones.',
    'Con Ctrl + Z deshacés lo último que hiciste.',
    '"Hardware" es lo que podés tocar. "Software" son los programas.',
    'El primer disco duro, de 1956, pesaba casi una tonelada.',
    'La "nube" son computadoras que están en otros lugares del mundo.',
    'Un robot no piensa solo: sigue las instrucciones que alguien programó.',
    'Con el Plan Ceibal, desde 2007 cada escolar de Uruguay tiene su compu.',
    'Una contraseña larga es mucho más difícil de adivinar que una corta.',
    'El código QR se inventó en Japón en 1994.',
    'El primer mensaje de texto de celular, en 1992, decía "Merry Christmas".',
    'Un algoritmo es una receta: pasos en orden para resolver algo.',
    'Las primeras computadoras ocupaban una habitación entera.',
    'En 1997, la compu Deep Blue le ganó al campeón mundial de ajedrez.',
    'Cada emoji es, para la compu, un número.',
    'El teclado QWERTY se inventó para las máquinas de escribir.',
    'La tecla Esc viene de "escape": sirve para cancelar.',
    'Un video es un montón de fotos que pasan muy rápido.',
    'En binario, el número 2 se escribe 10.',
    'El GPS sabe dónde estás gracias a satélites que giran alrededor de la Tierra.',
    'Los videojuegos se programan con órdenes como SI, REPETIR y MIENTRAS.',
    'Internet es una red enorme de compus conectadas por cables, ¡algunos van por el fondo del mar!',
    'El símbolo @ se lee "arroba".',
    'Pong, uno de los primeros videojuegos famosos, salió en 1972.'
  ];
  var DIC = HOY.getMonth() === 11, PATRIA = { '5-19': 1, '6-18': 1, '7-25': 1 }[HOY.getMonth() + '-' + HOY.getDate()];
  var GORRO = DIC ? '<path d="M14 13 Q24 -6 40 8 L36 14 Z" fill="#ef476f"/><circle cx="41" cy="7" r="3.4" fill="#fff"/><rect x="12" y="12" width="28" height="5" rx="2.5" fill="#fff"/>' : '';
  var ROBO = '<svg viewBox="0 0 52 52"><g class="ant"><line x1="26" y1="12" x2="26" y2="4" stroke="#24204a" stroke-width="2.5" stroke-linecap="round"/><circle cx="26" cy="4" r="3.2" fill="#ffd23f" stroke="#24204a" stroke-width="1.5"/></g>' +
    '<rect class="cuerpo" x="8" y="12" width="36" height="28" rx="11" fill="#9b7bff" stroke="#24204a" stroke-width="2.5"/><rect x="13" y="17" width="26" height="17" rx="7" fill="#fff"/>' +
    '<g class="ojos"><circle class="ojo" cx="20" cy="25.5" r="3.6" fill="#24204a"/><circle class="ojo" cx="32" cy="25.5" r="3.6" fill="#24204a"/></g>' +
    '<rect x="5" y="22" width="4" height="9" rx="2" fill="#ffd23f" stroke="#24204a" stroke-width="1.5"/><rect x="43" y="22" width="4" height="9" rx="2" fill="#ffd23f" stroke="#24204a" stroke-width="1.5"/>' +
    '<path d="M21 40 v5 M31 40 v5" stroke="#24204a" stroke-width="2.5" stroke-linecap="round"/>' + GORRO + '</svg>';
  var robo = document.createElement('button'); robo.type = 'button'; robo.className = 'robo'; robo.setAttribute('aria-label', 'Bit, el robot: tocalo para un dato curioso'); robo.title = 'Bit';
  robo.innerHTML = ROBO;
  var me = document.querySelector('header .me'), header = document.querySelector('header');
  if (header) header.insertBefore(robo, me || null);
  var ojos = robo.querySelectorAll('.ojo');
  document.addEventListener('mousemove', function (e) {
    var r = robo.getBoundingClientRect(); if (!r.width) return;
    var dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2), d = Math.sqrt(dx * dx + dy * dy) || 1, k = Math.min(1, d / 120);
    for (var i = 0; i < ojos.length; i++) ojos[i].setAttribute('transform', 'translate(' + (dx / d * 2.4 * k).toFixed(2) + ',' + (dy / d * 2.4 * k).toFixed(2) + ')');
  });
  var globo = null, tGlobo = 0, recientes = [];
  // Elige un dato al azar sin repetir los últimos; a veces uno de la ciudad del colegio de la compu.
  function unDato() {
    var B = window.BIT_DATOS || { general: DATOS }, cole = '';
    try { cole = JSON.parse(localStorage.getItem('portalMiColegio') || '""'); } catch (x) { }
    var local = cole === 'mta' ? B.helvecia : cole === 'scjm' ? B.rosario : null;
    var lista = local && local.length && Math.random() < .2 ? local : (B.general || DATOS), d, n = 0;
    do { d = lista[Math.floor(Math.random() * lista.length)]; } while (recientes.indexOf(d) >= 0 && ++n < 30);
    recientes.push(d); if (recientes.length > 40) recientes.shift();
    return d;
  }
  // Cada letra tiembla apenas, con su propio ritmo (las palabras no se cortan).
  function temblar(t) {
    if (QUIETO) return t;
    return t.split(' ').map(function (p) {
      return '<span class="pa">' + Array.from(p).map(function (c) { return '<span class="le" style="animation-delay:-' + (Math.random() * 1.1).toFixed(2) + 's">' + c + '</span>'; }).join('') + '</span>';
    }).join(' ');
  }
  function decir(titulo, texto, ms) {
    cerrarGlobo();
    globo = document.createElement('div'); globo.className = 'globo'; globo.innerHTML = '<b>' + temblar(titulo) + '</b>' + temblar(texto);
    globo.addEventListener('click', function (e) { e.stopPropagation(); cerrarGlobo(); });
    robo.appendChild(globo);
    clearTimeout(tGlobo); tGlobo = setTimeout(cerrarGlobo, ms || 9000);
  }
  function cerrarGlobo() { if (globo && globo.parentNode) globo.parentNode.removeChild(globo); globo = null; }
  function saltar(el) { el.classList.remove('salta'); void el.offsetWidth; el.classList.add('salta'); setTimeout(function () { el.classList.remove('salta'); }, 650); }
  robo.addEventListener('click', function (e) {
    if (e.target.closest('.globo')) return;
    saltar(robo);
    if (!silencio()) { tono(880, .12, .04); tono(1320, .14, .03, .09); }
    if (globo) { cerrarGlobo(); return; }
    // La primera vez en cada compu, Bit se presenta.
    var conocido = ''; try { conocido = localStorage.getItem('portalBit'); localStorage.setItem('portalBit', '1'); } catch (x) { }
    if (!conocido) { decir('¡Hola!', 'Soy Bit, el robot del Rincón Digital. Tocame cuando quieras y te cuento un dato curioso.'); return; }
    decir('¿Sabías que…?', unDato());
  });
  // Bit toma el color del colegio de la compu (azul en SCJM, naranja en MTA).
  var COLORES = { scjm: '#2a5fc4', mta: '#e0731f' }, cuerpo = robo.querySelector('.cuerpo');
  function pintarBit() { var c = ''; try { c = JSON.parse(localStorage.getItem('portalMiColegio') || '""'); } catch (x) { } cuerpo.setAttribute('fill', COLORES[c] || '#9b7bff'); }
  pintarBit();
  window.addEventListener('hashchange', pintarBit);
  document.addEventListener('click', function () { setTimeout(pintarBit, 60); });
  document.addEventListener('click', function (e) { if (globo && !e.target.closest('.robo')) cerrarGlobo(); });
  // En el inicio, el robot cuenta el dato del día una vez por día en cada compu.
  var hoyTxt = HOY.toDateString();
  var intentos = 0;
  setTimeout(function contar() {
    if (location.hash.replace(/^#\/?/, '') || document.querySelector('.modal:not([hidden])')) return;
    // Si está la invitación a contar una idea, espera a que se cierre (no dos carteles a la vez).
    var toast = document.getElementById('ideaToast');
    if (toast && !toast.hidden) { if (++intentos < 24) setTimeout(contar, 5000); return; }
    var visto = ''; try { visto = localStorage.getItem('portalDato'); } catch (e) { }
    if (visto === hoyTxt && !m) return;
    try { localStorage.setItem('portalDato', hoyTxt); } catch (e) { }
    var fiesta = DIC && HOY.getDate() >= 15 ? ['¡Felices fiestas!', 'Gracias por jugar y aprender todo el año.'] : PATRIA ? ['¡Viva la patria!', 'Hoy es un día patrio en Uruguay.'] : null;
    var yaLoConocen = ''; try { yaLoConocen = localStorage.getItem('portalBit'); localStorage.setItem('portalBit', '1'); } catch (x) { }
    if (!yaLoConocen) decir('¡Hola!', 'Soy Bit, el robot del Rincón Digital. Tocame cuando quieras y te cuento un dato curioso.');
    else if (fiesta) decir(fiesta[0], fiesta[1]); else { decir('¿Sabías que…?', unDato()); }
    saltar(robo);
  }, 5000);

  /* ---------- Sorpresas según la fecha ---------- */
  if (DIC && !QUIETO) {
    var est = document.createElement('div'); est.className = 'estrellas'; est.setAttribute('aria-hidden', 'true');
    var h = '';
    for (var i = 0; i < 16; i++) h += '<i style="left:' + (Math.random() * 100).toFixed(1) + '%;font-size:' + (13 + Math.random() * 15).toFixed(0) + 'px;animation-duration:' + (12 + Math.random() * 14).toFixed(1) + 's;animation-delay:-' + (Math.random() * 20).toFixed(1) + 's;color:' + ['#ffc61a', '#9b7bff', '#ff8a65', '#4fc3f7'][i % 4] + '">★</i>';
    est.innerHTML = h; document.body.insertBefore(est, document.body.firstChild.nextSibling);
  }
  if (PATRIA) {
    var ban = document.createElement('div'); ban.className = 'banderines'; ban.setAttribute('aria-hidden', 'true');
    var w = 40, n = Math.ceil(innerWidth / w) + 1, s = '<svg width="100%" height="40" preserveAspectRatio="none"><path d="M0 4 Q' + innerWidth / 2 + ' 18 ' + innerWidth + ' 4" stroke="#8b97c2" stroke-width="1.5" fill="none"/>';
    for (var j = 0; j < n; j++) { var x = j * w, y = 4 + 14 * Math.sin(Math.PI * x / innerWidth); s += '<path d="M' + x + ' ' + y + ' l' + (w - 6) + ' 0 l-' + ((w - 6) / 2) + ' 22 z" fill="' + (j % 2 ? '#5fa8e8' : '#ffffff') + '" stroke="#c9d6ef" stroke-width="1"/>'; }
    ban.innerHTML = s + '</svg>'; document.body.appendChild(ban);
    ban.style.top = (header ? header.getBoundingClientRect().bottom : 0) + 'px';
  }

  /* ---------- Bichito pixelado que a veces cruza por abajo ---------- */
  function px(m, col) {
    var s = '';
    m.forEach(function (fila, y) { for (var x = 0; x < fila.length; x++) if (fila[x] !== '.') s += '<rect x="' + x + '" y="' + y + '" width="1.05" height="1.05" fill="' + col[fila[x]] + '"/>'; });
    return s;
  }
  var COL = { g: '#2fbf8f', d: '#1d7f5e', w: '#ffffff', k: '#24204a', y: '#ffd23f' };
  var CUERPO = ['...y....y...', '....d..d....', '..gggggggg..', '.gggggggggg.', '.ggwkggwkgg.', '.gggggggggg.', 'gggddddddggg', '.gggggggggg.'];
  var P1 = ['..k..k..k...', '.k..k..k....'], P2 = ['...k..k..k..', '....k..k..k.'];
  function cruzar() {
    if (document.hidden || document.querySelector('.modal:not([hidden])') || document.querySelector('.bicho')) return;
    var b = document.createElement('div'); b.className = 'bicho'; b.setAttribute('aria-label', 'Bichito');
    b.innerHTML = '<svg viewBox="0 0 12 10"><g>' + px(CUERPO, COL) + '</g><g class="p1" transform="translate(0 8)">' + px(P1, COL) + '</g><g class="p2" transform="translate(0 8)">' + px(P2, COL) + '</g></svg>';
    document.body.appendChild(b);
    var paso = setInterval(function () { b.classList.toggle('paso'); }, 180);
    b.addEventListener('click', function () { saltar(b); if (!silencio()) { tono(1200, .08, .04); tono(1600, .1, .03, .07); } });
    b.addEventListener('animationend', function (e) { if (e.animationName === 'camina') { clearInterval(paso); b.parentNode && b.parentNode.removeChild(b); } });
  }
  function programar() { setTimeout(function () { if (Math.random() < .7) cruzar(); programar(); }, (45 + Math.random() * 75) * 1000); }
  if (!QUIETO) programar();
  window.portalDeco = { cruzar: cruzar, decir: decir };
})();
