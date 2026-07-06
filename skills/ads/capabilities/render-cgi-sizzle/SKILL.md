---
name: render-cgi-sizzle
description: Assemble a 3D-CGI app sizzle — nano-banana CGI plates (blank-glow floating phone + smoky-black studio + amaranth rim-light + placeholder burst shapes) plus PIL compositing of the REAL App Store screenshots onto the bezel + burst-out overlays, driven by Kling 3.0 i2v steady-float per beat with a per-beat Ken-Burns FFmpeg push-in fallback when Kling garbles the UI, then VO/music mix (sidechain duck, loudnorm) + 1.15x speed + anti-AI grain finalize. The on-screen UI, instructor faces, and wordmark are ALWAYS real assets composited via PIL — never AI-rendered. The paid steps (plates, i2v clips, VO, music) are separate capabilities; this ships the config + PIPELINE + FREE assembly and the recipe orchestrates the spend. Use for the cgi-app-sizzle video format.
status: active
---

# render-cgi-sizzle

Assembles the **3D-CGI app sizzle** video format: a gold-trimmed phone floats in a
smoky-black studio while six app features demo one per beat — each beat bursts REAL App
Store UI elements out of the phone in 3D with amaranth rim-light + bokeh, then everything
collapses back into the screen at a climax ("200+ classes. One app.") + a brand end card
over a premium-tech bed. It reads as an Apple-keynote product film, not UGC and not a
physical-product shoot.

This capability ships the **recipe** (`scripts/config.example.json`) + a config→step map
(`scripts/PIPELINE.md`) + the FREE-assembly how-to (`scripts/README.md`). It documents the
FREE, deterministic assembly between the paid model calls:

- **nano-banana CGI plates** (paid, separate cap) render only the phone shell + smoky-black
  studio + amaranth rim-light + bokeh + placeholder burst shapes; the screen is left a blank
  warm glow on purpose, and every plate is `--anchor`ed on beat 1 so the phone/studio stay
  identical across beats.
- **PIL real-UI compositing (FREE)** — auto-detect the bright phone-screen bbox in each
  plate and feather the REAL App Store screenshot into the bezel → `scene-NN-composite.png`;
  bake real burst-out overlays (e.g. climax instructor portrait tiles, rim-light baked before
  rotation) around the plate. The on-screen UI + faces + wordmark are ALWAYS real assets —
  never AI-rendered, so no claim is invented and nothing reads fake.
- **Kling 3.0 i2v steady-float** (paid, separate cap) drives each composite; the burst-out
  pops/settles while the phone + screen stay locked. Any beat Kling garbles drops to a **FREE
  Ken-Burns FFmpeg push-in** (`zoompan`, heavier on the climax) — the shipped demo used this
  path for the feature beats.
- **Assembly + finalize (FREE)** — dice + intercut concat (timeline locked from the measured
  VO durations), audio mix (sidechain-duck the music under VO, loudnorm -14 LUFS master), PIL
  brand end card (real wordmark, never AI), then **1.15x speed + anti-AI grain** master.

See `scripts/README.md` for the full FREE-assembly detail and `scripts/PIPELINE.md` for the
config-field → source-step map.

## Run

Config-and-PIPELINE capability (no re-built runnable pipeline here). Copy
`scripts/config.example.json` → `config.json`, edit the brand/beats/screens, and follow
`scripts/PIPELINE.md`:

VO first (locks the timeline) → nano-banana CGI plates → PIL screen composites → burst-climax
overlays → Kling i2v clips (Ken-Burns fallback per garbled beat) → PIL end card → captions →
sidechain-ducked mix → 1.15x speed + grain.

Output: 1080x1920, ~22.6s H.264 (+ AAC music). 6 feature beats + PIL end card.

## Contract

- **REAL UI, always PIL — never AI.** Every app screen, instructor face, and the wordmark is
  the real asset composited via PIL. AI plates only ever render the phone shell, studio, bokeh,
  and placeholder burst shapes. This is the format's whole credibility and the guard against
  invented claims.
- **Kling for the float, Ken-Burns fallback per beat.** If a Kling beat garbles the burst-out
  UI, distorts the phone, or animates the screen, fall that beat to a FREE Ken-Burns push-in —
  never ship a garbled beat.
- **Anchor every plate on beat 1** so the phone/studio read identical across beats (one shoot).
- **Timeline locked from the measured VO durations**, never planned word counts.
- The paid steps — nano-banana plates, Kling 3.0 i2v beats, ElevenLabs VO + music — are
  separate capabilities (create-image-fal, create-video-fal, create-vo-elevenlabs,
  create-music-elevenlabs); the recipe orchestrates them and gates the spend.
