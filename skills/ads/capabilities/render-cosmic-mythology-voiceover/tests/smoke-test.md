# Smoke Test

Given the spoken VO (atempo mp3) and N curated cosmic stills in ONE ethereal deep-indigo + gold
look, the per-cut weight array, and the ONE hook line, `render-cosmic-mythology-voiceover`
assembles the master: distribute the cuts across the VO duration by the weighted formula
(`cut_dur = VO_dur × weight / Σweights`), Ken-Burns-render each still (fade-in first / fade-out
last), ffmpeg-concat, composite the VO under the picture, fade the hook line on over the open, and
burn Whisper captions bottom → 1080×1920 h264+aac (~31s).

Pass when the assembly runs to a valid MP4 and:
- the cuts follow the weight ratios (emotional beats hold longer, setup cuts shorter); Ken-Burns
  zoom per still with fade-in on the first cut and fade-out on the last;
- the spoken VO carries end to end (no gaps) — the VO is the entire narrative, no talking head and
  no sung song;
- the ONE cosmic look holds across every still (no photoreal drift, no wrong palette, no in-world
  text — the reel's only text is the hook + captions);
- the ONE hook line fades on/off over the open (not persistent, not in-world); captions are burned
  bottom, white, tracking the VO;
- **no paid call is made** — the VO and the stills come from the paid capabilities
  (create-vo-elevenlabs / create-image-fal); this assembly is $0 (the caption burn has a free local
  Whisper + ffmpeg fallback to the VEED tier) and a re-cut reuses the existing assets.
