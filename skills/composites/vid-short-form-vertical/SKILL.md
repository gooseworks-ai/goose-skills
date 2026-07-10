---
name: vid-short-form-vertical
description: Create short-form vertical videos from a hook, prompt, format, and platform choice. Use when the user needs Instagram Reels, TikToks, or YouTube Shorts that are mobile-native, hook-first, caption-friendly, and optimized for reach, watch-through, shares, or saves.
tags: [content, design, social]
---

# Vid Short Form Vertical

Create short-form vertical videos optimized for Reels, TikTok, and Shorts.

This skill is for mobile-first, hook-first content. The output should feel fast, native to the platform, and easy to understand without relying on sound.

## Best Fit

- Instagram Reels
- TikTok clips
- YouTube Shorts
- Hook-first educational video
- Short list, POV, tutorial, and storytime formats

## Use Something Else

- If the user wants a creator-testimonial ad, use `vid-ugc-style`.
- If the user wants a launch reveal, use `vid-product-launch`.
- If the user wants a detailed product walkthrough, use `vid-product-demo-screencast`.

## Core Promise

1. Accept a hook and core content prompt
2. Match the video to a short-form format
3. Build a hook-payoff-CTA structure
4. Add captions and platform-appropriate pacing
5. Export a vertical MP4

## Inputs

| Parameter | Required | Default | Notes |
|-----------|----------|---------|-------|
| `hook` | Yes | - | Opening line or first visual |
| `prompt` | Yes | - | Topic, script, or content direction |
| `duration` | No | `30` | Usually `15`, `30`, or `60` |
| `format` | No | `talking-points` | `talking-points`, `list`, `storytime`, `pov`, or `tutorial` |
| `captions` | No | `true` | Captions should almost always stay on |
| `music` | No | `trending` | Energy or music style |
| `aspect_ratio` | No | `9:16` | Fixed default for this skill |
| `platform` | No | `instagram` | `instagram`, `tiktok`, or `youtube-shorts` |
| `style` | No | `auto` | Visual treatment or aesthetic |
| `assets` | No | none | Existing clips, brand visuals, b-roll, screenshots |

## Short-Form Formula

Use this structure unless the user gives a stronger one:

| Time | Purpose |
|------|---------|
| 0-3 sec | Hook |
| 3-25 sec | Payoff |
| 25-30 sec | CTA |

The hook is the most important beat in the entire brief.

## Format Selection

| Format | Best For |
|--------|----------|
| `talking-points` | quick educational commentary |
| `list` | numbered tips, examples, or formats |
| `storytime` | narrative with a setup and payoff |
| `pov` | immersive or scenario-driven framing |
| `tutorial` | tactical step-by-step advice |

If the user does not specify a format, choose the one that best matches the content type.

## Platform Differences

### Instagram Reels

- ideal length: 15 to 30 seconds
- captions should be large and center-readable
- optimize for saves and shares

### TikTok

- ideal length: 30 to 60 seconds
- conversational pacing works well
- optimize for watch-through

### YouTube Shorts

- ideal length: 30 to 60 seconds
- a stronger CTA to long-form or next action can make sense

## Provider Guidance

| Tool | Best Use |
|------|----------|
| `Runway` | AI-generated short-form video from text or image prompts |
| `Pika` | fast visual generation for lightweight b-roll style clips |
| `Kling` | higher-quality generated clips and longer short-form sequences |
| `CapCut` | editing and repurposing existing assets into vertical short-form |
| `Opus Clip` | auto-clipping long-form content into vertical cuts |

## Hook Formulas

Patterns that work:

- "The [topic] tip nobody talks about..."
- "I tested [X] so you do not have to. Here is what happened."
- "[Number] signs that [problem you have]"
- "POV: you just discovered [solution]"
- "Stop doing [common mistake]. Do this instead."

## Workflow

### Step 1 - Intake

Resolve these before generating:

1. Hook
2. Prompt or core content
3. Format
4. Platform
5. Duration
6. Captions
7. Music energy
8. CTA

If the user has not written the hook, help them write that before anything else.

### Step 2 - Lock the Hook

The first 1 to 3 seconds decide whether the rest matters.

Rules:

- bold statement, surprise, pattern interrupt, or strong framing
- no slow intro
- no logo-first opening
- no generic setup line

### Step 3 - Build the Payoff

The payoff should deliver exactly what the hook promised.

Rules:

- one insight, one list, one story, or one tutorial thread
- no bait-and-switch
- keep momentum high
- cut anything that does not support the hook

### Step 4 - Choose the Production Path

Use tools like:

- Runway
- Pika
- Kling
- CapCut
- Opus Clip

Choose based on the job:

- AI-generated path when creating from text or image prompts
- repurposing/editing path when working from existing long-form or raw clips

### Step 5 - Add Captions and Music

Captions are effectively required for this skill.

Rules:

- keep captions readable
- match music energy to the content
- do not let music overpower the spoken message

## Output Defaults

- File: `short-form-vertical.mp4`
- Dimensions: `1080x1920`
- Format: `MP4`
- Aspect ratio: `9:16`
- Common durations: `15`, `30`, or `60` seconds

## Prompt Tips

- write the hook first before anything else
- specify the format because `list`, `storytime`, `pov`, and `tutorial` produce very different pacing
- keep captions on by default because most first-view consumption is silent
- match music energy to the emotional shape of the content, not just the platform

## Delivery

Default output:

- `short-form-vertical.mp4`

Typical output:

- `1080x1920`
- `9:16`
- 15, 30, or 60 seconds

When delivering, report:

- hook used
- platform
- format
- duration
- caption setting

## Guardrails

- do not start without a strong hook
- do not let the payoff drift away from the promise
- do not drop captions by default
- do not use a static horizontal mindset inside a vertical format

## Example Request

```text
Hook: "The LinkedIn post type that outperforms everything else and almost nobody uses." Format: list. Content: five overlooked LinkedIn post formats with 2x average engagement. Duration: 45 seconds. Captions: true. Music: lo-fi upbeat. Platform: instagram.
```

Expected result:

- a hook-first short-form video
- a final `short-form-vertical.mp4`
