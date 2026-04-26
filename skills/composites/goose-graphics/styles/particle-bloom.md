# Particle Bloom

Vivid pumpkin-orange canvas with a swirling halftone particle dispersion that drifts across the type. Headlines are tall white display sans, broken across multiple lines. The signature is the way the white dot field bleeds into and around the letterforms — like a science-poster ad for a lab launch or a research conference.

> Full prose reference: `styles/_full/particle-bloom.md`

## Palette

| Hex | Role |
|-----|------|
| `#F26430` | Pumpkin orange — primary background |
| `#FFFFFF` | Pure white — primary display text + particles |
| `#FFE3D2` | Cream haze — soft tint variant for backgrounds |
| `#1A0A05` | Espresso — body text on light variants |
| `#D04E1F` | Burnt edge — subtle shadow / hover |
| `#FFB68A` | Apricot wash — secondary highlight |
| `#7B2A0E` | Deep umber — small caps + footer |
| `#FF8754` | Lit orange — accent dots in foreground |
| `#FFE3D2` | Particle core — dense particle cluster |

## Typography

**Google Fonts**

```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@500;700;800;900&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet">
```

- **Display:** `'Inter', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif`
- **Mono:** `'Space Mono', ui-monospace, Menlo, monospace`

| Role | Font | Size | Weight | Line-height | Tracking |
|------|------|------|--------|-------------|----------|
| Display Hero | Inter | 168px | 800 | 0.95 | -4px |
| Display Stack | Inter | 132px | 800 | 0.95 | -3px |
| Section Heading | Inter | 60px | 800 | 1.05 | -1.5px |
| Sub-heading | Inter | 28px | 700 | 1.20 | -0.5px |
| Body | Inter | 18px | 500 | 1.55 | 0 |
| Eyebrow / Tag | Space Mono | 13px | 700 | 1.40 | 1.5px UPPER |
| Footer | Space Mono | 12px | 400 | 1.50 | 1px |

**Principles**

- Stack the headline 3–4 lines, each line standing alone, left-aligned.
- The display weight is 800 — never light, never thin. The orange wants weight.
- Mono type is reserved for eyebrow tags and caption metadata only.

## Layout

- Pumpkin-orange fills the full canvas. Edge padding is generous: 80px on poster, 60px on smaller formats.
- The particle field is a hand-placed cluster of small white circles (4–10px) that thicken into a swirl on the right side, dispersing toward the upper left. Use SVG circles, not noise filters.
- The headline is layered **on top of** the particle field — particles peek through gaps between letters.
- One small mono eyebrow at the top (uppercase, tracked) and one mono footer line at the bottom.
- No drop shadows, no rounded panels — flat color and dispersed dots only.

## Do / Don't

**Do**

- Use pumpkin orange as the only background. The orange is the brand.
- Stack headlines 3–4 lines with display 800 white type.
- Build the particle swirl from many small SVG circles, not a single texture image.
- Let particles overlap parts of the headline — the bloom is the signature.
- Keep tags and footer in Space Mono uppercase with wide tracking.

**Don't**

- Don't pair this with another saturated background color — orange stands alone.
- Don't use light or regular weights anywhere in the display layer.
- Don't substitute a noisy bitmap texture for the particle SVG — it must be discrete dots.
- Don't add gradients or vignettes to the orange — flat fill only.
- Don't center the headline. Always left-aligned.

## CSS snippets

### `:root` variables

```css
:root {
  --c-orange: #F26430;
  --c-orange-deep: #D04E1F;
  --c-cream: #FFE3D2;
  --c-apricot: #FFB68A;
  --c-lit: #FF8754;
  --c-umber: #7B2A0E;
  --c-espresso: #1A0A05;
  --c-white: #FFFFFF;

  --font-display: 'Inter', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif;
  --font-mono: 'Space Mono', ui-monospace, Menlo, monospace;
}
```

### Hero canvas with particle bloom

```html
<div style="background:#F26430; padding:80px 72px; min-height:1350px; position:relative; overflow:hidden;">
  <svg viewBox="0 0 1080 1350" style="position:absolute; inset:0; width:100%; height:100%; pointer-events:none;">
    <!-- swirl cluster (right-center) -->
    <g fill="#FFFFFF">
      <circle cx="780" cy="640" r="6"/>
      <circle cx="820" cy="600" r="5"/>
      <circle cx="860" cy="560" r="4"/>
      <circle cx="740" cy="700" r="7"/>
      <circle cx="700" cy="660" r="5"/>
      <circle cx="900" cy="620" r="3"/>
      <circle cx="660" cy="580" r="4"/>
      <circle cx="620" cy="640" r="5"/>
      <circle cx="580" cy="700" r="3"/>
      <circle cx="800" cy="720" r="4"/>
      <circle cx="940" cy="540" r="3"/>
      <circle cx="540" cy="520" r="3"/>
    </g>
  </svg>
  <p style="font-family:'Space Mono',monospace; font-size:13px; font-weight:700; letter-spacing:1.5px; text-transform:uppercase; color:#FFFFFF; margin:0 0 56px;">RESEARCH BRIEF · 2026</p>
  <h1 style="font-family:'Inter',sans-serif; font-size:168px; font-weight:800; line-height:0.95; letter-spacing:-4px; color:#FFFFFF; margin:0; position:relative; z-index:2;">
    AI<br>for<br>Life<br>Science
  </h1>
  <p style="font-family:'Space Mono',monospace; font-size:12px; font-weight:400; letter-spacing:1px; color:#FFE3D2; margin:0; position:absolute; bottom:60px; left:72px;">CAMARA LABORATORY · ISSUE 04</p>
</div>
```

### Mono eyebrow tag

```html
<span style="display:inline-block; font-family:'Space Mono',monospace; font-size:13px; font-weight:700; letter-spacing:1.5px; text-transform:uppercase; color:#FFFFFF; border:1px solid rgba(255,255,255,0.5); padding:6px 12px;">FIELD NOTE</span>
```
