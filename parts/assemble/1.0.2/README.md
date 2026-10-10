# assemble 1.0.2

Joins scene clips and stills, in order, into one cut. Free. The assembler from stitch-videos-ffmpeg's montage.

- Every cut is scaled to `width` x `height` (`cover` crops to fill, `contain` pads with `background`), one
  `fps` (default 30), square pixels, yuv420p.
- A clip's cut is `in_s` plus `seconds` (default: the rest of the clip). A clip up to 0.1 s short holds its last
  frame; more than that is refused. A still needs `seconds`. A streaming WebM or Matroska clip with no container length
  is measured from its streams or packets. One ffprobe reports as cut off or damaged is
  refused.
- Each cut gets an exact frame count, so the cut's length is the sum of the cuts to the frame; hard cuts go
  through the concat filter, never the concat demuxer (which drops audio and adds black frames at joins).
- `clip_audio: keep` keeps each clip's own sound, with silence under stills and silent clips.
- **Outputs**: `video`, `seconds`, `timeline` (one scene per cut, no speech).
- Captions and loudness are the layers' jobs.

Source: `parts/assemble/src/part.mjs` and `src/manifest.mjs`.
