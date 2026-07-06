# Expected Output

## Artifacts
- `finals/master-<aspect>-<concept>-<model>.mp4` — 1080×1920 (or 1080×1080), 9–12s,
  **h264** yuv420p crf20 +faststart 30fps (+ AAC 192k music). Pexels runs yield
  N = concepts; a T2V comparison yields N = concepts × models.
- `assets/product-cutouts/*.png` — birefnet-stripped clean-alpha cutouts (≥20% transparent,
  ≤8% partial-edge; no halo/shadow).
- `source/t2v-outputs/*.mp4` — the BG variants (Pexels stock OR T2V).
- `assets/text-overlays/{cold-open-card,end-card-annotated}-9x16.png` — the overlays.
- `assets/music/*` — the ElevenLabs bed (raw + loudnorm-processed).

## Visual shape (V-CARD, 10.5s)
| t | What's visible |
|---|---|
| 0.0–1.5s | BG only — kinetic real-time motion (not slow-mo), dimmed per palette |
| 1.5–3.0s | Cold-open card (e.g. "100% / PROVEN / RESULTS"), Boska Black cream, dead-center |
| 3.0–4.6s | First cutout, vertically centered, ~75% frame width |
| 4.6–6.2s | Second cutout (squat jar), vertically centered, ~65% width — SAME mid-line |
| 6.2–7.8s | Third cutout, vertically centered, ~75% width |
| 7.8–10.5s | Annotated specimen-sheet end card (EST year / rule / brand logo / rule / ingredient / positioning / claim) |

## Close + audio
- Instrumental music bed, no VO, no lyrics, no captions; normalized ~-18 LUFS.
- Audio codec AAC ≈ 192 kbps (NOT 1 kbps — that's the silent-map bug).

## Non-goals
- No talking head, no dialogue, no captions.
- No people/hands/products/text/logos baked into the BG (only the overlay text/logos show).
- No slow-motion BG. No bottom-anchored cutouts. No bare-logo end card.
