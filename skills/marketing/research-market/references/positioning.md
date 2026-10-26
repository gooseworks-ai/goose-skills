# Human version

This turns buyer, product and competitor evidence into positioning choices and finished messages. It recommends a choice with trade-offs and proof, while leaving the brand's existing position in place until the owner chooses.

---

# Agent version

## Frame and gather

1. After setup, run the `run-memory` skill (`../../run-memory/SKILL.md`) with job `positioning`, `cadence: ad hoc`; subject is the product slug only for a product-specific ask. Read the latest positioning document, current brand position/voice/product facts and claims contract, buyer groups/quotes, latest market report, competitor landscape/records and relevant campaign brief. Treat the user's chosen buyer/product as scope, and state any disagreement with the saved research. An absent sibling report is a gap, not a requirement to run that entire playbook.
2. Make an evidence ledger: buyer situation/job and alternatives (including manual work/doing nothing); unique product attributes; value to that buyer; dated proof; our limitations; rivals' actual promises. Every fact links its source/date, and untested assumptions are labelled. Use the host's public search/fetch for missing category names, rival prices and current product facts, within existing research methods. Ask only in closing for private win/loss or missing product proof the public cannot supply. Buyer quotes are evidence of a need, not proof that our product solves it.

## Develop and test choices

3. Draft **2–3 different strategic options**, distinguished by buyer situation, competitive alternative, category or value priority. Each must have: intended buyer/job; category (existing/subcategory/new, using the market-pass category rules); alternative replaced; unique attribute → buyer value → dated proof; why this buyer would choose us; where it loses/does not fit; evidence strength and unresolved proof. Avoid cosmetic rewrites of the same promise. If evidence supports only one option, label the others hypotheses rather than inventing differentiation.
4. Recommend one using buyer need, product fit, provable difference, market language and reachable distribution. Name the strongest counterargument and what would change the recommendation. A contradiction with the current position is the owner's decision, never an automatic update. Add one cheapest validation test for the weakest important assumption, with audience, comparison, observable pass/fail and who reviews it; a paid test is a proposal only. Do not use market-size arithmetic as proof a message resonates.
5. **Write the messages now**, for the recommended option (or the owner's selected option when supplied): internal positioning statement; plain one-line pitch; homepage headline + subhead + CTA; three supporting messages, each with its proof; short boilerplate; one pain/message/proof adaptation for each relevant buyer group; what we are not claiming. These are finished draft lines, not suggestions to write copy later. Keep the promise consistent across them; use the confirmed voice or label voice provisional. No invented statistics, testimonials, category leadership, features or offers.
6. Run the `claims-gate` skill (`../../claims-gate/SKILL.md`) over every proposed promise. Approved wording remains in scope, with required qualifiers. Place unsupported candidate lines in “Needs proof” with the exact evidence required, and write a safe product-fact version for use now. Seek scoped approval only for the few lines the chosen option needs. A choice can remain provisional while useful safe messages are delivered. No typed positioning change, publishing or launch follows merely from writing this document.

## Deliver and remember

Deliver through the `write-report` skill (`../../write-report/SKILL.md`), topic `positioning`, brand path `research/market/positioning/<YYYY-MM-DD>.md`, keep-history, title `Positioning options — <Brand> [— <Product>] — <date>`, tags `research-market`, `positioning`. Its story contains: evidence and current position; options comparison; recommendation/trade-offs; finished messages; validation test; proof/approval gaps. Summary uses the evidence's certainty, not “confirmed positioning”. Decisions asks which option to use and which exact claims to approve; make no arbitrary deadline.

On the owner's explicit choice, save a current working brief through the `save-to-brain` skill (`../../save-to-brain/SKILL.md`): `research/market/positioning.md` (product-specific: `research/market/positioning-<product-slug>.md`), supersede, title `Positioning brief — <Brand> [— <Product>] — <date>`, tags `research-market`, `positioning-brief` (plus `product:<slug>` for a product brief). Record their words/date, chosen option, safe message hierarchy and outstanding proof. A selected hypothesis stays labelled unvalidated; choice is not proof. Before a choice, retain the earlier current brief unchanged. Planners and writers read this brief; older alternatives remain history, not an instruction to change the brand.

Save the run record before closing: chosen/proposed option, evidence dates, number of supported/blocked messages, test recommendation with its observable pass/fail, outcome source (the current brief and the owner's later test results). Next positioning run checks the test and decision first. No brand-wide fact changes are inferred from file existence.

## Completion check

- Two or three distinct options with meaningful trade-offs, or explicit evidence limits.
- One recommendation tied to buyer/product/competitive evidence; disagreements with the existing position stated.
- Finished pitch, hero/subhead/CTA, supporting messages, boilerplate and relevant buyer adaptations; every promise approved/in scope or clearly separated with a safe alternative.
- One test can distinguish the weak assumption; no invented result or automatic spend.
- Alternatives delivered as a real readable document; current brief changes only on the owner's choice. Run record and any save limitation reported.
