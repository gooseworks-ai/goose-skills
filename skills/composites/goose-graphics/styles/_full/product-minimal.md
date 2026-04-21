# Design Style: Product Minimal

## 1. Visual Theme & Atmosphere

Product Minimal is the design language of quiet luxury product pages -- the visual equivalent of a silver sedan photographed on a studio floor with nothing else in the frame. This is the aesthetic of Apple's product detail pages, Lucid Motors' hero sections, Nothing's marketing site, and Airbnb at its cleanest. Where other minimal styles lean on typography or negative space as the hero, Product Minimal hands the entire stage to a single product photograph. The page exists to frame the object, not to compete with it. Everything -- the type, the colour palette, the chrome -- recedes so the product can sit forward.

The canvas is pure, uncompromised white (`#FFFFFF`). Unlike most refined design systems that warm white slightly to avoid clinical harshness, Product Minimal insists on genuine `#FFFFFF` because the product photo sets the temperature: the subtle shadow cast beneath the object, the soft reflection on its surfaces, the ambient warmth of studio lighting -- these read correctly only against true white. Warm off-whites muddy the photograph and make the object feel like it is sitting on paper rather than floating in a seamless infinity backdrop. The drop-shadow beneath the product (`filter: drop-shadow(0 24px 48px rgba(0,0,0,0.08))`) is the only "depth" on the page and it belongs to the photo, not the layout.

Typography is deliberately a single family, set quietly. Inter at weight 700 carries the headline; Inter at weight 400 carries the body in a softer gray (`#555555`); Inter at weight 500 underlines the URL that functions as the page's only call to action. There are no buttons with fills, no coloured accents, no icons, no dividers except a single 1px footer rule. The typographic move is to stay out of the photo's way -- tight tracking, modest sizes, generous whitespace, centered alignment below the hero image. When the product is the brand, the words are the caption. Think of the pages where a premium brand simply writes "A New Standard in Motion" under an image of the thing itself and trusts you to know the rest.

**Key Characteristics:**
- Pure white background (`#FFFFFF`) -- one of the only styles where genuine `#FFFFFF` is correct, because the product photo sets the temperature
- Near-black (`#1A1A1A`) for headlines, medium gray (`#555555`) for body, muted gray (`#777777`) for the underlined URL
- Product photo occupies ~60% of the frame vertically and anchors the composition
- Subtle drop-shadow under product (`filter: drop-shadow(0 24px 48px rgba(0,0,0,0.08))`) -- the only depth cue in the layout
- Inter as the single typeface at weights 400, 500, 700 -- no secondary family
- Headline Inter 700 at ~36px with tight tracking (-0.5px)
- Body Inter 400 at ~18px in softer gray, line-height 1.55
- Underlined URL at Inter 500, muted gray, replaces the filled-button CTA pattern
- Only two text colours plus a URL gray -- never more
- Centered alignment below the product photo; the photo itself is horizontally centered in its container
- Only one decorative mark permitted: a thin 1px rule above the footer
- Massive whitespace padding around the product photo -- let it breathe in its own studio

## 2. Color Palette & Roles

### Primary
- **Pure White** (`#FFFFFF`): Primary background. Genuinely pure white -- this is one of the very few styles where the canvas is not warmed. The product photograph carries all the temperature.
- **Near-Black** (`#1A1A1A`): Primary headline colour. Warm enough to avoid the hardness of absolute black, dark enough to command attention beneath the photograph.
- **Body Gray** (`#555555`): Body copy colour. A softer mid-gray that recedes behind the headline and keeps the paragraph from competing with the product.

### Accent
- **URL Gray** (`#777777`): Muted gray for the underlined URL "button" -- quieter than body text because it is a subtle CTA, not a visual anchor.
- **URL Hover** (`#1A1A1A`): On hover, the URL darkens to near-black -- the only interactive colour shift in the system.

### Neutral Scale
- **Photo Shadow** (`rgba(0,0,0,0.08)`): The soft drop-shadow cast beneath the product photograph.
- **Footer Rule** (`rgba(0,0,0,0.08)`): The single 1px rule above the footer text -- the only structural line in the entire layout.
- **Metadata Gray** (`#999999`): Timestamps, attributions, and footer caption text.
- **Disabled Gray** (`#CCCCCC`): Disabled state for the underlined URL.
- **Photo Frame** (`#FAFAFA`): Optional barely-there tint for the photo container when you need to suggest a container without actually drawing one. Use sparingly.

### Surface & Borders
- **Surface Primary** (`#FFFFFF`): The canvas itself -- there are no other surfaces. Cards, containers, and panels are all simply the white canvas.
- **Border Default** (none): Borders are forbidden on content elements. The product photo needs no frame.
- **Divider Rule** (`1px solid rgba(0,0,0,0.08)`): Used exclusively for the footer rule.
- **URL Underline** (`1px solid #777777`): The underline beneath the CTA URL. Matches the URL's own colour.

### Shadow Colors
- **Product Drop Shadow** (`rgba(0,0,0,0.08)`): The soft shadow beneath the product photograph -- large, diffuse, warm-neutral.
- **Shadow Micro** (`rgba(0,0,0,0.04)`): Reserved for optional hover lift on the CTA URL underline.
- **Shadow None** (`none`): The default. Every container is flat. Every card is flat. Only the product photo has a shadow.

## 3. Typography Rules

### Font Families

**Google Fonts CDN:**
```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&display=swap" rel="stylesheet">
```

- **Display**: `'Inter', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif`
- **Body**: `'Inter', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif`

### Hierarchy

| Role | Font | Size | Weight | Line Height | Letter Spacing | Notes |
|------|------|------|--------|-------------|----------------|-------|
| Display Hero | Inter | 48px | 700 | 1.15 | -0.75px | Rare -- used only for cover posters without a product photo above |
| Headline | Inter | 36px | 700 | 1.20 | -0.5px | The signature headline beneath the product photo |
| Sub-heading | Inter | 24px | 700 | 1.25 | -0.25px | Secondary statements, section titles |
| Body Large | Inter | 20px | 400 | 1.55 | 0px | Lead paragraphs when used without a hero photo |
| Body | Inter | 18px | 400 | 1.55 | 0px | Standard paragraph beneath the headline -- soft gray |
| Small / Caption | Inter | 14px | 400 | 1.50 | 0.1px | Footer text, timestamps, fine print |
| URL CTA | Inter | 16px | 500 | 1.00 | 0px | The underlined URL that replaces the filled-button CTA |
| Footer Label | Inter | 12px | 400 | 1.50 | 0.3px | Footer metadata below the rule |
| Big Numbers | Inter | 56px | 700 | 1.00 | -1px | Rare -- used only when a stat replaces the hero photo |

### Principles
- **Single family, three weights**: Inter 400 for body, Inter 500 for the URL CTA, Inter 700 for headlines. No other weights. No other families. The restraint is the identity.
- **Headlines stay modest**: The headline is 36px, not 72px. Product Minimal headlines are captions to the photograph -- they never compete with it. If the product photo is absent, scale up to 48px, never more.
- **Tight but not extreme tracking**: -0.5px at 36px, -0.75px at 48px. Headlines read tight and confident, but they are not "engineered" the way Space Grotesk or geometric sans headlines are. Inter stays warm.
- **Body in gray, not black**: Body text is always `#555555`, never near-black. The contrast drop keeps the paragraph soft and caption-like beneath the headline.
- **Center alignment below the product**: Headline, body, and URL are always center-aligned below the product photo. This is non-negotiable -- it is the signature composition.
- **Mixed case always**: No uppercase headlines, no uppercase labels. Product Minimal is a quiet style; it does not shout.
- **Underlined URL instead of buttons**: The CTA is always a plain underlined URL in Inter 500 medium-weight gray. No fills, no borders, no pills, no radii. This is the one pattern the style is most opinionated about.

## 4. Component Patterns

### Product Photo Hero

```html
<div style="background: var(--color-bg); padding: 80px 60px 40px; text-align: center;">
  <div style="max-width: 720px; margin: 0 auto;">
    <img
      src="[product.jpg]"
      alt="[Product name]"
      style="display: block; width: 100%; height: auto; max-height: 560px; object-fit: contain; filter: drop-shadow(0 24px 48px rgba(0,0,0,0.08));"
    />
  </div>
</div>
```

### Centered Headline Block

```html
<div style="background: var(--color-bg); padding: 40px 60px 80px; text-align: center;">
  <h1 style="font-family: var(--font-body); font-size: 36px; font-weight: 700; line-height: 1.20; letter-spacing: -0.5px; color: var(--color-near-black); margin: 0 0 20px;">A New Standard in Motion</h1>
  <p style="font-family: var(--font-body); font-size: 18px; font-weight: 400; line-height: 1.55; color: var(--color-body-gray); max-width: 520px; margin: 0 auto 28px;">Introducing a new approach to automotive design, where performance, comfort, and technology meet to shape the future of driving.</p>
  <a href="https://newcar.co" style="display: inline-block; font-family: var(--font-body); font-size: 16px; font-weight: 500; line-height: 1.00; color: var(--color-url-gray); text-decoration: underline; text-underline-offset: 4px; text-decoration-thickness: 1px;">newcar.co</a>
</div>
```

### Underlined URL Button

```html
<a
  href="https://newcar.co"
  style="display: inline-block; font-family: var(--font-body); font-size: 16px; font-weight: 500; line-height: 1.00; color: var(--color-url-gray); text-decoration: underline; text-underline-offset: 4px; text-decoration-thickness: 1px; background: none; border: none; padding: 0;"
>newcar.co</a>
```

### Thin Footer Rule

```html
<div style="padding: 32px 60px 40px; text-align: center;">
  <div style="width: 100%; max-width: 720px; height: 1px; background: rgba(0,0,0,0.08); margin: 0 auto 20px;"></div>
  <p style="font-family: var(--font-body); font-size: 12px; font-weight: 400; line-height: 1.50; letter-spacing: 0.3px; color: var(--color-metadata); margin: 0;">&copy; 2026 Newcar Inc. All rights reserved.</p>
</div>
```

### Full Product Page Composition

```html
<div style="background: var(--color-bg); min-height: 100%; display: flex; flex-direction: column;">
  <!-- Product photo (~60% of frame) -->
  <div style="flex: 0 0 auto; padding: 80px 60px 40px; text-align: center;">
    <div style="max-width: 720px; margin: 0 auto;">
      <img src="[product.jpg]" alt="[Product]" style="display: block; width: 100%; height: auto; max-height: 560px; object-fit: contain; filter: drop-shadow(0 24px 48px rgba(0,0,0,0.08));" />
    </div>
  </div>
  <!-- Centered headline block -->
  <div style="flex: 1 1 auto; padding: 20px 60px 40px; text-align: center;">
    <h1 style="font-family: var(--font-body); font-size: 36px; font-weight: 700; line-height: 1.20; letter-spacing: -0.5px; color: var(--color-near-black); margin: 0 0 20px;">A New Standard in Motion</h1>
    <p style="font-family: var(--font-body); font-size: 18px; font-weight: 400; line-height: 1.55; color: var(--color-body-gray); max-width: 520px; margin: 0 auto 28px;">Introducing a new approach to automotive design, where performance, comfort, and technology meet to shape the future of driving.</p>
    <a href="https://newcar.co" style="display: inline-block; font-family: var(--font-body); font-size: 16px; font-weight: 500; color: var(--color-url-gray); text-decoration: underline; text-underline-offset: 4px; text-decoration-thickness: 1px;">newcar.co</a>
  </div>
</div>
```

### Caption Pair (Photo + One-Liner)

```html
<div style="text-align: center; padding: 40px 60px;">
  <div style="max-width: 600px; margin: 0 auto 32px;">
    <img src="[product.jpg]" alt="[Product]" style="display: block; width: 100%; height: auto; filter: drop-shadow(0 24px 48px rgba(0,0,0,0.08));" />
  </div>
  <p style="font-family: var(--font-body); font-size: 24px; font-weight: 700; line-height: 1.25; letter-spacing: -0.25px; color: var(--color-near-black); max-width: 520px; margin: 0 auto;">Engineered for the road ahead.</p>
</div>
```

### Quiet Stat Display

```html
<div style="text-align: center; padding: 60px 40px;">
  <p style="font-family: var(--font-body); font-size: 56px; font-weight: 700; line-height: 1.00; letter-spacing: -1px; color: var(--color-near-black); margin: 0 0 12px;">412 mi</p>
  <p style="font-family: var(--font-body); font-size: 16px; font-weight: 400; line-height: 1.55; color: var(--color-body-gray); max-width: 320px; margin: 0 auto;">Projected EPA range on a single charge.</p>
</div>
```

### Two-Up Product Grid

```html
<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 60px; padding: 60px;">
  <div style="text-align: center;">
    <img src="[product-a.jpg]" alt="[Product A]" style="display: block; width: 100%; height: auto; filter: drop-shadow(0 24px 48px rgba(0,0,0,0.08)); margin: 0 0 24px;" />
    <h3 style="font-family: var(--font-body); font-size: 20px; font-weight: 700; line-height: 1.25; letter-spacing: -0.25px; color: var(--color-near-black); margin: 0 0 8px;">Sedan</h3>
    <p style="font-family: var(--font-body); font-size: 14px; font-weight: 400; line-height: 1.50; color: var(--color-body-gray); margin: 0;">Designed for the long haul.</p>
  </div>
  <div style="text-align: center;">
    <img src="[product-b.jpg]" alt="[Product B]" style="display: block; width: 100%; height: auto; filter: drop-shadow(0 24px 48px rgba(0,0,0,0.08)); margin: 0 0 24px;" />
    <h3 style="font-family: var(--font-body); font-size: 20px; font-weight: 700; line-height: 1.25; letter-spacing: -0.25px; color: var(--color-near-black); margin: 0 0 8px;">Coupe</h3>
    <p style="font-family: var(--font-body); font-size: 14px; font-weight: 400; line-height: 1.50; color: var(--color-body-gray); margin: 0;">Built for the drive itself.</p>
  </div>
</div>
```

## 5. Layout Principles

### Spacing Scale
- **4px**: Micro gap -- between text-decoration underline and baseline (via `text-underline-offset`).
- **8px**: Tight gap -- rarely used in this style; the smallest practical gap is 12px.
- **12px**: Small gap -- between a big number and its label in a stat display.
- **20px**: Base gap -- between headline and body paragraph.
- **28px**: Medium gap -- between body paragraph and URL CTA.
- **32px**: Inter-element gap -- between the photo shadow and the headline that sits below it.
- **40px**: Section internal -- padding above the headline block when it sits beneath a product photo.
- **60px**: Outer horizontal padding -- the standard left/right padding for every format.
- **80px**: Outer vertical padding -- the standard top/bottom padding, and the minimum breathing room above a product photo.
- **120px**: Maximum padding -- reserved for Story formats and posters where the photo needs to float even more.

### Format Padding
| Format | Outer Padding | Content Max-Width |
|--------|---------------|-------------------|
| Carousel (1080x1080) | 60px all sides | 960px |
| Infographic (1080xN) | 60px left/right, 80px top/bottom | 960px |
| Slides (1920x1080) | 80px all sides | 1760px |
| Poster (1080x1350) | 60px left/right, 80px top/bottom | 960px |
| Story (1080x1920) | 60px left/right, 120px top/bottom | 960px |

### Alignment & Grid
- **Primary alignment**: Centered for everything. Headlines, body, URLs, photos, and footer text all center-align along the vertical axis. This is the one place Product Minimal is rigid.
- **Grid**: Single column by default. Two-column grid permitted only for side-by-side product comparisons, and even then only with centered content within each column.
- **Vertical rhythm**: Photo occupies the top ~60% of the frame. Headline + body + URL occupy the next ~30%. Footer (if present) occupies the final ~10%. Gaps between these zones are 40-48px, never less.
- **Content gravity**: Pull everything toward the vertical centre of the frame. There is no left-heavy or right-heavy composition in this style.
- **Generous outer padding**: 60px minimum on all sides, scaling up on larger formats. The photo needs a studio, and the studio needs walls.
- **Photo-first composition**: Every page, poster, and slide begins with the product photo. If there is no product photo, use a different style.

## 6. Depth & Elevation

| Level | Treatment | Use |
|-------|-----------|-----|
| Flat (Level 0) | No shadow, no border, background `#FFFFFF` | Every layout container, every text block, every card |
| Photo Shadow (Level 1) | `filter: drop-shadow(0 24px 48px rgba(0,0,0,0.08))` | The product photograph -- the only elevated element on the page |
| Hover Micro (Level 2) | `text-decoration-color` darkens from `#777777` to `#1A1A1A` | URL CTA hover state |
| Rule (Level 3) | `1px solid rgba(0,0,0,0.08)` as divider | Footer rule only |
| Overlay (Level 4) | `0 16px 40px rgba(0,0,0,0.12)` | Modals and lightboxes when absolutely necessary |

### Border Treatments
- **No borders on content**: Cards, containers, and text blocks are never bordered. The product photo needs no frame.
- **Footer rule**: `1px solid rgba(0,0,0,0.08)` spanning the content max-width above footer text. This is the only rule permitted in the layout.
- **URL underline**: `text-decoration: underline; text-decoration-thickness: 1px; text-underline-offset: 4px;` -- the underline is the CTA.
- **No rounded corners**: Product Minimal has no rounded elements. The photo has no rounded frame. The URL has no pill. The footer rule has no radius. Everything is either a flat line or a photograph.

### Surface Hierarchy
On pure white backgrounds, hierarchy is communicated entirely through the product photo's drop-shadow and typographic weight:
1. **Canvas** (`#FFFFFF`) -- the entire surface. Nothing else steps up.
2. **Photo** (`drop-shadow(0 24px 48px rgba(0,0,0,0.08))`) -- the only elevated element. It floats above everything.
3. **Headline** (`#1A1A1A`, weight 700) -- the typographic anchor beneath the photo.
4. **Body** (`#555555`, weight 400) -- recedes from the headline.
5. **URL** (`#777777`, weight 500, underlined) -- the quiet CTA, lower contrast than body.

This is one of the few styles where depth is delivered almost entirely by the photograph. The layout contributes nothing beyond whitespace. That is the point.

## 7. Do's and Don'ts

### Do
- Use pure white (`#FFFFFF`) as the background -- this is one of the very few styles where genuine pure white is correct, because the product photograph sets the temperature.
- Let the product photo occupy roughly the top 60% of the frame -- the composition exists to frame the object.
- Apply `filter: drop-shadow(0 24px 48px rgba(0,0,0,0.08))` to every product photo -- the subtle shadow is what makes it feel studio-lit rather than pasted on.
- Use Inter for everything -- a single family at weights 400, 500, and 700. No secondary typeface.
- Center-align the headline, body, and URL beneath the product photo. Always.
- Use underlined URLs (`#777777`, Inter 500, underlined with `text-underline-offset: 4px`) as the CTA pattern. This replaces filled buttons entirely.
- Keep headlines modest in size (36px) -- they are captions to the photograph, not competing statements.
- Use `#555555` for body copy, never near-black -- the softer gray keeps the paragraph from overpowering the headline.
- Let the product photo breathe with massive whitespace -- 60-80px minimum padding on every side of the image container.
- Use `object-fit: contain` on the product photo so it never crops or stretches -- the object must be presented whole.
- Include exactly one decorative mark: a 1px rule above the footer, if a footer exists at all.

### Don't
- Don't use coloured backgrounds -- not warm whites, not light grays, not tinted anything. Pure white only.
- Don't use filled button CTAs -- no pills, no rectangles, no rounded buttons. The CTA is always a plain underlined URL.
- Don't use more than two text colours (`#1A1A1A` for headline + `#555555` for body). The URL's `#777777` is the only third colour permitted.
- Don't add any coloured accents -- no blue, no green, no brand red. This is a chromatically neutral style.
- Don't add borders to any content element -- cards, containers, and text blocks are never bordered. The product photo needs no frame.
- Don't use rounded corners anywhere -- not on the photo, not on the footer rule, not on any imagined button (because there are no buttons).
- Don't decorate -- no icons, no emoji, no illustrations, no patterns, no gradients, no textures. Every decorative element should be cut before shipping.
- Don't left-align the headline block -- Product Minimal is always center-aligned below the photo.
- Don't scale the headline above 48px -- headlines are captions, not hero type. If you want type-hero, use a different style.
- Don't use body text heavier than weight 400 -- the softer weight keeps the paragraph caption-like.
- Don't use the headline and body at the same colour -- the contrast drop between `#1A1A1A` and `#555555` is load-bearing.
- Don't place anything beside the product photo -- no sidebars, no callouts, no floating stats. The photo owns its row.

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

### Carousel (1080x1080px)
- **Typography scale**: Headline at 36px, Body at 18px, URL CTA at 16px. These are the baseline values -- carousel is the reference format for this style.
- **Padding**: 60px on all sides. Content area is 960x960px.
- **Cover slide**: Product photo fills the top ~60% of the slide (approximately 600px tall, centered). Headline centered at ~20px below the photo, body at ~20px below the headline, URL at ~28px below the body. Entire text block sits in the bottom ~35% of the slide.
- **Content slides**: One product, one idea per slide. Photo + headline + one-sentence body. No list content, no comparison grids, no stat rows.
- **Photo treatment**: Always `object-fit: contain` on a max-height of approximately 560px. `filter: drop-shadow(0 24px 48px rgba(0,0,0,0.08))`.
- **Swipe indicator**: Omit entirely, or use tiny 4px gray dots (`rgba(0,0,0,0.12)`) at the very bottom centre with an active dot in near-black. The style prefers no indicator if the platform allows.

### Infographic (1080px wide, variable height)
- **Typography**: Headline at 40px, Sub-heading at 24px, Body at 18px.
- **Padding**: 60px left/right, 80px top/bottom.
- **Section spacing**: 120px vertical gap between product sections -- more breathing room than any other style, because each product photo needs its own studio.
- **Vertical rhythm**: Alternate between full-width product photos and quiet caption blocks beneath them. Never place two product photos side-by-side without massive vertical separation.
- **Footer**: Thin 1px rule at `rgba(0,0,0,0.08)`, followed by 12px Inter 400 metadata text in `#999999`, centered.

### Slides (1920x1080px)
- **Typography scale up**: Headline becomes 56px with -0.75px tracking. Sub-heading becomes 32px. Body Large becomes 22px.
- **Padding**: 80px on all sides. Content area is 1760x920px.
- **Layout**: Product photo centered horizontally, occupying roughly the left 60% of the frame OR the full top 55% of the frame. Headline and body stacked beside the photo (right 40%) or beneath it (bottom 40%).
- **Photo treatment**: Max height 720px, `object-fit: contain`, drop-shadow unchanged from baseline.
- **Title slides**: Product photo centered in the top half. Headline + body + URL stacked in the bottom half, centered.
- **Content slides**: Single product focus. Optional two-up product grid only when the comparison is the entire point of the slide.

### Poster (1080x1350px)
- **Typography**: Headline at 40px. Sub-heading at 24px. Body at 18px.
- **Padding**: 60px left/right, 80px top/bottom.
- **Composition**: Top ~65% for the product photo (approximately 780px tall). Middle ~25% for centered headline + body + URL. Bottom ~10% for optional footer rule + metadata.
- **Vertical flow**: Strictly top-to-bottom. The photo is the anchor; everything else captions it.
- **CTA placement**: URL centered below body, ~28px gap. Never a button.

### Story (1080x1920px)
- **Typography scale up**: Headline becomes approximately 46-48px (hero type ~30% bigger than Carousel 36px) in Inter 700 with -0.75px tracking. Sub-heading becomes 30px. Body Large becomes 22px in Inter 400. URL CTA stays at Inter 500 18px underlined.
- **Padding**: 120px top/bottom + 60px left/right. Safe zones: 160px top and 160px bottom reserved for platform UI (profile avatar, progress bar, reply input). All critical content must sit inside y=160 to y=1760.
- **Layout**: Single centered column. Content max-width 960px. Vertical center of gravity -- the product photo should occupy the upper-middle third (roughly y=280 to y=1180), with the headline block clustering in y=1240 to y=1600. Pure white (`#FFFFFF`) runs edge-to-edge with no tint or texture.
- **Cover slide**: Product photo centered horizontally, approximately 900px tall max, sitting in y=280 to y=1180 with the signature `filter: drop-shadow(0 24px 48px rgba(0,0,0,0.08))` beneath it. Below the photo (starting around y=1260), the Inter 700 headline at 46-48px with tight -0.75px tracking in near-black, then a 22px Inter 400 body paragraph in `#555555` with max-width 720px, then an 18px Inter 500 underlined URL in `#777777`. Every element is center-aligned along the vertical axis.
- **Content slides**: One product, one caption per slide. Photo in the upper zone, headline + body + URL stacked below. No numbered steps, no bordered cards, no framework tags -- this style refuses structural chrome.
- **CTA slide**: If a dedicated CTA slide is needed, it uses the same composition as the cover: a product photo above a headline and URL. The URL itself is the CTA -- there is no button. A thin 1px `rgba(0,0,0,0.08)` footer rule may sit just above the bottom safe zone with 12px metadata beneath it.
- **Progress indicator**: If required by the platform, use tiny 3px-tall segmented bars at the top of the safe zone. Inactive segments in `rgba(0,0,0,0.08)`, active segment in near-black (`#1A1A1A`). Absolute minimum chrome -- the style prefers no indicator if the platform permits.

## 10. Agent Prompt Guide

### Quick Color Reference

| Name | Hex | Usage |
|------|-----|-------|
| Pure White | `#FFFFFF` | Primary background -- genuinely pure white |
| Near-Black | `#1A1A1A` | Primary headline colour, URL hover state |
| Body Gray | `#555555` | Body paragraph colour |
| URL Gray | `#777777` | Underlined URL CTA colour |
| Metadata Gray | `#999999` | Footer metadata, timestamps, fine print |
| Disabled Gray | `#CCCCCC` | Disabled URL states |
| Photo Frame | `#FAFAFA` | Optional barely-there photo container tint (rare) |
| Photo Shadow | `rgba(0,0,0,0.08)` | Drop-shadow beneath the product photograph |
| Footer Rule | `rgba(0,0,0,0.08)` | The single 1px rule above footer text |

### Font Declarations

```css
/* Display and body share a single family */
font-family: 'Inter', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif;
```

### Google Fonts Link

```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&display=swap" rel="stylesheet">
```

### CSS Root Variables

```css
:root {
  /* Colors -- Primary */
  --color-bg: #FFFFFF;
  --color-near-black: #1A1A1A;
  --color-body-gray: #555555;

  /* Colors -- Accent (muted URL system) */
  --color-url-gray: #777777;
  --color-url-hover: #1A1A1A;

  /* Colors -- Neutral Scale */
  --color-metadata: #999999;
  --color-disabled: #CCCCCC;
  --color-photo-frame: #FAFAFA;

  /* Colors -- Surfaces */
  --color-surface-primary: #FFFFFF;

  /* Colors -- Borders */
  --color-border-none: transparent;
  --color-divider-rule: rgba(0, 0, 0, 0.08);
  --color-url-underline: #777777;

  /* Colors -- Shadows */
  --shadow-photo: rgba(0, 0, 0, 0.08);
  --shadow-micro: rgba(0, 0, 0, 0.04);
  --shadow-overlay: rgba(0, 0, 0, 0.12);

  /* Typography -- Families */
  --font-display: 'Inter', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif;
  --font-body: 'Inter', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif;

  /* Typography -- Sizes */
  --text-display-hero: 48px;
  --text-headline: 36px;
  --text-sub-heading: 24px;
  --text-body-large: 20px;
  --text-body: 18px;
  --text-small: 14px;
  --text-footer: 12px;
  --text-url-cta: 16px;
  --text-big-number: 56px;

  /* Typography -- Weights */
  --weight-headline: 700;
  --weight-url: 500;
  --weight-body: 400;

  /* Typography -- Line Heights */
  --leading-headline: 1.20;
  --leading-sub-heading: 1.25;
  --leading-body-large: 1.55;
  --leading-body: 1.55;
  --leading-small: 1.50;
  --leading-number: 1.00;

  /* Typography -- Letter Spacing */
  --tracking-display-hero: -0.75px;
  --tracking-headline: -0.5px;
  --tracking-sub-heading: -0.25px;
  --tracking-body: 0px;
  --tracking-footer: 0.3px;

  /* Spacing */
  --space-micro: 4px;
  --space-tight: 12px;
  --space-small: 20px;
  --space-base: 28px;
  --space-medium: 32px;
  --space-large: 40px;
  --space-horizontal: 60px;
  --space-vertical: 80px;
  --space-story: 120px;

  /* Borders */
  --radius-none: 0px;
  --border-footer-rule: 1px solid rgba(0, 0, 0, 0.08);
  --border-url-underline: 1px solid #777777;

  /* Shadows -- Composed */
  --shadow-product: drop-shadow(0 24px 48px rgba(0, 0, 0, 0.08));
  --shadow-rule: 1px solid rgba(0, 0, 0, 0.08);
  --shadow-overlay-modal: 0 16px 40px rgba(0, 0, 0, 0.12);

  /* Photo sizing */
  --photo-max-height-carousel: 560px;
  --photo-max-height-slide: 720px;
  --photo-max-height-poster: 780px;
  --photo-max-height-story: 900px;
}
```

### System Font Fallbacks
- **Sans-serif (if Inter fails to load):** `-apple-system, 'Segoe UI', Helvetica, Arial, sans-serif`
