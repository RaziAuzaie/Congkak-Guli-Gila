# Congkak

Traditional Malaysian congkak as a plain HTML/JavaScript web game (no build step, no libraries).
Bahasa Melayu and English.

## Modes

- **Classic** — vs the computer (Easy / Medium / Hard) or 2 players on one device. Multi-round, with hangus (burnt) holes.
- **Roguelite** — a run across 3 areas (Kampung, Hutan Rimba, Istana). Each area is a branching map of
  matches, elite matches, shops, rest stops and mystery events, ending in a boss. Every match is one round.
  Combos (relays, captures, extra turns) earn coins; coins buy one-use power marbles (guli sakti).
  Losing costs spirit (semangat); run out and the run ends. The run saves automatically on the map.

Hovering one of your holes previews where the last seed of its first sowing lands (Settings → Move preview).

## Run it

```
powershell -ExecutionPolicy Bypass -File serve.ps1
```

Then open http://localhost:8080. (Opening `index.html` directly also works in most browsers.)

## Files

| File | What it does |
|---|---|
| `js/engine.js` | Rules engine — pure logic, no DOM. Sowing, relay, tembak, rumah, hangus, rounds, marble effects. |
| `js/ai.js` | Computer opponent — minimax + alpha-beta. Easy / Medium / Hard, or a custom search depth. |
| `js/rogue.js` | Roguelite run logic — no DOM. Maps, opponents, marbles, coins, shop, events. |
| `js/game.js` | UI: menus, animation, sounds, roguelite screens, BM/EN text. |
| `js/pixel.js` | Pixel-art canvas board renderer and input. |
| `js/music.js` | 8-bit Lagu Asli and Joget music (Web Audio). |
| `style.css` | Look & feel (wooden board, modals, map, shop). |
| `test/selfplay.js` | Classic AI-vs-AI sanity test (`node test/selfplay.js`, needs Node.js). |
| `test/rogue.js` | Roguelite run simulation and balance numbers (`node test/rogue.js [runs] [depth] [random]`). |

Add `?debug` to the URL to expose a read-only `window.congkakDebug` for automated testing.

## Board indices

```
 P1 rumah  [15]   top row    8 .. 14
 P0 rumah  [7]    bottom row 0 .. 6
 Sowing order: 0 → 6 → 7 → 8 → 14 → 15 → 0 (skip opponent's rumah and hangus holes)
```

A round ends as soon as one side's holes are all empty; remaining seeds go to their owner's rumah.
