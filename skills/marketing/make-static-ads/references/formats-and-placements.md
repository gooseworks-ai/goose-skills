# Formats and placements — ratios, safe zones, copy limits

Specs below are conventions as of 2026; platforms change them. When a number decides whether an ad works, say "check the live ads guide". Never state performance numbers (CTR, CPA, ROAS) as facts.

## 1. Placements, ratios, safe zones

| Platform / placement | Ratio | Notes |
|---|---|---|
| Meta feed (FB/IG) | 4:5 preferred, 1:1 OK | Min 1080 px short side |
| Meta Stories / Reels | 9:16 | Safe zones: `prompts.md` §4. Re-lay out for 9:16, never centre-crop a 4:5 |
| TikTok image ads | 9:16 | Right rail and bottom caption zone are covered |
| LinkedIn single image | 1:1, 1.91:1 (4:5 also on mobile) | 1.91:1 is not a render ratio — use 16:9 and flag |
| Google Demand Gen / Display | 1.91:1, 1:1, 4:5 | Google's image rules: no text/logo overlay over ~20% of the image, no gimmicky caps or symbols |
| Pinterest | 2:3 | Not a render ratio — use 3:4 and flag |
| Email header (graphic request) | ~600–1200 px wide, roughly 2:1 or 3:1 | Not a render ratio — use 16:9 and flag (the email tool crops or scales); mobile-legible; check dark mode |
| Blog / OG image | 1200×630 (~1.91:1) | Use 16:9 and flag |

**Render ratios** (`gooseworks:ads_render`): `1:1`, `4:5`, `9:16`, `16:9`, `3:4`. Each ratio is its own prompt and its own call (`prompts.md` §4): one dry run per ad and ratio. Extra placements on an approved render (LinkedIn or Google landscape, a 9:16 added later): a new prompt for that ratio and a quoted `ads_render` call, judged like any render (the `make-static-ads-render-review` skill (`../../make-static-ads-render-review/SKILL.md`)). Unpriced edits: `engine-notes.md`.

## 2. Copy limits (visible before truncation, approximate)

| Platform | Primary / intro text | Headline | Description |
|---|---|---|---|
| Meta | ~125 characters | ~27–40 | ~25–30 (often hidden) |
| LinkedIn | ~150 | ~70 | — |
| Google Demand Gen | — | 40 | 90 |
| TikTok | ~100 | — | — |

On-image text: each line readable at 375 px wide; qualifiers legible.

Meta flexible ads take up to ~10 media and ~5 primary texts/headlines per ad, so a set can be handed over as one flexible ad per angle — mention it to run-paid-campaigns as an option; the structure is theirs to choose.
