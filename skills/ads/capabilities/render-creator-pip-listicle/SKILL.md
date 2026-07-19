---
name: render-creator-pip-listicle
description: Assemble a creator picture-in-picture product-listicle ad from a config — the creator stays FULL-FRAME the whole beat (voice plus lips generated together per beat, no separate VO, no cut to a full-frame product shot), and on each product beat three persistent overlays ride on top for the WHOLE beat — a title pill top-center, the DEMO in a rounded PiP window top-right (the brand's real UGC clip MUTED, or for a no-UGC brand the product's own autocropped UI still / screen-recording sized to fill the window), and a bottom product card (rounded thumbnail plus 'N · CATEGORY' small-caps plus product NAME in a serif face). Hook plus CTA beats are the creator full-frame with the title pill only. Assembly builds ONE full-1080x1920 transparent overlay PNG per beat, overlays it on the creator clip (cover-scaled to 1080x1920) for the whole beat keeping the native audio, concats all beats, then burns captions LAST as timed PIL PNG overlays (this ffmpeg has no libass) timed deterministically from the known per-beat script. This is the FREE deterministic assembly stage (overlay-PNG build plus cover-scale composite plus concat plus PIL-PNG caption burn); the creator anchor and the N native talking clips come from create-image-fal (Seedream v5 Pro) and create-video-fal (Seedance 2.0). Use for the creator-pip-listicle format.
status: active
---

# render-creator-pip-listicle

Assemble a **creator picture-in-picture product listicle** ad from a config: an AI creator counts
down N products in the brand's own voice, and **the creator stays FULL-FRAME the whole time — there
is NO cut to a full-frame product shot, ever.** On each product beat, three persistent overlays ride
on top of the full-frame creator for the WHOLE beat: (1) a **title pill** top-center (persistent, it
carries the listicle title), (2) the **DEMO** in a rounded **PiP window top-right** — the brand's
real UGC clip (MUTED), or for a no-UGC brand the product's own demo (a real screen-recording, or an
autocropped high-res product-UI/dashboard still sized to fill the window), and (3) a **product card**
pinned bottom (rounded thumbnail left + "N · CATEGORY" small-caps + product NAME in a serif face like
Georgia). Hook + CTA beats are the creator full-frame with the **title pill only** (no PiP/card). The
creator's voice + lips are generated **together, natively** per beat — there is no separate voiceover.
This capability is the **FREE, deterministic assembly** — build the per-beat overlay PNG, cover-scale
the creator clip + composite the overlay, concat all beats, and burn the captions.

`scripts/config.example.json` is the worked example (DIBS Beauty "5 products that replaced my whole
makeup bag", ~46s 1080×1920 9:16, a hook + 5 product beats + a CTA); `scripts/PIPELINE.md` maps
every config block to its source step and `scripts/README.md` documents the free assembly.

## Run

This is the **FREE, deterministic** assembly stage — it spends nothing beyond the caption burn. The
paid inputs are separate capabilities — the creator anchor (`create-image-fal`, **Seedream v5 Pro**,
model `bytedance/seedream/v5/pro/text-to-image` with **no `fal-ai/` prefix**) and one native Seedance
talking clip per beat (`create-video-fal`, model `bytedance/seedance-2.0/reference-to-video`,
`generate_audio=ON`, the SAME seed across beats so the face holds, 720p default). Given those native
clips + the brand's real UGC demo clips (or the product's own autocropped UI stills / screen
recordings) + the real product photos + the brand palette + the title copy,
`render-creator-pip-listicle` builds ONE full-1080×1920 transparent overlay PNG per beat (title pill
always; + demo PiP top-right + bottom product card + rank number on product beats), cover-scales the
creator clip to 1080×1920 and overlays the beat's overlay PNG for the **whole beat** while keeping the
native audio, concats all beats, and burns the captions last → the master. Re-cuts reuse the existing
native clips + overlays and cost **$0**.

**Anchor gotcha (Seedream v5 Pro, not gpt-image-2/Seedream-v4).** Seedance 2.0's partner-validation
gate REJECTS photoreal faces from **gpt-image-2 AND Seedream v4** ("may contain likenesses of real
people"); a **Seedream v5 Pro** face passes. Generate a **FRESH** anchor with `create-image-fal`,
model `bytedance/seedream/v5/pro/text-to-image` (no `fal-ai/` prefix) — reusing an existing photoreal
face from another project also trips the gate.

**Clip gotchas (Seedance 2.0).** A **REJECTED submit STILL bills** via the fal-proxy — **pre-flight
ONE test clip (the hook)** and confirm it renders before firing the batch. Presigned anchor URLs
expire ~1h → re-host the anchor if a batch runs long (else "Failed to download the file" mid-batch).
The intermittent fal "User is locked: Exhausted balance" is the proxy's upstream fal account (not your
GooseWorks credits) → retry with backoff.

## Contract (the free assembly)

- **Creator FULL-FRAME the whole beat — NO cut to a full-frame product shot.** Every beat is ONE
  continuous full-frame creator clip; the product content lives in overlays, never in a full-frame
  cutaway. `per_beat_shots = 1`.
- **Native creator audio carries the reel — no separate VO.** Each beat's voice + lips come from ONE
  Seedance take (`generate_audio=ON`); this stage never adds a VO or a lip-sync pass. The creator
  clip's native audio plays continuous across the whole beat; the demo PiP's audio is **muted** (else
  the voice doubles).
- **Three persistent overlays on each product beat.** For the WHOLE beat, on top of the full-frame
  creator: (a) the **title pill** top-center (persistent, `title_pill.on=true` — carries the listicle
  title, kept short to fit one line); (b) the **DEMO PiP** top-right; (c) the **product card** bottom.
  Hook + CTA carry the **title pill only**.
- **The DEMO PiP is autocropped to FILL its window.** It's the brand's **REAL UGC clip** (MUTED,
  never AI-regenerated) — OR, for a brand with **NO UGC** (B2B/SaaS), the product's own demo: a real
  screen-recording, or an **AUTOCROPPED** high-res product-UI/dashboard still. Autocrop the still
  (trim transparent/near-white margins) and size the PiP window to the cropped content's aspect ratio
  so it **fills the window — no letterbox whitespace**; a **WIDE screenshot → a SHORT + WIDE window**,
  a tall/square one → a taller window. Rounded window, white hairline border, soft drop shadow,
  top-right. Disclose in the review when the demo is a still/mockup rather than a real UGC clip.
- **Products are REAL photos — never AI-render the product.** The bottom product card (rounded
  thumbnail + "N · CATEGORY" small-caps + product NAME in a serif face like Georgia) comes from the
  brand's real product photo / UI thumbnail; a product with no clean photo falls back to a brand-color
  tile with the wordmark, never an AI product render.
- **Persistent title pill, rank number on the card.** The title pill is persistent top-center (this
  format's identity, on by default). A counting rank number (1..N) is rendered on the product **card**
  on product beats.
- **Captions burned LAST as PIL PNG overlays, brand-accent, deterministic.** This ffmpeg has **no
  libass** → render each ~2-word cue as a timed PIL PNG overlay
  (`overlay=…:enable='between(t,s,e)'`): white words + a brand-accent underline, black stroke for
  legibility, positioned **CLEAR of the PiP (top) and the card (bottom)** (mid-to-lower band). Time
  them **DETERMINISTICALLY from the known per-beat script** — the fal-ai/whisper proxy is unreliable
  (900s timeouts); do NOT depend on it. The known script is the brand-correct source, so brand tokens
  are always spelled right.
- **FFmpeg composite, deterministic, FREE.** Per beat: build ONE full-1080×1920 transparent overlay
  PNG (title pill; + PiP + card + rank number on product beats), cover-scale the creator clip to
  1080×1920, overlay the PNG for the whole beat, keep the native audio. Concat all beats with the
  concat demuxer @ 30fps / yuv420p → a 1080×1920 h264+aac master, then burn captions last. Probe
  durations with `ffprobe -of csv=p=0` (NOT `-of default=nk=1:np=1`, which errors on some builds). No
  paid calls in the composite/stitch, no keys.
