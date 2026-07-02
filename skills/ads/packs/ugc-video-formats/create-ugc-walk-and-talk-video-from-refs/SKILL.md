---
name: create-ugc-walk-and-talk-video-from-refs
description: >-
  Produce a single vertical "walk-and-talk" UGC video (15s by default, duration
  configurable {4..15}) — an AI creator WALKING through an outdoor location, arm
  extended in a selfie hold, talking straight to camera like a day-in-the-life /
  quick-tips vlog. ONE continuous Seedance 2.0 reference-to-video take, native
  lip-synced dialogue, no cuts, no captions, no music. The whole attention
  mechanism is genuine LOCOMOTION — the background (sidewalk, trees, storefronts,
  blurred pedestrians) drifts past with real parallax, proving she's really
  walking. This is a monologue sibling of the REFERENCE skill
  create-ugc-car-confessional-video-from-refs — read the car reference first: it
  owns the Phase 0 intake, the single-continuous-take prose-prompt recipe, the
  testimonial-vs-product decision, the review-loop + fix-loop, and
  scripts/stitch_replacement.py. This skill documents ONLY the walk-and-talk
  deltas (arm-extended framing, continuous locomotion + parallax, brisker word
  budget, outdoor golden-daylight setting, the 720p busy-background warp
  watch-out) and points back to the car reference + the parent
  create-ugc-product-video-from-refs. Use for an upbeat tips / day-in-life /
  hot-take talking-head ad set filmed on the move outdoors. NOT for on-screen
  app/SaaS UI demos (Seedance can't render legible UI), multi-cut testimonials
  (use recreate-ugc-ad-from-source), or product demos with beats/close-ups (use
  create-ugc-product-video-from-refs).
status: active
---

# create-ugc-walk-and-talk-video-from-refs

## Purpose

One Seedance 2.0 reference-to-video render of an AI creator **walking through an
outdoor location, arm extended in a selfie hold, talking straight to camera** —
the "walk-and-talk" that reads as a real person filming a quick tips clip on a
morning walk, not an ad. Vertical 9:16, 15s, native lip-synced dialogue, **one
single continuous take (no internal cuts)**, no captions, no music. The whole
attention mechanism is genuine **locomotion** — she's actually walking and the
street drifts past with real parallax.

This is a **monologue sibling** in the one-shot yapping sub-family. It
**specializes the reference skill** `create-ugc-car-confessional-video-from-refs`
— **read that first.** From the car reference (which in turn specializes the
family parent `create-ugc-product-video-from-refs`) it reuses verbatim: the
**Phase 0 proactive intake** (avatar / location / optional product), the
**testimonial-vs-product decision**, the **single-continuous-take prose-prompt
recipe**, the approval gates, the GPT-5.5 prompt-vetting pass, the review-loop +
fix-loop, and `scripts/stitch_replacement.py`.

This skill documents **only the walk-and-talk deltas** — the staging, motion,
energy, and setting changes that turn the parked-car confessional into a
walking vlog. Everything not listed here is inherited from the car reference.

Default output is **15 seconds** (`{4..15}` allowed). Hard stack constraint:
**GPT-image-2 + Seedance 2.0 reference-to-video only.** No ElevenLabs (Seedance
generates the voice natively), no captions, no music.

## Testimonial vs. product (read the car reference)

Same two intents as the car reference: **testimonial (default, no product)** —
works for both physical-product and software/SaaS companies — or an optional
**physical-product hold**. SaaS/app is served by the testimonial path, never by
faking on-screen UI. See the car reference's "Testimonial vs. product" section
for the full rule. The only walk-and-talk delta is the product **staging** (she
holds it at chest height as she walks; see Decision Rules).

## Inputs

Identical to the car reference. Required: a **brief** (topic/hook, energy, any
must-say lines). Optional (Phase 0 asks proactively; all defaulted):

- **Avatar** — default demo persona, a saved `personas/` persona, or a new one.
- **Location/scene** — default **outdoor walkable location in golden daylight**
  (a tree-lined block with storefronts), or a custom walkable setting. Rendered
  **from text — no environment plate needed** (the moving background is
  generated, not composited).
- **Product** — `none` (testimonial, default) or a **physical product** held at
  chest height mid-walk (supply a clean product reference).
- `duration` (`{4..15}`, default **15**), `resolution` (**default 720p** ~$4.50;
  **1080p only on explicit operator request** ~$10.20), `aspect_ratio` (default
  `9:16`), `seed`.

Environment: `FAL_KEY` (alias from `FAL_API_KEY`; from `content-goose/.env`).
`OPENAI_API_KEY` (from `gtm-goose/.env`) for the GPT-5.5 vet + Whisper review.

## Composed Atoms

Same set as the car reference:

- `coworkers/video/atoms/image-generation/create-image-gpt-image-fal` — `--model
  gpt-image-2`. Generates/loads the **composed selfie still** (creator arm-out on
  the walkable street). For a product build, also a clean white-BG cutout.
- `coworkers/video/atoms/video-generation/create-video-seedance-2-fal` — the
  render engine. `--image-ref`, `--resolution`, `--duration`, `--aspect-ratio
  9:16`, `--generate-audio`, `--no-generate-audio` for silent fix clips, `--seed`.
- `scripts/stitch_replacement.py` (reused verbatim) — surgical window replacement
  preserving the master audio.
- `demo/working/vet_seedance_prompt_gpt55.py` — GPT-5.5 prompt vet.
- `/watch:watch` (or ffmpeg frames @2fps + Whisper) — the review-loop.

## Workflow

> **Approval gate (hard rule):** never fire a GPT-image-2 or Seedance call
> without first pasting the exact prompt(s)/refs and waiting for the user's go.
> See `docs/rules/PRODUCTION_RULES.md` and `feedback_prompt_review_before_send`.

**This skill inherits the car reference's phases (0 → 7) unchanged.** Run them
exactly as written there. Only the walk-and-talk **deltas** are below — fold them
into the matching phase.

### Phase 1 delta — Lock character + location (GPT-image-2) [APPROVAL GATE]
The composed selfie still stages the creator **arm-extended on the walkable
street**, framed **a bit wider than the car** so the moving street reads. Face
upper-center, body lower-center. Golden daylight, tree-lined block with
storefronts and a few (not dense) pedestrians. The demo's `assets/refs/avatar.png`
is the validated default.

### Phase 2 delta — Word budget (energy dial) [APPROVAL GATE for the words]
Walk-and-talk is **upbeat/brisk**, so it sits at the **high end** of the
monologue range: **~40–45 words / 15s** (more words = faster, yappier, more
walk-vlog energy). This is above the car confessional's calm ~32–37. Hook in the
first ~1s, one payoff, no AI-tell filler.

### Phase 3 delta — Author the Seedance prompt (the recipe) [APPROVAL GATE]
Use the car reference's five-paragraph prose recipe (look → reference binding →
camera+micro-motion → monologue → audio+closer). Change only:
1. **Look directive** — "…walk-and-talk vlog…walking down a sunny sidewalk,
   talking to camera like she's catching up with a friend…one single continuous
   take, no cuts." Frame **a little wider** so the moving street reads.
2. **Reference binding** — bind identity, wardrobe, hair AND the **walkable
   street** as one `@Image1` (…"walking a tree-lined block with storefronts,
   blurred pedestrians, and sky behind her").
3. **Camera + motion — THE WHOLE POINT (replaces the car's "stays parked"):**
   she is **walking forward the entire time**, phone at arm's length, so the
   frame has a **natural walking bob + slight arm-held sway** and the sidewalk,
   trees, storefronts and blurred pedestrians **drift past with real PARALLAX —
   the background is clearly in motion, proving she's really walking.** Micro-
   motion: curls/face-framing strands **lift with each step and the breeze**,
   eyes flick between the lens and the sidewalk, a light free-hand gesture, and
   **one glance over the shoulder** before returning to the lens. Lips closed
   between lines.
4. **The spoken monologue** — inline in quotes, "a little breath and lift from
   moving." (Product build: "…she brings the product up to chest height beside
   her and angles the label to the lens once…".)
5. **Audio + closer** — "Live outdoor street ambience only — her footsteps in
   rhythm with her walk, distant traffic a block away, faint far-off chatter and
   a little birdsong; no music, no other close voices. Keep the background
   legible and not overcrowded — a calm block with a few pedestrians, not a dense
   crowd. Single continuous take, same woman, same outfit, same street, no second
   person, no morph transitions."

Then **GPT-5.5-vet** and fold in edits before the gate — most valuable before a
1080p hero.

### Phase 4 delta — Render [APPROVAL GATE]
As the car reference. **Render at 720p (~$4.50) — the default**, and inspect the
moving background specifically (see the 720p watch-out below). Render 1080p only
if the operator explicitly asks (~$10.20).

### Phase 5 delta — Review-loop (automated QC)
Add two walk-specific checks to the car reference's list: **genuine locomotion +
parallax** (the background is really moving past her — she is not walking on the
spot / floating on a static plate), and **no background warp/melt** (busy moving
scenery and pedestrians hold shape, don't smear).

## Decision Rules

Inherit all of the car reference's Decision Rules. Walk-and-talk **overrides /
adds**:

1. **Continuous locomotion replaces "stays parked."** She is walking forward the
   whole take; the background drifts past with real parallax. A static or
   walking-on-the-spot look is the #1 failure — assert real forward motion and
   moving scenery in the prompt.
2. **Frame a little wider than the car.** Arm-extended selfie, face upper-center;
   leave room for the moving street to read. Too tight and the parallax is lost.
3. **Word count is the energy dial; brisk walk → ~40–45 words/15s.** Above the
   car's calm ~32–37 — the walk is upbeat, so more words = faster/yappier.
4. **Outdoor walkable setting, golden daylight, rendered from text.** No
   environment plate — the moving background is generated. Keep it a calm block
   with a few pedestrians, not a dense crowd.
5. **Micro-motion is walk-native.** Curls/strands lift with steps + breeze, eyes
   flick lens↔sidewalk, a hand gesture, one glance over the shoulder. Stillness =
   mannequin = dead video.
6. **720p busy-background watch-out (decision rule).** Busy moving backgrounds
   can warp/melt at 720p — pedestrians distort, storefronts smear. If the 720p
   probe shows this, **SIMPLIFY**: thin the crowd (fewer/no pedestrians), slow
   the implied walking speed, quiet the background. **Confirm the simplified
   probe reads clean before spending on 1080p.**
7. **Product build = hold at chest height while walking, no contact physics.**
   She brings the product up to chest height mid-walk and **angles the label to
   the lens once** — no pours, opens, or complex handling (car reference's
   product rules apply).
8. **Everything else — one continuous take, prose prompts with dialogue inline,
   testimonial-default, ship clean, every paid call gated — is inherited from the
   car reference and the parent.**

## Output

```
<project>/
  assets/refs/        ← @Image1 composed arm-out selfie still (+ @Image2 product for a product build)
  working/            ← seedance_prompt.txt, gpt55 review, review frames/transcript, any fix clips
  finals/
    <name>.mp4              ← master render
    <name>-v2.mp4           ← after any surgical window fix (delivered)
```

Delivered: one vertical 9:16 mp4 at the requested duration/resolution, native
dialogue + live outdoor street ambience, no captions.

## Quality Checks

Inherit the car reference's checks. Walk-and-talk adds:

- **Genuine locomotion + parallax** — the background is really moving past her;
  she reads as walking forward, not walking on the spot and not floating on a
  static plate.
- **No background warp/melt** — busy scenery and any pedestrians hold shape
  (especially at 720p); no smearing.
- Framed a little wider than the car so the moving street reads; face upper-center.
- Micro-motion is walk-native (step-and-breeze hair, glance over the shoulder).
- Plus all inherited checks: duration ±0.2s, 9:16, transcript matches script,
  lip-sync reads, identity + wardrobe hold, single continuous take (no cuts, no
  second person, no morph), stack GPT-image-2 + Seedance 2.0 only, no captions,
  no music.

## Failure Modes

Inherit the car reference's table. Walk-and-talk adds/overrides:

| Symptom | Cause | Fix |
|---|---|---|
| She looks like she's walking on the spot / floating on a static background | Locomotion + parallax under-specified | Assert "walking forward the entire time…background drifts past with real parallax, proving she's really walking"; give the frame a walking bob + arm sway. |
| Busy moving background warps / melts; pedestrians distort | 720p can't hold a crowded moving scene | **Simplify** — thin/remove pedestrians, slow the implied walk speed, quiet the background; confirm the simplified 720p probe before 1080p. |
| Parallax reads flat / street doesn't move | Framed too tight | Frame a little wider than the car so the moving street reads; keep face upper-center. |
| Dialogue feels sluggish for a walk | Word count too low for the upbeat energy | Push toward ~40–45 words/15s; the probe's /watch confirms pace. |
| (Product) label garbled while walking | Small text under motion + a walk's extra shake | Keep it a single chest-height "angle the label to the lens" moment; name hero features; no opens/pours. |
| Brief needs cuts, >15s, on-screen app UI, or a second person | Out of scope for one continuous monologue | Flag; route to create-ugc-product-video-from-refs, recreate-ugc-ad-from-source, or a screen-record composite. |

## Skill location & related

- This skill: `one-shot-videos/create-ugc-walk-and-talk-video-from-refs/`
- Worked example: `demo/` (screen-free morning-walk tips monologue, 15s/720p,
  seed 1364067802, ~$4.50) — validated QC: genuine locomotion + parallax,
  identity/wardrobe locked (rust henley, half-up curls, gold hoops + pendant),
  clean lip-sync, transcript matched the script near-verbatim, no second person,
  no melting.
- **Reference (read first):** `one-shot-videos/create-ugc-car-confessional-video-from-refs`
  (owns the Phase 0 intake, the single-take prose recipe, the testimonial-vs-
  product decision, the review/fix loop, and `stitch_replacement.py`).
- **Family parent:** `one-shot-videos/create-ugc-product-video-from-refs`
  (the four-block recipe + `stitch_replacement.py` + GPT-5.5 vet + review/fix loop).
- Atoms: `create-video-seedance-2-fal` + `create-image-gpt-image-fal`.
