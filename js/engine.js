/*
 * Congkak rules engine — pure logic, no DOM.
 *
 * Board indices (sowing order):
 *   0..6   = player 0 kampung (bottom row)
 *   7      = player 0 rumah (store)
 *   8..14  = player 1 kampung (top row)
 *   15     = player 1 rumah (store)
 * Sowing goes 0 -> 1 -> ... -> 15 -> 0, skipping the opponent's rumah
 * and any burnt (hangus) kampung.
 *
 * state.fx holds temporary effects used by the roguelite power marbles
 * (all stay off in a classic game):
 *   shadow[p]    next sowing by p skips the opponent's kampung
 *   lightning[p] p's next capture this turn also takes the holes beside the opposite hole
 *   shield[p]    p's kampung can't be captured until the opponent's turn ends
 *   time[p]      when p's turn would end, p plays again instead
 *   frozen[i]    hole i can't be picked by its owner for that many turns
 *   tipu[p]      Pak Belalang's Main Tipu: each seed p drops in p's own rumah brings 1-2 extra
 *                seeds from nowhere (1 + rumah count % 2, so the AI search stays repeatable)
 *   rock         Badang's thrown rock: the hole it sits on, or -1. Its owner can't pick it, everyone's
 *                sowing skips it and nobody can capture from it; it lifts after rockTurns of the
 *                owner's turns (throwRock)
 *   keris        Hang Jebat's floating Taming Sari: the player hole it hangs over, or -1.
 *                Each time player 0's turn ends it stabs that hole (all its seeds go to
 *                player 1's rumah) and moves on to the next playable hole along.
 */
(function (root) {
  'use strict';

  const PITS = 7;          // kampung per side
  const START_SEEDS = 7;   // buah per kampung
  const STORE = [7, 15];   // rumah index for player 0 / 1
  const SIZE = 16;
  const MAX_STEPS = 5000;  // guard against pathological relay loops
  const KERIS_MAX = 3;     // Hang Tuah: steals per turn

  function sidePits(p) {
    const base = p === 0 ? 0 : 8;
    const a = [];
    for (let i = 0; i < PITS; i++) a.push(base + i);
    return a;
  }
  const ownerOf = (i) => (i <= 7 ? 0 : 1);
  const isStore = (i) => i === 7 || i === 15;
  const opposite = (i) => 14 - i; // 0<->14, 6<->8

  function newFx() {
    return {
      shadow: [0, 0], lightning: [0, 0], shield: [0, 0], time: [0, 0],
      frozen: new Array(SIZE).fill(0),
      tipu: [0, 0],
      rock: -1, rockTurns: 0,
      keris: -1,
      // roguelite hero passives: powers[p] = 'tuah' | null;
      // combo[p] = combo hits this turn, steals[p] = keris steals / Badang double drops this turn
      powers: [null, null], combo: [0, 0], steals: [0, 0],
    };
  }

  /**
   * opts (all optional):
   *   seeds  starting count per hole (array of SIZE; stores ignored)
   *   store  [p0, p1] seeds already in each rumah
   *   burnt  array of SIZE booleans; burnt holes start empty
   *   single true = the game is one round; the round's end is the game's end
   *   tipu   [p0, p1] Main Tipu: extra seeds whenever that player sows into their own rumah
   *   keris  player-0 hole that Hang Jebat's floating keris starts over (roguelite boss), or omit
   *   powers [p0, p1] hero passives: 'tuah' (keris steals) | null
   */
  function createGame(first = 0, opts = {}) {
    const holes = new Array(SIZE).fill(START_SEEDS);
    if (opts.seeds) for (let i = 0; i < SIZE; i++) holes[i] = opts.seeds[i];
    holes[7] = opts.store ? opts.store[0] : 0;
    holes[15] = opts.store ? opts.store[1] : 0;
    const burnt = opts.burnt ? opts.burnt.slice() : new Array(SIZE).fill(false);
    burnt.forEach((b, i) => { if (b) holes[i] = 0; });
    const fx = newFx();
    if (opts.powers) fx.powers = opts.powers.slice();
    if (opts.keris !== undefined && opts.keris >= 0) fx.keris = opts.keris;
    if (opts.tipu) fx.tipu = opts.tipu.map((b) => (b ? 1 : 0));
    return {
      holes,
      burnt,
      player: first,
      round: 1,
      phase: 'play', // 'play' | 'roundEnd' | 'over'
      winner: null,  // 0 | 1 | -1 (draw)
      single: !!opts.single,
      fx,
    };
  }

  function clone(s) {
    const f = s.fx;
    return {
      holes: s.holes.slice(),
      burnt: s.burnt.slice(),
      player: s.player,
      round: s.round,
      phase: s.phase,
      winner: s.winner,
      single: s.single,
      fx: {
        shadow: f.shadow.slice(), lightning: f.lightning.slice(), shield: f.shield.slice(),
        time: f.time.slice(), frozen: f.frozen.slice(), keris: f.keris, tipu: f.tipu, rock: f.rock, rockTurns: f.rockTurns,
        powers: f.powers, combo: f.combo.slice(), steals: f.steals.slice(),
      },
    };
  }

  // rock = a hole under Badang's rock: everyone's sowing skips it
  function nextPos(pos, p, burnt, shadow, rock = -1) {
    do {
      pos = (pos + 1) % SIZE;
    } while (pos === STORE[1 - p] || burnt[pos] || (shadow && ownerOf(pos) !== p) || pos === rock);
    return pos;
  }

  function legalMoves(s, p = s.player) {
    if (s.phase !== 'play') return [];
    const all = sidePits(p).filter((i) => !s.burnt[i] && s.holes[i] > 0);
    // Frozen or rock-covered holes can't be picked — unless they are all that's left
    const free = all.filter((i) => !s.fx.frozen[i] && i !== s.fx.rock);
    return free.length ? free : all;
  }

  const sideTotal = (s, p) => sidePits(p).reduce((a, i) => a + s.holes[i], 0);
  const totalOf = (s, p) => sideTotal(s, p) + s.holes[STORE[p]];

  /**
   * Play one move. Returns { state, events, result }.
   * events (when record=true) describe every pick/drop for animation.
   * result: 'extra' (player moves again) | 'end' (turn passes)
   */
  function playMove(s, pit, record = true) {
    const p = s.player;
    if (!legalMoves(s).includes(pit)) throw new Error('Illegal move: ' + pit);
    const st = clone(s);
    const fx = st.fx;
    const ev = record ? [] : null;

    const shadow = fx.shadow[p];
    fx.shadow[p] = 0;

    let seeds = st.holes[pit];
    st.holes[pit] = 0;
    if (ev) ev.push({ t: 'pick', pos: pit, n: seeds });

    let pos = pit;
    let steps = 0;
    let result;

    // A combo hit (relay, capture or extra turn). Keris Taming Sari: every 2nd hit in
    // Hang Tuah's turn steals 1 seed from the opponent's rumah, at most 3 per turn.
    const hit = () => {
      fx.combo[p]++;
      if (fx.powers[p] === 'tuah' && fx.combo[p] % 2 === 0 && fx.steals[p] < KERIS_MAX && st.holes[STORE[1 - p]] > 0) {
        st.holes[STORE[1 - p]]--;
        st.holes[STORE[p]]++;
        fx.steals[p]++;
        if (ev) ev.push({ t: 'steal', from: STORE[1 - p], to: STORE[p] });
      }
    };

    for (;;) {
      while (seeds > 0) {
        pos = nextPos(pos, p, st.burnt, shadow, fx.rock);
        st.holes[pos]++;
        seeds--;
        steps++;
        if (ev) ev.push({ t: 'drop', pos, hand: seeds });
        // Main Tipu: sneaks 1-2 extra seeds into his own rumah; his hand doesn't go down for them
        if (pos === STORE[p] && fx.tipu[p]) {
          const n = 1 + (st.holes[pos] % 2);
          st.holes[pos] += n;
          if (ev) ev.push({ t: 'cheat', pos, n });
        }
      }

      // Last seed in own rumah: play again
      if (pos === STORE[p]) {
        result = 'extra';
        if (ev) ev.push({ t: 'extra' });
        hit();
        break;
      }

      // Last seed in a non-empty kampung: pick them all up and keep sowing
      if (st.holes[pos] > 1 && steps < MAX_STEPS) {
        seeds = st.holes[pos];
        st.holes[pos] = 0;
        if (ev) ev.push({ t: 'pick', pos, n: seeds });
        hit();
        continue;
      }

      result = 'end';

      // Last seed in an empty kampung on own side: tembak (capture)
      if (ownerOf(pos) === p && st.holes[pos] === 1) {
        const o = opposite(pos);
        if (o === fx.rock) {
          // under Badang's rock: nothing can be taken from it, the seed just stays
        } else if (st.holes[o] > 0 && fx.shield[1 - p]) {
          if (ev) ev.push({ t: 'blocked', pos, opp: o });
        } else if (st.holes[o] > 0) {
          let n = st.holes[o] + 1;
          st.holes[o] = 0;
          st.holes[pos] = 0;
          const extra = [];
          if (fx.lightning[p]) {
            fx.lightning[p] = 0;
            for (const k of [o - 1, o + 1]) {
              if (ownerOf(k) === 1 - p && !isStore(k) && !st.burnt[k] && k !== fx.rock && st.holes[k] > 0) {
                n += st.holes[k];
                st.holes[k] = 0;
                extra.push(k);
              }
            }
          }
          st.holes[STORE[p]] += n;
          if (ev) ev.push({ t: 'capture', pos, opp: o, extra, n, store: STORE[p] });
          hit();
        }
      }
      break;
    }

    if (result === 'end' && fx.time[p]) {
      fx.time[p] = 0;
      result = 'extra';
      if (ev) ev.push({ t: 'extra', why: 'time' });
      hit();
    }

    if (result === 'end') {
      // p's turn is over: effects that last "until the end of the turn" expire
      fx.lightning[p] = 0;
      fx.shield[1 - p] = 0;
      fx.combo[p] = 0;
      fx.steals[p] = 0;
      if (p === 0 && fx.keris >= 0) kerisStab(st, ev);
      // Badang's rock lifts after its owner has had rockTurns turns under it
      if (fx.rock >= 0 && ownerOf(fx.rock) === p && --fx.rockTurns <= 0) {
        if (ev) ev.push({ t: 'rockGone', pos: fx.rock });
        fx.rock = -1;
      }
      for (const i of sidePits(p)) if (fx.frozen[i]) fx.frozen[i]--;
      st.player = 1 - p;
    }

    checkEnd(st, ev);
    return { state: st, events: ev, result };
  }

  /** Batu Badang: drop a rock on hole `pos` for `turns` of its owner's turns. Returns { state, events }. */
  function throwRock(s, pos, turns = 2) {
    const st = clone(s);
    st.fx.rock = pos;
    st.fx.rockTurns = turns;
    return { state: st, events: [{ t: 'rock', pos }] };
  }

  /** Taming Sari: stab the hole under the keris (seeds to player 1's rumah), then move one hole along. */
  function kerisStab(st, ev) {
    const pos = st.fx.keris;
    const n = st.burnt[pos] ? 0 : st.holes[pos];
    if (n > 0) {
      st.holes[pos] = 0;
      st.holes[STORE[1]] += n;
    }
    const side = sidePits(0);
    let next = pos;
    for (let k = 1; k <= side.length; k++) {
      const c = side[(side.indexOf(pos) + k) % side.length];
      if (!st.burnt[c]) { next = c; break; }
    }
    st.fx.keris = next;
    if (ev) ev.push({ t: 'stab', pos, n, store: STORE[1], next });
  }

  /**
   * Where the last seed of the first sowing from `pit` lands, before any relay.
   * Returns { pos, count } — count = seeds in that hole after the drop.
   */
  function firstLanding(s, pit) {
    const p = s.player;
    const holes = s.holes.slice();
    let seeds = holes[pit];
    holes[pit] = 0;
    let pos = pit;
    while (seeds > 0) {
      pos = nextPos(pos, p, s.burnt, s.fx.shadow[p], s.fx.rock);
      holes[pos]++;
      seeds--;
    }
    // a hole under Badang's rock can't be captured, so it counts as empty here
    return { pos, count: holes[pos], opposite: isStore(pos) || opposite(pos) === s.fx.rock ? 0 : holes[opposite(pos)] };
  }

  /**
   * Round ends as soon as either side's kampung are all empty (or, as a
   * safety net, the player to move has nothing to play). Mutates st.
   */
  function checkEnd(st, ev) {
    if (st.phase !== 'play') return;
    if (sideTotal(st, 0) === 0 || sideTotal(st, 1) === 0 || legalMoves(st).length === 0) endRound(st, ev);
  }

  function endRound(st, ev) {
    for (const p of [0, 1]) {
      const pits = sidePits(p).filter((i) => st.holes[i] > 0);
      const n = pits.reduce((a, i) => a + st.holes[i], 0);
      pits.forEach((i) => (st.holes[i] = 0));
      st.holes[STORE[p]] += n;
      if (ev && n > 0) ev.push({ t: 'sweep', p, pits, n, store: STORE[p] });
    }
    const a = st.holes[STORE[0]];
    const b = st.holes[STORE[1]];
    if (st.single || a < START_SEEDS || b < START_SEEDS) {
      st.phase = 'over';
      st.winner = a > b ? 0 : b > a ? 1 : -1;
    } else {
      st.phase = 'roundEnd';
    }
  }

  /** Refill kampung from each rumah. Kampung that can't be filled become hangus. */
  function startNextRound(s) {
    const st = clone(s);
    for (const p of [0, 1]) {
      let store = st.holes[STORE[p]];
      // fill starting from the kampung nearest the rumah
      const order = sidePits(p).reverse();
      for (const i of order) {
        if (store >= START_SEEDS) {
          st.holes[i] = START_SEEDS;
          store -= START_SEEDS;
          st.burnt[i] = false;
        } else {
          st.holes[i] = 0;
          st.burnt[i] = true;
        }
      }
      st.holes[STORE[p]] = store;
    }
    // The player who has fewer seeds goes first
    st.player = totalOf(s, 0) <= totalOf(s, 1) ? 0 : 1;
    st.round = s.round + 1;
    st.phase = 'play';
    st.winner = null;
    return st;
  }

  const api = {
    PITS, START_SEEDS, STORE, SIZE,
    sidePits, ownerOf, isStore, opposite,
    createGame, clone, legalMoves, playMove, startNextRound, checkEnd, firstLanding, throwRock,
    sideTotal, totalOf,
  };

  root.Congkak = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
