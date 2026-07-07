# render-hypermotion — FREE assembly

This capability ships the **recipe** (`config.example.json`) + a config→step map
(`PIPELINE.md`) for the product-hypermotion + kinetic-typography format, plus this note
documenting the **FREE, deterministic assembly** — everything between the two paid model
calls. The paid steps (ONE Seedance 2.0 hypermotion i2v + one ElevenLabs music bed) are
separate capabilities; the recipe orchestrates and gates them. Everything below is $0
(PIL + FFmpeg), keeps the real logo + spec typography pixel-crisp, and never makes an AI
or paid call.

The whole IP is **one-call-many-cuts + intercut**: generate ONE 12–15s hypermotion clip,
dice it into 5–6 segments, and interleave PIL kinetic-typography spec cards between the
cuts, capped by a real-logo end card. Never fire a paid call per segment.

## What's FREE here

### 1. PIL kinetic-typography spec/CTA cards (the format's whole message)
No VO — the typographic cards carry every fact. Each card is a full-frame 1080×1920 PIL
clip rendered **frame-by-frame** → PNG sequence → ffmpeg-encode. On the dark industrial
grain BG (`dark_grain_bg`), using the brand's static Space Grotesk Bold TTF (a variable TTF
renders as Regular in PIL — always the `/static/` file):

- **Italic skew** — affine shear ~6° for faux italic (10°+ reads cartoony).
- **Outline echo** — transparent fill + colored stroke at **1.08×** (the bleed-safe sweet
  spot; larger reads as accidental clipping, smaller defeats the ambient-shadow purpose).
- **3D extrusion** — stack 18–28 offset copies + a solid face, side color = brand accent;
  reserved for the hero stat and the CTA.
- **Slam-with-shake** — scale 0.3→1.10 cubic-ease + sin/cos shake decaying over ~0.20s for
  a killer-stat reveal.
- **Color / inversion flash** — full-frame BG↔type swap (Soundboks: black↔orange) for the
  CTA energy and the mid-clip art moment; invert the type too or legibility drops.

Cards rendered per `config.text_cards`: an intro ("INTRODUCING", italic + outline echo),
one per spec (hero stat = 3D extrusion in accent; others cycle italic outline-echo /
white-slam / sparkle / shadow-stack), and a CTA (3D extrusion + accent→black flash).

### 2. Real-logo PIL end card (never a typeset wordmark)
The brand close uses the **actual logo PNG**, not typeset text — typeset misses the
distinctive letterforms and reads as a substitute. Most brand SVGs wrap a base64 PNG;
**decode it out** first (`re.search(r'data:image/png;base64,([...])', svg)` →
`base64.b64decode`; pure-vector SVGs use `rsvg-convert`). Then in PIL: composite the logo
scaled to `end_card.logo_target_w` (LANCZOS, ~80px margin) with a **slam motion-blur**
entry (GaussianBlur the entry frames), settle, **continuous micro-motion** (±1% scale
pulse + ±3px drift for the full hold — never freeze, or 3+ frozen seconds read as a JPEG),
an **inversion flash** at ~60% of the card, and a cascade reveal of the spec-dot subtitle
("126 dB · 40 HRS · IP65") + CTA.

### 3. FFmpeg dice + intercut concat
- **Center-crop** the ONE hypermotion clip 1:1 → 9:16
  (`scale=-1:1920,crop=1080:1920:(iw-1080)/2:0,fps=30`) — don't regen native 9:16 (pricier,
  quality-equivalent; ~25% horizontal loss is fine for a product-centric frame).
- **Dice into 5–6 segments** via `-ss/-t` at Seedance's natural beat boundaries (crash-zoom
  → orbit → settle), **decreasing** lengths to build energy — NOT at uniform intervals.
- **Concat** cards + segments in the fixed intercut order from `config.beat_structure`:
  open on the intro card → alternate segment ↔ spec card → end on the CTA + brand end card
  (intro → segA → spec1 → segB → spec2 → … → segF → cta → endcard). Build `concat.txt` with
  absolute paths; concat-copy to a silent master.

### 4. Explicit-map music mux (separate pass)
Mux the music bed as a **SEPARATE** pass with explicit maps — the default mapping silently
yields ~1 kbps garbage audio:

```bash
ffmpeg -y -i working/master-silent.mp4 -i working/music.mp3 \
  -c:v copy -c:a aac -b:a 192k -ar 44100 -map 0:v -map 1:a -shortest \
  -movflags +faststart master-final.mp4
```

Verify `ffprobe` audio bit_rate ≈ 192000 (NOT 1000).

## Contract

- Deterministic + FREE (PIL + FFmpeg); no paid calls, no AI-rendered logo or spec text.
- ONE hypermotion clip, diced into 5–6 segments — never a paid call per segment. Cheaper
  ($4.54 vs ~$22) AND identity-consistent (same camera/grade/subject in one call).
- The end card is the brand's **real logo PNG**, base64-decoded from the SVG — never
  typeset. It must micro-move for the full hold (never freeze).
- Spec cards carry every fact (no VO); outline echoes stay ≤1.08× so nothing bleeds off
  frame; use the static Space Grotesk Bold TTF.
- The paid steps — ONE Seedance 2.0 hypermotion i2v (the 5-block prompt with the mandatory
  ABSOLUTE CONSTRAINTS block, or the geometry drifts mid-clip) + one ElevenLabs 124 BPM
  bass bed — are separate capabilities (create-video-fal, create-music-elevenlabs); the
  recipe orchestrates them and gates the spend.

See `PIPELINE.md` for the full config-field → source-step map and beat-structure variants.
