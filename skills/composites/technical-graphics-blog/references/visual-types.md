# Visual Types Reference

## Decision guide — which visual type fits which section?

| Section content | Visual type | Format |
|---|---|---|
| Numbered list (4+ items) or step-by-step protocol | Icon Callout Infographic | HTML |
| Before/after or feature comparison table | Comparison Panel | HTML |
| Key statistics, metrics, percentages | Editorial Stat Cards | HTML |
| Multi-tool workflow, named pipeline stages | Flowchart / Pipeline | SVG |
| Single concept with branching or hierarchy | Concept Diagram | SVG |
| Conclusion / summary of the full post | Pipeline Overview | SVG |
| Post title / cover | Hero Image | SVG |

---

## Hero Image (SVG)

Always generated. Structure:
- Left panel: tag chip + headline (3 lines max) + 2–3 stat chips
- Right panel: mini 3–4 node pipeline representing the post's core flow
- Bottom accent bar with domain + post title
- BG = `[ACTIVE BG]`, accent bar top = `[ACCENT1]`

Nodes in right panel use semantic colors:
- Node 1 (input/trigger): ACCENT1
- Node 2 (processing): ACCENT2
- Node 3 (action/decision): ACCENT3
- Node 4 (outcome): SUCCESS

---

## Icon Callout Infographic (HTML)

Use for: numbered lists, protocols, how-to steps, rule sets.

Structure:
- Section label chip (uppercase, 11px, ACCENT1)
- H2 heading (18px, weight 600, TEXT)
- Grid of cards: `repeat(auto-fit, minmax(260px, 1fr))`, gap 14px
- Each card: white bg, 1px border #E2E8F0, radius 10px, padding 20px
- Icon area: 36×36px rounded square, tint fill, inline SVG icon (no emoji)
- Title: 13px, weight 600, TEXT
- Description: 12px, color MUTED, line-height 1.5
- Step numbers or icons: use ACCENT1/2/3/SUCCESS cycling by semantic role (not sequence)

---

## Editorial Stat Cards (HTML)

Use for: sections with 2–5 key statistics or metrics.

Structure:
- Section label + heading
- Grid of stat cards: `repeat(auto-fit, minmax(140px, 1fr))`
- Each card: white bg, border #E2E8F0, radius 10px, padding 20px
- Stat number: 28–36px, weight 700, ACCENT1 (or ACCENT2/3 for variety)
- Stat label: 11–12px, weight 500, MUTED

---

## Comparison Panel (HTML)

Use for: before/after, manual vs automated, option A vs option B.

Structure:
- Two-column grid, full width
- Left column (the "worse" option): light red/pink tint bg, red border
- Right column (the "better" option): tint of ACCENT2, ACCENT2 border
- Column header: icon badge + title
- Row items: white bg mini-cards, label (uppercase 11px MUTED) + value (13px TEXT)
- Highlight differences: worse value in red, better in ACCENT2/SUCCESS

---

## Flowchart / Pipeline (SVG)

Use for: multi-step workflows, tool chains, agent pipelines.

Layout rules:
- ≤ 5 stages: left-to-right single row
- 6–8 stages: two rows (L-bend between rows)
- > 8 stages: split into Part 1 and Part 2 (separate SVGs)

Node sizing:
- Min width: longest_label_chars × 8.5 + 32px
- Single-line node height: 48px
- Two-line node height: 62px

Connector routing:
- L-bend paths between nodes: `M x1 y1 L x1 ymid L x2 ymid L x2 y2`
- No connector may cross through a node or label
- Arrow marker: standard defs block (see text-safety.md)

Zone groupings (optional):
- Use dashed `<rect>` containers with a short zone label at top-left
- Zone BG: `#F8FAFC`, border: `#E2E8F0`, dashed stroke

---

## Concept Diagram (SVG)

Use for: classification systems, hierarchies, 2×2 frameworks.

- Top-down layout for hierarchies
- Left-right for sequences
- Diamond shapes for decisions (use `<polygon>` or rotated `<rect>`)
- Max 8 nodes per diagram

---

## Pipeline Overview / Conclusion (SVG)

Use for: post conclusion, full-system summary.

Structure:
- 3–4 main pillar nodes in a row (left-to-right)
- One outcome node below, connected from the last pillar
- Stat strip below the pillars: 3 small white cards with key numbers
- Footer bar: domain + post title
