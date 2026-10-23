---
name: make-static-ads-claims-extract
description: >-
  Step of the make-static-ads playbook: pulls every claim-bearing span out of an ad — the copy around the image, the on-image words in the prompt, badges, and what the picture implies — and keeps or cuts each by the brand-brain rule. Runs before spend on the finished prompt (Pass A) and on every render (Pass B). Run make-static-ads instead; not for direct use.
version: 0.8.0
---

# claims-extract

The rule is hard rule 1: every factual line is a usable fact (`../make-static-ads/references/claims-and-policy.md` §2). This atom is the static-ad extract step.

**Reads:** the copy (ad-copy); each ad's finished prompt (compose) for Pass A, or its renders for Pass B; the brain reads from Step 1 (each fact with its status — `../make-static-ads/references/reading-the-brain.md` §1); `../make-static-ads/references/claims-and-policy.md` §1–2 (what counts, tiers, trigger words, the four doors, offers); the product record and real label text.
**Writes:** per ad, the span list with a verdict per span; the per-ad result and the cut list (hand-off and batch file).

1. **Pass A — extract** from each ad before any quote: primary texts, headline, description, CTA, destination; from the prompt, every on-image word it asks the model to draw (headline, support line, badge, sticker, quote) and what its scene implies (before/after pairs, glow "results", lab coats, seals, a picture that says the product replaces other products); offer terms.
2. **Pass B — what the model drew:** read the render (by eye, or its automatic read) for words it added or changed, invented "#1", stars, seals, laurels, prices, a badge carried over from a reference, dropped qualifiers and garbled text.
3. **Verdict per span** by the usable-fact table (`claims-and-policy.md` §2): keep it as recorded, keep it only as a quoted and attributed line, or cut it with what would confirm it. Use the tiers and trigger words there to spot spans; a shortened, merged or reworded claim is a new claim. A brand-voice headline may express a plain product fact's meaning if it adds nothing (no number, result, scope or promise); an approved claim, number or regulated word is used verbatim.
4. **A cut on-image line → rewrite** that ad's copy and prompt (the `make-static-ads-compose` skill (`../make-static-ads-compose/SKILL.md`)) around usable facts only; the cut words never appear in the new prompt. A scene that implies the cut claim changes too. Then run Pass A again. A cut copy line → ad-copy rewrites it.
5. **Offers, prices, stock:** as `../make-static-ads/references/claims-and-policy.md` §2 says. A translated ad is a new ad for this check.
6. **A claim the marketer confirms in this chat** counts only as the `claims-gate` skill's sign-off records it (`../claims-gate/SKILL.md` §4).

Result per ad in plain words for chat ("safe to say", "cut 'never oily' — nothing on file confirms it; a test or your own confirmation would"); the spans, statuses and cut list in the batch file.

**Done:** every span has keep, quote or cut; no cut words remain in any prompt or copy.
