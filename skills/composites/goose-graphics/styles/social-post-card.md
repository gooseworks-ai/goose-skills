# Social Post Card

Blurred real-world scene as full-bleed backdrop; a simulated Instagram post card occupies the hero. Inside the card: profile header (avatar + username), square photo, action icons (heart, comment, share), caption text with a red heart accent. The illusion is that someone shared a moment on Instagram and you're looking at the screenshot.

> Full prose reference: `styles/_full/social-post-card.md`

## Palette

| Hex | Role |
|-----|------|
| `#ffffff` | Card white — post card surface |
| `#111111` | Near-black — primary text inside card |
| `#262626` | Icon gray — action icon strokes |
| `#8e8e8e` | Timestamp gray — meta text |
| `#ed4956` | Instagram red — active heart |
| `#00376b` | Link blue — caption mentions and links |
| `#eeeae5` | Scene backdrop — fallback solid if photo fails |
| `#efefef` | Divider gray — hairline separators |
| `#f2f2f2` | Surface photo — inner photo bg |
| `#555555` | Secondary text — sub-username |
| `#c7c7c7` | Disabled |

## Typography

**Google Fonts**

```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
```

- **Display / Body:** `'Inter', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif`

| Role | Font | Size | Weight | Line-height | Tracking |
|------|------|------|--------|-------------|----------|
| Display Hero | Inter | 48px | 700 | 1.15 | -0.5px |
| Section Heading | Inter | 32px | 700 | 1.20 | -0.3px |
| Username | Inter | 15px | 600 | 1.20 | -0.1px |
| Sub-username | Inter | 12px | 500 | 1.30 | 0 |
| Caption Body | Inter | 16px | 400 | 1.45 | 0 |
| Caption Bold | Inter | 16px | 600 | 1.45 | 0 |
| Action Count | Inter | 14px | 600 | 1.20 | 0 |
| Timestamp | Inter | 11px | 500 | 1.00 | 0.4px UPPER |
| CTA | Inter | 15px | 600 | 1.00 | 0 |

**Principles**

- The IG card is a near-pixel-perfect recreation — username bold, 1px divider between header and photo, action row below photo.
- Caption body is Inter 400 left-aligned with inline `@mentions` and `#hashtags` in link-blue (`#00376b`).
- Optional poster headline lives ABOVE or BELOW the card — never inside it.

## Layout

- Full-bleed backdrop: blurred real-world photo (café, city, garden) with 30-50px Gaussian blur, or fallback solid `#eeeae5`.
- Card width: 480-560px, centered. Drop shadow `0 24px 48px rgba(0,0,0,0.16)`, radius 0-4px (IG is sharp).
- Card header: 14-16px padding, avatar circle (32-40px) left, username bold next to it, `⋯` right.
- Photo: 1:1 aspect, fills card width, hairline `#efefef` divider above and below.
- Action row: heart + comment + share icons in `#262626`, save icon right-aligned.
- Caption below action row: username bold + caption body.
- Timestamp at bottom: uppercase tracked gray.

## Do / Don't

**Do**

- Blur the backdrop heavily (30-50px) so the card stays primary.
- Use the exact Instagram red `#ed4956` for the active heart icon.
- Include all IG UI affordances (header, divider, action row, caption, timestamp).
- Use link-blue `#00376b` for `@mentions` and `#hashtags` in the caption.
- Use a 1px `#efefef` divider between sections of the card.

**Don't**

- Don't use radius > 4px on the card — IG is sharp-cornered.
- Don't place headline copy INSIDE the card — external headlines only.
- Don't color the backdrop — a blurred photo or `#eeeae5` solid fallback only.
- Don't fake the username — use realistic handles like `@oliviawilson`.
- Don't skip the timestamp — it's part of the authenticity.

## CSS snippets

### `:root` variables

```css
:root {
  --c-card: #ffffff;
  --c-text: #111111;
  --c-icon: #262626;
  --c-timestamp: #8e8e8e;
  --c-heart: #ed4956;
  --c-link: #00376b;
  --c-backdrop: #eeeae5;
  --c-divider: #efefef;
  --c-photo-bg: #f2f2f2;

  --font: 'Inter', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif;

  --shadow-card: 0 24px 48px rgba(0, 0, 0, 0.16);
}
```

### Full composition

```html
<div style="position:relative; min-height:1080px; overflow:hidden; background:#eeeae5;">
  <div style="position:absolute; inset:-40px; background-image:url('scene.jpg'); background-size:cover; background-position:center; filter:blur(40px); transform:scale(1.1); z-index:0;"></div>

  <div style="position:relative; z-index:1; display:flex; align-items:center; justify-content:center; min-height:1080px; padding:60px;">
    <div style="width:520px; background:#ffffff; box-shadow:0 24px 48px rgba(0,0,0,0.16);">

      <div style="display:flex; align-items:center; padding:14px 16px; gap:12px;">
        <div style="width:36px; height:36px; border-radius:50%; background:#f2f2f2;"></div>
        <div style="flex:1;">
          <p style="font-family:'Inter',sans-serif; font-size:15px; font-weight:600; letter-spacing:-0.1px; color:#111; margin:0;">oliviawilson</p>
          <p style="font-family:'Inter',sans-serif; font-size:12px; font-weight:500; color:#555; margin:0;">Brooklyn, New York</p>
        </div>
        <span style="font-size:20px; color:#262626;">⋯</span>
      </div>

      <div style="width:100%; aspect-ratio:1; background:#f2f2f2; background-image:url('post.jpg'); background-size:cover; background-position:center;"></div>

      <div style="display:flex; align-items:center; padding:12px 16px; gap:16px;">
        <span style="font-size:24px; color:#ed4956;">♥</span>
        <span style="font-size:22px; color:#262626;">💬</span>
        <span style="font-size:22px; color:#262626;">↪</span>
        <span style="font-size:22px; color:#262626; margin-left:auto;">⌂</span>
      </div>

      <div style="padding:0 16px 12px;">
        <p style="font-family:'Inter',sans-serif; font-size:14px; font-weight:600; color:#111; margin:0 0 8px;">1,248 likes</p>
        <p style="font-family:'Inter',sans-serif; font-size:16px; font-weight:400; line-height:1.45; color:#111; margin:0 0 4px;">
          <span style="font-weight:600;">oliviawilson</span> The morning after we shipped v1.0. Six months of quiet work, one afternoon of everything clicking. <span style="color:#00376b;">@teamsignal</span> <span style="color:#00376b;">#launched</span>
        </p>
        <p style="font-family:'Inter',sans-serif; font-size:11px; font-weight:500; letter-spacing:0.4px; text-transform:uppercase; color:#8e8e8e; margin:8px 0 0;">2 HOURS AGO</p>
      </div>

    </div>
  </div>
</div>
```
