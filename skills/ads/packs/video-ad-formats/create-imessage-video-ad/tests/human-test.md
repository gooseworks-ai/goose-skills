# Human test — create-imessage-video-ad

## Setup

1. Provide the inputs documented in `sample-input.md` (brief, peer persona, 6-bubble script,
   one screenshot asset, CTA code, an optional music bed).
2. Adapt `scripts/record-master.template.js` — change only the `TIMELINE` array.
3. Run the four-step flow from `## Workflow` in SKILL.md
   (record → render end card → stitch → export variants).

## Checklist

1. Open `edits/master-final.mp4` and scrub from start to finish.
2. Confirm no micro-flicker between bubbles (single continuous recording).
3. Confirm the typing-dots bubble appears silently (no chime), and the receive
   chime fires only when the actual text bubble lands.
4. Confirm FREEPACK is link-detector underlined in its containing bubble.
5. Confirm the chat→end-card transition is a 300ms crossfade — not a hard cut
   and not a slow fade.
6. Confirm the end card is static (no zoom-pan drift) and uses the real
   wordmark SVG (not CSS-styled text).
7. Confirm audio peaks at 0dB with `ffmpeg -af volumedetect -i edits/master-final.mp4 -f null -`
   and the mean is roughly -10 to -12dB.

## Optional — reroll

If pacing feels off, edit the `TIMELINE` event times only and re-run the record →
stitch loop. No other steps need re-running.
