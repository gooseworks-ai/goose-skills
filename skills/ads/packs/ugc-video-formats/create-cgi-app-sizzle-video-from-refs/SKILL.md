---
name: create-cgi-app-sizzle-video-from-refs
description: >-
  Produce a single vertical "3D-CGI app sizzle" ad (≈22s, 9:16) from an app's
  real App Store screenshots — a premium Apple-keynote product film where a
  gold-trimmed phone floats in a smoky-black studio and, beat by beat, six app
  features demo in sequence: each one bursts REAL UI elements (instructor
  portraits, course cards, video tiles, glass icons) outward from the phone in
  3D with amaranth rim-light + bokeh, then everything settles back into the
  screen at a climax ("200+ classes. One app.") + end card. Each feature screen
  is a nano_banana_2 CGI plate (blank-glow phone + placeholder burst-out shapes)
  with the real App Store screenshot composited onto the bezel via PIL — never
  AI-rendered UI or faces — then driven by a Kling 3.0 image-to-video steady-float
  clip (Ken-Burns FFmpeg push-in fallback when Kling garbles the burst-out UI).
  Single ElevenLabs VO locked to measured audio, a premium-tech music bed, 1.15x
  finalize + anti-AI grain. Use when the brand is an APP with polished App Store
  screens and wants a premium "here's everything the app does" sizzle. NOT for a
  talking-head UGC video, NOT for a physical-product reveal, and NOT for any ad
  whose UI/faces would be AI-generated.
status: active
---

# create-cgi-app-sizzle-video-from-refs

## Purpose

Recreate the **premium 3D-CGI app-demo sizzle**: a gold-trimmed phone floats in a
smoky-black studio while six app features demo one per beat — each beat **bursts real
App Store UI elements out of the phone in 3D** (instructor portraits, a fanning deck of
course cards, a video tile + Up-Next pills, orbiting devices, glass audio/download icons),
then a climax where everything **collapses back into the screen** on the value-prop line,
closing on a brand end card over a premium-tech music bed. It reads as an Apple-keynote
product film, not UGC and not a physical-product shoot. The canonical worked example is
MasterClass "App Sizzle (3D CGI)" — six features + a "200+ classes. One app." climax
(`demo/`, from `clients/masterclass/ad-runs/run-03-run-03`).

The reusable IP is **the per-beat CGI-plate + real-UI-composite recipe**: (1) generate a
**nano_banana_2 CGI plate** — a blank-glow floating phone plus *placeholder* glass-morphic
burst-out shapes, anchored so the phone/studio stay identical across beats; (2) **composite
the REAL App Store screenshot onto the phone bezel with PIL** (and, where the burst-out is
real UI, composite the real portraits/cards too — never AI-render UI or faces); (3) drive
a **Kling 3.0 image-to-video** steady-float clip so the burst-out elements pop and settle
without the phone or its screen moving. Plus the deterministic assembly: lock VO to the
measured audio, restrained line-by-line captions, PIL end card, sidechain-ducked mix,
**1.15x speed finalize + anti-AI grain**.

**Why Kling (not Seedance):** every beat is floating objects; Seedance breaks floating-object
physics (`feedback_seedance_breaks_sit_on_object_physics`). **Why PIL for the UI:** the whole
credibility of the format is that the app screens and instructor faces are *real* — AI-rendered
UI or faces read fake and can invent claims (`feedback_pull_real_brand_assets_first`,
`feedback_no_production_labels_in_keyframes`).

Use this when the brand is:
- An **app** with a set of polished, real **App Store screenshots** (feed, catalog, player, etc.).
- A "here's everything it does" story — one feature per beat, 5–6 beats + a climax.
- Selling the **product itself** (the app as a single object), not a person or an abstract craft.

## Inputs

Required (one `config.json` — copy `config.example.json`, the MasterClass example):
- **Real App Store screenshots** — one per feature beat (`screen-01..screen-06.png`),
  native resolution. These become the on-screen UI, composited via PIL — never redrawn.
- **Brand wordmark** — the vector/PNG wordmark for the PIL end card (never AI-rendered).
- **App icon** — used as a side-element on the hook/climax beats.
- **Beats** — 5–6 features, each `{id, screen, burst_out, vo}` — which screen, what bursts
  out of it (and whether that burst-out is real UI or a generic AI shape), and the VO line.

Optional (defaults in `config.example.json`):
- **Studio look** — `background_hex` (smoky black `#0A0A0A`), `rim_light_hex` (amaranth
  `#E32652`), gold-trimmed phone, bokeh. Re-palette from the reference pin per brand.
- **CGI plate / Kling motion prompts** — the blank-glow floating-phone plate + the per-beat
  steady-float motion (tuned defaults provided).
- **VO** — voice id + `eleven_v3` settings + spec-sheet direction. **Music** — premium-tech
  bed. **Captions** — restrained white sans, no karaoke pills.
- **final_speed** (1.15), **fps** (24), **dims** (1080×1920).

Assets are git-LFS in brand folders — **fetch + checkout each first** (pointers are
~131-byte stubs).

## Engine (scripts/)

This molecule ships the **recipe** (`config.example.json`) + a field→step map
(`PIPELINE.md`), not a re-built runnable pipeline. The engine is the source run's working
scripts, referenced by `PIPELINE.md`:

| Source script | Does |
|---|---|
| `gen_plates.py` | **PAID (nano_banana_2).** Beat-1 CGI plate first, then beats 2-6 anchored on it (identical phone/studio); each appends its burst-out element layer. Blank-glow screen, placeholder burst shapes. |
| `composite_screens.py` | PIL: auto-detect the bright phone-screen bbox in each plate, resize + warm-tint + feather the **real** App Store screenshot into the bezel → `scene-NN-composite.png`. Free. |
| `build_burst_climax.py` | PIL: bake the real instructor portrait tiles (rim-light baked BEFORE rotation) + glow + shadow around the climax plate. Free. |
| `gen_clips.py` | **PAID (Kling 3.0 i2v).** Each composite → a steady-float clip; burst-out pops/settles, phone + screen locked. |
| `build_v2_clips.py` | **Ken-Burns FFmpeg FALLBACK.** Slow `zoompan` push-in per beat (heavier on the climax) when a Kling beat garbles the burst-out UI. This is the path the shipped demo master used. Free. |
| `render_eryn_vo.sh` | **PAID (ElevenLabs eleven_v3).** One curl per beat → MP3 → ffprobe duration → lock the timeline from measured durations. |
| `build_captions.py` | Restrained line-by-line ASS from the locked cues + measured offsets. Free. |

Plus the deterministic finish (FFmpeg): PIL end card → music bed → sidechain-ducked mix
(loudnorm) → concat → **1.15x speed + anti-AI grain** master. Requires `fal_client`,
`Pillow`, `numpy`, `ffmpeg`, `requests`; keys `FAL_API_KEY` + `ELEVENLABS_API_KEY` from
`gtm-goose/.env` (`export FAL_KEY="$FAL_API_KEY"` for `fal_client`).

## Workflow

### Phase 0 — Intake (real assets first)
Derive the checklist: 5–6 feature screens (real App Store PNGs), the wordmark + app icon,
the studio palette (smoky-black + amaranth, re-paletted from the reference pin), the VO
lines, the music mood. Pull the brand's real screenshots + wordmark; LFS-fetch each.
**Never AI-render UI, instructor faces, or the wordmark, and never invent an app claim**
(hard gate). Write `config.json` and confirm the brief.

### Phase 1 — VO first, lock the timeline [1 paid call/beat]
`render_eryn_vo.sh` — render all 6 cues, `ffprobe` each MP3, and **derive the beat windows
from the MEASURED durations** (never planned word counts, per
`feedback_align_concat_to_words_json`). The timeline locks here.

### Phase 2 — CGI plates + real-UI composites [1 paid plate/beat — GATE]
`gen_plates.py` (blank-glow floating phone + placeholder burst shapes, anchored on beat 1)
→ `composite_screens.py` (PIL: real screenshot onto the bezel) → `build_burst_climax.py`
(real portrait tiles on the climax). **Review the composites before the Kling step** — the
phone/studio must be identical across beats, the real UI must sit cleanly in the bezel, and
no AI UI/face may have leaked in.

### Phase 3 — Kling float clips [1 paid Kling call/beat — GATE]
`gen_clips.py`. **Wait for approval before firing** (the largest spend). Each beat:
burst-out pops and settles while the phone + its screen stay locked. `/watch` each — if a
beat **garbles the burst-out UI, distorts the phone, or animates the screen content**,
drop that beat to the **Ken-Burns fallback** (`build_v2_clips.py`: a slow push-in on the
composite). The shipped demo used the Ken-Burns path for the feature beats.

### Phase 4 — End card + captions + mix + finalize
PIL end card (smoky-black + amaranth bar + wordmark + tagline, captions suppressed) →
`build_captions.py` → music bed (trim the sparse intro) → sidechain-ducked mix (loudnorm)
→ concat → **1.15x speed + anti-AI grain** master. Deterministic; iterate the cut for free.

### Phase 5 — Watch / QC (mandatory before ship)
`/watch` the full master. Confirm: the phone/studio read identical across beats; every
on-screen UI + face is the real screenshot (no AI UI, no smear); each burst-out pops and
settles with the phone locked; the climax collapses everything back in on the value line;
end card + wordmark land; music kicks in with no dead intro; VO lands beat-for-beat.

## Decision Rules

- **REAL UI, always PIL — never AI.** Every app screen and every instructor/face is the real
  App Store screenshot composited via PIL. AI plates only ever render the *phone shell, studio,
  bokeh, and placeholder burst shapes* (plus generic devices/glass icons where the burst-out
  isn't real UI). This is the format's whole credibility — and the guard against invented claims.
- **Wordmark via PIL, never AI** (`LEARNINGS.md` #4). The end card is a deterministic PIL composite.
- **Kling for the float, Ken-Burns fallback per beat.** Kling 3.0 holds the floating phone +
  burst-out physics; Seedance breaks them. If a Kling beat garbles the burst-out UI, distorts
  the phone, or animates the screen, fall that beat to a Ken-Burns push-in — don't ship a garbled beat.
- **Anchor every plate on beat 1.** Generate the beat-1 plate, then `--anchor` beats 2-6 on it so
  the phone frame, tilt, studio, and rim-light stay identical — the sequence must read as one shoot.
- **Smoky-black + amaranth, gold phone.** `#0A0A0A` background, `#E32652` rim-light from upper-left,
  gold/champagne titanium phone, warm bokeh. Re-palette the reference pin, don't copy its colors.
- **VO durations locked from the rendered audio.** Render VO first, measure each MP3, then cut the
  beat windows — never plan the timeline from word counts.
- **Restrained captions, no karaoke pills; suppress on the end card** (the composited text is the message).
- **Spec-sheet VO, no lipsync, no recurring humans.** Single declarative VO; nobody speaks on camera.

## Output

- `master-final.mp4` — 1080×1920, ≈22.6s, H.264 (+ AAC music). 6 feature beats + PIL end card,
  sped 1.15x with an anti-AI grain pass.
- A poster still (the climax hero frame).
- `keyframes/` (plates + composites + burst-climax + end card), `clips/` (Kling and/or Ken-Burns
  beats), `voiceovers/`, `audio/` (music + mix) — kept for re-cuts.

## Quality Checks

- Canvas 1080×1920; duration ≈ `(Σ beat windows + end_card.dwell) / final_speed` (±0.3s).
- Phone/studio identical across beats (anchored plates); rim-light + bokeh consistent.
- Every on-screen UI + face reads as the real screenshot — crisp, un-smeared, not AI-redrawn.
- Each burst-out pops + settles with the phone and screen locked (no phone distortion, no UI morph).
- Climax collapses all prior elements back into the screen on the value line; wordmark end card lands.
- Music starts with no dead intro and ducks under VO; captions restrained, suppressed on the end card.

## Failure Modes

- **Kling garbles / distorts the burst-out UI or the phone, or animates the screen content** → drop
  that beat to the **Ken-Burns fallback** (`build_v2_clips.py` push-in on the composite); keep the
  "phone screen stays exactly as shown, do NOT animate UI, no shake no wobble" clause on Kling beats.
- **AI leaks UI / a face onto the screen** → you let AI render the screen; the screen must be a PIL
  composite of the real screenshot. Regenerate the plate with a *blank warm-glow* screen and re-composite.
- **Plate phone/studio drifts between beats** → you didn't anchor; regenerate beats 2-6 with `--anchor`
  on the beat-1 plate.
- **Screen-bbox mis-detected in composite** → the auto-detector found the wrong bright region; hand-place
  the bbox (the composite script falls back to a conservative centered bbox).
- **Timeline drifts from the audio** → you cut from planned word counts; re-render VO, ffprobe each cue,
  re-lock the windows.
- **Sparse music intro on a ~22s cut** → raise `music.trim_intro_sec` (default 2.5s) to hard-trim the lead-in.
- **FAL 403 / "exhausted balance"** with funds → stale ambient `FAL_KEY`; `export FAL_KEY="$FAL_API_KEY"` and re-run.

## Related

- The remix twin — `remix-cgi-app-sizzle-from-sample` — is what the app's format tab calls; it swaps
  the brand into this builder's `config.json` and publishes back through the
  goose-video runtime. Format link: `recipe.format: "cgi-app-sizzle"`.
