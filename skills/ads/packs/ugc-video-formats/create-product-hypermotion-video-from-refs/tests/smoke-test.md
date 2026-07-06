# Smoke Test

Goal: prove `create-product-hypermotion-video-from-refs` assembles a master. The
generative steps (Seedance hypermotion, ElevenLabs music) are PAID; the kinetic-
typography cards + dice/intercut/concat/mux are free PIL/ffmpeg. The smoke test validates
the free assembly on a placeholder hypermotion clip → $0.

Steps:
1. Read `SKILL.md` + `scripts/PIPELINE.md`.
2. Put a placeholder 15s 1:1 color clip at `<run>/working/hypermotion-raw.mp4` (stands in
   for the paid Seedance output).
3. Render the kinetic cards free per `config.text_cards` + `config.end_card`
   (`intro`, `spec_1…spec_5`, `cta`, `endcard`) to `<run>/working/kinetic-movs/<label>.mp4`
   — a placeholder solid-color 1080×1920 clip per label at each card's `duration_s` is fine.
4. Follow PIPELINE Phase 3: center-crop 1:1→9:16, dice into the 6 segments from
   `config.beat_structure.hypermotion_segments_s`, build `concat.txt` in
   `config.beat_structure.concat_order`, concat-copy → `master-silent.mp4`.
5. Probe: 1080×1920, 30fps, duration ≈ sum of all 14 segment durations (≈25s).
6. For the FULL paid path, fire Seedance + ElevenLabs Music with `FAL_API_KEY` — but only
   with an approved config + spend gate.

Pass/fail: pass when the assembled MP4 is 1080×1920 at ~25s with 14 hard-cut segments
(intro + 6 hypermotion cuts + 5 spec cards + CTA + endcard) in the concat order. Gate any
paid gen behind explicit approval.
