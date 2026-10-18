# Implementation Plan: More fun in the roguelite

## Overview

Right now the three heroes look different but play the same, and opponents differ only by AI strength
and four modifiers. This plan makes choices matter: hero powers that change how you play, opponents with
their own tricks, permanent charms (azimat) to build around, and smaller feel improvements (phone move
preview, idle hero animations, a tutorial). Every item comes from the backlog in `CLAUDE.md` that was
already agreed with the owner.

## Architecture decisions

- **Powers that touch sowing live in `engine.js`, inside `playMove`.** The AI searches with `playMove`,
  so it automatically "sees" Badang's extra seeds, Tuah's steals and opponent powers. No AI changes needed.
- **Powers are switched on through `createGame` opts**, e.g. `opts.powers = ['badang', null]`
  (one entry per player), stored in `state.fx`. Classic mode passes nothing, so classic play and
  `test/selfplay.js` are unaffected.
- **The engine counts combo hits** (Task 1). Today the combo is counted twice, in `game.js` and in
  `test/rogue.js`. Tuah's power depends on the combo, so the count must live in the engine state
  (`fx.combo`) and both callers read it.
- **Run-level powers (Mahsuri) live in `rogue.js`** (`finishMatch`, `makeMatch`), stored as new
  fields on the run. Old saves without those fields still load (missing = not used yet), so `run.v`
  stays 1.
- **Each power gets visible feedback**: an engine event (e.g. `{ t: 'steal' }`) that `game.js`
  animates with a toast and sound, plus BM + EN text.
- **`test/rogue.js` gets a hero argument** so every power can be balance-checked against the targets
  in `CLAUDE.md` (strong ~88%, average ~18%, weak ~0% but reaches area 2).

## Dependency graph

```
Task 1 engine combo count ──┬── Task 4 Hang Tuah power
                            │
Task 2 hero stats + sim ────┼── Task 3 Badang power
                            ├── Task 5 Mahsuri powers
                            └── Task 6 hero balance pass ── (after 3, 4, 5)

Task 7 opponent power hook ─┬── Task 8 Toyol
                            └── Task 9 Bunian (UI only)

Task 10 azimat foundation ──── Task 11 more azimat + balance

Task 12 phone preview, Task 13 idle animations, Task 14 tutorial: independent
```

## Task list

Full tasks with acceptance criteria are in `tasks/todo.md`.

### Phase 1: Foundation
- [ ] Task 1: Engine counts combo hits (no behaviour change)
- [ ] Task 2: Heroes start with their own stats; sim takes a hero argument

### Checkpoint A: tests pass, run numbers unchanged for Hang Tuah (default stats)

### Phase 2: Hero powers
- [x] Task 3: Badang — Kekuatan Badang (capped at 3 per turn)
- [x] Task 4: Hang Tuah — Keris Taming Sari
- [ ] Task 5: Mahsuri — Darah Putih (done) and Sumpahan Mahsuri (not yet)
- [ ] Task 6: Hero balance pass, remove "powers coming soon" note

### Checkpoint B: each hero plays differently, all heroes hit balance targets, owner plays one run each

### Phase 3: Opponent signature powers
- [ ] Task 7: Opponent power hook + Tok Pawang freezes a hole
- [ ] Task 8: Toyol, a new Hutan Rimba opponent who steals seeds
- [ ] Task 9: Orang Bunian hides seed counts

### Checkpoint C: opponents feel distinct, balance still on target

### Phase 4: Azimat (permanent charms)
- [ ] Task 10: Azimat foundation — data, shop offer, run slot, 3 charms
- [ ] Task 11: More azimat and a balance pass

### Checkpoint D: a run can be built around charms; old saves still load

### Phase 5: Feel and onboarding (any order, can run in parallel)
- [x] Task 12: Tap-to-preview on touch screens (tap again to play)
- [x] Task 13: Idle animations on hero cards
- [ ] Task 14: Guided first game (tutorial)

### Checkpoint E: complete — docs (README, CLAUDE.md, design doc) updated

## Risks and mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Powers make runs too easy or too hard | High | Sim per hero after every power task; tune numbers, not rules |
| Badang creates seeds, breaking "98 seeds" assumptions | Med | Only in roguelite (classic passes no powers); selfplay conservation test unchanged |
| AI search slows down with extra engine work | Med | Keep power code to a few integer checks; watch Hard AI ms/move in selfplay and depth 5 elites |
| Old saves break when run fields are added | Med | New fields default to "unused" when missing; test by loading a save made before the change |
| Bunian hiding counts also has to hide the move preview | Low | Preview reads the same "hidden" flag; check in browser |
| Moving combo counting changes coins | Low | Task 1 is pure refactor; compare sim coins/match before and after |

## Open questions

1. **Badang's "2 seeds":** does the second seed come out of thin air (a bonus seed, stronger) or from his
   hand (moves faster, changes landings)? Plan assumes a bonus seed.
2. **Toyol:** add him as a new Hutan Rimba opponent (plan's assumption) or replace one existing one?
3. **Azimat:** how many charm slots (plan assumes 2), and are they sold only in shops or also as
   boss rewards?
4. ~~Order: phone move preview first?~~ Done: Task 12 was built first as tap-to-preview.
