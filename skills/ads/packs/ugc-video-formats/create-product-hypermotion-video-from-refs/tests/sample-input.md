# Sample Input

## Brief
A "product hypermotion + specs" ad for **Soundboks** — ONE 15s Seedance 2.0 i2v
hypermotion clip of the Soundboks 4 speaker on a beach festival deck (crash-zoom →
orbit → slow-mo dust → settle), diced into 6 segments and intercut with 5 kinetic-
typography spec cards + an intro + a CTA, capped by a real-logo end card, over a 124 BPM
bass bed. Vertical 9:16, ~25s. Music-led, no VO, no captions. (GOOSE-1783, V10 shipped
2026-05-28.)

## Assets (git-LFS — fetch+checkout first)
- hero product: `assets/product/soundboks_4_black_float.png` (real PDP float shot — the
  Seedance start frame)
- logo: `assets/logo/soundboks_logo_white.png` (real wordmark, base64-decoded from the
  brand SVG — 865×135)
- font: `assets/fonts/SpaceGrotesk-Bold.ttf` (**static** weight — variable renders as
  Regular in PIL)

## Spec callouts (5)
1. 126 dB SPL   (hero stat → 3D extrusion in accent)
2. 40-HOUR BATTERY
3. SWAPPABLE BATTERY
4. IP65 RATED
5. PAIR 5 SPEAKERS

## Voice + music
- brand voice: `party` (black BG + Space Grotesk Bold + utility orange #FF6B1A)
- music: 124 BPM bass-driven banger, single rallying lyric hook at the CTA/end-card sync

Full config: `scripts/config.example.json`. Reference render:
`demo/finals/soundboks-hypermotion.mp4`.
