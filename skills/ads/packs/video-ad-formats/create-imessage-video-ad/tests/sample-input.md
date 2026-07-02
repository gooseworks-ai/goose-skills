# Sample input — create-imessage-video-ad

## Inputs envelope

```json
{
  "brief": "CatchBack — graded baseball card concierge. Hook: someone screenshots a card listed at $312. CTA code: FREEPACK.",
  "output_folder": "<your-project>/ad-runs/run-01-imessage/",
  "peer_persona": {
    "name": "Tyler",
    "monogram": "TY",
    "avatar_bg_hex": "#9a9a9e"
  },
  "screenshot_asset": "<your-project>/source/screenshots/card-312.png",
  "bubbles": [
    {"id": "b01", "from": "me", "type": "attachment", "src": "screenshot_asset", "delivered": true},
    {"id": "b02", "from": "peer", "text": "bro no way", "typing_before": true},
    {"id": "b03", "from": "peer", "text": "is that on an app??"},
    {"id": "b04", "from": "me", "text": "yeah CatchBack. send your card, they grade + list. use [[link:FREEPACK]]"},
    {"id": "b05", "from": "peer", "text": "wait this is real?", "typing_before": true},
    {"id": "b06", "from": "peer", "text": "bet"}
  ],
  "composer_drives": [
    {"bubble_id": "b04", "text": "yeah CatchBack. send your", "dur_sec": 1.4}
  ],
  "end_card": {
    "wordmark_svg": "assets/catchback-logo.svg",
    "code": "FREEPACK",
    "tagline": "send a card. get a grade."
  },
  "music_bed": "<your-project>/audio/music-bed.mp3"
}
```

## Notes

- `bubbles` mirror the schema documented in the SKILL's `## Inputs` section.
- Wrap any auto-detected code/URL in `[[link:CODE]]` so the iOS link-detector underline renders.
- Pre-bundled SFX in `assets/sfx/imessage-{send,receive}.mp3` cover the audio cues — no extra input needed.
- `<your-project>/` is a placeholder for the brand workspace folder.
