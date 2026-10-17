# Congkak

Traditional Malaysian congkak as a plain HTML/JavaScript web game (no build step, no libraries).
Bahasa Melayu and English. Pixel-art board, chiptune sound and original 8-bit music; works on phones.

**Play it:** https://raziauzaie.github.io/Congkak-Guli-Gila/

## Modes

- **Classic** — vs the computer (Easy / Medium / Hard) or 2 players on one device. Multi-round, with hangus (burnt) holes.
- **Roguelite** — pick a hero (Hang Tuah, Mahsuri or Badang), then cross 3 areas (Kampung, Hutan Rimba, Istana).
  Each area is a branching map of matches, elite matches, shops, rest stops and mystery events, ending in a boss.
  Every match is one round, and you always move first. Combos (relays, captures, extra turns) earn coins;
  coins buy one-use power marbles (guli sakti). Losing costs spirit (semangat); run out and the run ends.
  The run saves automatically whenever the map is shown.
  Hero powers are shown on the hero cards but are not active yet.

Hovering one of your holes (mouse or keyboard) previews where the last seed of its first sowing lands
(Settings → Move preview). There is no preview on touch screens yet.

## Run it

```
powershell -ExecutionPolicy Bypass -File serve.ps1
```

Then open http://localhost:8080. (Opening `index.html` directly also works in most browsers.)

## Test it

Needs Node.js.

```
node test/selfplay.js
```

Classic AI-vs-AI games: checks no seeds go missing, every game finishes, and how fast the Hard level is.

```
node test/rogue.js [runs] [playerDepth] [playerRandom]
```

Simulates whole roguelite runs with a computer player and prints win rates per area, coins per match,
and checks that maps and runs are valid. Run it after any rule, economy or difficulty change.

Add `?debug` to the URL to expose a read-only `window.congkakDebug` for automated browser testing.

## Files

| File | What it does |
|---|---|
| `js/engine.js` | Rules engine — pure logic, no DOM. Sowing, relay, tembak, rumah, hangus, rounds, marble effects. |
| `js/ai.js` | Computer opponent — minimax + alpha-beta. Easy / Medium / Hard, or a custom search depth. |
| `js/rogue.js` | Roguelite run logic — no DOM. Heroes, maps, opponents, marbles, coins, shop, rest, events. |
| `js/game.js` | UI: menus, animation, sounds, roguelite screens, hero portraits, BM/EN text. |
| `js/pixel.js` | Pixel-art canvas board renderer and input (hover, keyboard, marble targeting, preview). |
| `js/music.js` | 8-bit Lagu Asli and Joget music (Web Audio). |
| `style.css` | Look & feel (wooden board, modals, map, shop, hero cards). |
| `test/selfplay.js` | Classic AI-vs-AI sanity test. |
| `test/rogue.js` | Roguelite run simulation and balance numbers. |
| `CLAUDE.md` | Notes for AI coding sessions: design decisions, rules for changes, what's planned. |

## Board indices

```
 P1 rumah  [15]   top row    8 .. 14
 P0 rumah  [7]    bottom row 0 .. 6
 Sowing order: 0 → 6 → 7 → 8 → 14 → 15 → 0 (skip opponent's rumah and hangus holes)
```

A round ends as soon as one side's holes are all empty; remaining seeds go to their owner's rumah.

## Saved data

Stored in the browser's `localStorage`: `congkak.settings` (language, sound, level, etc.) and
`congkak.run` (the current roguelite run). A match in progress is not saved.
