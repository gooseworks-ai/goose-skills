# Format: Poster

Create single-page portrait posters at 1080x1350px (4:5 ratio, optimized for Instagram). The entire composition is one HTML file with a dense, structured layout -- everything on one page. Think event posters, product announcements, promotional graphics, and visual summaries.

---

## 1. Format Specifications

| Property | Value |
|----------|-------|
| Dimensions | 1080 x 1350px (4:5 portrait) |
| File structure | Single HTML file (`index.html`) |
| Aspect ratio | 4:5 (Instagram recommended portrait) |
| Output format | Single PNG |
| Sizing approach | Fixed pixel sizes (NOT responsive) |
| Design approach | Dense, single-composition layout -- everything on one page |

### Content Density Limits

A poster is dense but must remain readable and visually ordered. Think of it as a single, well-composed page with clear zones.

| Element | Max Content |
|---------|-------------|
| Headline | 1-2 lines, 8 words max |
| Subheadline | 1 line, 15 words max |
| Body text | 2-3 short paragraphs or 4-6 bullet points (8 words each) |
| Stats | 1-3 key numbers with labels |
| CTA | 1 action line + optional URL or handle |
| Metadata | Date, location, or attribution (1 line) |
| Branding | Logo mark or handle, positioned consistently |

**If content exceeds limits:** Simplify ruthlessly. A poster is a single glance, not a document.

---

## 2. Workflow Overview

```
Content Discovery --> Style Selection --> HTML Generation --> Screenshot --> Delivery
```

1. Gather topic, poster type, and content from the user
2. Present style presets and let the user choose (or guide them)
3. Read the chosen style preset from `styles/[name].md`
4. Generate a single HTML file with the full poster composition
5. Run the screenshot tool to export the PNG
6. Present the finished file to the user

---

## 3. Content Discovery Phase

Ask the user these questions before generating anything.

**Question 1: Topic**
- "What is this poster about?"
- Free text input

**Question 2: Content Type**
- "What kind of poster is this?"
- Options:
  - **Event / Webinar** -- Date, time, speakers, registration CTA
  - **Product announcement** -- Feature launch, new release, what's new
  - **Promotional** -- Sale, offer, limited-time deal
  - **Summary / Recap** -- Key takeaways, results, highlights
  - **Quote / Statement** -- Bold message, manifesto, brand statement
  - **How-to / Tips** -- Quick guide, top 3 tips, checklist

**Question 3: Content Readiness**
- "Do you have the content ready?"
- Options:
  - **Yes, I have all content** -- Paste it in
  - **I have bullet points** -- Need formatting
  - **Just the topic** -- Need help writing

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

**After selection:** Read the chosen style preset file from `styles/[name].md` to load all colors, typography, and component patterns. For example, if the user picks "Electric Burst", read `styles/electric-burst.md`.

---

## 5. HTML Generation Phase

### Base CSS (Mandatory)

Posters are fixed-size single compositions. No scrolling, no overflow. Everything fits within 1080x1350px.

```css
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

html, body {
    width: 1080px;
    height: 1350px;
    overflow: hidden;
}

body {
    display: flex;
    flex-direction: column;
    padding: 60px 60px 80px 60px;
}
```

### Injecting the Style Preset

After reading the style preset file, find its **Section 9 (Agent Prompt Guide)** which contains the CSS `:root` variables. Paste those variables into the `<style>` block:

```css
:root {
    /* -- Paste all CSS variables from the preset's Section 9 here -- */

    /* Poster-specific overrides */
    --poster-width: 1080px;
    --poster-height: 1350px;
    --poster-padding-x: 60px;
    --poster-padding-top: 80px;
    --poster-padding-bottom: 80px;
    --content-max-width: 960px;
}
```

Also add the Google Fonts `<link>` from the preset's Section 9 into the `<head>`.

### Using Component Patterns

The preset's **Section 4 (Component Patterns)** contains ready-to-use HTML snippets. Adapt these for the poster's 1080x1350 portrait format.

The preset's **Section 8 (Format Adaptation Notes)** contains poster-specific guidance. Key rules:
- Display Hero at 64px
- Section Heading at 40px
- Body at 16px
- Composition: top third for headline, middle third for content, bottom third for CTA
- Copper/accent rules separate the three zones

### Poster Composition Zones

A poster is divided into three vertical zones:

```
+---------------------------+
|       TOP ZONE            |  ~400px
|  Headline + Subtitle      |
|  Accent rule below        |
+---------------------------+
|       MIDDLE ZONE         |  ~550px
|  Key content: stats,      |
|  list, comparison, or     |
|  body text                |
|  Accent rule below        |
+---------------------------+
|       BOTTOM ZONE         |  ~400px
|  CTA, contact info,       |
|  or closing statement     |
|  Branding                 |
+---------------------------+
```

### Complete HTML Template

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=1080, initial-scale=1.0">
    <title>Poster Title</title>

    <!-- Google Fonts: paste the link from your chosen preset's Section 9 -->
    <link href="https://fonts.googleapis.com/css2?family=PRESET_FONTS_HERE&display=swap" rel="stylesheet">

    <style>
        /* =============================================
           POSTER: 1080x1350px FIXED (4:5 Portrait)
           ============================================= */

        :root {
            /* -- Paste CSS variables from preset Section 9 -- */

            /* Poster-specific layout */
            --poster-width: 1080px;
            --poster-height: 1350px;
            --poster-padding-x: 60px;
            --poster-padding-top: 80px;
            --poster-padding-bottom: 80px;
            --content-max-width: 960px;
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        html, body {
            width: var(--poster-width);
            height: var(--poster-height);
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
            padding: var(--poster-padding-top) var(--poster-padding-x) var(--poster-padding-bottom);
        }

        /* =============================================
           POSTER ZONES
           ============================================= */

        .poster-top {
            flex: 0 0 auto;
            display: flex;
            flex-direction: column;
            justify-content: center;
            padding-bottom: 32px;
        }

        .poster-middle {
            flex: 1 1 auto;
            display: flex;
            flex-direction: column;
            justify-content: center;
            padding: 32px 0;
        }

        .poster-bottom {
            flex: 0 0 auto;
            display: flex;
            flex-direction: column;
            justify-content: flex-end;
            padding-top: 32px;
        }

        /* =============================================
           ZONE DIVIDER
           ============================================= */

        .zone-divider {
            width: 60px;
            height: 2px;
            background: var(--color-accent, var(--color-copper, #c17f59));
        }

        .zone-divider-centered {
            width: 60px;
            height: 2px;
            background: var(--color-accent, var(--color-copper, #c17f59));
            margin-left: auto;
            margin-right: auto;
        }

        /* =============================================
           TYPOGRAPHY HIERARCHY
           ============================================= */

        .display-title {
            font-family: var(--font-display);
            font-size: 64px;
            font-weight: 700;
            line-height: 1.05;
            letter-spacing: -1.5px;
        }

        .section-heading {
            font-family: var(--font-display);
            font-size: 40px;
            font-weight: 700;
            line-height: 1.10;
            letter-spacing: -0.75px;
        }

        .sub-heading {
            font-family: var(--font-display);
            font-size: 28px;
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
            font-size: 72px;
            font-weight: 900;
            line-height: 1.00;
            letter-spacing: -1px;
        }

        /* =============================================
           LAYOUT HELPERS
           ============================================= */

        .two-column {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 24px;
        }

        .three-column {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 20px;
        }

        .card {
            background: var(--color-surface, var(--color-charcoal, #1a1a1a));
            border: 1px solid var(--color-border, rgba(245,240,232,0.1));
            border-radius: 4px;
            padding: 32px 24px;
        }

        .brand {
            font-family: var(--font-body);
            font-size: 14px;
            font-weight: 400;
            opacity: 0.5;
        }
    </style>
</head>
<body>

    <!-- TOP ZONE: Headline -->
    <div class="poster-top">
        <!-- Content here -->
    </div>

    <!-- MIDDLE ZONE: Key content -->
    <div class="poster-middle">
        <!-- Content here -->
    </div>

    <!-- BOTTOM ZONE: CTA / Branding -->
    <div class="poster-bottom">
        <!-- Content here -->
    </div>

</body>
</html>
```

---

## 6. Content Templates

All templates use CSS custom properties so they work with any style preset. Each template shows a complete poster with all three zones filled.

### Event / Webinar Poster

```html
<body>

    <!-- TOP ZONE -->
    <div class="poster-top">
        <p class="label" style="color: var(--color-secondary-accent, var(--color-muted-gold, #a89067)); margin-bottom: 16px;">
            LIVE WEBINAR &middot; APRIL 15, 2026
        </p>
        <h1 class="display-title">
            Building AI<br>Coworker Teams
        </h1>
        <p class="body-large" style="margin-top: 16px; opacity: 0.7; max-width: 700px;">
            A practical workshop on deploying autonomous agents that collaborate with your existing team.
        </p>
        <div class="zone-divider" style="margin-top: 32px;"></div>
    </div>

    <!-- MIDDLE ZONE -->
    <div class="poster-middle">
        <h2 class="section-heading" style="margin-bottom: 24px;">What You'll Learn</h2>

        <div style="display: flex; flex-direction: column; gap: 0;">
            <div style="display: flex; gap: 20px; align-items: flex-start; padding: 20px 0; border-bottom: 1px solid var(--color-border, rgba(245,240,232,0.1));">
                <span style="font-family: var(--font-display); font-size: 36px; font-weight: 700; color: var(--color-accent, var(--color-copper, #c17f59)); min-width: 48px; line-height: 1;">01</span>
                <div>
                    <h3 class="sub-heading" style="font-size: 22px; margin-bottom: 4px;">Agent Architecture</h3>
                    <p class="body-text" style="opacity: 0.7;">How to design agents with persistent memory and tool access.</p>
                </div>
            </div>

            <div style="display: flex; gap: 20px; align-items: flex-start; padding: 20px 0; border-bottom: 1px solid var(--color-border, rgba(245,240,232,0.1));">
                <span style="font-family: var(--font-display); font-size: 36px; font-weight: 700; color: var(--color-accent, var(--color-copper, #c17f59)); min-width: 48px; line-height: 1;">02</span>
                <div>
                    <h3 class="sub-heading" style="font-size: 22px; margin-bottom: 4px;">Multi-Channel Deployment</h3>
                    <p class="body-text" style="opacity: 0.7;">Connect agents to Slack, Telegram, and web in minutes.</p>
                </div>
            </div>

            <div style="display: flex; gap: 20px; align-items: flex-start; padding: 20px 0;">
                <span style="font-family: var(--font-display); font-size: 36px; font-weight: 700; color: var(--color-accent, var(--color-copper, #c17f59)); min-width: 48px; line-height: 1;">03</span>
                <div>
                    <h3 class="sub-heading" style="font-size: 22px; margin-bottom: 4px;">Team Orchestration</h3>
                    <p class="body-text" style="opacity: 0.7;">Coordinate multiple agents working together on complex tasks.</p>
                </div>
            </div>
        </div>

        <div class="zone-divider" style="margin-top: 32px;"></div>
    </div>

    <!-- BOTTOM ZONE -->
    <div class="poster-bottom" style="text-align: center; align-items: center;">
        <div style="display: inline-block; background: var(--color-accent, var(--color-copper, #c17f59)); color: var(--bg-primary, var(--color-midnight, #0d0d0d)); font-family: var(--font-body); font-size: 15px; font-weight: 600; letter-spacing: 0.8px; text-transform: uppercase; padding: 16px 40px; border-radius: 4px;">
            Register Free
        </div>
        <p class="small-text" style="margin-top: 16px; opacity: 0.5;">2:00 PM EST &middot; 45 minutes &middot; Free</p>
        <p class="brand" style="margin-top: 12px;">@yourbrand</p>
    </div>

</body>
```

### Product Announcement Poster

```html
<body>

    <!-- TOP ZONE -->
    <div class="poster-top" style="text-align: center; align-items: center;">
        <p class="label" style="color: var(--color-accent, var(--color-copper, #c17f59)); margin-bottom: 16px;">
            NOW AVAILABLE
        </p>
        <h1 class="display-title" style="max-width: 800px; margin: 0 auto;">
            Multi-Agent<br>Workspaces
        </h1>
        <p class="body-large" style="margin-top: 16px; opacity: 0.7; max-width: 640px; margin-left: auto; margin-right: auto;">
            Deploy teams of AI agents that share context, divide work, and collaborate in real time.
        </p>
        <div class="zone-divider-centered" style="margin-top: 32px;"></div>
    </div>

    <!-- MIDDLE ZONE -->
    <div class="poster-middle">
        <div class="three-column">
            <div class="card" style="text-align: center;">
                <p class="big-number" style="font-size: 56px; color: var(--color-accent, var(--color-copper, #c17f59));">5x</p>
                <p class="label" style="margin-top: 12px; font-size: 12px;">FASTER OUTPUT</p>
                <p class="body-text" style="margin-top: 8px; opacity: 0.7; font-size: 14px;">Multiple agents working in parallel on complex tasks.</p>
            </div>

            <div class="card" style="text-align: center;">
                <p class="big-number" style="font-size: 56px; color: var(--color-accent, var(--color-copper, #c17f59));">24/7</p>
                <p class="label" style="margin-top: 12px; font-size: 12px;">ALWAYS ON</p>
                <p class="body-text" style="margin-top: 8px; opacity: 0.7; font-size: 14px;">Agents work autonomously across time zones and schedules.</p>
            </div>

            <div class="card" style="text-align: center;">
                <p class="big-number" style="font-size: 56px; color: var(--color-accent, var(--color-copper, #c17f59));">0</p>
                <p class="label" style="margin-top: 12px; font-size: 12px;">CONTEXT LOST</p>
                <p class="body-text" style="margin-top: 8px; opacity: 0.7; font-size: 14px;">Persistent memory means nothing falls through the cracks.</p>
            </div>
        </div>

        <div class="zone-divider-centered" style="margin-top: 40px;"></div>
    </div>

    <!-- BOTTOM ZONE -->
    <div class="poster-bottom" style="text-align: center; align-items: center;">
        <h2 class="section-heading" style="font-size: 32px;">Try it today</h2>
        <p class="body-text" style="margin-top: 12px; opacity: 0.7;">No setup fees. Deploy your first workspace in under 5 minutes.</p>
        <div style="margin-top: 24px; display: inline-block; background: var(--color-accent, var(--color-copper, #c17f59)); color: var(--bg-primary, var(--color-midnight, #0d0d0d)); font-family: var(--font-body); font-size: 15px; font-weight: 600; letter-spacing: 0.8px; text-transform: uppercase; padding: 16px 40px; border-radius: 4px;">
            Get Started
        </div>
        <p class="brand" style="margin-top: 20px;">@yourbrand</p>
    </div>

</body>
```

### Stat Display Poster

```html
<body>

    <!-- TOP ZONE -->
    <div class="poster-top">
        <div class="zone-divider" style="margin-bottom: 24px;"></div>
        <p class="label" style="color: var(--color-secondary-accent, var(--color-muted-gold, #a89067)); margin-bottom: 12px;">
            Q1 2026 RESULTS
        </p>
        <h1 class="display-title">
            The Numbers<br>Speak for Themselves
        </h1>
        <div class="zone-divider" style="margin-top: 32px;"></div>
    </div>

    <!-- MIDDLE ZONE -->
    <div class="poster-middle" style="gap: 24px;">
        <!-- Large featured stat -->
        <div class="card" style="text-align: center; padding: 40px;">
            <p class="big-number" style="font-size: 96px; color: var(--color-accent, var(--color-copper, #c17f59));">47%</p>
            <p class="label" style="margin-top: 12px;">FASTER RESPONSE TIME</p>
            <p class="body-text" style="margin-top: 12px; opacity: 0.7; max-width: 500px; margin-left: auto; margin-right: auto;">
                Teams respond to inbound leads nearly twice as fast with AI-powered workflows.
            </p>
        </div>

        <!-- Two smaller stats side by side -->
        <div class="two-column">
            <div class="card" style="text-align: center;">
                <p class="big-number" style="font-size: 56px; color: var(--color-accent, var(--color-copper, #c17f59));">3.2x</p>
                <p class="label" style="margin-top: 8px; font-size: 12px;">PIPELINE GROWTH</p>
            </div>
            <div class="card" style="text-align: center;">
                <p class="big-number" style="font-size: 56px; color: var(--color-accent, var(--color-copper, #c17f59));">12h</p>
                <p class="label" style="margin-top: 8px; font-size: 12px;">SAVED PER WEEK</p>
            </div>
        </div>

        <div class="zone-divider-centered" style="margin-top: 16px;"></div>
    </div>

    <!-- BOTTOM ZONE -->
    <div class="poster-bottom" style="text-align: center; align-items: center;">
        <p class="body-text" style="opacity: 0.7;">See the full report at yourbrand.com/results</p>
        <p class="brand" style="margin-top: 12px;">@yourbrand</p>
    </div>

</body>
```

### Quote / Statement Poster

```html
<body>

    <!-- TOP ZONE -->
    <div class="poster-top" style="flex: 0 0 auto;">
        <div class="zone-divider" style="margin-bottom: 24px;"></div>
        <p class="label" style="color: var(--color-secondary-accent, var(--color-muted-gold, #a89067));">
            ON THE FUTURE OF WORK
        </p>
    </div>

    <!-- MIDDLE ZONE (expanded for the quote) -->
    <div class="poster-middle" style="justify-content: center;">
        <div style="padding: 0 0 0 32px; border-left: 2px solid var(--color-accent, var(--color-copper, #c17f59));">
            <p style="font-family: var(--font-display); font-size: 48px; font-weight: 400; font-style: italic; line-height: 1.30; letter-spacing: -0.5px;">
                "The best teams of the future won't just have the best people. They'll have the best agents working alongside them."
            </p>
            <div style="display: flex; align-items: center; gap: 12px; margin-top: 32px;">
                <div style="width: 32px; height: 2px; background: var(--color-accent, var(--color-copper, #c17f59));"></div>
                <p class="label" style="color: var(--color-secondary-accent, var(--color-muted-gold, #a89067));">
                    SARAH CHEN, VP OPERATIONS
                </p>
            </div>
        </div>
    </div>

    <!-- BOTTOM ZONE -->
    <div class="poster-bottom" style="align-items: flex-start;">
        <div class="zone-divider" style="margin-bottom: 16px;"></div>
        <p class="brand">@yourbrand</p>
    </div>

</body>
```

### List / Tips Poster

```html
<body>

    <!-- TOP ZONE -->
    <div class="poster-top" style="text-align: center; align-items: center;">
        <div class="zone-divider-centered" style="margin-bottom: 24px;"></div>
        <h1 class="display-title" style="font-size: 56px;">
            5 Rules for Building<br>AI Agent Teams
        </h1>
        <div class="zone-divider-centered" style="margin-top: 24px;"></div>
    </div>

    <!-- MIDDLE ZONE -->
    <div class="poster-middle">
        <div style="display: flex; flex-direction: column; gap: 0;">
            <div style="display: flex; gap: 20px; align-items: baseline; padding: 18px 0; border-bottom: 1px solid var(--color-border, rgba(245,240,232,0.1));">
                <span style="font-family: var(--font-display); font-size: 32px; font-weight: 700; color: var(--color-accent, var(--color-copper, #c17f59)); min-width: 40px;">01</span>
                <div>
                    <h3 class="sub-heading" style="font-size: 22px;">Give each agent a clear role</h3>
                    <p class="body-text" style="opacity: 0.7; margin-top: 4px;">Specialist agents outperform generalists every time.</p>
                </div>
            </div>

            <div style="display: flex; gap: 20px; align-items: baseline; padding: 18px 0; border-bottom: 1px solid var(--color-border, rgba(245,240,232,0.1));">
                <span style="font-family: var(--font-display); font-size: 32px; font-weight: 700; color: var(--color-accent, var(--color-copper, #c17f59)); min-width: 40px;">02</span>
                <div>
                    <h3 class="sub-heading" style="font-size: 22px;">Persistent memory is non-negotiable</h3>
                    <p class="body-text" style="opacity: 0.7; margin-top: 4px;">Agents that forget between sessions waste everyone's time.</p>
                </div>
            </div>

            <div style="display: flex; gap: 20px; align-items: baseline; padding: 18px 0; border-bottom: 1px solid var(--color-border, rgba(245,240,232,0.1));">
                <span style="font-family: var(--font-display); font-size: 32px; font-weight: 700; color: var(--color-accent, var(--color-copper, #c17f59)); min-width: 40px;">03</span>
                <div>
                    <h3 class="sub-heading" style="font-size: 22px;">Connect real tools, not toy APIs</h3>
                    <p class="body-text" style="opacity: 0.7; margin-top: 4px;">Production value comes from production integrations.</p>
                </div>
            </div>

            <div style="display: flex; gap: 20px; align-items: baseline; padding: 18px 0; border-bottom: 1px solid var(--color-border, rgba(245,240,232,0.1));">
                <span style="font-family: var(--font-display); font-size: 32px; font-weight: 700; color: var(--color-accent, var(--color-copper, #c17f59)); min-width: 40px;">04</span>
                <div>
                    <h3 class="sub-heading" style="font-size: 22px;">Let agents talk to each other</h3>
                    <p class="body-text" style="opacity: 0.7; margin-top: 4px;">The best outcomes come from agent-to-agent collaboration.</p>
                </div>
            </div>

            <div style="display: flex; gap: 20px; align-items: baseline; padding: 18px 0;">
                <span style="font-family: var(--font-display); font-size: 32px; font-weight: 700; color: var(--color-accent, var(--color-copper, #c17f59)); min-width: 40px;">05</span>
                <div>
                    <h3 class="sub-heading" style="font-size: 22px;">Human-in-the-loop for decisions</h3>
                    <p class="body-text" style="opacity: 0.7; margin-top: 4px;">Automate execution. Keep humans on strategy and judgment.</p>
                </div>
            </div>
        </div>
    </div>

    <!-- BOTTOM ZONE -->
    <div class="poster-bottom" style="text-align: center; align-items: center;">
        <div class="zone-divider-centered" style="margin-bottom: 16px;"></div>
        <p class="body-text" style="opacity: 0.6;">Save this for later. Follow for more.</p>
        <p class="brand" style="margin-top: 12px;">@yourbrand</p>
    </div>

</body>
```

### Comparison Poster

```html
<body>

    <!-- TOP ZONE -->
    <div class="poster-top" style="text-align: center; align-items: center;">
        <div class="zone-divider-centered" style="margin-bottom: 24px;"></div>
        <h1 class="display-title" style="font-size: 56px;">
            Manual Teams vs<br>AI-Augmented Teams
        </h1>
        <div class="zone-divider-centered" style="margin-top: 24px;"></div>
    </div>

    <!-- MIDDLE ZONE -->
    <div class="poster-middle">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2px; background: var(--color-border, rgba(245,240,232,0.1)); border-radius: 4px; overflow: hidden;">
            <!-- Left -->
            <div style="background: var(--color-surface, var(--color-charcoal, #1a1a1a)); padding: 36px 28px;">
                <p class="label" style="opacity: 0.5; margin-bottom: 16px; font-size: 12px;">MANUAL</p>
                <ul style="list-style: none; display: flex; flex-direction: column; gap: 16px;">
                    <li class="body-text" style="opacity: 0.7; padding-left: 24px; position: relative;">
                        <span style="position: absolute; left: 0; color: var(--color-accent);">&times;</span>
                        Hours of manual research
                    </li>
                    <li class="body-text" style="opacity: 0.7; padding-left: 24px; position: relative;">
                        <span style="position: absolute; left: 0; color: var(--color-accent);">&times;</span>
                        Inconsistent output quality
                    </li>
                    <li class="body-text" style="opacity: 0.7; padding-left: 24px; position: relative;">
                        <span style="position: absolute; left: 0; color: var(--color-accent);">&times;</span>
                        Limited by headcount
                    </li>
                    <li class="body-text" style="opacity: 0.7; padding-left: 24px; position: relative;">
                        <span style="position: absolute; left: 0; color: var(--color-accent);">&times;</span>
                        Context lost between tools
                    </li>
                </ul>
            </div>

            <!-- Right (featured) -->
            <div style="background: var(--color-surface, var(--color-charcoal, #1a1a1a)); padding: 36px 28px; border-left: 2px solid var(--color-accent, var(--color-copper, #c17f59));">
                <p class="label" style="color: var(--color-accent, var(--color-copper, #c17f59)); margin-bottom: 16px; font-size: 12px;">AI-AUGMENTED</p>
                <ul style="list-style: none; display: flex; flex-direction: column; gap: 16px;">
                    <li class="body-text" style="opacity: 0.7; padding-left: 24px; position: relative;">
                        <span style="position: absolute; left: 0; color: var(--color-accent);">&#10003;</span>
                        Research done in minutes
                    </li>
                    <li class="body-text" style="opacity: 0.7; padding-left: 24px; position: relative;">
                        <span style="position: absolute; left: 0; color: var(--color-accent);">&#10003;</span>
                        Consistently high quality
                    </li>
                    <li class="body-text" style="opacity: 0.7; padding-left: 24px; position: relative;">
                        <span style="position: absolute; left: 0; color: var(--color-accent);">&#10003;</span>
                        Scales without hiring
                    </li>
                    <li class="body-text" style="opacity: 0.7; padding-left: 24px; position: relative;">
                        <span style="position: absolute; left: 0; color: var(--color-accent);">&#10003;</span>
                        Persistent shared memory
                    </li>
                </ul>
            </div>
        </div>
    </div>

    <!-- BOTTOM ZONE -->
    <div class="poster-bottom" style="text-align: center; align-items: center;">
        <div class="zone-divider-centered" style="margin-bottom: 16px;"></div>
        <p class="body-text" style="opacity: 0.6;">Make the switch. It takes 5 minutes.</p>
        <p class="brand" style="margin-top: 12px;">@yourbrand</p>
    </div>

</body>
```

---

## 7. Screenshot Phase

After generating the HTML file, run the screenshot tool:

```bash
node screenshot/screenshot.js \
  --format poster \
  --input ./EXPORT_DIR/index.html \
  --output ./EXPORT_DIR/export.png
```

Where `EXPORT_DIR` is the export directory (see Section 9).

This will:
1. Open the HTML file in a headless Chromium browser
2. Set the viewport to 1080x1350px with 2x device scale factor
3. Wait for fonts to load (500ms default; use `--font-delay 1000` for custom fonts)
4. Capture a PNG screenshot (fixed size, no full-page needed)
5. Save to the specified output path

---

## 8. Delivery Phase

After the screenshot is generated, present results to the user:

```
Your poster is ready!

Location: [EXPORT_DIR]/

Files:
  index.html     -- Poster source (editable)
  export.png     -- Final poster image

Export details:
  Dimensions: 1080 x 1350px (4:5 portrait)
  File size:  487 KB

Share on:
  Instagram (recommended -- 4:5 is the optimal portrait ratio)
  LinkedIn, Twitter/X, Stories, newsletters, print

Want to make any changes?
```

---

## 9. Export Directory Convention

Ask the user: **"Where should I save the exports? (default: ./goose-graphics-exports/)"**

### Directory naming
- Primary: `[YYYY-MM-DD]-[slugified-name]/` (e.g., `2026-04-04-ai-webinar-poster/`)
- Fallback (no name given): `[YYYY-MM-DD]-poster-[HHMMSS]/`

### Directory structure (poster = single-file)
```
goose-graphics-exports/
  2026-04-04-ai-webinar-poster/
    index.html          # Poster source
    export.png          # Final PNG
```

---

## Design Reminders

- **Everything on one page.** A poster is a single fixed composition at 1080x1350px. No scrolling, no overflow. Every element must fit.
- **Three-zone composition.** Structure the poster into a top zone (headline), middle zone (content), and bottom zone (CTA/branding). Separate zones with accent rules.
- **Dense but ordered.** Posters are denser than carousels or slides. Every pixel is planned. Use clear visual hierarchy so the eye knows where to go: headline first, key content second, CTA last.
- **Fixed pixels only.** Like carousels, posters are fixed-size. No `vw`, `vh`, `clamp()`, or responsive units. Everything in `px`.
- **High contrast is critical.** Posters are often viewed at small sizes in feeds. Bold headlines, strong accent colors, and clear type hierarchy.
- **CTA in the bottom zone.** The bottom third is always reserved for the call to action and branding. This is the last thing the viewer sees and the most actionable.
- **Less text, more impact.** A poster should be understood in 5 seconds or less. Every word must earn its place.
