---
name: product-reel-generator
description: Generates Instagram-ready product reels from any e-commerce product page URL. Scrapes product images, classifies by type, generates AI-animated clips via Higgsfield API, creates text overlays with style presets, and composes a 15-20 second reel with music. Supports model-based and product-only reels.
user-invocable: true
allowed-tools: Bash, Read, Write, Edit, Grep, Glob, WebSearch
argument-hint: [product-page-url]
---

# Product Reel Generator

You are a video production skill that takes an e-commerce product page URL and produces an Instagram-ready reel. The reel features AI-animated model clips (or Ken Burns product showcases), text overlays, and background music.

---

## Requirements

- **FFmpeg** installed and available in PATH (`brew install ffmpeg` on macOS, `apt install ffmpeg` on Linux)
- **Python 3** with `Pillow` and `python-dotenv` packages (`pip install Pillow python-dotenv`)
- **Higgsfield API credentials** — `API_Key_ID` and `API_Key_Secret` in a `.env` file (project root or any parent directory)

**Before starting:** Verify dependencies are available. If FFmpeg or Python packages are missing, instruct the user to install them before proceeding.

---

## Input

The user provides:
1. **Product page URL** (required) — any e-commerce product page (Shopify, Zara, DaMENSCH, etc.)
2. **Music file** (optional) — path to an MP3. If not provided, use a royalty-free track.
3. **Style preset** (optional) — one of: `minimal`, `luxury`, `bold`, `editorial`, `clean`. Defaults to auto-detect based on brand.
4. **Brand name** (optional) — for watermark. If not provided, extract from the page.

---

## Pipeline

### Step 1: Scrape Product Images

Try these methods in order until one works:

1. **Shopify JSON** — append `.json` to the product URL and extract images from the response
2. **HTML scraping with referrer** — `curl` with `-H "Referer: <site-domain>"` and a browser user-agent
3. **Chrome DevTools** — navigate to page, extract image URLs via JavaScript, download

For each image, download at the highest available resolution.

### Step 2: Classify Images (Heuristic)

Use image position on the product page as the primary signal:

| Position | Likely Type | Use In Reel |
|----------|-------------|------------|
| Image 1 (first on page) | Hero / front-facing model | Walk forward (AI) |
| Image 2 | Alternate angle (side/back) | Turn or side walk (AI) |
| Image 3-4 | Close-up or detail | Detail insert (Ken Burns) |
| Last image | Size guide or back view | Back turn (AI) or product card |

**Model detection heuristic:** If image height > 1.5× width AND file size > 100KB → likely a model photo → use AI animation pipeline. Otherwise → product-only → use Ken Burns pipeline.

### Step 3: Generate AI Video Clips

Use the Higgsfield API via this skill's `tools/higgsfield_video.py` script or direct `curl` calls.

**API details:**
- Base URL: `https://platform.higgsfield.ai`
- Auth header: `Authorization: Key {API_Key_ID}:{API_Key_Secret}`
- Always set `"aspect_ratio": "9:16"` for Instagram Reels

**Model selection:**
- **Seedance** (`bytedance/seedance/v1/pro/image-to-video`) — for hero/walk scenes. Higher quality, ~45 credits. Use for the most important clip.
- **Kling** (`kling-video/v2.1/pro/image-to-video`) — for secondary scenes. Good quality, ~6 credits. Use for turns, side angles.

**Prompt guidelines:**
- Always mention the clothing color and type in the prompt
- Specify direction of motion ("walks forward", "turns from front to side")
- Add "clean studio background" or describe the actual background
- Add "smooth cinematic motion" at the end
- For walk prompts, add "does not stop or turn around" to prevent reversal

**Duration:** Use `"duration": 5` for each clip. Kling only supports 5 or 10.

**Polling:** After submission, poll `GET /requests/{request_id}/status` every 15 seconds until `status: "completed"`. Then download the video from `response.video.url`.

### Step 4: Create Ken Burns Scenes

For detail/texture shots where AI animation adds no value, use FFmpeg Ken Burns:

```bash
ffmpeg -y -loop 1 -i "detail.jpg" \
  -vf "scale=2160:3840,zoompan=z='1+0.06*in/75':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=75:s=1080x1920:fps=25" \
  -t 3 -c:v libx264 -pix_fmt yuv420p -r 25 "scene-detail.mp4"
```

Vary the zoom type: zoom-in, zoom-out, pan-left, pan-right, pan-up, pan-down.

### Step 5: Create Text Overlays

Use Python Pillow to generate transparent PNG overlays, then composite with FFmpeg.

**IMPORTANT:** Many FFmpeg installations do NOT have the `drawtext` filter. Always use Pillow to create PNG text images, then overlay with:
```bash
ffmpeg -y -i video.mp4 -loop 1 -t <duration> -i overlay.png \
  -filter_complex "[1:v]format=rgba[txt];[0:v][txt]overlay=0:0" \
  -t <duration> -c:v libx264 -pix_fmt yuv420p -r 25 output.mp4
```

#### Style Presets

Fonts are located in this skill's `fonts/` directory. Fall back to system fonts if custom fonts fail.

| Preset | Title Font | Body Font | Text Color | Treatment |
|--------|-----------|-----------|------------|-----------|
| **minimal** | Montserrat-Light.ttf | Montserrat-Light.ttf | White (255,255,255) | No background, subtle shadow |
| **luxury** | System Didot (/System/Library/Fonts/Supplemental/Didot.ttc) | Cormorant-Regular.ttf | Cream (245,235,210) | Thin gold stroke |
| **bold** | System Futura (/System/Library/Fonts/Supplemental/Futura.ttc) | Montserrat-Bold.ttf | White | Dark backdrop bar, uppercase |
| **editorial** | Cormorant-Italic.ttf | Cormorant-Regular.ttf | White | Minimal, italic titles |
| **clean** | System Helvetica (/System/Library/Fonts/Helvetica.ttc) | System Helvetica | White | Simple shadow, professional |

**Overlays to create:**
1. **Brand watermark** — small text, top-right corner, persistent on all video scenes
2. **Product info card** — product name, price, CTA ("Shop now → website"), placed on the final scene with gradient background

### Step 6: Compose the Reel

#### Model Reel Structure (when model photos detected)

| Time | Scene | Type | Duration |
|------|-------|------|----------|
| 0-5s | Hero — walk forward or full body | AI (Seedance) | 5s |
| 5-10s | Alternate angle — side/back | AI (Kling) or Ken Burns | 5s |
| 10-13s | Detail — texture, fabric, accessories | Ken Burns | 3s |
| 13-16s | Third angle — back turn or close-up | AI (Kling) | 3s |
| 16-20s | Product card + CTA | Static + text overlay | 4s |

**Target: 80% video, 20% static.** The product card at the end is fine as static.

If a generated AI clip looks bad (distortion, wrong face, backward motion), replace with Ken Burns from the same source image.

#### Product-Only Reel Structure (no model photos)

| Time | Scene | Type | Duration |
|------|-------|------|----------|
| 0-3s | Hero reveal | Ken Burns zoom-out | 3s |
| 3-6s | Detail 1 | Ken Burns zoom-in | 3s |
| 6-9s | Alternate angle | Ken Burns pan | 3s |
| 9-12s | Detail 2 | Ken Burns zoom | 3s |
| 12-15s | Product card + CTA | Static + text | 3s |

#### Stitching

Concatenate all scenes with FFmpeg:
```bash
cat > concat.txt << EOF
file 'scene1.mp4'
file 'scene2.mp4'
...
EOF
ffmpeg -y -f concat -safe 0 -i concat.txt -c:v libx264 -pix_fmt yuv420p -r 25 reel-silent.mp4
```

### Step 7: Add Audio

Mix background music with the silent reel:
```bash
ffmpeg -y -i reel-silent.mp4 -i music.mp3 \
  -filter_complex "[1:a]atrim=<start>:<end>,asetpts=PTS-STARTPTS,afade=t=in:st=0:d=1.5,afade=t=out:st=<fade_start>:d=2,volume=0.5[aud]" \
  -map 0:v -map "[aud]" -c:v copy -c:a aac -shortest output.mp4
```

If no music file provided, use the royalty-free track at:
a royalty-free track such as "Shiny Tech" by Kevin MacLeod (user should provide a local path or URL)

---

## Output

Save the final reel to a user-specified directory (or the current working directory).

**Output specs:**
- Format: MP4 (H.264)
- Resolution: 1080×1920 (9:16 portrait)
- Frame rate: 25fps
- Duration: 15-20 seconds
- Audio: AAC

---

## Known Limitations

1. **Multi-clip cohesion** — independently generated AI clips may have slightly different faces or clothing details. Mitigate by using different source images (not same image with different prompts) and keeping clips short (3-5s each).
2. **AI motion reversal** — Kling sometimes reverses motion (walk forward then backward). Seedance handles this better. Use Seedance for walk scenes.
3. **Enterprise CDN blocking** — sites like Zara require `Referer` header. Always include `-H "Referer: <site-domain>"` in curl downloads.
4. **Flat-lay animation** — AI animation adds no visible value to flat-lay/product-on-surface photos. Use Ken Burns instead (free, equally effective).
5. **No `drawtext` in FFmpeg** — many FFmpeg installations lack the drawtext filter. Always use Pillow for text → PNG → overlay.

---

## Cost Estimate Per Reel

| Component | Credits | Approx Cost |
|-----------|---------|-------------|
| 1× Seedance clip (hero) | ~45 | ~$2.50 |
| 1-2× Kling clips (secondary) | ~6-12 | ~$0.60-1.20 |
| Ken Burns + text overlays | 0 | Free |
| **Total per reel** | **~51-57** | **~$3-4** |

