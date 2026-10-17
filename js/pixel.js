/*
 * Pixel-art board renderer.
 * Everything is drawn at a tiny logical resolution (W x H "art pixels")
 * and scaled up by a whole number with smoothing off, so pixels stay crisp.
 */
(function (root) {
  'use strict';

  const C = root.Congkak;

  const W = 272, H = 92, OY = 12;           // logical canvas; board starts at y = OY
  const BOARD_H = 72, BOARD_R = 24;
  const PIT = 24, STORE_W = 28, STORE_H = 52, GAP = 4;
  const ROW_TOP = OY + 10, ROW_BOT = OY + 10 + PIT + GAP;

  const P = {
    outline: '#2a1307', woodD: '#5e3216', woodM: '#87501f', woodL: '#a2632a', woodH: '#c9884a',
    holeD: '#140903', holeM: '#2b1609', holeL: '#45260f', rimH: '#d39552',
    charD: '#0c0603', charM: '#1a0e07', redD: '#7a2412',
    gold: '#f2c14e', goldD: '#a87822', ink: '#1a0d05', text: '#f6ead2', red: '#e8613a',
    ice: '#8fe3ff', iceD: '#3f8fb8', aim: '#ff7eb6', aimD: '#a8457a', land: '#9dff8a',
    shadow: 'rgba(0,0,0,0.45)',
  };
  const SEED_PAL = [
    ['#fffbef', '#ecdcb8', '#a8865a'],
    ['#fff3dc', '#e0c592', '#94703f'],
    ['#ffffff', '#f2ead8', '#b39a74'],
  ];
  const SEED_SPRITE = ['.01.', '0112', '.12.'];

  // 3x5 bitmap digits
  const DIGITS = [
    '111101101101111', '010110010010111', '111001111100111', '111001111001111', '101101111001001',
    '111100111001111', '111100111101111', '111001010010010', '111101111101111', '111101111001111',
  ];

  function rng(seed) {
    return function () {
      seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function makeCanvas(w, h) {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    return c;
  }

  // Distance from a capsule's spine (a circle when w === h). Inside when <= w/2.
  function capsuleDist(w, h, px, py) {
    const r = w / 2;
    const x = px + 0.5, y = py + 0.5;
    const cy = Math.min(Math.max(y, r), h - r);
    const dx = x - r, dy = y - cy;
    return Math.sqrt(dx * dx + dy * dy);
  }

  // ---------- sprites ----------
  function holeSprite(w, h, burnt) {
    const c = makeCanvas(w, h);
    const g = c.getContext('2d');
    const r = w / 2;
    const band = 1 / (h / 2); // one pixel, in normalised units
    for (let py = 0; py < h; py++) {
      for (let px = 0; px < w; px++) {
        const d = capsuleDist(w, h, px, py);
        if (d > r) continue;
        const v = (py + 0.5 - h / 2) / (h / 2); // -1 top .. 1 bottom
        const dith = (px + py) & 1;
        let col;
        if (d > r - 1.2) col = v < 0 ? P.outline : P.rimH;     // carved rim: shadowed top, lit bottom
        else if (burnt) col = dith && v > 0 ? P.charM : P.charD;
        else if (v < -0.35 - band) col = P.holeD;
        else if (v < -0.35 + band) col = dith ? P.holeD : P.holeM;
        else if (v < 0.5 - band) col = P.holeM;
        else if (v < 0.5 + band) col = dith ? P.holeM : P.holeL;
        else col = P.holeL;
        g.fillStyle = col;
        g.fillRect(px, py, 1, 1);
      }
    }
    if (burnt) {
      g.fillStyle = P.redD;
      const cx = Math.floor(w / 2), cy = Math.floor(h / 2);
      for (let k = -4; k <= 3; k++) {
        g.fillRect(cx + k, cy + k, 1, 1);
        g.fillRect(cx + k, cy - k - 1, 1, 1);
      }
    }
    return c;
  }

  // Pixels of the 1px rings just outside a hole, relative to its top-left
  function ringPixels(w, h) {
    const r = w / 2;
    const r1 = [], r2 = [];
    for (let py = -2; py < h + 2; py++) {
      for (let px = -2; px < w + 2; px++) {
        const x = px + 0.5, y = py + 0.5;
        const cy = Math.min(Math.max(y, r), h - r);
        const d = Math.hypot(x - r, y - cy);
        if (d > r && d <= r + 1) r1.push(px, py);
        else if (d > r + 1 && d <= r + 2) r2.push(px, py);
      }
    }
    return { r1, r2 };
  }

  function buildWood() {
    const c = makeCanvas(W, H);
    const g = c.getContext('2d');
    const R = rng(1957);
    const inside = [];
    for (let y = 0; y < BOARD_H; y++) {
      inside[y] = [];
      for (let x = 0; x < W; x++) {
        const fx = x + 0.5, fy = y + 0.5;
        const cx = Math.min(Math.max(fx, BOARD_R), W - BOARD_R);
        const cy = Math.min(Math.max(fy, BOARD_R), BOARD_H - BOARD_R);
        inside[y][x] = Math.hypot(fx - cx, fy - cy) <= BOARD_R;
      }
    }
    const isIn = (x, y) => y >= 0 && y < BOARD_H && x >= 0 && x < W && inside[y][x];
    const put = (x, y, col) => { g.fillStyle = col; g.fillRect(x, y, 1, 1); };

    // drop shadow
    g.fillStyle = P.shadow;
    for (let y = 0; y < BOARD_H; y++) for (let x = 0; x < W; x++) {
      if (inside[y][x] && !isIn(x, y + 4)) g.fillRect(x, OY + y + 4, 1, 1);
    }

    // wood grain: horizontal streaks of random length
    for (let y = 0; y < BOARD_H; y++) {
      let x = 0;
      while (x < W) {
        const len = 3 + Math.floor(R() * 14);
        const roll = R();
        const col = roll < 0.14 ? P.woodD : roll < 0.3 ? P.woodL : P.woodM;
        for (let k = 0; k < len && x < W; k++, x++) if (inside[y][x]) put(x, OY + y, col);
      }
    }
    // bevel + outline
    for (let y = 0; y < BOARD_H; y++) for (let x = 0; x < W; x++) {
      if (!inside[y][x]) continue;
      const edge = !isIn(x - 1, y) || !isIn(x + 1, y) || !isIn(x, y - 1) || !isIn(x, y + 1);
      if (edge) put(x, OY + y, P.outline);
      else if (!isIn(x, y - 2)) put(x, OY + y, P.woodH);
      else if (!isIn(x, y + 2) || !isIn(x, y + 3)) put(x, OY + y, P.woodD);
    }

    // pucuk rebung (bamboo shoot) triangles carved along both long edges
    const x0 = 44, x1 = W - 44;
    for (let x = x0; x + 4 <= x1; x += 9) {
      const top = OY + 3, bot = OY + BOARD_H - 6;
      g.fillStyle = P.woodD;
      g.fillRect(x, top, 5, 1); g.fillRect(x + 1, top + 1, 3, 1); g.fillRect(x + 2, top + 2, 1, 1);
      g.fillRect(x + 2, bot, 1, 1); g.fillRect(x + 1, bot + 1, 3, 1); g.fillRect(x, bot + 2, 5, 1);
      g.fillStyle = P.woodH;
      g.fillRect(x + 1, top + 3, 3, 1);
      g.fillRect(x, bot + 3, 5, 1);
    }
    // carved groove between the two rows
    g.fillStyle = P.woodD;
    g.fillRect(x0, ROW_TOP + PIT + 1, x1 - x0, 1);
    g.fillStyle = P.woodH;
    g.fillRect(x0, ROW_TOP + PIT + 2, x1 - x0, 1);
    return c;
  }

  // ---------- layout ----------
  function geometry(dir) {
    const rects = [];
    for (let i = 0; i < C.SIZE; i++) {
      let col = i === 7 ? 1 : i === 15 ? 9 : i < 7 ? 8 - i : i - 6;
      if (dir !== 'cw') col = 10 - col;
      const store = C.isStore(i);
      const x = col === 1 ? 8 : col === 9 ? W - 8 - STORE_W : 8 + STORE_W + GAP + (col - 2) * (PIT + GAP);
      const y = store ? ROW_TOP : i < 7 ? ROW_BOT : ROW_TOP;
      const w = store ? STORE_W : PIT;
      const h = store ? STORE_H : PIT;
      rects[i] = { x, y, w, h, cx: x + w / 2, store, owner: C.ownerOf(i) };
    }
    return rects;
  }

  const seedCache = new Map();
  function seedOffsets(n, store) {
    const cap = store ? 70 : 24;
    const m = Math.min(n, cap);
    const key = (store ? 's' : 'p') + m;
    if (seedCache.has(key)) return seedCache.get(key);
    const list = [];
    for (let k = 0; k < m; k++) {
      const r = Math.sqrt(k + 0.5) * (store ? 1.25 : 1.6);
      const a = k * 2.39996;
      list.push([
        Math.round(Math.cos(a) * r * (store ? 1.05 : 1.1)),
        Math.round(Math.sin(a) * r * (store ? 2.1 : 0.95)),
        k % 3,
      ]);
    }
    list.sort((p, q) => p[1] - q[1]);
    seedCache.set(key, list);
    return list;
  }

  // ---------- board ----------
  function createPixelBoard(host, opts) {
    const canvas = document.createElement('canvas');
    canvas.className = 'pixel-board';
    canvas.tabIndex = 0;
    canvas.setAttribute('role', 'application');
    canvas.setAttribute('aria-label', 'Congkak board. Use arrow keys and Enter to play.');
    host.appendChild(canvas);
    const ctx = canvas.getContext('2d');

    const lc = makeCanvas(W, H);
    const g = lc.getContext('2d');
    const wood = buildWood();
    const sprites = {
      pit: holeSprite(PIT, PIT, false),
      pitBurnt: holeSprite(PIT, PIT, true),
      store: holeSprite(STORE_W, STORE_H, false),
    };
    const rings = { pit: ringPixels(PIT, PIT), store: ringPixels(STORE_W, STORE_H) };
    const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let S = 1;
    let rects = geometry('cw');
    const b = {
      view: new Array(C.SIZE).fill(0),
      burnt: new Array(C.SIZE).fill(false),
      legal: new Set(),
      flipTop: false,
      hover: -1,
      focus: -1,
      keyboard: false,
      hand: { show: false, n: 0, x: W / 2, y: 0, tx: W / 2, ty: 0 },
      flash: new Map(),
      shake: new Map(),
      picked: new Set(),
      frozen: [],      // frozen[i] truthy = draw the ice marker
      aiming: false,   // choosing a target for a power marble
      preview: new Map(), // hole -> 'end' | 'store' | 'take', the outcome of the hovered move
    };

    function resize() {
      const dpr = window.devicePixelRatio || 1;
      const avail = Math.min(host.clientWidth || W, Math.max(220, window.innerHeight - 210) * (W / H));
      S = Math.max(1, Math.floor((avail * dpr) / W));
      canvas.width = W * S;
      canvas.height = H * S;
      // On dense (phone) screens a non-integer stretch is invisible, so fill the space.
      // On low-DPI screens keep whole-number scaling so every art pixel is the same size.
      canvas.style.width = (dpr >= 2 ? Math.floor(avail) : (W * S) / dpr) + 'px';
    }

    // ---- drawing helpers (logical pixels) ----
    function px(x, y, w, h, col) { g.fillStyle = col; g.fillRect(x, y, w, h); }
    function drawRing(list, ox, oy, col) {
      g.fillStyle = col;
      for (let k = 0; k < list.length; k += 2) g.fillRect(ox + list[k], oy + list[k + 1], 1, 1);
    }
    function drawDigits(n, x, y, col, scale, flip) {
      const s = String(n);
      const tw = s.length * 4 - 1;
      g.fillStyle = col;
      for (let i = 0; i < s.length; i++) {
        const bits = DIGITS[s.charCodeAt(i) - 48];
        for (let r = 0; r < 5; r++) for (let c = 0; c < 3; c++) {
          if (bits[r * 3 + c] !== '1') continue;
          let dx = i * 4 + c, dy = r;
          if (flip) { dx = tw - 1 - dx; dy = 4 - dy; }
          g.fillRect(x + dx * scale, y + dy * scale, scale, scale);
        }
      }
    }
    function badge(n, cx, y, fg, bg, scale, flip) {
      const tw = (String(n).length * 4 - 1) * scale;
      const w = tw + 4;
      const h = 5 * scale + 4;
      const x = Math.round(cx - w / 2);
      px(x + 1, y, w - 2, h, bg);
      px(x, y + 1, w, h - 2, bg);
      drawDigits(n, x + 2, y + 2, fg, scale, flip);
    }

    // 5x5 snowflake on a frozen hole
    function drawSnowflake(x, y) {
      px(x + 2, y, 1, 5, P.ice);
      px(x, y + 2, 5, 1, P.ice);
      px(x, y, 1, 1, P.iceD); px(x + 4, y, 1, 1, P.iceD);
      px(x, y + 4, 1, 1, P.iceD); px(x + 4, y + 4, 1, 1, P.iceD);
      px(x + 2, y + 2, 1, 1, '#ffffff');
    }

    function drawSeeds(i, r, ox) {
      const list = seedOffsets(b.view[i], r.store);
      const cx = r.x + Math.floor(r.w / 2) + ox;
      const cy = r.y + Math.floor(r.h / 2) - (r.store ? 3 : 0);
      for (const [dx, dy, v] of list) {
        const pal = SEED_PAL[v];
        const sx = cx + dx - 2, sy = cy + dy - 1;
        for (let row = 0; row < 3; row++) {
          const line = SEED_SPRITE[row];
          for (let col = 0; col < 4; col++) {
            const ch = line[col];
            if (ch === '.') continue;
            g.fillStyle = pal[ch.charCodeAt(0) - 48];
            g.fillRect(sx + col, sy + row, 1, 1);
          }
        }
      }
    }

    function frame(t) {
      g.clearRect(0, 0, W, H);
      g.drawImage(wood, 0, 0);
      const blink = reduceMotion ? 0 : Math.floor(t / 450) % 2;

      for (let i = 0; i < C.SIZE; i++) {
        const r = rects[i];
        const ring = r.store ? rings.store : rings.pit;
        let ox = 0;
        const sh = b.shake.get(i);
        if (sh) {
          if (t > sh) b.shake.delete(i);
          else ox = Math.floor(t / 50) % 2 ? 1 : -1;
        }

        // glow rings
        const fl = b.flash.get(i);
        if (fl && t > fl) b.flash.delete(i);
        if (fl && t <= fl) {
          const c = Math.floor(t / 90) % 2 ? P.red : P.gold;
          drawRing(ring.r1, r.x + ox, r.y, c);
          drawRing(ring.r2, r.x + ox, r.y, c);
        } else if (b.picked.has(i)) {
          drawRing(ring.r1, r.x, r.y, P.gold);
          drawRing(ring.r2, r.x, r.y, P.gold);
        } else if (b.legal.has(i)) {
          const hot = i === b.hover || (b.keyboard && i === b.focus);
          const [on, off] = b.aiming ? [P.aim, P.aimD] : [P.gold, P.goldD];
          drawRing(ring.r1, r.x, r.y, hot || !blink ? on : off);
          if (hot) drawRing(ring.r2, r.x, r.y, off);
        } else if (b.frozen[i]) {
          drawRing(ring.r1, r.x, r.y, P.ice);
        }
        const pv = b.preview.get(i);
        if (pv) {
          const col = pv === 'take' ? P.red : pv === 'store' ? P.gold : P.land;
          drawRing(ring.r1, r.x, r.y, col);
          drawRing(ring.r2, r.x, r.y, col);
        }

        const spr = r.store ? sprites.store : b.burnt[i] ? sprites.pitBurnt : sprites.pit;
        g.drawImage(spr, r.x + ox, r.y);
        if (!b.burnt[i]) drawSeeds(i, r, ox);
        if (b.frozen[i]) drawSnowflake(r.x + r.w - 6, r.y + 1);
      }

      // counts
      for (let i = 0; i < C.SIZE; i++) {
        const r = rects[i];
        if (b.burnt[i]) continue;
        const flip = b.flipTop && r.owner === 1;
        if (r.store) {
          const y = flip ? r.y + 4 : r.y + r.h - 18;
          badge(b.view[i], r.cx, y, P.gold, P.ink, 2, flip);
        } else {
          const y = r.owner === 0 ? r.y + r.h - 5 : r.y - 4;
          badge(b.view[i], r.cx, y, P.text, P.ink, 1, flip);
        }
      }

      // hand chip that follows the sowing
      const hd = b.hand;
      if (hd.show) {
        hd.x += (hd.tx - hd.x) * 0.4;
        hd.y += (hd.ty - hd.y) * 0.4;
        const tw = String(hd.n).length * 4 - 1;
        const w = tw + 6;
        const x = Math.round(hd.x - w / 2);
        const y = Math.round(hd.y) - 11;
        px(x + 1, y + 1, w, 9, P.ink);              // hard shadow
        px(x + 1, y, w - 2, 9, P.gold);
        px(x, y + 1, w, 7, P.gold);
        px(Math.round(hd.x) - 1, y + 9, 3, 1, P.gold);
        px(Math.round(hd.x), y + 10, 1, 1, P.gold);
        drawDigits(hd.n, x + 3, y + 2, P.ink, 1, false);
      }

      ctx.imageSmoothingEnabled = false;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(lc, 0, 0, W * S, H * S);
      requestAnimationFrame(frame);
    }

    // ---- input ----
    function pitAt(e) {
      const rect = canvas.getBoundingClientRect();
      const lx = ((e.clientX - rect.left) * W) / rect.width;
      const ly = ((e.clientY - rect.top) * H) / rect.height;
      for (let i = 0; i < C.SIZE; i++) {
        const r = rects[i];
        if (r.store) continue;
        if (lx >= r.x - 2 && lx < r.x + r.w + 2 && ly >= r.y - 2 && ly < r.y + r.h + 2) return i;
      }
      return -1;
    }
    // Hover previews are for mouse and pen; on touch, game.js previews on the first tap
    let touch = false; // was the last press a finger?
    canvas.addEventListener('pointerdown', (e) => {
      touch = e.pointerType === 'touch';
      if (touch) { b.hover = pitAt(e); b.keyboard = false; } // the tapped hole lights up
    });
    const hoverTo = (i) => { if (opts.onHover) opts.onHover(i); };
    canvas.addEventListener('pointermove', (e) => {
      const i = pitAt(e);
      const changed = i !== b.hover;
      b.hover = i;
      b.keyboard = false;
      canvas.style.cursor = b.legal.has(b.hover) ? 'pointer' : 'default';
      if (changed && e.pointerType !== 'touch') hoverTo(i);
    });
    canvas.addEventListener('pointerleave', (e) => {
      b.hover = -1;
      if (e.pointerType !== 'touch') hoverTo(-1);
    });
    canvas.addEventListener('blur', () => { if (b.keyboard) hoverTo(-1); });
    canvas.addEventListener('click', (e) => {
      const i = pitAt(e);
      if (i >= 0) opts.onPit(i, touch);
      else if (opts.onMiss) opts.onMiss();
    });
    canvas.addEventListener('keydown', (e) => {
      const order = [...b.legal].sort((p, q) => rects[p].x - rects[q].x);
      if (!order.length) return;
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
        b.keyboard = true;
        let k = order.indexOf(b.focus);
        if (k < 0) k = e.key === 'ArrowLeft' ? order.length - 1 : 0;
        else k = (k + (e.key === 'ArrowLeft' ? -1 : 1) + order.length) % order.length;
        b.focus = order[k];
        hoverTo(b.focus);
      } else if ((e.key === 'Enter' || e.key === ' ') && b.legal.has(b.focus)) {
        e.preventDefault();
        opts.onPit(b.focus);
      }
    });
    window.addEventListener('resize', resize);

    resize();
    requestAnimationFrame(frame);

    const now = () => performance.now();
    return {
      setView(view, burnt) { b.view = view; b.burnt = burnt; },
      setLegal(list) {
        b.legal = new Set(list);
        if (!b.legal.has(b.focus)) b.focus = list.length ? list[0] : -1;
        canvas.style.cursor = b.legal.has(b.hover) ? 'pointer' : 'default';
      },
      setDir(dir) { rects = geometry(dir); },
      setFlipTop(on) { b.flipTop = on; },
      setHand(pos, n) {
        const r = rects[pos];
        const h = b.hand;
        h.tx = r.cx;
        h.ty = r.y + 2;
        if (!h.show) { h.x = h.tx; h.y = h.ty; }
        h.n = n;
        h.show = n > 0;
      },
      hideHand() { b.hand.show = false; },
      flash(i) { b.flash.set(i, now() + 650); },
      shake(i) { b.shake.set(i, now() + 300); },
      setPicked(i, on) { if (on) b.picked.add(i); else b.picked.delete(i); },
      clearPicked() { b.picked.clear(); },
      setFrozen(list) { b.frozen = list || []; },
      setAiming(on) { b.aiming = on; },
      setPreview(list) { b.preview = new Map(list || []); },
      /** The hole under the mouse, or the keyboard-focused hole; -1 if none. */
      getHover() { return b.keyboard ? b.focus : b.hover; },
      resize,
    };
  }

  root.PixelBoard = { create: createPixelBoard };
})(window);
