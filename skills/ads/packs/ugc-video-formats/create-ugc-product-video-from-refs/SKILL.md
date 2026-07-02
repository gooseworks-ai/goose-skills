---
name: create-ugc-product-video-from-refs
description: >-
  Produce a single vertical selfie-style UGC product video (15s by default,
  duration configurable) from user-supplied reference images of avatar(s) +
  product(s) + an optional environment, plus a natural-language brief of the
  video the user wants. Normalizes the references with GPT-image-2, authors a
  Higgsfield-style beat-by-beat Seedance prompt with @ImageN binding, renders
  ONE Seedance 2.0 reference-to-video call with native lip-synced dialogue, then
  runs an automated review-loop on the result. When the agent OR the user spots
  a bad beat, it re-renders just that beat as a short silent clip and surgically
  stitches it back over the master audio. Stack is GPT-image-2 + Seedance 2.0
  ONLY. No captions. Use when you have (or can generate) avatar + product stills
  and want a quick reference-driven UGC spot — review, demo, unboxing, "showing a
  friend" — modeled on the Higgsfield Marketing Studio @product/@avatar flow.
  NOT for multi-shot 30-90s testimonial montages (use recreate-ugc-ad-from-source)
  or narration-over-b-roll ads with separate VO (use create-natural-ugc-narration-ad).
status: active
---

# create-ugc-product-video-from-refs

## Purpose

Reproduce the Higgsfield Marketing Studio single-call UGC ad on the Fal stack.
The user brings reference images (avatars + products, optionally an environment
plate) and a plain-language brief; this molecule turns that into one Seedance
2.0 reference-to-video render — a vertical, selfie-style UGC product video with
native lip-synced dialogue and internal beat cuts — then hardens it with a
review-and-fix loop.

The reusable IP is **the prompt-authoring recipe** (how a brief + refs becomes a
Seedance prompt) and **the surgical fix loop** (how a single drifted beat gets
re-rendered and stitched without disturbing the rest of the take). The tennis
"AURA 300" racket review is the canonical worked example
(`one-shot-videos/create-ugc-product-video-from-refs/demo/`).

Default output is **15 seconds**. The user may request any duration in
`{4..15}` (Seedance's per-call range); longer asks are out of scope for one call
— say so rather than silently truncating.

Hard stack constraint: **GPT-image-2 + Seedance 2.0 reference-to-video only.**
No ElevenLabs (Seedance generates the dialogue audio natively), no captions
(this format ships clean), no other models.

## Inputs

Required:
- **Reference images** — 1 to 9 stills total (Seedance's `image_urls` cap). Any
  mix of avatar(s) + product(s) + optional environment plate(s). May be real
  files the user supplies, or generated/cleaned by GPT-image-2 in Phase 1.
- **Brief** — natural language: what kind of video, what's being shown, the
  vibe/setting, and any must-say dialogue. Example: "UGC product review for a
  tennis racket, she shows it to a friend on an outdoor court, casual and warm."

Optional:
- `duration` — integer seconds in `{4..15}`. Default **15**.
- `resolution` — `480p | 720p | 1080p`. Default `1080p` for delivery; `720p` is
  the cheap iteration tier (~$0.30/s vs ~$0.68/s).
- `aspect_ratio` — default `9:16`.
- `seed` — for deterministic re-rolls.

Environment: `FAL_KEY` (alias from `FAL_API_KEY` if needed). `OPENAI_API_KEY`
(from `gtm-goose/.env`) only if you want a GPT-5.5 prompt vetting pass.

## Composed Atoms

- `coworkers/atoms/image-generation/create-image-gpt-image-fal` — `--model
  gpt-image-2 --quality high`. Normalizes each reference: product → clean
  white-BG cutout; avatar → neutral-background, empty-handed portrait;
  environment → empty location plate. Routes to the `/edit` variant when given
  `--ref-image`.
- `coworkers/atoms/video-generation/create-video-seedance-2-fal` — the render
  engine. `--image-ref` (repeatable; first ref = `@Image1`), `--duration`,
  `--resolution`, `--aspect-ratio`, `--no-generate-audio` for silent fix clips,
  `--seed`. Native lip-synced dialogue when audio is on.
- `scripts/stitch_replacement.py` (local) — scene-cut-aware surgical replacement
  of one beat, preserving the master's continuous audio.
- `coworkers/orchestrators/default/` review pattern / `watch:watch` — frame
  extraction + Whisper transcript for the review-loop.

## Workflow

> **Approval gate (hard rule):** never fire a GPT-image-2 or Seedance call
> without first pasting the exact prompt(s) and waiting for the user's go. This
> applies to Phase 1, Phase 3, and every fix re-render in Phase 5. See
> `docs/rules/PRODUCTION_RULES.md` and project memory
> `feedback_prompt_review_before_send`.

### Phase 0 — Scaffold + parse brief
Create the project folder (canonical 5-folder layout). From the brief, identify:
the avatar(s), the product(s), the setting, the vibe, and any required dialogue
lines. Decide the reference plan (which refs are supplied vs need generating) and
lock the `@ImageN` order you'll use.

### Phase 1 — Normalize references (GPT-image-2) [APPROVAL GATE]
For each reference, generate/clean to a single clear job:
- **Product** → studio cutout on white, front-on, hero features enumerated.
- **Avatar** → neutral light-grey background, empty hands, natural UGC look. Use
  **filter-safe phrasing** (see Failure Modes — gpt-image-2 rejects "fitted",
  "sleeveless", "real skin texture" etc.).
- **Environment** (optional) → empty location plate, no people/props.
Lock ref order = the `@ImageN` numbering. Review the stills before proceeding.

### Phase 2 — Author the Seedance prompt (the recipe) [APPROVAL GATE for the prompt]
Translate the brief into the **Higgsfield-style structure** — four blocks:

1. **Look directive** — "Vertical 9:16 selfie-style UGC … shot on iPhone,
   handheld, warm natural daylight, real skin tones, no filters."
2. **Reference binding** — declare each ref's job ONCE and explicitly:
   "Use @Image1 as the exact woman identity reference … Use @Image2 as the exact
   single product … @Image3 is the environment only …". Do not let product or
   environment language bleed into the avatar identity.
3. **Consistency anchors** — name distinct colors separately ("bright lime
   outfit vs softer mint frame"); constrain small text to ONE close-up beat
   ("the AURA 300 mark appears only in the close-up; do not invent other text").
4. **Beat-by-beat shot list** — 3–4 beats, each with: camera POV
   ("selfie/front-facing phone POV" vs "rear-camera POV, face off-screen"), an
   approximate time window, the action, and (front-cam beats only) the dialogue
   line. Close on a "no morph, no redesign, same single @ImageN" anchor line.

Budget: **≤ ~28 spoken words for 15s** (scale linearly for other durations).
Front-cam beats carry dialogue + lip-sync; rear/close-up beats carry VO only.
**No contact physics** in any beat (no ball strikes, pours, cuts, rallies).

Optionally vet the prompt with GPT-5.5 (see
`demo/working/vet_seedance_prompt_gpt55.py` for the
pattern) and fold in its edits before the gate.

### Phase 3 — Render the master (Seedance 2.0) [APPROVAL GATE]
One `create-video-seedance-2-fal` call: refs in locked order, the authored
prompt, `--duration` (default 15), `--resolution`, `--aspect-ratio 9:16`, audio
ON. Save to `finals/`.

### Phase 4 — Review-loop (automated QC)
Run the review-loop on the master (frames at ≥2fps + Whisper transcript). Judge
against the format's known failure axes and report a structured issue list:
- Do the beats / hard cuts land in order?
- **Consistency:** identity, the two-color separation, product geometry/shape,
  hero color features (e.g. string grid), small text.
- **Lip-sync:** does the transcript match the scripted lines on the front-cam
  beats?
- **Physics/limbs:** any morphing product, duplicate objects, contorted bodies,
  or stray objects (a ball appearing, etc.)?
- **Motion beats:** does any action beat (swing, gesture) read clean or flail?
Surface the issues with timestamps. If clean, present for final review.

### Phase 5 — Fix-loop (agent- OR user-flagged) [APPROVAL GATE per re-render]
For each confirmed bad beat — whether the review-loop found it or **the user
points it out** — propose the cheapest fix and get approval before spending:
1. Identify the beat's exact window via scene-cut detection
   (`stitch_replacement.py` does this, or detect manually).
2. Author a **short replacement clip prompt** (typically 4s) using the SAME refs
   so identity/product/wardrobe match. For action beats, prefer **no-contact
   motion** (a shadow swing/serve with no ball) — contact physics is what
   drifts. Paste the prompt → **gate**.
3. Render the replacement with `--no-generate-audio` (the master keeps the
   audio), matching resolution/aspect/fps.
4. **Review the replacement clip on its own first** — never stitch in a clip
   that has its own drift.
5. Stitch with `scripts/stitch_replacement.py` (`--replace-beat N` or
   `--window-start/--window-end`; `--fit stretch` is the default and flatters
   athletic motion). The master's audio plays straight through.
6. Re-run the review-loop (Phase 4) on the stitched result.

### Phase 6 — Final review
Hand the finished mp4 (absolute path + folder path) to the user for sign-off.
No captions — this format ships clean.

## Decision Rules

1. **One Seedance call = one short take.** Default 15s; honor a user duration in
   `{4..15}`. A brief that implies >15s or >4 talking beats is too big for this
   molecule — flag it, don't truncate silently.
2. **Orthogonal reference slots.** Avatar / product / environment each get a
   clean ref with one job, and each is declared once in the prompt. A
   pre-composited "avatar already on location holding the product" over-
   constrains the model and causes the product to fight the product ref.
3. **Environment ref is optional.** Generic settings (a court, a kitchen, a
   sidewalk) render fine from text — describe them and save a ref slot. Add an
   environment plate only when the location must be specific/branded.
4. **≤ ~28 spoken words / 15s; front-cam beats only for dialogue.** Rear-camera
   and close-up beats are "POV, face off-screen" so the model doesn't fake a
   talking mouth. Scale the word budget with duration.
5. **No contact physics, ever.** Product demos = tilts, holds, hand-offs,
   close-ups, one simple gesture, or a SHADOW swing with no ball. Real strikes,
   pours, cuts, or rallies turn to mush. This is the #1 cause of a bad beat.
6. **Restate hero color features per beat.** Distinctive product colors/patterns
   (an orange string grid, a two-tone cap) survive better when named in the beat
   text, not just the ref-binding line. Small text drifts regardless — pin it to
   one close-up and forbid invented text.
7. **Name distinct colors separately.** "Lime outfit + mint frame", never "green
   outfit and green racket" — same-family colors blend into one under daylight.
8. **Fix the beat, don't re-roll the take.** A single drifted beat is a 4s silent
   re-render + a stitch (~$1.20 at 720p), not a full $5–10 re-render. Re-roll the
   whole master only when ≥2 beats are broken or identity itself drifted.
9. **Silent fix clips + video-only swap.** Replacement clips render with
   `--no-generate-audio`; the master's continuous audio is preserved so the VO
   and lip-sync on untouched beats never move. (Project memory
   `feedback_video_overlay_over_audio_bridging`.)
10. **Review the replacement before stitching.** Run the review-loop on the new
    clip in isolation; only stitch a clean one.
11. **`--fit stretch` by default.** The replacement is rarely the exact hole
    length; stretching to fill keeps the timeline + audio aligned and reads as
    gentle slow-mo. Use `trim`/`freeze` only when stretch artifacts show.
12. **Every paid call is gated.** Paste each GPT-image-2 / Seedance prompt and
    wait for go. No silent fallbacks.

## Output

```
<project>/
  assets/refs/        ← normalized @Image1..N reference stills (GPT-image-2)
  working/            ← seedance_prompt.txt, replacement prompts, fix clips,
                        review frames/transcripts, gpt55 review (optional)
  finals/
    <name>.mp4              ← master render
    <name>-v2.mp4           ← after surgical fix(es)   (delivered file)
```

Delivered artifact: one vertical mp4 at the requested duration/resolution, no
burned captions, native dialogue audio, with each drifted beat repaired.

## Quality Checks

- Duration within ±0.2s of requested; aspect 9:16; plays in a standard player.
- Beats land in scripted order with clean hard cuts (no black frames at seams).
- Transcript matches the scripted dialogue on the front-cam beats; lip-sync reads.
- Identity, two-color separation, and product geometry hold across every cut.
- No morphing/duplicate products, contorted limbs, or unintended objects.
- Any repaired beat reviewed clean in isolation before stitching; stitched output
  re-reviewed and audio still in sync.
- Stack used was GPT-image-2 + Seedance 2.0 only; no captions added.

## Failure Modes

| Symptom | Cause | Fix |
|---|---|---|
| gpt-image-2 returns `content_policy_violation` on an avatar prompt | Words like "young woman", "fitted", "sleeveless", "real skin texture" trip the classifier | Reword to neutral/athletic: "female [sport] player", "athletic outfit", drop body-descriptor adjectives. Validated on the AURA 300 avatar. |
| Hero color feature renders muted (e.g. vivid orange strings come back pale) | Feature stated only in the ref-binding line; Seedance under-weights it across cuts | Restate the feature inside the beats that show it; accept that macro close-ups pale it most. |
| Two same-family colors blend into one neon | "green outfit and green racket" read as one color | Name them distinctly ("bright lime" vs "mint-to-white gradient"). |
| An action beat flails — racket morphs/duplicates, body contorts, a ball appears | Contact/sport physics in a single render | Re-render that beat as a 4s **shadow** swing (no ball), `--no-generate-audio`, and stitch. This is the canonical fix (AURA 300 beat 2). |
| Small product text (model name) is illegible/garbled | Seedance can't hold small text under motion | Don't rely on it — pin it to one close-up, forbid invented text, carry the brand name elsewhere (end-card outside this molecule). |
| Stitched output drifts from 15s / audio out of sync | Replacement length ≠ hole and no fit applied | Use `stitch_replacement.py --fit stretch`; it warns if output drifts >0.15s from master. |
| Front-cam beat has no/weird lip-sync | Beat labeled rear-cam, or dialogue exceeds the word budget | Label dialogue beats "selfie/front-facing phone POV"; trim to ≤28 words/15s. |
| Brief needs >15s or 5+ talking beats | Out of scope for one Seedance call | Tell the user; split into multiple takes or route to `recreate-ugc-ad-from-source`. |

## Skill location & related

- This skill: `one-shot-videos/create-ugc-product-video-from-refs/`
- Worked example: `one-shot-videos/create-ugc-product-video-from-refs/demo/` (AURA 300 tennis review)
- Related: `coworkers/molecules/ugc-ad/recreate-ugc-ad-from-source` (multi-shot 30-90s montage),
  `create-natural-ugc-narration-ad` (narration-over-b-roll, separate VO),
  atoms `create-video-seedance-2-fal` + `create-image-gpt-image-fal`.
