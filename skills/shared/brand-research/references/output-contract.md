# Output contract — the brand-context pack

Every run produces this exact shape at the brand root. Downstream video skills
read it, so the filenames, headers, and manifest schema are normative — don't
improvise alternatives.

```
<brand>/
├── brand-research/
│   ├── brand-summary.md       # headers below — all filled, no TBD/TODO
│   ├── visual-identity.md
│   ├── competitors.md
│   ├── audience.md
│   ├── asset-urls.md          # every sourced URL + access date
│   └── ui-references.md       # ONLY if the product has notable UI; else omit
├── brand-assets/
│   ├── manifest.json          # the asset catalog (schema below)
│   ├── logos/
│   ├── reference-photos/
│   ├── generated-product-shots/   # optional (image step)
│   └── generated-lifestyle/       # optional (image step)
├── concept-brief.md           # supplementary concept seeds
└── ad-runs/                   # empty; for downstream per-ad work
```

## Required markdown headers (exact)

These match the section headers most agents/apps scaffold, so a researched file
is a drop-in replacement for an empty stub.

**brand-summary.md**
- `## What the company sells`
- `## Who they sell to`
- `## Why people buy (jobs-to-be-done)`
- `## Brand voice in three words`
- `## What to never say`

**visual-identity.md**
- `## Primary colors (hex)`
- `## Typography`
- `## Logo usage rules`
- `## Photography style`
- `## Off-limits styles`

**competitors.md**
- `## Direct` — each competitor: one-line positioning, pricing tier, and **how `<brand>` wins / loses vs them**
- `## Reference creative` — links / vibes to emulate or avoid

**audience.md**
- `## Primary persona`
- `## Where they spend time online`
- `## Objections they raise`
- `## Proof points that land`
- Include 3–4 distinct ICP segments and **verbatim audience phrasing** (from Reddit/forums/reviews) — these become VO seeds.

## brand-assets/manifest.json schema

```json
{
  "schemaVersion": "1.0.0",
  "updatedAt": "2026-05-29T00:00:00Z",
  "projectId": "Acme",
  "assets": [
    {
      "id": "brand-asset-<hex>",
      "path": "brand-assets/logos/wordmark-black.svg",
      "kind": "wordmark",
      "name": "Wordmark (black on transparent)",
      "description": "Composite in end cards via PIL/ffmpeg; never AI-render. Min height 36px.",
      "addedAt": "2026-05-29T00:00:00Z"
    }
  ]
}
```

- `kind` ∈ `logo | wordmark | product_photo | lifestyle | video_ref | style_ref | ui_ref | song | asset`
- `path` is **relative to the brand root**, never absolute.
- `name` is the short label an agent searches by; `description` is *how/when to use it* + any constraint (e.g. "not licensed for redistribution" on scraped photos). A description that just restates the filename defeats the file's purpose.

## Why a manifest, not a README

Agents otherwise scan `brand-assets/` and guess purpose from filenames — lossy
(`IMG_2384.png` says nothing). The manifest's `name` + `description` give every
asset an explicit, searchable purpose. `scripts/verify_pack.py` enforces that
every file on disk has a manifest entry and vice versa.
