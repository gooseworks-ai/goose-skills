# Expected output — create-imessage-video-ad

## Folder structure produced

```
<your-project>/ad-runs/run-01-imessage/
├── storyboard.html
├── threads/full-thread.json
├── assets/<screenshot>.png
├── audio/
│   ├── sfx/imessage-{send,receive}.mp3
│   └── music-bed.mp3
├── clips/
│   ├── record-master.js
│   ├── master-chat.mp4       # 17–22s continuous chat recording
│   ├── master-chat.sfx.json  # deterministic cue list
│   ├── end-card.html
│   ├── render-end-card.js
│   ├── end-card.png
│   └── scene-09-endcard.mp4  # static end card MP4 for stitching
├── edits/
│   ├── stitch.sh
│   └── master-final.mp4      # 720×1280, ~21s, h264 + AAC, 0dB peak
└── meta-upload/
    ├── master-9x16-1080.mp4
    └── master-1x1-720.mp4
```

## Master MP4 properties

- 720×1280 source master (also exported at 1080×1920 and 720×720 1:1).
- Duration in the 17–22 second range (chat) + 3.5s end card.
- One single cut: chat → end card (300ms crossfade). No mid-chat cuts.
- Audio peak at 0dB, mean -10 to -12dB; SFX layer cleanly above music bed.

## Acceptance bar

- Bubbles pop in the order defined in `full-thread.json`.
- Every `typing-pop` event has `sfx: null` in `master-chat.sfx.json`.
- FREEPACK (or your CTA code) appears link-detector underlined in its bubble.
- End card is static (no Ken-Burns drift) and uses the real wordmark SVG.
