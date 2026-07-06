---
name: render-flatlay
description: Render the FREE steps of the flatlay-product-reveal video format — composite each flat product cover onto the dressed tabletop plate to make the Veo start frames (build_start_frames), speed-and-hard-cut concat the i2v beats plus the HTML end card and mux the music (build_master), and screenshot the brand end-card HTML to a static-dwell clip (render_endcard). Deterministic, FREE (Playwright + PIL + FFmpeg), no paid calls, product covers and end-card text stay pixel-crisp. The paid steps (flat covers, Veo beats, music) are separate capabilities; the recipe orchestrates them. Use for the flatlay-product-reveal format.
status: active
---

# render-flatlay

Renders the FREE composite/assembly steps of the flatlay-product-reveal video format: a top-down tabletop listicle where, beat by beat, a product lies flat on a dressed linen plate, two hands cup and lift it, then hard-cut to the next product, closing on an HTML brand end card over a music bed.

Three FREE scripts, no paid model calls:

- **build_start_frames.py** — PIL: composite each true-top-down flat product cover, centered at a natural size, onto the dressed tabletop plate → one Veo start frame per beat.
- **build_master.py** — FFmpeg: speed each Veo beat by `beat_speed` (~1.5x, 4s → ~2.67s), HARD-CUT concat all beats (no dissolves — the listicle snap), optionally append the insert/greeting card, append the end-card clip, then mux the music bed. All clips are normalized to one fps/codec so concat-copy is safe.
- **render_endcard.py** — Playwright screenshots the brand's own `end_card.html` (wordmark + trust icons + CTA) → an ffmpeg static-dwell mp4. Deterministic; the end-card text is the brand's real HTML, never AI-rendered.

## Run
build_start_frames.py --config config.json --run-dir <run>  # composite flat covers → start frames
render_endcard.py --config config.json --run-dir <run>       # brand HTML → end-card clip
build_master.py --config config.json --run-dir <run>         # speed + hard-cut concat + mux → master-final.mp4

Output: 1080x1920, ~14-16s h264 (+ aac music). All FREE, $0.

## Contract
- Deterministic + FREE (PIL + Playwright + FFmpeg); no paid calls, no AI-rendered text.
- Hard cuts between beats (no dissolves); camera stays locked top-down (a property of the paid beats, preserved here).
- Product covers stay pixel-identical through composite + concat; the end card is the brand's own HTML.
- The paid steps — flat-cover transform, Veo 3.1 i2v beats, ElevenLabs music — are separate capabilities (create-image-fal, create-video-fal, create-music-elevenlabs); the recipe orchestrates them and gates the spend.
