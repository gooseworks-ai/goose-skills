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

### Phase 0 — Self-directing intake (research first, ask the gaps, confirm the brief)
Don't start generating from a thin brief. Run this every time, in order — this is
the shared intake every one-shot format inherits:

1. **Derive the input checklist for this format:** avatar(s), product(s), setting/
   vibe, energy + word budget (≤ ~28 words/15s), any must-say lines, and the
   reference plan (which refs are supplied vs. need generating).
2. **Research the knowable unknowns FIRST — don't ask what you can find.** If the
   brief names a brand / product / URL: pull product images + a clean
   **standalone-on-white** shot, the brand palette + voice, the target customer,
   and **1–2 of the brand's existing ads** (tone, caption style, pacing) before
   authoring. If it names a creator archetype, draft it. Fill the checklist from
   research + the prompt; ask only what you genuinely can't find.
3. **Ask only the remaining unknowns / taste calls** — batched up front, each with a
   default offered (use the `AskUserQuestion` flow). Non-paid defaults are **soft**
   (proceed with the default if unanswered); anything that spends is not.
4. **Assemble the brief and present it for review** — avatar, product + reference
   plan, setting, energy/word-budget, must-says, and the locked `@ImageN` order.
   **HARD gate: wait for explicit approval before any paid call** (Phase 1 onward).
   Never spend on stills/renders off an unconfirmed brief.
5. After approval, scaffold the project (canonical 5-folder layout) and go to Phase 1.

### Phase 1 — Normalize references (GPT-image-2) [APPROVAL GATE]
For each reference, generate/clean to a single clear job:
- **Product** → **standalone studio cutout on a plain/white background**, front-on,
  hero features enumerated. See the **product-reference hard rule** below — the
  input the cutout is made from must be a standalone product shot, never an on-body
  or lifestyle photo.
- **Avatar** → neutral light-grey background, empty hands, natural UGC look. Use
  **filter-safe phrasing** (see Failure Modes — gpt-image-2 rejects "fitted",
  "sleeveless", "real skin texture" etc.).
- **Environment** (optional) → empty location plate, no people/props.
Lock ref order = the `@ImageN` numbering. Review the stills before proceeding.

> **Product-reference HARD RULE (standalone product, official-sourced).** The
> product reference fed to Seedance (and the image the Phase 1 cutout is composed
> from) MUST be a **standalone shot of the product alone on a plain, preferably
> white, background — no wrist, hand, face, model, or lifestyle scene.** An
> on-body/lifestyle reference (band-on-a-wrist, glasses-on-a-face, bottle-in-a-hand)
> gives Seedance a second body/limb to reconcile and it **hallucinates a generic
> look-alike** (canonical failure: a Hume Band rendered as a plain featureless
> band). **Sourcing chain, in order:**
> 1. **Official source first** — pull a true standalone product/PDP/press shot from
>    the brand's own website, press kit, or brand kit.
> 2. **Research elsewhere** — if the official source has none, search the web
>    (retailers, reviews, marketplace listings) for a clean standalone shot.
> 3. **Synthesize as last resort** — if no standalone shot exists anywhere, take
>    the best/closest image and use **GPT-image-2 to render a clean standalone
>    version on white** (strip the body/background, keep the product identical — do
>    NOT let the model redraw or invent product details), then use that.
>
> Always compose the worn/held product onto the creator **from this standalone
> cutout**, so `@Image1` already shows the correct product — never rely on the
> product `@ImageN` alone to fix a wrong product baked into the avatar still.

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
5. **Performance direction (per-beat expression) — REQUIRED.** Seedance renders
   ONE flat, held expression for the whole take unless emotion is authored beat
   by beat. This is the #1 cause of "the model looks emotionless / same face
   throughout." Two hard rules:
   - **Never write "one continuous breath / no pauses / all in one flow."** That
     phrasing flattens the read into a monotone. Direct delivery as *"warm,
     conversational, relaxed real-time pace with small natural pauses — NOT flat,
     NOT monotone."*
   - **Give every beat an explicit, changing expression cue** (e.g. "surprised
     eyebrows lift → impressed nod → laughing grin"), plus one global line:
     **"EXPRESSION RESET: at each cut the expression visibly changes; no single
     expression held >2s; lips stay closed when not speaking."**
   Also **vary framing across beats** (ECU → medium face-and-shoulders → chest-up)
   — a fixed extreme close-up on every beat reads static and kills energy — and
   state **"real-time, NOT slow-motion"** so the creator moves at conversational
   speed.

Budget: **≤ ~28 spoken words for 15s** (scale linearly for other durations).
Front-cam beats carry dialogue + lip-sync; rear/close-up beats carry VO only.
**No contact physics** in any beat (no ball strikes, pours, cuts, rallies). And
**gravity is real**: any held/shown product is empty and physically supported —
nothing floats inside or rests on it against gravity (canonical failure: a loose
spatula in the ref floated in the pan when it was tilted to camera; the fix was a
utensil-free product ref + "the pan is EMPTY when held up" language). **Do not
visualize copy metaphors literally** — a "replaces ten tools" line must not spawn
ten utensils on screen.

**Script naturalness (author, then check).** Write the spoken lines as **one
continuous, natural monologue**, not stacked ad-copy sentences. Read it aloud; cut
filler ("honestly", "literally", "just"); **de-jargon** clinical/technical copy
into how a real person actually talks. Robotic / list-style reads are a first-pass
failure mode (the whole H&V / MS / OP batch needed rewrites for this).

**GPT-5.5 vet — two standard gates, not optional.** (1) After drafting the spoken
lines, **vet the script** for naturalness before locking words; (2) after authoring
the prompt, **vet the Seedance prompt** (adapt `demo/working/vet_seedance_prompt_gpt55.py`)
and fold in its edits **before the render gate**. A ~$0.01 vet in front of a ~$4.50
render is cheap insurance — the v1 batch was three wasted renders a vet would have
flagged. (Model `gpt-5.5-2026-04-23`; `OPENAI_API_KEY` from `gtm-goose/.env`.)

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
2. **Orthogonal reference slots — with one composite exception.** Default: avatar /
   product / environment each get a clean ref with one job, declared once. A
   pre-composited "avatar already on location holding the product" over-constrains
   the model and makes the product fight its own ref. **Two separate refs (avatar +
   standalone product) is the default for held/shown products (serum, pan, racket)
   and large garments (a crewneck).** **Exception — body-contact WORN micro-items**
   (a band on the wrist, glasses on the face, a watch): the model can't reliably
   place a small worn item from a floating product ref, so **composite it onto the
   creator in Phase 1 from a standalone-on-white cutout**, then pass that **same
   cutout as `@Image2`**. Rule of thumb: *worn + small → composite; held or large →
   two separate refs.* (This is how the Hume band / Dash glasses runs worked.)
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
| Product renders as a generic look-alike / wrong shape (canonical: Hume Band came out a plain woven band) | The product reference was an **on-body/lifestyle** shot (band-on-wrist), giving Seedance a second limb to reconcile | Use a **standalone product shot on a plain/white background** (no wrist/hand/face). Source order: official site → web research → GPT-image-2 a standalone-on-white from the closest shot. Compose that cutout onto the creator so `@Image1` is already correct. (See the Phase 1 product-reference hard rule.) |
| Stitched output drifts from 15s / audio out of sync | Replacement length ≠ hole and no fit applied | Use `stitch_replacement.py --fit stretch`; it warns if output drifts >0.15s from master. |
| Front-cam beat has no/weird lip-sync | Beat labeled rear-cam, or dialogue exceeds the word budget | Label dialogue beats "selfie/front-facing phone POV"; trim to ≤28 words/15s. |
| Creator looks **emotionless — same held expression the whole take**, delivery flat/slo-mo | Prompt said "one continuous breath / no pauses" AND gave zero per-beat performance direction; every beat was the same extreme close-up | Author the **Performance block (Phase 2 #5)**: "relaxed real-time pace with small natural pauses" (never "one breath"), an explicit changing expression cue per beat, the **"EXPRESSION RESET … no expression held >2s, lips closed when not speaking"** line, framing variety, and "real-time, NOT slow-motion". Verified fix on the Mother Science / Our Place / Hype & Vice re-rolls. |
| Held product has a **floating utensil / object defying gravity** (canonical: spatula floated in the Always Pan when tilted up) | The product ref had a loose object resting on it; Seedance kept it "attached" when the pan moved | Feed a **utensil-free product ref** (GPT-image-2 the object out) and add "the product is EMPTY when held up; nothing floats inside it; gravity is real" to the consistency anchors. Never let copy metaphors ("ten tools") spawn literal objects. |
| Brief needs >15s or 5+ talking beats | Out of scope for one Seedance call | Tell the user; split into multiple takes or route to `recreate-ugc-ad-from-source`. |

## Skill location & related

- This skill: `one-shot-videos/create-ugc-product-video-from-refs/`
- Worked example: `one-shot-videos/create-ugc-product-video-from-refs/demo/` (AURA 300 tennis review)
- Related: `coworkers/molecules/ugc-ad/recreate-ugc-ad-from-source` (multi-shot 30-90s montage),
  `create-natural-ugc-narration-ad` (narration-over-b-roll, separate VO),
  atoms `create-video-seedance-2-fal` + `create-image-gpt-image-fal`.
