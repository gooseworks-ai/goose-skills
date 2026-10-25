# ASCII Art as a Design Element

## Overview

ASCII art is not just retro decoration -- it is a legitimate design tool that adds texture, personality, and visual structure to HTML graphics. When used intentionally, ASCII art can serve as borders, section dividers, background textures, decorative headers, and abstract visual elements.

This skill teaches you to generate and embed ASCII art within HTML graphics, not as standalone art but as integrated design elements that complement typography, color, and layout.

**When to use ASCII art:**
- Tech, developer, or hacker-themed content
- Retro or nostalgic aesthetics
- Abstract textures and patterns where illustration is not available
- Section dividers and visual separators
- Decorative borders and frames
- When you want to add visual interest without relying on stock photos

## HTML/CSS Rendering

ASCII art must be rendered in a monospace font with precise control over spacing. Here is the base pattern:

```html
<pre style="
  font-family: 'Courier New', 'Consolas', 'Monaco', monospace;
  font-size: 14px;
  line-height: 1;
  letter-spacing: 0;
  margin: 0;
  padding: 0;
  white-space: pre;
  color: #e0e0e0;
">ASCII ART CONTENT HERE</pre>
```

### Critical CSS Properties

| Property | Value | Why It Matters |
|---|---|---|
| `font-family` | monospace stack | Characters must be equal width for alignment |
| `line-height` | `1` | **Critical.** Any other value breaks vertical alignment of multi-line art |
| `letter-spacing` | `0` | Prevents horizontal drift |
| `white-space` | `pre` | Preserves all spaces and line breaks exactly |
| `margin` / `padding` | `0` | Prevents unexpected offsets |

### Positioning Methods

**Inline placement** (section divider, header decoration):

```html
<div style="text-align: center; margin: 24px 0;">
  <pre style="
    font-family: 'Courier New', monospace;
    font-size: 12px;
    line-height: 1;
    color: #666;
    display: inline-block;
  ">===== * ===== * ===== * =====</pre>
</div>
```

**Absolute overlay** (background texture, watermark):

```html
<div style="position: relative; width: 1080px; height: 1080px;">
  <!-- Background ASCII texture -->
  <pre style="
    position: absolute;
    top: 40px;
    left: 40px;
    font-family: 'Courier New', monospace;
    font-size: 10px;
    line-height: 1;
    color: rgba(255, 255, 255, 0.06);
    z-index: 0;
    pointer-events: none;
  ">REPEATING PATTERN HERE</pre>

  <!-- Foreground content -->
  <div style="position: relative; z-index: 1;">
    <!-- Your actual content -->
  </div>
</div>
```

**Contained block** (featured art element):

```html
<div style="
  background: #1a1a1a;
  border-radius: 8px;
  padding: 24px;
  overflow: hidden;
">
  <pre style="
    font-family: 'Courier New', monospace;
    font-size: 13px;
    line-height: 1;
    color: #00ff88;
    text-align: center;
  ">ASCII ART HERE</pre>
</div>
```

## Pattern Library

### Borders and Frames

**Single-line box (light):**
```
┌──────────────────────────────────────┐
│                                      │
│          Your content here           │
│                                      │
└──────────────────────────────────────┘
```

**Double-line box (heavy emphasis):**
```
╔══════════════════════════════════════╗
║                                      ║
║          Your content here           ║
║                                      ║
╚══════════════════════════════════════╝
```

**Decorative corner frame:**
```
+------======------+
|                   |
|                   |
+------======------+
```

**Rounded frame:**
```
.-------------------------------------------.
|                                           |
|            Your content here              |
|                                           |
'-------------------------------------------'
```

### Dividers

**Simple horizontal rules:**
```
────────────────────────────────────────
════════════════════════════════════════
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Wave pattern:**
```
~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~
```

**Dot patterns:**
```
. . . . . . . . . . . . . . . . . . .
 . . . . . . . . . . . . . . . . . .
· · · · · · · · · · · · · · · · · · ·
```

**Arrow patterns:**
```
>>>----->>>>>----->>>>>----->>>>>----->
<<<<< ===== >>>>> ===== >>>>> ===== >
->->->->->->->->->->->->->->->->->->
```

**Diamond chain:**
```
<>--<>--<>--<>--<>--<>--<>--<>--<>--<>
```

### Geometric Shapes

**Diamond:**
```
    /\
   /  \
  /    \
 /      \
 \      /
  \    /
   \  /
    \/
```

**Triangle:**
```
      /\
     /  \
    /    \
   /      \
  /        \
 /          \
/____________\
```

**Approximate circle:**
```
      ****
    **    **
   *        *
  *          *
  *          *
   *        *
    **    **
      ****
```

**Star:**
```
        *
       /|\
      / | \
*----*  |  *----*
 \   \  |  /   /
  \   \ | /   /
   \   \|/   /
    *---*---*
   /   /|\   \
  /   / | \   \
 /   /  |  \   \
*----*  |  *----*
      \ | /
       \|/
        *
```

**Hexagon:**
```
   ___
  /   \
 /     \
 \     /
  \___/
```

### Abstract Textures

**Dot matrix (light):**
```
.   .   .   .   .   .   .   .   .   .
  .   .   .   .   .   .   .   .   .
.   .   .   .   .   .   .   .   .   .
  .   .   .   .   .   .   .   .   .
.   .   .   .   .   .   .   .   .   .
```

**Hash pattern (medium density):**
```
# . # . # . # . # . # . # . # . # .
. # . # . # . # . # . # . # . # . #
# . # . # . # . # . # . # . # . # .
. # . # . # . # . # . # . # . # . #
```

**Gradient fill using character density (light to dense):**
```
.     .     .     .     .     .
 .   . .   . .   . .   . .   .
. . . . . . . . . . . . . . . .
.:;:.:;:.:;:.:;:.:;:.:;:.:;:.:;
:;%:;%:;%:;%:;%:;%:;%:;%:;%:;%
%#@%#@%#@%#@%#@%#@%#@%#@%#@%#@%
```

Characters ordered by visual density (light to heavy):
`. - : ; = + * # % @`

**Cross-hatch:**
```
/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\
\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/
/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\
\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/
```

**Binary rain (good for tech themes):**
```
01 10 01 11 00 10 01 10 11 00
10 01 10 00 11 01 10 01 00 11
01 10 01 11 00 10 01 10 11 00
10 01 10 00 11 01 10 01 00 11
```

### Decorative Headers

Large block letters are built from repeated characters. The technique: use a 5-7 line tall grid where each letter is 5-8 characters wide.

**Block letter technique (example: "HI"):**
```
██  ██  ██
██  ██  ██
██████  ██
██  ██  ██
██  ██  ██
```

**Hash letter technique (example: "GO"):**
```
 ####   ####
#      #    #
#  ##  #    #
#    #  #    #
 ####   ####
```

**Slim letter technique (example: "HELLO"):**
```
|_| _  |  |  _
| ||_ |_| |_|_|
```

When generating block text for a specific word, construct each letter on a fixed grid and space them consistently. Do not attempt to memorize full alphabets -- build each letter from simple geometric logic.

## Integration with Style Presets

### Dark Themes
- Use light-colored ASCII (`#e0e0e0`, `#aaa`, `rgba(255,255,255,0.1)`) on dark backgrounds
- Lower opacity for background textures (`rgba(255,255,255,0.04)` to `0.08`)
- Full brightness for featured/foreground art elements

```html
<pre style="color: rgba(255, 255, 255, 0.06); font-size: 10px; line-height: 1;">
<!-- Subtle background texture -->
</pre>
```

### Light Themes
- Use muted grays (`#ccc`, `#ddd`, `rgba(0,0,0,0.08)`) as subtle texture
- ASCII should recede into the background, never compete with content
- Thin-line characters (`.`, `-`, `|`) work better than heavy ones (`#`, `@`, `%`)

```html
<pre style="color: rgba(0, 0, 0, 0.06); font-size: 10px; line-height: 1;">
<!-- Barely-visible texture layer -->
</pre>
```

### Terminal / Hacker Theme
- Green ASCII on black/very dark green background
- Fully visible, not subtle -- embrace the aesthetic
- Use `#00ff41` (classic terminal green) or `#0f0` for high contrast
- Add a slight text-shadow glow for CRT effect

```html
<pre style="
  color: #00ff41;
  font-size: 14px;
  line-height: 1;
  text-shadow: 0 0 5px rgba(0, 255, 65, 0.4);
  font-family: 'Courier New', monospace;
">
╔══════════════════════════════════╗
║   SYSTEM STATUS: OPERATIONAL     ║
╚══════════════════════════════════╝
</pre>
```

### Editorial / Minimal Styles
- Use only thin-line ASCII: single-line box drawing (`─`, `│`, `┌`, `┐`, `└`, `┘`)
- Keep it functional: section dividers, light borders only
- Never use block fills or dense textures
- Color should match the body text color at reduced opacity

```html
<pre style="color: #bbb; font-size: 11px; line-height: 1;">
───────────────────────────────
</pre>
```

## Sizing Guidelines

The number of characters that fit depends on font size and the graphic's pixel width. Here are recommended ranges:

### Carousel / Square Post (1080px wide)

| Font Size | Characters Wide | Use Case |
|---|---|---|
| 10px | ~130 chars | Dense background textures |
| 12px | ~110 chars | Background patterns, subtle elements |
| 14px | ~80 chars | Featured art, borders |
| 16px | ~70 chars | Prominent decorative elements |
| 20px | ~55 chars | Large headers, bold statements |

Height: match the graphic height. At 14px font-size with `line-height: 1`, each row is 14px tall. A 1080px graphic fits ~77 rows.

### Infographic (1080px wide, tall)

Same width as carousel. The vertical dimension can extend as long as the infographic requires.

| Font Size | Characters Wide | Characters Tall (per 1000px) |
|---|---|---|
| 10px | ~130 chars | ~100 rows |
| 12px | ~110 chars | ~83 rows |
| 14px | ~80 chars | ~71 rows |

### Presentation Slide (1920px wide)

| Font Size | Characters Wide | Use Case |
|---|---|---|
| 10px | ~230 chars | Extremely dense texture |
| 12px | ~190 chars | Background patterns |
| 14px | ~140 chars | Featured art |
| 16px | ~120 chars | Prominent elements |
| 20px | ~100 chars | Large decorative headers |

### Poster (1080px wide)

Same width calculations as carousel. Use larger font sizes (16-24px) since posters are viewed from a distance and need more visual weight.

**General rule of thumb:** At 14px monospace, one character is approximately 8.4px wide. Divide your graphic's content width (total width minus padding) by 8.4 to get your character count.

## Do's and Don'ts

### Do

- **Use ASCII as supporting texture**, not the main attraction (unless the theme demands it)
- **Keep it subtle** -- background ASCII at 4-8% opacity adds depth without clutter
- **Match the density to the theme** -- minimal themes get thin lines, tech themes can go heavier
- **Use box-drawing characters** (Unicode range U+2500-U+257F) for clean borders -- they connect seamlessly
- **Test vertical alignment** by checking that line-height is exactly `1` and no extra padding is present
- **Use ASCII dividers** between sections to add rhythm to long-form graphics like infographics
- **Limit the palette** -- ASCII art should use one color (or one color at varying opacities), never rainbow

### Don't

- **Don't fill the entire graphic** with dense ASCII unless it is a deliberate full-texture background
- **Don't use ASCII art as the sole visual** in a professional/corporate context -- it reads as unserious
- **Don't mix too many ASCII styles** in one graphic (pick one border style, one divider style, stick with them)
- **Don't use ASCII for body text** -- it should decorate, frame, or texture, not replace readable typography
- **Don't assume perfect character alignment** across all renderers -- test with `line-height: 1` and a known monospace font
- **Don't use wide Unicode characters** (CJK, emoji) mixed with ASCII -- they are double-width and break alignment
- **Don't forget `white-space: pre`** -- without it, browsers collapse your carefully placed spaces
