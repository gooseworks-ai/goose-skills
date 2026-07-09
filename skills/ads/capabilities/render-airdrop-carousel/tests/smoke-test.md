# Smoke test — render-airdrop-carousel

Verifies the free deterministic assembly end-to-end. No paid calls. Needs: Python 3
with `numpy` + `Pillow`, `ffmpeg`/`ffprobe`, and (for the screenshot step) Playwright
chromium. If Playwright/browsers aren't installed, skip Phase A and validate the
FFmpeg/PIL assembly (Phase B) with the two bundled HTML files rendered via the
chrome-devtools MCP, or with synthetic card PNGs.

## Setup

```bash
cd scripts
python3 -m pip install pillow numpy            # if not present
mkdir -p /tmp/airdrop-smoke
# Copy the example config and REPLACE every /abs/path/... placeholder:
#  - "images": 6-16 real product photos (absolute paths)
#  - "final_image": a lineup/family payoff shot
#  - "wordmark_svg": a brand wordmark SVG (or delete the key for a text wordmark)
cp config.example.json /tmp/airdrop-smoke/config.json
```

## Phase A — one-shot (Playwright present)

```bash
python3 one_shot.py --config /tmp/airdrop-smoke/config.json \
                    --work-dir /tmp/airdrop-smoke \
                    --out /tmp/airdrop-smoke/final.mp4 --no-audio
```

Writes `chrome.html` + `chrome-pressed.html`, screenshots both to
`chrome-green.png` / `chrome-green-pressed.png`, then composes `final.mp4`.

## Phase B — manual (no Playwright / browsers not installed)

```bash
# 1. Build the two card HTML files.
python3 build_card.py --brand "acme." --message "would like to share a candle" \
                      --tagline "The bestselling collection - 4.9 stars" \
                      --accent "#d98695" --band-color "#f5e9da" \
                      --out-dir /tmp/airdrop-smoke

# 2. Screenshot chrome.html / chrome-pressed.html (fullPage) to
#    chrome-green.png / chrome-green-pressed.png via the chrome-devtools MCP
#    (load file:///tmp/airdrop-smoke/chrome.html, fullPage screenshot).
#    -- OR, to validate the assembly ONLY, synthesize a card PNG: a 1080x1920
#    green (#00e000) frame with a solid magenta (#ff00ff) rectangle where the
#    preview window sits, saved as chrome-green.png (+ a copy chrome-green-pressed.png).

# 3. Compose from the screenshots + real product images.
python3 compose_carousel.py \
  --chrome /tmp/airdrop-smoke/chrome-green.png \
  --chrome-pressed /tmp/airdrop-smoke/chrome-green-pressed.png \
  --images "/abs/p1.png,/abs/p2.png,/abs/p3.png" \
  --final-image "/abs/lineup.jpg" \
  --out /tmp/airdrop-smoke/final.mp4 --no-audio
```

## Expect

- `build_card.py` writes `chrome.html` + `chrome-pressed.html`. The card is centered
  on a pure-green page with a magenta preview window and a brand band (wordmark +
  uppercase tagline); the `Accept` button is the accent color; `chrome-pressed.html`
  shades the Accept cell.
- `compose_carousel.py` reports `wrote … (<dur>s, <N> frames, <k> images + final)`.
  `final.mp4` — 1080×1920, ~6–8s. The AirDrop card springs UP (ease-out-back), the
  preview window hard-cuts through each product on rhythm, and it lands on the payoff
  image with a visible Accept tap-highlight. NO green or magenta leaks anywhere in-frame.
- Drop `--no-audio` to get the synth track — a chime on card-land, a tick per swap, a
  pop on the tap (no external audio files needed).
- `ffprobe` confirms dimensions/duration; run the `watch` skill on the master to confirm
  every product FULLY fills the window, the card text + wordmark are crisp, the carousel
  reads and lands on the payoff, and the audio ticks track the swaps.

## Fail signals

- **Magenta shows inside the preview window** → a product image didn't cover-crop the
  window (too small / wrong aspect), or `window_mask` missed the magenta region.
- **Green haze / halo around the card** → the green key threshold is off, or the card
  art itself contains near-`#00e000` green (violates the chroma contract — recolor it).
- **"no magenta preview window found"** → the screenshot lost the `#ff00ff` window
  (wrong HTML, JPEG-compressed screenshot). Re-screenshot chrome.html as PNG, fullPage.
- **UI text looks smeared/warped** → something AI-rendered the card; this engine is
  HTML→PNG + PIL only, never a video model.
- **Video ends abruptly / audio cut short** → someone trimmed duration; it is DERIVED
  from `first_hold + (N-1)·per + final_hold` — add images or raise `per` instead.
