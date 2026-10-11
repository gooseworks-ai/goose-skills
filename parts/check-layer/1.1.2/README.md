# check-layer 1.1.2

The check layer (slot 4 of 4, always on): checks the finished cut and never changes it. One quality path
for every video, from review-finished-ad and review-ugc-render.

**Our server's five checks, with its limits** (so a local pass predicts the upload's):

| Check | Fails when |
|---|---|
| `plays` | ffprobe finds no picture, or a full decode reports an error |
| `length` | outside `expect.duration_s` by more than 0.5 s |
| `size` | not the plan's aspect within 2 %, or under 720 px on the short side |
| `sound` | integrated loudness outside -14 +/-2 LUFS, or no sound when speech is planned; a silent cut (at or below -50 LUFS, the line under which the sound layer passes a cut through unlevelled) with no speech planned (a style whose music is optional, with none chosen) is not applicable |
| `captions` | `expect.captions` and no timed caption with text inside the video (from the captions layer's `words`) |

**Local checks**: `black_frames` (a black stretch over 0.3 s), `frozen_frames` (an opening still over 1.5 s,
or a held picture over 4 s before the end card that runs on past a scene start, so a scene that is a still card
may hold for as long as it lasts; any hold over 4 s fails when the style asks for `footage_moves` or the
timeline names no scenes; review-finished-ad's 2.5 s would fail a phone chat's 3.6 s picture hold), `end_card` (when the style ends on one: a step must have marked it in the timeline, at least 0.5 s, at the end; an unmarked card fails), `speech_matches_script`
(`expect.script` against what was said, as the timeline's speech carries it: each entry's `spoken`, else its
text. On-camera speech must be transcribed by a `transcribe-whisper` step before the layers, so every entry has
`spoken`; without it the check fails. The review-ugc-render rules: numbers, units, negations and brand names
must match, confirmed pronunciations are aliases, similarity at least 0.90). The check layer orders nothing: it
is free and needs no network.

**Output**: `verdict: {pass, checks: [{code, status, found?, expected?, fix?}], reasons: [{check, message,
expected?, found?}]}`: `reasons` is the server's shape for every failed check; `fix` names the layer to re-run
(sound, captions or brand). Messages are for logs; the customer's words come from the rulebook.

**Brand and style checks**: `logo` (when the style ends on a card: the brand's logo file found on it, or in the
last 1.6 s when no step marked one, by grayscale normalised correlation over a size search: a mark by its shape, so a white mark on a
dark card counts, at least 0.75; an opaque logo at least 0.70; a favicon-sized file fails; when the timeline declares a logo safe zone the match
must sit inside it),
`captions_safe_zone` (every drawn caption inside the timeline's caption zone and clear of the TikTok/Reels
bands: top 220, bottom 400, right 140 px at 1080x1920), and the style's `qc_flags`: `logo_visible` (the logo
check's matching, run on its own: the logo anywhere in the video, the end card included, whatever the end-card check finds), `footage_moves` (mean frame-to-frame change of at least 1.5 on a 160 x 160 grayscale copy, over the
half of the rows that move most, logo-equation-card's gate) and `sounds_match_messages` (the sound of the finished
cut, music included, rises at least 4 dB when each chat scene appears: the layer gets only the finished cut, so
a style with a music bed keeps the bed under the chat's sounds in its mix) are measured and count toward the verdict; a flag that needs eyes
(`text_legible`, `products_visible`) is reported as `not_applicable` with `found: "needs eyes"`.

**Cost**: free.

Source: `parts/check-layer/src/part.mjs` with `parts/_lib/speech.mjs` and `parts/_lib/frames.mjs`.
