# Pipeline — podcast-skit

How `config.example.json` maps to the real production steps. This molecule ships a **config +
this map**, not a bundled runner: the worked example (Ladder run-02 "Laundromat 2am") was
produced by per-step driver scripts that live in
`clients/ladder/ad-runs/run-02-podcast-skit/working/`. Reference those scripts directly, or drive
the whole run via `video-orchestrator-with-control-plane` (variant mode — this format has no
specialised orchestrator).

The steps run **in order** because each depends on the last: the script sets the timeline, the VO
gives the per-line timings, the timings + set drive the stills, the stills seed the lipsync clips,
the VO's timestamps drive the captions, and the stitch stitches all of it + the end card.

## Field → script → phase → paid?

| Config field | Source step | Script (in the run's `working/`) | Phase | Paid? |
|---|---|---|---|---|
| `voices.HER` / `voices.HIM` | one voice per host, `eleven_multilingual_v2` with-timestamps | `render_vo.py` | 1 | **PAID** (ElevenLabs, ~22 lines) |
| `scenes[].text` | the per-line VO copy (intonation-marked) | `render_vo.py` | 1 | **PAID** |
| `set_description` | the themed set fed into the base-still prompts | (hand-generated bases) | 2 | — |
| `characters.bases[]` (2) | two base stills, mouth closed, at the desk | (hand-generated: Brittney first, Brad on Brittney's still as bg ref) | 2 | **PAID** (Higgsfield `nano_banana_2`, 2 imgs) |
| `characters.variant_template` + `expression_variants[]` | ~10 img2img expression variants, base as SOLE ref | `render_variants.py` | 2 | **PAID** (Higgsfield `nano_banana_2`, ~10 imgs, sequential) |
| `scenes[].still` | which still each line lipsyncs from | `render_clips.py` (reads `script.json`) | 3 | — |
| `lipsync_engine` | Veed Fabric 1.0 via fal.ai per (still, VO) pair | `render_clips.py --gateway veed-fal --resolution 720p` | 3 | **PAID** (fal.ai, ~22 × 720p) |
| `captions` | yellow karaoke ASS from the VO char-level timestamps | `stitch.py` (+ legacy `make_subtitles.py`) | 4 | free |
| `end_card` | Playwright HTML → PNG → 2.5s mp4 from the real wordmark SVG | `build_end_card.py` | 4 | free |
| `assembly` | concat + scale/pad + burn karaoke + append end card | `stitch.py` | 4 | free |

## 1. Voiceover → ElevenLabs with-timestamps  (config: `voices`, `scenes[].text`)  [PAID]

`working/render_vo.py` reads `script.json` and, per scene, POSTs to
`/v1/text-to-speech/<voice_id>/with-timestamps?output_format=mp3_44100_128` with the host's
`model` + `settings`. It saves `voiceovers/scene-NN-<who>.mp3`, the char-level
`voiceovers/scene-NN-<who>.timestamps.json`, and a `manifest.json` summarising durations. One voice
per host, held across the whole skit. **The char-level timestamps are what the karaoke captions
sync to — do NOT Whisper.** Lines are intonation-marked (`...` pause, ` — ` em-dash, `?` rising,
`CAPS` emphasis, `.` hard stop), ≤10 words, **no acronyms** (ElevenLabs reads them letter-by-letter).

## 2. Base stills + variants → Higgsfield `nano_banana_2`  (config: `characters`)  [PAID]

- **Two bases** (hand-generated): tight bust, broadcast mic foreground, over-ear headphones, at
  the themed desk, **mouth NEUTRAL/CLOSED** (an open-mouth still breaks the lipsync driver).
  Generate the skeptic base FIRST, then the believer using the skeptic's still as a background
  reference so the set matches.
- **~10 expression variants** — `working/render_variants.py` img2img-anchors each variant on its
  host's base as the **SOLE reference** (`higgsfield generate create nano_banana_2 --prompt … --image <base> --aspect_ratio 9:16 --wait`).
  The prompt is `characters.variant_template` with `{change}` describing ONLY the pose/expression
  change — so the background stays 100% identical across all cuts. Submitted **sequentially** (per
  `feedback_higgsfield_burst_credit_reserve`). Idempotent (skips existing). `"narrowed eyes"`
  NSFW-rejects → swap to `"curious questioning look, eyes wide open and bright"`. Review all ~12
  stills (every mouth closed, one continuous set) before step 3.

## 3. Lipsync clips → Veed Fabric 1.0 via fal.ai  (config: `lipsync_engine`, `scenes[]`)  [PAID]

`working/render_clips.py --gateway veed-fal --resolution 720p` reads each scene's `(still, VO)`
pair from `script.json` and feeds them to the fal.ai Veed Fabric generate script (model
`veed/fabric-1.0`), writing `clips/scene-NN-<who>.mp4`. Concurrency 4; idempotent (skips existing —
safe to re-run partial failures with `--only 20,21,22`). Empty text-prompt (a text prompt
interferes with lipsync). **Hedra Character-3** (`--gateway hedra --model character-3`) is the
fallback if the fal.ai balance is exhausted (server: "User is locked. Reason: Exhausted balance.").
Its `--stills-dir` / `--clips-dir` are relative to the script's own `working/` root — pass bare
`characters` / `clips`, not `working/characters` (else it double-prefixes).

## 4. Captions + end card + assembly → `stitch.py` + `build_end_card.py`  (config: `captions`, `end_card`, `assembly`)

- `working/build_end_card.py` renders the brand lockup via **Playwright** from the REAL brand
  wordmark SVG (Ladder wordmark pulled from `run-01-app-sizzle/source/brand/ladder-wordmark-white.svg`):
  black background + lime (`#DBFF00`) wordmark + lime "Start free trial" pill + `joinladder.com` →
  an HTML file → screenshot to a 1080×1920 PNG → a **2.5s** silent mp4 at `clips/end-card.mp4`.
  **Never AI-render brand text.**
- `working/stitch.py` walks the scenes in `script.json` order. For each scene it ffprobes the
  clip's duration and builds a **global `words.json`** — every word's time = its local char-level
  time (parsed from `scene-NN-<who>.timestamps.json`) **+ the cumulative clip start** (sum of the
  preceding clips' durations). It calls the legacy `make_subtitles.py --accent-bgr 3BEBFF` to emit
  a yellow (`#FFEB3B`) karaoke ASS (3-word phrase cap, bottom-center). Then it concats all clips
  (`-f concat`, re-encode `libx264 -preset veryfast -crf 20`, `scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:…:black,setsar=1`),
  burns the ASS via libass, and **auto-appends `clips/end-card.mp4`** if present → the 1080×1920
  h264+aac master (~49s for the 22-line Ladder skit + the 2.5s end card).

Re-cuts (new caption chunking, re-timed clips, swapped end card) reuse the existing VOs/stills/clips
and cost **$0** — only steps 1–3 spend. The v2 master re-rendered only scenes 7 + 15 (more natural
skeptic reads) and re-stitched — a targeted `render_vo.py` + `render_clips.py --only 7,15` + a
free re-stitch.
