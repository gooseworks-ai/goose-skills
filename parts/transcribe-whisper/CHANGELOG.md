# transcribe-whisper

## 1.1.0

- `retime_scenes: true` sets the timeline's scene spans from each line's heard words (midway boundaries, tiling 0 to the end of the cut; silent scenes share their gap), and refuses a cut where under 70% of the script is heard. Script and transcript are compared with numbers, contractions, symbols and hyphens spelled the same way, and spans use only heard words. Refuses two scenes with one id.
- A Whisper word chunk with a null end time ends at the next chunk's start, so it still counts as heard.

## 1.0.1

- A line the transcript does not match keeps evenly spread word timings, so captions never transcribe again.

## 1.0.0

- First version: fal Whisper word timings with each approved line placed on what was heard, before the layers.
