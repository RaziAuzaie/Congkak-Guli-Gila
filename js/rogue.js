/*
 * Congkak roguelite — run logic, no DOM.
 *
 * A run crosses 3 areas. Each area is a branching map of matches, shops,
 * rests and events that ends in a boss. A match is a single round of congkak:
 * most seeds in the rumah wins, and a loss costs semangat (health).
 * Combos (relays, captures, extra turns in one turn) earn syiling (coins),
 * which buy one-use power marbles (guli sakti) that bend the rules for a turn.
 *
 * Everything here is plain data so a run can be saved as JSON.
 */
(function (root) {
  'use strict';

  const C = root.Congkak || require('./engine.js');

  const START = { hp: 40, coins: 15, slots: 3, items: 2 };
  const MAX_SLOTS = 5;
  const ROWS = 6;   // rows of choices per area, before the boss
  const COLS = 4;

  const L = (ms, en) => ({ ms, en });

  // ---------- power marbles ----------
  // target: 'own' = one of your holes, 'opp' = one of the opponent's, null = none
  const ITEMS = {
    emas: {
      color: '#f2c14e', rarity: 1, price: 8, target: null,
      name: L('Guli Emas', 'Gold Marble'),
      desc: L('Syiling yang anda dapat giliran ini digandakan.', 'Double the coins you earn this turn.'),
    },
    ramal: {
      color: '#ff7eb6', rarity: 1, price: 6, target: null,
      name: L('Guli Ramal', 'Seer Marble'),
      desc: L('Tunjukkan langkah terbaik untuk giliran ini.', 'Shows the best move for this turn.'),
    },
    ais: {
      color: '#8fe3ff', rarity: 1, price: 9, target: 'opp',
      name: L('Guli Ais', 'Ice Marble'),
      desc: L('Bekukan satu kampung lawan. Lawan tak boleh memilihnya pada giliran seterusnya.',
        'Freeze one of the opponent’s holes. They can’t pick it on their next turn.'),
    },
    perisai: {
      color: '#6fb7ff', rarity: 1, price: 9, target: null,
      name: L('Guli Perisai', 'Shield Marble'),
      desc: L('Lawan tak boleh menembak kampung anda pada giliran seterusnya.',
        'The opponent can’t capture from your holes on their next turn.'),
    },
    tanah: {
      color: '#c08a4a', rarity: 1, price: 10, target: 'own',
      name: L('Guli Tanah', 'Earth Marble'),
      desc: L('Tambah 4 buah baharu ke dalam satu kampung anda.', 'Add 4 new seeds to one of your holes.'),
    },
    tuai: {
      color: '#9bd35a', rarity: 2, price: 13, target: 'own',
      name: L('Guli Tuai', 'Harvest Marble'),
      desc: L('Pindahkan semua buah dari satu kampung anda terus ke rumah anda.',
        'Move every seed in one of your holes straight into your rumah.'),
    },
    petir: {
      color: '#ffe14d', rarity: 2, price: 13, target: null,
      name: L('Guli Petir', 'Lightning Marble'),
      desc: L('Tembakan anda yang seterusnya giliran ini turut mengambil dua kampung di sebelah kampung bertentangan.',
        'Your next capture this turn also takes the two holes beside the opposite hole.'),
    },
    bayang: {
      color: '#9a9fd0', rarity: 2, price: 14, target: null,
      name: L('Guli Bayang', 'Shadow Marble'),
      desc: L('Taburan anda yang seterusnya melangkau semua kampung lawan.',
        'Your next sowing skips all of the opponent’s holes.'),
    },
    masa: {
      color: '#ff9f43', rarity: 3, price: 18, target: null,
      name: L('Guli Masa', 'Time Marble'),
      desc: L('Bila giliran anda tamat, anda main sekali lagi.', 'When your turn ends, you play once more.'),
    },
    curi: {
      color: '#c46bd6', rarity: 3, price: 20, target: 'opp',
      name: L('Guli Curi', 'Thief Marble'),
      desc: L('Curi semua buah dari satu kampung lawan ke rumah anda.',
        'Steal every seed in one of the opponent’s holes into your rumah.'),
    },
    ribut: {
      color: '#7fd6c2', rarity: 3, price: 22, target: null,
      name: L('Guli Ribut', 'Storm Marble'),
      desc: L('Setiap kampung lawan yang berisi kehilangan 1 buah ke rumah anda.',
        'Every opponent hole with seeds loses 1 seed into your rumah.'),
    },
  };

  // ---------- heroes (chosen at the start of a run; powers not active yet) ----------
  const HEROES = {
    tuah: {
      name: 'Hang Tuah',
      style: L('Pencuri kombo — seimbang, sesuai untuk permulaan', 'Combo thief — balanced, a good first pick'),
      passive: L('Keris Taming Sari: setiap hit kombo ke-2 dalam giliran anda mencuri 1 buah dari rumah lawan (maks 3 setiap giliran).',
        'Keris Taming Sari: every 2nd combo hit in your turn steals 1 seed from the opponent’s rumah (max 3 per turn).'),
      second: null,
      stats: { hp: 40, coins: 15, slots: 3, items: 2 },
    },
    mahsuri: {
      name: 'Mahsuri',
      style: L('Bangkit semula dan sumpahan', 'Comeback and curses'),
      passive: L('Darah Putih: kali pertama semangat anda jatuh ke 0, anda hidup semula dengan 15 semangat (sekali setiap pengembaraan).',
        'Darah Putih: the first time your spirit would hit 0, survive and recover 15 (once per run).'),
      second: L('Sumpahan Mahsuri: selepas anda kalah, lawan seterusnya bermula dengan kampung terdekat rumahnya hangus.',
        'Sumpahan Mahsuri: after you lose a match, your next opponent starts with their hole nearest their rumah burnt.'),
      stats: { hp: 35, coins: 25, slots: 3, items: 2 },
    },
    badang: {
      name: 'Badang',
      style: L('Kekuatan mentah', 'Raw power'),
      passive: L('Kekuatan Badang: setiap kali taburan anda melalui rumah anda, jatuhkan 2 buah dan bukan 1.',
        'Kekuatan Badang: each time your sowing passes your rumah, drop 2 seeds there instead of 1.'),
      second: null,
      stats: { hp: 50, coins: 10, slots: 2, items: 1 },
    },
  };

  // ---------- opponents ----------
  const MODS = {
    licik: L('Licik: setiap kampungnya bermula dengan 1 buah lebih.', 'Cunning: each of its holes starts with 1 extra seed.'),
    kaya: L('Kaya: rumahnya bermula dengan 10 buah.', 'Rich: its rumah starts with 10 seeds.'),
    berani: L('Berani: main lagi setiap kali dia menembak.', 'Bold: plays again after every capture.'),
    sekat: L('Sekatan: kampung anda yang paling dekat dengan rumah bermula hangus.',
      'Blockade: your hole nearest your rumah starts burnt.'),
  };

  const ENEMIES = {
    budak: { name: 'Budak Kampung', title: L('Baru belajar', 'Just learning') },
    makcik: { name: 'Mak Cik Kedai', title: L('Tak suka kalah', 'Hates losing') },
    lebai: { name: 'Pak Lebai', title: L('Sabar dan teliti', 'Patient and careful') },
    belalang: { name: 'Pak Belalang', title: L('Tukang tilik', 'The fortune teller'), mods: ['kaya'] },
    kancil: { name: 'Sang Kancil', title: L('Si cerdik hutan', 'The clever mouse-deer'),
      ai: { depth: 2, random: 0.1 } },

    pawang: { name: 'Tok Pawang', title: L('Penjaga hutan', 'Keeper of the jungle') },
    bunian: { name: 'Orang Bunian', title: L('Tak kelihatan', 'The unseen folk') },
    penarik: { name: 'Mat Jenin', title: L('Kaki angan-angan', 'The daydreamer'), mods: ['kaya'] },
    bota: { name: 'Gergasi Bota', title: L('Gergasi rimba', 'Giant of the wilds'), mods: ['licik'] },
    jebat: { name: 'Hang Jebat', title: L('Pendekar derhaka', 'The rebel warrior'), mods: ['berani'],
      ai: { depth: 3, random: 0.05 } },

    pengawal: { name: 'Pengawal Istana', title: L('Tak pernah tidur', 'Never sleeps') },
    bendahara: { name: 'Bendahara', title: L('Bijak berstrategi', 'The grand vizier'), mods: ['sekat'] },
    laksamana: { name: 'Laksamana', title: L('Panglima laut', 'Admiral of the fleet'), mods: ['berani'] },
    temenggung: { name: 'Temenggung', title: L('Ketua keselamatan', 'Chief of the guard'), mods: ['kaya', 'licik'] },
    ledang: { name: 'Puteri Gunung Ledang', title: L('Puteri kayangan', 'The mountain princess'),
      mods: ['berani', 'kaya'], ai: { depth: 4, random: 0 } },
  };

  const AREAS = [
    {
      name: L('Kampung', 'The Village'),
      ai: { depth: 1, random: 0.45 }, eliteAi: { depth: 3, random: 0.1 },
      pool: ['budak', 'makcik', 'lebai'], elites: ['belalang'], boss: 'kancil',
    },
    {
      name: L('Hutan Rimba', 'The Jungle'),
      ai: { depth: 2, random: 0.2 }, eliteAi: { depth: 4, random: 0.05 },
      pool: ['pawang', 'bunian', 'penarik'], elites: ['bota'], boss: 'jebat',
    },
    {
      name: L('Istana', 'The Palace'),
      ai: { depth: 3, random: 0.1 }, eliteAi: { depth: 5, random: 0 },
      pool: ['pengawal', 'bendahara', 'laksamana'], elites: ['temenggung'], boss: 'ledang',
    },
  ];

  // ---------- helpers ----------
  const pick = (arr, rnd) => arr[Math.floor(rnd() * arr.length)];
  function shuffle(arr, rnd) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
  function weighted(pairs, rnd) {
    const total = pairs.reduce((s, [, w]) => s + w, 0);
    let r = rnd() * total;
    for (const [v, w] of pairs) if ((r -= w) < 0) return v;
    return pairs[pairs.length - 1][0];
  }

  /** A random marble, rarer ones more likely in later areas. */
  function randomItem(run, rnd, minRarity = 1) {
    const a = run.area;
    const w = { 1: 60, 2: 28 + a * 6, 3: 10 + a * 6 };
    const ids = Object.keys(ITEMS).filter((id) => ITEMS[id].rarity >= minRarity);
    return weighted(ids.map((id) => [id, w[ITEMS[id].rarity]]), rnd);
  }

  const hasSlot = (run) => run.items.length < run.slots;
  function addItem(run, id) {
    if (!hasSlot(run)) return false;
    run.items.push(id);
    return true;
  }
  function heal(run, n) {
    const before = run.hp;
    run.hp = Math.min(run.maxHp, run.hp + n);
    return run.hp - before;
  }
  function earn(run, n) {
    run.coins += n;
    run.stats.coins += n;
  }

  // ---------- map ----------
  function nodeType(r, rnd) {
    if (r === 0) return 'match';
    if (r === ROWS - 1) return rnd() < 0.5 ? 'rest' : 'shop';
    return weighted([
      ['match', 45], ['event', 22], ['shop', 13], ['rest', 5], ['elite', r >= 2 ? 15 : 0],
    ], rnd);
  }

  function genMap(area, rnd) {
    const rows = [];
    for (let r = 0; r < ROWS; r++) {
      const count = r === 0 ? 3 : 2 + Math.floor(rnd() * 3);
      const cols = shuffle([0, 1, 2, 3], rnd).slice(0, count).sort((a, b) => a - b);
      rows.push(cols.map((c) => ({ id: r + '-' + c, row: r, col: c, x: ((c + 0.5) / COLS) * 100, next: [] })));
    }
    const byDist = (list, col) => list.slice().sort((p, q) => Math.abs(p.col - col) - Math.abs(q.col - col));
    for (let r = 0; r < ROWS - 1; r++) {
      const A = rows[r], B = rows[r + 1];
      for (const a of A) {
        const near = byDist(B, a.col);
        a.next.push(near[0].id);
        if (near[1] && Math.abs(near[1].col - a.col) <= 1 && rnd() < 0.35) a.next.push(near[1].id);
      }
      for (const b of B) {
        if (!A.some((a) => a.next.includes(b.id))) byDist(A, b.col)[0].next.push(b.id);
      }
    }
    rows[ROWS - 1].forEach((n) => n.next.push('boss'));

    const ar = AREAS[area];
    for (const row of rows) {
      for (const n of row) {
        n.type = nodeType(n.row, rnd);
        if (n.type === 'match') n.enemy = pick(ar.pool, rnd);
        if (n.type === 'elite') n.enemy = pick(ar.elites, rnd);
      }
    }
    // Make sure there is at least one shop before the last row
    const mid = rows.slice(1, ROWS - 1).flat();
    if (!mid.some((n) => n.type === 'shop')) {
      const n = pick(mid.filter((m) => m.row >= 2), rnd);
      n.type = 'shop';
      delete n.enemy;
    }
    rows.push([{ id: 'boss', row: ROWS, col: 1.5, x: 50, next: [], type: 'boss', enemy: ar.boss }]);
    return { rows };
  }

  function nodeById(run, id) {
    for (const row of run.map.rows) for (const n of row) if (n.id === id) return n;
    return null;
  }

  function available(run) {
    if (run.done) return [];
    if (run.at === null) return run.map.rows[0].slice();
    return nodeById(run, run.at).next.map((id) => nodeById(run, id));
  }

  function visit(run, node) {
    run.at = node.id;
    run.path.push(node.id);
  }

  // ---------- run ----------
  function newRun(rnd = Math.random, hero = null) {
    const run = {
      v: 1, area: 0, hero,
      hp: START.hp, maxHp: START.hp, coins: START.coins,
      slots: START.slots, items: [],
      at: null, path: [], done: false, won: false,
      stats: { matches: 0, wins: 0, coins: 0, bestCombo: 0, captures: 0, items: 0 },
    };
    const commons = Object.keys(ITEMS).filter((id) => ITEMS[id].rarity === 1);
    for (let k = 0; k < START.items; k++) run.items.push(pick(commons, rnd));
    run.map = genMap(0, rnd);
    return run;
  }

  function nextArea(run, rnd = Math.random) {
    run.area++;
    run.map = genMap(run.area, rnd);
    run.at = null;
    run.path = [];
  }

  // ---------- matches ----------
  /** Shuffle a few seeds between holes; both sides get the same layout so it stays fair. */
  function randomLayout(rnd) {
    const side = new Array(C.PITS).fill(C.START_SEEDS);
    for (let k = 0; k < 6; k++) {
      const a = Math.floor(rnd() * C.PITS), b = Math.floor(rnd() * C.PITS);
      if (a !== b && side[a] > 4 && side[b] < 10) { side[a]--; side[b]++; }
    }
    const seeds = new Array(C.SIZE).fill(0);
    for (let j = 0; j < C.PITS; j++) { seeds[j] = side[j]; seeds[8 + j] = side[j]; }
    return seeds;
  }

  function makeMatch(run, node, rnd = Math.random) {
    const area = AREAS[run.area];
    const e = ENEMIES[node.enemy];
    const ai = e.ai || (node.type === 'match' ? area.ai : area.eliteAi);
    const mods = e.mods || [];
    const opts = {
      seeds: randomLayout(rnd), store: [0, 0], burnt: new Array(C.SIZE).fill(false), bold: [0, 0], single: true,
    };
    if (mods.includes('licik')) for (const i of C.sidePits(1)) opts.seeds[i]++;
    if (mods.includes('kaya')) opts.store[1] = 10;
    if (mods.includes('berani')) opts.bold[1] = 1;
    if (mods.includes('sekat')) opts.burnt[6] = true;
    // The player always opens: in a one-round match the first move decides most
    // games between equal players, so difficulty comes from the opponent instead.
    return { enemy: node.enemy, kind: node.type, ai, mods, opts, first: 0 };
  }

  /**
   * Coins for one combo hit. combo = the hit's place in this turn's chain (1, 2, 3…).
   * Relays are common, so only every 5th link of a chain pays; captures and
   * extra turns always pay, and pay more deep into a combo.
   */
  function hitValue(kind, combo, n = 0) {
    const deep = combo >= 10 ? 1 : 0;
    if (kind === 'capture') return 1 + Math.floor(n / 8) + deep;
    if (kind === 'extra') return 1 + deep;
    return combo % 5 === 0 ? 1 : 0; // relay
  }

  /** Semangat lost for a defeat by `margin` seeds. */
  const damageFor = (margin) => Math.min(12, 3 + Math.floor(margin / 5));

  /**
   * Settle a finished match. Mutates run; returns what happened for the UI.
   * forfeit = the player gave up: always a loss, even when ahead.
   */
  function finishMatch(run, node, state, rnd = Math.random, forfeit = false) {
    const me = state.holes[C.STORE[0]], them = state.holes[C.STORE[1]];
    const diff = forfeit ? Math.min(-1, me - them) : me - them;
    const boss = node.type === 'boss';
    const out = {
      me, them, win: diff > 0, draw: diff === 0, forfeit, coins: 0, damage: 0, heal: 0,
      reward: null, retry: false, dead: false, areaClear: false, victory: false,
    };
    run.stats.matches++;
    if (out.win) {
      run.stats.wins++;
      out.coins = 8 + Math.floor(diff / 4) + (node.type === 'elite' ? 10 : 0) + (boss ? 25 : 0);
      earn(run, out.coins);
      if (node.type === 'elite' || boss) out.reward = rewardChoices(run, rnd, boss ? 2 : 1);
      if (boss) {
        out.heal = heal(run, Math.ceil(run.maxHp / 2));
        if (run.area === AREAS.length - 1) { out.victory = true; run.done = true; run.won = true; }
        else out.areaClear = true;
      }
    } else {
      if (!out.draw) {
        out.damage = damageFor(-diff);
        run.hp = Math.max(0, run.hp - out.damage);
      }
      if (run.hp <= 0) { out.dead = true; run.done = true; }
      else if (boss) out.retry = true; // a boss must be beaten to move on
    }
    return out;
  }

  function rewardChoices(run, rnd, minRarity) {
    const set = new Set();
    for (let k = 0; k < 20 && set.size < 3; k++) set.add(randomItem(run, rnd, minRarity));
    return [...set];
  }

  // ---------- using marbles in a match ----------
  function itemTargets(state, p, id) {
    const def = ITEMS[id];
    if (!def.target) return [];
    const side = C.sidePits(def.target === 'own' ? p : 1 - p).filter((i) => !state.burnt[i]);
    if (id === 'tanah') return side;
    if (id === 'ais') return side.filter((i) => state.holes[i] > 0 && !state.fx.frozen[i]);
    return side.filter((i) => state.holes[i] > 0);
  }

  /**
   * Apply a marble for player p. Gold and Seer have no effect on the board;
   * the UI handles them. Returns { state, events }.
   */
  function useItem(state, p, id, target) {
    const st = C.clone(state);
    const ev = [];
    const store = C.STORE[p];
    const fx = st.fx;
    switch (id) {
      case 'tuai':
      case 'curi': {
        const n = st.holes[target];
        st.holes[target] = 0;
        st.holes[store] += n;
        ev.push({ t: 'move', from: target, to: store, n });
        break;
      }
      case 'tanah':
        st.holes[target] += 4;
        ev.push({ t: 'add', pos: target, n: 4 });
        break;
      case 'ribut':
        for (const i of C.sidePits(1 - p)) {
          if (!st.burnt[i] && st.holes[i] > 0) {
            st.holes[i]--;
            st.holes[store]++;
            ev.push({ t: 'move', from: i, to: store, n: 1 });
          }
        }
        break;
      case 'ais': fx.frozen[target] = 1; ev.push({ t: 'freeze', pos: target }); break;
      case 'bayang': fx.shadow[p] = 1; break;
      case 'petir': fx.lightning[p] = 1; break;
      case 'masa': fx.time[p] = 1; break;
      case 'perisai': fx.shield[p] = 1; break;
    }
    C.checkEnd(st, ev);
    return { state: st, events: ev };
  }

  // ---------- shop, rest, events ----------
  function makeShop(run, rnd = Math.random) {
    const ids = new Set();
    for (let k = 0; k < 30 && ids.size < 4; k++) ids.add(randomItem(run, rnd));
    return {
      items: [...ids].map((id) => ({ id, price: ITEMS[id].price + run.area * 2, sold: false })),
      heal: { price: 12 + run.area * 3, amount: 12, sold: false },
      slot: { price: 30 + (run.slots - START.slots) * 15, sold: run.slots >= MAX_SLOTS },
    };
  }

  function buy(run, shop, what) {
    let offer;
    if (what === 'heal') offer = shop.heal;
    else if (what === 'slot') offer = shop.slot;
    else offer = shop.items[what];
    if (!offer || offer.sold || run.coins < offer.price) return false;
    if (typeof what === 'number' && !hasSlot(run)) return false;
    if (what === 'heal' && run.hp >= run.maxHp) return false;
    run.coins -= offer.price;
    offer.sold = true;
    if (what === 'heal') heal(run, offer.amount);
    else if (what === 'slot') run.slots++;
    else run.items.push(offer.id);
    return true;
  }

  const REST = [
    { id: 'rehat', label: (run) => L(`Berehat (+${Math.ceil(run.maxHp * 0.3)} semangat)`, `Rest (+${Math.ceil(run.maxHp * 0.3)} spirit)`),
      can: (run) => run.hp < run.maxHp, go: (run) => heal(run, Math.ceil(run.maxHp * 0.3)) },
    { id: 'latih', label: () => L('Berlatih (+5 semangat maksimum)', 'Train (+5 max spirit)'),
      can: () => true, go: (run) => { run.maxHp += 5; run.hp += 5; } },
    { id: 'cari', label: () => L('Cari guli di sekitar wakaf', 'Search around for a marble'),
      can: hasSlot, go: (run, rnd) => addItem(run, randomItem(run, rnd)) },
  ];

  const LEAVE = { label: L('Teruskan perjalanan', 'Move on'), can: () => true, go: () => null };

  const EVENTS = {
    kenduri: {
      title: L('Kenduri Kampung', 'Village Feast'),
      text: L('Orang kampung menjemput anda makan nasi minyak dan gulai.', 'The villagers invite you to share their nasi minyak and curry.'),
      choices: [
        { label: L('Makan (+10 semangat)', 'Eat (+10 spirit)'), can: () => true,
          go: (run) => { heal(run, 10); return L('Kenyang dan bersemangat semula.', 'Full and in good spirits again.'); } },
        LEAVE,
      ],
    },
    peniaga: {
      title: L('Peniaga Misteri', 'Mysterious Trader'),
      text: L('Seorang peniaga berjubah menunjukkan guli yang berkilau aneh.', 'A cloaked trader shows you a strangely glowing marble.'),
      choices: [
        { label: L('Beli guli jarang (15 syiling)', 'Buy a rare marble (15 coins)'),
          can: (run) => run.coins >= 15 && hasSlot(run),
          go: (run, rnd) => {
            run.coins -= 15;
            const id = randomItem(run, rnd, 3);
            addItem(run, id);
            return L(`Anda dapat ${ITEMS[id].name.ms}.`, `You got a ${ITEMS[id].name.en}.`);
          } },
        LEAVE,
      ],
    },
    perigi: {
      title: L('Perigi Lama', 'The Old Well'),
      text: L('Kata orang, perigi ini menunaikan hajat jika dilempar syiling.', 'They say this well grants wishes if you toss in a coin.'),
      choices: [
        { label: L('Lempar 5 syiling', 'Toss 5 coins'), can: (run) => run.coins >= 5,
          go: (run, rnd) => {
            run.coins -= 5;
            if (rnd() < 0.5) {
              earn(run, 18);
              return L('Perigi bergema… dan 18 syiling melantun keluar!', 'The well echoes… and 18 coins bounce back out!');
            }
            return L('Bunyi “plup”. Tiada apa-apa berlaku.', 'A soft “plop”. Nothing happens.');
          } },
        LEAVE,
      ],
    },
    durian: {
      title: L('Pokok Durian', 'The Durian Tree'),
      text: L('Ada sesuatu berkilau di celah duri di atas pokok.', 'Something glints between the thorns high up the tree.'),
      choices: [
        { label: L('Panjat (−6 semangat, dapat guli)', 'Climb (−6 spirit, get a marble)'), can: hasSlot,
          go: (run, rnd) => {
            run.hp = Math.max(1, run.hp - 6);
            const id = randomItem(run, rnd, 2);
            addItem(run, id);
            return L(`Aduh! Tapi anda dapat ${ITEMS[id].name.ms}.`, `Ouch! But you got a ${ITEMS[id].name.en}.`);
          } },
        LEAVE,
      ],
    },
    uncang: {
      title: L('Uncang Tercicir', 'A Dropped Pouch'),
      text: L('Anda terjumpa uncang kecil di tepi denai.', 'You find a small pouch beside the path.'),
      choices: [
        { label: L('Ambil (+12 syiling)', 'Take it (+12 coins)'), can: () => true,
          go: (run) => { earn(run, 12); return L('Rezeki jangan ditolak.', 'Never turn down good fortune.'); } },
      ],
    },
    guru: {
      title: L('Tok Guru Congkak', 'The Congkak Master'),
      text: L('Seorang tua menawarkan latihan, dengan bayaran.', 'An old master offers lessons, for a fee.'),
      choices: [
        { label: L('Belajar (12 syiling, +6 semangat maksimum)', 'Learn (12 coins, +6 max spirit)'), can: (run) => run.coins >= 12,
          go: (run) => { run.coins -= 12; run.maxHp += 6; run.hp += 6; return L('Anda rasa lebih kuat.', 'You feel stronger.'); } },
        LEAVE,
      ],
    },
  };

  function randomEvent(rnd) { return pick(Object.keys(EVENTS), rnd); }

  const api = {
    START, MAX_SLOTS, ROWS, COLS, ITEMS, HEROES, MODS, ENEMIES, AREAS, REST, EVENTS,
    newRun, nextArea, genMap, available, visit, nodeById,
    makeMatch, finishMatch, hitValue, damageFor, itemTargets, useItem,
    makeShop, buy, randomEvent, randomItem, addItem, hasSlot, heal, earn,
  };
  root.CongkakRogue = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
