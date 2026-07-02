---
name: create-ugc-grwm-video-from-refs
description: >-
  Produce a single vertical "Get Ready With Me" (GRWM) fashion-vlog UGC video
  (15s by default, duration configurable {4..15}) from user-supplied reference
  images of an avatar + 1-N garment/product stills + an optional bedroom
  environment plate, plus a natural-language brief. Normalizes the references
  with GPT-image-2, authors a Higgsfield-style beat-by-beat Seedance prompt with
  @ImageN binding (avatar already WEARING the garment refs), renders ONE Seedance
  2.0 reference-to-video call with native lip-synced dialogue, then runs an
  automated review-loop. Includes at least one full-body mirror reveal of the
  whole outfit and a playful "reaction" beat. Stack is GPT-image-2 + Seedance 2.0
  ONLY. No captions. Single-person by default — the signature playful-interruption
  moment is staged as the creator reacting to something OFF-camera (glance, laugh,
  hand-wave), never a visible second person. Use when you have (or can generate)
  an avatar + outfit stills and want a quick try-on / outfit-reveal GRWM spot.
  This is the GRWM sibling of create-ugc-product-video-from-refs (selfie product
  review); for multi-shot 30-90s testimonial montages use recreate-ugc-ad-from-source,
  and for narration-over-b-roll with separate VO use create-natural-ugc-narration-ad.
status: active
---

# create-ugc-grwm-video-from-refs

## Purpose

Reproduce the Higgsfield Marketing Studio single-call UGC ad on the Fal stack,
specialized for the **Get Ready With Me / outfit try-on** format: a creator in an
aesthetic bedroom showing off an outfit with playful, confident fashion-vlog
energy. The user brings an avatar ref + one or more garment refs (+ optional
bedroom plate) and a plain-language brief; this molecule turns that into one
Seedance 2.0 reference-to-video render — a vertical GRWM video with native
lip-synced dialogue, a full-body outfit reveal, and internal jump cuts — then
hardens it with a review-and-fix loop.

This is the **second molecule in the one-shot UGC family** and is built by
**specializing** the first (`create-ugc-product-video-from-refs`). It reuses that
molecule's IP verbatim — the four-block prompt recipe, the approval gates, the
GPT-5.5 prompt-vetting pass, the review-loop + fix-loop, and
`scripts/stitch_replacement.py` (surgical single-beat replacement that preserves
the master audio). **Read the parent SKILL.md first**; this file documents only
the GRWM-specific deltas. The worked example is the white-tee-with-red-stars GRWM
spot (`demo/`).

Default output is **15 seconds**; honor any user duration in `{4..15}`. Hard
stack constraint: **GPT-image-2 + Seedance 2.0 reference-to-video only.** No
ElevenLabs, no captions, no other models.

## Inputs

Required:
- **Avatar ref** — one still of the person. For GRWM, prefer a **full-length**
  neutral-basics portrait (not a selfie crop) so the model can both keep identity
  AND render the full-body outfit reveal.
- **Garment/product ref(s)** — 1 to N stills of the outfit pieces (clean
  product/flatlay shots on white). Each is bound as an `@ImageN` slot and the
  avatar is composed already WEARING them.
- **Brief** — natural language: the outfit, the vibe, the room, any must-say
  dialogue.

Optional:
- **Bedroom environment plate** — an empty aesthetic-room still (mirror, rack,
  bed, window). Optional per Decision Rule 3, but a real plate locks the room
  across cuts and reads more premium than a text-described room.
- **Second-person ("friend") ref** — *discouraged by default* (see Failure Mode
  #1). Only add one if the brief truly needs a visible second person and you
  accept the drift risk + a likely fix-loop.
- `duration` (int `{4..15}`, default **15**), `resolution`
  (`480p|720p|1080p`, default `720p` for iteration), `aspect_ratio` (default
  `9:16`), `seed`.

Environment: `FAL_KEY` (alias from `FAL_API_KEY`). `OPENAI_API_KEY` (from
`gtm-goose/.env`) for the optional GPT-5.5 prompt-vetting pass.

## Composed Atoms

- `skills/atoms/image-generation/create-image-gpt-image-fal` — `--model
  gpt-image-2 --quality high`. Avatar → full-length neutral-BG, neutral-basics,
  empty-handed portrait (filter-safe phrasing). Each garment → clean white-BG
  product shot, distinctive features enumerated. Environment → empty bedroom
  plate.
- `skills/atoms/video-generation/create-video-seedance-2-fal` — the render
  engine. `--image-ref` (repeatable; first = `@Image1`), `--duration`,
  `--resolution`, `--aspect-ratio 9:16`, `--no-generate-audio` for silent fix
  clips, `--seed`. Native lip-synced dialogue when audio is on.
- `scripts/stitch_replacement.py` (local; copied from the parent — **do not
  rewrite**) — scene-cut-aware surgical replacement of one beat, preserving the
  master's continuous audio. Call with `--replace-beat N --fit stretch`.
- `skills/atoms/review/watch` (`/watch:watch`) — frame extraction + Whisper
  transcript for the review-loop.

## Workflow

> **Approval gate (hard rule):** never fire a GPT-image-2 or Seedance call
> without first pasting the exact prompt(s) and waiting for the user's go — Phase
> 1, Phase 3, and every fix re-render in Phase 5. See
> `docs/rules/PRODUCTION_RULES.md` and project memory
> `feedback_prompt_review_before_send`.

### Phase 0 — Scaffold + parse brief
Create the project folder (canonical 5-folder layout). Identify the avatar, the
garment piece(s), the room, the vibe, and the dialogue lines. Lock the `@ImageN`
order (avatar = `@Image1`, garments next, environment last).

### Phase 1 — Normalize references (GPT-image-2) [APPROVAL GATE]
- **Avatar** → full-length, plain light-grey BG, neutral basics, empty hands,
  natural UGC look. Use **filter-safe phrasing** (gpt-image-2 rejects "young
  woman", "fitted", "sleeveless", "real skin texture" — see Failure Modes).
- **Each garment** → clean white-BG product shot; name the distinctive features
  (color, pattern, cut) — this is the product-fidelity equivalent of the parent's
  racket enumeration.
- **Bedroom plate** (optional) → empty aesthetic room, no people.
Review the stills before proceeding.

### Phase 2 — Author the Seedance prompt (the recipe) [APPROVAL GATE for the prompt]
Use the parent's **four-block structure**, with GRWM specializations:
1. **Look directive** — "Vertical 9:16 selfie-style UGC *get ready with me*
   fashion vlog, iPhone front camera, playful confident energy, soft natural
   daylight, real skin tones, no filters, slight handheld movement."
2. **Reference binding** — declare each job ONCE: `@Image1` = identity + body
   type only ("ignore the avatar's neutral basics except for identity");
   `@Image2..` = "she is **already wearing** [garment]" with features named;
   `@Image3` = bedroom set only.
3. **Consistency anchors** — single-person + negative-visibility block (no second
   person / partial body / hand / face / shadow / reflected extra person); garment
   pattern invariants restated ("stars vivid red, five-pointed, non-text,
   consistent scale"); "already fully dressed, do not show changing clothes"; "no
   invented text/logos".
4. **Beat-by-beat shot list** — 3-4 beats. **Mandatory beats:** one front-cam
   intro, the playful **off-camera reaction** beat (single-person — see Decision
   Rule 5), and one **full-length mirror reveal** ("phone aimed at the mirror, her
   entire body visible head-to-toe in one reflection only, full outfit"). Close on
   a "same woman, same outfit, same room, single person, no morph" anchor.

Budget **≤ ~28 spoken words / 15s**. Dialogue only on front-cam beats. **No
contact physics, no second person.** GPT-5.5-vet the prompt
(`demo/working/vet_seedance_prompt_gpt55.py` pattern) and fold edits in before the
gate — it reliably catches second-person-magnet wording.

### Phase 3 — Render the master (Seedance 2.0) [APPROVAL GATE]
One `create-video-seedance-2-fal` call: refs in locked order, the authored
prompt, `--duration` (default 15), `--resolution`, `--aspect-ratio 9:16`, audio
ON. Save to `finals/`.

### Phase 4 — Review-loop (automated QC)
Frames at ≥2fps (montage) + Whisper transcript. Judge: beat order/cuts;
**single-person integrity** (no second body anywhere, including mirror
reflections); the **full-body reveal** actually shows the whole outfit; garment
fidelity (pattern/color/scale) across selfie + mirror cuts; identity + room
consistency; lip-sync vs script; limbs/morphs/stray objects. Report issues with
timestamps; if clean, present for final review.

### Phase 5 — Fix-loop (agent- OR user-flagged) [APPROVAL GATE per re-render]
For each confirmed bad beat: propose the cheapest fix → gate → render a short
(typically 4s) replacement with the SAME refs and `--no-generate-audio`, using
single-person no-contact motion → review the clip alone → stitch with
`scripts/stitch_replacement.py --replace-beat N --fit stretch` (preserves master
audio) → re-review (Phase 4).

### Phase 6 — Final review
Hand the finished mp4 (absolute path + folder path) to the user. No captions.

## Decision Rules

1. **One Seedance call = one short take.** Default 15s; honor `{4..15}`. >15s or
   >4 talking beats is out of scope — flag, don't truncate.
2. **Orthogonal reference slots.** Avatar (identity only) / each garment / room
   each get a clean single-job ref, declared once. Don't pre-compose "avatar
   already dressed on location".
3. **Bedroom plate is optional but recommended.** A generic room renders from
   text; add a plate when the room should be specific/consistent across cuts (it
   reads more premium and locks mirror geometry).
4. **≤ ~28 spoken words / 15s; front-cam beats only for dialogue.** The mirror
   reveal can carry a short line (smaller mouth is fine). Scale with duration.
5. **Single person by default; the interruption is an OFF-camera reaction.** The
   GRWM "friend barges in / gets pushed out" beat is the highest-drift moment in
   the family (a second body + near-contact physics). Stage it as the creator
   reacting to something off-camera — glance aside, laugh, tiny dismissive
   hand-wave to empty space — and **ban second-person-magnet words** in the prompt
   ("someone", "friend", "get out", "shooing", "barges in", "enters", "door",
   "pushes"). Use dialogue like "Nope — not taking comments" / "Absolutely not" /
   "You didn't see that", never "Get out / Leave". (See Failure Mode #1.)
6. **Every GRWM needs one explicit full-body reveal beat.** Don't rely on "steps
   back" — say "phone aimed at the mirror, entire body head-to-toe, full outfit,
   one reflection only". This is the format's payoff.
7. **Restate garment invariants per beat + name distinct colors separately.**
   Patterns morph into logos/hearts/flowers and change scale across cuts unless
   the invariants ("vivid red five-pointed stars, non-text, consistent scale") are
   repeated. Forbid invented text/logos.
8. **No contact physics, ever.** No real pushing, grabbing, changing-clothes
   physics, or hand-offs. Tilts, holds, poses, a turn, a hand-wave only.
9. **Fix the beat, don't re-roll the take.** A single drifted beat is a 4s silent
   re-render + stitch (~$1.20 at 720p), not a full re-render. Re-roll only when
   ≥2 beats break or identity drifts.
10. **Silent fix clips + video-only swap.** Replacements render
    `--no-generate-audio`; the master's continuous audio is preserved (project
    memory `feedback_video_overlay_over_audio_bridging`).
11. **Review the replacement before stitching;** only stitch a clean clip.
12. **`--fit stretch` by default** for the stitch; `trim`/`freeze` only if stretch
    artifacts show.
13. **Every paid call is gated.** Paste each GPT-image-2 / Seedance prompt and
    wait for go. No silent fallbacks.

## Output

```
<project>/
  assets/refs/        ← normalized @Image1..N stills (avatar full-length,
                        garment(s), optional bedroom plate)
  working/            ← seedance_prompt.txt, gpt55 review (optional), replacement
                        prompts + silent fix clips, review frames/montage/transcript
  finals/
    <name>.mp4              ← master render
    <name>-v2.mp4           ← after any surgical beat fix (delivered)
```

Delivered artifact: one vertical 9:16 GRWM mp4 at the requested
duration/resolution, no burned captions, native dialogue audio, single person,
full outfit revealed, each drifted beat repaired.

## Quality Checks

- Duration within ±0.2s of requested; aspect 9:16; plays in a standard player.
- Beats land in scripted order with clean hard cuts (no black frames at seams).
- **Single person throughout** — no second body, partial body, stray hand, or
  extra reflection anywhere, including the off-camera reaction beat and mirror.
- **Full outfit is revealed** head-to-toe in at least one mirror/full-body beat.
- Garment color/pattern/scale holds across selfie + mirror cuts; no invented
  text/logos; distinct colors stay distinct.
- Transcript matches the scripted dialogue on the front-cam beats; lip-sync reads.
- No morphing garments/duplicate objects, contorted limbs, or unintended objects.
- Any repaired beat reviewed clean in isolation before stitching; stitched output
  re-reviewed and audio still in sync.
- Stack used was GPT-image-2 + Seedance 2.0 only; no captions added.

## Failure Modes

| Symptom | Cause | Fix |
|---|---|---|
| **A second person appears (in frame or in the mirror) during the "interruption"/reaction beat** | Prompt used second-person-magnet words ("someone", "friend", "get out", "shooing", "barges in", "enters", "door", "pushes"); Seedance literalizes them | **#1 failure mode.** Stage the beat as a single-person off-camera reaction (glance aside, laugh, hand-wave to empty space); add a negative-visibility block ("no second person / partial body / hand / face / shadow / reflected extra person"); use dialogue like "Nope — not taking comments". Validated on the demo: this phrasing produced a clean single-person render on the FIRST take. |
| gpt-image-2 returns `content_policy_violation` on the avatar prompt | "young woman", "fitted", "sleeveless", "real skin texture" trip the classifier | Reword neutrally: "a stylish woman", "plain neutral basics"; drop body-descriptor adjectives. |
| Full outfit never clearly shown | All beats are selfie-framed; "steps back" alone doesn't force a full-body shot | Add an explicit full-length mirror beat: "phone aimed at the mirror, entire body head-to-toe, one reflection only, full outfit". |
| Garment pattern morphs (stars → dots/hearts/logos) or changes scale across cuts | Pattern stated only in the ref-binding line; Seedance under-weights it across cuts | Restate the invariants in the anchors AND the beats; forbid invented text/logos; name the exact shape ("five-pointed stars, non-text"). |
| Mirror shows a duplicate/extra person | Mirror geometry invites reflected bodies | "one reflection only … no reflected extra person" in the consistency block. |
| Changing-clothes physics looks like mush | Brief implied her getting dressed on camera | "She is already fully dressed in [garment]; do not show changing clothes or pulling garments on." |
| Stitched output drifts from duration / audio out of sync | Replacement length ≠ hole and no fit applied | `stitch_replacement.py --fit stretch`; it warns if output drifts >0.15s. |
| Front-cam beat has weird/no lip-sync | Beat labeled non-front-cam, or dialogue over budget | Label dialogue beats "selfie / front-facing phone POV"; trim to ≤28 words/15s. |
| Brief needs a real visible second person, >15s, or 5+ talking beats | Out of scope for one single-person Seedance call | Tell the user; a visible second person is opt-in with accepted drift risk + fix-loop, or route to `recreate-ugc-ad-from-source`. |

## Skill location & related

- This skill: `one-shot-videos/create-ugc-grwm-video-from-refs/`
- Worked example: `one-shot-videos/create-ugc-grwm-video-from-refs/demo/`
  (white-tee-with-red-stars GRWM, 15s/720p)
- Parent (read first): `one-shot-videos/create-ugc-product-video-from-refs/`
  (selfie product review) — shares the prompt recipe + `stitch_replacement.py`.
- Sibling (planned): `create-ugc-skincare-demo-video-from-refs`.
- Related: `skills/molecules/ugc-ad/recreate-ugc-ad-from-source` (multi-shot
  30-90s montage), `create-natural-ugc-narration-ad` (narration-over-b-roll),
  atoms `create-video-seedance-2-fal` + `create-image-gpt-image-fal`.
