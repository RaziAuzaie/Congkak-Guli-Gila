/*
 * 8-bit music engine (Web Audio) with three original pieces in traditional Malay styles:
 *   asli  — slow Lagu Asli feel, violin-like cengkok ornaments, rebana + gong (menu)
 *   inang — calm, mid-tempo Inang, soft low flute-like tune, light rebana (classic games, normal fights)
 *   joget — lively 6/8 Joget, accordion off-beat chords, kompang slaps (boss fights)
 *
 * Song notation, one token per step:
 *   A4      note on        A4~ / A4~1   note with a quick upper-neighbour ornament (+2 / +1 semitones)
 *   C4+E4   several notes  -            hold previous note        .   rest
 *   Drums:  D = dum (rebana bass), T = tak (slap), t = soft tak, G = gong
 */
(function (root) {
  'use strict';

  const NOTE = { C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, F: 5, 'F#': 6, Gb: 6, G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11 };
  function freq(name) {
    const m = /^([A-G](?:#|b)?)(\d)$/.exec(name);
    if (!m) throw new Error('Bad note ' + name);
    const midi = (+m[2] + 1) * 12 + NOTE[m[1]];
    return 440 * Math.pow(2, (midi - 69) / 12);
  }

  // ---------- chords used to generate bass / harmony / drum parts ----------
  const CHORDS = {
    Am: { root: 'A2', fifth: 'E3', stab: 'C4+E4' },
    A:  { root: 'A2', fifth: 'E3', stab: 'C#4+E4' },
    G:  { root: 'G2', fifth: 'D3', stab: 'B3+D4' },
    Gm: { root: 'G2', fifth: 'D3', stab: 'Bb3+D4' },
    Dm: { root: 'D3', fifth: 'A2', stab: 'D4+F4' },
    E:  { root: 'E2', fifth: 'B2', stab: 'G#3+D4' },
    F:  { root: 'F2', fifth: 'C3', stab: 'A3+C4' },
    Bb: { root: 'Bb2', fifth: 'F3', stab: 'Bb3+D4' },
    C:  { root: 'C3', fifth: 'G2', stab: 'E4+G4' },
    Cm: { root: 'C3', fifth: 'G2', stab: 'Eb4+G4' },
    D:  { root: 'D3', fifth: 'A2', stab: 'F#4+A4' },
    Eb: { root: 'Eb3', fifth: 'Bb2', stab: 'Eb4+G4' },
  };

  function fromChords(chords, pattern) {
    return chords.map((name) => {
      const c = CHORDS[name];
      return pattern.map((p) => (p === 'R' ? c.root : p === 'F' ? c.fifth : p === 'S' ? c.stab : p)).join(' ');
    }).join(' | ');
  }

  function drums(bars, pattern, gongBars) {
    const out = [];
    for (let b = 0; b < bars; b++) {
      const bar = pattern.slice();
      if (gongBars.includes(b)) bar[0] = bar[0] === '.' ? 'G' : bar[0] + '+G';
      out.push(bar.join(' '));
    }
    return out.join(' | ');
  }

  /**
   * Build a song's parts from sections, each { chords, lead, drum, fill?, gong?, quiet? }.
   * fill = drum pattern for the section's last bar; quiet = bars at the start with no accordion.
   */
  function sections(list, harmPat, bassPat) {
    const parts = { lead: [], harm: [], bass: [], drum: [] };
    for (const s of list) {
      const n = s.chords.length;
      parts.lead.push(s.lead);
      parts.harm.push(s.chords.map((c, b) =>
        (b < (s.quiet || 0) ? harmPat.map(() => '.').join(' ') : fromChords([c], harmPat))).join(' | '));
      parts.bass.push(fromChords(s.chords, bassPat));
      parts.drum.push(Array.from({ length: n }, (_, b) => {
        const bar = (b === n - 1 && s.fill ? s.fill : s.drum).slice();
        if ((s.gong || [0]).includes(b)) bar[0] = bar[0] === '.' ? 'G' : bar[0] + '+G';
        return bar.join(' ');
      }).join(' | '));
    }
    for (const k in parts) parts[k] = parts[k].join(' | ');
    return parts;
  }

  // ---------- songs ----------
  // Joget runs 64 bars (~54 s) so it doesn't feel like a short loop:
  // A (main tune) → B (brighter, in the major) → A' (main tune, new answer phrase) → C (kompang break, low tune)
  const JOGET_BEAT = ['D', '.', 'T', 'D', 'T', 't'];
  const JOGET_FILL = ['T', 't', 'T', 'T', 't', 'T'];
  const JOGET_PARTS = sections([
    { // A: the original tune
      chords: ['Am', 'Am', 'G', 'G', 'Am', 'Dm', 'E', 'Am', 'Am', 'Dm', 'F', 'E', 'Am', 'Dm', 'E', 'Am'],
      lead: `
        A4 - C5 E5 - D5 | C5 - B4 A4 - - | G4 - A4 B4 - C5 | D5 - C5 B4 - - |
        A4 - C5 E5 - A5 | G5 - F5 E5 - D5 | C5 - B4 G#4 - B4 | A4~ - - - . . |
        E5 - E5 F5 - E5 | D5 - C5 D5 - - | C5 - C5 D5 - C5 | B4 - A4 B4 - - |
        A4 - B4 C5 - D5 | E5 - F5 E5 - D5 | C5 - B4 A4 - G#4 | A4~ - - - . .`,
      drum: JOGET_BEAT, fill: JOGET_FILL, gong: [0, 8],
    },
    { // B: brighter, leaning on F, G and C, ending on E to pull back home
      chords: ['F', 'G', 'C', 'Am', 'F', 'G', 'E', 'E', 'Dm', 'Am', 'Dm', 'Am', 'F', 'G', 'E', 'E'],
      lead: `
        C5 - F5 A5 - G5 | F5 - E5 D5 - B4 | C5 - E5 G5 - E5 | E5 - D5 C5 - - |
        A4 - C5 F5 - E5 | D5 - B4 G4 - B4 | G#4 - B4 E5 - D5 | B4~ - - - . . |
        F5 - E5 D5 - F5 | E5 - C5 A4 - C5 | D5 - F5 A5 - G5 | E5 - D5 C5 - A4 |
        C5 - D5 F5 - A5 | G5 - F5 D5 - G5 | E5 - D5 B4 - G#4 | B4 - - . E4 G#4`,
      drum: JOGET_BEAT, fill: JOGET_FILL, gong: [0, 8],
    },
    { // A': the tune again with ornaments, then a new answer phrase
      chords: ['Am', 'Am', 'G', 'G', 'Am', 'Dm', 'E', 'Am', 'Am', 'Dm', 'F', 'E', 'Am', 'Dm', 'E', 'Am'],
      lead: `
        A4~ - C5 E5 - D5 | C5 - B4 A4 - - | G4 - A4 B4~ - C5 | D5 - C5 B4 - - |
        A4 - C5 E5 - A5~ | G5 - F5 E5 - D5 | C5 - B4 G#4 - B4 | A4~ - - - . . |
        A5 - G5 E5 - C5 | D5 - F5 A5 - F5 | C5 - A4 C5 - F5 | E5 - D5 B4 - G#4 |
        A4 - C5 E5 - A5 | F5 - E5 D5 - F5 | E5 - B4 D5 - G#4 | A4~ - - - . .`,
      drum: JOGET_BEAT, fill: JOGET_FILL, gong: [0, 8],
    },
    { // C: four bars of kompang alone, then a low call-and-response tune back to the top
      chords: ['Am', 'Am', 'Am', 'Am', 'Dm', 'Dm', 'Am', 'Am', 'F', 'G', 'Am', 'Am', 'Dm', 'E', 'Am', 'E'],
      lead: `
        . . . . . . | . . . . . . | . . . . . . | . . . . . . |
        D4 - F4 A4 - - | A4 - G4 F4 - E4 | E4 - A4 C5 - - | C5 - B4 A4 - - |
        F4 - A4 C5 - A4 | B4 - D5 G4 - B4 | A4 - E4 A4 - C5 | E5 - - . . . |
        F5 - E5 D5 - C5 | B4 - C5 D5 - E5 | C5 - B4 A4 - E4 | G#4 - B4 E5 - -`,
      drum: ['D', 't', 'T', 'D', 'T', 'T'], fill: JOGET_FILL, gong: [0, 4, 12], quiet: 4,
    },
  ], ['.', 'S', 'S', '.', 'S', 'S'], ['R', '-', '.', 'F', '-', '.']);
  // Inang: 32 bars of 4/4 eighths (~56 s) in G minor, kept low and unhurried.
  // A (main tune) → A' (answer) → B (warmer, in the relative major) → A (home)
  const INANG_BEAT = ['D', '.', '.', 't', 'T', '.', 't', '.'];
  const INANG_A = {
    chords: ['Gm', 'Cm', 'Gm', 'D', 'Gm', 'Cm', 'D', 'Gm'],
    lead: `
      G4 - - A4 Bb4 - A4 G4 | C5 - - Bb4 A4 - G4 - | Bb4 - A4 G4 D4 - - - | F#4 - G4 A4 - - . . |
      G4 - - A4 Bb4 - C5 D5 | Eb5 - D5 C5 Bb4 - C5 - | A4 - Bb4 A4 F#4 - A4 - | G4~ - - - - - . .`,
    drum: INANG_BEAT, gong: [0],
  };
  const INANG_PARTS = sections([
    INANG_A,
    { // A': the answer phrase
      chords: ['Gm', 'Cm', 'Gm', 'D', 'Gm', 'Cm', 'D', 'Gm'],
      lead: `
        D5 - - C5 Bb4 - A4 G4 | G4 - C5 - Eb5 - D5 C5 | D5 - Bb4 - G4 - - - | A4 - - Bb4 A4 - F#4 - |
        G4 - Bb4 - D5 - C5 Bb4 | C5 - Eb5 - D5 C5 Bb4 - | A4 - - G4 F#4 - D4 - | G4~ - - - - - . .`,
      drum: INANG_BEAT, gong: [0],
    },
    { // B: warmer, through Eb, Bb and F, turning on D to lead home
      chords: ['Eb', 'Bb', 'F', 'Bb', 'Eb', 'Bb', 'Cm', 'D'],
      lead: `
        Eb4 - G4 Bb4 - - G4 - | F4 - Bb4 D5 - - C5 Bb4 | A4 - - C5 A4 - F4 - | Bb4~ - - - - - . . |
        G4 - Bb4 - Eb5 - D5 C5 | D5 - - C5 Bb4 - F4 - | G4 - C5 - Eb5 - D5 C5 | A4 - - - F#4 - D4 -`,
      drum: INANG_BEAT, gong: [0, 4],
    },
    INANG_A,
  ], ['.', '.', 'S', '.', '.', '.', 'S', '.'], ['R', '-', '-', '.', 'F', '-', '-', '.']);

  const ASLI_CHORDS = ['Dm', 'A', 'Gm', 'Dm', 'Bb', 'Dm', 'A', 'Dm'];

  const SONGS = {
    joget: {
      step: 0.14, // one eighth note in 6/8
      lead: { wave: 25, vol: 0.055, a: 0.005, d: 0.08, s: 0.7, r: 0.05, len: 0.9, vib: true },
      harm: { wave: 12, vol: 0.022, a: 0.003, d: 0.05, s: 0.5, r: 0.03, len: 0.6 },
      bass: { type: 'triangle', vol: 0.16, a: 0.005, d: 0.1, s: 0.8, r: 0.04, len: 0.85 },
      parts: JOGET_PARTS,
    },
    inang: {
      step: 0.22, // one eighth note, unhurried 4/4
      lead: { type: 'triangle', vol: 0.11, a: 0.02, d: 0.15, s: 0.75, r: 0.12, len: 0.92, vib: true },
      harm: { wave: 50, vol: 0.012, a: 0.02, d: 0.2, s: 0.5, r: 0.15, len: 0.8 },
      bass: { type: 'triangle', vol: 0.12, a: 0.01, d: 0.2, s: 0.6, r: 0.1, len: 0.85 },
      parts: INANG_PARTS,
    },
    asli: {
      step: 0.36, // one eighth note, slow 4/4
      lead: { wave: 50, vol: 0.045, a: 0.03, d: 0.2, s: 0.75, r: 0.18, len: 0.95, vib: true },
      harm: { wave: 25, vol: 0.016, a: 0.08, d: 0.3, s: 0.6, r: 0.3, len: 0.95 },
      bass: { type: 'triangle', vol: 0.14, a: 0.01, d: 0.3, s: 0.6, r: 0.2, len: 0.9 },
      parts: {
        lead: `
          D5~ - - E5 F5 - E5 D5 | C#5 - D5 - A4 - - - | Bb4 - A4 G4 A4 - Bb4 C5 | A4~1 - - - - - . . |
          F5 - G5 F5 E5 - F5 G5 | A5~1 - G5 F5 E5 - D5 - | E5 - F5 E5 D5 - C#5 E5 | D5~ - - - - - . .`,
        harm: fromChords(ASLI_CHORDS, ['S', '-', '-', '-', 'S', '-', '-', '-']),
        bass: fromChords(ASLI_CHORDS, ['R', '-', '-', '-', 'F', '-', '-', '-']),
        drum: drums(8, ['D', '.', '.', 't', '.', 'D', 'T', '.'], [0, 4]),
      },
    },
  };

  // ---------- compile notation into per-step events ----------
  function tokens(str) {
    return str.split(/\s+/).filter((t) => t && t !== '|');
  }
  function compile(song) {
    const out = { step: song.step, inst: { lead: song.lead, harm: song.harm, bass: song.bass }, ch: {} };
    let len = -1;
    for (const name in song.parts) {
      const tk = tokens(song.parts[name]);
      if (len >= 0 && tk.length !== len) throw new Error(`Part ${name} has ${tk.length} steps, expected ${len}`);
      len = tk.length;
      out.ch[name] = tk.map((t, i) => {
        if (t === '.' || t === '-') return null;
        if (name === 'drum') return { hits: t.split('+') };
        let hold = 1;
        while (i + hold < tk.length && tk[i + hold] === '-') hold++;
        const notes = t.split('+').map((n) => {
          const m = /^([A-G](?:#|b)?\d)(~(\d)?)?$/.exec(n);
          return { f: freq(m[1]), orn: m[2] ? +(m[3] || 2) : 0 };
        });
        return { notes, hold };
      });
    }
    out.len = len;
    return out;
  }
  const COMPILED = {};
  for (const k in SONGS) COMPILED[k] = compile(SONGS[k]);

  // ---------- synth ----------
  const M = { ctx: null, out: null, waves: {}, noise: null, name: null, song: null, stepIdx: 0, next: 0, timer: null, paused: null, volume: 0.6 };

  function pulseWave(ctx, duty) {
    const n = 64;
    const real = new Float32Array(n);
    const imag = new Float32Array(n);
    for (let k = 1; k < n; k++) real[k] = (2 / (k * Math.PI)) * Math.sin(Math.PI * k * duty);
    return ctx.createPeriodicWave(real, imag);
  }

  function init(ctx) {
    if (M.ctx === ctx) return;
    M.ctx = ctx;
    M.waves = { 12: pulseWave(ctx, 0.125), 25: pulseWave(ctx, 0.25), 50: pulseWave(ctx, 0.5) };
    const buf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    M.noise = buf;
    newOut();
  }

  function newOut() {
    M.out = M.ctx.createGain();
    M.out.gain.value = M.volume;
    M.out.connect(M.ctx.destination);
  }

  function tone(f, t, dur, inst, orn) {
    const ctx = M.ctx;
    const o = ctx.createOscillator();
    if (inst.wave) o.setPeriodicWave(M.waves[inst.wave]);
    else o.type = inst.type;
    o.frequency.setValueAtTime(f, t);
    if (orn) {
      // cengkok: quick flick to the upper neighbour and back
      o.frequency.setValueAtTime(f * Math.pow(2, orn / 12), t + 0.05);
      o.frequency.setValueAtTime(f, t + 0.1);
    }
    const g = ctx.createGain();
    const peak = inst.vol;
    const end = t + Math.max(dur * inst.len, inst.a + inst.d);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(peak, t + inst.a);
    g.gain.linearRampToValueAtTime(peak * inst.s, t + inst.a + inst.d);
    g.gain.setValueAtTime(peak * inst.s, end);
    g.gain.linearRampToValueAtTime(0.0001, end + inst.r);

    if (inst.vib && dur > 0.3) {
      // delayed vibrato on long notes, like a violin or serunai
      const lfo = ctx.createOscillator();
      const depth = ctx.createGain();
      lfo.frequency.value = 5.5;
      depth.gain.setValueAtTime(0, t);
      depth.gain.linearRampToValueAtTime(0, t + 0.2);
      depth.gain.linearRampToValueAtTime(f * 0.007, t + 0.45);
      lfo.connect(depth).connect(o.frequency);
      lfo.start(t);
      lfo.stop(end + inst.r + 0.02);
    }
    o.connect(g).connect(M.out);
    o.start(t);
    o.stop(end + inst.r + 0.02);
  }

  function drum(kind, t) {
    const ctx = M.ctx;
    if (kind === 'D') {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(150, t);
      o.frequency.exponentialRampToValueAtTime(55, t + 0.15);
      g.gain.setValueAtTime(0.32, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.24);
      o.connect(g).connect(M.out);
      o.start(t);
      o.stop(t + 0.26);
    } else if (kind === 'T' || kind === 't') {
      const src = ctx.createBufferSource();
      src.buffer = M.noise;
      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.value = 1900;
      bp.Q.value = 0.9;
      const g = ctx.createGain();
      g.gain.setValueAtTime(kind === 'T' ? 0.22 : 0.1, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.07);
      src.connect(bp).connect(g).connect(M.out);
      src.start(t, Math.random() * 0.5);
      src.stop(t + 0.08);
    } else if (kind === 'G') {
      // gong: two slightly detuned low tones beat against each other ("wah-wah")
      for (const [f, v] of [[98, 0.11], [98.9, 0.09], [196.5, 0.03]]) {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = 'triangle';
        o.frequency.setValueAtTime(f * 1.02, t);
        o.frequency.exponentialRampToValueAtTime(f, t + 0.3);
        g.gain.setValueAtTime(0.0001, t);
        g.gain.linearRampToValueAtTime(v, t + 0.02);
        g.gain.exponentialRampToValueAtTime(0.001, t + 3.2);
        o.connect(g).connect(M.out);
        o.start(t);
        o.stop(t + 3.3);
      }
    }
  }

  function scheduleStep(i, t) {
    const s = M.song;
    for (const name of ['lead', 'harm', 'bass']) {
      const ev = s.ch[name] && s.ch[name][i];
      if (!ev) continue;
      for (const n of ev.notes) tone(n.f, t, ev.hold * s.step, s.inst[name], n.orn);
    }
    const d = s.ch.drum && s.ch.drum[i];
    if (d) d.hits.forEach((h) => drum(h, t));
  }

  function tick() {
    const s = M.song;
    while (M.next < M.ctx.currentTime + 0.2) {
      scheduleStep(M.stepIdx, M.next);
      M.next += s.step;
      M.stepIdx = (M.stepIdx + 1) % s.len;
    }
  }

  function stop() {
    if (M.timer) clearInterval(M.timer);
    M.timer = null;
    M.name = null;
    if (M.ctx && M.out) {
      const old = M.out;
      old.gain.setTargetAtTime(0, M.ctx.currentTime, 0.08);
      setTimeout(() => old.disconnect(), 1200);
      newOut();
    }
  }

  function play(name, ctx) {
    if (!ctx || !COMPILED[name]) return;
    init(ctx);
    if (M.name === name && M.timer) return;
    stop();
    M.name = name;
    M.song = COMPILED[name];
    M.stepIdx = 0;
    M.next = ctx.currentTime + 0.15;
    M.timer = setInterval(tick, 25);
    tick();
  }

  // Background tabs throttle timers, so pause instead of stuttering
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && M.name) { M.paused = M.name; stop(); }
    else if (!document.hidden && M.paused) { const n = M.paused; M.paused = null; play(n, M.ctx); }
  });

  root.CongkakMusic = {
    play,
    stop() { M.paused = null; stop(); },
    get current() { return M.name; },
    songs: Object.keys(SONGS),
  };
})(window);
