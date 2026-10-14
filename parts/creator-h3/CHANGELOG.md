# creator-h3

## 1.3.0

- Split first-take trial, remaining candidate generation and reviewed-source assembly. A file, ASR match or loudness check cannot auto-approve the first performance.
- Require actual source word timing and hash-bound audiovisual content reviews for assembly. Preserve matching native source clocks and return separate assembly provenance, source FileRefs and pending final review.
- Make phone/studio capture explicit, remove automatic inhale/pause tags, condition later voice only from the accepted first source, and keep H3 qualification specific to the actual endpoint and shot.
- Package a new immutable version; old published bundles remain unchanged. No tests or validation runs were performed at the user's request.

## 1.2.3

- Takes are never planned faster than H3 speaks: `words_per_second` above 3.2 plans at 3.2 (a style that asked for 3.9 got takes too full, so H3 rushed or cut the last words). Each measured take logs its heard pace (`take pace`: words over heard speech). part.json carries the measured band as `x-speech-rate` (2.3 to 3.2 words a second). With `words_per_second` at 3.2 or less every request is 1.2.1's; above it the takes are longer, so 1.2.3 declares no `reuses_pieces_of` (a video approved on 1.2.2 or older keeps its version).

## 1.2.2

- 1.2.1's code, declaring `reuses_pieces_of: ["1.1.0", "1.2.0", "1.2.1"]`. Measured joins and line spans change only where the takes land in the reel, never the H3 request, so these versions order the same takes byte for byte (parts/_tools/reuses-pieces.test.mjs on tests/pieces.fixture.mjs). A video approved on one of them moves to 1.2.2 on its next run and reuses the takes it already bought.

## 1.2.1

- Measured line spans: inside each take, the boundary between two lines goes on a silence (0.12 s or longer) heard between its first and last word, so each scene starts on its first word and ends after its last. 1.2.0 spread the lines' estimated lengths over the take's speech, so a scene start (where a cut-footage insert lands when the transcript does not re-time scenes) could fall mid-word or early. A boundary with no silence in reach keeps the 1.2.0 estimate. Takes, joins, the reel and `join: planned` are unchanged.

## 1.2.0

- Measured joins (`join: measured`, the default): each later take is placed so its first word comes 0.25 s after the previous take's last word, measured with ffmpeg's silence detector; the reel ends 0.6 s after the last word. Line spans are spread over each take's measured speech. `join: planned` keeps 1.1.0's final schedule exactly (its onset reading and join floors). Measured joins keep 1.1.0's floors too (two dissolves after the previous take's start; 0.05 s per earlier line plus 0.15 s from the reel start), and the cutaway scene still starts at or before every join.
- `mode: clips`: a silent clip per picked scene (5 s by default), opening on the scene's keyframe from `images`, with the prompt from the style's template; the sound is dropped. Outputs `clips`. Pieces are `clip-<scene id>`.

## 1.1.0

- `cast`: the creator from the plan cast (the speaker's member, else the first with a picture), with the identity written from age, gender and look. `character` is optional when `cast` is given.
- `delivery` (wins over the member's or character's own), and `pronunciations` swapped into the spoken dialogue only.
- `split_before: cutaways`: a take starts only at a spoken cutaway (`extra.shot` not `creator`, a `footage` entry's `scene_id`, or a scene `image`), whose timeline scene starts at or before the join; an on-camera run longer than one take is refused before ordering.
- `takes[].joins_s` on every take after the first. Scene lines may be null.

## 1.0.2

- The take prompt follows create-creator-takes-h3 2.1.0: a natural front-camera look with the recording device and its support outside the frame, instead of a phone propped on a stand.

## 1.0.1

- Shared library fixes: piece names stay unique when an id and a fallback collide, and the loudness meter no longer logs every frame.

## 1.0.0

- First version, from create-creator-takes-h3: takes, voice chain and join through the private line.
