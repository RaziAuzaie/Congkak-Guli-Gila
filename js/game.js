/*
 * Congkak UI — renders the board, animates engine events, runs the AI turn.
 * Two ways to play: Classic (vs computer or 2 players) and Roguelite
 * (a run across branching maps, with coins and one-use power marbles).
 */
(function () {
  'use strict';

  const C = window.Congkak;
  const AI = window.CongkakAI;
  const R = window.CongkakRogue;

  // ---------- Text (BM / EN) ----------
  const I18N = {
    ms: {
      tagline: 'Permainan tradisional Malaysia',
      mode: 'Mod', vsAI: 'Lawan Komputer', pvp: '2 Pemain', rogue: 'Roguelite',
      level: 'Tahap', easy: 'Mudah', medium: 'Sederhana', hard: 'Sukar',
      direction: 'Arah tabur', cw: 'Ikut jam', acw: 'Lawan jam',
      language: 'Bahasa', sound: 'Bunyi', music: 'Muzik', on: 'Hidup', off: 'Mati', settings: 'Tetapan',
      previewSetting: 'Pratonton langkah',
      pv_store: 'Buah terakhir masuk rumah anda → main lagi',
      pv_relay: 'Buah terakhir jatuh di kampung berisi → teruskan menabur',
      pv_capture: 'Buah terakhir jatuh di kampung kosong anda → tembak',
      pv_ownEmpty: 'Buah terakhir jatuh di kampung kosong anda → giliran tamat',
      pv_oppEmpty: 'Buah terakhir jatuh di kampung kosong lawan → giliran tamat',
      play: 'Main', newGame: 'Permainan baru', resume: 'Sambung', rules: 'Cara bermain',
      menu: 'Menu', close: 'Tutup', back: 'Kembali',
      you: 'Anda', computer: 'Komputer', p1: 'Pemain 1', p2: 'Pemain 2',
      store: 'Rumah', round: 'Pusingan {n}',
      yourTurn: 'Giliran anda — pilih satu kampung yang bercahaya',
      turnOf: 'Giliran {name}',
      thinking: 'Komputer sedang berfikir…',
      oppThinking: '{name} sedang berfikir…',
      tapSkip: 'Ketik untuk cepatkan',
      extra: 'Main lagi!', capture: 'Tembak! +{n}',
      roundOver: 'Pusingan {n} tamat', next: 'Pusingan seterusnya',
      burntInfo: '{name}: {n} kampung hangus', noBurnt: 'Tiada kampung hangus.',
      starts: '{name} mula dahulu',
      gameOver: 'Permainan tamat', wins: '{name} menang!', youWin: 'Tahniah, anda menang!', draw: 'Seri!',
      again: 'Main semula',
      rotate: 'Pusingkan telefon untuk papan lebih besar',
      left: 'kiri', right: 'kanan',
      rulesList: [
        'Setiap pemain ada 7 <b>kampung</b> dan sebuah <b>rumah</b>. Rumah anda di sebelah {side} anda. Setiap kampung bermula dengan 7 buah.',
        'Pilih satu kampung di sebelah anda. Ambil semua buah dan tabur satu demi satu ke lubang seterusnya, termasuk rumah anda — tetapi <b>langkau rumah lawan</b>.',
        'Buah terakhir jatuh di rumah anda → <b>main lagi</b>.',
        'Jatuh di kampung yang ada buah → ambil semua buah itu dan <b>teruskan menabur</b>.',
        'Jatuh di kampung kosong <b>di sebelah anda</b> → <b>tembak</b>: ambil buah itu dan semua buah di kampung bertentangan.',
        'Jatuh di kampung kosong di sebelah lawan → giliran tamat.',
        'Pusingan tamat sebaik sahaja semua kampung di <b>satu sebelah kosong</b>. Baki buah masuk ke rumah pemiliknya.',
        'Pusingan baru: setiap kampung diisi semula 7 buah dari rumah. Kampung yang tak dapat diisi jadi <b>hangus</b> dan dilangkau.',
        'Permainan tamat bila seorang pemain tak dapat mengisi walau satu kampung. Buah paling banyak menang!',
      ],

      // roguelite
      startRun: 'Mula pengembaraan', continueRun: 'Sambung pengembaraan', newRun: 'Pengembaraan baru',
      rogueRules: 'Peraturan Roguelite',
      spirit: 'Semangat', coins: 'Syiling',
      areaLabel: 'Kawasan {n}/3 · {name}',
      chooseNode: 'Pilih destinasi seterusnya',
      node_match: 'Lawan', node_elite: 'Lawan elit', node_boss: 'Ketua', node_shop: 'Kedai',
      node_rest: 'Wakaf', node_event: 'Misteri',
      fight: 'Lawan!', youFirst: 'Anda mula dahulu.', skill: 'Kemahiran',
      matchWin: 'Menang!', matchLose: 'Kalah…', matchDraw: 'Seri',
      comboCoins: 'Syiling kombo', winBonus: 'Bonus menang', damage: 'Semangat hilang', healed: 'Semangat pulih',
      rewardTitle: 'Ganjaran: pilih satu guli', skip: 'Langkau', take: 'Ambil',
      bagFull: 'Beg penuh. Buang satu guli dahulu.', drop: 'Buang', yourBag: 'Beg anda', emptySlot: 'Kosong',
      continue: 'Teruskan', retryBoss: 'Cuba lagi',
      bossRetry: 'Ketua mesti dikalahkan untuk mara.',
      areaClear: '{name} ditawan!', nextArea: 'Ke kawasan seterusnya',
      victory: 'Kemenangan!', victoryText: 'Anda juara congkak seluruh negeri!',
      runOver: 'Pengembaraan tamat', runOverText: 'Semangat anda habis di {name}.',
      st_wins: 'Perlawanan dimenangi', st_coins: 'Syiling dikumpul', st_combo: 'Kombo terbaik', st_items: 'Guli digunakan',
      shopTitle: 'Kedai Guli', buy: 'Beli', sold: 'Habis', healOffer: 'Ubat (+{n} semangat)', slotOffer: '+1 ruang beg',
      leave: 'Keluar',
      restTitle: 'Wakaf', restText: 'Sebuah wakaf di tepi jalan. Pilih satu.',
      combo: 'KOMBO x{n}',
      use: 'Guna', cancel: 'Batal',
      aimHint: 'Pilih kampung untuk {name}. Ketik Batal untuk berhenti.',
      notYourTurn: 'Guna guli pada giliran anda, sebelum menabur.',
      noTarget: 'Tiada sasaran untuk guli ini.',
      yourTurnRogue: 'Giliran anda — pilih kampung, atau guna guli dahulu',
      hintShown: 'Langkah terbaik bercahaya',
      blocked: 'Perisai menahan tembakan!',
      timeExtra: 'Guli Masa: main lagi!', boldExtra: '{name} main lagi!',
      goldOn: 'Syiling x2 giliran ini!',
      newRunTitle: 'Mula pengembaraan baru?', newRunText: 'Pengembaraan sekarang akan hilang.',
      giveUp: 'Menyerah', giveUpTitle: 'Menyerah?',
      giveUpText: 'Perlawanan ini dikira kalah. Baki buah di kampung masuk ke rumah lawan, dan anda hilang semangat ikut beza buah.',
      gaveUp: 'Anda menyerah',
      fx_shadow: 'Bayang', fx_lightning: 'Petir', fx_time: 'Masa', fx_shield: 'Perisai', fx_gold: 'Emas',
      mod_licik: 'Licik', mod_kaya: 'Kaya', mod_berani: 'Berani', mod_sekat: 'Sekatan',
      rogueRulesList: [
        'Pengembaraan merentas <b>3 kawasan</b>. Setiap kawasan ialah peta bercabang yang berakhir dengan seorang <b>ketua</b>.',
        'Setiap perlawanan hanya <b>satu pusingan</b>, dan anda mula dahulu. Rumah yang lebih banyak buah menang.',
        'Kalah → hilang <b>semangat</b> (3 hingga 12, ikut beza buah). Semangat habis → pengembaraan tamat. Ketua mesti dikalahkan untuk mara.',
        '<b>Kombo</b>: setiap sambungan tabur, tembakan atau main lagi dalam satu giliran menambah kombo. Tembakan dan main lagi memberi <b>syiling</b>, begitu juga setiap sambungan ke-5.',
        'Menang memberi syiling tambahan. Lawan elit dan ketua memberi guli percuma.',
        '<b>Guli sakti</b> digunakan sekali sahaja, pada giliran anda sebelum menabur. Ketik guli untuk membaca kesannya.',
        'Di peta: <b>Kedai</b> menjual guli, ubat dan ruang beg. <b>Wakaf</b> untuk berehat. <b>Misteri</b> ialah peristiwa rawak.',
      ],
    },
    en: {
      tagline: 'The traditional Malaysian board game',
      mode: 'Mode', vsAI: 'vs Computer', pvp: '2 Players', rogue: 'Roguelite',
      level: 'Level', easy: 'Easy', medium: 'Medium', hard: 'Hard',
      direction: 'Sowing direction', cw: 'Clockwise', acw: 'Anticlockwise',
      language: 'Language', sound: 'Sound', music: 'Music', on: 'On', off: 'Off', settings: 'Settings',
      previewSetting: 'Move preview',
      pv_store: 'Last seed lands in your store → play again',
      pv_relay: 'Last seed lands in a hole with seeds → keep sowing',
      pv_capture: 'Last seed lands in your empty hole → capture',
      pv_ownEmpty: 'Last seed lands in your empty hole → turn ends',
      pv_oppEmpty: 'Last seed lands in an empty opponent hole → turn ends',
      play: 'Play', newGame: 'New game', resume: 'Resume', rules: 'How to play',
      menu: 'Menu', close: 'Close', back: 'Back',
      you: 'You', computer: 'Computer', p1: 'Player 1', p2: 'Player 2',
      store: 'Store', round: 'Round {n}',
      yourTurn: 'Your turn — pick a glowing hole',
      turnOf: "{name}'s turn",
      thinking: 'Computer is thinking…',
      oppThinking: '{name} is thinking…',
      tapSkip: 'Tap to speed up',
      extra: 'Play again!', capture: 'Capture! +{n}',
      roundOver: 'Round {n} over', next: 'Next round',
      burntInfo: '{name}: {n} hole(s) burnt', noBurnt: 'No burnt holes.',
      starts: '{name} goes first',
      gameOver: 'Game over', wins: '{name} wins!', youWin: 'Congratulations, you win!', draw: 'Draw!',
      again: 'Play again',
      rotate: 'Rotate your phone for a bigger board',
      left: 'left', right: 'right',
      rulesList: [
        'Each player has 7 <b>holes</b> (kampung) and a <b>store</b> (rumah). Your store is on your {side}. Every hole starts with 7 seeds.',
        'Pick a hole on your side. Take all its seeds and sow them one by one into the following holes, including your store — but <b>skip the opponent’s store</b>.',
        'Last seed lands in your store → <b>play again</b>.',
        'Lands in a hole with seeds → pick them all up and <b>keep sowing</b>.',
        'Lands in an empty hole <b>on your side</b> → <b>capture</b> it plus every seed in the opposite hole.',
        'Lands in an empty hole on the opponent’s side → your turn ends.',
        'A round ends as soon as <b>one side’s holes are all empty</b>. Remaining seeds go to their owner’s store.',
        'New round: refill each hole with 7 seeds from your store. Holes you can’t fill are <b>burnt</b> and skipped.',
        'The game ends when a player can’t fill even one hole. Most seeds wins!',
      ],

      // roguelite
      startRun: 'Start a run', continueRun: 'Continue run', newRun: 'New run',
      rogueRules: 'Roguelite rules',
      spirit: 'Spirit', coins: 'Coins',
      areaLabel: 'Area {n}/3 · {name}',
      chooseNode: 'Choose where to go next',
      node_match: 'Match', node_elite: 'Elite match', node_boss: 'Boss', node_shop: 'Shop',
      node_rest: 'Rest stop', node_event: 'Mystery',
      fight: 'Fight!', youFirst: 'You move first.', skill: 'Skill',
      matchWin: 'You win!', matchLose: 'Defeated…', matchDraw: 'Draw',
      comboCoins: 'Combo coins', winBonus: 'Win bonus', damage: 'Spirit lost', healed: 'Spirit restored',
      rewardTitle: 'Reward: choose a marble', skip: 'Skip', take: 'Take',
      bagFull: 'Bag full. Drop a marble first.', drop: 'Drop', yourBag: 'Your bag', emptySlot: 'Empty',
      continue: 'Continue', retryBoss: 'Try again',
      bossRetry: 'You must beat the boss to move on.',
      areaClear: '{name} conquered!', nextArea: 'On to the next area',
      victory: 'Victory!', victoryText: 'You are the congkak champion of the land!',
      runOver: 'Run over', runOverText: 'Your spirit ran out in {name}.',
      st_wins: 'Matches won', st_coins: 'Coins earned', st_combo: 'Best combo', st_items: 'Marbles used',
      shopTitle: 'Marble Shop', buy: 'Buy', sold: 'Sold', healOffer: 'Medicine (+{n} spirit)', slotOffer: '+1 bag slot',
      leave: 'Leave',
      restTitle: 'Rest Stop', restText: 'A roadside shelter. Choose one.',
      combo: 'COMBO x{n}',
      use: 'Use', cancel: 'Cancel',
      aimHint: 'Choose a hole for the {name}. Tap Cancel to stop.',
      notYourTurn: 'Use marbles on your turn, before you sow.',
      noTarget: 'This marble has no target right now.',
      yourTurnRogue: 'Your turn — pick a hole, or use a marble first',
      hintShown: 'The best move is glowing',
      blocked: 'Shield blocks the capture!',
      timeExtra: 'Time Marble: play again!', boldExtra: '{name} plays again!',
      goldOn: 'Coins x2 this turn!',
      newRunTitle: 'Start a new run?', newRunText: 'Your current run will be lost.',
      giveUp: 'Give up', giveUpTitle: 'Give up?',
      giveUpText: 'This match counts as a loss. Seeds left in the holes go to the opponent’s rumah, and you lose spirit by the seed difference.',
      gaveUp: 'You gave up',
      fx_shadow: 'Shadow', fx_lightning: 'Lightning', fx_time: 'Time', fx_shield: 'Shield', fx_gold: 'Gold',
      mod_licik: 'Cunning', mod_kaya: 'Rich', mod_berani: 'Bold', mod_sekat: 'Blockade',
      rogueRulesList: [
        'A run crosses <b>3 areas</b>. Each area is a branching map that ends with a <b>boss</b>.',
        'Every match is a <b>single round</b>, and you always move first. The fuller rumah wins.',
        'Lose and you lose <b>spirit</b> (3 to 12, by the seed difference). Out of spirit → the run is over. A boss must be beaten to move on.',
        '<b>Combos</b>: every relay, capture or extra turn in one turn adds to the combo. Captures and extra turns pay <b>coins</b>, and so does every 5th link.',
        'Winning pays bonus coins. Elite matches and bosses also give a free marble.',
        '<b>Power marbles</b> are used once, on your turn, before you sow. Tap a marble to read what it does.',
        'On the map: <b>Shops</b> sell marbles, medicine and bag slots. <b>Rest stops</b> let you recover. <b>Mysteries</b> are random events.',
      ],
    },
  };

  // ---------- Settings ----------
  const DEFAULTS = { lang: 'ms', dir: 'cw', sound: true, music: true, preview: true, level: 'medium', mode: 'ai' };
  const settings = Object.assign({}, DEFAULTS, loadSettings());
  function loadSettings() {
    try { return JSON.parse(localStorage.getItem('congkak.settings')) || {}; } catch (e) { return {}; }
  }
  function saveSettings() {
    try { localStorage.setItem('congkak.settings', JSON.stringify(settings)); } catch (e) { /* ignore */ }
  }

  function t(key, vars) {
    let s = I18N[settings.lang][key];
    if (s === undefined) s = I18N.en[key];
    if (s === undefined) return key;
    if (vars && typeof s === 'string') for (const k in vars) s = s.split('{' + k + '}').join(vars[k]);
    return s;
  }
  const tx = (pair) => pair[settings.lang] || pair.en; // text pairs from rogue.js

  // ---------- Game state ----------
  let state = null;     // engine state (truth)
  let view = null;      // seed counts currently shown (lags behind during animation)
  let mode = settings.mode;
  let started = false;
  let busy = false;
  let skip = false;
  let gen = 0;          // bumps on new game so stale animations stop
  const STEP = 170;     // ms per seed drop

  // Roguelite
  let run = null;       // saved run (plain data, see rogue.js)
  let match = null;     // current match: { m, node, combo, coins, gold }
  let aiming = null;    // { slot, id, targets } while choosing a marble's target
  let selSlot = -1;     // marble whose details are open in the tray

  const $ = (sel) => document.querySelector(sel);
  const boardEl = $('#board');
  const overlay = $('#overlay');
  const modal = $('#modal');
  const toastEl = $('#toast');
  const comboEl = $('#combo');
  let board, toastTimer, comboTimer;

  const sleep = (ms) => (skip ? Promise.resolve() : new Promise((r) => setTimeout(r, ms)));
  const rogue = () => mode === 'rogue' && match;
  const enemyName = () => R.ENEMIES[match.m.enemy].name;
  const nameOf = (p) => {
    if (mode === 'rogue') return p === 0 ? t('you') : match ? enemyName() : t('computer');
    if (mode === 'ai') return p === 0 ? t('you') : t('computer');
    return p === 0 ? t('p1') : t('p2');
  };
  const isHuman = (p) => mode === 'pvp' || p === 0;
  const modalOpen = () => !overlay.classList.contains('hidden');
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  // ---------- Pixel icons (7x7, drawn as SVG rects) ----------
  const ICONS = {
    match: ['X.....X', '.X...X.', '..X.X..', '...X...', '..X.X..', 'XX...XX', 'XX...XX'],
    elite: ['.XXXXX.', 'XXXXXXX', 'X..X..X', 'XXXXXXX', '.XX.XX.', '.X.X.X.', '.......'],
    boss: ['X..X..X', 'XX.X.XX', 'XXXXXXX', 'XXXXXXX', 'X.X.X.X', 'XXXXXXX', '.......'],
    shop: ['..XXX..', '.X...X.', 'XXXXXXX', 'X.....X', 'X..X..X', 'X.....X', 'XXXXXXX'],
    rest: ['...X...', '..XXX..', '.XXXXX.', 'XXXXXXX', '.X...X.', '.X...X.', '.X...X.'],
    event: ['.XXXXX.', 'XX...XX', '....XX.', '...XX..', '...X...', '.......', '...X...'],
    heart: ['.XX.XX.', 'XXXXXXX', 'XXXXXXX', '.XXXXX.', '..XXX..', '...X...', '.......'],
    coin: ['..XXX..', '.XXXXX.', 'XXX.XXX', 'XXX.XXX', 'XXX.XXX', '.XXXXX.', '..XXX..'],
    flag: ['XXXXX..', 'XXXXXXX', 'XXXXXXX', 'XXXX...', 'X......', 'X......', 'X......'],
  };
  const MARBLE = ['..XXX..', '.XHXXX.', 'XHXXXXX', 'XXXXXXX', 'XXXXXXD', '.XXXXD.', '..XDD..'];

  function pxSvg(grid, fill, cls) {
    let rects = '';
    grid.forEach((row, y) => {
      for (let x = 0; x < row.length; x++) {
        const ch = row[x];
        if (ch === '.') continue;
        rects += `<rect x="${x}" y="${y}" width="1" height="1" fill="${ch === 'H' ? '#ffffff' : fill}"/>`;
        if (ch === 'D') rects += `<rect x="${x}" y="${y}" width="1" height="1" fill="rgba(0,0,0,.4)"/>`;
      }
    });
    return `<svg class="${cls || 'pxi'}" viewBox="0 0 7 7" shape-rendering="crispEdges" aria-hidden="true">${rects}</svg>`;
  }
  const icon = (name) => pxSvg(ICONS[name], 'currentColor');
  const marble = (id) => pxSvg(MARBLE, R.ITEMS[id].color, 'marble');

  // ---------- Board ----------
  // The pixel renderer draws `view` every frame; we only need to hand it new arrays.
  function renderPit(i) {
    if (i === C.STORE[0] || i === C.STORE[1]) renderBars();
  }

  function renderAll() {
    board.setView(view, state.burnt);
    board.setFrozen(state.fx.frozen);
    renderBars();
  }

  function fxChips(p) {
    if (!rogue()) return '';
    const fx = state.fx;
    const on = [];
    if (p === 0) {
      if (fx.shadow[0]) on.push(t('fx_shadow'));
      if (fx.lightning[0]) on.push(t('fx_lightning'));
      if (fx.time[0]) on.push(t('fx_time'));
      if (fx.shield[0]) on.push(t('fx_shield'));
      if (match.gold) on.push(t('fx_gold'));
    } else {
      match.m.mods.forEach((m) => on.push(t('mod_' + m)));
    }
    return on.map((s) => `<i class="fxchip${p === 1 ? ' bad' : ''}">${esc(s)}</i>`).join('');
  }

  function renderBars() {
    for (const p of [0, 1]) {
      const bar = $('#bar' + p);
      bar.querySelector('.name').textContent = nameOf(p);
      bar.querySelector('.fx').innerHTML = fxChips(p);
      bar.querySelector('.store-count').innerHTML = `${t('store')}: <b>${view[C.STORE[p]]}</b>`;
      bar.classList.toggle('active', state.phase === 'play' && state.player === p);
    }
  }

  function canUseItems() {
    return rogue() && !busy && state.phase === 'play' && state.player === 0 && !modalOpen();
  }

  function updateUI() {
    let legal = !busy && state.phase === 'play' && isHuman(state.player) ? C.legalMoves(state) : [];
    if (aiming) legal = aiming.targets;
    board.setLegal(legal);
    board.setAiming(!!aiming);
    board.setFlipTop(mode === 'pvp');
    renderBars();
    renderHud();
    renderTray();
    $('#roundLabel').textContent = rogue()
      ? t('areaLabel', { n: run.area + 1, name: tx(R.AREAS[run.area].name) })
      : t('round', { n: state.round });
    document.body.classList.toggle('pvp', mode === 'pvp');
    document.body.classList.toggle('rogue', !!rogue());
    document.querySelectorAll('[data-t]').forEach((el) => (el.textContent = t(el.dataset.t)));
    document.documentElement.lang = settings.lang;
  }

  function setStatus(text) {
    const el = $('#status');
    el.textContent = text;
    el.classList.remove('preview');
  }
  function turnStatus() {
    if (state.phase !== 'play') return '';
    const p = state.player;
    if (mode === 'rogue') return p === 0 ? t('yourTurnRogue') : t('oppThinking', { name: nameOf(1) });
    if (mode === 'ai') return p === 0 ? t('yourTurn') : t('thinking');
    return t('turnOf', { name: nameOf(p) });
  }

  const showHand = (pos, n) => board.setHand(pos, n);
  const hideHand = () => board.hideHand();
  const flash = (i) => board.flash(i);

  function toast(text) {
    toastEl.textContent = text;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('show'), 1100);
  }

  // ---------- Sound (synthesised, no assets) ----------
  let audio = null;
  function ac() {
    if (!audio) {
      try { audio = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { audio = null; }
    }
    if (audio && audio.state === 'suspended') audio.resume();
    return audio;
  }

  // Lagu Asli on the menu and map, Joget while a match is on
  function updateMusic() {
    const Music = window.CongkakMusic;
    if (!Music) return;
    if (!settings.music) { Music.stop(); return; }
    const a = ac();
    if (!a) return;
    Music.play(started && state && state.phase !== 'over' ? 'joget' : 'asli', a);
  }
  function tone(freq, start, dur, type = 'triangle', vol = 0.22, endFreq) {
    const a = ac();
    if (!a) return;
    const t0 = a.currentTime + start;
    const o = a.createOscillator();
    const g = a.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t0);
    if (endFreq) o.frequency.exponentialRampToValueAtTime(endFreq, t0 + dur);
    g.gain.setValueAtTime(vol, t0);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    o.connect(g).connect(a.destination);
    o.start(t0);
    o.stop(t0 + dur + 0.02);
  }
  function sfx(kind) {
    if (!settings.sound || skip) return;
    // chiptune-style blips to match the pixel look
    switch (kind) {
      case 'tok': tone(660 + Math.floor(Math.random() * 3) * 110, 0, 0.05, 'square', 0.07, 330); break;
      case 'pick': tone(330, 0, 0.09, 'square', 0.07, 660); break;
      case 'capture': [523, 659, 784, 1047].forEach((f, k) => tone(f, k * 0.06, 0.12, 'square', 0.07)); break;
      case 'extra': [784, 1175].forEach((f, k) => tone(f, k * 0.08, 0.14, 'square', 0.07)); break;
      case 'win': [523, 659, 784, 1047, 784, 1047].forEach((f, k) => tone(f, k * 0.11, 0.18, 'square', 0.07)); break;
      case 'coin': [1319, 1760].forEach((f, k) => tone(f, k * 0.05, 0.08, 'square', 0.05)); break;
      case 'magic': [392, 523, 659, 880, 1175].forEach((f, k) => tone(f, k * 0.04, 0.1, 'triangle', 0.08)); break;
      case 'hurt': tone(220, 0, 0.3, 'square', 0.07, 80); break;
    }
    if ((kind === 'capture' || kind === 'extra' || kind === 'hurt') && navigator.vibrate) {
      navigator.vibrate(kind === 'extra' ? 15 : 40);
    }
  }

  // ---------- Turn flow ----------
  function newGame() {
    gen++;
    mode = settings.mode;
    match = null;
    aiming = null;
    selSlot = -1;
    started = true;
    busy = false;
    skip = false;
    state = C.createGame(0);
    view = state.holes.slice();
    board.clearPicked();
    board.setPreview(null);
    previewing = false;
    renderAll();
    closeModal();
    updateUI();
    setStatus(turnStatus());
    updateMusic();
  }

  async function onPit(i) {
    if (aiming) {
      if (aiming.targets.includes(i)) await applyItem(aiming.slot, i);
      else board.shake(i);
      return;
    }
    if (busy || !state || state.phase !== 'play' || !isHuman(state.player)) return;
    if (!C.legalMoves(state).includes(i)) {
      board.shake(i);
      return;
    }
    ac(); // unlock audio on first user gesture
    await doMove(i);
  }

  async function doMove(i) {
    clearPreview();
    const g = gen;
    const who = state.player;
    busy = true;
    skip = false;
    selSlot = -1;
    board.clearPicked();
    updateUI();
    setStatus(t('tapSkip'));
    const res = C.playMove(state, i, true);
    await animate(res.events, g, who);
    if (g !== gen) return;
    state = res.state;
    view = state.holes.slice();
    if (rogue() && who === 0 && (res.result === 'end' || state.phase !== 'play')) endPlayerTurn();
    renderAll();
    busy = false;
    skip = false;
    afterMove();
  }

  async function animate(events, g, who) {
    let hand = 0;
    let first = true;
    for (const ev of events) {
      if (g !== gen) return;
      switch (ev.t) {
        case 'pick':
          view[ev.pos] = 0;
          hand = ev.n;
          renderPit(ev.pos);
          showHand(ev.pos, hand);
          sfx('pick');
          if (!first) comboHit(who, 'relay');
          first = false;
          await sleep(STEP * 1.6);
          break;
        case 'drop':
          view[ev.pos]++;
          hand = ev.hand;
          renderPit(ev.pos);
          showHand(ev.pos, hand);
          sfx('tok');
          await sleep(STEP);
          break;
        case 'capture':
          hideHand();
          flash(ev.pos);
          flash(ev.opp);
          (ev.extra || []).forEach(flash);
          await sleep(STEP * 2.5);
          view[ev.pos] = 0;
          view[ev.opp] = 0;
          (ev.extra || []).forEach((k) => { view[k] = 0; });
          view[ev.store] += ev.n;
          renderPit(ev.store);
          flash(ev.store);
          toast(t('capture', { n: ev.n }));
          sfx('capture');
          if (rogue() && who === 0) run.stats.captures++;
          comboHit(who, 'capture', ev.n);
          await sleep(STEP * 6);
          break;
        case 'blocked':
          hideHand();
          flash(ev.pos);
          flash(ev.opp);
          toast(t('blocked'));
          sfx('magic');
          await sleep(STEP * 5);
          break;
        case 'extra':
          hideHand();
          flash(C.STORE[who]);
          toast(ev.why === 'time' ? t('timeExtra') : ev.why === 'bold' ? t('boldExtra', { name: nameOf(who) }) : t('extra'));
          sfx('extra');
          comboHit(who, 'extra');
          await sleep(STEP * 5);
          break;
        case 'sweep':
          hideHand();
          await sleep(STEP * 3);
          ev.pits.forEach((i) => { view[i] = 0; renderPit(i); });
          view[ev.store] += ev.n;
          renderPit(ev.store);
          flash(ev.store);
          await sleep(STEP * 3);
          break;
        // power-marble effects
        case 'move':
          flash(ev.from);
          view[ev.from] -= ev.n;
          view[ev.to] += ev.n;
          renderPit(ev.to);
          flash(ev.to);
          sfx('tok');
          await sleep(STEP * 1.5);
          break;
        case 'add':
          view[ev.pos] += ev.n;
          flash(ev.pos);
          await sleep(STEP * 3);
          break;
        case 'freeze':
          flash(ev.pos);
          await sleep(STEP * 3);
          break;
      }
    }
    hideHand();
  }

  function afterMove() {
    updateUI();
    if (state.phase === 'over' && mode === 'rogue') { setStatus(''); setTimeout(rogueMatchEnd, 600); return; }
    if (state.phase === 'roundEnd') { setStatus(''); setTimeout(showRoundEnd, 500); return; }
    if (state.phase === 'over') { setStatus(''); setTimeout(showGameOver, 500); return; }
    setStatus(turnStatus());
    if (!isHuman(state.player)) aiTurn();
    else previewMove(board.getHover()); // mouse still over a hole: show its new outcome
  }

  async function aiTurn() {
    const g = gen;
    busy = true;
    skip = false;
    updateUI();
    setStatus(turnStatus());
    await sleep(600);
    while (modalOpen() && g === gen) await new Promise((r) => setTimeout(r, 200));
    if (g !== gen) return;
    // let the status paint before a potentially slow search
    await new Promise((r) => setTimeout(r, 30));
    const move = AI.chooseMove(state, mode === 'rogue' ? match.m.ai : settings.level);
    if (g !== gen) return;
    board.setPicked(move, true);
    await sleep(450);
    board.setPicked(move, false);
    await doMove(move);
  }

  // ---------- Move preview ----------
  // Hovering one of your playable holes shows where the last seed of its first
  // sowing lands — only that first lap, not the relays after it.
  let previewing = false;

  function previewMove(i) {
    const ok = settings.preview && i >= 0 && !busy && !aiming && !modalOpen() && state &&
      state.phase === 'play' && isHuman(state.player) && C.legalMoves(state).includes(i);
    if (!ok) { clearPreview(); return; }
    const p = state.player;
    const land = C.firstLanding(state, i);
    let key;
    if (land.pos === C.STORE[p]) key = 'pv_store';
    else if (land.count > 1) key = 'pv_relay';
    else if (C.ownerOf(land.pos) !== p) key = 'pv_oppEmpty';
    else key = land.opposite > 0 ? 'pv_capture' : 'pv_ownEmpty';
    board.setPreview([[land.pos, land.pos === C.STORE[p] ? 'store' : 'end']]);
    const el = $('#status');
    el.textContent = t(key);
    el.classList.add('preview');
    previewing = true;
  }

  function clearPreview() {
    board.setPreview(null);
    if (!previewing) return;
    previewing = false;
    setStatus(state && !busy && !aiming ? turnStatus() : $('#status').textContent);
  }

  // ---------- Roguelite: combos and coins ----------
  function comboHit(who, kind, n) {
    if (!rogue() || who !== 0) return;
    match.combo++;
    const v = R.hitValue(kind, match.combo, n) * (match.gold ? 2 : 1);
    if (v > 0) {
      R.earn(run, v);
      match.coins += v;
      sfx('coin');
    }
    run.stats.bestCombo = Math.max(run.stats.bestCombo, match.combo);
    comboEl.innerHTML = `${t('combo', { n: match.combo })}${v > 0 ? ` <span class="gain">${icon('coin')}+${v}</span>` : ''}`;
    comboEl.classList.remove('show');
    void comboEl.offsetWidth; // restart the pop animation
    comboEl.classList.add('show');
    clearTimeout(comboTimer);
    renderHud();
  }

  function endPlayerTurn() {
    match.combo = 0;
    match.gold = false;
    clearTimeout(comboTimer);
    comboTimer = setTimeout(() => comboEl.classList.remove('show'), 900);
  }

  function renderHud() {
    const hud = $('#hud');
    if (!run || mode !== 'rogue') { hud.innerHTML = ''; return; }
    hud.innerHTML = hudHtml();
  }
  function hudHtml() {
    const low = run.hp <= run.maxHp * 0.3 ? ' low' : '';
    return `<span class="hud-hp${low}" title="${t('spirit')}">${icon('heart')}<b>${run.hp}</b>/${run.maxHp}</span>` +
      `<span class="hud-coins" title="${t('coins')}">${icon('coin')}<b>${run.coins}</b></span>`;
  }

  // ---------- Roguelite: marble tray ----------
  function renderTray() {
    const tray = $('#tray');
    if (!rogue()) { tray.innerHTML = ''; return; }
    let html = '<div class="slots">';
    for (let k = 0; k < run.slots; k++) {
      const id = run.items[k];
      if (!id) { html += `<div class="slot empty" aria-label="${t('emptySlot')}"></div>`; continue; }
      const cls = (k === selSlot ? ' sel' : '') + (aiming && aiming.slot === k ? ' aim' : '');
      html += `<button type="button" class="slot${cls}" data-slot="${k}" aria-label="${esc(tx(R.ITEMS[id].name))}">${marble(id)}</button>`;
    }
    if (state.phase === 'play') {
      html += `<button type="button" class="slot giveup" data-tray="giveup" aria-label="${t('giveUp')}" title="${t('giveUp')}">${icon('flag')}</button>`;
    }
    html += '</div>';
    const id = run.items[selSlot];
    if (aiming) {
      html += `<div class="item-info">
        <div class="item-name">${marble(aiming.id)}<b>${esc(tx(R.ITEMS[aiming.id].name))}</b></div>
        <p>${t('aimHint', { name: esc(tx(R.ITEMS[aiming.id].name)) })}</p>
        <div class="item-actions"><button type="button" class="btn ghost small" data-tray="cancel">${t('cancel')}</button></div>
      </div>`;
    } else if (id) {
      const it = R.ITEMS[id];
      const ok = canUseItems();
      html += `<div class="item-info">
        <div class="item-name">${marble(id)}<b>${esc(tx(it.name))}</b></div>
        <p>${esc(tx(it.desc))}</p>
        ${ok ? '' : `<p class="note warn">${t('notYourTurn')}</p>`}
        <div class="item-actions">
          <button type="button" class="btn ghost small" data-tray="cancel">${t('cancel')}</button>
          <button type="button" class="btn primary small" data-tray="use" ${ok ? '' : 'disabled'}>${t('use')}</button>
        </div>
      </div>`;
    }
    tray.innerHTML = html;
  }

  $('#tray').addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b || !rogue()) return;
    ac();
    if (b.dataset.slot !== undefined) {
      const k = Number(b.dataset.slot);
      if (aiming) cancelAim();
      selSlot = selSlot === k ? -1 : k;
      renderTray();
    } else if (b.dataset.tray === 'cancel') {
      if (aiming) cancelAim();
      selSlot = -1;
      renderTray();
    } else if (b.dataset.tray === 'use') {
      startUse(selSlot);
    } else if (b.dataset.tray === 'giveup') {
      confirmGiveUp();
    }
  });

  // ---------- Roguelite: giving up ----------
  // Seeds still in the holes go to the opponent, and the match counts as a loss.
  function forfeitMargin() {
    const left = C.sidePits(0).concat(C.sidePits(1)).reduce((a, i) => a + state.holes[i], 0);
    return Math.max(1, state.holes[C.STORE[1]] + left - state.holes[C.STORE[0]]);
  }

  function confirmGiveUp() {
    if (!rogue() || state.phase !== 'play') return;
    openModal(`
      <h2>${t('giveUpTitle')}</h2>
      <p class="note">${t('giveUpText')}</p>
      <div class="ledger"><div class="bad"><span>${t('damage')}</span><b>−${R.damageFor(forfeitMargin())}</b></div></div>
      <div class="hud center">${hudHtml()}</div>
      <div class="actions">
        <button type="button" class="btn ghost" data-act="resume">${t('cancel')}</button>
        <button type="button" class="btn primary" data-act="giveUpYes">${t('giveUp')}</button>
      </div>
    `);
  }

  function giveUp() {
    if (!rogue() || state.phase !== 'play') { closeModal(); return; }
    gen++; // stops any sowing animation or computer turn in progress
    busy = false;
    skip = false;
    aiming = null;
    selSlot = -1;
    hideHand();
    board.clearPicked();
    const st = C.clone(state);
    for (const i of C.sidePits(0).concat(C.sidePits(1))) {
      st.holes[C.STORE[1]] += st.holes[i];
      st.holes[i] = 0;
    }
    st.phase = 'over';
    state = st;
    view = state.holes.slice();
    renderAll();
    updateUI();
    setStatus('');
    rogueMatchEnd(true);
  }

  function cancelAim() {
    aiming = null;
    updateUI();
    setStatus(turnStatus());
  }

  function startUse(slot) {
    if (!canUseItems()) { setStatus(t('notYourTurn')); return; }
    const id = run.items[slot];
    const def = R.ITEMS[id];
    if (def.target) {
      const targets = R.itemTargets(state, 0, id);
      if (!targets.length) { setStatus(t('noTarget')); return; }
      clearPreview();
      aiming = { slot, id, targets };
      selSlot = -1;
      updateUI();
      setStatus(t('aimHint', { name: tx(def.name) }));
      return;
    }
    applyItem(slot, null);
  }

  async function applyItem(slot, target) {
    const id = run.items[slot];
    const g = gen;
    run.items.splice(slot, 1);
    run.stats.items++;
    aiming = null;
    selSlot = -1;
    sfx('magic');
    toast(tx(R.ITEMS[id].name) + '!');
    if (id === 'emas') {
      match.gold = true;
      setStatus(t('goldOn'));
    } else if (id === 'ramal') {
      busy = true;
      updateUI();
      await new Promise((r) => setTimeout(r, 30));
      const best = AI.chooseMove(state, { depth: 6, random: 0 });
      busy = false;
      if (g !== gen) return;
      board.setPicked(best, true);
      setStatus(t('hintShown'));
    } else {
      busy = true;
      updateUI();
      const res = R.useItem(state, 0, id, target);
      await animate(res.events, g, 0);
      if (g !== gen) return;
      state = res.state;
      view = state.holes.slice();
      busy = false;
      renderAll();
      if (state.phase !== 'play') { afterMove(); return; }
      setStatus(turnStatus());
    }
    updateUI();
    if (id !== 'ramal' && id !== 'emas') previewMove(board.getHover()); // the board changed
  }

  // ---------- Roguelite: saving ----------
  const RUN_KEY = 'congkak.run';
  function saveRun() {
    try { localStorage.setItem(RUN_KEY, JSON.stringify(run)); } catch (e) { /* ignore */ }
  }
  function loadRun() {
    try {
      const r = JSON.parse(localStorage.getItem(RUN_KEY));
      return r && r.v === 1 && !r.done ? r : null;
    } catch (e) { return null; }
  }
  function clearRun() {
    try { localStorage.removeItem(RUN_KEY); } catch (e) { /* ignore */ }
  }

  // ---------- Roguelite: run flow ----------
  function startRun() {
    rogueReturn = null;
    run = R.newRun();
    mode = 'rogue';
    showMap();
  }

  /** Back to the run: the match in progress, the screen the menu was opened from, or the last save. */
  function continueRun() {
    if (inRogueMatch()) { closeModal(); updateUI(); return; }
    if (rogueReturn && run && !run.done) {
      const r = rogueReturn;
      rogueReturn = null;
      mode = 'rogue';
      leaveMatch();
      openModal(r.html, r.cls);
      screen = r.screen;
      return;
    }
    run = loadRun();
    if (!run) { startRun(); return; }
    mode = 'rogue';
    showMap();
  }

  const inRogueMatch = () => mode === 'rogue' && started && !!match && state.phase === 'play';
  const runInProgress = () => inRogueMatch() || !!(rogueReturn && run && !run.done) || !!loadRun();

  function confirmNewRun() {
    openModal(`
      <h2>${t('newRunTitle')}</h2>
      <p class="note">${t('newRunText')}</p>
      <div class="actions">
        <button type="button" class="btn ghost" data-act="menu">${t('cancel')}</button>
        <button type="button" class="btn primary" data-act="newRunYes">${t('newRun')}</button>
      </div>
    `);
    screen = 'menu';
  }

  /** Leave any match on the board and go quiet (map, shop, events). */
  function leaveMatch() {
    gen++;
    started = false;
    busy = false;
    aiming = null;
    selSlot = -1;
    match = null;
    comboEl.classList.remove('show');
    board.clearPicked();
    board.setPreview(null);
    previewing = false;
    updateUI();
    setStatus('');
    updateMusic();
  }

  function runHead(title) {
    return `<div class="run-head">
      <div class="run-title">${title}</div>
      <div class="hud">${hudHtml()}</div>
    </div>`;
  }

  function bagHtml(droppable) {
    let html = `<div class="bag"><div class="bag-label">${t('yourBag')} (${run.items.length}/${run.slots})</div><div class="bag-items">`;
    run.items.forEach((id, k) => {
      html += `<span class="bag-item" title="${esc(tx(R.ITEMS[id].desc))}">${marble(id)}${esc(tx(R.ITEMS[id].name))}` +
        (droppable ? ` <button type="button" class="mini" data-drop="${k}">${t('drop')}</button>` : '') + '</span>';
    });
    for (let k = run.items.length; k < run.slots; k++) html += `<span class="bag-item empty">${t('emptySlot')}</span>`;
    return html + '</div></div>';
  }

  function showMap() {
    leaveMatch();
    rogueReturn = null;
    saveRun();
    const area = R.AREAS[run.area];
    const avail = new Set(R.available(run).map((n) => n.id));
    const rows = run.map.rows;
    const N = rows.length;
    const yOf = (row) => (((N - 1 - row) + 0.5) / N) * 100;
    const onPath = (a, b) => {
      const i = run.path.indexOf(a);
      return i >= 0 && run.path[i + 1] === b;
    };
    let lines = '';
    let nodes = '';
    for (const row of rows) {
      for (const n of row) {
        for (const id of n.next) {
          const m = R.nodeById(run, id);
          const cls = onPath(n.id, id) ? 'walked' : avail.has(id) && run.at === n.id ? 'open' : '';
          lines += `<line x1="${n.x}%" y1="${yOf(n.row)}%" x2="${m.x}%" y2="${yOf(m.row)}%" class="${cls}"/>`;
        }
        const st = n.id === run.at ? 'here' : run.path.includes(n.id) ? 'done' : avail.has(n.id) ? 'avail' : '';
        const label = t('node_' + n.type) + (n.enemy ? ' — ' + R.ENEMIES[n.enemy].name : '');
        nodes += `<button type="button" class="node t-${n.type} ${st}" style="left:${n.x}%;top:${yOf(n.row)}%"
          data-node="${n.id}" ${avail.has(n.id) ? '' : 'disabled'} aria-label="${esc(label)}" title="${esc(label)}">${icon(n.type)}</button>`;
      }
    }
    const legend = ['match', 'elite', 'shop', 'rest', 'event', 'boss']
      .map((k) => `<span class="t-${k}">${icon(k)}${t('node_' + k)}</span>`).join('');
    openModal(`
      ${runHead(t('areaLabel', { n: run.area + 1, name: tx(area.name) }))}
      <div class="map" style="height:${N * 56}px">
        <svg class="map-lines" aria-hidden="true">${lines}</svg>
        ${nodes}
      </div>
      <p class="note">${t('chooseNode')}</p>
      <div class="legend">${legend}</div>
      ${bagHtml(false)}
      <div class="actions"><button type="button" class="btn ghost" data-act="menu">${t('menu')}</button></div>
    `, 'wide');
  }

  function enterNode(id) {
    const node = R.nodeById(run, id);
    if (!R.available(run).some((n) => n.id === id)) return;
    R.visit(run, node);
    if (node.type === 'shop') showShop(node);
    else if (node.type === 'rest') showRest();
    else if (node.type === 'event') showEvent(node);
    else showIntro(node);
  }

  function showIntro(node) {
    const m = R.makeMatch(run, node);
    const e = R.ENEMIES[m.enemy];
    const lvl = Math.min(5, m.ai.depth);
    const stars = `<span aria-label="${lvl}/5">${'★'.repeat(lvl)}<span class="off">${'★'.repeat(5 - lvl)}</span></span>`;
    const mods = m.mods.map((k) => `<li>${esc(tx(R.MODS[k]))}</li>`).join('');
    pendingMatch = { m, node };
    openModal(`
      <div class="intro t-${node.type}">${icon(node.type)}<span>${t('node_' + node.type)}</span></div>
      <h2>${esc(e.name)}</h2>
      <p class="tagline">${esc(tx(e.title))}</p>
      <p class="note">${t('skill')}: <span class="stars">${stars}</span></p>
      ${mods ? `<ul class="mods">${mods}</ul>` : ''}
      <p class="note">${t('youFirst')}</p>
      <div class="actions"><button type="button" class="btn primary" data-act="fight">${t('fight')}</button></div>
    `);
  }
  let pendingMatch = null;

  function startMatch() {
    const { m, node } = pendingMatch;
    gen++;
    mode = 'rogue';
    match = { m, node, combo: 0, coins: 0, gold: false };
    aiming = null;
    selSlot = -1;
    started = true;
    busy = false;
    skip = false;
    state = C.createGame(m.first, m.opts);
    view = state.holes.slice();
    board.clearPicked();
    board.setPreview(null);
    previewing = false;
    renderAll();
    closeModal();
    updateUI();
    setStatus(turnStatus());
    updateMusic();
    if (!isHuman(state.player)) aiTurn();
  }

  function rogueMatchEnd(forfeit = false) {
    if (!match) return;
    const node = match.node;
    const comboCoins = match.coins;
    const out = R.finishMatch(run, node, state, Math.random, forfeit);
    const name = enemyName();
    started = false;
    updateMusic();
    if (out.win) sfx('win');
    else if (out.damage) sfx('hurt');

    const title = out.forfeit ? t('gaveUp') : out.win ? t('matchWin') : out.draw ? t('matchDraw') : t('matchLose');
    const rows = [];
    if (comboCoins) rows.push([t('comboCoins'), `+${comboCoins}`]);
    if (out.coins) rows.push([t('winBonus'), `+${out.coins}`]);
    if (out.damage) rows.push([t('damage'), `−${out.damage}`, 'bad']);
    if (out.heal) rows.push([t('healed'), `+${out.heal}`]);

    let next;
    if (out.dead) next = 'runOver';
    else if (out.victory) next = 'victory';
    else if (out.reward) next = 'reward';
    else if (out.retry) next = 'retry';
    else next = 'map';
    afterMatch = { out, node };

    openModal(`
      <h2>${title}</h2>
      <div class="scores">
        <div class="score ${out.win ? 'win' : ''}"><div class="who">${t('you')}</div><div class="num">${out.me}</div></div>
        <div class="score ${!out.win && !out.draw ? 'win' : ''}"><div class="who">${esc(name)}</div><div class="num">${out.them}</div></div>
      </div>
      <div class="ledger">${rows.map(([k, v, c]) => `<div class="${c || ''}"><span>${k}</span><b>${v}</b></div>`).join('')}</div>
      <div class="hud center">${hudHtml()}</div>
      ${out.retry ? `<p class="note warn">${t('bossRetry')}</p>` : ''}
      <div class="actions">
        <button type="button" class="btn primary" data-act="${next}">${out.retry ? t('retryBoss') : t('continue')}</button>
      </div>
    `);
  }
  let afterMatch = null;

  function showReward(choices) {
    const full = !R.hasSlot(run);
    openModal(`
      <h2>${t('rewardTitle')}</h2>
      <div class="offers">${choices.map((id) => offerHtml(id, `<button type="button" class="btn primary small" data-take="${id}" ${full ? 'disabled' : ''}>${t('take')}</button>`)).join('')}</div>
      ${full ? `<p class="note warn">${t('bagFull')}</p>` : ''}
      ${bagHtml(full)}
      <div class="actions"><button type="button" class="btn ghost" data-act="afterReward">${t('skip')}</button></div>
    `);
    rewardChoices = choices;
    screen = 'reward';
  }
  let rewardChoices = [];

  function offerHtml(id, button) {
    const it = R.ITEMS[id];
    return `<div class="offer">
      ${marble(id)}
      <div class="offer-text"><b>${esc(tx(it.name))}</b><span>${esc(tx(it.desc))}</span></div>
      ${button}
    </div>`;
  }

  function afterReward() {
    if (afterMatch && afterMatch.out.areaClear) showAreaClear();
    else showMap();
  }

  function showAreaClear() {
    const area = R.AREAS[run.area];
    openModal(`
      <h2>${t('areaClear', { name: tx(area.name) })}</h2>
      <div class="hud center">${hudHtml()}</div>
      <div class="actions"><button type="button" class="btn primary" data-act="nextArea">${t('nextArea')}</button></div>
    `);
  }

  function statsHtml() {
    const s = run.stats;
    return `<div class="ledger">
      <div><span>${t('st_wins')}</span><b>${s.wins}/${s.matches}</b></div>
      <div><span>${t('st_coins')}</span><b>${s.coins}</b></div>
      <div><span>${t('st_combo')}</span><b>${s.bestCombo}</b></div>
      <div><span>${t('st_items')}</span><b>${s.items}</b></div>
    </div>`;
  }

  function showRunEnd(won) {
    clearRun();
    openModal(`
      <h2>${won ? t('victory') : t('runOver')}</h2>
      <p class="note">${won ? t('victoryText') : t('runOverText', { name: tx(R.AREAS[run.area].name) })}</p>
      ${statsHtml()}
      <div class="actions">
        <button type="button" class="btn ghost" data-act="menu">${t('menu')}</button>
        <button type="button" class="btn primary" data-act="newRun">${t('newRun')}</button>
      </div>
    `);
  }

  function showShop(node) {
    if (!node.shop) node.shop = R.makeShop(run);
    const sh = node.shop;
    const full = !R.hasSlot(run);
    const price = (o, key, extraOk = true) => o.sold
      ? `<button type="button" class="btn ghost small" disabled>${t('sold')}</button>`
      : `<button type="button" class="btn primary small" data-buy="${key}" ${run.coins >= o.price && extraOk ? '' : 'disabled'}>${icon('coin')}${o.price}</button>`;
    openModal(`
      ${runHead(t('shopTitle'))}
      <div class="offers">
        ${sh.items.map((o, k) => offerHtml(o.id, price(o, k, !full))).join('')}
        <div class="offer">${pxSvg(ICONS.heart, '#e8613a', 'marble')}
          <div class="offer-text"><b>${t('healOffer', { n: sh.heal.amount })}</b></div>
          ${price(sh.heal, 'heal', run.hp < run.maxHp)}</div>
        ${sh.slot.sold && run.slots >= R.MAX_SLOTS ? '' : `<div class="offer">${pxSvg(ICONS.shop, '#c3ad86', 'marble')}
          <div class="offer-text"><b>${t('slotOffer')}</b></div>
          ${price(sh.slot, 'slot')}</div>`}
      </div>
      ${full ? `<p class="note warn">${t('bagFull')}</p>` : ''}
      ${bagHtml(true)}
      <div class="actions"><button type="button" class="btn ghost" data-act="map">${t('leave')}</button></div>
    `);
    shopNode = node;
    screen = 'shop';
  }
  let shopNode = null;

  function showRest() {
    openModal(`
      ${runHead(t('restTitle'))}
      <p class="note">${t('restText')}</p>
      <div class="choices">
        ${R.REST.map((o, k) => `<button type="button" class="btn ghost" data-rest="${k}" ${o.can(run) ? '' : 'disabled'}>${esc(tx(o.label(run)))}</button>`).join('')}
      </div>
    `);
  }

  function showEvent(node) {
    if (!node.event) node.event = R.randomEvent(Math.random);
    const ev = R.EVENTS[node.event];
    openModal(`
      ${runHead(esc(tx(ev.title)))}
      <p class="story">${esc(tx(ev.text))}</p>
      <div class="choices">
        ${ev.choices.map((c, k) => `<button type="button" class="btn ghost" data-choice="${k}" ${c.can(run) ? '' : 'disabled'}>${esc(tx(c.label))}</button>`).join('')}
      </div>
    `);
    eventNode = node;
  }
  let eventNode = null;

  function showMessage(title, text) {
    openModal(`
      ${runHead(esc(title))}
      <p class="story">${esc(text)}</p>
      <div class="actions"><button type="button" class="btn primary" data-act="map">${t('continue')}</button></div>
    `);
  }

  // ---------- Modals ----------
  let screen = '';      // which screen the modal shows ('menu', 'shop', 'reward', …)
  let rogueReturn = null; // roguelite screen to go back to after the menu: { html, cls, screen }
  function openModal(html, cls) {
    screen = '';
    modal.className = 'modal' + (cls ? ' ' + cls : '');
    modal.innerHTML = html;
    overlay.classList.remove('hidden');
    modal.scrollTop = 0;
  }
  function closeModal() { overlay.classList.add('hidden'); }

  function seg(key, options) {
    return '<div class="seg">' + options.map(([val, label]) =>
      `<button type="button" data-set="${key}" data-val="${val}" class="${String(settings[key]) === String(val) ? 'on' : ''}">${label}</button>`
    ).join('') + '</div>';
  }

  function showMenu() {
    // Opened from a roguelite screen (map, shop, reward…)? Remember it so Continue can go back.
    if (modalOpen() && screen !== 'menu' && screen !== 'settings' && mode === 'rogue' && !started && run && !run.done) {
      rogueReturn = { html: modal.innerHTML, cls: modal.className.replace(/^modal\s*/, ''), screen };
    }
    const inGame = started && state && state.phase !== 'over' && mode === settings.mode;
    const isRogue = settings.mode === 'rogue';
    let actions;
    if (isRogue) {
      actions = runInProgress()
        ? `<button type="button" class="btn ghost" data-act="newRun">${t('newRun')}</button>
           <button type="button" class="btn primary" data-act="continueRun">${t('continueRun')}</button>`
        : `<button type="button" class="btn primary" data-act="newRun">${t('startRun')}</button>`;
    } else {
      actions = `${inGame ? `<button type="button" class="btn ghost" data-act="resume">${t('resume')}</button>` : ''}
        <button type="button" class="btn primary" data-act="new">${inGame ? t('newGame') : t('play')}</button>`;
    }
    openModal(`
      <h1 class="logo">Con<span class="egg-g">g</span>kak</h1>
      <p class="tagline">${t('tagline')}</p>
      <div class="field"><label>${t('mode')}</label>${seg('mode', [['ai', t('vsAI')], ['pvp', t('pvp')], ['rogue', t('rogue')]])}</div>
      ${settings.mode === 'ai' ? `<div class="field"><label>${t('level')}</label>${seg('level', [['easy', t('easy')], ['medium', t('medium')], ['hard', t('hard')]])}</div>` : ''}
      <div class="actions">${actions}</div>
      <div class="actions"><button type="button" class="btn ghost" data-act="settings">${t('settings')}</button></div>
      <button type="button" class="link-btn" data-act="rules">${t('rules')}</button>
      ${isRogue ? `<button type="button" class="link-btn" data-act="rogueRules">${t('rogueRules')}</button>` : ''}
    `);
    screen = 'menu';
  }

  function showSettings() {
    openModal(`
      <h2>${t('settings')}</h2>
      <div class="field"><label>${t('language')}</label>${seg('lang', [['ms', 'Bahasa Melayu'], ['en', 'English']])}</div>
      <div class="field"><label>${t('direction')}</label>${seg('dir', [['cw', t('cw')], ['acw', t('acw')]])}</div>
      <div class="field"><label>${t('sound')}</label>${seg('sound', [['true', t('on')], ['false', t('off')]])}</div>
      <div class="field"><label>${t('music')}</label>${seg('music', [['true', t('on')], ['false', t('off')]])}</div>
      <div class="field"><label>${t('previewSetting')}</label>${seg('preview', [['true', t('on')], ['false', t('off')]])}</div>
      <div class="actions"><button type="button" class="btn primary" data-act="menu">${t('back')}</button></div>
    `);
    screen = 'settings';
  }

  function showRules(fromMenu) {
    const side = settings.dir === 'cw' ? t('left') : t('right');
    openModal(`
      <h2>${t('rules')}</h2>
      <ol>${t('rulesList').map((r) => `<li>${r.replace('{side}', side)}</li>`).join('')}</ol>
      <div class="actions"><button type="button" class="btn primary" data-act="${fromMenu ? 'menu' : 'close'}">${fromMenu ? t('back') : t('close')}</button></div>
    `);
    screen = 'menu';
  }

  function showRogueRules(fromMenu) {
    const items = Object.keys(R.ITEMS).map((id) => offerHtml(id, '')).join('');
    openModal(`
      <h2>${t('rogueRules')}</h2>
      <ol>${t('rogueRulesList').map((r) => `<li>${r}</li>`).join('')}</ol>
      <div class="offers compact">${items}</div>
      <div class="actions"><button type="button" class="btn primary" data-act="${fromMenu ? 'menu' : 'close'}">${fromMenu ? t('back') : t('close')}</button></div>
    `);
    screen = 'menu';
  }

  function scoreCards(winner) {
    return '<div class="scores">' + [0, 1].map((p) => `
      <div class="score ${winner === p ? 'win' : ''}">
        <div class="who">${nameOf(p)}</div>
        <div class="num">${C.totalOf(state, p)}</div>
      </div>`).join('') + '</div>';
  }

  function showRoundEnd() {
    const next = C.startNextRound(state);
    const burnt = [0, 1].map((p) => C.sidePits(p).filter((i) => next.burnt[i]).length);
    const lines = [0, 1].filter((p) => burnt[p] > 0)
      .map((p) => `<p class="note warn">${t('burntInfo', { name: nameOf(p), n: burnt[p] })}</p>`).join('');
    const lead = C.totalOf(state, 0) === C.totalOf(state, 1) ? -1 : (C.totalOf(state, 0) > C.totalOf(state, 1) ? 0 : 1);
    openModal(`
      <h2>${t('roundOver', { n: state.round })}</h2>
      ${scoreCards(lead)}
      ${lines || `<p class="note">${t('noBurnt')}</p>`}
      <p class="note">${t('starts', { name: nameOf(next.player) })}</p>
      <div class="actions"><button type="button" class="btn primary" data-act="nextRound">${t('next')}</button></div>
    `);
  }

  function nextRound() {
    state = C.startNextRound(state);
    view = state.holes.slice();
    renderAll();
    closeModal();
    afterMove();
  }

  function showGameOver() {
    const w = state.winner;
    let title;
    if (w === -1) title = t('draw');
    else if (mode === 'ai' && w === 0) title = t('youWin');
    else title = t('wins', { name: nameOf(w) });
    if (w === 0 || mode === 'pvp') sfx('win');
    updateMusic();
    openModal(`
      <h2>${t('gameOver')}</h2>
      <p class="note" style="font-size:18px;color:var(--text)">${title}</p>
      ${scoreCards(w)}
      <div class="actions">
        <button type="button" class="btn ghost" data-act="menu">${t('menu')}</button>
        <button type="button" class="btn primary" data-act="new">${t('again')}</button>
      </div>
    `);
  }

  modal.addEventListener('click', (e) => {
    if (e.target.closest('.egg-g')) { eggTap(); return; }
    const b = e.target.closest('button');
    if (!b || b.disabled) return;
    ac();
    const d = b.dataset;
    if (d.set) {
      const key = d.set;
      let val = d.val;
      if (key === 'sound' || key === 'music' || key === 'preview') val = val === 'true';
      settings[key] = val;
      saveSettings();
      if (key === 'music') updateMusic();
      if (key === 'dir') { board.setDir(settings.dir); hideHand(); }
      if (state) updateUI();
      if (screen === 'settings') showSettings();
      else showMenu();
      return;
    }
    if (d.node) { enterNode(d.node); return; }
    if (d.take) { R.addItem(run, d.take); afterReward(); return; }
    if (d.drop !== undefined) {
      run.items.splice(Number(d.drop), 1);
      if (screen === 'shop') showShop(shopNode);
      else showReward(rewardChoices);
      return;
    }
    if (d.buy !== undefined) {
      const what = /^\d+$/.test(d.buy) ? Number(d.buy) : d.buy;
      if (R.buy(run, shopNode.shop, what)) sfx('coin');
      showShop(shopNode);
      return;
    }
    if (d.rest !== undefined) { R.REST[Number(d.rest)].go(run, Math.random); sfx('magic'); showMap(); return; }
    if (d.choice !== undefined) {
      const ev = R.EVENTS[eventNode.event];
      const msg = ev.choices[Number(d.choice)].go(run, Math.random);
      if (msg) showMessage(tx(ev.title), tx(msg));
      else showMap();
      return;
    }
    switch (d.act) {
      case 'new': newGame(); break;
      case 'resume': closeModal(); updateUI(); break;
      case 'close': closeModal(); break;
      case 'menu': showMenu(); break;
      case 'settings': showSettings(); break;
      case 'rules': showRules(true); break;
      case 'rogueRules': showRogueRules(true); break;
      case 'nextRound': nextRound(); break;
      // roguelite
      case 'newRun': if (runInProgress()) confirmNewRun(); else startRun(); break;
      case 'newRunYes': startRun(); break;
      case 'continueRun': continueRun(); break;
      case 'map': showMap(); break;
      case 'fight': startMatch(); break;
      case 'giveUpYes': giveUp(); break;
      case 'retry': showIntro(afterMatch.node); break;
      case 'reward': showReward(afterMatch.out.reward); break;
      case 'afterReward': afterReward(); break;
      case 'nextArea': R.nextArea(run); showMap(); break;
      case 'runOver': showRunEnd(false); break;
      case 'victory': showRunEnd(true); break;
    }
  });

  // ---------- Easter egg ----------
  // Tap the "g" in the menu's Congkak title 3 times quickly: 2 s of falling hearts, then a message for 2 s.
  let eggTaps = 0, eggTimer = null, eggOn = false;
  function eggTap() {
    clearTimeout(eggTimer);
    eggTimer = setTimeout(() => { eggTaps = 0; }, 1200);
    if (++eggTaps >= 3) { eggTaps = 0; loveRain(); }
  }

  function loveRain() {
    if (eggOn) return;
    eggOn = true;
    ac();
    const layer = document.createElement('div');
    layer.className = 'love-rain';
    layer.setAttribute('aria-hidden', 'true');
    document.body.appendChild(layer);
    const colors = ['#ff5d8f', '#ff8fb1', '#ffc2d4', '#ff3d6e', '#f2c14e'];
    const spawn = setInterval(() => {
      for (let k = 0; k < 2; k++) {
        const h = document.createElement('span');
        h.innerHTML = pxSvg(ICONS.heart, colors[Math.floor(Math.random() * colors.length)], 'heart');
        const size = 14 + Math.floor(Math.random() * 4) * 7;
        h.style.left = (Math.random() * 100).toFixed(1) + 'vw';
        h.style.width = h.style.height = size + 'px';
        h.style.animationDuration = (0.9 + Math.random() * 0.8).toFixed(2) + 's';
        h.addEventListener('animationend', () => h.remove());
        layer.appendChild(h);
      }
    }, 60);
    sfx('magic');
    setTimeout(() => {
      clearInterval(spawn);
      const msg = document.createElement('div');
      msg.className = 'love-msg';
      msg.setAttribute('role', 'status');
      msg.textContent = 'I love u Hannah my sayang';
      layer.removeAttribute('aria-hidden');
      layer.appendChild(msg);
      sfx('win');
      setTimeout(() => {
        layer.classList.add('fade');
        setTimeout(() => { layer.remove(); eggOn = false; }, 300);
      }, 2000);
    }, 2000);
  }

  $('#btnMenu').addEventListener('click', showMenu);
  $('#btnRules').addEventListener('click', () => (rogue() ? showRogueRules(false) : showRules(false)));

  // Browsers only allow audio after the first tap/click, so start the music then
  document.addEventListener('pointerdown', () => updateMusic(), { once: true });
  document.addEventListener('keydown', () => updateMusic(), { once: true });

  // Tap anywhere on the board while sowing to fast-forward
  document.addEventListener('pointerdown', (e) => {
    if (busy && !e.target.closest('.overlay') && !e.target.closest('.topbar') && !e.target.closest('.tray')) skip = true;
  });
  window.addEventListener('resize', hideHand);

  // ---------- Boot ----------
  board = window.PixelBoard.create(boardEl, { onPit, onHover: previewMove });
  board.setDir(settings.dir);

  // kelip-kelip (fireflies) drifting in the night behind the board
  const flies = $('#fireflies');
  for (let k = 0; k < 14; k++) {
    const f = document.createElement('i');
    f.style.left = Math.round(Math.random() * 100) + '%';
    f.style.top = Math.round(Math.random() * 100) + '%';
    f.style.animationDelay = (-Math.random() * 6).toFixed(2) + 's';
    f.style.animationDuration = (4 + Math.random() * 4).toFixed(2) + 's';
    flies.appendChild(f);
  }

  // Read-only peek for automated testing: open the page with ?debug
  if (/[?&]debug\b/.test(location.search)) {
    window.congkakDebug = {
      get state() { return state; }, get run() { return run; }, get busy() { return busy; },
      get flags() { return { aiming: !!aiming, modal: modalOpen(), preview: settings.preview, previewing }; },
    };
  }

  state = C.createGame(0);
  view = state.holes.slice();
  renderAll();
  updateUI();
  showMenu();
})();
