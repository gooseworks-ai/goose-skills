---
name: vid-talking-head
description: Create talking-head videos from a word-for-word script, avatar or source face, voice, and background settings. Use when the user needs founder-style messaging, product explanation, educational content, thought leadership, or presenter-led video without filming a real person on camera.
tags: [content, design, social]
---

# Vid Talking Head

Create talking-head videos using an AI avatar or source face with lip-synced narration.

This skill is for presenter-led explanation without on-camera recording. The result should feel clear, direct, and intentional, with good speech rhythm and strong framing.

## Best Fit

- Founder-style messaging
- Educational explainers
- Product explanation videos
- Thought-leadership clips
- LinkedIn talking-head posts

## Use Something Else

- If the user wants a customer-proof asset, use `vid-customer-testimonial`.
- If the user wants FAQ-specific formatting, use `vid-faq`.
- If the user wants creator-style social content, use `vid-ugc-style`.

## Core Promise

1. Accept a word-for-word script
2. Choose avatar, voice, language, and background
3. Tighten pacing for better lip-sync and speech rhythm
4. Add captions and lower-third treatment when useful
5. Export a polished MP4

## Non-Negotiable Input Rule

This skill needs the actual script, not a vague brief.

If the user says "make a talking head video about our product," ask for the exact words or help draft the script first.

## Inputs

| Parameter | Required | Default | Notes |
|-----------|----------|---------|-------|
| `script` | Yes | - | Full spoken script |
| `avatar` | No | `default` | AI avatar ID, photo URL, or source footage |
| `voice` | No | `default` | TTS voice or uploaded voice clone |
| `language` | No | `en` | Language code |
| `background` | No | `office` | Virtual background or brand backdrop |
| `captions` | No | `true` | Burn captions into the video |
| `lower_third` | No | none | Name and title overlay |
| `aspect_ratio` | No | `16:9` | `16:9` or `9:16` |
| `assets` | No | none | Logos, title cards, supporting product visuals |

## Provider Guidance

| Tool | Best Use |
|------|----------|
| `HeyGen` | best avatar quality, studio backgrounds, multilingual delivery |
| `Synthesia` | enterprise talking-head workflows and corporate presenter templates |
| `D-ID` | animating a still photo into a talking head |
| `ElevenLabs` | TTS quality and voice cloning |
| `Runway` | lip-syncing onto real human footage |

## Script Structure

Use this simple pattern:

| Section | Purpose |
|---------|---------|
| Hook | first 1 to 2 sentences |
| Body | one idea per paragraph |
| CTA | 1 to 2 sentences |

Mark pauses with `[pause]` or `...` when natural rhythm matters.

## Workflow

### Step 1 - Intake

Resolve these before rendering:

1. The exact script
2. Audience and channel
3. Avatar or face source
4. Voice and language
5. Background
6. Captions and lower-third
7. Aspect ratio

### Step 2 - Tighten for Speech

TTS and lip-sync work better when the script is spoken language, not written prose.

Rules:

- short sentences
- one idea per paragraph
- natural pause markers
- no stacked clauses unless necessary
- CTA should be direct and singular

### Step 3 - Choose the Production Path

Use tools like:

- HeyGen
- Synthesia
- D-ID
- ElevenLabs
- Runway for lip sync on real human footage

Choose based on the job:

- HeyGen for polished avatar quality and multilingual flexibility
- Synthesia for enterprise presenter workflows
- D-ID when animating a still photo into a talking head
- Runway when syncing audio onto real footage

### Step 4 - Frame the Presenter

The talking head should feel intentional, not generic.

Rules:

- match background to the message
- keep captions on by default
- use lower-third only when it adds credibility
- avoid cluttered or distracting visual treatment

## Output Defaults

- File: `talking-head.mp4`
- Resolution: `1080p`
- Format: `MP4`
- Aspect ratio: `16:9` or `9:16`
- Duration guide: roughly `150 words` is about `1 minute`

## Prompt Tips

- write the actual script, not a description of what the avatar should say
- mark natural pauses with `[pause]` or `...` when delivery rhythm matters
- specify delivery tone, such as conversational, keynote-style, direct, calm, or high-energy
- keep social-facing versions under `90 seconds` when possible

## Delivery

Default output:

- `talking-head.mp4`

Typical output:

- 1080p MP4
- `16:9` or `9:16`
- duration based on script length

When delivering, report:

- avatar path used
- voice and language
- caption status
- lower-third status
- aspect ratio

## Guardrails

- do not accept a topic in place of a real script
- do not overstyle the background until it distracts from the speaker
- do not leave long written-prose sentences untouched if they will sound unnatural

## Example Request

```text
Script: "Most teams waste 3 hours a day on status updates. [pause] What if you could automate all of it? [pause] That is exactly what we built. Here is how it works in 60 seconds." Voice: confident American male. Avatar: professional, dark blazer. Background: modern office. Captions: true. Aspect ratio: 16:9.
```

Expected result:

- a presenter-led explanation video
- a final `talking-head.mp4`
