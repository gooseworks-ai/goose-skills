# Smoke test

End-to-end pipeline run using the canonical example, without any brand customization.

```bash
cd skills/molecules/create-apple-notes-video-ad
bash tests/run-all.sh
```

Pass criteria:

- `tests/output/sample-run/clips/master-typing.mp4` exists, is `1180×2556`, ≥5s.
- `tests/output/sample-run/clips/master-typing.sfx.json` exists and contains one cue per typed character + one cue per inter-paragraph return.
- `tests/output/sample-run/clips/end-card.mp4` exists, is `1180×2556`, ~3.5s.
- `tests/output/sample-run/edits/master-final.mp4` exists, has both video (h264) and audio (aac) streams, total duration ≈ typing + 3.2s end card.
- `tests/output/sample-run/meta-upload/master-9x16-1080.mp4` exists when `--export-9x16` is run, is `1080×1920`.

Run `ffprobe -v error -show_entries stream=codec_name,width,height -of default=nw=1 tests/output/sample-run/edits/master-final.mp4` to confirm.
