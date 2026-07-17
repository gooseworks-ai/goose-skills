# render-editorial-motion-podcast scripts — the FREE assembly

`render-editorial-motion-podcast` is the **deterministic, $0 assembly stage** of the
editorial-motion podcast-clip format. The paid stages — the two Whisper calls (~$0.04 each) and
the per-beat Nano Banana keyframes — are upstream (`create-image-fal` + a transcription step);
the real podcast MP3 is clipped from source with free ffmpeg. This capability spends nothing on
the motion layer: it takes the clipped audio + `words.json` + the per-beat keyframes + the real
brand wordmark PNG and stitches the finished master. Re-cuts (new beat windows, added micro-cuts,
re-timed caption ranges, a swapped end card) reuse the existing audio / keyframes and cost **$0**.

`config.example.json` is the worked example (Klarify "Rat Park", ~40.8s 1080×1920). `PIPELINE.md`
maps every config block to its source step. This README documents the FREE assembly pieces that
`render-editorial-motion-podcast` owns.

## 1. ffmpeg ken-burns motion — NOT generative i2v

The motion is **deterministic ffmpeg ken-burns** on static keyframes, never generative i2v.
Seedance/Kling are photoreal-trained and invent naturalistic middle states (a photoreal drawing
hand, rats morphing into humanoids, hallucinated clouds) that collapse the 2-tone discipline.
Two helpers: `render_kb <src> <out> <dur> [zoom_end]` (push-in — scale to 2×, crop,
`zoompan z='min(zoom+step,zoom_end)'`, `trim=duration`, `-t dur`) and `render_kb_out` (pull-back,
`zoom_start` down to 1.0). **Never** `-loop 1` with `zoompan d=N` — d runs per input frame per
loop and balloons the duration; feed a single image and clamp with `-t` + `trim`.

## 2. Hard-concat on the beat — no crossfades

Each beat's segments are hard-concatenated on the beat; long beats split into micro-cuts (target
8–10 distinct visual moments — anything held > 6s reads static even with active zoompan). **No
crossfades** — they ghost two drifting cages through each other. Each beat's visual STARTS within
~0.5s of its spoken line (marked from the Whisper timings upstream), never ahead, never lag.

## 3. Real-audio mux + mid-sentence captions

The clipped source MP3 is muxed as the master audio (`-map 0:v:0 -map 1:a:0`) — no song, no VO,
the host's real recorded line carries the spot. The video runs a ~1.5s silent hold past the audio
on the end card (fade the first/last 0.3s so it doesn't hard-black-flash). Captions are burned
`frosted-subtle` (Whisper on the master → ASS via libass) **ON only while the speaker is
mid-sentence** — silent/reflective beats and the end card stay uncaptioned so captions don't
fight the visual.

## 4. PIL end card — from the real wordmark PNG, no AI text

The brand lockup is composited with **PIL** from the brand's REAL wordmark PNG: stretch a 1px
center column → 1080×1920 + `GaussianBlur(80)` for the gradient bg; a feathered radial-alpha
ellipse crop of the brand mascot pasted centered-upper; wordmark + tagline drawn with a system
font. The brand text is **never** AI-rendered — a diffusion model garbles a wordmark
("therapits"). Output is a 1080×1920 h264 + aac master. Deterministic, no paid calls, no keys.
