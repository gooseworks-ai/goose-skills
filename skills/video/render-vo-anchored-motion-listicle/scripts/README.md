# render-vo-anchored-motion-listicle scripts — the FREE assembly

`render-vo-anchored-motion-listicle` is the **deterministic, $0 assembly stage** of the
VO-anchored motion-graphic listicle format. The paid/metered stages (the spoken VO, the low music
bed, any AI breather clips) are separate capabilities — `create-vo-elevenlabs`,
`create-music-elevenlabs`, `create-video-fal`. Creative calls (narrator, tone, list angle, visual
style, music) come from the format recipe's `choices` via the config. This capability spends nothing: it takes the VO +
`words-flat.json` + the N authored hyperframe beats + the color-graded B-roll windows + the brand
wordmark SVG and stitches the finished master. Re-cuts (new caption chunking, re-timed beats, a
swapped B-roll window, a different music-bed level) reuse the existing VO / beats / B-roll and cost
**$0**.

`config.example.json` is the worked example (Everself "doctor-educator" listicle, ~66s 1080×1920 at
25fps) — copy its structure, never its creative values. `PIPELINE.md` maps every config block to its source step. This README documents the FREE
assembly pieces that `render-vo-anchored-motion-listicle` owns.

## 1. Beat render — Playwright frame-by-frame, all beats at fps 25

Each beat is an HTML hyperframe + the Web Animations API driven by `window.renderAt(t)`. The renderer
(`render_hf.py`-style) loads the hyperframe headless in Playwright, calls `window.renderAt(t)` for
each frame time, screenshots it, and ffmpeg encodes the frames → a silent mp4 per beat. This is
deterministic web motion graphics — NOT i2v, no diffusion, no keys. **ALL beats MUST share fps 25** —
a beat rendered at a different fps stutters at the concat seam. The reveals inside each beat are
anchored to the VO's word-level timestamps (`words-flat.json`), so authoring order is: lock the VO
first, transcribe it, then time each beat's reveals to its anchor words.

## 2. Concat on the timeline

The VO sets the timeline. Assembly concats the rendered beats + the color-graded B-roll windows in
order (ffmpeg demuxer) → `master-silent.mp4`. Beats and B-roll are all fps 25 so the seams are clean.

## 3. B-roll windows — color-graded, the only captioned windows

Each breather window is a brand/procedure clip, a gated AI clip (`create-video-fal`, screen-free), or
a free motion-graphic breather — there is no free stock-footage source — trimmed and color-graded to
the palette, rendered at fps 25. These give the eye a rest between the dense motion-graphic beats
and are the **only** windows where captions burn — on the beats themselves the on-screen type IS the
caption.

## 4. Captions — from the VO word timings, masked to the B-roll windows

Captions come from the VO's `words-flat.json`, kept **ONLY inside the B-roll windows**, chunked to
~2 words, closing a cue on any >0.4s word gap. Rendered as an ASS overlay in a lower-third. **The ASS
`Format:` header MUST include a `Name` field** — without it the leading-comma bug eats the first
field and captions silently drop. Never caption the motion-graphic beats (double-stacks text). If the
host ffmpeg lacks libass (no `subtitles`/`ass` filter), render the cues as timed PIL PNG overlays
composited with ffmpeg `overlay=…:enable='between(t,st,en)'` instead — same placement, no libass
dependency.

## 5. VO + music mix

The VO is the spine at full level; the ElevenLabs Music bed (style from the music choice; skipped if
`none`) sits ~0.18 vol under it (no ducking
needed at that level). Mix → the master audio.

## 6. FFmpeg composite

FFmpeg composites the master: the silent concatenated video + the mixed audio (VO + low bed) + the
burned window-masked captions, loudnorm `I=-14` → a 1080×1920 25fps h264 crf18 + aac 192k master
(~66s). The CTA / end beat composites the brand's real wordmark — **never** AI-rendered text (a
diffusion model garbles a wordmark). Deterministic, no paid calls, no keys.
