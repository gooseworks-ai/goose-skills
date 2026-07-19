# Pipeline — glassy-matte GRWM (multi-scene beauty demo)

How `config.example.json` maps to the real production steps. This capability ships a
**config + this map**, not a bundled runner: the worked example (DIBS Beauty "5-Step Glassy
Matte Routine") was produced by the video-orchestrator's per-state steps plus three per-project
drivers (`build_v4.py`, `render_cards.py`, `composite_cards.py` + `build_master.py`). The four
paid stages (the SEPARATE VO, the ~7 Seedance scene clips, the ~5 gpt-image-2 product cutouts +
the flat-lay) are separate capabilities; this cap owns the FREE assembly at the end.

The steps run **in order** because each depends on the last: the SEPARATE VO sets the timeline
(via its Whisper word-starts), the word-starts drive the scene cuts, the scenes are re-cut +
concatenated, the product cutouts + PDP taglines drive the cards, the cards are composited on the
product-name beats, and the mix + captions + end card finish the master.

## Field → source-step map

| Config field | Phase | Source step / script | Paid? |
|---|---|---|---|
| `vo.script`, `vo.voice_id`, `vo.atempo` | 1 Lock | ElevenLabs `eleven_v3` TTS + ffmpeg `atempo 1.15` (or ingest an mp3) | **PAID** (or supplied) |
| `scene_clips.clips[]` | 2 Scenes | `create-video-fal` (Seedance 2.0, Fal direct, 720p, ~6s, `--no-audio`) | **PAID** (~$0.30/s @ 720p) |
| `end_card.flat_lay` | 2 Scenes | `create-image-gpt-image-fal` (gpt-image-2, 9:16) | **PAID** (~$0.07) |
| `vo.outputs.word_timings` | 3 Whisper | Groq `whisper-large-v3` word-level → `<vo>.words.json` | ~$0.04 |
| `cuts.windows[]` | 4 Re-cut | scene cuts derived from the "step N" word-starts, re-cut + hard-concat + `-crf 20` | `build_v4.py` (free) |
| `products.cutouts[]` | 5 Products | `create-image-gpt-image-fal` (gpt-image-2 white-bg standalone); taglines PDP-verified | **PAID** (~$0.35) |
| `cards.template`, `.playwright_scale` | 5 Cards | Playwright renders `product-card.html.tmpl` at 2× | `render_cards.py` (free) |
| `cards.timing[]` | 6 Composite | cards composited onto the master, snapped to product-name word-starts (`-loop 1 -t`) | `composite_cards.py` (free) |
| `music`, `audio_mix` | 6 Mix | ElevenLabs Music bed ducked under the VO, loudnorm I=-14 | `build_master.py` (**PAID** music; mix free) |
| `captions` | 6 Captions | clean-white captions from the Whisper words (3 words/cue override) burned | `build_master.py` (free) |
| `end_card.hold_sec`, `.effect` | 6 End card | flat-lay ken-burns hold appended | `build_master.py` (free) |

## 1. Lock the assets + VO  (config: `assets`, `vo`)  [PAID-or-supplied VO]

Lock the creator anchor (identity + wardrobe + setting), the vanity world plate, and the hook
keyframe (creator holding the ~5 products fanned; doubles as the payoff). Render the VO on
ElevenLabs `eleven_v3` (`stability 0.40`, `style 0.25`), then `ffmpeg atempo=1.15` to hit a
~27.5s pace, or ingest a supplied mp3. **The VO is a SEPARATE track — not a native take.** Write
the script clean (no audio tags).

## 2. Scene clips → Seedance 2.0  (config: `scene_clips`, `end_card.flat_lay`)  [PAID]

`create-video-fal` (Seedance 2.0, Fal direct) fires ~7 scene clips: a hook, one clip per product
step (its application beat), and a payoff smile — 720p / 9:16 / `--no-audio`, off the locked anchor
+ world refs. **Softer application verbs** ("dabs", "swirls", "dusts") — hard verbs ("press",
"brush her face") 422 on content policy; retry `--tier fast`. Also generate the gpt-image-2 flat-lay
end-card still. Verify each clip's duration; Seedance drifts on the back ~2s of longer clips, so
trim to the clean window in Phase 4.

## 3. Whisper the VO → Groq word timestamps  (config: `vo.outputs.word_timings`)  [~$0.04]

Groq `whisper-large-v3` word-level on the atempo'd VO → `<vo>.words.json`. **The VO's actual
duration + word-starts set the timeline** — a 1.15× VO ends ~27.5s, not the 45s the plan assumed
(the back half would play silent). Record the word-start of each "step N" and each product name.

## 4. Re-cut + concat → `build_v4.py`  (config: `cuts`)  [free]

Derive the cut points: **scene cuts land on the "step N" word-starts** (cut to the next product
when its step is announced, not when the previous application beat ends); a scene may sub-cut for
pacing. Re-cut each clip to its VO window and **hard-concat** (no dissolves) → a silent master. 12
cuts over 32s (cuts/10s = 3.75). **Re-encode `-c:v libx264 -crf 20`** — `-c copy` corrupts the
duration when zoompan/PNG clips are in the chain.

## 5. Product cutouts + cards → `gen-product-cutouts.sh` + `render_cards.py`  (config: `products`, `cards`)  [PAID cutouts]

`create-image-gpt-image-fal` (gpt-image-2, white-bg) → ~5 **standalone** product cutouts (NOT
on-body, NOT an AI flat-lay). **PDP-verify every tagline** — the gpt-image-2 flat-lay renders
hallucinated sublines ("SCULPT + GLOW"), which are WRONG. The cutout must match the REAL product,
not the Seedance scene's hallucinated barrel. Playwright renders `product-card.html.tmpl` at **2×
scale** → one card PNG per product (warm cream card, pink accent bar, cutout thumb, name, PDP
tagline).

## 6. Composite + mix + captions + end card → `composite_cards.py` + `build_master.py`  (config: `cards.timing`, `music`, `audio_mix`, `captions`, `end_card`)  [free assembly]

- **Cards** (`composite_cards.py`): composite each card onto the silent master, **snapped to the
  product-NAME word-start** (~1s after its scene cut), fading in over ~1s, held until the next
  product is named. **PNG overlay inputs NEED `-loop 1 -t <dur>`** — else the PNG emits one frame at
  t=0 and the fade/enable filters silently no-op (cards go invisible).
- **Mix** (`build_master.py`): mix the SEPARATE VO on top of the ducked ElevenLabs Music bed (VO is
  the lead), `loudnorm I=-14`.
- **Captions**: clean-white captions from the VO's Whisper words, **overridden to 3 words/cue,
  ~3.0% font, ~20% margin, no pill, no shadow** (the default 5-words/4.5%/18% preset reads too
  dense). If the host ffmpeg lacks libass, render the cues as timed PIL PNG overlays instead.
- **End card**: append the gpt-image-2 flat-lay still, ken-burns held ~4s → `finals/<brand>-glassy-matte-grwm-v4.mp4`
  (1080×1920, 30fps, h264+aac, ~32s).

Re-cuts (new cut windows, re-timed cards, caption chunking, a swapped end card) reuse the existing
clips / VO / cutouts / music and cost **$0** — only steps 1–2 and 5's cutouts spend.
