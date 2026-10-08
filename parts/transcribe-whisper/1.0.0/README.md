# transcribe-whisper 1.0.0

What is actually said in a cut, as a timeline step that runs before the layers. Paid: one piece.

- **Paid piece** `transcribe`, through the private line only: fal `fal-ai/whisper` with `{audio_url, task:
  "transcribe", language, chunk_level: "word"}` (caption-burn's transcription). The cut's sound goes to the
  core as a file.
- **Lines on what was heard** (caption-burn's matching): each approved `scenes[].line` is placed on the heard
  words. Its speech entry keeps the written line as `text` (captions show the approved words), carries what was
  heard for it as `spoken` (every heard word belongs to exactly one line, in order), and its written words timed
  by the heard ones (a word written differently, "200" for "two hundred", sits between its neighbours).
- **For the layers**: the core hands the latest step's `timeline` to the layers, so the captions layer uses
  these timings and never transcribes again, and the check layer compares `spoken` with the approved script
  (on-camera speech must be transcribed this way; the check layer orders nothing).
- **Outputs**: `video` (the cut, unchanged), `timeline` (the given one, or one from the cut, with `speech`),
  `transcript`.
- **Cost basis**: USD 0.02 per call, an upper bound on fal Whisper for a short ad.

Source: `parts/transcribe-whisper/src/part.mjs` with `parts/_lib/heard.mjs`.
