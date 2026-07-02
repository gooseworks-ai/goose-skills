# Verifier — create-chatgpt-video-ad

Shared checks (relative to this folder):

- `../../../../verifiers/video/verify-playable-video.md` — the master decodes,
  is non-empty, and has a video stream.
- `../../../../verifiers/package/verify-output-manifest.md` — confirm `clips/` and
  `edits/` are populated (and `meta-upload/` if export variants were produced).

## Automated

- **Continuous take:** `clips/master-chat.page.html` exists (single rendered page),
  and there is exactly **one** `clips/master-chat.mp4` — no `scene-*.mp4` fragments
  in `clips/`. The chat must be one recording, never concatenated scenes.
- **Playable master:** `clips/master-chat.mp4` exists, non-empty, and `ffprobe`
  decodes it.
- **Dimensions:** `master-chat.mp4` is **750×1624** (the atom's native viewport at
  `deviceScaleFactor: 2`):
  ```bash
  ffprobe -v error -show_entries stream=width,height -of csv=p=0 \
    examples/smoke-app-question/clips/master-chat.mp4   # -> 750,1624
  ```
- **Duration:** master is ≥10s (canonical timeline ~11s incl. the ~1.5s tail).
- **Silent-by-default contract:** `clips/master-chat.sfx.json` parses to
  `{"cues": []}`, and `edits/master-final.mp4` is a stream-copy of the master —
  same 750×1624 dims, video stream present, **no audio stream**.
  ```bash
  python3 -c "import json;d=json.load(open('examples/smoke-app-question/clips/master-chat.sfx.json'));assert d['cues']==[],d"
  ffprobe -v error -select_streams a -show_entries stream=codec_type -of csv=p=0 \
    examples/smoke-app-question/edits/master-final.mp4   # -> (empty: no audio)
  ```
- **Export variants (only if produced):** `meta-upload/master-9x16-1080.mp4` is
  1080×1920; `meta-upload/master-1x1-720.mp4` is 720×720.

## Manual (watch the output)

- Keyboard is visible only while typing; gone during streaming.
- Send-tap is one beat: bubble pop + keyboard-down + header swap together.
- Exactly one gray loading dot for ~500ms — not three.
- Response streams word-by-word with the opacity ramp; bullets render as a list.
- No OpenAI spiral logo above the assistant message title.
- No micro-flicker or scene cut anywhere.
- If the optional SFX pass is enabled: cues are subliminal and there is **no** sound
  on the loading dot.

If a shared verifier referenced above is missing, the human acceptance check in
`human-test.md` is authoritative.
