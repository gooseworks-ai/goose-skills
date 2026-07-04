---
name: create-ugc-skincare-demo-video-from-refs
description: >-
  Produce a single vertical bathroom skincare-APPLICATION UGC video (15s by
  default, duration configurable) from a skincare product reference + an avatar
  reference + a natural-language brief. Normalizes the refs with GPT-image-2,
  authors an intimate close-up-heavy beat-by-beat Seedance prompt with @ImageN
  binding, renders ONE Seedance 2.0 reference-to-video call with native
  lip-synced dialogue + bathroom room tone only, then runs an automated
  review-loop. The signature constraint: NO phone / camera / hands-holding-a-
  phone / mirror-of-a-device may EVER be visible — it reads as a real girl
  filming a quick clip for friends, never a mirror selfie. When a beat drifts,
  re-renders just that beat as a short silent clip and surgically stitches it
  over the master audio. Stack is GPT-image-2 + Seedance 2.0 ONLY. No captions,
  no music, no SFX. Use for an intimate skincare demo — serum/cream/moisturizer
  applied to the face in a bright bathroom. NOT for selfie product reviews shown
  to a friend (use create-ugc-product-video-from-refs) or GRWM/outfit try-on
  (use create-ugc-grwm-video-from-refs).
status: active
---

# create-ugc-skincare-demo-video-from-refs

## Purpose

Reproduce the Higgsfield "bathroom skincare application" UGC ad on the Fal
stack. The user brings a skincare product still + an avatar still + a
plain-language brief; this molecule turns that into one Seedance 2.0
reference-to-video render — a vertical, intimate, close-up-heavy skincare demo
where she applies the product to her face in a bright bathroom, with native
lip-synced dialogue and bathroom room tone — then hardens it with a review-and-
fix loop.

This is the **third sibling** in the `one-shot-videos/` family and is built by
**specializing the parent** (`create-ugc-product-video-from-refs`): the same
four-block prompt recipe, the same approval gates, the same GPT-5.5 prompt-
vetting pass, the same review-loop + fix-loop, and the **same
`scripts/stitch_replacement.py` reused verbatim**. Only the skincare-specific
deltas below differ. The `LUMÉ` glow-serum demo is the canonical worked example
(`demo/`).

Default output is **15 seconds**; the user may request any duration in
`{4..15}` (Seedance's per-call range). Longer asks are out of scope for one call.

Hard stack constraint: **GPT-image-2 + Seedance 2.0 reference-to-video only.**
No ElevenLabs (Seedance generates the dialogue natively), no captions, **no
music, no SFX** (this format ships clean with voice + room tone only), no other
models.

## Inputs

Required:
- **Reference images** — usually just **2**: the skincare product (clean studio
  cutout, label legible) + the avatar (person, neutral background, empty hands).
  **Follow the parent's product-reference hard rule:** the product ref must be a
  **standalone shot of the product alone on a plain/white background — never held
  in a hand or in a lifestyle scene** (an in-hand/lifestyle ref makes Seedance
  hallucinate a generic look-alike). Source order: official site → web research →
  GPT-image-2 a standalone-on-white from the closest shot.
  Up to 9 total allowed (Seedance's `image_urls` cap). The bathroom setting is
  rendered from the prompt text — an environment plate is rarely needed.
- **Brief** — natural language: the product, the vibe, must-say dialogue.
  Example: "Intimate bathroom skincare demo — she's obsessed with a new glow
  serum, applies it to her face, warm and excited."

Optional:
- `duration` — integer seconds in `{4..15}`. Default **15**.
- `resolution` — `480p | 720p | 1080p`. Default `1080p` for delivery; `720p` is
  the cheap iteration tier (~$0.30/s vs ~$0.68/s).
- `aspect_ratio` — default `9:16`.
- `seed` — for deterministic re-rolls.

Environment: `FAL_KEY` (alias from `FAL_API_KEY` if needed). `OPENAI_API_KEY`
(from `gtm-goose/.env`) for the GPT-5.5 prompt-vetting pass + Whisper review.

## Composed Atoms

- `skills/atoms/image-generation/create-image-gpt-image-fal` — `--model
  gpt-image-2 --quality high`. Product → clean white-BG cutout, label legible;
  avatar → neutral-grey-background, empty-handed portrait (filter-safe phrasing).
- `skills/atoms/video-generation/create-video-seedance-2-fal` — the render
  engine. `--image-ref` (repeatable; first ref = `@Image1`), `--duration`,
  `--resolution`, `--aspect-ratio`, `--generate-audio` / `--no-generate-audio`
  for silent fix clips, `--seed`.
- `scripts/stitch_replacement.py` (local, **reused verbatim from the parent**) —
  scene-cut-aware surgical replacement of one beat, preserving the master audio.
- `demo/working/vet_seedance_prompt_gpt55.py` — adapts the parent's GPT-5.5 vet
  to focus on the no-device/no-mirror constraint + hand/product drift.
- `watch:watch` / frame extraction + Whisper — the review-loop.

## Workflow

> **Approval gate (hard rule):** never fire a GPT-image-2 or Seedance call
> without first pasting the exact prompt(s) and waiting for the user's go. This
> applies to Phase 1, Phase 3, and every fix re-render in Phase 5. See
> `docs/rules/PRODUCTION_RULES.md` and project memory
> `feedback_prompt_review_before_send`.

### Phase 0 — Self-directing intake (research first, ask the gaps, confirm the brief)
Run the **product parent's Phase 0 self-directing intake** verbatim (derive the
checklist → research the knowable unknowns first → ask only the gaps → assemble the
brief → **HARD approval gate before any paid call**). Skincare-specific checklist
items: the **product** and its standalone-on-white ref, the **bathroom setting**,
and the **no-phone / no-mirror / invisible-camera** constraint (bake it into the
brief so it can't be forgotten downstream). **Research the brand first** — claims,
hero ingredient, palette, existing ads — before asking. Lock the `@ImageN` order
(avatar = `@Image1`, product = `@Image2`).

### Phase 1 — Normalize references (GPT-image-2) [APPROVAL GATE]
- **Product** → frosted/studio cutout on white, front-on, label legible, hero
  features named.
- **Avatar** → neutral light-grey background, empty hands, natural look. Use
  **filter-safe phrasing**: "woman in her early twenties" (not "young girl"),
  "casual cream top" (not "fitted/sleeveless"), drop "real skin texture". See
  Failure Modes.
Keep refs **orthogonal** — the avatar ref carries identity only; the bathroom
comes from the prompt text, NOT baked into the avatar still. Review the stills.

### Phase 2 — Author the Seedance prompt (the recipe) [APPROVAL GATE for the prompt]
Four blocks, specialized for skincare:

1. **Look + camera directive** — "A single 15-second vertical 9:16 UGC video of
   five hard-cut shots in a bright bathroom (white tiles, window daylight, towel,
   plant) … handheld, smartphone-lens, no grading, no filters." **Then the
   signature block:** "every shot is a direct-to-viewer handheld creator shot
   from an **invisible camera**; no selfie framing, no phone POV, no mirror shot,
   no visible filming device. No mirror or reflective filming surface anywhere."
   — NEVER use "selfie / front-facing phone POV"; that positive concept summons a
   phone or mirror and overrides the negative constraint (the #1 failure axis).
2. **Reference binding** — "Use @Image1 only for the woman's identity (face,
   hair, age, top); do not use its studio background. Use @Image2 only for the
   product: same bottle/cap/label placement reading '<NAME>'."
3. **Consistency anchors** — one person; same bathroom continuity; bottle upright
   at same proportions; the only readable text is the product label, only in the
   hero close-up; no invented text/logos/captions.
4. **Beat-by-beat shot list** — 4–5 tight close-up beats, hard cuts: (a)
   extreme-close-up face hook, (b) product to cheek (label catches light), (c)
   **face-visible** medium-close application — one hand, two fingertips (NOT an
   extreme hand macro), (d) glow reveal (turns face in light), (e) final hold
   near face. Dialogue ONLY on beats where the mouth is visible.

Budget: **≤ ~28 spoken words / 15s** (the worked example lands ~15). **No
dialogue on the silent application beat.** **No contact physics.**

**Pace + performance (or it renders slow, static, and emotionless).** "Intimate"
must not collapse into slo-mo or a single held look. Two hard rules: (1) state
**"real-time, natural conversational speed, NOT slow-motion"** — omitting this is
what made the v1 read like a dreamy slo-mo ad. (2) **Vary the framing** — the
beats above already ladder ECU → product-to-cheek → medium application → glow
reveal; keep that range, don't shoot every beat as an extreme close-up (a fixed
ECU on all beats is static and low-energy). Give each mouth-visible beat a small
**changing expression** cue (soft confiding smile → a beat of genuine "it worked"
delight on the reveal) and add **"lips stay closed when not speaking; no single
expression held >2s."** The reference skin (a real GRWM/skincare demo) has visible
energy and shifting expression — match it.

Vet the prompt with GPT-5.5 (`demo/working/vet_seedance_prompt_gpt55.py`) and
fold in its edits before the gate.

### Phase 3 — Render the master (Seedance 2.0) [APPROVAL GATE]
One `create-video-seedance-2-fal` call: refs in locked order (`@Image1` avatar,
`@Image2` product), the authored prompt, `--duration` (default 15),
`--resolution`, `--aspect-ratio 9:16`, `--generate-audio`. Save to `finals/`.

### Phase 4 — Review-loop (automated QC)
Frames at ≥2fps + Whisper transcript. Report a structured, timestamped issue
list covering:
- Beat order + clean hard cuts.
- **THE SIGNATURE CHECK — scan every frame for a phone / camera / hands-holding-
  a-phone / any mirror showing a device. A single stray device or mirror-selfie
  is an automatic FAIL and a fix-loop trigger.**
- Consistency: identity, bathroom continuity, product geometry + label.
- Lip-sync: transcript vs script on the talking beats; silent beat stays silent.
- Hands: the application close-up for extra/warped fingers.
- Audio: voice + room tone only, NO music/SFX.

### Phase 5 — Fix-loop (agent- OR user-flagged) [APPROVAL GATE per re-render]
For each confirmed bad beat — the no-device/no-mirror violation is the priority
trigger — propose the cheapest fix and gate it:
1. Find the beat window via scene-cut detection (`stitch_replacement.py`).
2. Author a **short replacement clip prompt** (typically 4s) with the SAME refs
   and the SAME invisible-camera / no-mirror language. Paste → **gate**.
3. Render with `--no-generate-audio` (master keeps the audio), matching
   resolution/aspect/fps.
4. **Review the replacement clip alone first** — never stitch in a clip that
   itself shows a device or drift.
5. Stitch with `scripts/stitch_replacement.py` (`--replace-beat N`; `--fit
   stretch` default). Master audio plays straight through.
6. Re-run Phase 4 on the stitched result.

### Phase 6 — Final review
Hand the finished mp4 (absolute path + folder path) to the user. No captions —
this format ships clean.

## Decision Rules

1. **One Seedance call = one short take.** Default 15s; honor `{4..15}`. >15s or
   >4 talking beats is too big — flag it, don't truncate.
2. **NEVER say "selfie" / "front-facing phone POV" / "phone POV".** Use
   "direct-to-viewer handheld shot from an invisible camera." Positive
   phone/selfie language overrides the negative no-device constraint — this is
   the make-or-break rule of the format (GPT-5.5-confirmed on the LUMÉ build).
3. **Ban mirrors absolutely — no conditional.** "No mirror or reflective filming
   surface anywhere; bathroom angles avoid mirrors entirely." A conditional ("if
   a mirror appears, it only shows her face") still summons a mirror.
4. **Orthogonal reference slots.** Avatar ref = identity only (neutral BG,
   "do not use its studio background"); product ref = product only. Bathroom from
   text. A pre-composited "her already in the bathroom holding the product"
   over-constrains the render.
5. **Application is a face-visible medium-close, not a hand macro.** One hand,
   two fingertips, simple slow motion. Extreme hand macros grow extra/warped
   fingers — the top hand-drift risk for this format.
6. **Dialogue only where the mouth is visible; the application beat is silent.**
   Don't put a spoken line on the fingertip-application beat — the mouth is busy
   / half-out-of-frame and lip-sync mushes. ≤ ~28 words / 15s.
7. **Restate the product's color + label per beat it appears in.** Small label
   text survives best when pinned to ONE hero close-up; forbid invented text
   everywhere else (Seedance can't hold small text under motion).
8. **Audio = voice + bathroom room tone ONLY.** Explicitly forbid music, jingle,
   whooshes, UI/product sounds, narrator. Drop "water drip" — it reads as an SFX
   Seedance may exaggerate; "quiet bathroom room tone + soft tile reverb" is
   safer.
9. **No contact physics.** Gentle cream-on-skin only; no pours, splashes, or
   complex finger poses.
10. **Fix the beat, don't re-roll the take.** A single drifted beat (or a stray
    mirror) is a 4s silent re-render + stitch (~$1.20 at 720p), not a full
    re-render. Re-roll the master only when ≥2 beats break or identity drifts.
11. **Silent fix clips + video-only swap; review before stitching; `--fit
    stretch` by default.** (Inherited from the parent.)
12. **Every paid call is gated.** Paste each GPT-image-2 / Seedance prompt and
    wait for go. No silent fallbacks.

## Output

```
<project>/
  assets/refs/        ← normalized @Image1 (avatar) + @Image2 (product) stills
  working/            ← seedance_prompt.txt, gpt55 review, replacement prompts,
                        fix clips (silent), review frames/transcript
  finals/
    <name>.mp4              ← master render
    <name>-v2.mp4           ← after any surgical fix(es)  (delivered)
```

Delivered artifact: one vertical mp4 at the requested duration/resolution, no
burned captions, native dialogue + bathroom room tone only, with each drifted
beat (and any stray device/mirror) repaired.

## Quality Checks

- Duration within ±0.2s of requested; aspect 9:16; plays in a standard player.
- **NO phone / camera / hands-holding-a-phone / mirror-of-a-device in any frame.**
- Beats land in scripted order with clean hard cuts (no black frames at seams).
- Transcript matches the scripted dialogue on the talking beats; lip-sync reads;
  the application beat is silent.
- Identity + bathroom continuity + product geometry/label hold across cuts; the
  product label is legible in the hero close-up.
- No extra/warped fingers in the application beat; no morphing/duplicate product.
- Audio is voice + room tone only — no music, no SFX.
- Any repaired beat reviewed clean in isolation before stitching; stitched output
  re-reviewed and audio still in sync.
- Stack used was GPT-image-2 + Seedance 2.0 only; no captions added.

## Failure Modes

| Symptom | Cause | Fix |
|---|---|---|
| A phone / mirror-selfie / hands-holding-a-phone appears | The prompt used "selfie" / "front-facing phone POV", or a conditional mirror clause — positive visual concepts that override the negative constraint | Remove ALL selfie/phone-POV language → "invisible camera"; ban mirrors unconditionally. Re-render the offending beat (4s, silent) and stitch. This is the signature failure axis. |
| gpt-image-2 returns `content_policy_violation` on the avatar prompt | "young girl / young woman / fitted / sleeveless / real skin texture" trip the classifier | Reword neutral: "woman in her early twenties", "casual cream top", drop body-descriptor adjectives. Validated on the LUMÉ avatar. |
| Extra or warped fingers in the application close-up | An extreme hand macro with complex finger motion | Reframe as a face-visible medium-close beauty shot, one hand, two fingertips, simple motion. (LUMÉ Decision Rule 5.) |
| Product label garbled / illegible | Seedance can't hold small text under motion across cuts | Pin the label to ONE hero close-up; forbid invented text elsewhere; don't demand readable text in every product beat. |
| Music or SFX bleeds into the audio | Audio block too loose; "water drip" read as an SFX cue | Forbid music/jingle/whoosh/UI/narrator explicitly; replace "water drip" with "quiet bathroom room tone + soft tile reverb". |
| Lip-sync mushes on a spoken beat | Dialogue placed on the silent application beat (mouth half-out-of-frame) | Keep the application beat silent; put lines only on mouth-visible beats; ≤28 words/15s. |
| Reads **slow / dreamy slo-mo**, creator **weirdly static and emotionless**, every beat the same extreme close-up | "Intimate/calm" over-applied → no speed floor, no expression direction, all-ECU framing (the v1 failure) | Add **"real-time, natural conversational speed, NOT slow-motion"**; keep the ECU→product→medium→reveal **framing ladder** (not all ECU); give each spoken beat a **changing expression** cue + "no expression held >2s". Verified on the Mother Science re-roll. |
| Stitched output drifts from 15s / audio out of sync | Replacement length ≠ hole, no fit applied | `stitch_replacement.py --fit stretch`; it warns if output drifts >0.15s. |
| Brief needs >15s or 5+ talking beats | Out of scope for one Seedance call | Tell the user; split into takes or route to `recreate-ugc-ad-from-source`. |

## Skill location & related

- This skill: `one-shot-videos/create-ugc-skincare-demo-video-from-refs/`
- Worked example: `demo/` (LUMÉ glow-serum bathroom skincare demo)
- Siblings: `create-ugc-product-video-from-refs` (selfie product review — the
  parent), `create-ugc-grwm-video-from-refs` (GRWM / outfit try-on).
- Atoms: `create-video-seedance-2-fal` + `create-image-gpt-image-fal`.
