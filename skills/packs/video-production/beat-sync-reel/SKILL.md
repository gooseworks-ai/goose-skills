---
name: beat-sync-reel
description: Generates Instagram Reels where product image cuts are synced to audio beats. Accepts audio as a local file, URL, or search query. Uses librosa for beat detection, FFmpeg Ken Burns for scene animation, and Pillow for text overlays. No AI video generation — fully free, fast, and scalable.
user-invocable: true
allowed-tools: Bash, Read, Write, Edit, Grep, Glob, WebSearch
argument-hint: [product-url-or-image-paths] [audio-source]
---

# Beat-Sync Reel Generator

Takes product images and a trending audio track, detects beats, and produces an Instagram Reel where every image cut lands exactly on a beat. Fast, free (no API credits), and scalable.

---

## Requirements

- **Python 3** with `librosa` and `Pillow` packages
- **FFmpeg** installed
- **yt-dlp** installed (for URL/search audio input)

---

## Input

The user provides:

1. **Audio** (required) — one of three formats:
   - **Local file path** — e.g. `/path/to/trending-audio.mp3`
   - **URL** — Instagram Reel, TikTok, or YouTube link. Download with: `yt-dlp -x --audio-format mp3 -o "audio.%(ext)s" "<URL>"`
   - **Audio name** — e.g. "Nashe Si Chadh Gayi". Web search for it, find a YouTube/SoundCloud source, download with yt-dlp.

2. **Product images** (required) — one of:
   - **List of image file paths** — local JPG/PNG files
   - **Product page URL** — scrape images using these methods in order until one works:
     1. **Shopify JSON** — append `.json` to the product URL and extract image URLs from the response
     2. **HTML scraping with referrer** — `curl` with `-H "Referer: <site-domain>"` and a browser user-agent, then parse `<img>` tags
     3. **Chrome DevTools** — navigate to the page, extract image URLs via JavaScript, download each

3. **Audio segment** (optional) — `start` and `end` timestamps in seconds to use a specific portion of the audio. Defaults to 0-15s.

4. **Beat frequency** (optional) — cut on every Nth beat. Defaults to `2` (every 2nd beat, ~1.3s per image at typical tempos). Use `1` for fast cuts, `4` for slower.

5. **Product info** (optional) — brand name, product name, price, CTA URL. Used for end card. If not provided, skip end card.

6. **Style preset** (optional) — for end card text. One of: `minimal`, `luxury`, `bold`, `editorial`, `clean`. Defaults to `clean`. See Style Presets table below for font details.

---

## Pipeline

### Step 1: Resolve Audio

Based on input type:

**Local file:**
```bash
# Just verify it exists and get duration
ffprobe -v quiet -print_format json -show_format "audio.mp3"
```

**URL (Instagram/TikTok/YouTube):**
```bash
yt-dlp -x --audio-format mp3 -o "<workdir>/audio.%(ext)s" "<URL>"
```

**Audio name (search):**
1. Web search for `"<audio name>" site:youtube.com` or `"<audio name>" instagram audio`
2. Take the first YouTube/SoundCloud result
3. Download: `yt-dlp -x --audio-format mp3 -o "<workdir>/audio.%(ext)s" "<URL>"`

### Step 2: Detect Beats

```python
import librosa
import numpy as np

y, sr = librosa.load("audio.mp3", sr=None)
tempo, beat_frames = librosa.beat.beat_track(y=y, sr=sr)
beat_times = librosa.frames_to_time(beat_frames, sr=sr)
beat_times = [float(t) for t in beat_times]
```

**Select cut points** based on beat frequency:
```python
# beat_freq = 2 means every 2nd beat
cut_times = [0.0] + [beat_times[i] for i in range(beat_freq - 1, len(beat_times), beat_freq)]
```

**Trim to audio segment:**
```python
start, end = 0.0, 15.0  # or user-provided
cut_times = [t - start for t in cut_times if start <= t < end]
if cut_times[0] != 0.0:
    cut_times.insert(0, 0.0)
```

**Typical results by tempo:**

| Tempo (BPM) | Beat interval | Every 2nd beat | Cuts in 15s |
|-------------|--------------|----------------|-------------|
| 80 | 0.75s | 1.5s | ~10 |
| 100 | 0.60s | 1.2s | ~12 |
| 120 | 0.50s | 1.0s | ~15 |
| 140 | 0.43s | 0.86s | ~17 |

If cuts > available images, cycle through images with different Ken Burns effects.

### Step 3: Classify & Filter Images

If images were scraped from a product URL, filter out infographics and size charts:
- **Skip** images with text overlays, size charts, comparison graphics (typically wider aspect ratios, or contain large text blocks)
- **Keep** model photos, product-only photos, detail shots

**Classification heuristic (by position on product page):**

| Position | Likely Type |
|----------|-------------|
| Image 1 (first on page) | Hero / front-facing model |
| Image 2 | Alternate angle (side/back) |
| Image 3-4 | Close-up or detail |
| Last image | Size guide or back view |

**Model vs product-only detection:** If image height > 1.5× width AND file size > 100KB → likely a model photo. Otherwise → product-only photo.

Order images for visual variety: hero → detail → alternate angle → repeat.

### Step 4: Create Ken Burns Scenes

For each cut interval, create a Ken Burns clip from the assigned image. Alternate through these effects:

```bash
# Zoom in center
ffmpeg -y -loop 1 -i "image.jpg" \
  -vf "scale=2160:3840,zoompan=z='1+0.08*in/{frames}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d={frames}:s=1080x1920:fps=25" \
  -t {duration} -c:v libx264 -pix_fmt yuv420p -r 25 scene.mp4

# Zoom out center
zoompan=z='1.15-0.08*in/{frames}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d={frames}:s=1080x1920:fps=25

# Pan left to right
zoompan=z='1.08':x='(iw-iw/zoom)*in/{frames}':y='ih/2-(ih/zoom/2)':d={frames}:s=1080x1920:fps=25

# Pan right to left
zoompan=z='1.08':x='(iw-iw/zoom)*(1-in/{frames})':y='ih/2-(ih/zoom/2)':d={frames}:s=1080x1920:fps=25

# Zoom in top-center (for torso/face crops)
zoompan=z='1+0.08*in/{frames}':x='iw/2-(iw/zoom/2)':y='ih/4-(ih/zoom/4)':d={frames}:s=1080x1920:fps=25

# Pan up
zoompan=z='1.06':x='iw/2-(iw/zoom/2)':y='(ih-ih/zoom)*(1-in/{frames})':d={frames}:s=1080x1920:fps=25
```

Where `{frames} = int(duration * 25)` (25 fps).

**Important:** Always `scale` source image to at least 2160x3840 before zoompan so there's enough resolution for the zoom.

### Step 5: Create End Card (Optional)

If product info is provided, create a 2-second end card using Pillow:

```python
from PIL import Image, ImageDraw, ImageFont

card = Image.new("RGBA", (1080, 1920), (20, 20, 20, 255))
draw = ImageDraw.Draw(card)
# Brand name (centered, y=750)
# Product name (centered, y=830)
# Price (centered, y=920, accent color)
# CTA (centered, y=1020, muted)
card.save("endcard.png")
```

Convert to video:
```bash
ffmpeg -y -loop 1 -i endcard.png -vf "scale=1080:1920" \
  -t 2 -c:v libx264 -pix_fmt yuv420p -r 25 endcard.mp4
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

### Step 6: Concatenate Scenes

```bash
cat > concat.txt << EOF
file 'scene-00.mp4'
file 'scene-01.mp4'
...
file 'endcard.mp4'
EOF

ffmpeg -y -f concat -safe 0 -i concat.txt \
  -c:v libx264 -pix_fmt yuv420p -r 25 reel-silent.mp4
```

### Step 7: Add Audio

```bash
ffmpeg -y -i reel-silent.mp4 -i audio.mp3 \
  -filter_complex "[1:a]atrim={start}:{end},asetpts=PTS-STARTPTS,afade=t=in:st=0:d=0.5,afade=t=out:st={fade_start}:d=2,volume=0.8[aud]" \
  -map 0:v -map "[aud]" \
  -c:v copy -c:a aac -shortest output.mp4
```

Where `{start}` and `{end}` are the audio segment timestamps, and `{fade_start} = total_duration - 2.0`.

---

## Output

Save the final reel to a user-specified directory (or the current working directory).

**Output specs:**
- Format: MP4 (H.264)
- Resolution: 1080x1920 (9:16 portrait)
- Frame rate: 25fps
- Duration: typically 10-20 seconds (depends on audio segment)
- Audio: AAC

---

## Known Limitations

1. **No AI video generation** — this skill only uses Ken Burns (zoom/pan on stills). For AI-animated clips, use the [`product-reel-generator`](https://github.com/gooseworks-ai/goose-skills/tree/main/skills/packs/video-production/product-reel-generator) skill which supports Higgsfield/Kling/Seedance video generation APIs.
2. **Infographic filtering is heuristic** — may not catch all non-product images. Agent should visually verify scraped images before using.
3. **Very fast tempos (>140 BPM)** — even with beat_freq=2, cuts may be too rapid (<0.9s). Use beat_freq=4 for high-tempo tracks.
4. **Audio quality from yt-dlp** — depends on source. Instagram/TikTok audio is often 128kbps. YouTube is usually better.
5. **No drawtext in FFmpeg** — this system's FFmpeg lacks the drawtext filter. Always use Pillow for text → PNG → overlay.
6. **Micro-cuts** — if beats are unevenly spaced, some scenes may be very short (<0.3s). The agent should check for and merge these.

---

## Cost

**Free.** No API credits needed. Only uses FFmpeg, librosa, and Pillow — all local processing.

---

## Example Usage

```
User: "Make a beat-sync reel for this product: https://www.damensch.com/products/full-sleeve-polo
       Use this audio: https://www.instagram.com/reels/audio/123456789/
       Cut on every 2nd beat, use the first 15 seconds"

Agent:
1. Downloads audio with yt-dlp
2. Scrapes product images from URL
3. Detects beats with librosa
4. Creates Ken Burns clips at beat intervals
5. Adds end card with product info
6. Mixes audio
7. Outputs reel
```
