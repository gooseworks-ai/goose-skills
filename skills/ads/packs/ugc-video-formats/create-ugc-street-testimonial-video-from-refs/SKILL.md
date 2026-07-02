---
name: create-ugc-street-testimonial-video-from-refs
description: >-
  Produce a single vertical "street testimonial" UGC video (15s by default,
  duration configurable {4..15}) — ONE AI creator who has stopped mid-walk on a
  busy sidewalk and turned to camera to say something, earnest "can I just say"
  vox-pop energy. A SINGLE subject: no second person, no interviewer, no cuts.
  ONE continuous Seedance 2.0 reference-to-video take, native lip-synced audio,
  no captions, no music. This is a monologue sibling that SPECIALIZES the
  reference skill create-ugc-car-confessional-video-from-refs (read that first):
  it inherits the Phase 0 intake (avatar / location / optional product), the
  testimonial-vs-product decision, the prose prompt recipe, the approval gates,
  the GPT-5.5 vet, the review-loop + fix-loop, and scripts/stitch_replacement.py.
  This file documents ONLY the street deltas — stopped-to-talk staging,
  near-stationary handheld, single-person hard rule, punchy hot-take word budget
  — and points back to the car reference + the parent create-ugc-product-video-from-refs.
  Default is a testimonial (no product) that works for both physical-product and
  software companies; an optional physical-product hold is supported. Use for a
  spontaneous sidewalk hot-take / vox-pop talking-head ad. NOT for walk-and-talk
  (use create-ugc-walk-and-talk-video-from-refs), on-screen app/SaaS UI demos
  (Seedance can't render legible UI), multi-cut testimonials (use
  recreate-ugc-ad-from-source), or product demos with beats/close-ups (use
  create-ugc-product-video-from-refs).
status: active
---

# create-ugc-street-testimonial-video-from-refs

## Purpose

One Seedance 2.0 reference-to-video render of an AI creator who has **stopped
mid-walk on a busy sidewalk and turned to camera** to say something he means —
the "street testimonial" that reads as a real stranger who caught you for ten
seconds to share a hot-take, not an ad. Vertical 9:16, 15s, native lip-synced
dialogue, **one single continuous take (no internal cuts)**, no captions, no
music. The busy storefront sidewalk + earnest "can I just say" vox-pop energy is
the whole attention mechanism.

This is a **monologue sibling that specializes the reference skill**
`create-ugc-car-confessional-video-from-refs` — **read that skill first.** It in
turn specializes the family parent `create-ugc-product-video-from-refs`. From the
car reference this skill inherits verbatim: the **Phase 0 proactive intake**
(avatar / location / optional product), the **testimonial-vs-product decision**,
the **prose prompt recipe**, the **approval gates**, the **GPT-5.5 prompt vet**,
the **review-loop + fix-loop**, and `scripts/stitch_replacement.py`. This file
documents **only the street deltas**; for everything else, follow the car
reference.

Default output is **15 seconds** (`{4..15}` allowed). Hard stack constraint:
**GPT-image-2 + Seedance 2.0 reference-to-video only.** No ElevenLabs (Seedance
generates the voice natively), no captions, no music.

## Street deltas (what differs from the car reference)

Everything below overrides the car reference for this format. Where a topic isn't
listed here, the car reference governs.

- **Setting.** A busy-but-not-chaotic **storefront sidewalk** — shopfronts,
  awnings, a bit of distant traffic. All background signage stays **blank or
  illegibly blurred** (no readable brand text). Replaces the parked-car booth.
- **Framing.** Handheld at **roughly arm's length** ("stopped to talk to the
  camera") — **less selfie-arm than a walk-and-talk**; chest-up medium framing,
  face upper-center.
- **Camera / motion.** **NEAR-STATIONARY handheld.** He has **stopped walking**,
  planted in one spot, with only light natural handheld drift; **background
  pedestrians move behind him**. NOT walking (that's the walk sibling), NOT a
  locked tripod (that reads staged).
- **SINGLE-PERSON hard rule (the signature — see Decision Rules #1).** Exactly
  **one subject.** No interviewer, no second person, no one else speaking.
  Background passersby stay blurred and distant. Ban second-person-magnet wording
  in the prompt and dialogue ("tell them", "she said", "we", "my friend here").
- **Energy → word budget.** Punchy **hot-take** → short, snappy bursts:
  **~27–30 words / 15s** (tighter than the car reference's calm ~32–37; the more
  clipped delivery is the street energy).
- **Micro-motion.** Animated **hand gestures**, a single **weight shift**,
  **brows/expression** punctuating the point, and **one quick glance to the side**
  as a pedestrian passes — then back to the lens. Lips closed between lines.
- **Product build.** If a physical product is chosen, he **holds it up and shows
  it while planted** (no contact physics). Follow the car reference's product
  rules (name hero features, pin small text to the show-it moment).

## Inputs

Same as the car reference — **Brief** (required); optional **Avatar**,
**Location/scene** (defaults to the scripted busy-sidewalk setting here),
**Product** (`none` default), `duration` (`{4..15}`, default **15**),
`resolution` (**default 720p** ~$4.50; **1080p only on explicit operator request** ~$10.20), `aspect_ratio`
(default `9:16`), `seed`. Environment: `FAL_KEY` (alias from `FAL_API_KEY`, from
`content-goose/.env`); `OPENAI_API_KEY` (from `gtm-goose/.env`) for the GPT-5.5
vet + Whisper review.

## Composed Atoms

Identical to the car reference:
`coworkers/video/atoms/image-generation/create-image-gpt-image-fal` (the composed
sidewalk selfie still = `@Image1`, +product cutout `@Image2` for a product build),
`coworkers/video/atoms/video-generation/create-video-seedance-2-fal` (render
engine), `scripts/stitch_replacement.py` (reused verbatim; surgical window fix),
`demo/working/vet_seedance_prompt_gpt55.py` (GPT-5.5 vet), and `/watch:watch` for
the review-loop.

## Workflow

Follow the **car reference's Phase 0 → Phase 7** exactly. The intake, gates,
GPT-5.5 vet, render, review-loop, and fix-loop are unchanged. Apply only these
street substitutions:

- **Phase 0 — Intake.** Same three proactive questions (avatar / location /
  product). The location default here is the **scripted busy-storefront sidewalk**
  (this skill's `demo/` is the validated default).
- **Phase 1 — Lock character + location.** The composed still is the creator
  **standing planted on the sidewalk** (already stopped to talk), passed as
  `@Image1`. Product build: also normalize the product cutout as `@Image2`.
- **Phase 2 — Script to energy.** Write a **punchy hot-take, ~27–30 words / 15s**
  — snappy bursts, one payoff, hook in the first ~1s. **No second-person-magnet
  phrasing** (nothing that implies someone else is present).
- **Phase 3 — Author the Seedance prompt (prose, five paragraphs).** Same
  structure as the car reference, with the street substitutions:
  1. **Look directive** — "Vertical 9:16 UGC street testimonial, shot handheld at
     roughly arm's length, one man who has just stopped walking on a busy sidewalk
     and turned to camera, earnest 'can I just say' energy. Overcast daylight, real
     skin tones, no filters, natural handheld drift. One single continuous take, no
     cuts, **and only ONE person: no second person, no interviewer, no one else
     speaking.**"
  2. **Reference binding (once)** — "Use @Image1 as the exact man's identity,
     wardrobe, and setting … standing on the same busy storefront sidewalk. Behind
     him blurred passersby drift past; **all background signage stays blank or
     illegibly blurred**; do not render any readable text or logos." (Product
     build: add the `@Image2` product line per the car reference.)
  3. **Camera + micro-motion** — "He has stopped walking to talk, standing planted
     in one spot; phone at roughly arm's length, chest-up medium framing, **light
     natural handheld drift — not a locked tripod, not a walk-and-talk.**" Then the
     motion arc in prose: hands come up to punctuate, one weight shift, brows lift
     and knit, one quick glance to the side as a pedestrian passes, then back.
     Lips closed between lines.
  4. **The spoken monologue** — inline in quotes after "He speaks directly to
     camera, earnest and un-scripted:". Keep it a single-subject hot-take.
  5. **Audio + closer** — "Native spoken audio with accurate lip-sync, [voice
     character]. **Live sidewalk ambience only** — passing footsteps, distant city
     traffic, faint indistinct chatter; no music. Single continuous take, **one
     person only, no second person ever appearing or speaking**, no morph
     transitions."
  Then **GPT-5.5-vet** (adapt `vet_seedance_prompt_gpt55.py`) and fold in edits
  before the gate.
- **Phase 4 — Render.** One `create-video-seedance-2-fal` call. **Render at 720p
  (~$4.50) — the default deliverable; render 1080p only on explicit operator
  request (~$10.20).**
- **Phase 5 — Review-loop.** `/watch` the result. Street-specific checks:
  **exactly one person the whole take** (no second speaker, no passerby resolving
  into a foreground subject); stopped/planted (not walking, not tripod-locked);
  real micro-motion; background signage stays illegible; lip-sync + transcript
  match; identity/wardrobe hold; (product build) label + geometry hold.
- **Phase 6 — Fix-loop.** For a confirmed bad window (e.g. the canonical
  **audio-dysfluency** below), author a short silent replacement with the SAME
  ref, `--no-generate-audio`, review it alone, then
  `scripts/stitch_replacement.py --window-start/--window-end --fit stretch`
  (preserves master audio). Re-roll with the seed only if identity drifts.
- **Phase 7 — Final review.** Hand the finished mp4 (absolute path + folder). No
  captions.

## Decision Rules

Inherit all of the car reference's Decision Rules. Street adds/overrides:

1. **SINGLE-PERSON is the hard rule (the signature).** Exactly one subject the
   entire take. No interviewer, no second person, no one else speaking; background
   passersby stay blurred, distant, and never resolve into a foreground subject.
   Assert it in the look directive AND the closer, and **ban second-person-magnet
   wording** in prompt and dialogue ("tell them", "she said", "we", "my friend").
   A brief that wants an interview, a reaction, or a second speaker is out of
   scope — flag it.
2. **Stopped, not walking, not tripod.** Near-stationary handheld with light
   drift, planted in one spot. Walking → route to the walk sibling; a locked
   tripod reads staged.
3. **Word count is the energy dial; street = punchy hot-take → ~27–30 words/15s.**
   Snappy bursts, tighter than the car reference's calm ~32–37.
4. **Background signage stays illegible.** No readable brand text anywhere;
   Seedance garbles small text under motion, so forbid it outright.
5. **Composed sidewalk still locks character + location.** One composed still as
   `@Image1` (creator already stopped on the sidewalk).
6. **Everything else defers to the car reference** — prose prompts / dialogue
   inline, no bracketed labels; kill the static-body trap with explicit prose
   micro-motion; testimonial default serves software too; product build = show
   within the take, no contact physics; ship clean (no captions, no music); every
   paid call gated; **default 720p, 1080p only on explicit operator request.**

## Output

```
<project>/
  assets/refs/        ← @Image1 composed sidewalk still (+ @Image2 product for a product build)
  working/            ← seedance_prompt.txt, gpt55 review, review frames/transcript, any fix clips
  finals/
    <name>.mp4              ← master render
    <name>-v2.mp4           ← after any surgical window fix (delivered)
```

Delivered: one vertical 9:16 mp4 at the requested duration/resolution, native
dialogue + live sidewalk ambience, no captions.

## Quality Checks

- Duration within ±0.2s; 9:16; plays in a standard player.
- **Exactly one person the whole take** — no second speaker, no interviewer, no
  passerby resolving into a foreground subject.
- Stopped/planted (not walking, not tripod-locked); creator reads as alive (real
  micro-motion), not a mannequin.
- Background signage stays blank/illegible; no readable logos or brand text.
- Transcript matches the script; lip-sync reads; no brand-name mispronunciation.
- Identity + wardrobe consistent start to finish.
- (Product build) product geometry + label hold; label legible only when shown;
  no extra/warped hands; no contact physics.
- Single continuous take — no cuts, no morph/warp.
- Stack was GPT-image-2 + Seedance 2.0 only; no captions, no music.

## Failure Modes

Inherit the car reference's table. Street-specific rows:

| Symptom | Cause | Fix |
|---|---|---|
| A second person appears / a passerby becomes a foreground subject / someone else speaks | Single-person constraint under-asserted, or second-person-magnet wording in prompt/dialogue | Assert "only ONE person, no second person, no interviewer" in the look directive AND the closer; strip "tell them / she said / we / my friend" from prompt + dialogue; keep passersby "blurred and distant". |
| Audio dysfluency — a word repeats over ~1s (canonical example: native audio said "$90 a month, $90 just gone" instead of "…just gone") | Native-audio artifact on the continuous take | **Canonical fix-loop example:** surgical `stitch_replacement.py` window fix over the ~1s window (silent SAME-ref replacement, `--no-generate-audio`, `--fit stretch`), OR re-roll with the seed. Everything else on the take passed, so fix the window — don't re-roll. |
| Creator appears to be walking / camera glides forward | "stopped / planted" not asserted, or selfie-arm reads as walk-and-talk | "He has stopped walking to talk, standing planted in one spot … not a walk-and-talk." Route true walking to the walk sibling. |
| Locked, staged look | Handheld drift under-specified | "light natural handheld drift — not a locked tripod." |
| Readable storefront signage / logos in background | Small text not forbidden | "all background signage stays blank or illegibly blurred; do not render any readable text or logos." |
| Delivery feels flat / over-explained | Word count too high for a hot-take | Trim toward ~27–30 snappy words; the probe's /watch confirms pace. |
| Brief wants an interview, a reaction, a second speaker, walking, >15s, or on-screen app UI | Out of scope for one single-person stopped monologue | Flag; route to the walk sibling, create-ugc-product-video-from-refs, recreate-ugc-ad-from-source, or a screen-record composite. |

## Skill location & related

- This skill: `one-shot-videos/create-ugc-street-testimonial-video-from-refs/`
- Worked example: `demo/` — brand-free "cancel forgotten subscriptions" money
  hot-take, 15s / 720p, seed **285626872**, ~$4.50. Validated QC: genuine
  single-person stopped-to-talk energy, gestural, identity/wardrobe locked (grey
  tee, open olive overshirt, cord necklace, fade + beard), background pedestrians
  stayed blurred (no second speaker), signage illegible, lip-sync clean. **One
  known nit:** the native audio repeated "ninety" ("$90 a month, $90 just gone")
  — a ~1s dysfluency, the canonical fix-loop example above. Provenance:
  `demo/finals/street-testimonial-15s.mp4.meta.json`.
- **Reference (read first):** `one-shot-videos/create-ugc-car-confessional-video-from-refs`
  (owns the Phase 0 intake, testimonial-vs-product decision, prose recipe,
  gates, GPT-5.5 vet, review/fix loop, and `stitch_replacement.py`).
- **Sibling:** `create-ugc-walk-and-talk-video-from-refs` (walking, not stopped).
- **Family parent:** `one-shot-videos/create-ugc-product-video-from-refs`.
- Atoms: `create-video-seedance-2-fal` + `create-image-gpt-image-fal`.
