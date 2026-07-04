# GobbieLife — Improvement Plan (July 2026)

Agreed backlog from the "what else would you improve" review. Items 1, 3, 4 first.

## Now (in progress)
1. **Named lands** — each Era III hex gets a seeded fantasy name ("The Cinder Marches", "Vael's Reach").
   Names surface on claim (log + pop), in uprising/war/Dark Beyond events where a land is lost,
   and as a tooltip on the hex map. Loss becomes personal, not numerical.
3. **The Final Night** — a one-screen pause right before the endgame resolves (Mechanica commit / Root commit),
   where the Oracle speaks plainly for the only time in the game. One paragraph, tone-aware,
   alignment-aware, then a single "Face what comes" button into the ending cinematic.
4. **Chronicle typewriter** — the newest Chronicle line types in character-by-character.
   Only the newest line animates; older lines render instantly. Era-accent caret.

## Next
2. **Faction finales → epilogue paragraphs** — DONE (THE FINAL RECKONINGS section in the ending).
5. **Panorama reactivity** — DONE (raid flicker, famine veil, Mechanica glow ∝ progress).
6. **New Game+ keepsake** — DONE (per-fate boon + intro card + Chronicle lore line; keys `keepsake`/`keepsakeLabel`).
7. **Balance pass 2.2→2.3** — DONE first pass: shanty +5 housing @×1.22 scaling (was +3 @×1.6 — 50-pop housing was unreachable); wall ×1.38 (was 1.6), tower ×1.35 (was 1.55) so tier-5 defence gate lands mid-plateau. Revisit against a real ×1 playthrough.
   **Global cost-curve rebalance (July 2026):** producers kiln ×1.30/1.28, smelter ×1.35/1.30, forge ×1.40 (adamantium stays the ceiling); comfort lodge ×1.35/1.32, bath ×1.35, mead ×1.40; Era III outpost ×1.35, route ×1.32, granary ×1.32, garrison ×1.35, garden ×1.35; claim ×1.25 (was ×1.72 — land 30 cost ~200k influence, unreachable; now ~×650 base, a real brake but earnable). Rationale: each building produces a flat amount, so any multiplier >1 prevents snowball — the risk was curves choking, not runaway.
8. **Chronicle export upgrade** — DONE (styled standalone HTML download; plain text still on clipboard).

## Testing rule (learned the hard way)
Never mutate the live save key (`gobbielife_slice_v1`) during testing. Work on a copy under a
separate key, or suspend the autosave interval first — the 1s tick autosave races any external write.
