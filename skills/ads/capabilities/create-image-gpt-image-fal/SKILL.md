---
name: create-image-gpt-image-fal
description: Generate a single photoreal or designed image with OpenAI gpt-image via fal.ai. Supports gpt-image-1 (default, fixed sizes — the FAL fallback for Higgsfield's `gpt_image_2`) and gpt-image-2 (`openai/gpt-image-2`, custom output sizes up to 3840px). Routes to text-to-image or the edit variant depending on whether a reference image is provided. Use for photoreal character anchors, scene keyframes, and designed sheets (e.g. storyboards) where precise layout and legible text matter.
---

# create-image-gpt-image-fal

## Purpose

Generate one image via fal.ai's OpenAI gpt-image endpoints. Two model families are supported through a single `--model` flag:

- **`gpt-image-1`** (default) — `fal-ai/gpt-image-1`. The FAL fallback for Higgsfield's `gpt_image_2`. Fixed output sizes only. Used by:
  - `video-orchestrator/lock-character` Phase 0 (anchor portrait) and Phase 1 (angle keyframes via `/edit`)
  - `video-orchestrator/create-clips` Phase 1 for photoreal scenes
  - the orchestrator's `generate_with_fallback.py` router on Higgsfield failure
- **`gpt-image-2`** — `openai/gpt-image-2`. The newer model; accepts **custom output sizes** (any multiple of 16, up to 3840px) and renders dense text/layouts well. Used for designed sheets such as ad storyboards (`create-storyboard-sheets-fal`).

The default stays `gpt-image-1` so existing callers and the lock-character anchor-parity contract are unaffected. Opt into the newer model with `--model gpt-image-2`.

## Pricing (approximate, as of 2026-05)

- **gpt-image-1** — $0.04 (low), $0.08 (medium), $0.20 (high) per image. Source: [fal.ai/models/fal-ai/gpt-image-1](https://fal.ai/models/fal-ai/gpt-image-1).
- **gpt-image-2** — token-priced; rough per-image estimate $0.02 (low), $0.07 (medium), $0.19 (high). Source: [fal.ai/models/openai/gpt-image-2](https://fal.ai/models/openai/gpt-image-2).

The script defaults to `medium`; pass `--quality high` for finals.

## Inputs

Required:
- `--prompt` — text prompt. A verbatim character descriptor block goes here for character work.
- `--output` — local PNG destination.

Optional:
- `--model` — `gpt-image-1` (default) or `gpt-image-2`.
- `--aspect-ratio` — `9:16` (default), `16:9`, `1:1`, `2:3`, `3:2`. gpt-image-2 also accepts `3:4`, `4:3`, `4:5`. Used when `--image-size` is not given.
- `--image-size` — explicit `WIDTHxHEIGHT` (e.g. `1728x2304`). **gpt-image-2 only** — values are rounded to multiples of 16 and capped at 3840px. On `gpt-image-1` a custom size is ignored with a warning and the aspect-ratio mapping is used instead.
- `--quality` — `low | medium | high` (default `medium`).
- `--ref-image` — local image path. **Repeatable** — pass `--ref-image PATH --ref-image PATH` to send multiple refs (e.g. identity + style). When present, routes to the model's `/edit` variant so the model can match the references (used for character angle gens off an anchor, and for style-anchor + identity-anchor composition). Order matters: pass identity (character) first, then style refs.
- `--with-logs` — stream fal queue logs.

Credentials:
- `FAL_API_KEY` (or `FAL_KEY`) in `.env`.

## Preflight

```bash
test -n "$FAL_API_KEY" || test -n "$FAL_KEY" || { echo "Missing FAL_API_KEY / FAL_KEY in .env"; exit 1; }
python3 -c "import fal_client" || pip3 install fal_client
```

## Workflow

```bash
# Text-to-image, default model (gpt-image-1)
python3 skills/ads/capabilities/create-image-gpt-image-fal/scripts/generate.py \
  --prompt "..." \
  --output /path/to/anchor.png \
  --aspect-ratio 9:16 \
  --quality medium

# Edit-from-reference (anchor -> angle), default model
python3 .../generate.py \
  --prompt "..." \
  --output /path/to/angle-3q-left.png \
  --ref-image /path/to/anchor.png \
  --aspect-ratio 9:16

# gpt-image-2 with a custom output size (e.g. a designed storyboard sheet)
python3 .../generate.py \
  --prompt "..." \
  --output /path/to/storyboard.png \
  --model gpt-image-2 \
  --image-size 1728x2304 \
  --quality high
```

The script:
1. Loads the FAL key via `fal_helpers.load_fal_key()`.
2. Resolves the model family (`--model`) and output size (`--image-size` if given and supported, else the aspect-ratio mapping).
3. If one or more `--ref-image` flags are set, uploads each to fal storage and routes to the model's `/edit` variant with `image_urls=[url1, url2, ...]`. Otherwise routes to the `/text-to-image` variant.
4. Calls `fal_client.subscribe(model, payload)` via `fal_helpers.subscribe`.
5. Downloads the first result image to `--output`.
6. Writes `<output>.meta.json` with gateway, model id, `model_family`, request, and cost.

## Output

- `<output_path>` — PNG (≥ 1 KB).
- `<output_path>.meta.json` — request + result metadata + cost, including `model_family` (`gpt-image-1` or `gpt-image-2`).

## Quality Checks

- Output file exists and is > 1 KB.
- For character anchors: visually inspect against the descriptor block (hair, shirt color, age).
- `meta.json` includes `gateway: "fal"`, the resolved `model` id, `model_family`, `image_size`, and `quality`.
- For gpt-image-2 custom sizes: confirm the output dimensions match the requested `WIDTHxHEIGHT`.
- **No readable text in the prompt that should appear in the image.** AI image models mangle short brand text, URLs, code tokens, captions, and wordmarks even with explicit prompting. Examples observed: `"ffmpeg"` → `"ffmmg"`; `"klarify"` → `"clarify"`; `"therapists"` → `"therapits"`. Use PIL or `ffmpeg drawtext` for any overlay containing readable text. Reserve image gen for purely visual content (characters, scenes, backgrounds). Repeats LEARNINGS L4.

## Failure Modes

| Symptom | Likely cause | Fix |
|---|---|---|
| `401 Unauthorized` | Bad FAL key | Verify `FAL_API_KEY` / `FAL_KEY` in `.env`. |
| `429 Too Many Requests` | RPS limit | Drop concurrency to 2-3. |
| Custom size ignored | `--image-size` passed with `--model gpt-image-1` | gpt-image-1 only supports fixed sizes; use `--model gpt-image-2` for custom sizes. |
| Aspect-ratio drift (gpt-image-1) | gpt-image-1 only supports 1024x1024, 1024x1536, 1536x1024 | The script maps aspect ratios to these internally. |
| Size rejected (gpt-image-2) | Dimension not a multiple of 16, or > 3840px | The script rounds to /16 and caps at 3840; pass a smaller size. |
| Anchor reference ignored | `/text-to-image` variant doesn't accept refs | Pass `--ref-image` to force the `/edit` variant. |
| Skin / face looks "AI-stock" | gpt-image's failure mode | Add anti-AI cues to the prompt: "natural skin texture with pores, slight asymmetry, no perfect teeth". |

## Cross-provider parity note

When this atom generates a character anchor (lock-character Phase 0), the anchor approved here MUST be pinned for all downstream angle gens, and the **same `--model`** must be used for those angle gens. Mixing model families (or mixing FAL-gpt-image with Higgsfield-gpt_image_2) introduces aesthetic drift. The orchestrator's `generate_with_fallback.py` inherits `gateway`/`model_family` from the anchor's `.meta.json` for subsequent calls.

## References

- [fal.ai/models/fal-ai/gpt-image-1](https://fal.ai/models/fal-ai/gpt-image-1)
- [fal.ai/models/openai/gpt-image-2](https://fal.ai/models/openai/gpt-image-2)
- Sibling Higgsfield path: `mcp__higgsfield__generate_image` with `model="gpt_image_2"`
- Shared helpers: `scripts/fal_helpers.py` (vendored alongside generate.py — self-contained)
- Storyboard-sheet consumer: `create-storyboard-sheets-fal` (video flow, in the separate ads-video repo)
