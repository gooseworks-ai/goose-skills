# render-3d-product-showcase scripts — the FREE assembly

`render-3d-product-showcase` is the **deterministic, $0 assembly stage** of the 3D
product-showcase format. The paid stages — Beats 1 & 2 (Marketing Studio hero rotation + macro
push-in), Beat 3 (Veo3 i2v physics reveal), and the one instrumental bed — are separate
capabilities (`create-video-fal`, `create-music-elevenlabs`). This capability spends nothing:
it takes the four delivered beats + the brand wordmark and stitches the finished master. Re-cuts
(a swapped end card, a re-timed beat, a re-mixed bed) reuse the existing beats and cost **$0**.

`config.example.json` is the worked example (DIBS Beauty "Desert Island Duo", ~14s 720×1280).
`PIPELINE.md` maps every config block to its source step. This README documents the FREE
assembly pieces that `render-3d-product-showcase` owns.

## 1. Beat 1 last-frame extract — the shared anchor

Extract Beat 1's last frame once (`ffmpeg -sseof -0.1 -i beat1.mp4 -frames:v 1
beat1_last_frame.png`). It is the shared anchor: it seeds the Veo3 Beat 3 (paid, upstream) AND
backs the Beat 4 end-card hyperframe (below). Extracting it once keeps the product + lighting
identical across the reveal and the close, so the label never AI-drifts.

## 2. End card — Playwright/PIL hyperframe from the real wordmark, no AI text

Beat 4 is a deterministic Playwright hyperframe: Beat 1's stilled last frame + a scrim + a
Playfair headline that spring-rises + the brand's REAL wordmark SVG that fades in. Render at
1080×1920, then ffmpeg-scale to 720×1280 (matching the viewport to the output dims clips the
right edge). The brand text is **never** AI-rendered — a diffusion model garbles a wordmark, so
the lockup is composited from the real asset every time.

## 3. Per-beat normalize + hard-concat

Each beat is normalized to the brand canvas: strip the MS auto-audio (`-an` — otherwise the MS
track leaks into the master), scale + pad to 720×1280 with the brand `bg` pad color, 24fps,
yuv420p, crf 18. The normalized segments are hard-concatenated (concat demuxer) in beat order —
no dissolves.

## 4. FFmpeg music mix

FFmpeg mixes one ElevenLabs instrumental bed under the concatenated beats: `afade` in 0.3s /
out 0.5s + `loudnorm I=-16 TP=-1.5 LRA=11`, atrimmed to the master duration. Music-only — no VO,
no second bed. Output is a 720×1280 h264 + aac master. Deterministic, no paid calls, no keys.
