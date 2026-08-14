---
name: graphic-chart
description: Generate polished chart graphics from structured data as HTML first, then screenshot to PNG. Use when the user needs a bar, line, pie, doughnut, scatter, area, radar, or treemap chart for social posts, reports, blog posts, or decks, wants Gooseworks-compatible styling, and can provide JSON or CSV data plus an explicit chart type.
tags: [content, design]
---

# Graphic Chart

Generate a data visualization as HTML first, then screenshot it into a high-quality PNG.

This skill is for turning structured data into presentable chart graphics for social media, blog posts, internal reports, or slide decks. The chart is not the point by itself. The data story is the point.

## Core Promise

1. Accept structured data and a chart type
2. Choose the right rendering engine
3. Apply a presentation-safe visual style
4. Render HTML with chart labels, context, and optional highlights
5. Screenshot the final chart to PNG

## Best Fit

- Revenue or growth charts for social posts
- KPI comparison charts for reports
- Trend charts for blog posts or newsletters
- Correlation charts for analysis
- Treemaps or radar charts for custom explainer visuals
- Deck-ready chart graphics for slides

## Use Something Else

- If the user needs help finding external data first, consider `data-charts-tako`.
- If the user wants a full dashboard or interactive app, use `create-dashboard`.
- If the user wants a more general static graphic rather than a data chart, use `goose-graphics`.

## Accepted Inputs

Required:

- `chart_type`
- `data`

Optional:

- `title`
- `subtitle`
- `style`
- `dimensions`
- `x_label`
- `y_label`
- `source`
- `highlight`

## Supported Chart Types

| Type | Best For | Default Renderer |
|------|----------|------------------|
| `bar` | Comparing categories | Chart.js |
| `line` | Trends over time | Chart.js |
| `pie` | Part-to-whole | Chart.js |
| `doughnut` | Part-to-whole with stronger center focus | Chart.js |
| `scatter` | Correlations | Chart.js |
| `area` | Cumulative or filled trend visuals | Chart.js |
| `radar` | Multi-dimensional comparison | Chart.js |
| `treemap` | Hierarchical proportional values | D3.js |

## Renderer Rules

Use **Chart.js** for standard charts:

- `bar`
- `line`
- `pie`
- `doughnut`
- `scatter`
- `area`
- `radar`

Use **D3.js** for:

- `treemap`
- cases where the user requests a custom annotation or layout that Chart.js would fight

Choose the simplest renderer that can produce the correct result cleanly.

## Input Rules

### Data Must Be Structured

Accept:

- JSON
- CSV

Do not accept vague prose like "make a chart about growth."

If the user gives unstructured prose, stop and ask for the actual dataset or derive a clear dataset only when the numbers are explicitly present in the prompt.

### Chart Type Must Be Explicit

If the user says only "make a chart," ask which type fits the story:

- comparison -> `bar`
- trend over time -> `line`
- part-to-whole -> `pie` or `doughnut`
- correlation -> `scatter`
- cumulative trend -> `area`
- multi-factor profile -> `radar`
- hierarchical split -> `treemap`

## Style Guidance

Prioritize legibility over flair.

Recommended defaults:

- `clean-slate`
- `matt-gray`
- `brutalist`
- `paper-and-ink`
- `retro-line-art`

If the user names a style, verify it exists first:

```bash
npx gooseworks styles list
npx gooseworks styles search "paper and ink"
npx gooseworks styles get <slug>
```

If they provide no style, default to `clean-slate`.

## Output Defaults

- Output file: `chart.png`
- Default size: `1080x1080`
- Format: PNG

Good alternate dimensions:

- `1920x1080` for decks
- `1200x630` for blog/social card usage
- `1080x1350` for portrait social posts

## Workflow

### Step 1 - Understand the Data Story

Before rendering anything, resolve:

1. What comparison or trend matters
2. What should stand out
3. What the reader should notice first
4. Whether there is a specific point to highlight

If the chart has no clear takeaway, ask for the intended story.

### Step 2 - Validate the Dataset

Check:

- Data shape matches chart type
- Labels and values align
- Numeric fields are truly numeric
- Time-series order is correct
- Category names are spelled correctly
- No impossible or missing values unless intentionally represented

Examples:

- `bar` / `pie` / `doughnut`: category labels + one or more values
- `line` / `area`: ordered x values plus numeric y values
- `scatter`: x/y numeric pairs
- `radar`: dimensions plus numeric values
- `treemap`: hierarchy or grouped values with proportional sizes

If the dataset is malformed, fix obvious formatting issues only when unambiguous. Otherwise ask.

### Step 3 - Choose the Layout

Decide on:

- Canvas size
- Chart padding
- Title and subtitle placement
- Axis label treatment
- Source footer placement
- Highlight annotation placement

The chart must still read well after screenshoting and compression.

### Step 4 - Build the HTML

Generate a self-contained HTML file that:

- loads Chart.js or D3.js
- creates a fixed-size chart artboard
- applies the chosen style
- renders the chart
- includes optional title, subtitle, source, and highlight treatment

Recommended output structure:

```text
chart/[name]/
  chart.html
  chart.png
```

Optional:

```text
chart/[name]/
  data.json
  data.csv
```

### Step 5 - Screenshot

Use the Gooseworks screenshot pipeline after HTML generation.

If using the standard `chart` format:

```bash
node <path-to>/goose-graphics/screenshot/screenshot.js --format chart --input <path-to-chart.html> --output <output-dir>
```

If dimensions are nonstandard and the chart format does not match the requested canvas cleanly, adapt the HTML artboard carefully before capture or use a custom screenshot path only if absolutely necessary.

## Renderer-Specific Guidance

### Chart.js Guidance

Use Chart.js when the chart is conventional and the main need is fast, clean rendering.

Preferred choices:

- `bar` for clear category comparison
- `line` for time trends
- `doughnut` over `pie` when center whitespace improves composition
- `area` by using a filled line series

Keep:

- gridlines subtle
- labels readable
- legend only if necessary
- animations optional, not required for output

### D3.js Guidance

Use D3 when:

- the chart is a `treemap`
- a custom annotation or layout is required
- the chart needs fine control beyond standard configs

For D3:

- compute exact layout before styling
- use text hierarchy carefully
- avoid over-complicated interaction since final output is a screenshot

## Highlighting Rules

If `highlight` is provided:

- visually emphasize only the intended point or category
- de-emphasize the rest slightly
- use color, stroke, label callout, or annotation box
- do not make the chart unreadable by over-annotating

Examples:

- Highlight `Q4` in gold
- Add a value label to the highest bar
- Add a small note next to an outlier point

## Annotation Rules

Optional additions:

- Title
- Subtitle
- Source footer
- One clear annotation

Do not add all of them by default if the canvas is too tight.

If the chart is for social, title and one annotation usually matter most.
If the chart is for a report or deck, source attribution matters more.

## Legibility Rules

- Axis labels must survive PNG export
- Avoid tiny legend text
- Avoid more than necessary categories on small canvases
- If the chart is overloaded, split it or simplify it
- Use contrast that matches the chosen style but keeps the data readable

Never sacrifice legibility for brand aesthetic.

## Recommended Visual Hierarchy

1. Title
2. Main chart shape
3. Highlight or key contrast
4. Axis/context labels
5. Source line

The reader should understand the takeaway before they read the fine print.

## Quality Checks

Before delivery, verify:

- Chart type matches the data story
- Data points are accurate
- Highlight targets the intended item
- Title and subtitle are not misleading
- Source text is present when provided
- The final PNG reads clearly at intended size

## Success Criteria

A strong output from this skill should feel:

- immediately understandable
- visually clean
- accurate to the provided data
- presentation-ready for social, reports, or decks

## Dependencies

Required skill:

- `goose-graphics`

Recommended style-compatible skills:

- `goose-graphics-create-style`

## Example Request

```text
Create a line chart. Title: "From $12k to $95k ARR in 12 Months". Data: [12, 18, 22, 25, 31, 38, 44, 52, 61, 68, 78, 95] for Jan-Dec 2024 in thousands. Highlight December in gold. Source: Internal CRM. Style: terminal. Dimensions: 1080x1080.
```

Expected output:

- chart HTML
- screenshot PNG
- a clear line chart with December emphasized
