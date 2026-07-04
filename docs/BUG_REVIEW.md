# GobbieLife — Bug Review & Fix Plan (for approval)

Post-optimization review of the playable. Ranked by severity. **Nothing fixed yet — awaiting sign-off.**

---

## Bug 1 — A Wander encounter can clobber an open Reckoning  ★★★ (real, should fix)
**Where:** `advanceAdventure()`, the `np >= 50` encounter trigger.
**What happens:** When an adventure crosses its halfway mark, it fires its road encounter by
setting `activeEvent` (for a *choice* encounter) — **without checking whether a normal event is
already open**. If a Reckoning/Standings/Chorus event is on screen at that moment, the Wander
choice **overwrites it**, and the player silently loses the original event and its outcomes. For
*minigame* encounters (speed/riddle/memory) it's milder: the minigame starts in the side panel
while the modal event is still up, so two interactions compete for attention.
**Fix:** Gate the encounter on `!s.activeEvent` — hold the adventure at ~49% until the player has
cleared whatever event is open, then fire the encounter. One added condition; no content change.
**Risk:** Very low.

## Bug 2 — Wander outcome lines log in the wrong colour  ★★ (polish)
**Where:** `resolveEvent()` log-kind selection.
**What happens:** The Wander event *card* is violet (⚑), but when you pick a choice, the result
line is written to the Chronicle as a `reckoning` (ember) entry, not `wander` (violet). Minor
visual inconsistency in the log for the interactive-choice adventures.
**Fix:** Tag the resolved line `wander` when `ch.wander`/the event was a Wander event.
**Risk:** Very low.

## Bug 3 — Dead code left by the optimization pass  ★★ (cleanup)
**What happens:** `tickOracle()` is now unreferenced (its logic was folded into `tick()`), and the
`_saveDirty` flag is set but never read (the throttle is purely time-based). Neither causes a bug;
they're just clutter that could confuse future edits.
**Fix:** Delete `tickOracle()`; either wire `_saveDirty` into a proper "flush pending on quit" or
remove it. **Recommend:** keep `_saveDirty` and use it in the `visibilitychange`/`pagehide` flush
so a <5 s-old unsaved change is guaranteed written on quit (tiny robustness win), and delete
`tickOracle`.
**Risk:** Very low.

## Bug 4 — Adventure cooldown re-renders every second for ~110 s  ★ (minor perf leftover)
**Where:** `advanceAdventure()` returns `{advCd: …}` every tick while the post-adventure cooldown
counts down (~110 s after each of the 9 adventures).
**What happens:** Each of those returns is a `setState` → one render/second during the cooldown,
partially reintroducing the churn the optimization removed (only during cooldown windows).
**Fix:** Fold the `advCd` decrement into the batched era tick (same pattern as `ticks`/oracle) so
it rides the existing per-second render instead of adding its own.
**Risk:** Low.

## Bug 5 — High-demo-speed ordering of road beats  ★ (cosmetic, edge case)
**Where:** `advanceAdventure()` quarter-mark beats vs the 50% encounter.
**What happens:** At ×600 demo speed, travel progress jumps in huge steps, so the 25% / 50% / 75%
road beats and the encounter can resolve on consecutive ticks slightly out of narrative order
(e.g. the 75% beat logging just before the 50% encounter). Purely cosmetic; only at max fast-
forward, which is a testing aid.
**Fix (optional):** Clamp progress so only one narrative beat is crossed per tick. Low value.
**Risk:** Low. I'd likely **leave this** unless you want it.

---

## Things checked and found OK (no action)
- Batched tick vs endings: `setState` is synchronous in this runtime, so `this.state.ended`
  right after the era `setState` is accurate — endings and the FATE-memory write persist correctly.
- Offline progress under the new 5 s save throttle: `savedAt` is at most 5 s stale, well within the
  300 s offline cap — gains are effectively unchanged.
- All 36 adventure variants have a valid encounter (base pool via `ADV_ENC`, B/C/D inline `enc`).
- Minigames run on real 1 Hz ticks, so demo speed doesn't shrink their timing windows.
- Wander gamble choices merge good/bad correctly and carry `advMod` + top-level `dGrit`/`dAlign`.

---

## Recommended fix set
Do **Bugs 1, 2, 3, 4** (all low-risk, and 1 is a genuine gameplay loss). Leave **Bug 5** unless you
want max-speed polish. 

**Awaiting approval — confirm the set (1–4, or include 5) and I'll implement.**
