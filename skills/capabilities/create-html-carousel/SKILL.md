---
name: create-html-carousel
description: Create LinkedIn carousel posts as high-quality PNG images. Design informational multi-slide posts like "5 AI GTM workflows" with consistent styling, then automatically screenshot each slide at LinkedIn's optimal 1080x1080px format.
---

# LinkedIn Carousel Creator

Create stunning LinkedIn carousel posts as PNG images. This skill generates styled HTML slides optimized for square format (1080×1080px), then automatically screenshots each slide for direct upload to LinkedIn.

## Core Philosophy

1. **LinkedIn-First Design** — Square format (1080×1080px), optimized for mobile feed viewing
2. **Informational Content** — Tips, workflows, lists, frameworks (not presentations)
3. **Consistent Styling** — Reuse proven design systems from frontend-slides
4. **Automated Export** — Generate HTML → Screenshot → PNG files ready for LinkedIn
5. **Viewport Perfect** — Every slide must fit exactly in 1080×1080px without scrolling

---

## LinkedIn Carousel Specs

**Format:** Square (1080×1080px)

- **Aspect ratio:** 1:1
- **File format:** PNG (recommended) or JPG
- **File size:** Under 10MB per image
- **Max slides:** 10 images per carousel
- **Ideal slide count:** 5-8 slides (best engagement)

**Content Structure:**

1. **Cover slide** — Hook + title + your brand
2. **Content slides** — One key point per slide (3-6 slides)
3. **Closing slide** — CTA / summary / follow prompt

---

## When to Use This Skill

Use for LinkedIn carousel posts like:

- "5 AI GTM workflows you should be using"
- "How to build X: A step-by-step guide"
- "7 mistakes founders make with Y"
- "The complete framework for Z"
- "Before & After: How we 10x'd our metrics"

**NOT for:**

- Long-form presentations (use frontend-slides)
- Video content
- Single-image posts

---

## Workflow Overview

```
1. Content Input → User provides topic/outline
2. Style Selection → Choose visual style (or preview options)
3. HTML Generation → Create 1080×1080px HTML slides
4. Screenshot → Auto-capture each slide as PNG
5. Delivery → Folder of PNG files ready for LinkedIn upload
```

---

## Phase 1: Content Discovery

### Step 1.1: Get Topic & Structure

Ask the user:

**Question 1: What's the topic?**

- Header: "Topic"
- Question: "What's the main topic of this carousel?"
- (Free text input)

**Question 2: Content Type**

- Header: "Format"
- Question: "What type of post is this?"
- Options:
  - "Numbered list" — "5 ways to...", "7 mistakes...", "3 steps to..."
  - "How-to guide" — Step-by-step tutorial or process
  - "Framework" — Concept explanation with structure
  - "Before/After" — Transformation or case study
  - "Insights/Tips" — Collection of advice or learnings

**Question 3: Slide Count**

- Header: "Length"
- Question: "How many slides?"
- Options:
  - "Short (5-6)" — Quick, punchy (best for mobile scrolling)
  - "Medium (7-8)" — Standard carousel length
  - "Long (9-10)" — Maximum LinkedIn allows

**Question 4: Branding Handle**

- Header: "Brand"
- Question: "What handle or name should appear on each slide?"
- (Free text input — e.g., "@yourhandle", "Acme Inc", or leave blank for none)

**Question 5: Content Ready?**

- Header: "Content"
- Question: "Do you have the content written?"
- Options:
  - "Yes, I have all content" — Paste it in
  - "I have bullet points" — Need light formatting
  - "Just the topic" — Need help outlining

If user has content, ask them to share it.

### Content Density Rules for LinkedIn

Each slide should be **scannable in 2-3 seconds** on mobile:

| Slide Type | Max Content                                              |
| ---------- | -------------------------------------------------------- |
| Cover      | Title (1 line) + subtitle (1 line) + branding            |
| List item  | Number/icon + heading (2 lines max) + body (3 lines max) |
| Framework  | Diagram/visual + 2-4 labels                              |
| Quote/Stat | 1 large stat or quote + context                          |
| CTA        | 1 action + visual element                                |

**If content exceeds limits:** Break into multiple slides or simplify.

---

## Phase 2: Style Selection

Users can choose styles two ways:

### Option A: Direct Selection (Faster)

Show preset picker:

**Question: Pick a Style**

- Header: "Style"
- Question: "Which visual style works best for your content?"
- Options:
  - "Bold Signal" — High-contrast card on dark, confident
  - "Dark Botanical" — Elegant dark with soft abstract shapes
  - "Notebook Tabs" — Editorial cream paper with colorful tabs
  - "Pastel Geometry" — Friendly pastels with decorative pills
  - "Neon Cyber" — Futuristic tech aesthetic
  - "Split Pastel" — Playful two-tone split design

(See STYLE_PRESETS.md for full details on each style)

### Option B: Guided Discovery

If user isn't sure, ask:

**Question: Audience & Tone**

- Header: "Vibe"
- Question: "Who's your audience and what tone?"
- Options:
  - "Professional/Corporate" → Recommend: Bold Signal, Dark Botanical
  - "Creative/Playful" → Recommend: Split Pastel, Pastel Geometry
  - "Technical/Dev-focused" → Recommend: Neon Cyber, Terminal Green
  - "Elegant/Premium" → Recommend: Dark Botanical, Paper & Ink

Then generate 2-3 preview slides and let user pick.

---

## Phase 3: Generate HTML Carousel

### File Structure

All carousel files (HTML source and PNG exports) are saved to the shared assets directory.

```
[carousel-name]/
├── index.html              # Full carousel (all slides)
├── slides/
│   ├── slide-01.html       # Individual slide pages
│   ├── slide-02.html
│   └── ...
└── exports/
    ├── slide-01.png        # Screenshots (generated in Phase 4)
    ├── slide-02.png
    └── ...
```

### HTML Architecture for 1080×1080px

**CRITICAL: LinkedIn carousel slides are SQUARE (1:1 ratio), not widescreen.**

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Slide 01</title>

    <!-- Fonts -->
    <link rel="stylesheet" href="https://api.fontshare.com/v2/css?f[]=..." />

    <style>
      /* ===========================================
           LINKEDIN CAROUSEL: SQUARE FORMAT
           Fixed 1080×1080px for screenshot
           =========================================== */
      :root {
        /* Fixed size for LinkedIn */
        --slide-width: 1080px;
        --slide-height: 1080px;

        /* Colors (from chosen preset) */
        --bg-primary: #0a0f1c;
        --text-primary: #ffffff;
        --accent: #00ffcc;

        /* Typography - scaled for square format */
        --title-size: 72px;
        --subtitle-size: 36px;
        --body-size: 28px;
        --small-size: 20px;

        /* Spacing */
        --slide-padding: 80px;
        --content-gap: 40px;

        /* Animation */
        --ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);
      }

      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }

      html,
      body {
        width: var(--slide-width);
        height: var(--slide-height);
        overflow: hidden;
      }

      body {
        font-family: var(--font-body);
        background: var(--bg-primary);
        color: var(--text-primary);
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        padding: var(--slide-padding);
      }

      /* Content container */
      .slide-content {
        width: 100%;
        max-width: 100%;
        display: flex;
        flex-direction: column;
        gap: var(--content-gap);
      }

      /* Typography hierarchy */
      h1 {
        font-size: var(--title-size);
        font-weight: 800;
        line-height: 1.1;
        margin-bottom: 20px;
      }

      h2 {
        font-size: var(--subtitle-size);
        font-weight: 700;
        line-height: 1.2;
      }

      p,
      li {
        font-size: var(--body-size);
        line-height: 1.4;
      }

      /* List styling */
      ul {
        list-style: none;
      }

      li {
        padding-left: 40px;
        position: relative;
        margin-bottom: 20px;
      }

      li::before {
        content: "→";
        position: absolute;
        left: 0;
        color: var(--accent);
        font-weight: bold;
      }

      /* Number badge (for list items) */
      .number {
        font-size: 120px;
        font-weight: 900;
        color: var(--accent);
        opacity: 0.15;
        position: absolute;
        top: -40px;
        left: -20px;
        z-index: 0;
      }

      /* Branding footer */
      .brand {
        position: absolute;
        bottom: var(--slide-padding);
        right: var(--slide-padding);
        font-size: var(--small-size);
        opacity: 0.7;
      }

      /* ===========================================
           STYLE-SPECIFIC OVERRIDES
           Inject preset styles here
           =========================================== */
      /* ... preset-specific CSS ... */
    </style>
  </head>
  <body>
    <div class="slide-content">
      <!-- Slide content goes here -->
      <h1>Your Title Here</h1>
      <p>Your content here</p>
    </div>

    <div class="brand">@yourbrand</div>
  </body>
</html>
```

### Content Slide Templates

**Cover Slide:**

```html
<div class="slide-content">
  <h1>5 AI GTM Workflows<br />You Should Be Using</h1>
  <p>Scale your outbound without scaling your team</p>
</div>
<div class="brand">@yourhandle</div>
```

**Numbered Item (e.g., Slide 2/6):**

```html
<div class="slide-content">
  <div class="number">01</div>
  <h2>Signal-Based Outbound</h2>
  <p>
    Monitor job postings, funding announcements, and tech stack changes to find
    companies actively solving your problem.
  </p>
</div>
<div class="brand">@yourhandle • 1/5</div>
```

**Framework Slide:**

```html
<div class="slide-content">
  <h2>The GTM Engineering Stack</h2>
  <div class="framework-grid">
    <div class="box">Research</div>
    <div class="box">Personalization</div>
    <div class="box">Outreach</div>
    <div class="box">Tracking</div>
  </div>
</div>
<div class="brand">@yourhandle • 3/5</div>
```

**CTA Slide:**

```html
<div class="slide-content">
  <h2>Want more like this?</h2>
  <p>Follow me for more tips and workflows.</p>
  <div class="cta">Hit that follow button →</div>
</div>
<div class="brand">@yourhandle</div>
```

---

## Phase 4: Screenshot Generation

After generating HTML, automatically capture screenshots.

### Using Playwright (Recommended)

Create a Node.js script to screenshot each slide:

```javascript
// screenshot-slides.js
const { chromium } = require("playwright");
const path = require("path");
const fs = require("fs");

async function screenshotSlides(slidesDir, outputDir) {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Set viewport to LinkedIn carousel size
  await page.setViewportSize({ width: 1080, height: 1080 });

  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Find all HTML files in slides directory
  const slideFiles = fs
    .readdirSync(slidesDir)
    .filter((f) => f.endsWith(".html"))
    .sort();

  console.log(`Found ${slideFiles.length} slides to screenshot`);

  for (const slideFile of slideFiles) {
    const slidePath = path.join(slidesDir, slideFile);
    const outputName = slideFile.replace(".html", ".png");
    const outputPath = path.join(outputDir, outputName);

    console.log(`Capturing ${slideFile}...`);

    await page.goto(`file://${path.resolve(slidePath)}`);

    // Wait for fonts and animations
    await page.waitForTimeout(500);

    // Take screenshot
    await page.screenshot({
      path: outputPath,
      type: "png",
      fullPage: false,
    });

    console.log(`✓ Saved ${outputName}`);
  }

  await browser.close();
  console.log("\n✨ All slides captured!");
}

// Usage
const carouselName = process.argv[2];
if (!carouselName) {
  console.error("Usage: node screenshot-slides.js <carousel-name>");
  process.exit(1);
}

const slidesDir = path.join(__dirname, carouselName, "slides");
const outputDir = path.join(__dirname, carouselName, "exports");

screenshotSlides(slidesDir, outputDir);
```

### Installation

The skill directory needs these dependencies:

```json
{
  "name": "linkedin-carousel-screenshots",
  "version": "1.0.0",
  "private": true,
  "dependencies": {
    "playwright": "^1.40.0"
  }
}
```

First time setup:

```bash
cd /path/to/skills/create-html-carousel
npm install
```

### Running Screenshot Script

After generating HTML slides:

```bash
node screenshot-slides.js carousel-name
```

This will:

1. Open each slide HTML in a headless browser
2. Set viewport to 1080×1080px
3. Wait for fonts/animations to load
4. Capture PNG screenshot
5. Save to `[carousel-name]/exports/`

---

## Phase 5: Delivery

After screenshots are generated, present to user:

```
✨ Your LinkedIn carousel is ready!

📁 Location: /assets/carousel-name/

**Slides:**
- 6 HTML slides in slides/ folder
- 6 PNG images in exports/ folder (1080×1080px)

**Preview:**
Open index.html to see all slides with navigation.

**Upload to LinkedIn:**
1. Create new post on LinkedIn
2. Click "Add media"
3. Upload all PNGs from exports/ folder in order
4. Add your post copy
5. Publish!

**File sizes:**
- slide-01.png: 234 KB ✓
- slide-02.png: 198 KB ✓
- slide-03.png: 256 KB ✓
(All under 10MB limit)

Want to make any changes to the slides?
```

---

## Style Adaptation for Square Format

All styles from frontend-slides work for carousels, but require these adjustments:

### Typography Scaling

Square format has less horizontal space, so scale fonts:

| Element  | Presentation (16:9)              | Carousel (1:1) |
| -------- | -------------------------------- | -------------- |
| Title    | clamp(2rem, 6vw, 5rem)           | 72px (fixed)   |
| Subtitle | clamp(1.25rem, 3vw, 2.5rem)      | 36px (fixed)   |
| Body     | clamp(0.875rem, 1.5vw, 1.125rem) | 28px (fixed)   |
| Small    | clamp(0.75rem, 1vw, 0.875rem)    | 20px (fixed)   |

**Why fixed sizes?** We're targeting a single export size (1080×1080px), not responsive web viewing.

### Layout Adjustments

**Vertical space is precious:**

- Reduce top/bottom padding (80px instead of 4rem)
- Tighter line-height (1.2-1.4 instead of 1.5-1.6)
- Fewer list items per slide (max 3-4)
- Smaller decorative elements

**Mobile-first mindset:**

- Most LinkedIn users view on phones
- Text must be readable at thumbnail size
- High contrast is critical
- Bold, simple layouts beat intricate designs

---

## Content Best Practices

### Hook Formula (Cover Slide)

Strong hooks for LinkedIn carousels:

- Number + Promise: "5 workflows that 10x'd our outbound"
- Contrarian: "Stop doing X. Do this instead."
- Before/After: "How we went from X to Y in 30 days"
- Question: "Why are only 3% of founders doing this?"
- Curiosity gap: "The GTM strategy nobody talks about"

### Body Slides (Items 2-9)

Each slide should:

1. **One clear point** — Don't cram multiple concepts
2. **Visual hierarchy** — Large number/icon + heading + body
3. **Concrete, not abstract** — "Use job postings to find intent" not "Leverage signals"
4. **Scannable** — 2-3 second read time max

### Closing Slide

Always include a CTA:

- "Follow for more [topic]"
- "Repost if this helped"
- "Comment your biggest takeaway"
- "DM me if you want the full playbook"

Avoid:

- "Link in comments" (often gets buried)
- "Check out my website" (feels salesy)
- No CTA at all (wasted opportunity)

---

## Troubleshooting

### Fonts Not Loading in Screenshots

**Symptom:** Screenshots show default system fonts

**Solution:**

1. Use web-safe fonts (Arial, Georgia) OR
2. Add `await page.waitForLoadState('networkidle')` before screenshot
3. Increase wait timeout: `await page.waitForTimeout(1000)`

### Screenshots Are Blurry

**Symptom:** Text looks fuzzy or low-res

**Solution:**

1. Set device scale factor in Playwright:
   ```javascript
   await page.setViewportSize({
     width: 1080,
     height: 1080,
     deviceScaleFactor: 2, // Retina-quality
   });
   ```

### Content Overflows the Slide

**Symptom:** Text or elements cut off in screenshot

**Solution:**

1. Reduce font sizes
2. Decrease padding
3. Split into multiple slides
4. Simplify content (fewer bullets, shorter text)

### Colors Look Different in Export

**Symptom:** PNG colors don't match HTML preview

**Solution:**

- Ensure browser color profile matches sRGB
- Use hex colors, avoid CSS filters that may render differently
- Test screenshot script before generating all slides

---

## Preset Quick Reference

| Preset          | Best For               | Vibe                  |
| --------------- | ---------------------- | --------------------- |
| Bold Signal     | Confident, high-impact | Professional          |
| Dark Botanical  | Elegant, premium       | Sophisticated         |
| Notebook Tabs   | Editorial, organized   | Friendly-professional |
| Pastel Geometry | Friendly, approachable | Playful               |
| Neon Cyber      | Tech, innovation       | Futuristic            |
| Split Pastel    | Creative, fun          | Energetic             |

See STYLE_PRESETS.md for complete styling details.

---

## Related Skills

- **frontend-slides** — For full presentations (not carousels)
- **personalized-email** — For outreach content to pair with LinkedIn posts
- **deep-web-research** — For researching topics/stats for carousel content

---

## Example Session Flow

1. User: "Create a LinkedIn carousel about 5 AI GTM workflows"
2. Skill asks: content type, slide count, have content ready?
3. User provides bullet points of the 5 workflows
4. Skill asks: style preference
5. User picks "Bold Signal"
6. Skill generates 7 HTML slides (cover + 5 workflows + CTA)
7. Skill runs screenshot script automatically
8. Skill delivers folder with HTML + PNG exports
9. User uploads PNGs to LinkedIn and publishes

Total time: 5-10 minutes from idea to ready-to-publish carousel.
