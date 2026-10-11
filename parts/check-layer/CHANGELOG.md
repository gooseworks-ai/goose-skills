# check-layer

## 1.4.0

- Per-shot style flags (a shot runs from one scene start to the next; the end card is not one): `captions_cross_cuts` (no caption cue runs across a cut, 0.15 s allowed either side; the end card's start counts), `min_shot` (no shot under 0.4 s), `ambience_floor` (each shot's room tone from -52 to -32 dB full scale, with its speech at least 6 dB above it), `cut_contrast` (the frames 80 ms either side of each cut differ by at least 25, a warning under 32) and `distinct_adjacent_shots` (two scenes in a row never open on the same picture).
- With `retained_body` the new flags judge only the new opening. Without them the verdict is the same as 1.3.0.

## 1.3.0

- Style flags: `text_led` (black_frames judges blank frames, black or one flat colour with no text, instead of dark ones: 1.0 s between beats, 0.3 s at the edges, under 25 % in all), `read_rate` (2.1 to 3.1 spoken words a second), `cuts_between_words` (no cut inside a word), `cut_rate` (0.5 to 0.7 cuts a second, end card excluded) and `retained_body` (content checks only inside the first scene, the new opening; the kept body is not judged).
- A flag this version does not measure stays `not_applicable`; only `text_legible` and `products_visible` say they need eyes.
- `retained_body` counts the opening as marked only when the first scene starts the video and leaves a kept body after it; the speech check then compares the opening's speech with the plan's first line only.
- A flag check code is `flag:<name>` for any flag name the input allows, so a flag with a name this version has never seen is reported, not refused.

## 1.2.0

- The logo is looked for where it is drawn: when the timeline declares a logo box (`safe_zones` use logo), the box plus a margin is cut from the full-resolution frame and matched at sizes from 40 % of the box up to the box and small turns, a wordmark by its shape and by its picture on white and on black, a badge or tile (mostly opaque past its clear padding) by its artwork inside its outline, so a logo drawn small, in a badge or on a tilted card is measured and another logo, a badge of the same shape included, is not. With no box declared, a logo the whole-frame search misses is a warning (`warn`), not a failure, unless the brand layer is on (`expect.layers.brand`), the one fix the failure could name.
- Every failed or warned check carries its own `message` in plain words, beside `reasons`.

## 1.1.2

- A cut at or below -50 LUFS counts as silent, the sound layer's line: a speech-free style with no music is not failed for sound.
- A still scene may hold for as long as it lasts: a held picture over 4 s fails only when it runs on past a scene start, or when the style asks for footage_moves or the timeline names no scenes.

## 1.1.1

- logo_visible is checked across the whole video (the end card included), apart from the end-card logo check.

## 1.1.0

- Free: on-camera speech is checked from the transcript a transcribe step puts in the timeline; an unmarked end card the style needs fails; logo_visible is checked on its own; a declared logo zone bounds the match.

## 1.0.0

- First version: the server's five checks plus black and frozen frames, end card and speech against the script.
