---
name: video-clipper
description: Repurposes long-form video (podcasts, interviews, talks) into short-form vertical clips for Instagram Reels, TikTok, and YouTube Shorts. Handles transcription, moment selection, clip extraction, speaker-tracked reframing (16:9 to 9:16), and animated captions.
user-invocable: true
allowed-tools: Bash, Read, Write, Edit, Grep, Glob, WebSearch, WebFetch
argument-hint: [video-file-path-or-url]
---

# Video Clipper

Takes a long-form video and produces ready-to-post short-form vertical clips with speaker-tracked framing and professional animated captions. Works with podcasts, interviews, talks, and any talking-head content.

---

## Requirements

- **FFmpeg** installed and available in PATH (`brew install ffmpeg` on macOS, `apt install ffmpeg` on Linux)
- **Python 3** with `openai-whisper` and `requests` packages (`pip install openai-whisper requests`)
- **yt-dlp** installed (for YouTube/URL downloads) — `brew install yt-dlp` on macOS, `pip install yt-dlp` on Linux
- **API Keys** in `.env` file (project root or any parent directory):
  - `KLAP_API_KEY` — from [klap.app](https://klap.app) (reframing with speaker tracking)
  - `CAPTIONS_AI_API_KEY` — from [captions.ai](https://captions.ai) / [platform.mirage.app](https://platform.mirage.app) (animated captions)

**Before starting:** Verify that FFmpeg, yt-dlp, and the Python packages are installed. If any are missing, instruct the user to install them before proceeding.

### Cost Per Clip

| Step | Cost |
|---|---|
| Whisper (transcription) | Free (local) |
| FFmpeg (clip extraction) | Free (local) |
| Klap (reframing) | ~$1.50-2.50/clip depending on plan |
| Captions.ai (captions) | ~$0.15/min of output |
| **Total per clip** | **~$2-3** |

---

## Input

The user provides:

1. **Video source** (required) — one of:
   - **Local file path** — e.g. `/path/to/podcast.mp4`
   - **YouTube URL** — e.g. `https://www.youtube.com/watch?v=...`
   - **Any public video URL** — direct link to MP4

2. **Moment selection mode** (ask the user):
   - **Automatic** — Claude picks the best moments
   - **Manual** — user provides specific timestamps
   - **Hybrid** — Claude proposes moments, user approves/adjusts before processing

3. **Number of clips** (optional) — default 3-5. Depends on video length and content density.

4. **Caption template** (optional) — Captions.ai template ID. Default: `ctpl_DxflLOnuKkb198FNdI9E` (Heat). List available templates via the API if user wants to browse.

5. **Target clip duration** (optional) — default 15-60 seconds. User can specify a range.

---

## Pipeline

### Step 1: Get the Video

Based on input type:

**Local file:**
```bash
# Verify it exists and get duration
ffprobe -v quiet -print_format json -show_format "video.mp4"
```

**YouTube URL:**
```bash
yt-dlp -f "bestvideo[height<=720]+bestaudio/best[height<=720]" --merge-output-format mp4 -o "<workdir>/source.mp4" "<URL>"
```

**Other URL:**
```bash
curl -L -o "<workdir>/source.mp4" "<URL>"
```

### Step 2: Transcribe with Whisper

```python
import whisper

model = whisper.load_model("base")
result = model.transcribe("source.mp4", language="en", word_timestamps=True)
```

Save both:
- `transcript.json` — full result with word-level timestamps (needed for Step 3)
- `transcript.txt` — readable version with timestamps per segment (for Claude to analyze)

### Step 3: Identify Best Moments (Viral Scoring)

This is the key intelligence step. Claude reads the full transcript and identifies potential clip moments.

**Step 3a: Segment the transcript into candidate moments**

Scan the transcript for self-contained 15-60 second windows. Look for natural start/end points (topic changes, pauses, complete thoughts).

**Step 3b: Score each candidate moment on this rubric**

For each candidate, score 1-10 on these five criteria:

| Criteria | What to look for | Score guide |
|---|---|---|
| **Hook Strength** | Does the first sentence grab attention? Is it a surprising claim, provocative question, or bold statement? | 10 = "wait, what?" reaction. 1 = generic setup |
| **Quotability** | Contains a memorable one-liner that people would screenshot or share? | 10 = tweet-worthy standalone quote. 1 = no standalone phrases |
| **Emotional Intensity** | Does the speaker show passion, humor, anger, vulnerability, or conviction? | 10 = genuine emotion. 1 = monotone/flat delivery |
| **Self-Containedness** | Does it make complete sense without watching the rest of the video? | 10 = fully standalone. 1 = needs prior context |
| **Surprise/Controversy** | Does it challenge conventional wisdom, reveal something unexpected, or take a hot take? | 10 = counterintuitive insight. 1 = commonly known information |

**Total score = sum of all five (max 50).**

**Step 3c: Rank and select top N moments**

- Sort by total score descending
- Select top N (user-specified or default 3-5)
- Ensure selected moments don't overlap
- Prefer variety in topics/angles — don't pick 3 clips about the same point

**Step 3d: Present to user for approval**

For each selected moment, show:
- Timestamp range (start - end)
- Duration
- Transcript excerpt (first 2-3 lines)
- Score breakdown (hook/quotability/emotion/self-contained/surprise)
- Total score
- Suggested hook text for the clip

**Wait for user approval.** User can:
- Approve all
- Remove specific clips
- Add their own timestamps
- Adjust start/end times
- Request more options

**Do NOT proceed to Step 4 until user approves.**

### Step 4: Extract Raw Clips

For each approved moment, extract with FFmpeg:

```bash
ffmpeg -y -ss <start> -to <end> -i source.mp4 -c copy clip<N>-raw.mp4
```

### Step 5: Reframe with Klap

Upload each raw clip to Klap for AI-powered speaker-tracked reframing to 9:16.

**API: Klap**
- Endpoint: `POST https://api.klap.app/v2/tasks/video-to-video`
- Auth: `Authorization: Bearer <KLAP_API_KEY>`

**Submit each clip:**

```python
import requests

headers = {
    "Authorization": f"Bearer {klap_key}",
}

# Direct file upload
with open("clip-raw.mp4", "rb") as f:
    r = requests.post(
        "https://api.klap.app/v2/tasks/video-to-video",
        headers=headers,
        files={"video": f},
        data={
            "language": "en",
            "editing_options": '{"captions":false,"reframe":true,"emojis":false,"intro_title":false}',
            "dimensions": '{"width":1080,"height":1920}'
        }
    )
task_id = r.json()["id"]
output_id = r.json().get("output_id")
```

**Poll until ready:**
```python
# Poll every 30 seconds
r = requests.get(f"https://api.klap.app/v2/tasks/{task_id}", headers=headers)
status = r.json()["status"]  # "processing" or "ready"
output_id = r.json()["output_id"]  # project ID when ready
```

**Export the reframed video:**
```python
# Request export
r = requests.post(
    f"https://api.klap.app/v2/projects/{output_id}/exports",
    headers=headers,
    json={}
)
export_id = r.json()["id"]

# Poll export every 15 seconds
r = requests.get(
    f"https://api.klap.app/v2/projects/{output_id}/exports/{export_id}",
    headers=headers
)
# When status != "processing", download from src_url
download_url = r.json()["src_url"]
```

**Klap handles:**
- Face detection and tracking
- Active speaker detection (for multi-person videos)
- Smooth 16:9 → 9:16 reframing
- Dynamic cropping that follows the speaker

### Step 6: Add Animated Captions with Captions.ai

Upload each reframed clip to Captions.ai for professional animated captions.

**API: Captions.ai (Mirage)**
- Endpoint: `POST https://api.mirage.app/v1/videos/captions`
- Auth: `x-api-key: <CAPTIONS_AI_API_KEY>`

**Submit each clip:**
```python
headers = {"x-api-key": captions_key}

with open("clip-reframed.mp4", "rb") as f:
    r = requests.post(
        "https://api.mirage.app/v1/videos/captions",
        headers=headers,
        files={"video": f},
        data={"caption_template_id": "ctpl_DxflLOnuKkb198FNdI9E"}
    )
video_id = r.json()["video_id"]
```

**Poll until complete:**
```python
# Poll every 10 seconds
r = requests.get(f"https://api.mirage.app/v1/videos/{video_id}", headers=headers)
status = r.json()["status"]  # QUEUED → PROCESSING → COMPLETE or FAILED
```

**Download the captioned video:**
```python
r = requests.get(
    f"https://api.mirage.app/v1/videos/{video_id}/content",
    headers=headers,
    allow_redirects=True
)
with open("clip-FINAL.mp4", "wb") as f:
    f.write(r.content)
```

**Video requirements for Captions.ai:**
- Aspect ratio: 9:16 (Klap's output satisfies this)
- Max file size: 50 MB
- Max duration: 5 minutes
- Formats: MP4, MOV

**Available caption templates** (fetch full list via `GET https://api.mirage.app/v1/videos/captions/templates`):

Some popular templates:
| Template | ID |
|---|---|
| Heat (default) | `ctpl_DxflLOnuKkb198FNdI9E` |
| Buzz | `ctpl_yvE0ZnYzEj6ClCD2ee1f` |
| Medusa | `ctpl_yNnJyDLSH5oIouKdjQx2` |
| Drive | `ctpl_wR9PXfmxW1DFxEUuATFg` |
| Magazine | `ctpl_vrs1M2VrxvzQWNRypRvh` |
| Energy | `ctpl_oofP3mxbx8CaEPNYqnKD` |
| Sirius | `ctpl_miZu2nLWyP7X8oEAAHcM` |
| Milky Way | `ctpl_jcTmJGX77Uwz2AqLOX4S` |

### Step 7: Generate Platform Captions

For each final clip, Claude writes platform-specific captions:

**Instagram Reel:**
- Hook line (first sentence people see)
- 2-3 sentences of context
- CTA (save, share, follow)
- 20-30 relevant hashtags
- Tone: professional but conversational

**TikTok:**
- Short, punchy caption (1-2 lines max)
- 5-8 hashtags
- Tone: casual, direct

**YouTube Short:**
- Title (under 60 characters, curiosity-driven)
- Description (2-3 sentences)
- Tags

**LinkedIn (if applicable):**
- Longer caption (3-5 sentences with a takeaway)
- Tone: professional, insight-driven

### Step 8: Output

Save everything to the output directory:

```
<output-dir>/
  clip1-FINAL.mp4          # Ready-to-post clip
  clip2-FINAL.mp4
  clip3-FINAL.mp4
  captions.md              # All platform captions for each clip
  summary.md               # Overview: source video, clips made, scores, costs
```

**Output specs:**
- Format: MP4 (H.264)
- Resolution: 1080×1920 (9:16)
- Duration: 15-60 seconds per clip
- Audio: AAC

---

## Workflow Summary

```
User provides video
      ↓
[ASK] "Do you want me to pick the best moments, or do you have specific timestamps?"
      ↓
Whisper transcribes locally (free)
      ↓
Claude scores moments on viral rubric (hook, quotability, emotion, self-contained, surprise)
      ↓
[ASK] "Here are the top N moments with scores. Approve, adjust, or add your own?"
      ↓
FFmpeg extracts raw clips (free)
      ↓
Klap reframes to 9:16 with speaker tracking (~$2/clip)
      ↓
Captions.ai adds animated captions (~$0.15/clip)
      ↓
Claude writes platform-specific captions
      ↓
Output: final clips + captions, ready to post
```

---

## Known Limitations

1. **yt-dlp may fail on some YouTube videos** due to YouTube's evolving download restrictions. Install via `brew install yt-dlp` and keep updated. If download fails, user should download the video manually and provide the local file path.
2. **Klap credit costs** can add up at scale. Each clip costs ~76 credits (44 processing + 32 generation). Monitor credit balance before batch processing.
3. **Captions.ai requires 9:16 input** — always run Klap before Captions.ai, never the other way around.
4. **Whisper base model** is fast but may have transcription errors on technical terms, accents, or overlapping speech. Use `whisper.load_model("medium")` for better accuracy at the cost of slower transcription.
5. **Viral scoring is heuristic** — Claude's scoring is based on content patterns, not engagement data. Scores indicate relative quality within a video, not absolute viral potential.
6. **Max 5 minutes per clip** for Captions.ai, and 50MB file size limit. Klap has plan-based limits on video length (45 min to 3 hours depending on plan).
7. **Processing time** — Klap takes 2-5 minutes per clip, Captions.ai takes 1-2 minutes. A batch of 5 clips takes roughly 15-25 minutes total.

---

## Environment Variables

Add these to your `.env` file:

```
KLAP_API_KEY=kak_xxxxx
CAPTIONS_AI_API_KEY=sk-xxxxx
```

No other API keys or local dependencies required. Whisper model downloads automatically on first run.
