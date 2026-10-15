// Self-play sanity test: node test/selfplay.js
// Checks seed conservation, that games terminate, and AI speed.
const C = require('../js/engine.js');
const AI = require('../js/ai.js');

const TOTAL = C.PITS * C.START_SEEDS * 2;
let games = 0, rounds = 0, moves = 0, errors = 0;
const wins = { 0: 0, 1: 0, '-1': 0 };

function check(s, where) {
  const sum = s.holes.reduce((a, b) => a + b, 0);
  if (sum !== TOTAL) { errors++; console.error('Seed count', sum, 'at', where); }
}

function playGame(levels) {
  let s = C.createGame(Math.random() < 0.5 ? 0 : 1);
  let n = 0;
  while (s.phase !== 'over') {
    if (s.phase === 'roundEnd') { s = C.startNextRound(s); rounds++; check(s, 'refill'); continue; }
    const m = AI.chooseMove(s, levels[s.player]);
    s = C.playMove(s, m, true).state;
    check(s, 'move');
    if (++n > 20000) { console.error('Game did not finish'); errors++; break; }
  }
  moves += n;
  wins[s.winner]++;
}

for (let i = 0; i < 200; i++) { playGame(['easy', 'medium']); games++; }
console.log(`easy(P0) vs medium(P1): ${games} games, ${rounds} rounds, ${moves} moves, wins`, wins);

// Hard AI timing on the opening position
const t0 = Date.now();
for (let i = 0; i < 5; i++) AI.chooseMove(C.createGame(), 'hard');
console.log('hard AI avg ms/move (opening):', ((Date.now() - t0) / 5).toFixed(0));

for (const k in wins) wins[k] = 0;
for (let i = 0; i < 20; i++) playGame(['medium', 'hard']);
console.log('medium(P0) vs hard(P1) over 20 games, wins', wins);

console.log(errors ? `FAILED with ${errors} errors` : 'ALL OK');
process.exit(errors ? 1 : 0);
