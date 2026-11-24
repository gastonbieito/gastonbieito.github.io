// Botón "volver a los juegos" que se agrega a cada juego publicado.
// Uso: <script src="/volver.js" data-pos="bl"></script>  (bl, br, tl, tr = esquina; data-x / data-y = margen en px)
// Pide confirmación para que nadie se salga del juego sin querer. Va dentro de un Shadow DOM para no
// mezclarse con los estilos del juego.
(function () {
  'use strict';
  if (window.top !== window || document.getElementById('volver-portal')) return;
  var me = document.currentScript || {}, ds = me.dataset || {};
  var pos = ds.pos || 'bl', mx = (ds.x || 12) + 'px', my = (ds.y || 12) + 'px';
  function destino() {
    if (ds.dest) return ds.dest; // minijuegos: vuelven al inicio
    var c = '';
    try { c = JSON.parse(localStorage.getItem('portalClase') || '""'); } catch (e) { }
    return '/' + (c ? '#/' + c : '');
  }
  function sonar(f1, f2) {
    try {
      var a = sonar.ac || (sonar.ac = new (window.AudioContext || window.webkitAudioContext)()), t = a.currentTime;
      [f1, f2].forEach(function (f, i) {
        var o = a.createOscillator(), g = a.createGain();
        o.frequency.value = f; g.gain.setValueAtTime(.0001, t + i * .06); g.gain.linearRampToValueAtTime(.05, t + i * .06 + .01); g.gain.exponentialRampToValueAtTime(.0001, t + i * .06 + .35);
        o.connect(g); g.connect(a.destination); o.start(t + i * .06); o.stop(t + i * .06 + .4);
      });
    } catch (e) { }
  }
  function montar() {
    var host = document.createElement('div');
    host.id = 'volver-portal';
    host.style.cssText = 'position:fixed;z-index:2147483647;' + (pos.charAt(0) === 't' ? 'top:' : 'bottom:') + my + ';' + (pos.charAt(1) === 'l' ? 'left:' : 'right:') + mx;
    var sh = host.attachShadow ? host.attachShadow({ mode: 'open' }) : host;
    var up = pos.charAt(0) === 't', left = pos.charAt(1) === 'l';
    sh.innerHTML = '<style>' +
      ':host,*{box-sizing:border-box;font-family:Nunito,"Segoe UI",system-ui,sans-serif}' +
      '.home{width:46px;height:46px;border-radius:50%;border:0;cursor:pointer;display:grid;place-items:center;background:linear-gradient(135deg,rgba(255,255,255,.78),rgba(255,255,255,.5));-webkit-backdrop-filter:blur(14px) saturate(180%);backdrop-filter:blur(14px) saturate(180%);box-shadow:inset 0 1px 0 rgba(255,255,255,.95),inset 0 0 0 1px rgba(255,255,255,.5),0 6px 18px rgba(20,16,60,.25);opacity:.82;transition:transform .18s cubic-bezier(.34,1.56,.64,1),opacity .18s}' +
      '.home:hover{opacity:1;transform:scale(1.08)}.home svg{width:24px;height:24px}' +
      '.ask{position:absolute;' + (up ? 'top' : 'bottom') + ':56px;' + (left ? 'left' : 'right') + ':0;width:max-content;max-width:80vw;padding:12px 14px;border-radius:18px;color:#24204a;background:linear-gradient(135deg,rgba(255,255,255,.92),rgba(255,255,255,.75));-webkit-backdrop-filter:blur(20px) saturate(180%);backdrop-filter:blur(20px) saturate(180%);box-shadow:inset 0 1px 0 #fff,0 14px 34px rgba(20,16,60,.28);animation:in .3s cubic-bezier(.34,1.56,.64,1)}' +
      '.ask[hidden]{display:none}.ask b{display:block;font-size:16px;font-weight:800;margin:0 2px 10px}' +
      '.row{display:flex;gap:8px}.row button{display:flex;align-items:center;gap:6px;border:0;border-radius:999px;padding:9px 16px;font-weight:800;font-size:15px;cursor:pointer}' +
      '.si{background:linear-gradient(180deg,#8f7bff,#6a4fe0);color:#fff;box-shadow:0 6px 14px rgba(106,79,224,.35)}.no{background:rgba(36,32,74,.08);color:#24204a}' +
      '.row svg{width:18px;height:18px}' +
      '@keyframes in{from{opacity:0;transform:translateY(' + (up ? '-' : '') + '8px) scale(.95)}}' +
      '</style>' +
      '<button class="home" type="button" aria-label="Volver a los juegos" title="Volver a los juegos"><svg viewBox="0 0 24 24"><path d="M3.5 11.2 12 4l8.5 7.2" fill="none" stroke="#24204a" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M6 10v9.5h4.5v-5.5h3v5.5H18V10" fill="#ffd23f" stroke="#24204a" stroke-width="2" stroke-linejoin="round"/></svg></button>' +
      '<div class="ask" hidden role="dialog" aria-label="Volver a los juegos"><b>¿Volver a los juegos?</b><div class="row">' +
      '<button class="si" type="button"><svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>Sí</button>' +
      '<button class="no" type="button"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18" stroke="#24204a" stroke-width="2.6" stroke-linecap="round"/></svg>Seguir jugando</button></div></div>';
    var ask = sh.querySelector('.ask');
    var stop = function (e) { e.stopPropagation(); };
    ['pointerdown', 'mousedown', 'touchstart', 'click', 'keydown'].forEach(function (t) { host.addEventListener(t, stop); });
    sh.querySelector('.home').addEventListener('click', function () { ask.hidden = !ask.hidden; if (!ask.hidden) sonar(660, 880); });
    sh.querySelector('.no').addEventListener('click', function () { ask.hidden = true; sonar(880, 660); });
    sh.querySelector('.si').addEventListener('click', function () { sonar(784, 1175); setTimeout(function () { location.href = destino(); }, 180); });
    document.body.appendChild(host);
  }
  if (document.body) montar(); else document.addEventListener('DOMContentLoaded', montar);
})();
