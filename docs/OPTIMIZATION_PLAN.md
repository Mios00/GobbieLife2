# GobbieLife — Performance Optimization Plan (for approval)

The game is a single Design Component running a 1 Hz simulation loop. It works, but the
render/update path does far more work per second than it needs to. Below are the real issues
found by reading the tick loop, `save()`, and `renderVals()`, ranked by impact — each with the
fix and the risk. **Nothing here changes gameplay, balance, content, or visuals.** It is purely
how often and how much work the engine repeats.

---

## Issue 1 — The tick fires 6 separate re-renders every second  ★★★ (biggest win)
**What's happening:** `tick()` calls `tickEraX()`, then `setState({ticks})`, then
`advanceBuilds()`, `advanceAdventure()`, `checkStage()`, `tickOracle()` — each its own
`setState`. Every `setState` triggers a full React re-render, and each render runs the entire
~400-line `renderVals()` (all derived strings, the map, every panel). So one game-second =
**up to 6 full renders**. This cost is fixed regardless of demo speed (×1/×60/×600 change the
math inside a tick, not how often it runs).

**Fix:** Collapse the per-second simulation into **one batched `setState`** — compute resources,
builds, adventure, stage check, and oracle countdown in a single reducer that returns one patch.
Keep the individual methods for event-driven calls (button clicks), but have the *tick* path use
a combined pass.

**Result:** ~6 renders/sec → ~1 render/sec. Roughly a 5–6× cut in steady-state CPU.
**Risk:** Medium — the tick methods must be refactored to return patches that merge cleanly
(they already mostly do). Requires careful testing of era transitions and stage-ups. This is the
one change I'd verify hardest.

---

## Issue 2 — Full save (JSON.stringify of ~130 keys) every single second  ★★★
**What's happening:** `save()` runs at the end of every tick. Each call does a `log.filter`, a
marks-dedup scan, sometimes a *extra* `setState({marks})` (another render), then
`JSON.stringify` of the entire ~130-key state + the 80-entry log, and a synchronous
`localStorage.setItem`. Every second. localStorage writes are synchronous and block the main
thread.

**Fix:** **Throttle autosave to ~once every 5 seconds** (and force a save on important moments —
stage-up, build complete, adventure return, and on `visibilitychange`/`pagehide` so nothing is
lost when the tab closes). Move the marks-harvest out of the hot path (compute it only in the
throttled save, never as a mid-tick `setState`).

**Result:** ~5× fewer stringify+write cycles, and removes an extra render per second.
**Risk:** Low — the only behavioural change is that a hard crash could lose up to ~5s of idle
progress (offline-progress on reload already reconstructs idle gains anyway, so effectively nil).

---

## Issue 3 — The 30-hex world map is rebuilt every render, in every era  ★★
**What's happening:** `renderVals()` always runs the Era-III map builder — the 30-cell geometry
loop, min/max bounds, per-cell gradient/title strings — even in Eras I and II where the map is
never shown. The seeded `worldMap()` itself is cached, but the per-render `mapCells` assembly is
not.

**Fix:** Guard all Era-III-only derived values (`mapCells`, standings, coalition UI, etc.) behind
`if (gEraIII)` so Eras I–II skip them entirely, and memoize `mapCells` on
`(worldSeed, territories, destroyed count)` so it only rebuilds when the map actually changes.

**Result:** Eras I–II renders get noticeably lighter; Era III rebuilds the map only on a claim or
a land loss instead of every frame.
**Risk:** Low — pure computation gating, no output change.

---

## Issue 4 — The Chronicle typewriter forces a full re-render ~33×/second  ★★
**What's happening:** When a new log line types in, `componentDidUpdate` runs a 30 ms interval
that calls `forceUpdate()` — a **full component re-render up to 33 times a second** for the
whole duration of the line (a long saga line = 1–2 seconds of this). During that window the
entire UI (map included) re-renders on every character.

**Fix:** Two cheap changes: reveal more characters per frame and lengthen the interval
(e.g. ~4 chars per 45 ms instead of 2 per 30 ms → roughly half the frames), and stop the timer
the instant the line is complete (already partly done — tighten it). Optionally isolate the log
so its animation doesn't re-render the map, but that's a larger refactor I'd defer.

**Result:** Roughly halves the render burst on every new log line — and log lines are frequent.
**Risk:** Very low — purely the animation cadence; the effect looks the same.

---

## Issue 5 — File parse / first-load weight  ★ (minor, load-time only)
**What's happening:** The playable is now ~2,800 lines in one file (36 adventures, ~130 events,
whisper banks, etc.). This only costs on initial parse, not during play.

**Fix (optional):** Nothing urgent. If load time ever matters, static content banks (adventures,
events, whispers) could move to a plain `.js` data module loaded alongside — but that adds a file
and complexity for a one-time cost. **I'd leave this alone unless you want it.**

---

## Recommended order
1. **Issue 2** (throttle save) — lowest risk, immediate ~5× write reduction. Do first.
2. **Issue 4** (typewriter cadence) — trivial, removes a frequent render burst.
3. **Issue 3** (era-gate + memoize the map) — low risk, steady lightening.
4. **Issue 1** (batch the tick) — biggest win, most testing. Do last, verify hardest.

Issues 1–4 together should cut steady-state main-thread work by roughly **4–6×** with zero change
to how the game plays or looks. Issue 5 is optional and load-time only.

**Awaiting approval — tell me which issues to implement (all four, or a subset).**

---

## STATUS: All four implemented & verified (July 2026)
Measured DOM-mutation churn on a live Era-III save dropped from **~194 per 3s to ~6 per 3s**
(≈30× less render work) with the sim still ticking and all gameplay intact.

- **Issue 1 (batch tick):** `tickEraI/II/III` converted to pure `_eraI/_eraII/_eraIII(s)` returning
  patches; `tick()` now runs era math + `ticks` counter + oracle countdown in ONE `setState`.
  `advanceBuilds`/`advanceAdventure`/`checkStage` still early-return null when idle (no extra render).
- **Issue 2 (throttle save):** `save()` is now a dirty-flag throttle; real writes via `saveNow()` at
  most every `SAVE_MS` (5s), plus forced writes on stage-up, endings, and `visibilitychange`/`pagehide`.
  Marks harvest no longer triggers a mid-tick render.
- **Issue 3 (map gate + memo):** hex-map build runs only in Era III and is memoized on
  `(worldSeed, territories, effMax, destroyedIdx)` — rebuilds on claim/loss, not every frame.
- **Issue 4 (typewriter):** reveal cadence changed from 2 chars/30ms to 4 chars/45ms (~half the
  render bursts per log line); timer stops cleanly on completion.
- **Issue 5:** left as-is (load-time only), per plan.
