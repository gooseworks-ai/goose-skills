# Smoke Test

Goal: prove `create-song-driven-music-video-from-refs` assembles a master from per-beat
clips + the song + captions. The generative steps (song, keyframes, i2v clips) are PAID;
the assembly (cut-to-window, hard-concat, burn captions, overlay end card, mux song) is
free. The smoke test validates the free assembly on placeholder clips → $0.

Steps:
1. Read `SKILL.md` + `scripts/PIPELINE.md`.
2. Put N placeholder 9:16 clips (any color clips ≥ each beat's window) at
   `<run>/clips/<id>/v1.mp4` (ids from `config.tableaux`), a short song at
   `<run>/audio/music.mp3` with a matching `<run>/audio/words.json`, and an
   `<run>/working/end-card.png`.
3. Run the run's assembly (`working/promote_master.py`-style): cut each clip to its
   `tableaux[].t_start..t_end` window from `timeline.json`, hard-concat, burn the caption
   ASS built by `build_captions_v2.py`, overlay the end card on `end_card.overlay_window_sec`,
   mux `audio/music.mp3`, loudnorm → `<run>/renders/master.mp4`.
4. Probe: 1080×1920, 30fps, `duration ≈ song length (~28s)`, an `aac` audio stream present,
   N hard-cut segments (one per beat) + the end-card overlay window.
5. For the FULL paid path, run steps 1–3 of `PIPELINE.md` (song → keyframes → clips) with
   ElevenLabs + Higgsfield — but only with an approved config + spend gate.

Pass/fail: pass when the assembled MP4 is 1080×1920 at ~28s with the song muxed, N
beat-length segments, captions burned, and the end card on the final window. Gate any paid
gen behind explicit approval.
