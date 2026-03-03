# LinkedIn Carousel Creator

Create stunning LinkedIn carousel posts as high-quality PNG images (1080×1080px).

## Quick Start

1. **Tell me what you want to create:**
   - "Create a carousel about 5 AI GTM workflows"
   - "Make a LinkedIn post: How to use Claude Code effectively"
   - "7 mistakes founders make with outbound"

2. **Choose a style** (or I'll show you options)

3. **Get your carousel:**
   - HTML slides for preview
   - PNG exports ready for LinkedIn upload

---

## What This Skill Does

✅ Generates styled HTML slides (1080×1080px)  
✅ Automatically screenshots each slide as PNG  
✅ Exports ready-to-upload carousel images  
✅ Consistent branding and styling  
✅ Optimized for LinkedIn's feed

---

## First Time Setup

The screenshot tool needs Playwright:

```bash
cd /path/to/skills/create-html-carousel
npm install
npm run setup  # Installs Chromium browser
```

This only needs to be done once.

---

## Available Styles

| Style | Best For |
|-------|----------|
| **Bold Signal** | Professional, high-impact content |
| **Dark Botanical** | Elegant, sophisticated insights |
| **Neon Cyber** | Tech/AI content, futuristic |
| **Notebook Tabs** | Educational, organized guides |
| **Pastel Geometry** | Friendly, approachable tips |
| **Split Pastel** | Playful, creative content |

See `STYLE_PRESETS.md` for visual examples and details.

---

## Content Best Practices

### Cover Slide (Slide 1)
- **Hook** — Number + Promise: "5 workflows that 10x'd our outbound"
- **Title** — Clear, benefit-driven
- **Branding** — Your handle

### Content Slides (2-9)
- **One point per slide** — Don't cram multiple concepts
- **Scannable** — 2-3 second read time max
- **Visual hierarchy** — Number/icon + heading + body

### Closing Slide (Last)
- **CTA** — "Follow for more [topic]" or "Repost if this helped"
- **No salesy links** — Focus on engagement

---

## File Structure

After generation, you'll get:

```
[carousel-name]/
├── index.html              # Preview all slides with navigation
├── slides/
│   ├── slide-01.html       # Individual slide HTML files
│   ├── slide-02.html
│   └── ...
└── exports/                # Screenshot PNGs (1080×1080px)
    ├── slide-01.png
    ├── slide-02.png
    └── ...
```

---

## Uploading to LinkedIn

1. Create new LinkedIn post
2. Click **"Add media"**
3. Upload all PNGs from `exports/` folder (in order)
4. Write your post copy
5. Publish!

LinkedIn automatically creates the carousel from multiple images.

---

## Example Session

```
You: "Create a LinkedIn carousel about 5 AI GTM workflows"

Goose: I'll create that for you. Quick questions:
       - How many slides total? (5-8 recommended)
       - Do you have the content, or should I help outline it?
       - Style preference? (I can show you options)

You: 7 slides total (cover + 5 workflows + CTA). I'll paste my notes. 
     Use Bold Signal style.

Goose: *generates HTML slides + screenshots*

       ✨ Your carousel is ready!
       📁 Location: /workspace/ai-gtm-workflows/
       📤 6 PNG files ready to upload

You: Perfect! Upload it to LinkedIn.
```

---

## Troubleshooting

**Fonts not loading in screenshots?**
→ Increase wait time in `screenshot-slides.js` (line 72): `await page.waitForTimeout(1000);`

**Screenshots are blurry?**
→ Already set to Retina quality (2x deviceScaleFactor). Check your display settings.

**Content doesn't fit?**
→ Reduce font sizes, decrease padding, or split into more slides.

---

## Related Skills

- **frontend-slides** — Full HTML presentations (not carousels)
- **personalized-email** — Outreach to pair with LinkedIn posts
- **content-creator** — Generate post copy and ideas

---

## Files in This Skill

- `SKILL.md` — Complete documentation and workflow
- `STYLE_PRESETS.md` — Visual style reference
- `screenshot-slides.js` — Automated PNG export script
- `package.json` — Dependencies (Playwright)
- `README.md` — This file

---

**Ready to create your first carousel?** Just tell me the topic! 🪿
