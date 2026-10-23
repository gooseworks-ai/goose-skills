# brand-research

Research a brand once, produce a clean **brand-context pack** that every
downstream video/ad skill can read with zero re-work.

It writes a fixed set of files in a fixed shape:

- `brand-research/` — four structured docs (`brand-summary`, `visual-identity`, `competitors`, `audience`), a dated `asset-urls.md`, and a `ui-references.md` when the product has notable UI.
- `brand-assets/manifest.json` — every logo / photo / generated still cataloged with a **name + usage description**, so an agent picks assets by purpose instead of guessing from filenames.
- `concept-brief.md` — concept seeds to kick off production.

The core path (web research + writing the pack) needs **no API keys** — it runs
on your agent's web tools. A FAL key is only needed for the optional step that
generates brand-anchored product/lifestyle stills.

## Quickstart

Paste into Claude Code (or any agent that can run shell + read files):

```
Read ./gooseworks-ads-video/skills/templates/brand-research/SKILL.md and use it to
research Liquid Death (product: Sparkling Water, https://liquiddeath.com) into
./liquid-death. Research-only — no existing ads, skip image generation.

Before starting:
  1. cd into ./gooseworks-ads-video/skills/templates/brand-research
  2. pip install -r requirements.txt   (only python-dotenv is needed for the core path)

Then follow the SKILL.md phases: disambiguate → scaffold → web research (fill all
four brand-research/*.md with the exact headers + asset-urls.md) → source the logo
+ 2–4 reference photos and register each in brand-assets/manifest.json → write
concept-brief.md → run scripts/verify_pack.py and show me the result.
```

More kickoff prompts in [`examples/`](./examples).

## How it works

8 phases with human gates: disambiguate → scaffold → web research → existing-ad
analysis (optional) → source assets → generate stills (optional, FAL) → concept
brief → verify. The run ends on a deterministic `scripts/verify_pack.py` check
that enforces the output contract.

## Scripts

| Script | What it does |
|---|---|
| `scaffold_brand.py` | Create the brand-root layout + stub docs + empty manifest (idempotent). |
| `fetch_asset.py` | Download an asset from a URL into `brand-assets/` and register it. |
| `register_asset.py` | Register a file already on disk into the manifest. |
| `render_product_shot.py` | (Optional, FAL) Generate a brand-anchored still from a reference photo and register it. |
| `verify_pack.py` | Validate the finished pack against the contract; non-zero exit on any problem. |

## The output contract

The filenames, section headers, and manifest schema are normative — downstream
skills read the exact shape. See [`references/output-contract.md`](./references/output-contract.md).

## Part of

[gooseworks-ads-skills](../../../README.md) — GooseWorks' internal ad-production skills.
