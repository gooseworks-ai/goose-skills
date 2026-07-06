# Smoke Test

Goal: prove `create-value-prop-video-from-refs` assembles a legible, sound-off master.
The **only paid step is the music bed** (`fire_music.py`); everything else (beat HTMLs,
Playwright hyperframes, concat, silent mux) is free and deterministic. The smoke test
validates the free render path → $0.

Steps:
1. Read `SKILL.md`.
2. Provide the ≥3 SKU cutout PNGs at `<run>/source/sachets/<slug>.png` (slugs from
   `config.skus`) + the brand wordmark at `<run>/source/logo-som-blue.png`.
3. Author `<run>/shot-list.yml` from `scripts/config.example.json` (hook + N prop beats
   + endcard) and run `scripts/render_master.py` → `<run>/finals/master-*-clean.mp4`
   (silent). This is $0.
4. Probe: 1080×1920, 30fps, `duration ≈ hook_s + Σ prop_s + endcard_s` (3.0 + 5×2.4 +
   2.0 = 17.0s), and an audio stream is present (silent `anullsrc`).
5. `/watch` a mid-frame per prop beat: the ≤4-word claim is legible; the per-SKU PNG is
   present and the hero rotates; the headline is navy (not the flavor color).
6. For the music path, run `scripts/fire_music.py` (PAID) + mux at −14 dB — only with an
   approved config + a spend gate.

Pass/fail: pass when the assembled MP4 is 1080×1920 at ~17s with a hook + 3-5 prop beats
+ end card, every claim ≤4 words and legible sound-off. Gate the paid music behind
explicit approval.
