/*
 * Congkak AI — minimax with alpha-beta pruning.
 * Extra turns are handled naturally: the side to move is read from the state.
 */
(function (root) {
  'use strict';

  const C = root.Congkak || require('./engine.js');

  const LEVELS = {
    easy:   { depth: 1, random: 0.6 },
    medium: { depth: 3, random: 0.15 },
    hard:   { depth: 8, random: 0 },
  };

  function evaluate(s, me) {
    const opp = 1 - me;
    const storeDiff = s.holes[C.STORE[me]] - s.holes[C.STORE[opp]];
    if (s.phase !== 'play') {
      return storeDiff * 10 + (s.phase === 'over' ? Math.sign(storeDiff) * 10000 : 0);
    }
    const sideDiff = C.sideTotal(s, me) - C.sideTotal(s, opp);
    return storeDiff * 10 + sideDiff * 2;
  }

  function search(s, depth, alpha, beta, me) {
    if (depth === 0 || s.phase !== 'play') return evaluate(s, me);
    const moves = C.legalMoves(s);
    const maximizing = s.player === me;
    let best = maximizing ? -Infinity : Infinity;
    for (const m of moves) {
      const v = search(C.playMove(s, m, false).state, depth - 1, alpha, beta, me);
      if (maximizing) {
        if (v > best) best = v;
        if (best > alpha) alpha = best;
      } else {
        if (v < best) best = v;
        if (best < beta) beta = best;
      }
      if (alpha >= beta) break;
    }
    return best;
  }

  /** level: 'easy' | 'medium' | 'hard', or a custom { depth, random } */
  function chooseMove(s, level = 'medium') {
    const moves = C.legalMoves(s);
    if (moves.length <= 1) return moves[0];
    const cfg = typeof level === 'object' ? level : LEVELS[level] || LEVELS.medium;
    if (Math.random() < cfg.random) return moves[Math.floor(Math.random() * moves.length)];

    const me = s.player;
    let best = -Infinity;
    let bestMoves = [];
    for (const m of moves) {
      const v = search(C.playMove(s, m, false).state, cfg.depth - 1, -Infinity, Infinity, me);
      if (v > best) {
        best = v;
        bestMoves = [m];
      } else if (v === best) {
        bestMoves.push(m);
      }
    }
    return bestMoves[Math.floor(Math.random() * bestMoves.length)];
  }

  const api = { chooseMove, evaluate, LEVELS };
  root.CongkakAI = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
