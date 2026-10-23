---
name: run-paid-campaigns-draft-moves
description: >-
  Step of the run-paid-campaigns playbook: turns the weekly read into scale, pause, hold, rotate and
  fix recommendations within the spend ceiling. Run run-paid-campaigns instead; not for direct use.
version: 0.1.0
---

# Draft the moves (atom)

**Load:** `../run-paid-campaigns/references/moves.md`, `../run-paid-campaigns/references/written-instructions.md`.

**Inputs:** the outcome check (each earlier move: worked / didn't work / too early / can't tell, from `../run-paid-campaigns/references/run-memory.md`); the weekly-read table; the health gate; allowable CPA and ceiling; month-to-date spend; last week's scored moves; picked creatives for swaps (the batch file's picks + lower-case tag `picked`), with their batch-file copy; analyze-performance's calls (including Google wasted-spend terms).

**Do:**
1. One recommendation per object that needs a move (an internal `R<n>`; the proposal numbers moves for the marketer); holds get a date and a trip-wire. Low-volume regime: a normal week is fixes + "no moves; next decision <date>".
2. Scale steps +20–30% against the implied daily pace; lifetime math for Goose launches; nothing in a flight's last 2 days.
3. One significant edit per ad set per week; drop the lower-confidence edit if two collide and say so. Pausing an ad doesn't save money unless its ad set budget is cut.
4. Near-threshold → both readings + recommendation + trip-wire.
5. Rotate before decay: swap to an approved render, else a rotation request — except in an ad set frozen until an earlier move's readout: there, a hold with a click-rate trip-wire (`../run-paid-campaigns/references/moves.md` § Freeze until read).
6. Everything outside GooseWorks' levers → a card.
7. Sum the effect on month-end spend; stay within the ceiling (cut the lowest-confidence scale first).
8. Expected effect from the account's own history, direction-only, or "unknown".
9. Every money move: write its baseline recipe (`../run-paid-campaigns/references/run-memory.md`) and its readable-from date; skip any ad set frozen until an earlier readout; don't repeat a move that didn't work without a new reason.
10. Run the failure-mode checklist.

**Output:** the moves table, the both-readings blocks, the cards, rotation requests, the R# entries for `state.md`, and the money-move rows (recipe, review-by) for the run record.
