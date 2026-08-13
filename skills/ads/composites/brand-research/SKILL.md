---
name: brand-research
description: Research a company or brand from its website and produce a reusable Brand Core covering products, audience, competitors, positioning, offers, messaging evidence, voice, and visual identity. Use before growth, ad, content, creator, or product work when reliable brand context is missing.
tags: [ads, brand, research]
---

# Brand Research

Build a sourced **Brand Core** that future research, analysis, and creative workflows can reuse without rediscovering the company every time.

The required path is research-only and works with local files. GooseWorks sync, ad imports, and paid asset generation are optional extensions—not prerequisites for a complete result.

## Inputs

- `website` — required canonical company or brand website.
- `focus` — optional product, collection, market, or campaign to prioritize.
- `output_dir` — optional; defaults to a clearly named local brand folder.
- `depth` — `quick` or `full` (default `full`).
- `sync_to_gooseworks` — optional, default false.
- `include_existing_ads` — optional, default true in full mode.
- `generate_assets` — optional paid extension, default false.

## Brand Core output

Create:

```text
brand-core/
  summary.md
  products.md
  audience.md
  competitors.md
  positioning-and-offers.md
  messaging.md
  visual-identity.md
  sources.md
  brand-core.json
```

Use local paths that work outside GooseWorks. `brand-core.json` is a structured echo for other agent skills; the Markdown remains the human-readable source of truth.

## Workflow

### 1. Resolve the entity

Open the provided website and confirm the company name, canonical domain, market, and focus product. If the site is inaccessible or the identity remains ambiguous, ask for the minimum clarification instead of researching the wrong entity.

### 2. Research the first-party source

Review the homepage, product/collection pages, about page, pricing or offer pages, FAQ, policies, store navigation, social links, and press/brand resources. Capture:

- what the company sells and how the catalog is organized;
- prices, offers, bundles, guarantees, subscriptions, and availability;
- product claims, ingredients/materials, use cases, and differentiators;
- stated audiences and customer outcomes;
- brand voice, visual system, proof, and trust markers.

Do not turn marketing claims into facts. Label them as brand-stated claims until corroborated.

### 3. Research audience evidence

Use reviews, forums, search, social posts, and comments to identify pains, desired outcomes, triggers, objections, alternatives, product language, and use contexts. Preserve short representative language with source links. Use `comment-mining` for relevant public social threads.

### 4. Map competitors

Identify direct competitors, substitutes, and reference brands. For each, record positioning, key offer, price band when visible, proof style, and how the focus brand plausibly wins or loses. Separate a verified competitor from a likely competitor inferred from category overlap.

### 5. Inspect current creative when useful

In full mode, use `competitor-ad-intelligence` with the brand as advertiser to inspect current Meta, Google, or LinkedIn ads through ScrapeCreators. Extract recurring hooks, offers, proof, product presentation, formats, CTAs, and landing destinations. Do not infer spend or conversion performance from ad-library presence.

### 6. Synthesize the Brand Core

Write:

- `summary.md`: company, category, markets, business model, brand promise, voice in three words, and important unknowns.
- `products.md`: product/collection catalog with source URL, price/offer, claims, use cases, and priority.
- `audience.md`: audience segments, jobs-to-be-done, triggers, pains, objections, alternatives, and exact sourced language.
- `competitors.md`: direct competitors, substitutes, reference brands, positioning comparison, and evidence.
- `positioning-and-offers.md`: value proposition, differentiators, offers, proof, guarantees, and gaps.
- `messaging.md`: repeated claims, hooks, objections, proof points, CTAs, useful angles, and what the brand should not say.
- `visual-identity.md`: logo use, colors, typography when identifiable, photography, layout, product presentation, and off-brand patterns.
- `sources.md`: URL, access date, source type, and which claims it supports.

### 7. Confirm uncertainty

Show a concise confirmation summary: company, priority products/services, audience, likely competitors, offers, and messaging angles. Mark low-confidence findings and ask only about material gaps.

### 8. Optional GooseWorks sync

Only when requested and the GooseWorks MCP tools are available:

1. Reuse an existing brand when the domain matches; otherwise create one.
2. Import the ecommerce catalog through the existing product import tools when relevant.
3. Update the Brand Kit/Core using only confirmed findings.
4. Never overwrite stronger first-party brand data without showing the change.

The local Brand Core remains usable even if sync fails.

### 9. Optional paid assets

Asset generation is never required to finish brand research. If the user explicitly asks:

- use `product-photoshoot` for product photography;
- use `goose-graphics` for branded graphics;
- quote credits and confirm before any paid generation.

## `brand-core.json`

```json
{
  "brand": {"name":"","website":"","category":"","markets":[]},
  "products": [{"name":"","url":"","price":"","claims":[],"offers":[]}],
  "audiences": [{"segment":"","jobs":[],"pains":[],"objections":[],"language":[]}],
  "competitors": [{"name":"","url":"","relationship":"direct|substitute|reference","evidence":""}],
  "positioning": {"promise":"","differentiators":[],"proof":[],"offers":[]},
  "messaging": {"hooks":[],"angles":[],"claims":[],"ctas":[],"never_say":[]},
  "visual_identity": {"colors":[],"typography":[],"photography":[],"off_limits":[]},
  "sources": [{"url":"","accessed_at":"","supports":[]}],
  "unknowns": []
}
```

Omit unknown values rather than inventing them.

## Quality checks

- Every material claim is attributable to a source or clearly labeled as an inference.
- Products and offers match the live site and include canonical URLs.
- Audience conclusions include customer evidence, not only brand copy.
- Competitors are classified as verified or inferred.
- Messaging angles trace back to repeated evidence.
- No paid generation ran without explicit confirmation.
- The local output is complete even when GooseWorks is not connected.
