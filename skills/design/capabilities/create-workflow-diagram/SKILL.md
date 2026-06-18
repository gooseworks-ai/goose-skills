---
name: create-workflow-diagram
description: Create FigJam/Miro-style workflow diagrams as high-quality PNG images from plain-text workflow descriptions. Renders beautiful HTML diagrams with connected nodes, arrows, and labels, then screenshots them for sharing.
---

# Workflow Diagram Creator

Create FigJam/Miro-style workflow diagrams as PNG images. This skill takes a plain-text workflow description and generates a styled HTML diagram with connected nodes, directional arrows, and labels — then automatically screenshots it for sharing in docs, Slack, LinkedIn, or presentations.

## Core Philosophy

1. **Visual Clarity** — Each step is a distinct node with clear connections
2. **FigJam/Miro Aesthetic** — Colorful, rounded, friendly diagram style
3. **Automated Export** — Generate HTML → Screenshot → PNG ready to share
4. **Smart Layout** — Automatically arranges nodes in logical flow patterns
5. **One-Command** — Describe workflow in plain text, get a polished diagram

---

## Output Specs

**Format:** PNG image
- **Default size:** 1920×1080px (landscape, presentation-friendly)
- **Alternative sizes:** 1080×1080px (square, LinkedIn), 1200×630px (blog/social)
- **File format:** PNG
- **File size:** Under 5MB

---

## When to Use This Skill

Use for workflow/process diagrams like:
- "Find leads on Apollo → Enrich with Clay → Qualify with Claude → Send to Smartlead"
- "User signs up → Onboarding email → Trial → Upgrade prompt → Paid"
- "PR opened → CI runs → Review → Approve → Merge → Deploy"
- "Scrape data → Clean → Enrich → Score → Route to CRM"

**NOT for:**
- Org charts or hierarchy diagrams (use a tree layout tool)
- Complex flowcharts with many branches (use draw.io)
- Data architecture diagrams (use Mermaid or similar)
- Simple text lists (just use bullet points)

---

## Workflow Overview

```
1. Content Input → User describes the workflow in plain text
2. Parse Steps → Extract nodes, connections, and labels
3. Style Selection → Choose visual style
4. HTML Generation → Create positioned diagram with SVG arrows
5. Screenshot → Auto-capture as PNG
6. Delivery → PNG file ready to share
```

---

## Phase 1: Content Discovery

### Step 1.1: Get Workflow Description

Ask the user:

**Question 1: What's the workflow?**
- Header: "Workflow"
- Question: "Describe the workflow steps. Use arrows (→) or numbers to show the flow."
- (Free text input)
- Examples:
  - "1. Find leads on Apollo → 2. Enrich with Clay → 3. Qualify with Claude → 4. Send to Smartlead"
  - "Scrape Reddit → Filter relevant posts → Draft comments → Send to Slack for review → Post"

**Question 2: Layout Direction**
- Header: "Layout"
- Question: "How should the diagram flow?"
- Options:
  - "Left to Right" — Horizontal flow (default, best for 4-8 steps)
  - "Top to Bottom" — Vertical flow (best for 3-5 steps)
  - "Snake/Zigzag" — Wraps to next row (best for 6+ steps)

**Question 3: Diagram Size**
- Header: "Size"
- Question: "What size works best for your use case?"
- Options:
  - "Landscape (1920×1080)" — Presentations, docs, Slack (default)
  - "Square (1080×1080)" — LinkedIn, social media
  - "Wide (1200×630)" — Blog headers, social cards

### Step 1.2: Parse the Workflow

Extract structured data from the user's description:

```
Input: "1. Find leads on Apollo → 2. Enrich with Clay → 3. Qualify with Claude → 4. Send to Smartlead via API"

Parsed:
nodes:
  - id: 1, label: "Find leads", detail: "Apollo", icon: "🔍"
  - id: 2, label: "Enrich leads", detail: "Clay", icon: "✨"
  - id: 3, label: "Qualify leads", detail: "Claude", icon: "🤖"
  - id: 4, label: "Send to Smartlead", detail: "via API", icon: "📤"

connections:
  - from: 1, to: 2
  - from: 2, to: 3
  - from: 3, to: 4
```

**Parsing rules:**
- Split on `→`, `->`, `>`, numbered lists, or line breaks
- Extract the primary action (label) and the tool/platform (detail)
- Auto-assign relevant emoji icons based on the action
- Detect branching if words like "if", "or", "else" appear

**Icon assignment heuristics:**
| Action keyword | Icon |
|---------------|------|
| find, search, discover | 🔍 |
| enrich, enhance, augment | ✨ |
| qualify, score, filter | 🎯 |
| send, email, outreach | 📤 |
| scrape, crawl, extract | 🕷️ |
| analyze, research | 📊 |
| review, approve | ✅ |
| deploy, ship, launch | 🚀 |
| store, save, database | 💾 |
| AI, Claude, GPT | 🤖 |
| alert, notify, Slack | 🔔 |
| clean, transform | 🧹 |
| merge, combine | 🔗 |
| schedule, automate | ⏰ |

---

## Phase 2: Style Selection

### Style Options

**Question: Pick a Style**
- Header: "Style"
- Question: "Which visual style?"
- Options:
  - "FigJam Classic" — Colorful sticky-note nodes on dotted canvas (default)
  - "Blueprint" — Technical dark theme with grid lines
  - "Minimal White" — Clean white with thin borders and subtle shadows
  - "Neon Flow" — Dark background with glowing neon connections
  - "Pastel Board" — Soft pastel nodes on light background

See STYLE_PRESETS.md for full details on each style.

---

## Phase 3: Generate HTML Diagram

### File Structure

```
skills/create-workflow-diagram/[diagram-name]/
├── diagram.html               # Full diagram page
└── exports/
    └── diagram.png            # Screenshot (generated in Phase 4)
```

### HTML Architecture

The diagram is built with pure HTML/CSS using absolute positioning for nodes and SVG for arrows.

**CRITICAL: Use absolute positioning for precise node placement. Use SVG overlay for arrows/connections.**

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Workflow Diagram</title>

    <!-- Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">

    <style>
        /* ===========================================
           WORKFLOW DIAGRAM
           =========================================== */
        :root {
            --diagram-width: 1920px;
            --diagram-height: 1080px;

            /* Colors (from chosen preset) */
            --bg-primary: #f5f5f0;
            --bg-dot-color: #d4d4d0;
            --node-shadow: 0 4px 12px rgba(0,0,0,0.08);
            --arrow-color: #666;
            --text-primary: #1a1a1a;
            --text-secondary: #666;

            /* Node colors (cycle through for each node) */
            --node-1: #FFE066;  /* Yellow */
            --node-2: #A8D8EA;  /* Blue */
            --node-3: #C3F0CA;  /* Green */
            --node-4: #F0B4D4;  /* Pink */
            --node-5: #D4BAFF;  /* Purple */
            --node-6: #FFB366;  /* Orange */

            /* Typography */
            --font-family: 'Inter', -apple-system, sans-serif;
            --node-title-size: 22px;
            --node-detail-size: 15px;
            --node-icon-size: 36px;

            /* Node dimensions */
            --node-width: 220px;
            --node-min-height: 120px;
            --node-padding: 24px;
            --node-radius: 16px;
            --node-gap: 80px;  /* gap between nodes for arrows */
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        html, body {
            width: var(--diagram-width);
            height: var(--diagram-height);
            overflow: hidden;
        }

        body {
            font-family: var(--font-family);
            background: var(--bg-primary);
            position: relative;
        }

        /* Dotted grid background (FigJam-style) */
        .canvas-bg {
            position: absolute;
            width: 100%;
            height: 100%;
            background-image: radial-gradient(circle, var(--bg-dot-color) 1.2px, transparent 1.2px);
            background-size: 24px 24px;
            z-index: 0;
        }

        /* Diagram container */
        .diagram {
            position: absolute;
            width: 100%;
            height: 100%;
            z-index: 1;
        }

        /* SVG arrow layer */
        .arrows-layer {
            position: absolute;
            width: 100%;
            height: 100%;
            z-index: 1;
            pointer-events: none;
        }

        /* Workflow node */
        .node {
            position: absolute;
            width: var(--node-width);
            min-height: var(--node-min-height);
            padding: var(--node-padding);
            border-radius: var(--node-radius);
            box-shadow: var(--node-shadow);
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;
            gap: 8px;
            z-index: 2;
            border: 2px solid rgba(0,0,0,0.06);
        }

        .node-icon {
            font-size: var(--node-icon-size);
            line-height: 1;
        }

        .node-label {
            font-size: var(--node-title-size);
            font-weight: 700;
            color: var(--text-primary);
            line-height: 1.2;
        }

        .node-detail {
            font-size: var(--node-detail-size);
            font-weight: 500;
            color: var(--text-secondary);
            opacity: 0.8;
        }

        .node-step {
            position: absolute;
            top: -12px;
            left: -12px;
            width: 32px;
            height: 32px;
            border-radius: 50%;
            background: var(--text-primary);
            color: white;
            font-size: 14px;
            font-weight: 700;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        /* Title overlay */
        .diagram-title {
            position: absolute;
            top: 40px;
            left: 50%;
            transform: translateX(-50%);
            font-size: 32px;
            font-weight: 700;
            color: var(--text-primary);
            z-index: 3;
            text-align: center;
        }

        .diagram-subtitle {
            position: absolute;
            top: 82px;
            left: 50%;
            transform: translateX(-50%);
            font-size: 18px;
            font-weight: 400;
            color: var(--text-secondary);
            z-index: 3;
        }
    </style>
</head>
<body>
    <div class="canvas-bg"></div>

    <!-- Optional title -->
    <div class="diagram-title">Lead Generation Pipeline</div>
    <div class="diagram-subtitle">Apollo → Clay → Claude → Smartlead</div>

    <div class="diagram">
        <!-- SVG arrows connecting nodes -->
        <svg class="arrows-layer" viewBox="0 0 1920 1080" xmlns="http://www.w3.org/2000/svg">
            <!-- Arrow from node 1 to node 2 -->
            <defs>
                <marker id="arrowhead" markerWidth="12" markerHeight="8" refX="10" refY="4" orient="auto">
                    <path d="M 0 0 L 12 4 L 0 8 Z" fill="var(--arrow-color)" />
                </marker>
            </defs>
            <!-- Connection lines drawn between node centers -->
            <line x1="380" y1="490" x2="520" y2="490"
                  stroke="var(--arrow-color)" stroke-width="3"
                  stroke-dasharray="8,6" marker-end="url(#arrowhead)" />
            <!-- Repeat for each connection -->
        </svg>

        <!-- Nodes -->
        <div class="node" style="left: 160px; top: 420px; background: var(--node-1);">
            <span class="node-step">1</span>
            <span class="node-icon">🔍</span>
            <span class="node-label">Find Leads</span>
            <span class="node-detail">Apollo</span>
        </div>

        <div class="node" style="left: 560px; top: 420px; background: var(--node-2);">
            <span class="node-step">2</span>
            <span class="node-icon">✨</span>
            <span class="node-label">Enrich Leads</span>
            <span class="node-detail">Clay</span>
        </div>

        <!-- ... more nodes ... -->
    </div>
</body>
</html>
```

### Layout Algorithms

**Left-to-Right (default for 4-8 steps):**
```
Position each node evenly across the width:
- totalWidth = diagramWidth - (2 * margin)
- nodeSpacing = totalWidth / (nodeCount - 1)
- node[i].x = margin + (i * nodeSpacing) - (nodeWidth / 2)
- node[i].y = (diagramHeight / 2) - (nodeHeight / 2)

For the default 1920×1080 with 4 nodes:
- margin = 200px
- spacing = ~507px
- y = ~460px (vertically centered)
```

**Top-to-Bottom (3-5 steps):**
```
- totalHeight = diagramHeight - (2 * margin)
- nodeSpacing = totalHeight / (nodeCount - 1)
- node[i].y = margin + (i * nodeSpacing) - (nodeHeight / 2)
- node[i].x = (diagramWidth / 2) - (nodeWidth / 2)
```

**Snake/Zigzag (6+ steps):**
```
- maxPerRow = 4
- rowHeight = 250px
- For each row, alternate left-to-right and right-to-left
- Row 0: nodes flow →
- Row 1: nodes flow ←
- Row 2: nodes flow →
- Connect last node of row to first node of next row with vertical arrow
```

### Arrow Drawing

Arrows are drawn as SVG lines between node edges:

```javascript
// Calculate arrow coordinates between two nodes
function getArrowCoords(fromNode, toNode, direction) {
    if (direction === 'horizontal') {
        // Arrow from right edge of fromNode to left edge of toNode
        const x1 = fromNode.x + fromNode.width;
        const y1 = fromNode.y + fromNode.height / 2;
        const x2 = toNode.x;
        const y2 = toNode.y + toNode.height / 2;
        return { x1, y1, x2, y2 };
    }
    if (direction === 'vertical') {
        // Arrow from bottom of fromNode to top of toNode
        const x1 = fromNode.x + fromNode.width / 2;
        const y1 = fromNode.y + fromNode.height;
        const x2 = toNode.x + toNode.width / 2;
        const y2 = toNode.y;
        return { x1, y1, x2, y2 };
    }
}
```

For **curved arrows** (more FigJam-like), use SVG `<path>` with cubic bezier:

```html
<path d="M 380,490 C 430,490 470,490 520,490"
      stroke="var(--arrow-color)" stroke-width="3"
      fill="none" stroke-dasharray="8,6"
      marker-end="url(#arrowhead)" />
```

For **snake layout** vertical connectors between rows:

```html
<!-- Vertical connector from end of row 1 to start of row 2 -->
<path d="M 1500,550 C 1500,620 200,620 200,690"
      stroke="var(--arrow-color)" stroke-width="3"
      fill="none" stroke-dasharray="8,6"
      marker-end="url(#arrowhead)" />
```

### Branching (Optional)

If the workflow has conditional branches:

```
Step 3: Qualify leads
  ├── Yes → Step 4a: Send to Smartlead
  └── No → Step 4b: Add to nurture sequence
```

Render as:
- Main node for step 3
- Two arrows diverging from step 3
- Label on each arrow ("Qualified" / "Not Qualified")
- Two destination nodes

```html
<!-- Branch label on arrow -->
<text x="650" y="400" font-size="14" fill="var(--text-secondary)"
      font-family="Inter" font-weight="600">Qualified</text>
```

---

## Phase 4: Screenshot Generation

After generating HTML, automatically capture a screenshot.

### Using Playwright

```bash
cd /path/to/skills/create-workflow-diagram
node screenshot-diagram.js <diagram-name>
```

This will:
1. Open the diagram HTML in a headless browser
2. Set viewport to the diagram dimensions (e.g., 1920×1080)
3. Wait for fonts to load
4. Capture PNG screenshot at 2x resolution
5. Save to the diagram's `exports/` directory

### Installation

First time setup:
```bash
cd /path/to/skills/create-workflow-diagram
npm install
```

---

## Phase 5: Delivery

After the screenshot is generated, present to user:

```
Your workflow diagram is ready!

HTML source: skills/create-workflow-diagram/[name]/diagram.html
PNG export: skills/create-workflow-diagram/[name]/exports/diagram.png

Preview: Open diagram.html in a browser to see the full diagram.

Diagram details:
- 4 workflow steps connected with arrows
- Style: FigJam Classic
- Size: 1920×1080px (landscape)
- File size: ~350 KB

Want to make any changes?
```

---

## Node Sizing Rules

Keep nodes consistent and readable:

| Element | Size |
|---------|------|
| Node width | 200-240px |
| Node min-height | 110-140px |
| Node padding | 20-28px |
| Icon | 32-40px |
| Label font | 20-24px, weight 700 |
| Detail font | 14-16px, weight 500 |
| Step badge | 28-34px circle |
| Arrow stroke | 2-3px |
| Arrow gap | 60-100px between nodes |

### Content Rules

Each node should have:
1. **Step number** — Badge in top-left corner
2. **Icon** — Relevant emoji (auto-assigned from keyword)
3. **Label** — Action in 2-4 words (e.g., "Find Leads")
4. **Detail** — Tool/platform name (e.g., "Apollo") — optional

If a label is too long, truncate or split across lines. Max 2 lines for label.

---

## Troubleshooting

### Nodes Overlap
**Solution:** Increase `--node-gap` or switch to snake layout for many nodes.

### Arrows Misaligned
**Solution:** Recalculate arrow start/end points based on actual node positions. Use the center of the node edge closest to the target.

### Fonts Not Loading
**Solution:** Add `await page.waitForLoadState('networkidle')` before screenshot. Increase timeout to 1000ms.

### Diagram Too Crowded
**Solution:** Reduce node count by combining steps, switch to a larger canvas size, or use snake layout.

---

## Style Quick Reference

| Preset | Best For | Vibe |
|--------|----------|------|
| FigJam Classic | General workflows | Friendly, colorful |
| Blueprint | Technical processes | Professional, dark |
| Minimal White | Documentation | Clean, corporate |
| Neon Flow | Tech/AI workflows | Futuristic, bold |
| Pastel Board | Presentations | Soft, approachable |

See STYLE_PRESETS.md for complete styling details.

---

## Related Skills

- **create-html-carousel** — For multi-slide LinkedIn carousels
- **frontend-slides** — For full HTML presentations

---

## Example Session Flow

1. User: "Create a diagram for: Find leads on Apollo → Enrich with Clay → Qualify with Claude → Send to Smartlead"
2. Skill asks: layout direction, size, style
3. User picks defaults (left-to-right, landscape, FigJam Classic)
4. Skill parses 4 nodes with auto-icons
5. Skill generates HTML diagram with positioned nodes and SVG arrows
6. Skill runs screenshot script
7. Skill delivers PNG file
8. User shares in Slack/docs/LinkedIn

Total time: 2-5 minutes from description to exported diagram.
