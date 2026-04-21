# Format: Infographic

Create single-page vertical infographics at 1080px wide with variable height. The entire infographic is one HTML file with stacking sections, screenshotted as a single full-page PNG.

---

## 1. Format Specifications

| Property | Value |
|----------|-------|
| Dimensions | 1080px wide, variable height (typically 2000-6000px) |
| File structure | Single HTML file (`index.html`) |
| Aspect ratio | Portrait, typically 1:2 to 1:6 |
| Output format | Single PNG (full-page capture) |
| Target file size | Under 5MB for easy sharing |
| Sizing approach | Fixed pixel widths, natural vertical flow |

### Content Density Limits

Each section should be scannable in 3-5 seconds.

| Section Type | Max Content |
|--------------|-------------|
| Header | Title (1-2 lines) + subtitle (1 line) + optional decorative element |
| Stat block | 1 large number + label (5 words) + description (20 words max) |
| Comparison | 2-3 items side-by-side, 3-4 bullet points each (6 words per point) |
| Process step | Step number + title (5 words) + description (25 words max) |
| List item | Icon/number + heading (5 words) + description (20 words max) |
| Timeline entry | Year/date + title (5 words) + description (25 words max) |
| Quote | 1 quote (30 words max) + attribution |
| Footer | Brand name + tagline (10 words max) + optional CTA |

**If content exceeds limits:** Break into smaller subsections or simplify.

---

## 2. Workflow Overview

```
Content Discovery --> Style Selection --> HTML Generation --> Screenshot --> Delivery
```

1. Gather topic, infographic type, and content readiness from the user
2. Present style presets and let the user choose (or guide them)
3. Read the chosen style preset from `styles/[name].md`
4. Generate a single HTML file with all sections stacking vertically
5. Run the screenshot tool with `fullPage: true` to export the full-height PNG
6. Present the finished file to the user

---

## 3. Content Discovery Phase

Ask the user these questions before generating anything.

**Question 1: Topic**
- "What is the main topic of this infographic?"
- Free text input

**Question 2: Content Type**
- "What type of infographic do you want to create?"
- Options:
  - **Numbered list** -- "Top 10 ...", "5 things you need to know about ..."
  - **How-to / Process** -- Step-by-step guide, how something works, workflow
  - **Comparison** -- X vs Y, pros/cons, side-by-side analysis
  - **Statistics** -- Key metrics, data visualization, numbers that tell a story
  - **Timeline** -- Chronological events, history, growth journey
  - **Framework** -- Concept explanation, hierarchy, organizational structure

**Question 3: Section Count**
- "How many sections should this infographic have?"
- Options:
  - **Short (3-4 sections)** -- Quick overview, single concept
  - **Medium (5-6 sections)** -- Standard infographic depth
  - **Long (7-8 sections)** -- Comprehensive deep-dive

**Question 4: Content Readiness**
- "Do you have the content ready?"
- Options:
  - **Yes, I have all data/content** -- Paste it in
  - **I have rough notes** -- Need structuring
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

**After selection:** Read the chosen style preset file from `styles/[name].md` to load all colors, typography, and component patterns. For example, if the user picks "Warm Earth", read `styles/warm-earth.md`.

---

## 5. HTML Generation Phase

### Base CSS (Mandatory)

Infographics are fixed-width (1080px) but variable-height. The base CSS locks the width and lets content flow naturally downward.

```css
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

html {
    width: 1080px;
}

body {
    width: 1080px;
    margin: 0;
    padding: 0;
}
```

### Injecting the Style Preset

After reading the style preset file, find its **Section 9 (Agent Prompt Guide)** which contains the CSS `:root` variables. Paste those variables into the `<style>` block:

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

The preset's **Section 4 (Component Patterns)** contains ready-to-use HTML snippets. Adapt these for the infographic's 1080px-wide vertical layout.

The preset's **Section 8 (Format Adaptation Notes)** contains infographic-specific guidance on typography, section spacing, and vertical rhythm. Always apply these adaptations.

### Complete HTML Template

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=1080, initial-scale=1.0">
    <title>Infographic Title</title>

    <!-- Google Fonts: paste the link from your chosen preset's Section 9 -->
    <link href="https://fonts.googleapis.com/css2?family=PRESET_FONTS_HERE&display=swap" rel="stylesheet">

    <style>
        /* =============================================
           INFOGRAPHIC: 1080px WIDE, VARIABLE HEIGHT
           ============================================= */

        :root {
            /* -- Paste CSS variables from preset Section 9 -- */

            /* Infographic-specific layout */
            --infographic-width: 1080px;
            --section-padding-x: 60px;
            --section-padding-y: 80px;
            --content-max-width: 960px;
            --section-gap: 0px;
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        html {
            width: var(--infographic-width);
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
        }

        body {
            width: var(--infographic-width);
            margin: 0;
            padding: 0;
            font-family: var(--font-body);
            background-color: var(--bg-primary, var(--color-midnight, #0d0d0d));
            color: var(--text-primary, var(--color-cream, #f5f0e8));
        }

        /* =============================================
           INFOGRAPHIC CONTAINER
           ============================================= */

        .infographic {
            width: 100%;
            display: flex;
            flex-direction: column;
        }

        /* =============================================
           SECTION BASE
           Each section is a full-width block with padding
           ============================================= */

        .section {
            width: 100%;
            padding: var(--section-padding-y) var(--section-padding-x);
            display: flex;
            flex-direction: column;
            align-items: center;
        }

        .section-content {
            width: 100%;
            max-width: var(--content-max-width);
        }

        /* =============================================
           SECTION DIVIDER
           Copper/accent rule between sections
           ============================================= */

        .section-divider {
            width: 60px;
            height: 2px;
            background: var(--color-accent, var(--color-copper, #c17f59));
            margin: 0 auto;
        }

        /* =============================================
           ALTERNATING SECTION BACKGROUNDS
           Create visual distinction between sections
           ============================================= */

        .section-alt {
            background-color: var(--color-surface, var(--color-charcoal, #1a1a1a));
        }

        /* =============================================
           TYPOGRAPHY HIERARCHY
           Uses full-scale preset typography
           ============================================= */

        .display-title {
            font-family: var(--font-display);
            font-size: 72px;
            font-weight: 700;
            line-height: 1.05;
            letter-spacing: -1.5px;
        }

        .section-heading {
            font-family: var(--font-display);
            font-size: 48px;
            font-weight: 700;
            line-height: 1.10;
            letter-spacing: -1px;
            text-align: center;
            margin-bottom: 40px;
        }

        .sub-heading {
            font-family: var(--font-display);
            font-size: 32px;
            font-weight: 700;
            line-height: 1.15;
            letter-spacing: -0.5px;
        }

        .body-large {
            font-family: var(--font-body);
            font-size: 20px;
            font-weight: 300;
            line-height: 1.60;
        }

        .body-text {
            font-family: var(--font-body);
            font-size: 16px;
            font-weight: 400;
            line-height: 1.65;
        }

        .small-text {
            font-family: var(--font-body);
            font-size: 13px;
            font-weight: 400;
            line-height: 1.50;
            letter-spacing: 0.3px;
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
            font-size: 96px;
            font-weight: 900;
            line-height: 1.00;
            letter-spacing: -1px;
        }

        /* =============================================
           LAYOUT COMPONENTS
           ============================================= */

        .two-column {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
        }

        .three-column {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 24px;
        }

        .stack {
            display: flex;
            flex-direction: column;
            gap: 24px;
        }

        .card {
            background: var(--color-surface, var(--color-charcoal, #1a1a1a));
            border: 1px solid var(--color-border, rgba(245,240,232,0.1));
            border-radius: 4px;
            padding: 40px 32px;
        }
    </style>
</head>
<body>
    <div class="infographic">

        <!-- Header Section -->
        <section class="section" style="min-height: 600px; justify-content: center; text-align: center;">
            <div class="section-content">
                <div class="section-divider" style="margin-bottom: 32px;"></div>
                <h1 class="display-title">Infographic Title</h1>
                <p class="body-large" style="margin-top: 24px; max-width: 600px; margin-left: auto; margin-right: auto; opacity: 0.7;">
                    A visual guide to the topic at hand.
                </p>
                <div class="section-divider" style="margin-top: 40px;"></div>
            </div>
        </section>

        <!-- Content sections go here -->

        <!-- Footer Section -->
        <section class="section" style="min-height: 300px; justify-content: center; text-align: center;">
            <div class="section-content">
                <div class="section-divider" style="margin-bottom: 32px;"></div>
                <p class="label" style="opacity: 0.5;">@yourbrand</p>
            </div>
        </section>

    </div>
</body>
</html>
```

---

## 6. Content Templates

All templates use CSS custom properties so they work with any style preset. Each template is a `<section>` block that slots into the `.infographic` container.

### Header Section

```html
<section class="section" style="min-height: 600px; justify-content: center; text-align: center;">
    <div class="section-content">
        <!-- Accent rule -->
        <div class="section-divider" style="margin-bottom: 32px;"></div>

        <!-- Title -->
        <h1 class="display-title">
            The Complete Guide to<br>AI-Powered Workflows
        </h1>

        <!-- Subtitle -->
        <p class="body-large" style="margin-top: 24px; max-width: 640px; margin-left: auto; margin-right: auto; opacity: 0.7;">
            How modern teams are using AI coworkers to automate research, outreach, and operations.
        </p>

        <!-- Accent rule -->
        <div class="section-divider" style="margin-top: 40px;"></div>
    </div>
</section>
```

### Numbered Item Section

```html
<section class="section">
    <div class="section-content">
        <h2 class="section-heading">5 Core Workflows</h2>

        <div class="stack" style="gap: 0;">
            <!-- Item 1 -->
            <div style="display: flex; gap: 24px; align-items: flex-start; padding: 32px 0; border-bottom: 1px solid var(--color-border, rgba(245,240,232,0.1));">
                <span style="font-family: var(--font-display); font-size: 48px; font-weight: 700; line-height: 1.00; color: var(--color-accent, var(--color-copper, #c17f59)); min-width: 72px;">01</span>
                <div>
                    <p class="label" style="color: var(--color-secondary-accent, var(--color-muted-gold, #a89067)); margin-bottom: 8px;">SIGNAL-BASED OUTBOUND</p>
                    <h3 class="sub-heading" style="margin-bottom: 12px;">Find buyers before they find you</h3>
                    <p class="body-text" style="opacity: 0.7;">Monitor hiring signals, funding events, and tech stack changes to identify high-intent prospects the moment they enter the market.</p>
                </div>
            </div>

            <!-- Item 2 -->
            <div style="display: flex; gap: 24px; align-items: flex-start; padding: 32px 0; border-bottom: 1px solid var(--color-border, rgba(245,240,232,0.1));">
                <span style="font-family: var(--font-display); font-size: 48px; font-weight: 700; line-height: 1.00; color: var(--color-accent, var(--color-copper, #c17f59)); min-width: 72px;">02</span>
                <div>
                    <p class="label" style="color: var(--color-secondary-accent, var(--color-muted-gold, #a89067)); margin-bottom: 8px;">AUTOMATED RESEARCH</p>
                    <h3 class="sub-heading" style="margin-bottom: 12px;">Deep-dive every prospect automatically</h3>
                    <p class="body-text" style="opacity: 0.7;">AI agents compile company profiles, recent news, tech stack data, and competitive landscape in minutes instead of hours.</p>
                </div>
            </div>

            <!-- Repeat pattern for additional items -->
        </div>
    </div>
</section>
```

### Stat Display Section

```html
<section class="section section-alt">
    <div class="section-content">
        <h2 class="section-heading">Key Metrics</h2>

        <div class="three-column">
            <!-- Stat 1 -->
            <div class="card" style="text-align: center;">
                <p class="big-number" style="color: var(--color-accent, var(--color-copper, #c17f59));">47%</p>
                <p class="label" style="margin-top: 12px;">FASTER RESPONSE</p>
                <p class="body-text" style="margin-top: 12px; opacity: 0.7;">Teams respond to leads nearly twice as fast with AI assistance.</p>
            </div>

            <!-- Stat 2 -->
            <div class="card" style="text-align: center;">
                <p class="big-number" style="color: var(--color-accent, var(--color-copper, #c17f59));">3.2x</p>
                <p class="label" style="margin-top: 12px;">MORE PIPELINE</p>
                <p class="body-text" style="margin-top: 12px; opacity: 0.7;">Average pipeline increase within the first 90 days of deployment.</p>
            </div>

            <!-- Stat 3 -->
            <div class="card" style="text-align: center;">
                <p class="big-number" style="color: var(--color-accent, var(--color-copper, #c17f59));">12h</p>
                <p class="label" style="margin-top: 12px;">SAVED PER WEEK</p>
                <p class="body-text" style="margin-top: 12px; opacity: 0.7;">Hours reclaimed from manual research and data entry tasks.</p>
            </div>
        </div>
    </div>
</section>
```

### Comparison Grid Section

```html
<section class="section">
    <div class="section-content">
        <h2 class="section-heading">Manual vs AI-Powered</h2>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2px; background: var(--color-border, rgba(245,240,232,0.1)); border-radius: 4px; overflow: hidden;">
            <!-- Left column -->
            <div style="background: var(--color-surface, var(--color-charcoal, #1a1a1a)); padding: 40px 32px;">
                <p class="small-text" style="color: var(--color-secondary-accent, var(--color-muted-gold, #a89067)); margin-bottom: 16px;">Without AI</p>
                <h3 class="sub-heading" style="margin-bottom: 16px;">Manual & Fragmented</h3>
                <p class="body-text" style="opacity: 0.7;">Teams juggle Slack threads, spreadsheets, and context-switching between a dozen tabs to coordinate basic workflows.</p>
            </div>

            <!-- Right column (featured) -->
            <div style="background: var(--color-surface, var(--color-charcoal, #1a1a1a)); padding: 40px 32px; border-left: 2px solid var(--color-accent, var(--color-copper, #c17f59));">
                <p class="small-text" style="color: var(--color-accent, var(--color-copper, #c17f59)); margin-bottom: 16px;">With AI</p>
                <h3 class="sub-heading" style="margin-bottom: 16px;">Orchestrated & Autonomous</h3>
                <p class="body-text" style="opacity: 0.7;">AI coworkers handle research, drafting, and follow-up autonomously. Your team focuses on decisions, not busywork.</p>
            </div>
        </div>
    </div>
</section>
```

### List Items Section

```html
<section class="section section-alt">
    <div class="section-content">
        <h2 class="section-heading">Core Capabilities</h2>

        <div class="stack" style="gap: 0;">
            <div style="display: flex; gap: 20px; align-items: flex-start; padding: 24px 0; border-bottom: 1px solid var(--color-border, rgba(245,240,232,0.1));">
                <div style="width: 40px; height: 40px; min-width: 40px; display: flex; align-items: center; justify-content: center; border: 1px solid var(--color-border-accent, rgba(193,127,89,0.3)); border-radius: 4px; color: var(--color-accent); font-size: 18px;">&#9670;</div>
                <div>
                    <h4 class="sub-heading" style="font-size: 22px; margin-bottom: 8px;">Persistent Memory</h4>
                    <p class="body-text" style="opacity: 0.7;">Every agent maintains its own filesystem, notes, and learned preferences across sessions. Context is never lost.</p>
                </div>
            </div>

            <div style="display: flex; gap: 20px; align-items: flex-start; padding: 24px 0; border-bottom: 1px solid var(--color-border, rgba(245,240,232,0.1));">
                <div style="width: 40px; height: 40px; min-width: 40px; display: flex; align-items: center; justify-content: center; border: 1px solid var(--color-border-accent, rgba(193,127,89,0.3)); border-radius: 4px; color: var(--color-accent); font-size: 18px;">&#9670;</div>
                <div>
                    <h4 class="sub-heading" style="font-size: 22px; margin-bottom: 8px;">Multi-Channel Access</h4>
                    <p class="body-text" style="opacity: 0.7;">Reach your agents via Slack, Telegram, WhatsApp, or web chat. They meet you where you already work.</p>
                </div>
            </div>

            <div style="display: flex; gap: 20px; align-items: flex-start; padding: 24px 0;">
                <div style="width: 40px; height: 40px; min-width: 40px; display: flex; align-items: center; justify-content: center; border: 1px solid var(--color-border-accent, rgba(193,127,89,0.3)); border-radius: 4px; color: var(--color-accent); font-size: 18px;">&#9670;</div>
                <div>
                    <h4 class="sub-heading" style="font-size: 22px; margin-bottom: 8px;">Tool Integration</h4>
                    <p class="body-text" style="opacity: 0.7;">Connect to any API, database, or SaaS tool. Agents use real tools to get real work done.</p>
                </div>
            </div>
        </div>
    </div>
</section>
```

### Quote Block Section

```html
<section class="section">
    <div class="section-content">
        <div style="padding: 48px 40px; border-left: 2px solid var(--color-accent, var(--color-copper, #c17f59)); background: var(--color-surface-inset, #141414);">
            <p style="font-family: var(--font-display); font-size: 32px; font-weight: 400; font-style: italic; line-height: 1.35; letter-spacing: -0.5px;">
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
</section>
```

### CTA / Footer Section

```html
<section class="section section-alt" style="min-height: 400px; justify-content: center; text-align: center;">
    <div class="section-content" style="display: flex; flex-direction: column; align-items: center;">
        <!-- Accent rule -->
        <div class="section-divider" style="margin-bottom: 32px;"></div>

        <h2 class="section-heading" style="margin-bottom: 16px;">Ready to get started?</h2>

        <p class="body-large" style="max-width: 480px; opacity: 0.7; margin-bottom: 32px;">
            Deploy your first AI coworker in under five minutes.
        </p>

        <!-- CTA button -->
        <div style="display: inline-block; background: var(--color-accent, var(--color-copper, #c17f59)); color: var(--bg-primary, var(--color-midnight, #0d0d0d)); font-family: var(--font-body); font-size: 15px; font-weight: 600; letter-spacing: 0.8px; text-transform: uppercase; padding: 16px 40px; border-radius: 4px;">
            Get Started
        </div>

        <!-- Accent rule -->
        <div class="section-divider" style="margin-top: 48px;"></div>

        <!-- Brand -->
        <p class="small-text" style="margin-top: 24px; opacity: 0.4;">@yourbrand</p>
    </div>
</section>
```

### Process / Timeline Section

```html
<section class="section">
    <div class="section-content">
        <h2 class="section-heading">How It Works</h2>

        <div class="stack" style="gap: 30px;">
            <!-- Step 1 -->
            <div style="display: flex; align-items: flex-start; gap: 30px; padding: 40px; background: var(--color-surface, var(--color-charcoal, #1a1a1a)); border-radius: 4px; border: 1px solid var(--color-border, rgba(245,240,232,0.1));">
                <span style="font-family: var(--font-display); font-size: 64px; font-weight: 900; color: var(--color-accent, var(--color-copper, #c17f59)); opacity: 0.3; line-height: 1; flex-shrink: 0; min-width: 80px;">01</span>
                <div>
                    <h3 class="sub-heading" style="margin-bottom: 10px;">Define Your Agent</h3>
                    <p class="body-text" style="opacity: 0.7;">Describe the role, tools, and objectives. Your agent gets its own workspace, memory, and communication channels.</p>
                </div>
            </div>

            <!-- Step 2 -->
            <div style="display: flex; align-items: flex-start; gap: 30px; padding: 40px; background: var(--color-surface, var(--color-charcoal, #1a1a1a)); border-radius: 4px; border: 1px solid var(--color-border, rgba(245,240,232,0.1));">
                <span style="font-family: var(--font-display); font-size: 64px; font-weight: 900; color: var(--color-accent, var(--color-copper, #c17f59)); opacity: 0.3; line-height: 1; flex-shrink: 0; min-width: 80px;">02</span>
                <div>
                    <h3 class="sub-heading" style="margin-bottom: 10px;">Connect Your Tools</h3>
                    <p class="body-text" style="opacity: 0.7;">Link your CRM, email, Slack, and any APIs your agent needs. Everything stays within your security boundary.</p>
                </div>
            </div>

            <!-- Step 3 -->
            <div style="display: flex; align-items: flex-start; gap: 30px; padding: 40px; background: var(--color-surface, var(--color-charcoal, #1a1a1a)); border-radius: 4px; border: 1px solid var(--color-border, rgba(245,240,232,0.1));">
                <span style="font-family: var(--font-display); font-size: 64px; font-weight: 900; color: var(--color-accent, var(--color-copper, #c17f59)); opacity: 0.3; line-height: 1; flex-shrink: 0; min-width: 80px;">03</span>
                <div>
                    <h3 class="sub-heading" style="margin-bottom: 10px;">Deploy & Collaborate</h3>
                    <p class="body-text" style="opacity: 0.7;">Your agent starts working immediately. Message it in Slack, assign tasks in chat, and review outputs as they come in.</p>
                </div>
            </div>
        </div>
    </div>
</section>
```

---

## 7. Screenshot Phase

After generating the HTML file, run the screenshot tool:

```bash
node screenshot/screenshot.js \
  --format infographic \
  --input ./EXPORT_DIR/index.html \
  --output ./EXPORT_DIR/export.png
```

Where `EXPORT_DIR` is the export directory (see Section 9).

This will:
1. Open the HTML file in a headless Chromium browser
2. Set the viewport to 1080px wide with 2x device scale factor
3. Wait for fonts to load (500ms default; use `--font-delay 1000` for custom fonts)
4. Capture a **full-page** PNG screenshot (variable height)
5. Save to the specified output path

---

## 8. Delivery Phase

After the screenshot is generated, present results to the user:

```
Your infographic is ready!

Location: [EXPORT_DIR]/

Files:
  index.html     -- Full infographic source (editable)
  export.png     -- Full-page screenshot

Export details:
  Dimensions: 1080 x 4200px
  File size:  1.8 MB

Share on:
  LinkedIn, Twitter/X, Instagram, blog posts, presentations

Want to make any changes?
```

---

## 9. Export Directory Convention

Ask the user: **"Where should I save the exports? (default: ./goose-graphics-exports/)"**

### Directory naming
- Primary: `[YYYY-MM-DD]-[slugified-name]/` (e.g., `2026-04-04-ai-workflow-guide/`)
- Fallback (no name given): `[YYYY-MM-DD]-infographic-[HHMMSS]/`

### Directory structure (infographic = single-file)
```
goose-graphics-exports/
  2026-04-04-ai-workflow-guide/
    index.html          # Full infographic source
    export.png          # Full-page PNG screenshot
```

---

## Design Reminders

- **Fixed width, flowing height.** The infographic is always 1080px wide. Height is determined by content. Do not constrain height.
- **Section independence.** Each section should be visually distinct and self-contained. Use alternating backgrounds (`section-alt` class) or accent rules between sections to create clear boundaries.
- **Vertical rhythm.** Maintain consistent spacing: 80px top/bottom padding per section, 64px between major content blocks within a section, 24px between items.
- **Accent rules as punctuation.** Use 60px-wide centered copper/accent rules as visual dividers between major sections. They serve the same role as em dashes in prose.
- **Progressive depth.** Alternate between full-width content sections and card-based layouts (stats, comparisons) to keep the scroll interesting.
- **Scannable structure.** A viewer should be able to scroll the entire infographic in 30-60 seconds and grasp every main point. Use large headings, bold numbers, and short body text.
- **Footer matters.** Always end with a clean footer section that includes branding and optional CTA. The footer is the last impression.
