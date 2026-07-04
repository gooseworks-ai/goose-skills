---
name: create-ugc-car-confessional-video-from-refs
description: >-
  Produce a single vertical "car confessional" UGC video (15s by default,
  duration configurable {4..15}) — an AI creator sitting in a parked car talking
  straight to camera in a confiding, caught-on-the-fly tone. ONE continuous
  Seedance 2.0 reference-to-video take, native lip-synced dialogue, no cuts. The
  raw take carries native voice only; an OPTIONAL post-production pass (Phase 7)
  finishes it for delivery with a ducked music bed, burned captions, and a
  remixed brand end card. This is the REFERENCE skill for the one-shot "yapping"
  monologue sub-family (car / walk-and-talk / street testimonial): it owns the
  Phase 0 intake (avatar / location / optional product), the single-continuous-
  take prompt recipe, the testimonial-vs-product decision, the on-body/held
  product-reference (@Image2) option, and the optional post-production layer. It specializes the
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
native lip-synced dialogue, **one single continuous take (no internal cuts)**.
The parked-car booth + confiding tone is the whole attention mechanism. The **raw
Seedance take has native voice only** (no captions, no music baked in); an
**optional post-production pass (Phase 7)** adds a ducked music bed, burned
captions, and a remixed brand end card when the deliverable is a finished ad.

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

Default output is **15 seconds** (`{4..15}` allowed). Stack constraint for the
**talking take itself: GPT-image-2 + Seedance 2.0 reference-to-video only** — no
ElevenLabs (Seedance voices it natively). Captions and music are **never baked
into the Seedance take**; they are added afterward in the optional post-production
pass (Phase 7), which also uses the VEED-captions and music-mix atoms plus the
gooseworks CLI for the end card.

## Testimonial vs. product (read before intake)

These are **ad** videos. Two intents, one format:

- **Testimonial (default, no product).** The creator talks about a result,
  problem, or hot-take. Works for **both physical-product and software/SaaS
  companies** — a founder or happy user yapping about the outcome. Needs only an
  avatar reference; no product ref.
- **Product visible (optional) — held OR worn.** For e-commerce/DTC, feed a clean
  **product reference image as `@Image2`** so Seedance renders the real product
  accurately (not an invented look-alike). Two sub-modes:
  - **Held.** The creator brings the product into frame mid-monologue and shows
    it — a "show it" beat, never a cut.
  - **Worn / on-body.** For **wearables** (a recovery band, smart glasses, a
    watch, a ring), the product is worn and visible throughout; add one beat where
    the creator brings it toward the lens (wrist up, temple tap) so it reads
    clearly. This is how Hume (Band on wrist) and Dash (glasses on face) were
    built. Still ONE continuous take.
  In both sub-modes `@Image2` is the product-accuracy lock; name the product's
  hero features in the reference-binding paragraph and keep any small label pinned
  to the show-it beat.

**Product reference image — HARD RULE (standalone product only).** The product
reference (`@Image2`, and the product image fed to the Phase 1 compose) MUST be a
**standalone shot of the product alone on a plain, preferably white, background —
no wrist, no hand, no face, no model, no other objects, no lifestyle scene.** A
product-**on-body** reference (band-on-a-wrist, glasses-on-a-face, bottle-in-a-hand)
gives Seedance a second body/limb to reconcile against `@Image1` and it
**hallucinates a generic look-alike** — this is exactly why the first Hume Band
render came out as a plain generic band. Sourcing order: (1) find a true standalone
pack/PDP shot on the brand's site or the web; (2) if only on-body/lifestyle shots
exist, take the closest one and use **GPT-image-2 to render a clean standalone
version on white** (strip the body/background, keep the product identical — do not
let the model redraw product details); (3) only then use it as `@Image2` and as the
product cutout the Phase 1 still is composed from. Always compose the worn/held
product onto the creator in Phase 1 **from this standalone cutout**, so `@Image1`
already shows the correct product — never rely on `@Image2` alone to fix a wrong
product baked into the still.

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
  creator **holds** or **wears** (supply a clean product reference image → passed
  to Seedance as `@Image2` for product accuracy). See "Testimonial vs. product".
- `duration` (int `{4..15}`, default **15**), `resolution`
  (`480p|720p|1080p`; **default 720p** — the standard deliverable, ~$4.50. Render
  **1080p only when the operator explicitly asks for it**, ~$10.20),
  `aspect_ratio` (default `9:16`), `seed`.
- **Post-production (Phase 7, optional; default ON for a finished ad):**
  `captions` (default **on** — VEED `whisper` preset, white, bottom, verbatim SRT),
  `music` (default **on** — a ducked instrumental bed matched to the tone),
  `end_card` (default **on** — a remixed brand end card via the gooseworks CLI;
  needs the brand's logo + ad credits). Set any to `off` to deliver the clean
  native take.

Environment: `FAL_KEY` (alias from `FAL_API_KEY`; read from `content-goose/.env`).
`OPENAI_API_KEY` (from `gtm-goose/.env`) for the GPT-5.5 vet + Whisper review.
`ELEVENLABS_API_KEY` if present for the music bed, else the FAL fallback
`fal-ai/elevenlabs/music`. The end card uses the **gooseworks CLI** (`npx
gooseworks install --all`, then `/gooseworks --skill remix-graphic-ad-from-reference`),
which bills **1 ad credit per render** against the operator's org.

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

**Post-production atoms (Phase 7, optional):**
- `coworkers/video/atoms/music/create-music-elevenlabs` — the instrumental bed
  (ElevenLabs, or the FAL fallback `fal-ai/elevenlabs/music`; bake "instrumental,
  no vocals" into the prompt on the FAL wrapper). ~18s bed, ~$0.40.
- `coworkers/video/atoms/audio-editing/mix-music-under-vo` — sidechain-ducks the
  bed **under** the native VO (`--volume 0.23 --ratio 8`). Runs **before** captions.
- `coworkers/video/atoms/captions/add-captions-veed-fal` — burns captions **last**
  (`--preset whisper --font-color "#FFFFFF" --position bottom`). **Always pass a
  verbatim `--srt-file`** authored from a local Whisper pass + hand-corrected brand
  names (Seedance mis-voices brand tokens — e.g. "Hume"→"Hune", "ChatGPT"→"chat
  GPT"; the SRT is the on-screen safety net). ~$0.60/15s.
- **End card:** the **gooseworks CLI** — `npx gooseworks install --all`, then
  `/gooseworks --skill remix-graphic-ad-from-reference` (the `goose-ads` skill).
  Pick a 9:16 static template, remix it with the brand's official logo + one
  useful line (offer / URL / tagline), then append the 2–3s card to the video
  (`ffmpeg concat`; match fps/resolution). Bills 1 ad credit/render.

## Workflow

> **Approval gate (hard rule):** never fire a GPT-image-2 or Seedance call without
> first pasting the exact prompt(s)/refs and waiting for the user's go — Phase 1,
> Phase 4, and every fix re-render. See `docs/rules/PRODUCTION_RULES.md` and
> `feedback_prompt_review_before_send`.

### Phase 0 — Self-directing intake (research first, ask the gaps, confirm the brief)
Don't wait to be told the details, and don't start generating from a thin brief.
Run this every time, in order:

1. **Derive the input checklist for this format.** A car-confessional needs:
   **avatar** (persona/identity), **scene** (car type, time of day, what's out the
   window), **product** (testimonial vs. a held physical product — SaaS/app stays
   testimonial, we don't fake on-screen UI), **energy + word budget** (calm ≈
   32–37 words/15s), and the **topic + any must-say lines**.
2. **Research the knowable unknowns FIRST — don't ask what you can find.** If the
   brief names a brand / product / URL: pull the product images (and a clean
   **standalone-on-white** shot for the reference), the brand palette + voice, the
   target customer, and **1–2 of the brand's existing ads** (tone, subtitle style,
   pacing) before writing anything. If it names a creator archetype, draft it. Fill
   as much of the checklist as you can from research + the prompt.
3. **Ask only what's still unknown or a taste call** — batched, up front, each with
   a sensible default offered (avatar look, scene variant, whether to show a
   product, energy). Use the `AskUserQuestion` flow. These defaults are **soft**:
   if the user doesn't answer a non-paid choice, proceed with the validated default
   (this skill's `demo/` is the default persona + scripted setting).
4. **Assemble the brief and show it for review.** One consolidated summary —
   avatar, scene, product + reference plan, energy/word-budget, topic/must-says,
   and the `@ImageN` order (`@Image1` = avatar; `@Image2` = product only for a
   product build). This is a **HARD gate: wait for explicit approval before any
   paid call** (Phase 1 onward). Never spend on stills/renders off an unconfirmed brief.
5. Only after approval, scaffold the project (canonical 5-folder layout) and proceed to Phase 1.

### Phase 1 — Lock character + location (GPT-image-2) [APPROVAL GATE]
For this single-take format the **composed selfie still** (creator already seated
in the car) is the character+location lock — pass it as `@Image1`. Generate it
from the iPhone-candid template with the car staging, OR reuse a saved persona's
portrait dropped into the car setting. For a product build, **first normalize the
product to a clean STANDALONE cutout on white** (per the product-reference hard
rule — never an on-body/lifestyle shot; if only those exist, GPT-image-2 it to a
standalone-on-white first), then **compose that exact cutout onto the creator's
wrist/face/hand in this still** so `@Image1` already shows the correct product.
Pass the same standalone cutout as `@Image2`. Review the still(s) before proceeding.
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
   (Product build — **held:** add "Use @Image2 as the exact product — [features];
   the only readable text is its label, shown only when he holds it up." **Worn:**
   add "Use @Image2 as the exact [band/glasses/watch] on his [wrist/face] — [matte
   finish, module, shape]; keep it identical, and at [beat] he brings it toward the
   lens so it reads clearly.")
3. **Camera + micro-motion + performance (kill the static-body AND the flat-face
   trap)** — near-fixed propped-phone selfie with natural drift; describe the
   motion arc as prose (head bobs, one glance out the windshield, a hand gesture,
   a small laugh). Car stays parked — no scenery moving past the windows. Lips
   closed between lines. **Author the emotional performance, or Seedance renders
   one flat held expression the whole take.** Two rules carry over from the parent:
   (a) **never** pace it as "one continuous breath / no pauses" — write "relaxed
   real-time pace with small natural pauses, warm and confiding, NOT flat, NOT
   monotone"; (b) name **expression shifts at the natural phrase boundaries** ("a
   wry half-smile on the hook, brow furrows on the problem line, an easy grin on
   the payoff") so the face visibly changes through the monologue instead of
   holding one look.
4. **The spoken monologue** — inline in quotes, verbatim, after "He speaks
   directly to camera, [tone]:". (Product build: add "…at one point he brings the
   product up beside his face and turns the label to the lens…".)
5. **Audio + closer** — "Native spoken audio with accurate lip-sync, [voice
   character]. Quiet parked-car room tone only; no engine, no radio, no music.
   Single continuous take, same man, same wardrobe, same car, no second person,
   no morph transitions."

Then **GPT-5.5-vet** the prompt (adapt `vet_seedance_prompt_gpt55.py`) and fold in
edits before the gate — most valuable before a 1080p hero.

**Brand-name pronunciation (guardrail).** Seedance's native voice mis-says many
brand tokens (observed: "Hume"→"Hune", "ChatGPT"→"chat GPT"). It **ignores
parenthetical pronunciation hints** and will read them aloud, so never put
"(pronounced …)" in the dialogue. Two safe levers: (1) if a brand name reliably
breaks, spell it **phonetically as a plain word** in the spoken line only when
that word still reads naturally on screen — otherwise leave the correct spelling;
(2) rely on the **Phase 7 verbatim caption SRT**, which puts the correct brand
spelling on screen regardless of how the audio lands. For a sound-on hero where
the audio must be perfect, re-roll the take (new seed) — the caption SRT is the
default, cheaper fix for muted-first social.

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

### Phase 7 — Post-production (optional; default ON for a finished ad)
Turn the clean native take into a finished ad. Order is fixed — **music, then
captions, then end card** — because VEED captions must be burned **last** and the
end card is appended after. Skip any sub-step the operator turned off.

1. **Music bed.** Generate a short instrumental matched to the tone (car = warm,
   calm, understated) via `create-music-elevenlabs` (or FAL `fal-ai/elevenlabs/music`
   with "instrumental, no vocals" in the prompt), ~18s.
2. **Mix under VO.** `mix-music-under-vo --video finals/<name>.mp4 --music
   <bed>.mp3 --output working/<name>-mixed.mp4 --volume 0.23 --ratio 8`. Confirm
   peak ≤ −0.5 dB and the VO stays clearly on top.

   **2b. Outdoor mic realism (OUTDOOR formats ONLY — SKIP for car/enclosed).**
   Seedance renders the VO clean and close-mic'd ("studio"). That's *correct* for
   the **car** (enclosed space → clean is realistic), so this skill's own ads skip
   this step. For the **street** and **walk-and-talk** siblings, a clean VO reads as
   "recorded in a booth." Rebuild the audio from the **raw** Seedance take (VO only,
   pre-music) with a handheld-outdoor chain, then swap it into the caption-burned
   final (video copy). Free, deterministic, no API — a low-passed brown/pink-noise
   bed is indistinguishable from stock ambience under a voice (cf.
   `synthesize-sfx-ffmpeg`; FAL `elevenlabs/sound-effects` is broken upstream —
   LEARNINGS.md #24). **SUBTLE preset is the default** (operator-approved 2026-07-03):
   - **VO chain:** `highpass=f=110,lowpass=f=7400` (kill studio sub-warmth + glassy
     highs → phone/lav capsule), `equalizer=f=2600:t=q:w=1.4:g=2.5` (handheld-mic
     presence honk), `equalizer=f=300:t=q:w=1.0:g=-1.5` (thin the "full" body),
     `acompressor=threshold=-18dB:ratio=3:attack=8:release=180:makeup=1.5` (phone AGC).
   - **Ambient bed:** `anoisesrc=color=<brown|pink>:amplitude=0.9:duration=<len+0.2>,
     highpass=f=<60-90>,lowpass=f=<1500-2200>,tremolo=f=0.12:d=0.25,volume=<-27..-29>dB`.
     **Street** = brown, lowpass 1500, −27 dB (busy traffic hush). **Walk/park** =
     pink, lowpass 2200, −29 dB (airier, quieter morning).
   - **Music:** duck under the treated VO with `sidechaincompress=threshold=0.03:
     ratio=6:attack=20:release=300` then `volume=-3dB`.
   - **Bus:** `amix=inputs=3:duration=first:normalize=0` (VO + bed + ducked music) →
     `loudnorm=I=-14:TP=-1.5:LRA=11`. Mux with `-map 0:v -c:v copy` from the
     caption-burned final; re-append the end card afterward. Verify peak ≤ −0.5 dB
     and the VO stays fully intelligible. GRITTY variant (louder bed −19 dB, hp 150 /
     lp 6200, +4 dB honk) exists but tends to roughen the voice — use only on request.
3. **Captions (LAST audio/video edit).** Author `working/captions.srt`, then feed
   it to VEED **verbatim** so it never re-transcribes: `add-captions-veed-fal
   --input working/<name>-mixed.mp4 --output finals/<name>-final.mp4 --preset
   whisper --font-color "#FFFFFF" --position bottom --srt-file working/captions.srt`.
   - **Best SRT = local Whisper word-timestamps aligned to the known script.**
     Transcribe the clean render with local `whisper` (`word_timestamps=True`), then
     **align those word timings to your exact brand-correct script** (difflib
     sequence match) so the text is perfect *and* the timing is word-level — no paid
     STT, no brand mis-spellings. Pattern: `.tmp/endcards/whisper_caps.py` from the
     2026-07-03 H&V/MS/OP run.
   - **Cue grouping:** break on **sentence-final punctuation, not commas** (commas
     make unreadable one-word fragments); ~4–5 words/cue; enforce a **≥0.9s minimum
     on-screen** time.
   - **Fallback if VEED is unavailable** (e.g. FAL locked): burn locally with ffmpeg
     `subtitles=<srt>:force_style='FontName=Helvetica,Fontsize=17,Bold=1,PrimaryColour=&H00FFFFFF,OutlineColour=&H00000000,BorderStyle=1,Outline=2,Shadow=1,Alignment=2,MarginV=90'`
     — free, local, visually equivalent to VEED's static preset (no word-pop animation).
4. **End card.** Build a 2–3s branded end card with the gooseworks CLI: `npx
   gooseworks install --all`, then `/gooseworks --skill
   remix-graphic-ad-from-reference` — pick a **9:16** static template, remix with
   the brand's **official logo + one useful line** (offer, URL, or tagline). Append
   it to `finals/<name>-final.mp4` via `ffmpeg concat` (match fps + resolution).
   **Bills 1 ad credit** against the operator's org — if credits are 0, surface it
   and deliver without the card (top up, then append). Suppress captions over the
   end card (it carries its own text).

### Phase 8 — Final review
Hand the finished mp4 (absolute path + folder). State which post-production layers
were applied (music / captions / end card) and flag any brand-audio nit the
caption SRT is covering.

## Decision Rules

1. **One Seedance call = one continuous take.** No internal cuts. >15s or a brief
   that implies scene changes is out of scope — flag it.
2. **Self-directing Phase 0: research first, ask the gaps, confirm the brief.**
   Don't make the user hand-feed details or start off a thin brief. Research
   whatever the prompt names (brand, product, creator) before asking; ask only the
   true unknowns; then present the assembled brief and **wait for explicit approval
   before any paid call (HARD gate)**. Non-paid defaults are soft — proceed on the
   demo persona + scripted setting + testimonial when the user has no preference.
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
9. **Product = show within the take, no contact physics; `@Image2` is the
   accuracy lock.** Held (bring it up, angle the label to the lens) OR worn
   (wearable visible throughout, one beat toward the lens). **The product
   reference MUST be a standalone product shot on a plain/white background — never
   an on-body or lifestyle shot (that makes Seedance hallucinate a generic
   look-alike); GPT-image-2 a standalone-on-white if only on-body shots exist.**
   Compose that cutout onto the creator in Phase 1 AND pass it as `@Image2`; name
   hero features, pin small text to the show-it beat — no pours/opens/complex
   handling (parent Decision Rules 5–7).
10. **Raw take is native voice only; captions + music + end card are optional
    post-production, never baked in.** Deliver either the clean native take OR the
    finished cut, per the brief. When finishing, order is music → captions (VEED
    LAST) → end card; captions use a **verbatim, brand-corrected SRT**.
11. **Brand-name audio safety net.** Seedance mis-voices brand tokens; never use
    parenthetical pronunciation hints (it reads them aloud). Default fix is the
    verbatim caption SRT; re-roll only for a sound-on hero.
12. **Every paid call is gated; 720p is the default deliverable.** Paste each
    prompt. Deliver at 720p and render 1080p **only on explicit operator request**.

## Output

```
<project>/
  assets/refs/        ← @Image1 composed selfie still (+ @Image2 product ref for a product build)
  working/            ← seedance_prompt.txt, gpt55 review, review frames/transcript,
                        any fix clips, music.mp3, captions.srt, <name>-mixed.mp4
  finals/
    <name>.mp4              ← raw master render (native voice only)
    <name>-v2.mp4           ← after any surgical window fix
    <name>-final.mp4        ← finished ad: music bed + burned captions (+ end card)
```

Delivered: one vertical 9:16 mp4 at the requested duration/resolution. Either the
**raw take** (`<name>.mp4`, native dialogue + room tone) or, with post-production,
the **finished ad** (`<name>-final.mp4`, ducked music + burned brand-correct
captions + optional end card).

## Quality Checks

- Duration within ±0.2s; 9:16; plays in a standard player.
- Stays parked; creator reads as alive (real micro-motion), not a mannequin.
- Transcript matches the script; lip-sync reads; no brand-name mispronunciation.
- Identity + wardrobe + car interior consistent start to finish.
- (Product build) product geometry + label hold; label legible when shown; no
  extra/warped hands; no contact physics.
- Single continuous take — no cuts, no second person, no morph/warp.
- Raw take was GPT-image-2 + Seedance 2.0 only (no captions/music baked in).
- (If finished) music sits under the VO (peak ≤ −0.5 dB, VO clearly on top);
  captions are burned **last** and every brand name on screen is spelled correctly
  (verbatim SRT); end card, if present, carries the official logo + one useful line
  and captions are suppressed over it.

## Failure Modes

| Symptom | Cause | Fix |
|---|---|---|
| Creator is a static mannequin | Motion under-specified | Add explicit prose micro-motion (head bobs, glance out windshield, gesture, laugh). |
| Creator delivers **flat / emotionless — one held expression the whole take** | Pacing written as "one continuous breath / no pauses" and no expression direction | Pace as "relaxed real-time pace with small natural pauses, NOT flat, NOT monotone"; name **expression shifts at phrase boundaries** (wry smile → furrowed brow → easy grin). See Phase 3 ¶3. |
| Seedance reads a label/parenthetical aloud | Bracketed meta or "(pronounced …)" inside dialogue | Prose only; dialogue inline in quotes; voice coaching in a separate prose sentence. |
| Background starts moving / car appears to drive | "parked" not asserted | "Car stays parked, no scenery moving past the windows." |
| Dialogue rushed / lip-sync mush | Word count too high for 15s | Trim toward ~32–37 for calm car energy; the probe's /watch confirms pace. |
| Audio dysfluency (word repeat) on ~1s | Native-audio artifact | Surgical `stitch_replacement.py` window fix, or re-roll with the seed. (Seen on the Street sibling's "ninety" repeat.) |
| gpt-image-2 `content_policy_violation` on the still | "young man/woman", "fitted", "real skin texture" trip the classifier on /edit | Reword neutral; prefer unconditional t2i for the anchor. |
| (Product) label garbled / product morphs | Small text under motion / contact physics | Pin label to the show-it moment; name hero features; no opens/pours. |
| Product renders as a generic look-alike / wrong shape (canonical: Hume Band came out a plain woven band) | The product reference was an **on-body/lifestyle** shot (band-on-wrist), giving Seedance a second limb to reconcile | Use a **standalone product shot on a plain/white background** (no wrist/hand/face). If only on-body shots exist, GPT-image-2 a standalone-on-white first. Compose that cutout onto the creator in Phase 1 so `@Image1` is already correct, and pass the same cutout as `@Image2`. |
| Native audio mispronounces the brand name (e.g. "Hume"→"Hune", "ChatGPT"→"chat GPT") | Seedance TTS mis-voices brand tokens; ignores parenthetical hints | Default: put the correct spelling on screen via the **verbatim caption SRT** (Phase 7). Optionally spell the word phonetically in the spoken line if it still reads naturally. Re-roll (new seed) only for a sound-on hero. |
| Music drowns the VO / clips | Bed too hot or duck too shallow | Lower `--volume` (0.18) or raise `--ratio` (10); keep peak ≤ −0.5 dB (see mix-music-under-vo). |
| Captions mis-spell a brand name / two text layers collide on the end card | VEED STT used instead of the SRT, or captions left on over the card | Always pass `--srt-file` (verbatim, brand-corrected); suppress captions over the end card. |
| Any FAL call (end-card gen, VEED captions, stills) 403s / "User is locked … Exhausted balance" **even though the fal dashboard shows balance** | A **stale ambient `FAL_KEY`** (from the shell profile, a different depleted account) is shadowing the repo key — the `${FAL_KEY:-$FAL_API_KEY}` alias keeps the stale one | **Pin the repo key: `export FAL_KEY="$FAL_API_KEY"`** (overwrite, not `:-`), verify with a one-line `fal_client.upload_file()`, then re-run. Don't conclude "no balance" or burn retries until you've done this. (See `docs/rules/LEARNINGS.md` #10.) |
| End-card render genuinely blocked (real 0 balance / gooseworks credits = 0, key already pinned) | No funds on either service | Build the card **locally with PIL, no paid API**: take the standalone product-on-white/-cream ref, fill a 720×1280 canvas with the ref's own corner colour (seamless — no cutout needed), paste the product in the lower ⅔, add the brand wordmark (SVG→`rsvg-convert`→recolour, or typeset) + one benefit tagline in the top negative space, then append the 2.5s card with the standard fade-in concat. Matches the gooseworks-remix card look and costs $0. |
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
