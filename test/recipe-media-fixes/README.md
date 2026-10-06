# Recipe media repair checks

Free regression fixtures cover speech-safe joins, mixed frame rates, notification wrapping/audio inputs, photo framing, caption coverage, pronunciation read-back and kinetic text. These checks do not call generation or transcription services.

Requires Python 3, pytest, Pillow, and a working ffmpeg/ffprobe with libx264, AAC and xfade. Run from the repository root:

```sh
python3 -m pytest -q test/recipe-media-fixes/test_repairs.py \
  skills/ads/capabilities/review-finished-ad/tests/test_sampling.py \
  skills/ads/capabilities/create-vo-elevenlabs/tests
```

The real join cases use two or three differently colored local clips at 24/25/30 fps with synthetic audio and declared fixture word boundaries. Actual customer speech still needs measured transcription and listening. Pronunciation tests use the exact staging Gooseworks fact (`Pronounce "Gooseworks" as "Goose Works"`) in every brand-read result shape, plus the older `Pronunciation: term => say` form; they do not prove persistence against the live brand service. The loudness case checks that a mono take keeps its level when the join makes stereo.
