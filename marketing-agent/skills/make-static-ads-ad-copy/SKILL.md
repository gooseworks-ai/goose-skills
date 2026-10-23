---
name: make-static-ads-ad-copy
description: >-
  Step of make-static-ads: compare hook alternatives, then write exact image copy and the surrounding ad copy from the chosen reason and usable facts. Run make-static-ads instead; not for direct use.
version: 0.5.1
---

# ad-copy

**Read:** the selected reason/persona/proof, customer language and brand voice/rules in run.json and brand context. **Write:** ranked hooks and exact_copy in the selected ad row; primary texts, headline, description, CTA and destination in the batch record. Use `../make-static-ads/references/workflow.md` for the shared record shape.

1. Mine cited customer language for the situation/tension. A customer's words about a problem do not establish a product benefit. Real attributed review/founder lines retain their wording, source and applicable permission.
2. Write3–5 distinct hook candidates per fresh ad from different formulas. Compare the actual lines against this buyer's tension, supported proof and chosen visible event. Explain why the winner beats its strongest rival: what each makes the buyer notice or understand, and what each loses or risks. “More direct” needs the specific words and meaning that make it so; formula labels and reasons that could be pasted onto every ad do not settle the ranking. Repair weak rivals before choosing. Preserve spares and put rank1 into creative_direction.exact_copy. `angles-and-hooks.md` §5–6 is available when exploring a hook family.
3. Write primary text A (short: hook, supported proof, CTA) and B (story/objection). Develop B from this ad's particular moment or unanswered buying question, using only usable facts; a longer feature restatement is not a story or objection answer. Keep it short when the evidence supports no further development. Do not merely repeat image copy. Add headline, true description/offer terms, CTA appropriate to awareness and the destination that keeps the promise.
4. Check brand voice/banned words and policy-sensitive framing. A benefit needs usable support; a hypothetical scene remains labelled. No generated person becomes a customer or endorser.

A deliberately textless request uses exact_copy[] and copy_intent:no_added_text; do not invent hooks to fill a form. Copy-only requests preserve the approved picture and use the user's requested scope. Claims review happens on the exact composed result before quoting, again on drawn text after rendering.
