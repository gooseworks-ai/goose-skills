# render-cgi-sizzle — FREE assembly

This capability ships the **recipe** (`config.example.json`) + a config→step map
(`PIPELINE.md`) for the 3D-CGI app-sizzle format, plus this note documenting the
**FREE, deterministic assembly** — everything between the paid model calls. The paid
steps (nano-banana CGI plates, Kling i2v float clips, ElevenLabs VO + music) are separate
capabilities; the recipe orchestrates and gates them. Everything below is $0
(PIL + FFmpeg), keeps the real UI + wordmark pixel-crisp, and never makes an AI or paid call.

## What's FREE here

### 1. PIL real-UI composite (the format's whole credibility)
The nano-banana plate renders only the **phone shell, smoky-black studio, amaranth
rim-light, bokeh, and placeholder burst-out shapes** — the screen is left a blank warm
glow on purpose. Then, deterministically in PIL:

- **Screen composite** — auto-detect the bright warm phone-screen bbox in each plate,
  resize the **real App Store screenshot** to fit, warm-tint ~6%, brightness +5%, and
  feather it into a rounded-rect mask so it sits inside the bezel → `scene-NN-composite.png`.
  The on-screen UI (feeds, cards, players, instructor faces) is ALWAYS the real screenshot —
  never AI-rendered, so no claim can be invented and nothing reads fake.
- **Burst-out overlays** — where the burst-out element is real UI (e.g. the climax
  instructor portrait tiles), bake the real portraits as glass-morphic tiles with the
  rim-light baked BEFORE rotation (so frame + portrait rotate as one unit) + amaranth glow +
  drop shadow, ringed around the plate. Where the burst-out is a generic device/glass icon,
  the AI plate's placeholder shape is used as-is (no real UI to protect).

### 2. Ken-Burns FFmpeg fallback (per beat)
Kling 3.0 i2v is the intended primary for the steady-float motion, but any beat where Kling
garbles the burst-out UI, distorts the phone, or animates the screen content drops to a FREE
Ken-Burns push-in: FFmpeg `zoompan` slow zoom (`1.00→1.06` on feature beats, heavier
`1.00→1.10` on the climax) over the composite. The shipped demo master used this path for the
feature beats — don't ship a garbled Kling beat when the free push-in is clean.

### 3. Dice + intercut concat
Normalize every beat clip to one fps/codec, then concat the beats in order + the end-card
clip. Hard assembly, no dissolves; the timeline is locked from the **measured VO durations**
(each beat window = its `ffprobe`'d MP3 length), so the cut lands beat-for-beat with the VO.

### 4. Audio mix (sidechain duck + loudnorm)
- VO bus: `loudnorm -23 LUFS`, de-ess, high-pass 80Hz.
- Music bus: premium-tech bed → trim the sparse intro (`music.trim_intro_sec`, default 2.5s)
  → `loudnorm -23 LUFS` → **sidechain-compress with the VO as key** (ratio 20:1, attack 5ms,
  release 250ms), ducking ~-9dB under VO; +2dB VO on the climax beat.
- Master bus: `loudnorm -14 LUFS` (IG/TikTok safe), -1.5 dBTP true peak.

### 5. End card (PIL, never AI)
Smoky-black canvas + amaranth bar + the brand's **real wordmark** (SVG/PNG, never
AI-rendered) + tagline (Montserrat) + vignette → a static `end-card.png` held for
`end_card.dwell_sec`. Captions are suppressed here (the composited text is the message).

### 6. Finalize — 1.15x speed + anti-AI grain
Concat done, apply `setpts=PTS/1.15` (video) + `atempo=1.15` (audio, pitch preserved) to
tighten the ~26s cut to ~22.6s, then an anti-AI grain pass → the H.264 (+ AAC) master.

## Contract

- Deterministic + FREE (PIL + FFmpeg); no paid calls, no AI-rendered UI/faces/wordmark.
- The screen is ALWAYS the real App Store screenshot composited via PIL; the plate's screen
  is left blank on purpose. If AI leaks UI/a face onto the screen, regenerate the plate with a
  blank warm-glow screen and re-composite.
- Phone/studio stay identical across beats (the paid plates are `--anchor`ed on beat 1;
  preserved here). Ken-Burns is the per-beat fallback for any garbled Kling beat.
- Timeline is locked from the measured VO durations, never planned word counts.
- The paid steps — nano-banana plates, Kling 3.0 i2v beats, ElevenLabs VO + music — are
  separate capabilities (create-image-fal, create-video-fal, create-vo-elevenlabs,
  create-music-elevenlabs); the recipe orchestrates them and gates the spend.

See `PIPELINE.md` for the full config-field → source-step map.
