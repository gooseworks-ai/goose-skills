# Smoke test — create-imessage-video-ad

## Scenario

Given a minimal brief (brand name, peer name, 6-bubble script, attachment screenshot, CTA code `FREEPACK`),
adapt the canonical templates and produce a 20-second 9:16 master MP4 with one continuous Playwright
recording of the chat plus a static end card.

## Minimal inputs

- `brief.md` — one-paragraph product blurb + CTA code `FREEPACK`
- `assets/hook-screenshot.png` — the image that gets attached in bubble 1
- `threads/full-thread.json` — 6-bubble script (`me`/`peer`, with one `typing-pop` before peer's first reply)
- `end-card.template.html` (abstract glow) selected because brand voice is playful

## Steps to prove it works

1. Adapt the template at `scripts/record-master.template.js` — paste the 6-event `TIMELINE`.
2. Run `node clips/record-master.js` to produce `master-chat.mp4` + `master-chat.sfx.json`.
3. Run `node clips/render-end-card.js` to produce `end-card.png` and the static 3.5s `end-card.mp4`.
4. Run `bash edits/stitch.sh` to mux SFX + music + crossfade to `edits/master-final.mp4`.

## Expected

- `edits/master-final.mp4` exists, plays end-to-end with no micro-flicker mid-chat.
- Audio peaks at 0dB, no SFX on any `typing-pop`, FREEPACK underlined in its bubble.
- Crossfade chat→end-card is 300ms; end card is static.
