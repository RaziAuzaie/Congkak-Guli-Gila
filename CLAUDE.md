# Congkak — notes for Claude

Traditional Malaysian congkak as a plain HTML/CSS/JavaScript web game. No build step, no libraries,
no npm packages. Bahasa Melayu (default) and English. Pixel-art look, chiptune sound, works on phones.
Live at https://raziauzaie.github.io/Congkak-Guli-Gila/ (GitHub Pages, repo RaziAuzaie/Congkak-Guli-Gila).

The owner is new to coding and to Git: explain git steps plainly, and give one command per block.

## Run and test

- Run: `powershell -ExecutionPolicy Bypass -File serve.ps1`, then http://localhost:8080
  (`.claude/launch.json` has a `congkak` preview config).
- `node test/selfplay.js` — classic AI-vs-AI: seed conservation, games finish, Hard AI speed.
- `node test/rogue.js [runs] [playerDepth] [playerRandom]` — simulates whole roguelite runs; prints
  win rates per area, combo coins per match, and checks maps/runs are valid. Use it after any rule,
  economy or difficulty change.
- Browser checks: open `/?debug` to get read-only `window.congkakDebug` (`state`, `run`, `busy`,
  `flags`). Drive the UI by clicking `#modal [data-act=…]` buttons and canvas holes.
- Phones cache old JS: after a push the user may need to refresh.

## Files

| File | Role |
|---|---|
| `js/engine.js` | Rules engine. Pure logic, no DOM. Board, sowing, relay, tembak, rounds, marble effects (`state.fx`), `firstLanding`. |
| `js/ai.js` | Minimax + alpha-beta. Levels easy/medium/hard or a custom `{ depth, random }`. |
| `js/rogue.js` | Roguelite run logic. Pure, no DOM. Heroes, marbles (ITEMS), opponents, areas, map generation, shop, rest, events, coins, damage. Runs are plain JSON. |
| `js/game.js` | All UI: menus, BM/EN text (`I18N`), animation of engine events, sound, roguelite screens, hero portraits, easter egg. |
| `js/pixel.js` | Canvas board renderer and input (hover, keyboard, targeting, preview rings). |
| `js/music.js` | Original 8-bit Lagu Asli (menu) and Joget (in play) music. |
| `style.css` | Styles. Colours are CSS variables at the top; notched 4px pixel borders. |

## Rules for changes

- Keep `engine.js` and `rogue.js` free of DOM code so Node tests can load them.
- Every player-facing string goes in **both** `I18N.ms` and `I18N.en` in `game.js`
  (or as `L(ms, en)` pairs in `rogue.js`).
- Pixel art is written as code: 7×7 icon grids (`ICONS`) and per-hero palette grids (`HERO_ART`).
  Original art only; hero portraits are faceless.
- Saved data lives in `localStorage`: `congkak.settings` and `congkak.run` (`run.v = 1`).
  If the run format changes, keep old saves loading or bump the version.
- Check changes in the browser preview, and run both Node tests before committing.
- Commit messages: short summary line, then a plain-English explanation.

## Game design decisions (and why)

- **Round end:** a round ends as soon as either side's holes are all empty; leftover seeds go to their owner.
- **Roguelite matches are one round, and the player always moves first.** In a one-round match the
  first mover wins ~97% between equal players, so difficulty comes from opponent strength and rules.
- **Move preview** (hover, mouse/keyboard only): shows only where the last seed of the *first* sowing
  lands and what happens there. Showing the whole relay chain was too easy — do not bring it back.
- **Map:** clicking a node commits to it. Fights start straight away (toast names the opponent).
  Mysteries pick and save their event on open, and Continue resumes an unanswered one.
- **Saving:** the run saves whenever the map is shown (and when a mystery opens). Mid-match is not saved.
- **Damage on a loss:** `min(12, 3 + floor(margin / 5))`; 40 spirit to start. Giving up = a loss with all
  board seeds going to the opponent.
- **Coins:** relays pay on every 5th combo link, captures `1 + n/8`, extra turns 1 (+1 from combo 10).
  Win bonus `8 + diff/4` (+10 elite, +25 boss). Marbles cost 6–22.
- **Balance targets** (from `test/rogue.js`): strong bot (depth 3) wins ~88% of runs, average (depth 2)
  ~18%, weak (depth 1) ~0% but reaches area 2.
- **Easter egg:** tapping the "g" in the menu title 3 times shows heart rain and
  "I love u Hannah my sayang". Keep it hidden (no pointer cursor) and keep it working on phones
  (taps count on `pointerdown`).

## Current state and next steps

- Hero select (Hang Tuah, Mahsuri, Badang) is in, but **hero powers are not active yet**:
  `R.HEROES[*].stats` and powers are display-only; every run uses the default START stats.
- Planned (agreed with the owner, not built):
  - Hero powers: Keris Taming Sari (every 2nd combo hit steals 1 seed from the opponent's rumah,
    max 3/turn), Darah Putih + Sumpahan Mahsuri, Kekuatan Badang (2 seeds when passing own rumah).
  - Opponent signature powers (e.g. Toyol steals a seed from a random player hole each time his
    sowing passes the player's rumah; Pawang freezes a hole each turn; Bunian hides counts).
  - Azimat (permanent charms) sold in shops, priced by tier.
  - Idle animations on hero cards; long-press move preview on phones; tutorial.
- Known limitation: on touch screens there is no move preview (no hover).
