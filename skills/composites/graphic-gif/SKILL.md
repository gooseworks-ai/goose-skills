---
name: graphic-gif
description: Generate looping animated GIFs from a prompt by rendering HTML + CSS animations to frames and compiling them into a `.gif`, or by using an optional image-to-video workflow when external APIs are available. Use when the user needs animated text, icons, counters, tickers, or motion graphics for social posts, blog embeds, lightweight ads, or product marketing, and the final deliverable should be a GIF rather than a static PNG.
tags: [content, design]
---

# Graphic GIF

Generate looping animated GIFs with a default HTML + CSS animation workflow, then compile the frames into a `.gif`.

This skill is for motion-light graphics: animated quotes, stat reveals, typewriter hooks, CTA pulses, simple loops, and compact social graphics that should feel designed but not like a full video production. The output should be a real GIF, optimized for looping and shareability.

## Core Promise

1. Accept a prompt plus motion parameters
2. Choose the safest animation workflow
3. Render an HTML animation or optional AI-driven short motion source
4. Capture or convert frames into a looping GIF
5. Optimize the result for quality, smoothness, and file size

## Best Fit

- Animated social media graphics
- Looping stat reveals
- Typewriter hooks
- Pulsing CTAs
- Simple text-and-shape motion graphics
- Lightweight blog or newsletter embeds

## Use Something Else

- If the user needs a static chart or diagram, use `graphic-chart` or `technical-blog-graphics`.
- If the user needs a static branded visual instead of animation, use `goose-graphics`.
- If the user needs a longer, non-looping video deliverable, use a motion-video skill instead of a GIF workflow.

## Accepted Inputs

Required:

- `prompt`

Optional:

- `animation_type`
- `duration`
- `fps`
- `loop`
- `style`
- `dimensions`
- `optimization`

## Input Defaults

If the user does not specify values, use:

- `animation_type`: `css-animated`
- `duration`: `3.0`
- `fps`: `12`
- `loop`: `true`
- `style`: `clean-slate`
- `dimensions`: `800x800`
- `optimization`: `balanced`

## Animation Workflow Choice

### Default to CSS Animated

Use the CSS workflow for almost all requests involving:

- text reveal
- counters
- fades
- slides
- pulses
- looped icon or shape motion
- terminal-style typing

This is the preferred path because it is more controllable, more reproducible, and does not rely on external image-to-video credentials.

### Use AI Generated Only When Justified

Use an AI-generated path only when:

- the user explicitly asks for painterly or cinematic motion
- the requested animation depends on complex image motion that CSS cannot fake well
- an image-to-video API is actually available in the current environment

If no external API or conversion path is available, stay on the CSS route rather than pretending the AI path exists.

## Supported Animation Types

| Animation | Description | Best Use |
|-----------|-------------|----------|
| `fade-in` | Content fades in from transparent | Quotes, announcements |
| `slide-in` | Elements move in from an edge | Headlines, icons, stats |
| `typewriter` | Text appears character by character | Hooks, claims, terminal motifs |
| `counter` | Numbers count up to a target | Metrics, KPI reveals |
| `pulse` | Repeating scale or glow pulse | CTAs, buttons, icons |
| `loop-scroll` | Infinite ticker or marquee motion | Feeds, logos, lists |

If the user describes motion in prose, map it to one or two of these patterns instead of inventing a chaotic multi-effect sequence.

## Style Guidance

Simpler palettes and backgrounds usually produce better GIFs.

Recommended styles:

- `clean-slate`
- `terminal`
- `electric-burst`
- `brutalist`

Avoid heavy photographic backgrounds, dense gradients, and tiny decorative details. Too many colors increase file size and can create banding or muddy loops.

If the user names a style, verify it exists first:

```bash
npx gooseworks styles list
npx gooseworks styles search "clean slate"
npx gooseworks styles get <slug>
```

If the user provides no style, default to `clean-slate`.

## Output Defaults

- Output file: `animation.gif`
- Default canvas: `800x800`
- Default duration: `3.0` seconds
- Default FPS: `12`
- Default loop: `true`

Typical output size:

- `500 KB` to `3 MB` depending on duration, color complexity, dimensions, and optimization mode

## Output Structure

Recommended output structure:

```text
gif/[name]/
  animation.html
  animation.gif
```

Optional support files:

```text
gif/[name]/
  frames/
  animation.mp4
  source.png
  assets/
```

## Optimization Modes

| Mode | Priority | Behavior |
|------|----------|----------|
| `quality` | visual fidelity | more frames, more colors, larger file |
| `balanced` | default tradeoff | moderate frame rate and palette control |
| `filesize` | lightweight sharing | fewer frames, reduced colors, simpler motion |

If the user cares about email embeds, docs, or lightweight social sharing, bias toward `filesize` or `balanced`.

## Workflow

### Step 1 - Understand the Motion Job

Before rendering anything, resolve:

1. What should move
2. What should stay static
3. What the viewer should notice first
4. Whether the loop should feel seamless or deliberately restart
5. Whether the asset is for social, blog, internal doc, or ad use

If the user only says "make a GIF," clarify the visual concept and motion pattern before proceeding.

### Step 2 - Choose the Animation Path

#### CSS Path

Use HTML + CSS when:

- the motion is shape-based or text-based
- timing matters
- the user needs clean, branded, deterministic output
- you need a small, repeatable loop

#### AI Path

Use an external image-to-video path only when:

- the concept depends on richer visual motion
- a base still frame can be prepared first
- API access and a video-to-GIF conversion path are available

If using the AI path, create the still frame first with `goose-graphics` or another approved graphic generation path, then animate from that source.

### Step 3 - Design for the Loop

Good GIF loops are planned, not improvised.

Rules:

- keep motion simple
- animate only one to three focal elements when possible
- avoid jump cuts unless intentionally punchy
- make the last frame connect naturally back to the first
- prefer stable backgrounds

For typewriter and counter loops, consider a short hold at the end before the restart.

### Step 4 - Build the HTML Animation

For the CSS route, generate a self-contained HTML file that:

- creates a fixed-size artboard
- applies the chosen style
- uses `@keyframes` for motion
- times each element intentionally
- renders cleanly in a headless browser at the requested dimensions

Recommended output:

```text
gif/[name]/animation.html
```

Keep the DOM simple. GIFs do not benefit from elaborate page structure.

### Step 5 - Capture Frames

Capture frames via headless Chromium or the Gooseworks screenshot flow at the requested FPS.

Frame-capture rules:

- render at exact target dimensions
- preserve background colors
- capture enough frames for smoothness, but not so many that the GIF becomes wasteful
- keep timing consistent

As a starting point:

- `8-10 fps` for simple pulsing or fading
- `12 fps` for most social loops
- `15-18 fps` only when motion really benefits from it

### Step 6 - Assemble the GIF

Compile the frames into a looping GIF using a frame assembly or image processing library.

Requirements:

- preserve frame order
- honor the loop setting
- honor optimization priority
- avoid visible palette collapse on highlighted elements

If the source path produces a short video, convert the final video to GIF only after trimming and sizing it to the intended loop.

## Animation-Specific Guidance

### Typewriter

- keep lines short
- use a monospaced or display-safe font if the style allows
- time pauses so the statement is readable before reset
- avoid too much text for the duration

### Counter

- make the final number the star
- keep supporting labels static or lightly animated
- ensure the count speed matches the duration

### Pulse

- use subtle scale or glow changes
- avoid harsh flashing
- keep the background stable

### Loop Scroll

- ensure the ticker loops seamlessly
- duplicate content as needed to hide the seam
- keep the speed readable

## Legibility Rules

- Text must remain readable frame by frame
- Motion must not obscure the main message
- Keep one primary focus area
- Avoid more than necessary colors and micro-details
- If the GIF is too busy, reduce elements before increasing duration

Never trade comprehension for novelty.

## Quality Checks

Before delivery, verify:

- the loop is smooth
- the key message is understandable within one cycle
- the first and last frames connect cleanly
- the style remains readable after GIF color reduction
- the file size matches the likely delivery context

If the GIF feels jittery or bloated, simplify the motion or lower FPS before shipping.

## Success Criteria

A strong output from this skill should feel:

- loop-ready
- visually intentional
- small enough to share comfortably
- clear even without sound
- stronger than a static graphic, but lighter than a full video

## Dependencies

Required skill:

- `goose-graphics`

Recommended skills:

- `goose-graphics-create-style`

## Example Request

```text
Create an animated GIF with a typewriter effect. Text: "73% of B2B buyers read 3+ pieces of content before contacting sales." Style: terminal. Duration: 3 seconds. FPS: 12. Loop: true.
```

Expected result:

- animation HTML
- captured frames
- a looping `animation.gif` with readable typewriter timing
