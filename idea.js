// Ideas al terminar un juego (lo agrega tools/armar.mjs, igual que volver.js). Mientras juegan no se ve nada:
// cuando el juego termina, llama a window.portalIdea('fin') y sale una tarjetita chica abajo a la derecha
// ("Contar" / "Ahora no"), una vez por juego y por día. "Contar" abre la ventana para mandar una idea o una opinión.
// El colegio sale de la clase desde la que entraron al juego (portalClase); el grado se toca una vez por día.
(function () {
  'use strict';
  if (window.top !== window || document.getElementById('idea-portal')) return;
  var ls = {
    get: function (k, d) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { } }
  };
  var HOY = new Date().toDateString();
  var slug = (location.pathname.match(/\/j\/([^\/]+)/) || [])[1] || '';
  var D = null, R = null, juego = '', colegio = null, clase = null;

  function cargar(src, cb) { var s = document.createElement('script'); s.src = src; s.onload = cb; s.onerror = cb; document.head.appendChild(s); }
  function datos() {
    D = window.JUEGOS; R = window.RINCON;
    if (!D) return;
    var pc = String(ls.get('portalClase', '') || '').split('/');
    D.colegios.forEach(function (c) {
      c.clases.forEach(function (k) {
        k.juegos.forEach(function (j) { if (j.slug === slug) juego = j.titulo; });
        if (c.id === pc[0] && k.id === pc[1]) { colegio = c; clase = k; }
      });
    });
  }
  function grados() {
    if (!clase) return [];
    var g = []; (clase.nombre + ' ' + (clase.detalle || '')).replace(/Inicial|\d\.º/g, function (m) { if (g.indexOf(m) < 0) g.push(m); return m; });
    return g;
  }

  var AC = null;
  function tono(f, d, v, dl) {
    try {
      AC = AC || new (window.AudioContext || window.webkitAudioContext)();
      var t = AC.currentTime + (dl || 0), o = AC.createOscillator(), g = AC.createGain();
      o.type = 'sine'; o.frequency.value = f; g.gain.setValueAtTime(.0001, t); g.gain.linearRampToValueAtTime(v || .05, t + .01);
      g.gain.exponentialRampToValueAtTime(.0001, t + d); o.connect(g); g.connect(AC.destination); o.start(t); o.stop(t + d + .05);
    } catch (e) { }
  }

  var LAMP = '<svg viewBox="0 0 24 24" width="26" height="26"><path d="M12 2.5a6.5 6.5 0 0 0-3.9 11.7c.6.5.9 1.1.9 1.8V17h6v-1c0-.7.3-1.3.9-1.8A6.5 6.5 0 0 0 12 2.5z" fill="#ffd23f" stroke="#24204a" stroke-width="1.4"/><rect x="9" y="18.2" width="6" height="2" rx="1" fill="#24204a"/><rect x="10" y="21" width="4" height="1.6" rx=".8" fill="#24204a"/></svg>';
  var CSS = ':host{all:initial}*{box-sizing:border-box;font-family:"Segoe UI",Nunito,system-ui,sans-serif}' +
    '.card{position:fixed;right:16px;bottom:16px;width:300px;padding:16px 16px 14px;border-radius:18px;background:#fff;color:#24204a;box-shadow:0 12px 34px rgba(20,20,60,.3);animation:sube .35s ease-out}' +
    '@keyframes sube{from{opacity:0;transform:translateY(16px)}}' +
    '.card .cab{display:flex;gap:10px;align-items:center;margin-bottom:12px}.card .cab svg{flex:none;width:30px;height:30px}.card b{font-size:17px;line-height:1.3}.row{display:flex;gap:8px}' +
    'button.p{border:0;border-radius:12px;padding:10px 16px;font-weight:800;font-size:15px;cursor:pointer;background:#24204a;color:#fff}' +
    'button.s{border:0;border-radius:12px;padding:10px 16px;font-weight:800;font-size:15px;cursor:pointer;background:#eef1fb;color:#24204a}' +
    '.velo{position:fixed;inset:0;background:rgba(10,12,30,.55);display:flex;align-items:center;justify-content:center}' +
    '.modal{width:min(540px,92vw);padding:24px 26px 22px;border-radius:24px;background:#fff;color:#24204a;box-shadow:0 20px 60px rgba(0,0,0,.4)}' +
    '.modal h2{margin:0 0 14px;font-size:24px}.lbl{font-weight:800;font-size:14px;color:#6b6790;margin:12px 0 6px}' +
    '.pills{display:flex;gap:8px;flex-wrap:wrap}.pills label{cursor:pointer}.pills input{position:absolute;opacity:0;pointer-events:none}' +
    '.pills span{display:inline-block;padding:9px 14px;border-radius:12px;background:#eef1fb;font-weight:800;font-size:15px}' +
    '.pills input:checked+span{background:#24204a;color:#fff}.pills input:focus-visible+span{outline:3px solid #ffd23f}' +
    'textarea{width:100%;height:110px;margin-top:4px;padding:12px;border-radius:14px;border:2px solid #d6def5;font-size:17px;resize:none;color:#24204a}' +
    'textarea:focus{outline:none;border-color:#24204a}.pie{display:flex;align-items:center;gap:10px;margin-top:14px}.msg{flex:1;font-weight:800;color:#d6365a;font-size:14px}' +
    '.ok{text-align:center;padding:16px 0 6px}.ok h2{font-size:28px}';

  var host, root;
  function montar() {
    host = document.createElement('div'); host.id = 'idea-portal';
    host.style.cssText = 'position:fixed;z-index:2147483646;top:0;left:0;width:0;height:0';
    root = host.attachShadow ? host.attachShadow({ mode: 'open' }) : host;
    root.innerHTML = '<style>' + CSS + '</style><div id="capa"></div>';
    document.body.appendChild(host);
    // Que las teclas que se escriben acá no le lleguen al juego.
    ['keydown', 'keyup', 'keypress'].forEach(function (t) { host.addEventListener(t, function (e) { if (abierto) e.stopPropagation(); }); });
    cargar('/config.js', function () { cargar('/datos.js', datos); });
  }

  var abierto = false, tarjeta = false;
  function capa(html) { root.querySelector('#capa').innerHTML = html; }

  // Tarjetita chica que no tapa el juego. Sale una vez por juego y por día.
  function avisar(titulo) {
    if (abierto || tarjeta) return;
    var vistos = ls.get('ideaAvisos', {}); if (vistos.d !== HOY) vistos = { d: HOY };
    if (vistos[slug || location.pathname]) return;
    vistos[slug || location.pathname] = 1; ls.set('ideaAvisos', vistos);
    tarjeta = true;
    capa('<div class="card"><div class="cab">' + LAMP + '<b>' + (titulo || '¿Te gustó?') + '<br>Contale al profe tu idea o qué te pareció.</b></div><div class="row"><button class="p" data-a="contar">Contar</button><button class="s" data-a="no">Ahora no</button></div></div>');
    tono(660, .15, .04); tono(990, .2, .035, .1);
    root.querySelector('[data-a=contar]').onclick = abrir;
    root.querySelector('[data-a=no]').onclick = cerrar;
  }

  function abrir() {
    if (!D) datos();
    abierto = true; tarjeta = false;
    var g = grados(), hoy = ls.get('ideaGrado', {}), gSel = g.length === 1 ? g[0] : (hoy.d === HOY && hoy.c === (clase && clase.id) && g.indexOf(hoy.g) >= 0 ? hoy.g : '');
    var html = '<div class="velo" data-a="fondo"><form class="modal" autocomplete="off"><h2>Contale al profe</h2>' +
      '<div class="pills">' +
      '<label><input type="radio" name="tipo" value="Juego nuevo" checked><span>Un juego nuevo</span></label>' +
      '<label><input type="radio" name="tipo" value="Algo para aprender"><span>Algo para aprender</span></label>' +
      (juego ? '<label><input type="radio" name="tipo" value="Opinión"><span>Qué me pareció este juego</span></label>' : '') + '</div>' +
      (g.length > 1 ? '<div class="lbl">¿En qué grado estás?</div><div class="pills">' + g.map(function (x) { return '<label><input type="radio" name="grado" value="' + x + '"' + (x === gSel ? ' checked' : '') + '><span>' + x + '</span></label>'; }).join('') + '</div>' : '') +
      '<div class="lbl">Tu idea</div><textarea name="idea" maxlength="500" placeholder="Escribí acá..."></textarea>' +
      '<div class="pie"><span class="msg"></span><button type="button" class="s" data-a="no">Cerrar</button><button class="p" type="submit">Mandar</button></div></form></div>';
    capa(html);
    var f = root.querySelector('form');
    root.querySelector('[data-a=no]').onclick = cerrar;
    root.querySelector('.velo').addEventListener('mousedown', function (e) { if (e.target.getAttribute('data-a') === 'fondo') cerrar(); });
    f.addEventListener('keydown', function (e) { if (e.key === 'Escape') cerrar(); });
    f.addEventListener('submit', function (e) { e.preventDefault(); mandar(f, g); });
    tono(520, .12, .04);
    setTimeout(function () { f.idea.focus(); }, 60);
  }

  function mandar(f, g) {
    var msg = root.querySelector('.msg'), idea = f.idea.value.trim(), tipo = f.querySelector('input[name=tipo]:checked').value;
    var gr = f.querySelector('input[name=grado]:checked'), grado = g.length === 1 ? g[0] : (gr ? gr.value : '');
    if (!idea) { msg.textContent = 'Escribí tu idea primero.'; f.idea.focus(); return; }
    if (g.length > 1 && !grado) { msg.textContent = 'Tocá tu grado.'; return; }
    if (!R || !R.form) { msg.textContent = 'No se pudo mandar. Probá desde el portal.'; return; }
    var q = ls.get('portalEnvios', { d: HOY, n: 0 }); if (q.d !== HOY) q = { d: HOY, n: 0 };
    if (q.n >= 5) { msg.textContent = 'Por hoy ya está. ¡Gracias!'; return; }
    if (clase && grado) ls.set('ideaGrado', { d: HOY, c: clase.id, g: grado });
    var val = { tipo: tipo, clase: colegio ? colegio.nombre + (grado ? ' ' + grado : '') : 'Sin clase', idea: tipo === 'Opinión' && juego ? '[' + juego + '] ' + idea : idea };
    var fd = new FormData();
    Object.keys(R.campos).forEach(function (k) { if (R.campos[k]) fd.append('entry.' + R.campos[k], val[k] || ''); });
    f.querySelector('button[type=submit]').disabled = true; msg.textContent = '';
    fetch('https://docs.google.com/forms/d/e/' + R.form + '/formResponse', { method: 'POST', mode: 'no-cors', body: fd }).then(function () {
      q.n++; ls.set('portalEnvios', q);
      root.querySelector('.modal').innerHTML = '<div class="ok"><h2>¡Gracias!</h2><div style="font-size:18px">Tu idea ya le llegó al profe.</div></div>';
      [523, 659, 784].forEach(function (fr, i) { tono(fr, .25, .05, i * .1); });
      setTimeout(cerrar, 1800);
    }, function () { f.querySelector('button[type=submit]').disabled = false; msg.textContent = 'No se pudo mandar. Probá de nuevo.'; });
  }

  function cerrar() { abierto = false; tarjeta = false; capa(''); }

  // Los juegos llaman a esto cuando se termina la partida.
  window.portalIdea = function () { setTimeout(function () { avisar('¡Terminaste!'); }, 1500); };

  if (document.body) montar(); else document.addEventListener('DOMContentLoaded', montar);
})();
