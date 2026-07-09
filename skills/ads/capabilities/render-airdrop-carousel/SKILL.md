---
name: render-airdrop-carousel
description: Assemble a viral iOS "AirDrop" notification-carousel video ad (≈6–8s, 9:16) from a brand line plus 6–16 real product photos — a native AirDrop share-sheet card ("Brand would like to share a ___ · Decline / Accept") springs up and its preview window CYCLES through the products, landing on a range/lineup payoff with an Accept tap; a chime + soft per-swap ticks track the swaps. DETERMINISTIC assembly — an HTML card (real DOM text) rendered to PNG via headless Chrome, chroma-keyed, its magenta window refilled per-product in PIL, then animated + audio-synthed with FFmpeg. FREE (no paid model calls); the recipe supplies the brand line, product images, and payoff and gates the only optional paid step (a hero shot when the brand has NO usable photo → create-image-fal). Use for the airdrop-notification-carousel format.
status: active
---

# render-airdrop-carousel

The free, deterministic renderer for the **airdrop-notification-carousel** video ad
format — the viral iOS "AirDrop" trend where a native share-sheet card
("**Brand** would like to share a *candle* · Decline / Accept") springs up on the
phone and its preview window flips through a **carousel of real product photos**,
landing on a range/lineup payoff with an Accept tap.

This is a DETERMINISTIC composite — **no generative video, no AI-rendered product**.
A real-DOM AirDrop card is rendered once to PNG (headless Chrome), chroma-keyed, and
its preview window is refilled per-product in PIL, then animated + audio-synthed with
FFmpeg. The whole point of the format is crisp system-UI text and **real** product
photography, both of which a video model would smear. This capability makes **no paid
calls**; the recipe gates the only optional paid step — generating a hero product shot
when the brand has NO usable photo at all (→ `create-image-fal`).

Default output ≈ **6–8s**, 1080×1920, h264 + aac. Duration is DERIVED, not trimmed —
`first_hold + (N-1)·per + final_hold`. Add images or raise `per` to lengthen.

## Scripts (free)

- `scripts/build_card.py` — brand params → `chrome.html` + `chrome-pressed.html`: the
  AirDrop card on a **green page** (`#00e000`) with a **magenta preview window**
  (`#ff00ff`) and a solid brand band (wordmark SVG or text + tagline). Real DOM text —
  `AirDrop`, `Decline`, `Accept`, and the brand line are DOM/SVG, never AI-rendered.
- `scripts/one_shot.py` — glue: `build_card` → headless-Chrome (Playwright) fullPage
  screenshot of both card states → `compose_carousel`. One `--config`, one MP4.
- `scripts/compose_carousel.py` — the render engine: green-key the card → detect the
  magenta window → fill it per-product (cover-crop) → blurred per-product backdrop +
  push-in → card spring-up (iOS ease-out-back) + carousel + Accept tap → synth audio
  (whoosh on entry, chime on land, a tick per swap, a pop on the tap) → encode h264+aac.
- `scripts/config.example.json` — the shape of the brand `config` the recipe binds
  (brand-neutral worked defaults; replace every `/abs/path/...` placeholder).

## Chroma contract (load-bearing — build_card.py and compose_carousel.py MUST share it)

`#00e000` **green** = page background, keyed to the card's alpha. `#ff00ff` **magenta**
= preview window, replaced per product. **Neither color may appear in the card art or
any product photo** — a product image containing near-pure green or magenta gets
keyed/misread. Swap the image or tighten the `window_mask` thresholds if it bleeds.

## Craft rules (faithful to the source molecule)

- **Real product photos only.** The format's credibility is that these look like real
  AirDropped items — no AI-generated products in the carousel.
- **Never AI-render text** — the card UI, wordmark, and band are DOM/SVG composited so
  they stay pixel-crisp. Cover-crop the window; white-bg PDP shots reading as "product
  in a white tile" is on-brand and fine.
- **6–16 images**, ordered; **end on the range** — the payoff (`final_image`) should
  read as "the whole line" (lineup / family / all-shades).
- **Hard cuts on rhythm, a tick per swap** — do NOT crossfade.
- **Never invent proof** — a `1M+ sold` tagline must be the brand's OWN stated figure,
  not filled from a brand-kit proof section.
- **Duration is derived, not trimmed** — add images or raise `per`; never cut the audio.

## Requires

- **Python 3** with `numpy` + `Pillow`, and **ffmpeg/ffprobe** on PATH.
- **Playwright chromium** for the screenshot step (`pip install playwright && playwright
  install chromium`). If Playwright is unavailable, run `build_card.py`, screenshot
  `chrome.html` / `chrome-pressed.html` (fullPage) → `chrome-green.png` /
  `chrome-green-pressed.png` via the chrome-devtools MCP, then call `compose_carousel.py`
  directly.
- `watch` (QC the final master). The recipe gates `create-image-fal` (optional hero shot
  when the brand has NO usable product photo) — the only paid, proxy-routed step.
