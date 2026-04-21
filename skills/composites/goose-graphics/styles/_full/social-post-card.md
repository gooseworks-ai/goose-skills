# Design Style: Social Post Card

## 1. Visual Theme & Atmosphere

Social Post Card is the design language of the "dropped-in social proof" — a visual idiom where a simulated Instagram-style post card is the hero content, floating over a real-world photographed scene that grounds the product in an actual environment. The defining move is simultaneous: a crisp white rounded-rectangle card styled EXACTLY like a native social post (avatar, bold username, square photo, heart/comment/share/bookmark action row, caption) sits dead-center over a softly blurred photograph of the product's real habitat — a white marble kitchen counter with meal prep containers, a closet with clothing, a desk with a laptop. The background is never a gradient and never a flat color; it is always a real scene, slightly blurred, slightly brightened, to suggest depth and context without competing with the post.

The typography is a single typeface throughout — Inter at weights 400/500/600/700 — because native social platforms use system sans-serif UI, and Inter is the closest open-source proxy. This is intentional: the card must read as "that's a real Instagram post" at a glance. The username is Inter 600, the caption body is Inter 400 at a natural reading size, the action icons are Unicode or inline SVG sized to match real platform chrome. The post card uses a 16px border-radius (not 12px, not 24px — 16px is the current Instagram card radius) and a soft drop shadow (`0 16px 48px rgba(0,0,0,0.12)`) that makes it look dropped-in rather than pasted. The overall feel is "social proof poster" — a testimonial or review presented in the exact format your audience scrolls past every day, rendered in a real-world context they recognise.

**Uniqueness vs. Frosted Lens:** Social Post Card is NOT Frosted Lens (which uses a blurred *abstract chromatic* background with a data-forward card — this style uses a blurred *real-world photograph* with a *simulated social post* card). The signature move is specifically the **simulated social post as hero content** — the card is not an abstract design container; it is a literal reproduction of an Instagram post unit, with avatar, username, main square photo, action icon row, and caption, in that order. Nothing else in the pack does this.

**Key Characteristics:**
- Blurred real-world photograph as the full-bleed background (not gradient, not solid, not abstract pattern)
- Background blur amount: `filter: blur(2px) brightness(0.95)` — subtle, not heavy
- Crisp white (`#ffffff`) simulated post card, ~500×620px, centered on the scene
- Card border-radius: 16px (matches real Instagram post card radius)
- Soft drop shadow on card: `0 16px 48px rgba(0,0,0,0.12)` for the floating-on-real-surface effect
- Header row inside card: 40px circular avatar + Inter 600 username + "..." menu at 24-28px card padding
- Main square photo area inside the card: 400×400px square with 8px inner border-radius
- Action row below the photo: heart, comment, paper plane, bookmark — Unicode or inline SVG, 22-24px
- Caption: Inter 400, 16-17px, left-aligned, 1.45 line-height, 3-5 lines of testimonial body
- Single typeface: Inter only (400/500/600/700) — matches native platform UI
- Scene photography is context-specific: food product → kitchen; fashion → closet; tech → workspace
- Near-black (`#111111`) text inside the card, mid-gray (`#8e8e8e`) for timestamps and meta
- 1:1 square canvas as the primary format — the entire composition is photographed as if it were a printable poster

## 2. Color Palette & Roles

### Primary
- **Card White** (`#ffffff`): The simulated post card surface. Pure white to match Instagram's native post background and read as "real social card."
- **Near-Black** (`#111111`): Primary text color inside the card — username, caption body, action icon fills.
- **Scene Backdrop** (`#eeeae5`): A conceptual neutral warm gray that represents the dominant tone of the background photograph. Used as a fallback solid color if the photo fails to load.

### Accent
- **Instagram Red** (`#ed4956`): The heart/like icon color when active or filled. Used sparingly as a single accent spark inside the card.
- **Link Blue** (`#00376b`): Used for "@mentions" or linked usernames inside the caption if present.
- **Timestamp Gray** (`#8e8e8e`): Meta text — "2 HOURS AGO," like counts, small platform labels.

### Neutral Scale
- **Divider Gray** (`#efefef`): The hairline divider between caption area and any footer row.
- **Icon Gray** (`#262626`): Default color for the unfilled action icons (heart outline, comment, share, bookmark).
- **Secondary Text** (`#555555`): Optional supporting text under a username (e.g., "Sponsored").
- **Tertiary Text** (`#8e8e8e`): Timestamps and metadata.
- **Disabled** (`#c7c7c7`): Inactive or ghost elements.
- **Shadow Hint** (`rgba(0,0,0,0.04)`): Subtle inner shadow for depth inside card.

### Surface & Borders
- **Surface Card** (`#ffffff`): The post card body.
- **Surface Photo** (`#f2f2f2`): The inner square photo container background (before the actual image loads).
- **Border Default** (`rgba(0,0,0,0.06)`): Near-invisible hairline that some platforms use between card sections.
- **Border Photo** (`rgba(0,0,0,0.04)`): The inside edge of the square photo area.
- **Divider Rule** (`#efefef`): Full-width horizontal separator.
- **Border Accent** (`rgba(237,73,86,0.3)`): Red-tinted border for featured or highlighted action elements.

### Shadow Colors
- **Shadow Card** (`rgba(0,0,0,0.12)`): The signature drop shadow on the main post card — soft, wide, slightly diffuse.
- **Shadow Card Deep** (`rgba(0,0,0,0.18)`): Stronger variant for extra emphasis or overlay use.
- **Shadow Subtle** (`rgba(0,0,0,0.04)`): Ambient inner shadows for depth inside the card.
- **Shadow Scene** (`rgba(0,0,0,0.25)`): A subtle vignette overlay used on the background scene to push the card forward.

## 3. Typography Rules

### Font Families

**Google Fonts CDN:**
```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
```

- **Display**: `'Inter', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif`
- **Body**: `'Inter', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif`

(Single-family system. This is intentional — native social platforms use a single sans-serif UI stack, and matching that is core to the "looks like a real post" effect.)

### Hierarchy

| Role | Font | Size | Weight | Line Height | Letter Spacing | Notes |
|------|------|------|--------|-------------|----------------|-------|
| Display Hero | Inter | 48px | 700 | 1.15 | -0.5px | Optional headline on poster above the card |
| Section Heading | Inter | 32px | 700 | 1.20 | -0.3px | Story/secondary headlines |
| Username | Inter | 15px | 600 | 1.20 | -0.1px | The bold username in the card header — matches IG card username weight |
| Sub-username | Inter | 12px | 500 | 1.30 | 0px | Optional "Sponsored" / location line below username |
| Caption Body | Inter | 16px | 400 | 1.45 | 0px | The testimonial paragraph — 3-5 lines, left-aligned |
| Caption Bold | Inter | 16px | 600 | 1.45 | 0px | Bolded key phrases inside the caption (sparingly) |
| Action Count | Inter | 14px | 600 | 1.20 | 0px | "1,248 likes" — if shown |
| Timestamp | Inter | 11px | 500 | 1.00 | 0.4px | "2 HOURS AGO" uppercase meta |
| CTA Text | Inter | 15px | 600 | 1.00 | 0px | Any "Learn more" link inside card |

### Principles
- **Single typeface, matched weights**: Inter across all elements. The card must read as native platform UI, and every native platform uses one sans-serif family.
- **Inter 600 for usernames**: This is the exact weight Instagram, Threads, and X use for the display name in post cards. Do not use 700 (too heavy) or 500 (too light) — 600 is the right reading.
- **Inter 400 for caption body**: Captions on social platforms are always regular weight, not medium. Keep the caption honest: weight 400, size 15-17px.
- **Tight but not aggressive tracking**: Headings use -0.3 to -0.5px tracking. Caption body is 0px. Timestamps are 0.4px uppercase.
- **Line height 1.45 for captions**: Natural, readable, matches platform rendering. Do not go below 1.35 or above 1.55.
- **No italic, no decorative variants**: Platforms don't show italic in captions by default, so we don't either. Keep it plain.

## 4. Component Patterns

### Background Scene (CRITICAL — always present)

The full-bleed container that holds a blurred real-world photograph. The scene is product-context-specific: for food, use a kitchen counter with product visible in foreground; for fashion, use a closet with garments; for tech, use a workspace with a laptop; for home goods, use a styled room. Never use a gradient or flat color — the scene photography is essential to the style.

```html
<div style="position: relative; width: 100%; height: 100%; overflow: hidden;">
  <!-- Blurred real-world photograph as the scene backdrop -->
  <div style="position: absolute; inset: 0; background-image: url('https://example.com/kitchen-counter-mealprep.jpg'); background-size: cover; background-position: center; filter: blur(2px) brightness(0.95);"></div>
  <!-- Subtle vignette to push the card forward -->
  <div style="position: absolute; inset: 0; background: radial-gradient(ellipse at center, rgba(0,0,0,0) 0%, rgba(0,0,0,0.1) 80%, rgba(0,0,0,0.2) 100%); pointer-events: none;"></div>
  <!-- Simulated post card centered on the scene -->
  <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);">
    <!-- Post card content goes here -->
  </div>
</div>
```

Guidance: the background should be a photographed scene relevant to the product — e.g., for food use a kitchen counter; for fashion use a closet; for tech use a workspace; for home goods use a styled room. The blur stays at 2–4px and brightness at 0.95. Never over-blur (above 5px it reads as generic glass effect, which is Frosted Lens, not this style).

### Simulated Post Card (SIGNATURE component)

The core element. A crisp white rounded rectangle styled to look exactly like an Instagram post, with header row, square photo, action row, and caption — in that fixed order.

```html
<div style="width: 500px; background: var(--color-card-white); border-radius: 16px; box-shadow: 0 16px 48px rgba(0,0,0,0.12); overflow: hidden; font-family: var(--font-body);">
  <!-- Header Row: avatar + username + menu -->
  <div style="display: flex; align-items: center; padding: 14px 16px 12px; gap: 12px;">
    <div style="width: 40px; height: 40px; border-radius: 50%; background: #f2f2f2 url('https://example.com/avatar.jpg') center/cover; flex-shrink: 0; border: 1px solid rgba(0,0,0,0.04);"></div>
    <div style="flex: 1; min-width: 0;">
      <p style="font-family: var(--font-body); font-size: 15px; font-weight: 600; color: var(--color-near-black); margin: 0; line-height: 1.20; letter-spacing: -0.1px;">Stefano Reed</p>
    </div>
    <div style="font-size: 20px; color: var(--color-icon-gray); line-height: 1; padding: 0 4px; font-weight: 700;">&#8943;</div>
  </div>
  <!-- Main Square Photo -->
  <div style="padding: 0 16px;">
    <div style="width: 100%; aspect-ratio: 1 / 1; background: var(--color-surface-photo) url('https://example.com/mealprep-hero.jpg') center/cover; border-radius: 8px; border: 1px solid rgba(0,0,0,0.04);"></div>
  </div>
  <!-- Action Row: heart, comment, share, bookmark -->
  <div style="display: flex; align-items: center; padding: 14px 16px 8px; gap: 16px;">
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-icon-gray)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-icon-gray)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-icon-gray)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
    <div style="flex: 1;"></div>
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-icon-gray)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
  </div>
  <!-- Caption -->
  <div style="padding: 4px 16px 20px;">
    <p style="font-family: var(--font-body); font-size: 16px; font-weight: 400; line-height: 1.45; color: var(--color-near-black); margin: 0;">I've tried my fair share of meal prep kits, but this one is a total game-changer. Everything comes pre-portioned, super fresh, and packed with flavor&mdash;no more sad desk lunches!</p>
  </div>
</div>
```

### Avatar Circle

A 40px circular avatar with a photo or initial fallback, used in the post card header row.

```html
<!-- Photo avatar -->
<div style="width: 40px; height: 40px; border-radius: 50%; background: #f2f2f2 url('https://example.com/avatar.jpg') center/cover; border: 1px solid rgba(0,0,0,0.04);"></div>

<!-- Initial fallback avatar -->
<div style="width: 40px; height: 40px; border-radius: 50%; background: var(--color-icon-gray); display: flex; align-items: center; justify-content: center; color: #ffffff; font-family: var(--font-body); font-size: 15px; font-weight: 600;">SR</div>
```

### Action Icon Row

The horizontal row of heart, comment, paper plane, and bookmark icons that makes the card read as a social post. Must be present — do not skip.

```html
<div style="display: flex; align-items: center; padding: 14px 16px 8px; gap: 16px;">
  <!-- Heart -->
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#262626" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
  <!-- Comment -->
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#262626" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
  <!-- Share / Paper Plane -->
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#262626" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
  <div style="flex: 1;"></div>
  <!-- Bookmark (far right) -->
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#262626" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
</div>
```

Unicode fallback: if SVG is not practical, use `♡` (heart), `💬` (comment), `✈` (share), `🔖` (bookmark) — but SVG is preferred because the icons must read as flat line art, not emoji.

### Stat Display (inside card)

When the post card needs to show a stat in the caption area — like counts or rating metrics — stack them like Instagram's native "X likes" row.

```html
<div style="padding: 4px 16px 6px;">
  <p style="font-family: var(--font-body); font-size: 14px; font-weight: 600; color: var(--color-near-black); margin: 0;">1,248 likes</p>
</div>
```

### Quote / Testimonial Caption

Most common use: the caption area holds a short testimonial. Keep it to 3-5 lines of Inter 400 at 16px with 1.45 line height, left-aligned.

```html
<div style="padding: 4px 16px 20px;">
  <p style="font-family: var(--font-body); font-size: 16px; font-weight: 400; line-height: 1.45; color: var(--color-near-black); margin: 0;"><span style="font-weight: 600;">stefanoreed</span> I've tried my fair share of meal prep kits, but this one is a total game-changer. Everything comes pre-portioned, super fresh, and packed with flavor&mdash;no more sad desk lunches!</p>
  <p style="font-family: var(--font-body); font-size: 11px; font-weight: 500; line-height: 1.00; letter-spacing: 0.4px; text-transform: uppercase; color: var(--color-tertiary); margin: 8px 0 0;">2 HOURS AGO</p>
</div>
```

### CTA Block (outside the card)

Optional: if the design needs a CTA, it sits outside the post card, layered over the scene background, typically at the bottom in Inter 700 with a soft dark pill button.

```html
<div style="text-align: center; padding: 24px 0 0;">
  <a style="display: inline-block; background: var(--color-near-black); color: #ffffff; font-family: var(--font-body); font-size: 15px; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 32px; box-shadow: 0 8px 24px rgba(0,0,0,0.18);">Try the kit</a>
</div>
```

## 5. Layout Principles

### Spacing Scale
- **4px**: Micro gap — between icon and adjacent element in the action row.
- **8px**: Tight gap — between caption and timestamp row.
- **12px**: Small gap — between avatar and username in the header row.
- **14px**: Card header padding top/bottom — matches Instagram's standard header inset.
- **16px**: Card horizontal padding — the standard left/right inset for all card content.
- **20px**: Card bottom padding — after the caption.
- **24px**: Base gap between card and background edge on a 1:1 square at 600px canvas.
- **32px**: Medium gap for poster/story layouts between card and headline.
- **48px**: Section divider — used when multiple cards stack.
- **80px**: Maximum section padding for story and slides formats around the card.

### Format Padding

| Format | Outer Padding | Card Width | Card Radius |
|--------|---------------|------------|-------------|
| Square 1:1 (600×600 or 1080×1080) | 40–60px on all sides | 440–520px | 16px |
| Story 1080x1920 | 120px top/bottom, 60px left/right | 500px | 16px |
| Poster 1080x1350 | 60px left/right, 80px top/bottom | 500px | 16px |
| Slides 1920x1080 | 80px all sides | 560px | 16px |
| Infographic 1080×N | 60px left/right, 80px top/bottom per section | 500px | 16px |

### Alignment & Grid
- **Primary composition**: Card is always horizontally centered on the scene background. Vertical alignment is typically center, but can shift slightly upward (approx 45%) to give headline space above.
- **Card internal alignment**: Left-aligned. Username, caption, and action icons all anchor to the left padding edge.
- **Action row special case**: The bookmark icon is always flex-pushed to the right edge; heart/comment/share cluster left.
- **Grid**: Single centered card per composition. For multi-card stories, stack cards vertically with 48px gap.
- **Content gravity**: The card is the center of gravity. Any supporting text (headline, CTA) lives in the scene area above or below the card, with 32px minimum distance.
- **Scene photography rules**: The real-world photo should have a natural horizon or surface line that the card can sit on. For food, shoot the countertop flat-on with containers in the foreground. For fashion, shoot the closet from a clean front angle. For tech, shoot the desk with subtle perspective.

## 6. Depth & Elevation

| Level | Treatment | Use |
|-------|-----------|-----|
| Flat (Level 0) | No shadow | Scene background photograph |
| Subtle (Level 1) | `0 2px 8px rgba(0,0,0,0.04)` | Inner photo square inside the card |
| Card (Level 2) | `0 16px 48px rgba(0,0,0,0.12)` | The signature post card drop shadow |
| Elevated (Level 3) | `0 24px 64px rgba(0,0,0,0.18)` | Featured card with extra emphasis |
| Overlay (Level 4) | `0 32px 80px rgba(0,0,0,0.25)` | Card over very busy background, or modal overlay |

### Border Treatments
- **Card outer border**: No border — the card is defined purely by its drop shadow. This is critical: a visible border breaks the "floating social post" illusion.
- **Inner photo border**: `1px solid rgba(0,0,0,0.04)` with `border-radius: 8px` — a barely-visible hairline that defines the photo area without being a frame.
- **Avatar border**: `1px solid rgba(0,0,0,0.04)` at 50% radius — keeps the circle crisp against the white card.
- **Divider rule (inside card)**: `1px solid #efefef` for any full-width horizontal separator between sections.

### Surface Hierarchy
Depth is communicated via shadow intensity and the contrast between the scene (busy, blurred, tonal) and the card (flat white, crisp).
1. **Scene background** — blurred, photographic, the deepest layer.
2. **Card** (`#ffffff`) — flat white, defined by its drop shadow, floats above the scene.
3. **Inner photo** inside the card — the second-highest information layer, visually "pressed into" the card with a barely-there border.
4. **Action icons** — the highest-contrast line elements in the composition, anchoring the card as a social post.

## 7. Do's and Don'ts

### Do
- Use a blurred real-world photograph as the scene background — the scene photography is essential to the style.
- Center the simulated post card on the scene with generous space around it.
- Use Inter (400/500/600/700) for everything to match real social platform UI.
- Use a 40px circular avatar with a real photo or initials in the card header.
- Use Inter 600 at 15px for the username — matches native platform weight.
- Use soft drop shadows (`0 16px 48px rgba(0,0,0,0.12)`) on the post card so it looks dropped-in.
- Use SVG or Unicode icons for the action row — heart, comment, share, bookmark in that order with bookmark pushed right.
- Keep the card border-radius at 16px to match current Instagram card radius.
- Keep the caption at 3–5 lines of Inter 400 at 16px, left-aligned, line-height 1.45.
- Use a 1:1 square canvas as the primary format — the post card looks best on a square poster.
- Include all four action icons (heart, comment, share, bookmark) — they are what make the card read as a social post.
- Ensure the scene background is contextually relevant to the product (kitchen for food, closet for fashion, workspace for tech).

### Don't
- Don't use solid-color backgrounds — the scene photography is essential. No flat colors, no gradients, no abstract patterns.
- Don't over-blur the background — stay around 2–4px. Above 5px it reads as generic glassmorphism, which is Frosted Lens, not this style.
- Don't use fonts other than Inter — a serif or display face immediately breaks the "real social post" illusion.
- Don't skip the action icon row — it is the single most important element that makes the card read as a social post.
- Don't use pure black (`#000000`) for text — use `#111111` or `#262626` for warmth and to match Instagram's actual text color.
- Don't use a visible border on the main card — the card is defined by its drop shadow only.
- Don't use emoji icons for the action row — use SVG line icons. Emoji are rendered as color glyphs and break the native-UI look.
- Don't place the card off-center — centered is correct; off-center feels like a layout mistake.
- Don't stack multiple post cards in a single square frame — one card per composition.
- Don't omit the avatar circle — the header row must have avatar + username to read as a post.
- Don't use more than 5 lines of caption — real social captions are short.
- Don't use serif, display, or monospace fonts anywhere — Inter only.

## 8. Responsive Behavior

This is a fixed-dimension graphics system — it responds across **format dimensions**, not device breakpoints. The same visual language adapts from a 1080x1080 square to a 1920x1080 widescreen to a 1080x1920 vertical story by scaling type, padding, and composition to fit the frame. The detailed per-format adaptations live in §9 Format Adaptation Notes; this section captures the principles that govern all of them.

- **Type ramps with frame size.** Headlines scale up on Slides (1920x1080) and Story (1080x1920), scale down on Carousel (1080x1080). Body copy holds a readable floor (~16-22px) across every format; never drop below 14px or the render stops being legible at native social resolution.
- **Padding scales with the narrow edge.** Use ~60px padding on 1080-wide frames, ~80px on 1920-wide frames. Story (1080x1920) adds extra top/bottom padding (~120px) to reserve safe zones for platform UI chrome.
- **Safe zones are non-negotiable on Story.** Reserve the top 160px (profile/progress bar) and bottom 160px (reply input) — no load-bearing text or focal elements there.
- **One idea per frame.** Content density does not grow with frame size. Bigger frames earn more breathing room, not more content. A Slides deck shows the same one idea per slide as the Carousel, just larger.
- **Signature components stay constant.** The style's signature move (accent colour, hero component, tag/badge treatment) keeps the same visual weight across formats — the composition around it adapts, the move itself does not.
- **Aspect-ratio aware composition.** Square frames → centred or two-column grid. Vertical → single centred column with vertical rhythm. Widescreen → left-heavy 60/40 split (content left, breathing room or supporting visuals right). Portrait poster → three vertical zones (headline / content / CTA).
- **Raster export.** Everything is rendered to PNG at the target pixel dimensions via Playwright — no CSS media queries, no fluid layouts. Each format is its own fixed canvas.

## 9. Format Adaptation Notes

### Carousel / Square (1080x1080px)
- **Typography scale**: Username stays at 15px, caption at 16px — do not scale these up, they must match native platform sizing. Optional headline above card at 48px Inter 700.
- **Padding**: 60px on all sides. Card centered at 500×620px.
- **Cover slide**: Scene background + centered post card. Optional framework label or headline sits above the card with 32px gap.
- **Content slides**: Each slide is a single post card with different username, photo, and caption — a testimonial carousel.
- **Card position**: Centered horizontally. Vertically, shift to ~48% of canvas height to give slight breathing room above.
- **Swipe indicator**: Small dots at bottom center over the scene, 6px diameter, white at 80% opacity for active, white at 30% opacity for inactive.

### Infographic (1080px wide, variable height)
- **Typography**: Card typography stays constant (Inter 15/16px). Section headlines between card groups at 32-40px Inter 700.
- **Padding**: 60px left/right. 80px top/bottom.
- **Vertical rhythm**: Stack post cards with 48px gap between them. Each card represents a different testimonial in a sequence.
- **Scene strategy**: For infographic use, the scene background can shift between sections — different scene per testimonial card — or use a single continuous blurred scene behind the entire stack.
- **Footer**: Small Inter 500 at 13px with uppercase letter-spacing for brand attribution.

### Slides (1920x1080px)
- **Typography scale**: Card content stays at native size (15/16px) — it must look like a real post. Supporting headline above or beside card can scale to 72-88px Inter 700.
- **Padding**: 80px on all sides. Card at 560×700px, positioned left or center.
- **Layout**: Two common patterns:
  1. **Centered hero**: Card centered on a full-bleed blurred scene, with optional headline stacked above.
  2. **Split layout**: Card on the left third, headline + CTA stacked on the right two thirds over the scene.
- **Title slides**: Card centered, headline above at 72px Inter 700, optional CTA button below.
- **CTA slides**: Card on one side, CTA headline and button on the other, all on one continuous scene background.

### Poster (1080x1350px)
- **Typography**: Card content at native size. Optional headline above card at 56-64px Inter 700.
- **Padding**: 60px left/right, 80px top/bottom.
- **Composition**: Top third for optional headline. Middle third for the post card (centered, ~500×620px). Bottom third for CTA button and small attribution.
- **Scene strategy**: Full-bleed blurred photograph from edge to edge. Card floats dead-center. Let the scene photography carry the brand recognition.

### Story (1080x1920px)
- **Typography scale**: Card content at native size (Inter 15/16px). Optional headline above card at 56-64px Inter 700. Uppercase framework label (if used) at Inter 600 12px with 0.8px letter-spacing.
- **Padding**: 120px top/bottom + 60px left/right. Safe zones: 160px top and 220px bottom reserved for platform UI (profile avatar, progress bar, reply input, share sticker row). All critical content must sit inside y=160 to y=1700.
- **Layout**: Single centered column. Card at 500×620px, centered horizontally at x=540, vertically centered around y=960. The scene background runs full-bleed edge to edge.
- **Cover slide**: Scene background edge-to-edge. Card centered. Optional 56-64px Inter 700 headline 48px above the card (y ≈ 380). Small uppercase brand label (Inter 600 12px, letter-spacing 0.8px) 24px above the headline.
- **Content slides**: One testimonial card per slide. For multi-testimonial stories, each slide is a different username + photo + caption but the same scene background to imply a series.
- **CTA slide**: Card at top half with a final testimonial. Below the card (48px gap), a dark pill CTA button (`#111111`, white Inter 600 15px, 32px radius, 14px×32px padding) with a soft drop shadow. Optional small Inter 500 11px caption above the button in uppercase letter-spacing for a call to action label.
- **Progress indicator**: Thin segments at y=40, inactive white at 30% opacity, active white at 90% opacity. Sits above the scene, does not touch the card.

## 10. Agent Prompt Guide

### Quick Color Reference

| Name | Hex | Usage |
|------|-----|-------|
| Card White | `#ffffff` | Post card surface |
| Near-Black | `#111111` | Primary text inside card |
| Icon Gray | `#262626` | Action icon stroke color |
| Timestamp Gray | `#8e8e8e` | Meta text, timestamps |
| Instagram Red | `#ed4956` | Active heart/like accent |
| Link Blue | `#00376b` | Caption mentions and links |
| Scene Backdrop | `#eeeae5` | Fallback solid if photo fails |
| Divider Gray | `#efefef` | Hairline separators |
| Surface Photo | `#f2f2f2` | Inner photo area background |
| Secondary Text | `#555555` | Sub-username, supporting text |
| Disabled | `#c7c7c7` | Inactive elements |

### Font Declarations

```css
/* Single family — Inter for everything */
font-family: 'Inter', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif;
```

### Google Fonts Link

```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
```

### CSS Root Variables

```css
:root {
  /* Colors -- Primary */
  --color-card-white: #ffffff;
  --color-near-black: #111111;
  --color-scene-backdrop: #eeeae5;

  /* Colors -- Accent */
  --color-instagram-red: #ed4956;
  --color-link-blue: #00376b;
  --color-timestamp: #8e8e8e;

  /* Colors -- Neutral Scale */
  --color-icon-gray: #262626;
  --color-divider: #efefef;
  --color-secondary: #555555;
  --color-tertiary: #8e8e8e;
  --color-disabled: #c7c7c7;
  --color-shadow-hint: rgba(0, 0, 0, 0.04);

  /* Colors -- Surfaces */
  --color-surface-card: #ffffff;
  --color-surface-photo: #f2f2f2;

  /* Colors -- Borders */
  --color-border-default: rgba(0, 0, 0, 0.06);
  --color-border-photo: rgba(0, 0, 0, 0.04);
  --color-border-accent: rgba(237, 73, 86, 0.3);
  --color-divider-rule: #efefef;

  /* Colors -- Shadows */
  --shadow-subtle: rgba(0, 0, 0, 0.04);
  --shadow-card: rgba(0, 0, 0, 0.12);
  --shadow-card-deep: rgba(0, 0, 0, 0.18);
  --shadow-scene: rgba(0, 0, 0, 0.25);

  /* Typography -- Families */
  --font-display: 'Inter', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif;
  --font-body: 'Inter', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif;

  /* Typography -- Sizes */
  --text-display-hero: 48px;
  --text-section-heading: 32px;
  --text-username: 15px;
  --text-sub-username: 12px;
  --text-caption: 16px;
  --text-action-count: 14px;
  --text-timestamp: 11px;
  --text-cta: 15px;

  /* Typography -- Weights */
  --weight-regular: 400;
  --weight-medium: 500;
  --weight-semibold: 600;
  --weight-bold: 700;

  /* Typography -- Line Heights */
  --leading-display: 1.15;
  --leading-heading: 1.20;
  --leading-caption: 1.45;
  --leading-tight: 1.00;

  /* Spacing */
  --space-micro: 4px;
  --space-tight: 8px;
  --space-small: 12px;
  --space-card-header: 14px;
  --space-card-padding: 16px;
  --space-card-bottom: 20px;
  --space-base: 24px;
  --space-medium: 32px;
  --space-section: 48px;
  --space-max: 80px;

  /* Borders */
  --radius-card: 16px;
  --radius-photo: 8px;
  --radius-avatar: 50%;
  --radius-cta: 32px;

  /* Composed Shadows */
  --shadow-card-drop: 0 16px 48px rgba(0, 0, 0, 0.12);
  --shadow-card-deep-drop: 0 24px 64px rgba(0, 0, 0, 0.18);
  --shadow-inner-photo: 0 2px 8px rgba(0, 0, 0, 0.04);
  --shadow-cta-button: 0 8px 24px rgba(0, 0, 0, 0.18);

  /* Scene Background */
  --scene-blur: blur(2px) brightness(0.95);
}
```

### System Font Fallbacks
- **Sans-serif (if Inter fails to load):** `-apple-system, 'Segoe UI', Helvetica, Arial, sans-serif`
- **No serif fallback** — this style does not use serif typography. If Inter is completely unavailable, use the system sans stack above.
