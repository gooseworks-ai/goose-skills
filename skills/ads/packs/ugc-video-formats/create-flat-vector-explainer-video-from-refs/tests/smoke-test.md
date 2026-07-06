# Smoke Test

Goal: prove `create-flat-vector-explainer-video-from-refs` reads its config and that the
recipe → source-script mapping is intact. The generative steps (keyframes, clean plates,
Kling i2v, VO, music) are PAID and run in the source project; this molecule is
documentation-grade, so the smoke test validates the config + engine map for **$0**.

Steps:
1. Read `SKILL.md`.
2. Validate the config: `python3 -c "import json,sys; c=json.load(open('scripts/config.example.json')); assert len(c['scenes'])>=8; assert len(c['product_grid']['images'])>=3; assert c['kling']['cfg_scale']==0.5; assert c['voice']['model']=='eleven_v3'; print('config OK', len(c['scenes']),'scenes')"`.
3. Confirm `scripts/PIPELINE.md` maps every phase (character-lock → gen_keyframes.py,
   clean plate → clean_plate.py, motion → kling_i2v.py, overlays → remotion/, grid →
   build_scene08.py, VO → render_vo.py, captions → build_captions.py, assembly →
   build_master.py, cut-down → build_30s.py).
4. Probe the demo render:
   `ffprobe -v error -select_streams v:0 -show_entries stream=width,height,r_frame_rate,codec_name -of default=noprint_wrappers=1 demo/finals/spoiled-child-perfect-morning-routine.mp4`
   → expect `width=1080 height=1920 r_frame_rate=30/1 codec_name=h264`, duration ≈ 30s,
   and an `aac` audio stream.
5. For the FULL paid path, port the source `working/` scripts into a new brand project and
   run phases 1→6 with FAL + ElevenLabs keys — only with an approved config + spend gate.

Pass/fail: pass when the config parses with ≥8 scenes + a ≥3-image real-product grid +
Kling cfg 0.5 + eleven_v3 VO, PIPELINE.md covers every phase, and the demo render probes
1080×1920 / 30fps / h264 / ~30s / aac. Gate any paid gen behind explicit approval.
