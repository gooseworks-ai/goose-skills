# transcribe-whisper 1.1.2

What is actually said in a cut, as a timeline step that runs before the layers. Paid: one piece.

- **Paid piece** `transcribe`, through the private line only: fal `fal-ai/whisper` with `{audio_url, task:
  "transcribe", language, chunk_level: "word"}` (caption-burn's transcription). The cut's sound goes to the
  core as a file: its first audio track as 16 kHz mono 16-bit WAV (`audio/wav`; new in 1.1.1, where 1.1.0 sent
  AAC in m4a, a type the line does not host). A word chunk whose end time Whisper leaves null ends at the next chunk's start (or the end
  of the cut), at most 0.8 s after it starts, so it still counts as heard and a last word does not swallow the
  silence after it.
- **Lines on what was heard** (new in 1.1.2): each approved `scenes[].line` is placed on the heard words by one
  alignment of the whole script on the whole transcript, in scene order, spelled the same way as below (numbers
  as words, contractions opened, punctuation dropped). It may skip heard words: skipping one between two lines is
  free, skipping one inside a line costs a fifth of a matched word, and ties go to the earliest heard words. So a
  repeated line, a filler or an invented word between lines never pushes the next line off its words. (1.1.1 and
  older looked for each word among the next five heard words from where the last line ended: one repeated
  question failed every later line and gave everything left to the last one.)
  - Each line's speech entry keeps the written line as `text` (captions show the approved words), carries what
    was heard for it as `spoken`, and its written words timed by the heard ones (a word written differently,
    "200" for "two hundred", sits between its neighbours).
  - A line owns the heard words from its first matched word to its last, plus up to two heard words for each of
    its written words not heard at that edge (a name Whisper writes as two words). A line with under two thirds
    of its words heard keeps evenly spread word timings over what it owns. Scenes whose `line` is null or empty
    are skipped.
  - **Speech in no line**: heard words that no line owns come out as their own `timeline.speech` entries, in
    time order, with **no `scene_id` and empty `text`**, their heard words in `spoken` and `words`. Captions skip
    them (no written text), the check layer still hears them, and speech-recut 1.0.2 cuts them out.
  - `reuses_pieces_of: ["1.1.1"]`: the Whisper request is 1.1.1's byte for byte, so a video approved on 1.1.1
    moves here and keeps the transcription it bought.
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

Source: `parts/transcribe-whisper/src/part.mjs`, `src/place.mjs` and `src/retime.mjs`, with `parts/_lib/heard.mjs`.
