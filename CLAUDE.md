# Congkak: Guli Gila — notes for Claude

Traditional Malaysian congkak as a plain HTML/CSS/JavaScript web game. No build step, no libraries,
no npm packages. Bahasa Melayu (default) and English. Pixel-art look, chiptune sound, works on phones.
Live at https://raziauzaie.github.io/Congkak-Guli-Gila/ (GitHub Pages, repo RaziAuzaie/Congkak-Guli-Gila).

The owner is new to coding and to Git: explain git steps plainly, and give one command per block.

## Run and test

- Run: `powershell -ExecutionPolicy Bypass -File serve.ps1`, then http://localhost:8080
  (`.claude/launch.json` has a `congkak` preview config).
- `node test/selfplay.js` — classic AI-vs-AI: seed conservation, games finish, Hard AI speed.
- `node test/rogue.js [runs] [playerDepth] [playerRandom] [hero]` — simulates whole roguelite runs;
  prints win rates per area, combo coins per match, and checks maps/runs are valid. `hero` is
  none (default) | tuah | mahsuri | badang | all. Use it after any rule, economy or difficulty change.
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
| `js/music.js` | Original 8-bit music: Lagu Asli (menu and map), calm Inang (classic games and normal/elite fights), Joget (roguelite boss fights only). Songs are built from sections (`sections()`); Joget ~54 s, Inang ~56 s per loop. |
| `style.css` | Styles. Colours are CSS variables at the top; notched 4px pixel borders. |

## Rules for changes

- Keep `engine.js` and `rogue.js` free of DOM code so Node tests can load them.
- Every player-facing string goes in **both** `I18N.ms` and `I18N.en` in `game.js`
  (or as `L(ms, en)` pairs in `rogue.js`).
- Pixel art is written as code: 7×7 icon grids (`ICONS`) and per-hero palette grids (`HERO_ART`).
  Original art only; hero portraits are faceless. Each hero's idle loop on hero select (breath +
  sparkle pixels) is set in `HERO_ART[*].idle`. Opponents have the same kind of sprite in `ENEMY_ART`
  (`idle.fade` = flicker; `from` + `flip` = mirrored hero with a new palette, used for Hang Jebat).
  In a roguelite match the opponent's portrait sits left of the board with the hero below it
  (`renderFighters`); on screens narrower than 1260px small copies show in the name bars instead.
- Saved data lives in `localStorage`: `congkak.settings` and `congkak.run` (`run.v = 1`).
  Settings has `musicVol` / `soundVol` (0–100 sliders; `music` / `sound` mean "volume > 0"; old saves
  with an Off switch load as 0). Slider 70 = the music's original loudness, 80 = the original sound effects.
  If the run format changes, keep old saves loading or bump the version.
- Check changes in the browser preview, and run both Node tests before committing.
- Commit messages: short summary line, then a plain-English explanation.

## Game design decisions (and why)

- **Round end:** a round ends as soon as either side's holes are all empty; leftover seeds go to their owner.
- **Roguelite matches are one round, and the player always moves first.** In a one-round match the
  first mover wins ~97% between equal players, so difficulty comes from opponent strength and rules.
- **Move preview**: shows only where the last seed of the *first* sowing lands and what happens there.
  Showing the whole relay chain was too easy — do not bring it back. Mouse/keyboard: on hover or focus.
  Touch: the first tap on a hole previews it (with a "tap the hole again to go" hint), a second tap on the
  same hole plays it. Not in 2-player mode (it would show the other player your move), and with the
  Move preview setting off a single tap plays.
- **Map:** clicking a node commits to it. Fights start straight away (toast names the opponent).
  Mysteries pick and save their event on open, and Continue resumes an unanswered one.
- **Saving:** the run saves whenever the map is shown (and when a mystery opens). Mid-match is not saved.
- **Damage on a loss:** `min(12, 3 + floor(margin / 5))`; 40 spirit to start. Giving up = a loss with all
  board seeds going to the opponent.
- **Coins:** relays pay on every 5th combo link, captures `1 + n/8`, extra turns 1 (+1 from combo 10).
  Win bonus `8 + diff/4` (+10 elite, +25 boss). Marbles cost 6–22.
- **Balance targets** (from `test/rogue.js`): strong bot (depth 3) wins ~88% of runs, average (depth 2)
  ~18%, weak (depth 1) ~0% but reaches area 2. Measured 2026-10-18 (200 runs, depth 3 / depth 2):
  no hero 73% / 20%, Tuah 81% / 36%, Mahsuri 90% / 36%, Badang 85% / 30% (2026-10-19, from-hand rule). Heroes should stay roughly level.
  **2026-10-22:** after Bold was removed, the owner found Hang Jebat too hard in real play and set every
  opponent's random-move chance by hand (Kampung normals 50%, Belalang 40%, Kancil 35%; Hutan normals 45%,
  Bota 35%, Jebat 35%; Istana normals 35%, Temenggung 30%, Ledang 27%), then lowered every look-ahead
  depth by 1 (minimum 1): Kampung 1 / elite 2 / Kancil 1; Hutan 1 / elite 3 / Jebat 2; Istana 2 / elite 4 /
  Ledang 3. Sim run wins are now far above the old targets (depth 2 player: 100% for every hero; depth 1:
  no hero 50%, Tuah 98%, Mahsuri 66%, Badang 87%). The owner's own play is the guide now; the sim bots
  play differently from people.
- **Hero passives** (on in roguelite only; classic passes no `powers`):
  - Keris Taming Sari (Tuah, engine): every 2nd combo hit in his turn steals 1 seed from the opponent's
    rumah, max 3 per turn. Combo hits = relay pick-ups, captures, extra turns; extra turns keep the combo.
  - Batu Badang (replaced Kekuatan Badang on 2026-10-23 at the owner's request): once per match, on his
    turn before sowing, the player taps the Batu Badang card in the tray, then an enemy hole. A rock
    (`fx.rock`, `C.throwRock`) sits there for the enemy's next 2 turns: the enemy can't pick that hole,
    everyone's sowing skips it (Badang's too, the owner asked for this), nobody can capture from it and
    marbles can't target it (`nextPos` / `legalMoves` / capture / `itemTargets`, so the AI and
    `firstLanding` know; the preview treats it as uncapturable). Drawn in pixel.js (`ROCK`, falls in with a bounce, gold pips
    = turns left). Sim (depth 1 player): ~50% of runs, about the no-hero level; the sim bot only throws
    it on turn 1 at the fullest hole.
  - Darah Putih (Mahsuri, `finishMatch`): the first time spirit hits 0 she survives with 15, once per run
    (`run.revived`).
- **Opponent modifiers:** Licik (Cunning), Kaya (Rich), Sekatan (Blockade), Main Tipu (Pak Belalang,
  area-1 elite, with Rich) and Taming Sari (Hang Jebat, boss 2).
  Main Tipu (engine, `fx.tipu`): every seed he drops into his own rumah brings 1–2 extra seeds from
  nowhere; his hand doesn't go down for them. The amount is 1 + (his rumah count % 2), so it looks random
  but the AI search stays repeatable. About +21 seeds per match in tests; whole-run sim numbers barely moved. Bold (extra turn after every capture) was removed at the owner's request on 2026-10-22.
  Taming Sari (engine, `fx.keris`): a keris floats over one of the player's holes (random at the start);
  each time the player's turn ends it stabs that hole, every seed there goes to Jebat's rumah, and it
  moves to the next playable hole. Drawn in pixel.js (`KERIS`, 2x size, see-through "ghost" so the holes
  under it stay readable; it turns solid, rises and thrusts in when it stabs).
  Without Bold, runs got much easier (depth 2, no hero: 20% → 66%); Laksamana and Puteri Gunung Ledang
  still need a replacement modifier to bring the difficulty back.
- **Title:** "Congkak: Guli Gila" (browser tab; the menu logo shows "Congkak" with "Guli Gila" on a
  second line). Seeds are drawn as glass guli with coloured swirls (`SEED_SPRITE` / `SWIRLS` in pixel.js).
- **Easter egg:** tapping the "g" in "Congkak" in the menu title 3 times shows heart rain and
  "I love u Hannah my sayang". Keep it hidden (no pointer cursor) and keep it working on phones
  (taps count on `pointerdown`).

## Current state and next steps

- Hero passives are active (see above). Still display-only: `R.HEROES[*].stats` (every run uses the
  default START stats) and Mahsuri's second power, Sumpahan Mahsuri.
- Planned (agreed with the owner, not built):
  - Per-hero stats; Sumpahan Mahsuri (after a loss, the next opponent starts with their hole nearest
    their rumah burnt).
  - Opponent signature powers (e.g. Toyol steals a seed from a random player hole each time his
    sowing passes the player's rumah; Pawang freezes a hole each turn; Bunian hides counts).
  - Azimat (permanent charms) sold in shops, priced by tier.
  - Tutorial.
