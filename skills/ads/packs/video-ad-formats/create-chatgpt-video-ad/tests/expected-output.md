# Expected output — create-chatgpt-video-ad

For the canonical `examples/smoke-app-question/` (thread.json + timeline.json):

| File | Dim / dur | What you'll see |
|---|---|---|
| `clips/master-chat.page.html` | — | The single page the recorder renders: full ChatGPT screen with all messages `data-pending="1"` (hidden) and the keyboard mounted. Proof the run is one continuous session. |
| `clips/master-chat.mp4` | 750×1624 / ~11s | Keyboard up; the question types into the composer (caret visible, ~2.4s). On send-tap the user bubble pops, the keyboard slides down, the header right-cluster swaps `personPlus/dottedCircle → edit/more` — all in one beat. One gray dot holds ~500ms, then the assistant bullets stream in word-by-word with a soft opacity ramp while the view auto-scrolls. ~1.5s hold at the end. Silent. |
| `clips/master-chat.sfx.json` | — | `{"cues": []}` — molecule ships silent by default. (If the optional SFX pass were enabled, this would carry `key-tap` per typed word, `send-tap` on send, `stream-tick` every ~12 words, and one `response-done`.) |
| `edits/master-final.mp4` | 750×1624 / ~11s | With zero cues, a stream-copy of `master-chat.mp4` — same frames, video stream only (no audio track). |

Optional export variants (State 3 in SKILL.md), if you run them:

| File | Dim | Notes |
|---|---|---|
| `meta-upload/master-9x16-1080.mp4` | 1080×1920 | `scale=1080:1920:flags=lanczos` of the master; tag as `9:16` on upload. |
| `meta-upload/master-1x1-720.mp4` | 720×720 | `crop=720:720:0:280` center-square. |

Visual identity checks (eyeball any frame of `master-chat.mp4`):

- Light-mode ChatGPT chrome: status bar with `9:41`, plain "ChatGPT" title, composer pill reading "Ask ChatGPT".
- The keyboard is the iOS QWERTY layout (suggestion bar `I` / `The` / `I'm`, alpha rows, shift/backspace, 123/space/return) — visible only while typing, gone during streaming.
- Header right cluster shows `personPlus + dottedCircle` before send, `edit + more` after.
- Exactly **one** small dark-gray dot during the thinking beat (never three).
- Assistant body reveals word-by-word, left-to-right then top-to-bottom; bullets (`* `) render as a list.
- **No** OpenAI spiral logo above the assistant message title (the spiral is empty-state only).
- No micro-flicker or scene cut anywhere — one continuous take.

Programmatic checks:

```bash
ffprobe -v error -show_entries stream=codec_type,codec_name,width,height \
  -of default=nw=1 examples/smoke-app-question/clips/master-chat.mp4
# video / h264 / 750 / 1624

python3 -c "import json;d=json.load(open('examples/smoke-app-question/clips/master-chat.sfx.json'));assert d['cues']==[],d;print('silent OK')"
```
