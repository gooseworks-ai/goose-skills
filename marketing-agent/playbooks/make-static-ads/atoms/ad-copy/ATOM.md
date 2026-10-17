---
name: ad-copy
description: Internal step of make-static-ads. Writes every ad's on-image hook and the copy around the image — two primary texts, headline, description, CTA, destination — in the brand's voice and the customers' own words, within the approved claims.
---

# ad-copy

**Reads:** the grid (angle-grid), brand voice, banned words and tone from `gooseworks:brand_read` `kit` and the `do`/`dont` voice rules, the voice-of-customer bank (`references/reading-the-brain.md` §2), the signed claims (§1), `references/angles-and-hooks.md` §5–6, `references/formats-and-placements.md` §4.
**Writes:** a copy row per ad.

1. **Mine the customer words** for this angle from the bank's rows (cite row ids): pain phrases, desired outcome in their words, objections, switching stories. Keep their syntax. Quote cards use own-customer rows only. Customer words may supply the *pain*; the *benefit* must come from an approved claim or product fact.
2. **On-image hook** (≤ 8 words): one message, concrete nouns and numbers, tension not feature. Write 3–5 candidates per hook slot from different hook formulas; keep the strongest. A borrowed phrase must not pose as a quote; a quote card uses a real review verbatim with its source.
3. **Optional proof line** on the image: a signed claim verbatim (with its qualifier if it has one) — a signed press quote keeps its outlet.
4. **Primary text × 2:** short (hook + one proof + CTA, inside ~125 characters) and longer (story or objection handling). The hook leads both; neither repeats the image text word for word.
5. **Headline** (benefit or offer, not the brand name), **description** (offer terms, shipping — only if true), **CTA** matched to awareness, **destination** (the page that keeps the ad's promise).
6. **Voice pass:** read it against the kit's do/don't lines and banned words. Read it aloud: does it sound like the brand, and like a person?
7. **Policy-safe phrasing from the start:** no "you/your" + condition; third person or situation framing instead ("for skin that feels tight by noon").
8. **Write the prompt fence** for each ad: the exact on-image words in quotes, the one message, and "no other text, badges, ratings, seals, prices or logos except the brand's".

Output per ad: hook, proof line, primary text A/B, headline, description, CTA, destination, hook source (evidence id or "brand-written"), claim ids used, prompt fence.
