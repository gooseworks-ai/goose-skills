---
name: stitch-videos-ffmpeg
description: Stitch video segments with ffmpeg concat, xfade, overlay, audio mux, and export settings, and trim a source into named clips at exact windows (trim_clips.py). Ships montage.py, a free montage assembler (python3 + ffmpeg, no keys). It takes a JSON EDL of clips and stills, normalizes them and hard-cuts them in order, burns captions from an SRT, a cue list or word timings, and lays a VO over a music bed that ducks under it, mastered to -14 LUFS.
version: "1.3.0"
updated: 2026-10-06
---

# stitch-videos-ffmpeg

## Purpose

Stitch video segments with ffmpeg concat, xfade, overlay, audio mux, and export settings.

Implementation status: refactored from existing repository skills. The workflow consolidates behavior that previously lived across larger skills.

Sources: ad-studio, voiceover-product-ad, ugc-product-video, voiceless-music-transformation-reel, product-stopmotion-ad.

Extraction notes: assembly and composite scripts.

## Montage helper: `scripts/montage.py`

A free, deterministic way to cut a montage ad from finished clips. It needs `python3` and
`ffmpeg`/`ffprobe` only (Pillow is optional, see Captions). It makes no network or provider
calls and needs no keys, so re-cuts cost nothing.

| Step | What it does |
|---|---|
| `edl` | Checks a JSON spec and writes `edl.json`. Every file must exist and is probed with ffprobe; every cut must fit inside its clip. All problems are listed at once. |
| `assemble` | Scales each cut to one size (default 1080×1920, `cover` crops to fill, `contain` pads), one frame rate (default 30), square pixels and yuv420p. Then it hard-cuts them in order with the `filter_complex` concat filter, never the `-f concat` demuxer. Each cut gets an exact frame count, so the output length equals the EDL total. |
| `captions` | Burns an SRT, a JSON cue list, or word timings (one cue per `--per` words) into the video. The cue text is kept exactly as given (wrapping only turns spaces into line breaks). |
| `mix` | Lays the VO over the video and adds an optional music bed that ducks under the VO (sidechain compression, 20:1). Then it masters to -14 LUFS / -1 dBTP with two-pass loudnorm. |
| `run` | Runs all four steps from one spec and writes `manifest.json`. |

Each step prints a one-line JSON summary. Exit codes: `0` ok, `1` ffmpeg failed, `2` bad
spec or arguments, `3` a tool is missing (ffmpeg, ffprobe, or a caption renderer).

### Run it

After `gooseworks fetch stitch-videos-ffmpeg` (or as a dependency of a format package), the
scripts are in `/tmp/gooseworks-scripts/stitch-videos-ffmpeg/scripts/`:

```bash
S=/tmp/gooseworks-scripts/stitch-videos-ffmpeg/scripts   # or this folder's scripts/ in a checkout

python3 $S/montage.py run --spec montage.json --out edits/master.mp4 --workdir edits/work

# or one step at a time
python3 $S/montage.py edl      --spec montage.json --out edits/edl.json
python3 $S/montage.py assemble --edl edits/edl.json --out edits/body.mp4
python3 $S/montage.py captions --video edits/body.mp4 --words audio/vo.words.json \
    --respell '{"symbiotic": "synbiotic"}' --color "#FFE800" --out edits/captioned.mp4
python3 $S/montage.py mix      --video edits/captioned.mp4 --vo audio/vo.mp3 \
    --music audio/bed.mp3 --out edits/master.mp4
```

### Spec format

Paths are relative to the spec file. Times are seconds or a timecode string (`"SS"`,
`"MM:SS"`, `"HH:MM:SS"`, optional `.ms`).

```json
{
  "output": {"width": 1080, "height": 1920, "fps": 30, "fit": "cover"},
  "words": "audio/vo.words.json",
  "clips": [
    {"file": "clips/scene-01.mp4", "label": "hook", "word_range": [0, 4]},
    {"file": "clips/scene-02.mp4", "label": "feature", "in": 0.2, "out": 1.6},
    {"file": "clips/scene-03.mp4", "label": "reaction", "in": "00:00.5", "duration": 0.9},
    {"file": "clips/scene-04.mp4", "label": "b-roll", "t_in": 4.1, "t_out": 5.0},
    {"file": "clips/scene-05.mp4"},
    {"file": "overlays/landing-page.png", "label": "landing-page", "duration": 1.5,
     "pan": {"from": {"x": 0.5, "y": 0.2, "zoom": 1.0}, "to": {"x": 0.5, "y": 0.7, "zoom": 1.6}}},
    {"file": "brand/end-card.png", "label": "end-card", "duration": 2.0}
  ],
  "clip_audio": "drop",
  "captions": {"words": "audio/vo.words.json", "per": 1, "respell": {"symbiotic": "synbiotic"},
               "style": {"color": "#FFE800", "y": 0.5}},
  "audio": {"vo": "audio/vo.mp3", "music": "audio/bed.mp3", "music_start": 14.2}
}
```

**How long each cut is** (first match wins):

- `word_range: [i, j]` cuts on the VO's word boundaries. It needs a top-level `words` file,
  used as the transcriber wrote it: a flat `[{text|word, start, end}]` list, `{words: [...]}`
  (OpenAI, ElevenLabs; `spacing` entries are skipped), Whisper's `{segments: [{words: [...]}]}`
  (goose-studio's `transcribe-audio-fal`), or fal's `{chunks: [{text, timestamp: [s, e]}]}`.
  Words with no time are skipped, and leading spaces are stripped. The cut runs from the start of word `i` to the start of word
  `j + 1`, or to the last word's end. The first cut starts at 0 so it covers the lead-in.
  Consecutive ranges tile the VO with no gaps.
- `t_in` / `t_out` give a window on the timeline. The cut is `t_out - t_in` long. A window
  that does not start where the previous cut ended is reported as a gap or overlap warning;
  `--strict` turns warnings into errors.
- `in` + `out`, or `in` + `duration`, trim the source clip.
- With nothing set, the whole clip plays (from `in`, default 0).

Every cut starts at `in` in its source (default 0). A still image (`.png`, `.jpg`, `.webp`)
needs a length; `pan` zooms and pans across it. The still is first cover-cropped to the output
aspect (9:16 by default), and `x`/`y` are the window centre as a fraction of that cropped image
(`zoom` ≥ 1). A video clip may be up to 0.1 s short of its cut, and then its
last frame is held. Anything shorter is an error.

`clip_audio` (`--clip-audio` on `assemble`): `drop` (default) or `keep`. `keep` keeps each
clip's own sound and fills silence under stills and silent clips.

### Captions

- **Sources:** `srt`, `cues` (a list or a JSON file of `{start, end, text}`), or `words`
  (any of the word-file shapes above) plus `per` and an optional `respell` map. `respell`
  swaps a misheard word for the locked spelling and keeps the punctuation around it.
  Overlapping cues: the later one wins.
- **Look:** each cue is drawn whole, in one colour with an outline. With `per: 1` that is one
  word at a time, each held until the next. There is no active-word (karaoke) highlight.
- **Timing:** a cue shows from the first output frame at or after its start until the first
  frame at or after its end (a 1 ms caption grid; ffmpeg older than 5 falls back to 1/25 s and
  says so in the step's warnings).
- **Style:** `font`, `font_size` (px, default 4.5% of the height), `color`, `outline_color`,
  `outline` (px), `y` (centre of the caption block as a fraction of the height, default
  0.72) and `max_width` (default 0.86 of the width).
- **Renderers:** `auto` uses Pillow when it is installed, so captions look the same on
  every machine. Otherwise it uses libass, which needs an ffmpeg with the `ass` filter.
  Some ffmpeg builds (Homebrew's default) have no libass and no `drawtext`, so Pillow is
  the dependable renderer. With neither, the step exits 3 and says so.

### Mix defaults (all overridable)

| Setting | Default | Meaning |
|---|---|---|
| `vo_lufs` | -16 | VO level before mixing (static gain from a measured pass) |
| `music_lufs` | -24 | Bed level between VO lines, before ducking |
| `duck_threshold` / `duck_ratio` | 0.02 / 20 | The bed ducks while the VO is above the threshold. ffmpeg caps the ratio at 20. |
| `duck_attack` / `duck_release` | 20 / 400 ms | How fast the bed dips and comes back |
| `vo_start`, `music_start` | 0 | Where each track enters on the timeline. `vo_start` moves only the VO audio, not `word_range` cuts or word captions, so keep it 0 when those come from the same VO. |
| `music_fade_in` / `music_fade_out` | 0 / 1 s | A bed shorter than the video loops (with a warning) |
| `target_lufs` / `target_tp` | -14 / -1 | Master loudness. `off` skips it. |
| `keep_video_audio` | false | Mix the video's own audio in too (not ducked) |

A VO that runs past the end of the video is cut and reported as a warning, so lengthen the
EDL (for example, the end card) instead.

### Tests

`tests/test_stitch_montage.py` makes tiny synthetic clips, a still and two tones with ffmpeg,
then checks: the output length equals the EDL total to the frame, size/fps/pixel shape are
normalized, captions appear only on their cue frames with the exact text, the bed ducks
under the VO (about 14 dB on the fixture), and the master is at -14 ±1 LUFS. It runs in CI
(`media-tests`) and locally:

```bash
python3 -m pytest -q skills/ads/packs/video-ad-formats/stitch-videos-ffmpeg/tests
```

### Related

- The older scripts here (`composite.py`, `composite_final.py` / `.sh`, `normalize_clip.sh`,
  `voiceless/composite.py`) are unchanged.
- `mix-master` remains the multi-clip VO + SFX mix. A `montage.py` master is already at
  -14 LUFS, so a later -14 LUFS finishing pass barely changes it.
- `caption-burn` remains the place for plate, seam and hook-card caption styles.

## Trim mode: `scripts/trim_clips.py`

Cuts one source video into named clips at exact windows (this replaces the studio's
trim-video-clips). Each clip is re-encoded with libx264, so cuts land on the requested frames and
drop cleanly into an edit. Deciding which windows to cut is the caller's job.

```bash
python3 scripts/trim_clips.py --source source.mp4 --clips clips.json --output-dir clips/ [--crf 18] [--overwrite]
```

`clips.json` is a list of `{name, start, end}` or `{name, start, duration}`; times are seconds or
`SS`, `MM:SS`, `HH:MM:SS` with optional `.ms`:

```json
[
  {"name": "hook-laptop-close", "start": 0, "end": 2.6},
  {"name": "mac-mini-glow", "start": "00:03", "duration": 5}
]
```

- One `<slug>.mp4` per clip, and `manifest.json` with each clip's window, real duration and status.
- A bad spec (no end or duration, a window that ends before it starts) is skipped and listed in
  `errors`; the other clips still cut. A window that runs past the end of the source gives a
  shorter clip and a warning with both lengths.
- Re-runs skip clips that already exist unless `--overwrite`. A source with no audio gives clips
  with no audio.

## FFmpeg notes

Measured traps when joining and finishing. Each lives here once.

- **Joined generated clips drift in colour** at every cut, even from one prompt. Apply one
  harmonising grade over the whole joined video; `eq=contrast=1.05:saturation=0.95,colorbalance=bs=0.05:bm=-0.02`
  is a starting point.
- **A still PNG overlay with a fade does nothing** unless the input is looped:
  `-loop 1 -framerate 30 -t <length>` before that `-i`. The build reports no error.
- **ffmpeg 9 removed `-vsync`.** The old flag fails the whole command; use `-fps_mode`, or drop it
  (`-update 1` alone overwrites frame by frame).
- **`-ss` before `-i` can land on a keyframe** (always with stream copy). A re-encoded cut is
  exact; a measurement a decision depends on puts `-ss` after `-i` or decodes the range.
- **`crop` rounds offsets to whole pixels,** so a gentle sine move becomes a still with one-pixel
  snaps. Scale up 4x, crop, scale back. Judge motion on the median, not the p90.
- **`select` then `tile` takes consecutive frames.** Seek with `-ss` before the input, then
  `fps=N`, then `tile`.
- **A trailing comma in `filter_complex` fails the build silently** behind a captured subprocess,
  and an older render on disk then passes the checks. Strip trailing commas and read the build's
  own exit status.
- **Generated video is already sharp.** A finishing sharpen adds the artefact it means to hide;
  keep unsharp near 0.12 with no grain, and measure before assuming footage is soft.

## Inputs

- A clear user brief or source asset path.
- Brand, product, audience, platform, and approval constraints when relevant.
- Required credentials or provider access for any external service used by this skill.
- Output directory or test-run directory where artifacts should be saved.

## Workflow

1. Read the brief and confirm all required inputs are present.
2. Load any referenced files in this skill folder only when they are needed.
3. Run the provider, script, or planning workflow described by this skill.
4. Save outputs under the requested output folder or `skills/test-runs/<timestamp>/<skill-name>/` during tests.
5. Write or update a `manifest.json` for executable runs with status, provider, outputs, warnings, and errors.

## Output

- Primary artifact or written plan requested by the skill.
- `manifest.json` for executable runs.
- `verification.md` or a short verification summary that names the checks performed.
- Any generated source assets, intermediate files, or final exports in the run folder.

## Quality Checks

- Required files exist and paths in the manifest are valid.
- Output matches the requested format, platform, duration, dimensions, or text structure.
- Brand claims, captions, on-screen text, and CTAs follow the provided brand rules.
- Provider failures, skipped integrations, and human-review needs are explicit.

## Failure Modes

- Missing credentials, provider access, or source files.
- Output does not match requested dimensions, duration, structure, or brand constraints.
- Generated media contains artifacts, unreadable text, unsafe claims, or caption collisions.
- Scaffolded skills cannot run production workflows until implementation details are added.
