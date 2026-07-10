---
name: vid-sizzle-reel
description: Create high-energy sizzle reels from key messages, brand assets, music direction, and end-card content. Use when the user needs a hype-first montage for launches, conference openers, investor decks, event promos, or campaign kickoffs where excitement and momentum matter more than explanation.
tags: [content, design, social]
---

# Vid Sizzle Reel

Create high-energy sizzle reels that use fast montage, music, bold text, and brand visuals to build excitement.

This skill is for momentum, not explanation. The output should feel punchy, emotional, and music-led, with a clean brand landing at the end.

## Best Fit

- Conference opener videos
- Campaign kickoff videos
- Investor pitch opener reels
- Launch hype videos
- Event promos
- Brand momentum montages

## Use Something Else

- If the user needs a narrative launch reveal, use `vid-product-launch`.
- If the user needs product education, use `vid-product-demo-screencast` or `vid-animated-explainer-2d`.
- If the user needs a talking-head message, use `vid-talking-head`.

## Core Promise

1. Accept key messages, assets, tone, and music direction
2. Turn them into a montage-friendly shot list
3. Match the cut style to the tone
4. Build to a brand land or end card
5. Export a hype-forward MP4

## Inputs

| Parameter | Required | Default | Notes |
|-----------|----------|---------|-------|
| `brand_assets` | No | none | Logos, colors, imagery, screenshots, footage |
| `key_messages` | Yes | - | 3 to 5 punchy on-screen messages |
| `tone` | No | `energetic` | `energetic`, `cinematic`, `emotional`, or `professional` |
| `music` | No | `auto` | Genre, BPM, or energy direction |
| `duration` | No | `60` | Usually `30`, `60`, or `90` |
| `aspect_ratio` | No | `16:9` | `16:9` or `9:16` |
| `cut_style` | No | `fast` | `fast` or `cinematic` |
| `end_card` | No | none | Final frame logo, tagline, and CTA |
| `assets` | No | none | Additional b-roll, footage, or generated visual references |

## Sizzle Reel Logic

This format is music-first and excitement-first.

That means:

- visuals should move with the energy
- messages should be short and bold
- explanation should be minimal
- the last few seconds should belong to the brand

## Recommended Structure

| Section | Purpose | Typical Duration |
|---------|---------|------------------|
| Cold open | boldest first impression | 0 to 5 sec |
| Build | escalating montage and message flashes | 5 to 40 sec |
| Peak | maximum visual and musical intensity | 40 to 55 sec |
| Land | logo, tagline, CTA, and breathing room | 55 to 60 sec |

For a 30-second cut, compress the build but still preserve the land.

## Tone Guide

| Tone | Cut Style | Text Style | Music |
|------|-----------|------------|-------|
| `energetic` | 1-second cuts | bold, all-caps, rapid entry | high-BPM electronic or hip-hop |
| `cinematic` | 3-second cuts | elegant, slower motion | orchestral or ambient swell |
| `emotional` | mixed pacing | softer or poetic | piano or acoustic |
| `professional` | 2-second cuts | structured sans-serif | corporate instrumental |

## Provider Guidance

| Tool | Best Use |
|------|----------|
| `Runway` | AI-generated cinematic b-roll and mood shots |
| `Pika` | fast visual generation for background or transition footage |
| `Opus Clip` | auto-sizzle from existing long-form video |
| `CapCut` | beat-sync editing and text overlay effects |
| `Kaiber` | consistent stylized motion across a full reel |

## Workflow

### Step 1 - Intake

Resolve these before generating:

1. Key messages
2. Tone
3. Music direction
4. Available brand assets
5. End-card content
6. Duration and aspect ratio

If the user has not written the key messages, ask for them. They are the on-screen payload.

### Step 2 - Build the Message Order

Order messages for momentum, not information hierarchy.

Rules:

- strongest or broadest claim early
- proof or traction in the middle
- brand name and promise near the end
- CTA only on the land or end card

### Step 3 - Choose the Production Path

Use tools like:

- Runway
- Pika
- Opus Clip
- CapCut
- Kaiber

Choose based on the job:

- generated visuals path for cinematic b-roll and mood shots
- editing path when existing footage already exists

### Step 4 - Build the Shot List

Use a structure like:

| Beat | Visual | On-Screen Text | Music Energy |
|------|--------|----------------|--------------|
| 1 | bold opening image | first punch line | immediate hit |
| 2 | montage | message 2 | rising |
| 3 | faster sequence | message 3 | peak |
| 4 | brand frame | logo, tagline, CTA | release |

Keep text short. Sizzle reels are not meant for reading paragraphs.

## Output Defaults

- File: `sizzle-reel.mp4`
- Resolution: `1080p`
- Format: `MP4`
- Typical duration: `30` to `90` seconds

## Prompt Tips

- give the `3` to `5` key messages as actual on-screen text, not topic labels
- specify the feeling, not just the subject matter
- choose the music energy or BPM before refining cut rhythm
- keep the final few seconds focused on logo, tagline, and CTA only

## Delivery

Default output:

- `sizzle-reel.mp4`

Typical output:

- 1080p MP4
- 30 to 90 seconds

When delivering, report:

- tone
- cut style
- music direction
- aspect ratio
- end-card content used

## Guardrails

- do not turn the reel into an explainer
- do not overload with too many messages
- do not end on clutter instead of a clean brand land
- do not ignore the music direction

## Example Request

```text
Sizzle reel, 60 seconds. Tone: cinematic. Key messages: ["The future of work is autonomous", "AI that thinks, researches, and executes", "Used by 500+ growth teams", "Gooseworks"]. Music: orchestral swell building to crescendo. Cut style: cinematic. End card: Gooseworks logo + "Work at AI speed" + "gooseworks.ai". Aspect ratio: 16:9.
```

Expected result:

- a music-led hype montage
- a final `sizzle-reel.mp4`
