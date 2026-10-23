# Smoke test — render-apple-notes-chat

Verifies the free assembly end to end from the bundled example config. No paid
calls. Needs Node 18+, `npm install` (Playwright Chromium) and ffmpeg/ffprobe.

## Setup

```bash
cd scripts
npm install
npx playwright install chromium
mkdir -p /tmp/notes-smoke
```

## Run

```bash
node record-notes.js    --config config.example.json --out-dir /tmp/notes-smoke --still-only
node record-notes.js    --config config.example.json --out-dir /tmp/notes-smoke
node render-end-card.js --config config.example.json --out-dir /tmp/notes-smoke
bash stitch.sh --notes /tmp/notes-smoke/notes.mp4 --end /tmp/notes-smoke/endcard.mp4 \
     --out /tmp/notes-smoke/master.mp4
```

## Expect

- `note-hook.png` — the note's title, a caret on the empty first line, keyboard up.
- `note-still.png` — all five lines typed, scrolled so the last line sits above the keyboard.
- `notes.mp4` — 1080×1920, 30fps, ~16 s. Lines type character by character with key pops;
  the note scrolls up once it fills; the caret blinks in the pauses.
- `endcard.mp4` — 1080×1920, 4.2 s. The card slides in; four checks draw one after another;
  "Brightside Oats" wordmark and the CTA pill below.
- `master.mp4` — ~19.9 s, a 0.3 s crossfade between the two, silent (no `--music`).
  With `--music`, integrated loudness ≈ −14 LUFS and peaks ≤ −1.5 dBFS.

## Failure checks

- A line containing "—" → `record-notes.js` exits 1 and names the line.
- An `end_card` with no `logo` and no `wordmark` → `render-end-card.js` exits 1.
