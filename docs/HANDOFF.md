# Handoff: GobbieLife — ASCII Incremental Game

## Overview
GobbieLife is a **Candy Box–style incremental/idle game** rendered in a pure-black terminal
aesthetic. You play a sentient slick of mud that becomes a goblin, then a warren, then a
world-spanning empire, across **three Eras / nine stages**, ending in one of **six fates**. It is
narrative-driven: a hidden-alignment system, an Oracle that whispers riddles, a branching event
engine, a parallel quest chain (“The Wander”), a Hollow-worshipping cult, and a fully seeded
Era-III world map.

The game is **feature-complete and playable end to end** (Era I → III). This package documents its
architecture so a developer can extend it in place **or** port it into a production codebase.

## About the Design Files
Unlike a static mockup, the primary file here is a **working implementation**, not a look-and-feel
reference. `GobbieLife Stage 1 Playable.dc.html` is the actual game — all systems run in it.

It is authored as a **Design Component (`.dc.html`)**: a single file containing an HTML template
(inline-styled) plus a `class Component extends DCLogic` logic class, mounted by a small runtime
(`support.js`). The logic class is **plain, framework-agnostic JavaScript** — a classic React-style
class component (state, setState, lifecycle, a `renderVals()` that returns the template's inputs)
with **no build step, no imports, no TypeScript**.

**Two ways to use this handoff:**
1. **Extend in place** — keep the `.dc.html` format and iterate (fastest; the game already works).
2. **Port to a real app** — the logic class is portable almost verbatim to a React/Vue/Svelte
   component (it's already reducer-shaped: pure `_eraI/_eraII/_eraIII(s)` tick functions returning
   state patches, a `renderVals()` view-model, and a flat serialisable state object). The view is
   all inline styles, so it maps cleanly to JSX/`style={}`.

## Fidelity
**High-fidelity and functional.** Every colour, font, animation, and interaction is final and
working. Recreate pixel-for-pixel if porting.

## The core files
| File | What it is |
|---|---|
| `GobbieLife Stage 1 Playable.dc.html` | **The game.** Whole Era I→III arc. All systems below live here. |
| `GobbieLife Design Bible.dc.html` | Living design doc: pillars, world, cast, factions, narrative engine, panorama, building catalog, pacing, five-fate map. Read for intent. |
| `GobbieLife Architecture.dc.html` | System-architecture diagram of the engine. |
| `GobbieLife Nav Options.dc.html` | Decision mockup comparing nav styles (the hybrid/panel-filter option won and is built). |
| `CLAUDE.md` | The canonical project brief — resource/economy summary, locked design decisions, every implemented system, conventions. **Start here.** |
| `support.js` | The Design Component runtime (mounts the template + logic class). Do not edit. |
| `OPTIMIZATION_PLAN.md` | Performance architecture + what was optimised (batched tick, throttled save, memoized map, typewriter cadence). Do not regress these. |
| `BUG_REVIEW.md` | Known open issues + severities (one real fix pending: guard a Wander encounter from overwriting an open event). |
| `IMPROVEMENT_PLAN.md` | Backlog of built + candidate features. |
| `assets/panorama/tier0–6.png` | Procedural settlement-skyline silhouettes (Canvas-generated). |

## How it runs
Open `GobbieLife Stage 1 Playable.dc.html` in a browser (it references `support.js` beside it).
No build, no server. State autosaves to `localStorage`:
- `gobbielife_slice_v1` — the save (throttled to ≤ every 5s + on stage-up/ending/tab-close).
- `gobbielife_fate_v1` — the last ending, for New-Game+ keepsakes and the opening Oracle riddle.

The game loop is a **1 Hz `setInterval`** (`tick()`); passive production accrues per tick. There is
**no demo/fast-forward** — the former ×1/×60/×600 speed control and stage-jump were removed for
release, so the run is real-time (a deliberate ~7–8h full arc).

## Structure / screens
The whole game is one scaling viewport with a fixed era-tinted background FX layer. Screens by phase:
- **Intro** — pick your Voice (Grimdark / Balanced / Goblin Silly). Rolls your randomized goblin
  name; shows a keepsake card if a prior run is remembered.
- **Play** — top bar (name · resources · stage · RESET), an era-specific panel-filter nav, the live
  ASCII/panorama viewport, the main action panel, and a right rail (NEXT goals · The Wander ·
  The Charge quests · The Chronicle log). Era I = green, Era II = ember, Era III = amber.
- **Transitions** — full-screen ASCII interstitials at Breach (I→II) and the Herald Horn (II→III).
- **The Final Night** — a hushed one-screen Oracle soliloquy before the endgame resolves.
- **Ending** — a slow-reveal cinematic (see CLAUDE.md “Cinematic ending”).

## Design tokens
**Type:** JetBrains Mono throughout (monospace). No other family. No emoji.
**Base:** `#000` background; card washes `#050506`–`#0d0d0f`; hairlines `#1a1a1c`–`#2c2c2e`.
**Era accents:** Era I `#86b394` (ash-green) · Era II `#e2935a` (ember-orange) · Era III `#e7c468`
(brutalist-amber).
**Log-kind colours (also used as semantic accents):**
`whisper #8a857a` · `saga #86b394` · `reckoning #d89a7a` · `calamity #c87a6a` · `fortune #e2935a` ·
`oracle #9a8fb4` · `hollow #5f93a8` · `lore #c9b271` (parchment) · `cult #a87fc4` · `wander #b49ad2`.
**Map:** claimed land `linear-gradient(150deg,#f3d572,#c89a32)`; frontier hatch
`repeating-linear-gradient(45deg,#3a3214…#6a5a26)`; Dark-Beyond portal scar
`radial-gradient(circle,#123039→#04070a)`.
**Motifs:** ASCII/Unicode block art (`█▓▒░║◆◇◉⚑`); no gradient slop; hard, crisp edges.
**Radius:** 3–6px on cards/buttons. **Milestone flash / +N pops / endReveal** keyframes in a small
`<helmet><style>` block (only `@keyframes`, `@font-face`, resets live there — everything else inline).

## State & systems (authoritative summary)
See `CLAUDE.md` for the full spec. Key shape: one flat serialisable `state` object (resources per
era, `builds` queue, `rel` faction standings, alignment axes `alAggr/alDipl/alIsol/alHero`,
`adv/advStep/advCd/advPerks` for The Wander, `cultStep/cultStance`, `pname`, `worldSeed`,
`destroyedIdx`, `loreFound`, `hollowRise`, `coalition`, `megaProgress`, timers, `log`). The save
whitelist in `saveNow()` is the source of truth for what persists.

**Do-not-regress performance rules** (from `OPTIMIZATION_PLAN.md`): the per-second sim is ONE
batched `setState` (pure `_eraI/_eraII/_eraIII(s)` + folded ticks/oracle); autosave is throttled;
the Era-III hex map is memoized on `(worldSeed, territories, effMax, destroyedIdx)`; the Chronicle
typewriter reveals 4 chars/45ms.

## If porting to a framework
- The logic class → a store/reducer. `_eraI/_eraII/_eraIII(s)` already return immutable patches.
- `renderVals()` → a selector/view-model; every value it returns is consumed by the template by name.
- Inline `style="…"` → `style={{…}}`; `style-hover`/`style-active` → CSS `:hover`/`:active` or a
  styling lib. `sc-for`/`sc-if` → `.map()`/conditionals. `dc-import`/`x-import` are not used for game UI.
- Keep the two `localStorage` keys and the 1 Hz loop; keep the batched-update discipline.

## Assets
`assets/panorama/tier0–6.png` — seven procedurally drawn settlement silhouettes (Canvas), stacked
with opacity/translateY cross-fade. Regenerate via the run_script drawing routine if the palette
changes. All other art is live ASCII/CSS — no external images, icon fonts, or SVG.

## Open work
`BUG_REVIEW.md` lists the pending items; the one real gameplay fix is guarding a Wander encounter
from overwriting an already-open event. `IMPROVEMENT_PLAN.md` has the feature backlog.
