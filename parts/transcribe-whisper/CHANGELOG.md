# transcribe-whisper

## 1.1.1

- The cut's sound goes to Whisper as 16 kHz mono 16-bit WAV (`audio/wav`) instead of AAC in m4a (`audio/mp4`). The kit and the server host only `audio/wav` and `audio/mpeg` for the line, so 1.1.0 stopped at the transcribe piece on every real run. Inputs, outputs, the request body and all 1.1.0 behaviour are unchanged; pin `@1.1.1` with the same inputs.

## 1.1.0

- `retime_scenes: true` sets the timeline's scene spans from each line's heard words (midway boundaries, tiling 0 to the end of the cut; silent scenes share their gap), and refuses a cut where under 70% of the script is heard. Script and transcript are compared with numbers, contractions, symbols and hyphens spelled the same way, and spans use only heard words. Refuses two scenes with one id.
- A Whisper word chunk with a null end time ends at the next chunk's start (at most 0.8 s after it starts), so it still counts as heard. Contractions Whisper writes without an apostrophe ("dont", "were" for "we're") match the script.

## 1.0.1

- A line the transcript does not match keeps evenly spread word timings, so captions never transcribe again.

## 1.0.0

- First version: fal Whisper word timings with each approved line placed on what was heard, before the layers.
