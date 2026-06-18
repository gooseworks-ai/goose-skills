---
name: video-polish
description: Takes an existing screen recording or demo video and adds professional zoom/pan effects synchronized to the narration. Uses transcript-driven zoom targeting and Remotion for rendering. Optionally replaces audio with a soundtrack.
user-invocable: true
allowed-tools: Bash, Read, Write, Edit, Grep, Glob, WebSearch
argument-hint: [video-file-path]
---

# Video Polish Skill

You take an existing video (screen recording, demo, walkthrough, Loom) and add professional zoom/pan effects that follow the narration. The output looks like a professionally edited video where the camera zooms into whatever the speaker is discussing.

---

## What This Skill Does

**Input:** A raw video file (screen recording, Loom, product demo) + optionally a soundtrack
**Output:** The same video with smooth zoom/pan effects synchronized to the narration

**What it adds:**
- Zoom-in effects on UI elements, metrics, text, code when the narrator mentions them
- Smooth pan/slide effects across sections (e.g., sliding across table columns)
- Transitions with ease-in-out easing (no jarring jumps)
- Optional audio replacement (background music instead of or mixed with original narration)

**What it does NOT do:**
- Generate new video content
- Add avatars or talking heads
- Edit or cut the video (no trimming, no removing sections)
- Add text overlays or annotations

---

## Prerequisites

- **Node.js** (v18+) and **npm** — required for Remotion
- **Remotion** — Video rendering framework. If not already set up, create a project:
  ```bash
  npx create-video@latest --yes --blank --no-tailwind video-polish
  cd video-polish && npm i
  ```
- **whisper-cpp** — For audio transcription. Install via `brew install whisper-cpp` on macOS
- **Whisper model** — Download the base English model:
  ```bash
  curl -L -o /tmp/ggml-base.en.bin "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.en.bin"
  ```
- **Python 3 + Pillow** — For frame extraction and coordinate grid overlays (`pip install Pillow`)

**Before starting:** Verify that Node.js, whisper-cpp, and Python 3 with Pillow are installed. If any are missing, instruct the user to install them before proceeding.

---

## How This Skill Works

### Step 1: Analyze the Source Video

Get video metadata:
```bash
npx remotion ffprobe -v quiet -print_format json -show_format -show_streams <video_path>
```

Record: duration, resolution (width x height), fps, whether audio exists.

### Step 2: Transcribe the Audio

Extract audio and transcribe with word-level timestamps.

**Extract audio:**
```bash
npx remotion ffmpeg -y -i <video_path> -vn -acodec pcm_s16le -ar 16000 -ac 1 /tmp/audio.wav
```

**Transcribe:**
```bash
whisper-cli -m /tmp/ggml-base.en.bin -f /tmp/audio.wav --output-json --output-file /tmp/transcript
```

**Read the transcript** and identify moments where the narrator emphasizes or references specific on-screen elements:
- "look at this", "you can see", "notice", "here", "this is where"
- Naming specific UI elements: "the latency column", "pass rate", "this button"
- Describing what's on screen: "each row represents...", "on the top you can see..."

For each emphasis moment, record:
- Timestamp (when they start talking about it)
- What they're referring to (which UI element, metric, section)

### Step 3: Extract Source Frames at Key Timestamps

For each emphasis moment from the transcript, extract the source frame at that timestamp:

```bash
npx remotion ffmpeg -y -i <video_path> -vf "select=eq(n\,<frame_number>)" -vframes 1 -update 1 /tmp/frame-<timestamp>.png
```

Where `frame_number = timestamp_seconds * fps`.

**Important:** The video content may scroll or change over time. Always extract frames at the ACTUAL timestamp, not from a single reference frame. UI element positions change as the user scrolls.

### Step 4: Measure Zoom Target Coordinates

For each extracted frame, draw a coordinate grid overlay to precisely identify element positions:

```python
from PIL import Image, ImageDraw
img = Image.open('/tmp/frame-<timestamp>.png')
w, h = img.size
draw = ImageDraw.Draw(img)
for pct in range(0, 100, 5):
    y = int(h * pct / 100)
    x = int(w * pct / 100)
    color = 'red' if pct % 10 == 0 else 'yellow'
    draw.line([(0, y), (w, y)], fill=color, width=1)
    draw.text((5, y+2), f'y{pct}', fill=color)
    draw.line([(x, 0), (x, h)], fill=color, width=1)
    draw.text((x+2, 12), f'x{pct}', fill=color)
img.save('/tmp/frame-<timestamp>-grid.png')
```

Look at the grid overlay and measure the **center point** (focusX, focusY) of the element the narrator is referring to. Express as normalized 0-1 values (e.g., x=0.47 means 47% from the left edge).

### Step 5: Build the Keyframe Timeline

Create a list of keyframes. Each keyframe defines a target zoom state at a specific time. The system smoothly interpolates between consecutive keyframes using ease-in-out.

**Keyframe design rules:**

1. **Anticipate the narration by 0.5 seconds.** If the narrator says "pass rate" at 0:37, start zooming at 0:36.5 so the zoom arrives just as they say it.

2. **Between two zoom-in targets, don't zoom all the way out.** If going from metric A to metric B, reduce zoom to 1.5x briefly while shifting focus, then zoom back in. This is faster and smoother than full-out-then-full-in.

3. **For sliding across adjacent elements** (e.g., table columns), keep the same zoom level and just change focusX. This creates a smooth horizontal pan.

4. **Fast transitions between distant targets** (e.g., jumping from the query column to the latency column) should take 1-1.5 seconds max. Slow slides across distant areas feel boring.

5. **Slow slides across adjacent elements** (e.g., panning from latency → tokens → cost) should take 3-5 seconds. This lets the viewer read each element.

6. **Hold the zoom for at least 2-3 seconds** after arriving at a target. Quick zoom-in → immediate zoom-out is disorienting.

7. **Start and end the video at full view (zoom=1.0).** Don't start zoomed in — let the viewer orient first.

**Zoom level guide:**
| What you're showing | Zoom level |
|---|---|
| Full dashboard/page overview | 1.0 (no zoom) |
| A section (metrics row + charts) | 1.1-1.3 |
| A specific area (one chart, a few table columns) | 1.8-2.5 |
| A single metric, cell, or button | 2.8-3.5 |

**Example keyframe timeline:**
```typescript
const KEYFRAMES = [
  { timeSec: 0, zoom: 1.0, focusX: 0.5, focusY: 0.5 },      // Full view
  { timeSec: 23, zoom: 1.0, focusX: 0.5, focusY: 0.5 },      // Still full, about to zoom
  { timeSec: 25, zoom: 1.2, focusX: 0.45, focusY: 0.20 },    // Gentle zoom on metrics area
  { timeSec: 29, zoom: 1.2, focusX: 0.45, focusY: 0.20 },    // Hold
  { timeSec: 30.5, zoom: 3.0, focusX: 0.56, focusY: 0.15 },  // Zoom on specific metric
  { timeSec: 34, zoom: 3.0, focusX: 0.56, focusY: 0.15 },    // Hold
  { timeSec: 36, zoom: 3.0, focusX: 0.06, focusY: 0.15 },    // Slide to different metric
  // ... etc
];
```

### Step 6: Verify with Still Frames (CRITICAL)

**Before doing a full render, verify every zoom target with still frames.** This is the most important step — it catches coordinate errors that would waste a full render cycle.

For each keyframe where the zoom or focus changes, render a single still frame:

```bash
npx remotion still <CompositionId> --frame=<frame_number> --output=/tmp/verify-<timestamp>.png
```

**Self-review each still frame:**
1. Look at the rendered frame
2. Ask: "The narrator says [X] at this moment. Is [X] visible and prominent in this frame?"
3. If the wrong element is centered, adjust the focusX/focusY coordinates
4. Re-render the still frame and check again
5. Only proceed to full render when ALL still frames show the correct targets

**Common coordinate mistakes to check for:**
- Zooming into the wrong column (neighboring columns look similar)
- focusY landing on chart labels instead of the actual data
- Coordinates measured from one timestamp applied to a different timestamp where the page has scrolled
- Transform origin clipping — at high zoom levels, the focus point might be too close to an edge, causing black bars

### Step 7: Build the Remotion Composition

Create the Remotion project files. The composition structure:

**Root.tsx:**
```tsx
import { Composition } from "remotion";
import { MyComposition } from "./Composition";

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="VideoPolish"
      component={MyComposition}
      durationInFrames={DURATION_SECONDS * FPS}
      fps={FPS}
      width={VIDEO_WIDTH}
      height={VIDEO_HEIGHT}
    />
  );
};
```

**Composition.tsx:**
```tsx
import {
  AbsoluteFill, Audio, OffthreadVideo, staticFile,
  useCurrentFrame, useVideoConfig,
} from "remotion";

type Keyframe = {
  timeSec: number;
  zoom: number;
  focusX: number;
  focusY: number;
};

const KEYFRAMES: Keyframe[] = [
  // ... keyframes from Step 5
];

// Smooth ease-in-out interpolation
function smoothstep(t: number): number {
  const c = Math.max(0, Math.min(1, t));
  return c * c * (3 - 2 * c);
}

function getStateAtTime(timeSec: number) {
  if (timeSec <= KEYFRAMES[0].timeSec) return KEYFRAMES[0];
  if (timeSec >= KEYFRAMES[KEYFRAMES.length - 1].timeSec)
    return KEYFRAMES[KEYFRAMES.length - 1];

  for (let i = 0; i < KEYFRAMES.length - 1; i++) {
    const kf0 = KEYFRAMES[i];
    const kf1 = KEYFRAMES[i + 1];
    if (timeSec >= kf0.timeSec && timeSec <= kf1.timeSec) {
      const t = (timeSec - kf0.timeSec) / (kf1.timeSec - kf0.timeSec);
      const e = smoothstep(t);
      return {
        zoom: kf0.zoom + (kf1.zoom - kf0.zoom) * e,
        focusX: kf0.focusX + (kf1.focusX - kf0.focusX) * e,
        focusY: kf0.focusY + (kf1.focusY - kf0.focusY) * e,
      };
    }
  }
  return KEYFRAMES[KEYFRAMES.length - 1];
}

export const MyComposition: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { zoom, focusX, focusY } = getStateAtTime(frame / fps);

  return (
    <AbsoluteFill style={{ backgroundColor: "black" }}>
      <AbsoluteFill
        style={{
          transform: `scale(${zoom})`,
          transformOrigin: `${focusX * 100}% ${focusY * 100}%`,
        }}
      >
        <OffthreadVideo
          src={staticFile("source.mp4")}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </AbsoluteFill>
      {/* Optional: background music */}
      <Audio
        src={staticFile("music.mp3")}
        volume={(f) => {
          const total = DURATION * fps;
          if (f < fps) return f / fps;           // 1s fade in
          if (f > total - 3 * fps)
            return (total - f) / (3 * fps);      // 3s fade out
          return 1;
        }}
      />
    </AbsoluteFill>
  );
};
```

Copy the source video (and optional music) into the Remotion project's `public/` folder:
```bash
cp <source_video> <remotion_project>/public/source.mp4
cp <music_file> <remotion_project>/public/music.mp3  # optional
```

### Step 8: Render

```bash
npx remotion render <CompositionId> --output=<output_path>.mp4
```

Rendering takes approximately 1-3 minutes for a 60-90 second video at 720p/1080p.

### Step 9: Present the Output

```
Video polished!
- Duration: [X] seconds
- Resolution: [W]x[H]
- Zoom effects: [N] zoom points
- Audio: [original / replaced with soundtrack / mixed]
- File: [local path]

Want me to adjust any zoom points and re-render?
```

---

## Supported Inputs

| Input | Required | Formats | Notes |
|---|---|---|---|
| **Source video** | Yes | MP4, MOV, WebM | Screen recording, Loom, product demo |
| **Soundtrack** | No | MP3, WAV, AAC | Replaces or mixes with original audio |
| **Zoom instructions** | No | Natural language | "Zoom in when he talks about metrics." If not provided, the skill auto-detects from transcript. |
| **Specific timestamps** | No | "Zoom at 0:15, 0:42" | Overrides auto-detection for specific moments |

---

## Audio Options

| Option | What happens |
|---|---|
| **Keep original** (default if no soundtrack provided) | Original narration plays, zoom effects are visual only |
| **Replace with soundtrack** | Original audio removed, soundtrack plays with fade-in/fade-out |
| **Mix** | Soundtrack plays at ~20% volume underneath original narration |

---

## Output Specifications

| Property | Value |
|---|---|
| **Format** | MP4 (H.264) |
| **Resolution** | Same as source video |
| **Frame rate** | Same as source video |
| **Easing** | Smoothstep (cubic ease-in-out) on all transitions |
| **Render engine** | Remotion (CSS transform-based, sub-pixel precision) |

---

## Limitations and Gotchas

1. **Coordinates change when the page scrolls.** Always extract the source frame at the EXACT timestamp you're setting a keyframe for. Don't reuse coordinates from a different timestamp.

2. **Still frame verification is mandatory.** Never do a full render without verifying zoom targets via still frames first. A full render takes 1-3 minutes — a still frame takes 2 seconds. Always verify.

3. **High zoom levels (3x+) on low-res source video** will look pixelated. The skill is scaling up the video, not enhancing resolution. For 720p source, 2.5x is about the max before it looks bad. For 1080p source, 3.5x is the limit.

4. **No dynamic zoom tracking.** The zoom targets are set based on static frame analysis. If the UI is animating (dropdown opening, modal appearing), the zoom point is based on where the element is at the keyframe timestamp.

5. **Remotion project setup required.** The first run requires creating a Remotion project (`npx create-video`). Subsequent runs reuse the same project — just swap the source video and update keyframes.

6. **Whisper transcription quality** depends on audio clarity. Background noise, multiple speakers, or heavy accents may produce inaccurate timestamps. Always verify transcript timestamps against the actual video.

7. **Transform origin at edges.** At high zoom with focusX near 0 or 1, part of the zoomed view may show black bars (beyond the video edge). Keep focusX between 0.05-0.95 at zoom levels above 2.5x.
