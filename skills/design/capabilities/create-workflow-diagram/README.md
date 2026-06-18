# Workflow Diagram Creator

Create FigJam/Miro-style workflow diagrams as high-quality PNG images from plain-text descriptions.

## Quick Start

1. **Describe your workflow:**
   - "Find leads on Apollo → Enrich with Clay → Qualify with Claude → Send to Smartlead"
   - "PR opened → CI runs → Code review → Merge → Deploy"

2. **Choose a style** (or use the default FigJam Classic)

3. **Get your diagram:**
   - HTML file for preview
   - PNG export ready to share

---

## What This Skill Does

- Parses plain-text workflow descriptions into structured nodes
- Generates positioned HTML diagrams with SVG arrows
- Auto-assigns icons based on action keywords
- Screenshots the diagram as a high-quality PNG
- Supports multiple layouts (horizontal, vertical, snake)

---

## First Time Setup

The screenshot tool needs Playwright:

```bash
cd /path/to/skills/create-workflow-diagram
npm install
npm run setup  # Installs Chromium browser
```

This only needs to be done once.

---

## Available Styles

| Style | Best For |
|-------|----------|
| **FigJam Classic** | General workflows, team presentations |
| **Blueprint** | Technical architectures, DevOps pipelines |
| **Minimal White** | Documentation, formal presentations |
| **Neon Flow** | AI/tech content, LinkedIn posts |
| **Pastel Board** | Client presentations, non-technical audiences |

See `STYLE_PRESETS.md` for visual details.

---

## Output Sizes

| Size | Dimensions | Best For |
|------|-----------|----------|
| Landscape | 1920×1080 | Presentations, docs, Slack |
| Square | 1080×1080 | LinkedIn, social media |
| Wide | 1200×630 | Blog headers, social cards |

---

## File Structure

After generation:

```
[diagram-name]/
├── diagram.html          # Full diagram HTML
└── exports/
    └── diagram.png       # Screenshot PNG
```

---

## Example Session

```
You: "Create a diagram for: Find leads on Apollo → Enrich with Clay → Qualify with Claude → Send to Smartlead"

Agent: I'll create that diagram. Quick questions:
       - Layout: Left to right, top to bottom, or snake?
       - Size: Landscape (1920×1080), square, or wide?
       - Style: FigJam Classic, Blueprint, Minimal, Neon, or Pastel?

You: Left to right, landscape, FigJam Classic

Agent: *generates HTML diagram + screenshot*

       Your workflow diagram is ready!
       📁 Location: skills/create-workflow-diagram/lead-gen-pipeline/
       📤 PNG: exports/diagram.png (1920×1080, 350KB)
```

---

## Files in This Skill

- `SKILL.md` — Complete documentation and workflow
- `STYLE_PRESETS.md` — Visual style reference
- `screenshot-diagram.js` — Automated PNG export script
- `package.json` — Dependencies (Playwright)
- `README.md` — This file
