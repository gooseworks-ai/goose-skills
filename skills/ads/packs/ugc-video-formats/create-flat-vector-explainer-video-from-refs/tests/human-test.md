# Human Test

## Recipe + demo check ($0)
```
cd one-shot-videos/create-flat-vector-explainer-video-from-refs
python3 -c "import json; c=json.load(open('scripts/config.example.json')); print(len(c['scenes']),'scenes,',len(c['product_grid']['images']),'grid products, VO',c['voice']['model'])"
ffprobe -v error -show_entries stream=width,height,codec_name -show_entries format=duration \
  -of default=noprint_wrappers=1 demo/finals/spoiled-child-perfect-morning-routine.mp4
```
Then `/watch` `demo/finals/spoiled-child-perfect-morning-routine.mp4` and confirm it
matches the shape below.

## Full paid path (gated — runs in a brand project folder)
Port the source `working/` scripts (see `scripts/PIPELINE.md`) into a new brand project,
supply an approved `config.json`, real product webps, and FAL + ElevenLabs keys, then run
phases 1→6: `gen_keyframes.py` → `clean_plate.py` → `kling_i2v.py` (TEST one first) →
Remotion overlay + `build_scene08.py` → `render_vo.py` + `gen_music.py` + mix →
`build_master.py` → `build_30s.py`.

## Acceptance
- [ ] The creator-character is **consistent** across every character scene (hair, wardrobe, skin).
- [ ] Character scenes show **localized real motion** (blink/hand/spoon), not a static pan; the
      flat-vector 2D style holds (no photoreal drift).
- [ ] Every numeral / chip / tagline is **crisp DOM type** (not warped AI text) and reads correctly.
- [ ] The closing grid shows **N distinct real products** (no AI dupes), correct aspect.
- [ ] VO is full-sentence, VO-forward over the music; captions are word-by-word and don't
      collide with the slate/grid/CTA on-screen text.
- [ ] Reads like a premium brand explainer (Spotify/Anchor lineage) — not an obvious AI ad.
- [ ] The 30s cut is 1080×1920 / ~30s / h264 / aac and shows moving (not frozen) characters.
