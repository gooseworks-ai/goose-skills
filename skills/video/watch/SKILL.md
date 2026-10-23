---
name: watch
description: Observe actual video and sound over the whole file or named ranges, with timestamped evidence and honest coverage. Use complementary playback, listening and targeted frames; return observations without edits or verdicts.
version: "2.0.0"
---

# Human version

Report what the actual file shows and sounds like, with timestamps. Keep sampled
frames, moving-picture review, listening and transcription separate. Missing a
capability stays explicit; observations are not an approval verdict.

---

# Agent version

## Inputs and modes

Accept the video, optional timestamp ranges, sampling rate, frame budget, resolution,
audio dimensions and focus. Defaults describe whole-file scope, not completed review.
Read the parameter reference for how to partition work without omitting intervals.

Before reporting, resolve exact source/version, checksum, duration and actual reviewer
capabilities. Returned audio bytes or transcription do not establish perception.
Use complete normal-speed moving-picture and sound review for a full audiovisual
observation. Add sampled frames for scene/text evidence and suitably dense,
original-resolution motion/mouth inspection for suspicious intervals. Sparse frames
cannot certify action continuity or fine lip-sync. There is no universal two-fps
ceiling for targeted inspection; remain within source rate and available tools.

## Workflow

1. Read the exact file and its real duration. Resolve all requested ranges and keep
   actual decoded source timestamps. Never substitute another master or thumbnails.
2. Observe the complete requested moving-picture ranges at normal speed when capable.
   Record uncovered ranges/capabilities. A frame budget cannot silently omit a scene;
   divide work into explicitly covered passes when needed.
3. Inspect sampled or targeted frames at sufficient resolution for the question.
   Record sampling density, actual frame times and coverage separately from playback.
4. Hear requested sound, including speech, music and effects. Listen to isolated
   speech when available and the mix. Transcribe speech as supporting word evidence;
   unavailable ASR leaves transcription incomplete but does not erase actual listening.
   Unavailable listening cannot be cleared by ASR, waveform or inclusion flags.
5. Report observed picture/action/text and heard speech/sound with exact intervals,
   source evidence and observation method. Label transcript-only words as ASR output,
   not heard speech. Corroborate suspicious ASR against audio; silence can yield false
   words. Do not invent music taste, voice character or lip-sync observations.
6. Save timestamped observations and the coverage manifest. Keep each duty complete,
   partial or unavailable, with covered ranges and remaining gaps. No edits, quality
   verdicts or recommendations are supplied by this primitive.

## Outputs

Return readable observation report, sampled frames and their source times, optional
transcript/word timing, available audio artifacts and manifest. The manifest records
source identity/checksum/duration, requested and observed ranges, reviewer capability,
separate frame/motion/listening/transcription coverage, sampling/resolution, file
paths and remaining gaps. Do not rename frames plus transcript as frames-and-audio.

## Boundaries

A full-file request with partial coverage remains partial. Audio disabled intentionally
is frames/motion-only; audio enabled without perception is unverified. A missing
backend does not justify an invented transcript. The downstream judge compares
these observations with the creative contract and makes its own evidence-bound verdict.

## References

Read [parameters](references/parameters.md) for observation controls and coverage.
