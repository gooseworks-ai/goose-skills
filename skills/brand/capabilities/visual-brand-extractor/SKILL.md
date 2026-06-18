---
name: visual-brand-extractor
description: >
  Extract visual branding (colors, typography, layout patterns) from a client's
  website and generate a style preset compatible with the HTML slides skill and
  a brand config JSON for the content asset creator. Uses WebFetch to read pages
  and analyzes CSS/HTML to identify the color palette, font pairings, and
  aesthetic patterns.
tags: [brand]
---

# Visual Brand Extractor

Extract a client's visual identity from their website and generate reusable style presets for slides and content assets. This is an agent-executed skill — the AI reads pages via WebFetch and performs the analysis directly.

## Quick Start

```
Extract visual branding from https://vapi.ai for the Vapi client.
```

## Inputs

| Input | Required | Description |
|-------|----------|-------------|
| **Website URL** | Yes | Client's homepage or landing page URL |
| **Client name** | Yes | For naming the output files |
| **Additional pages** | No | Product page, docs page, etc. for richer extraction |

## Output

Two files saved to `clients/<client-name>/brand/visual-identity.md`:

1. **Slide preset** — CSS custom properties, typography, and signature elements matching the format in `skills/create-html-slides/STYLE_PRESETS.md`
2. **Brand config JSON** — Simple color/font config matching `skills/content-asset-creator` format

---

## Process

### Phase 1: Fetch Target Pages

Fetch 2-3 pages to get a representative sample of the brand:

1. **Homepage** (mandatory) — the primary brand expression
2. **Product/feature page** (if available) — deeper color and layout usage
3. **Blog or about page** (optional) — secondary design context

Use WebFetch on each URL with a prompt like:

> "Extract the full content of this page. I need: all color values (hex, rgb, hsl), font family names, CSS class names (especially Tailwind utility classes), any CSS custom properties/variables, meta tags, and the general structure of the page layout. Preserve exact color codes and font names."

### Phase 2: Extract Color Palette

Analyze the fetched content to identify the color palette. Look for these sources in priority order:

#### 2.1 CSS Custom Properties

Look for `:root`, `html`, or `body` blocks containing color variables:
```css
--color-primary, --primary, --brand, --accent
--bg-*, --background-*
--text-*, --foreground-*
```

#### 2.2 Meta Tags

Check for:
- `<meta name="theme-color" content="#...">` — often the primary brand color
- `<meta name="msapplication-TileColor" content="#...">`

#### 2.3 Explicit CSS Color Declarations

Search for color values in these properties:
- `background-color`, `background` (including gradients)
- `color` (text colors)
- `border-color`, `border`
- `box-shadow` (accent/glow colors)
- `fill`, `stroke` (SVG logo colors)

#### 2.4 Tailwind Utility Classes

If the site uses Tailwind CSS, map utility classes to hex values using the reference table below.

#### 2.5 Classify Colors into Roles

| Role | How to Identify |
|------|----------------|
| **bg-primary** | `background-color` on `body`, `html`, or outermost container. The most common background. |
| **bg-secondary** | Background on cards, sections, or secondary containers. Slightly different from primary. |
| **text-primary** | `color` on `body` or the most common text color. |
| **text-secondary** | Muted text variant — used on subtitles, descriptions, `.text-gray-*` elements. |
| **accent** | Most prominent non-bg, non-text color. Found on buttons, links, CTAs, highlights. Also check `<meta name="theme-color">`. |
| **accent-secondary** | Second accent color, or gradient partner. Found on secondary buttons, hover states. |
| **card-bg** | Background of cards, modals, or elevated surfaces (if different from bg-primary). |

#### 2.6 Determine Theme Type

Check the luminance of bg-primary:
- **Dark theme:** Dark background (black, navy, charcoal) with light text
- **Light theme:** White or cream background with dark text
- **Mixed:** Note if the site uses both (e.g., dark hero + light content sections)

---

### Phase 3: Extract Typography

#### 3.1 Find Font Sources

Look for font loading in this order:

1. **Google Fonts `<link>` tags** — Font name is in the URL:
   ```
   fonts.googleapis.com/css2?family=Inter:wght@400;700
   ```
   → Font: `Inter`, weights: 400, 700

2. **Fontshare `<link>` tags** — Similar URL pattern:
   ```
   api.fontshare.com/v2/css?f[]=clash-display@400,700
   ```
   → Font: `Clash Display`

3. **`@font-face` declarations** — Extract the `font-family` value

4. **`font-family` CSS properties** — Direct declarations on elements

#### 3.2 Classify into Display vs Body

| Role | How to Identify |
|------|----------------|
| **Display font** | Font on `h1`, `h2`, `.title`, `.heading`, `.hero-title`, or the largest/boldest text. |
| **Body font** | Font on `body`, `p`, or general content elements. |

If both use the same font family, it's a single-family pairing (like "Manrope + Manrope"). Note the different weights used for display (700-900) vs body (400-500).

#### 3.3 Handle Proprietary Fonts

If the site uses a font NOT available on Google Fonts or Fontshare, map it to the closest available equivalent using the **Font Fallback Table** below.

---

### Phase 4: Analyze Visual Patterns

Examine the CSS and page structure for these aesthetic signals:

| Signal | What to Look For | Aesthetic Implication |
|--------|-----------------|---------------------|
| **Border radius** | `border-radius` values — large (12px+, 9999px) vs small (2-4px) vs none | Rounded = friendly/modern. Sharp = corporate/bold. |
| **Gradients** | `linear-gradient`, `radial-gradient` in backgrounds | Gradient-forward = modern SaaS aesthetic |
| **Shadows** | `box-shadow` frequency and intensity | Heavy shadows = depth/elevation. None = flat/minimal. |
| **Spacing** | Padding/margin sizes — generous (4rem+) vs tight (1rem) | Airy = premium/minimal. Dense = information-rich. |
| **Animations** | `@keyframes`, `transition`, `transform` presence | Motion-forward = energetic. Minimal = calm/professional. |
| **Grid patterns** | Background grid/dot patterns, decorative overlays | Technical/developer aesthetic |
| **Gradient orbs** | `radial-gradient` on positioned pseudo-elements | Modern, atmospheric aesthetic |
| **Borders as accents** | Colored `border-left` or `border-top` on sections | Editorial, organized aesthetic |

#### Synthesize the Vibe

Based on the signals above, compose:
1. **Vibe:** 2-4 adjectives (e.g., "Clean, technical, developer-focused, modern")
2. **Layout description:** 1 sentence (e.g., "Full-width dark sections with centered content and generous whitespace")
3. **Signature elements:** 3-4 reproducible CSS patterns from the site

---

### Phase 5: Generate Output

Create the file `clients/<client-name>/brand/visual-identity.md` with both output formats.

#### Output Template

````markdown
# Visual Brand Identity: [Company Name]

**Extracted from:** [URL(s)]
**Date:** [YYYY-MM-DD]

---

## Slide Preset

**Vibe:** [2-4 adjectives]

**Layout:** [1 sentence describing dominant layout pattern]

**Typography:**
- Display: `[Font Name]` ([weight, e.g., 700/800])
- Body: `[Font Name]` ([weight, e.g., 400/500])

**Colors:**
```css
:root {
    --bg-primary: [hex];
    --bg-secondary: [hex];
    --text-primary: [hex];
    --text-secondary: [hex];
    --accent: [hex];
    --accent-secondary: [hex];
}
```

**Signature Elements:**
- [Element 1, e.g., "Subtle gradient orbs as background decoration"]
- [Element 2, e.g., "Rounded cards with 12px border-radius and light shadow"]
- [Element 3, e.g., "Accent-colored left border on feature blocks"]
- [Element 4, e.g., "Grid dot pattern overlay on hero sections"]

**Font Loading:**
```html
<link href="https://fonts.googleapis.com/css2?family=[Font1]:wght@[weights]&family=[Font2]:wght@[weights]&display=swap" rel="stylesheet">
```

---

## Brand Config (JSON)

For use with `content-asset-creator` and other skills:

```json
{
  "name": "[Company]",
  "primary_color": "[accent hex]",
  "secondary_color": "[accent-secondary hex]",
  "accent_color": "[accent hex]",
  "background": "[bg-primary hex]",
  "text_color": "[text-primary hex]",
  "font_heading": "[Display Font]",
  "font_body": "[Body Font]",
  "logo_url": "[if discovered, otherwise omit]"
}
```

---

## Extraction Notes

[Any notes about the extraction — proprietary fonts that were mapped, multiple themes detected, sparse CSS from JS-rendered sites, etc.]
````

---

## Font Fallback Table

When a site uses a proprietary font not available on Google Fonts or Fontshare, use this mapping to find the closest available alternative:

| Font Category | Proprietary Examples | Google Fonts Alternative | Fontshare Alternative |
|--------------|---------------------|-------------------------|----------------------|
| Geometric sans | Circular, Roobert, Graphik, Product Sans | `Plus Jakarta Sans`, `Outfit`, `Manrope` | `General Sans`, `Satoshi` |
| Humanist sans | Proxima Nova, Calibri, Gill Sans | `Source Sans 3`, `DM Sans`, `Work Sans` | — |
| Neo-grotesque | Akkurat, Aktiv Grotesk, Suisse Int'l | `Space Grotesk`, `Archivo`, `Albert Sans` | `Switzer` |
| Modern serif | Tiempos, Canela, GT Sectra | `Fraunces`, `Cormorant`, `Playfair Display` | `Zodiak`, `Sentient` |
| Slab serif | Sentinel, Clarendon, Rockwell | `Zilla Slab`, `Roboto Slab` | — |
| Classic serif | Mercury, Chronicle, Minion | `Source Serif 4`, `Lora`, `Libre Baskerville` | `Bespoke Serif` |
| Monospace | SF Mono, Berkeley Mono, Dank Mono | `JetBrains Mono`, `Fira Code`, `Space Mono` | `Jet Brains Mono` |
| Display / decorative | GT Walsheim, Recoleta, Campton | `Syne`, `Archivo Black`, `Bricolage Grotesque` | `Clash Display`, `Cabinet Grotesk` |

**Decision heuristic:** If unsure which category a font falls into, look at its characteristics:
- Round dots and geometric 'o' → Geometric sans
- Varies stroke widths, warm feel → Humanist sans
- Uniform strokes, neutral → Neo-grotesque
- Serifs with high contrast → Modern serif

---

## Tailwind CSS Color Reference

If the site uses Tailwind utility classes, map them to hex values:

### Grays
| Class | Hex | Class | Hex |
|-------|-----|-------|-----|
| `gray-50` | `#F9FAFB` | `gray-500` | `#6B7280` |
| `gray-100` | `#F3F4F6` | `gray-600` | `#4B5563` |
| `gray-200` | `#E5E7EB` | `gray-700` | `#374151` |
| `gray-300` | `#D1D5DB` | `gray-800` | `#1F2937` |
| `gray-400` | `#9CA3AF` | `gray-900` | `#111827` |
| | | `gray-950` | `#030712` |

### Slate (common for dark themes)
| Class | Hex | Class | Hex |
|-------|-----|-------|-----|
| `slate-50` | `#F8FAFC` | `slate-500` | `#64748B` |
| `slate-100` | `#F1F5F9` | `slate-600` | `#475569` |
| `slate-200` | `#E2E8F0` | `slate-700` | `#334155` |
| `slate-300` | `#CBD5E1` | `slate-800` | `#1E293B` |
| `slate-400` | `#94A3B8` | `slate-900` | `#0F172A` |
| | | `slate-950` | `#020617` |

### Blues
| Class | Hex | Class | Hex |
|-------|-----|-------|-----|
| `blue-400` | `#60A5FA` | `blue-700` | `#1D4ED8` |
| `blue-500` | `#3B82F6` | `blue-800` | `#1E40AF` |
| `blue-600` | `#2563EB` | `blue-900` | `#1E3A8A` |

### Greens
| Class | Hex | Class | Hex |
|-------|-----|-------|-----|
| `green-400` | `#4ADE80` | `green-600` | `#16A34A` |
| `green-500` | `#22C55E` | `green-700` | `#15803D` |

### Common Accent Colors
| Class | Hex | Class | Hex |
|-------|-----|-------|-----|
| `indigo-500` | `#6366F1` | `purple-500` | `#A855F7` |
| `indigo-600` | `#4F46E5` | `violet-500` | `#8B5CF6` |
| `emerald-500` | `#10B981` | `amber-500` | `#F59E0B` |
| `teal-500` | `#14B8A6` | `rose-500` | `#F43F5E` |
| `cyan-500` | `#06B6D4` | `orange-500` | `#F97316` |

**Note:** Tailwind classes appear as `bg-blue-600`, `text-gray-900`, `border-indigo-500`, etc. Strip the property prefix (`bg-`, `text-`, `border-`) to get the color token, then look up the hex value above.

For custom Tailwind themes (e.g., `bg-brand`, `text-brand-light`), check the page's `<script>` tags for a `tailwind.config` object that defines custom colors.

---

## Edge Cases

### JS-Rendered Sites (Sparse CSS)
Many modern sites (Next.js, React) inject styles via JavaScript. WebFetch may return minimal inline CSS. In this case:
- Focus on Tailwind utility classes in `class` attributes
- Check `<script>` tags for embedded config objects
- Look for `<style>` tags that contain CSS-in-JS output
- If still sparse, ask the user: "The site appears to use dynamic styling. Could you share a screenshot or provide their brand guidelines directly?"

### Multiple Color Schemes (Light/Dark Mode)
Some sites define both light and dark themes via `prefers-color-scheme`. Extract the **default** (non-media-query) theme. If a dark mode variant is detected, note it in the Extraction Notes section.

### Too Many Colors
Enterprise sites may use dozens of colors. Focus on:
- The hero/above-the-fold section for the primary palette
- Button/CTA colors for accent identification
- Frequency analysis — top 5-7 unique colors define the brand

### No Usable Font Information
If font detection fails completely:
1. Check if the site mentions font names in its CSS comments or config
2. Look at the overall aesthetic and pick a matching pairing from the existing slide presets
3. Default to a safe, distinctive pairing based on vibe: serif display + sans body for premium; geometric sans for modern tech

---

## Example

Running this skill on `https://vapi.ai` might produce:

```markdown
# Visual Brand Identity: Vapi

**Extracted from:** https://vapi.ai, https://docs.vapi.ai
**Date:** 2026-02-26

---

## Slide Preset

**Vibe:** Technical, developer-focused, clean, modern

**Layout:** Dark full-width sections with centered content, card-based feature grids, generous spacing

**Typography:**
- Display: `Inter` (700/800)
- Body: `Inter` (400/500)

**Colors:**
\```css
:root {
    --bg-primary: #0F172A;
    --bg-secondary: #1E293B;
    --text-primary: #F8FAFC;
    --text-secondary: #94A3B8;
    --accent: #22C55E;
    --accent-secondary: #3B82F6;
}
\```

**Signature Elements:**
- Subtle gradient orbs in background (green-to-blue radial gradients)
- Rounded cards with slate-800 background and subtle border
- Code-style monospace accents for technical terms
- Green accent on CTAs and interactive elements

**Font Loading:**
\```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;800&display=swap" rel="stylesheet">
\```
```

*(This is an illustrative example — actual extraction results will vary based on the live site.)*

---

## Tips

- **Homepage is usually enough.** If the homepage has clear branding, you don't need additional pages. Fetch a second page only if the homepage is sparse or uses a different aesthetic from the rest of the site.
- **Buttons reveal the accent color.** The most reliable way to identify the primary accent is to find the button/CTA background color.
- **Check the favicon/logo.** SVG logos often contain the exact brand colors as `fill` values.
- **Don't over-extract.** The goal is 5-7 colors, 1-2 fonts, and 3-4 signature elements. More than that creates noise, not signal.
- **When in doubt, simplify.** A 3-color palette (bg + text + accent) with one font family at two weights makes a clean, usable preset.

## Dependencies

- Web fetch capability (for reading website pages)
- No API keys or paid tools required
