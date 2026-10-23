# Smoke test — render-chatgpt-chat

Verifies the free assembly end-to-end from the bundled example config. No paid
calls. Needs: Node, `npm install` (Playwright Chromium), and ffmpeg/ffprobe.

## Setup

```bash
cd scripts
npm install
npx playwright install chromium
mkdir -p /tmp/gpt-chat-smoke
```

## Run

```bash
node record-chat.js     --config config.example.json --out-dir /tmp/gpt-chat-smoke
node render-end-card.js --config config.example.json --out-dir /tmp/gpt-chat-smoke
bash stitch.sh \
  --chat /tmp/gpt-chat-smoke/master-chat.mp4 \
  --end  /tmp/gpt-chat-smoke/scene-end-endcard.mp4 \
  --sfx  /tmp/gpt-chat-smoke/master-chat.sfx.json \
  --out  /tmp/gpt-chat-smoke/master-final.mp4 \
  --pad-color "#ffffff" \
  --also-1x1
```

## Expect

- `master-chat.mp4` — 750×1624 (~9:19.5), ~12s, ONE continuous take: the user
  types with the keyboard up, taps send (bubble + keyboard-down + header-swap in one
  beat), one gray loading dot for ~500ms, then the assistant answer streams in
  word-by-word. No micro-flicker / scene cuts.
- `master-chat.sfx.json` — `{ "cues": [ … ] }` with key-tap / send-tap / stream-tick
  / response-done entries and **no cue on the loading dot**.
- `scene-end-endcard.mp4` — 1080×1920, ~2.5s designed end card (wordmark + ⭐ proof
  row + trust trio + CTA pill).
- `master-final.mp4` — chat crossfades into the end card (padded to 750×1624 with the
  card bg so the seam is invisible); audio carries the subliminal SFX (and the ducked
  bed if `--music` was passed). `master-final-1x1.mp4` is a 750×750 center crop.
- `ffprobe` confirms dimensions/duration; run the `watch` skill on the master to
  confirm beat order, the single loading dot, and word-by-word streaming.

## Fail signals

- Chat looks horizontally fat/stretched → an export forced a non-9:19.5 ratio onto
  the 750×1624 master. Never scale the chat to a different ratio (the 1:1 crop is the
  only legitimate shape change).
- Assistant text appears all at once → the assistant message is missing
  `"stream": true` (the mockup wraps words only when streaming).
- Keyboard visible while the answer streams → a `keyboard-hide` event is missing at
  the send-tap `t`.
- Three dots instead of one → wrong row type; use a single `loading-dot` message.
- Visible seam under the end card → `--pad-color` didn't match `end_card.bg`.
- `Cannot find module 'playwright'` → run `npm install` in `scripts/`.
