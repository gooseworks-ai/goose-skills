# PIPELINE.md — config fields → scripts

These are the **validated Mother Science reference scripts**, ported verbatim from the
deprecated `gooseworks-ads-skills` molecule. They are hard-coded with Mother Science
specifics (product names, T2V prompts, brand copy). `config.example.json` documents the
worked example; parameterize the hard-coded values per brand (product handles → CLI args,
prompts → templates with brand-fill slots, music brief → input).

## Execution order

```
1. strip_product_backgrounds.py    # birefnet-v2 on raw PDP PNGs        (~$0.02/SKU)
2. fire_t2v_variants.py            # T2V BG fallback, 2 concepts × 3 models (~$7-10)
   # ── OR source the BG from Pexels first (free) and drop it into source/t2v-outputs/ ──
3. render_overlays.py              # PIL+rsvg cold-open + annotated end card (free)
4. composite_variants.py           # ffmpeg composite all variants          (free)
5. music_and_mux.py                # ElevenLabs bed + separate-pass mux      (~$0.40)
```

## Project layout the scripts assume

Each script anchors paths via `Path(__file__).resolve().parent.parent`, i.e. it expects
to run from a `<project>/working/` (or `scripts/`) dir with siblings:

```
<project>/
├── source/scraped-product-images/   # input PDP PNGs (→ strip)
├── source/t2v-outputs/              # BG variants — T2V outputs OR Pexels clips
├── assets/product-cutouts/          # birefnet outputs
├── assets/fonts/                    # Boska-Black.ttf, SpaceGrotesk-{Medium,SemiBold}.ttf
├── assets/end-cards/                # brand logo SVG (cream + white variants)
├── assets/text-overlays/            # cold-open + end-card PNGs
├── assets/music/                    # ElevenLabs raw + processed
└── finals/                          # output mp4s
```

## Field → script map

| config field | consumed by | how |
|---|---|---|
| `products[]` | `strip_product_backgrounds.py` (`PRODUCTS`) | filenames in `source/scraped-product-images/` → birefnet → `assets/product-cutouts/` |
| `cutouts.model` | `strip_product_backgrounds.py` | `fal-ai/birefnet/v2` endpoint; alpha validated ≥20% transparent, ≤8% partial |
| `bg_source`, `pexels.*` | (operator, Phase 1) | **try Pexels first**; on failure, run `fire_t2v_variants.py`. Drop Pexels clips into `source/t2v-outputs/<slug>.mp4` so the composite is source-agnostic |
| `bg_concepts[]`, `bg_model_set` | `fire_t2v_variants.py` (`JOBS`, `PROMPT_*`) | 2 concepts × 3 models fired in parallel; per-model prompt tuning |
| `bg_negative_prompt` | `fire_t2v_variants.py` (`NEGATIVE_PROMPT`) | bans slow-mo/cuts/text/product/people |
| `bg_dim.heavy` / `.light` | `composite_variants.py` (`BG_PROCESS_ALPHA` / `BG_PROCESS_BETA`) | palette-aware `eq=` dim per concept family |
| `cold_open_text`, `cold_open_font`, `cold_open_size_px` | `render_overlays.py` (`render_cold_open_card_9x16`) | Boska Black, dead-center, cream |
| `end_card.*` | `render_overlays.py` (`render_end_card_annotated_9x16`) | `rsvg-convert -w 2400` on the logo SVG → autocrop → resize; Space Grotesk annotations; `logo_variant` picks cream vs white |
| `beat_timing.*` | `composite_variants.py` (`enable='between(t,a,b)'`) | overlay windows per beat |
| `aspect_ratio`, `width`, `height`, `fps`, `duration_s` | `composite_variants.py` (`W,H,DURATION`) | canvas + encode; width-anchored cutout scale |
| `music.*` | `music_and_mux.py` (`MUSIC_BRIEF`, `loudnorm`) | ElevenLabs bed → loudnorm → mux with `-map 0:v:0 -map 1:a:0` |

## Known external dependencies (not in this folder)

- **`fal_helpers`** — `strip_product_backgrounds.py`, `fire_t2v_variants.py`, and
  `music_and_mux.py` do `sys.path.insert` into a shared atoms dir
  (`../../../skills/atoms/_shared`) and `from fal_helpers import download, load_fal_key,
  subscribe, upload_file`. That path was correct in the source repo's molecule tree; in
  content-goose provide `fal_helpers` on `PYTHONPATH` (a thin wrapper over `fal_client`:
  `load_fal_key()` sets `FAL_KEY=FAL_API_KEY`; `subscribe/upload_file/download` wrap the
  `fal_client` calls). Not shimmed here to keep the port verbatim.
- **Higgsfield CLI** at `/opt/homebrew/bin/higgsfield` — Veo 3.1 (`fire_veo`). Optional if
  the BG comes from Pexels/Kling/Seedance.
- **`rsvg-convert`** (Homebrew `librsvg`) — brand logo SVG → PNG in `render_overlays.py`.
- **Fonts** — `Boska-Black.ttf` + `SpaceGrotesk-{Medium,SemiBold}.ttf` must be present in
  `assets/fonts/` (source from Fontshare / fontsource CDN — GitHub raw URLs return HTML,
  not TTF).

## Cost lever (why Pexels-first)

`fire_t2v_variants.py` (2×3 comparison) is the dominant cost (~$7 of a ~$8 run). Sourcing
the BG from free Pexels stock instead — and dropping the clip straight into
`source/t2v-outputs/` — reduces a run to ~$0.66 (cutouts + music), validated on Clinikally.
Try Pexels first; fall back to T2V only when stock coverage fails.
