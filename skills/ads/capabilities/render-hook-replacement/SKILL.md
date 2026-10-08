---
name: render-hook-replacement
description: Replace an existing video's opening with a supplied clip or free kinetic text hook while retaining and verifying every original body frame, audio, captions and ending. Use for surgical hook tests rather than regenerating the complete ad.
owner: team
status: active
version: "1.0.0"
created: 2026-10-05
updated: 2026-10-05
level: atom
category: editing
variant-of: null
tags: [video, editing, hooks]
---

# Human version

Replace only the opening of a selected video. The rest comes from the original,
including its ending and burned captions. A supplied hook uses free local assembly;
short text can become a free animated card. Generated footage or voice is optional
and requires a separate estimate and approval.

The output is a complete MP4 and an edit manifest identifying the exact original,
cut, duration change and preservation checks. It stays **needs review** until the
finished video has been watched and its sound checked.

---

# Agent version

## Purpose

Perform one hard-cut opening replacement with immutable source identity and
decoded retained-body verification. There is no fixed three-second boundary,
mandatory creator, new music, body regeneration, whole-video caption pass or
automatic final selection. Read [the editing guide](references/hook-replacement.md).

## Inputs

- Python 3.10+, working `ffmpeg`/`ffprobe` with libx264 and AAC. Test the binaries
  themselves before any paid step. Supplied-clip execution uses only Python stdlib.
- Config JSON following [config.example.json](config.example.json). Paths resolve
  relative to that config, so a fetched package works outside the author's checkout.
- `source.path`: exact selected original, never a template sample. Optional
  `source.sha256` refuses changed bytes; `project_id`/`render_id` are opaque caller
  identifiers preserved in the manifest. Compute and freeze the hash at intake.
- `hook_end_sec`: positive opening boundary leaving a body. If speech crosses it,
  choose a measured word/silence boundary. No silent correction of that boundary.
- `hook.path`: supplied video, any dimensions/frame rate, normalized to the original.
  Or `hook.text`, `duration_sec`, `font_path` and optional `#RRGGBB` colors. Text needs
  Pillow (`python3 -m pip install Pillow`) and an explicitly supplied licensed font.
- Optional `words:[{start,end,word}]` measured on this source, or `word_times` JSON
  containing `source_sha256` and `words`. A cut through a measured word fails.
- Optional `captions:{path,output_path}`: original separate SRT or timed JSON cues.
  Complete retained cues shift by the measured duration delta. A cue crossing the
  cut requires measured words, so removed opening copy does not linger over the body.
- `output:{path,manifest_path?}`: a new `.mp4` path. Existing outputs and every input
  are protected from overwrite. The default manifest is `<output>.manifest.json`.

The original must be CFR, unrotated square-pixel 8-bit yuv420p with zero video
start time. Other sources fail before assembly. If normalization is necessary,
make it a separately approved source version and freeze that version; do not
quietly remaster the selected original. Audio is optional.
An original audio/container tail more than 2ms beyond the last video frame also
blocks; make a reviewed source version with a final-frame hold before editing.
The renderer never trims that narration/music tail and calls it preserved.

## Workflow

1. Watch the exact original and confirm source identity, hook boundary and selected
   replacement. Keep the original file read-only. Ask only for missing choices.
2. Probe source/hook, validate SHA256, measured words and captions before encoding.
   Before creating any new hook, run
   `python3 scripts/replace_hook.py --preflight --config /path/to/source-config.json`.
   This needs only source/cut and optional words/captions, verifies runtime encoders
   and supported source shape, and writes no media or paid job.
   Generated hooks are separate work: read the chosen generation capability, quote
   only the required new opening, obtain approval, then bind its finished clip here.
3. Run `python3 scripts/replace_hook.py --config /path/to/config.json`.
   The script normalizes only the hook geometry/fps; joins original body at normal
   speed; uses browser-compatible High-profile libx264 CRF 12; retains original body audio with AAC 256k;
   shifts separate captions; and checks source integrity before publishing files.
4. Examine the manifest. All four required preservation booleans must be true.
   Every retained decoded video frame is compared with PSNR ≥45dB and identical
   frame count/order. Audio is compared at identical
   sample positions with normalized RMS error ≤0.08 and correlation ≥0.99 (silence
   uses absolute RMS error ≤0.0001). These are encode tolerances, not a listening verdict.
5. Watch the **actual complete output**, especially the join and final frame; listen
   to the hook/body join, narration/music and ending. Check the new hook copy and
   brand facts. Fix only the opening and re-run to a new path. Keep the result
   awaiting review until the review report names this output hash and source.
   Only after actual watch/audio/caption review, record
   `review:{status:'passed',source_sha256:<original hash>,output_sha256:<finished hash>,checked_at:<ISO datetime>}`
   alongside the passing quality report. Never recycle another output's review.

## Free demonstration

From a fresh package folder:

```bash
python3 scripts/make_demo.py --out-dir demo
python3 scripts/replace_hook.py --config demo/config.json
python3 -m unittest discover -s tests -v
```

The neutral fixture replaces 2.4s with 1.5s and retains the original body/end.
`--font /path/to/licensed.ttf` adds burned captions to the fixture. Set
`HOOK_TEST_FONT=/path/to/licensed.ttf` to test the optional kinetic text route too.
The demo makes no network requests or paid calls. It is a timing fixture, not a
customer ad or catalog upload. High-quality retained-body encoding can produce large files.

For a local pack, use `python3 scripts/replace_pack.py --config pack.json` with
the same `source`, `hook_end_sec`, optional words/captions, `output_dir` and
`variants:[{label,hook:{path}}]`. The wrapper freezes one source hash and writes
one complete MP4/manifest per label plus `pack-manifest.json`. Successful siblings
remain available if one fails; retry the failed target with the single renderer.

## Output

- Complete MP4; original untouched.
- Version 1 manifest with `source.{sha256,project_id,render_id}`, `hook_end_sec`,
  `body_start_sec`, `replacement_duration_sec`, `new_body_start_sec`,
  `duration_delta_sec`, `output.{path,sha256,duration_sec}`, caption artifacts and
  `verification.{source_unchanged,body_video_preserved,body_audio_preserved,caption_timing_preserved}`.
- Separate shifted captions if supplied. Existing burned captions stay in the
  original body frames; no whole-ad reburning or redesign.
- `status`/`review.status: needs_review`. No project storage behavior is embedded
  in this generic renderer; the caller saves candidates and performs final review.

## Quality Checks

- Frozen source/hash matches the selected version; old source and hook bytes remain intact.
- No body frame is missing, duplicated, reordered, graded or cropped.
- Original body audio stays at normal speed/gain, with no crossfade or added bed.
- Original ending survives; shifted captions follow the measured duration delta.
- Subframe boundaries preserve the requested cut; the manifest discloses the first
  selected original video frame and its offset (less than one source frame).
- Invalid inputs fail clearly; no paid work occurs inside this capability.

## Failure Modes

| Problem | Action |
|---|---|
| Wrong source hash or stale word file | Refetch the selected version and remeasure; never switch versions silently. |
| Cut clips speech or a separate caption | Choose a safe boundary; supply measured words for a partial caption. |
| VFR, HDR/10-bit, rotated or nonzero-start original | Create an explicitly reviewed normalized source version first. |
| Original audio outlasts video | Make a reviewed source version with a final-frame hold, then freeze that version; never drop the audio tail. |
| Missing/corrupt media or LFS pointer | Resolve real media before rendering or generation. |
| Existing output path | Use a fresh version path; never overwrite the original. |
| Local ffmpeg has no drawtext | Text uses Pillow PNG + fade/slide overlay; drawtext is not required. |
| Retained-body verification fails | Candidate is not published; inspect the failed video/audio metric and original remains available. |
| Needed generated creator/voice unavailable | Keep supplied footage/text options; show missing provider and new estimate before a paid retry. |

## Related

[[used-by::create-hook-variant-pack]], [[references::preflight-concat]],
[[references::trim-video-clips]], [[references::retime-captions-to-words]],
[[references::watch]].
