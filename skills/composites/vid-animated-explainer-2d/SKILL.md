---
name: vid-animated-explainer-2d
description: Create 2D animated explainer videos from a scene-based script, character notes, and narration plan. Use when the user needs onboarding, product-page, investor, educational, or process-explainer video that should feel more polished than whiteboard animation but lighter and cheaper than live action.
tags: [content, design]
---

# Vid Animated Explainer 2D

Create 2D animated explainer videos with illustrated characters, scene transitions, narration, and music.

This skill is for product explainers, onboarding videos, investor explainers, and educational walkthroughs where the user wants a structured, polished animation instead of a talking head or whiteboard sketch.

## Best Fit

- Product page hero explainers
- Onboarding videos
- Pitch or investor explainers
- Educational process videos
- Feature explainers with narrative scenes

## Use Something Else

- If the user wants a whiteboard hand-drawn look, use `vid-whiteboard-animation`.
- If the user wants a direct-to-camera presenter, use `vid-talking-head`.
- If the user wants a product walkthrough showing the real interface, use `vid-product-demo-screencast`.

## Core Promise

1. Accept a script and scene plan
2. Break the script into animated scenes
3. Match each scene to a simple character action or visual transition
4. Choose a consistent 2D style
5. Export a polished MP4

## Inputs

| Parameter | Required | Default | Notes |
|-----------|----------|---------|-------|
| `script` | Yes | - | Full narration script broken into scenes |
| `animation_style` | No | `flat` | `flat`, `cartoon`, `corporate`, or `sketch` |
| `characters` | No | `auto` | Character descriptions and roles |
| `voiceover` | No | `default` | TTS voice or uploaded voice clone |
| `music` | No | `auto` | Background music direction |
| `duration` | No | `auto` | Usually 60 to 180 seconds |
| `aspect_ratio` | No | `16:9` | `16:9`, `9:16`, or `1:1` |
| `captions` | No | `false` | Burn captions into the final video |
| `assets` | No | none | Logos, product screenshots, diagrams, brand references |

## Animation Style Selection

| Style | Best For | Notes |
|-------|----------|-------|
| `flat` | general SaaS and B2B explainer work | safest default |
| `cartoon` | friendlier or more playful storytelling | use when approachability matters |
| `corporate` | enterprise or professional explainer tone | cleaner and more restrained |
| `sketch` | lighter illustrative feel | close cousin to whiteboard but more polished |

Use `flat` by default unless the user wants a stronger aesthetic direction.

## Provider Guidance

| Tool | Best Use |
|------|----------|
| `Vyond` | professional 2D animation and corporate explainer style |
| `Animaker` | broader character library and scene builder workflow |
| `Steve.ai` | script-first AI-assisted animation assembly |
| `Synthesia` | hybrid 2D plus avatar narration workflows |
| `Runway` | stylized illustration-driven animated scenes |

## Explainer Structure

Use this structure unless the user gives a stronger one:

| Section | Purpose | Typical Duration |
|---------|---------|------------------|
| Problem | Show the pain point | 15 to 20 sec |
| Solution intro | Introduce what the product does | 10 to 15 sec |
| How it works | Simple 3-step process | 30 to 60 sec |
| Proof or outcome | One result or social proof point | 10 to 15 sec |
| CTA | One next step | 5 to 10 sec |

If the user tries to explain too much in one video, simplify the concept or split it.

## Workflow

### Step 1 - Intake

Resolve these before building:

1. The scene-based script
2. Audience
3. Product or concept being explained
4. Animation style
5. Character needs
6. Voiceover and music direction
7. Aspect ratio
8. CTA

If the script is not already scene-based, convert it before rendering.

### Step 2 - Break the Script into Scenes

Each scene should communicate one concept.

Use a structure like:

| Scene | Visual | Narration | Purpose |
|-------|--------|-----------|---------|
| 1 | marketer drowning in tabs | "Marketing teams waste hours finding information." | problem |
| 2 | one workspace appears | "Gooseworks brings it into one AI workspace." | solution intro |
| 3 | tasks complete automatically | "Research, content, and outreach happen in one flow." | how it works |

Rules:

- one concept per scene
- one primary action per scene
- narration should match the visual action
- do not combine multiple product ideas into one visual beat

### Step 3 - Choose the Production Path

Use tools like:

- Vyond
- Animaker
- Steve.ai
- Synthesia for hybrid avatar-animation work
- Runway for stylized illustration-driven scenes

Choose based on the job:

- Vyond for professional B2B animation
- Animaker for wider character variety and easier scene assembly
- Steve.ai for script-first automation

### Step 4 - Direct Character and Motion

Character instructions should be simple and readable:

- who is on screen
- what they are doing
- what changes in the environment
- what the viewer should notice

Avoid overdirecting with live-action language. This is 2D animation, not a film set.

### Step 5 - Keep the Narrative Tight

Rules:

- keep it under two minutes unless the user explicitly needs longer
- favor clarity over visual complexity
- keep every scene moving the explanation forward
- use one clear proof point, not a laundry list

## Prompt Tips

- structure the script by scene before rendering
- describe character actions, not just the narration
- keep most explainers under `2 minutes`
- never try to explain two separate ideas in the same scene

## Delivery

Default output:

- `explainer-2d.mp4`

Typical output:

- 1080p MP4
- 60 to 180 seconds

When delivering, report:

- animation style
- aspect ratio
- approximate scene count
- whether captions were included

## Guardrails

- do not accept a vague brief in place of a real script
- do not overload a scene with multiple concepts
- do not let the explainer drift into feature-spam
- do not use more characters than the story actually needs

## Example Request

```text
Create a 90-second 2D explainer. Animation style: flat. Script: [Scene 1] Sarah, a marketer, stares at five open tabs. Narration: "Marketing teams spend hours just finding information." [Scene 2] Sarah discovers Gooseworks and her workflow collapses into one interface. Narration: "Gooseworks brings research, content, and outreach into one AI workspace." [Scene 3] Completed tasks fill the dashboard. Narration: "Get started free at gooseworks.ai." Voice: warm female. Music: upbeat corporate.
```

Expected result:

- a scene-based animated explainer
- a final `explainer-2d.mp4`
