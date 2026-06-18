# Workflow Diagram Style Presets

Visual styles for workflow diagrams. All styles support landscape (1920×1080), square (1080×1080), and wide (1200×630) formats.

---

## 1. FigJam Classic (Default)

**Vibe:** Friendly, collaborative, colorful — like a real FigJam/Miro board

**Best for:** General workflows, team presentations, brainstorming outputs

**Typography:**
- Font: `Inter` (400/500/600/700)

**Colors:**
```css
:root {
    --bg-primary: #f5f5f0;
    --bg-dot-color: #d4d4d0;
    --arrow-color: #555;
    --text-primary: #1a1a1a;
    --text-secondary: #666;

    /* Node colors (sticky-note palette) */
    --node-1: #FFE066;  /* Yellow */
    --node-2: #A8D8EA;  /* Blue */
    --node-3: #C3F0CA;  /* Green */
    --node-4: #F0B4D4;  /* Pink */
    --node-5: #D4BAFF;  /* Purple */
    --node-6: #FFB366;  /* Orange */
    --node-7: #B8E6D0;  /* Mint */
    --node-8: #F0D4A8;  /* Peach */
}
```

**Canvas:**
- Light warm gray background with dotted grid pattern
- Dots: 1.2px radius, 24px spacing

**Nodes:**
- Rounded rectangle (16px radius)
- Solid colored background (cycle through palette)
- Subtle shadow: `0 4px 12px rgba(0,0,0,0.08)`
- Thin border: `2px solid rgba(0,0,0,0.06)`
- Step number badge: dark circle in top-left corner

**Arrows:**
- Dashed lines: `stroke-dasharray="8,6"`
- Arrow color: `#555`
- Arrowhead: filled triangle
- Stroke width: 3px

**Signature Elements:**
```html
<style>
    /* Dotted canvas background */
    .canvas-bg {
        background-image: radial-gradient(circle, #d4d4d0 1.2px, transparent 1.2px);
        background-size: 24px 24px;
    }

    /* Sticky-note style node */
    .node {
        border-radius: 16px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.08);
        border: 2px solid rgba(0,0,0,0.06);
        /* Slight rotation for hand-drawn feel (optional) */
    }

    /* Optional: slight random rotation per node for organic feel */
    .node:nth-child(odd) { transform: rotate(-1deg); }
    .node:nth-child(even) { transform: rotate(0.5deg); }
</style>
```

---

## 2. Blueprint

**Vibe:** Technical, precise, professional — like an engineering diagram

**Best for:** Technical architectures, API flows, DevOps pipelines

**Typography:**
- Display: `JetBrains Mono` or `IBM Plex Mono` (500/700)
- Body: `IBM Plex Sans` (400/500)

**Colors:**
```css
:root {
    --bg-primary: #0a1628;
    --bg-grid-color: rgba(60, 130, 220, 0.12);
    --arrow-color: #3c82dc;
    --text-primary: #e8edf5;
    --text-secondary: #8899bb;

    /* Node colors (blue spectrum) */
    --node-1: #1a3a5c;
    --node-2: #1a4a3c;
    --node-3: #3a2a5c;
    --node-4: #4a2a2a;
    --node-5: #2a3a1a;
    --node-6: #3a3a1a;

    --node-border: #3c82dc;
    --node-glow: rgba(60, 130, 220, 0.2);
}
```

**Canvas:**
- Dark navy background with fine grid lines
- Grid: 1px lines, 40px spacing, low opacity blue

**Nodes:**
- Rounded rectangle (8px radius — more angular)
- Dark colored background with glowing blue border
- Border: `2px solid var(--node-border)`
- Shadow: `0 0 20px var(--node-glow)`

**Arrows:**
- Solid lines (not dashed)
- Bright blue color with glow
- Stroke width: 2px
- `filter: drop-shadow(0 0 4px rgba(60,130,220,0.5))`

**Signature Elements:**
```html
<style>
    .canvas-bg {
        background-image:
            linear-gradient(var(--bg-grid-color) 1px, transparent 1px),
            linear-gradient(90deg, var(--bg-grid-color) 1px, transparent 1px);
        background-size: 40px 40px;
    }

    .node {
        border: 2px solid var(--node-border);
        box-shadow: 0 0 20px var(--node-glow);
        border-radius: 8px;
    }

    /* Monospace labels for tech feel */
    .node-label {
        font-family: 'JetBrains Mono', 'IBM Plex Mono', monospace;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }
</style>
```

---

## 3. Minimal White

**Vibe:** Clean, corporate, documentation-ready

**Best for:** Business documents, wikis, Notion embeds, formal presentations

**Typography:**
- Font: `Inter` (400/500/600/700)

**Colors:**
```css
:root {
    --bg-primary: #ffffff;
    --arrow-color: #999;
    --text-primary: #1a1a1a;
    --text-secondary: #888;

    /* Node colors (muted, professional) */
    --node-bg: #ffffff;
    --node-border-1: #e0e0e0;
    --node-border-2: #d0d0d0;
    --node-accent-1: #4A90D9;
    --node-accent-2: #50B86C;
    --node-accent-3: #E8913A;
    --node-accent-4: #D94A6B;
    --node-accent-5: #8B6BD9;
    --node-accent-6: #4AB8B8;
}
```

**Canvas:**
- Pure white, no grid or dots

**Nodes:**
- White background with thin gray border
- Colored left-edge accent strip (4px wide)
- Clean shadow: `0 2px 8px rgba(0,0,0,0.06)`
- Border radius: 12px

**Arrows:**
- Thin solid lines (1.5px)
- Light gray color
- Small arrowhead

**Signature Elements:**
```html
<style>
    .node {
        background: white;
        border: 1px solid #e0e0e0;
        border-left: 4px solid var(--accent-color);
        box-shadow: 0 2px 8px rgba(0,0,0,0.06);
        border-radius: 12px;
    }

    /* No step badge — use accent strip color to differentiate */
    .node-step { display: none; }

    /* Thinner, lighter arrows */
    .arrow-line {
        stroke-width: 1.5;
        stroke: #bbb;
        stroke-dasharray: none;
    }
</style>
```

---

## 4. Neon Flow

**Vibe:** Futuristic, tech-forward, eye-catching

**Best for:** AI/ML pipelines, tech demos, developer content, LinkedIn posts

**Typography:**
- Display: `Clash Display` (700) — Fontshare
- Body: `Satoshi` (400/500) — Fontshare

**Colors:**
```css
:root {
    --bg-primary: #0a0f1c;
    --bg-grid-color: rgba(0, 255, 204, 0.03);
    --arrow-color: #00ffcc;
    --arrow-glow: rgba(0, 255, 204, 0.4);
    --text-primary: #ffffff;
    --text-secondary: #88aacc;

    /* Node colors (dark with neon borders) */
    --node-bg: rgba(255,255,255,0.04);
    --node-border-1: #00ffcc;  /* Cyan */
    --node-border-2: #ff00aa;  /* Magenta */
    --node-border-3: #ffcc00;  /* Gold */
    --node-border-4: #00aaff;  /* Blue */
    --node-border-5: #aa00ff;  /* Purple */
    --node-border-6: #ff6600;  /* Orange */
}
```

**Canvas:**
- Very dark navy with subtle cyan grid

**Nodes:**
- Dark semi-transparent background
- Glowing neon border (color varies per node)
- Border glow: `box-shadow: 0 0 20px var(--glow-color), inset 0 0 20px var(--glow-color-dim)`
- Border radius: 16px

**Arrows:**
- Glowing neon lines
- `filter: drop-shadow(0 0 6px var(--arrow-glow))`
- Animated dash pattern (optional in HTML preview)

**Signature Elements:**
```html
<style>
    .canvas-bg {
        background-image:
            linear-gradient(var(--bg-grid-color) 1px, transparent 1px),
            linear-gradient(90deg, var(--bg-grid-color) 1px, transparent 1px);
        background-size: 60px 60px;
    }

    .node {
        background: rgba(255,255,255,0.04);
        border: 2px solid var(--neon-color);
        box-shadow: 0 0 20px var(--glow), inset 0 0 20px rgba(0,0,0,0.3);
        backdrop-filter: blur(10px);
    }

    .node-label {
        color: var(--neon-color);
        text-shadow: 0 0 10px var(--glow);
    }

    .arrow-line {
        filter: drop-shadow(0 0 6px var(--arrow-glow));
    }
</style>
```

---

## 5. Pastel Board

**Vibe:** Soft, approachable, presentation-friendly

**Best for:** Client presentations, team docs, non-technical audiences

**Typography:**
- Font: `Plus Jakarta Sans` (400/500/600/700)

**Colors:**
```css
:root {
    --bg-primary: #faf8f5;
    --arrow-color: #bba;
    --text-primary: #2a2a2a;
    --text-secondary: #888;

    /* Node colors (soft pastels) */
    --node-1: #FDE8E8;  /* Blush */
    --node-2: #E8F0FD;  /* Sky */
    --node-3: #E8FDE8;  /* Mint */
    --node-4: #FDF4E8;  /* Cream */
    --node-5: #F0E8FD;  /* Lilac */
    --node-6: #E8FDFA;  /* Aqua */
}
```

**Canvas:**
- Warm off-white, no dots or grid (clean)

**Nodes:**
- Soft pastel backgrounds
- No visible border
- Gentle shadow: `0 6px 20px rgba(0,0,0,0.05)`
- Large border radius: 20px
- Feels like soft paper cards

**Arrows:**
- Thin, muted lines (2px)
- Warm gray color
- Rounded ends, small arrowhead

**Signature Elements:**
```html
<style>
    body {
        background: #faf8f5;
    }

    .node {
        border: none;
        box-shadow: 0 6px 20px rgba(0,0,0,0.05);
        border-radius: 20px;
    }

    .node-step {
        background: #2a2a2a;
        color: white;
    }

    .node-label {
        font-weight: 600;
    }
</style>
```

---

## Node Color Assignment

Colors are assigned cyclically from the palette:

```
Node 1 → --node-1 (Yellow / Blush / Cyan / etc.)
Node 2 → --node-2
Node 3 → --node-3
...
Node 7 → --node-1 (wraps around)
```

For **Blueprint** and **Neon Flow**, all nodes share the same background but have different border colors from the palette.

---

## Typography Quick Reference

| Element | Size | Weight | Line Height |
|---------|------|--------|-------------|
| Diagram title | 28-36px | 700 | 1.2 |
| Diagram subtitle | 16-20px | 400 | 1.3 |
| Node label | 20-24px | 700 | 1.2 |
| Node detail | 14-16px | 500 | 1.3 |
| Node icon | 32-40px | — | 1 |
| Step badge | 13-15px | 700 | 1 |
| Arrow label | 13-15px | 600 | 1 |

---

## Arrow Styles by Preset

| Preset | Stroke | Dash | Width | Arrowhead |
|--------|--------|------|-------|-----------|
| FigJam Classic | `#555` | `8,6` | 3px | Filled triangle |
| Blueprint | `#3c82dc` | none (solid) | 2px | Open triangle |
| Minimal White | `#bbb` | none (solid) | 1.5px | Small filled |
| Neon Flow | `#00ffcc` | `6,4` | 2.5px | Glowing filled |
| Pastel Board | `#bba` | none (solid) | 2px | Rounded |

---

## Testing Checklist

Before screenshotting:

- [ ] All nodes are visible and not cut off
- [ ] Arrows connect to correct nodes
- [ ] No overlapping nodes
- [ ] Text is readable
- [ ] Fonts loaded correctly
- [ ] Colors match the chosen preset
- [ ] Step numbers are sequential
- [ ] Title/subtitle visible (if included)
