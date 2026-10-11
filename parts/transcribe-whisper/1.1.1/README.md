# transcribe-whisper 1.1.1

What is actually said in a cut, as a timeline step that runs before the layers. Paid: one piece.

- **Paid piece** `transcribe`, through the private line only: fal `fal-ai/whisper` with `{audio_url, task:
  "transcribe", language, chunk_level: "word"}` (caption-burn's transcription). The cut's sound goes to the
  core as a file: its first audio track as 16 kHz mono 16-bit WAV (`audio/wav`; new in 1.1.1, where 1.1.0 sent
  AAC in m4a, a type the line does not host). A word chunk whose end time Whisper leaves null ends at the next chunk's start (or the end
  of the cut), at most 0.8 s after it starts, so it still counts as heard and a last word does not swallow the
  silence after it.
- **Lines on what was heard** (caption-burn's matching): each approved `scenes[].line` is placed on the heard
  words. Its speech entry keeps the written line as `text` (captions show the approved words), carries what was
  heard for it as `spoken` (every heard word belongs to exactly one line, in order), and its written words timed
  by the heard ones (a word written differently, "200" for "two hundred", sits between its neighbours). A line
  the transcript does not match keeps evenly spread word timings. Scenes whose `line` is null or empty are
  skipped.
- **`retime_scenes: true`** (new in 1.1.0; the old `align_beats.py`): the output timeline's `scenes` are set
  from the heard words, one span per input scene, in plan order, tiling 0 to the end of the cut.
  - Between two spoken scenes the boundary goes midway between the last heard word of one and the first heard
    word of the next. The last scene runs to the end of the cut.
  - The heard words come from one alignment of the whole script on the whole transcript, after both are
    spelled the same way: numbers as words ("200" and "two hundred"), contractions opened ("don't", "dont" and
    "do not"; when that hears less, compared bare: "we're" and "were"), `%` `$` `&` as words, hyphens split, punctuation dropped. A line's span uses only its heard words,
    never a guessed time for a word that was not heard; an unmatched heard word between two lines goes to the
    line with an unheard word at that edge. A line with no heard word shares its gap like a silent scene.
  - Scenes without a line share the gap they sit in: k silent scenes in a gap cut it into k + 2 equal slots
    (the spoken scene before holds one, each silent scene gets one, the next spoken scene leads in for one).
    Silent scenes at the start split the time before the first word; silent scenes at the end follow a hold of
    at most 0.45 s after the last word.
  - **Refused** before anything is ordered when no scene has a line, or when two scenes share an id (a scene
    with no id is named by its position). **Refused** after the transcription when
    under 70% of the script's words are heard in order (the cut does not say the script); the transcription
    piece is reused on a retry.
  - Without `retime_scenes` the given timeline's scenes are kept, as in 1.0.1.
- **For the layers**: the core hands the latest step's `timeline` to the layers, so the captions layer uses
  these timings and never transcribes again, and the check layer compares `spoken` with the approved script
  (on-camera speech must be transcribed this way; the check layer orders nothing).
- **Outputs**: `video` (the cut, unchanged), `timeline` (the given one, or one from the cut, with `speech`, and
  with `scenes` re-timed when asked), `transcript`.
- **Cost basis**: USD 0.02 per call, an upper bound on fal Whisper for a short ad.

Source: `parts/transcribe-whisper/src/part.mjs` and `src/retime.mjs`, with `parts/_lib/heard.mjs`.
