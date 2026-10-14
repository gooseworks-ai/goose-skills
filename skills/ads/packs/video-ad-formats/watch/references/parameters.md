# Watch parameters and coverage

## Source and ranges

Video identifies the exact readable local file. Ranges are optional start/end pairs,
with seconds or clock notation; whole file is the default scope. Save exact identity,
checksum, duration and actual source timestamps. Multiple ranges are permitted, but
unrequested gaps never count as watched.

## Sampling and resolution

fps controls supplemental frame extraction, not continuous playback coverage.
A low overview rate such as 1–2 fps can show scene order and text; short actions,
cut boundaries and mouth motion need denser original-resolution inspection at a
rate appropriate to the source/question. No hard 2 fps ceiling applies. Do not imply
that isolated frames certify perceived phoneme sync.

max_frames limits one extraction pass. A typical overview budget is 100 frames.
When that budget cannot cover required intervals, split into identified passes or
report the gap; do not silently downsample away the requested evidence.

resolution controls supplemental frame width. Overview frames may be small; exact
text, labels, faces and contact need source/native detail and the actual delivery
crop. Record resizing so small previews do not become claimed original inspection.

## Audio dimensions

include_voice, include_music and include_sfx default true and select responsibilities,
not completed listening. Hear actual requested sound when the reviewer is capable.
Transcription is a separate optional operation/backend and supporting word evidence.
A transcription failure leaves that duty incomplete; listening may still proceed.
Conversely, a clean transcript does not complete voice/music/SFX listening.

With all sound dimensions disabled, label the observation picture-only. When they
are enabled but unavailable, retain incomplete audio coverage and available evidence.
Never infer intentional silence from no recognised speech.

## Focus and manifest

Focus specifies the observation question, such as end-card copy, product contact,
word endings or a cut. It changes neither approval nor source truth. Record each
actual method, source range, resolution/density, evidence file and missing capability.
Keep sampled-frame, continuous-motion, isolated-speech listening, mixed listening and
transcription coverage separate. The observation report contains facts/uncertainties;
the downstream review supplies verdicts.
