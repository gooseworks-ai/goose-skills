# Smoke Test

Goal: prove `create-photo-grid-promo-card-video-from-refs` renders its core
workflow. The card + frame-step render spend **nothing**; only `gen_music.py` is
paid. The smoke test runs the free half end-to-end → $0.

Steps:
1. Read `SKILL.md`.
2. Copy `scripts/config.example.json` → `<run>/config.json`; copy `demo/assets/`
   (wordmark + product; LFS-fetch the product webp first). Lifestyle photos may be
   absent — `photo` tiles fall back to a gradient placeholder by design.
3. `scripts/one_shot.py --config <run>/config.json --run-dir <run> --no-music`
   → builds `hyperframe.html` + `master-final.mp4` (silent).
4. Probe: 1080×1920, h264, 25fps, `duration ≈ 10`, `nb_frames == 250`.
5. Extract a frame at t≈4s and confirm the QC bar: wordmark + headline + "% OFF"
   + code + chips crisp; 2×3 grid laid out; tiles have slid in.
6. Save artifacts to
   `coworkers/test-runs/<timestamp>/create-photo-grid-promo-card-video-from-refs/`.

The paid path is the same driver without `--no-music` (adds the ElevenLabs bed).

Pass/fail: pass when the silent MP4 is produced at 1080×1920 / 250 frames / ~10s,
all DOM text is crisp, and the 6-tile grid + chips render in the staggered slide-in.
A dry-run must print the built card dims + tile/chip counts and mark any missing
input as blocked, not skipped.
