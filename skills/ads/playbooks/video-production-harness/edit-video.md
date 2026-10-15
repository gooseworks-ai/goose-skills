---
name: video-production-harness/edit-video
description: Assemble the accepted per-scene clips into a labeled candidate master on a source-linked assembly_timeline. Order, mix speech + music + SFX, plan captions and export. Step 6 of the pipeline.
---

# Human version

Build a candidate from the accepted story and editable sources. Mix for the chosen sound plan, carry timing changes through everything that depends on them, and check every delivered output.

---

# Agent version

Follow the [orchestrator](orchestrator.md)'s host contract and [creative contract and review](references/creative-contract-and-review.md). Read [the editorial review guide](references/editorial-review.md) for source binding, note disposition, impact checks and saved edit history. Use [Creator Grammar](references/creator-grammar.md) for cuts, sound dynamics and captions.

Output: the **labeled candidate master** for review and polish; final captions and delivery follow State 10.

## The one assembly route

A custom video is assembled **only** with `python3 scripts/assemble.py PLAN.json OUTPUT.mp4`, where `PLAN.json` holds the format settings and an `assembly_timeline` ([recipe format](references/recipe-format.md)). There is no second stitcher and no hand-built concat for a custom video.

- **Every segment** names its exact source asset, sha256, in/out, `depicts_speech`, `native_audio` and the speech driver.
- **Every sound** is an `audio_cues` entry with its role (speech, music, sfx, source ambience), interval, gain and any loop intent.
- **Speech sits at its measured word times.** Lines follow each other with planned pauses only (≤1.5 s each, ≤10% of the duration in total). Never park a line at its scene's start and leave dead air until the next one.
- **Clips play at native speed.** Speech is never retimed. A planned slow-motion or speed ramp on a non-speaking shot is the only exception: it is in the approved storyboard and its segment carries an `intent`.
- **No frame holds** except a declared end-card freeze: a `visual_overrides` freeze of up to 3.0 s that ends the video (1.5 s anywhere else).
- **Cuts are hard cuts.** A specialty transition is a rare, declared `visual_overrides` transition (Creator Grammar). No crossfades between AI stills: they expose drift. None on music cut to the beat.

The checker in `scripts/assembly_timeline.py` refuses what breaks these rules. Fix the timeline; never route around it.

## Inputs

- Accepted clips (`<video_folder>/clips/scene-NN.mp4`) and their review records.
- Accepted speech (`<video_folder>/audio/vo-scene-NN.mp3`) when the plan has speech. `locked_script` is the only VO text.
- `design_brief` (timing, sound plan, captions) and `implementation_brief` (script, SFX shot list, climax marker).
- Optional: `<order>` (a custom scene order) and `<music_track>` (an approved owned/licensed track, or a brief for music generation).

Music comes from an approved owned/licensed track or `create-music-elevenlabs` (superseded; agent-built path only; the routed music part uses `music_v2_5`). Captions use `caption-burn` (superseded; agent-built path; the kit path uses captions-layer), burned last in State 10. End-card stills come from deterministic logo and text composition.

## Speech and soundtrack branches

Read [speech and route qualification](references/speech-and-route-qualification.md) before choosing streams. Bind the timeline to the current creative_contract_revision.

| Resolved speech | Picture and audio treatment |
|---|---|
| native_dialogue | Keep the checked native picture and audio on one clock; speech continues under cutaways. Never mute or replace it. |
| audio_driven_lipsync | Keep the exact accepted driver and its synced picture. A changed driver needs a new sync. |
| narration | Measure the accepted speech, then fit non-speaking coverage to its words and actions. |
| singing | Keep lyric and musical timing; duck only planned narration windows. |
| mixed | Resolve the mode, driver and cues for every timed speaker interval. |
| none | No invented voice. Keep the planned ambience, music and SFX. |

- **Silence only by choice.** The silent branch (`intentional_silence`) needs the owner's request or a silent reference, with a saved reason. Otherwise match the reference's sound. Never a sine tone, a drone or an empty track in place of music.
- An explicitly empty `soundtrack_modes` means no extra soundtrack; it never permits dropping existing sound. Legacy `silent` never permits muxing empty audio.
- Only accepted clips enter a passing assembly.

## Mix and the measured final gate

Start from the approved sound plan and measured stems. A narration ad may use gain automation, a quieter bed or sidechain ducking; voice-only, song-led and native-dialogue work need their own treatment. No gain multiplier or compressor preset is mandatory.

1. Measure speech, bed and SFX in the real dialogue windows. Set speech for clarity and keep the approved performance dynamics. Choose a loudness target from the delivery plan.
2. Lower or move the competing cue before boosting the voice. Where sidechain helps, split the VO bus into listen and detector branches and tune threshold, attack, release and ratio to the material. FFmpeg's sidechain ratio maximum is 20: a limit, not a target.
3. Never duplicate native dialogue under a separate voice track. Check scene boundaries and planned room tone.
4. **On the finished mix:** measure loudness, true peak and clipping, then run `scripts/qc_evidence.py` with every input `capabilities.md` lists (timeline, script, reference, words, reference words, reference shots, plan). **It must exit 0.** Check the speech-to-music gap in every dialogue window and the tail. **Listen when your tools allow**; otherwise record the review as `measured`. Numbers never approve natural performance, joins or music quality.

Save any long FFmpeg filter script with the editable sources. Never multiply a normalized VO by fixed factors; it can clip.

Prevent accidental truncation and unplanned empty tails; keep a deliberate silent ending, a clean loop or a voiced CTA after the bed ends. Never stretch the story to make music and picture lengths equal.

## Colour drift between AI clips

Separately generated clips can jump in grade at the cut, even with the same light prompt. Compare neighbouring shots and harmonize only where the approved look needs it, before the final mux. A starting point:

```
eq=contrast=1.05:saturation=0.95, colorbalance=bs=0.05:bm=-0.02
```

Matching shots need no grade. Never add a cinematic grade to realistic phone footage.

## Workflow

### Phase 1 — Order and plan

1. Resolve the source cut and its editable timeline from the original note and version. Record the intended effect and its impact on timing, captions, sound, approvals and derivatives. Keep unrelated sources and accepted bytes.
2. Resolve `speech_mode` before any stream change. Measure accepted speech first and plan coverage around it. Never stretch a voice file to an estimated scene length.

### Phase 2 — Assemble the picture

1. **Source and speech check.** Use real source hashes, bounds and rates. Native-speaking picture and its audio share source positions; cutaways may differ while the same speech continues. Compare real word boundaries at every join. Missing provenance or timings leaves the step incomplete.
2. Run `scripts/assemble.py` on the plan. Output the approved ratio (normally 1080×1920), 30 fps, yuv420p, libx264, CRF 18 as a starting point.
3. Check the duration is within the design-brief target ±1 s, and within ±25% of the reference unless `changes_from_reference` lists `length`.

### Phase 3 — Music bed

1. Use the approved owned/licensed track, or a real music capability through the binding at the current price and approval. Missing music access blocks that route or needs an approved revised sound plan.
2. Place the bed as cues in its planned windows; trim, loop with a stated intent, fade, sustain or stop as the sound plan says, never retiming scenes to fit it. Honour cue switches, silence drops and end-card swells.

### Phase 4 — Speech

1. Confirm every speech file matches `locked_script`. Keep the take's dynamics; change gain only when measurement justifies it.
2. Save the real level settings, and measure again after bus mixing: later gain invalidates earlier evidence.
3. True lip-sync uses the approved lip-sync route; shifting audio cannot create missing mouth motion.

### Phase 5 — Ducking and SFX

1. Where music masks speech, use the mix steps above and check for pumping. Sidechain is optional; clear, intended sound is required.
2. Use owned/licensed SFX or an approved SFX generator. Add each hit from the implementation-brief shot list as an `sfx` cue with its exact time, source and gain. Honour the brief's SFX exclusions.
3. A synthetic tone is valid only as an intended effect, never as a music stand-in.

### Phase 6 — End card

1. Keep the end-card clip from `create-clips` if it is acceptable.
2. Otherwise rebuild it with deterministic logo and text composition. Keep the old clip, get renewed approval for changed ingredients or paid media, and save a new last-scene candidate. Hold it only with the declared end-card freeze.

### Phase 7 — Caption plan (not the final burn)

1. Write caption copy and cues from `locked_script` (or locked lyrics) and the brief, following Creator Grammar. Never swap intended copy for automatic transcript text.
2. Check spelling, word and beat timing, safe areas, text-heavy scenes and end-card overlap. Keep real transcript timestamps as evidence.
3. Keep the plan editable through review and polish. Burn captions only in State 10, then check frames at each cue start + 0.3 s and re-run the final checks.

### Phase 8 — Export and variants

1. Encode MP4, H.264 + AAC, `-movflags +faststart` at the approved ratio. Save its checksum and provenance.
2. Each delivery variant (9:16 Reels, TikTok, Shorts; 1:1 feed) is its own edit: reframe from the clean sources, adapt captions, burn once and run its own final checks. A crop of a captioned master never inherits the parent's approval.

## Output

- `<video_folder>/edits/master-no-captions.mp4`
- `<video_folder>/edits/master-final.mp4`
- `<video_folder>/captions/captions.srt`
- `<video_folder>/meta-upload/<platform>-master.mp4` (one per platform)
- The `assembly_timeline`, the assembler receipt and the `scripts/qc_evidence.py` output for each master.

## Quality checks

- Built with `scripts/assemble.py` from an `assembly_timeline`; the checker passed.
- `scripts/qc_evidence.py` exits 0 on the finished mix. Perception is `listened`/`watched` only when it happened, otherwise `measured`.
- Cue lengths match the sound plan: no accidental truncation, unplanned gap or empty tail.
- Levels are measured after every gain change. Speech sits clearly above music in every dialogue window; no pumping. SFX restrictions are honoured.
- Caption text matches `locked_script` and the brief's on-screen text, not an auto-transcript.
- The end card matches the brand's visual rules. The hook lands in the first 2 s with sound off.
- Each ratio, cutdown or language is checked on its own final bytes: crop, product visibility, text collisions, read time, proof, CTA and full ending.
- Every changed output is re-checked against its checksum. Audio, voice, shot or timing changes refresh every affected downstream check.

## Failure modes

- **Dead air between lines.** Lines were placed at scene starts, not measured word times. Rebuild the speech cues from real word timings.
- **Speech stretched in the edit sounds cartoonish.** Fix a slow voice before lip-sync (create-clips Phase 4) or re-render.
- **The master drifts from the brief's timing** because changes were not logged in the timeline.
- **The no-captions master is exported to delivery.**
- **Captions "rendered" but frames show nothing:** the `fade=alpha=1` PNG bug. Use `overlay=enable='between(...)'`.
- **Sidechain ratio 30:** FFmpeg returns "Result too large". The cap is 20.

## Stored original footage

To reuse owned footage, follow "Use stored original footage" in `capabilities.md`: freeze the exact excerpt, trim it at normal speed, keep its chosen audio and pass it as a `source_excerpt`.
