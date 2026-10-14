---
name: video-production-harness/edit-video
description: Stitch per-scene clips into a final master MP4. Reorder, retime, layer VO + music + SFX, add transitions, and burn captions. Step 6 of the pipeline.
---

# Human version

Build a candidate from the accepted story and editable sources. Mix for the chosen audio strategy, carry timing changes through dependent elements, and check every delivered output.

---

# Agent version

## Host contract

Follow [creative contract and review](references/creative-contract-and-review.md) for current content-derived duties, complete AV coverage, clip eligibility and exact-file evidence. Read its linked sound, scale and look procedures when applicable. Preserve the two existing owner gates; no extra automatic review meeting.


Read `capabilities.md` and the selected host binding first. Artifact names are logical roles resolved by that binding. Named review tasks use the documented rubrics and actual frame/audio tools; they are not assumed installed commands. Required tooling, human approval and available budget must exist before the operation. Read [the editorial review guide](references/editorial-review.md) for source binding, stage decisions, note disposition, impact checks and saved edit history.

## Purpose

Take the per-scene clips and audio assets produced by `create-clips` (and refined by `edit-clip`) and produce the **labeled candidate master**: ordered, timed and mixed for review/polish; final captions and delivery follow State 10.

Uses these skills and FFmpeg recipes:
- `stitch-videos-ffmpeg` — concat and transitions
- Voice to picture: delay each line to its scene start with `adelay=<ms>|<ms>`, then `amix=inputs=N:normalize=0`
- Sound effects: layer each cue the same way, with `adelay` and `volume`
- Clean a noisy take: `afftdn=nf=-25,highpass=f=80`
- Music: `create-music-elevenlabs` (superseded; agent-built path only) or an approved licensed track
- Captions: `caption-burn` (superseded; agent-built path; the kit path uses captions-layer), burned last in State 10
- End card regen: `goose-graphics` for the card still, `stitch-videos-ffmpeg` to hold it
- Export: MP4, H.264 + AAC, `-movflags +faststart`, 1080×1920 for 9:16

## Inputs

- `<video_folder>/clips/scene-{01..NN}.mp4` (required)
- `<video_folder>/audio/vo-scene-{01..NN}.mp3` (required if VO is wanted)
- `<video_folder>/design_brief` (timing, music plan, captions)
- `<video_folder>/implementation_brief` (SRT script, SFX shot list)
- Optional overrides via args:
  - `<order>` — custom scene order if not 1..NN
  - `<speed_overrides>` — `{"03": 1.25, "07": 0.85}` to retime specific clips
  - `<transitions>` — `cut` (default), `crossfade-3f`, `whip-pan`, `flash`
  - `<music_track>` — path, or a brief for `create-music-elevenlabs`

## Speech and soundtrack branches

Read [speech and route qualification](references/speech-and-route-qualification.md)
before selecting streams. Use the supported assembly_timeline with exact source
intervals and current creative_contract_revision, rather than unrelated stitching scripts.

| Resolved speech | Picture/audio treatment |
|---|---|
| native_dialogue | Keep checked native picture/audio clocks and rates; speech continues under cutaways |
| audio_driven_lipsync | Preserve exact accepted driver and synchronized picture; changed driver needs renewed sync |
| narration | Measure accepted speech, then fit relevant non-speaking coverage to words/actions |
| singing | Preserve lyric/musical timing; only planned narration windows need speech ducking |
| mixed | Resolve mode/driver and cues for every timed speaker interval |
| none | No invented voice; retain independently planned ambience/music/SFX or intentional silence |

An explicitly present empty soundtrack_modes means no additional soundtrack.
intentional_silence requires none for that resolved interval and a saved reason.
Legacy silent is not permission to mux empty audio or discard existing sound.
Music/SFX retain actual source, cue interval, gain and explicit loop/pause intent.
Only accepted clips enter passing assembly; custom effects retain the same contract.

## Narration mix and measured final gate

Start from the approved audio strategy and measured stems. A narration-led ad can use gain automation, a quieter bed or sidechain ducking; voice-only, intended silence, song-led and native dialogue need their own treatment. Do not apply one mandatory gain multiplier or compressor preset to every format.

1. Measure speech, bed and SFX in the actual dialogue windows. Set speech for intelligibility and preserve the approved performance dynamics; choose any loudness target from the actual delivery plan.
2. Reduce/move the competing cue before excessive voice boosting. Where sidechain helps, split the actual VO bus into listen and detector branches and tune threshold, attack/release and ratio against the material. Record the chosen values; ratio 20 is an FFmpeg limit, not a target.
3. Mix planned stems with explicit gain and normalization behavior. Do not duplicate native dialogue under a separate voice track. Check scene boundaries and intended room tone/silence.
4. Measure the finished mix and hear every speech/music/effect interval and ending. Metrics/word scores do not approve natural performance, phonemes, joins or music quality.

For long filter graphs use a saved FFmpeg filter script, preserve it with the editable sources and probe its actual output. Do not multiply an already normalized VO by 3× and its bus by 2× as an inherited rule: downstream gain can undo normalization and clip the mix.

**Timeline rule:** planned audio cues must match the approved timeline. Prevent accidental truncation or an unintended empty tail; preserve deliberate silence, a clean loop or a voiced CTA after the bed ends. Never extend the story merely to make music and picture durations equal.

## Multi-clip AI concat color drift

A concat of AI-generated clips can have visible grade jumps at boundaries — even when every clip was generated with the same "cool fluorescent" or "warm dusk" prompt. The models don't enforce a consistent LUT across generations; each clip interprets the grade subjectively.

Inspect neighboring shots and apply a **harmonization pass** only where the approved look requires correction before the final mux. The pass isn't a specific look — it's whatever single grade you want all clips to share. Starting point that works for most projects:

```
eq=contrast=1.05:saturation=0.95, colorbalance=bs=0.05:bm=-0.02
```

Tune the values based on the concept:
- **Warmer / golden-hour** → reduce `bs` (blue shadows) toward 0 or negative, add `rs=0.05` (red shadows)
- **Cooler / urban-night** → push `bs` toward 0.08, set `bm=-0.03` (less blue in midtones for a teal cast)
- **Higher contrast / commercial** → `contrast=1.10` + `saturation=1.05`
- **Muted / documentary** → `contrast=1.02` + `saturation=0.85`

The values are dial-able. Consistent intentional treatment is the goal; matching shots require no extra grade. See available model behavior guidance for why this drift happens.

## Music-drop alignment

When the audio has a structural climax (chorus drop, kick on a downbeat, gospel hit) and the video has a visual climax (rooftop reveal, end-card landing, reveal beat), align them by offsetting the audio start rather than playing the music from t=0:

```
audio_offset_seconds = song_drop_t - video_climax_t
```

Where `song_drop_t` is the time in the source song where the drop lands (find with `librosa.beat.beat_track` + RMS local-max detection if not already known) and `video_climax_t` is the time in the final video where the climax frame sits. Then:

```bash
ffmpeg -ss <audio_offset_seconds> -t <video_duration> -i song.mp3 audio/music-master.mp3
```

## Workflow

### Phase 1 — Reorder + retime + interleave transitions

Resolve the source cut and its editable timeline from the original note/version. Record the intended effect, candidate path and impact on timings, captions, music/SFX, approvals and derivatives using [the editorial review guide](references/editorial-review.md). Preserve unrelated sources and current accepted bytes.

1. Build a list of input clips in target order. **If `<video_folder>/transition_pairs.json` exists**, interleave transition clips at the right boundaries:
   - For each `ai_interpolation` pair, find the matching `transition-<from>-<to>.mp4` in `clips/` (or `…-push-in.mp4` + `…-pull-out.mp4` for split-clip pairs). Insert between scene N and scene N+1.
   - For each `in_edit_*` pair, record the FFmpeg filter spec for use in transition step 4 below; no clip insertion needed.
   - For each `hard_cut` pair (or any boundary with no pair entry), default to plain concat (no transition).
2. Resolve speech_mode and source-linked timeline before speed/stream changes. Non-speaking picture may be retimed as planned; visible speech transforms matched picture and driver together only for an intentional accepted edit. Preserve native dialogue and source clocks; never strip it merely because a VO stage follows.
3. Measure accepted speech first and plan appropriate coverage. Do not stretch entire voice files into estimated scene lengths. Changed exact driver requires renewed synchronization; preserve raw performance and recheck listened words/mouth/captions after any intentional paired transformation.
4. Apply transitions:
   - `cut` (default for boundaries with no pair entry): plain concat.
   - `ai_interpolation` (from `transition_pairs.json`): clip already inserted in step 1; plain concat between scene and transition clip.
   - `in_edit_xfade` / `crossfade-3f`: `xfade=transition=fade:duration=0.1:offset=<t>` between clips. ⚠ Not for music-video formats cut to the beat.
   - `in_edit_whip_pan`: `xfade=transition=slideleft` (or right/up/down). Preserves panel structure — safe for split-screen → split-screen.
   - `in_edit_flash`: `xfade=transition=fadewhite` or insert 1–2 white frames between clips.

### Phase 2 — Concat video track
1. **Pre-stitch source/speech check (all speaking routes).** Use the shared assembly_timeline and actual source hashes/bounds/rates. Native-speaking picture and its preserved audio share source positions; audio-driven picture retains its exact driver; cutaways may differ while the same speech continues. Compare actual word boundaries/joins. Missing provenance/timings remains incomplete; a podcast-specific manifest cannot be the only protection.
2. Use `python3 scripts/assemble.py PLAN.json OUTPUT.mp4` for a conventional supported clip sequence; use a real FFmpeg filter script for transitions/custom timing beyond that helper. Concat the approved clips into `edits/master-video-only.mp4`. Standardize to the approved ratio/dimensions (normally 1080×1920), 30 fps, yuv420p, libx264 and the approved quality target (CRF 18 is a starting point).
3. Verify total duration is within the design-brief target ± 1s.
4. Probe music duration (from Phase 3 plan if known) and **resolve duration against the approved timeline** — trim or loop/pad the music, or extend a permitted final video hold with tpad/loop if the brief allows it. apad extends audio, not video. Do not silently change scene/story timing to fit an arbitrary music length. Save the target `TOTAL` for the mix chain.
5. **Speedup pass (podcast-clip / repurposed-long-form projects only).** Apply only the explicitly approved speed to picture with FFmpeg setpts=PTS/RATE and to retained speech with atempo=RATE (use exactly the recorded RATE). Verify duration and word/caption timestamps after the change. Speed is fixed only when explicitly approved at script lock; otherwise retain native timing. Preserve raw speech and listen to raw versus edited output, then recheck sync. Do not add speed-up because of format alone. Skip entirely for original-VO or music-video projects.

### Phase 3 — Music bed
1. Use the owned/licensed approved music track. Otherwise resolve a real available catalog/search or music-generation capability through the binding using the design-brief query and current price/approval. Missing music access blocks that planned route or requires an approved revised audio plan.
2. Trim/loop the bed to its planned cue windows. Fade, sustain or stop according to the audio plan; pad only to prevent unintended truncation. A deliberate silent ending is valid.
3. Measure the actual stems and choose bed gain against speech and the intended dynamics. Honor cue switches, silence drops and end-card swells; measure the final mix instead of treating a fixed gain as proof.

### Phase 4 — Layer VO
1. Read VO text from `locked_script` (single source of truth from State 2.5). Confirm `audio/vo-scene-NN.mp3` files match.
2. Read the approved delivery/climax intent. Preserve take dynamics; use only a measured, justified gain adjustment if emphasis needs support.
3. Match scene levels where needed and save actual filters/settings. Measure again after bus mixing because later gain changes invalidate per-clip peak/loudness evidence.
4. Keep narration intelligible against every concurrent sound; use Phase 5 when the plan includes those stems.
5. Use actual word timings and FFmpeg adelay/atrim to align VO with cartoon mouth-flaps where the approved plan permits. For true lipsync, use a supported approved lipsync capability; audio shifting cannot synthesize missing mouth motion.

### Phase 5 — Sidechain + SFX layer
1. Where music masks narration, choose a quieter cue, timed gain automation or tuned sidechain compression. Verify supported filter ranges (FFmpeg sidechain ratio maximum is 20) and check the levels for pumping. Sidechain is optional; intelligible intentional sound is required.
2. Use actual owned/licensed SFX or an approved supported SFX generator, then place the implementation-brief shot list with FFmpeg adelay/volume/amix. Save the exact cue times and sources.
3. Place SFX on individual hits: anvil thuds, magic poofs, scale slams, etc.
4. **Hard rule:** honor the actual brief's SFX exclusions; a no-screens/foley-only constraint applies only when approved in this project.
5. Set each SFX level for its planned role without masking speech. Use auditioned real/approved effects; a synthetic tone is valid only as an intentional effect, never emergency replacement for music. No universal gain offset applies.

### Phase 6 — End card
1. If the end-card clip from `create-clips` is acceptable, leave it.
2. Otherwise rebuild the approved end-card with actual deterministic logo/text composition and a supported installed renderer. Preserve the old clip, obtain renewed approval for changed ingredients/paid media, and save a new last-scene candidate.

### Phase 7 — Caption plan, not final burn

1. Author approved on-screen caption copy and cues from locked_script/locked_lyrics and the brief. Do not silently replace intentionally compressed copy with automatic transcript text.
2. Validate spelling, word/beat timing, safe areas, text-heavy scene suppression and end-card overlap. Preserve actual transcript timestamps as evidence.
3. Keep the caption plan editable during review/polish. Burn captions only after picture and mix polish in State 10. After the final burn, extract frames at each cue start+0.3s and run full watch/audio QC; never trust a render status alone.

### Phase 8 — Export + variants
1. Encode the actual master with FFmpeg at the approved platform ratio, bitrate and codec. Probe it and save checksum/provenance; a descriptive export label is not a command.
2. At delivery, use a real supported export/FFmpeg reframe route to emit Reels (9:16), TikTok (9:16), YouTube Shorts (9:16), and a 1:1 Meta feed cutdown if needed.
3. Treat each variant as an edit: reframe/re-time from clean editable picture/audio sources, adapt captions for its own dimensions/language, then burn once. Register its ratio/duration/provenance and independent full-watch/QC evidence. Cropping an already captioned master can cut text and never inherits parent approval.

## Output

- `<video_folder>/edits/master-no-captions.mp4`
- `<video_folder>/edits/master-final.mp4`
- `<video_folder>/captions/captions.srt`
- `<video_folder>/meta-upload/<platform>-master.mp4` (multiple)

## Quality Checks

- Actual cue durations match the approved sound plan, including intended silence/loops. No accidental speech truncation or unplanned empty tail.
- Final mix levels/peaks are measured after all gain changes. Speech sits clearly above music in every dialogue window; no pumping or discontinuity.
- Delivery intent is preserved without a mandatory boost, bed or ducking preset.
- Every approved SFX restriction is honored.
- Caption text matches `locked_script` and design-brief burned-in text (not auto-transcribed from VO).
- Caption planning is complete; actual rendering/frame verification is required after State 10 burn.
- Any intended whisper/quiet line remains intelligible in its actual mix and follows the approved caption plan.
- End card matches current brand visual rules.
- Hook lands in the first 2 seconds (test by watching first 2s muted).
- Each required ratio, cutdown or language is planned as an edit and checked on its own actual final bytes. Inspect crop, product visibility, text collisions/read time, proof, CTA and full ending at destination size.
- Rewatch every changed output; bind its QC evidence to its checksum and mark original notes verified only when their intended effect passes. Audio/voice/shot/timing changes refresh all affected downstream checks.

## Failure Modes

- atempo'd VO sounds cartoonish — re-render at native speed instead.
- Music masks speech — diagnose actual competing windows, change the cue/gain or tune sidechain, then re-measure the mixed result.
- Caption text is auto-generated and contradicts the burned on-screen text from the design-brief.
- Final master drifts from the design-brief timing because retimes weren't logged.
- Forgetting to bake captions and exporting the no-captions master to delivery.
- An unintended abrupt music tail needs repair; an approved silent/loop ending must be preserved. Do not impose padding or a black fade on every format.
- Captions "rendered" per sub-agent but frame extraction shows nothing — the `fade=alpha=1` PNG bug. Use `overlay=enable='between(...)'`.
- Sidechain ratio set to 30 — FFmpeg returns "Result too large". Cap is 20.

## Use stored original footage

When the customer asks to reuse footage, ask the host to search the current owned media and inspect actual frames plus timed transcript. An analysis description or thumbnail URL alone is not a visual review. Known user-selected trims remain usable when optional semantic analysis is unavailable; record that limitation instead of requesting a duplicate upload.

Freeze `{asset_id, analysis_revision, scene_id, start_ms, end_ms, audio_mode}` in each selected scene and ingredient. `analysis_revision` is the verified SHA-256 of original bytes, `scene_id` may be null for a known trim, bounds are integer milliseconds, and audio is `original` or `muted`. Attach the canonical original through the host, preserve the requested format and user locks, then obtain the usual script and ingredient approvals. Research links and competitor ads never grant production rights.

Before consumption and publication, the host rechecks current ownership, product/project scope, permission and revision. Download the verified original, trim that exact window at normal speed, and preserve the chosen audio. The portable assembler accepts `source_excerpt` beside a clip's path/duration, validates its SHA and range and returns the lineage. It refuses a separate voice track that would replace approved original audio. Only newly generated or replaced ingredients may consume the approved generation budget.
