# LinkedIn Carousel Style Presets

Visual styles optimized for square (1080×1080px) LinkedIn carousel posts. All styles use **fixed pixel sizing** since we're exporting to a specific resolution, not building responsive web pages.

---

## 🎨 Design Principles for LinkedIn Carousels

1. **Mobile-first** — Most viewers see this on phones at ~400px width
2. **High contrast** — Needs to be readable at thumbnail size
3. **Bold typography** — Larger fonts than typical web design
4. **Simple layouts** — Clean, uncluttered, one focus per slide
5. **Consistent branding** — Your handle/logo on every slide

---

## Format Specs

- **Size:** 1080×1080px (square, 1:1 ratio)
- **Typography:** Fixed pixel sizes (not responsive)
- **Padding:** Generous (80-100px) to prevent edge clipping
- **Line height:** Tighter (1.2-1.3) to fit more content
- **Content max:** 3-4 key points per slide

---

## Dark Themes

### 1. Bold Signal

**Vibe:** Confident, modern, high-impact

**Best for:** Professional content, frameworks, numbered lists

**Typography:**
- Display: `Archivo Black` (900)
- Body: `Space Grotesk` (400/500)

**Colors:**
```css
:root {
    --bg-primary: #1a1a1a;
    --bg-gradient: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 50%, #1a1a1a 100%);
    --card-bg: #FF5722;
    --text-primary: #ffffff;
    --text-on-card: #1a1a1a;
}
```

**Typography Scale (1080×1080px):**
```css
:root {
    --title-size: 80px;      /* Cover slide headline */
    --h2-size: 56px;         /* Slide titles */
    --body-size: 32px;       /* Body text */
    --number-size: 180px;    /* Big decorative numbers */
    --small-size: 22px;      /* Footer/brand */
    --slide-padding: 80px;
}
```

**Layout:**
- Large decorative number (01, 02, etc.) in background, low opacity
- Card element as focal point (orange/coral)
- Title in bold Archivo Black
- Body in Space Grotesk
- Brand handle in bottom corner

**Signature Elements:**
```html
<style>
    .number-bg {
        position: absolute;
        top: -40px;
        left: -20px;
        font-size: 180px;
        font-weight: 900;
        color: var(--card-bg);
        opacity: 0.12;
        z-index: 0;
    }

    .card {
        background: var(--card-bg);
        color: var(--text-on-card);
        padding: 40px;
        border-radius: 20px;
        position: relative;
        z-index: 1;
    }
</style>

<div class="number-bg">01</div>
<div class="card">
    <h2>Your Point Here</h2>
    <p>Supporting detail that explains the point clearly.</p>
</div>
```

---

### 2. Dark Botanical

**Vibe:** Elegant, sophisticated, premium

**Best for:** Thoughtful insights, frameworks, case studies

**Typography:**
- Display: `Cormorant` (400/600) — elegant serif
- Body: `IBM Plex Sans` (300/400)

**Colors:**
```css
:root {
    --bg-primary: #0f0f0f;
    --text-primary: #e8e4df;
    --text-secondary: #9a9590;
    --accent-warm: #d4a574;
    --accent-pink: #e8b4b8;
    --accent-gold: #c9b896;
}
```

**Typography Scale:**
```css
:root {
    --title-size: 72px;
    --h2-size: 52px;
    --body-size: 30px;
    --small-size: 20px;
    --slide-padding: 100px;
}
```

**Layout:**
- Centered content on dark background
- Abstract soft gradient circles (blurred, overlapping)
- Thin vertical accent lines
- Italic signature typography

**Signature Elements:**
```html
<style>
    .abstract-shapes {
        position: absolute;
        width: 100%;
        height: 100%;
        overflow: hidden;
        z-index: 0;
    }

    .shape-circle {
        position: absolute;
        border-radius: 50%;
        filter: blur(80px);
        opacity: 0.15;
    }

    .shape-1 {
        width: 400px;
        height: 400px;
        background: var(--accent-pink);
        top: -100px;
        right: -100px;
    }

    .shape-2 {
        width: 300px;
        height: 300px;
        background: var(--accent-gold);
        bottom: -50px;
        left: -50px;
    }

    .accent-line {
        position: absolute;
        width: 2px;
        height: 60%;
        background: var(--accent-warm);
        opacity: 0.3;
        left: 80px;
        top: 20%;
    }
</style>

<div class="abstract-shapes">
    <div class="shape-circle shape-1"></div>
    <div class="shape-circle shape-2"></div>
</div>
<div class="accent-line"></div>

<div class="slide-content" style="position: relative; z-index: 1;">
    <h2 style="font-style: italic;">Your Insight</h2>
    <p>Elegant explanation with sophistication.</p>
</div>
```

---

### 3. Neon Cyber

**Vibe:** Futuristic, techy, innovative

**Best for:** AI/tech content, dev tools, innovative workflows

**Typography:**
- Display: `Clash Display` (700) — Fontshare
- Body: `Satoshi` (400/500) — Fontshare

**Colors:**
```css
:root {
    --bg-primary: #0a0f1c;
    --bg-secondary: #111827;
    --text-primary: #ffffff;
    --accent-cyan: #00ffcc;
    --accent-magenta: #ff00aa;
    --glow: rgba(0, 255, 204, 0.4);
}
```

**Typography Scale:**
```css
:root {
    --title-size: 76px;
    --h2-size: 54px;
    --body-size: 30px;
    --small-size: 20px;
    --slide-padding: 80px;
}
```

**Layout:**
- Dark navy background with subtle grid
- Neon cyan/magenta accents with glow effects
- Tech-forward geometric elements
- Optional particle effects

**Signature Elements:**
```html
<style>
    .grid-bg {
        position: absolute;
        width: 100%;
        height: 100%;
        background-image:
            linear-gradient(rgba(0, 255, 204, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 255, 204, 0.03) 1px, transparent 1px);
        background-size: 60px 60px;
        z-index: 0;
    }

    .neon-text {
        color: var(--accent-cyan);
        text-shadow: 0 0 20px var(--glow),
                     0 0 40px var(--glow);
    }

    .neon-bar {
        width: 100%;
        height: 4px;
        background: linear-gradient(90deg, var(--accent-cyan), var(--accent-magenta));
        box-shadow: 0 0 20px var(--glow);
        margin: 30px 0;
    }
</style>

<div class="grid-bg"></div>

<div class="slide-content" style="position: relative; z-index: 1;">
    <h2 class="neon-text">AI-Powered Outbound</h2>
    <div class="neon-bar"></div>
    <p>Scale your GTM motion with intelligent automation.</p>
</div>
```

---

## Light Themes

### 4. Notebook Tabs

**Vibe:** Editorial, organized, friendly-professional

**Best for:** Lists, guides, educational content

**Typography:**
- Display: `Bodoni Moda` (400/700)
- Body: `DM Sans` (400/500)

**Colors:**
```css
:root {
    --bg-outer: #2d2d2d;
    --bg-page: #f8f6f1;
    --text-primary: #1a1a1a;
    --tab-1: #98d4bb; /* Mint */
    --tab-2: #c7b8ea; /* Lavender */
    --tab-3: #f4b8c5; /* Pink */
    --tab-4: #a8d8ea; /* Sky */
    --tab-5: #ffe6a7; /* Cream */
}
```

**Typography Scale:**
```css
:root {
    --title-size: 68px;
    --h2-size: 50px;
    --body-size: 28px;
    --small-size: 20px;
    --slide-padding: 80px;
}
```

**Layout:**
- Cream "paper" card on dark outer background
- Colorful tabs on right edge (vertical text)
- Editorial serif headlines
- Clean, organized content

**Signature Elements:**
```html
<style>
    body {
        background: var(--bg-outer);
        padding: 60px;
    }

    .paper-card {
        background: var(--bg-page);
        width: 960px;
        height: 960px;
        border-radius: 12px;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
        padding: 80px;
        position: relative;
    }

    .tabs {
        position: absolute;
        right: -20px;
        top: 150px;
        display: flex;
        flex-direction: column;
        gap: 20px;
    }

    .tab {
        width: 40px;
        height: 120px;
        background: var(--tab-color);
        border-radius: 0 8px 8px 0;
        display: flex;
        align-items: center;
        justify-content: center;
        writing-mode: vertical-rl;
        font-size: 14px;
        font-weight: 600;
        color: rgba(0, 0, 0, 0.6);
        text-transform: uppercase;
        letter-spacing: 1px;
    }
</style>

<div class="paper-card">
    <div class="tabs">
        <div class="tab" style="--tab-color: var(--tab-1);">Intro</div>
        <div class="tab" style="--tab-color: var(--tab-2); height: 160px;">Tips</div>
        <div class="tab" style="--tab-color: var(--tab-3);">Tools</div>
    </div>

    <h2>Step-by-Step Guide</h2>
    <ul>
        <li>First key point</li>
        <li>Second key point</li>
        <li>Third key point</li>
    </ul>
</div>
```

---

### 5. Pastel Geometry

**Vibe:** Friendly, approachable, modern

**Best for:** Tips, beginner content, friendly guides

**Typography:**
- Display: `Plus Jakarta Sans` (700/800)
- Body: `Plus Jakarta Sans` (400/500)

**Colors:**
```css
:root {
    --bg-primary: #c8d9e6;
    --card-bg: #faf9f7;
    --pill-pink: #f0b4d4;
    --pill-mint: #a8d4c4;
    --pill-sage: #5a7c6a;
    --pill-lavender: #9b8dc4;
    --pill-violet: #7c6aad;
}
```

**Typography Scale:**
```css
:root {
    --title-size: 70px;
    --h2-size: 48px;
    --body-size: 28px;
    --small-size: 20px;
    --slide-padding: 70px;
}
```

**Layout:**
- White card on pastel background
- Decorative vertical pills on right edge
- Rounded, friendly design
- Clean sans-serif typography

**Signature Elements:**
```html
<style>
    body {
        background: var(--bg-primary);
        padding: 60px;
    }

    .card {
        background: var(--card-bg);
        width: 960px;
        height: 960px;
        border-radius: 20px;
        box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
        padding: 70px;
        position: relative;
    }

    .pills {
        position: absolute;
        right: 30px;
        top: 50%;
        transform: translateY(-50%);
        display: flex;
        flex-direction: column;
        gap: 12px;
    }

    .pill {
        width: 12px;
        border-radius: 6px;
        background: var(--pill-color);
    }
</style>

<div class="card">
    <div class="pills">
        <div class="pill" style="--pill-color: var(--pill-pink); height: 80px;"></div>
        <div class="pill" style="--pill-color: var(--pill-mint); height: 120px;"></div>
        <div class="pill" style="--pill-color: var(--pill-sage); height: 160px;"></div>
        <div class="pill" style="--pill-color: var(--pill-lavender); height: 120px;"></div>
        <div class="pill" style="--pill-color: var(--pill-violet); height: 80px;"></div>
    </div>

    <h2>5 Quick Tips</h2>
    <p>Friendly, approachable content here.</p>
</div>
```

---

### 6. Split Pastel

**Vibe:** Playful, modern, energetic

**Best for:** Creative content, fun lists, casual tips

**Typography:**
- Display: `Outfit` (700/800)
- Body: `Outfit` (400/500)

**Colors:**
```css
:root {
    --bg-peach: #f5e6dc;
    --bg-lavender: #e4dff0;
    --text-dark: #1a1a1a;
    --badge-mint: #c8f0d8;
    --badge-yellow: #f0f0c8;
    --badge-pink: #f0d4e0;
}
```

**Typography Scale:**
```css
:root {
    --title-size: 68px;
    --h2-size: 48px;
    --body-size: 28px;
    --small-size: 20px;
    --slide-padding: 80px;
}
```

**Layout:**
- Vertical split: peach left, lavender right
- Playful badge pills
- Rounded, modern design
- Energetic, colorful

**Signature Elements:**
```html
<style>
    body {
        display: flex;
        margin: 0;
        padding: 0;
    }

    .panel-left {
        width: 540px;
        height: 1080px;
        background: var(--bg-peach);
        padding: 80px 40px 80px 80px;
    }

    .panel-right {
        width: 540px;
        height: 1080px;
        background: var(--bg-lavender);
        padding: 80px 80px 80px 40px;
    }

    .badge {
        display: inline-block;
        padding: 8px 20px;
        border-radius: 20px;
        font-size: 18px;
        font-weight: 600;
        margin-right: 10px;
        margin-bottom: 10px;
    }
</style>

<div class="panel-left">
    <h2>Left Content</h2>
    <span class="badge" style="background: var(--badge-mint);">Tag</span>
    <span class="badge" style="background: var(--badge-yellow);">Fun</span>
</div>

<div class="panel-right">
    <!-- Right panel content -->
</div>
```

---

## Typography Quick Reference

**Fixed sizes for 1080×1080px format:**

| Element | Size | Line Height | Weight |
|---------|------|-------------|--------|
| Cover title | 72-80px | 1.1 | 800-900 |
| Slide title (h2) | 48-56px | 1.2 | 700-800 |
| Body text | 28-32px | 1.3-1.4 | 400-500 |
| Small/footer | 20-22px | 1.3 | 400-500 |
| Big numbers | 140-180px | 1 | 900 |

**Spacing:**
- Slide padding: 80-100px
- Content gap: 30-40px
- Line spacing: Tight (1.2-1.4) to fit more content

---

## Layout Patterns

### Pattern 1: Number + Heading + Body (Most Common)

```html
<div class="slide-content">
    <div class="number-bg">01</div>
    <h2>Your Point Title</h2>
    <p>Supporting detail that explains the concept clearly and concisely.</p>
</div>
<div class="brand">@yourbrand • 1/5</div>
```

### Pattern 2: Icon + Heading + List

```html
<div class="slide-content">
    <div class="icon">🚀</div>
    <h2>Key Takeaways</h2>
    <ul>
        <li>First takeaway</li>
        <li>Second takeaway</li>
        <li>Third takeaway</li>
    </ul>
</div>
```

### Pattern 3: Large Stat + Context

```html
<div class="slide-content" style="text-align: center;">
    <div class="stat">10x</div>
    <h2>Faster Outreach</h2>
    <p>with AI-powered personalization</p>
</div>
```

---

## Font Loading (Google Fonts & Fontshare)

**Google Fonts:**
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700&family=Archivo+Black&display=swap" rel="stylesheet">
```

**Fontshare (for Neon Cyber style):**
```html
<link href="https://api.fontshare.com/v2/css?f[]=clash-display@700&f[]=satoshi@400,500&display=swap" rel="stylesheet">
```

---

## Branding Footer

Every slide should include your brand handle in the corner:

```html
<style>
    .brand {
        position: absolute;
        bottom: 30px;
        right: 30px;
        font-size: 20px;
        opacity: 0.7;
        font-weight: 500;
    }
</style>

<div class="brand">@yourhandle • 2/5</div>
```

**Variations:**
- Cover slide: Just handle (`@yourhandle`)
- Content slides: Handle + progress (`@yourhandle • 2/5`)
- CTA slide: Just handle

---

## Testing Checklist

Before screenshotting:

- [ ] All slides are exactly 1080×1080px
- [ ] Text is readable at small size (~400px thumbnail)
- [ ] High contrast between text and background
- [ ] Fonts load correctly (check web fonts)
- [ ] No content overflow (everything fits in viewport)
- [ ] Brand handle on every slide
- [ ] Consistent styling across all slides
- [ ] Numbers/progress indicators correct

---

## Related Documentation

- **SKILL.md** — Full workflow and usage guide
- **frontend-slides** — Parent skill for full presentations
- **screenshot-slides.js** — Automated PNG export script
