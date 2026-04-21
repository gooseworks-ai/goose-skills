# Skill: Extract Style from Reference Image

Extract the visual design language from a reference image and produce a reusable DESIGN.md style definition file.

---

## When to Use

The user provides a reference image -- a screenshot, design mockup, mood board, website capture, or any visual reference -- and wants to capture its design language as a reusable style preset. The output is a complete 9-section DESIGN.md file that can be used by other graphic design skills to produce on-brand content.

---

## Phase 1: Receive & Analyze the Image

### Step 1 -- Get the image

Ask the user to provide the reference image. Accept any of:
- A file path to an image on disk (PNG, JPG, WebP, etc.)
- A screenshot pasted into the conversation
- A URL to a publicly accessible image (use WebFetch to download it first, then read the downloaded file)

### Step 2 -- View the image

Read the image using the Read tool. The Read tool supports image files natively -- it will display the image contents visually for analysis.

If the image is unclear, low resolution, or only shows a partial design, ask the user if they have a better reference or if they want to proceed with what is available.

### Step 3 -- Systematic visual analysis

Examine the image carefully and work through every item in this checklist. Write your analysis out explicitly before moving to Phase 2 -- do not skip ahead.

**Colors:**
- Identify the 3-5 dominant colors in the design.
- For each color, estimate a clean hex value that matches the observed color family. Agent vision cannot extract exact hex codes, so pick well-balanced values within the right family (e.g., if you see a warm red, choose something like `#c94a4a` rather than guessing at the last digit).
- Classify each color by its role:
  - **Background** -- the dominant surface color
  - **Primary text** -- the main reading color
  - **Accent** -- the color used for emphasis, CTAs, highlights, interactive elements
  - **Secondary accent** -- a quieter supporting color if present
  - **Neutral/surface** -- any additional grays, tints, or surface colors for cards and containers
- Note whether the palette is warm, cool, or neutral in overall temperature.

**Typography:**
- Is the heading typeface serif, sans-serif, slab-serif, or monospace?
- Is the body typeface the same family or a different one?
- Estimate weight range: light (100-300), regular (400), medium (500), semibold (600), bold (700), heavy (800-900)?
- Is letter-spacing tight (negative tracking), normal, or wide (positive tracking)?
- Is line height compact or generous?
- Classify the overall type feel: geometric, humanist, elegant, technical, rounded, condensed, modern-clean.

**Layout:**
- Dense or spacious? How much whitespace surrounds elements?
- Grid-based or free-form? How many columns?
- Primary alignment: left-aligned, centered, or mixed?
- Card-based or flat sections? Do elements live in containers with visible borders/backgrounds?
- What is the overall content density -- minimal (few elements, lots of space) or information-rich?

**Mood:**
- Dark or light theme?
- Professional, playful, elegant, technical, warm, cold, editorial, brutalist, organic, corporate?
- What kind of brand or publication does this feel like? Name 2-3 analogies.

**Depth & Elevation:**
- Flat design with no shadows?
- Subtle shadows for slight lift?
- Heavy drop shadows or elevation?
- Borders: visible borders on containers, or borderless?
- If shadows exist, are they cool (gray/black) or warm-tinted?

**Special Elements:**
- Any gradients? Linear, radial, or mesh?
- Background patterns or textures?
- Glow effects, blur, or glassmorphism?
- Decorative elements: lines, shapes, icons, illustrations?
- Any distinctive UI patterns: pills, tags, badges, numbered items, progress indicators?

Write the full analysis as a structured list before continuing.

---

## Phase 2: Map to Available Fonts

The reference image likely uses fonts that may be proprietary or unavailable. Map the observed typography to the nearest freely available alternatives.

### Step 1 -- Classify the observed fonts

Based on your analysis, classify the heading and body fonts into one of these categories:

| Category | Characteristics |
|----------|----------------|
| Geometric sans | Clean, circular letterforms, even stroke width (e.g., Futura, Proxima Nova) |
| Humanist sans | Slightly organic, calligraphic influence, warm (e.g., Gill Sans, Frutiger) |
| Elegant serif | High stroke contrast, refined details, display-oriented (e.g., Didot, Bodoni) |
| Body serif | Moderate contrast, designed for reading at text sizes (e.g., Charter, Cambria) |
| Monospace | Fixed-width, technical feel (e.g., Courier, SF Mono) |
| Rounded | Rounded terminals and corners, friendly feel (e.g., VAG Rounded) |
| Condensed/heavy | Narrow letterforms or high weight, impactful (e.g., Impact, Anton) |
| Modern clean | Contemporary geometric sans with subtle personality (e.g., Satoshi, General Sans) |
| Slab serif | Thick, block-like serifs, sturdy feel (e.g., Rockwell, Clarendon) |

### Step 2 -- Select replacement fonts

Use this lookup table to pick the best available match from Google Fonts or Fontshare:

| Category | Recommended Options |
|----------|-------------------|
| Geometric sans | Space Grotesk, Inter, DM Sans, Plus Jakarta Sans |
| Humanist sans | Nunito, Source Sans Pro, Open Sans |
| Elegant serif | Playfair Display, Cormorant Garamond, EB Garamond |
| Body serif | Lora, Merriweather, Source Serif Pro |
| Monospace | JetBrains Mono, Fira Code, IBM Plex Mono |
| Rounded | Nunito, Varela Round, Comfortaa |
| Condensed/heavy | Archivo Black, Oswald, Bebas Neue |
| Modern clean | Satoshi (Fontshare), General Sans (Fontshare) |
| Slab serif | Roboto Slab, Zilla Slab, Arvo |

**Selection rules:**
- Pick one font for display/headings and one for body text. They can be the same family if the reference uses a single typeface.
- If the reference clearly uses a well-known free font (e.g., Inter, Roboto, Playfair Display), use it directly.
- Prefer Google Fonts over Fontshare for wider availability.
- Always include system font fallbacks in the font stack.

### Step 3 -- Build the Google Fonts link

Construct the `<link>` tag with the selected fonts and the specific weights needed:
- Display font: include weights 400, 700, and optionally 900. Include italic variants if the reference uses italic headings.
- Body font: include weights 300, 400, 500, and optionally 600.

---

## Phase 3: Generate the DESIGN.md

Produce a complete file with all 9 sections, following the exact structure and depth of the existing style presets (e.g., midnight-editorial.md). Every section must be substantive -- not placeholder text.

### Section 1: Visual Theme & Atmosphere

Write a 2-3 paragraph narrative description of the extracted style. This is prose, not a list. Cover:
- What tradition or design school this style draws from
- How the color palette creates its specific mood
- How the typography pairing works and why
- What the accent color does for the composition
- 2-3 real-world analogies (e.g., "the design language of a Scandinavian furniture catalog," "the feel of a fintech dashboard")

End with a **Key Characteristics** bullet list (8-12 items) summarizing the most important rules, each with specific values (hex codes, pixel sizes, weights).

### Section 2: Color Palette & Roles

Organize colors into these groups with the same structure as the reference:

- **Primary** (3 colors): Background, primary text, primary accent -- with hex codes and usage descriptions.
- **Accent** (2-3 colors): Secondary accent, hover states, tertiary tones.
- **Neutral Scale** (4-6 colors): Surface variations from darkest to lightest (for dark themes) or lightest to darkest (for light themes). Include disabled text, placeholder, and metadata colors.
- **Surface & Borders**: Surface primary, surface inset, border default (with alpha), border accent, border strong, divider rule.
- **Shadow Colors**: 3-4 shadow definitions using RGBA values that stay on-palette.

**Color quality rules:**
- Never use pure black (`#000000`) or pure white (`#ffffff`) unless the reference clearly does.
- Text-on-background contrast must meet WCAG AA (4.5:1 ratio minimum). Mentally verify this.
- Keep the total palette to 12-16 named colors. More than that creates inconsistency.
- Shadow colors should use tinted RGBA from the accent color for warm palettes, or neutral RGBA for cool palettes.

### Section 3: Typography Rules

Include:
- **Font Families** block with the Google Fonts CDN link and CSS font-family declarations with full fallback stacks.
- **Hierarchy table** with columns: Role | Font | Size | Weight | Line Height | Letter Spacing | Notes. Include at minimum: Display Hero, Section Heading, Sub-heading, Body Large, Body, Small/Caption, Big Numbers, Numbered Label, CTA Text.
- **Principles** (5-6 bullet points) explaining the typographic logic: why these pairings, how tracking changes across sizes, when to use uppercase, line height rationale.

### Section 4: Component Patterns

Provide 6-8 HTML/CSS component snippets using CSS custom properties (`var(--color-*)`, `var(--font-*)`). Each should be a self-contained, inline-styled HTML block. Include at minimum:
- Title Block (hero/header section)
- Numbered Item
- Stat Display
- Comparison Grid (2-column)
- List Item
- Quote Block
- CTA Block

Adapt each component's structure to match the reference's design language. For example, if the reference is light and airy, components should have generous padding and minimal borders. If the reference is dense and technical, components should be compact with visible structure.

### Section 5: Layout Principles

Include:
- **Spacing Scale** (8-10 values from micro to max) with pixel values and usage descriptions.
- **Format Padding** table for 4 formats: Carousel (1080x1080), Infographic (1080xN), Slides (1920x1080), Poster (1080x1350).
- **Alignment & Grid** rules: primary alignment, grid column guidance, rule/divider conventions, vertical rhythm, content gravity.

### Section 6: Depth & Elevation

Include:
- **Elevation table** with 5 levels (Flat, Subtle, Card, Featured, Overlay) showing CSS shadow values and use cases.
- **Border Treatments** (4 types): standard, active, accent rule, divider line -- with exact CSS values.
- **Surface Hierarchy** explanation of how depth is communicated (lightness steps for dark themes, shadow intensity for light themes).

### Section 7: Do's and Don'ts

Write 8-12 **Do** rules and 8-12 **Don't** rules. Each must be specific and actionable, referencing exact values (hex codes, pixel sizes, font names, weights). These should encode the guardrails that prevent someone from drifting off-style. Base them on what you observed in the reference -- if the reference never uses rounded corners, that is a Don't. If the reference uses a specific spacing rhythm, that is a Do.

### Section 8: Format Adaptation Notes

For each of the 4 formats (Carousel, Infographic, Slides, Poster), provide:
- Typography scale adjustments (which sizes change and to what values)
- Padding values
- Layout notes (single column vs. multi-column, content placement)
- Format-specific conventions (e.g., swipe indicators for carousels, vertical rhythm for infographics)

### Section 9: Agent Prompt Guide

Include:
- **Quick Color Reference** table: Name | Hex | Usage
- **Font Declarations** as CSS code block
- **Google Fonts Link** as HTML code block
- **CSS Root Variables** -- a complete `:root` block defining every variable: colors (primary, accent, neutral, surfaces, borders, shadows), typography (families, sizes, weights, line heights), spacing, borders, and composed shadows.
- **System Font Fallbacks**

---

## Phase 4: Save & Confirm

### Step 1 -- Ask for a name

Ask the user what they want to name this style. Suggest a descriptive name based on the mood and palette (e.g., "arctic-minimal", "warm-startup", "dark-technical", "sunset-editorial"). The name should be lowercase-kebab-case.

### Step 2 -- Determine save location

The default save path is the same directory as the other style presets. If you can detect the goose-graphics styles directory from context, use it. Otherwise, ask the user where to save.

Default path pattern:
```
[project-root]/goose-graphics/styles/[name].md
```

### Step 3 -- Save the file

Write the complete DESIGN.md file using the Write tool.

### Step 4 -- Confirm

Tell the user:
- The file was saved and its full path
- A 3-4 line summary of the extracted style: theme (dark/light), primary palette (background + text + accent), font pairing, and overall mood
- That the style is now ready for use with other graphic design skills

---

## Important Notes

### On Color Accuracy

Agent vision identifies color families, not exact hex values. The goal is to produce a **coherent, well-balanced palette** that captures the spirit of the reference, not to pixel-match it. When estimating hex values:

- Identify the color family first (warm red, cool blue, muted green, near-black, warm gray, etc.)
- Pick a clean, well-balanced hex within that family
- Verify contrast: primary text on background must be at least 4.5:1 (WCAG AA). For dark themes, light text on dark backgrounds. For light themes, dark text on light backgrounds.
- Use 3-5 primary colors max. Most well-designed references use very few colors -- adding more dilutes the identity.
- When in doubt, desaturate slightly. Oversaturated colors extracted from compressed images tend to look garish in production.

### On Font Matching

The goal is **typographic equivalence**, not exact matching. A geometric sans is a geometric sans -- whether it is Circular, Proxima Nova, or Inter. Match the category, weight range, and tracking behavior. The resulting designs will feel right even if the exact typeface differs.

### On Completeness

Every section of the output DESIGN.md must be filled with substantive, specific content. Do not leave any section with placeholder text like "TBD" or "adjust as needed." The file should be immediately usable by another agent or skill without further editing.
