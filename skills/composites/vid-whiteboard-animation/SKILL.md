---
name: vid-whiteboard-animation
description: Create whiteboard-style explainer videos from narration and draw cues, then export them to MP4. Use when the user needs educational, training, onboarding, or conceptual B2B video that explains ideas step by step with synchronized hand-drawn visuals rather than a presenter or glossy promo treatment.
tags: [content, design]
---

# Vid Whiteboard Animation

Create whiteboard-style explainer videos where concepts are drawn out in sync with narration.

This skill is for educational explainers, onboarding sequences, sales training, and conceptual B2B content. The result should feel clear, approachable, and sequential, not flashy or photorealistic.

## Best Fit

- Concept explainers
- Product education
- Internal training videos
- Sales onboarding material
- Thought-leadership explainers
- LinkedIn educational video clips

## Use Something Else

- If the user needs a creator-style ad, use `vid-ugc-style`.
- If the user needs an FAQ or objection-handling format, use `vid-faq`.
- If the user needs a cinematic launch reveal, use `vid-product-launch`.

## Core Promise

1. Accept a script and concept list
2. Break the script into draw-and-narrate segments
3. Map each narration beat to a simple visual
4. Choose the right board style and pacing
5. Export a clean MP4 with synchronized draw timing

## Inputs

| Parameter | Required | Default | Notes |
|-----------|----------|---------|-------|
| `script` | Yes | - | Narration script broken into beats |
| `concepts` | No | `auto` | Key concepts or visuals if not embedded in the script |
| `board_style` | No | `whiteboard` | `whiteboard`, `blackboard`, or `glass` |
| `draw_hand` | No | `true` | Show a drawing hand |
| `voiceover` | No | `default` | TTS voice, uploaded voice, or clone |
| `music` | No | `none` | Optional soft background music |
| `duration` | No | `auto` | Usually 60 to 240 seconds |
| `color_illustrations` | No | `false` | Color-fill after draw versus pure sketch |
| `assets` | No | none | Logos, diagrams, screenshots, icon references |

## Whiteboard Logic

Whiteboard animation works because it reveals information in sequence.

That means:

- the narration should match the draw order
- the visuals should stay simple
- each beat should introduce one idea
- pacing must allow the viewer to watch the drawing happen

If the script moves too fast for the visuals, slow the script down or split the beat.

## Board Style Selection

| Style | Best For | Notes |
|-------|----------|-------|
| `whiteboard` | general B2B education | clean and familiar default |
| `blackboard` | more dramatic or classroom-like tone | stronger contrast, more stylized |
| `glass` | modern explainer aesthetic | use sparingly and keep visuals clean |

### Default Style

Use `whiteboard` unless the user explicitly wants a different feel.

## Workflow

### Step 1 - Intake

Resolve these before building:

1. The narration script
2. Audience
3. Educational goal
4. Board style
5. Voice and music direction
6. Whether color fills should be used
7. Any required concepts, icons, or diagrams

If the user gives only a topic, ask for the real script or help them draft one before rendering.

### Step 2 - Convert Script into Draw Beats

Whiteboard scripts should be segmented, not written as a monologue.

Use this structure:

```text
[DRAW: stick figure at desk]
NARRATOR: "Imagine you spend 3 hours every morning just on email."

[DRAW: inbox with 500 unread]
NARRATOR: "Sound familiar?"
```

Rules:

- every narration beat gets a visual cue
- visuals should be icons, stick figures, arrows, diagrams, or simple scenes
- avoid complex descriptions that need photorealism
- if a narration line is too long, split it

### Step 3 - Simplify the Visual Language

Whiteboard is not the place for detailed UI polish or cinematic imagery.

Prefer:

- stick figures
- icons
- arrows
- clocks
- checkmarks
- simple dashboards
- process diagrams

Avoid:

- detailed character acting
- dense interface recreation
- visual clutter
- more than one highlight color unless the user explicitly wants it

## Step 4 - Choose the Production Path

Use tools like:

- VideoScribe
- Doodly
- Simpleshow
- Vyond when a broader animation suite is needed

Choose based on the job:

- VideoScribe for classic whiteboard and large asset-library work
- Doodly when blackboard or glassboard styles matter
- Simpleshow when AI-assisted concept translation is useful
- Vyond when the whiteboard look is part of a broader mixed-style piece

## Step 5 - Pace the Narration

Whiteboard pacing is slower than talking-head pacing.

Rules:

- use short sentences
- leave room for the draw action
- one idea per segment
- allow a tiny pause before moving to the next visual

If the user gives dense copy, trim it before rendering. Do not just speed up the voice.

## Step 6 - Add Color Carefully

By default, keep the video mostly black-and-white.

Use color only for:

- one important stat
- a final highlight
- a key problem area
- a single brand accent

Too much color defeats the whiteboard effect.

## Step 7 - Build the Sequence

Before rendering, create a simple storyboard.

Use a structure like:

| Segment | Draw Cue | Narration Goal |
|---------|----------|----------------|
| 1 | overwhelmed worker | introduce the problem |
| 2 | clock and inbox | quantify the pain |
| 3 | 3-step workflow | explain the solution |
| 4 | checkmark and result | close with outcome |

This makes the final animation easier to pace and revise.

## Delivery

Default output:

- `whiteboard-animation.mp4`

Typical output:

- 1080p MP4
- `1920x1080`
- 60 to 240 seconds

When delivering, report:

- board style
- whether draw hand is enabled
- whether color fill is enabled
- approximate duration

## Guardrails

- do not treat whiteboard like a cinematic ad format
- do not use photorealistic visual instructions
- do not write long narration blocks without draw segmentation
- do not overload the board with too many simultaneous elements
- do not use too much color

## Example Request

```text
Whiteboard animation, 90 seconds. Board style: whiteboard. Draw hand: true. [DRAW: person looking overwhelmed at computer]. NARRATOR: "The average knowledge worker checks email 74 times a day." [DRAW: clock spinning fast]. NARRATOR: "That is hours of context switching every single day." [DRAW: simple 3-step workflow]. NARRATOR: "Here is a better system." Voice: calm. Music: none.
```

Expected result:

- a segmented draw-and-narrate storyboard
- a final `whiteboard-animation.mp4`
