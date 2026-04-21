# Unsplash Photo Sourcing

## Overview

This skill teaches you to search for and embed high-quality stock photos from Unsplash into HTML graphics. Use this whenever a graphic needs real photography -- product shots, backgrounds, lifestyle imagery, textures, or any visual element that benefits from a photograph rather than illustration or CSS-only decoration.

Unsplash provides a free API with access to millions of professionally shot, freely licensed photos.

## Setup

You need an Unsplash API key stored in the environment variable `UNSPLASH_ACCESS_KEY`.

**How to get a key:**

1. Go to https://unsplash.com/developers
2. Click "Register as a developer" and create an account (free)
3. Click "Your apps" and then "New Application"
4. Accept the API guidelines and terms
5. Give your app a name (e.g., "Graphic Design Agent") and description
6. Copy the **Access Key** (not the Secret Key) from the app dashboard

The key should be available as:

```
export UNSPLASH_ACCESS_KEY="your-access-key-here"
```

The free tier allows 50 requests per hour, which is more than enough for graphic design work.

## Search Workflow

### Step 1: Determine Search Keywords

Analyze the graphic's content and purpose to pick effective search terms. Use concrete, descriptive nouns rather than abstract concepts.

| Graphic Topic | Good Keywords | Weak Keywords |
|---|---|---|
| SaaS product launch | "laptop workspace modern" | "technology" |
| Fitness blog header | "running trail sunrise" | "health" |
| Restaurant menu | "fresh ingredients kitchen" | "food" |
| Travel newsletter | "mountain landscape hiking" | "travel" |
| Finance dashboard | "office desk charts" | "money" |

Tips:
- Use 1-3 words per query. More specific is better.
- Try multiple queries if the first results are poor.
- Add aesthetic modifiers like "minimal", "dark", "aerial", "closeup" to refine style.
- Match the mood of your graphic -- a corporate piece needs different imagery than an indie brand.

### Step 2: Search the API

```bash
curl -s "https://api.unsplash.com/search/photos?query=KEYWORD&per_page=5&orientation=landscape" \
  -H "Authorization: Client-ID $UNSPLASH_ACCESS_KEY"
```

**Parameters you can adjust:**

| Parameter | Options | When to Use |
|---|---|---|
| `orientation` | `landscape`, `portrait`, `squarish` | Match your graphic's aspect ratio |
| `per_page` | 1-30 (default 10) | 5 is usually enough to find a good match |
| `color` | `black_and_white`, `black`, `white`, `yellow`, `orange`, `red`, `purple`, `magenta`, `green`, `teal`, `blue` | When you need a specific color palette |
| `order_by` | `relevant` (default), `latest` | Keep `relevant` for best matches |

### Step 3: Parse the JSON Response

The response contains a `results` array. Each result has:

```
results[i].urls.raw       -- Original resolution (very large, avoid)
results[i].urls.full      -- Full resolution (use for print or high-DPI)
results[i].urls.regular   -- 1080px wide (best for most web graphics)
results[i].urls.small     -- 400px wide (thumbnails, previews)
results[i].urls.thumb     -- 200px wide (tiny thumbnails)

results[i].user.name      -- Photographer's display name (for attribution)
results[i].user.links.html -- Photographer's Unsplash profile URL

results[i].links.html     -- Photo page on Unsplash (for attribution link)

results[i].alt_description -- Alt text for accessibility
results[i].description     -- Photographer's description (may be null)
results[i].color           -- Dominant color hex (useful for placeholder/fallback)
```

**Use `.urls.regular` for standard web graphics.** Use `.urls.full` only when the graphic will be displayed at very high resolution or printed.

### Step 4: Select the Best Match

Review the top 3-5 results and select based on:
- Relevance to the graphic's message
- Composition that works with your layout (consider where text overlays will go)
- Color harmony with your style preset
- Sufficient empty/blurred areas if you need to overlay text

## Embedding in HTML

### Full-Bleed Background Image

Use when the photo should fill the entire graphic or a major section.

```html
<div style="
  width: 1080px;
  height: 1080px;
  background-image: url('IMAGE_URL');
  background-size: cover;
  background-position: center;
  position: relative;
">
  <!-- Content goes here, on top of the image -->
</div>
```

### Contained Image with Caption

Use for featured images that sit within the layout, not behind it.

```html
<figure style="
  margin: 0;
  width: 100%;
  max-width: 900px;
">
  <img src="IMAGE_URL"
       alt="ALT_DESCRIPTION"
       style="
         width: 100%;
         height: 400px;
         object-fit: cover;
         border-radius: 8px;
         display: block;
       " />
  <figcaption style="
    font-size: 13px;
    color: #888;
    margin-top: 8px;
    font-style: italic;
  ">
    Caption text here
  </figcaption>
</figure>
```

### Image Grid (2-3 Images)

Use for comparison layouts, multi-topic visuals, or visual variety.

```html
<!-- Two-image grid -->
<div style="
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  width: 100%;
">
  <img src="IMAGE_URL_1" alt="..." style="width: 100%; height: 300px; object-fit: cover; border-radius: 8px;" />
  <img src="IMAGE_URL_2" alt="..." style="width: 100%; height: 300px; object-fit: cover; border-radius: 8px;" />
</div>

<!-- Three-image grid -->
<div style="
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 12px;
  width: 100%;
">
  <img src="IMAGE_URL_1" alt="..." style="width: 100%; height: 250px; object-fit: cover; border-radius: 8px;" />
  <img src="IMAGE_URL_2" alt="..." style="width: 100%; height: 250px; object-fit: cover; border-radius: 8px;" />
  <img src="IMAGE_URL_3" alt="..." style="width: 100%; height: 250px; object-fit: cover; border-radius: 8px;" />
</div>
```

### Overlay Text on Image

Use for hero sections, title cards, and quote graphics. The gradient overlay is critical for text readability.

```html
<div style="
  width: 1080px;
  height: 1080px;
  background-image: url('IMAGE_URL');
  background-size: cover;
  background-position: center;
  position: relative;
">
  <!-- Gradient overlay for readability -->
  <div style="
    position: absolute;
    inset: 0;
    background: linear-gradient(
      to bottom,
      rgba(0, 0, 0, 0.1) 0%,
      rgba(0, 0, 0, 0.6) 60%,
      rgba(0, 0, 0, 0.85) 100%
    );
  "></div>

  <!-- Text content -->
  <div style="
    position: absolute;
    bottom: 80px;
    left: 60px;
    right: 60px;
    color: #ffffff;
    z-index: 1;
  ">
    <h1 style="font-size: 48px; font-weight: 700; margin: 0 0 16px 0; line-height: 1.1;">
      Your Headline Here
    </h1>
    <p style="font-size: 20px; margin: 0; opacity: 0.9; line-height: 1.5;">
      Supporting text or description goes here.
    </p>
  </div>
</div>
```

**Gradient overlay variations:**

| Use Case | Gradient |
|---|---|
| Text at bottom | `linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.8) 100%)` |
| Text at top | `linear-gradient(to top, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.8) 100%)` |
| Text centered | `radial-gradient(ellipse at center, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.3) 100%)` |
| Full dim | `rgba(0, 0, 0, 0.5)` (no gradient, uniform overlay) |
| Light overlay (dark text) | `rgba(255, 255, 255, 0.75)` |

## Attribution

Unsplash's license is generous (free for commercial and non-commercial use, no attribution required by law), but **attribution is expected and good practice**, especially for AI-generated content. Always include attribution unless space absolutely does not permit it.

### Attribution HTML Pattern

Place this at the bottom of the graphic or in a credits section:

```html
<div style="
  font-size: 11px;
  color: #999;
  margin-top: 12px;
">
  Photo by <a href="PHOTOGRAPHER_PROFILE_URL" style="color: #999; text-decoration: underline;">PHOTOGRAPHER_NAME</a>
  on <a href="PHOTO_URL" style="color: #999; text-decoration: underline;">Unsplash</a>
</div>
```

For graphics where the attribution is overlaid on the image:

```html
<div style="
  position: absolute;
  bottom: 8px;
  right: 12px;
  font-size: 10px;
  color: rgba(255, 255, 255, 0.6);
  z-index: 2;
">
  Photo by PHOTOGRAPHER_NAME on Unsplash
</div>
```

## Fallback Strategy

If `UNSPLASH_ACCESS_KEY` is not set or the API is unavailable:

1. **Ask the user** if they have image URLs they want to use. This is the best fallback.
2. **Use CSS-only decorative alternatives** instead of photos:
   - Gradient backgrounds (linear, radial, conic)
   - CSS patterns using `repeating-linear-gradient`
   - Geometric shapes with CSS `clip-path`
   - Solid color blocks with strong typography (often looks more professional than a bad stock photo)

Example CSS-only gradient background:

```html
<div style="
  width: 1080px;
  height: 1080px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
">
  <!-- Content here -->
</div>
```

Example CSS pattern background:

```html
<div style="
  width: 1080px;
  height: 1080px;
  background-color: #1a1a2e;
  background-image:
    radial-gradient(circle at 25% 25%, rgba(255,255,255,0.05) 1px, transparent 1px),
    radial-gradient(circle at 75% 75%, rgba(255,255,255,0.05) 1px, transparent 1px);
  background-size: 60px 60px;
">
  <!-- Content here -->
</div>
```

3. **Never invent or hallucinate image URLs.** If you cannot source a real image, use CSS graphics or tell the user.

## Image Sizing Guide

Select the appropriate Unsplash URL parameter and `object-fit` based on format:

| Format | Dimensions | Recommended URL | Notes |
|---|---|---|---|
| Instagram Carousel | 1080 x 1080 px | `.urls.regular` | Square crop; use `object-fit: cover` |
| Instagram Story | 1080 x 1920 px | `.urls.regular` | Portrait; search with `orientation=portrait` |
| LinkedIn Post | 1200 x 627 px | `.urls.regular` | Landscape; keep subjects centered for crop |
| Twitter/X Post | 1200 x 675 px | `.urls.regular` | Similar to LinkedIn |
| Blog Header | 1200 x 630 px | `.urls.regular` | Landscape |
| Presentation Slide | 1920 x 1080 px | `.urls.full` | Use full for sharpness at this size |
| Infographic | 1080 x 1920+ px | `.urls.regular` | Use as section backgrounds, not full-bleed |
| Poster/Flyer | 1080 x 1440 px | `.urls.full` | Use full if printing |
| Email Header | 600 x 200 px | `.urls.small` | Small is sufficient |
| Thumbnail | 400 x 400 px | `.urls.small` | Square crop |

When using `background-size: cover`, the image will be cropped to fill the container. Use `background-position` to control which part of the image is visible -- `center` works in most cases, but use `top` for portraits with faces or `bottom` for landscapes with foreground interest.
