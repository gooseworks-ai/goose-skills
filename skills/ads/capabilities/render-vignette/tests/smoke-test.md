# Smoke Test

render_overlays.py (cold-open card + annotated end card PNGs) ; composite_variants.py (BG dim + vertically-centered cutouts + overlays → silent master) ; music_and_mux.py (loudnorm + separate-pass mux, `-map 0:v:0 -map 1:a:0`) — 1080x1920, 9-12s, 30fps, h264 yuv420p crf20 +faststart, AAC 192k ~-18 LUFS.

Pass when the assembly scripts run to a valid master mp4 with real (non-1kbps) audio. Assembly (overlays + composite + mux) is FREE. The birefnet cutout (`strip_product_backgrounds.py`) and the music generation are paid FAL/ElevenLabs calls that in prod route through create-image-fal / create-music-elevenlabs (proxy-routed, bills the agent) — not a provider SDK's default host.
