---
name: make-static-ads-angle-grid
description: >-
  Step of the make-static-ads playbook: turns the brief and brand evidence into 3-5 distinct angles
  and a grid of ads that tests one thing per cell. Run make-static-ads instead; not for direct use.
version: 0.1.0
---

# angle-grid

**Reads:** the brief and state note (Steps 1–2), `../make-static-ads/references/angles-and-hooks.md`, `../make-static-ads/references/formats-and-placements.md` §1–2.
**Writes:** the angle list and the grid, used by ad-copy and the plan table.

1. **Collect candidate angles with their evidence** (`../make-static-ads/references/reading-the-brain.md` §2–5), in this order: campaign concepts (`gooseworks:campaign_read`); the angle bank (`A-NN`, research-competitors); the weekly performance read, rotation requests and current winners (`gooseworks:file_read` in the workspace, `gooseworks:meta_read` `view: "performance"`); the voice-of-customer bank (row ids); kit value props, positioning, signed claims and reasons the marketer gives in this chat; `kit.messagingAngles` as a labelled fallback; saved competitor references and inspiration (structure and reason-to-buy only).
2. **Write each as a record:** they buy because ___ · persona · awareness stage · emotional driver · proof needed (signed claims) · angle type (the `type:` mapping in angles-and-hooks §4) · `A-NN` or source line. If the proof it needs is not approved, the angle is unavailable — say so, do not weaken it into something vaguer.
3. **Run the diversity test.** Merge any two whose "they buy because" blanks paraphrase each other. Each pair must also differ in stage, driver or persona. Weight to the brief's stage (prospecting → problem/solution-aware; retargeting → product/most-aware).
4. **Fewer than three grounded angles?** Stop and tell the marketer how many exist and what each rests on; offer (in plain words) to research customers or competitors first, to use their own reasons, or a smaller set. Never invent one.
5. **Mode rules.** Iterate: keep the winner's angle and proof; vary one element per ad. Rotation: take the reason from the request — fatigue at steady click-through (audience saturation) → new execution; falling click-through on a sound angle → new hook family; exhausted → new angle (rest the old one); make what it asks by its live-by date (open `Rotation needed: for make-static-ads` lines). Disapproval fix: no new angles. A small budget: 3–4 ads on one or two angles.
6. **Lay out the grid.** Default ten = 3–4 angles × 1–2 archetypes × 2–3 hooks; ≤ ~40% of ads on one angle or one archetype; at most one offer ad, only with a live offer. For each cell write what varies ("hook only", "archetype only").
7. **Check feasibility** per cell: real product imagery, real reviews, real screenshots, real founder words exist for the archetype; drop or swap archetypes whose inputs are missing.

Output: a table — angle (they buy because…), type, stage, driver, source, cells with archetype and hook slots.
