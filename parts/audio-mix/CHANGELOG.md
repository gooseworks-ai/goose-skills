# audio-mix

## 1.1.0

- `room_tone {color, gain_db, highpass_hz, lowpass_hz}`: a seeded, band-limited noise bed under the whole video, laid after the voice is levelled (podcast skit: brown, 90-2600 Hz, -27 dB).
- `marks` + `mark_sounds` (+ `mark_offset_s`, `mark_gain`, `mark_max_s`): a sound at every mark whose kind matches a sound id, e.g. a snap click on every snap shot from `step.cut.marks` and `step.sfx.effects`. Marks with no sounds, or with no kind that has a sound, are refused.
- `outdoor`: an outdoor phone-mic chain on the speech (band, presence EQ, 3:1 compressor) and a slowly swelling street ambience bed.
- 1.0.1 inputs behave as before.

## 1.0.1

- Shared library fixes: piece names stay unique when an id and a fallback collide, and the loudness meter no longer logs every frame.

## 1.0.0

- First version: the mix mode of mix-master as a timeline step (voice, ducked bed, timed effects).
