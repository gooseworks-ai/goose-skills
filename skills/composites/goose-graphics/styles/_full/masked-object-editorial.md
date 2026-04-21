# Design Style: Masked Object Editorial

## 1. Visual Theme & Atmosphere

Masked Object Editorial is the design language of the modern premium consumer brand poster -- the visual equivalent of a magazine centerfold ad for a boutique wine, a craft spirit, a cold-pressed juice, or an artisan chocolate bar. The style draws from mid-century editorial advertising (think Bonnie Cashin-era Saks campaigns, vintage Italian vermouth posters, and contemporary brands like Haus, Ghia, and Flamingo Estate), but it runs on a single signature move that sets it apart from every other editorial style: the hero image is not a rectangle. It is a photograph clipped into the silhouette of the product itself -- a wine glass filled with grapes, a bottle filled with botanicals, a cocktail coupe filled with citrus. The surrounding canvas is a rich, saturated royal navy that makes the masked photograph read like a stained-glass window set into a velvet wall.

The typography pairing is classic editorial tension: an italic transitional serif display face (Playfair Display Italic) set in pale cream against the navy, paired with a crisp modern sans (Inter) in pure white for body copy. The italic serif is the romance -- it carries the poetic headline ("From Grape to Glass", "From Garden to Glass", "From Bean to Bar") across two lines with generous descenders and calligraphic flourishes. The sans is the grounding -- three short declarative lines stacked in a right-hand column, each a single sentence, each ending in a period. The composition is intentionally asymmetric: the masked object occupies the left half, the headline and stacked body copy fill the right half, and a light powder blue footer band runs edge-to-edge along the bottom carrying the single call-to-action label in navy sans. The footer band is the only horizontal element on the entire canvas -- it anchors the composition the way a baseline anchors a page of type.

The palette is restrained to four values: deep royal navy as the dominant surface, pale cream for the serif headline, pure white for body copy, and a light powder blue for the footer band. Nothing else. This restraint is load-bearing -- the style only works when the masked photograph carries all the color variance and the typography stays chromatically quiet. The effect is deliberate, poised, and slightly theatrical -- a brand that knows exactly what it is and has the confidence to tell you in three short lines.

**Key Characteristics:**
- Deep royal navy background (`#112A70`) as the dominant surface -- rich, saturated, never black
- Pale cream (`#F5F0E6`) for the italic serif display headline -- warm, paper-like, never pure white
- Pure white (`#FFFFFF`) for stacked sans body copy -- crisp and high-contrast
- Light powder blue (`#B8D4E8`) for the full-width footer CTA band -- the only horizontal anchor
- Playfair Display **italic** for headlines at 60-72px -- always italic, never upright
- Inter 400-600 for stacked body copy and footer CTA -- short declarative lines, one per row
- Photograph clipped into object silhouette as the hero -- the signature move, non-negotiable
- Asymmetric half-and-half composition -- masked object left, headline + body right
- Three-line body stack -- always 3 lines, always short declaratives, always period-terminated
- No rectangular photo frames, no rounded-corner photo frames -- photos must be masked to shape
- No drop shadows, no gradients, no decorative elements -- the mask is the entire visual interest

## 2. Color Palette & Roles

### Primary
- **Royal Navy** (`#112A70`): Primary background. A deep, saturated royal blue with just enough warmth to feel expensive rather than corporate. Runs edge-to-edge on every slide except the footer band.
- **Pale Cream** (`#F5F0E6`): Primary display headline color. A warm off-white that reads as "vintage paper" against navy. Never pure white -- the warmth is what makes the italic serif feel editorial.
- **Pure White** (`#FFFFFF`): Body copy color. Used only for the stacked Inter body copy on navy. The tonal split between cream headlines and white body is intentional and load-bearing.

### Accent
- **Powder Blue** (`#B8D4E8`): Footer band fill. A pale desaturated blue that reads as "sky" against the deep navy. Used exclusively for the full-width horizontal footer band at the bottom of every slide.
- **Navy on Powder** (`#112A70`): Footer CTA text color. The same navy used for the background, dropped into the powder blue footer band to create a subtle recessive contrast.
- **Deep Navy Shadow** (`#0A1F55`): Optional darker navy for recessed or inset areas. Rarely used -- only when a card needs to recede from the main navy surface.

### Neutral Scale
- **Cream Strong** (`#F5F0E6`): Same as display headline color -- the warmest neutral.
- **Cream Soft** (`rgba(245, 240, 230, 0.75)`): Semi-transparent cream for secondary metadata and attributions.
- **White Strong** (`#FFFFFF`): Pure white for body copy.
- **White Muted** (`rgba(255, 255, 255, 0.65)`): Reduced-opacity white for captions and small type.
- **Powder Text** (`rgba(17, 42, 112, 0.85)`): Navy text inside the footer band at slightly reduced opacity for secondary labels.
- **Metadata Muted** (`rgba(245, 240, 230, 0.4)`): Low-priority labels, slide numbers, watermarks.

### Surface & Borders
- **Surface Primary** (`#112A70`): The navy canvas. There are no layered surfaces in this style -- the canvas is the only surface.
- **Surface Footer** (`#B8D4E8`): The powder blue footer band -- the only other surface.
- **Border Hairline** (`rgba(245, 240, 230, 0.18)`): Optional thin cream hairline for dividing sections within a slide. Used sparingly.
- **Border Footer Top** (`rgba(17, 42, 112, 0.08)`): Optional 1px top edge on the footer band for a subtle inset. Usually omitted.

### Shadow Colors
The masked-object style uses essentially no shadows. The masked photograph is the entire depth cue. When shadow is absolutely needed (e.g., a CTA button inside the footer), use these:
- **Shadow Subtle** (`rgba(10, 31, 85, 0.25)`): Barely-there navy shadow under the footer band.
- **Shadow Medium** (`rgba(10, 31, 85, 0.40)`): Soft navy shadow for elevated CTA buttons.
- **Shadow Deep** (`rgba(10, 31, 85, 0.55)`): Reserved for exceptional emphasis -- rarely used.

### Texture
No dot grids, no noise, no gradients. The navy surface is flat and uniform. The masked photograph supplies all of the visual texture on every slide.

## 3. Typography Rules

### Font Families

**Google Fonts CDN:**
```html
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400;1,500;1,600;1,700;1,800&family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
```

- **Display**: `'Playfair Display', Georgia, 'Times New Roman', serif`
- **Body**: `'Inter', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif`

### Hierarchy

| Role | Font | Size | Weight | Style | Line Height | Letter Spacing | Notes |
|------|------|------|--------|-------|-------------|----------------|-------|
| Display Hero | Playfair Display | 72px | 700 | **italic** | 1.05 | -0.5px | The signature headline. Always italic. Pale cream on navy. |
| Display Large | Playfair Display | 60px | 700 | **italic** | 1.08 | -0.5px | Carousel hero headline. Always italic. |
| Section Heading | Playfair Display | 48px | 700 | **italic** | 1.10 | -0.25px | Secondary headlines. Always italic. |
| Sub-heading | Playfair Display | 36px | 600 | **italic** | 1.15 | 0px | Card titles, secondary emphasis. |
| Body Large | Inter | 28px | 500 | normal | 1.30 | 0px | The stacked body copy -- 3 short declarative lines. |
| Body | Inter | 22px | 500 | normal | 1.40 | 0px | Standard body for denser content slides. |
| Body Small | Inter | 18px | 400 | normal | 1.50 | 0px | Metadata, descriptions, captions. |
| Big Numbers | Playfair Display | 96px | 800 | **italic** | 1.00 | -1px | Statistics and key metrics. Always italic. |
| Footer CTA | Inter | 22px | 600 | normal | 1.00 | 0.2px | Footer band text. Navy on powder blue. |
| Small Caps Label | Inter | 13px | 600 | normal | 1.00 | 1.5px | Uppercase labels for metadata, never for body. |

### Principles
- **Italic-only display type**: This is the absolute rule of the style. Playfair Display is *only* used in italic. Upright Playfair is forbidden -- it loses the calligraphic romance that defines the look. If you catch yourself setting headline type upright, stop and italicize.
- **Cream headlines, white body**: The tonal split between pale cream (`#F5F0E6`) for serif display and pure white (`#FFFFFF`) for sans body is a micro-detail that reads subconsciously as "designed by someone who cares." Do not collapse both to white.
- **Three-line body stack**: Body copy is always 3 short declarative lines, each terminating in a period, each on its own line. "Real fruit. Real process. Real wine." This rhythm is the sans-serif counterpart to the italic headline's romance.
- **Descender drama**: Playfair Display italic has long, curled descenders (especially on `f`, `g`, `p`, `y`). Give the headline generous line-height (1.05-1.15) so descenders do not collide with ascenders on the next line -- but not so much that the headline feels airy. The descenders should almost-but-not-quite kiss the next line.
- **Short headlines only**: The display headline is 3-6 words maximum, ideally set over 2 lines. "From Grape to Glass." "Crafted for the Curious." "A Quiet Kind of Luxury." Longer than 6 words and the romance breaks.
- **No ALL CAPS headlines**: This style is mixed case only for headlines. Uppercase is reserved for the rare small-caps label (13px Inter 600 with 1.5px letter-spacing). The italic serif in caps looks like a wedding invitation, not a poster.

## 4. Component Patterns

### Photo-Masked-To-Shape Hero (SIGNATURE)

This is the defining move of the style. A photograph is clipped into the silhouette of an object -- a wine glass, a bottle, a coupe, a leaf, a product -- so that the image fills only the interior of the shape and the navy canvas shows through everywhere else. Two approaches are supported: CSS `mask-image` and SVG `<clipPath>`. Both are production-safe. Use whichever fits your rendering pipeline.

**Approach 1 -- CSS `mask-image` with inline SVG:**

```html
<div style="
  width: 360px;
  height: 560px;
  background-image: url('https://example.com/yellow-grapes.jpg');
  background-size: cover;
  background-position: center;
  mask-image: url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 200 320%22><path d=%22M60 10 L140 10 Q150 10 150 20 L150 90 Q150 160 115 180 L115 280 L145 290 L145 310 L55 310 L55 290 L85 280 L85 180 Q50 160 50 90 L50 20 Q50 10 60 10 Z%22 fill=%22black%22/></svg>');
  -webkit-mask-image: url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 200 320%22><path d=%22M60 10 L140 10 Q150 10 150 20 L150 90 Q150 160 115 180 L115 280 L145 290 L145 310 L55 310 L55 290 L85 280 L85 180 Q50 160 50 90 L50 20 Q50 10 60 10 Z%22 fill=%22black%22/></svg>');
  mask-repeat: no-repeat;
  -webkit-mask-repeat: no-repeat;
  mask-size: contain;
  -webkit-mask-size: contain;
  mask-position: center;
  -webkit-mask-position: center;
"></div>
```

**Approach 2 -- Inline SVG with `<clipPath>`:**

```html
<svg width="360" height="560" viewBox="0 0 200 320" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <clipPath id="wineglass-silhouette">
      <path d="M60 10 L140 10 Q150 10 150 20 L150 90 Q150 160 115 180 L115 280 L145 290 L145 310 L55 310 L55 290 L85 280 L85 180 Q50 160 50 90 L50 20 Q50 10 60 10 Z" />
    </clipPath>
  </defs>
  <image
    href="https://example.com/yellow-grapes.jpg"
    xlink:href="https://example.com/yellow-grapes.jpg"
    x="0" y="0" width="200" height="320"
    preserveAspectRatio="xMidYMid slice"
    clip-path="url(#wineglass-silhouette)"
  />
</svg>
```

**Swapping the silhouette:** the `<path d="...">` value is the entire creative lever. Replace it with any SVG silhouette to switch from a wine glass to a bottle, a coupe glass, a leaf, a coffee cup, a hand, a fruit, a product render, or a logo mark. Export any shape from Figma/Illustrator as an SVG path and paste it in. The mask will clip any image to that silhouette automatically. Suggested silhouettes:
- `wineglass` -- for wine, vermouth, champagne brands
- `bottle` -- for spirits, sauces, beverages, beauty products
- `coupe` or `cocktail-glass` -- for cocktails, non-alcoholic spirits
- `leaf` or `botanical` -- for tea, CBD, herbal products
- `hand` or `silhouette-bust` -- for fashion, beauty, lifestyle
- `letterform` -- a large italic serif character clipped with a photo inside for typographic posters

### Italic Serif Display Headline

The defining typographic move. Playfair Display Italic, 60-72px, pale cream, always over 2 lines, always mixed case, always 3-6 words.

```html
<h1 style="
  font-family: 'Playfair Display', Georgia, serif;
  font-style: italic;
  font-weight: 700;
  font-size: 72px;
  line-height: 1.05;
  letter-spacing: -0.5px;
  color: #F5F0E6;
  margin: 0;
">From Grape<br>to Glass</h1>
```

### Stacked Body Copy (3-Line Declarative)

The sans-serif counterpart to the headline. Three short sentences, one per line, each terminated by a period, each at Inter 500 28px white on navy. Always exactly 3 lines -- not 2, not 4.

```html
<div style="
  font-family: 'Inter', -apple-system, Helvetica, sans-serif;
  font-size: 28px;
  font-weight: 500;
  line-height: 1.30;
  color: #FFFFFF;
">
  <p style="margin: 0;">Real fruit.</p>
  <p style="margin: 0;">Real process.</p>
  <p style="margin: 0;">Real wine.</p>
</div>
```

### Footer CTA Band

Full-width horizontal band at the bottom of the slide, filled in powder blue (`#B8D4E8`), with the CTA label in navy Inter 600 centered or right-aligned inside. The band is the only non-navy horizontal element on the canvas and anchors the composition.

```html
<div style="
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  background: #B8D4E8;
  padding: 32px 60px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
">
  <span style="
    font-family: 'Inter', -apple-system, Helvetica, sans-serif;
    font-size: 22px;
    font-weight: 600;
    letter-spacing: 0.2px;
    color: #112A70;
  ">Shop Wildroot Wines</span>
</div>
```

### Full Hero Slide Composition (Signature Layout)

The canonical composition: masked photograph on the left, italic headline top-right, 3-line stacked body copy below-right, footer band edge-to-edge along the bottom.

```html
<div style="
  position: relative;
  width: 1080px;
  height: 1080px;
  background: #112A70;
  overflow: hidden;
  font-family: 'Inter', -apple-system, Helvetica, sans-serif;
">
  <!-- Masked photograph (left half) -->
  <div style="
    position: absolute;
    left: 80px;
    top: 200px;
    width: 380px;
    height: 640px;
    background-image: url('https://example.com/yellow-grapes.jpg');
    background-size: cover;
    background-position: center;
    mask-image: url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 200 320%22><path d=%22M60 10 L140 10 Q150 10 150 20 L150 90 Q150 160 115 180 L115 280 L145 290 L145 310 L55 310 L55 290 L85 280 L85 180 Q50 160 50 90 L50 20 Q50 10 60 10 Z%22 fill=%22black%22/></svg>');
    -webkit-mask-image: url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 200 320%22><path d=%22M60 10 L140 10 Q150 10 150 20 L150 90 Q150 160 115 180 L115 280 L145 290 L145 310 L55 310 L55 290 L85 280 L85 180 Q50 160 50 90 L50 20 Q50 10 60 10 Z%22 fill=%22black%22/></svg>');
    mask-repeat: no-repeat;
    -webkit-mask-repeat: no-repeat;
    mask-size: contain;
    -webkit-mask-size: contain;
    mask-position: center;
    -webkit-mask-position: center;
  "></div>

  <!-- Italic headline (top right) -->
  <h1 style="
    position: absolute;
    right: 80px;
    top: 80px;
    max-width: 520px;
    font-family: 'Playfair Display', Georgia, serif;
    font-style: italic;
    font-weight: 700;
    font-size: 72px;
    line-height: 1.05;
    letter-spacing: -0.5px;
    color: #F5F0E6;
    text-align: right;
    margin: 0;
  ">From Grape<br>to Glass</h1>

  <!-- Stacked body copy (below headline, right) -->
  <div style="
    position: absolute;
    right: 80px;
    top: 460px;
    max-width: 480px;
    font-family: 'Inter', -apple-system, Helvetica, sans-serif;
    font-size: 28px;
    font-weight: 500;
    line-height: 1.30;
    color: #FFFFFF;
    text-align: right;
  ">
    <p style="margin: 0;">Real fruit.</p>
    <p style="margin: 0;">Real process.</p>
    <p style="margin: 0;">Real wine.</p>
  </div>

  <!-- Footer CTA band (edge-to-edge bottom) -->
  <div style="
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    background: #B8D4E8;
    padding: 32px 80px;
    display: flex;
    align-items: center;
    justify-content: flex-end;
  ">
    <span style="
      font-family: 'Inter', -apple-system, Helvetica, sans-serif;
      font-size: 22px;
      font-weight: 600;
      letter-spacing: 0.2px;
      color: #112A70;
    ">Shop Wildroot Wines</span>
  </div>
</div>
```

### Numbered Step Block

For multi-slide carousels where a step or number is called out. The italic serif number is the visual anchor, the sans body explains.

```html
<div>
  <p style="
    font-family: 'Playfair Display', Georgia, serif;
    font-style: italic;
    font-weight: 800;
    font-size: 96px;
    line-height: 1.00;
    letter-spacing: -1px;
    color: #F5F0E6;
    margin: 0 0 16px;
  ">01</p>
  <p style="
    font-family: 'Inter', -apple-system, Helvetica, sans-serif;
    font-size: 22px;
    font-weight: 500;
    line-height: 1.40;
    color: #FFFFFF;
    margin: 0;
  ">Hand-pick the grapes.<br>Only the ripest clusters.<br>One vineyard. One season.</p>
</div>
```

### Pull Quote (Italic-on-Italic)

A large italic pullquote in pale cream, attributed in small-caps Inter below. No quotation marks -- the italic carries the attribution weight.

```html
<figure style="margin: 0;">
  <p style="
    font-family: 'Playfair Display', Georgia, serif;
    font-style: italic;
    font-weight: 500;
    font-size: 48px;
    line-height: 1.20;
    color: #F5F0E6;
    margin: 0 0 24px;
  ">Wine is sunlight, held together by water.</p>
  <figcaption style="
    font-family: 'Inter', -apple-system, Helvetica, sans-serif;
    font-size: 13px;
    font-weight: 600;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    color: rgba(245, 240, 230, 0.75);
    margin: 0;
  ">GALILEO GALILEI</figcaption>
</figure>
```

### Split Content Slide

Half-and-half layout for content slides: masked object on one side, sans body copy with a small italic serif sub-heading on the other.

```html
<div style="
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 60px;
  align-items: center;
  padding: 80px;
  background: #112A70;
">
  <!-- Masked object column -->
  <div style="
    width: 100%;
    aspect-ratio: 1 / 1.5;
    background-image: url('https://example.com/product.jpg');
    background-size: cover;
    mask-image: url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 200 320%22><path d=%22M60 10 L140 10 Q150 10 150 20 L150 90 Q150 160 115 180 L115 280 L145 290 L145 310 L55 310 L55 290 L85 280 L85 180 Q50 160 50 90 L50 20 Q50 10 60 10 Z%22 fill=%22black%22/></svg>');
    -webkit-mask-image: url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 200 320%22><path d=%22M60 10 L140 10 Q150 10 150 20 L150 90 Q150 160 115 180 L115 280 L145 290 L145 310 L55 310 L55 290 L85 280 L85 180 Q50 160 50 90 L50 20 Q50 10 60 10 Z%22 fill=%22black%22/></svg>');
    mask-repeat: no-repeat;
    -webkit-mask-repeat: no-repeat;
    mask-size: contain;
    -webkit-mask-size: contain;
  "></div>

  <!-- Text column -->
  <div>
    <h2 style="
      font-family: 'Playfair Display', Georgia, serif;
      font-style: italic;
      font-weight: 700;
      font-size: 48px;
      line-height: 1.10;
      color: #F5F0E6;
      margin: 0 0 32px;
    ">Every bottle,<br>a story.</h2>
    <div style="
      font-family: 'Inter', -apple-system, Helvetica, sans-serif;
      font-size: 22px;
      font-weight: 500;
      line-height: 1.40;
      color: #FFFFFF;
    ">
      <p style="margin: 0;">Grown in Sonoma.</p>
      <p style="margin: 0;">Pressed by hand.</p>
      <p style="margin: 0;">Bottled at the estate.</p>
    </div>
  </div>
</div>
```

## 5. Layout Principles

### Spacing Scale
- **4px**: Micro gap -- between stacked small labels.
- **8px**: Tight gap -- between period-terminated lines in dense body stacks.
- **16px**: Base gap -- between body lines at standard density.
- **24px**: Small gap -- between a sub-heading and its body stack.
- **32px**: Medium gap -- between the masked object edge and its caption.
- **48px**: Section internal -- between the italic headline and the body stack.
- **60px**: Standard outer padding -- most slide margins.
- **80px**: Generous outer padding -- poster and slide margins, hero headline insets.
- **120px**: Maximum top/bottom for Story format -- safe zone for platform UI.

### Format Padding
| Format | Outer Padding | Content Max-Width |
|--------|---------------|-------------------|
| Carousel (1080x1080) | 80px all sides | 920px |
| Infographic (1080xN) | 60px left/right, 80px top/bottom | 960px |
| Slides (1920x1080) | 100px all sides | 1720px |
| Poster (1080x1350) | 80px left/right, 100px top/bottom | 920px |
| Story (1080x1920) | 60px left/right, 120px top/bottom | 960px |

### Alignment & Grid
- **Primary alignment**: Asymmetric half-and-half. Masked object occupies one side (usually left), typography stack occupies the other. Content is right-aligned when the object is on the left, and vice-versa.
- **Vertical anchor**: The footer band sits edge-to-edge at the absolute bottom of every slide, 72-96px tall depending on format. This is the one constant layout element.
- **Headline placement**: The italic headline starts at the top of the type column, aligned to the top of the masked object (or slightly above it for drama).
- **Body stack placement**: The 3-line body copy sits below the headline with 48-80px of breathing room, never collided with the headline.
- **Grid column proportions**: When split 50/50, use equal columns. When the masked object is the star, use 45/55 (object/text) to give the type room to breathe.
- **Content gravity**: On 1080x1080 the visual center of gravity is slightly high -- headlines sit in the top third, masked object spans middle, footer band anchors bottom. Do not center content vertically.

## 6. Depth & Elevation

| Level | Treatment | Use |
|-------|-----------|-----|
| Flat (Level 0) | No shadow, flat `#112A70` navy | Canvas -- the default for every slide |
| Mask-Only (Level 1) | No shadow, just the CSS/SVG mask revealing the photo | The signature hero visual -- depth from the mask itself |
| Subtle (Level 2) | `0 2px 8px rgba(10, 31, 85, 0.25)` | Footer band top edge (optional) |
| Elevated (Level 3) | `0 8px 24px rgba(10, 31, 85, 0.40)` | CTA buttons inside the footer band (rare) |
| Overlay (Level 4) | `0 16px 40px rgba(10, 31, 85, 0.55)` | Reserved -- essentially unused in this style |

### Border Treatments
- **No borders on the canvas**: The style deliberately has no card borders, no bordered photo frames, no ruled dividers. The navy canvas and the masked photograph do all the structural work.
- **Hairline divider (optional, rare)**: `1px solid rgba(245, 240, 230, 0.18)` -- only used to separate metadata blocks in dense content slides.
- **Footer band top edge (optional)**: `1px solid rgba(17, 42, 112, 0.08)` -- an almost-invisible inset line along the top of the powder blue footer band. Usually omitted.
- **Mask edges**: The edge of a masked photograph is its silhouette -- no stroke, no outline, no feathering. The silhouette meets the navy cleanly.

### Surface Hierarchy
On a navy canvas with a single accent band, elevation is communicated through three layers:
1. **Navy canvas** (`#112A70`) -- the base. Every slide starts here.
2. **Masked photograph** -- the hero visual. Depth comes from the image's internal tonal range, not from any shadow or border.
3. **Powder blue footer band** (`#B8D4E8`) -- the one horizontal element that lifts up off the canvas. It is the only surface elevation in the entire system.

Typography has its own tonal hierarchy on the canvas:
1. **Italic cream headlines** (`#F5F0E6`) -- the highest visual priority.
2. **Stacked white body** (`#FFFFFF`) -- secondary priority, crisper, cooler.
3. **Muted cream metadata** (`rgba(245, 240, 230, 0.4)`) -- tertiary priority, recessed.

## 7. Do's and Don'ts

### Do
- Use deep royal navy (`#112A70`) as the dominant surface on every slide -- it is the colour foundation of the entire style.
- Use the photo-to-shape mask as the hero visual -- this is the style's signature and MUST appear on at least one slide per carousel. Preferably the cover slide.
- Pair italic Playfair Display serif at 60-72px with short Inter body stacks -- the italic/upright tension is the typographic identity.
- Use a light powder blue (`#B8D4E8`) footer band at the bottom of every slide for the CTA -- the band is the only horizontal anchor on the canvas.
- Use pale cream (`#F5F0E6`) for the italic headline and pure white (`#FFFFFF`) for body copy -- the tonal split is intentional and load-bearing.
- Set body copy as exactly 3 short declarative lines, each ending in a period, stacked vertically. "Real fruit. Real process. Real wine."
- Keep headlines to 3-6 words over 2 lines. "From Grape to Glass." "A Quieter Kind of Good." "From Bean to Bar."
- Use generous line-height (1.05-1.15) on italic display to accommodate Playfair's long curled descenders without collision.
- Compose asymmetrically: masked object on one half, typography on the other. Do not center the hero visual.
- Swap the SVG silhouette to match the product or concept -- wine glass, bottle, coupe, leaf, cocktail, coffee cup, hand, letterform.

### Don't
- Don't use rectangular photo frames. Every photograph in this style must be masked into an object silhouette. A rectangular photo breaks the entire visual contract.
- Don't use rounded-corner photo frames as a "close enough" substitute -- rounded rectangles are not silhouettes. Use an actual object shape.
- Don't use pure white (`#FFFFFF`) for the headline -- always use pale cream (`#F5F0E6`). The warmth is the whole point.
- Don't use upright (non-italic) Playfair Display for display headlines. The italic is the signature -- upright is a different style entirely.
- Don't use ALL CAPS on the italic serif headline -- it becomes a wedding invitation, not a poster.
- Don't use near-black or pure black (`#000000`) as the background -- the royal navy is not interchangeable with black. The warmth and saturation of `#112A70` are what make it read as "premium brand" rather than "funeral".
- Don't use drop shadows on the masked photograph. The mask edge should meet the navy cleanly, with no feathering, no glow, no halo.
- Don't add decorative elements (icons, borders, rules, dot grids, noise textures, gradients) to the canvas. The mask is the entire visual interest.
- Don't use the powder blue footer band for anything other than a short CTA label. No logos, no social handles, no long copy -- one line of navy sans text only.
- Don't stack 4+ lines of body copy. Three lines is the maximum. If you need more, split across slides.
- Don't set the masked object at less than 30% of the slide height -- the silhouette needs physical presence on the canvas to read.
- Don't use colors outside the 4-value palette (navy, cream, white, powder blue). Any additional color dilutes the identity.

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
- **Typography scale**: Display Hero at 72px, Display Large at 60px, Section Heading at 48px, Body Large at 28px, Body at 22px.
- **Padding**: 80px on all sides except bottom (footer band takes the bottom 96px edge-to-edge).
- **Content area**: 920x800px above the footer band, plus 96px footer band.
- **Cover slide**: Masked object on the left half (380x640px silhouette), italic headline top-right, 3-line body stack mid-right, footer band edge-to-edge at bottom with CTA right-aligned.
- **Content slides**: Alternate between split layouts (masked object + type column) and full-bleed typographic slides with a smaller masked object used as a visual accent in the corner.
- **Step slides**: Big italic numeral (96px Playfair italic) in cream top-left, short 3-line body stack below in white.
- **Swipe indicator**: Small cream dots at 8px diameter centered above the footer band. Active dot in pure cream, inactive in `rgba(245, 240, 230, 0.3)`.
- **Footer band consistency**: The same powder blue footer band appears on every slide with the same CTA copy, anchoring the carousel visually.

### Infographic (1080px wide, variable height)
- **Typography**: Full-scale hierarchy. Display Hero at 72-80px for the top headline section.
- **Padding**: 60px left/right, 80px top/bottom.
- **Vertical flow**: Top third -- italic headline + intro body stack. Middle -- alternating masked-object sections with accompanying 3-line body stacks. Bottom third -- closing statement and footer band edge-to-edge at the base.
- **Section rhythm**: 120px of vertical gap between masked-object sections. Each section has exactly one masked object and exactly one 3-line body stack.
- **Masked objects in series**: Use the same silhouette across all sections for consistency, or switch between 2-3 related silhouettes (e.g., grape, glass, bottle) to tell a visual story.
- **Footer band**: Full-width powder blue band at the very bottom, 96px tall, carrying a single CTA label.

### Slides (1920x1080px)
- **Typography scale up**: Display Hero at 96px, Section Heading at 64px, Body Large at 32px. Big Numbers at 128px.
- **Padding**: 100px on all sides except bottom (footer band 120px tall at the bottom edge).
- **Content area**: 1720x860px above the footer band.
- **Title slides**: Masked object left (480x820px silhouette), italic headline top-right at 96px, 3-line body stack mid-right at 32px, footer band edge-to-edge.
- **Content slides**: Use a 60/40 split (type column wider than masked object) since the extra width accommodates longer stacked body copy. Left-align the type column.
- **CTA slides**: Full-bleed navy, large italic headline centered, 3-line body stack below, extra-tall footer band (140px) with CTA centered.
- **Asymmetry**: The wide aspect ratio makes asymmetric compositions sing -- use dramatic 30/70 splits with the masked object small-but-commanding on one side.

### Poster (1080x1350px)
- **Typography**: Display Hero at 84px, Section Heading at 56px, Body Large at 28px.
- **Padding**: 80px left/right, 100px top/bottom.
- **Composition**: Top quarter -- italic headline alone, cream on navy, generous breathing room. Middle half -- the signature masked object as the hero centerpiece, up to 600px tall. Bottom quarter -- 3-line body stack + footer band edge-to-edge at the absolute bottom.
- **Vertical flow**: Read top-to-bottom. The masked object dominates the middle, with the headline above and the body stack + footer below.
- **Silhouette presence**: On poster format the masked object should be physically large -- at least 500px tall -- so its silhouette reads from a distance. The poster format is where this style looks most like a traditional advertising poster.
- **Footer band**: 96px tall powder blue band at the very bottom.

### Story (1080x1920px)
- **Typography scale**: Display Hero at 84px in Playfair Display 700 italic. Body Large at 32px in Inter 500. Footer CTA at 26px in Inter 600.
- **Padding**: 120px top/bottom + 60px left/right. Safe zones: 160px top and 200px bottom reserved for platform UI (profile avatar, progress bar, reply input). The footer band should sit inside the bottom safe zone -- flush with y=1720 (not y=1920) -- so it is not clipped by the reply input.
- **Layout**: Single centered column. Content max-width 960px. The masked object is the full-width hero, vertically dominant -- up to 900px tall. The italic headline sits above the masked object in the top third, the 3-line body stack sits below it in the lower third, and the powder blue footer band sits at y=1720 to y=1820.
- **Cover slide**: Italic headline at 84px cream, centered, top of content zone (y≈280). Masked object below (centered, 800-900px tall). Three-line body stack below the object (centered, white Inter 500 32px). Footer band with CTA in navy at the bottom of the safe zone.
- **Content slides**: One concept per slide. Smaller masked object (500px tall) centered, with a short italic headline above and a 3-line body stack below. Keep total type + image height inside y=280 to y=1680.
- **CTA slide**: Full-bleed navy, large italic headline centered, 3-line body stack, and the powder blue footer band elevated slightly (at y=1640) with a pill-shaped CTA button inside it.
- **Progress indicator**: Thin cream segments at the top of the safe zone -- inactive in `rgba(245, 240, 230, 0.25)`, active in `#F5F0E6`. The cream-on-navy keeps the progress bar legible without competing with the headline.

## 10. Agent Prompt Guide

### Quick Color Reference

| Name | Hex | Usage |
|------|-----|-------|
| Royal Navy | `#112A70` | Primary background -- every slide, edge-to-edge |
| Pale Cream | `#F5F0E6` | Italic serif display headlines |
| Pure White | `#FFFFFF` | Sans body copy (stacked 3-line declaratives) |
| Powder Blue | `#B8D4E8` | Full-width footer band fill |
| Navy on Powder | `#112A70` | Footer CTA label text (same as background) |
| Deep Navy Shadow | `#0A1F55` | Optional inset areas, rarely used |
| Cream Soft | `rgba(245, 240, 230, 0.75)` | Attributions, secondary metadata |
| Cream Muted | `rgba(245, 240, 230, 0.40)` | Slide numbers, watermarks |
| Hairline Cream | `rgba(245, 240, 230, 0.18)` | Optional rare divider line |

### Font Declarations

```css
/* Display (italic headlines only -- NEVER upright) */
font-family: 'Playfair Display', Georgia, 'Times New Roman', serif;
font-style: italic;

/* Body (stacked sans copy and footer CTA) */
font-family: 'Inter', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif;
font-style: normal;
```

### Google Fonts Link

```html
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400;1,500;1,600;1,700;1,800&family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
```

### CSS Root Variables

```css
:root {
  /* Colors -- Primary */
  --color-bg: #112A70;
  --color-navy: #112A70;
  --color-cream: #F5F0E6;
  --color-white: #FFFFFF;

  /* Colors -- Accent */
  --color-powder: #B8D4E8;
  --color-navy-deep: #0A1F55;

  /* Colors -- Neutral Scale */
  --color-cream-strong: #F5F0E6;
  --color-cream-soft: rgba(245, 240, 230, 0.75);
  --color-white-strong: #FFFFFF;
  --color-white-muted: rgba(255, 255, 255, 0.65);
  --color-powder-text: rgba(17, 42, 112, 0.85);
  --color-metadata-muted: rgba(245, 240, 230, 0.40);

  /* Colors -- Surfaces */
  --color-surface-primary: #112A70;
  --color-surface-footer: #B8D4E8;

  /* Colors -- Borders */
  --color-border-hairline: rgba(245, 240, 230, 0.18);
  --color-border-footer-top: rgba(17, 42, 112, 0.08);

  /* Colors -- Shadows */
  --shadow-subtle: rgba(10, 31, 85, 0.25);
  --shadow-medium: rgba(10, 31, 85, 0.40);
  --shadow-deep: rgba(10, 31, 85, 0.55);

  /* Typography -- Families */
  --font-display: 'Playfair Display', Georgia, 'Times New Roman', serif;
  --font-body: 'Inter', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif;

  /* Typography -- Sizes */
  --text-display-hero: 72px;
  --text-display-large: 60px;
  --text-section-heading: 48px;
  --text-sub-heading: 36px;
  --text-body-large: 28px;
  --text-body: 22px;
  --text-body-small: 18px;
  --text-big-number: 96px;
  --text-footer-cta: 22px;
  --text-small-caps: 13px;

  /* Typography -- Weights */
  --weight-display: 700;
  --weight-display-extra: 800;
  --weight-sub-heading: 600;
  --weight-body-medium: 500;
  --weight-body-regular: 400;
  --weight-cta: 600;
  --weight-small-caps: 600;

  /* Typography -- Styles (CRITICAL) */
  --style-display: italic;  /* Playfair is ALWAYS italic in this style */
  --style-body: normal;

  /* Typography -- Line Heights */
  --leading-display-hero: 1.05;
  --leading-display-large: 1.08;
  --leading-section: 1.10;
  --leading-sub-heading: 1.15;
  --leading-body-large: 1.30;
  --leading-body: 1.40;
  --leading-body-small: 1.50;
  --leading-number: 1.00;

  /* Typography -- Letter Spacing */
  --tracking-display: -0.5px;
  --tracking-section: -0.25px;
  --tracking-body: 0px;
  --tracking-cta: 0.2px;
  --tracking-small-caps: 1.5px;

  /* Spacing */
  --space-micro: 4px;
  --space-tight: 8px;
  --space-base: 16px;
  --space-small: 24px;
  --space-medium: 32px;
  --space-section: 48px;
  --space-standard: 60px;
  --space-large: 80px;
  --space-max: 120px;

  /* Borders & Radii */
  --radius-none: 0;
  --radius-pill: 9999px;

  /* Footer band */
  --footer-height-carousel: 96px;
  --footer-height-slides: 120px;
  --footer-height-story: 100px;
  --footer-padding-y: 32px;
  --footer-padding-x: 80px;
}
```

### System Font Fallbacks
- **Serif (if Playfair Display fails to load):** `Georgia, 'Times New Roman', serif` -- and still set `font-style: italic`.
- **Sans-serif (if Inter fails to load):** `-apple-system, 'Segoe UI', Helvetica, Arial, sans-serif`.

### Quick Start Checklist for Agents
1. Set the canvas background to `#112A70` royal navy.
2. Pick an SVG silhouette (wine glass, bottle, leaf, product, letterform) and drop the path into a `mask-image` or `<clipPath>`.
3. Apply the mask to a `<div>` with `background-image: url(photo)` or an `<image>` inside the SVG.
4. Set the italic Playfair Display headline in `#F5F0E6` at 60-72px, 3-6 words, 2 lines.
5. Add the 3-line sans body stack in `#FFFFFF` at Inter 500 28px -- each line ends with a period.
6. Drop in the full-width powder blue (`#B8D4E8`) footer band at the bottom with a single navy Inter 600 CTA label.
7. Verify: no rectangular photos, no upright serif, no pure white headlines, no drop shadows on the mask, no colors outside the 4-value palette.
