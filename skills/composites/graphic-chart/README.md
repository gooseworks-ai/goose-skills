# graphic-chart

Designed data visualization skill for the Agent Skills ecosystem. Produces publication-ready chart graphics using pure HTML/CSS with gooseworks style integration.

## What it does

Generates polished, designed chart graphics — not Matplotlib defaults. Every chart is a single HTML file rendered to PNG via Playwright, styled with the [gooseworks style catalog](https://github.com/gooseworks-ai/goose-skills/tree/main/skills/composites/goose-graphics/styles).

## Chart types

| Type | Description |
|------|-------------|
| `bar` | Vertical/horizontal bars for comparison and growth |
| `line` | Trend lines connecting data points over time |
| `donut` | Proportional segments in a ring with center stat |
| `metric` | Hero number with trend indicator and sparkline |
| `comparison` | Before/after or side-by-side stat cards |
| `area` | Filled line chart showing volume over time |

## Quick start

```bash
# Install
npx goose-skills install graphic-chart

# Bar chart with neon dashboard style
/graphic-chart --type bar --style neon-dashboard --title "Q1 Revenue" \
  --data '[{"label":"Jan","value":42},{"label":"Feb","value":58},{"label":"Mar","value":73}]'

# Metric card
/graphic-chart --type metric --style clean-slate --title "Active Users" \
  --data '{"value":"2.4M","change":"+18%","period":"vs last month"}'

# Donut from reference image
/graphic-chart --type donut --ref ~/brand.png --title "Market Share" \
  --data '[{"label":"Us","value":34},{"label":"Others","value":66}]'
```

## Design principles

- **Pure HTML/CSS** — no JavaScript charting libraries, no Matplotlib
- **Style-driven** — colors, typography, and spacing from gooseworks style specs
- **One story per chart** — each graphic communicates a single insight
- **The last data point is the hero** — highlighted with accent color + glow
- **Designed, not raw** — rounded cards, proper typography hierarchy, intentional white space

## Size presets

| Preset | Dimensions | Use case |
|--------|-----------|----------|
| `square` | 1080x1080 | Social media (IG, LinkedIn) |
| `landscape` | 1200x630 | Blog OG images, Twitter cards |
| `wide` | 1920x1080 | Slide decks, presentations |

## Style compatibility

Works with any gooseworks style. Recommended pairings:

- **Dashboard**: `neon-dashboard`, `clean-slate`, `terminal`
- **Executive**: `midnight-editorial`, `golden-dusk`, `deep-ocean`
- **Marketing**: `electric-burst`, `coral-halftone`, `peach-pop`
- **Editorial**: `paper-and-ink`, `warm-earth`, `gradient-editorial`

## Author

[eltociear](https://github.com/eltociear) — builder of MCP security audit tools and agent economy infrastructure.
