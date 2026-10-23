---
name: research-audience-score-segment-qa
description: >-
  Step of the research-audience playbook: scores and tiers list rows, groups them into segments with
  an angle each, runs the pre-handover checks and writes the list files. Run research-audience
  instead; not for direct use.
version: 0.1.0
---

# score-segment-qa

**Reads:** account table, people rows, signals; `../research-audience/references/fit-and-scoring.md`; `../research-audience/references/output-format.md`; `../research-audience/references/contacts-and-compliance.md`.

**Does:**
1. Score: gates already passed; add points by block, each with its cited reason in `fit_reason`. Tier A/B; C to `dropped.csv`. Set the value tier (V1/V2/V3) with its evidence for account-based lists; rank by tier and value together.
2. Segment by angle × signal (e.g. "new leader", "hiring for the pain", "fit, no signal"), 3–6 segments, each with a **three-line angle**: *pain* (the situation in the buyer's terms, from the signals), *proof* (one signed-off claim, verbatim, cleared through the `claims-gate` skill (`../claims-gate/SKILL.md`) — or "you'd need proof of <X> first", which the message offers to sign off), *ask* (one low-friction next step). Never an invented result or number.
   Then **For you** per segment: does it fit us (yes/no and why, from our product, pricing and customers); what to send first and to whom (V1 accounts first); then offer, as a closing decision, the messages written for this list (write-outreach reads `list.csv` and these angles). Don't follow the herd: if every rival pitches this segment the same way, say so and offer a different angle from what buyers say (this playbook's quote bank, `research/audience/voc-bank.md`).
   **You vs them**: accounts where a rival is in use (from job posts naming the tool, case studies, integration pages) — where we're ahead (say it louder), behind, and where everyone sounds the same.
3. Rank: tier, then score, then warm path.
4. QA checklist — every item, every run:
   - domain is the current company's live site, not a parent or old brand;
   - no duplicate people or domains; concentration cap held;
   - all exclusions applied (customers, open deals, ledger, competitors, do-not-contact, own staff);
   - every title seen within 90 days; every signal inside its window;
   - `email` filled only for `verified-by-tool` rows — every published or pattern-built address is in `email_candidate`; no `verified` label without a checker result; pattern-guesses have cited evidence; account-level rows (chains, independents) carry a published route;
   - no banned hook topics; region flags set; no Canadian or AU/NZ pattern-guess left as an email route; no `UK-soletrader` row has an email or DM route (visit, letter, or phone with a recorded TPS check); EU rows say "check the national rule"; `other:` rows say "check the local rule";
   - five random rows re-checked by hand against their sources — fix or drop any that fail, and say how many failed.
5. If fewer rows pass than asked, deliver what passed and state why (thin universe, no contact routes, heavy exclusions). Never pad.

**Writes:** `report.md`, `list.csv`, `dropped.csv` (tier C included, with reason) in the output format, and **`segments.csv`** (`segment, name, pain, pain_source_url, proof, ask, default_opener, rows`) — the angles write-outreach reads; pain comes from the quote bank, or with no bank from the rows' own signals ("hiring two AP specialists"), labelled so. Ledger rows for everything shown.
