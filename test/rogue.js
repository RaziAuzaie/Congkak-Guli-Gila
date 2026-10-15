// Roguelite simulation: node test/rogue.js [runs] [playerDepth] [playerRandom]
// Plays whole runs with an AI standing in for the player. Checks that maps are
// well formed and runs always finish, and prints balance numbers.
const C = require('../js/engine.js');
const AI = require('../js/ai.js');
const R = require('../js/rogue.js');

const RUNS = Number(process.argv[2] || 60);
const PLAYER = { depth: Number(process.argv[3] || 3), random: Number(process.argv[4] || 0.15) };
let errors = 0;
const fail = (msg) => { errors++; if (errors < 10) console.error(msg); };

function checkMap(run) {
  const rows = run.map.rows;
  const ids = new Set(rows.flat().map((n) => n.id));
  for (let r = 0; r < rows.length - 1; r++) {
    for (const n of rows[r]) {
      if (!n.next.length) fail(`node ${n.id} has no exit`);
      for (const id of n.next) if (!ids.has(id)) fail(`node ${n.id} points at missing ${id}`);
    }
    if (r > 0) for (const n of rows[r]) {
      if (!rows[r - 1].some((m) => m.next.includes(n.id))) fail(`node ${n.id} unreachable`);
    }
  }
}

const perArea = [0, 1, 2].map(() => ({ matches: 0, wins: 0, coinsCombo: 0, bossTries: 0, bossWins: 0 }));
let deaths = [0, 0, 0], victories = 0, totalNodes = 0;

function playMatch(run, node, rnd) {
  const m = R.makeMatch(run, node, rnd);
  let s = C.createGame(m.first, m.opts);
  let combo = 0, comboCoins = 0, guard = 0;
  while (s.phase === 'play') {
    if (++guard > 3000) { fail('match did not finish'); break; }
    if (s.player === 0) {
      // sometimes use a marble before moving
      if (run.items.length && rnd() < 0.35) {
        const id = run.items[0];
        const targets = R.itemTargets(s, 0, id);
        if (!R.ITEMS[id].target || targets.length) {
          run.items.shift();
          run.stats.items++;
          s = R.useItem(s, 0, id, targets[Math.floor(rnd() * targets.length)]).state;
          if (s.phase !== 'play') break;
        }
      }
      const res = C.playMove(s, AI.chooseMove(s, PLAYER), true);
      let first = true;
      for (const ev of res.events) {
        let kind = null, n = 0;
        if (ev.t === 'pick') { if (!first) kind = 'relay'; first = false; }
        if (ev.t === 'capture') { kind = 'capture'; n = ev.n; }
        if (ev.t === 'extra') kind = 'extra';
        if (kind) { combo++; const v = R.hitValue(kind, combo, n); comboCoins += v; R.earn(run, v); }
      }
      if (res.result === 'end') combo = 0;
      s = res.state;
    } else {
      s = C.playMove(s, AI.chooseMove(s, m.ai), false).state;
    }
  }
  const out = R.finishMatch(run, node, s, rnd);
  const a = perArea[run.area];
  a.matches++; a.coinsCombo += comboCoins;
  if (out.win) a.wins++;
  if (node.type === 'boss') { a.bossTries++; if (out.win) a.bossWins++; }
  if (out.reward && R.hasSlot(run)) R.addItem(run, out.reward[0]);
  return out;
}

for (let k = 0; k < RUNS; k++) {
  const rnd = Math.random;
  const run = R.newRun(rnd);
  checkMap(run);
  let steps = 0;
  while (!run.done) {
    if (++steps > 200) { fail('run did not finish'); break; }
    const node = R.available(run)[Math.floor(rnd() * R.available(run).length)];
    R.visit(run, node);
    totalNodes++;
    if (node.type === 'match' || node.type === 'elite') playMatch(run, node, rnd);
    else if (node.type === 'boss') {
      let out;
      do { out = playMatch(run, node, rnd); } while (out.retry);
      if (out.areaClear) { R.nextArea(run, rnd); checkMap(run); }
    } else if (node.type === 'shop') {
      const shop = R.makeShop(run, rnd);
      if (run.hp < run.maxHp * 0.5) R.buy(run, shop, 'heal');
      for (let i = 0; i < shop.items.length; i++) R.buy(run, shop, i);
    } else if (node.type === 'rest') {
      const opt = R.REST.find((o) => o.can(run));
      opt.go(run, rnd);
    } else if (node.type === 'event') {
      const ev = R.EVENTS[R.randomEvent(rnd)];
      const ch = ev.choices.find((c) => c.can(run));
      ch.go(run, rnd);
    }
    if (run.hp > run.maxHp) fail('hp above max');
    if (run.items.length > run.slots) fail('too many items');
    if (run.coins < 0) fail('negative coins');
  }
  if (run.won) victories++; else deaths[run.area]++;
}

console.log(`player AI depth ${PLAYER.depth}, random ${PLAYER.random}, ${RUNS} runs`);
perArea.forEach((a, i) => {
  if (!a.matches) return;
  console.log(`area ${i + 1}: win ${(100 * a.wins / a.matches).toFixed(0)}% of ${a.matches} matches, ` +
    `combo coins/match ${(a.coinsCombo / a.matches).toFixed(1)}, boss ${a.bossWins}/${a.bossTries}`);
});
console.log(`deaths by area ${deaths.join(' / ')}, victories ${victories}/${RUNS}, nodes/run ${(totalNodes / RUNS).toFixed(1)}`);
console.log(errors ? `FAILED with ${errors} errors` : 'ALL OK');
process.exit(errors ? 1 : 0);
