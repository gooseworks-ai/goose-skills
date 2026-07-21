# render-mascot-genre-film scripts — the FREE assembly

`render-mascot-genre-film` is the **deterministic, $0 assembly stage** of the mascot genre-film
format. The paid stages (the mascot anchor, the 2 plates, the Kling i2v reveal, the instrumental
music bed, the one whispered VO line) are separate capabilities — `create-image-fal`,
`create-video-fal`, `create-music-elevenlabs`, `create-vo-elevenlabs`. This capability spends
nothing: it takes the 2 plates + the 2 locked mascot stills + the reveal clip + the bed + the VO +
the brand primary color and font, and stitches the finished master. Re-cuts (a re-grade, re-timed
banners, a swapped end card, a re-balanced mix) reuse the existing stills / clip / audio and cost
**$0**.

`config.example.json` is the worked example (Duolingo "Don't Skip", ~22s 1080×1920, 8 beats).
`PIPELINE.md` maps every config block to its source step. This README documents the FREE assembly
pieces that `render-mascot-genre-film` owns.

## 1. HTML hyperframes — every on-screen word is HTML, never AI text

All notification banners, the title card, and the end card are crisp HTML→PNG via Chrome headless
(`--headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=1
--virtual-time-budget=3500`, `--default-background-color=00000000` for the transparent banners, the
brand font — Nunito is the free Feather stand-in). Banners are iOS dark-mode push notifications
(1080×300 transparent PNGs) whose app-icon is a square head-crop of the mascot ref (PIL) tinted onto
the brand primary — reused across the banners and the end card. **A diffusion model garbles text**
and betrays the quality illusion, so nothing on screen is AI-rendered. The notification TEXT is the
scariest element — psychological, not visual.

## 2. ffmpeg-synth SFX — the FAL SFX endpoint is broken

The 4 SFX are synthesized locally with ffmpeg (no API, no key):

- **notif ping** — three sine bells (932/1397/1864 Hz) with exp-decay envelopes, `highpass 400`,
  `aecho 0.5:0.5:55:0.22`, `volume 1.5`.
- **heartbeat** (loopable) — `sine 55` + `sine 110` lub-dub, two exp bumps (t=0 and t=0.34),
  `lowpass 180`, `volume 1.7` — one ~1.1s cycle.
- **riser** — `aevalsrc` pitched sweep 150→1500 Hz over 3s + `anoisesrc` pink through
  `bandpass 1500:w1000` with a `(t/3)^2` swell.
- **reveal sting** — a dissonant high sine cluster (1800/1912/2360 Hz) + a `sine 52` sub drop, exp
  decays, `aecho 0.6:0.6:60:0.45`.

## 3. Per-beat grade + zoom — cozy→sickly gradient, never redesign

Each still beat is scale/cropped to 1080×1920, **pre-upscaled to 2160×3840** (kills `zoompan`
jitter), given a slow `zoompan` push-in to its `zoom_max`, graded via the `grade()` curve chain, and
`setsar=1`. The grade `curves` lift the black point so cozy reads cozy (don't crush blacks into mud);
`eq` sets contrast/saturation/brightness; `colorbalance` pulls teal-green; `vignette` is gentle
(PI/5.2+). The descent runs warm-cozy → green-creeps → sickly-teal-green → near-black → the
light-touch reveal → clean black. cozy→creepy is a **gradient** across the first two beats (the same
cozy plate re-graded), no hard color cut. The reveal beat is the i2v clip (graded, no zoompan). The
title/end cards are HTML over black. **Grain is subtle on photographic beats (`noise=alls=3`,
`alls=2` on the i2v) and ZERO on the cards** — grain on flat black is a dead giveaway, and heavy
grain kills compressibility (`alls=8` → 64 Mbps / 176 MB slop).

## 4. Eased banner overlays — PNG composites, no libass

Each notification banner is a pre-rendered transparent PNG eased in with an exponential settle
(`overlay=0:'by-(300+by)*exp(-13*max(0,t-tin))'`, `by=160`) at its beat's `tin` — never a linear
slide. **libass is not used** — the on-screen text is HTML→PNG composited via `overlay=x:y:enable=…`,
so no `subtitles`/`ass` filter is required (safe on a Homebrew ffmpeg without libass).

## 5. FFmpeg composite + 8-track mix

FFmpeg concats the 8 hard-cut beats → `master-silent.mp4`. The 8-track `amix` (`normalize=0`) is the
instrumental bed + 3 notif pings + the heartbeat loop + the riser + the sting + the VO, each placed
by `adelay`. The bed runs a piecewise `volume` automation — full under the build, **dropping to ~0.07
at the ~13.6s reveal** (silence is louder than a jump-scare), returning to 0.47 for the button, with
an `afade` in (1.6s) and an `afade` out (st21.2 d0.8 — no silent tail). The VO gets its owl treatment
IN THE MIX (`asetrate 1.05` + `atempo 0.952` + `aecho`). Then a **2-pass `loudnorm I=-14`** (social,
not −23 broadcast — no separate VO bed to duck under). Mux the bed OVER the whole video including the
end card (`-map 0:v:0 -map 1:a:0 -c:a aac -b:a 192k -movflags +faststart`) → a 1080×1920 h264+aac
master, ~22s. Encode `libx264 preset slow crf20 maxrate10M bufsize20M`. Deterministic, no paid calls,
no keys.

## 6. QC per scene before publish (the failure mode is content, not assembly)

The assembly is faithful, but the upstream anchor/i2v can slip a defect that a sparse-still watch
misses in a ~22s master:

- **Mascot drift / redesign** partway through the reveal (lives in the ANCHOR or the i2v; regenerate
  the anchor or the clip off the clean close still, don't re-cut).
- **Warp / jitter** on the reveal clip (re-anchor the i2v off the clean locked still).

Extract a **2 fps** contact sheet across the whole master; confirm the mascot holds **100% on-model**
through the reveal, the banners are crisp HTML, the grade gradient reads cozy→sickly, the music-drop
lands at the reveal, ~−14 LUFS, and a sane file size (~25 MB, not 176 MB); then re-extract frames from
the **served** bytes (`get_download_url`), not the local file, after publish.
(mascot-genre-film, Duolingo "Don't Skip".)
