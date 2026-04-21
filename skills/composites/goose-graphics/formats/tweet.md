# Format: Tweet

Create social proof and testimonial graphics at 1080x1080px (1:1 square). A tweet, review, or quote is displayed as a card floating on a decorative background -- perfect for customer testimonials, social proof screenshots, notable quotes from Twitter/X or LinkedIn, and reviews presented as beautiful standalone graphics.

---

## 1. Format Specifications

| Property | Value |
|----------|-------|
| Dimensions | 1080 x 1080px (1:1 square) |
| File structure | Single HTML file (`index.html`) |
| Aspect ratio | 1:1 (works on Instagram, LinkedIn, Twitter/X) |
| Output format | Single PNG |
| Sizing approach | Fixed pixel sizes (NOT responsive) |
| Design approach | Testimonial card centered on decorative background |

### Content Density Limits

The tweet card must look like a real social media post -- clean and readable. The background is decorative but should not compete with the card.

| Element | Max Content |
|---------|-------------|
| Display name | 1 line, 30 characters max |
| Handle / title | 1 line, 40 characters max |
| Post body text | Full tweet text -- do NOT truncate or compress |
| Engagement metrics | 3-4 numbers (likes, retweets, replies, views) |
| Star rating | 1-5 stars |
| Timestamp | 1 line |
| Attribution | Name + role/company, 1-2 lines |
| Brand watermark | Small mark in bottom corner of overall graphic |

**IMPORTANT -- Show the full text:** Always display the complete tweet/testimonial text. Do NOT truncate, summarize, or compress the body text. If the text is long, increase the card height to accommodate it -- the card should grow vertically as needed within the 1080x1080 frame. Use `font-size: 18-20px` for body text and `line-height: 1.6` for comfortable reading. The card width stays fixed (~800px), but height is flexible.

**If content truly exceeds the frame** (very rare -- would need 500+ characters): Only then trim with an ellipsis, but try font-size reduction first (minimum 16px).

---

## 2. Workflow Overview

```
Content Discovery --> Style Selection --> HTML Generation --> Screenshot --> Delivery
```

1. Gather the testimonial content, source type, and attribution from the user
2. Present style presets and let the user choose (or guide them)
3. Read the chosen style preset from `styles/[name].md`
4. Generate a single HTML file with the card-on-background composition
5. Run the screenshot tool to export the PNG
6. Present the finished file to the user

---

## 3. Content Discovery Phase

Ask the user these questions before generating anything.

**Question 1: Content**
- "What testimonial or quote do you want to feature?"
- Free text input -- could be a tweet URL, pasted text, or a description

**Question 2: Content Type**
- "What kind of testimonial is this?"
- Options:
  - **Twitter/X Post** -- Tweet with profile, handle, text, engagement metrics
  - **LinkedIn Post** -- Professional post with name, title, company, reactions
  - **Customer Review** -- Star rating, review text, reviewer name + company
  - **Quote Testimonial** -- Large editorial quote with attribution
  - **Chat Message** -- Slack/iMessage-style conversation thread (2-3 messages)

**Question 3: Attribution**
- "Who said this? (Name, handle, role, company)"
- Needed for the profile area of the card

**Question 4: Content Readiness**
- "Do you have the exact text ready?"
- Options:
  - **Yes, use this exact text** -- Paste it in
  - **Paraphrase this** -- Need help cleaning up
  - **Just the gist** -- Need help writing a compelling testimonial

If the user has content, ask them to share it before proceeding.

### Auto-Fetching from Tweet URLs

**If the user provides a tweet URL (x.com or twitter.com),** use the tweet fetcher tool to automatically extract all data:

```bash
node [skill-pack-dir]/screenshot/fetch-tweet.js <tweet-url>
```

This returns JSON with:
- `text` -- Full tweet text (cleaned of t.co URLs)
- `author.name` -- Display name
- `author.handle` -- @handle
- `author.profileImage` -- 400x400 profile photo URL (use in `<img>` tag)
- `author.isVerified` -- Blue checkmark status
- `metrics.likes`, `metrics.retweets`, etc. -- Engagement counts
- `metrics.likesFormatted` -- Human-readable counts (e.g., "1.2K")
- `date.formatted` -- Formatted timestamp (e.g., "11:45 AM · April 5, 2026")

**When tweet data is fetched:**
- Skip Questions 2-4 (auto-detected as Twitter/X Post)
- Use the real profile photo URL in an `<img>` tag (NOT CSS initials)
- Use the full tweet text (do NOT truncate or compress)
- Use the real engagement metrics
- Use the real timestamp

---

## 4. Style Selection Phase

Present the 10 available design presets. For tweet graphics, the preset controls the **background** behind the card (gradients, colors, patterns) and the accent colors on the card itself.

| # | Preset | Description |
|---|--------|-------------|
| 1 | **Midnight Editorial** | Dark, elegant, magazine-inspired with copper accents |
| 2 | **Clean Slate** | Ultra-minimal, precise, modern tech aesthetic |
| 3 | **Warm Earth** | Organic, artisanal, grounded with natural tones |
| 4 | **Electric Burst** | Bold, energetic, attention-grabbing with vivid color |
| 5 | **Soft Cloud** | Airy, modern, approachable with gentle pastels |
| 6 | **Terminal** | Dev/hacker aesthetic, focused and technical |
| 7 | **Paper & Ink** | Classic editorial, literary, print-inspired |
| 8 | **Brutalist** | Raw, structural, anti-design with strong geometry |
| 9 | **Golden Dusk** | Warm, luxurious, premium with rich gold tones |
| 10 | **Deep Ocean** | Calm, professional, immersive blue-dark palette |

**Additional options:**

- **"I have a reference image"** -- Use the `extract-style` skill at `styles/extract-style.md` to derive a custom palette from the user's image.
- **Guided discovery** -- If the user is unsure, ask about their audience and tone, then recommend 2-3 presets:
  - Professional / Corporate --> Clean Slate, Deep Ocean, Midnight Editorial
  - Creative / Playful --> Electric Burst, Soft Cloud, Warm Earth
  - Technical / Dev-focused --> Terminal, Brutalist, Clean Slate
  - Elegant / Premium --> Midnight Editorial, Golden Dusk, Paper & Ink
  - Friendly / Approachable --> Soft Cloud, Warm Earth, Clean Slate

**After selection:** Read the chosen style preset file from `styles/[name].md` to load all colors, typography, and component patterns. For example, if the user picks "Soft Cloud", read `styles/soft-cloud.md`.

---

## 5. HTML Generation Phase

### Base CSS (Mandatory)

Tweet graphics are fixed-size 1080x1080 square compositions. The card floats centered on a full-bleed decorative background.

```css
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

html, body {
    width: 1080px;
    height: 1080px;
    overflow: hidden;
}

body {
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
}
```

### Injecting the Style Preset

After reading the style preset file, find its **Section 9 (Agent Prompt Guide)** which contains the CSS `:root` variables. Paste those variables into the `<style>` block:

```css
:root {
    /* -- Paste all CSS variables from the preset's Section 9 here -- */

    /* Tweet-specific overrides */
    --tweet-width: 1080px;
    --tweet-height: 1080px;
    --card-width: 800px;
    --card-padding: 48px;
    --card-radius: 18px;
    --card-bg: #ffffff;
    --card-text: #0f1419;
    --card-text-secondary: #536471;
    --card-border: rgba(0, 0, 0, 0.04);
}
```

Also add the Google Fonts `<link>` from the preset's Section 9 into the `<head>`.

### Using Component Patterns

The preset's **Section 4 (Component Patterns)** contains ready-to-use HTML snippets. Adapt these for the tweet card's internal elements (avatars, names, text).

The preset's **Section 8 (Format Adaptation Notes)** contains format-specific guidance. For tweets, the preset primarily controls the **background** and **accent colors**. The card itself stays white/light with dark text to maintain readability and the "social media post" feel.

### Card-on-Background Composition

The tweet format uses a two-layer composition: a decorative full-bleed background, and a centered card on top.

```
+----------------------------------+
|                                  |
|    [DECORATIVE BACKGROUND]       |   Full 1080x1080
|    gradient / color / pattern    |
|    from style preset             |
|                                  |
|    +------------------------+    |
|    |                        |    |
|    |    TWEET CARD           |    |   Card: ~800px wide
|    |    White/light bg       |    |   Centered vertically
|    |    Rounded corners      |    |   and horizontally
|    |    Subtle shadow        |    |
|    |                        |    |
|    |    - Avatar + Name     |    |
|    |    - Post content      |    |
|    |    - Metadata/metrics  |    |
|    |                        |    |
|    +------------------------+    |
|                                  |
|                   @yourbrand     |   Brand watermark
+----------------------------------+
```

### Component Patterns

#### Avatar

**When a real profile photo URL is available** (from the tweet fetcher), use an `<img>` tag:

```html
<img class="avatar" src="https://pbs.twimg.com/profile_images/.../photo_400x400.jpg" alt="Profile photo">
```

**Fallback** (when no image URL is available), use CSS initials:

```html
<div class="avatar avatar-fallback" style="background: var(--color-accent, #1da1f2);">
    <span class="avatar-initials">JD</span>
</div>
```

```css
.avatar {
    width: 52px;
    height: 52px;
    border-radius: 50%;
    flex-shrink: 0;
    object-fit: cover;
}

.avatar-fallback {
    display: flex;
    align-items: center;
    justify-content: center;
}

.avatar-initials {
    font-family: var(--font-body);
    font-size: 20px;
    font-weight: 700;
    color: #ffffff;
    letter-spacing: 0.5px;
}
```

#### Engagement Metrics Row

```html
<div class="metrics">
    <span class="metric"><span class="metric-icon">&#9825;</span> 2,847</span>
    <span class="metric"><span class="metric-icon">&#8635;</span> 391</span>
    <span class="metric"><span class="metric-icon">&#128172;</span> 84</span>
</div>
```

```css
.metrics {
    display: flex;
    gap: 28px;
}

.metric {
    font-family: var(--font-body);
    font-size: 14px;
    color: var(--card-text-secondary);
    display: flex;
    align-items: center;
    gap: 6px;
}

.metric-icon {
    font-size: 16px;
}
```

#### Star Rating

```html
<div class="stars">
    <span class="star filled">&#9733;</span>
    <span class="star filled">&#9733;</span>
    <span class="star filled">&#9733;</span>
    <span class="star filled">&#9733;</span>
    <span class="star filled">&#9733;</span>
</div>
```

```css
.stars {
    display: flex;
    gap: 4px;
}

.star {
    font-size: 22px;
    color: #d1d5db;
}

.star.filled {
    color: #f59e0b;
}
```

### Complete HTML Template

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=1080, initial-scale=1.0">
    <title>Tweet Graphic</title>

    <!-- Google Fonts: paste the link from your chosen preset's Section 9 -->
    <link href="https://fonts.googleapis.com/css2?family=PRESET_FONTS_HERE&display=swap" rel="stylesheet">

    <style>
        /* =============================================
           TWEET: 1080x1080px FIXED (1:1 Square)
           ============================================= */

        :root {
            /* -- Paste CSS variables from preset Section 9 -- */

            /* Tweet-specific layout */
            --tweet-width: 1080px;
            --tweet-height: 1080px;
            --card-width: 800px;
            --card-padding: 48px;
            --card-radius: 18px;
            --card-bg: #ffffff;
            --card-text: #0f1419;
            --card-text-secondary: #536471;
            --card-border: rgba(0, 0, 0, 0.04);
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        html, body {
            width: var(--tweet-width);
            height: var(--tweet-height);
            overflow: hidden;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
        }

        body {
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
        }

        /* =============================================
           DECORATIVE BACKGROUND
           ============================================= */

        .background {
            position: absolute;
            inset: 0;
            /* Default: gradient using preset colors.
               Override per-preset with solid, gradient, or pattern. */
            background: linear-gradient(
                135deg,
                var(--bg-primary, #0d0d0d) 0%,
                var(--color-surface, #1a1a1a) 50%,
                var(--bg-primary, #0d0d0d) 100%
            );
            z-index: 0;
        }

        /* Optional: subtle pattern overlay */
        .background::after {
            content: '';
            position: absolute;
            inset: 0;
            background: radial-gradient(
                circle at 30% 40%,
                var(--color-accent, rgba(193, 127, 89, 0.15)) 0%,
                transparent 60%
            );
        }

        /* =============================================
           TWEET CARD
           ============================================= */

        .card {
            position: relative;
            z-index: 1;
            width: var(--card-width);
            background: var(--card-bg);
            border-radius: var(--card-radius);
            padding: var(--card-padding);
            box-shadow:
                0 4px 6px rgba(0, 0, 0, 0.04),
                0 10px 40px rgba(0, 0, 0, 0.08),
                0 0 0 1px var(--card-border);
        }

        /* =============================================
           CARD HEADER (Avatar + Name)
           ============================================= */

        .card-header {
            display: flex;
            align-items: center;
            gap: 14px;
            margin-bottom: 20px;
        }

        .avatar {
            width: 52px;
            height: 52px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
        }

        .avatar-initials {
            font-family: var(--font-body);
            font-size: 20px;
            font-weight: 700;
            color: #ffffff;
            letter-spacing: 0.5px;
        }

        .author-info {
            display: flex;
            flex-direction: column;
            gap: 2px;
        }

        .author-name {
            font-family: var(--font-body);
            font-size: 17px;
            font-weight: 700;
            color: var(--card-text);
            line-height: 1.2;
        }

        .author-handle {
            font-family: var(--font-body);
            font-size: 15px;
            font-weight: 400;
            color: var(--card-text-secondary);
            line-height: 1.2;
        }

        /* =============================================
           CARD BODY
           ============================================= */

        .card-body {
            font-family: var(--font-body);
            font-size: 20px;
            font-weight: 400;
            line-height: 1.55;
            color: var(--card-text);
            margin-bottom: 24px;
        }

        /* =============================================
           CARD FOOTER (Metrics / Timestamp)
           ============================================= */

        .card-footer {
            display: flex;
            flex-direction: column;
            gap: 16px;
        }

        .timestamp {
            font-family: var(--font-body);
            font-size: 14px;
            color: var(--card-text-secondary);
        }

        .divider {
            width: 100%;
            height: 1px;
            background: #eff3f4;
        }

        .metrics {
            display: flex;
            gap: 28px;
        }

        .metric {
            font-family: var(--font-body);
            font-size: 14px;
            color: var(--card-text-secondary);
            display: flex;
            align-items: center;
            gap: 6px;
        }

        .metric-icon {
            font-size: 16px;
        }

        .metric-count {
            font-weight: 700;
            color: var(--card-text);
        }

        /* =============================================
           STAR RATING
           ============================================= */

        .stars {
            display: flex;
            gap: 4px;
            margin-bottom: 16px;
        }

        .star {
            font-size: 22px;
            color: #d1d5db;
        }

        .star.filled {
            color: #f59e0b;
        }

        /* =============================================
           QUOTE MARKS
           ============================================= */

        .quote-mark {
            font-family: Georgia, 'Times New Roman', serif;
            font-size: 80px;
            line-height: 0.6;
            color: var(--color-accent, #c17f59);
            opacity: 0.3;
        }

        /* =============================================
           CHAT BUBBLES
           ============================================= */

        .chat-bubble {
            padding: 14px 20px;
            border-radius: 18px;
            font-family: var(--font-body);
            font-size: 17px;
            line-height: 1.45;
            max-width: 85%;
        }

        .chat-bubble-incoming {
            background: #f0f0f0;
            color: var(--card-text);
            border-bottom-left-radius: 4px;
            align-self: flex-start;
        }

        .chat-bubble-outgoing {
            background: var(--color-accent, #1da1f2);
            color: #ffffff;
            border-bottom-right-radius: 4px;
            align-self: flex-end;
        }

        /* =============================================
           BRAND WATERMARK
           ============================================= */

        .brand-watermark {
            position: absolute;
            bottom: 28px;
            right: 36px;
            z-index: 2;
            font-family: var(--font-body);
            font-size: 14px;
            font-weight: 500;
            color: var(--text-primary, #f5f0e8);
            opacity: 0.4;
        }
    </style>
</head>
<body>

    <!-- DECORATIVE BACKGROUND -->
    <div class="background"></div>

    <!-- TWEET CARD -->
    <div class="card">
        <!-- Card content goes here (see Content Templates) -->
    </div>

    <!-- BRAND WATERMARK -->
    <div class="brand-watermark">@yourbrand</div>

</body>
</html>
```

---

## 6. Content Templates

All templates use CSS custom properties so they work with any style preset. Each template shows a complete `<body>` with the background, card, and watermark.

### Twitter/X Post

A tweet displayed as a card with avatar, handle, body text, timestamp, and engagement metrics. The most common social proof format.

```html
<body>

    <!-- DECORATIVE BACKGROUND -->
    <div class="background"></div>

    <!-- TWEET CARD -->
    <div class="card">

        <!-- Header: Avatar + Author -->
        <div class="card-header">
            <div class="avatar" style="background: #1da1f2;">
                <span class="avatar-initials">JD</span>
            </div>
            <div class="author-info">
                <span class="author-name">Jane Doe</span>
                <span class="author-handle">@janedoe</span>
            </div>
        </div>

        <!-- Body: Tweet text -->
        <div class="card-body">
            We switched to @yourbrand three weeks ago and our response time dropped from 4 hours to 12 minutes. Not exaggerating. The AI agents handle 80% of inbound automatically and the quality is better than what we were doing manually.
        </div>

        <!-- Footer: Timestamp + Metrics -->
        <div class="card-footer">
            <span class="timestamp">2:47 PM &middot; Mar 28, 2026</span>
            <div class="divider"></div>
            <div class="metrics">
                <span class="metric">
                    <span class="metric-icon">&#9825;</span>
                    <span class="metric-count">2,847</span>
                </span>
                <span class="metric">
                    <span class="metric-icon">&#8635;</span>
                    <span class="metric-count">391</span>
                </span>
                <span class="metric">
                    <span class="metric-icon">&#128172;</span>
                    <span class="metric-count">84</span>
                </span>
            </div>
        </div>

    </div>

    <!-- BRAND WATERMARK -->
    <div class="brand-watermark">@yourbrand</div>

</body>
```

### LinkedIn Post

A professional testimonial styled as a LinkedIn post with name, title/company, post text, and reaction count.

```html
<body>

    <!-- DECORATIVE BACKGROUND -->
    <div class="background"></div>

    <!-- TWEET CARD -->
    <div class="card">

        <!-- Header: Avatar + Author + Title -->
        <div class="card-header">
            <div class="avatar" style="background: #0a66c2;">
                <span class="avatar-initials">MR</span>
            </div>
            <div class="author-info">
                <span class="author-name">Marcus Rodriguez</span>
                <span class="author-handle" style="font-size: 14px;">VP of Operations at Meridian Labs</span>
            </div>
        </div>

        <!-- Body: Post text -->
        <div class="card-body">
            We've been testing AI agent teams for the last quarter and I have to say -- the results exceeded every projection we had. Our ops team went from spending 60% of their day on repetitive coordination to focusing almost entirely on strategy.
            <br><br>
            The key insight: it's not about replacing people. It's about giving your best people the leverage to do their best work.
        </div>

        <!-- Footer: Reactions -->
        <div class="card-footer">
            <div class="divider"></div>
            <div class="metrics">
                <span class="metric">
                    <span style="font-size: 14px;">&#128077;&#10084;&#65039;&#128079;</span>
                    <span class="metric-count" style="margin-left: 4px;">1,243</span>
                </span>
                <span class="metric">
                    <span style="font-size: 13px;">86 comments</span>
                </span>
                <span class="metric">
                    <span style="font-size: 13px;">34 reposts</span>
                </span>
            </div>
        </div>

    </div>

    <!-- BRAND WATERMARK -->
    <div class="brand-watermark">@yourbrand</div>

</body>
```

### Customer Review

A product review with star rating, review text, and reviewer attribution. Great for social proof on landing pages and ads.

```html
<body>

    <!-- DECORATIVE BACKGROUND -->
    <div class="background"></div>

    <!-- TWEET CARD -->
    <div class="card">

        <!-- Star Rating -->
        <div class="stars">
            <span class="star filled">&#9733;</span>
            <span class="star filled">&#9733;</span>
            <span class="star filled">&#9733;</span>
            <span class="star filled">&#9733;</span>
            <span class="star filled">&#9733;</span>
        </div>

        <!-- Review Title -->
        <div style="font-family: var(--font-body); font-size: 22px; font-weight: 700; color: var(--card-text); margin-bottom: 16px; line-height: 1.3;">
            "Game changer for our support team"
        </div>

        <!-- Body: Review text -->
        <div class="card-body">
            We were drowning in support tickets -- 200+ per day with a 3-person team. After deploying AI agents through this platform, our first-response time went from 6 hours to under 5 minutes. The agents handle tier-1 issues completely on their own and escalate complex cases with full context. Our CSAT score jumped from 3.2 to 4.7 in the first month.
        </div>

        <!-- Footer: Attribution -->
        <div class="card-footer">
            <div class="divider"></div>
            <div class="card-header" style="margin-bottom: 0; padding-top: 8px;">
                <div class="avatar" style="background: #10b981; width: 44px; height: 44px;">
                    <span class="avatar-initials" style="font-size: 16px;">AK</span>
                </div>
                <div class="author-info">
                    <span class="author-name" style="font-size: 15px;">Aisha Kapoor</span>
                    <span class="author-handle" style="font-size: 13px;">Head of Support, CloudStack Inc.</span>
                </div>
            </div>
        </div>

    </div>

    <!-- BRAND WATERMARK -->
    <div class="brand-watermark">@yourbrand</div>

</body>
```

### Quote Testimonial

A large editorial-style quote with decorative quote marks and clean attribution. The most design-forward option -- great for hero sections, pitch decks, and brand content.

```html
<body>

    <!-- DECORATIVE BACKGROUND -->
    <div class="background"></div>

    <!-- TWEET CARD -->
    <div class="card" style="text-align: center; padding: 56px 52px;">

        <!-- Decorative Quote Mark -->
        <div class="quote-mark" style="margin-bottom: 16px;">&ldquo;</div>

        <!-- Quote Text -->
        <div class="card-body" style="font-size: 24px; line-height: 1.55; font-weight: 400; margin-bottom: 32px; max-width: 640px; margin-left: auto; margin-right: auto;">
            The best teams of the next decade won't just have the best people. They'll have the best agents working alongside them. This platform made that real for us in a single afternoon.
        </div>

        <!-- Attribution Divider -->
        <div style="width: 48px; height: 2px; background: var(--color-accent, #c17f59); margin: 0 auto 24px;"></div>

        <!-- Attribution -->
        <div style="display: flex; flex-direction: column; align-items: center; gap: 4px;">
            <div class="avatar" style="background: var(--color-accent, #c17f59); width: 48px; height: 48px; margin-bottom: 8px;">
                <span class="avatar-initials" style="font-size: 18px;">SC</span>
            </div>
            <span class="author-name" style="font-size: 16px;">Sarah Chen</span>
            <span class="author-handle" style="font-size: 14px;">VP of Operations, Nexus Partners</span>
        </div>

    </div>

    <!-- BRAND WATERMARK -->
    <div class="brand-watermark">@yourbrand</div>

</body>
```

### Chat Message

A Slack or iMessage-style conversation snippet showing 2-3 messages in a thread. Perfect for showing real user reactions, internal team praise, or conversational social proof.

```html
<body>

    <!-- DECORATIVE BACKGROUND -->
    <div class="background"></div>

    <!-- TWEET CARD -->
    <div class="card" style="padding: 40px 44px;">

        <!-- Chat Header -->
        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 28px; padding-bottom: 16px; border-bottom: 1px solid #eff3f4;">
            <div style="width: 10px; height: 10px; border-radius: 50%; background: #22c55e;"></div>
            <span style="font-family: var(--font-body); font-size: 15px; font-weight: 600; color: var(--card-text);">#team-wins</span>
            <span style="font-family: var(--font-body); font-size: 13px; color: var(--card-text-secondary); margin-left: auto;">Today</span>
        </div>

        <!-- Message Thread -->
        <div style="display: flex; flex-direction: column; gap: 20px;">

            <!-- Message 1 -->
            <div style="display: flex; gap: 12px; align-items: flex-start;">
                <div class="avatar" style="background: #6366f1; width: 36px; height: 36px;">
                    <span class="avatar-initials" style="font-size: 13px;">TW</span>
                </div>
                <div>
                    <div style="display: flex; gap: 8px; align-items: baseline; margin-bottom: 4px;">
                        <span style="font-family: var(--font-body); font-size: 15px; font-weight: 700; color: var(--card-text);">Tom Walsh</span>
                        <span style="font-family: var(--font-body); font-size: 12px; color: var(--card-text-secondary);">10:32 AM</span>
                    </div>
                    <div class="chat-bubble chat-bubble-incoming" style="border-radius: 4px 18px 18px 18px; max-width: 100%;">
                        Just checked the numbers from last week. The AI agent handled 847 support tickets completely autonomously. Zero escalations on tier-1.
                    </div>
                </div>
            </div>

            <!-- Message 2 -->
            <div style="display: flex; gap: 12px; align-items: flex-start;">
                <div class="avatar" style="background: #ec4899; width: 36px; height: 36px;">
                    <span class="avatar-initials" style="font-size: 13px;">RP</span>
                </div>
                <div>
                    <div style="display: flex; gap: 8px; align-items: baseline; margin-bottom: 4px;">
                        <span style="font-family: var(--font-body); font-size: 15px; font-weight: 700; color: var(--card-text);">Rachel Park</span>
                        <span style="font-family: var(--font-body); font-size: 12px; color: var(--card-text-secondary);">10:33 AM</span>
                    </div>
                    <div class="chat-bubble chat-bubble-incoming" style="border-radius: 4px 18px 18px 18px; max-width: 100%;">
                        Wait, 847?! We used to cap out at maybe 200 a week with the full team.
                    </div>
                </div>
            </div>

            <!-- Message 3 -->
            <div style="display: flex; gap: 12px; align-items: flex-start;">
                <div class="avatar" style="background: #6366f1; width: 36px; height: 36px;">
                    <span class="avatar-initials" style="font-size: 13px;">TW</span>
                </div>
                <div>
                    <div style="display: flex; gap: 8px; align-items: baseline; margin-bottom: 4px;">
                        <span style="font-family: var(--font-body); font-size: 15px; font-weight: 700; color: var(--card-text);">Tom Walsh</span>
                        <span style="font-family: var(--font-body); font-size: 12px; color: var(--card-text-secondary);">10:34 AM</span>
                    </div>
                    <div class="chat-bubble chat-bubble-incoming" style="border-radius: 4px 18px 18px 18px; max-width: 100%;">
                        Yep. And CSAT went UP. 4.8 average. This thing is unreal.
                    </div>
                </div>
            </div>

        </div>

        <!-- Reaction -->
        <div style="margin-top: 16px; padding-left: 48px;">
            <span style="display: inline-block; background: #f0f0f0; border-radius: 12px; padding: 4px 10px; font-size: 13px;">
                &#127881; 6 &nbsp; &#128293; 4 &nbsp; &#128588; 3
            </span>
        </div>

    </div>

    <!-- BRAND WATERMARK -->
    <div class="brand-watermark">@yourbrand</div>

</body>
```

---

## 7. Screenshot Phase

After generating the HTML file, run the screenshot tool:

```bash
node screenshot/screenshot.js \
  --format tweet \
  --input ./EXPORT_DIR/index.html \
  --output ./EXPORT_DIR/export.png
```

Where `EXPORT_DIR` is the export directory (see Section 9).

This will:
1. Open the HTML file in a headless Chromium browser
2. Set the viewport to 1080x1080px with 2x device scale factor
3. Wait for fonts to load (500ms default; use `--font-delay 1000` for custom fonts)
4. Capture a PNG screenshot (fixed size, no full-page needed)
5. Save to the specified output path

---

## 8. Delivery Phase

After the screenshot is generated, present results to the user:

```
Your tweet graphic is ready!

Location: [EXPORT_DIR]/

Files:
  index.html     -- Graphic source (editable)
  export.png     -- Final image

Export details:
  Dimensions: 1080 x 1080px (1:1 square)
  File size:  [SIZE] KB

Share on:
  Instagram, LinkedIn, Twitter/X (1:1 works natively on all three)
  Also great for: pitch decks, landing pages, newsletters, ads

Want to make any changes?
```

---

## 9. Export Directory Convention

Ask the user: **"Where should I save the exports? (default: ./goose-graphics-exports/)"**

### Directory naming
- Primary: `[YYYY-MM-DD]-[slugified-name]/` (e.g., `2026-04-05-customer-testimonial-tweet/`)
- Fallback (no name given): `[YYYY-MM-DD]-tweet-[HHMMSS]/`

### Directory structure (tweet = single-file)
```
goose-graphics-exports/
  2026-04-05-customer-testimonial-tweet/
    index.html          # Graphic source
    export.png          # Final PNG
```

---

## 10. Design Reminders

- **Card on background.** The testimonial card is the focal point. It floats centered on a full-bleed decorative background. The background uses the style preset's palette; the card stays white/light for readability.
- **Fixed pixels only.** Like all graphic formats, tweet graphics are fixed at 1080x1080px. No `vw`, `vh`, `clamp()`, or responsive units. Everything in `px`.
- **Use real profile photos.** When a tweet URL is provided, use the fetcher tool to get the real profile image URL and display it with an `<img>` tag. Only fall back to CSS initials when no image URL is available.
- **Show the FULL tweet text.** Never truncate, summarize, or compress the body text. The card should grow vertically to fit all content. Use 18-20px font size with 1.6 line-height. If the tweet is long, the card gets taller — that's fine.
- **Card must look real.** The card should feel like a genuine social media post -- correct typography hierarchy, realistic metadata, real engagement numbers from the fetcher. Do not over-design the card interior; the design expression lives in the background and accent colors.
- **Readability over style.** The card text is dark on light. The decorative background can be expressive, but the card itself prioritizes legibility. Minimum 18px for body text on the card.
- **One testimonial per graphic.** Each graphic features a single post, review, or quote. If the user has multiple testimonials, generate multiple graphics.
- **Subtle shadow sells it.** The card's box-shadow creates depth against the background. Keep it subtle -- the goal is to look elevated, not floating in space.
- **Brand watermark is quiet.** The @yourbrand watermark sits in the bottom-right corner of the overall graphic (not inside the card). Low opacity, small size, never competing with the testimonial.
- **Engagement numbers should be plausible.** If the user provides real metrics, use them. If not, use realistic but not outrageous numbers. A tweet with 50M likes looks fake.
- **Square works everywhere.** 1080x1080 is the safest format across Instagram, LinkedIn, Twitter/X, and Facebook. No cropping, no letterboxing.
