# Format: Chart

Create data visualization graphics at 1080x1080px (1:1 square, optimized for social posts). The entire composition is one HTML file with a styled card containing a pure CSS/HTML chart. Think metric dashboards, growth bar charts, before/after comparisons, progress trackers, and timeline visualizations.

---

## 1. Format Specifications

| Property | Value |
|----------|-------|
| Dimensions | 1080 x 1080px (1:1 square) |
| File structure | Single HTML file (`index.html`) |
| Aspect ratio | 1:1 (universal social media format) |
| Output format | Single PNG |
| Sizing approach | Fixed pixel sizes (NOT responsive) |
| Design approach | Polished data visualization on a styled card -- designed, not raw |

### Content Density Limits

A chart graphic is focused on one key insight. The visualization is the hero -- everything else supports it.

| Element | Max Content |
|---------|-------------|
| Title | 1 line, 6 words max |
| Context label | 1 line (e.g., "Q1 2026 Results", "Monthly Growth") |
| Data points | 4-8 bars, 3-5 metrics, or 4-6 timeline entries |
| Value labels | Short numeric labels on each data point |
| Footnote/source | 1 line attribution or date range |
| Branding | Logo mark or handle, positioned in bottom zone |

**If content exceeds limits:** Reduce data points. A chart graphic should communicate one insight at a glance, not present a full dataset.

---

## 2. Workflow Overview

```
Content Discovery --> Style Selection --> HTML Generation --> Screenshot --> Delivery
```

1. Gather the data, chart type, and context from the user
2. Present style presets and let the user choose (or guide them)
3. Read the chosen style preset from `styles/[name].md`
4. Generate a single HTML file with the full chart composition
5. Run the screenshot tool to export the PNG
6. Present the finished file to the user

---

## 3. Content Discovery Phase

Ask the user these questions before generating anything.

**Question 1: Data / Topic**
- "What data or metric do you want to visualize?"
- Free text input -- numbers, percentages, growth figures, comparisons

**Question 2: Chart Type**
- "What kind of chart works best?"
- Options:
  - **Bar Chart** -- Vertical bars showing growth or comparison over time
  - **Metric Card** -- Big hero number with trend indicator and context
  - **Before/After Comparison** -- Two-column stats showing improvement
  - **Progress/Goal Tracker** -- Horizontal progress bars toward targets
  - **Timeline** -- Vertical timeline showing milestones or growth over time

**Question 3: Content Readiness**
- "Do you have the exact numbers ready?"
- Options:
  - **Yes, I have all data** -- Paste it in
  - **I have rough numbers** -- Need formatting
  - **Just the topic** -- Need help creating sample data

If the user has data, ask them to share it before proceeding.

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

**After selection:** Read the chosen style preset file from `styles/[name].md` to load all colors, typography, and component patterns. For example, if the user picks "Electric Burst", read `styles/electric-burst.md`.

---

## 5. HTML Generation Phase

### Base CSS (Mandatory)

Charts are fixed-size square compositions. No scrolling, no overflow. Everything fits within 1080x1080px.

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
    padding: 48px;
}
```

### Injecting the Style Preset

After reading the style preset file, find its **Section 9 (Agent Prompt Guide)** which contains the CSS `:root` variables. Paste those variables into the `<style>` block:

```css
:root {
    /* -- Paste all CSS variables from the preset's Section 9 here -- */

    /* Chart-specific overrides */
    --chart-width: 1080px;
    --chart-height: 1080px;
    --chart-padding: 48px;
    --card-radius: 16px;
    --bar-radius: 6px;
    --content-max-width: 984px;
}
```

Also add the Google Fonts `<link>` from the preset's Section 9 into the `<head>`.

### Using Component Patterns

The preset's **Section 4 (Component Patterns)** contains ready-to-use HTML snippets. Adapt these for the chart's 1080x1080 square format.

The preset's **Section 8 (Format Adaptation Notes)** contains format-specific guidance. For charts, key rules:
- Display Hero (big number) at 72px
- Title at 36px
- Value labels at 18-24px
- Body/context at 16px
- The chart visualization is the dominant element -- it occupies the center of the composition
- The card container should have rounded corners and a subtle border or shadow

### Chart Composition Zones

A chart graphic is divided into three vertical zones within the overall canvas:

```
+---------------------------+
|       TOP ZONE            |  ~200px
|  Title + Context label    |
+---------------------------+
|       CHART ZONE          |  ~680px
|  The visualization        |
|  (bars, numbers, etc.)    |
+---------------------------+
|       BOTTOM ZONE         |  ~200px
|  Source/footnote + Brand  |
+---------------------------+
```

The entire composition sits on a styled background. The chart itself is contained inside a card element with rounded corners, padding, and a distinct surface color.

### Chart-Specific CSS Patterns

These utility classes support the chart templates below. Include them in every chart HTML file.

```css
/* =============================================
   CHART CARD
   ============================================= */

.chart-card {
    background: var(--color-surface, var(--color-charcoal, #1a1a1a));
    border: 1px solid var(--color-border, rgba(245,240,232,0.08));
    border-radius: var(--card-radius);
    padding: 40px;
    flex: 1;
    display: flex;
    flex-direction: column;
}

/* =============================================
   BAR CHART COMPONENTS
   ============================================= */

.bar-chart-container {
    display: flex;
    align-items: flex-end;
    justify-content: space-around;
    gap: 16px;
    flex: 1;
    padding-top: 24px;
}

.bar-column {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    flex: 1;
}

.bar-value {
    font-family: var(--font-display);
    font-size: 18px;
    font-weight: 700;
    color: var(--text-primary, var(--color-cream, #f5f0e8));
}

.bar {
    width: 100%;
    max-width: 80px;
    border-radius: var(--bar-radius) var(--bar-radius) 0 0;
    background: var(--color-accent, var(--color-copper, #c17f59));
    transition: height 0.3s ease;
}

.bar.muted {
    background: var(--color-border, rgba(245,240,232,0.15));
}

.bar.highlight {
    background: var(--color-accent, var(--color-copper, #c17f59));
    box-shadow: 0 0 20px rgba(193, 127, 89, 0.3);
}

.bar-label {
    font-family: var(--font-body);
    font-size: 14px;
    font-weight: 500;
    opacity: 0.6;
    text-align: center;
}

/* =============================================
   GRID LINES (decorative)
   ============================================= */

.chart-grid {
    position: relative;
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
}

.grid-line {
    position: absolute;
    left: 0;
    right: 0;
    height: 1px;
    background: var(--color-border, rgba(245,240,232,0.06));
}

/* =============================================
   PROGRESS BAR COMPONENTS
   ============================================= */

.progress-row {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.progress-header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
}

.progress-track {
    width: 100%;
    height: 12px;
    background: var(--color-border, rgba(245,240,232,0.08));
    border-radius: 6px;
    overflow: hidden;
}

.progress-fill {
    height: 100%;
    border-radius: 6px;
    background: var(--color-accent, var(--color-copper, #c17f59));
}

/* =============================================
   METRIC / BIG NUMBER
   ============================================= */

.metric-hero {
    font-family: var(--font-display);
    font-size: 96px;
    font-weight: 900;
    line-height: 1.00;
    letter-spacing: -2px;
    color: var(--color-accent, var(--color-copper, #c17f59));
}

.trend-arrow {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-family: var(--font-body);
    font-size: 18px;
    font-weight: 600;
    color: #34d399;
}

.trend-arrow.down {
    color: #f87171;
}
```

### Complete HTML Template

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=1080, initial-scale=1.0">
    <title>Chart Title</title>

    <!-- Google Fonts: paste the link from your chosen preset's Section 9 -->
    <link href="https://fonts.googleapis.com/css2?family=PRESET_FONTS_HERE&display=swap" rel="stylesheet">

    <style>
        /* =============================================
           CHART: 1080x1080px FIXED (1:1 Square)
           ============================================= */

        :root {
            /* -- Paste CSS variables from preset Section 9 -- */

            /* Chart-specific layout */
            --chart-width: 1080px;
            --chart-height: 1080px;
            --chart-padding: 48px;
            --card-radius: 16px;
            --bar-radius: 6px;
            --content-max-width: 984px;
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        html, body {
            width: var(--chart-width);
            height: var(--chart-height);
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
            padding: var(--chart-padding);
        }

        /* =============================================
           CHART ZONES
           ============================================= */

        .chart-top {
            flex: 0 0 auto;
            display: flex;
            flex-direction: column;
            justify-content: center;
            padding-bottom: 24px;
        }

        .chart-middle {
            flex: 1 1 auto;
            display: flex;
            flex-direction: column;
        }

        .chart-bottom {
            flex: 0 0 auto;
            display: flex;
            flex-direction: column;
            justify-content: flex-end;
            padding-top: 24px;
        }

        /* =============================================
           CHART CARD
           ============================================= */

        .chart-card {
            background: var(--color-surface, var(--color-charcoal, #1a1a1a));
            border: 1px solid var(--color-border, rgba(245,240,232,0.08));
            border-radius: var(--card-radius);
            padding: 40px;
            flex: 1;
            display: flex;
            flex-direction: column;
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
            font-size: 36px;
            font-weight: 700;
            line-height: 1.10;
            letter-spacing: -1px;
        }

        .section-heading {
            font-family: var(--font-display);
            font-size: 28px;
            font-weight: 700;
            line-height: 1.15;
            letter-spacing: -0.5px;
        }

        .sub-heading {
            font-family: var(--font-display);
            font-size: 22px;
            font-weight: 700;
            line-height: 1.20;
            letter-spacing: -0.3px;
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
           BAR CHART COMPONENTS
           ============================================= */

        .bar-chart-container {
            display: flex;
            align-items: flex-end;
            justify-content: space-around;
            gap: 16px;
            flex: 1;
            padding-top: 24px;
        }

        .bar-column {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 10px;
            flex: 1;
        }

        .bar-value {
            font-family: var(--font-display);
            font-size: 18px;
            font-weight: 700;
            color: var(--text-primary, var(--color-cream, #f5f0e8));
        }

        .bar {
            width: 100%;
            max-width: 80px;
            border-radius: var(--bar-radius) var(--bar-radius) 0 0;
            background: var(--color-accent, var(--color-copper, #c17f59));
        }

        .bar.muted {
            background: var(--color-border, rgba(245,240,232,0.15));
        }

        .bar.highlight {
            background: var(--color-accent, var(--color-copper, #c17f59));
            box-shadow: 0 0 20px rgba(193, 127, 89, 0.3);
        }

        .bar-label {
            font-family: var(--font-body);
            font-size: 14px;
            font-weight: 500;
            opacity: 0.6;
            text-align: center;
        }

        /* =============================================
           GRID LINES (decorative)
           ============================================= */

        .chart-grid {
            position: relative;
            flex: 1;
            display: flex;
            flex-direction: column;
            justify-content: flex-end;
        }

        .grid-line {
            position: absolute;
            left: 0;
            right: 0;
            height: 1px;
            background: var(--color-border, rgba(245,240,232,0.06));
        }

        /* =============================================
           PROGRESS BAR COMPONENTS
           ============================================= */

        .progress-row {
            display: flex;
            flex-direction: column;
            gap: 8px;
        }

        .progress-header {
            display: flex;
            justify-content: space-between;
            align-items: baseline;
        }

        .progress-track {
            width: 100%;
            height: 12px;
            background: var(--color-border, rgba(245,240,232,0.08));
            border-radius: 6px;
            overflow: hidden;
        }

        .progress-fill {
            height: 100%;
            border-radius: 6px;
            background: var(--color-accent, var(--color-copper, #c17f59));
        }

        /* =============================================
           METRIC / BIG NUMBER
           ============================================= */

        .metric-hero {
            font-family: var(--font-display);
            font-size: 96px;
            font-weight: 900;
            line-height: 1.00;
            letter-spacing: -2px;
            color: var(--color-accent, var(--color-copper, #c17f59));
        }

        .trend-arrow {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            font-family: var(--font-body);
            font-size: 18px;
            font-weight: 600;
            color: #34d399;
        }

        .trend-arrow.down {
            color: #f87171;
        }

        /* =============================================
           COMPARISON COLUMNS
           ============================================= */

        .comparison-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 24px;
        }

        .comparison-column {
            display: flex;
            flex-direction: column;
            gap: 20px;
        }

        .comparison-stat {
            display: flex;
            flex-direction: column;
            gap: 4px;
        }

        .comparison-value {
            font-family: var(--font-display);
            font-size: 40px;
            font-weight: 800;
            line-height: 1.05;
            letter-spacing: -0.5px;
        }

        /* =============================================
           TIMELINE COMPONENTS
           ============================================= */

        .timeline {
            display: flex;
            flex-direction: column;
            gap: 0;
            position: relative;
            padding-left: 32px;
        }

        .timeline::before {
            content: '';
            position: absolute;
            left: 7px;
            top: 8px;
            bottom: 8px;
            width: 2px;
            background: var(--color-border, rgba(245,240,232,0.12));
        }

        .timeline-item {
            display: flex;
            align-items: flex-start;
            gap: 20px;
            padding: 16px 0;
            position: relative;
        }

        .timeline-dot {
            position: absolute;
            left: -32px;
            top: 22px;
            width: 16px;
            height: 16px;
            border-radius: 50%;
            background: var(--color-surface, var(--color-charcoal, #1a1a1a));
            border: 2px solid var(--color-border, rgba(245,240,232,0.2));
        }

        .timeline-dot.active {
            background: var(--color-accent, var(--color-copper, #c17f59));
            border-color: var(--color-accent, var(--color-copper, #c17f59));
            box-shadow: 0 0 12px rgba(193, 127, 89, 0.4);
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

    <!-- TOP ZONE: Title + Context -->
    <div class="chart-top">
        <!-- Content here -->
    </div>

    <!-- CHART ZONE: Visualization -->
    <div class="chart-middle">
        <div class="chart-card">
            <!-- Chart content here -->
        </div>
    </div>

    <!-- BOTTOM ZONE: Source + Brand -->
    <div class="chart-bottom">
        <!-- Content here -->
    </div>

</body>
</html>
```

---

## 6. Content Templates

All templates use CSS custom properties so they work with any style preset. Each template shows a complete chart graphic with all three zones filled.

### Bar Chart (Growth / Comparison)

Vertical bars showing monthly or categorical data. Inspired by the InferenceCore growth chart reference -- a clean card with bars rising from a baseline, value labels above each bar, and subtle grid lines for context.

```html
<body>

    <!-- TOP ZONE -->
    <div class="chart-top">
        <p class="label" style="color: var(--color-secondary-accent, var(--color-muted-gold, #a89067)); margin-bottom: 12px;">
            MONTHLY INFERENCE VOLUME
        </p>
        <h1 class="display-title">
            Platform Growth
        </h1>
    </div>

    <!-- CHART ZONE -->
    <div class="chart-middle">
        <div class="chart-card">
            <!-- Subtle grid lines -->
            <div class="chart-grid">
                <div class="grid-line" style="bottom: 100%;"></div>
                <div class="grid-line" style="bottom: 75%;"></div>
                <div class="grid-line" style="bottom: 50%;"></div>
                <div class="grid-line" style="bottom: 25%;"></div>
                <div class="grid-line" style="bottom: 0%;"></div>

                <!-- Bars -->
                <div class="bar-chart-container">
                    <div class="bar-column">
                        <span class="bar-value">1.2M</span>
                        <div class="bar muted" style="height: 120px;"></div>
                        <span class="bar-label">Jan</span>
                    </div>
                    <div class="bar-column">
                        <span class="bar-value">1.8M</span>
                        <div class="bar muted" style="height: 180px;"></div>
                        <span class="bar-label">Feb</span>
                    </div>
                    <div class="bar-column">
                        <span class="bar-value">2.4M</span>
                        <div class="bar muted" style="height: 240px;"></div>
                        <span class="bar-label">Mar</span>
                    </div>
                    <div class="bar-column">
                        <span class="bar-value">3.1M</span>
                        <div class="bar" style="height: 310px;"></div>
                        <span class="bar-label">Apr</span>
                    </div>
                    <div class="bar-column">
                        <span class="bar-value">4.2M</span>
                        <div class="bar" style="height: 380px;"></div>
                        <span class="bar-label">May</span>
                    </div>
                    <div class="bar-column">
                        <span class="bar-value">5.8M</span>
                        <div class="bar highlight" style="height: 460px;"></div>
                        <span class="bar-label">Jun</span>
                    </div>
                </div>
            </div>

            <!-- Summary stat inline -->
            <div style="display: flex; align-items: center; gap: 12px; margin-top: 20px; padding-top: 16px; border-top: 1px solid var(--color-border, rgba(245,240,232,0.08));">
                <span class="trend-arrow">&#9650; 383%</span>
                <span class="body-text" style="opacity: 0.5;">growth since January</span>
            </div>
        </div>
    </div>

    <!-- BOTTOM ZONE -->
    <div class="chart-bottom" style="display: flex; flex-direction: row; justify-content: space-between; align-items: flex-end;">
        <p class="small-text" style="opacity: 0.4;">Source: Internal analytics &middot; Jan-Jun 2026</p>
        <p class="brand">@yourbrand</p>
    </div>

</body>
```

### Metric Card (Hero Number + Trend)

A single dominant metric with trend indicator and supporting context. Great for revenue milestones, user counts, conversion rates -- any moment where one number tells the story.

```html
<body>

    <!-- TOP ZONE -->
    <div class="chart-top">
        <p class="label" style="color: var(--color-secondary-accent, var(--color-muted-gold, #a89067)); margin-bottom: 12px;">
            REVENUE &middot; Q1 2026
        </p>
        <h1 class="display-title">
            Quarterly Results
        </h1>
    </div>

    <!-- CHART ZONE -->
    <div class="chart-middle">
        <div class="chart-card" style="justify-content: center; align-items: center; text-align: center;">
            <!-- Hero metric -->
            <p class="metric-hero">$2.4M</p>
            <div style="display: flex; align-items: center; gap: 8px; margin-top: 16px;">
                <span class="trend-arrow">&#9650; 47%</span>
                <span class="body-text" style="opacity: 0.5;">vs last quarter</span>
            </div>

            <!-- Divider -->
            <div class="zone-divider-centered" style="margin: 32px auto;"></div>

            <!-- Supporting metrics row -->
            <div class="three-column" style="width: 100%; max-width: 720px;">
                <div style="text-align: center;">
                    <p style="font-family: var(--font-display); font-size: 32px; font-weight: 800; color: var(--text-primary, var(--color-cream, #f5f0e8));">1,247</p>
                    <p class="label" style="margin-top: 6px; font-size: 11px; opacity: 0.5;">NEW CUSTOMERS</p>
                </div>
                <div style="text-align: center;">
                    <p style="font-family: var(--font-display); font-size: 32px; font-weight: 800; color: var(--text-primary, var(--color-cream, #f5f0e8));">94%</p>
                    <p class="label" style="margin-top: 6px; font-size: 11px; opacity: 0.5;">RETENTION RATE</p>
                </div>
                <div style="text-align: center;">
                    <p style="font-family: var(--font-display); font-size: 32px; font-weight: 800; color: var(--text-primary, var(--color-cream, #f5f0e8));">$1.9K</p>
                    <p class="label" style="margin-top: 6px; font-size: 11px; opacity: 0.5;">AVG DEAL SIZE</p>
                </div>
            </div>
        </div>
    </div>

    <!-- BOTTOM ZONE -->
    <div class="chart-bottom" style="display: flex; flex-direction: row; justify-content: space-between; align-items: flex-end;">
        <p class="small-text" style="opacity: 0.4;">Fiscal Q1 &middot; Jan 1 - Mar 31, 2026</p>
        <p class="brand">@yourbrand</p>
    </div>

</body>
```

### Before/After Comparison

Two-column layout showing improvement across multiple metrics. A clear visual story: the left column shows the "before" state, the right column shows the "after" with accent color highlighting the wins. A percentage change badge reinforces the improvement.

```html
<body>

    <!-- TOP ZONE -->
    <div class="chart-top" style="text-align: center; align-items: center;">
        <p class="label" style="color: var(--color-secondary-accent, var(--color-muted-gold, #a89067)); margin-bottom: 12px;">
            CASE STUDY &middot; 90-DAY RESULTS
        </p>
        <h1 class="display-title">
            Before &amp; After AI Agents
        </h1>
    </div>

    <!-- CHART ZONE -->
    <div class="chart-middle">
        <div class="chart-card">
            <!-- Column headers -->
            <div class="comparison-grid" style="margin-bottom: 24px;">
                <div>
                    <p class="label" style="font-size: 12px; opacity: 0.4;">BEFORE</p>
                </div>
                <div style="text-align: right;">
                    <p class="label" style="font-size: 12px; color: var(--color-accent, var(--color-copper, #c17f59));">AFTER</p>
                </div>
            </div>

            <!-- Metric rows -->
            <div style="display: flex; flex-direction: column; gap: 0;">
                <!-- Row 1: Response Time -->
                <div style="display: grid; grid-template-columns: 1fr auto 1fr; gap: 16px; align-items: center; padding: 20px 0; border-bottom: 1px solid var(--color-border, rgba(245,240,232,0.08));">
                    <div class="comparison-stat">
                        <p class="comparison-value" style="opacity: 0.4;">4.2h</p>
                        <p class="body-text" style="opacity: 0.5;">Response Time</p>
                    </div>
                    <div style="background: var(--color-accent, var(--color-copper, #c17f59)); color: var(--bg-primary, #0d0d0d); font-family: var(--font-body); font-size: 13px; font-weight: 700; padding: 4px 12px; border-radius: 20px;">
                        -86%
                    </div>
                    <div class="comparison-stat" style="text-align: right;">
                        <p class="comparison-value" style="color: var(--color-accent, var(--color-copper, #c17f59));">35m</p>
                        <p class="body-text" style="opacity: 0.5;">Response Time</p>
                    </div>
                </div>

                <!-- Row 2: Tasks per Day -->
                <div style="display: grid; grid-template-columns: 1fr auto 1fr; gap: 16px; align-items: center; padding: 20px 0; border-bottom: 1px solid var(--color-border, rgba(245,240,232,0.08));">
                    <div class="comparison-stat">
                        <p class="comparison-value" style="opacity: 0.4;">23</p>
                        <p class="body-text" style="opacity: 0.5;">Tasks / Day</p>
                    </div>
                    <div style="background: var(--color-accent, var(--color-copper, #c17f59)); color: var(--bg-primary, #0d0d0d); font-family: var(--font-body); font-size: 13px; font-weight: 700; padding: 4px 12px; border-radius: 20px;">
                        +287%
                    </div>
                    <div class="comparison-stat" style="text-align: right;">
                        <p class="comparison-value" style="color: var(--color-accent, var(--color-copper, #c17f59));">89</p>
                        <p class="body-text" style="opacity: 0.5;">Tasks / Day</p>
                    </div>
                </div>

                <!-- Row 3: Cost per Lead -->
                <div style="display: grid; grid-template-columns: 1fr auto 1fr; gap: 16px; align-items: center; padding: 20px 0; border-bottom: 1px solid var(--color-border, rgba(245,240,232,0.08));">
                    <div class="comparison-stat">
                        <p class="comparison-value" style="opacity: 0.4;">$142</p>
                        <p class="body-text" style="opacity: 0.5;">Cost per Lead</p>
                    </div>
                    <div style="background: var(--color-accent, var(--color-copper, #c17f59)); color: var(--bg-primary, #0d0d0d); font-family: var(--font-body); font-size: 13px; font-weight: 700; padding: 4px 12px; border-radius: 20px;">
                        -63%
                    </div>
                    <div class="comparison-stat" style="text-align: right;">
                        <p class="comparison-value" style="color: var(--color-accent, var(--color-copper, #c17f59));">$52</p>
                        <p class="body-text" style="opacity: 0.5;">Cost per Lead</p>
                    </div>
                </div>

                <!-- Row 4: Customer Satisfaction -->
                <div style="display: grid; grid-template-columns: 1fr auto 1fr; gap: 16px; align-items: center; padding: 20px 0;">
                    <div class="comparison-stat">
                        <p class="comparison-value" style="opacity: 0.4;">72%</p>
                        <p class="body-text" style="opacity: 0.5;">CSAT Score</p>
                    </div>
                    <div style="background: var(--color-accent, var(--color-copper, #c17f59)); color: var(--bg-primary, #0d0d0d); font-family: var(--font-body); font-size: 13px; font-weight: 700; padding: 4px 12px; border-radius: 20px;">
                        +24%
                    </div>
                    <div class="comparison-stat" style="text-align: right;">
                        <p class="comparison-value" style="color: var(--color-accent, var(--color-copper, #c17f59));">89%</p>
                        <p class="body-text" style="opacity: 0.5;">CSAT Score</p>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- BOTTOM ZONE -->
    <div class="chart-bottom" style="display: flex; flex-direction: row; justify-content: space-between; align-items: flex-end;">
        <p class="small-text" style="opacity: 0.4;">Based on 90-day pilot &middot; 12 team members</p>
        <p class="brand">@yourbrand</p>
    </div>

</body>
```

### Progress / Goal Tracker

Horizontal progress bars showing advancement toward targets. Each row is a named goal with a filled track indicating current progress. Perfect for quarterly OKRs, fundraising rounds, product milestones, or any multi-goal status update.

```html
<body>

    <!-- TOP ZONE -->
    <div class="chart-top">
        <p class="label" style="color: var(--color-secondary-accent, var(--color-muted-gold, #a89067)); margin-bottom: 12px;">
            Q2 2026 OBJECTIVES
        </p>
        <h1 class="display-title">
            Goals &amp; Progress
        </h1>
    </div>

    <!-- CHART ZONE -->
    <div class="chart-middle">
        <div class="chart-card" style="gap: 32px; justify-content: center;">
            <!-- Goal 1 -->
            <div class="progress-row">
                <div class="progress-header">
                    <span class="sub-heading" style="font-size: 18px;">Annual Recurring Revenue</span>
                    <span style="font-family: var(--font-display); font-size: 18px; font-weight: 700; color: var(--color-accent, var(--color-copper, #c17f59));">$3.2M / $5M</span>
                </div>
                <div class="progress-track">
                    <div class="progress-fill" style="width: 64%;"></div>
                </div>
                <div style="display: flex; justify-content: space-between;">
                    <span class="small-text" style="opacity: 0.4;">64% complete</span>
                    <span class="small-text" style="opacity: 0.4;">Target: Dec 2026</span>
                </div>
            </div>

            <!-- Goal 2 -->
            <div class="progress-row">
                <div class="progress-header">
                    <span class="sub-heading" style="font-size: 18px;">Active Workspaces</span>
                    <span style="font-family: var(--font-display); font-size: 18px; font-weight: 700; color: var(--color-accent, var(--color-copper, #c17f59));">847 / 1,000</span>
                </div>
                <div class="progress-track">
                    <div class="progress-fill" style="width: 85%;"></div>
                </div>
                <div style="display: flex; justify-content: space-between;">
                    <span class="small-text" style="opacity: 0.4;">85% complete</span>
                    <span class="small-text" style="opacity: 0.4;">Target: Jun 2026</span>
                </div>
            </div>

            <!-- Goal 3 -->
            <div class="progress-row">
                <div class="progress-header">
                    <span class="sub-heading" style="font-size: 18px;">Enterprise Clients</span>
                    <span style="font-family: var(--font-display); font-size: 18px; font-weight: 700; color: var(--color-accent, var(--color-copper, #c17f59));">18 / 50</span>
                </div>
                <div class="progress-track">
                    <div class="progress-fill" style="width: 36%;"></div>
                </div>
                <div style="display: flex; justify-content: space-between;">
                    <span class="small-text" style="opacity: 0.4;">36% complete</span>
                    <span class="small-text" style="opacity: 0.4;">Target: Dec 2026</span>
                </div>
            </div>

            <!-- Goal 4 -->
            <div class="progress-row">
                <div class="progress-header">
                    <span class="sub-heading" style="font-size: 18px;">NPS Score</span>
                    <span style="font-family: var(--font-display); font-size: 18px; font-weight: 700; color: var(--color-accent, var(--color-copper, #c17f59));">71 / 80</span>
                </div>
                <div class="progress-track">
                    <div class="progress-fill" style="width: 89%;"></div>
                </div>
                <div style="display: flex; justify-content: space-between;">
                    <span class="small-text" style="opacity: 0.4;">89% complete</span>
                    <span class="small-text" style="opacity: 0.4;">Target: Jun 2026</span>
                </div>
            </div>
        </div>
    </div>

    <!-- BOTTOM ZONE -->
    <div class="chart-bottom" style="display: flex; flex-direction: row; justify-content: space-between; align-items: flex-end;">
        <p class="small-text" style="opacity: 0.4;">Updated April 5, 2026 &middot; Board snapshot</p>
        <p class="brand">@yourbrand</p>
    </div>

</body>
```

### Timeline Chart (Milestones / Growth)

A vertical timeline showing key events or growth milestones in chronological order. Each entry has a date, a headline, and a supporting detail. Active dots highlight the most recent or most significant milestone. Great for company timelines, product roadmaps, and growth narratives.

```html
<body>

    <!-- TOP ZONE -->
    <div class="chart-top" style="text-align: center; align-items: center;">
        <p class="label" style="color: var(--color-secondary-accent, var(--color-muted-gold, #a89067)); margin-bottom: 12px;">
            OUR JOURNEY
        </p>
        <h1 class="display-title">
            Key Milestones
        </h1>
    </div>

    <!-- CHART ZONE -->
    <div class="chart-middle">
        <div class="chart-card" style="justify-content: center;">
            <div class="timeline">
                <!-- Milestone 1 -->
                <div class="timeline-item">
                    <div class="timeline-dot"></div>
                    <div style="display: flex; gap: 20px; align-items: baseline; flex: 1;">
                        <span class="label" style="font-size: 12px; min-width: 80px; opacity: 0.5;">JAN 2025</span>
                        <div>
                            <h3 class="sub-heading" style="font-size: 20px;">Company Founded</h3>
                            <p class="body-text" style="opacity: 0.5; margin-top: 4px;">Started with 3 founders and a vision for AI coworkers.</p>
                        </div>
                    </div>
                </div>

                <!-- Milestone 2 -->
                <div class="timeline-item">
                    <div class="timeline-dot"></div>
                    <div style="display: flex; gap: 20px; align-items: baseline; flex: 1;">
                        <span class="label" style="font-size: 12px; min-width: 80px; opacity: 0.5;">JUN 2025</span>
                        <div>
                            <h3 class="sub-heading" style="font-size: 20px;">First 100 Users</h3>
                            <p class="body-text" style="opacity: 0.5; margin-top: 4px;">Reached product-market fit with early adopters.</p>
                        </div>
                    </div>
                </div>

                <!-- Milestone 3 -->
                <div class="timeline-item">
                    <div class="timeline-dot active"></div>
                    <div style="display: flex; gap: 20px; align-items: baseline; flex: 1;">
                        <span class="label" style="font-size: 12px; min-width: 80px; color: var(--color-accent, var(--color-copper, #c17f59));">OCT 2025</span>
                        <div>
                            <h3 class="sub-heading" style="font-size: 20px; color: var(--color-accent, var(--color-copper, #c17f59));">$2M Seed Round</h3>
                            <p class="body-text" style="opacity: 0.5; margin-top: 4px;">Raised from top-tier investors to scale the platform.</p>
                        </div>
                    </div>
                </div>

                <!-- Milestone 4 -->
                <div class="timeline-item">
                    <div class="timeline-dot"></div>
                    <div style="display: flex; gap: 20px; align-items: baseline; flex: 1;">
                        <span class="label" style="font-size: 12px; min-width: 80px; opacity: 0.5;">FEB 2026</span>
                        <div>
                            <h3 class="sub-heading" style="font-size: 20px;">1,000 Workspaces</h3>
                            <p class="body-text" style="opacity: 0.5; margin-top: 4px;">Teams across 14 countries deploying AI agents daily.</p>
                        </div>
                    </div>
                </div>

                <!-- Milestone 5 -->
                <div class="timeline-item">
                    <div class="timeline-dot active"></div>
                    <div style="display: flex; gap: 20px; align-items: baseline; flex: 1;">
                        <span class="label" style="font-size: 12px; min-width: 80px; color: var(--color-accent, var(--color-copper, #c17f59));">APR 2026</span>
                        <div>
                            <h3 class="sub-heading" style="font-size: 20px; color: var(--color-accent, var(--color-copper, #c17f59));">Series A</h3>
                            <p class="body-text" style="opacity: 0.5; margin-top: 4px;">Closing our next round to expand into enterprise.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- BOTTOM ZONE -->
    <div class="chart-bottom" style="display: flex; flex-direction: row; justify-content: space-between; align-items: flex-end;">
        <p class="small-text" style="opacity: 0.4;">Company timeline &middot; 2025-2026</p>
        <p class="brand">@yourbrand</p>
    </div>

</body>
```

---

## 7. Screenshot Phase

After generating the HTML file, run the screenshot tool:

```bash
node screenshot/screenshot.js \
  --format chart \
  --input ./EXPORT_DIR/index.html \
  --output ./EXPORT_DIR/export.png
```

Where `EXPORT_DIR` is the export directory (see Section 9).

This will:
1. Open the HTML file in a headless Chromium browser
2. Set the viewport to 1080x1080px with 2x device scale factor
3. Wait for fonts to load (500ms default; use `--font-delay 1000` for custom fonts)
4. Capture a PNG screenshot (fixed size, no full-page needed)
5. Save to the specified output path

---

## 8. Delivery Phase

After the screenshot is generated, present results to the user:

```
Your chart is ready!

Location: [EXPORT_DIR]/

Files:
  index.html     -- Chart source (editable)
  export.png     -- Final chart image

Export details:
  Dimensions: 1080 x 1080px (1:1 square)
  File size:  [SIZE] KB

Share on:
  Instagram, LinkedIn, Twitter/X (1:1 works everywhere)
  Newsletters, pitch decks, dashboards, reports

Want to make any changes?
```

---

## 9. Export Directory Convention

Ask the user: **"Where should I save the exports? (default: ./goose-graphics-exports/)"**

### Directory naming
- Primary: `[YYYY-MM-DD]-[slugified-name]/` (e.g., `2026-04-05-q1-revenue-chart/`)
- Fallback (no name given): `[YYYY-MM-DD]-chart-[HHMMSS]/`

### Directory structure (chart = single-file)
```
goose-graphics-exports/
  2026-04-05-q1-revenue-chart/
    index.html          # Chart source
    export.png          # Final PNG
```

---

## Design Reminders

- **One insight per graphic.** A chart graphic communicates a single data story. Do not overload it with multiple unrelated datasets. If the user has more data, suggest splitting into multiple graphics.
- **Three-zone composition.** Structure the chart into a top zone (title + context), chart zone (the visualization inside a card), and bottom zone (source + branding).
- **Pure CSS/HTML only.** No JavaScript, no canvas, no SVG charting libraries. All bars, progress fills, and visual elements are built with CSS width/height, background colors, and border-radius.
- **Percentage-based bar sizing.** Calculate bar heights or widths as proportions of the largest value. The tallest bar should be near the maximum available height, and all others scale proportionally.
- **Fixed pixels only.** Like all graphic formats, charts are fixed-size. No `vw`, `vh`, `clamp()`, or responsive units. Everything in `px`.
- **Cards contain charts.** The visualization always sits inside a `.chart-card` container with rounded corners, padding, and a surface background. This creates the "dashboard card" look.
- **Decorative grid lines.** Add subtle horizontal grid lines behind bar charts to give the feel of a real data visualization. Keep them very faint (6-8% opacity).
- **Highlight the key data point.** Use the accent color and `.highlight` class on the most important bar or number. Mute less important data points with `.muted` to create visual hierarchy.
- **Designed, not raw.** Charts should look like they belong in a polished pitch deck or social post -- rounded corners on bars, generous spacing, accent color highlights, and clean typography. Never like a spreadsheet or raw data dump.
- **Readable at small sizes.** Social feeds display images small. Use bold numbers, strong color contrast, and clear labels. The key insight should be visible even at thumbnail size.
