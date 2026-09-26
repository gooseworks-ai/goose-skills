---
name: vid-ugc-style
description: Create UGC-style vertical videos from a product brief, hook, tone, and CTA. Use when the user needs creator-style paid social or organic short-form video that feels authentic, direct-to-camera, and high-retention, especially for Instagram, TikTok, Meta ads, and other scroll-first channels.
tags: [content, design, social]
---

# Vid UGC Style

Create UGC-style videos that feel like creator content instead of polished brand advertising.

This skill is for short-form social and paid acquisition. The result should feel native to the feed: casual, direct, specific, and convincing without sounding like a polished corporate ad.

## Best Fit

- Paid social ads on Meta
- Instagram Reels
- TikTok product videos
- Casual product recommendation clips
- Cold-traffic creative testing

## Use Something Else

- If the user needs a launch-day reveal or cinematic product announcement, use `vid-product-launch`.
- If the user needs direct objection handling or support-style Q&A, use `vid-faq`.
- If the user needs static ad cards or carousel creative, use `goose-graphics`.

## Core Promise

1. Accept a product brief, hook, tone, and CTA
2. Turn the brief into a high-retention UGC script
3. Match the script to a platform-native pacing model
4. Render with a casual creator-style avatar or presenter workflow
5. Export a vertical MP4 ready for short-form distribution

## Inputs

| Parameter | Required | Default | Notes |
|-----------|----------|---------|-------|
| `product_brief` | Yes | - | What the product is, what it does, and who it is for |
| `hook` | No | `auto` | First 3-second opening line |
| `avatar` | No | `default` | Casual creator avatar or presenter profile |
| `tone` | No | `authentic` | `authentic`, `excited`, or `skeptical-convert` |
| `platform` | No | `instagram` | `instagram`, `tiktok`, or `facebook` |
| `duration` | No | `30` | Usually `15`, `30`, or `60` |
| `captions` | No | `true` | Burn captions into the video |
| `cta` | No | `auto` | Final call to action |
| `proof` | No | none | One result, claim, demo insight, or testimonial point |
| `assets` | No | none | Product screenshots, app recordings, brand marks, b-roll |

## UGC Logic

UGC converts because it does not feel like a formal ad.

That means:

- the hook matters more than the logo
- the first sentence matters more than the brand intro
- one believable benefit is better than a long feature list
- casual pacing is good, but vagueness is not

## Tone Selection

| Tone | Best Use | Notes |
|------|----------|-------|
| `authentic` | broad default | sounds like genuine discovery or recommendation |
| `excited` | louder consumer or impulse-friendly products | faster and more expressive |
| `skeptical-convert` | cold traffic and stronger persuasion | starts doubtful, ends convinced |

### Default Tone

Use `skeptical-convert` when:

- the audience is cold
- the product makes a big claim
- the ad needs to earn attention from skeptics

Use `authentic` when:

- the brand wants calm credibility
- the product solves a known pain point directly

## Platform Defaults

### Instagram

- default to 30 seconds
- use a clean hook and visible captions
- keep pacing fast but readable

### TikTok

- default to 15 to 30 seconds
- lead with the strongest pattern interrupt
- let the voice feel a little more conversational

### Facebook

- default to 30 seconds
- keep the message clear even without sound
- make the CTA explicit

## UGC Script Formula

Use this structure unless the user provides a stronger one:

| Section | Purpose | Typical Timing |
|---------|---------|----------------|
| Hook | Stop the scroll | 0-3 sec |
| Pain point | Name the problem | 3-8 sec |
| Product intro | Introduce the solution naturally | 8-18 sec |
| Proof | One concrete result or outcome | 18-25 sec |
| CTA | One next action | 25-30 sec |

For 15-second cuts, compress each beat.
For 60-second cuts, add a little more proof, not more fluff.

## Hook Rules

Hooks are load-bearing. Prefer a real hook from the user if they have one.

Patterns that work:

- "I can't believe I've been doing X wrong for so long..."
- "No one talks about this, but..."
- "POV: you finally found a way to..."
- "If you're struggling with X, watch this."

Hook rules:

- make the first line understandable in isolation
- lead with the pain or curiosity
- avoid "Hi guys, today I want to talk about..."
- never spend the first 3 seconds on brand filler

## Workflow

### Step 1 - Intake

Resolve these before scripting:

1. Product brief
2. Audience
3. Hook
4. Tone
5. Platform
6. Duration
7. CTA
8. Proof point

If the user has not supplied a hook, generate one only after you understand the product, pain point, and audience.

### Step 2 - Pick the Production Path

Use tools like:

- Creatify
- Arcads
- HeyGen
- ElevenLabs for voice work

Choose based on the job:

- Creatify for stronger UGC avatar variety and ad-oriented output
- Arcads for quick direct-response ad generation
- HeyGen for multilingual or more structured avatar control

Do not pretend all tools behave the same. Pick one path and keep the direction consistent.

### Step 3 - Write the UGC Script

Write like a creator speaking to one person.

Rules:

- short sentences
- spoken cadence, not brochure copy
- one claim at a time
- natural transition into the product
- one clear CTA

Bad UGC copy sounds like:

- mission statement language
- feature overload
- corporate adjectives with no concrete payoff

Good UGC copy sounds like:

- observed pain
- direct reaction
- simple explanation
- one believable outcome

### Step 4 - Build the Scene Plan

Before rendering, define the beats.

Use a structure like:

| Beat | Visual | Spoken Line | On-Screen Text |
|------|--------|-------------|----------------|
| 1 | direct-to-camera | hook | short opening line |
| 2 | creator reaction | pain point | problem keyword |
| 3 | product mention | intro | product name |
| 4 | screenshot or proof | result | one metric or outcome |
| 5 | close | CTA | action line |

Keep the visual rhythm simple. Too many cuts can make AI UGC feel fake.

### Step 5 - Render for Feed Native Behavior

Rules:

- `9:16` by default
- captions on by default
- front-load the hook
- show proof quickly
- keep the CTA single and obvious

If the user asks for multiple variants, vary:

- hook
- tone
- CTA
- proof framing

Do not vary everything at once if the goal is creative testing.

## Proof Rules

The proof beat should contain one concrete thing:

- one result
- one before-and-after change
- one testimonial line
- one product behavior the viewer can understand instantly

Do not stack five benefits into one proof section.

## Delivery

Default output:

- `ugc-video.mp4`

Typical output:

- `1080x1920`
- `9:16`
- MP4 with captions

When delivering, report:

- selected platform
- tone
- duration
- hook used
- CTA used

## Guardrails

- do not write polished corporate ad copy and call it UGC
- do not bury the hook
- do not use generic product category language when the actual product is known
- do not overload the script with too many benefits
- do not let the CTA sound disconnected from the rest of the clip

## Example Request

```text
Product: Gooseworks, an AI agent that automates research, content, and outreach workflows. Hook: "I used to spend 4 hours a day on research. Then I found this." Tone: authentic. Duration: 30 seconds. Platform: instagram. CTA: "Link in bio for a free trial."
```

Expected result:

- a short-form UGC script with hook, pain, product intro, proof, and CTA
- a final vertical `ugc-video.mp4`
