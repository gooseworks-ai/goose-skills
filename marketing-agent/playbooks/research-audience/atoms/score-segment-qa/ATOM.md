---
name: score-segment-qa
description: Hidden atom of research-audience. Scores rows (gates then points, each point cited), tiers them by fit, timing and account value, segments them by angle × signal with a pain-proof-ask angle each, runs the senior pre-handover checklist, and writes the honest summary including any shortfall.
---

# score-segment-qa

**Reads:** account table, people rows, signals; `references/fit-and-scoring.md`; `references/output-format.md`; `references/contacts-and-compliance.md`.

**Does:**
1. Score: gates already passed; add points by block, each with its cited reason in `fit_reason`. Tier A/B; C to `dropped.csv`. Set the value tier (V1/V2/V3) with its evidence for account-based lists; rank by tier and value together.
2. Segment by angle × signal (e.g. "new leader", "hiring for the pain", "fit, no signal"), 3–6 segments, each with a **three-line angle**: *pain* (the situation in the buyer's terms, from the signals), *proof* (one signed-off claim, verbatim, cleared through `../../../../atoms/claims-gate/ATOM.md` — or, when the human declined the scoped sign-off at Gate 2, "proof needed: <what would do>"), *ask* (one low-friction next step). Never an invented result or number.
3. Rank: tier, then score, then warm path.
4. QA checklist — every item, every run:
   - domain is the current company's live site, not a parent or old brand;
   - no duplicate people or domains; concentration cap held;
   - all exclusions applied (customers, open deals, ledger, competitors, do-not-contact, own staff);
   - every title seen within 90 days; every signal inside its window;
   - no `verified` label without a tool; pattern-guesses have cited evidence; account-level rows (chains, independents) carry a published route;
   - no banned hook topics; region flags set; no Canadian or AU/NZ pattern-guess left as an email route; no `UK-soletrader` row has an email or DM route (visit, letter, or phone with a recorded TPS check); EU rows say "check the national rule"; `other:` rows say "check the local rule";
   - five random rows re-checked by hand against their sources — fix or drop any that fail, and say how many failed.
5. If fewer rows pass than asked, deliver what passed and state why (thin universe, no contact routes, heavy exclusions). Never pad.

**Writes:** `list.csv`, `dropped.csv` (tier C included, with reason), `summary.md` in the output format; ledger rows for everything shown.
