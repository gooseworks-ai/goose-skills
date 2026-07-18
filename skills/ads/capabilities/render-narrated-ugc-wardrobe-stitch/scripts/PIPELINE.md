# Pipeline — narrated-ugc-wardrobe-stitch

How `config.example.json` maps to the real production steps. This capability is the FREE assembly;
the worked example (Bioma "Do NOT buy Bioma Probiotics") was produced by the video-orchestrator's
per-state steps plus per-project drivers that live in
`clients/bioma/ad-runs/run-12-narrated-do-not-buy-recreation/working/` (`render_and_align_vo.sh`,
`build_edl.py`, `gen_anchors_and_worlds.sh`, `gen_wardrobe_variants.sh`, `gen_startframes_*.sh`,
`gen_veo_*.sh`, `stitch_full_master.sh`). Reference those directly, or drive the whole run via
`video-orchestrator-with-control-plane`.

The seven steps run **in order** because each depends on the last: the VO sets the timeline (via
its Whisper word boundaries), the word boundaries build the EDL, the EDL drives the cut count, the
locked creator + worlds drive the wardrobe edits, the wardrobes + worlds seed the per-cut
start-frames, the start-frames seed the i2v clips, and assembly stitches all of it with the VO,
captions, and end card.

## Field → source-script map

| Config field | Phase | Source step / script (in the run) | Paid? |
|---|---|---|---|
| `vo.script_md`, `vo.voice_id`, `vo.settings`, `vo.model` | 1 VO | ElevenLabs v3 render of the locked testimonial | **PAID** |
| `vo.outputs.word_timings` | 1 VO | Whisper word-align (`transcribe-audio-fal`) → `audio/vo-final.words.json` | ~$0.10 (Whisper) |
| `edl.*`, `edl.timeline[].t_in/t_out/role/source` | 2 EDL | `working/build_edl.py` from the VO word boundaries → `edl.json` (~30 cuts) | free |
| `character.descriptor`, `character.anchor`, `worlds[]` | 3 Creator/Worlds | `working/gen_anchors_and_worlds.sh` → gpt-image-2 anchor + 3 world wides | **PAID** |
| `character.wardrobes` | 3 Creator | `working/gen_wardrobe_variants.sh` → 5 wardrobe edits chained off the anchor | **PAID** |
| `edl.timeline[].source` start-frames, `keyframe_engine` | 4 Start-frames | `working/gen_startframes_*.sh` → gpt-image-2 (creator) + product composites | **PAID** |
| `landing_page.render_png`, `landing_page.method` | 4 Start-frames | Playwright render of the real page → `assets/overlays/landing-page.png` | free (no gen atom) |
| `clip_engine` | 5 Clips | `working/gen_veo_*.sh` → Veo 3.1 i2v @1080p → `clips/scene-NN.mp4` | **PAID** |
| `captions` | 6 Captions | karaoke-pop from `vo-final.words.json` (VEED Whisper preset), re-spelled against the locked script | free (paid VEED burn) |
| `landing_page` scroll cuts | 6 Assembly | `working/stitch_full_master.sh` FFmpeg zoompan over `landing-page.png` (NOT i2v) | free |
| `audio_mix`, `end_card`, `edl.timeline[].t_in/t_out` | 6 Assembly | `working/stitch_full_master.sh` (trim + `filter_complex concat`, VO+music mix, caption burn, end-card append) → `edits/master-final-v4.mp4` | free |

## 1. VO → ElevenLabs v3 + Whisper word-align  (config: `vo`)  [PAID]

**Lock the VO FIRST — it sets the timeline.** Render the verbatim ~13-sentence testimonial with
ElevenLabs v3 (`vo.voice_id` + `vo.settings`), atempo-clamp to the target pace (~1.24× → ~30–32s),
then Whisper word-align → `audio/vo-final.mp3` + `audio/vo-final.words.json`. The word boundaries
set the cut grid. Keep the testimonial verbatim ("I'ma" kept; "synbiotic" locked over Whisper's
"symbiotic").

## 2. EDL → `working/build_edl.py`  (config: `edl`)  [FREE]

From the VO word boundaries, build ~30 role-tagged cuts → `edl.json` (`hook`, `feature`,
`reaction-insert`, `payoff-hold`, `b-roll-insert`, `landing-page`). The payoff line gets a HELD
`payoff-hold` beat. Each cut binds its start-frame `source` + `image_refs`.

## 3. Creator + worlds → gpt-image-2 anchor + wardrobes + world wides  (config: `character`, `worlds`)  [PAID]

`gen_anchors_and_worlds.sh` fires the gpt-image-2 anchor with the verbatim `character.descriptor` +
3 world wides (no creator). `gen_wardrobe_variants.sh` chains 5 wardrobe edits off the anchor
(`--anchor` on every call so identity locks). Re-roll off the CLEAN anchor on any drift.

## 4. Per-cut start-frames → gpt-image-2 + product composites + Playwright  (config: `edl.timeline[].source`, `keyframe_engine`, `landing_page`)  [PAID]

Per cut, one start-frame. Creator cuts = gpt-image-2/edit off the matching wardrobe + world wide.
Product B-roll = capsule/unboxing composites grounded on the real `product.hero_png`. Landing-page
cuts = a Playwright render → `assets/overlays/landing-page.png` (the scroll is FFmpeg zoompan in
assembly — NOT i2v). Review before step 5.

## 5. Clips → Veo 3.1 i2v  (config: `clip_engine`)  [PAID]

Per start-frame, prompt = `clip_engine.motion_opener` + the cut's action; Veo 3.1 via FAL i2v, ~4s,
9:16, 1080p, off the clean start-frame → `clips/scene-NN.mp4`. **Lead with the VERB, not the
camera** — camera-led openers read static; use STABLE-POSE start-frames + put the action in the
prompt (mid-action keyframes freeze). The landing-page-scroll cuts are FFmpeg zoompan, NOT i2v.

## 6. Captions + end card + assembly → `working/stitch_full_master.sh`  (config: `captions`, `audio_mix`, `end_card`)

- Captions — karaoke-pop from `vo-final.words.json` (VEED Whisper preset, bold yellow), on every
  word, throughout. Re-spell brand tokens Whisper mishears against the locked script; suppress over
  the end card. If the host ffmpeg lacks libass, render the cues as timed PIL PNG overlays composited
  with ffmpeg `overlay=…:enable='between(t,st,en)'` — same placement, no libass dependency.
- Assembly (`stitch_full_master.sh`) — trim each clip to its EDL window, build the landing-page
  scroll cuts via FFmpeg zoompan over `landing-page.png`, **`filter_complex concat`** all ~30
  trimmed cuts (NOT the demuxer — it drops audio on a duration mismatch), mix the VO with an
  optional sidechain-ducked instrumental bed (−20dB, 20:1, `music_drop_s` 14.21) so the VO stays on
  top, burn the caption ASS, append the brand's real end-card PNG (~2s), `loudnorm I=-14` →
  `edits/master-final.mp4` (1080×1920, 30fps, h264+aac, ~36.8s).

Re-cuts (new caption timing, re-timed windows, an end-card swap) reuse the existing
VO/start-frames/clips and cost **$0** — only steps 1, 3, 4, 5 spend.
