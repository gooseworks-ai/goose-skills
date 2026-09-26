---
name: graphic-chart
description: Designed data visualization skill for the Agent Skills ecosystem. Produces publication-ready chart graphics using pure HTML/CSS with gooseworks style integration. Supports bar, line, donut, metric card, comparison, and area charts across multiple visual styles — not Matplotlib defaults.
---

## 1. Overview

`graphic-chart` produces real, designed chart graphics — the kind you'd see in a polished product dashboard, investor deck, or social media data post. Every chart is a single HTML file rendered to PNG via Playwright, styled with the gooseworks style catalog.

**What this is NOT:** raw Matplotlib/Seaborn/Chart.js output. Every chart is a designed composition with proper typography, color systems, spacing, and visual hierarchy drawn from a gooseworks style spec.

It loads in any host that reads `SKILL.md` — Claude Code, Goose, Cursor, Codex. Styles are fetched on demand from the gooseworks catalog via `npx gooseworks styles get <slug>`.

## 2. Invocation

```
/graphic-chart --type <chart-type> --style <slug> --data "<inline-data>" [--size <preset>] [--title "..."]
```

### Parameters

| Parameter | Required | Description |
|-----------|----------|-------------|
| `--type` | Yes | `bar`, `line`, `donut`, `metric`, `comparison`, `area` |
| `--style` | No | Any gooseworks style slug. Discover with `npx gooseworks styles list`. Defaults to interactive selection. |
| `--data` | No | Inline JSON data or path to CSV/JSON file. If omitted, prompts interactively. |
| `--size` | No | `square` (1080x1080, default), `landscape` (1200x630), `wide` (1920x1080) |
| `--title` | No | Chart title. Max 6 words. |
| `--ref` | No | Reference image to extract a one-off style from (skips `--style`). |

### Examples

```bash
# Bar chart with neon dashboard style
/graphic-chart --type bar --style neon-dashboard --title "Q1 Revenue Growth" \
  --data '[{"label":"Jan","value":42},{"label":"Feb","value":58},{"label":"Mar","value":73}]'

# Donut chart from reference image
/graphic-chart --type donut --ref ~/brand-guide.png --title "Market Share" \
  --data '[{"label":"Us","value":34},{"label":"Competitor A","value":28},{"label":"Others","value":38}]'

# Metric card — interactive style selection
/graphic-chart --type metric --title "Monthly Active Users" \
  --data '{"value":"2.4M","change":"+18%","period":"vs last month"}'

# Line chart from CSV
/graphic-chart --type line --style clean-slate --data ./revenue.csv --title "ARR Trend"

# Comparison chart
/graphic-chart --type comparison --style midnight-editorial \
  --data '{"before":{"label":"Q3","metrics":[{"name":"MRR","value":"$42K"},{"name":"Churn","value":"8.2%"}]},"after":{"label":"Q4","metrics":[{"name":"MRR","value":"$67K"},{"name":"Churn","value":"4.1%"}]}}'

# Area chart
/graphic-chart --type area --style deep-ocean --title "Traffic Over Time" \
  --data '[{"label":"Mon","value":1200},{"label":"Tue","value":1800},{"label":"Wed","value":1500},{"label":"Thu","value":2200},{"label":"Fri","value":2800}]'
```

### Invocation modes

1. **All args present** → skip discovery, generate directly.
2. **Partial args** → ask only for missing pieces.
3. **No args** → interactive flow from §3 onward.

## 3. Content Discovery Phase

Ask the user these questions before generating.

**Question 1: Chart Type**
- "What kind of chart?"
- Options:
  - **Bar Chart** — vertical or horizontal bars for comparison/growth
  - **Line Chart** — trend lines connecting data points over time
  - **Donut Chart** — proportional segments in a ring
  - **Metric Card** — hero number with trend indicator
  - **Comparison** — before/after or side-by-side stats
  - **Area Chart** — filled line chart showing volume over time

**Question 2: Data**
- "What data should we visualize?"
- Accept: inline JSON, pasted numbers, CSV path, or free text description
- If the user gives rough text, structure it into the data format for them

**Question 3: Context**
- "Any title or source attribution?"
- Title: max 6 words
- Source: max 1 line (e.g., "Source: Internal Analytics, Q1 2026")

## 4. Style Selection Phase

Discover styles from the gooseworks catalog:

```bash
npx gooseworks styles list
npx gooseworks styles search "dark analytics"
npx gooseworks styles get <slug>
```

**Recommended pairings by chart mood:**

| Mood | Styles |
|------|--------|
| Dashboard / Analytics | `neon-dashboard`, `clean-slate`, `terminal` |
| Executive / Investor | `midnight-editorial`, `golden-dusk`, `deep-ocean` |
| Marketing / Social | `electric-burst`, `coral-halftone`, `peach-pop` |
| Editorial / Content | `paper-and-ink`, `warm-earth`, `gradient-editorial` |
| Technical / Dev | `terminal`, `brutalist`, `dot-grid-stat` |

If the user has a reference image, use `extract-style.md` from the `goose-graphics` skill to derive a custom palette.

## 5. Data Format

All chart types accept a standard JSON structure. The skill normalizes input before rendering.

### Bar / Line / Area

```json
[
  {"label": "Jan", "value": 42},
  {"label": "Feb", "value": 58},
  {"label": "Mar", "value": 73}
]
```

Optional: multi-series with `series` key:
```json
{
  "series": [
    {"name": "Revenue", "data": [42, 58, 73]},
    {"name": "Costs", "data": [30, 35, 40]}
  ],
  "labels": ["Jan", "Feb", "Mar"]
}
```

### Donut

```json
[
  {"label": "Segment A", "value": 34},
  {"label": "Segment B", "value": 28},
  {"label": "Segment C", "value": 38}
]
```

### Metric Card

```json
{
  "value": "2.4M",
  "change": "+18%",
  "period": "vs last month",
  "sparkline": [12, 15, 14, 18, 22, 24]
}
```

### Comparison

```json
{
  "before": {
    "label": "Before",
    "metrics": [
      {"name": "Revenue", "value": "$42K"},
      {"name": "Churn", "value": "8.2%"}
    ]
  },
  "after": {
    "label": "After",
    "metrics": [
      {"name": "Revenue", "value": "$67K"},
      {"name": "Churn", "value": "4.1%"}
    ]
  }
}
```

## 6. HTML Generation

### Base structure

Every chart is a single HTML file. Fixed-size, no scrolling, no JavaScript.

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <!-- Google Fonts from style spec -->
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    /* Reset */
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: var(--chart-width); height: var(--chart-height); overflow: hidden; }

    :root {
      /* Paste CSS variables from style spec Section 9 */
      --chart-width: 1080px;
      --chart-height: 1080px;
      --chart-padding: 48px;
      --card-radius: 20px;
      --bar-radius: 8px;
    }

    body {
      display: flex;
      flex-direction: column;
      padding: var(--chart-padding);
      background: var(--color-canvas, #f5f0e8);
      font-family: var(--font-body, 'Inter', sans-serif);
    }

    .chart-card {
      background: var(--color-surface, #1a1a1a);
      border-radius: var(--card-radius);
      padding: 40px;
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    /* ... chart-type-specific CSS ... */
  </style>
</head>
<body>
  <div class="chart-card">
    <!-- TOP: Title + context -->
    <div class="chart-header">...</div>
    <!-- MIDDLE: Visualization -->
    <div class="chart-body">...</div>
    <!-- BOTTOM: Source + branding -->
    <div class="chart-footer">...</div>
  </div>
</body>
</html>
```

### Size presets

| Preset | Dimensions | Use case |
|--------|-----------|----------|
| `square` | 1080x1080 | Social media, Instagram, LinkedIn |
| `landscape` | 1200x630 | Blog OG images, Twitter cards |
| `wide` | 1920x1080 | Slide decks, presentations |

### Layout zones

```
+----------------------------------+
|  HEADER ZONE (~15%)              |
|  Pill label + Title + Context    |
+----------------------------------+
|  CHART ZONE (~70%)               |
|  The visualization               |
|  (bars, lines, donut, etc.)      |
+----------------------------------+
|  FOOTER ZONE (~15%)              |
|  Source line + Branding          |
+----------------------------------+
```

### Typography hierarchy

| Element | Size | Weight | Notes |
|---------|------|--------|-------|
| Pill label | 11px | 700 | Uppercase, letter-spacing 1.5px |
| Title | 36-48px | 700 | Max 6 words, tight line-height |
| Hero stat | 64-72px | 700 | For metric cards |
| Value labels | 18-24px | 600 | On bars/points |
| Axis labels | 12-14px | 500 | Muted opacity |
| Source line | 11px | 400 | Bottom zone, muted |

### Design principles

1. **Every chart tells one story.** One insight per graphic. No multi-axis complexity.
2. **The last data point is the hero.** Highlight the most recent or most important value with the style's accent color and a glow/shadow.
3. **Grid lines are whispers.** Use `rgba(255,255,255,0.06)` or equivalent from the style spec. Never compete with data.
4. **White space is structure.** The padding around the chart card and between elements creates the designed feel.
5. **Color comes from the style, not the data.** Use the style's accent for highlights, muted variant for secondary bars, surface color for the card.
6. **No Matplotlib. No Chart.js. No SVG charting libraries.** Pure HTML + CSS. Bars are `div`s with heights. Lines are CSS gradients or clip-paths. Donuts are `conic-gradient`.

### Chart-type CSS patterns

#### Bar Chart

```css
.bar-chart { display: flex; align-items: flex-end; gap: 16px; flex: 1; padding-top: 24px; }
.bar-column { display: flex; flex-direction: column; align-items: center; gap: 10px; flex: 1; }
.bar { width: 100%; max-width: 80px; border-radius: var(--bar-radius) var(--bar-radius) 0 0; background: var(--color-accent); }
.bar.muted { background: var(--color-border); }
.bar.highlight { background: var(--color-accent); box-shadow: 0 0 20px var(--color-accent-glow, rgba(193,127,89,0.3)); }
```

#### Line Chart

```css
.line-chart { position: relative; flex: 1; }
.line-path { fill: none; stroke: var(--color-accent); stroke-width: 3px; }
.line-dot { width: 10px; height: 10px; border-radius: 50%; background: var(--color-accent); position: absolute; }
.line-dot.highlight { width: 14px; height: 14px; box-shadow: 0 0 12px var(--color-accent); }
```

Use SVG `<polyline>` for the line path inside the chart zone. Position dots absolutely based on data point coordinates.

#### Donut Chart

```css
.donut { width: 320px; height: 320px; border-radius: 50%; background: conic-gradient(/* segments */); margin: auto; position: relative; }
.donut-hole { position: absolute; inset: 25%; border-radius: 50%; background: var(--color-surface); display: flex; align-items: center; justify-content: center; }
.donut-center-value { font-size: 48px; font-weight: 700; color: var(--color-accent); }
```

Build the `conic-gradient` from data percentages. Each segment uses a color from the style palette.

#### Metric Card

```css
.metric-hero { font-size: 72px; font-weight: 700; color: var(--color-accent); line-height: 1; }
.metric-change { display: inline-flex; padding: 4px 12px; border-radius: 999px; font-size: 16px; font-weight: 600; }
.metric-change.positive { background: rgba(34,197,94,0.15); color: #22c55e; }
.metric-change.negative { background: rgba(239,68,68,0.15); color: #ef4444; }
```

#### Comparison

```css
.comparison { display: grid; grid-template-columns: 1fr auto 1fr; gap: 32px; flex: 1; align-items: center; }
.comparison-divider { width: 2px; height: 80%; background: var(--color-border); }
.comparison-arrow { font-size: 32px; color: var(--color-accent); }
```

#### Area Chart

Same as line chart but with a filled gradient below the line:

```css
.area-fill { fill: url(#area-gradient); opacity: 0.3; }
```

Use SVG `<linearGradient>` with the style's accent color fading to transparent.

## 7. Screenshot Export

Use Playwright to capture the rendered HTML as PNG.

```bash
npx playwright screenshot index.html chart.png --viewport-size=1080,1080
```

Or use the goose-graphics screenshot pipeline if available in the environment.

If Playwright is not installed:
```bash
npx playwright install chromium
```

## 8. Delivery

Present the user with:
1. The rendered PNG file
2. The source HTML file (for future edits)
3. A one-line summary: "Here's your [chart type] in [style name] at [dimensions]."

## 9. Quality checklist

Before delivering, verify:

- [ ] Chart renders at exact pixel dimensions (no scrollbars)
- [ ] All text is readable (minimum 11px, proper contrast)
- [ ] Style colors match the chosen gooseworks style
- [ ] The hero data point uses the accent color
- [ ] Card has rounded corners and proper padding
- [ ] No raw/default browser styling visible
- [ ] Source attribution present if data is external
- [ ] Google Fonts loaded (check `<link>` tag)
