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
- `--ref-image` / `--ref-url` — a **PUBLIC image URL** for the `/edit` variant. **Repeatable** — pass it twice to send multiple refs (e.g. identity + style). The proxy does **not** upload local files, so a **local path is rejected** — host the image first (MCP `get_upload_url` → `get_download_url`, or any public URL) and pass that URL. When present, routes to the model's `/edit` variant so the model can match the references. Order matters: pass identity (character) first, then style refs.
- `--with-logs` — stream fal queue logs.

Credentials (proxy-routed — NOT a raw FAL key):
- The bundled `scripts/media_proxy.py` routes every call through the GooseWorks **fal-proxy**, which **bills the Ads agent**. It reads `~/.gooseworks/credentials.json` (`api_base`, `api_key`, `agent_id`) — written by `gooseworks login`. Do **not** set `FAL_API_KEY`: an agent (`cal_`) token is not a FAL key and 401s against fal directly.
- Set `GW_PROJECT_ID=<ad project id>` in the env so the generation's spend attributes to that ad project (per-project cost shows in the app).

## Preflight

```bash
test -f ~/.gooseworks/credentials.json || { echo "Missing credentials — run: gooseworks login"; exit 1; }
python3 -c "import requests" || pip3 install requests
```

## Workflow

```bash
# Text-to-image, default model (gpt-image-1)
python3 skills/ads/capabilities/create-image-gpt-image-fal/scripts/generate.py \
  --prompt "..." \
  --output /path/to/anchor.png \
  --aspect-ratio 9:16 \
  --quality medium

# Edit-from-reference (anchor -> angle). --ref-image must be a PUBLIC URL,
# NOT a local path (the proxy does not upload local files):
python3 .../generate.py \
  --prompt "..." \
  --output /path/to/angle-3q-left.png \
  --ref-image "https://.../anchor.png" \
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
1. Loads the agent credentials from `~/.gooseworks/credentials.json` via the bundled `media_proxy.py` (proxy-routed; bills the Ads agent).
2. Resolves the model family (`--model`) and output size (`--image-size` if given and supported, else the aspect-ratio mapping).
3. If one or more `--ref-image` / `--ref-url` flags are set, passes them as `image_urls=[url1, url2, ...]` (they must already be PUBLIC URLs) and routes to the model's `/edit` variant. Otherwise routes to the `/text-to-image` variant.
4. Submits through the GooseWorks **fal-proxy** and polls the queue to completion — host-swapping the `queue.fal.run` status/response URLs to the proxy base (see `media_proxy.py`); never polls `queue.fal.run` directly.
5. Downloads the first result image to `--output`.
6. Writes `<output>.meta.json` with `gateway: "fal-proxy"`, model id, `model_family`, request, and cost.

## Output

- `<output_path>` — PNG (≥ 1 KB).
- `<output_path>.meta.json` — request + result metadata + cost, including `model_family` (`gpt-image-1` or `gpt-image-2`).

## Quality Checks

- Output file exists and is > 1 KB.
- For character anchors: visually inspect against the descriptor block (hair, shirt color, age).
- `meta.json` includes `gateway: "fal-proxy"`, the resolved `model` id, `model_family`, `image_size`, and `quality`.
- For gpt-image-2 custom sizes: confirm the output dimensions match the requested `WIDTHxHEIGHT`.
- **No readable text in the prompt that should appear in the image.** AI image models mangle short brand text, URLs, code tokens, captions, and wordmarks even with explicit prompting. Examples observed: `"ffmpeg"` → `"ffmmg"`; `"klarify"` → `"clarify"`; `"therapists"` → `"therapits"`. Use PIL or `ffmpeg drawtext` for any overlay containing readable text. Reserve image gen for purely visual content (characters, scenes, backgrounds). Repeats LEARNINGS L4.

## Failure Modes

| Symptom | Likely cause | Fix |
|---|---|---|
| `401 Unauthorized` from fal | Calling fal directly with an agent token, or polling `queue.fal.run` instead of the proxy | This atom is **proxy-routed** — it uses the `~/.gooseworks/credentials.json` agent token via `media_proxy.py`, never a raw `FAL_API_KEY`. Run `gooseworks login` if the credentials file is missing. |
| `ERROR: ref images must be PUBLIC URLs` | Passed a **local path** to `--ref-image` / `--ref-url` | The proxy does not upload local files. Host it (MCP `get_upload_url` → `get_download_url`) and pass the resulting public URL. |
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
- Shared helper: `scripts/media_proxy.py` (proxy-routed FAL/ElevenLabs; bills the Ads agent — the helper `generate.py` actually imports). `scripts/fal_helpers.py` is a LEGACY raw-FAL helper kept for reference only; `generate.py` does **not** use it (it would need a real `FAL_KEY`).
- Storyboard-sheet consumer: `create-storyboard-sheets-fal` (video flow, in the separate ads-video repo)
