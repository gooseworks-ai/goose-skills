---
name: make-static-ads-claims-extract
description: >-
  Step of the make-static-ads playbook: pulls every claim-bearing span from an ad's copy, image text
  and visual for the claims gate. Run make-static-ads instead; not for direct use.
version: 0.1.0
---

# claims-extract

The verdict on each span — keep, rewrite, cut, the scoped sign-off when nothing is signed — is the `claims-gate` skill (`../claims-gate/SKILL.md`). This atom is the static-ad extract step that feeds it.

**Reads:** the copy rows and prompt fences (Pass A) or the renders (Pass B); `../make-static-ads/references/claims-and-policy.md` §1 (trigger words, the four doors, offers); the product record and real label text.
**Writes:** a span list per ad for the claims gate; afterwards the per-ad result and the cut list (hand-off and batch file).

1. **Extract** from each ad: primary texts, headline, description, on-image hook and proof line, the prompt fence, badges and marks, offer terms, and what the visual implies (before/after pairs, glow "results", lab coats, seals, a picture that says the product replaces other products).
2. **Pass B adds what the model drew:** read the render (by eye, or its automatic read) for invented "#1", stars, seals, laurels, prices, extra words, a competitor's badge carried over from the template, and garbled text.
3. **Hand the spans to the claims gate.** It classifies each against the contract and returns keep / rewrite / cut with restore-proof. A rewrite is re-extracted.
4. **Offers, prices, stock** are checked against the product record and the marketer's words: price with currency, terms not narrowed ("first order" ≠ "first jar"), a real end date, no fake scarcity; two sources that disagree → ask.
5. **Campaign concepts:** proof is a signed claim the server accepts, else a plain product fact.

Result per ad in plain words for chat ("safe to say", "cut 'never oily' — needs approval"); claim references and the cut list in the batch file.
