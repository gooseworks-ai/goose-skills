# Format: Carousel

Create multi-slide square carousels optimized for LinkedIn and Instagram. Each slide is an individual HTML file rendered at 1080x1080px, then screenshotted to PNG.

---

## 1. Format Specifications

| Property | Value |
|----------|-------|
| Dimensions | 1080 x 1080px per slide (1:1 square) |
| File structure | Individual HTML file per slide (`slide-01.html`, `slide-02.html`, ...) + `index.html` preview |
| Max slides | 10 |
| Ideal slide count | 5-8 (best engagement) |
| Output format | PNG per slide |
| Sizing approach | Fixed pixel sizes (NOT responsive) |

### Content Density Limits

Each slide must be scannable in 2-3 seconds on mobile.

| Slide Type | Max Content |
|------------|-------------|
| Cover | Title (8 words max) + subtitle (12 words max) + branding element |
| Numbered item | Number + heading (2 lines max) + body (3 lines / 40 words max) |
| Stat display | 1 large number + label (5 words) + description (20 words max) |
| Comparison | 2 columns, 3-4 bullet points each (6 words per point max) |
| List items | 3-4 items with icon + heading (4 words) + body (15 words each) |
| Quote | 1 quote (25 words max) + attribution |
| Framework | Diagram/visual + 2-4 labels (4 words each) |
| CTA | 1 heading + 1 action line + visual element |

**If content exceeds limits:** Break into multiple slides or simplify.

---

## 2. Workflow Overview

```
Content Discovery --> Style Selection --> HTML Generation --> Screenshot --> Delivery
```

1. Gather topic, content type, slide count, and content readiness from the user
2. Present style presets and let the user choose (or guide them)
3. Read the chosen style preset from `styles/[name].md`
4. Generate individual HTML files per slide + an `index.html` preview
5. Run the screenshot tool to export PNGs
6. Present the finished files to the user

---

## 3. Content Discovery Phase

Ask the user these questions before generating anything.

**Question 1: Topic**
- "What is the main topic of this carousel?"
- Free text input

**Question 2: Content Type**
- "What type of post is this?"
- Options:
  - **Numbered list** -- "5 ways to...", "7 mistakes...", "3 steps to..."
  - **How-to guide** -- Step-by-step tutorial or process
  - **Framework** -- Concept explanation with structure
  - **Comparison** -- Before/after, pros/cons, old way vs new way
  - **Insights / Tips** -- Collection of advice or learnings
  - **Case study** -- Results, metrics, transformation story

**Question 3: Slide Count**
- "How many slides?"
- Options:
  - **Short (5-6)** -- Quick, punchy (best for mobile scrolling)
  - **Medium (7-8)** -- Standard carousel length
  - **Long (9-10)** -- Maximum allowed

**Question 4: Content Readiness**
- "Do you have the content ready?"
- Options:
  - **Yes, I have all content** -- Paste it in
  - **I have bullet points** -- Need light formatting
  - **Just the topic** -- Need help outlining

If the user has content, ask them to share it before proceeding.

---

## 4. Style Selection Phase

Present the 10 available design presets:

| # | Preset | Description |
|---|--------|-------------|
| 1 | **Midnight Editorial** | Dark, elegant, magazine-inspired with copper accents |
| 2 | **Clean Slate** | Ultra-minimal, precise, modern tech aesthetic |
| 3 | **Warm Earth** | Organic, artisanal, grounded with natural tones |
| 4 | **Electric Burst** | Bold, energetic, attention-grabbing with vivid color |
| 5 | **Soft Cloud** | Airy, modern, approachable with gentle pastels |
| 6 | **Terminal** | Dev/hacker aesthetic, focused and technical |
| 7 | **Paper & Ink** | Classic editorial, literary, print-inspired |
| 8 | **Brutalist** | Raw, structural, anti-design with strong geometry |
| 9 | **Golden Dusk** | Warm, luxurious, premium with rich gold tones |
| 10 | **Deep Ocean** | Calm, professional, immersive blue-dark palette |

**Additional options:**

- **"I have a reference image"** -- Use the `extract-style` skill at `styles/extract-style.md` to derive a custom palette from the user's image.
- **Guided discovery** -- If the user is unsure, ask about their audience and tone, then recommend 2-3 presets:
  - Professional / Corporate --> Midnight Editorial, Clean Slate, Deep Ocean
  - Creative / Playful --> Electric Burst, Soft Cloud, Warm Earth
  - Technical / Dev-focused --> Terminal, Brutalist, Clean Slate
  - Elegant / Premium --> Midnight Editorial, Golden Dusk, Paper & Ink

**After selection:** Read the chosen style preset file from `styles/[name].md` to load all colors, typography, and component patterns. For example, if the user picks "Midnight Editorial", read `styles/midnight-editorial.md`.

---

## 5. HTML Generation Phase

### Base CSS (Mandatory)

Every carousel slide MUST include this dimension-locking CSS. Carousel slides are fixed-size -- no responsive scaling, no viewport units, no clamp(). Everything is in pixels.

```css
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

html, body {
    width: 1080px;
    height: 1080px;
    overflow: hidden;
}

body {
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 60px;
}
```

### Injecting the Style Preset

After reading the style preset file, find its **Section 9 (Agent Prompt Guide)** which contains the CSS `:root` variables. Paste those variables into each slide's `<style>` block:

```css
:root {
    /* -- Paste all CSS variables from the preset's Section 9 here -- */
    /* Example (Midnight Editorial): */
    /* --color-midnight: #0d0d0d; */
    /* --font-display: 'Playfair Display', Georgia, serif; */
    /* ... etc. */
}
```

Also add the Google Fonts `<link>` from the preset's Section 9 into the `<head>`.

### Using Component Patterns

The preset's **Section 4 (Component Patterns)** contains ready-to-use HTML snippets for title blocks, numbered items, stat displays, comparison grids, list items, quote blocks, and CTA blocks. Adapt these patterns for the 1080x1080 format.

The preset's **Section 8 (Format Adaptation Notes)** contains carousel-specific typography scale and layout guidance. Always apply these adaptations.

### Complete HTML Template (Single Slide)

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=1080, initial-scale=1.0">
    <title>Slide 01</title>

    <!-- Google Fonts: paste the link from your chosen preset's Section 9 -->
    <link href="https://fonts.googleapis.com/css2?family=PRESET_FONTS_HERE&display=swap" rel="stylesheet">

    <style>
        /* =============================================
           CAROUSEL SLIDE: 1080x1080px FIXED
           ============================================= */

        :root {
            /* -- Paste CSS variables from preset Section 9 -- */

            /* Carousel-specific overrides */
            --slide-width: 1080px;
            --slide-height: 1080px;
            --slide-padding: 60px;
            --content-max-width: 960px;
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        html, body {
            width: var(--slide-width);
            height: var(--slide-height);
            overflow: hidden;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
        }

        body {
            /* Use preset background variable */
            background-color: var(--bg-primary, var(--color-midnight, #0d0d0d));
            color: var(--text-primary, var(--color-cream, #f5f0e8));
            font-family: var(--font-body);
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            padding: var(--slide-padding);
        }

        .slide-content {
            width: 100%;
            max-width: var(--content-max-width);
            display: flex;
            flex-direction: column;
            gap: 24px;
        }

        /* =============================================
           TYPOGRAPHY HIERARCHY
           Scale down from preset's Section 8 carousel sizes
           ============================================= */

        .title {
            font-family: var(--font-display);
            font-size: 56px;
            font-weight: 700;
            line-height: 1.08;
            letter-spacing: -1px;
        }

        .subtitle {
            font-family: var(--font-body);
            font-size: 24px;
            font-weight: 300;
            line-height: 1.50;
        }

        .heading {
            font-family: var(--font-display);
            font-size: 40px;
            font-weight: 700;
            line-height: 1.12;
            letter-spacing: -0.5px;
        }

        .subheading {
            font-family: var(--font-display);
            font-size: 32px;
            font-weight: 700;
            line-height: 1.15;
        }

        .body-text {
            font-family: var(--font-body);
            font-size: 22px;
            font-weight: 400;
            line-height: 1.55;
        }

        .small-text {
            font-family: var(--font-body);
            font-size: 16px;
            font-weight: 400;
            line-height: 1.50;
        }

        .label {
            font-family: var(--font-body);
            font-size: 14px;
            font-weight: 600;
            letter-spacing: 2px;
            text-transform: uppercase;
        }

        .big-number {
            font-family: var(--font-display);
            font-size: 72px;
            font-weight: 900;
            line-height: 1.00;
            letter-spacing: -1px;
        }

        /* =============================================
           BRANDING FOOTER
           ============================================= */

        .brand {
            position: absolute;
            bottom: var(--slide-padding);
            right: var(--slide-padding);
            font-family: var(--font-body);
            font-size: 16px;
            font-weight: 400;
            opacity: 0.6;
        }

        /* =============================================
           SLIDE INDICATOR (optional dots)
           ============================================= */

        .slide-dots {
            position: absolute;
            bottom: var(--slide-padding);
            left: 50%;
            transform: translateX(-50%);
            display: flex;
            gap: 12px;
        }

        .slide-dots .dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            opacity: 0.3;
        }

        .slide-dots .dot.active {
            opacity: 1.0;
        }
    </style>
</head>
<body>
    <div class="slide-content">
        <!-- Slide content goes here -->
    </div>

    <div class="brand">@yourbrand</div>
</body>
</html>
```

### File Naming

Slides are numbered sequentially:
- `slide-01.html`
- `slide-02.html`
- `slide-03.html`
- ...up to `slide-10.html`

---

## 6. Content Templates

All templates use CSS custom properties so they work with any style preset. Adapt colors, fonts, and spacing from the preset's component patterns in Section 4.

### Cover Slide (Slide 1)

```html
<body>
    <div class="slide-content" style="text-align: center; justify-content: center; align-items: center;">

        <!-- Decorative accent rule -->
        <div style="width: 60px; height: 2px; background: var(--color-accent, var(--color-copper, #c17f59));"></div>

        <!-- Title -->
        <h1 class="title" style="margin-top: 24px;">
            5 AI Workflows<br>That Actually Work
        </h1>

        <!-- Subtitle -->
        <p class="subtitle" style="max-width: 680px; margin-top: 16px; opacity: 0.7;">
            Practical systems you can deploy this week
        </p>

        <!-- Bottom accent rule -->
        <div style="width: 60px; height: 2px; background: var(--color-accent, var(--color-copper, #c17f59)); margin-top: 32px;"></div>

    </div>

    <div class="brand">@yourbrand</div>
</body>
```

### Numbered Item

```html
<body>
    <div class="slide-content">

        <!-- Number -->
        <span class="big-number" style="color: var(--color-accent, var(--color-copper, #c17f59));">
            01
        </span>

        <!-- Category label -->
        <p class="label" style="color: var(--color-secondary-accent, var(--color-muted-gold, #a89067)); margin-top: 8px;">
            SIGNAL-BASED OUTBOUND
        </p>

        <!-- Heading -->
        <h2 class="heading" style="margin-top: 12px;">
            Find buyers before they find you
        </h2>

        <!-- Body -->
        <p class="body-text" style="margin-top: 12px; opacity: 0.7; max-width: 800px;">
            Monitor hiring signals, funding events, and tech stack changes to identify high-intent prospects the moment they enter the market.
        </p>

    </div>

    <div class="brand">@yourbrand &middot; 1/5</div>
</body>
```

### Stat Display

```html
<body>
    <div class="slide-content" style="text-align: center; justify-content: center; align-items: center;">

        <!-- Big stat number -->
        <p class="big-number" style="font-size: 120px; color: var(--color-accent, var(--color-copper, #c17f59));">
            47%
        </p>

        <!-- Stat label -->
        <p class="label" style="margin-top: 16px;">
            FASTER RESPONSE TIME
        </p>

        <!-- Context -->
        <p class="body-text" style="margin-top: 16px; opacity: 0.7; max-width: 640px;">
            Teams using AI coworkers respond to inbound leads nearly twice as fast as manual workflows.
        </p>

    </div>

    <div class="brand">@yourbrand &middot; 3/5</div>
</body>
```

### Comparison Grid

```html
<body>
    <div class="slide-content">

        <!-- Section heading -->
        <h2 class="heading" style="text-align: center; margin-bottom: 8px;">Before vs After</h2>

        <!-- Two-column comparison -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2px; border-radius: 4px; overflow: hidden; margin-top: 24px;">

            <!-- Left: Before -->
            <div style="background: var(--color-surface, var(--color-charcoal, #1a1a1a)); padding: 40px 32px;">
                <p class="label" style="opacity: 0.6; margin-bottom: 16px;">BEFORE</p>
                <h3 class="subheading" style="font-size: 28px; margin-bottom: 16px;">Manual Process</h3>
                <ul style="list-style: none; display: flex; flex-direction: column; gap: 12px;">
                    <li class="body-text" style="opacity: 0.7; font-size: 18px; padding-left: 24px; position: relative;">
                        <span style="position: absolute; left: 0; color: var(--color-accent);">&times;</span>
                        4 hours per lead
                    </li>
                    <li class="body-text" style="opacity: 0.7; font-size: 18px; padding-left: 24px; position: relative;">
                        <span style="position: absolute; left: 0; color: var(--color-accent);">&times;</span>
                        Inconsistent quality
                    </li>
                    <li class="body-text" style="opacity: 0.7; font-size: 18px; padding-left: 24px; position: relative;">
                        <span style="position: absolute; left: 0; color: var(--color-accent);">&times;</span>
                        Doesn't scale
                    </li>
                </ul>
            </div>

            <!-- Right: After -->
            <div style="background: var(--color-surface, var(--color-charcoal, #1a1a1a)); padding: 40px 32px; border-left: 2px solid var(--color-accent, var(--color-copper, #c17f59));">
                <p class="label" style="color: var(--color-accent, var(--color-copper, #c17f59)); margin-bottom: 16px;">AFTER</p>
                <h3 class="subheading" style="font-size: 28px; margin-bottom: 16px;">AI-Powered</h3>
                <ul style="list-style: none; display: flex; flex-direction: column; gap: 12px;">
                    <li class="body-text" style="opacity: 0.7; font-size: 18px; padding-left: 24px; position: relative;">
                        <span style="position: absolute; left: 0; color: var(--color-accent);">&#10003;</span>
                        15 minutes per lead
                    </li>
                    <li class="body-text" style="opacity: 0.7; font-size: 18px; padding-left: 24px; position: relative;">
                        <span style="position: absolute; left: 0; color: var(--color-accent);">&#10003;</span>
                        Consistently high quality
                    </li>
                    <li class="body-text" style="opacity: 0.7; font-size: 18px; padding-left: 24px; position: relative;">
                        <span style="position: absolute; left: 0; color: var(--color-accent);">&#10003;</span>
                        Scales infinitely
                    </li>
                </ul>
            </div>

        </div>

    </div>

    <div class="brand">@yourbrand &middot; 4/5</div>
</body>
```

### List Items

```html
<body>
    <div class="slide-content">

        <h2 class="heading" style="margin-bottom: 16px;">Key Capabilities</h2>

        <!-- List -->
        <div style="display: flex; flex-direction: column; gap: 0;">

            <div style="display: flex; gap: 20px; align-items: flex-start; padding: 24px 0; border-bottom: 1px solid var(--color-border, rgba(245,240,232,0.1));">
                <div style="width: 40px; height: 40px; min-width: 40px; display: flex; align-items: center; justify-content: center; border: 1px solid var(--color-border-accent, rgba(193,127,89,0.3)); border-radius: 4px; color: var(--color-accent); font-size: 18px;">&#9670;</div>
                <div>
                    <h4 class="subheading" style="font-size: 24px; margin-bottom: 6px;">Persistent Memory</h4>
                    <p class="body-text" style="opacity: 0.7; font-size: 18px;">Agents remember context across sessions. Nothing is lost.</p>
                </div>
            </div>

            <div style="display: flex; gap: 20px; align-items: flex-start; padding: 24px 0; border-bottom: 1px solid var(--color-border, rgba(245,240,232,0.1));">
                <div style="width: 40px; height: 40px; min-width: 40px; display: flex; align-items: center; justify-content: center; border: 1px solid var(--color-border-accent, rgba(193,127,89,0.3)); border-radius: 4px; color: var(--color-accent); font-size: 18px;">&#9670;</div>
                <div>
                    <h4 class="subheading" style="font-size: 24px; margin-bottom: 6px;">Multi-Channel Access</h4>
                    <p class="body-text" style="opacity: 0.7; font-size: 18px;">Reach your agents via Slack, Telegram, or web chat.</p>
                </div>
            </div>

            <div style="display: flex; gap: 20px; align-items: flex-start; padding: 24px 0;">
                <div style="width: 40px; height: 40px; min-width: 40px; display: flex; align-items: center; justify-content: center; border: 1px solid var(--color-border-accent, rgba(193,127,89,0.3)); border-radius: 4px; color: var(--color-accent); font-size: 18px;">&#9670;</div>
                <div>
                    <h4 class="subheading" style="font-size: 24px; margin-bottom: 6px;">Tool Integration</h4>
                    <p class="body-text" style="opacity: 0.7; font-size: 18px;">Connect to any API, database, or SaaS tool your team uses.</p>
                </div>
            </div>

        </div>

    </div>

    <div class="brand">@yourbrand &middot; 3/5</div>
</body>
```

### Quote Block

```html
<body>
    <div class="slide-content" style="justify-content: center;">

        <!-- Quote -->
        <div style="padding: 48px 40px; border-left: 2px solid var(--color-accent, var(--color-copper, #c17f59)); background: var(--color-surface-inset, #141414);">
            <p style="font-family: var(--font-display); font-size: 36px; font-weight: 400; font-style: italic; line-height: 1.35; letter-spacing: -0.5px;">
                "It felt less like configuring software and more like onboarding a new team member."
            </p>
            <div style="display: flex; align-items: center; gap: 12px; margin-top: 24px;">
                <div style="width: 32px; height: 2px; background: var(--color-accent, var(--color-copper, #c17f59));"></div>
                <p class="label" style="color: var(--color-secondary-accent, var(--color-muted-gold, #a89067));">
                    SARAH CHEN, VP OPERATIONS
                </p>
            </div>
        </div>

    </div>

    <div class="brand">@yourbrand &middot; 4/5</div>
</body>
```

### CTA Slide (Last Slide)

```html
<body>
    <div class="slide-content" style="text-align: center; justify-content: center; align-items: center;">

        <!-- Decorative accent rule -->
        <div style="width: 60px; height: 2px; background: var(--color-accent, var(--color-copper, #c17f59));"></div>

        <!-- Heading -->
        <h2 class="heading" style="font-size: 48px; margin-top: 24px;">
            Want more like this?
        </h2>

        <!-- Body -->
        <p class="body-text" style="margin-top: 16px; opacity: 0.7; max-width: 640px;">
            Follow for weekly breakdowns of AI-powered workflows and systems.
        </p>

        <!-- CTA button -->
        <div style="margin-top: 32px; display: inline-block; background: var(--color-accent, var(--color-copper, #c17f59)); color: var(--bg-primary, var(--color-midnight, #0d0d0d)); font-family: var(--font-body); font-size: 15px; font-weight: 600; letter-spacing: 0.8px; text-transform: uppercase; padding: 16px 40px; border-radius: 4px;">
            Follow &rarr;
        </div>

        <!-- Bottom accent rule -->
        <div style="width: 60px; height: 2px; background: var(--color-accent, var(--color-copper, #c17f59)); margin-top: 40px;"></div>

    </div>

    <div class="brand">@yourbrand</div>
</body>
```

### Index Preview File

Create an `index.html` that shows all slides in a scrollable grid for easy review:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Carousel Preview</title>
    <style>
        body {
            margin: 0;
            background: #111;
            color: #fff;
            font-family: -apple-system, sans-serif;
            padding: 40px;
        }
        h1 { font-size: 24px; margin-bottom: 32px; font-weight: 400; }
        .grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
            gap: 24px;
        }
        .slide-wrapper {
            width: 360px;
            height: 360px;
            overflow: hidden;
            border: 1px solid #333;
            border-radius: 4px;
            position: relative;
        }
        .slide-wrapper iframe {
            width: 1080px;
            height: 1080px;
            border: none;
            transform: scale(0.333);
            transform-origin: 0 0;
        }
        .slide-label {
            font-size: 13px;
            opacity: 0.5;
            margin-top: 8px;
        }
    </style>
</head>
<body>
    <h1>Carousel Preview</h1>
    <div class="grid">
        <!-- Repeat for each slide -->
        <div>
            <div class="slide-wrapper">
                <iframe src="slides/slide-01.html" scrolling="no"></iframe>
            </div>
            <p class="slide-label">Slide 01</p>
        </div>
        <!-- ... additional slides ... -->
    </div>
</body>
</html>
```

---

## 7. Screenshot Phase

After generating all HTML files, run the screenshot tool:

```bash
node screenshot/screenshot.js \
  --format carousel \
  --input ./EXPORT_DIR/slides \
  --output ./EXPORT_DIR/exports
```

Where `EXPORT_DIR` is the export directory (see Section 9).

This will:
1. Open each slide HTML in a headless Chromium browser
2. Set the viewport to 1080x1080px with 2x device scale factor
3. Wait for fonts to load (500ms default; use `--font-delay 1000` for custom fonts)
4. Capture a PNG screenshot of each slide
5. Save as `slide-01.png`, `slide-02.png`, etc. in the exports directory

---

## 8. Delivery Phase

After screenshots are generated, present results to the user:

```
Your carousel is ready!

Location: [EXPORT_DIR]/

Files:
  slides/        -- 7 HTML source files
  exports/       -- 7 PNG images (1080x1080px each)
  index.html     -- Preview all slides in browser

Export details:
  slide-01.png    287 KB
  slide-02.png    198 KB
  slide-03.png    224 KB
  slide-04.png    312 KB
  slide-05.png    189 KB
  slide-06.png    256 KB
  slide-07.png    201 KB
  Total:          1.67 MB

Upload instructions:
  LinkedIn: Create post > Add media > Upload all PNGs in order
  Instagram: New post > Select multiple > Upload all PNGs in order

Want to make any changes to the slides?
```

---

## 9. Export Directory Convention

Ask the user: **"Where should I save the exports? (default: ./goose-graphics-exports/)"**

### Directory naming
- Primary: `[YYYY-MM-DD]-[slugified-name]/` (e.g., `2026-04-04-ai-gtm-workflows/`)
- Fallback (no name given): `[YYYY-MM-DD]-carousel-[HHMMSS]/`

### Directory structure (carousel = multi-file)
```
goose-graphics-exports/
  2026-04-04-ai-gtm-workflows/
    slides/
      slide-01.html
      slide-02.html
      slide-03.html
      ...
    exports/
      slide-01.png
      slide-02.png
      slide-03.png
      ...
    index.html          # Preview file
```

---

## Design Reminders

- **Fixed pixels only.** Carousel slides are 1080x1080px exactly. Never use `vw`, `vh`, `clamp()`, or responsive units. Everything is defined in `px`.
- **One concept per slide.** Each slide should communicate a single idea that is scannable in 2-3 seconds.
- **High contrast.** Most viewers see carousels on small phone screens in bright environments. Ensure strong text/background contrast.
- **Consistent branding.** Place your handle or branding element in the same position on every slide (typically bottom-right).
- **Slide indicators.** Optionally include small dots at the bottom center to show progress.
- **Mobile-first.** Text must be readable at thumbnail size. Minimum body text size: 18px. Minimum heading size: 32px.
