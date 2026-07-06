# Smoke Test

Goal: prove `create-flatlay-product-reveal-video-from-refs` assembles a master. The
generative steps (flat covers, Veo beats, insert, music) are PAID; the assembly
(start frames, end card, speed/concat/master) is free. The smoke test validates the
free assembly on placeholder beat clips → $0.

Steps:
1. Read `SKILL.md`.
2. Put N placeholder 9:16 clips (any 4s color clips) at `<run>/generated/beats/<slug>.mp4`
   (slugs from config.beats) + a `<run>/generated/end-card.mp4` (3s).
3. `scripts/build_master.py --config config.json --run-dir <run> --no-music --no-insert`
   → `<run>/master-final.mp4`.
4. Probe: 1080×1920, 30fps, `duration ≈ N*(beat_i2v.duration/beat_speed) + end_card.dwell`
   (4 beats ×2.67 + 3 ≈ 13.7s).
5. For the FULL paid path, run `scripts/one_shot.py --config config.json --run-dir <run>`
   with FAL + ElevenLabs keys — but only with an approved config + spend gate.

Pass/fail: pass when the assembled MP4 is 1080×1920 at the expected duration with N+1
hard-cut segments (beats + end card). Gate any paid gen behind explicit approval.
