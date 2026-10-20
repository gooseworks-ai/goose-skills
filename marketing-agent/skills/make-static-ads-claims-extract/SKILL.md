---
name: make-static-ads-claims-extract
description: >-
  Step of the make-static-ads playbook: pulls every claim-bearing span out of an ad — the copy around the image, the on-image words the composer wrote, badges, and what the picture implies — and keeps or cuts each by the brand-brain rule. Runs before spend on the composed prompt (Pass A) and on every render (Pass B). Run make-static-ads instead; not for direct use.
version: 0.4.2
---

# claims-extract

The rule is hard rule 1: every factual line is a usable fact (`../make-static-ads/references/claims-and-policy.md` §2). This atom is the static-ad extract step.

**Reads:** the copy rows (ad-copy); each ad's composed prompt (compose) for Pass A, or its renders for Pass B; the brain reads from Step 1 (each fact with its status — `../make-static-ads/references/reading-the-brain.md` §1); `../make-static-ads/references/claims-and-policy.md` §1–2 (what counts, tiers, trigger words, the four doors, offers); the product record and real label text.
**Writes:** per ad, the span list with a verdict per span; the per-ad result and the cut list (hand-off and batch file).

1. **Pass A — extract** from each ad before any quote: primary texts, headline, description, CTA, destination; from the composed prompt, every on-image word it asks the model to draw (headline, support line, badge, sticker, quote) and what its scene implies (before/after pairs, glow "results", lab coats, seals, a picture that says the product replaces other products); offer terms.
2. **Pass B — what the model drew:** read the render (by eye, or its automatic read) for words it added or changed, invented "#1", stars, seals, laurels, prices, a competitor's badge carried over from the template, dropped qualifiers and garbled text.
3. **Verdict per span** by the usable-fact table (`claims-and-policy.md` §2): keep it as recorded, keep it only as a quoted and attributed line, or cut it with what would confirm it. Use the tiers and trigger words there to spot spans; a shortened, merged or reworded claim is a new claim.
4. **A cut on-image line → re-compose** that ad (the `make-static-ads-compose` skill (`../make-static-ads-compose/SKILL.md`)) with the Variant brief's message rewritten around usable facts only; the cut words never appear in the brief. Then run Pass A again on the new prompt. A cut copy line → ad-copy rewrites it.
5. **Offers, prices, stock** are checked against the product record and the marketer's words: price with currency, terms not narrowed ("first order" ≠ "first jar"), a real end date, no fake scarcity; two sources that disagree → ask.
6. **A claim the marketer confirms in this chat** is saved in their words through the `save-learning` skill (`../save-learning/SKILL.md`) before it is used (Approval gate 3).

Result per ad in plain words for chat ("safe to say", "cut 'never oily' — nothing on file confirms it; a test or your own confirmation would"); the spans, statuses and cut list in the batch file.
