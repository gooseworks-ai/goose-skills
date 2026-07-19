# Smoke Test

Given the spoken VO (atempo mp3) and N curated stills in ONE coherent look (the WishAstro demo is
deep-indigo + gold cosmic; the look is brand-swappable), the per-cut weight array, and the ONE hook
line, `scripts/render.py` assembles the master: distribute the cuts across the VO duration by the
weighted formula (`cut_dur = VO_dur × weight / Σweights`), Ken-Burns-render each still (fade-in
first / fade-out last), ffmpeg-concat, composite the VO under the picture, fade the hook line on
over the open, burn captions bottom, and (optionally) append a brand end card → 1080×1920 h264+aac.

Run:
```bash
python3 scripts/render.py --config config.json --vo <vo_atempo.mp3> \
  --stills-dir <stills/> --out final.mp4 [--words words.json] [--endcard endcard.png]
```

Pass when `render.py` runs to a valid MP4 and:
- the cuts follow the weight ratios (emotional beats hold longer, setup cuts shorter); Ken-Burns
  zoom per still with fade-in on the first cut and fade-out on the last;
- the spoken VO carries end to end (no gaps) — the VO is the entire narrative, no talking head and
  no sung song;
- the ONE look holds across every still (no drift, no wrong palette, no in-world text — the reel's
  only text is the hook + captions, then any end card);
- the ONE hook line fades on/off over the open (not persistent, not in-world); captions are burned
  bottom, white, tracking the VO;
- it runs on a **stock ffmpeg with NO `drawtext`/`libass`** (hook + captions are PIL PNG overlays)
  and needs only ffmpeg + Pillow;
- **no paid call is made** — the VO and the stills come from the paid capabilities
  (create-vo-elevenlabs / create-image-fal); this assembly is $0 and a re-cut reuses the existing
  assets.
