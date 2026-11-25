/* Sink or Float — game logic.
   One canvas draws the water tank and the toys; buttons, the chart and Fizz the frog are HTML on top. */
'use strict';
(() => {
  const $ = s => document.querySelector(s);
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const BY_ID = {};
  TOYS.forEach(t => { BY_ID[t.id] = t; });
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const rnd = (a, b) => a + Math.random() * (b - a);
  const clock = () => performance.now() / 1000;
  const shuffled = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

  /* ---------------- saved progress ---------------- */
  const STORE = 'sinkOrFloat.v1';
  const save = { tested: {}, order: [], stars: 0, muted: false, met: false, freeMet: false, party: false };
  try { Object.assign(save, JSON.parse(localStorage.getItem(STORE) || '{}')); } catch (e) { /* private mode */ }
  save.order = (save.order || []).filter((id, i, a) => BY_ID[id] && save.tested[id] && a.indexOf(id) === i);
  const persist = () => { try { localStorage.setItem(STORE, JSON.stringify(save)); } catch (e) { /* ignore */ } };
  const testedCount = () => save.order.length;

  /* ---------------- input: instant taps, first finger only ---------------- */
  function onTap(el, fn) {
    let last = 0;
    el.addEventListener('pointerdown', e => {
      if (e.button > 0 || !e.isPrimary) return;
      last = Date.now();
      Sfx.unlock(); poke();
      fn(e);
    });
    el.addEventListener('click', e => {             // keyboard / assistive tech
      if (Date.now() - last < 900) return;
      Sfx.unlock(); poke();
      fn(e);
    });
  }
  document.addEventListener('gesturestart', e => e.preventDefault());
  document.addEventListener('contextmenu', e => e.preventDefault());

  /* ---------------- sound effects (made on the fly, no files) ---------------- */
  const Sfx = (() => {
    let ctx = null, master = null, noiseBuf = null;
    function unlock() {
      if (!ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return null;
        try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (e) { /* */ }
        ctx = new AC();
        master = ctx.createGain(); master.gain.value = 0.22; master.connect(ctx.destination);
        noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 1.5, ctx.sampleRate);
        const d = noiseBuf.getChannelData(0);
        for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
        setTimeout(() => Voice.preload(Object.keys(TEXT)), 400);
      }
      if (ctx.state === 'suspended') ctx.resume();
      return ctx;
    }
    function tone(freq, t0, dur, type = 'sine', vol = 1, freqEnd) {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = type; o.frequency.setValueAtTime(freq, t0);
      if (freqEnd) o.frequency.exponentialRampToValueAtTime(freqEnd, t0 + dur);
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(vol, t0 + 0.015);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      o.connect(g); g.connect(master); o.start(t0); o.stop(t0 + dur + 0.05);
    }
    function noise(t0, dur, f0, f1, vol = 1) {
      const src = ctx.createBufferSource(); src.buffer = noiseBuf;
      const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 1.1;
      bp.frequency.setValueAtTime(f0, t0); bp.frequency.exponentialRampToValueAtTime(f1, t0 + dur);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(vol, t0 + dur * 0.3);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      src.connect(bp); bp.connect(g); g.connect(master); src.start(t0); src.stop(t0 + dur + 0.05);
    }
    let lastBubble = 0;
    function play(name, v = 1) {
      if (save.muted || !unlock()) return;
      const t = ctx.currentTime + 0.01;
      switch (name) {
        case 'tap': tone(520, t, 0.14, 'sine', 0.8, 900); break;
        case 'pop': tone(760, t, 0.16, 'triangle', 0.9, 200); break;
        case 'pickup': tone(500, t, 0.12, 'triangle', 0.55, 900); break;
        case 'swish': noise(t, 0.35, 500, 2400, 0.7); break;
        case 'boing': tone(170, t, 0.5, 'sine', 1, 560); tone(340, t + 0.05, 0.3, 'triangle', 0.3, 700); break;
        case 'sparkle': [1047, 1319, 1568, 2093].forEach((f, i) => tone(f, t + i * 0.07, 0.28, 'triangle', 0.45)); break;
        case 'star': tone(1568, t, 0.18, 'triangle', 0.5); tone(2093, t + 0.08, 0.3, 'triangle', 0.45); break;
        case 'ooh': tone(420, t, 0.3, 'sine', 0.6, 900); tone(900, t + 0.28, 0.5, 'sine', 0.5, 360); break;
        case 'wiggle': tone(330, t, 0.08, 'square', 0.12); tone(290, t + 0.11, 0.1, 'square', 0.12); break;
        case 'ribbit': tone(200, t, 0.09, 'sawtooth', 0.22, 150); tone(220, t + 0.14, 0.13, 'sawtooth', 0.22, 160); break;
        case 'splash':
          noise(t, 0.6, 3200, 380, 1.4 * v); noise(t + 0.04, 0.4, 900, 260, 0.8 * v);
          tone(240, t, 0.2, 'sine', 0.5 * v, 80);
          break;
        case 'plop': tone(1050, t, 0.15, 'sine', 0.8 * v, 240); noise(t, 0.25, 2600, 700, 0.45 * v); break;
        case 'drip': tone(1300, t, 0.08, 'sine', 0.25, 700); break;
        case 'bubble': {
          if (ctx.currentTime - lastBubble < 0.09) break;
          lastBubble = ctx.currentTime;
          const f = rnd(450, 850); tone(f, t, 0.09, 'sine', 0.2 * v, f * 2.2); break;
        }
        case 'thud': tone(150, t, 0.22, 'sine', 0.9 * v, 55); noise(t, 0.16, 700, 240, 0.5 * v); break;
        case 'scoop': noise(t, 0.5, 380, 2600, 1); [880, 1175].forEach((f, i) => tone(f, t + 0.3 + i * 0.09, 0.22, 'triangle', 0.35)); break;
        case 'fanfare':
          [523, 659, 784, 1047].forEach((f, i) => tone(f, t + i * 0.13, i === 3 ? 0.8 : 0.22, 'triangle', 0.7));
          [1319, 1568].forEach((f, i) => tone(f, t + 0.55 + i * 0.1, 0.5, 'sine', 0.35));
          break;
      }
    }
    return { play, unlock, ctx: () => ctx };
  })();

  /* ---------------- Fizz's voice: recorded clips voice/<key>.mp3, device voice as a back-up ---------------- */
  const Voice = (() => {
    const synth = window.speechSynthesis;
    const keep = [];
    let voice = null, token = 0, busy = false;
    const PREF = [/Samantha/i, /Google US English/i, /Aria/i, /Jenny/i, /Ava/i, /Allison/i, /Karen/i,
      /Moira/i, /Tessa/i, /Google UK English Female/i, /Serena/i, /Zira/i, /Susan/i];
    function pick() {
      if (!synth) return;
      const vs = synth.getVoices().filter(v => /^en/i.test(v.lang));
      if (!vs.length) return;
      for (const re of PREF) { const v = vs.find(x => re.test(x.name)); if (v) { voice = v; return; } }
      voice = vs.find(v => /en[-_]US/i.test(v.lang)) || vs[0];
    }
    if (synth) { pick(); if (synth.addEventListener) synth.addEventListener('voiceschanged', pick); else synth.onvoiceschanged = pick; }

    const bufs = {}, loading = {};
    let src = null, analyser = null, levelData = null, el = null;
    function load(id, cb) {
      if (bufs[id]) { cb(bufs[id]); return; }
      (loading[id] = loading[id] || []).push(cb);
      if (loading[id].length > 1) return;
      const done = b => { const l = loading[id] || []; delete loading[id]; if (b) bufs[id] = b; l.forEach(f => f(b)); };
      const ctx = Sfx.ctx();
      if (!ctx) { done(null); return; }
      const x = new XMLHttpRequest();
      x.open('GET', 'voice/' + id + '.mp3'); x.responseType = 'arraybuffer';
      x.onload = () => {
        if (x.status && x.status !== 200) { done(null); return; }
        try {
          const p = ctx.decodeAudioData(x.response, done, () => done(null));
          if (p && p.catch) p.catch(() => done(null));
        } catch (e) { done(null); }
      };
      x.onerror = () => done(null);
      x.send();
    }
    function preload(keys) { if (Sfx.ctx()) keys.forEach(k => load(k, () => {})); }

    function stopClip() {
      if (src) { try { src.onended = null; src.stop(); } catch (e) { /* */ } src = null; }
      if (el) { el.onended = el.onerror = null; try { el.pause(); } catch (e) { /* */ } }
    }
    function playBuffer(buf, finish) {
      const ctx = Sfx.ctx();
      if (!analyser) {
        analyser = ctx.createAnalyser(); analyser.fftSize = 512;
        levelData = new Uint8Array(analyser.fftSize);
        analyser.connect(ctx.destination);
      }
      src = ctx.createBufferSource(); src.buffer = buf;
      src.connect(analyser);
      src.onended = finish;
      src.start(0);
    }
    function playElement(id, finish, fail) {
      if (!el) el = new Audio();
      el.onended = finish; el.onerror = fail;
      el.src = 'voice/' + id + '.mp3';
      const p = el.play();
      if (p && p.catch) p.catch(fail);
    }
    function level() {
      if (!src || !analyser) return null;
      analyser.getByteTimeDomainData(levelData);
      let s = 0;
      for (let i = 0; i < levelData.length; i++) { const v = (levelData[i] - 128) / 128; s += v * v; }
      return Math.sqrt(s / levelData.length);
    }
    function synthSpeak(text, finish) {
      try {
        synth.cancel(); synth.resume();
        const u = new SpeechSynthesisUtterance(text);
        if (voice) { u.voice = voice; u.lang = voice.lang; } else u.lang = 'en-US';
        u.rate = 0.9; u.pitch = 1.15; u.volume = 1;
        u.onend = finish; u.onerror = finish;
        keep.push(u); if (keep.length > 6) keep.shift();
        synth.speak(u);
        return true;
      } catch (e) { return false; }
    }

    // keys: list of TEXT keys, played back to back
    function speak(keys, onEnd) {
      const my = ++token;
      const text = keys.map(k => TEXT[k] || '').join(' ');
      let fired = false, timer;
      busy = true;
      const finish = () => {
        if (fired) return; fired = true; clearTimeout(timer);
        if (my === token) { busy = false; src = null; Talk.stop(); if (onEnd) onEnd(); }
      };
      const est = 700 + text.length * 62;
      stopClip(); if (synth) synth.cancel();
      if (save.muted) { timer = setTimeout(finish, est); return; }
      timer = setTimeout(finish, est + 6000);
      const fallback = () => {
        if (my !== token || fired) return;
        clearTimeout(timer);
        if (synth && synthSpeak(text, finish)) timer = setTimeout(finish, est + 5000);
        else timer = setTimeout(finish, est);
      };
      if (Sfx.ctx()) {
        const got = [];
        let left = keys.length;
        keys.forEach((id, i) => load(id, buf => {
          got[i] = buf;
          if (--left || my !== token || fired) return;
          if (got.some(b => !b)) { fallback(); return; }
          clearTimeout(timer);
          timer = setTimeout(finish, got.reduce((s, b) => s + b.duration, 0) * 1000 + 2000);
          let k = 0;
          const next = () => {
            if (my !== token || fired) return;
            if (k === got.length) { finish(); return; }
            try { playBuffer(got[k++], () => setTimeout(next, k < got.length ? 200 : 0)); } catch (e) { fallback(); }
          };
          next();
        }));
      } else {
        let k = 0;
        const next = () => {
          if (my !== token || fired) return;
          if (k === keys.length) { finish(); return; }
          try { playElement(keys[k++], next, fallback); } catch (e) { fallback(); }
        };
        next();
      }
    }
    function stop() { token++; busy = false; stopClip(); Talk.stop(); if (synth) synth.cancel(); }
    return { speak, stop, preload, level, busy: () => busy };
  })();

  /* Fizz's mouth follows the voice */
  const Talk = (() => {
    let iv = null, el = null;
    function start(e) {
      stop(); el = e; if (!el) return;
      let n = 0, open = false;
      iv = setInterval(() => {
        const lv = Voice.level();
        const want = lv == null ? (n++ % 4 < 2) : (open ? lv > 0.03 : lv > 0.055);
        if (want !== open) { open = want; el.classList.toggle('talk', open); }
      }, 60);
    }
    function stop() { clearInterval(iv); iv = null; if (el) el.classList.remove('talk'); }
    return { start, stop };
  })();

  /* ---------------- talking: caption + frog mouth ---------------- */
  const caption = $('#caption');
  let sayTok = 0, mustCb = null;
  // must = this callback has to run even if something else interrupts the speech (keeps the game moving)
  function say(keys, onEnd, must) {
    keys = [].concat(keys);
    if (mustCb) { const f = mustCb; mustCb = null; f(); }
    const my = ++sayTok;
    caption.textContent = keys.map(k => TEXT[k]).join(' ');
    caption.classList.add('on');
    Talk.start(screen === 'title' ? $('.t-frog') : frogEl);
    if (must) mustCb = onEnd;
    Voice.speak(keys, () => {
      if (my === sayTok) caption.classList.remove('on');
      if (must) { if (mustCb === onEnd) { mustCb = null; onEnd(); } } else if (onEnd) onEnd();
    });
  }
  function hush() { mustCb = null; sayTok++; Voice.stop(); caption.classList.remove('on'); }

  /* ---------------- layout ---------------- */
  const cv = $('#scene'), cx = cv.getContext('2d');
  const bg = document.createElement('canvas'), sandCv = document.createElement('canvas');
  const frogEl = $('#frog');
  const chartEl = $('#chart');
  const gFloat = $('#gFloat'), gSink = $('#gSink');
  let W = 0, H = 0, DPR = 1, U = 80, GRAV = 720, landscape = true;
  const Lt = { shelf: {}, tank: {}, ready: {}, frog: {} };
  const T = Lt.tank;

  function insets() {
    const cs = getComputedStyle($('#safe'));
    return { t: parseFloat(cs.paddingTop) || 0, r: parseFloat(cs.paddingRight) || 0,
      b: parseFloat(cs.paddingBottom) || 0, l: parseFloat(cs.paddingLeft) || 0 };
  }

  function layout() {
    const old = T.ix0 != null ? Object.assign({}, T) : null;
    W = innerWidth; H = innerHeight; DPR = Math.min(window.devicePixelRatio || 1, 2.5);
    cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
    const s = insets(), m = Math.min(W, H);
    const pad = Math.max(8, 0.022 * m), btn = clamp(0.1 * m, 46, 78);
    const top = s.t + pad + btn + 0.6 * pad;
    landscape = W >= H;
    const rs = document.documentElement.style;
    rs.setProperty('--pad', pad + 'px'); rs.setProperty('--btn', btn + 'px');
    rs.setProperty('--sl', s.l + 'px'); rs.setProperty('--st', s.t + 'px'); rs.setProperty('--sr', s.r + 'px');
    Object.assign(Lt, { pad, btn, top, s });
    const sh = Lt.shelf, rd = Lt.ready;
    const shuf = $('#shuffleBtn').style;
    let chartSlot, per, tx0, tx1, ty0, ty1;

    if (landscape) {
      U = Math.min(H * 0.17, W * 0.1);
      const sw = 1.6 * U, sx = s.l + pad;
      const n = 3, slotH = Math.min(1.45 * U, (H - s.b - pad - top - btn - pad) / n);
      Object.assign(sh, { x: sx, y: top, w: sw, h: slotH * n, n, vertical: true, cell: slotH });
      shuf.left = (sx + sw / 2 - btn / 2) + 'px'; shuf.top = (top + slotH * n + pad) + 'px';
      const cw = clamp(W * 0.2, 150, 280);
      chartSlot = Math.min((cw - 6) / 4.92, (H - s.b - pad - top - 6) / 6.1); per = 2;
      const chartW = chartSlot * 4.92 + 6;
      Object.assign(Lt, { chartX: W - s.r - pad - chartW, chartY: top, chartW });
      const gap = Math.max(pad, 0.025 * W);
      tx0 = sx + sw + gap; tx1 = Lt.chartX - gap;
      ty0 = Math.max(top + 1.5 * U, 0.4 * H); ty1 = H - s.b - pad;
      Object.assign(rd, { x: (tx0 + tx1) / 2, y: (top + ty0) / 2, band: ty0 - top,
        minX: sx + sw + pad * 0.5, maxX: Lt.chartX - pad * 0.5 });
    } else {
      U = Math.min(W * 0.18, H * 0.085);
      const x0 = s.l + pad, x1 = W - s.r - pad;
      const shH = 1.45 * U, sw = x1 - x0 - btn - pad;
      const n = clamp(Math.floor(sw / (1.5 * U)), 3, 5);
      Object.assign(sh, { x: x0, y: top, w: sw, h: shH, n, vertical: false, cell: sw / n });
      shuf.left = (x1 - btn) + 'px'; shuf.top = (top + shH / 2 - btn / 2) + 'px';
      chartSlot = Math.min((x1 - x0 - 6) / 9.56, 0.62 * U); per = 4;
      const chartW = chartSlot * 9.56 + 6;
      Object.assign(Lt, { chartX: (x0 + x1) / 2 - chartW / 2, chartW });
      const rb = Math.min(1.95 * U, Math.max(1.55 * U, H * 0.16));
      Object.assign(rd, { x: (x0 + x1) / 2, y: top + shH + pad * 0.5 + rb / 2, band: rb, minX: x0, maxX: x1 });
      tx0 = x0; tx1 = x1; ty0 = rd.y + rb / 2 + pad * 0.5;
    }
    // chart (HTML)
    const cs = chartEl.style;
    cs.setProperty('--slot', chartSlot + 'px'); cs.setProperty('--per', per);
    cs.left = Lt.chartX + 'px'; cs.width = Lt.chartW + 'px';
    if (landscape) cs.top = Lt.chartY + 'px';
    else {
      const chH = chartEl.offsetHeight || chartSlot * 3.7 + 6;
      Lt.chartY = H - s.b - pad - chH; cs.top = Lt.chartY + 'px';
      ty1 = Lt.chartY - pad;
    }
    // water tank
    const gw = Math.max(4, 0.07 * U);
    Object.assign(T, { x0: tx0, x1: tx1, y0: ty0, y1: ty1, gw, ix0: tx0 + gw, ix1: tx1 - gw, iy1: ty1 - gw });
    T.iw = T.ix1 - T.ix0;
    T.r = Math.min(0.35 * U, T.iw / 6);
    T.surf = ty0 + 0.13 * (ty1 - ty0);
    T.sandTop = T.iy1 - 0.32 * U;
    GRAV = 9 * U;
    // Fizz on a lily pad by the right wall
    const fw = Math.min(1.25 * U, T.iw * 0.24), fh = fw * 0.88;
    Object.assign(Lt.frog, { w: fw, h: fh, padX: T.ix1 - fw * 0.58, padRx: fw * 0.62 });
    frogEl.style.width = fw + 'px'; frogEl.style.height = fh + 'px';
    // net hangs on the top-left rim
    const nb = btn * 0.86, net = $('#netBtn').style;
    net.left = (T.x0 + gw * 0.5 + 0.08 * U) + 'px'; net.top = (T.y0 - nb * 0.5) + 'px';
    // guess buttons either side of the toy that is ready
    const half = Math.min(rd.x - rd.minX, rd.maxX - rd.x);
    let gh = clamp(Math.min(rd.band * 0.9, 1.35 * U), 56, 150);
    gh = Math.max(40, Math.min(gh, rd.band * 0.8, (half - 0.75 * U - pad * 1.4) / 1.3));
    const gwid = gh * 1.3, off = 0.75 * U + gwid / 2 + pad * 0.7;
    [[gFloat, -1], [gSink, 1]].forEach(([b, d]) => {
      const st = b.style;
      st.width = gwid + 'px'; st.height = gh + 'px'; st.fontSize = (gh * 0.2) + 'px';
      st.left = (rd.x + d * off - gwid / 2) + 'px'; st.top = (rd.y - gh / 2) + 'px';
    });
    document.documentElement.style.setProperty('--u', U + 'px');
    // caption between the sound button and the star counter
    const capL = s.l + pad * 2.6 + btn * 2 + pad * 0.4;
    const capR = W - s.r - pad - ($('#stars').offsetWidth || btn * 2) - pad * 0.8;
    caption.style.left = capL + 'px'; caption.style.width = Math.max(0, capR - capL) + 'px';
    caption.style.display = capR - capL < 200 ? 'none' : 'flex';

    initWaves();
    drawStatic();
    buildToyArt();
    relayoutToys(old);
  }

  /* ---------------- toy pictures ---------------- */
  const toyImg = {}, toyArt = {}, dimCache = {};
  TOYS.forEach(t => {
    const im = new Image();
    im.onload = () => { toyImg[t.id] = im; if (W) buildOne(t.id); };
    im.src = ART.toyUrl(t.id);
  });
  function dims(id) {
    if (dimCache[id] && dimCache[id].U === U) return dimCache[id];
    const b = ART.toyBox(id), L = BY_ID[id].size * 0.85 * U;
    const d = b.w >= b.h ? { w: L, h: L * b.h / b.w } : { w: L * b.w / b.h, h: L };
    d.U = U;
    return (dimCache[id] = d);
  }
  function buildOne(id) {
    const im = toyImg[id]; if (!im) return;
    const d = dims(id), k = DPR * 1.15;
    const c = toyArt[id] || document.createElement('canvas');
    c.width = Math.ceil(d.w * k); c.height = Math.ceil(d.h * k);
    const g = c.getContext('2d');
    g.clearRect(0, 0, c.width, c.height);
    g.drawImage(im, 0, 0, c.width, c.height);
    toyArt[id] = c;
  }
  function buildToyArt() { TOYS.forEach(t => buildOne(t.id)); }

  /* ---------------- the background (drawn once per size) ---------------- */
  function rr(g, x, y, w, h, r) {
    g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r);
    g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
  }
  function cloud(g, x, y, s) {
    g.beginPath();
    [[0, 0, 1], [0.9, -0.35, 0.8], [1.7, 0.05, 0.75], [-0.85, 0.15, 0.65]].forEach(([dx, dy, r]) => {
      g.moveTo(x + (dx + r) * s, y + dy * s); g.arc(x + dx * s, y + dy * s, r * s, 0, Math.PI * 2);
    });
    g.fill();
  }
  function interiorPath(g, yTop) {
    g.beginPath();
    g.moveTo(T.ix0, yTop); g.lineTo(T.ix0, T.iy1 - T.r);
    g.quadraticCurveTo(T.ix0, T.iy1, T.ix0 + T.r, T.iy1);
    g.lineTo(T.ix1 - T.r, T.iy1);
    g.quadraticCurveTo(T.ix1, T.iy1, T.ix1, T.iy1 - T.r);
    g.lineTo(T.ix1, yTop); g.closePath();
  }
  function drawStatic() {
    bg.width = cv.width; bg.height = cv.height;
    const g = bg.getContext('2d');
    g.setTransform(DPR, 0, 0, DPR, 0, 0);
    // sky
    let gr = g.createLinearGradient(0, 0, 0, H);
    gr.addColorStop(0, '#86D4FF'); gr.addColorStop(0.6, '#D9F4FF'); gr.addColorStop(1, '#EAFBFF');
    g.fillStyle = gr; g.fillRect(0, 0, W, H);
    g.fillStyle = 'rgba(255,255,255,.85)';
    cloud(g, W * 0.3, H * 0.13, U * 0.35); cloud(g, W * 0.62, H * 0.08, U * 0.28); cloud(g, W * 0.86, H * 0.3, U * 0.3);
    cloud(g, W * 0.12, H * 0.42, U * 0.24);
    // hills
    const hy = landscape ? H * 0.62 : H * 0.55;
    g.fillStyle = '#A8E38A';
    g.beginPath(); g.moveTo(0, hy + U * 0.3);
    g.bezierCurveTo(W * 0.25, hy - U * 0.9, W * 0.45, hy + U * 0.2, W * 0.62, hy - U * 0.2);
    g.bezierCurveTo(W * 0.8, hy - U * 0.7, W * 0.92, hy, W, hy - U * 0.4);
    g.lineTo(W, H); g.lineTo(0, H); g.fill();
    g.fillStyle = '#86D068';
    g.beginPath(); g.moveTo(0, hy + U * 0.9);
    g.bezierCurveTo(W * 0.3, hy + U * 0.2, W * 0.6, hy + U * 1.2, W, hy + U * 0.5);
    g.lineTo(W, H); g.lineTo(0, H); g.fill();
    // toy shelf (wooden cubby)
    const sh = Lt.shelf, lw = Math.max(3, U * 0.045);
    g.lineJoin = 'round';
    rr(g, sh.x, sh.y, sh.w, sh.h, U * 0.22);
    g.fillStyle = '#E9A96A'; g.fill(); g.lineWidth = lw; g.strokeStyle = ART.OL; g.stroke();
    const inset = U * 0.09;
    for (let i = 0; i < sh.n; i++) {
      const c = cellRect(i);
      rr(g, c.x + inset, c.y + inset, c.w - inset * 2, c.h - inset * 2, U * 0.16);
      g.fillStyle = '#FFE6C4'; g.fill();
      g.fillStyle = 'rgba(200,120,60,.18)';
      g.fillRect(c.x + inset, c.y + c.h - inset - U * 0.14, c.w - inset * 2, U * 0.14 - U * 0.02);
    }
    // tank: glass back
    interiorPath(g, T.y0);
    g.fillStyle = 'rgba(255,255,255,.55)'; g.fill();
    // sand layer, drawn later on top of the water colour
    sandCv.width = Math.ceil((T.iw + 2) * DPR); sandCv.height = Math.ceil((T.iy1 - T.sandTop + U * 0.2) * DPR);
    const s = sandCv.getContext('2d');
    s.setTransform(DPR, 0, 0, DPR, -(T.ix0 - 1) * DPR, -(T.sandTop - U * 0.2) * DPR);
    s.save(); interiorPath(s, T.sandTop - U * 0.3); s.clip();
    s.fillStyle = '#F4D58A';
    s.beginPath(); s.moveTo(T.ix0, T.iy1);
    for (let x = T.ix0; x <= T.ix1 + 1; x += U * 0.2) s.lineTo(x, T.sandTop + Math.sin(x * 0.045) * U * 0.035);
    s.lineTo(T.ix1, T.iy1); s.fill();
    s.fillStyle = '#E8C277';
    for (let i = 0; i < T.iw / (U * 0.25); i++) {
      const x = T.ix0 + ((i * 97) % 100) / 100 * T.iw, y = T.sandTop + U * 0.1 + ((i * 53) % 100) / 100 * U * 0.18;
      s.beginPath(); s.arc(x, y, U * 0.018, 0, 7); s.fill();
    }
    const pebbles = [[0.18, '#B9C3D6'], [0.24, '#F2A27E'], [0.52, '#A9D18E'], [0.71, '#C7B8E8'], [0.77, '#B9C3D6']];
    pebbles.forEach(([fx, col], i) => {
      const x = T.ix0 + fx * T.iw, r = U * (0.07 + (i % 2) * 0.03);
      s.beginPath(); s.ellipse(x, T.sandTop + U * 0.05, r * 1.3, r, 0, 0, 7);
      s.fillStyle = col; s.fill(); s.lineWidth = 2; s.strokeStyle = 'rgba(45,33,64,.55)'; s.stroke();
    });
    // a little starfish
    const sx = T.ix0 + 0.36 * T.iw, sy = T.sandTop + U * 0.1, R = U * 0.12;
    s.beginPath();
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? R * 0.45 : R;
      s.lineTo(sx + Math.cos(a) * r, sy + Math.sin(a) * r * 0.75);
    }
    s.closePath(); s.fillStyle = '#FF8FA3'; s.fill(); s.lineWidth = 2; s.strokeStyle = 'rgba(45,33,64,.6)'; s.stroke();
    s.restore();
  }
  function cellRect(i) {
    const sh = Lt.shelf;
    return sh.vertical ? { x: sh.x, y: sh.y + sh.cell * i, w: sh.w, h: sh.cell }
      : { x: sh.x + sh.cell * i, y: sh.y, w: sh.cell, h: sh.h };
  }
  function cellCentre(i) { const c = cellRect(i); return { x: c.x + c.w / 2, y: c.y + c.h / 2 + U * 0.02 }; }
  function shelfScale(id) {
    const c = cellRect(0), d = dims(id), room = Math.min(c.w, c.h) - U * 0.3;
    return Math.min(1, room / Math.max(d.w, d.h));
  }

  /* ---------------- the water surface: a row of little springs ---------------- */
  const NCOL = 40;
  let colH = new Float32Array(NCOL), colV = new Float32Array(NCOL), tNow = 0;
  function initWaves() { colH = new Float32Array(NCOL); colV = new Float32Array(NCOL); }
  function colAt(x) { return clamp((x - T.ix0) / T.iw * (NCOL - 1), 0, NCOL - 1); }
  function waterY(x) {
    const f = colAt(x), i = Math.floor(f), j = Math.min(NCOL - 1, i + 1), k = f - i;
    const amb = reduceMotion ? 0 : Math.sin(x * 0.021 + tNow * 1.7) * U * 0.035 + Math.sin(x * 0.013 - tNow * 1.15) * U * 0.025;
    return T.surf + colH[i] * (1 - k) + colH[j] * k + amb;
  }
  function stepWaves() {
    const k = 0.012, d = 0.012, spread = 0.2;
    for (let i = 0; i < NCOL; i++) { colV[i] += -k * colH[i] - d * colV[i]; colH[i] += colV[i]; }
    for (let p = 0; p < 3; p++) {
      for (let i = 0; i < NCOL; i++) {
        if (i > 0) { const dl = spread * (colH[i] - colH[i - 1]); colV[i - 1] += dl * 0.5; }
        if (i < NCOL - 1) { const dr = spread * (colH[i] - colH[i + 1]); colV[i + 1] += dr * 0.5; }
      }
    }
    for (let i = 0; i < NCOL; i++) colH[i] = clamp(colH[i], -U * 0.6, U * 0.6);
  }
  function pushWater(x, w, amount) {
    const a = colAt(x - w / 2), b = colAt(x + w / 2);
    for (let i = Math.floor(a); i <= Math.ceil(b); i++) if (i >= 0 && i < NCOL) colV[i] += amount;
    const l = Math.floor(a) - 2, r = Math.ceil(b) + 2;     // water pushed out to the sides rises a little
    if (l >= 0) colV[l] -= amount * 0.5;
    if (r < NCOL) colV[r] -= amount * 0.5;
  }

  /* ---------------- little things: drops, bubbles, sand puffs ---------------- */
  const drops = [], bubbles = [], puffs = [];
  function splash(t, v) {
    const big = clamp(v / (4 * U), 0.3, 1.6) * clamp(Math.max(t.w, t.h) / U, 0.5, 1.3);
    pushWater(t.x, t.w * 0.8, 0.016 * U * big * 1.4);
    const n = Math.round(6 + 10 * big);
    for (let i = 0; i < n; i++) {
      const side = i % 2 ? 1 : -1;
      drops.push({ x: t.x + side * rnd(0.1, 0.5) * t.w, y: waterY(t.x) - 2, vx: side * rnd(0.4, 2.2) * U * Math.sqrt(big),
        vy: -rnd(2.5, 5.5) * U * Math.sqrt(big), r: rnd(0.035, 0.075) * U, life: 2 });
    }
    for (let i = 0; i < 6 + 6 * big; i++) addBubble(t.x + rnd(-0.4, 0.4) * t.w, waterY(t.x) + rnd(0.1, 0.6) * U, rnd(0.03, 0.08) * U);
    if (Math.max(t.w, t.h) < 0.75 * U) Sfx.play('plop', clamp(big, 0.5, 1));
    else Sfx.play('splash', clamp(big, 0.45, 1.1));
  }
  function addBubble(x, y, r) { if (bubbles.length < 90) bubbles.push({ x, y, r, ph: rnd(0, 6), vy: -rnd(0.7, 1.3) * U }); }
  function sandPuff(x, y, big) {
    for (let i = 0; i < 9; i++) puffs.push({ x: x + rnd(-0.4, 0.4) * U * big, y: y - rnd(0, 0.1) * U, vx: rnd(-0.8, 0.8) * U * big,
      vy: -rnd(0.2, 0.6) * U, r: rnd(0.06, 0.12) * U * big, life: 1 });
  }
  function stepBits(dt) {
    for (let i = drops.length - 1; i >= 0; i--) {
      const d = drops[i];
      d.vy += GRAV * dt; d.x += d.vx * dt; d.y += d.vy * dt; d.life -= dt;
      if ((d.vy > 0 && d.x > T.ix0 && d.x < T.ix1 && d.y > waterY(d.x)) || d.life < 0 || d.y > H) {
        if (d.life > 0 && d.y < H) pushWater(d.x, 4, 0.0025 * U);
        drops.splice(i, 1);
      }
    }
    for (let i = bubbles.length - 1; i >= 0; i--) {
      const b = bubbles[i];
      b.y += b.vy * dt; b.x += Math.sin(tNow * 6 + b.ph) * U * 0.25 * dt;
      b.x = clamp(b.x, T.ix0 + b.r, T.ix1 - b.r);
      if (b.y < waterY(b.x) + b.r) bubbles.splice(i, 1);
    }
    for (let i = puffs.length - 1; i >= 0; i--) {
      const p = puffs[i];
      p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 0.94; p.vy *= 0.94; p.r += U * 0.15 * dt; p.life -= dt * 1.1;
      if (p.life <= 0) puffs.splice(i, 1);
    }
  }

  /* ---------------- game state ---------------- */
  let screen = 'title', mode = 'guess', phase = 'pick', guess = null, streak = 0, rightN = 0, surpN = 0;
  const toys = [];          // every toy on screen
  let shelf = [];           // toy on each shelf cell (or null)
  let ready = null, active = null, drag = null, srcCell = -1;
  const heardWhy = {};

  function makeToy(id, state) {
    const d = dims(id);
    const t = { id, def: BY_ID[id], w: d.w, h: d.h, x: 0, y: 0, vx: 0, vy: 0, rot: 0, vr: 0, s: 1, vs: 0, sT: 1, a: 1,
      state, cell: -1, wig: 0, age: 0, wet: false, landed: false, settled: false, inT: 0, popup: false, bubT: 0, enter: 0 };
    toys.push(t);
    return t;
  }
  function removeToy(t) { const i = toys.indexOf(t); if (i >= 0) toys.splice(i, 1); }
  const inTank = () => toys.filter(t => t.state === 'tank');

  function flyTo(t, x, y, dur, s1, done, arc) {
    t.fly = { x0: t.x, y0: t.y, x1: x, y1: y, s0: t.s, s1, t: 0, dur, arc: arc == null ? U * 0.5 : arc, done };
    t.state = 'fly';
  }

  // which toys go on the shelf next: untested first (guess mode), and a mix of floaters and sinkers
  function nextIds(n) {
    const used = new Set(toys.filter(t => t.state !== 'fade').map(t => t.id));
    let pool = shuffled(TOYS.map(t => t.id).filter(id => !used.has(id)));
    if (pool.length < n) pool = pool.concat(shuffled(TOYS.map(t => t.id).filter(id => !pool.includes(id) && !shelf.some(s => s && s.id === id))));
    if (mode === 'guess') pool.sort((a, b) => (save.tested[a] ? 1 : 0) - (save.tested[b] ? 1 : 0));
    const out = [];
    let lastF = Math.random() < 0.5;
    while (out.length < n && pool.length) {
      const top = pool.slice(0, Math.max(2, Math.min(4, pool.length)));
      const want = top.find(id => BY_ID[id].floats !== lastF) || pool[0];
      out.push(want); pool.splice(pool.indexOf(want), 1); lastF = BY_ID[want].floats;
    }
    return out;
  }
  function fillShelf(all) {
    const n = Lt.shelf.n;
    if (all) shelf.forEach(t => { if (t) { t.state = 'fade'; t.cell = -1; } });
    shelf.length = n;
    for (let i = 0; i < n; i++) if (all || !shelf[i]) shelf[i] = null;
    const empty = []; for (let i = 0; i < n; i++) if (!shelf[i]) empty.push(i);
    const ids = nextIds(empty.length);
    empty.forEach((ci, k) => {
      if (!ids[k]) return;
      const t = makeToy(ids[k], 'shelf'), c = cellCentre(ci);
      t.cell = ci; t.x = c.x; t.y = c.y; t.s = 0; t.sT = shelfScale(t.id); t.delay = k * 0.09;
      shelf[ci] = t;
    });
  }

  function relayoutToys(old) {
    toys.forEach(t => {
      const d = dims(t.id); t.w = d.w; t.h = d.h;
      if (t.state === 'shelf') { const c = cellCentre(t.cell); t.x = c.x; t.y = c.y; t.sT = shelfScale(t.id); t.s = t.sT; }
      else if (t.state === 'ready') { t.x = Lt.ready.x; t.y = Lt.ready.y; }
      else if ((t.state === 'tank' || t.state === 'fade') && old) {
        t.x = T.ix0 + (t.x - old.ix0) / old.iw * T.iw;
        const f = (t.y - old.surf) / (old.sandTop - old.surf);
        t.y = T.surf + f * (T.sandTop - T.surf);
        if (t.landed) t.y = T.sandTop + 0.05 * U - t.h / 2;
        t.vx = t.vy = 0;
      } else if (t.state === 'fly' && t.fly) { t.state = t.fly.backTo || t.state; }
    });
    toys.filter(t => t.state === 'fly').forEach(t => { const f = t.fly; t.fly = null; t.state = 'x'; if (f.done) f.done(); });
    for (let i = toys.length - 1; i >= 0; i--) if (toys[i].state === 'x') toys.splice(i, 1);
    if (screen === 'game' && shelf.length !== Lt.shelf.n) {
      const keep = shelf.filter(Boolean);
      shelf.forEach(t => { if (t) t.cell = -1; });
      shelf = new Array(Lt.shelf.n).fill(null);
      keep.forEach((t, i) => { if (i < shelf.length) { shelf[i] = t; t.cell = i; const c = cellCentre(i); t.x = c.x; t.y = c.y; } else removeToy(t); });
      fillShelf(false);
    }
    drops.length = bubbles.length = puffs.length = 0;
  }

  /* ---------------- physics (fixed small steps) ---------------- */
  const STEP = 1 / 120;
  function physStep(dt) {
    stepWaves();
    const list = inTank();
    for (const t of list) {
      t.age += dt;
      const wy = waterY(t.x);
      const bottom = t.y + t.h / 2, prevBottom = bottom - t.vy * dt;
      const sub = clamp((bottom - wy) / t.h, 0, 1);
      if (!t.wet && sub > 0) {
        t.wet = true; t.inT = 0; t.enter = tNow;
        if (prevBottom <= wy + 2 && t.vy > 0.3 * U) splash(t, t.vy);
        else pushWater(t.x, t.w, 0.004 * U);
        if (t.def.floats && t.y - t.h / 2 > wy + 0.05 * U) t.popup = true;
      }
      if (t.wet) t.inT += dt;
      let ay;
      if (t.def.floats) {
        ay = GRAV * (1 - sub / t.def.sub);
        if (sub > 0) { ay -= 2.8 * t.vy; t.vx *= Math.exp(-2.2 * dt); }
        if (t.popup && sub < 0.995) {
          t.popup = false; Sfx.play('boing');
          if (mode === 'free' && !Voice.busy()) say('popup');
          pushWater(t.x, t.w, -0.008 * U);
        }
        if (t.def.id === 'sponge' && sub > 0.9 && Math.random() < 0.3) addBubble(t.x + rnd(-0.3, 0.3) * t.w, t.y, rnd(0.025, 0.05) * U);
        // tip with the waves
        const target = sub > 0 && sub < 1 ? Math.atan((waterY(t.x + t.w / 3) - waterY(t.x - t.w / 3)) / (t.w * 0.67)) * 0.9 : t.rot * 0.98;
        t.vr += ((target - t.rot) * 40 - t.vr * 7) * dt;
      } else {
        ay = GRAV * (1 - sub) + sub * 5 * (t.def.vt * U - t.vy);
        if (sub > 0) t.vx *= Math.exp(-2.5 * dt);
        let target = 0;
        if (sub > 0.3 && !t.landed) {
          if (t.def.flutter) { t.vx += (t.def.flutter * U * 2.2 * Math.cos(t.inT * 3.3) - t.vx) * 4 * dt; target = t.def.flutter * 0.9 * Math.sin(t.inT * 3.3); }
          if (t.def.tumble) target = t.def.tumble * Math.sin(t.inT * 3.1);
          t.bubT -= dt;
          if (t.bubT <= 0) { t.bubT = rnd(0.1, 0.24); addBubble(t.x + rnd(-0.3, 0.3) * t.w, t.y - t.h * 0.4, rnd(0.025, 0.06) * U); if (t === active) Sfx.play('bubble', 0.8); }
        }
        t.vr += ((target - t.rot) * 30 - t.vr * 6) * dt;
      }
      t.vy += ay * dt;
      t.x += t.vx * dt; t.y += t.vy * dt; t.rot += t.vr * dt;
      // sand
      const ground = T.sandTop + 0.05 * U - t.h / 2;
      if (t.y >= ground) {
        t.y = ground;
        if (t.vy > 1.1 * U && !t.landed) {
          sandPuff(t.x, T.sandTop + 0.05 * U, clamp(t.w / U, 0.5, 1.2));
          Sfx.play('thud', clamp(t.vy / (2.5 * U), 0.4, 1));
          t.vy *= -0.18;
        } else t.vy = 0;
        if (!t.landed) { t.landed = true; t.landT = 0; }
        t.vx *= Math.exp(-6 * dt);
      }
      if (t.landed) t.landT += dt;
      // walls
      let lo = T.ix0 + t.w / 2 + 2, hi = T.ix1 - t.w / 2 - 2;
      if (t.def.floats && sub > 0 && sub < 1) hi = Math.min(hi, Lt.frog.padX - Lt.frog.padRx - t.w * 0.45);
      if (hi < lo) hi = lo;
      if (t.x < lo) { t.x = lo; t.vx = Math.abs(t.vx) * 0.3; }
      if (t.x > hi) { t.x += (hi - t.x) * 0.2; if (t.vx > 0) t.vx *= -0.3; }
      // finished moving?
      if (!t.settled && t.wet) {
        const done = t.def.floats
          ? (t.inT > 0.9 && Math.abs(t.vy) < 0.6 * U && Math.abs(sub - t.def.sub) < 0.15) || t.inT > 2.5
          : t.landed && t.landT > 0.3;
        if (done) { t.settled = true; onSettled(t); }
      }
    }
    // toys don't sit inside each other
    for (let i = 0; i < list.length; i++) for (let j = i + 1; j < list.length; j++) {
      const a = list[i], b = list[j];
      const ox = (a.w + b.w) / 2 * 0.82 - Math.abs(a.x - b.x), oy = (a.h + b.h) / 2 * 0.82 - Math.abs(a.y - b.y);
      if (ox > 0 && oy > 0) {
        const d = (a.x < b.x || (a.x === b.x && i < j)) ? -1 : 1, m = Math.min(ox, U * 0.6) * 0.06;
        a.x += d * m; b.x -= d * m;
      }
    }
  }

  /* ---------------- per-frame updates ---------------- */
  function update(dt) {
    for (let i = toys.length - 1; i >= 0; i--) {
      const t = toys[i];
      if (t.delay > 0) { t.delay -= dt; continue; }
      // bouncy scale
      if (t.state !== 'fly') { t.vs += ((t.sT - t.s) * 220 - t.vs * 13) * dt; t.s += t.vs * dt; }
      if (t.wig > 0) t.wig = Math.max(0, t.wig - dt);
      if (t.state === 'fly') {
        const f = t.fly; f.t += dt;
        const k = Math.min(1, f.t / f.dur), e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
        t.x = f.x0 + (f.x1 - f.x0) * e; t.y = f.y0 + (f.y1 - f.y0) * e - f.arc * Math.sin(Math.PI * k);
        t.s = f.s0 + (f.s1 - f.s0) * e; t.rot *= 0.9;
        if (k >= 1) { t.fly = null; t.state = 'x'; t.s = f.s1; t.sT = f.s1; t.vs = 0; if (f.done) f.done(t); if (t.state === 'x') t.state = 'idle'; }
      } else if (t.state === 'drag') {
        t.x += (drag.px + drag.ox - t.x) * Math.min(1, dt * 28);
        t.y += (drag.py + drag.oy - t.y) * Math.min(1, dt * 28);
        t.rot += (clamp(drag.vx / (12 * U), -0.35, 0.35) - t.rot) * Math.min(1, dt * 10);
        // dragging it through the surface makes a small splash
        const wy = waterY(t.x), b = t.y + t.h / 2;
        if (t.x > T.ix0 && t.x < T.ix1) {
          if (drag.lastB != null && drag.lastB < wy && b >= wy && drag.vy > 1.5 * U) splash(t, Math.min(drag.vy, 3 * U));
          else if (drag.lastB != null && drag.lastB > wy && b <= wy && drag.vy < -1.5 * U) { Sfx.play('drip'); pushWater(t.x, t.w, -0.006 * U); }
        }
        drag.lastB = b;
      } else if (t.state === 'fade') {
        t.a -= dt * 2.4; t.sT = 0.6;
        if (t.a <= 0) toys.splice(i, 1);
      } else if (t.state === 'shelf' || t.state === 'ready') {
        t.rot += (0 - t.rot) * Math.min(1, dt * 8);
      }
    }
    stepBits(dt);
    frogFrame();
    hintCheck();
  }

  /* ---------------- drawing ---------------- */
  function drawToy(t) {
    const c = toyArt[t.id]; if (!c || t.a <= 0 || t.s <= 0.01) return;
    cx.save();
    cx.globalAlpha = clamp(t.a, 0, 1);
    cx.translate(t.x, t.y);
    let r = t.rot;
    if (t.wig > 0) r += Math.sin(t.wig * 34) * 0.22 * (t.wig / 0.6);
    if (t.state === 'shelf' && !reduceMotion) r += Math.sin(tNow * 2 + t.cell * 1.7) * 0.03;
    cx.rotate(r); cx.scale(t.s, t.s);
    cx.drawImage(c, -t.w / 2, -t.h / 2, t.w, t.h);
    cx.restore();
  }
  function shadow(x, y, w, a) {
    cx.fillStyle = 'rgba(80,40,10,' + a + ')';
    cx.beginPath(); cx.ellipse(x, y, w * 0.42, Math.max(3, w * 0.08), 0, 0, 7); cx.fill();
  }
  function wavePath(extraDown) {
    cx.beginPath();
    const n = 48;
    for (let i = 0; i <= n; i++) {
      const x = T.ix0 + T.iw * i / n, y = waterY(x);
      if (i === 0) cx.moveTo(x - 1, y); else cx.lineTo(x, y);
    }
    if (extraDown !== undefined) { cx.lineTo(T.ix1 + 1, extraDown); cx.lineTo(T.ix0 - 1, extraDown); cx.closePath(); }
  }
  function seaweed(x, hgt, ph) {
    cx.beginPath();
    const n = 7;
    for (let i = 0; i <= n; i++) {
      const k = i / n, y = T.sandTop + U * 0.06 - k * hgt;
      const xx = x + (reduceMotion ? 0 : Math.sin(tNow * 1.4 + ph + k * 2.2) * U * 0.16 * k);
      if (i === 0) cx.moveTo(xx, y); else cx.lineTo(xx, y);
    }
    cx.lineCap = 'round'; cx.lineJoin = 'round';
    cx.strokeStyle = ART.OL; cx.lineWidth = U * 0.15; cx.stroke();
    cx.strokeStyle = '#4DBA6A'; cx.lineWidth = U * 0.15 - 5; cx.stroke();
  }
  function render() {
    cx.setTransform(DPR, 0, 0, DPR, 0, 0);
    cx.drawImage(bg, 0, 0, W, H);
    const deep = T.iy1;

    // inside the tank
    cx.save();
    interiorPath(cx, -H); cx.clip();
    let gr = cx.createLinearGradient(0, T.surf, 0, deep);
    gr.addColorStop(0, '#A6E3FF'); gr.addColorStop(1, '#4FA8EE');
    wavePath(deep + 2); cx.fillStyle = gr; cx.fill();
    // soft light rays
    if (!reduceMotion) {
      cx.fillStyle = 'rgba(255,255,255,.10)';
      for (let i = 0; i < 3; i++) {
        const x = T.ix0 + T.iw * (0.2 + i * 0.3) + Math.sin(tNow * 0.4 + i * 2) * U * 0.3, w = U * (0.35 + 0.15 * i);
        cx.beginPath(); cx.moveTo(x, T.surf); cx.lineTo(x + w, T.surf); cx.lineTo(x + w - U * 0.6, deep); cx.lineTo(x - U * 0.9, deep); cx.fill();
      }
    }
    cx.drawImage(sandCv, T.ix0 - 1, T.sandTop - U * 0.2, sandCv.width / DPR, sandCv.height / DPR);
    const weedH = Math.min((T.sandTop - T.surf) * 0.55, U * 1.3);
    seaweed(T.ix0 + U * 0.3, weedH, 0); seaweed(T.ix0 + U * 0.62, weedH * 0.7, 1.3); seaweed(T.ix1 - U * 0.35, weedH * 0.8, 2.6);
    // shadows of sunk toys
    for (const t of toys) if ((t.state === 'tank' || t.state === 'fade') && t.landed) shadow(t.x, T.sandTop + 0.07 * U, t.w, 0.12 * t.a);
    for (const t of toys) if (t.state === 'tank' || t.state === 'fade') drawToy(t);
    // water in front: tints whatever is under the surface
    wavePath(deep + 2); cx.fillStyle = 'rgba(30,130,215,.26)'; cx.fill();
    for (const b of bubbles) {
      cx.beginPath(); cx.arc(b.x, b.y, b.r, 0, 7);
      cx.fillStyle = 'rgba(255,255,255,.35)'; cx.fill(); cx.lineWidth = 1.5; cx.strokeStyle = 'rgba(255,255,255,.9)'; cx.stroke();
    }
    for (const p of puffs) { cx.beginPath(); cx.arc(p.x, p.y, p.r, 0, 7); cx.fillStyle = 'rgba(244,213,138,' + (p.life * 0.7) + ')'; cx.fill(); }
    // shiny surface line
    wavePath(); cx.lineWidth = Math.max(3, U * 0.055); cx.strokeStyle = 'rgba(255,255,255,.95)'; cx.lineJoin = 'round'; cx.stroke();
    // lily pad
    const F = Lt.frog, py = waterY(F.padX);
    cx.beginPath(); cx.ellipse(F.padX, py + F.w * 0.02, F.padRx, F.w * 0.14, 0, 0.25, Math.PI * 2 - 0.1);
    cx.lineTo(F.padX, py + F.w * 0.02); cx.closePath();
    cx.fillStyle = '#5DBB4C'; cx.fill(); cx.lineWidth = Math.max(2.5, U * 0.04); cx.strokeStyle = ART.OL; cx.stroke();
    cx.restore();

    // front glass + rim
    const gw = T.gw, hw = gw / 2;
    cx.beginPath();
    cx.moveTo(T.x0 + hw, T.y0); cx.lineTo(T.x0 + hw, T.y1 - hw - T.r);
    cx.quadraticCurveTo(T.x0 + hw, T.y1 - hw, T.x0 + hw + T.r, T.y1 - hw);
    cx.lineTo(T.x1 - hw - T.r, T.y1 - hw);
    cx.quadraticCurveTo(T.x1 - hw, T.y1 - hw, T.x1 - hw, T.y1 - hw - T.r);
    cx.lineTo(T.x1 - hw, T.y0);
    cx.lineCap = 'round'; cx.lineJoin = 'round';
    cx.strokeStyle = ART.OL; cx.lineWidth = gw; cx.stroke();
    cx.fillStyle = '#fff';
    [T.x0 + hw, T.x1 - hw].forEach(x => { cx.beginPath(); cx.arc(x, T.y0, gw * 0.85, 0, 7); cx.fill(); cx.lineWidth = Math.max(2, gw * 0.4); cx.stroke(); });
    // reflections on the glass
    cx.fillStyle = 'rgba(255,255,255,.28)';
    const rx = T.ix0 + U * 0.18, ry = T.y0 + (T.y1 - T.y0) * 0.22, rh = (T.y1 - T.y0) * 0.38;
    cx.beginPath(); cx.moveTo(rx, ry + U * 0.25); cx.lineTo(rx + U * 0.12, ry); cx.lineTo(rx + U * 0.12, ry + rh - U * 0.25); cx.lineTo(rx, ry + rh); cx.fill();
    cx.beginPath(); cx.moveTo(rx + U * 0.22, ry + U * 0.15); cx.lineTo(rx + U * 0.27, ry + U * 0.05); cx.lineTo(rx + U * 0.27, ry + rh * 0.5); cx.lineTo(rx + U * 0.22, ry + rh * 0.55); cx.fill();
    // drops in the air
    for (const d of drops) {
      cx.beginPath(); cx.arc(d.x, d.y, d.r, 0, 7);
      cx.fillStyle = '#7CCBFF'; cx.fill(); cx.lineWidth = 1.5; cx.strokeStyle = 'rgba(45,33,64,.5)'; cx.stroke();
    }

    // testing spot (guess mode)
    if (mode === 'guess') {
      const rd = Lt.ready, R = Math.min(0.62 * U, rd.band * 0.42);
      cx.save();
      cx.setLineDash([R * 0.32, R * 0.22]); cx.lineDashOffset = reduceMotion ? 0 : -tNow * 12;
      cx.lineWidth = Math.max(3, U * 0.045); cx.strokeStyle = ready ? 'rgba(255,255,255,.95)' : 'rgba(255,255,255,.7)';
      cx.beginPath(); cx.arc(rd.x, rd.y, R, 0, 7); cx.stroke();
      if (!ready) {
        cx.setLineDash([]); cx.fillStyle = 'rgba(255,255,255,.75)';
        cx.font = '700 ' + Math.round(R * 0.9) + 'px Fredoka, sans-serif'; cx.textAlign = 'center'; cx.textBaseline = 'middle';
        cx.fillText('?', rd.x, rd.y + R * 0.05);
      }
      cx.restore();
    }
    // shelf toys, then the ones being moved
    for (const t of toys) if (t.state === 'shelf' && t.delay <= 0) { shadow(t.x, cellRect(t.cell).y + cellRect(t.cell).h - U * 0.13, t.w * t.s, 0.18); drawToy(t); }
    for (const t of toys) if (t.state === 'ready' || t.state === 'idle') drawToy(t);
    for (const t of toys) if (t.state === 'fly') drawToy(t);
    if (drag && drag.t) drawToy(drag.t);
  }

  /* ---------------- Fizz ---------------- */
  frogEl.querySelector('.inner').innerHTML = ART.frog();
  function frogFrame() {
    const F = Lt.frog, py = waterY(F.padX);
    frogEl.style.transform = 'translate(' + (F.padX - F.w / 2) + 'px,' + (py - F.h * 0.9) + 'px)';
  }
  function frogDo(cls) {
    frogEl.classList.remove(cls); void frogEl.offsetWidth; frogEl.classList.add(cls);
    setTimeout(() => frogEl.classList.remove(cls), 950);
  }
  onTap(frogEl, () => {
    frogDo('hop');
    if (mode === 'free') { say(drag ? 'ribbit' : 'free_intro'); return; }
    if (phase === 'pick') say('pick');
    else if (phase === 'guess') say(['ask']);
    else if (phase === 'drop') say('drop');
    else Sfx.play('ribbit');
  });

  /* ---------------- dragging ---------------- */
  let downAt = null;
  function hitToy(x, y) {
    const near = t => {
      const hw = Math.max(t.w * t.s, 0.9 * U) / 2 + 0.1 * U, hh = Math.max(t.h * t.s, 0.9 * U) / 2 + 0.1 * U;
      return Math.abs(x - t.x) < hw && Math.abs(y - t.y) < hh;
    };
    if (ready && ready.state === 'ready' && near(ready)) return ready;
    for (let i = 0; i < shelf.length; i++) {
      const t = shelf[i]; if (!t || t.state !== 'shelf') continue;
      const c = cellRect(i);
      if (x >= c.x && x <= c.x + c.w && y >= c.y && y <= c.y + c.h) return t;
    }
    const tank = inTank().filter(t => t.settled && t !== active);
    for (let i = tank.length - 1; i >= 0; i--) if (near(tank[i])) return tank[i];
    return null;
  }
  cv.addEventListener('pointerdown', e => {
    if (!e.isPrimary || screen !== 'game' || drag) return;
    Sfx.unlock(); poke();
    const t = hitToy(e.clientX, e.clientY);
    if (!t) return;
    downAt = { x: e.clientX, y: e.clientY, time: clock() };
    if (t.state === 'shelf') {
      if (mode === 'guess') { pickToy(t); return; }
      startDrag(t, e, 'shelf');
    } else if (t === ready) {
      if (phase === 'guess') { t.wig = 0.6; Sfx.play('wiggle'); nudgeGuess(); say('guess_first'); return; }
      if (phase === 'drop') startDrag(t, e, 'ready');
    } else if (t.state === 'tank') {
      if (mode === 'guess' && (phase === 'watch' || phase === 'result')) { t.wig = 0.6; return; }
      startDrag(t, e, 'tank');
    }
  });
  function startDrag(t, e, from) {
    try { cv.setPointerCapture(e.pointerId); } catch (er) { /* */ }
    drag = { t, from, cell: t.cell, px: e.clientX, py: e.clientY, ox: t.x - e.clientX, oy: t.y - e.clientY,
      vx: 0, vy: 0, lt: clock(), lastB: null, id: e.pointerId };
    if (from === 'shelf') { shelf[t.cell] = null; t.cell = -1; }
    if (from === 'tank') { t.wet = false; t.landed = false; t.settled = false; t.popup = false; t.vx = t.vy = t.vr = 0; }
    t.state = 'drag'; t.sT = 1.08; t.wig = 0;
    // lift it so the finger doesn't hide it
    drag.oy = Math.min(drag.oy, -t.h * 0.25);
    Sfx.play('pickup'); hideHand();
  }
  cv.addEventListener('pointermove', e => {
    if (!drag || e.pointerId !== drag.id) return;
    const n = clock(), dt = Math.max(0.008, n - drag.lt);
    drag.vx = drag.vx * 0.6 + (e.clientX - drag.px) / dt * 0.4;
    drag.vy = drag.vy * 0.6 + (e.clientY - drag.py) / dt * 0.4;
    drag.px = e.clientX; drag.py = e.clientY; drag.lt = n;
  });
  const endDrag = e => {
    if (!drag || e.pointerId !== drag.id) return;
    const d = drag, t = d.t; drag = null;
    const moved = downAt ? Math.hypot(e.clientX - downAt.x, e.clientY - downAt.y) : 99;
    const tap = moved < 12 && downAt && clock() - downAt.time < 0.45;
    t.sT = 1;
    const overTank = t.x > T.ix0 && t.x < T.ix1 && t.y > Lt.top - U * 0.2;
    if (d.from === 'ready') {
      if (tap || overTank) releaseIntoTank(t, tap ? 0 : d.vx, tap ? 0 : d.vy);
      else { flyTo(t, Lt.ready.x, Lt.ready.y, 0.35, 1, x => { x.state = 'ready'; }); Sfx.play('swish'); }
    } else if (d.from === 'shelf') {
      if (tap) { flyTo(t, clamp(T.ix0 + T.iw * rnd(0.3, 0.6), T.ix0 + t.w, Lt.frog.padX - Lt.frog.padRx - t.w / 2), T.y0 - t.h * 0.3, 0.45, 1, x => releaseIntoTank(x, 0, 0)); }
      else if (overTank) releaseIntoTank(t, d.vx, d.vy);
      else {
        const ci = shelf.indexOf(null);
        if (ci >= 0) { shelf[ci] = t; const c = cellCentre(ci); flyTo(t, c.x, c.y, 0.35, shelfScale(t.id), x => { x.state = 'shelf'; x.cell = ci; }); }
        else t.state = 'fade';
        Sfx.play('swish'); return;
      }
      setTimeout(() => { if (screen === 'game') fillShelf(false); }, 450);
    } else {
      if (overTank) releaseIntoTank(t, d.vx, d.vy);
      else flyTo(t, clamp(t.x, T.ix0 + t.w, T.ix1 - t.w), T.y0 - t.h * 0.3, 0.4, 1, x => releaseIntoTank(x, 0, 0));
    }
  };
  cv.addEventListener('pointerup', endDrag);
  cv.addEventListener('pointercancel', endDrag);

  function releaseIntoTank(t, vx, vy) {
    t.state = 'tank';
    t.x = clamp(t.x, T.ix0 + t.w / 2 + 2, T.ix1 - t.w / 2 - 2);
    t.y = Math.min(t.y, T.sandTop - t.h / 2);
    t.vx = clamp(vx, -3 * U, 3 * U) * 0.3; t.vy = clamp(vy, -U, 6 * U) * 0.5; t.vr = 0;
    t.wet = false; t.landed = false; t.settled = false; t.inT = 0; t.age = 0;
    if (t === ready) {
      ready = null; active = t; phase = 'watch';
      hideGuess(true); hideHand();
    }
    // keep the tank tidy: the oldest toy leaves when it gets full
    const cap = mode === 'guess' ? 4 : 6, list = inTank().filter(x => x !== t);
    if (list.length >= cap) {
      const old = list.filter(x => x.settled && x !== active).sort((a, b) => a.enter - b.enter)[0];
      if (old) old.state = 'fade';
    }
  }

  /* ---------------- guess mode ---------------- */
  function pickToy(t) {
    if (!(phase === 'pick' || phase === 'guess' || phase === 'drop')) { t.wig = 0.6; Sfx.play('wiggle'); return; }
    const ci = t.cell;
    if (ready) {     // swap: the waiting toy goes back on the shelf
      const back = ready;
      shelf[ci] = back;
      const c = cellCentre(ci);
      flyTo(back, c.x, c.y, 0.4, shelfScale(back.id), x => { x.state = 'shelf'; x.cell = ci; });
    } else shelf[ci] = null;
    srcCell = ci;
    t.cell = -1; ready = t;
    flyTo(t, Lt.ready.x, Lt.ready.y, 0.45, 1, x => { if (x === ready) x.state = 'ready'; });
    Sfx.play('swish');
    phase = 'guess'; guess = null;
    showGuess();
    say([t.id + '_intro', 'ask']);
  }
  function showGuess() {
    [gFloat, gSink].forEach(b => { b.classList.remove('chosen', 'faded', 'nudge'); b.classList.add('on'); });
  }
  function hideGuess(keepChosen) {
    [gFloat, gSink].forEach(b => {
      if (keepChosen && b.classList.contains('chosen')) return;
      b.classList.remove('on', 'nudge');
      if (!keepChosen) b.classList.remove('chosen', 'faded');
    });
  }
  function nudgeGuess() {
    [gFloat, gSink].forEach(b => { b.classList.remove('nudge'); void b.offsetWidth; b.classList.add('nudge'); });
  }
  function choose(g) {
    if (phase !== 'guess' || !ready) return;
    guess = g; phase = 'drop';
    const me = g === 'float' ? gFloat : gSink, other = g === 'float' ? gSink : gFloat;
    me.classList.remove('nudge'); other.classList.remove('nudge');
    me.classList.add('chosen'); other.classList.add('faded');
    Sfx.play('pop');
    say(['guess_' + g, 'drop'], () => { if (phase === 'drop' && ready) showDragHint(); });
  }
  gFloat.insertAdjacentHTML('afterbegin', ART.ICON.float);
  gSink.insertAdjacentHTML('afterbegin', ART.ICON.sink);
  onTap(gFloat, () => choose('float'));
  onTap(gSink, () => choose('sink'));

  function result(t) {
    phase = 'result';
    const right = (guess === 'float') === t.def.floats;
    const isNew = addToChart(t);
    let lines;
    if (right) {
      streak++;
      save.stars++; persist();
      flyStar(t);
      Sfx.play('sparkle'); frogDo('hop');
      const k = streak >= 3 ? 'right3' : (rightN++ % 2 ? 'right2' : 'right1');
      lines = [t.id + '_why', k];
    } else {
      streak = 0;
      Sfx.play('ooh'); frogDo('wow');
      lines = [t.id + '_why', surpN++ % 2 ? 'surprise2' : 'surprise1'];
    }
    setTimeout(() => hideGuess(false), 1200);
    fillShelf(false);
    say(lines, () => {
      active = null;
      if (screen !== 'game') return;
      if (testedCount() === TOYS.length && !save.party) { party(); phase = 'pick'; return; }
      phase = 'pick';
      say('pick_another');
    }, true);
    void isNew;
  }

  /* ---------------- free mode ---------------- */
  function onSettled(t) {
    showLabel(t);
    if (mode === 'guess') { if (t === active && phase === 'watch') result(t); return; }
    const isNew = addToChart(t);
    if (isNew) Sfx.play('sparkle');
    const after = () => { if (testedCount() === TOYS.length && !save.party) party(); };
    if (!heardWhy[t.id]) { heardWhy[t.id] = true; say(t.id + '_why', after); }
    else if (!Voice.busy()) say(t.def.floats ? 'floats' : 'sinks', after);
    else after();
  }

  /* ---------------- labels, chart, stars ---------------- */
  const fx = $('#fx');
  function showLabel(t) {
    const el = document.createElement('div');
    el.className = 'res ' + (t.def.floats ? 'float' : 'sink');
    el.textContent = t.def.floats ? 'Floats!' : 'Sinks!';
    el.style.fontSize = Math.max(16, 0.3 * U) + 'px';
    const y = t.def.floats ? Math.min(t.y - t.h * 0.6, waterY(t.x) - t.h * 0.5) : t.y - t.h * 0.6;
    el.style.left = clamp(t.x, T.ix0 + U, T.ix1 - U) + 'px'; el.style.top = y + 'px';
    fx.appendChild(el);
    setTimeout(() => el.remove(), 2900);
  }
  const slotsF = chartEl.querySelector('.col.float .slots'), slotsS = chartEl.querySelector('.col.sink .slots');
  for (let i = 0; i < 8; i++) {
    slotsF.insertAdjacentHTML('beforeend', '<button class="slot" aria-label="empty"></button>');
    slotsS.insertAdjacentHTML('beforeend', '<button class="slot" aria-label="empty"></button>');
  }
  chartEl.querySelector('.col.float .ch-head').insertAdjacentHTML('afterbegin', ART.ICON.float);
  chartEl.querySelector('.col.sink .ch-head').insertAdjacentHTML('afterbegin', ART.ICON.sink);
  function slotFor(id) {
    const fl = BY_ID[id].floats, list = save.order.filter(x => BY_ID[x].floats === fl);
    return (fl ? slotsF : slotsS).children[list.indexOf(id)];
  }
  function renderChart(skip) {
    [slotsF, slotsS].forEach(c => [...c.children].forEach(s => { s.className = 'slot'; s.innerHTML = ''; s.dataset.id = ''; s.setAttribute('aria-label', 'empty'); }));
    save.order.forEach(id => {
      const s = slotFor(id); if (!s) return;
      s.dataset.id = id; s.setAttribute('aria-label', BY_ID[id].name);
      if (id === skip) return;
      s.classList.add('filled'); s.innerHTML = '<img alt="" src="' + ART.toyUrl(id) + '">';
    });
  }
  function addToChart(t) {
    if (save.tested[t.id]) return false;
    save.tested[t.id] = t.def.floats ? 'f' : 's'; save.order.push(t.id); persist();
    renderChart(t.id);
    const slot = slotFor(t.id), r = slot.getBoundingClientRect();
    const im = document.createElement('img');
    im.className = 'flyer'; im.src = ART.toyUrl(t.id); im.alt = '';
    const w0 = t.w, h0 = t.h;
    im.style.width = w0 + 'px'; im.style.height = h0 + 'px';
    fx.appendChild(im);
    const sx = r.width * 0.84 / Math.max(w0, h0);
    const a = im.animate([
      { transform: 'translate(' + (t.x - w0 / 2) + 'px,' + (t.y - h0 / 2) + 'px) scale(1)', opacity: 0.2 },
      { transform: 'translate(' + (t.x - w0 / 2) + 'px,' + (t.y - h0 / 2 - U * 0.8) + 'px) scale(1.1)', opacity: 1, offset: 0.3 },
      { transform: 'translate(' + (r.left + r.width / 2 - w0 / 2) + 'px,' + (r.top + r.height / 2 - h0 / 2) + 'px) scale(' + sx + ')', opacity: 1 },
    ], { duration: reduceMotion ? 10 : 1300, easing: 'ease-in-out', delay: 500, fill: 'both' });
    a.onfinish = () => { im.remove(); renderChart(); const s = slotFor(t.id); if (s) s.classList.add('new'); Sfx.play('pop'); };
    return true;
  }
  chartEl.addEventListener('pointerdown', e => {
    Sfx.unlock(); poke();
    const h = e.target.closest('.ch-head');
    if (h) {
      const fl = h.dataset.k === 'float';
      say(fl ? 'these_float' : 'these_sink');
      [...(fl ? slotsF : slotsS).querySelectorAll('img')].forEach((im, i) =>
        im.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.3) rotate(8deg)' }, { transform: 'scale(1)' }], { duration: 500, delay: i * 90 }));
      return;
    }
    const s = e.target.closest('.slot');
    if (s && s.dataset.id && s.classList.contains('filled')) {
      say(s.dataset.id + '_why');
      s.firstChild && s.firstChild.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.3)' }, { transform: 'scale(1)' }], { duration: 400 });
    }
  });

  const starsEl = $('#stars'), starN = $('#starN');
  starsEl.querySelector('.st').innerHTML = ART.ICON.star;
  function showStars() { starN.textContent = save.stars; }
  function flyStar(t) {
    const r = starsEl.querySelector('.st').getBoundingClientRect(), sz = r.width;
    for (let i = 0; i < 3; i++) {
      const el = document.createElement('div');
      el.className = 'flystar'; el.innerHTML = ART.ICON.star;
      el.style.width = el.style.height = sz + 'px';
      fx.appendChild(el);
      const x0 = t.x - sz / 2 + (i - 1) * sz * 0.8, y0 = t.y - t.h / 2 - sz;
      const a = el.animate([
        { transform: 'translate(' + x0 + 'px,' + (y0 + sz) + 'px) scale(.2)', opacity: 0 },
        { transform: 'translate(' + x0 + 'px,' + y0 + 'px) scale(1.4) rotate(40deg)', opacity: 1, offset: 0.3 },
        { transform: 'translate(' + r.left + 'px,' + r.top + 'px) scale(1) rotate(180deg)', opacity: 1 },
      ], { duration: reduceMotion ? 10 : 1100, easing: 'ease-in-out', delay: 300 + i * 120, fill: 'both' });
      a.onfinish = () => {
        el.remove();
        if (i === 2) { showStars(); starsEl.classList.remove('bump'); void starsEl.offsetWidth; starsEl.classList.add('bump'); }
        Sfx.play('star');
      };
    }
  }

  /* ---------------- buttons ---------------- */
  const soundBtn = $('#soundBtn');
  function showSound() { soundBtn.innerHTML = save.muted ? ART.ICON.soundOff : ART.ICON.soundOn; }
  onTap(soundBtn, () => {
    save.muted = !save.muted; persist(); showSound();
    if (save.muted) { Voice.stop(); Talk.stop(); }
    else { Sfx.play('tap'); if (!Voice.busy()) say('sound_on'); }
  });
  $('#homeBtn').innerHTML = ART.ICON.home;
  onTap($('#homeBtn'), () => { Sfx.play('tap'); goTitle(); });
  $('#shuffleBtn').innerHTML = ART.ICON.shuffle;
  onTap($('#shuffleBtn'), () => {
    if (drag) return;
    Sfx.play('swish');
    fillShelf(true);
    if (!(mode === 'guess' && phase === 'result')) say('new_toys');
  });
  $('#netBtn').innerHTML = ART.ICON.net;
  onTap($('#netBtn'), () => {
    if (mode === 'guess' && (phase === 'watch' || phase === 'result')) { Sfx.play('wiggle'); return; }
    let n = 0;
    inTank().forEach(t => { if (t !== active) { t.state = 'fade'; n++; } });
    Sfx.play('scoop');
    if (n) pushWater(T.ix0 + T.iw / 2, T.iw, -0.01 * U);
    if (!(mode === 'guess' && phase === 'result')) say('all_clean');
  });

  /* ---------------- hints (a little hand) ---------------- */
  const hand = $('#hand');
  hand.innerHTML = ART.ICON.hand;
  let lastPoke = clock(), hints = 0;
  function poke() { lastPoke = clock(); hints = 0; }
  function tip() { const w = hand.offsetWidth || U * 0.75; return [w * 0.47, w * 1.25 * 0.04]; }
  function hideHand() { hand.getAnimations().forEach(a => a.cancel()); hand.style.opacity = 0; }
  function handTap(x, y) {
    if (reduceMotion) return;
    const [ox, oy] = tip(); hideHand();
    hand.style.transformOrigin = ox + 'px ' + oy + 'px';
    const p = (dx, dy, s) => 'translate(' + (x - ox + dx) + 'px,' + (y - oy + dy) + 'px) scale(' + s + ')';
    hand.animate([
      { opacity: 0, transform: p(U * 0.4, U * 0.5, 1) }, { opacity: 1, transform: p(0, U * 0.12, 1), offset: 0.18 },
      { transform: p(0, 0, 0.88), offset: 0.3 }, { transform: p(0, U * 0.12, 1), offset: 0.42 },
      { transform: p(0, 0, 0.88), offset: 0.54 }, { transform: p(0, U * 0.12, 1), offset: 0.66 },
      { opacity: 1, transform: p(0, U * 0.12, 1), offset: 0.85 }, { opacity: 0, transform: p(U * 0.4, U * 0.5, 1) },
    ], { duration: 2400, easing: 'ease-in-out' });
  }
  function handDrag(x0, y0, x1, y1) {
    if (reduceMotion) return;
    const [ox, oy] = tip(); hideHand();
    hand.style.transformOrigin = ox + 'px ' + oy + 'px';
    const p = (x, y, s) => 'translate(' + (x - ox) + 'px,' + (y - oy) + 'px) scale(' + s + ')';
    hand.animate([
      { opacity: 0, transform: p(x0 + U * 0.3, y0 + U * 0.4, 1) }, { opacity: 1, transform: p(x0, y0, 1), offset: 0.15 },
      { transform: p(x0, y0, 0.88), offset: 0.25 }, { transform: p(x1, y1, 0.88), offset: 0.7, easing: 'ease-in' },
      { opacity: 1, transform: p(x1, y1, 1), offset: 0.8 }, { opacity: 0, transform: p(x1, y1 + U * 0.3, 1) },
    ], { duration: 2600, easing: 'ease-in-out', iterations: 1 });
  }
  function showDragHint() {
    if (ready) handDrag(ready.x, ready.y, Lt.ready.x, T.surf + (T.sandTop - T.surf) * 0.4);
  }
  function hintCheck() {
    if (screen !== 'game' || drag || hints >= 3 || Voice.busy() || $('#party').classList.contains('on')) return;
    if (clock() - lastPoke < 8) return;
    lastPoke = clock(); hints++;
    if (mode === 'free') {
      const t = shelf.find(Boolean);
      if (t) handDrag(t.x, t.y, T.ix0 + T.iw * 0.45, T.surf + (T.sandTop - T.surf) * 0.4);
      if (hints === 1) say('free_intro');
      return;
    }
    if (phase === 'pick') {
      const t = shelf.find(Boolean);
      if (t) handTap(t.x, t.y);
      if (hints === 1) say('pick');
    } else if (phase === 'guess') {
      nudgeGuess();
      const b = (hints % 2 ? gFloat : gSink).getBoundingClientRect();
      handTap(b.left + b.width / 2, b.top + b.height / 2);
      if (hints === 1) say(['ask']);
    } else if (phase === 'drop') {
      showDragHint();
      if (hints === 1) say('drop');
    }
  }

  /* ---------------- screens ---------------- */
  const titleEl = $('#title');
  function startGame(m) {
    mode = m; screen = 'game';
    titleEl.classList.remove('on');
    hush();
    toys.length = 0; shelf = []; ready = null; active = null; drag = null;
    phase = 'pick'; guess = null; streak = 0;
    hideGuess(false); hideHand();
    document.body.classList.toggle('free', m === 'free');
    initWaves();
    fillShelf(true);
    renderChart(); showStars();
    poke();
    Sfx.play('splash', 0.6); pushWater(T.ix0 + T.iw * 0.5, T.iw * 0.3, 0.012 * U);
    if (m === 'guess') {
      if (!save.met) { save.met = true; persist(); say(['hello', 'lets_find', 'pick']); }
      else say('pick');
    } else {
      if (!save.freeMet) { save.freeMet = true; save.met = true; persist(); say(['hello', 'free_intro']); }
      else say('free_intro');
    }
  }
  function goTitle() {
    hush(); hideHand();
    screen = 'title';
    toys.length = 0; shelf = []; ready = null; active = null; drag = null;
    hideGuess(false);
    titleEl.classList.add('on');
    showProgress();
  }
  function showProgress() {
    const n = testedCount();
    $('#tProg').innerHTML = ART.ICON.star + '<span>' + save.stars + '</span><span>&nbsp;·&nbsp;' + n + ' of ' + TOYS.length + ' toys tested</span>';
  }
  // title art
  $('.w-sink').innerHTML = '<b>Sink</b>';
  $('.w-float').innerHTML = '<b>Float?</b>';
  $('.t-duck').src = ART.toyUrl('duck'); $('.t-ball').src = ART.toyUrl('ball');
  $('.t-rock').src = ART.toyUrl('rock'); $('.t-key').src = ART.toyUrl('key');
  $('.t-frog .inner').innerHTML = ART.frog();
  $('#freeIc').innerHTML = ART.ICON.float;
  let titleTalks = 0;
  onTap($('.t-frog'), () => {
    const f = $('.t-frog');
    f.classList.remove('hop'); void f.offsetWidth; f.classList.add('hop');
    say(titleTalks++ % 2 ? 'ribbit' : 'title');
  });
  onTap($('#playGuess'), () => { Sfx.play('tap'); startGame('guess'); });
  onTap($('#playFree'), () => { Sfx.play('tap'); startGame('free'); });
  // grown-ups: hold to start over
  const resetBtn = $('#resetBtn');
  let holdT = null;
  const holdEnd = () => { clearTimeout(holdT); resetBtn.classList.remove('holding'); };
  resetBtn.addEventListener('pointerdown', e => {
    Sfx.unlock();
    resetBtn.classList.add('holding');
    holdT = setTimeout(() => {
      resetBtn.classList.remove('holding');
      Object.assign(save, { tested: {}, order: [], stars: 0, met: false, freeMet: false, party: false });
      persist(); showProgress(); Sfx.play('pop');
      say('start_again');
    }, 2000);
    e.preventDefault();
  });
  ['pointerup', 'pointerleave', 'pointercancel'].forEach(ev => resetBtn.addEventListener(ev, holdEnd));

  /* ---------------- celebration ---------------- */
  const partyEl = $('#party');
  $('#pMedal').innerHTML = ART.ICON.star;
  function party() {
    save.party = true; persist();
    $('#pToys').innerHTML = TOYS.map(t => '<img alt="" src="' + ART.toyUrl(t.id) + '">').join('');
    partyEl.querySelectorAll('.confetti').forEach(c => c.remove());
    if (!reduceMotion) {
      const cols = ['#FF7A59', '#FFC93C', '#3FA9F5', '#7CCF5C', '#C38CFF', '#FF8FB8'];
      for (let i = 0; i < 46; i++) {
        const c = document.createElement('i');
        c.className = 'confetti';
        c.style.left = rnd(0, 100) + 'vw'; c.style.background = cols[i % cols.length];
        c.style.animationDuration = rnd(2.2, 4) + 's'; c.style.animationDelay = rnd(0, 1.2) + 's';
        partyEl.appendChild(c);
      }
    }
    partyEl.classList.add('on');
    Sfx.play('fanfare'); frogDo('hop');
    say('all_done');
  }
  onTap($('#pGo'), () => { partyEl.classList.remove('on'); Sfx.play('tap'); if (mode === 'guess') say('pick'); });

  /* ---------------- main loop ---------------- */
  let lastT = clock(), acc = 0;
  function frame() {
    const n = clock(), dt = Math.min(0.1, n - lastT);
    lastT = n;
    if (screen === 'game') {
      acc += dt;
      while (acc >= STEP) { tNow += STEP; physStep(STEP); acc -= STEP; }
      update(dt);
      render();
    }
    requestAnimationFrame(frame);
  }
  let rsT = null;
  addEventListener('resize', () => { clearTimeout(rsT); rsT = setTimeout(layout, 120); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) { hush(); Talk.stop(); } });

  showSound(); showStars(); showProgress();
  layout();
  renderChart();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { if (W) layout(); });
  requestAnimationFrame(frame);
  // for testing
  window.__sof = { get toys() { return toys; }, get phase() { return phase; }, get T() { return T; }, get Lt() { return Lt; }, get U() { return U; }, save };
})();
