# Smoke Test

Goal: prove `create-overlay-proof-points-video-from-refs` renders its core
workflow. The overlay + composite half spends **nothing**; only `gen_base_clip.py`
(keyframe + i2v) and `gen_music.py` are paid. The smoke test exercises the free
half end-to-end against an existing base clip, so it costs $0.

Input: `tests/sample-input.md` / `scripts/config.example.json`.

Steps:
1. Read `SKILL.md`.
2. `scripts/fetch_icons.py --run-dir <run>` — pulls the three Twemoji PNGs.
3. Provide a base clip: copy `demo/finals/spoiled-child-e27-perfect-10.mp4` (or any
   9:16 clip) to `<run>/generated/clip-handheld.mp4`. (Skips the two paid calls.)
4. `scripts/build_overlays.py --config scripts/config.example.json --icons-dir
   <run>/assets/icons --out-dir <run>/generated/overlays` — prints 6 pill sizes.
5. `scripts/compose_master.py --config scripts/config.example.json --run-dir <run>
   --no-music` — writes `<run>/master-final.mp4`.
6. Probe: 1080×1920, h264, `duration ≈ 10`.
7. Extract a frame at t≈7s and confirm the QC bar (Phase 4): headers on top, all 4
   ✅ pills on-frame in the L→R cascade, no clipped text.
8. Save artifacts to
   `coworkers/test-runs/<timestamp>/create-overlay-proof-points-video-from-refs/`.

The full paid path is the same driver without `--no-paid`:
`scripts/one_shot.py --config config.json --run-dir <run>` (fires the keyframe,
i2v, and music). Only run that with an approved config + a spend gate.

Pass/fail: pass when the free composite MP4 is produced at 1080×1920 / ~10s, both
header pills persist, and 3–4 ✅ pills reveal in the diagonal cascade with crisp
text and no clipping. A dry-run must print the derived overlay sizes and mark any
missing input as blocked, not skipped.
