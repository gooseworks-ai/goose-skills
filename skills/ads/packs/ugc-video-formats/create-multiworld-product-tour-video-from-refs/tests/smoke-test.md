# Smoke Test

Goal: prove `create-multiworld-product-tour-video-from-refs` assembles a 27s master from
its scene grid. The generative steps (6 Higgsfield MS clips, NB2 end-card background,
music bed) are PAID; the FFmpeg assembly (trim → hard-cut concat → music mux) is free.
The smoke test validates the free assembly on placeholder clips → $0.

Steps:
1. Read `SKILL.md` + `scripts/config.example.json` + `scripts/PIPELINE.md`.
2. Put 6 placeholder 9:16 clips (any color clips, arrivals ≥4.5s / macros ≥3.5s) named
   per `config.scene_grid` scenes at `<run>/working/clips/{S01..S06}.mp4`, a 3s
   `<run>/working/endcard/endcard_3s.mp4`, and a 27s silent
   `<run>/working/music/music_trimmed.mp3` (or run `--no-music`).
3. Run the source assembly (`clients/Primally pure/ad-runs/run-03-run-03/working/build_master.py`
   pattern): trim each clip to its grid duration, hard-cut concat, mux music.
4. Probe: 720×1280, 24fps, `duration ≈ 3×(4.5+3.5) + 3.0 = 27.0s` (±0.3s), 7 hard-cut
   segments (6 clips + end card).
5. For the FULL paid path, fire the 6 Marketing Studio `product_showcase` clips + the NB2
   end-card background + the music bed — only with an approved config + spend gate + the
   sealed-bottle rule enforced.

Pass/fail: pass when the assembled MP4 is 720×1280 at ≈27.0s with 7 hard-cut segments and
a music stream. Gate any paid gen behind explicit approval.
