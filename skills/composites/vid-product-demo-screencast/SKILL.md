---
name: vid-product-demo-screencast
description: Create product demo and screencast walkthrough videos from a product URL or recording plus an ordered feature flow. Use when the user needs onboarding, sales-enablement, product-page, feature-release, or walkthrough video that shows the real interface in action instead of describing it abstractly.
tags: [content, design]
---

# Vid Product Demo Screencast

Create product demo videos that show the product in action with narration, annotations, cursor guidance, and zoom effects.

This skill is for real product walkthroughs. The output should show what the product does on screen, in a logical order, with a clear outcome. It should not feel like a generic pitch over random UI footage.

## Best Fit

- Sales-enablement demos
- Product-page walkthroughs
- Onboarding and training videos
- Feature-release demos
- Async demo assets for prospects

## Use Something Else

- If the user needs a conceptual explainer rather than the real product, use `vid-animated-explainer-2d`.
- If the user wants a launch reveal, use `vid-product-launch`.
- If the user wants a talking-head explanation with minimal screen share, use `vid-talking-head`.

## Core Promise

1. Accept a product URL or existing recording
2. Sequence the features in the right order
3. Build a narration flow around the on-screen actions
4. Add helpful annotations, cursor cues, and zooms
5. Export a clean MP4 walkthrough

## Non-Negotiable Input Rule

This skill needs either:

- a real `product_url`, or
- an existing recording,

plus an ordered list of the features or flows to demonstrate.

Do not accept "make a demo for our product" without the actual flow.

## Inputs

| Parameter | Required | Default | Notes |
|-----------|----------|---------|-------|
| `product_url` | Yes, unless recording provided | - | URL to record |
| `key_features` | Yes | - | Ordered list of flows or features to show |
| `narration` | No | `auto` | Script or auto-generated narration |
| `voice` | No | `default` | TTS voice or uploaded voice clone |
| `annotations` | No | `true` | Click highlights and attention effects |
| `zoom_on_action` | No | `true` | Zoom when clicking key UI elements |
| `duration` | No | `auto` | Usually 60 to 180 seconds |
| `resolution` | No | `1080p` | `1080p` or `4K` |
| `aspect_ratio` | No | `16:9` | `16:9` or `9:16` |
| `show_cursor` | No | `true` | Show animated cursor movement |
| `assets` | No | none | Existing recordings, logos, customer environment notes |

## Provider Guidance

| Tool | Best Use |
|------|----------|
| `Arcade` | interactive demos with click-through annotations |
| `Loom AI` | fast screen recording with summaries and chapters |
| `Descript` | screencast editing, overdub narration, and cleanup |
| `Synthesia` | hybrid avatar plus screen demo workflows |
| `Tella` | polished async sales demos with strong presentation framing |

## Demo Logic

A demo should show the product solving something in a logical sequence.

That means:

- feature order matters more than feature importance
- the viewer should always know what is happening
- the demo should end on the outcome, not another menu

## Recommended Demo Structure

| Section | Purpose | Typical Duration |
|---------|---------|------------------|
| Hook | Name the pain point or job | 5 to 10 sec |
| Overview | One-sentence intro and roadmap | 10 to 15 sec |
| Feature 1 | Show the most important flow first | 20 to 30 sec |
| Feature 2 to 3 | Secondary supporting flows | 20 to 30 sec each |
| Result | Show the completed state | 10 to 15 sec |
| CTA | Trial, signup, or next step | 5 to 10 sec |

## Workflow

### Step 1 - Intake

Resolve these before building:

1. Product URL or existing recording
2. Ordered feature list
3. Target audience
4. Narration style
5. Duration target
6. Whether annotations, zooms, and cursor should be shown
7. CTA

If the feature list is unordered, reorder it into a natural user flow before writing the script.

### Step 2 - Lock the Demo Order

Use the real on-screen order, not the marketing order.

Good example:

1. Create a workspace
2. Run a research task
3. See the output
4. Export to Notion

Bad example:

1. Export
2. Workspace setup
3. Research
4. Results

### Step 3 - Choose the Production Path

Use tools like:

- Arcade
- Loom AI
- Descript
- Synthesia for hybrid avatar-plus-screen work
- Tella

Choose based on the job:

- Arcade for interactive click-through style demo work
- Loom AI for fast screen-first walkthroughs
- Descript for narration cleanup and post-production
- Tella for polished async sales-style screencasts

### Step 4 - Write the Narration

Narration should support the on-screen action, not compete with it.

Rules:

- describe what the viewer is seeing
- keep each action easy to follow
- use one sentence per meaningful interaction
- do not front-load long explanation before the product appears

If narration is auto-generated, review it against the actual click flow.

### Step 5 - Add Guidance Effects

Use annotations only where they help.

Good use:

- click highlights
- zoom on meaningful actions
- cursor emphasis on important controls

Bad use:

- constant zooming
- every click highlighted
- distracting motion on trivial actions

## Output Defaults

- File: `product-demo.mp4`
- Resolution: `1080p` or `4K`
- Format: `MP4`
- Typical duration: `60` to `180` seconds

## Prompt Tips

- list features in demo order, not importance order
- specify exact on-screen actions like click, type, submit, and result states
- keep most sales demos under `90 seconds` and onboarding demos under `3 minutes`
- end on the finished outcome, not another configuration screen

## Delivery

Default output:

- `product-demo.mp4`

Typical output:

- 1080p or 4K MP4
- 60 to 180 seconds

When delivering, report:

- whether URL or recording path was used
- feature order shown
- whether narration was auto-generated or provided
- annotation and zoom settings

## Guardrails

- do not make up UI steps the product does not have
- do not order features by marketing importance if it breaks the flow
- do not end on menus instead of results
- do not overuse zooms and cursor effects

## Example Request

```text
Product demo for Gooseworks. Key features: [1. Create a new workspace, 2. Run a web research task, 3. See the output in chat, 4. Export to Notion]. Narration: auto-generate from feature list. Annotations: true. Zoom on click: true. Voice: confident American male. Duration: 90 seconds. CTA: "Start your free trial at gooseworks.ai."
```

Expected result:

- a logical product walkthrough
- a final `product-demo.mp4`
