# Smoke Test

Trim each per-world clip to its grid duration (arrival 4.5 / macro 3.5, re-encode 720x1280 24fps yuv420p, audio stripped) ; Playwright screenshot `end_card.html` over the AI flat-lay background → 3.0s static end-card clip (HTML text, never AI-rendered) ; hard-cut concat the 6 clips in scene order + the end card ; mux one instrumental bed with `afade` in/out + `loudnorm I=-16:TP=-1.5:LRA=11`, AAC 192k, clamp 27.0s → the web master.

Pass when the FREE assembly runs to a valid 720x1280, ≈27.0s (±0.3s), 24fps, h264 yuv420p master with an AAC music stream present, NO speech and NO burned captions in S01–S06 (Whisper the audio → music only), and legible HTML end-card text. Assembly (trim + end-card overlay + concat + mux) is FREE.

GAP to confirm at review — the six per-world clips are generated via Higgsfield Marketing Studio (`marketing_studio_video/product_showcase`, imported-product grounding, sealed-bottle safety block per prompt), which is NOT yet a fetchable proxy capability (`create-video-higgsfield` does not exist; `create-video-fal` is FAL, not Higgsfield). The end-card background (create-image-fal / NB2) and music (create-music-elevenlabs) are paid proxy-routed calls; only their local composite/mux is FREE here.
