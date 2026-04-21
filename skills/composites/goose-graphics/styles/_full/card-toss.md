# Design Style: Card Toss

## 1. Visual Theme & Atmosphere

Card Toss is the design language of playful confidence -- the visual equivalent of tossing your best reviews onto a table and letting them speak for themselves. The pure black canvas (`#000000`) acts as a void, a stage floor, an infinite dark surface on which brightly colored cards appear to have been casually scattered at jaunty angles. This is not the darkness of sophistication or mystery; it is the darkness of a photographer's backdrop, chosen so that every card pops with maximum saturation and presence. The overall effect is bold, app-native, and unapologetically marketing-forward -- the kind of graphic you see in a top-grossing app's press kit or App Store feature.

The typography lives on the cards themselves, not floating in the void. Each card is a self-contained world with its own color, its own message, and its own typographic rules. Headings use a confident serif -- warm, slightly editorial, with visible stroke contrast -- that gives award announcements and testimonials a sense of authority and earned credibility. Body text and names use a clean geometric sans-serif that stays legible at small sizes and provides a modern counterpoint to the serif display text. The combination of serif authority and sans-serif clarity gives each card the feel of a premium product review or magazine pull-quote. Star ratings, avatar photos, and brand logos add social proof density without cluttering the composition.

The color system is deliberately limited to three card surface colors -- a vivid sunshine yellow (`#FFD60A`), a clear cornflower blue (`#4A9FE5`), and a warm coral-orange (`#F47B5E`) -- against the pure black background. These are not pastel or muted; they are saturated, confident, and immediately recognizable. The off-white circle element floating between cards acts as a punctuation mark, a visual breath, a subtle nod to app iconography. Cards are rotated at slight angles (-5 to +8 degrees), overlapping casually, creating a sense of physical objects tossed onto a surface. The large rounded corners (20px radius) reinforce the app-native, friendly, touchable quality of the cards. This is design that says "people love us, and we are not afraid to show it."

**Key Characteristics:**
- Pure black background (`#000000`) as a void stage for maximum card contrast
- Three saturated card surface colors: sunshine yellow (`#FFD60A`), cornflower blue (`#4A9FE5`), coral-orange (`#F47B5E`)
- Dark text (`#1A1A1A`) on colored card surfaces -- black-on-color for readability
- Cards rotated at casual angles (-5deg to +8deg) with overlapping composition
- Large rounded corners (`20px`) on all cards -- app-native, friendly, touchable
- Serif display font (DM Serif Display) for headlines, awards, and testimonial quotes -- editorial authority
- Sans-serif body font (DM Sans) for names, labels, and supporting text -- clean and modern
- Star ratings rendered as solid black stars on yellow cards -- social proof as visual element
- Avatar photos (circular, 40-48px) paired with reviewer names for testimonial credibility
- Off-white accent circle (`#F5F0E0`) as a floating decorative element between cards
- No visible borders on cards -- color surfaces define the card edges against the black void
- Physical "tossed" energy: slight rotations, overlaps, and casual placement create a tangible, real-world feel

## 2. Color Palette & Roles

### Primary
- **Void Black** (`#000000`): Primary background. Pure black as an infinite stage for the colored cards.
- **Card Text** (`#1A1A1A`): Primary text color on card surfaces. Near-black for maximum readability on bright card colors.
- **Sunshine Yellow** (`#FFD60A`): Primary card color. Used for the dominant testimonial card -- warm, energetic, attention-grabbing.

### Accent
- **Cornflower Blue** (`#4A9FE5`): Secondary card color for award badges, accolades, and secondary social proof.
- **Coral Orange** (`#F47B5E`): Tertiary card color for brand cards, logos, and supplementary content.
- **Dark Yellow** (`#D4B000`): Hover/pressed state for yellow card interactions.
- **Dark Blue** (`#3A7FBF`): Hover/pressed state for blue card interactions.
- **Dark Coral** (`#D4664D`): Hover/pressed state for coral card interactions.

### Neutral Scale
- **Off-White** (`#F5F0E0`): Decorative accent circles and soft highlight elements.
- **Light Gray** (`#E8E8E8`): Secondary text on dark surfaces (if needed outside cards).
- **Medium Gray** (`#999999`): Tertiary text, metadata, timestamps on dark backgrounds.
- **Dark Gray** (`#555555`): Disabled text and placeholder content.
- **Charcoal** (`#2A2A2A`): Subtle surface variation on dark backgrounds for non-card containers.
- **Near Black** (`#111111`): Elevated surface slightly above the void for section differentiation.

### Surface & Borders
- **Surface Void** (`#000000`): Base canvas, the infinite black backdrop.
- **Surface Elevated** (`#111111`): Slightly lifted dark surface for non-card content areas.
- **Card Surface Yellow** (`#FFD60A`): Yellow card background.
- **Card Surface Blue** (`#4A9FE5`): Blue card background.
- **Card Surface Coral** (`#F47B5E`): Coral card background.
- **Border Default** (`rgba(255,255,255,0.08)`): Subtle border for rare edge cases on dark surfaces.
- **Border Card** (`none`): Cards have no borders -- color surfaces define edges against black.
- **Divider Rule** (`rgba(255,255,255,0.12)`): Faint divider for content within dark sections.

### Shadow Colors
- **Shadow Deep** (`rgba(0,0,0,0.7)`): Primary card drop shadow creating the floating "tossed" effect.
- **Shadow Medium** (`rgba(0,0,0,0.4)`): Standard elevation shadow for cards at rest.
- **Shadow Warm** (`rgba(0,0,0,0.5)`): Shadow with slightly warm cast for overlapping card edges.
- **Shadow Ambient** (`rgba(0,0,0,0.2)`): Subtle ambient shadow for gentle lift.

## 3. Typography Rules

### Font Families

**Google Fonts CDN:**
```html
<link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet">
```

- **Display**: `'DM Serif Display', Georgia, 'Times New Roman', serif`
- **Body**: `'DM Sans', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif`

### Hierarchy

| Role | Font | Size | Weight | Line Height | Letter Spacing | Notes |
|------|------|------|--------|-------------|----------------|-------|
| Display Hero | DM Serif Display | 64px | 400 | 1.05 | -0.5px | Card headlines, award announcements, maximum impact |
| Section Heading | DM Serif Display | 44px | 400 | 1.10 | -0.3px | Major card headings, accolade text |
| Sub-heading | DM Serif Display | 32px | 400 | 1.15 | 0px | Secondary card titles, smaller testimonial quotes |
| Body Large | DM Sans | 20px | 400 | 1.55 | 0px | Lead testimonial text, primary quotes on cards |
| Body | DM Sans | 16px | 400 | 1.60 | 0px | Standard card body text, testimonial copy |
| Small / Caption | DM Sans | 13px | 500 | 1.45 | 0.3px | Metadata, source attributions, dates |
| Big Numbers | DM Serif Display | 120px | 400 | 0.90 | -2px | Oversized ratings, scores, or metrics on cards |
| Reviewer Name | DM Sans | 16px | 600 | 1.20 | 0px | Attribution names below testimonials |
| CTA Text | DM Sans | 16px | 700 | 1.00 | 1px | Button and call-to-action text, uppercase |
| Star Rating | System | 20px | 400 | 1.00 | 2px | Black star characters on yellow cards |

### Principles
- **Serif for authority, sans for clarity**: DM Serif Display on headings and awards conveys editorial weight and credibility -- the kind of typeface you see in magazine award announcements. DM Sans handles body text and names with clean, modern legibility.
- **Text lives on cards, not in the void**: Almost all typography appears on colored card surfaces. The black background is empty space. This means text color is almost always dark (`#1A1A1A`) on bright surfaces, not light-on-dark.
- **Generous but not loose**: Line heights on cards (1.55-1.60 for body) give testimonial text breathing room without feeling sparse. Serif display text runs tighter (1.05-1.15) for impact.
- **Weight contrast within DM Sans**: Reviewer names at 600 weight stand out from body text at 400 weight, creating a clear attribution hierarchy without changing font family.
- **No uppercase on serif headings**: DM Serif Display is used in title case or sentence case, never all-caps. Its stroke contrast and serifs provide enough visual weight without uppercase treatment.
- **Star ratings as typography**: Star characters (Unicode black stars) are rendered inline as a typographic element, not as icon images. They follow the same color rules as text.

## 4. Component Patterns

### Testimonial Card (Primary)

```html
<div style="background-color: var(--color-sunshine-yellow); padding: 40px 36px; border-radius: 20px; transform: rotate(-3deg); max-width: 480px; box-shadow: var(--shadow-card);">
  <div style="font-size: 20px; letter-spacing: 2px; color: var(--color-card-text); margin: 0 0 20px;">&#9733;&#9733;&#9733;&#9733;&#9733;</div>
  <p style="font-family: var(--font-body); font-size: 18px; font-weight: 400; line-height: 1.55; color: var(--color-card-text); margin: 0 0 28px;">"I've tried a handful of health apps over the years, but this is the first one that actually helped me stay consistent. The daily check-ins are quick and the progress tracking makes it easy to see improvements over time."</p>
  <div style="display: flex; align-items: center; gap: 12px;">
    <div style="width: 44px; height: 44px; border-radius: 50%; background: var(--color-charcoal); overflow: hidden;"><img src="avatar.jpg" style="width: 100%; height: 100%; object-fit: cover;" /></div>
    <p style="font-family: var(--font-body); font-size: 16px; font-weight: 600; line-height: 1.20; color: var(--color-card-text); margin: 0;">Maya Davidson</p>
  </div>
</div>
```

### Award Card

```html
<div style="background-color: var(--color-cornflower-blue); padding: 48px 40px; border-radius: 20px; transform: rotate(4deg); max-width: 420px; box-shadow: var(--shadow-card); text-align: center;">
  <h2 style="font-family: var(--font-display); font-size: 44px; font-weight: 400; line-height: 1.10; letter-spacing: -0.3px; color: var(--color-card-text); margin: 0;">Awarded Gold in Customer Safety by App Guide 2026</h2>
</div>
```

### Brand Logo Card

```html
<div style="background-color: var(--color-coral-orange); padding: 32px 40px; border-radius: 20px; transform: rotate(-5deg); max-width: 280px; box-shadow: var(--shadow-card); display: flex; align-items: center; gap: 12px;">
  <div style="font-size: 28px; color: var(--color-card-text);">&#9658;&#9658;</div>
  <span style="font-family: var(--font-display); font-size: 48px; font-weight: 400; color: var(--color-card-text); margin: 0;">Duo</span>
</div>
```

### Stat Display Card

```html
<div style="background-color: var(--color-sunshine-yellow); padding: 48px 36px; border-radius: 20px; transform: rotate(2deg); max-width: 400px; box-shadow: var(--shadow-card); text-align: center;">
  <p style="font-family: var(--font-display); font-size: 120px; font-weight: 400; line-height: 0.90; letter-spacing: -2px; color: var(--color-card-text); margin: 0 0 16px;">4.9</p>
  <div style="font-size: 20px; letter-spacing: 2px; color: var(--color-card-text); margin: 0 0 12px;">&#9733;&#9733;&#9733;&#9733;&#9733;</div>
  <p style="font-family: var(--font-body); font-size: 16px; font-weight: 500; line-height: 1.45; color: var(--color-card-text); margin: 0;">Average rating across 12,000+ reviews</p>
</div>
```

### Decorative Circle

```html
<div style="width: 80px; height: 80px; border-radius: 50%; background-color: var(--color-off-white); box-shadow: var(--shadow-ambient);"></div>
```

### Comparison Grid (Two Cards)

```html
<div style="position: relative; width: 100%; padding: 60px;">
  <div style="background-color: var(--color-sunshine-yellow); padding: 36px 32px; border-radius: 20px; transform: rotate(-4deg); max-width: 440px; box-shadow: var(--shadow-card); position: relative; z-index: 2;">
    <h3 style="font-family: var(--font-display); font-size: 32px; font-weight: 400; line-height: 1.15; color: var(--color-card-text); margin: 0 0 12px;">Before</h3>
    <p style="font-family: var(--font-body); font-size: 16px; font-weight: 400; line-height: 1.60; color: var(--color-card-text); margin: 0;">Manual tracking, forgotten goals, and inconsistent habits across multiple disconnected apps.</p>
  </div>
  <div style="background-color: var(--color-cornflower-blue); padding: 36px 32px; border-radius: 20px; transform: rotate(3deg); max-width: 440px; box-shadow: var(--shadow-card); position: relative; z-index: 1; margin-top: -30px; margin-left: 60px;">
    <h3 style="font-family: var(--font-display); font-size: 32px; font-weight: 400; line-height: 1.15; color: var(--color-card-text); margin: 0 0 12px;">After</h3>
    <p style="font-family: var(--font-body); font-size: 16px; font-weight: 400; line-height: 1.60; color: var(--color-card-text); margin: 0;">One app, daily check-ins, visible progress, and a community that keeps you accountable.</p>
  </div>
</div>
```

### Quote Card

```html
<div style="background-color: var(--color-coral-orange); padding: 40px 36px; border-radius: 20px; transform: rotate(2deg); max-width: 480px; box-shadow: var(--shadow-card);">
  <p style="font-family: var(--font-display); font-size: 32px; font-weight: 400; line-height: 1.15; color: var(--color-card-text); margin: 0 0 24px;">"The best investment I made in my health this year."</p>
  <div style="display: flex; align-items: center; gap: 12px;">
    <div style="width: 40px; height: 3px; background: var(--color-card-text);"></div>
    <p style="font-family: var(--font-body); font-size: 14px; font-weight: 600; letter-spacing: 0.5px; color: var(--color-card-text); margin: 0;">Dr. Sarah Kim, Wellness Coach</p>
  </div>
</div>
```

### CTA Card

```html
<div style="background-color: var(--color-cornflower-blue); padding: 48px 40px; border-radius: 20px; transform: rotate(-2deg); max-width: 480px; box-shadow: var(--shadow-card); text-align: center;">
  <h2 style="font-family: var(--font-display); font-size: 44px; font-weight: 400; line-height: 1.10; color: var(--color-card-text); margin: 0 0 20px;">Ready to start your journey?</h2>
  <p style="font-family: var(--font-body); font-size: 16px; font-weight: 400; line-height: 1.60; color: var(--color-card-text); max-width: 360px; margin: 0 auto 28px;">Join millions of users who transformed their daily habits.</p>
  <a style="display: inline-block; background: var(--color-card-text); color: var(--color-cornflower-blue); font-family: var(--font-body); font-size: 16px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; text-decoration: none; padding: 16px 40px; border-radius: 12px;">Download Free</a>
</div>
```

## 5. Layout Principles

### Spacing Scale
- **4px**: Micro gap -- between star characters in a rating row.
- **8px**: Tight gap -- between label and sub-label within a card.
- **12px**: Small gap -- between avatar and reviewer name, between icon and brand text.
- **16px**: Base gap -- between heading and body text on a card, between paragraphs.
- **20px**: Card internal -- between star rating and testimonial text.
- **28px**: Medium gap -- between testimonial body and attribution, between sections within a card.
- **36px**: Card padding (horizontal) -- standard internal padding on card surfaces.
- **40px**: Card padding (vertical top/bottom) -- generous breathing room inside cards.
- **48px**: Large card padding -- hero cards and award cards with extra presence.
- **60px**: Scene padding -- outer margin around the entire card composition.

### Format Padding
| Format | Outer Padding | Content Max-Width |
|--------|---------------|-------------------|
| Carousel (1080x1080) | 48px all sides | 984px |
| Infographic (1080xN) | 48px left/right, 60px top/bottom | 984px |
| Slides (1920x1080) | 80px all sides | 1760px |
| Poster (1080x1350) | 48px left/right, 60px top/bottom | 984px |

### Alignment & Grid
- **Primary alignment**: Cards are positioned in a loose, organic scatter -- not on a rigid grid. The overall composition is roughly centered, but individual cards are offset and rotated.
- **Rotation range**: Cards rotate between -8deg and +8deg. No card should be perfectly horizontal. Vary rotations so adjacent cards are not at the same angle.
- **Overlap strategy**: Cards overlap by 20-60px at edges, creating a layered stack. Use `z-index` to control which card appears on top. The most important card (primary testimonial) should have the highest z-index.
- **Scatter placement**: Use absolute or relative positioning with manual offsets to create the "tossed" arrangement. Avoid CSS grid or flexbox for the main card layout -- the irregularity is the point.
- **Decorative elements**: Off-white circles (60-100px diameter) float between cards as visual punctuation. Place 1-2 per composition.
- **Vertical flow**: In multi-slide formats, the card scatter should flow top-to-bottom with the primary card near the top and supporting cards below and to the sides.
- **Content gravity**: The densest card (most text, star rating, avatar) should be positioned in the upper-center area. Smaller accent cards (brand logo, award badge) occupy the lower corners.

## 6. Depth & Elevation

| Level | Treatment | Use |
|-------|-----------|-----|
| Flat (Level 0) | No shadow, background `#000000` | The void background, empty canvas |
| Subtle (Level 1) | `rgba(0,0,0,0.2) 0px 4px 12px` | Decorative circles, small accent elements |
| Card (Level 2) | `rgba(0,0,0,0.4) 0px 12px 32px` | Standard tossed cards -- the primary elevation level |
| Featured (Level 3) | `rgba(0,0,0,0.5) 0px 20px 48px, rgba(0,0,0,0.3) 0px 8px 16px` | Primary testimonial card, highest-priority card in stack |
| Overlay (Level 4) | `rgba(0,0,0,0.7) 0px 24px 60px` | Modals or popups if needed (rare in this style) |

### Border Treatments
- **Standard border**: `none` -- cards in this style have no visible borders. The saturated card surface against the black void provides all the edge definition needed.
- **Internal divider**: `1px solid rgba(0,0,0,0.1)` -- a faint line within a card to separate sections, used sparingly.
- **Avatar border**: `2px solid rgba(255,255,255,0.3)` -- thin white ring around circular avatars for subtle separation from the card surface.
- **Decorative only**: If a border must be used, keep it at `1px solid rgba(0,0,0,0.08)` -- nearly invisible, just enough to hint at structure.

### Surface Hierarchy
On the pure black background, depth is communicated entirely through shadow intensity and card stacking:
1. **Void** (`#000000`) -- the bottomless dark surface. Nothing lives here except space.
2. **Background cards** -- cards at the bottom of the z-index stack, partially occluded, with standard shadows.
3. **Foreground cards** -- the primary content card(s), highest z-index, with heavier shadows and slight scale advantage.
4. **Decorative elements** -- off-white circles and small accent shapes that float between card layers.

The "tossed" physical metaphor is the depth system. Cards that appear closer (higher z-index, larger shadow offset) feel like they are sitting on top of cards further back. The rotation angles reinforce this -- a card tilted differently from its neighbor reads as being on a different plane.

## 7. Do's and Don'ts

### Do
- Use pure black (`#000000`) as the background -- no near-blacks, no dark grays. The void must be absolute.
- Rotate every card between -8deg and +8deg -- the casual scatter is the core visual identity.
- Use large rounded corners (`border-radius: 20px`) on all cards -- this is non-negotiable for the app-native feel.
- Use DM Serif Display for headings and award text on cards -- the serif authority is the typographic signature.
- Keep text color at `#1A1A1A` (near-black) on all colored card surfaces -- dark-on-bright for readability.
- Include star ratings (Unicode black stars) as a typographic social proof element on testimonial cards.
- Pair testimonial text with a circular avatar (44px) and a name in DM Sans 600 weight.
- Overlap cards by 20-60px to create the physical "tossed" layering effect.
- Use only the three card colors: sunshine yellow (`#FFD60A`), cornflower blue (`#4A9FE5`), coral orange (`#F47B5E`).
- Place 1-2 off-white decorative circles (`#F5F0E0`, 60-100px) between cards as visual punctuation.
- Use `box-shadow` with `rgba(0,0,0,0.4)` offsets of 12-20px to create convincing floating card depth.

### Don't
- Don't use visible borders on cards -- the saturated surface against black provides all edge definition.
- Don't align cards on a grid or make them perfectly horizontal -- the organic scatter is the entire point.
- Don't use more than 3 card colors in a single composition -- yellow, blue, and coral only.
- Don't use light text on card surfaces -- always use dark text (`#1A1A1A`) on bright card colors.
- Don't place text directly on the black background as a primary content strategy -- text lives on cards.
- Don't use small corner radii (4px, 8px) on cards -- always use 20px for the rounded, friendly feel.
- Don't use uppercase on DM Serif Display headings -- title case or sentence case only.
- Don't rotate cards beyond 10deg -- extreme rotations look chaotic rather than casually confident.
- Don't stack more than 4-5 cards in a single composition -- each card needs room to breathe and be read.
- Don't use gradients on card surfaces -- cards should be flat, solid color fills.
- Don't use glow effects or neon treatments -- this style is warm and physical, not digital and electric.
- Don't use thin font weights (300 or below) for body text on cards -- the colored surfaces demand at least 400 weight.

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
- **Typography scale**: Display Hero becomes 52px (from 64px). Section Heading becomes 36px. Body stays 16px.
- **Padding**: 48px on all sides. Card internal padding reduces to 32px horizontal, 36px vertical.
- **Card count**: Maximum 2-3 cards per slide. Cover slide: one large primary card with star rating and testimonial. Supporting slides: one card per slide with decorative circle.
- **Rotation**: Reduce rotation range to -5deg to +5deg on carousel format for better readability.
- **Swipe indicator**: Small off-white dots (`#F5F0E0`) at bottom center, 8px diameter, 12px gap.

### Infographic (1080px wide, variable height)
- **Typography**: Full-scale type hierarchy. Display Hero at 64px for the top card section.
- **Padding**: 48px left/right. 60px top/bottom margins.
- **Card flow**: Cards scatter down the vertical canvas. Alternate left-offset and right-offset cards with varying rotations. Space cards 40-60px apart vertically.
- **Section breaks**: Use off-white decorative circles between card groups. No horizontal rules.
- **Footer**: Small card at the bottom in coral with brand logo and CTA.

### Slides (1920x1080px)
- **Typography scale up**: Display Hero becomes 72px. Section Heading becomes 52px. Body Large becomes 22px.
- **Padding**: 80px on all sides. Cards have generous 48px internal padding.
- **Layout**: Widescreen allows side-by-side card scatter. 2-3 cards spread across the horizontal plane with overlaps. Primary card occupies center-left, supporting cards offset to the right.
- **Title slides**: Single large card centered with rotation, brand logo card in corner.
- **Content slides**: Card cluster with supporting data. Off-white circles as spacers.

### Poster (1080x1350px)
- **Typography**: Display Hero at 56px. Section Heading at 40px. Body at 16px.
- **Padding**: 48px left/right, 60px top/bottom.
- **Composition**: Top third: primary testimonial card (largest, most prominent rotation). Middle third: award card and brand logo card overlapping. Bottom third: CTA card or additional testimonial.
- **Vertical cascade**: Cards cascade downward with staggered rotations, creating a diagonal energy from top-left to bottom-right.
- **Decorative circles**: Place 2 off-white circles -- one between top and middle cards, one near the bottom edge.

### Story (1080x1920px)
- **Typography scale up**: Display Hero becomes 68px (approximately 30% larger than Carousel 52px). Section Heading becomes 48px. Body Large becomes 22px. Big Numbers for rating stats become 140px.
- **Padding**: 120px top/bottom + 60px left/right. Safe zones: 160px top and 160px bottom reserved for platform UI (profile avatar, progress bar, reply input). All critical text must sit inside y=160 to y=1760.
- **Layout**: Single centered column. Content max-width 960px. Vertical center of gravity -- cluster hero content in y=400 to y=1500 range. Cards are still scattered inside this column with rotations and overlaps.
- **Cover slide**: One primary yellow testimonial card (`#FFD60A`) centered high in the safe zone at roughly -4deg rotation, carrying the full DM Serif Display headline, 5-star Unicode rating, testimonial body in DM Sans, circular avatar, and reviewer name. An off-white decorative circle floats to one side. Card max-width around 820px so it still feels tossed onto the tall black void.
- **Content slides**: One card per slide, rotation -6deg to +6deg, with the tallest card taking the hero position (around y=500) and a smaller supporting card (brand logo, award) offset below it. Maintain the signature overlap -- let the secondary card tuck under the primary by 40-60px. Keep the cards solid yellow/blue/coral on the pure `#000000` void.
- **CTA slide**: Single cornflower blue card (`#4A9FE5`) centered with a -2deg rotation. DM Serif Display headline at 60px, short body, and a dark pill button (`#1A1A1A`) with white DM Sans 700 uppercase CTA text. Decorative off-white circle floats near the bottom edge of the safe zone.
- **Progress indicator**: Small off-white dots (`#F5F0E0`, 10px diameter, 14px gap) horizontally centered at the bottom edge of the bottom safe zone. Active dot fully opaque, inactive dots at 40% opacity. No swipe label -- the tossed cards already feel app-native.

## 10. Agent Prompt Guide

### Quick Color Reference

| Name | Hex | Usage |
|------|-----|-------|
| Void Black | `#000000` | Primary background -- pure black void |
| Card Text | `#1A1A1A` | Text on all colored card surfaces |
| Sunshine Yellow | `#FFD60A` | Primary card color: testimonials, star ratings |
| Cornflower Blue | `#4A9FE5` | Secondary card color: awards, accolades, CTAs |
| Coral Orange | `#F47B5E` | Tertiary card color: brand logos, quotes |
| Off-White | `#F5F0E0` | Decorative circles, soft accent elements |
| Dark Yellow | `#D4B000` | Hover state for yellow cards |
| Dark Blue | `#3A7FBF` | Hover state for blue cards |
| Dark Coral | `#D4664D` | Hover state for coral cards |
| Light Gray | `#E8E8E8` | Secondary text on dark surfaces (rare) |
| Medium Gray | `#999999` | Tertiary text, metadata |
| Charcoal | `#2A2A2A` | Subtle dark surface variation |
| Near Black | `#111111` | Elevated dark surface |

### Font Declarations

```css
font-family: 'DM Serif Display', Georgia, 'Times New Roman', serif;
font-family: 'DM Sans', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif;
```

### Google Fonts Link

```html
<link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet">
```

### CSS Root Variables

```css
:root {
  /* Colors -- Primary */
  --color-void-black: #000000;
  --color-card-text: #1A1A1A;
  --color-sunshine-yellow: #FFD60A;

  /* Colors -- Accent */
  --color-cornflower-blue: #4A9FE5;
  --color-coral-orange: #F47B5E;
  --color-dark-yellow: #D4B000;
  --color-dark-blue: #3A7FBF;
  --color-dark-coral: #D4664D;

  /* Colors -- Neutral Scale */
  --color-off-white: #F5F0E0;
  --color-light-gray: #E8E8E8;
  --color-medium-gray: #999999;
  --color-dark-gray: #555555;
  --color-charcoal: #2A2A2A;
  --color-near-black: #111111;

  /* Colors -- Surfaces */
  --color-surface-void: #000000;
  --color-surface-elevated: #111111;
  --color-surface-yellow: #FFD60A;
  --color-surface-blue: #4A9FE5;
  --color-surface-coral: #F47B5E;

  /* Colors -- Borders */
  --color-border-default: rgba(255, 255, 255, 0.08);
  --color-border-internal: rgba(0, 0, 0, 0.1);
  --color-border-avatar: rgba(255, 255, 255, 0.3);
  --color-divider-rule: rgba(255, 255, 255, 0.12);

  /* Colors -- Shadows */
  --shadow-deep: rgba(0, 0, 0, 0.7);
  --shadow-medium: rgba(0, 0, 0, 0.4);
  --shadow-warm: rgba(0, 0, 0, 0.5);
  --shadow-ambient: rgba(0, 0, 0, 0.2);

  /* Typography -- Families */
  --font-display: 'DM Serif Display', Georgia, 'Times New Roman', serif;
  --font-body: 'DM Sans', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif;

  /* Typography -- Sizes */
  --text-display-hero: 64px;
  --text-section-heading: 44px;
  --text-sub-heading: 32px;
  --text-body-large: 20px;
  --text-body: 16px;
  --text-small: 13px;
  --text-big-number: 120px;
  --text-reviewer-name: 16px;
  --text-cta: 16px;
  --text-star-rating: 20px;

  /* Typography -- Weights */
  --weight-display: 400;
  --weight-body: 400;
  --weight-body-medium: 500;
  --weight-name: 600;
  --weight-cta: 700;

  /* Typography -- Line Heights */
  --leading-display: 1.05;
  --leading-heading: 1.10;
  --leading-sub-heading: 1.15;
  --leading-body-large: 1.55;
  --leading-body: 1.60;
  --leading-small: 1.45;
  --leading-number: 0.90;
  --leading-name: 1.20;

  /* Spacing */
  --space-micro: 4px;
  --space-tight: 8px;
  --space-small: 12px;
  --space-base: 16px;
  --space-card-gap: 20px;
  --space-medium: 28px;
  --space-card-h: 36px;
  --space-card-v: 40px;
  --space-large: 48px;
  --space-scene: 60px;

  /* Borders */
  --radius-card: 20px;
  --radius-avatar: 50%;
  --radius-button: 12px;

  /* Shadows -- Composed */
  --shadow-card: rgba(0,0,0,0.4) 0px 12px 32px;
  --shadow-featured: rgba(0,0,0,0.5) 0px 20px 48px, rgba(0,0,0,0.3) 0px 8px 16px;
  --shadow-subtle: rgba(0,0,0,0.2) 0px 4px 12px;
  --shadow-overlay: rgba(0,0,0,0.7) 0px 24px 60px;

  /* Card Rotations */
  --rotate-slight-left: rotate(-3deg);
  --rotate-slight-right: rotate(3deg);
  --rotate-medium-left: rotate(-6deg);
  --rotate-medium-right: rotate(6deg);
}
```

### System Font Fallbacks
- **Display (if DM Serif Display fails to load):** `Georgia, 'Times New Roman', serif`
- **Body (if DM Sans fails to load):** `-apple-system, 'Segoe UI', Helvetica, Arial, sans-serif`
