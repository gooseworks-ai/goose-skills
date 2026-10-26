---
name: claims-audit
description: >-
  Internal step of learn-my-brand (hidden). Turns every claim-shaped line the brand brain holds into a
  classified candidate with a recommended verdict, and runs the owner's sign-off by risk tier. Used in full
  runs, update runs, one-claim checks the owner brings here, client sign-offs and expiry sweeps. The span checks
  are the same as the shared ../../../../skills/claims-gate/SKILL.md §2; this is the whole-brand version.
---

# claims-audit

Load `../../references/claims-craft.md` first, and `../../references/category-rules.md` when the category is regulated.

## Input
- The brand's id and category (from learn-my-brand step 3).
- Mode: all claims (full run), the changed claims (update), one named line (one-claim request), or claims past their review date (sweep).

## Procedure
1. **Collect.** From `gooseworks:brand_read` kit (full): `approvedClaims`, `proofPoints`, `valueProps`, `tagline`, `description`, `audience`, `creativeAxes`, the knowledge `positioning`, `existingAds` hooks, offers and angles, site lines quoted inside `voice`; product names, descriptions and offers (`product_ids` in batches); `gooseworks:knowledge_search` `source_types: ["claim"]`; the existing brand record's claims tables; anything the owner's documents state as fact. In one-claim mode, only the line asked about plus any approved claim it resembles.
2. **De-duplicate.** One candidate per distinct statement; keep every place it appears (kit, product, ad).
3. **Classify.** Type and risk from the taxonomy. Mark implied claims (names, visuals the owner describes, testimonials implying typical results).
4. **Find proof.** `knowledge_search` `source_types: ["document", "evidence"]` with the claim as the query (snippets only point to a document; read the document itself before calling it proof). Record proof strength. A press quote needs its article URL and date; a rating needs platform, count and capture date; an award needs body, year and category.
5. **Recommend a verdict:** keep / keep with qualifier (write it) / reword (write the safer wording) / needs proof (say exactly what would unlock it) / cut. Fill every field of the claim record except approver and date.
6. **Draft the never-say list** from the rule pack, the platforms the brand uses, and anything the owner has said; each with a safe alternative and a source tag.
7. **Triage, then run the sign-off by risk** (claims-craft.md §4): low-risk batch; medium in visible groups of 3–5; high one at a time for the five or so with most reach; every other high-risk line recorded as not approved yet without asking. Switch to the product-facts-only default the moment the owner signals time pressure. Say once that this is not legal advice. Ask the not-public question once.
8. **Record each answer** with the approver's words verbatim and the date. If the person answering is not the approver, the new lines go to the record's "Decisions needed" sheet to forward (the claims status becomes `pending-client` only if nothing is approved yet; an approved list stays `signed-off`); still record facts they state and pull claims they say are false. In client sign-off mode, map the pasted reply to the sheet's rows and record it with provenance.

## Output (to `atoms/brain-write-back`, which records it in the exact claims-gate §5 format)
- Claims the approver approved, with complete records.
- Candidates not approved: wording, why, what would unlock it, safe alternative.
- Never-say entries with source and alternative; not-public items with dates.
- Value props, tagline, description and audience rewritten so every factual line is an approved claim (for the owner's yes).
- The approver's verbatim words per decision.

## Rules
- A brain label of `approved` is not a sign-off. Only the approver's answer in this step is.
- Never strengthen a claim when rewording. Never invent proof, a study, a number or a customer.
- A claim without proof stays out, however good it sounds.
