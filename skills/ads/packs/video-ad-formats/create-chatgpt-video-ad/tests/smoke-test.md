# Smoke test — create-chatgpt-video-ad

End-to-end pipeline run using the bundled canonical example
(`examples/smoke-app-question/`), without any brand customization. The example
is a "Hey what's happening in this app?" question with a short bulleted ChatGPT
answer that streams in.

```bash
# from the molecule folder
cd skills/ads/packs/video-ad-formats/create-chatgpt-video-ad

# 1) Record the chat as ONE continuous video (writes master-chat.mp4 + master-chat.sfx.json)
NODE_PATH=../../../atoms/messaging/create-chatgpt-mockup/node_modules \
  node examples/smoke-app-question/clips/record-master.js

# 2) Stitch (passes the silent master straight through when there are no SFX cues)
bash examples/smoke-app-question/scripts/stitch.sh
```

## Pass criteria

- `examples/smoke-app-question/clips/master-chat.page.html` is written (the
  single rendered page — proof the chat is recorded in one session, not
  scene-by-scene).
- `examples/smoke-app-question/clips/master-chat.mp4` exists, decodes, is
  **750×1624**, and is ≥10s (the canonical timeline is ~11s plus a ~1.5s tail).
- `examples/smoke-app-question/clips/master-chat.sfx.json` exists and equals
  `{"cues": []}` — the molecule ships **silent** by default (the four SFX wavs in
  `assets/sfx/` are retained for the optional subliminal pass only).
- `examples/smoke-app-question/edits/master-final.mp4` exists and decodes. With
  zero cues it is a stream-copy of `master-chat.mp4`, so it is **750×1624** and
  has a video stream (no audio stream is expected in the silent default).

## Quick checks

```bash
ffprobe -v error -show_entries stream=codec_name,width,height \
  -of default=nw=1 examples/smoke-app-question/clips/master-chat.mp4
# -> h264, width=750, height=1624

python3 -c "import json;print(json.load(open('examples/smoke-app-question/clips/master-chat.sfx.json'))['cues'])"
# -> []

test -s examples/smoke-app-question/edits/master-final.mp4 && echo OK
```

## Notes

- `record-master.js` self-locates the `create-chatgpt-mockup` atom by walking up
  to `create-chatgpt-mockup/generate.js`, so it runs the
  same whether copied into a real `<brand>/ads/video-NN-...` project or from this
  example folder.
- Requires a working ffmpeg + Playwright (Chromium) on the machine. The
  committed `clips/master-chat.mp4` and `edits/master-final.mp4` in the example
  are git-LFS-tracked sample artifacts; re-running the commands above regenerates
  them locally.
