# Task list: More fun in the roguelite

See `tasks/plan.md` for the reasoning, dependency graph, risks and open questions.

Standard checks for every task (the "Definition of Done" from `CLAUDE.md`):
- `node test/selfplay.js` prints ALL OK
- `node test/rogue.js 200 3` prints ALL OK (plus the hero argument once Task 2 lands)
- Checked in the browser preview (`/?debug` for `window.congkakDebug`), no console errors
- Every new player-facing string in both `I18N.ms` and `I18N.en`
- `engine.js` and `rogue.js` still have no DOM code

---

## Phase 1: Foundation

## Task 1: Engine counts combo hits

**Description:** Move combo counting into the engine so hero powers can use it. `playMove` keeps a
per-player counter in `state.fx.combo` (relay pick-ups after the first pick, captures, extra turns),
resets it when the turn passes, and emits `{ t: 'hit', kind, combo, n }` events. `game.js` and
`test/rogue.js` stop counting on their own and read these events. No change in what the player sees.

**Acceptance criteria:**
- [ ] `fx.combo` exists, survives `clone`, and resets to 0 when the turn passes to the other player
- [ ] `game.js` combo pop-up and combo coins are driven by `hit` events; same numbers as before
- [ ] `test/rogue.js` uses `hit` events; no duplicate counting code left

**Verification:**
- [ ] Coins/match from `node test/rogue.js 200 3` within normal noise of before (~35 / 29 / 25)
- [ ] Hard AI ms/move in selfplay not noticeably slower
- [ ] Browser: play a roguelite match, COMBO xN pop-up and end-of-match combo coins still show

**Dependencies:** None
**Files likely touched:** `js/engine.js`, `js/game.js`, `test/rogue.js`
**Estimated scope:** Medium

## Task 2: Heroes start with their own stats; sim takes a hero argument

**Description:** `newRun` uses the chosen hero's `stats` (spirit, coins, bag slots, starting marbles)
instead of `START`. The shop's slot price still counts from the hero's starting slots. `test/rogue.js`
accepts a 4th argument `hero` (`tuah` | `mahsuri` | `badang` | `all`) and prints results per hero.

**Acceptance criteria:**
- [ ] Mahsuri starts with 35 spirit and 25 coins, Badang with 50 spirit, 10 coins, 2 slots, 1 marble
- [ ] Old saves with no `hero` still load and play with default stats
- [ ] `node test/rogue.js 200 3 0.15 all` prints a block per hero

**Verification:**
- [ ] Tests pass; Hang Tuah numbers match the current baseline (his stats are the defaults)
- [ ] Browser: start a run as each hero, top bar shows the right spirit, coins and bag size

**Dependencies:** None
**Files likely touched:** `js/rogue.js`, `test/rogue.js`
**Estimated scope:** Small

### Checkpoint A (after Tasks 1–2)
- [ ] Both tests pass, numbers recorded as the new baseline
- [ ] Owner reviews before hero powers start

---

## Phase 2: Hero powers

## Task 3: Badang — Kekuatan Badang

**Description:** When Badang's sowing passes his own rumah he drops 2 seeds there instead of 1
(assumed: the extra seed is a bonus, not from his hand — see open question 1). Switched on with
`createGame` opts `powers: ['badang', null]`. The UI shows a small "+1" on the rumah and a sound.

**Acceptance criteria:**
- [ ] Engine adds the bonus only for the player who has the power, only on their own rumah
- [ ] Classic mode and other heroes behave exactly as before
- [ ] Move preview (`firstLanding`) still points at the right hole

**Verification:**
- [ ] Selfplay ALL OK (classic seed conservation untouched)
- [ ] `node test/rogue.js 200 3 0.15 badang` runs; note win rate
- [ ] Browser: play as Badang, see the +1 when passing the rumah, store count matches

**Dependencies:** Task 2
**Files likely touched:** `js/engine.js`, `js/rogue.js`, `js/game.js`
**Estimated scope:** Small

## Task 4: Hang Tuah — Keris Taming Sari

**Description:** Every 2nd combo hit in Tuah's turn steals 1 seed from the opponent's rumah into his
own, at most 3 per turn. Uses `fx.combo` from Task 1. Emits a `steal` event; UI animates a seed
flying across with a keris toast.

**Acceptance criteria:**
- [ ] Steals on combo 2, 4, 6 only, max 3 per turn, never takes from an empty rumah
- [ ] Count resets every turn; extra turns continue the same combo (as the combo pop-up does)
- [ ] Toast text in BM and EN

**Verification:**
- [ ] `node test/rogue.js 200 3 0.15 tuah` runs; note win rate
- [ ] Browser: a relay chain as Tuah shows steals at the right combo numbers

**Dependencies:** Task 1, Task 2
**Files likely touched:** `js/engine.js`, `js/rogue.js`, `js/game.js`
**Estimated scope:** Medium

## Task 5: Mahsuri — Darah Putih and Sumpahan Mahsuri

**Description:** Both live in `rogue.js`. Darah Putih: the first time her spirit would reach 0 she
survives with 15 (once per run, saved as `run.revived`). Sumpahan: after she loses a match, her next
opponent starts with the hole nearest their rumah burnt (`run.curse`, cleared after that match).

**Acceptance criteria:**
- [ ] Revive happens once; a second death ends the run
- [ ] Curse applies to the very next match only, including a boss retry
- [ ] Match result screen says when the revive or curse triggers (BM + EN)
- [ ] Old saves without these fields load fine

**Verification:**
- [ ] `node test/rogue.js 200 3 0.15 mahsuri` runs; note win rate
- [ ] Browser: lose a match as Mahsuri, next opponent shows a burnt hole

**Dependencies:** Task 2
**Files likely touched:** `js/rogue.js`, `js/game.js`, `test/rogue.js`
**Estimated scope:** Medium

## Task 6: Hero balance pass

**Description:** Tune each power's numbers (not its rules) so every hero lands near the targets in
`CLAUDE.md`. Remove the "Hero powers are coming soon" note from hero select. Update CLAUDE.md
("powers are not active yet" goes away), README and the design doc's Heroes section.

**Acceptance criteria:**
- [ ] Per hero at depth 3: run win rate within about ±8 points of 88%; depth 2 within ±8 of 18%
- [ ] No hero is strictly best on every line of the sim output
- [ ] Docs no longer say powers are inactive

**Verification:**
- [ ] `node test/rogue.js 300 3 0.15 all` and `node test/rogue.js 300 2 0.2 all`
- [ ] Browser: hero select has no "coming soon" note

**Dependencies:** Tasks 3, 4, 5
**Files likely touched:** `js/rogue.js`, `js/game.js`, `README.md`, `CLAUDE.md`
**Estimated scope:** Small

### Checkpoint B (after Tasks 3–6)
- [ ] All tests pass, balance on target per hero
- [ ] Owner plays one run with each hero and agrees they feel different

---

## Phase 3: Opponent signature powers

## Task 7: Opponent power hook + Tok Pawang freezes a hole

**Description:** Enemies get an optional `power` in `ENEMIES`, passed as the second entry of
`opts.powers`. First power: Tok Pawang freezes one of your holes at the start of each of his turns
(the fullest one, so the engine stays deterministic for the AI search), reusing `fx.frozen`.
The opponent's power is shown on the fight toast and in the match header.

**Acceptance criteria:**
- [ ] Frozen hole glows as frozen (existing Ice Marble look) and can't be picked for one turn
- [ ] Never freezes your last playable hole
- [ ] Power description in BM and EN

**Verification:**
- [ ] Sim runs; area 2 win rate still sensible
- [ ] Browser: fight Tok Pawang, a hole freezes each of his turns

**Dependencies:** None (can start after Checkpoint A)
**Files likely touched:** `js/engine.js`, `js/rogue.js`, `js/game.js`
**Estimated scope:** Medium

## Task 8: Toyol steals seeds

**Description:** New Hutan Rimba opponent Toyol (see open question 2). Each time his sowing skips
your rumah he takes 1 seed from your fullest hole into his rumah. Needs a small faceless pixel
portrait or icon for the map toast if enemies get art later; text only for now.

**Acceptance criteria:**
- [ ] Steal happens on every skip of your rumah, deterministic target, `steal` event animated
- [ ] Toyol appears in the area 2 pool

**Verification:**
- [ ] Sim runs; area 2 numbers still on target
- [ ] Browser: fight Toyol, see seeds taken when he passes your rumah

**Dependencies:** Task 7
**Files likely touched:** `js/engine.js`, `js/rogue.js`, `js/game.js`
**Estimated scope:** Small

## Task 9: Orang Bunian hides seed counts

**Description:** UI-only power: against Orang Bunian, the counts in some of his holes show "?"
(for example, the holes he picked last turn). The board renderer and the move preview both respect it.

**Acceptance criteria:**
- [ ] Hidden holes draw "?" instead of a number; seeds are still drawn
- [ ] Move preview text doesn't reveal a hidden count
- [ ] No engine change

**Verification:**
- [ ] Browser: fight Orang Bunian on mouse and on phone width

**Dependencies:** Task 7
**Files likely touched:** `js/pixel.js`, `js/game.js`, `js/rogue.js`
**Estimated scope:** Small

### Checkpoint C (after Tasks 7–9)
- [ ] Tests pass, area 2 balance on target
- [ ] Owner reviews how the three opponents feel

---

## Phase 4: Azimat (permanent charms)

## Task 10: Azimat foundation

**Description:** Add `AZIMAT` in `rogue.js` (name, desc, tier, price), `run.charms` (assumed 2 slots,
see open question 3), a charm offer in the shop, and a charm row in the bag. Start with 3 simple
charms, e.g. +2 coins per win, first capture each match +2 seeds, +5 max spirit.

**Acceptance criteria:**
- [ ] Charms persist for the whole run and show on the map and in matches
- [ ] Shop sells at most one charm per visit, priced by tier
- [ ] Old saves without `charms` load fine

**Verification:**
- [ ] Sim buys charms when it can; runs still finish
- [ ] Browser: buy a charm, reload, it's still there

**Dependencies:** None (best after Checkpoint B so balance is stable)
**Files likely touched:** `js/rogue.js`, `js/game.js`, `style.css`, `test/rogue.js`
**Estimated scope:** Medium

## Task 11: More azimat and a balance pass

**Description:** Add 3–5 more charms that combine with hero powers (e.g. a combo charm for Tuah),
pixel icons for each (7×7 `ICONS`), and rebalance.

**Acceptance criteria:**
- [ ] 6–8 charms total, each with an original 7×7 icon
- [ ] Balance targets still met for all heroes

**Verification:**
- [ ] `node test/rogue.js 300 3 0.15 all`
- [ ] Browser: shop shows the new charms and icons

**Dependencies:** Task 10
**Files likely touched:** `js/rogue.js`, `js/game.js`
**Estimated scope:** Medium

### Checkpoint D (after Tasks 10–11)
- [ ] Tests pass, balance on target, an old save loads

---

## Phase 5: Feel and onboarding (independent; any order)

## Task 12: Tap-to-preview on touch screens (done)

**Description:** Changed from long-press at the owner's request. On touch, the first tap on one of your
holes shows the same first-landing preview the mouse gets, with a "tap the hole again to go" line under
it; a second tap on the same hole plays. vs Computer and Roguelite only (not 2-player).

**Acceptance criteria:**
- [x] First tap previews (tapped hole lit, landing ringed, hint shown); same hole again plays
- [x] Another hole moves the preview; a tap off the holes cancels; Move preview off = one tap plays
- [x] No preview of the whole relay chain (design decision in CLAUDE.md)

**Verification:**
- [x] Browser at mobile preset: preview, re-tap, switch hole, cancel; board doesn't shift

**Dependencies:** None
**Files likely touched:** `js/pixel.js`, `js/game.js`
**Estimated scope:** Small

## Task 13: Idle animations on hero cards

**Description:** Small 2-frame idle loops: Tuah's keris glints, Mahsuri's selendang/kebaya sways,
Badang's boulder bobs. Pure CSS or swapping a few pixels; respects `prefers-reduced-motion`.

**Acceptance criteria:**
- [ ] Each hero has an idle loop that keeps their legend recognisable
- [ ] No animation when the OS asks for reduced motion

**Verification:**
- [ ] Browser: hero select looks right on desktop and phone width

**Dependencies:** None
**Files likely touched:** `js/game.js`, `style.css`
**Estimated scope:** Small

## Task 14: Guided first game (tutorial)

**Description:** An optional short guided match against an easy opponent with a fixed layout that
teaches extra turn, relay and capture in order, with speech-bubble hints. Offered from the menu
and once on first launch.

**Acceptance criteria:**
- [ ] Teaches the three landing outcomes in 3–5 moves, BM and EN
- [ ] Can be skipped at any step; remembered in `congkak.settings` once done

**Verification:**
- [ ] Browser: complete and skip the tutorial on desktop and phone width

**Dependencies:** None (Task 12 helps on phones)
**Files likely touched:** `js/game.js`, `style.css`
**Estimated scope:** Medium

### Checkpoint E: complete
- [ ] All tests pass
- [ ] README, CLAUDE.md and the design doc describe the new features
- [ ] Owner plays a full run and signs off
