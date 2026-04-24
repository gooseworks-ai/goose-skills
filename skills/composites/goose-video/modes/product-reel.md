# Mode: product-reel

Delegates to `packs/video-production/product-reel-generator`.

## What it does

Generates Instagram-ready product reels from any e-commerce product page URL. Scrapes product images, classifies by type, generates AI-animated clips via Higgsfield API, creates text overlays with style presets, and composes a 15–20s reel with music.

## When to pick this mode

- User has a product page URL and wants a social-ready reel
- Goal is new asset creation (not repurposing existing video)
- User is okay with AI-generated animated clips (paid API — Higgsfield)

## Required input

- `--source <product-page-url>` — live e-commerce product page (Shopify, WooCommerce, etc.)

## Format support

- `vertical-short` (9:16, default) — TikTok/Reels/Shorts
- `vertical-story` (9:16, 15–30s) — Stories
- `square-social` (1:1) — Instagram/LinkedIn feed

Not supported: landscape formats (sub-skill is tuned for vertical output).

## Style hints

Default: `energetic`. Good alternatives: `minimal`, `cinematic`.

The underlying skill has its own style-preset system. The router translates `goose-video` style slugs into the sub-skill's internal preset flags — see the sub-skill's SKILL.md for the full list.

## Dispatch

Invoke the sub-skill with:

```
product-reel-generator <product-page-url>
  [--aspect-ratio <mapped-from-format>]
  [--style <mapped-from-style>]
  [--brief "..."]
```

## Environment

- `HIGGSFIELD_API_KEY` required
- Python 3.10+ with `librosa`, `Pillow`, `requests`
- FFmpeg on PATH

See `packs/video-production/product-reel-generator/SKILL.md` for full setup.
