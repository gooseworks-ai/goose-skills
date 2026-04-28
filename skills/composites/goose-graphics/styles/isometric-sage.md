# Isometric Sage

Sage green canvas carrying clean, typography-first layouts. One large display headline in geometric sans, generous negative space, and quiet metadata pills. No figurative illustrations — the calm sage field and confident type do the work. Reads as cool, corporate-editorial, modern-but-restrained.

## Palette

| Hex | Role |
|-----|------|
| `#7BA88E` | Sage green — primary background |
| `#FFFFFF` | White — primary display text |
| `#1A1A1A` | Near-black — body text on light surfaces |
| `#E8F0EC` | Pale sage — card surfaces, metadata panels |
| `#2C3E35` | Forest accent — thin rules, dots, small geometric blocks |
| `rgba(255,255,255,0.70)` | White 70 — secondary text |
| `rgba(255,255,255,0.40)` | White 40 — tertiary text, captions |

## Typography

**Google Fonts**

```html
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
```

- **Display:** `'Space Grotesk', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif`
- **Body / Metadata:** `'Inter', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif`

| Role | Font | Size | Weight | Line-height | Tracking |
|------|------|------|--------|-------------|----------|
| Display Hero | Space Grotesk | 120-160px | 700 | 0.95 | -3px |
| Section Heading | Space Grotesk | 48-72px | 700 | 1.00 | -1.5px |
| Sub-heading | Space Grotesk | 28-36px | 600 | 1.10 | -0.5px |
| Body Large | Inter | 18px | 400 | 1.65 | 0.2px |
| Body | Inter | 15px | 400 | 1.65 | 0.2px |
| Metadata | Inter | 11px | 600 | 1.30 | 1.5px UPPER |
| Big Number | Space Grotesk | 96px | 700 | 1.00 | -2px |
| Caption | Inter | 10px | 500 | 1.30 | 1.2px UPPER |
| Tag | Inter | 12px | 600 | 1.00 | 0.5px |
| CTA | Space Grotesk | 14px | 600 | 1.00 | 1px UPPER |

**Principles**

- One single hero headline anchors each layout — no split-word fragments, no decorative scenes.
- Space Grotesk 700 for display — geometric, modern, technical.
- Inter for supporting copy — clean and unobtrusive.
- Body content (numbered lists, stats, quotes) carries the visual weight after the headline.

## Layout

- Full-bleed sage green `#7BA88E` background.
- One large display headline anchored top-left or top-center.
- Body content (numbered list, stat grid, paragraph) sits below with generous spacing.
- Optional accents: thin horizontal rules, small dot clusters, or a single forest-green color block — all geometric, all small.
- Metadata pills: small white or pale-sage rectangles with dark text for tags/labels.
- Padding: 56-72px all sides on square formats; 80px+ on poster.

## Do / Don't

**Do**

- Use one large display title — top-aligned, full-width, confident.
- Pair the title with a structured body: numbered tips, stat grid, or quote block.
- Use white text on sage for headlines, dark text on pale-sage cards for body.
- Add small white or pale-sage metadata pills/tags for context labels.
- Let negative space breathe — sage is the design, not just the background.

**Don't**

- Don't add figurative illustrations (no isometric desks, monitors, plants, characters). Geometric accents only — and used sparingly.
- Don't split the headline into two fragments — one hero title, one position.
- Don't use warm colors — sage / white / near-black only.
- Don't crowd the canvas — if it feels full, remove something.
- Don't use borders heavier than 1px on metadata elements.

## CSS snippets

### `:root` variables

```css
:root {
  --color-sage: #7BA88E;
  --color-white: #FFFFFF;
  --color-dark: #1A1A1A;
  --color-pale: #E8F0EC;
  --color-accent: #2C3E35;

  --font-display: 'Space Grotesk', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif;
  --font-body: 'Inter', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif;
}
```

### Hero title block

```html
<div style="background:#7BA88E; padding:64px; min-height:100vh; position:relative;">
  <!-- Metadata pill -->
  <span style="display:inline-block; background:#fff; color:#1A1A1A; font-family:'Inter',sans-serif; font-size:11px; font-weight:600; letter-spacing:1.5px; text-transform:uppercase; padding:6px 14px; border-radius:4px;">Founder Advice · 2026</span>

  <!-- Single hero title -->
  <h1 style="font-family:'Space Grotesk',sans-serif; font-size:140px; font-weight:700; line-height:0.95; letter-spacing:-3px; color:#fff; margin:32px 0 0; max-width:920px;">Build less.<br>Ship sooner.</h1>

  <!-- Thin accent rule -->
  <div style="width:80px; height:2px; background:#2C3E35; margin:48px 0 24px;"></div>

  <!-- Body -->
  <p style="font-family:'Inter',sans-serif; font-size:18px; line-height:1.65; color:rgba(255,255,255,0.85); max-width:560px; margin:0;">Five moves every founder should make in 2026 to stay default-alive in an AI-native economy.</p>
</div>
```

### Stat block

```html
<div style="background:#7BA88E; padding:60px; text-align:center;">
  <p style="font-family:'Space Grotesk',sans-serif; font-size:96px; font-weight:700; line-height:1.00; letter-spacing:-2px; color:#fff; margin:0 0 12px;">47%</p>
  <p style="font-family:'Inter',sans-serif; font-size:11px; font-weight:600; letter-spacing:1.5px; text-transform:uppercase; color:rgba(255,255,255,0.70); margin:0;">PRODUCTIVITY INCREASE</p>
</div>
```

### CTA

```html
<a style="display:inline-block; background:#fff; color:#1A1A1A; font-family:'Space Grotesk',sans-serif; font-size:14px; font-weight:600; letter-spacing:1px; text-transform:uppercase; text-decoration:none; padding:14px 32px; border-radius:4px;">Learn More</a>
```
