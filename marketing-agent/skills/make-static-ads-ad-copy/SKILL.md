---
name: make-static-ads-ad-copy
description: >-
  Step of the make-static-ads playbook: writes the copy the platform shows around each image — two primary texts, headline, description, CTA, destination — and the hook and angle direction that goes into the ad's Variant brief, in the brand's voice and the customers' own words, within what the brand brain allows. The on-image words are written by the composer, not here. Run make-static-ads instead; not for direct use.
version: 0.4.2
---

# ad-copy

**Reads:** the concept grid (concept-grid), brand voice, banned words and tone from `gooseworks:brand_read` `kit` and the `do`/`dont` voice rules, the voice-of-customer bank (`../make-static-ads/references/reading-the-brain.md` §2), the brain facts with their statuses (§1), `../make-static-ads/references/angles-and-hooks.md` §5–6, `../make-static-ads/references/formats-and-placements.md` §4.
**Writes:** a copy row per ad.

1. **Mine the customer words** for this angle from the bank's rows (cite row ids): pain phrases, desired outcome in their words, objections, switching stories. Keep their syntax. Customer words may supply the *pain*; the *benefit* must be a usable fact (`../make-static-ads/references/claims-and-policy.md` §2).
2. **Hook direction for the Variant brief.** Write 3–5 hook candidates per ad from different hook formulas (`angles-and-hooks.md` §5); keep the strongest as the ad's hook direction and rank the rest as spares. The direction goes into the ad's Variant brief message (the `make-static-ads-compose` skill (`../make-static-ads-compose/SKILL.md`)); the composer writes the final on-image words from it. A real review or founder line meant to appear verbatim is passed as a quote with its source — a borrowed phrase must not pose as a quote.
3. **Primary text × 2:** short (hook + the concept's proof + CTA, inside ~125 characters) and longer (story or objection handling). The hook leads both. After compose, check neither repeats the on-image words word for word.
4. **Headline** (benefit or offer, not the brand name), **description** (offer terms, shipping — only if true), **CTA** matched to awareness, **destination** (the page that keeps the ad's promise).
5. **Voice pass:** read it against the kit's do/don't lines and banned words. Read it aloud: does it sound like the brand, and like a person?
6. **Policy-safe phrasing from the start:** no "you/your" + condition; third person or situation framing instead ("for skin that feels tight by noon").

Output per ad: hook direction, spare hooks (ranked — copy-variants uses them), primary text A/B, headline, description, CTA, destination, hook source (evidence id or "brand-written"), the brain facts used with their status.
