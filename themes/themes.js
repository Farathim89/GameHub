/* ============================================================
   GAME HUB — THEME ENGINE
   Applies saved theme, injects a 🎨 picker on every page,
   and protects against Chrome's forced dark mode.
   Include with:  <script src="../themes/themes.js" defer></script>
   ============================================================ */
(function () {
  'use strict';
  var KEY = 'gamehub.theme';

  var THEMES = [
    { id: 'dark',      name: 'CLASSIC DARK', swatch: 'linear-gradient(135deg,#080808 60%,#f0c040)' },
    { id: 'felt',      name: 'CASINO FELT',  swatch: 'radial-gradient(circle,#14562e,#052514)' },
    { id: 'wood',      name: 'WOOD TABLE',   swatch: 'linear-gradient(180deg,#3a2410,#170e06)' },
    { id: 'neon',      name: 'NEON ARCADE',  swatch: 'linear-gradient(135deg,#3a1a7a,#00e5ff)' },
    { id: 'midnight',  name: 'MIDNIGHT',     swatch: 'linear-gradient(180deg,#0a1630,#04080f)' },
    { id: 'wallpaper', name: 'MY WALLPAPER', swatch: 'linear-gradient(135deg,#444,#888)' }
  ];

  /* ---- force-dark protection: declare our own color scheme ---- */
  if (!document.querySelector('meta[name="color-scheme"]')) {
    var m = document.createElement('meta');
    m.name = 'color-scheme';
    m.content = 'dark';
    document.head.appendChild(m);
  }

  function apply(id) {
    document.documentElement.setAttribute('data-theme', id);
    try { localStorage.setItem(KEY, id); } catch (e) {}
    var panel = document.getElementById('theme-panel');
    if (panel) {
      panel.querySelectorAll('.theme-opt').forEach(function (el) {
        el.classList.toggle('active', el.dataset.theme === id);
      });
    }
  }

  function current() {
    try { return localStorage.getItem(KEY) || 'dark'; } catch (e) { return 'dark'; }
  }

  /* apply immediately (script is deferred, DOM exists) */
  document.documentElement.setAttribute('data-theme', current());

  function buildUI() {
    /* mark hub page so wallpaper path resolves from root */
    if (!/\/games\//.test(location.pathname)) document.body.classList.add('at-root');

    var fab = document.createElement('button');
    fab.id = 'theme-fab';
    fab.title = 'Change theme';
    fab.textContent = '🎨';

    var overlay = document.createElement('div');
    overlay.id = 'theme-overlay';
    var panel = document.createElement('div');
    panel.id = 'theme-panel';
    panel.innerHTML = '<h3>🎨 SELECT THEME</h3>';
    var grid = document.createElement('div');
    grid.className = 'theme-grid';

    THEMES.forEach(function (t) {
      var opt = document.createElement('div');
      opt.className = 'theme-opt' + (t.id === current() ? ' active' : '');
      opt.dataset.theme = t.id;
      opt.innerHTML = '<div class="theme-swatch" style="background:' + t.swatch + '"></div>' +
                      '<div class="theme-name">' + t.name + '</div>';
      opt.addEventListener('click', function () { apply(t.id); });
      grid.appendChild(opt);
    });

    panel.appendChild(grid);
    overlay.appendChild(panel);
    fab.addEventListener('click', function () { overlay.classList.add('show'); });
    overlay.addEventListener('click', function (e) { if (e.target === overlay) overlay.classList.remove('show'); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') overlay.classList.remove('show'); });

    document.body.appendChild(fab);
    document.body.appendChild(overlay);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', buildUI);
  } else {
    buildUI();
  }

  /* sync theme across open tabs/windows */
  window.addEventListener('storage', function (e) {
    if (e.key === KEY && e.newValue) apply(e.newValue);
  });

  /* ── server heartbeat: lets the local server shut down when the app window closes ── */
  if ((location.hostname === 'localhost' || location.hostname === '127.0.0.1') && location.port === '8123') {
    try { navigator.sendBeacon('/__hi'); } catch (e) {}
    setInterval(function () {
      fetch('/__ping', { cache: 'no-store' }).catch(function () {});
    }, 5000);
    window.addEventListener('pagehide', function () {
      try { navigator.sendBeacon('/__bye'); } catch (e) {}
    });
  }
})();

/* ============================================================
   GAME HUB — SOUND FX + HIGH SCORES  (window.GH)
   Runs on every page (loaded via themes.js). Zero dependencies:
   sounds are synthesised with the Web Audio API (no files).
     GH.sfx.play('win')          — play a named sound
     GH.score.best(game,key,v,'high'|'low')  — save/return best
   Buttons click-beep automatically and the win overlay plays a
   win/lose jingle automatically, so existing games need no edits.
   ============================================================ */
(function () {
  'use strict';
  var MKEY = 'gamehub.muted';
  var muted = false;
  try { muted = localStorage.getItem(MKEY) === '1'; } catch (e) {}

  var AC = null, BUS = null;
  function ac() {
    if (!AC) {
      try {
        AC = new (window.AudioContext || window.webkitAudioContext)();
        /* master bus: gentle lowpass for warmth + a subtle feedback delay for space */
        BUS = AC.createGain(); BUS.gain.value = 0.9;
        var lp = AC.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 7200; lp.Q.value = 0.3;
        var dly = AC.createDelay(); dly.delayTime.value = 0.085;
        var fb = AC.createGain(); fb.gain.value = 0.16;
        var wet = AC.createGain(); wet.gain.value = 0.10;
        BUS.connect(lp); lp.connect(AC.destination);
        lp.connect(dly); dly.connect(fb); fb.connect(dly); dly.connect(wet); wet.connect(AC.destination);
      } catch (e) {}
    }
    if (AC && AC.state === 'suspended') { try { AC.resume(); } catch (e) {} }
    return AC;
  }
  function out() { return BUS || (AC && AC.destination); }

  /* a single voice with an ADSR-ish envelope, optional detuned partner + pitch glide */
  function tone(freq, o) {
    o = o || {}; var c = ac(); if (!c) return;
    var t = c.currentTime + (o.when || 0);
    var dur = o.dur || 0.2, atk = o.attack || 0.006, vol = o.vol || 0.2;
    var osc = c.createOscillator(), g = c.createGain(), osc2 = null;
    osc.type = o.type || 'triangle'; osc.frequency.setValueAtTime(freq, t);
    if (o.glideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(1, o.glideTo), t + dur);
    if (o.detune) { osc2 = c.createOscillator(); osc2.type = osc.type; osc2.frequency.setValueAtTime(freq, t); osc2.detune.setValueAtTime(o.detune, t); if (o.glideTo) osc2.frequency.exponentialRampToValueAtTime(Math.max(1, o.glideTo), t + dur); }
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + atk);
    g.gain.exponentialRampToValueAtTime(vol * 0.6, t + Math.min(dur, atk + 0.05));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g); if (osc2) osc2.connect(g); g.connect(out());
    osc.start(t); osc.stop(t + dur + 0.03); if (osc2) { osc2.start(t); osc2.stop(t + dur + 0.03); }
  }
  /* filtered noise burst — for cards, dice, chips, shuffles */
  function noise(o) {
    o = o || {}; var c = ac(); if (!c) return;
    var t = c.currentTime + (o.when || 0), dur = o.dur || 0.1;
    var n = Math.max(1, Math.floor(c.sampleRate * dur)), buf = c.createBuffer(1, n, c.sampleRate), d = buf.getChannelData(0);
    for (var i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    var src = c.createBufferSource(); src.buffer = buf;
    var f = c.createBiquadFilter(); f.type = o.ftype || 'bandpass'; f.frequency.value = o.freq || 1600; f.Q.value = o.q || 0.9;
    var g = c.createGain(); g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(o.vol || 0.14, t + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f); f.connect(g); g.connect(out()); src.start(t); src.stop(t + dur + 0.02);
  }
  /* a melodic run of tones */
  function seq(notes, step, type, vol, o) {
    o = o || {}; notes.forEach(function (f, i) { tone(f, { dur: step * (o.hold || 1.1), type: type || 'triangle', vol: vol || 0.2, when: i * step, detune: o.detune || 7 }); });
  }

  var SOUNDS = {
    click:  function () { tone(660, { dur: 0.05, type: 'sine', vol: 0.09 }); },
    move:   function () { tone(430, { dur: 0.05, type: 'sine', vol: 0.10 }); },
    place:  function () { tone(300, { dur: 0.05, type: 'sine', vol: 0.12 }); noise({ freq: 2000, dur: 0.05, vol: 0.06 }); },
    flip:   function () { noise({ freq: 2600, q: 0.7, dur: 0.07, vol: 0.10 }); tone(540, { dur: 0.05, type: 'sine', vol: 0.06 }); },
    card:   function () { noise({ freq: 2800, q: 0.6, dur: 0.08, vol: 0.12, ftype: 'highpass' }); },
    deal:   function () { noise({ freq: 2400, q: 0.7, dur: 0.06, vol: 0.11 }); tone(360, { dur: 0.05, type: 'sine', vol: 0.05 }); },
    shuffle:function () { for (var i = 0; i < 7; i++) noise({ freq: 1800 + Math.random() * 1400, q: 0.6, dur: 0.05, vol: 0.07, when: i * 0.05 }); },
    chip:   function () { tone(1400, { dur: 0.05, type: 'sine', vol: 0.12 }); tone(2100, { dur: 0.05, type: 'sine', vol: 0.07, when: 0.01 }); noise({ freq: 5000, dur: 0.03, vol: 0.05, ftype: 'highpass' }); },
    dice:   function () { noise({ freq: 900, q: 1.2, dur: 0.05, vol: 0.12, when: 0 }); noise({ freq: 1100, q: 1.2, dur: 0.05, vol: 0.11, when: 0.09 }); noise({ freq: 800, q: 1.2, dur: 0.06, vol: 0.10, when: 0.17 }); },
    select: function () { tone(760, { dur: 0.05, type: 'triangle', vol: 0.11, detune: 6 }); },
    pop:    function () { tone(720, { dur: 0.08, type: 'triangle', vol: 0.18, glideTo: 1180, detune: 8 }); },
    hit:    function () { tone(300, { dur: 0.06, type: 'square', vol: 0.16 }); noise({ freq: 500, dur: 0.05, vol: 0.08 }); },
    drop:   function () { tone(520, { dur: 0.16, type: 'triangle', vol: 0.16, glideTo: 120 }); },
    error:  function () { tone(220, { dur: 0.22, type: 'sawtooth', vol: 0.13, glideTo: 90 }); },
    clear:  function () { seq([523, 659, 784, 1047], 0.07, 'triangle', 0.2); },
    tick:   function () { tone(1000, { dur: 0.03, type: 'sine', vol: 0.08 }); },
    coin:   function () { tone(988, { dur: 0.09, type: 'square', vol: 0.16 }); tone(1319, { dur: 0.14, type: 'square', vol: 0.16, when: 0.08 }); },
    start:  function () { seq([392, 523, 659, 784], 0.09, 'triangle', 0.2); },
    cash:   function () { seq([784, 988, 1319, 1568], 0.08, 'square', 0.17, { hold: 1.2 }); for (var i = 0; i < 4; i++) tone(2000 + i * 180, { dur: 0.06, type: 'sine', vol: 0.06, when: 0.34 + i * 0.05 }); },
    jackpot:function () { seq([523, 659, 784, 1047, 1319, 1568], 0.08, 'square', 0.18); },
    win:    function () { seq([523, 659, 784, 1047], 0.12, 'triangle', 0.2, { hold: 1.1 }); tone(523, { dur: 0.5, type: 'sine', vol: 0.09, when: 0.48, detune: 8 }); tone(659, { dur: 0.5, type: 'sine', vol: 0.08, when: 0.48 }); tone(784, { dur: 0.5, type: 'sine', vol: 0.08, when: 0.48 }); },
    lose:   function () { seq([440, 349, 294, 220], 0.16, 'sawtooth', 0.14, { hold: 1.05, detune: 10 }); }
  };
  /* aliases so legacy names keep working */
  SOUNDS.beep = SOUNDS.click; SOUNDS.good = SOUNDS.pop; SOUNDS.bad = SOUNDS.error;

  function play(name) {
    if (muted) return;
    var f = SOUNDS[name]; if (f) { try { f(); } catch (e) {} }
  }

  window.GH = window.GH || {};
  GH.sfx = {
    play: play,
    isMuted: function () { return muted; },
    setMuted: function (m) {
      muted = !!m;
      try { localStorage.setItem(MKEY, muted ? '1' : '0'); } catch (e) {}
      syncBtn();
    },
    toggle: function () { GH.sfx.setMuted(!muted); if (!muted) play('click'); }
  };

  /* ---- high-score store (localStorage) ---- */
  GH.score = {
    _read: function () { try { return JSON.parse(localStorage.getItem('gamehub.scores') || '{}'); } catch (e) { return {}; } },
    _write: function (o) { try { localStorage.setItem('gamehub.scores', JSON.stringify(o)); } catch (e) {} },
    get: function (game, key) { var o = this._read(); return (o[game] && o[game][key] !== undefined) ? o[game][key] : null; },
    set: function (game, key, val) { var o = this._read(); o[game] = o[game] || {}; o[game][key] = val; this._write(o); return val; },
    /* returns {value, isBest, prev}; mode 'high' (default) or 'low' */
    best: function (game, key, val, mode) {
      var cur = this.get(game, key);
      var better = cur === null || (mode === 'low' ? val < cur : val > cur);
      if (better) { this.set(game, key, val); return { value: val, isBest: true, prev: cur }; }
      return { value: cur, isBest: false, prev: cur };
    },
    inc: function (game, key, by) { var v = (this.get(game, key) || 0) + (by === undefined ? 1 : by); this.set(game, key, v); return v; }
  };

  /* ---- reduced-motion check ---- */
  function reduceMotion() { try { return window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } }

  /* ---- auto click-beeps + press bounce on common controls ---- */
  document.addEventListener('click', function (e) {
    var sel = '.hbtn,.mbtn,.win-btn,.back-btn,.gcard,.tt-btn,.draw-btn,.end-btn,.cbtn,button';
    var t = e.target.closest ? e.target.closest(sel) : null;
    if (t && t.id !== 'sound-fab') {
      play('click');
      if (!reduceMotion()) { t.classList.remove('gh-press'); void t.offsetWidth; t.classList.add('gh-press'); setTimeout(function () { t.classList.remove('gh-press'); }, 220); }
    }
  }, true);

  /* ---- celebratory confetti burst ---- */
  function confetti() {
    if (reduceMotion()) return;
    var cv = document.getElementById('gh-confetti');
    if (!cv) { cv = document.createElement('canvas'); cv.id = 'gh-confetti'; document.body.appendChild(cv); }
    var ctx = cv.getContext('2d'); if (!ctx) return;
    var W = cv.width = window.innerWidth, H = cv.height = window.innerHeight;
    var cols = ['#f0c040', '#e05050', '#40c0a0', '#5090e0', '#c080e0', '#f0883e', '#ffffff'];
    var N = Math.min(170, Math.round(W / 7)), P = [];
    for (var i = 0; i < N; i++) P.push({ x: Math.random() * W, y: -20 - Math.random() * H * 0.35, r: 4 + Math.random() * 6, c: cols[0 | Math.random() * cols.length], vy: 2 + Math.random() * 4.5, vx: -2.2 + Math.random() * 4.4, rot: Math.random() * 6.28, vr: -0.22 + Math.random() * 0.44, sh: Math.random() < 0.5 });
    var start = performance.now(), dur = 2700;
    function frame(now) {
      var t = now - start; ctx.clearRect(0, 0, W, H);
      for (var i = 0; i < P.length; i++) {
        var p = P[i]; p.vy += 0.07; p.x += p.vx; p.y += p.vy; p.rot += p.vr; p.vx *= 0.995;
        ctx.globalAlpha = t < 1500 ? 1 : Math.max(0, 1 - (t - 1500) / 1200);
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.fillStyle = p.c;
        if (p.sh) ctx.fillRect(-p.r / 2, -p.r / 2, p.r, p.r * 1.6);
        else { ctx.beginPath(); ctx.ellipse(0, 0, p.r, p.r * 0.6, 0, 0, 6.28); ctx.fill(); }
        ctx.restore();
      }
      ctx.globalAlpha = 1;
      if (t < dur) requestAnimationFrame(frame);
      else if (cv && cv.parentNode) cv.parentNode.removeChild(cv);
    }
    requestAnimationFrame(frame);
  }
  window.GH.confetti = confetti;

  /* ---- casino chip toss: fly N chips from the bottom to a target element ---- */
  function rectCenter(t) {
    var el = typeof t === 'string' ? document.querySelector(t) : t;
    if (el && el.getBoundingClientRect) { var r = el.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; }
    return [window.innerWidth / 2, window.innerHeight / 2];
  }
  GH.chip = function (target, opts) {
    opts = opts || {};
    if (reduceMotion()) return;
    var dest = rectCenter(target);
    var n = opts.count || 3, color = opts.color || '#f0c040';
    for (var k = 0; k < n; k++) {
      (function (k) {
        setTimeout(function () {
          var sx = (opts.fromX != null ? opts.fromX : window.innerWidth / 2) + (-30 + Math.random() * 60);
          var sy = (opts.fromY != null ? opts.fromY : window.innerHeight - 30);
          var c = document.createElement('div');
          c.style.cssText = 'position:fixed;left:' + sx + 'px;top:' + sy + 'px;width:24px;height:24px;border-radius:50%;z-index:10001;pointer-events:none;'
            + 'background:radial-gradient(circle at 35% 30%,#fff6,' + color + ');border:3px dashed rgba(255,255,255,.75);box-shadow:0 3px 8px rgba(0,0,0,.5);'
            + 'transform:translate(-50%,-50%) scale(.6);transition:left .46s cubic-bezier(.25,.7,.3,1),top .46s cubic-bezier(.25,.7,.3,1),transform .46s cubic-bezier(.25,.7,.3,1),opacity .18s .34s;';
          document.body.appendChild(c);
          c.getBoundingClientRect();
          var jx = (-14 + Math.random() * 28), jy = (-14 + Math.random() * 28);
          c.style.left = (dest[0] + jx) + 'px'; c.style.top = (dest[1] + jy) + 'px';
          c.style.transform = 'translate(-50%,-50%) scale(1) rotate(' + (180 + Math.random() * 360) + 'deg)';
          setTimeout(function () { c.style.opacity = '0'; }, 360);
          setTimeout(function () { if (c.parentNode) c.parentNode.removeChild(c); }, 640);
        }, k * 70);
      })(k);
    }
    try { play('chip'); } catch (e) {}
  };

  /* ---- card-to-pile slide: fly a ghost of a card from a start rect to an element ---- */
  GH.slide = function (fromRect, toTarget, opts) {
    opts = opts || {};
    if (reduceMotion() || !fromRect) return;
    var toEl = typeof toTarget === 'string' ? document.querySelector(toTarget) : toTarget;
    if (!toEl) return;
    var tr = toEl.getBoundingClientRect();
    var ghost = document.createElement('div');
    ghost.style.cssText = 'position:fixed;left:' + fromRect.left + 'px;top:' + fromRect.top + 'px;width:' + fromRect.width + 'px;height:' + fromRect.height + 'px;'
      + 'z-index:10002;pointer-events:none;border-radius:8px;background:' + (opts.bg || 'linear-gradient(158deg,#fdfcf7,#eae2d0)') + ';'
      + 'box-shadow:0 8px 22px rgba(0,0,0,.5);transition:left .28s ease-out,top .28s ease-out,transform .28s ease-out,opacity .12s .22s;';
    if (opts.html) ghost.innerHTML = opts.html;
    document.body.appendChild(ghost);
    ghost.getBoundingClientRect();
    ghost.style.left = tr.left + 'px'; ghost.style.top = tr.top + 'px';
    ghost.style.transform = 'rotate(' + (-8 + Math.random() * 16) + 'deg)';
    setTimeout(function () { ghost.style.opacity = '0'; }, 230);
    setTimeout(function () { if (ghost.parentNode) ghost.parentNode.removeChild(ghost); }, 420);
  };

  /* ---- deal helper: stagger-animate .card elements in after a deal ---- */
  GH.dealIn = function (container, opts) {
    opts = opts || {};
    var root = typeof container === 'string' ? document.querySelector(container) : (container || document);
    if (!root) return;
    if (reduceMotion()) return;
    var cards = root.querySelectorAll('.card');
    var step = opts.step || 42, max = opts.max || 2000, i = 0;
    cards.forEach(function (c) {
      if (c.classList.contains('gh-deal')) return;
      c.classList.add('gh-deal');
      c.style.animationDelay = Math.min(max, i++ * step) + 'ms';
    });
  };

  /* ---- auto win/lose jingle + confetti when #win-overlay shows ---- */
  function watchWin() {
    var ov = document.getElementById('win-overlay');
    if (!ov || !window.MutationObserver) return;
    var wasShown = ov.classList.contains('show');
    new MutationObserver(function () {
      var shown = ov.classList.contains('show');
      if (shown && !wasShown) {
        var txt = (ov.textContent || '').toUpperCase();
        var lost = /GAME OVER|YOU LOSE|AI WINS|DEALER WINS|BUST|BROKE|BUSTED|SEVEN OUT|💥|☠|💸|🤖|💀|TIME/.test(txt);
        play(lost ? 'lose' : 'win');
        if (!lost) confetti();
      }
      wasShown = shown;
    }).observe(ov, { attributes: true, attributeFilter: ['class'] });
  }

  /* ---- floating mute button (next to the 🎨 theme fab) ---- */
  function syncBtn() {
    var b = document.getElementById('sound-fab');
    if (b) b.textContent = muted ? '🔇' : '🔊';
  }
  function buildFx() {
    var st = document.createElement('style');
    st.textContent = '#sound-fab{position:fixed;right:16px;bottom:70px;z-index:9000;width:46px;height:46px;' +
      'border-radius:50%;background:var(--surface2,#1a1a1a);border:2px solid var(--border,#2a2a2a);' +
      'color:var(--text,#f0f0f0);font-size:19px;cursor:pointer;display:flex;align-items:center;' +
      'justify-content:center;box-shadow:0 4px 16px rgba(0,0,0,.5);transition:all .2s;}' +
      '#sound-fab:hover{border-color:var(--accent,#f0c040);transform:scale(1.08);}';
    document.head.appendChild(st);
    var b = document.createElement('button');
    b.id = 'sound-fab'; b.title = 'Sound on/off'; b.textContent = muted ? '🔇' : '🔊';
    b.addEventListener('click', function () { GH.sfx.toggle(); });
    document.body.appendChild(b);
    watchWin();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', buildFx);
  else buildFx();
})();

/* ============================================================
   GAME HUB — "HOW TO PLAY" HELP  (ℹ️ button on every game page)
   Looks up curated help in window.GH_HELP (lang/help.js) keyed by
   the page filename; falls back to the page's own hint text.
   ============================================================ */
(function () {
  'use strict';
  var file = (location.pathname.split('/').pop() || '').toLowerCase();
  var key = file.replace(/\.html?$/, '');
  if (!key || key === 'index') return; /* no help button on the hub */

  /* load the curated help data relative to this script */
  try {
    var scr = document.querySelector('script[src*="themes.js"]') || document.currentScript;
    if (scr) {
      var src = scr.getAttribute('src') || '';
      var helpSrc = src.replace(/themes\/themes\.js(\?.*)?$/, 'lang/help.js');
      if (helpSrc !== src && !document.querySelector('script[src*="lang/help.js"]')) {
        var s = document.createElement('script'); s.src = helpSrc; s.defer = true; document.head.appendChild(s);
      }
    }
  } catch (e) {}

  function hintFallback() {
    var out = [];
    document.querySelectorAll('[class*="hint"]').forEach(function (el) {
      var t = (el.textContent || '').replace(/\s+/g, ' ').trim();
      if (t && t.length > 3 && out.indexOf(t) < 0) out.push(t);
    });
    return out;
  }

  function buildHelp() {
    var st = document.createElement('style');
    st.textContent =
      '#help-fab{position:fixed;right:16px;bottom:124px;z-index:9000;width:46px;height:46px;border-radius:50%;' +
      'background:var(--surface2,#1a1a1a);border:2px solid var(--border,#2a2a2a);color:var(--text,#f0f0f0);' +
      'font-size:20px;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 16px rgba(0,0,0,.5);transition:all .2s;}' +
      '#help-fab:hover{border-color:var(--accent,#f0c040);transform:scale(1.08);}' +
      '#help-ov{position:fixed;inset:0;z-index:9500;display:none;align-items:center;justify-content:center;background:rgba(0,0,0,.72);padding:18px;}' +
      '#help-ov.show{display:flex;}' +
      '#help-box{max-width:460px;width:100%;max-height:82vh;overflow:auto;background:var(--surface,#15151c);border:2px solid var(--accent,#f0c040);' +
      'border-radius:16px;padding:22px 22px 18px;box-shadow:0 18px 60px rgba(0,0,0,.7);}' +
      '#help-box h2{font-family:Orbitron,monospace;font-size:19px;letter-spacing:1px;margin:0 0 4px;color:var(--accent,#f0c040);}' +
      '#help-box .hsub{font-family:"Share Tech Mono",monospace;font-size:12px;color:var(--dim,#888);margin:0 0 14px;}' +
      '#help-box ul{margin:0 0 14px;padding-left:20px;}' +
      '#help-box li{font-family:"Share Tech Mono",monospace;font-size:14px;line-height:1.7;color:var(--text,#eee);margin-bottom:5px;}' +
      '#help-box .hsec{font-family:Orbitron,monospace;font-size:12px;letter-spacing:1px;color:var(--dim,#999);margin:12px 0 6px;text-transform:uppercase;}' +
      '#help-box .hclose{display:block;width:100%;margin-top:8px;font-family:Orbitron,monospace;font-weight:800;letter-spacing:1px;padding:12px;border-radius:10px;' +
      'border:2px solid var(--border,#333);background:var(--surface2,#222);color:var(--text,#eee);cursor:pointer;}' +
      '#help-box .hclose:hover{border-color:var(--accent,#f0c040);}';
    document.head.appendChild(st);

    var fab = document.createElement('button');
    fab.id = 'help-fab'; fab.title = 'How to play'; fab.textContent = 'ℹ️';
    document.body.appendChild(fab);

    var ov = document.createElement('div'); ov.id = 'help-ov';
    ov.innerHTML = '<div id="help-box"></div>';
    document.body.appendChild(ov);
    ov.addEventListener('click', function (e) { if (e.target === ov) close(); });

    function render() {
      var data = (window.GH_HELP || {})[key];
      var box = document.getElementById('help-box');
      var title, rules, controls, tips, sub = 'How to play';
      if (data) { title = data.t; rules = data.h || []; controls = data.c; tips = data.p; }
      else { title = (document.title || 'How to play'); rules = hintFallback(); }
      if (!rules || !rules.length) rules = ['Press NEW GAME to start. Use the on-screen controls to play — have fun!'];
      var html = '<h2>' + esc(title) + '</h2><p class="hsub">' + esc(sub) + '</p><ul>' +
        rules.map(function (r) { return '<li>' + esc(r) + '</li>'; }).join('') + '</ul>';
      if (controls && controls.length) html += '<div class="hsec">Controls</div><ul>' + controls.map(function (r) { return '<li>' + esc(r) + '</li>'; }).join('') + '</ul>';
      if (tips && tips.length) html += '<div class="hsec">Tips</div><ul>' + tips.map(function (r) { return '<li>' + esc(r) + '</li>'; }).join('') + '</ul>';
      html += '<button class="hclose">GOT IT</button>';
      box.innerHTML = html;
      box.querySelector('.hclose').addEventListener('click', close);
    }
    function esc(s) { return String(s).replace(/[&<>]/g, function (m) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m]; }); }
    function open() { render(); ov.classList.add('show'); }
    function close() { ov.classList.remove('show'); }
    fab.addEventListener('click', open);

    /* auto-open on first ever visit to a game (once), so new players see the rules */
    try {
      if (localStorage.getItem('gamehub.seenhelp.' + key) !== '1') {
        localStorage.setItem('gamehub.seenhelp.' + key, '1');
        setTimeout(open, 450);
      }
    } catch (e) {}
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', buildHelp);
  else buildHelp();
})();
