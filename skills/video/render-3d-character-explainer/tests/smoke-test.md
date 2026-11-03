# Smoke test — render-3d-character-explainer

Verifies the free ffmpeg assembly end-to-end. No paid calls. Needs: Python 3 and
ffmpeg/ffprobe. You supply per-scene clips + a narration track (restyle mode) or per-scene
VO mp3s (original mode). Any 1080×1920 mp4s and any audio track work for a smoke run; a
scene with no clip must have a `keyframe` PNG so the static-still fallback fires.

## Setup

```bash
cd scripts
mkdir -p /tmp/3dchar-smoke/clips /tmp/3dchar-smoke/keyframes /tmp/3dchar-smoke/audio
# synthetic color clips + a still keyframe + a silent narration track:
ffmpeg -y -f lavfi -i color=c=red:s=1080x1920:d=3 -r 30 /tmp/3dchar-smoke/clips/clip-01.mp4
ffmpeg -y -f lavfi -i color=c=green:s=1080x1920:d=3 -r 30 /tmp/3dchar-smoke/clips/clip-02.mp4
# scene 03 has NO clip -> exercises the static-still fallback from its keyframe
ffmpeg -y -f lavfi -i color=c=blue:s=1080x1920:d=1 -frames:v 1 /tmp/3dchar-smoke/keyframes/scene-03.png
# total audio = sum of the three windows (2.0 + 2.5 + 1.5 = 6.0s)
ffmpeg -y -f lavfi -i anullsrc=r=44100:cl=stereo -t 6.0 /tmp/3dchar-smoke/audio/source-audio.mp3
```

Write `/tmp/3dchar-smoke/config.json`:

```json
{
  "audio_mode": "restyle",
  "source_audio": "/tmp/3dchar-smoke/audio/source-audio.mp3",
  "captions_ass": "/tmp/3dchar-smoke/captions.ass",
  "scenes": [
    { "id": "01", "clip": "/tmp/3dchar-smoke/clips/clip-01.mp4", "keyframe": "/tmp/3dchar-smoke/keyframes/scene-03.png", "target_sec": 2.0, "caption": "Six types." },
    { "id": "02", "clip": "/tmp/3dchar-smoke/clips/clip-02.mp4", "keyframe": "/tmp/3dchar-smoke/keyframes/scene-03.png", "target_sec": 2.5, "caption": "One per persona." },
    { "id": "03", "clip": "/tmp/3dchar-smoke/clips/missing.mp4", "keyframe": "/tmp/3dchar-smoke/keyframes/scene-03.png", "target_sec": 1.5, "caption": null }
  ]
}
```

## Run

```bash
# 1) per-scene captions (libass) — run BEFORE compose
python3 make_captions.py --config /tmp/3dchar-smoke/config.json \
                         --out /tmp/3dchar-smoke/captions.ass

# 2) assemble the master
python3 compose.py --config /tmp/3dchar-smoke/config.json \
                   --work-dir /tmp/3dchar-smoke \
                   --out /tmp/3dchar-smoke/master.mp4

# 3) confirm 9:16, 30fps, duration == sum of the windows (6.00s)
ffprobe -v error -select_streams v:0 \
  -show_entries stream=width,height,r_frame_rate \
  -show_entries format=duration -of default=nw=1 /tmp/3dchar-smoke/master.mp4
```

## Expect

- `make_captions.py` writes `captions.ass` — one cue per scene WITH a caption (scene 03
  suppressed), `start = scene_start + 0.08s`.
- `compose.py` prints per-scene retime lines, a `scene-03 STATIC-STILL fallback` line, the
  total runtime, a final `WROTE ... (expected ~6.00s, delta ±...)`, and
  `STATIC-STILL FALLBACK SCENES: 03`.
- `master.mp4` is `width=1080`, `height=1920`, `r_frame_rate=30/1`, and its duration is
  within ±0.1s of `sum(scenes[].target_sec)` (6.00s here).
- Run the `watch` skill on `master.mp4` for a real (non-synthetic) run: the human protagonist
  holds across scenes, each persona is on-model, the cast-reveal matches the N list items, the
  product beat shows the REAL box (blank label in the plate, real box composited), narration
  lands beat-for-beat, and captions don't collide with on-screen text.

## Fail signals

- Concat drops frames / audio desyncs → a segment wasn't re-encoded to 30fps (all segments
  MUST be `libx264 -r 30` before the concat demuxer). compose.py always re-encodes, so this
  means a source clip fed the wrong stream — check the ffprobe output.
- Duration far off the summed windows → a `target_sec` wasn't the source-inherited window
  (restyle) or the measured VO duration (original); the trims must sum to the audio length.
- Master has letterbox bars from a mismatched-aspect clip → expected: decrease+pad pads to the
  canvas colour rather than cropping. If the bars are the WRONG colour, set `pad_color`.
- `scene-NN: no usable clip AND no keyframe fallback` → a scene has neither a valid `clip` nor
  a `keyframe`; every scene needs a keyframe so the static-still fallback can fire.
- Original mode loudness off (not ~-14 LUFS) → the VO/music busses were bypassed; confirm the
  `loudnorm` filters ran and `amix normalize=0`.
```
