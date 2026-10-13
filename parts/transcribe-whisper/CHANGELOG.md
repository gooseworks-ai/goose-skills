# transcribe-whisper

## 1.1.2

- Lines are placed on what was heard by one alignment of the whole script on the whole transcript, in scene order, that may skip heard words between lines (free) or inside a line (at a small cost). 1.1.1 looked for each word among the next five heard words from where the last line ended, so one repeated opening question left every later line unplaced and gave everything left to the last line (staging, 13 Oct 2026: speech-recut then refused the take as missing a line that was said).
- Heard words no line owns (a repeated line, a filler) come out as their own speech entries with no `scene_id` and empty `text`, so speech-recut 1.0.2 can cut them and captions skip them.
- `reuses_pieces_of: ["1.1.1"]`: the Whisper request is unchanged, so approved videos move here without paying again. `retime_scenes` is unchanged.

## 1.1.1

- The cut's sound goes to Whisper as 16 kHz mono 16-bit WAV (`audio/wav`) instead of AAC in m4a (`audio/mp4`). The kit and the server host only `audio/wav` and `audio/mpeg` for the line, so 1.1.0 stopped at the transcribe piece on every real run. Inputs, outputs, the request body and all 1.1.0 behaviour are unchanged; pin `@1.1.1` with the same inputs.

## 1.1.0

- `retime_scenes: true` sets the timeline's scene spans from each line's heard words (midway boundaries, tiling 0 to the end of the cut; silent scenes share their gap), and refuses a cut where under 70% of the script is heard. Script and transcript are compared with numbers, contractions, symbols and hyphens spelled the same way, and spans use only heard words. Refuses two scenes with one id.
- A Whisper word chunk with a null end time ends at the next chunk's start (at most 0.8 s after it starts), so it still counts as heard. Contractions Whisper writes without an apostrophe ("dont", "were" for "we're") match the script.

## 1.0.1

- A line the transcript does not match keeps evenly spread word timings, so captions never transcribe again.

## 1.0.0

- First version: fal Whisper word timings with each approved line placed on what was heard, before the layers.
