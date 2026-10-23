# Pipeline — narrated-ugc-wardrobe-stitch

How `config.example.json` maps to the real production steps. This capability is the FREE assembly.
The worked example (Bioma "Do NOT buy Bioma Probiotics") was built in a private run whose
per-project driver scripts are not shipped. Run the paid steps with the capabilities named below,
and the free steps (EDL, assembly, captions, mix) with the shared `montage.py` helper from
`stitch-videos-ffmpeg`, which installs with this package (see `README.md` §0). Or drive the whole
run via `video-orchestrator-with-control-plane`.

**Creative values are choices, not defaults.** The creator (`character.descriptor`), voice
(`vo.voice_id`), hook angle (`vo.hook_line` / `vo.script_md` / `vo.payoff_line`), the 3 worlds
(`worlds.briefs`) and the music bed (`audio_mix.music_brief`) come from the recipe's `choices`. The
Bioma values in `config.example.json` (blonde woman creator, "Do not buy" reversal, bedroom / kitchen
/ bathroom) are one worked example.

The seven steps run **in order** because each depends on the last: the VO sets the timeline (via
its Whisper word boundaries), the word boundaries build the EDL, the EDL drives the cut count, the
locked creator + worlds drive the wardrobe edits, the wardrobes + worlds seed the per-cut
start-frames, the start-frames seed the i2v clips, and assembly stitches all of it with the VO,
captions, and end card.

## Field → source-script map

| Config field | Phase | Step (tool) | Paid? |
|---|---|---|---|
| `vo.script_md`, `vo.voice_id`, `vo.settings`, `vo.model` | 1 VO | ElevenLabs v3 render of the locked testimonial | **PAID** |
| `vo.outputs.word_timings` | 1 VO | Whisper word-align (`transcribe-audio-fal`) → `audio/vo-final.words.json` | ~$0.10 (Whisper) |
| `edl.*`, `edl.timeline[].t_in/t_out/role/source` | 2 EDL | `montage.py edl`: each cut's `word_range` snaps to the VO word boundaries → `edl.json` (~30 cuts) | free |
| `character.descriptor`, `character.anchor`, `worlds[]` | 3 Creator/Worlds | `create-image-gpt-image-fal` gpt-image-2 anchor + `create-image-fal` 3 world wides | **PAID** |
| `character.wardrobes` | 3 Creator | `create-image-gpt-image-fal` → 5 wardrobe edits chained off the anchor | **PAID** |
| `edl.timeline[].source` start-frames, `keyframe_engine` | 4 Start-frames | `create-image-gpt-image-fal` (creator) + `create-image-fal` (product composites) | **PAID** |
| `landing_page.render_png`, `landing_page.method` | 4 Start-frames | Playwright render of the real page → `assets/overlays/landing-page.png` | free (no gen atom) |
| `clip_engine` | 5 Clips | `create-video-fal` Veo 3.1 i2v @1080p → `clips/scene-NN.mp4` | **PAID** |
| `captions` | 6 Captions | `montage.py` word-by-word captions from `vo-final.words.json` with `respell` (the demo used the VEED Whisper preset) | free (VEED burn is paid) |
| `landing_page` scroll cuts | 6 Assembly | `montage.py` still + `pan` (FFmpeg zoompan) over `landing-page.png` (NOT i2v) | free |
| `audio_mix`, `end_card`, `edl.timeline[].t_in/t_out` | 6 Assembly | `montage.py run` (trim + `filter_complex concat`, caption burn, VO+music mix, end-card append) → `edits/master-final.mp4` | free |

## 1. VO → ElevenLabs v3 + Whisper word-align  (config: `vo`)  [PAID]

**Lock the VO FIRST — it sets the timeline.** Render the verbatim ~13-sentence testimonial with
ElevenLabs v3 (`vo.voice_id` + `vo.settings`), atempo-clamp to the target pace (~1.24× → ~30–32s),
then Whisper word-align → `audio/vo-final.mp3` + `audio/vo-final.words.json`. The word boundaries
set the cut grid. Keep the testimonial verbatim (Bioma demo: "I'ma" kept; "synbiotic" locked over
Whisper's "symbiotic").

## 2. EDL → `montage.py edl`  (config: `edl`)  [FREE]

From the VO word boundaries, build ~30 role-tagged cuts (`hook`, `feature`, `reaction-insert`,
`payoff-hold`, `b-roll-insert`, `landing-page`). Each cut is a `montage.json` clip with a
`word_range`; `montage.py edl` snaps the windows to the word boundaries and writes `edl.json`. The
payoff line gets a HELD `payoff-hold` beat. Each cut binds its start-frame `source` + `image_refs`.

## 3. Creator + worlds → gpt-image-2 anchor + wardrobes + world wides  (config: `character`, `worlds`)  [PAID]

`create-image-gpt-image-fal` fires the gpt-image-2 anchor with the verbatim `character.descriptor`;
`create-image-fal` makes 3 world wides (no creator). Then 5 wardrobe edits are chained off the anchor
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

## 6. Captions + end card + assembly → `montage.py run`  (config: `captions`, `audio_mix`, `end_card`)

- Captions — on every word, throughout, from `vo-final.words.json`: `montage.py` `captions.words`
  with `per: 1` shows one word at a time in one colour (bold yellow `#FFE800` in the demo) with an
  outline. It does not highlight the active word the way VEED's karaoke-pop preset does. Re-spell brand tokens Whisper mishears against the
  locked script with `captions.respell`; captions end with the last word, so none sit over the end
  card. The helper draws them with Pillow, or with libass when Pillow is missing, so the host
  ffmpeg needs no libass.
- Assembly (`montage.py run`) — trim each clip to its EDL window, build the landing-page scroll
  cuts as stills with `pan` (FFmpeg zoompan) over `landing-page.png`, **`filter_complex concat`**
  all ~30 trimmed cuts (NOT the demuxer — it drops audio on a duration mismatch), burn the
  captions, mix the VO with an optional sidechain-ducked instrumental bed (20:1, `audio.music_start`
  14.21 in the demo) so the VO stays on top, append the brand's real end-card PNG (~2s) as the last
  still, master to -14 LUFS → `edits/master-final.mp4` (1080×1920, 30fps, h264+aac; as long as the VO
  plus the end card, 36.8 s in the demo).

Re-cuts (new caption timing, re-timed windows, an end-card swap) reuse the existing
VO/start-frames/clips and cost **$0** — only steps 1, 3, 4, 5 spend.
