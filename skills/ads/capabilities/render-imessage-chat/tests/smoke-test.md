# Smoke test — render-imessage-chat

Verifies the free assembly end-to-end from the bundled example config. No paid
calls. Needs: Node, `npm install` (Playwright Chromium), and ffmpeg/ffprobe.

## Setup

```bash
cd scripts
npm install
npx playwright install chromium
# The example config references assets/product-cover.jpg + assets/flat-lay-bg.jpg —
# drop any two JPEGs there, or remove `background_image` and swap the attachment
# `src` for a local image to run fully offline.
mkdir -p /tmp/imsg-chat-smoke
```

## Run

```bash
node record-chat.js    --config config.json --out-dir /tmp/imsg-chat-smoke
node render-end-card.js --config config.json --out-dir /tmp/imsg-chat-smoke
bash stitch.sh \
  --chat /tmp/imsg-chat-smoke/master-chat.mp4 \
  --end  /tmp/imsg-chat-smoke/scene-end-endcard.mp4 \
  --sfx  /tmp/imsg-chat-smoke/master-chat.sfx.json \
  --out  /tmp/imsg-chat-smoke/master-final.mp4 \
  --also-1x1
```

## Expect

- `master-chat.mp4` — 1080×1920, ~22–24s, one continuous take of the thread
  animating in. The attachment reads as a URL-preview rich link (image flush on a
  gray meta card with the title + domain + chevron), NOT a caption below a bare
  image. No bubble text bleeds outside its bubble.
- `scene-end-endcard.mp4` — 1080×1920, ~2.5s designed end card (wordmark + ⭐
  proof row + trust trio + CTA pill).
- `master-final.mp4` — chat crossfades into the end card; audio has send/receive
  pops on each bubble (and the ducked bed if `--music` was passed). `-1x1` variant
  is 1080×1080.
- `ffprobe` confirms dimensions/duration; run the `watch` skill on the master to
  confirm beat order, the rich link, and the end card.

## Fail signals

- Attachment caption centered/floating below the image → the injected rich-link
  style didn't apply (check `record-chat.js` `injectedStyle`).
- Text overflowing a bubble → the thread has an over-long line; split it into
  multiple bubbles (authoring rule).
- `Cannot find module 'playwright'` → run `npm install` in `scripts/`.
