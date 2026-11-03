# check-layer 1.4.1

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

**Output**: `verdict: {pass, checks: [{code, status, message?, found?, expected?, fix?}], reasons: [{check,
message, expected?, found?}]}`: every failed or warned check carries its `message` in plain words (no file paths
or step names; the kit reports the first failed check's), `reasons` is the server's shape for every failed check;
`fix` names the layer to re-run (sound, captions or brand). A `warn` check was measured short but does not count
against the video.

**Brand and style checks**: `logo` (when the style ends on a card: the brand's logo file found on it, or in the
last 1.6 s when no step marked one, by grayscale normalised correlation: a mark by its shape, so a white mark on a
dark card counts, at least 0.75; an opaque logo at least 0.70; source resolution below 256 px on the long side produces a non-blocking `logo_resolution` warning. There is no pixel-area or short-side minimum. Resolution advice does not skip the actual logo match. When the timeline
declares the box a step drew the logo in (`safe_zones` use `logo`; html-frames 1.1.0 and phone-chat 1.2.0 do), the
box plus a margin is cut from the full-resolution frame and the logo is matched there at sizes from 40 % of the
box's long side up to the box and turns of up to 5 degrees: a logo with a telling outline (a wordmark) by its
shape and by its picture laid on white and on black; one that is mostly opaque inside its drawn part (a badge or
a tile, judged past any clear padding) by its artwork inside its own outline only, so two badges of one shape
with different marks never match. A logo drawn small, in a badge or on a tilted card is measured and a different
logo is not; not found there, it fails. With no box, the whole frame is searched on a 120 px wide copy over 15 to 60 % of its width, which
misses small logos: a miss is then a `warn`, not a failure, unless the brand layer is on (`expect.layers.brand`,
which the kit does not pass yet), the one fix the failure could name),
`captions_safe_zone` (every drawn caption inside the timeline's caption zone and clear of the TikTok/Reels
bands: top 220, bottom 400, right 140 px at 1080x1920), and the style's `qc_flags`: `logo_visible` (the logo
check's matching, run on its own: the logo anywhere in the video, the end card included, whatever the end-card check finds), `footage_moves` (mean frame-to-frame change of at least 1.5 on a 160 x 160 grayscale copy, over the
half of the rows that move most, logo-equation-card's gate) and `sounds_match_messages` (the sound of the finished
cut, music included, rises at least 4 dB when each chat scene appears: the layer gets only the finished cut, so
a style with a music bed keeps the bed under the chat's sounds in its mix) are measured and count toward the verdict; a flag that needs eyes
(`text_legible`, `products_visible`) is reported as `not_applicable` with `found: "needs eyes"`, and a flag this
version does not measure (one a later check layer adds; a style may declare it first) is `not_applicable` too.

**New in 1.3.0: style flags** (each only when the style lists it in `qc_flags`):

| Flag | Passes when |
|---|---|
| `text_led` | For a text-on-colour style (kinetic text). `black_frames` judges **blank** frames (black or one flat colour with no text: under 1.5 % of the rows hold pixels more than 48 off the dominant colour, sampled at 10 fps on a 270 px wide copy), not dark ones, so a dark beat with a little text on it passes. A blank stretch may last 1.0 s between text beats and 0.3 s at the opening or ending. `flag:text_led` itself fails when all blank time reaches 25 % of the video, or the whole video is blank. review-finished-ad's silent-text profile. |
| `read_rate` | Spoken words per second over `timeline.speech` from 2.1 to 3.1: each entry's word timings when it has them, else the words of `spoken` (else `text`), over the time the entries span. No speech: `not_applicable`. |
| `cuts_between_words` | No cut (a scene start after 0, or the end card's start) falls strictly inside a word, with 0.01 s of slack at a word's edges. Word timings from the speech entries, else the captions layer's `words`. None: `not_applicable`. |
| `cut_rate` | 0.5 to 0.7 cuts a second over the body (the end card is not counted): scene starts after 0 and before the body's end, divided by the body's length. No scenes: `not_applicable`. |
| `retained_body` | For a new opening spliced onto a kept video (hook replacement). The first scene in `timeline.scenes` is the opening: the content checks (black and frozen frames, the captions' placement, the logo, speech against the script and the measured flags) run only inside it, and the kept body is reported `not_applicable` or left out of the measure. The server's five checks still cover the whole video. With no first scene marked, the flag fails. |


**New in 1.4.0: per-shot flags** (each only when the style lists it in `qc_flags`). A **shot** runs from one
cut to the next, a cut being a scene start in `timeline.scenes` (after 0 and before the end card); the end card
is not a shot, and with no scenes the body is one shot. A splice inside a scene that no step marks in the
timeline is not seen.

| Flag | Passes when |
|---|---|
| `captions_cross_cuts` | No caption cue (the captions layer's `words` cues) runs on across a cut: a cue may overlap a cut by 0.15 s either side. The end card's start counts as a cut. No captions or no cuts: `not_applicable`. |
| `min_shot` | No shot is shorter than 0.4 s (the last shot before the end card included). No scenes: `not_applicable`. |
| `ambience_floor` | Under every shot the room tone, the 10th percentile of its 50 ms windows (the speech-free ones when there are at least four, 0.05 s in from the shot's edges, RMS on an 8 kHz mono copy), sits from -52 to -32 dB full scale, and the speech in the shot (the power-average of the windows inside its words, from `timeline.speech`) is at least 6 dB above it. Digital silence fails. A shot with no speech is judged on the band only. |
| `cut_contrast` | At every cut, the mean absolute grayscale difference (0 to 255, on a 160 px wide copy, exact seeks) between the frames 80 ms before and 80 ms after is at least 25; under 32 is a `warn`, which does not fail the video. The end card's start is not judged. No cuts: `not_applicable`. |
| `distinct_adjacent_shots` | The opening frames (0.05 s in) of every two scenes in a row differ by at least 6 (mean absolute grayscale difference on a 64 px wide copy; the same clip shown twice differs by encoder noise, about 1). Fewer than two scenes: `not_applicable`. |

With `retained_body`, these flags see only the new opening: its cuts, shots and captions (a caption across the
join into the kept video fails `captions_cross_cuts`).

**Cost**: free.

Source: `parts/check-layer/src/part.mjs`, `src/flags.mjs` and `src/shots.mjs` with `parts/_lib/speech.mjs` and `parts/_lib/frames.mjs`.
