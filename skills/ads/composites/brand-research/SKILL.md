---
name: brand-research
description: Kickoff research for a brand you haven't worked on before — web research, existing-ad analysis from the Meta Ad Library, editorial-grammar profiling, sourced + AI-generated brand assets, hook/CTA libraries, and an ad concept brief. Produces one reusable brand-context pack (brand-summary, visual-identity, competitors, audience, existing-ads, brand-grammar, an asset manifest, and a concept brief) in a single pass. Use when starting on a brand the workspace hasn't touched.
tags: [ads, brand, research]
---

# brand-research

## Purpose

Given a brand (name and/or URL) and a product, produce the full creative-prep package for
it: research the product, analyze the brand's running ads, measure their editorial DNA,
source logos and reference photos, generate brand-anchored product + lifestyle imagery, and
write the brand-context documents a downstream ad/video pipeline consumes.

The output is a **brand-context pack** — a self-contained set of artifacts:

- `brand-summary`, `visual-identity`, `competitors`, `audience` — the core brand context.
- `existing-ads` — what the brand's running ads reveal that web research misses.
- `brand-grammar` — the brand's editorial DNA (archetype, pacing, caption style).
- an **asset manifest** cataloging every sourced + generated asset with its kind, name, and
  usage note, plus the binary assets themselves (logos, reference photos, generated stills).
- a **concept brief** of brand-level ad concept seeds.

Everything is written into a single brand-pack directory under `output_dir`.

## Inputs

- `brand` (required) — the brand, used as the pack's folder name, e.g. `amex`, `liquid-death`.
- `product` (required) — the specific product / SKU / offer to research, e.g. "Platinum
  Card", "Sparkling Water". Disambiguates brands with many SKUs.
- `brand_url` (optional) — canonical homepage. Strongly recommended to avoid wrong-entity
  confusion (e.g. Apple band vs. Apple Inc.).
- `output_dir` (optional) — directory to write the brand pack into. Defaults to `./<brand>/`.
  Resolve the location from this input; never hardcode a path.
- `max_existing_ads` (optional, default 10) — cap on how many of the brand's running Meta
  ads to pull for analysis.
- `brand_video_urls` (optional) — the brand's own video URLs (launch films, demos). If
  provided, run `build-brand-clip-library` afterward to cut them into a reusable clip library.
- `concept_count` (optional, default 6–10) — number of social-ad concepts to draft.
- `skip_generation` (optional, default false) — skip image generation and ship research +
  brief only (useful when no image budget is available).

## Composed Atoms

- `source-company-existing-ads` — download the brand's running ads from the **Meta Ad
  Library** (via the Apify FB Ad Library scraper) into a `raw/` folder with provenance.
- `rename-and-index-ads` — watch each downloaded ad, semantically rename it, and write an
  `INDEX.md` (per-ad strategy + cross-ad patterns).
- `analyze-reference-grammar` — measure each ad's editorial DNA (cut points, pacing curve,
  archetype, audio mode) into a per-ad `grammar-profile.json`.
- `source-brand-assets` — scrape logos + reference hero photos from the brand's site / press kit.
- `understand-brand-assets` — distill web research + reference photos into the visual-identity
  content (colors, typography, photography style).
- `analyze-ad-hooks` — extract recurring hooks/motifs from the downloaded ads.
- `generate-ad-concepts` — produce the concept list for the concept brief.
- `create-product-images-higgsfield-product-photoshoot` — 4–6 hero/end-card product stills
  (Higgsfield product-photoshoot on `gpt_image_2`).
- `create-product-images-nanobanana` — 8–12 vertical 9:16 lifestyle stills (Nano Banana Pro).
- External tools: a video-watching capability (frame extraction + transcription — e.g.
  `yt-dlp` + `ffmpeg` + Whisper), and web search + fetch.

## Workflow

1. **Disambiguate.** Confirm `brand` + `product` resolves to one entity. If `brand_url` is
   missing and the name is ambiguous, stop and ask.
2. **Scaffold the brand pack** under `<output_dir>` — a `brand-research/` folder for the
   markdown docs, a `brand-assets/` folder for the asset manifest + binaries (`logos/`,
   `reference-photos/`, `generated-product-shots/`, `generated-lifestyle/`, `songs/`), and an
   `existing-ads/` folder (`raw/` + renamed copies + a `grammar/` subfolder). Only create
   subfolders that will be populated.
3. **Web research** via web search + fetch. Priority order: brand site → trade press
   (Adweek/AdAge/Campaign) → reputable category reviewers. Capture: product overview,
   mechanics/pricing, benefits, target audience, current named campaigns with dates, core
   positioning, voice/tone. Record every URL with its access date.
4. **Pull and study the brand's running ads.** Mandatory — research without watching real
   ads misses how the product is actually shown and talked about.
   - Run `source-company-existing-ads` (`max_ads=max_existing_ads`) to pull the brand's Meta
     Ad Library ads into the `existing-ads/raw/` folder. Manual fallback per that atom's docs.
   - Run `rename-and-index-ads` to produce semantically named copies + an `INDEX.md` (per-ad
     strategy + cross-ad patterns synthesis).
   - **Product deep-dive pass.** Re-watch (or reuse the frame grids) specifically to extract
     product mechanics the website doesn't show: how the product is held, used, applied,
     opened, paired; in-app UI flows that appear on-screen; physical form factors and
     packaging; claims/proof the brand leans on; demographics and contexts of the people
     shown; objections the ads pre-empt. These feed `existing-ads.md` in step 7.
   - **Editorial grammar pass.** Run `analyze-reference-grammar` on each renamed ad. Each run
     emits a `grammar-profile.json` carrying the ad's archetype match + confidence,
     `cuts_per_10s[]`, mean shot length, payoff-hold ratio, audio mode, and aspect. These
     per-ad profiles are the input to `brand-grammar.md` in step 7 — the brand's editorial
     DNA, so a from-scratch ad can inherit the brand's cut rhythm and archetype defaults.
   - If no live ads are found, write the "No live Meta ads found" stub in BOTH
     `existing-ads.md` AND `brand-grammar.md` ("No live Meta ads found as of <date> — grammar
     defaults will be picked at design-brief time") and continue.
5. **Source brand assets** via `source-brand-assets`:
   - Logos: brand press kit or Wikipedia SVG → `brand-assets/logos/`.
   - Reference photos: 2–4 high-quality third-party shots of the product/hero →
     `brand-assets/reference-photos/`. Mark "not licensed for redistribution" in each
     manifest entry's `description`.
   - Songs: if existing ads exist, extract the audio bed of one ad as a tone reference →
     `brand-assets/songs/`.
6. **Generate brand-anchored imagery** (skip entirely if `skip_generation=true`):
   - 4–6 product-photoshoot stills via `create-product-images-higgsfield-product-photoshoot`,
     grounded on the strongest reference photo so the SKU stays consistent →
     `brand-assets/generated-product-shots/`.
   - 8–12 lifestyle stills via `create-product-images-nanobanana` (Nano Banana Pro), 2k
     vertical 9:16, same reference grounding → `brand-assets/generated-lifestyle/`.
   - **Write the asset manifest** — a catalog with one entry per binary asset (every logo,
     reference photo, generated still, song). Each entry records, at minimum, a stable id, the
     asset's path (relative to the brand pack), a `kind`
     (`logo | wordmark | product_photo | lifestyle | video_ref | style_ref | ui_ref | song |
     asset`), a short `name` to search by, and a `description` of how/when to use it plus any
     usage constraint (e.g. "not licensed for redistribution" on scraped photos). A vague
     description defeats the file's purpose. Write it as `brand-assets/manifest.json`.
7. **Write the brand-research docs.** Use these **exact section headers**, filled from
   research — never leave a placeholder marker behind:
   - **`brand-summary.md`** — `What the company sells`, `Who they sell to`, `Why people buy
     (jobs-to-be-done)`, `Brand voice in three words`, `What to never say`.
   - **`visual-identity.md`** — `Primary colors (hex)`, `Typography`, `Logo usage rules`,
     `Photography style`, `Off-limits styles`.
   - **`competitors.md`** — `## Direct` (each competitor: one-line positioning, pricing tier,
     and **how `<brand>` wins / loses vs them**) and `## Reference creative` (links / vibes to
     emulate or avoid).
   - **`audience.md`** — `Primary persona`, `Where they spend time online`, `Objections they
     raise`, `Proof points that land`. Include 3–4 distinct ICP segments and verbatim audience
     phrasing (Reddit/forums) — these become VO seeds downstream.
   - **`existing-ads.md`** — narrative synthesis of what the brand's running ads (step 4)
     reveal that web research misses. Headers: `Ads watched` (count + date range + link to
     `existing-ads/INDEX.md`), `How the product actually shows up on screen`, `Recurring hooks
     and angles`, `Claims and proof the brand consistently leans on`, `Who's shown using it`,
     `Objections the ads pre-empt`, `Voice & caption treatment`, `Implications for new ads`.
     `INDEX.md` stays the per-ad catalog; this file is the synthesized read.
   - **`brand-grammar.md`** — the editorial DNA synthesized from the per-ad
     `grammar-profile.json` files. Headers: `Dominant archetype` (which creator-grammar
     archetype the brand favors — e.g. `creator-talking-head`, `vo-product-demo`,
     `founder-monologue` — with the per-ad split), `Pacing curve` (mean `cuts_per_10s` across
     ads, range, payoff-hold use), `Audio mode` (music-only / vo+music / speech-only mix),
     `Caption family` (burned karaoke / static lower-thirds / on-screen text bursts / none),
     `Hook construction` (first 1.5s pattern), `Defaults for new ads` (recommended archetype +
     `cuts_per_10s` target + caption preset a from-scratch ad should inherit). Human-readable
     seeding, not a machine contract — pick the archetype from a small fixed vocabulary you
     define up front and reuse across brands.
   - **`asset-urls.md`** — every sourced URL with its access date (the provenance trail).
   - **`ui-references.md`** — ONLY if the product has notable in-app/product UI worth
     recreating; catalog the key screens. Omit the file entirely otherwise.
8. **Write `concept-brief.md`** with sections: Observed patterns from existing ads (only if
   step 4 ran), Strategic foundation, Concept ideas (`concept_count`, each with hook + format
   + 15s/30s beat-by-beat + why-it-works + the KPI it serves), Production notes, Open
   questions. This is supplementary brand-level seeding.
9. **Write `brand-research/video-research.json`** — a machine-readable companion that mirrors
   the deep-research findings from `existing-ads.md` + `brand-grammar.md` so a host can ingest
   them without parsing prose. Shape: `{ competitors:[{name,relationship,notes}],
   existingAds:{count,source,recurringHooks[],recurringClaims[],talentProfile,
   objectionsPreempted[]}, grammar:{dominantArchetype,cutsPer10s,audioMode,captionFamily,
   hookConstruction}, hooks:[{line,archetype,sourceAds[]}], ctas:[{line,intent,sourceAds[]}] }`.
   Omit fields you don't have; write the file only when ≥1 ad was analyzed (skip on the "no
   live ads" path). The markdown docs stay the human-readable source; this is their structured
   echo.

## Decision Rules

- Refuse to proceed without a disambiguated brand+product. Don't guess between two entities
  sharing a name.
- If a generated product image trips a provider safety flag, fall back to the alternate model
  (`gpt_image_2` → `nano_banana_2`).
- All generated imagery must use the same reference photo so the SKU is consistent across the
  asset library.
- Never claim licensed rights to scraped reference photos. Always note "not licensed for
  redistribution" in that asset's `description` in the manifest.
- If the image-generation budget is too low, emit a warning, skip generation, and still ship
  the research docs + concept brief.
- If the existing-ads pull returns zero live ads (or all downloads fail), do not fabricate ad
  observations — stub `existing-ads.md` per step 4 and omit the "Observed patterns" section of
  the concept brief.
- This skill produces research, sourced assets, generated imagery, and a concept brief. It
  does NOT clip the brand's own videos. When the brand has its own footage worth reusing (or
  `brand_video_urls` is provided), run the sibling molecule `build-brand-clip-library`.

## Output

The brand-context pack:
- `brand-research/brand-summary.md`
- `brand-research/visual-identity.md`
- `brand-research/competitors.md`
- `brand-research/audience.md`
- `brand-research/existing-ads.md`
- `brand-research/brand-grammar.md`
- `brand-research/asset-urls.md`
- `brand-research/video-research.json` (structured echo of existing-ads + brand-grammar; only when ≥1 ad was analyzed)
- `brand-research/ui-references.md` (only when the product has notable UI)
- `brand-assets/` — the asset manifest + populated `logos/`, `reference-photos/`, and
  (unless skipped) `generated-product-shots/`, `generated-lifestyle/`, `songs/`
- `existing-ads/` — `raw/` originals, semantically renamed copies, `INDEX.md`, and
  `grammar/<slug>/grammar-profile.json` per ad
- `concept-brief.md`

## Quality Checks

- All six required `brand-research/*.md` files (`brand-summary`, `visual-identity`,
  `competitors`, `audience`, `existing-ads`, `brand-grammar`) exist with **no remaining
  placeholder markers** and use the exact section headers above.
- `existing-ads.md` and `brand-grammar.md` either reference a populated `INDEX.md` + per-ad
  `grammar-profile.json` files (≥1 ad watched) or carry the explicit "No live Meta ads found"
  stub — never silently empty.
- `brand-grammar.md` names a `Dominant archetype` that maps to one of the fixed creator-grammar
  archetypes and gives concrete numeric `cuts_per_10s` defaults (not "fast" / "snappy" prose).
- `existing-ads/` contains `raw/` originals, renamed copies, an `INDEX.md` whose per-ad blocks
  were filled by watching the files (not guessed from filenames), and per-ad
  `grammar-profile.json`.
- `asset-urls.md` cites real, dated sources for every research claim and sourced asset.
- The asset manifest parses, has one entry per binary asset on disk — every `path` is relative
  to the brand pack and resolves to a real file; every `kind` is in the allowed enum; no entry
  is missing `name`/`description`.
- The concept brief references specific moments from each analyzed existing ad (when step 4 ran).
- Generated imagery is visibly the same SKU end-to-end (same colorway, finish, branding).

## Failure Modes

- Brand name collides with another entity and `brand_url` was not provided → refuse.
- Brand press kit is unavailable and no acceptable third-party reference photos exist → flag
  and stop before image generation.
- Image-generation budget too low → warn, skip step 6 cleanly, still ship the research +
  concept brief.
- The existing-ads pull is blocked by the Meta Ad Library (rate limit / scraper auth) → fall
  back to the manual browser/curl path documented in that atom; if still empty, write the "no
  live ads" stub in `existing-ads.md` and continue rather than halting.
- Individual downloaded ad files are unreadable → log each failure in `INDEX.md`, skip that
  file, continue.
