# Peach Pop

DTC beauty / wellness aesthetic. Peach canvas, cornflower-blue geometric blocks, monospaced Space Mono testimonials in ALL CAPS tracked. Every slide is a product card that could live on a modern skincare brand's homepage — warm, confident, approachable.

> Full prose reference: `styles/_full/peach-pop.md`

## Palette

| Hex | Role |
|-----|------|
| `#fce8d8` | Peach — primary background |
| `#1a1a2e` | Dark navy — primary text |
| `#3B9BFF` | Cornflower blue — accent (stars, blocks, CTAs) |
| `#2878D0` | Deep blue — hover |
| `#fdd9c4` | Light peach — subtle emphasis, borders |
| `#8CC5FF` | Pale blue — secondary highlights |
| `#fef4ec` | Cream — card surface, photo frames |
| `#f8e4d2` | Surface inset |
| `#f5d6c3` | Blush — nested containers |
| `#e8c4ad` | Warm border |
| `#b89a8a` | Dusty rose — disabled |
| `#8a7668` | Warm gray — tertiary, attribution |
| `#5c4a3e` | Cocoa — secondary body |

## Typography

**Google Fonts**

```html
<link href="https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
```

- **Display / Monospace:** `'Space Mono', 'Courier New', Courier, monospace`
- **Body:** `'DM Sans', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif`

| Role | Font | Size | Weight | Line-height | Tracking |
|------|------|------|--------|-------------|----------|
| Display Hero | Space Mono | 56px | 700 | 1.10 | 2px UPPER |
| Section Heading | Space Mono | 36px | 700 | 1.15 | 1.5px UPPER |
| Testimonial Quote | Space Mono | 22px | 700 | 1.30 | 1px UPPER |
| Sub-heading | DM Sans | 28px | 700 | 1.25 | -0.25px |
| Body Large | DM Sans | 20px | 400 | 1.65 | 0 |
| Body | DM Sans | 16px | 400 | 1.65 | 0.1px |
| Attribution | DM Sans | 13px | 400 | 1.40 | 1.5px UPPER |
| Caption | DM Sans | 12px | 400 | 1.50 | 0.3px |
| Big Number | Space Mono | 64px | 700 | 1.00 | 0 |
| CTA | DM Sans | 15px | 700 | 1.00 | 0.5px |

**Principles**

- Space Mono testimonials in ALL CAPS with 1-2px tracking — the signature move.
- DM Sans for explanatory body in mixed case.
- Hierarchy through size + tracking, not weight shifts (mono is always 700).

## Layout

- Background: flat peach `#fce8d8`.
- Geometric blocks: solid `#3B9BFF` squares and rectangles as decorative framing.
- Cards: cream `#fef4ec`, 2-6px radius, warm `#e8c4ad` border.
- Photo frames: blush `#f5d6c3` border, 2-4px radius.
- Blue star characters `★★★★★` in cornflower blue for ratings.
- Left-align testimonials; center-align hero statements.

## Do / Don't

**Do**

- Use Space Mono 700 ALL CAPS for all testimonial quotes.
- Use cornflower blue geometric blocks/squares as decorative composition elements.
- Use cream cards `#fef4ec` with warm borders against the peach ground.
- Use blue star characters for ratings.
- Use DM Sans mixed case for supporting body copy.

**Don't**

- Don't use peach for cards — cream (`#fef4ec`) is the card surface.
- Don't use bright saturated colors beyond the blue accent.
- Don't mix case on testimonial quotes — uppercase only.
- Don't use curved organic shapes — straight geometric blocks only.
- Don't use serif fonts.

## CSS snippets

### `:root` variables

```css
:root {
  --color-peach: #fce8d8;
  --color-navy: #1a1a2e;
  --color-blue: #3B9BFF;
  --color-blue-deep: #2878D0;
  --color-cream: #fef4ec;
  --color-blush: #f5d6c3;
  --color-border: #e8c4ad;
  --color-cocoa: #5c4a3e;
  --color-warm-gray: #8a7668;

  --font-mono: 'Space Mono', 'Courier New', monospace;
  --font-body: 'DM Sans', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif;

  --radius-card: 4px;
}
```

### Testimonial card

```html
<div style="background:#fef4ec; border:1px solid #e8c4ad; border-radius:4px; padding:32px;">
  <p style="font-family:'DM Sans',sans-serif; font-size:20px; color:#3B9BFF; letter-spacing:2px; margin:0 0 16px;">★★★★★</p>
  <p style="font-family:'Space Mono',monospace; font-size:22px; font-weight:700; line-height:1.30; letter-spacing:1px; text-transform:uppercase; color:#1a1a2e; margin:0 0 20px;">"THIS CHANGED THE WAY OUR TEAM WORKS. WE'RE NEVER GOING BACK."</p>
  <p style="font-family:'DM Sans',sans-serif; font-size:13px; font-weight:400; letter-spacing:1.5px; text-transform:uppercase; color:#8a7668; margin:0;">— SARAH CHEN, VP OPERATIONS</p>
</div>
```

### Hero with blue geometric block

```html
<div style="background:#fce8d8; padding:80px 60px; position:relative;">
  <div style="position:absolute; top:60px; right:60px; width:160px; height:160px; background:#3B9BFF;"></div>
  <p style="font-family:'DM Sans',sans-serif; font-size:13px; font-weight:400; letter-spacing:1.5px; text-transform:uppercase; color:#8a7668; margin:0 0 24px;">— TRUSTED BY FOUNDERS</p>
  <h1 style="font-family:'Space Mono',monospace; font-size:56px; font-weight:700; line-height:1.10; letter-spacing:2px; text-transform:uppercase; color:#1a1a2e; margin:0 0 24px; max-width:640px;">"THE FUTURE OF AUTONOMOUS WORK."</h1>
  <p style="font-family:'DM Sans',sans-serif; font-size:16px; font-weight:400; line-height:1.65; color:#5c4a3e; max-width:520px; margin:0;">Goose deploys AI coworkers that handle research, drafting, and follow-up — so your team can focus on decisions.</p>
</div>
```

### Blue CTA

```html
<a style="display:inline-block; background:#3B9BFF; color:#fff; font-family:'DM Sans',sans-serif; font-size:15px; font-weight:700; letter-spacing:0.5px; text-decoration:none; padding:14px 32px; border-radius:4px;">Shop the routine</a>
```

### Stat with mono number

```html
<div style="text-align:center; padding:40px; background:#fef4ec; border:1px solid #e8c4ad;">
  <p style="font-family:'Space Mono',monospace; font-size:64px; font-weight:700; color:#3B9BFF; margin:0 0 8px;">47%</p>
  <p style="font-family:'DM Sans',sans-serif; font-size:13px; font-weight:400; letter-spacing:1.5px; text-transform:uppercase; color:#5c4a3e; margin:0;">FASTER RESPONSE</p>
</div>
```
