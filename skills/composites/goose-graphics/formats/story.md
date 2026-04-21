# Format: Story

Create vertical 9:16 story slides optimized for Instagram Stories, LinkedIn Stories, TikTok slides, and Snapchat. Each slide is an individual HTML file rendered at 1080x1920px, then screenshotted to PNG.

---

## 1. Format Specifications

| Property | Value |
|----------|-------|
| Dimensions | 1080 x 1920px per slide (9:16 vertical) |
| File structure | Individual HTML file per slide (`story-01.html`, `story-02.html`, ...) + `index.html` preview |
| Max slides | 10 |
| Ideal slide count | 3-6 (best completion rate) |
| Output format | PNG per slide |
| Sizing approach | Fixed pixel sizes (NOT responsive) |
| Safe zones | 160px top + 160px bottom reserved for platform UI |

### Content Density Limits

Stories are watched at full-screen on a phone, typically in 3-5 seconds per frame. Every slide must communicate a single idea with ONE focal element.

| Slide Type | Max Content |
|------------|-------------|
| Cover | Title (6 words max) + subtitle (10 words max) + branding element |
| Hook / Question | 1 question (10 words max) |
| Single stat | 1 big number + label (4 words) + 1-line context (15 words max) |
| Quote | 1 quote (20 words max) + attribution |
| Numbered item | Number + heading (2 lines max) + body (25 words max) |
| Visual / Photo | 1 full-bleed image + 1 headline overlay (6 words max) |
| CTA | 1 action heading + 1 support line + swipe/tap element |

**If content exceeds limits:** Break into multiple slides. Stories are meant to be tapped through quickly; cramming kills completion rate.

### Platform Safe Zones

Platform UI (profile avatar, reply bar, progress segments) overlays the top and bottom of every story. Reserve:

- **Top 160px** -- profile avatar, progress bar, close button
- **Bottom 160px** -- reply input, swipe-up indicator, reaction bar

All critical content (headlines, CTAs, big numbers) must sit inside the middle 1600px safe zone (from y=160 to y=1760). Decorative background elements (gradients, photos, textures) can extend into the safe zones; text and interactive UI cannot.

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
- "What is the main topic of this story?"
- Free text input

**Question 2: Content Type**
- "What type of story is this?"
- Options:
  - **Hook -> Insight -> CTA** -- The classic 3-slide story sequence
  - **Numbered list** -- "3 ways to...", "5 reasons..."
  - **Before / After** -- Transformation or comparison
  - **Announcement** -- Launch, release, event
  - **Quote / Testimonial** -- Featured customer voice
  - **Behind-the-scenes** -- Narrative sequence

**Question 3: Slide Count**
- "How many story slides?"
- Options:
  - **Short (3)** -- Hook + Insight + CTA. Best for announcements.
  - **Medium (4-6)** -- Standard story sequence.
  - **Long (7-10)** -- Maximum allowed. Use only for strong narrative arcs.

**Question 4: Content Readiness**
- "Do you have the content ready?"
- Same options as carousel format.

---

## 4. Style Selection Phase

Present the available design presets (see SKILL.md §5 for the full list). After selection, read the chosen style preset file from `styles/[name].md`.

**Guided discovery** -- if the user is unsure, ask about their platform and audience, then recommend 2-3 presets:
- Instagram / lifestyle brand --> cinematic-romance, peach-pop, pastel-organic-shapes, warm-earth
- LinkedIn / B2B --> matt-gray, midnight-editorial, heatwave-orange
- Tech / developer --> terminal, brutalist, deep-ocean, iridescent-y2k
- Editorial / magazine --> paper-and-ink, sunburst-editorial, magazine-red

**After selection:** Read the chosen style preset file. Look specifically at **Section 8 (Format Adaptation Notes) -> Story (1080x1920)** for the format-specific typography scale and layout guidance.

---

## 5. HTML Generation Phase

### Base CSS (Mandatory)

Every story slide MUST include this dimension-locking CSS. Stories are fixed-size -- no responsive scaling, no viewport units, no clamp(). Everything is in pixels.

```css
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

html, body {
    width: 1080px;
    height: 1920px;
    overflow: hidden;
}

body {
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 120px 60px;  /* top/bottom bigger to respect safe zones */
}
```

### Safe Zone Variables

```css
:root {
    --story-width: 1080px;
    --story-height: 1920px;
    --story-padding-x: 60px;
    --story-padding-y: 120px;
    --safe-top: 160px;
    --safe-bottom: 160px;
    --content-max-width: 960px;
}
```

### Injecting the Style Preset

After reading the style preset file, find its **Section 9 (Agent Prompt Guide)** CSS `:root` variables and paste them into each slide's `<style>` block. Then look at **Section 8 (Story 1080x1920)** for the preset's specific Story typography scale and apply those sizes.

Also add the Google Fonts `<link>` from the preset's Section 9 into the `<head>`.

### Complete HTML Template (Single Slide)

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=1080, initial-scale=1.0">
    <title>Story 01</title>

    <!-- Google Fonts: paste the link from your chosen preset's Section 9 -->
    <link href="https://fonts.googleapis.com/css2?family=PRESET_FONTS_HERE&display=swap" rel="stylesheet">

    <style>
        /* =============================================
           STORY SLIDE: 1080x1920px FIXED
           ============================================= */

        :root {
            /* -- Paste CSS variables from preset Section 9 -- */

            /* Story-specific overrides */
            --story-width: 1080px;
            --story-height: 1920px;
            --story-padding-x: 60px;
            --story-padding-y: 120px;
            --safe-top: 160px;
            --safe-bottom: 160px;
            --content-max-width: 960px;
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        html, body {
            width: var(--story-width);
            height: var(--story-height);
            overflow: hidden;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
        }

        body {
            /* Use preset background variable */
            background-color: var(--bg-primary);
            color: var(--text-primary);
            font-family: var(--font-body);
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            padding: var(--story-padding-y) var(--story-padding-x);
            position: relative;
        }

        .story-content {
            width: 100%;
            max-width: var(--content-max-width);
            display: flex;
            flex-direction: column;
            gap: 32px;
        }

        /* =============================================
           TYPOGRAPHY HIERARCHY (Story scale)
           Typically ~30% larger than carousel scale -- stories
           are viewed at full-screen phone size where headlines
           need to carry the frame on their own.
           ============================================= */

        .title {
            font-family: var(--font-display);
            font-size: 96px;
            font-weight: 700;
            line-height: 1.05;
            letter-spacing: -1.5px;
        }

        .subtitle {
            font-family: var(--font-body);
            font-size: 32px;
            font-weight: 400;
            line-height: 1.40;
        }

        .heading {
            font-family: var(--font-display);
            font-size: 72px;
            font-weight: 700;
            line-height: 1.10;
            letter-spacing: -0.8px;
        }

        .body-text {
            font-family: var(--font-body);
            font-size: 28px;
            font-weight: 400;
            line-height: 1.50;
        }

        .label {
            font-family: var(--font-body);
            font-size: 18px;
            font-weight: 600;
            letter-spacing: 2px;
            text-transform: uppercase;
        }

        .big-number {
            font-family: var(--font-display);
            font-size: 180px;
            font-weight: 900;
            line-height: 1.00;
            letter-spacing: -2px;
        }

        /* =============================================
           SAFE ZONES (visual debug only -- remove in production)
           ============================================= */

        /*
        body::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: var(--safe-top);
            background: rgba(255,0,0,0.1);
            pointer-events: none;
        }

        body::after {
            content: '';
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            height: var(--safe-bottom);
            background: rgba(255,0,0,0.1);
            pointer-events: none;
        }
        */

        /* =============================================
           BRANDING FOOTER (sits inside content area, above bottom safe zone)
           ============================================= */

        .brand {
            position: absolute;
            bottom: calc(var(--safe-bottom) + 40px);
            left: 50%;
            transform: translateX(-50%);
            font-family: var(--font-body);
            font-size: 20px;
            font-weight: 500;
            opacity: 0.7;
            text-align: center;
        }

        /* =============================================
           PROGRESS SEGMENTS (optional, at top inside safe zone)
           ============================================= */

        .progress {
            position: absolute;
            top: 60px;
            left: var(--story-padding-x);
            right: var(--story-padding-x);
            display: flex;
            gap: 6px;
        }

        .progress .segment {
            flex: 1;
            height: 3px;
            background: rgba(255,255,255,0.3);
            border-radius: 2px;
        }

        .progress .segment.active {
            background: var(--text-primary);
        }

        /* =============================================
           SWIPE-UP INDICATOR (optional, above bottom safe zone)
           ============================================= */

        .swipe-up {
            position: absolute;
            bottom: calc(var(--safe-bottom) + 80px);
            left: 50%;
            transform: translateX(-50%);
            font-family: var(--font-body);
            font-size: 16px;
            font-weight: 600;
            letter-spacing: 1.5px;
            text-transform: uppercase;
            opacity: 0.8;
        }
    </style>
</head>
<body>
    <!-- Optional progress bar -->
    <div class="progress">
        <div class="segment active"></div>
        <div class="segment"></div>
        <div class="segment"></div>
    </div>

    <div class="story-content">
        <!-- Slide content goes here -->
    </div>

    <div class="brand">@yourbrand</div>
</body>
</html>
```

### File Naming

Slides are numbered sequentially:
- `story-01.html`
- `story-02.html`
- `story-03.html`
- ...up to `story-10.html`

---

## 6. Content Templates

All templates use CSS custom properties so they work with any style preset. Adapt colors, fonts, and spacing from the preset's component patterns in Section 4.

### Cover Slide (Slide 1)

```html
<body>
    <div class="story-content" style="text-align: center; justify-content: center; align-items: center;">

        <!-- Small label -->
        <p class="label" style="margin-bottom: 40px; opacity: 0.7;">
            THE GOOSE GUIDE
        </p>

        <!-- Title -->
        <h1 class="title">
            5 AI Workflows<br>That Actually Work
        </h1>

        <!-- Subtitle -->
        <p class="subtitle" style="margin-top: 32px; opacity: 0.7; max-width: 720px;">
            Tap to see the full list.
        </p>

    </div>

    <div class="brand">@yourbrand</div>
</body>
```

### Hook / Question Slide

```html
<body>
    <div class="story-content" style="justify-content: center;">

        <p class="label" style="margin-bottom: 32px; opacity: 0.6;">
            ASK YOURSELF
        </p>

        <h2 class="heading">
            Why does your<br>AI workflow<br>feel so manual?
        </h2>

    </div>

    <div class="brand">@yourbrand</div>
    <p class="swipe-up">Swipe up for the answer &uarr;</p>
</body>
```

### Stat Display

```html
<body>
    <div class="story-content" style="text-align: center; justify-content: center; align-items: center;">

        <!-- Big stat number -->
        <p class="big-number" style="color: var(--color-accent);">
            47%
        </p>

        <!-- Stat label -->
        <p class="label" style="margin-top: 24px;">
            FASTER RESPONSE
        </p>

        <!-- Context -->
        <p class="body-text" style="margin-top: 32px; opacity: 0.7; max-width: 720px;">
            Teams using AI coworkers respond to inbound leads nearly twice as fast as manual workflows.
        </p>

    </div>

    <div class="brand">@yourbrand &middot; 3/5</div>
</body>
```

### Quote Slide

```html
<body>
    <div class="story-content" style="justify-content: center;">

        <div style="padding: 64px 48px; border-left: 4px solid var(--color-accent);">
            <p style="font-family: var(--font-display); font-size: 54px; font-weight: 400; font-style: italic; line-height: 1.30; letter-spacing: -0.5px;">
                "It felt less like configuring software and more like onboarding a new team member."
            </p>
            <div style="display: flex; align-items: center; gap: 16px; margin-top: 40px;">
                <div style="width: 48px; height: 3px; background: var(--color-accent);"></div>
                <p class="label" style="opacity: 0.8;">
                    SARAH CHEN, VP OPS
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
    <div class="story-content" style="text-align: center; justify-content: center; align-items: center;">

        <p class="label" style="opacity: 0.7; margin-bottom: 32px;">
            READY?
        </p>

        <h2 class="heading" style="font-size: 84px;">
            Meet your<br>AI coworker.
        </h2>

        <p class="body-text" style="margin-top: 32px; opacity: 0.7; max-width: 720px;">
            Tap the link in bio to get started.
        </p>

        <div style="margin-top: 56px; display: inline-block; background: var(--color-accent); color: var(--bg-primary); font-family: var(--font-body); font-size: 24px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; padding: 24px 56px; border-radius: 8px;">
            Tap the Link &rarr;
        </div>

    </div>

    <div class="brand">@yourbrand</div>
</body>
```

### Index Preview File

Create an `index.html` that shows all story slides in a horizontal scroll for easy review:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Story Preview</title>
    <style>
        body {
            margin: 0;
            background: #111;
            color: #fff;
            font-family: -apple-system, sans-serif;
            padding: 40px;
        }
        h1 { font-size: 24px; margin-bottom: 32px; font-weight: 400; }
        .row {
            display: flex;
            gap: 24px;
            overflow-x: auto;
            padding-bottom: 24px;
        }
        .slide-wrapper {
            width: 270px;
            height: 480px;
            min-width: 270px;
            overflow: hidden;
            border: 1px solid #333;
            border-radius: 12px;
            position: relative;
        }
        .slide-wrapper iframe {
            width: 1080px;
            height: 1920px;
            border: none;
            transform: scale(0.25);
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
    <h1>Story Preview</h1>
    <div class="row">
        <div>
            <div class="slide-wrapper">
                <iframe src="slides/story-01.html" scrolling="no"></iframe>
            </div>
            <p class="slide-label">Story 01</p>
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
  --format story \
  --input ./EXPORT_DIR/slides \
  --output ./EXPORT_DIR/exports
```

Where `EXPORT_DIR` is the export directory (see Section 9).

This will:
1. Open each slide HTML in a headless Chromium browser
2. Set the viewport to 1080x1920px with 2x device scale factor
3. Wait for fonts to load (500ms default; use `--font-delay 1000` for custom fonts)
4. Capture a PNG screenshot of each slide
5. Save as `story-01.png`, `story-02.png`, etc. in the exports directory

If the current `screenshot/screenshot.js` does not yet support `story` as a format flag, add a case that sets `viewport: { width: 1080, height: 1920 }` and uses the output naming pattern `story-##.png`.

---

## 8. Delivery Phase

After screenshots are generated, present results to the user:

```
Your story is ready!

Location: [EXPORT_DIR]/

Files:
  slides/        -- 4 HTML source files
  exports/       -- 4 PNG images (1080x1920px each)
  index.html     -- Preview all slides in browser

Export details:
  story-01.png    512 KB
  story-02.png    478 KB
  story-03.png    491 KB
  story-04.png    356 KB
  Total:          1.8 MB

Upload instructions:
  Instagram: Stories > + > Upload each PNG as a separate story
  LinkedIn: Add story > Upload each PNG in sequence
  TikTok: Upload as photo carousel

Want to make any changes to the slides?
```

---

## 9. Export Directory Convention

Ask the user: **"Where should I save the exports? (default: ./goose-graphics-exports/)"**

### Directory naming
- Primary: `[YYYY-MM-DD]-[slugified-name]-story/` (e.g., `2026-04-15-ai-gtm-story/`)
- Fallback (no name given): `[YYYY-MM-DD]-story-[HHMMSS]/`

### Directory structure (story = multi-file)
```
goose-graphics-exports/
  2026-04-15-ai-gtm-story/
    slides/
      story-01.html
      story-02.html
      story-03.html
      ...
    exports/
      story-01.png
      story-02.png
      story-03.png
      ...
    index.html          # Preview file
```

---

## Design Reminders

- **Fixed pixels only.** Story slides are 1080x1920px exactly. Never use `vw`, `vh`, `clamp()`, or responsive units. Everything is defined in `px`.
- **One focal element per slide.** Stories are viewed full-screen for 3-5 seconds. If the viewer has to pick which thing to read first, you've already lost them.
- **Respect the safe zones.** Keep all critical text between y=160 and y=1760. Decorative backgrounds can extend edge-to-edge; readable content cannot.
- **Big type, big margins.** Story hero type is typically ~30% larger than carousel hero type. 96px title, 72px heading, 180px big-number. Anything smaller gets lost on a phone.
- **Center the gravity.** Stories feel right when content clusters in the vertical middle (y=400 to y=1500). Top and bottom are for labels and chrome.
- **Sparse is strong.** Four lines of body text is the ceiling for any content slide. More than that, split into two slides.
- **High contrast.** Most viewers watch stories outdoors or on low brightness. Strong text/background contrast is non-negotiable. Minimum 4.5:1.
- **Consistent branding.** Place your handle in the same position on every slide -- bottom center just above the safe zone is the convention.
- **Progress segments.** If your story is 3+ slides, include progress segments at the top (inside the safe zone, y=60). Each segment is 3px tall, flex-equal-width, with the current slide's segment fully filled.
