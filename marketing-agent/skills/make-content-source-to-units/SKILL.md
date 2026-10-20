---
name: make-content-source-to-units
description: >-
  Step of the make-content playbook: mines one finished asset into scored quotable units and maps a
  different lead unit to each platform. Run make-content instead; not for direct use.
version: 0.1.0
---

# Source to units

Input: the full text or transcript of one finished asset (`../make-content/references/repurposing.md` §1 says how to get it in). Read it completely before mining. Never mine from a summary.

## Output table

```
Source: <title> · <link or media_asset_id> · <length/duration>
| # | Type | Anchor (verbatim, ≤25 words) | Where (timestamp / ¶) | Alone | Charge | Novel | Proof | Total | Best homes |
|---|------|------------------------------|-----------------------|-------|--------|-------|-------|-------|------------|
```

- **Type:** claim · contrarian take · story · stat · quote · framework/steps · mistake+fix · before/after · objection+answer · audience Q · demo moment.
- **Scores (1–3):**
  - **Alone:** makes sense without the rest of the source.
  - **Charge:** surprise, tension, humour or stakes.
  - **Novel:** says what competitors don't.
  - **Proof:** 3 if an approved claim or a real number in the source backs it; 1 if it is opinion only. Opinion is fine for a contrarian take, but it must be the speaker's.
- Mine 15–30 units from a long source and 5–10 from a short one. Drop units scoring ≤6.
- **A short or silent clip** (a 10–30s product video, often with an empty transcript) holds 2–4 units: its caption, its on-screen text, and what the scenes show (`media_analyze` gives `visible_text` and the scene descriptions). Say so plainly: it supports 2–3 versions at most, not "every platform". Ask whether a longer asset exists (a founder interview, a webinar, an article) before stretching a thin source into filler.
- A stat in the source is still a claim. If it is about the brand and not on the approved list, keep the unit but mark "stat needs approval". The claims check will cut or soften it.
- Spoken quotes stay verbatim, attributed to the speaker as named in the source. Never tidy a quote. On-screen text that came from OCR (`visible_text`) is text, not a quote: fix obvious OCR errors and never put it in quote marks.
- **Sources under ~30s:** rank the units instead of applying the ≤6 cut-off, and keep the top 2–4. If fewer than 3 units score 7 or more, recommend a richer asset before writing, naming one from the brand's own posts if you can (e.g. one with speech). Then let the human choose.

## Then map

For each platform the brand uses, pick the lead unit by the map in `../make-content/references/repurposing.md` §3. No two versions share a lead unit. When strong units outnumber platforms, a platform can take two surfaces (e.g. carousel + Reel). If the source has fewer strong units than the brand has platforms, say so and make fewer, better versions rather than filler.
