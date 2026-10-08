# check-layer 1.0.0

The check layer (slot 4 of 4, always on): checks the finished cut and never changes it. One quality path
for every video, from review-finished-ad and review-ugc-render.

**Our server's five checks, with its limits** (so a local pass predicts the upload's):

| Check | Fails when |
|---|---|
| `plays` | ffprobe finds no picture, or a full decode reports an error |
| `length` | outside `expect.duration_s` by more than 0.5 s |
| `size` | not the plan's aspect within 2 %, or under 720 px on the short side |
| `sound` | no sound, or integrated loudness outside -14 +/-2 LUFS (when `expect.sound` is true; without it, when the cut has a track or speech) |
| `captions` | `expect.captions` and no timed caption with text inside the video (from the captions layer's `words`) |

**Local checks**: `black_frames` (a black stretch over 0.3 s), `frozen_frames` (an opening still over 1.5 s,
or a held picture over 4 s before the end card; review-finished-ad's 2.5 s would fail a phone chat's 3.6 s
picture hold), `end_card` (when the style ends on one and a step marked it in the timeline: at least 0.5 s, at the end; a card a frame page draws itself is not marked and not measured), `speech_matches_script`
(`expect.script` against what is said: a voiceover's spoken lines from the timeline; on-camera speech
transcribed with fal Whisper as one paid piece; the review-ugc-render rules: numbers, units, negations and
brand names must match, confirmed pronunciations are aliases, similarity at least 0.90).

**Output**: `verdict: {pass, checks: [{code, status, found?, expected?, fix?}], reasons: [{check, message,
expected?, found?}]}`: `reasons` is the server's shape for every failed check; `fix` names the layer to re-run
(sound, captions or brand). Messages are for logs; the customer's words come from the rulebook.

Not in 1.0.0: the logo match on the end card, the palette warning and the style's `qc_flags` (they need
image matching or eyes); captions in the safe zone is ensured by the captions layer, which draws inside it.

**Cost basis**: fal Whisper, an upper bound of USD 0.001 per second of the cut; charged only for on-camera speech.

Source: `parts/check-layer/src/part.mjs` with `parts/_lib/speech.mjs`.
