---
name: render-mascot-genre-film
description: Assemble a mascot genre-film ad (worked example — horror) from a config — a ~22s A24-style POV short where a brand mascot is re-lit (never redesigned) into the genre while the brand's own notification mechanic is dramatized as the scare. This is the FREE deterministic assembly stage — HTML→PNG hyperframes (iOS notification banners + title + end card, never AI-rendered text), 4 ffmpeg-synth SFX (notif ping / heartbeat / riser / reveal sting; the FAL SFX endpoint is broken), per-beat grade (curves/eq/colorbalance/vignette/subtle-grain) + zoompan push-in + eased banner overlays, an 8-track amix with the music dropping to near-silence at the reveal and a 2-pass loudnorm to −14 LUFS, then concat + mux. The mascot anchor, plates, i2v reveal, music, and VO come from create-image-fal / create-video-fal / create-music-elevenlabs / create-vo-elevenlabs. Use for the mascot-genre-film format.
status: active
---

# render-mascot-genre-film

Assemble a **mascot genre-film** ad from a config — a ~22s A24-style POV genre short (the worked
example is horror) where a brand's own **mascot** is the "character" (re-lit into the genre, never
redesigned) and the brand's own product mechanic (e.g. a guilt-trip notification engine) is
dramatized as the scare. This capability is the **FREE, deterministic assembly** — the HTML→PNG
hyperframes, the ffmpeg-synth SFX, the per-beat grade + zoom + eased banner overlays, the 8-track
mix, the concat, and the mux.

`scripts/config.example.json` is the worked example (Duolingo "Don't Skip", ~22s 1080×1920 9:16, 8
beats `[3.0, 3.0, 3.0, 3.0, 1.6, 4.4, 2.0, 2.0]`); `scripts/PIPELINE.md` maps every config block to
its source step and `scripts/README.md` documents the free assembly.

## Run

This is the **FREE, deterministic** assembly stage — it spends nothing. The paid inputs are separate
capabilities: the mascot anchor (`create-image-fal`, Nano Banana 2 EDIT off the official render — a
distant silhouette + a close reveal, kept 100% on-model); two atmospheric POV plates
(`create-image-fal`, Nano Banana v1); the reveal (`create-video-fal`, Kling V3 Pro i2v off the close
still); the instrumental genre bed (`create-music-elevenlabs`); and one whispered VO line
(`create-vo-elevenlabs`). Given the 2 plates + the 2 locked mascot stills + the reveal clip + the
instrumental bed + the VO line + the brand primary color and font, `render-mascot-genre-film` renders
the HTML hyperframes, synthesizes the 4 SFX, grades and zooms each beat, overlays the eased banners,
concats the 8 hard-cut beats, mixes the 8-track audio (with the music-drop at the reveal), loudnorms
to −14 LUFS, and muxes → the master. Re-cuts reuse the existing stills / clip / audio and cost **$0**.

## Contract (the free assembly)

- **The AI is invisible — never AI-render brand text; render every on-screen word as HTML.** All
  notification banners, the title card, and the end card are crisp HTML→PNG via Chrome headless
  (`--headless=new --virtual-time-budget=3500`, transparent bg for banners, the brand font). A
  diffusion model garbles text and betrays the quality illusion. The notification TEXT is the
  scariest element — psychological, not visual.
- **Never redesign the mascot — only re-light.** The two locked stills (a distant silhouette + a
  close reveal) are the same on-model mascot re-lit into the genre; the two-stage scare is
  perspective/framing, not a redesign. If a beat shows a redesigned or warped mascot, that's an
  upstream keyframe/i2v defect — regenerate the anchor/clip, don't re-cut.
- **The brand's own color is the "evil light."** The brand primary is re-purposed as the sickly glow
  (brand color against itself). Desaturate the electric source green toward teal in the grade so it
  reads premium, not video-game.
- **cozy→creepy is a GRADIENT, not a hard cut.** The first two beats re-grade the same cozy plate —
  warm neutral → sickly brand-color via `colorbalance` — with no hard color cut.
- **Per-beat grade + zoom.** Each still beat is scale/cropped to 1080×1920, pre-upscaled to
  2160×3840 (kills `zoompan` jitter), given a slow `zoompan` push-in to its `zoom_max`, graded via
  the `grade()` curve chain (`curves` lift the black point so cozy reads cozy; `eq`
  contrast/saturation/brightness; `colorbalance` teal-green; `vignette` PI/5.2+), and `setsar=1`. The
  reveal beat is the i2v clip (graded, no zoompan). The title/end cards are HTML over black.
- **Grain subtle on photographic beats, ZERO on the cards.** `noise=alls=3` on the graded stills,
  `alls=2` on the i2v reveal, and NONE on the title/end cards — grain on flat black is a dead
  giveaway. Grain also kills compressibility (`alls=8` → 64 Mbps / 176 MB slop); cap the encode
  (`libx264 preset slow crf 20 maxrate 10M bufsize 20M`).
- **Eased banner overlays — PNG composites, not a text layer.** Each notification banner is a
  pre-rendered transparent PNG eased in with an exponential settle
  (`overlay=0:'by-(300+by)*exp(-13*max(0,t-tin))'`, `by=160`) at its beat's `tin` — never a linear
  slide. **libass is not used** — the on-screen text is HTML→PNG composited via
  `overlay=x:y:enable=…`, so no `subtitles`/`ass` filter is required.
- **4 ffmpeg-synth SFX — the FAL SFX endpoint is broken.** Synthesize the notif ping (sine bells +
  aecho), a loopable heartbeat (sine 55/110 lub-dub + lowpass), a 3s riser (aevalsrc sweep +
  bandpassed pink noise), and a dissonant reveal sting (high sine cluster + sub drop + aecho) locally
  with ffmpeg. No paid call, no key.
- **8-track amix — the music drops to near-silence at the reveal.** `amix` (`normalize=0`) of the
  instrumental bed + 3 notif pings + the heartbeat loop + the riser + the sting + the VO, each placed
  by `adelay`. The bed runs a piecewise `volume` automation — full under the build, dropping to ~0.07
  at the ~13.6s reveal (silence is louder than a jump-scare), returning for the button. The VO gets
  its owl treatment IN THE MIX (`asetrate 1.05` + `atempo 0.952` + `aecho`), not in the gen. Then a
  **2-pass `loudnorm I=-14`** (social, not −23 broadcast) — no separate VO bed to duck under.
- **FFmpeg composite, deterministic, FREE.** Concat the 8 hard-cut beats, mux the bed OVER the whole
  video including the end card with a 0.8s afade at the tail (no silent tail), `-map 0:v:0 -map
  1:a:0 -c:a aac -b:a 192k -movflags +faststart` → a 1080×1920 h264+aac master, ~22s. No paid calls,
  no keys.
- **QC PER SCENE, never just the master — the failure mode is content, not assembly.** Sparse stills
  hide deformation peaks in a ~22s master. Extract a **2 fps** contact sheet across the whole master;
  confirm the mascot holds **100% on-model** through the reveal (no warp/jitter/redesign), the
  banners are crisp HTML, the grade gradient reads cozy→sickly, the music-drop lands at the reveal,
  ~−14 LUFS, and a sane file size (~25 MB, not 176 MB). Re-check the **served** bytes after publish. A
  drifted mascot means regenerating the ANCHOR or the i2v (not re-cutting) — see the recipe STEP 1/4.
