---
name: create-ugc-car-confessional-video-from-refs
description: >-
  Produce a single vertical "car confessional" UGC video (15s by default,
  duration configurable {4..15}) — an AI creator sitting in a parked car talking
  straight to camera in a confiding, caught-on-the-fly tone. ONE continuous
  Seedance 2.0 reference-to-video take, native lip-synced dialogue, no cuts, no
  captions, no music. This is the REFERENCE skill for the one-shot "yapping"
  monologue sub-family (car / walk-and-talk / street testimonial): it owns the
  Phase 0 intake (avatar / location / optional product), the single-continuous-
  take prompt recipe, and the testimonial-vs-product decision. It specializes the
  one-shot-videos parent create-ugc-product-video-from-refs, reusing its four-block
  prompt recipe, approval gates, GPT-5.5 vet, review-loop + fix-loop, and
  scripts/stitch_replacement.py. Default is a testimonial (no product) that works
  for both physical-product and software companies; an optional physical-product
  hold is supported. Use for a confessional/storytime/hot-take talking-head ad set
  in a car. NOT for on-screen app/SaaS UI demos (Seedance can't render legible UI
  — use a screen-recording composite instead), multi-cut testimonials (use
  recreate-ugc-ad-from-source), or product demos with beats/close-ups (use
  create-ugc-product-video-from-refs).
status: active
---

# create-ugc-car-confessional-video-from-refs

## Purpose

One Seedance 2.0 reference-to-video render of an AI creator **sitting in a parked
car, talking straight to camera** — the "car confessional" that reads as a real
person filming a quick clip on their lunch break, not an ad. Vertical 9:16, 15s,
native lip-synced dialogue, **one single continuous take (no internal cuts)**, no
captions, no music. The parked-car booth + confiding tone is the whole attention
mechanism.

This is the **reference skill for the one-shot yapping monologue sub-family**
(`create-ugc-walk-and-talk-video-from-refs`, `create-ugc-street-testimonial-video-from-refs`
specialize it). It in turn **specializes the family parent**
`create-ugc-product-video-from-refs` — **read that parent first.** From the parent
it reuses verbatim: the four-block prompt recipe, the approval gates, the GPT-5.5
prompt-vetting pass, the review-loop + fix-loop, and `scripts/stitch_replacement.py`.

The reusable IP this reference adds on top of the parent is the **monologue
deltas** (single continuous take, no beats, static-body micro-motion, energy→word
budget) and the **Phase 0 proactive intake** (avatar / location / optional
product). Walk and Street document only their staging/motion/energy deltas and
point back here.

Default output is **15 seconds** (`{4..15}` allowed). Hard stack constraint:
**GPT-image-2 + Seedance 2.0 reference-to-video only.** No ElevenLabs (Seedance
generates the voice natively), no captions, no music.

## Testimonial vs. product (read before intake)

These are **ad** videos. Two intents, one format:

- **Testimonial (default, no product).** The creator talks about a result,
  problem, or hot-take. Works for **both physical-product and software/SaaS
  companies** — a founder or happy user yapping about the outcome. Needs only an
  avatar reference; no product ref.
- **Physical product hold (optional).** For e-commerce/DTC: the creator brings a
  real product into frame mid-monologue and shows it, using a product reference
  image (`@Image2`). Still ONE continuous take — a "show it" moment, never a cut.

**SaaS / mobile-app is intentionally NOT a product-hold mode.** A person holding a
phone with an app on screen fights the single-take selfie and Seedance cannot
render legible UI. Serve SaaS/app with the **testimonial** path (talk about what
the software did for them). If the ad must literally *show* the app screen, that's
a screen-recording composite — out of scope; say so and route elsewhere.

## Inputs

Required:
- **Brief** — natural language: the topic/hook, the energy, any must-say lines.

Optional (Phase 0 asks for these proactively; all have defaults):
- **Avatar** — use the default demo persona, pick a saved persona from
  `personas/`, or create a new one (describe it, or supply a face/portrait ref).
- **Location/scene** — use the default scripted car setting, customize it (car
  type, time of day, what's out the window), or supply a specific setting.
- **Product** — `none` (testimonial, default) or a **physical product** the
  creator holds and shows (supply a clean product reference image).
- `duration` (int `{4..15}`, default **15**), `resolution`
  (`480p|720p|1080p`; **default 720p** — the standard deliverable, ~$4.50. Render
  **1080p only when the operator explicitly asks for it**, ~$10.20),
  `aspect_ratio` (default `9:16`), `seed`.

Environment: `FAL_KEY` (alias from `FAL_API_KEY`; read from `content-goose/.env`).
`OPENAI_API_KEY` (from `gtm-goose/.env`) for the GPT-5.5 vet + Whisper review.

## Composed Atoms

- `coworkers/video/atoms/image-generation/create-image-gpt-image-fal` — `--model
  gpt-image-2`. Generates/loads the **composed selfie still** (creator already in
  the parked car). For a product build, also normalizes the product → clean
  white-BG cutout with hero features named. Use the atom's **iPhone-candid
  template** (natural un-retouched skin, plain wardrobe) — do NOT freehand or it
  reads AI.
- `coworkers/video/atoms/video-generation/create-video-seedance-2-fal` — the
  render engine. `--image-ref` (repeatable; first = `@Image1`), `--resolution`,
  `--duration`, `--aspect-ratio 9:16`, `--generate-audio`,
  `--no-generate-audio` for silent fix clips, `--seed`.
- `scripts/stitch_replacement.py` (reused verbatim from the parent) — scene-cut /
  time-window surgical replacement preserving the master audio.
- `demo/working/vet_seedance_prompt_gpt55.py` — GPT-5.5 prompt vet (adapt the
  embedded context to this monologue format before running).
- `/watch:watch` (or ffmpeg frames @2fps + Whisper) — the review-loop.

## Workflow

> **Approval gate (hard rule):** never fire a GPT-image-2 or Seedance call without
> first pasting the exact prompt(s)/refs and waiting for the user's go — Phase 1,
> Phase 4, and every fix re-render. See `docs/rules/PRODUCTION_RULES.md` and
> `feedback_prompt_review_before_send`.

### Phase 0 — Intake (proactively ask; default if the user has no preference)
Do NOT wait for the user to ask. Surface these three choices up front:
1. **Avatar** — "Use the default persona, pick a saved one, or create a new
   creator (describe them or share a face ref)?"
2. **Location/scene** — "Keep the default parked-car setting, or customize it
   (car type, daylight vs dusk, city vs suburban out the window)?"
3. **Product** — "Testimonial with no product (default), or should the creator
   hold and show a physical product? (Share a product image.) Note: for a
   SaaS/app, keep it testimonial — we don't fake on-screen UI."

If the user has no preference, proceed with the **default persona still + the
scripted setting** (this skill's `demo/` is the validated default). Then parse the
brief for topic, energy, and any must-say lines, and lock the `@ImageN` order
(`@Image1` = avatar; `@Image2` = product only if a product build).

### Phase 1 — Lock character + location (GPT-image-2) [APPROVAL GATE]
For this single-take format the **composed selfie still** (creator already seated
in the car) is the character+location lock — pass it as `@Image1`. Generate it
from the iPhone-candid template with the car staging, OR reuse a saved persona's
portrait dropped into the car setting. For a product build, also normalize the
product to a clean cutout (`@Image2`). Review the still(s) before proceeding.
(For persona reuse across formats, keep an identity portrait separate and save it
to `personas/<name>/`.)

### Phase 2 — Script to energy (word budget) [APPROVAL GATE for the words]
Write the monologue to the format's energy. **Because this is one continuous
all-talking take (no silent beats), the word budget is higher than the parent's
cut-heavy ≤28** — a 15s monologue holds ~35–45 words, and word count is the energy
dial (fewer = slower/calmer, more = faster/yappier). Car confessional is calm and
confiding → **~32–37 words**. Hook in the first ~1s, one payoff. Avoid AI-tell
filler (no reflexive "honestly").

### Phase 3 — Author the Seedance prompt (the recipe) [APPROVAL GATE]
Use the parent's four-block structure, adapted for a **single continuous take**
(there are no beats). Author as **flowing prose, not bracketed labels** — Seedance
verbalizes labels/parentheticals, so keep dialogue inline in quotes and voice
direction in prose. Five short paragraphs:
1. **Look directive** — "Vertical 9:16 selfie-style UGC car confessional, iPhone
   front camera, confiding energy, warm daylight, real skin tones, no filters,
   handheld micro-shake. One single continuous take, no cuts."
2. **Reference binding (once)** — "Use @Image1 as the exact man's identity,
   wardrobe, and setting — [face, hair, full wardrobe with the parked-car staging].
   Keep it identical the whole take; do not invent readable text or logos."
   (Product build: add "Use @Image2 as the exact product — [features]; the only
   readable text is its label, shown only when he holds it up.")
3. **Camera + micro-motion (kill the static-body trap)** — near-fixed propped-phone
   selfie with natural drift; describe the motion arc as prose (head bobs, one
   glance out the windshield, a hand gesture, a small laugh). Car stays parked —
   no scenery moving past the windows. Lips closed between lines.
4. **The spoken monologue** — inline in quotes, verbatim, after "He speaks
   directly to camera, [tone]:". (Product build: add "…at one point he brings the
   product up beside his face and turns the label to the lens…".)
5. **Audio + closer** — "Native spoken audio with accurate lip-sync, [voice
   character]. Quiet parked-car room tone only; no engine, no radio, no music.
   Single continuous take, same man, same wardrobe, same car, no second person,
   no morph transitions."

Then **GPT-5.5-vet** the prompt (adapt `vet_seedance_prompt_gpt55.py`) and fold in
edits before the gate — most valuable before a 1080p hero.

### Phase 4 — Render [APPROVAL GATE]
One `create-video-seedance-2-fal` call: `@Image1` (+`@Image2` for product), the
prompt, `--duration` (default 15), `--generate-audio`, `--aspect-ratio 9:16`.
**Render at 720p (~$4.50) — the default deliverable. Do NOT render 1080p unless the
operator explicitly asks for it (~$10.20).** Save to `finals/`.

### Phase 5 — Review-loop (automated QC)
`/watch` (frames @≥2fps + Whisper transcript). Check: stays parked (no driving);
**not a static mannequin** (real micro-motion); lip-sync + transcript match the
script; identity/wardrobe hold; (product build) product geometry + label hold and
no contact physics; no second person; no morph/warp. Report issues with
timestamps; if clean, present for final review.

### Phase 6 — Fix-loop [APPROVAL GATE per re-render]
For a confirmed bad window (e.g. an audio dysfluency or a drifted second):
identify the time window, author a short silent replacement with the SAME ref,
`--no-generate-audio`, review it alone, then
`scripts/stitch_replacement.py --window-start/--window-end --fit stretch`
(preserves master audio). Fix the window; don't re-roll unless identity drifts.

### Phase 7 — Final review
Hand the finished mp4 (absolute path + folder). No captions.

## Decision Rules

1. **One Seedance call = one continuous take.** No internal cuts. >15s or a brief
   that implies scene changes is out of scope — flag it.
2. **Proactively offer avatar / location / product in Phase 0.** Don't make the
   user ask. Default to the demo persona + scripted setting + testimonial (no
   product) when they have no preference.
3. **Testimonial is the default and serves software too.** Add a product only when
   it's a physical product the creator can hold. Never fake SaaS/app UI.
4. **Composed still locks character + location for a single take.** Pass one
   composed selfie still as `@Image1` (creator already in the car). Only split
   into orthogonal identity-portrait + setting when reusing one persona across
   settings.
5. **Word count is the energy dial; continuous take holds ~35–45 words/15s.** Car
   = calm → ~32–37. This is the monologue exception to the parent's ≤28 (which is
   for cut-heavy formats with silent beats).
6. **Kill the static-body trap.** Explicit prose micro-motion (head bobs, a
   glance, a gesture, a laugh). Stillness = mannequin = dead video.
7. **Prose prompts, dialogue inline, no bracketed labels.** Seedance verbalizes
   metadata/parentheticals; keep voice coaching in prose, dialogue in quotes.
8. **Car stays parked.** "No driving, no scenery moving past the windows" — a
   moving background reads as a different (and harder) shot.
9. **Product build = show within the take, no contact physics.** Bring it up,
   angle the label to the lens, hold — no pours/opens/complex handling. Name hero
   features and pin small text to the show-it moment (parent Decision Rules 5–7).
10. **Ship clean.** No captions, no music — native voice + car room tone only.
11. **Every paid call is gated; 720p is the default deliverable.** Paste each
    prompt. Deliver at 720p and render 1080p **only on explicit operator request**.

## Output

```
<project>/
  assets/refs/        ← @Image1 composed selfie still (+ @Image2 product for a product build)
  working/            ← seedance_prompt.txt, gpt55 review, review frames/transcript, any fix clips
  finals/
    <name>.mp4              ← master render
    <name>-v2.mp4           ← after any surgical window fix (delivered)
```

Delivered: one vertical 9:16 mp4 at the requested duration/resolution, native
dialogue + car room tone, no captions.

## Quality Checks

- Duration within ±0.2s; 9:16; plays in a standard player.
- Stays parked; creator reads as alive (real micro-motion), not a mannequin.
- Transcript matches the script; lip-sync reads; no brand-name mispronunciation.
- Identity + wardrobe + car interior consistent start to finish.
- (Product build) product geometry + label hold; label legible when shown; no
  extra/warped hands; no contact physics.
- Single continuous take — no cuts, no second person, no morph/warp.
- Stack was GPT-image-2 + Seedance 2.0 only; no captions, no music.

## Failure Modes

| Symptom | Cause | Fix |
|---|---|---|
| Creator is a static mannequin | Motion under-specified | Add explicit prose micro-motion (head bobs, glance out windshield, gesture, laugh). |
| Seedance reads a label/parenthetical aloud | Bracketed meta or "(pronounced …)" inside dialogue | Prose only; dialogue inline in quotes; voice coaching in a separate prose sentence. |
| Background starts moving / car appears to drive | "parked" not asserted | "Car stays parked, no scenery moving past the windows." |
| Dialogue rushed / lip-sync mush | Word count too high for 15s | Trim toward ~32–37 for calm car energy; the probe's /watch confirms pace. |
| Audio dysfluency (word repeat) on ~1s | Native-audio artifact | Surgical `stitch_replacement.py` window fix, or re-roll with the seed. (Seen on the Street sibling's "ninety" repeat.) |
| gpt-image-2 `content_policy_violation` on the still | "young man/woman", "fitted", "real skin texture" trip the classifier on /edit | Reword neutral; prefer unconditional t2i for the anchor. |
| (Product) label garbled / product morphs | Small text under motion / contact physics | Pin label to the show-it moment; name hero features; no opens/pours. |
| Brief needs cuts, >15s, on-screen app UI, or a second person | Out of scope for one continuous monologue | Flag; route to create-ugc-product-video-from-refs, recreate-ugc-ad-from-source, or a screen-record composite. |

## Skill location & related

- This skill: `one-shot-videos/create-ugc-car-confessional-video-from-refs/`
- Worked example: `demo/` (parked-car confessional, 15s/720p, seed 515084080, ~$4.50)
- **Reference for:** `create-ugc-walk-and-talk-video-from-refs`,
  `create-ugc-street-testimonial-video-from-refs` (monologue siblings that
  specialize this).
- **Parent (read first):** `one-shot-videos/create-ugc-product-video-from-refs`
  (shares the four-block recipe + `stitch_replacement.py` + GPT-5.5 vet + review/fix loop).
- Atoms: `create-video-seedance-2-fal` + `create-image-gpt-image-fal`.
