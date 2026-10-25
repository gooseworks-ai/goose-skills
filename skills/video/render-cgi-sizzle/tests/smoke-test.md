# Smoke Test

Copy `scripts/config.example.json` → `config.json`, follow `scripts/PIPELINE.md` for the
cgi-app-sizzle format — the FREE assembly documented in `scripts/README.md` runs the PIL
real-UI composite, Ken-Burns FFmpeg fallback, dice+intercut concat, sidechain-ducked mix,
PIL end card, and 1.15x speed + grain finalize. Output 1080x1920, ~22.6s, deterministic.

Pass when:
- **PIL screen composite** feathers the REAL App Store screenshot into each plate's phone
  bezel → `scene-NN-composite.png`; the on-screen UI + faces are the real screenshot, never
  AI-rendered, and the plate's screen was a blank warm glow.
- **Ken-Burns fallback** produces a clean FFmpeg `zoompan` push-in for any beat Kling garbles
  (heavier zoom on the climax); no garbled Kling beat ships.
- **Concat** joins the beats (order + timeline locked from measured VO durations) + the PIL
  end card into one normalized-fps master.
- **Audio mix** sidechain-ducks the music under VO and loudnorm's the master to -14 LUFS.
- **End card** is a PIL composite of the real wordmark (never AI); captions suppressed there.
- **Finalize** applies 1.15x speed (pitch preserved) + anti-AI grain → H.264 (+ AAC).

The FREE assembly (PIL + FFmpeg) makes NO paid or AI calls. The paid steps — nano-banana
plates, Kling 3.0 i2v beats, ElevenLabs VO + music — are separate capabilities the recipe
orchestrates and gates.
