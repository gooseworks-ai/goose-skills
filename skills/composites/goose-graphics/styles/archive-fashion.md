# Archive Fashion

Luxury catalog frame with a tilted handwritten sticker as the singular decorative moment. Stone beige outer frame, taupe-brown inset photo container, small italic Cormorant Garamond wordmark at top center, an Inter 700 catalog headline stacked on 2 lines, and a hot-pink sticker (tilted -8°) with handwritten Caveat copy pinned to the bottom-left corner. Feels like a high-end fashion lookbook with a personal promo note.

> Full prose reference: `styles/_full/archive-fashion.md`

## Palette

| Hex | Role |
|-----|------|
| `#E6DCC8` | Stone beige — outer frame background |
| `#1A1410` | Near-black — primary text, CTA button fill |
| `#4A352A` | Taupe brown — inset photo container background |
| `#F4B8D4` | Candy pink — sticker fill (one use only) |
| `#8B3A5C` | Deep pink ink — sticker inner border, accent text |
| `#D8C9B0` | Stone deeper — subtle borders, secondary surfaces |
| `#EFE6D6` | Stone lighter — content card highlights |
| `#6B4C3B` | Warm brown — secondary text on photo environments |
| `#7A6B5D` | Muted text — metadata inside stone frame |

## Typography

**Google Fonts**

```html
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;1,500&family=Inter:wght@500;600;700&family=Caveat:wght@500;600;700&display=swap" rel="stylesheet">
```

- **Wordmark:** `'Cormorant Garamond', Garamond, serif` (italic 500)
- **Display / Body:** `'Inter', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif`
- **Handwritten (sticker only):** `'Caveat', 'Marker Felt', cursive`

| Role | Font | Size | Weight | Line-height | Tracking |
|------|------|------|--------|-------------|----------|
| Wordmark | Cormorant Garamond Italic | 28px | 500 | 1.0 | 0.5px |
| Display Hero | Inter | 72px | 700 | 1.05 | -1.5px |
| Display (1:1) | Inter | 56px | 700 | 1.05 | -1px |
| Tracked Caps Date | Cormorant Garamond | 14px | 500 | 1.2 | 2.5px UPPER |
| Section Heading | Inter | 32px | 600 | 1.15 | -0.5px |
| Body Large | Inter | 20px | 500 | 1.55 | 0 |
| Body | Inter | 17px | 500 | 1.55 | 0 |
| Caption | Inter | 13px | 500 | 1.45 | 0.3px |
| Sticker Headline | Caveat | 32px | 700 | 1.1 | 0 |
| Sticker Body | Caveat | 20px | 500 | 1.25 | 0 |
| Sticker Foot | Caveat | 16px | 600 | 1.2 | 0.5px |

**Principles**

- Caveat belongs ONLY on the sticker. Italic Cormorant belongs ONLY on the wordmark. Inter everywhere else.
- Catalog headline stacked on 2 lines, centered, Inter 700.
- Tracked-caps dates in Cormorant Garamond with 2.5px letter-spacing.

## Layout

- Outer frame: stone beige `#E6DCC8` with ~50px margin around the photo inset.
- Inset photo container: taupe brown `#4A352A`, flat corners, fills center 80% of composition.
- Wordmark "Galerie" centered at top (Cormorant italic 28px).
- Catalog headline centered beneath wordmark or over photo depending on composition.
- Sticker: candy pink `#F4B8D4` bubble with asymmetric border-radius, tilted -5° to -10°, pinned to bottom-left. Drop shadow `0 8px 24px rgba(139,58,92,0.18)`.
- Only one sticker per composition.

## Do / Don't

**Do**

- Use stone beige outer frame with ~50px margin around the photo inset on every composition.
- Use ONE pink sticker tilted -5° to -10° in the bottom-left as the scroll-stopper.
- Use asymmetric border-radius on the sticker to suggest a hand-cut speech bubble.
- Use Caveat handwritten script for sticker copy only.
- Add pink-tinted drop shadow beneath the sticker for physical-object feel.
- Keep photo environment warm and dark (taupe brown).

**Don't**

- Don't center photos edge-to-edge — always inset from the stone frame.
- Don't use more than 1 sticker.
- Don't straighten the sticker — the tilt IS the personality.
- Don't use Caveat anywhere except the sticker.
- Don't use pure white or pure black — stone + warm near-black only.
- Don't use rounded corners on content frames — only on the sticker.
- Don't use Inter italic — italic belongs to Cormorant (heritage) and Caveat (handwritten).

## CSS snippets

### `:root` variables

```css
:root {
  --color-stone: #E6DCC8;
  --color-stone-deeper: #D8C9B0;
  --color-stone-lighter: #EFE6D6;
  --color-ink: #1A1410;
  --color-taupe: #4A352A;
  --color-pink: #F4B8D4;
  --color-pink-ink: #8B3A5C;
  --color-warm-brown: #6B4C3B;

  --font-wordmark: 'Cormorant Garamond', Garamond, serif;
  --font-body: 'Inter', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif;
  --font-hand: 'Caveat', 'Marker Felt', cursive;
}
```

### Catalog composition

```html
<div style="background:#E6DCC8; padding:50px; min-height:960px; position:relative;">
  <p style="font-family:'Cormorant Garamond',serif; font-style:italic; font-size:28px; font-weight:500; letter-spacing:0.5px; color:#1A1410; text-align:center; margin:0 0 16px;">Galerie</p>
  <p style="font-family:'Cormorant Garamond',serif; font-size:14px; font-weight:500; letter-spacing:2.5px; text-transform:uppercase; color:#6B4C3B; text-align:center; margin:0 0 32px;">FEBRUARY 13 — 16</p>

  <div style="background:#4A352A; padding:48px 32px; min-height:640px; position:relative;">
    <img src="model.jpg" style="width:100%; height:auto; object-fit:cover;" alt="Archive">
  </div>

  <h1 style="font-family:'Inter',sans-serif; font-size:72px; font-weight:700; line-height:1.05; letter-spacing:-1.5px; color:#1A1410; text-align:center; margin:40px 0 0;">The Spring<br>Archive.</h1>

  <div style="position:absolute; bottom:60px; left:60px; transform:rotate(-8deg); background:#F4B8D4; padding:20px 24px; border-radius:24px 16px 28px 12px; box-shadow:0 8px 24px rgba(139,58,92,0.18); max-width:260px;">
    <p style="font-family:'Caveat',cursive; font-size:32px; font-weight:700; line-height:1.1; color:#8B3A5C; margin:0 0 6px;">SPECIAL OFFER!</p>
    <p style="font-family:'Caveat',cursive; font-size:20px; font-weight:500; line-height:1.25; color:#8B3A5C; margin:0 0 8px;">20% off with code SPRING20</p>
    <p style="font-family:'Caveat',cursive; font-size:16px; font-weight:600; letter-spacing:0.5px; color:#8B3A5C; margin:0;">Ends June 10th, 12pm EST</p>
  </div>
</div>
```

### Black CTA block

```html
<a style="display:inline-block; background:#1A1410; color:#E6DCC8; font-family:'Inter',sans-serif; font-size:15px; font-weight:600; letter-spacing:0.5px; text-decoration:none; padding:14px 32px;">SHOP THE ARCHIVE</a>
```
