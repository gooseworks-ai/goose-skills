---
name: research-audience-fit-definition
description: >-
  Step of the research-audience playbook: drafts the searchable fit definition, exclusions and list
  size that the list run then searches on. Run research-audience instead; not for direct use.
version: 0.1.0
---

# fit-definition

**Reads:** the brand's own site in the host browser (what it sells, pricing, case studies, customer logos, integrations, who it says it's for); `brand_read` summary/onboarding/competitors/learnings; `knowledge_search` for ICP, segments, win/loss, customers, past outbound; the saved fit definition; the saved buyer groups (`research/audience/buyer-groups.md`) — the lead group, or the one the ask names, is the starting definition; the ask itself; `../research-audience/references/fit-and-scoring.md`; `../research-audience/references/list-by-company-type.md`. No answers from the human yet — this atom drafts.

**Does:**
1. Identify the motion (who the list is for — usually already in the request) and pick the list unit from the company-type table. Several motions → one definition each. Retail, wholesale and venue lists use the retail variant (door count, price tier, assortment, review window, chain vs independent route).
2. Fill every part of the definition table from the site, the brain and the ask. Mark each line **sourced** (with its link or brain item) or **assumed** (your best reading, with why). Never leave a line blank to ask about — assume it, label it, and let the human correct it in the report's message.
3. Turn loss notes and "not a fit" replies into the negative ICP.
4. Translate personas into title synonyms and seniority by company size. Hiring-led lists: write the role map (replaces / augments / buys / champions / uses, and the job-ad keywords that confirm relevance) — `../research-audience/references/list-sources.md` § Hiring.
5. Load exclusions: the human's files (customers, open deals, do-not-contact; for retail, the brand's current stockists), the contacted ledger and suppression, competitor **domains** from `competitor_read` (never names or handles — they can be mis-resolved), the seller's own domain. Normalise to root domains.
6. Account value (account-based lists): set the V1/V2/V3 rule from the brand's pricing page and customer logos (seats, locations, plan tiers), labelled assumed; the human corrects it later.
7. Size: what the human asked for, checked against what they can work; partner and app lists default to 20–30 — say what a bigger number does to fit.
8. No ICP anywhere: draft from what the brand sells and its customer logos; where two readings are equally likely, build the free pass on the stronger one and name the other in the report as an alternative.
9. Write the draft definition as one compact block for the report, assumed lines first, and say what any open line will do to the list. Do not wait for a yes — the free pass runs on the draft.

**Writes:** the definition (markdown, assumed lines labelled) for the run, updated with the human's corrections, and later the saved brand document through the `save-to-brain` skill (`../save-to-brain/SKILL.md`) (see SKILL.md write-back).

**Rules:** after the human corrects it, never widen or narrow it again without saying so. Never invent customers, logos or loss reasons. Never copy values from the reference's fictional example.
