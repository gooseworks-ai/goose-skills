# Format: Slides

Create widescreen presentation slides at 1920x1080px (16:9). Each slide is an individual HTML file, plus an `index.html` with keyboard navigation and scroll-snap for presenting directly in the browser.

---

## 1. Format Specifications

| Property | Value |
|----------|-------|
| Dimensions | 1920 x 1080px per slide (16:9 widescreen) |
| File structure | Individual HTML file per slide (`slide-01.html`, `slide-02.html`, ...) + `index.html` with navigation |
| Max slides | No hard limit (10-30 typical) |
| Output format | PNG per slide |
| Sizing approach | Fixed pixel base with `clamp()` for browser-presentable index |

### CRITICAL: Viewport Fitting

Every slide MUST fit exactly within 1920x1080px. No scrolling, no overflow, no exceptions.

- `overflow: hidden` on every `.slide` element
- Content that does not fit must be split across multiple slides
- Never reduce font size below readable limits to force a fit

### Content Density Limits

Each slide must be readable at a glance during a presentation.

| Slide Type | Max Content |
|------------|-------------|
| Title slide | 1 heading (8 words max) + 1 subtitle (15 words max) + branding |
| Content slide | 1 heading + 4-6 bullet points (10 words each) OR 1 heading + 2 short paragraphs |
| Stat slide | 1-3 large numbers with labels and brief context |
| Comparison | 1 heading + 2-column layout, 3-4 points per column |
| Quote slide | 1 quote (30 words max) + attribution |
| Code slide | 1 heading + 8-10 lines of code maximum |
| Feature grid | 1 heading + 6 cards maximum (2x3 or 3x2 grid) |
| Image slide | 1 heading + 1 image (max 60% of slide height) |
| CTA slide | 1 heading + 1 action line + contact/link |

**If content exceeds limits:** Split into multiple slides. Never cram.

---

## 2. Workflow Overview

```
Content Discovery --> Style Selection --> HTML Generation --> Screenshot --> Delivery
```

1. Gather presentation purpose, slide count, and content readiness from the user
2. Present style presets and let the user choose (or guide them)
3. Read the chosen style preset from `styles/[name].md`
4. Generate individual HTML files per slide + an `index.html` with navigation
5. Run the screenshot tool to export PNGs
6. Present the finished files to the user

---

## 3. Content Discovery Phase

Ask the user these questions before generating anything.

**Question 1: Topic**
- "What is this presentation about?"
- Free text input

**Question 2: Content Type**
- "What kind of presentation is this?"
- Options:
  - **Pitch deck** -- Selling an idea, product, or company
  - **Teaching / Tutorial** -- Explaining concepts, how-to guides
  - **Conference talk** -- Speaking at an event, keynote, tech talk
  - **Internal presentation** -- Team updates, strategy meetings
  - **Report / Review** -- Quarterly results, performance review, analysis

**Question 3: Slide Count**
- "Approximately how many slides?"
- Options:
  - **Short (5-10)** -- Lightning talk, quick pitch
  - **Medium (10-20)** -- Standard presentation
  - **Long (20-30+)** -- Deep dive, comprehensive talk

**Question 4: Content Readiness**
- "Do you have the content ready?"
- Options:
  - **Yes, I have all content** -- Paste it in
  - **I have rough notes** -- Need help organizing into slides
  - **Just the topic** -- Need help creating the full outline

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
  - Professional / Corporate --> Clean Slate, Deep Ocean, Midnight Editorial
  - Creative / Playful --> Electric Burst, Soft Cloud, Warm Earth
  - Technical / Dev-focused --> Terminal, Brutalist, Clean Slate
  - Elegant / Premium --> Midnight Editorial, Golden Dusk, Paper & Ink

**After selection:** Read the chosen style preset file from `styles/[name].md` to load all colors, typography, and component patterns. For example, if the user picks "Terminal", read `styles/terminal.md`.

---

## 5. HTML Generation Phase

### Base CSS (Mandatory)

Every slide MUST include this dimension-locking CSS. Individual slide files use fixed pixels. The `index.html` presenter uses `clamp()` for browser-responsive viewing.

#### For Individual Slide Files (`slide-XX.html`)

```css
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

html, body {
    width: 1920px;
    height: 1080px;
    overflow: hidden;
}

body {
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 80px;
}

.slide {
    width: 1920px;
    height: 1080px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    justify-content: center;
    position: relative;
}
```

#### For the Index Presenter (`index.html`)

```css
html {
    scroll-snap-type: y mandatory;
    scroll-behavior: smooth;
    height: 100%;
    overflow-x: hidden;
}

body {
    height: 100%;
    margin: 0;
}

.slide {
    width: 100vw;
    height: 100vh;
    height: 100dvh;
    overflow: hidden;
    scroll-snap-align: start;
    display: flex;
    flex-direction: column;
    justify-content: center;
    position: relative;
    padding: clamp(2rem, 4vw, 80px);
}
```

### Injecting the Style Preset

After reading the style preset file, find its **Section 9 (Agent Prompt Guide)** which contains the CSS `:root` variables. Paste those variables into each slide's `<style>` block:

```css
:root {
    /* -- Paste all CSS variables from the preset's Section 9 here -- */

    /* Slides-specific overrides */
    --slide-width: 1920px;
    --slide-height: 1080px;
    --slide-padding: 80px;
    --content-max-width: 1760px;
}
```

Also add the Google Fonts `<link>` from the preset's Section 9 into the `<head>`.

### Using Component Patterns

The preset's **Section 4 (Component Patterns)** contains ready-to-use HTML snippets. Scale them up for the 1920x1080 widescreen format.

The preset's **Section 8 (Format Adaptation Notes)** contains slides-specific typography and layout guidance. Always apply these adaptations:
- Display Hero scales up to 80px
- Section Heading scales up to 56px
- Body Large scales up to 22px
- Left-heavy composition: title and body text in the left 60%, right 40% as breathing room

### Complete HTML Template (Single Slide)

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=1920, initial-scale=1.0">
    <title>Slide 01</title>

    <!-- Google Fonts: paste the link from your chosen preset's Section 9 -->
    <link href="https://fonts.googleapis.com/css2?family=PRESET_FONTS_HERE&display=swap" rel="stylesheet">

    <style>
        /* =============================================
           PRESENTATION SLIDE: 1920x1080px FIXED
           ============================================= */

        :root {
            /* -- Paste CSS variables from preset Section 9 -- */

            /* Slides-specific overrides */
            --slide-width: 1920px;
            --slide-height: 1080px;
            --slide-padding: 80px;
            --content-max-width: 1760px;
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
            background-color: var(--bg-primary, var(--color-midnight, #0d0d0d));
            color: var(--text-primary, var(--color-cream, #f5f0e8));
            font-family: var(--font-body);
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: flex-start;
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
           Scaled up for widescreen from preset Section 8
           ============================================= */

        .display-title {
            font-family: var(--font-display);
            font-size: 80px;
            font-weight: 700;
            line-height: 1.05;
            letter-spacing: -1.5px;
        }

        .section-heading {
            font-family: var(--font-display);
            font-size: 56px;
            font-weight: 700;
            line-height: 1.10;
            letter-spacing: -1px;
        }

        .sub-heading {
            font-family: var(--font-display);
            font-size: 36px;
            font-weight: 700;
            line-height: 1.15;
            letter-spacing: -0.5px;
        }

        .body-large {
            font-family: var(--font-body);
            font-size: 22px;
            font-weight: 300;
            line-height: 1.60;
        }

        .body-text {
            font-family: var(--font-body);
            font-size: 18px;
            font-weight: 400;
            line-height: 1.65;
        }

        .small-text {
            font-family: var(--font-body);
            font-size: 14px;
            font-weight: 400;
            line-height: 1.50;
            letter-spacing: 0.3px;
        }

        .label {
            font-family: var(--font-body);
            font-size: 16px;
            font-weight: 600;
            letter-spacing: 2px;
            text-transform: uppercase;
        }

        .big-number {
            font-family: var(--font-display);
            font-size: 96px;
            font-weight: 900;
            line-height: 1.00;
            letter-spacing: -1px;
        }

        /* =============================================
           LAYOUT HELPERS
           ============================================= */

        .left-content {
            max-width: 60%;
        }

        .two-column {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 40px;
            width: 100%;
        }

        .three-column {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 32px;
            width: 100%;
        }

        .card {
            background: var(--color-surface, var(--color-charcoal, #1a1a1a));
            border: 1px solid var(--color-border, rgba(245,240,232,0.1));
            border-radius: 4px;
            padding: 40px 32px;
        }

        /* =============================================
           SLIDE NUMBER
           ============================================= */

        .slide-number {
            position: absolute;
            bottom: var(--slide-padding);
            right: var(--slide-padding);
            font-family: var(--font-body);
            font-size: 14px;
            font-weight: 400;
            opacity: 0.4;
        }
    </style>
</head>
<body>
    <div class="slide-content">
        <!-- Slide content goes here -->
    </div>

    <div class="slide-number">01</div>
</body>
</html>
```

### File Naming

Slides are numbered sequentially:
- `slide-01.html`
- `slide-02.html`
- `slide-03.html`
- ...and so on

---

## 6. Content Templates

All templates use CSS custom properties so they work with any style preset. For widescreen slides, favor left-aligned layouts with generous whitespace on the right.

### Title Slide (Slide 1)

```html
<body>
    <div class="slide-content" style="text-align: center; justify-content: center; align-items: center;">

        <!-- Accent rule -->
        <div style="width: 60px; height: 2px; background: var(--color-accent, var(--color-copper, #c17f59));"></div>

        <!-- Title -->
        <h1 class="display-title" style="margin-top: 32px; max-width: 1200px;">
            The Future of Autonomous Work
        </h1>

        <!-- Subtitle -->
        <p class="body-large" style="margin-top: 20px; opacity: 0.7; max-width: 800px;">
            How AI coworkers are reshaping the way teams operate, collaborate, and deliver results.
        </p>

        <!-- Accent rule -->
        <div style="width: 60px; height: 2px; background: var(--color-accent, var(--color-copper, #c17f59)); margin-top: 40px;"></div>

        <!-- Author / date -->
        <p class="label" style="margin-top: 32px; opacity: 0.5;">
            YOUR NAME &middot; APRIL 2026
        </p>
    </div>
</body>
```

### Numbered Item

```html
<body>
    <div class="slide-content">

        <div class="left-content">
            <!-- Number -->
            <span class="big-number" style="color: var(--color-accent, var(--color-copper, #c17f59));">
                01
            </span>

            <!-- Category label -->
            <p class="label" style="color: var(--color-secondary-accent, var(--color-muted-gold, #a89067)); margin-top: 12px;">
                SIGNAL-BASED OUTBOUND
            </p>

            <!-- Heading -->
            <h2 class="section-heading" style="margin-top: 16px;">
                Find buyers before they find you
            </h2>

            <!-- Body -->
            <p class="body-large" style="margin-top: 16px; opacity: 0.7; max-width: 800px;">
                Monitor hiring signals, funding events, and tech stack changes to identify high-intent prospects the moment they enter the market.
            </p>
        </div>

    </div>

    <div class="slide-number">03</div>
</body>
```

### Stat Display (Up to 3 Stats)

```html
<body>
    <div class="slide-content">

        <h2 class="section-heading" style="text-align: center; margin-bottom: 16px;">Impact at a Glance</h2>

        <div class="three-column" style="margin-top: 24px;">
            <!-- Stat 1 -->
            <div class="card" style="text-align: center;">
                <p class="big-number" style="color: var(--color-accent, var(--color-copper, #c17f59));">47%</p>
                <p class="label" style="margin-top: 16px;">FASTER RESPONSE</p>
                <p class="body-text" style="margin-top: 12px; opacity: 0.7;">Teams respond to leads nearly twice as fast with AI-powered workflows.</p>
            </div>

            <!-- Stat 2 -->
            <div class="card" style="text-align: center;">
                <p class="big-number" style="color: var(--color-accent, var(--color-copper, #c17f59));">3.2x</p>
                <p class="label" style="margin-top: 16px;">PIPELINE GROWTH</p>
                <p class="body-text" style="margin-top: 12px; opacity: 0.7;">Average pipeline increase within the first 90 days of deployment.</p>
            </div>

            <!-- Stat 3 -->
            <div class="card" style="text-align: center;">
                <p class="big-number" style="color: var(--color-accent, var(--color-copper, #c17f59));">12h</p>
                <p class="label" style="margin-top: 16px;">SAVED WEEKLY</p>
                <p class="body-text" style="margin-top: 12px; opacity: 0.7;">Hours reclaimed from manual research and data entry per team member.</p>
            </div>
        </div>

    </div>

    <div class="slide-number">05</div>
</body>
```

### Comparison Grid

```html
<body>
    <div class="slide-content">

        <h2 class="section-heading" style="text-align: center; margin-bottom: 16px;">Old Way vs New Way</h2>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2px; background: var(--color-border, rgba(245,240,232,0.1)); border-radius: 4px; overflow: hidden; margin-top: 24px;">
            <!-- Left -->
            <div style="background: var(--color-surface, var(--color-charcoal, #1a1a1a)); padding: 48px 40px;">
                <p class="small-text" style="color: var(--color-secondary-accent, var(--color-muted-gold, #a89067)); margin-bottom: 20px;">Without AI</p>
                <h3 class="sub-heading" style="margin-bottom: 20px;">Manual & Fragmented</h3>
                <p class="body-text" style="opacity: 0.7;">Teams juggle Slack threads, spreadsheets, and context-switching between a dozen tabs to coordinate basic workflows.</p>
            </div>

            <!-- Right (featured) -->
            <div style="background: var(--color-surface, var(--color-charcoal, #1a1a1a)); padding: 48px 40px; border-left: 2px solid var(--color-accent, var(--color-copper, #c17f59));">
                <p class="small-text" style="color: var(--color-accent, var(--color-copper, #c17f59)); margin-bottom: 20px;">With AI</p>
                <h3 class="sub-heading" style="margin-bottom: 20px;">Orchestrated & Autonomous</h3>
                <p class="body-text" style="opacity: 0.7;">AI coworkers handle research, drafting, and follow-up autonomously. Your team focuses on decisions, not busywork.</p>
            </div>
        </div>

    </div>

    <div class="slide-number">06</div>
</body>
```

### List Items

```html
<body>
    <div class="slide-content">

        <h2 class="section-heading" style="margin-bottom: 16px;">Core Capabilities</h2>

        <div class="two-column" style="margin-top: 16px;">
            <!-- Left column items -->
            <div style="display: flex; flex-direction: column; gap: 0;">
                <div style="display: flex; gap: 20px; align-items: flex-start; padding: 24px 0; border-bottom: 1px solid var(--color-border, rgba(245,240,232,0.1));">
                    <div style="width: 40px; height: 40px; min-width: 40px; display: flex; align-items: center; justify-content: center; border: 1px solid var(--color-border-accent, rgba(193,127,89,0.3)); border-radius: 4px; color: var(--color-accent); font-size: 18px;">&#9670;</div>
                    <div>
                        <h4 class="sub-heading" style="font-size: 24px; margin-bottom: 6px;">Persistent Memory</h4>
                        <p class="body-text" style="opacity: 0.7;">Agents remember context across sessions.</p>
                    </div>
                </div>

                <div style="display: flex; gap: 20px; align-items: flex-start; padding: 24px 0; border-bottom: 1px solid var(--color-border, rgba(245,240,232,0.1));">
                    <div style="width: 40px; height: 40px; min-width: 40px; display: flex; align-items: center; justify-content: center; border: 1px solid var(--color-border-accent, rgba(193,127,89,0.3)); border-radius: 4px; color: var(--color-accent); font-size: 18px;">&#9670;</div>
                    <div>
                        <h4 class="sub-heading" style="font-size: 24px; margin-bottom: 6px;">Multi-Channel Access</h4>
                        <p class="body-text" style="opacity: 0.7;">Slack, Telegram, WhatsApp, or web chat.</p>
                    </div>
                </div>
            </div>

            <!-- Right column items -->
            <div style="display: flex; flex-direction: column; gap: 0;">
                <div style="display: flex; gap: 20px; align-items: flex-start; padding: 24px 0; border-bottom: 1px solid var(--color-border, rgba(245,240,232,0.1));">
                    <div style="width: 40px; height: 40px; min-width: 40px; display: flex; align-items: center; justify-content: center; border: 1px solid var(--color-border-accent, rgba(193,127,89,0.3)); border-radius: 4px; color: var(--color-accent); font-size: 18px;">&#9670;</div>
                    <div>
                        <h4 class="sub-heading" style="font-size: 24px; margin-bottom: 6px;">Tool Integration</h4>
                        <p class="body-text" style="opacity: 0.7;">Connect any API, CRM, or SaaS tool.</p>
                    </div>
                </div>

                <div style="display: flex; gap: 20px; align-items: flex-start; padding: 24px 0; border-bottom: 1px solid var(--color-border, rgba(245,240,232,0.1));">
                    <div style="width: 40px; height: 40px; min-width: 40px; display: flex; align-items: center; justify-content: center; border: 1px solid var(--color-border-accent, rgba(193,127,89,0.3)); border-radius: 4px; color: var(--color-accent); font-size: 18px;">&#9670;</div>
                    <div>
                        <h4 class="sub-heading" style="font-size: 24px; margin-bottom: 6px;">Autonomous Execution</h4>
                        <p class="body-text" style="opacity: 0.7;">Agents work independently on assigned tasks.</p>
                    </div>
                </div>
            </div>
        </div>

    </div>

    <div class="slide-number">07</div>
</body>
```

### Quote Block

```html
<body>
    <div class="slide-content" style="justify-content: center; align-items: center;">

        <div style="max-width: 1200px; padding: 60px 48px; border-left: 2px solid var(--color-accent, var(--color-copper, #c17f59)); background: var(--color-surface-inset, #141414);">
            <p style="font-family: var(--font-display); font-size: 40px; font-weight: 400; font-style: italic; line-height: 1.35; letter-spacing: -0.5px;">
                "It felt less like configuring software and more like onboarding a new team member."
            </p>
            <div style="display: flex; align-items: center; gap: 12px; margin-top: 32px;">
                <div style="width: 32px; height: 2px; background: var(--color-accent, var(--color-copper, #c17f59));"></div>
                <p class="label" style="color: var(--color-secondary-accent, var(--color-muted-gold, #a89067));">
                    SARAH CHEN, VP OPERATIONS
                </p>
            </div>
        </div>

    </div>

    <div class="slide-number">08</div>
</body>
```

### CTA / Closing Slide

```html
<body>
    <div class="slide-content" style="text-align: center; justify-content: center; align-items: center;">

        <!-- Accent rule -->
        <div style="width: 60px; height: 2px; background: var(--color-accent, var(--color-copper, #c17f59));"></div>

        <!-- Heading -->
        <h2 class="display-title" style="font-size: 64px; margin-top: 32px; max-width: 1000px;">
            Ready to meet your team?
        </h2>

        <!-- Body -->
        <p class="body-large" style="margin-top: 20px; opacity: 0.7; max-width: 600px;">
            Deploy your first AI coworker in under five minutes. No setup fees, no long-term commitments.
        </p>

        <!-- CTA button -->
        <div style="margin-top: 40px; display: inline-block; background: var(--color-accent, var(--color-copper, #c17f59)); color: var(--bg-primary, var(--color-midnight, #0d0d0d)); font-family: var(--font-body); font-size: 16px; font-weight: 600; letter-spacing: 0.8px; text-transform: uppercase; padding: 18px 48px; border-radius: 4px;">
            Get Started
        </div>

        <!-- Accent rule -->
        <div style="width: 60px; height: 2px; background: var(--color-accent, var(--color-copper, #c17f59)); margin-top: 48px;"></div>
    </div>
</body>
```

### Index Presenter File

Create an `index.html` with full keyboard navigation and scroll-snap for presenting directly in the browser:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Presentation Title</title>

    <!-- Google Fonts: same as individual slides -->
    <link href="https://fonts.googleapis.com/css2?family=PRESET_FONTS_HERE&display=swap" rel="stylesheet">

    <style>
        :root {
            /* -- Same preset CSS variables as individual slides -- */
        }

        * { margin: 0; padding: 0; box-sizing: border-box; }

        html {
            scroll-snap-type: y mandatory;
            scroll-behavior: smooth;
            height: 100%;
            overflow-x: hidden;
        }

        body {
            font-family: var(--font-body);
            background: var(--bg-primary, #0d0d0d);
            color: var(--text-primary, #f5f0e8);
            height: 100%;
            overflow-x: hidden;
        }

        .slide {
            width: 100vw;
            height: 100vh;
            height: 100dvh;
            overflow: hidden;
            scroll-snap-align: start;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: flex-start;
            position: relative;
            padding: clamp(2rem, 4vw, 80px);
        }

        /* Typography scales for browser viewing */
        .display-title { font-size: clamp(2rem, 5vw, 80px); }
        .section-heading { font-size: clamp(1.5rem, 3.5vw, 56px); }
        .sub-heading { font-size: clamp(1.1rem, 2.5vw, 36px); }
        .body-large { font-size: clamp(0.875rem, 1.5vw, 22px); }
        .body-text { font-size: clamp(0.75rem, 1.2vw, 18px); }

        /* Navigation dots */
        .nav-dots {
            position: fixed;
            right: 24px;
            top: 50%;
            transform: translateY(-50%);
            display: flex;
            flex-direction: column;
            gap: 8px;
            z-index: 100;
        }

        .nav-dots .dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: var(--text-primary, #f5f0e8);
            opacity: 0.2;
            cursor: pointer;
            transition: opacity 0.3s;
        }

        .nav-dots .dot.active {
            opacity: 0.8;
        }

        /* Progress bar */
        .progress-bar {
            position: fixed;
            top: 0;
            left: 0;
            height: 2px;
            background: var(--color-accent, #c17f59);
            z-index: 100;
            transition: width 0.3s;
        }

        /* Keyboard hint */
        .keyboard-hint {
            position: fixed;
            bottom: 24px;
            left: 50%;
            transform: translateX(-50%);
            font-size: 12px;
            opacity: 0.3;
            z-index: 100;
        }

        @media (max-height: 600px) {
            .nav-dots, .keyboard-hint { display: none; }
        }
    </style>
</head>
<body>
    <div class="progress-bar" id="progress" style="width: 0%;"></div>
    <nav class="nav-dots" id="nav-dots"></nav>

    <!-- Paste all slide content here as <section class="slide"> blocks -->
    <section class="slide" id="slide-1">
        <!-- ... slide 1 content ... -->
    </section>

    <section class="slide" id="slide-2">
        <!-- ... slide 2 content ... -->
    </section>

    <!-- ... more slides ... -->

    <p class="keyboard-hint">Arrow keys or scroll to navigate</p>

    <script>
        // Navigation controller
        const slides = document.querySelectorAll('.slide');
        const progress = document.getElementById('progress');
        const navDots = document.getElementById('nav-dots');
        let currentSlide = 0;

        // Create nav dots
        slides.forEach((_, i) => {
            const dot = document.createElement('div');
            dot.className = 'dot' + (i === 0 ? ' active' : '');
            dot.addEventListener('click', () => goToSlide(i));
            navDots.appendChild(dot);
        });

        function goToSlide(index) {
            if (index < 0 || index >= slides.length) return;
            currentSlide = index;
            slides[index].scrollIntoView({ behavior: 'smooth' });
            updateUI();
        }

        function updateUI() {
            const pct = ((currentSlide + 1) / slides.length) * 100;
            progress.style.width = pct + '%';

            navDots.querySelectorAll('.dot').forEach((dot, i) => {
                dot.classList.toggle('active', i === currentSlide);
            });
        }

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowDown' || e.key === 'ArrowRight' || e.key === ' ') {
                e.preventDefault();
                goToSlide(currentSlide + 1);
            } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
                e.preventDefault();
                goToSlide(currentSlide - 1);
            }
        });

        // Track scroll position
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const index = Array.from(slides).indexOf(entry.target);
                    if (index !== -1) {
                        currentSlide = index;
                        updateUI();
                    }
                }
            });
        }, { threshold: 0.5 });

        slides.forEach(slide => observer.observe(slide));
    </script>
</body>
</html>
```

---

## 7. Screenshot Phase

After generating all HTML files, run the screenshot tool:

```bash
node screenshot/screenshot.js \
  --format slides \
  --input ./EXPORT_DIR/slides \
  --output ./EXPORT_DIR/exports
```

Where `EXPORT_DIR` is the export directory (see Section 9).

This will:
1. Open each slide HTML in a headless Chromium browser
2. Set the viewport to 1920x1080px with 2x device scale factor
3. Wait for fonts to load (500ms default; use `--font-delay 1000` for custom fonts)
4. Capture a PNG screenshot of each slide
5. Save as `slide-01.png`, `slide-02.png`, etc. in the exports directory

---

## 8. Delivery Phase

After screenshots are generated, present results to the user:

```
Your presentation is ready!

Location: [EXPORT_DIR]/

Files:
  slides/        -- 12 HTML source files
  exports/       -- 12 PNG images (1920x1080px each)
  index.html     -- Browser-based presentation with keyboard navigation

Present directly:
  Open index.html in any browser and use arrow keys to navigate.
  Works in full-screen mode (F11) for actual presentations.

Export details:
  slide-01.png    412 KB
  slide-02.png    287 KB
  ...
  slide-12.png    198 KB
  Total:          3.8 MB

Navigation controls:
  Arrow keys (left/right or up/down) to move between slides
  Space bar to advance
  Click the dots on the right to jump to any slide
  Scroll also works (with snap)

Want to make any changes?
```

---

## 9. Export Directory Convention

Ask the user: **"Where should I save the exports? (default: ./goose-graphics-exports/)"**

### Directory naming
- Primary: `[YYYY-MM-DD]-[slugified-name]/` (e.g., `2026-04-04-future-of-autonomous-work/`)
- Fallback (no name given): `[YYYY-MM-DD]-slides-[HHMMSS]/`

### Directory structure (slides = multi-file)
```
goose-graphics-exports/
  2026-04-04-future-of-autonomous-work/
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
    index.html          # Browser-based presenter
```

---

## Design Reminders

- **Viewport fitting is non-negotiable.** Every slide must fit exactly in 1920x1080px. Content that overflows must be split across slides. `overflow: hidden` on every slide.
- **Left-heavy composition.** On widescreen slides, anchor the primary content (title, body text) to the left 60% of the frame. The right 40% is breathing room or for supporting visuals (stats, illustrations).
- **One idea per slide.** Presentations work best when each slide makes a single point clearly. Dense slides lose the audience.
- **Scaled-up typography.** Widescreen gives you room for large, confident type. Use 80px for display titles, 56px for section headings. These sizes feel right when projected.
- **Slide numbers.** Place small, low-opacity slide numbers in the bottom-right corner of every slide for reference during Q&A.
- **Consistent transitions.** The `index.html` presenter uses scroll-snap for smooth slide transitions. Individual PNG exports can be loaded into Google Slides, Keynote, or PowerPoint as image slides.
