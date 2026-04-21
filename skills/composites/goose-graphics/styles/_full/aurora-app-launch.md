# Design Style: Aurora App Launch

## 1. Visual Theme & Atmosphere

Aurora App Launch is the design language of a modern mindfulness-app reveal -- the visual equivalent of a Mac Big Sur wallpaper that has been carefully composed into a product poster. It is built around a single hero move: a soft, dreamy rainbow mesh gradient that flows across the entire canvas, starting in sky blue on the left, blooming through warm peach-coral in the centre, and resolving into a dusty pink-lavender on the right. Multiple blurry radial colour blobs stack on top of each other with mix-blend modes to create that unmistakable Figma-mesh-gradient feel -- a living, tactile atmosphere that looks like light filtered through stained glass at dawn. This gradient is not a background; it IS the style.

The hero composition is deliberately simple and emotionally loaded: a white-outlined phone mockup sits dead-centre over the upper half of the canvas, showing a meditation app screen. The app inside the phone uses Fraunces -- a modern display serif with warmth and gentle curves -- for the brand name ("Inara") and Inter for everything else. The Fraunces-on-gradient combination feels like a wellness brand out of Copenhagen or Melbourne: considered, warm, and unmistakably premium. The bottom ~45% of the canvas is covered by a large translucent frosted-glass card (`backdrop-filter: blur(40px)` over `rgba(255,255,255,0.2)`) holding a small "Download the app" label and a heavy, two-line Inter 700 headline in near-white. The frosted card is the CTA container -- it interrupts the gradient without killing it, because you can still see the aurora glowing through the glass.

The feel is dreamy, tactile, and unmistakably app-launch. Think: the marketing page for a Calm competitor, the Apple event slide that reveals a new wellness feature, the App Store feature graphic for a meditation app that just won Editor's Choice. It is aspirational without being cold, modern without being sterile, and soft without being boring. The entire style rests on the interplay between atmospheric colour and structural frosted glass.

**Key Characteristics:**
- Rainbow mesh gradient background built from 3-4 layered `radial-gradient` functions -- sky blue (`#A8C4E8`) + peach-coral (`#F2A87C`) + dusty pink (`#D4A8C4`) + soft lavender (`#C8B8E0`)
- White-outlined phone mockup as the centre-of-gravity hero visual (`border: 3px solid rgba(255,255,255,0.8)`, `border-radius: 48px`)
- Frosted-glass footer card occupying bottom ~45% (`backdrop-filter: blur(40px)`, `background: rgba(255,255,255,0.2)`)
- Fraunces display serif for the in-app brand name only -- the single warm editorial moment
- Inter 400/500/700 for everything else -- labels, body, headlines
- 95% white (`rgba(255,255,255,0.95)`) for text on gradient -- never pure `#ffffff` which burns out
- Small caps label above a heavy 2-line headline -- the signature CTA pattern
- Square 1:1 hero format, split roughly 55/45 between gradient-hero and frosted-footer
- No dark text on the light gradient -- the style demands white-on-soft-colour
- Progress bar inside the phone uses a translucent white fill -- matches the overall glass language

**How this differs from Frosted Lens:** Frosted Lens is built on blurred *photography* as the background layer -- a lifestyle image pushed out of focus behind a glass card. Aurora App Launch is built on *generated* colour -- a CSS-native rainbow mesh gradient with no photo at all. Frosted Lens is a generic content container; Aurora App Launch is structured around a specific hero pattern (phone mockup above, frosted footer below) and tuned for app-launch and product-reveal use cases. The fonts differ too: Aurora uses Fraunces as its editorial serif moment (reserved for in-app brand marks), while Frosted Lens uses its own pairing.

## 2. Color Palette & Roles

### Primary
- **Sky Blue** (`#A8C4E8`): Gradient origin -- the cool top-left anchor of the mesh. Soft, dusty, slightly desaturated.
- **Peach Coral** (`#F2A87C`): Gradient centre -- the warm middle bloom that gives the style its sunrise feel.
- **Dusty Pink** (`#D4A8C4`): Gradient terminus -- the muted rose-lavender on the right side of the mesh.

### Accent
- **Soft Lavender** (`#C8B8E0`): Fourth mesh blob, placed bottom-right to add depth and dimensional shift.
- **Warm Cream** (`#F5E6D8`): Occasional highlight bloom at the peach-blue transition; also usable as a subtle card tint.
- **Deep Navy** (`#2A3551`): The single reserved dark colour -- used ONLY for the Fraunces brand mark inside the phone mockup (to contrast against the app's internal gradient).

### Neutral Scale (mostly whites/translucencies -- this is a light style)
- **Near-White** (`rgba(255,255,255,0.95)`): Primary text colour on gradient. Almost white but with just enough softness to never burn out.
- **Soft White** (`rgba(255,255,255,0.80)`): Secondary text, labels, subtitles on gradient.
- **Muted White** (`rgba(255,255,255,0.60)`): Captions, metadata, progress-bar background fills.
- **Dim White** (`rgba(255,255,255,0.40)`): Dividers, inactive UI elements inside the phone mockup.
- **Phone Frame White** (`rgba(255,255,255,0.80)`): The outline stroke for the phone mockup container.

### Surface & Borders
- **Frosted Glass Surface** (`rgba(255,255,255,0.20)`): The bottom-footer card fill. Combined with `backdrop-filter: blur(40px)` to produce the signature glass effect.
- **Frosted Glass Inset** (`rgba(255,255,255,0.12)`): Secondary glass surface for nested cards and inner containers.
- **Phone Screen Tint** (`rgba(168, 196, 232, 0.25)`): The internal gradient layer on the phone app screen -- matches the parent mesh in colour but more saturated.
- **Glass Border** (`rgba(255,255,255,0.30)`): Thin white border on frosted cards for definition.
- **Phone Border** (`rgba(255,255,255,0.80)`): The 3px stroke that defines the phone mockup.
- **Divider Rule** (`rgba(255,255,255,0.15)`): Faint horizontal rules inside cards.

### Shadow Colors
- **Shadow Soft** (`rgba(42, 53, 81, 0.08)`): Ambient lift on the phone mockup -- tinted with navy to stay on-palette.
- **Shadow Medium** (`rgba(42, 53, 81, 0.14)`): Standard elevation for the phone and frosted card.
- **Shadow Deep** (`rgba(42, 53, 81, 0.22)`): High-contrast elevation for hero elements.

## 3. Typography Rules

### Font Families

**Google Fonts CDN:**
```html
<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;0,9..144,600;0,9..144,700;0,9..144,800;1,9..144,400;1,9..144,500;1,9..144,600;1,9..144,700&family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
```

- **Display Serif (in-app brand only)**: `'Fraunces', Georgia, 'Times New Roman', serif`
- **Body / Everything Else**: `'Inter', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif`

### Hierarchy

| Role | Font | Size | Weight | Line Height | Letter Spacing | Notes |
|------|------|------|--------|-------------|----------------|-------|
| App Brand Mark | Fraunces | 64px | 600 | 1.00 | -1px | Inside phone mockup only. Navy `#2A3551`. Use `font-optical-sizing: auto`. |
| Display Headline | Inter | 60px | 700 | 1.05 | -1.5px | 2-line frosted-footer headline. 95% white. |
| Display Hero XL | Inter | 72px | 700 | 1.05 | -2px | Upsized for larger formats (Slides, Story). |
| Section Heading | Inter | 40px | 700 | 1.15 | -0.8px | Subsection titles on content slides. |
| Small Caps Label | Inter | 16px | 500 | 1.00 | 0.3px | "Download the app" label above the headline. Not uppercase -- mixed case. 80% white. |
| Body Large | Inter | 22px | 500 | 1.55 | 0px | Lead paragraphs and supporting copy. 80% white. |
| Body | Inter | 18px | 500 | 1.55 | 0px | Standard body text. |
| App UI Title | Inter | 22px | 700 | 1.20 | -0.3px | "Evening Meditation" inside the phone. 95% white. |
| App UI Subtitle | Inter | 16px | 500 | 1.30 | 0px | "Stress relief" inside the phone. 70% white. |
| App UI Time | Inter | 12px | 500 | 1.00 | 0.2px | Progress bar timestamps. 60% white. |
| Small / Caption | Inter | 14px | 400 | 1.50 | 0.2px | Metadata, footnotes. 70% white. |
| CTA Text | Inter | 16px | 700 | 1.00 | 0.3px | Button text. |

### Principles
- **Fraunces is a precious resource**: Use it ONLY for the in-app brand mark inside the phone mockup. It is the single editorial-serif moment in the whole style. Using it elsewhere breaks the signature.
- **Inter does the heavy lifting**: 400 for light body, 500 for standard body and labels, 700 for headlines and CTA. Never use 300 (too thin on a busy gradient) and rarely use 800 (the 700 already reads heavy enough against the soft background).
- **95% white, never 100%**: Pure `#ffffff` burns out against the soft pastel gradient. Always use `rgba(255,255,255,0.95)` for primary text and `rgba(255,255,255,0.80)` for secondary. This is the single most important rule for readability.
- **Tight tracking on display**: Large Inter 700 headlines use `-1.5px` letter-spacing to feel dense and modern. Labels and body stay at 0px.
- **Left-aligned in the frosted footer**: The 2-line CTA headline always stacks left-aligned inside the frosted card -- never centred. The asymmetry creates the wellness-product poster feel.
- **Mixed case throughout**: No uppercase. Even the small caps label stays mixed case ("Download the app", not "DOWNLOAD THE APP"). Softness is the brand.

## 4. Component Patterns

### Aurora Mesh Gradient Background

The signature component. Layer 3-4 radial gradients to produce the mesh effect. Include a fallback linear gradient for reduced rendering paths.

```html
<div style="
  position: relative;
  width: 100%;
  min-height: 100vh;
  /* Fallback linear gradient (for simpler rendering or older browsers) */
  background: linear-gradient(110deg, #A8C4E8 0%, #F2A87C 50%, #D4A8C4 100%);
  /* Mesh: layered radial gradients */
  background-image:
    radial-gradient(circle at 15% 30%, #A8C4E8 0%, transparent 55%),
    radial-gradient(circle at 55% 45%, #F2A87C 0%, transparent 50%),
    radial-gradient(circle at 85% 35%, #D4A8C4 0%, transparent 55%),
    radial-gradient(circle at 75% 80%, #C8B8E0 0%, transparent 60%),
    linear-gradient(110deg, #A8C4E8 0%, #F2A87C 50%, #D4A8C4 100%);
  background-blend-mode: screen, screen, screen, normal, normal;
  overflow: hidden;
">
  <!-- Optional: extra blurred colour blob for depth -->
  <div style="
    position: absolute;
    top: 10%;
    left: 40%;
    width: 600px;
    height: 600px;
    background: radial-gradient(circle, #F5E6D8 0%, transparent 70%);
    filter: blur(80px);
    mix-blend-mode: screen;
    pointer-events: none;
  "></div>
  <!-- ...hero content goes here... -->
</div>
```

### Phone Mockup Container (Hero Visual)

A white-outlined phone frame sized ~280x560px with a pill notch at the top, holding a gentle inner gradient and the app UI.

```html
<div style="
  width: 280px;
  height: 560px;
  border: 3px solid rgba(255,255,255,0.80);
  border-radius: 48px;
  background: linear-gradient(180deg, rgba(168,196,232,0.35) 0%, rgba(242,168,124,0.25) 100%);
  box-shadow: 0 24px 60px rgba(42,53,81,0.14);
  position: relative;
  padding: 32px 24px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
">
  <!-- Top UI row: back chevron + menu dots -->
  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 40px;">
    <div style="width: 32px; height: 32px; border: 1.5px solid rgba(255,255,255,0.80); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
      <span style="color: rgba(255,255,255,0.95); font-family: var(--font-body); font-size: 14px;">&lsaquo;</span>
    </div>
    <div style="width: 32px; height: 32px; border: 1.5px solid rgba(255,255,255,0.80); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
      <span style="color: rgba(255,255,255,0.95); font-family: var(--font-body); font-size: 14px;">&#8942;</span>
    </div>
  </div>

  <!-- Brand mark (Fraunces) -->
  <div style="flex: 1; display: flex; align-items: center; justify-content: center;">
    <h2 style="
      font-family: var(--font-display);
      font-size: 64px;
      font-weight: 600;
      font-optical-sizing: auto;
      line-height: 1.00;
      letter-spacing: -1px;
      color: #2A3551;
      margin: 0;
    ">Inara</h2>
  </div>

  <!-- App UI title + progress bar -->
  <div style="text-align: center; padding-bottom: 16px;">
    <p style="font-family: var(--font-body); font-size: 22px; font-weight: 700; line-height: 1.20; letter-spacing: -0.3px; color: rgba(255,255,255,0.95); margin: 0 0 6px;">Evening Meditation</p>
    <p style="font-family: var(--font-body); font-size: 16px; font-weight: 500; line-height: 1.30; color: rgba(255,255,255,0.70); margin: 0 0 20px;">Stress relief</p>

    <!-- Progress bar -->
    <div style="height: 3px; background: rgba(255,255,255,0.30); border-radius: 2px; position: relative; margin-bottom: 8px;">
      <div style="position: absolute; top: 0; left: 0; height: 100%; width: 35%; background: rgba(255,255,255,0.95); border-radius: 2px;"></div>
    </div>
    <div style="display: flex; justify-content: space-between;">
      <span style="font-family: var(--font-body); font-size: 12px; font-weight: 500; letter-spacing: 0.2px; color: rgba(255,255,255,0.60);">4:15</span>
      <span style="font-family: var(--font-body); font-size: 12px; font-weight: 500; letter-spacing: 0.2px; color: rgba(255,255,255,0.60);">15:28</span>
    </div>
  </div>
</div>
```

### Frosted-Glass Footer Card

The bottom ~45% of the canvas. A large translucent card with heavy blur, holding the small label and the 2-line heavy headline.

```html
<div style="
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 45%;
  background: rgba(255,255,255,0.20);
  backdrop-filter: blur(40px);
  -webkit-backdrop-filter: blur(40px);
  border-top: 1px solid rgba(255,255,255,0.30);
  padding: 60px;
  display: flex;
  flex-direction: column;
  justify-content: center;
">
  <p style="
    font-family: var(--font-body);
    font-size: 16px;
    font-weight: 500;
    letter-spacing: 0.3px;
    color: rgba(255,255,255,0.80);
    margin: 0 0 20px;
  ">Download the app</p>
  <h1 style="
    font-family: var(--font-body);
    font-size: 60px;
    font-weight: 700;
    line-height: 1.05;
    letter-spacing: -1.5px;
    color: rgba(255,255,255,0.95);
    margin: 0;
  ">Little rituals.<br>Big shifts.</h1>
</div>
```

### Label + Heavy Headline Block (Standalone)

The signature CTA pattern -- small caps label above a left-aligned 2-line Inter 700 headline. Use inside frosted cards or on content slides.

```html
<div style="padding: 48px 0;">
  <p style="font-family: var(--font-body); font-size: 16px; font-weight: 500; letter-spacing: 0.3px; color: rgba(255,255,255,0.80); margin: 0 0 18px;">Start your practice</p>
  <h2 style="font-family: var(--font-body); font-size: 52px; font-weight: 700; line-height: 1.05; letter-spacing: -1.3px; color: rgba(255,255,255,0.95); margin: 0;">Five minutes.<br>New mind.</h2>
</div>
```

### Content Card (Nested Frosted)

For secondary content inside or beside the phone mockup.

```html
<div style="
  background: rgba(255,255,255,0.12);
  backdrop-filter: blur(30px);
  -webkit-backdrop-filter: blur(30px);
  border: 1px solid rgba(255,255,255,0.25);
  border-radius: 24px;
  padding: 32px 28px;
">
  <p style="font-family: var(--font-body); font-size: 14px; font-weight: 500; letter-spacing: 0.2px; color: rgba(255,255,255,0.70); margin: 0 0 12px;">Feature</p>
  <h3 style="font-family: var(--font-body); font-size: 28px; font-weight: 700; line-height: 1.15; letter-spacing: -0.5px; color: rgba(255,255,255,0.95); margin: 0 0 12px;">Guided breathwork</h3>
  <p style="font-family: var(--font-body); font-size: 18px; font-weight: 500; line-height: 1.55; color: rgba(255,255,255,0.80); margin: 0;">Short, targeted sessions for the moments that matter most.</p>
</div>
```

### CTA Button

Frosted pill button for in-app-style CTAs.

```html
<a style="
  display: inline-block;
  background: rgba(255,255,255,0.95);
  color: #2A3551;
  font-family: var(--font-body);
  font-size: 16px;
  font-weight: 700;
  letter-spacing: 0.3px;
  text-decoration: none;
  padding: 18px 44px;
  border-radius: 40px;
  box-shadow: 0 8px 24px rgba(42,53,81,0.14);
">Download now</a>
```

### Stat Display

```html
<div style="padding: 32px 0;">
  <p style="font-family: var(--font-body); font-size: 72px; font-weight: 700; line-height: 1.00; letter-spacing: -2px; color: rgba(255,255,255,0.95); margin: 0 0 8px;">2M+</p>
  <p style="font-family: var(--font-body); font-size: 16px; font-weight: 500; letter-spacing: 0.3px; color: rgba(255,255,255,0.80); margin: 0;">Moments of calm, delivered daily</p>
</div>
```

## 5. Layout Principles

### Spacing Scale
- **4px**: Micro gap -- progress-bar tick offset.
- **8px**: Tight -- app UI subtitle gap.
- **12px**: Small -- inside-card label-to-body.
- **16px**: Base -- between body paragraphs.
- **20px**: Label-to-headline -- the label sits 20px above the 2-line headline inside the frosted footer.
- **24px**: Medium -- between components.
- **32px**: Card internal padding.
- **40px**: App UI intro-to-brand gap inside the phone.
- **48px**: Phone border-radius and section dividers.
- **60px**: Frosted footer internal padding.
- **80px**: Maximum outer section padding.

### Format Padding
| Format | Outer Padding | Content Max-Width |
|--------|---------------|-------------------|
| Carousel (1080x1080) | 60px all sides | 960px |
| Infographic (1080xN) | 60px left/right, 80px top/bottom | 960px |
| Slides (1920x1080) | 80px all sides | 1760px |
| Poster (1080x1350) | 60px left/right, 80px top/bottom | 960px |
| Story (1080x1920) | 60px left/right, 120px top/bottom | 960px |

### Alignment & Grid
- **Primary alignment**: Left-aligned inside the frosted footer. Centered for the phone mockup hero.
- **55/45 split**: Hero slides divide vertically -- top ~55% holds the gradient with the phone mockup; bottom ~45% is the frosted footer with the label + headline.
- **Phone mockup centering**: Always horizontally centered in the top zone, slightly overlapping into the frosted footer (~10-15% of its height dips into the glass for depth).
- **Headline wrap**: The 2-line frosted-footer headline is always hand-broken to produce a deliberate 2-line stack. Avoid orphan words.
- **No three-column layouts**: This style uses single-column verticals or 2-column splits. Three columns overwhelm the soft gradient.

## 6. Depth & Elevation

| Level | Treatment | Use |
|-------|-----------|-----|
| Flat (Level 0) | Aurora mesh gradient canvas, no shadow | Base layer, backgrounds |
| Subtle (Level 1) | `0 4px 12px rgba(42,53,81,0.08)` | Nested cards, soft lifts |
| Card (Level 2) | `0 12px 32px rgba(42,53,81,0.10)` + frosted glass | Content cards |
| Elevated (Level 3) | `0 24px 60px rgba(42,53,81,0.14)` | Phone mockup, featured hero elements |
| Overlay (Level 4) | `0 32px 80px rgba(42,53,81,0.22)` | Modals and peak elements |

### Border Treatments
- **Phone frame**: `3px solid rgba(255,255,255,0.80)` + `border-radius: 48px`. The hero stroke.
- **Frosted card (large)**: `1px solid rgba(255,255,255,0.30)` on the top edge only (`border-top`), seamless elsewhere. For the footer.
- **Frosted card (nested)**: `1px solid rgba(255,255,255,0.25)` all sides + `border-radius: 24px`. For content cards inside the gradient.
- **Divider rule**: `1px solid rgba(255,255,255,0.15)` for horizontal divisions inside cards.
- **No sharp corners**: Everything is rounded -- minimum 16px, typical 24-48px.

### Surface Hierarchy
Depth comes from translucency, blur, and soft navy-tinted shadow -- never from solid opaque layers:
1. **Aurora mesh** -- the atmospheric base layer.
2. **Frosted surface 12%** -- nested cards, inset containers.
3. **Frosted surface 20%** -- the large footer card, primary glass surface.
4. **Phone frame** -- a bordered translucent container holding the app UI gradient.
5. **Opaque CTA button** -- the single 95%-white element that anchors the page.

## 7. Do's and Don'ts

### Do
- **Use layered radial gradients to build the mesh** -- combine 3-4 `radial-gradient` functions at different positions with `background-blend-mode: screen` for the signature rainbow bloom.
- **Use the phone mockup as the visual center of hero slides** -- centered horizontally, dipping slightly into the frosted footer for depth.
- **Use the frosted-glass footer for CTAs and main headlines** -- it is the CTA container and the place where the heavy headline lives.
- **Use Fraunces for the app brand name and Inter for everything else** -- Fraunces is a reserved editorial moment, not a general-purpose serif.
- **Always use `rgba(255,255,255,0.95)` for primary text on gradient** -- never pure `#ffffff`.
- **Keep the 55/45 vertical split on hero slides** -- top 55% gradient + phone, bottom 45% frosted footer.
- **Use `-1.5px` letter-spacing on the big 2-line headline** -- tight tracking is what makes the Inter 700 feel premium.
- **Include the fallback linear gradient in CSS** -- renders cleanly even when `backdrop-filter` or `background-blend-mode` fails.
- **Use navy (`#2A3551`) sparingly and only for the Fraunces brand mark inside the phone** -- it is the only dark element in the style.
- **Round everything** -- 48px phone, 40px button, 24px cards, 16px minimum.

### Don't
- **Don't use a solid background** -- the mesh IS the style. A flat blue or flat peach defeats the entire composition.
- **Don't use pure white text (`#ffffff`)** -- it burns out against the soft pastel gradient. Always use 95% white for readability.
- **Don't skip the frosted-glass footer** -- it's the CTA container. Without it the composition has nowhere for the headline to land.
- **Don't use dark text on light sections** -- the exception is the Fraunces brand mark inside the phone (navy), and nothing else.
- **Don't use Fraunces for body text or non-brand headlines** -- it's reserved for the in-app brand mark only.
- **Don't use saturated or vivid colours** -- everything is soft, dusty, and desaturated. Vivid neon pinks or electric blues break the wellness feel.
- **Don't use sharp corners** -- 0px radius has no place here. Minimum 16px everywhere.
- **Don't centre the frosted-footer headline** -- it must be left-aligned to preserve the asymmetric poster feel.
- **Don't nest too many frosted cards** -- two levels of glass max. More becomes visually noisy.
- **Don't place the phone mockup off-center** -- symmetry is the anchor that lets the asymmetric footer work.

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
- **Typography scale**: Display Headline at 60px (default). App Brand Mark at 64px. Body at 18px.
- **Padding**: 60px on all sides.
- **Cover slide**: Full aurora mesh + centered phone mockup in top 55% + frosted footer bottom 45% with label + 2-line headline.
- **Content slides**: Mesh background. Left-aligned label + headline block. Optional nested frosted card for detail content.
- **Swipe indicator**: Small dots at the very bottom of the frosted footer -- `rgba(255,255,255,0.4)` inactive, `rgba(255,255,255,0.95)` active. 8px diameter.
- **CTA slide**: Hero pattern repeated with the CTA button replacing the subtitle below the headline.

### Infographic (1080px wide, variable height)
- **Typography**: Display Headline at 60-72px on the hero. Section Heading at 40px. Body at 18-22px.
- **Padding**: 60px left/right, 80px top/bottom.
- **Composition**: Hero block at the top with the full phone + footer pattern. Below, alternating content sections with nested frosted cards on the mesh background. No second frosted footer -- the mesh runs edge-to-edge after the hero.
- **Section spacing**: 80px vertical gaps between major sections. Use nested frosted cards (24px radius) to group related content.
- **Footer**: Small CTA block with frosted card + label + headline + button.

### Slides (1920x1080px)
- **Typography scale**: Display Hero XL at 72-88px. Section Heading at 48px. Body Large at 24px. App Brand Mark scales to 80px.
- **Padding**: 80px on all sides.
- **Layout**: 55/45 vertical split preserved but widescreen: the phone mockup sits left-of-center in the hero zone, with a label + 2-line headline to its right. Frosted footer spans full width at bottom with a CTA button aligned right.
- **Title slides**: Full hero pattern -- phone centered, frosted footer with label + headline.
- **Content slides**: Mesh gradient + nested frosted cards in a 2-column layout. Left column: label + headline. Right column: content card.
- **CTA slides**: Phone mockup left, right column has full label + headline + button stack.

### Poster (1080x1350px)
- **Typography**: Display Headline at 56px. App Brand Mark at 72px (larger for vertical prominence). Body at 20px.
- **Padding**: 60px left/right, 80px top/bottom.
- **Composition**: Top 55% holds the phone mockup centered on the mesh. Bottom 45% is the frosted footer with label + headline. The 55/45 split stretches naturally in the taller format.
- **Vertical flow**: All content reads top-to-bottom. The phone is the emotional anchor; the frosted footer is the landing zone.
- **CTA placement**: CTA button sits 32px below the headline inside the frosted footer, left-aligned.

### Story (1080x1920px)
- **Typography scale up**: Display Headline becomes 72px in Inter 700. Section Heading becomes 56px. Body Large becomes 24px in Inter 500. App Brand Mark scales to 88px for the vertical prominence. Small caps label stays at 16-18px.
- **Padding**: 60px left/right, 120px top/bottom. Safe zones: 160px top and 180px bottom reserved for platform UI (profile avatar, progress bar, reply input). All critical content must sit inside y=160 to y=1740.
- **Layout**: Single centered column. Aurora mesh runs full-bleed edge-to-edge. Vertical rhythm: top third has the phone mockup, middle third keeps breathing gradient, bottom third is the frosted footer covering ~40% of the full 1920 height.
- **Cover slide**: Full aurora mesh. Phone mockup sits centered around y=450-1050 (roughly 280x560 scales up to 380x760 here). Frosted footer runs from y=1180 to y=1920 holding a small label at ~y=1320 and the 2-line Inter 700 headline at ~y=1400-1560. Leave room below the headline for the safe-zone platform UI.
- **Content slides**: Mesh background. Nested frosted card (24px radius) centered in the vertical middle, holding a label + headline + body. Optional small phone mockup icon or mini-illustration above the card.
- **CTA slide**: Hero pattern repeated. Large CTA button inside the frosted footer, below the 2-line headline, left-aligned.
- **Progress indicator**: Thin segments at y=100 -- inactive `rgba(255,255,255,0.30)`, active `rgba(255,255,255,0.95)`. Keeps the glass language consistent.

## 10. Agent Prompt Guide

### Quick Color Reference

| Name | Hex / RGBA | Usage |
|------|------------|-------|
| Sky Blue | `#A8C4E8` | Gradient origin (top-left mesh blob) |
| Peach Coral | `#F2A87C` | Gradient centre (warm bloom) |
| Dusty Pink | `#D4A8C4` | Gradient terminus (right side) |
| Soft Lavender | `#C8B8E0` | Fourth mesh blob (bottom-right) |
| Warm Cream | `#F5E6D8` | Highlight bloom accent |
| Deep Navy | `#2A3551` | Fraunces brand mark inside phone ONLY |
| Near-White | `rgba(255,255,255,0.95)` | Primary text on gradient |
| Soft White | `rgba(255,255,255,0.80)` | Secondary text, labels |
| Muted White | `rgba(255,255,255,0.60)` | Captions, metadata |
| Frosted Surface | `rgba(255,255,255,0.20)` | Footer glass card fill |
| Frosted Inset | `rgba(255,255,255,0.12)` | Nested glass cards |
| Glass Border | `rgba(255,255,255,0.30)` | Frosted card border |
| Phone Border | `rgba(255,255,255,0.80)` | Phone mockup stroke |
| Shadow Soft | `rgba(42,53,81,0.08)` | Subtle elevation |
| Shadow Medium | `rgba(42,53,81,0.14)` | Standard card shadow |
| Shadow Deep | `rgba(42,53,81,0.22)` | Hero elevation |

### Font Declarations

```css
/* Display serif (in-app brand mark ONLY) */
font-family: 'Fraunces', Georgia, 'Times New Roman', serif;
font-optical-sizing: auto;

/* Body (everything else) */
font-family: 'Inter', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif;
```

### Google Fonts Link

```html
<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;0,9..144,600;0,9..144,700;0,9..144,800;1,9..144,400;1,9..144,500;1,9..144,600;1,9..144,700&family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
```

### CSS Root Variables

```css
:root {
  /* Colors -- Primary (mesh gradient stops) */
  --color-sky-blue: #A8C4E8;
  --color-peach-coral: #F2A87C;
  --color-dusty-pink: #D4A8C4;

  /* Colors -- Accent */
  --color-soft-lavender: #C8B8E0;
  --color-warm-cream: #F5E6D8;
  --color-deep-navy: #2A3551;

  /* Colors -- Whites / Neutrals */
  --color-white-95: rgba(255, 255, 255, 0.95);
  --color-white-80: rgba(255, 255, 255, 0.80);
  --color-white-60: rgba(255, 255, 255, 0.60);
  --color-white-40: rgba(255, 255, 255, 0.40);
  --color-white-30: rgba(255, 255, 255, 0.30);

  /* Colors -- Surfaces */
  --color-frosted-surface: rgba(255, 255, 255, 0.20);
  --color-frosted-inset: rgba(255, 255, 255, 0.12);
  --color-phone-screen-tint: rgba(168, 196, 232, 0.25);

  /* Colors -- Borders */
  --color-glass-border: rgba(255, 255, 255, 0.30);
  --color-phone-border: rgba(255, 255, 255, 0.80);
  --color-divider: rgba(255, 255, 255, 0.15);

  /* Colors -- Shadows (navy-tinted) */
  --shadow-soft: rgba(42, 53, 81, 0.08);
  --shadow-medium: rgba(42, 53, 81, 0.14);
  --shadow-deep: rgba(42, 53, 81, 0.22);

  /* Composed shadows */
  --shadow-card: 0 12px 32px rgba(42, 53, 81, 0.10);
  --shadow-phone: 0 24px 60px rgba(42, 53, 81, 0.14);
  --shadow-overlay: 0 32px 80px rgba(42, 53, 81, 0.22);

  /* Aurora mesh gradient (the signature background) */
  --aurora-mesh:
    radial-gradient(circle at 15% 30%, #A8C4E8 0%, transparent 55%),
    radial-gradient(circle at 55% 45%, #F2A87C 0%, transparent 50%),
    radial-gradient(circle at 85% 35%, #D4A8C4 0%, transparent 55%),
    radial-gradient(circle at 75% 80%, #C8B8E0 0%, transparent 60%),
    linear-gradient(110deg, #A8C4E8 0%, #F2A87C 50%, #D4A8C4 100%);
  --aurora-fallback: linear-gradient(110deg, #A8C4E8 0%, #F2A87C 50%, #D4A8C4 100%);
  --aurora-blend-mode: screen, screen, screen, normal, normal;

  /* Frosted glass */
  --glass-blur: blur(40px);
  --glass-blur-nested: blur(30px);

  /* Typography -- Families */
  --font-display: 'Fraunces', Georgia, 'Times New Roman', serif;
  --font-body: 'Inter', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif;

  /* Typography -- Sizes */
  --text-display-xl: 72px;
  --text-display: 60px;
  --text-section: 40px;
  --text-brand-mark: 64px;
  --text-body-large: 22px;
  --text-body: 18px;
  --text-label: 16px;
  --text-small: 14px;
  --text-app-title: 22px;
  --text-app-subtitle: 16px;
  --text-app-time: 12px;
  --text-cta: 16px;

  /* Typography -- Weights */
  --weight-display-serif: 600;
  --weight-body-regular: 400;
  --weight-body-medium: 500;
  --weight-body-bold: 700;

  /* Typography -- Line Heights */
  --leading-display: 1.05;
  --leading-heading: 1.15;
  --leading-body: 1.55;
  --leading-tight: 1.00;

  /* Typography -- Letter Spacing */
  --tracking-display: -1.5px;
  --tracking-heading: -0.8px;
  --tracking-brand: -1px;
  --tracking-body: 0px;
  --tracking-label: 0.3px;

  /* Spacing */
  --space-micro: 4px;
  --space-tight: 8px;
  --space-small: 12px;
  --space-base: 16px;
  --space-label-headline: 20px;
  --space-medium: 24px;
  --space-card-padding: 32px;
  --space-large: 40px;
  --space-section: 48px;
  --space-footer-padding: 60px;
  --space-max: 80px;

  /* Borders */
  --radius-phone: 48px;
  --radius-cta: 40px;
  --radius-card: 24px;
  --radius-small: 16px;
}
```

### System Font Fallbacks
- **Serif (if Fraunces fails to load):** `Georgia, 'Times New Roman', serif`
- **Sans-serif (if Inter fails to load):** `-apple-system, 'Segoe UI', Helvetica, Arial, sans-serif`
