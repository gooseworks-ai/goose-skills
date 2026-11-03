# Smoke test — brand-identity-reveal

Fast structural checks (no paid calls).

1. **Recipe is valid + within cap**
   ```bash
   python3 -c "import json; r=json.load(open('one-shot-videos/create-brand-identity-reveal-video-from-refs/recipe.json')); \
   assert r['format']=='brand-identity-reveal'; assert 'render-brand-identity-reveal' in r['atoms']; \
   assert len(json.dumps({'recipe':r}))<65536; print('recipe OK')"
   ```
2. **Scripts present**: `scene.html`, `render_art.py`, `measure_frame.py`, `recrop.py`,
   `composite.py`, `build_video.sh`, `config.example.json`, `PIPELINE.md` all exist under `scripts/`.
3. **Renderer runs on the reference** (free, needs python playwright + a plate):
   - `render_art.py` produces 11 `art/art_std_NN.png` at the frame-interior aspect.
   - `measure_frame.py` prints 4 corners + writes `bg/corners.txt`.
   - `composite.py` produces 11 `frames_v2/frame_NN.png` at 1080x1920.
4. **Assembly**: `build_video.sh` produces an mp4 whose `ffprobe` duration ≈ sum(beats.seconds)
   and whose audio stream is present (music) with no speech (Whisper via `watch`).

PASS = all four; no invented copy in any rendered poster.
