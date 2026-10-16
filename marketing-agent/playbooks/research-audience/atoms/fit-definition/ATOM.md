---
name: fit-definition
description: Hidden atom of research-audience. Turns the brand brain's ICP plus the human's answers into a finished, searchable fit definition and plays it back for a yes. Never guesses an ICP.
---

# fit-definition

**Reads:** `brand_read` summary/onboarding/competitors/learnings; `knowledge_search` results for ICP, segments, win/loss, customers, past outbound outcomes, a saved fit definition; the human's answers and any exclusion files; `references/fit-and-scoring.md`; `references/list-by-company-type.md`.

**Does:**
1. Identify the motion (who the list is for — usually already in the request) and pick the list unit from the company-type table. Several motions → one definition each. Retail, wholesale and venue lists use the retail variant (door count, price tier, assortment, review window, chain vs independent route).
2. Fill every part of the definition table. Fill from the brain first; cite which item each line came from. A line the brain cannot settle is a question for the human, asked once, together with the others.
3. Turn loss notes and "not a fit" replies into the negative ICP.
4. Translate personas into title synonyms and seniority by company size.
5. Load exclusions: the human's files (customers, open deals, do-not-contact; for retail, the brand's current stockists), the contacted ledger and suppression, competitor **domains** from `competitor_read` (never names or handles — they can be mis-resolved), the seller's own domain. Normalise to root domains.
6. Account value (account-based lists): ask what a big vs small account is worth (deal size, strategic fit) and set the V1/V2/V3 rule; no answer → estimate from size evidence, labelled.
7. Size: what the human asked for, checked against what they can work; partner and app lists default to 20–30 — say what a bigger number does to fit.
8. No ICP in the brain and the human unsure: propose two or three candidate definitions from what the brand sells and its known customers, each with its reasoning, labelled proposals.
9. Play the finished definition back in one compact block, in plain words, and say what any deliberately open line will do to the list. Ask the spend question in the same message as SKILL.md step 2 says: a sample ceiling when every kind of read has logged charges, otherwise one yes for a single probe read (the sample ceiling follows from its charge). Wait for a yes.

**Writes:** the approved definition (markdown) for the run, and later the saved brand document through `../../../../atoms/save-to-brain/ATOM.md` (see SKILL.md write-back).

**Rules:** never widen or narrow the definition after the yes without asking. Never invent customers, logos or loss reasons. Never copy values from the reference's fictional example.
