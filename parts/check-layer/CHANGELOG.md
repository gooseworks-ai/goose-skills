# check-layer

## 1.2.0

- The logo is looked for where it is drawn: when the timeline declares a logo box (`safe_zones` use logo), the box plus a margin is cut from the full-resolution frame and matched over sizes up to the box and small turns, so a logo drawn small, in a badge or on a tilted card is measured. With no box declared, a logo the whole-frame search misses is a warning (`warn`), not a failure, unless the brand layer is on (`expect.layers.brand`), the one fix the failure could name.
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
