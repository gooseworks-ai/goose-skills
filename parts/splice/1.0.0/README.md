# splice 1.0.0

Puts a new opening in front of a finished ad and keeps everything after the cut untouched. Free. A port of the
render-hook-replacement atom's `replace_hook.py`; used by the hook-replacement style.

- **Body.** The last `footage` entry (kind `render` or `video`) is the original ad. It is kept from `start_ms`
  (the cut, snapped to the first frame at or after it) to its end, with its own sound. `end_ms` may be null or at
  its end; a body is never trimmed at the end.
- **Opening.** `hook` (a video, for example an html-frames card), or, with no `hook`, a first `footage` entry cut to
  its window (its sound is kept unless `audio` is false). Never both. It is fitted inside the body's frame with
  black bars and converted to the body's frame rate, pixel format, sample rate and channel layout (`match: body`).
- **Source rules** (refused as `bad_input` before anything is encoded): a picture; 8-bit yuv420p; square pixels; no
  rotation; even width and height; a constant frame rate; streams starting at zero; sound ending no later than the
  last frame (one AAC frame of padding allowed); a defined channel layout; at least one whole frame after the cut;
  not a Git LFS pointer.
- **Keep** (`keep: body`). The body's picture is stream-copied when it is H.264 in an MP4 and the cut lands on a
  keyframe. Otherwise the whole cut is re-encoded at CRF 12 or lower, High profile, `-maxrate 16M -bufsize 32M`.
  The sound is always re-encoded (AAC 256k) at the body's own sample rate and layout, because AAC frames never land on
  the cut; the check below covers it.
- **Checks** (`checks`, all on the finished file): every kept frame is decoded from the original and the output and
  compared in order (same count; an exact hash match or PSNR >= `psnr_min`, default 45 dB); the kept sound at the same
  sample positions (normalised RMS error <= 0.08, correlation >= 0.99; a silent original must stay silent, RMS <=
  0.0001); the length is the opening plus the body to one frame; the original and opening bytes are unchanged. A
  stream copy that fails the checks falls back to a re-encode; a re-encode that fails them is refused as
  `output_invalid`.
- **Size** (§4.12). The output's size is projected before encoding and measured after; over `max_mb` (default and
  highest 180) is refused as `output_invalid`.
- **Outputs**: `video`, `seconds`, `timeline` (scenes `hook` and `body`; speech from `hook_timeline` only; `end_card`
  shifted from `body_timeline` when given), and `retained` (`start_s`, `end_s`, `cut_s`, `frames`, `exact_frames`,
  `psnr_min`, `audio_nrmse`, `audio_corr`, `copied`, `source_sha256`).
- No captions, loudness, brand or end card are added: the body already has its own. A style using splice turns the
  sound and captions layers off.

Source: `parts/splice/src/part.mjs`, `src/source.mjs`, `src/checks.mjs`, `src/size.mjs` and `src/manifest.mjs`.
