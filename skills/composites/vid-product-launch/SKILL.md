---
name: vid-product-launch
description: Create cinematic or structured product launch videos from a launch brief, reveal timing, and CTA. Use when the user needs a launch-day announcement, teaser, landing-page hero, email-campaign reveal, or social launch asset with a clear build-to-reveal narrative rather than a generic hype reel.
tags: [content, design, social]
---

# Vid Product Launch

Create product launch videos that build anticipation, reveal the product clearly, and end with one strong CTA.

This skill is for launch moments: new product announcements, feature reveals, waitlist opens, launch-day landing pages, hero videos, and social rollout content. The video should feel deliberate and narrative, not like a generic montage of random product shots.

## Best Fit

- Product announcement videos
- Launch-day hero videos for landing pages
- Reveal videos for social channels
- Email-campaign launch assets
- Waitlist, beta, or release announcement videos

## Use Something Else

- If the user wants a creator-style paid social ad, use `vid-ugc-style`.
- If the user wants a presenter-led FAQ or objection handling piece, use `vid-faq`.
- If the user wants pure animated typography with no reveal narrative, use a motion-graphics-first video skill.

## Core Promise

1. Accept a product launch brief
2. Turn it into a reveal narrative
3. Choose the right tone and aspect ratio
4. Build anticipation before the reveal
5. Export a launch-ready MP4 with product name, tagline, and CTA

## Inputs

| Parameter | Required | Default | Notes |
|-----------|----------|---------|-------|
| `product_name` | Yes | - | Product or feature name |
| `product_description` | Yes | - | What it does and who it is for |
| `tagline` | No | `auto` | Prefer user-written 4 to 6 word headline |
| `launch_date` | No | none | Use for countdown or urgency |
| `cta` | No | `auto` | Final CTA line |
| `tone` | No | `cinematic` | `cinematic`, `energetic`, `minimal`, or `emotional` |
| `duration` | No | `60` | Usually `30`, `60`, or `90` seconds |
| `aspect_ratio` | No | `16:9` | `16:9` or `9:16` |
| `include_countdown` | No | `false` | Use sparingly |
| `music` | No | `auto` | Music direction matched to tone |
| `assets` | No | none | Logos, screenshots, UI captures, brand footage, renders |

## Launch Video Logic

This is not a sizzle reel. A launch video has:

1. a tease
2. a build
3. a reveal
4. one proof point
5. a CTA

If the user gives a list of five features, compress to one lead benefit or one strong proof point. Launch videos lose power when they try to explain everything.

## Tone Selection

| Tone | Best For | Reference Feel |
|------|----------|----------------|
| `cinematic` | premium, ambitious, launch-the-company energy | high-end reveal |
| `energetic` | fast SaaS, developer tools, social-first launch | Product Hunt-style momentum |
| `minimal` | design-forward software, calm confidence | clean modern announcement |
| `emotional` | mission-driven or human-outcome product stories | narrative brand launch |

### Tone Rules

- `cinematic` works when the market expects drama or polish
- `energetic` works when speed and momentum matter
- `minimal` works when the product and promise are already strong
- `emotional` works when the human impact matters more than interface flash

Do not default to cinematic if the audience is technical and prefers clarity over spectacle.

## Workflow

### Step 1 - Intake

Resolve these first:

1. Product name
2. Product description
3. Target audience
4. Channel and placement
5. Tagline
6. Reveal timing
7. CTA
8. Tone
9. Assets and brand constraints

If the user has not written the tagline, strongly encourage them to do it. The tagline is load-bearing.

## Step 2 - Choose the Narrative Shape

Use this default launch structure:

| Time | Section | Purpose |
|------|---------|---------|
| 0-10 sec | Tease | Frame the problem or intrigue without naming the product yet |
| 10-30 sec | Build | Raise tension and hint at the solution |
| 30-45 sec | Reveal | Show product name, tagline, and first look |
| 45-55 sec | Proof | One feature, metric, or outcome |
| 55-60 sec | CTA | Availability, waitlist, or next step |

For a 30-second cut, compress each section instead of deleting the reveal.

## Step 3 - Lock the Reveal Moment

The reveal moment is the center of gravity.

Rules:

- the audience should feel the build before the reveal
- the product name and tagline must land clearly
- use one unmistakable visual treatment at the reveal
- do not reveal the product too early unless the user explicitly wants a fast open

If the user says "reveal at 30 seconds," protect that timing.

## Step 4 - Choose the Production Path

### Cinematic AI Visual Path

Use tools like:

- Runway
- Pika
- Kling
- Kaiber

Use when:

- the user wants cinematic product-world visuals
- the launch is visual-first
- the brand can support a more stylized treatment

Rules:

- pair AI visuals with deliberate text overlays
- use the actual product name and tagline, not vague mood text
- keep the proof section concrete

### Structured Announcement Path

Use tools like:

- HeyGen Studio
- structured template-based editors
- hybrid launch packages with uploaded screenshots and motion titles

Use when:

- brand control matters more than visual experimentation
- the user wants consistent product screenshots or presenter segments
- the launch requires exact logo and text placement

## Step 5 - Build the Asset List

Preferred supporting assets:

- logo lockup
- product screenshots
- UI recordings
- feature render stills
- headline and tagline copy
- launch URL or CTA destination

Do not make the video depend on assets the user has not actually provided.

## Step 6 - Script the Launch

Write the launch script in short beats, not paragraphs.

Each beat should define:

- what the viewer sees
- what text appears
- whether narration is present
- what the music is doing

Example structure:

| Beat | Visual | On-Screen Text | Audio |
|------|--------|----------------|-------|
| 1 | dark tease, abstract motion | "Work changed. Tools did not." | low build |
| 2 | hints of product UI | "Research. Content. Outreach." | rise |
| 3 | full reveal | "Gooseworks" / "Work at AI speed." | lift |
| 4 | proof card | "500+ growth teams. 10x output." | hold |
| 5 | end card | "Join the waitlist" | resolve |

## Proof Rules

The proof section should carry one thing:

- one feature
- one result
- one product outcome

Do not turn the proof section into a feature checklist.

## Aspect Ratio Rules

- `16:9` by default for landing pages and hero use
- `9:16` for social-first launch cuts
- if the user needs both, design the main reveal logic once and adapt afterwards

## Delivery

Default output:

- `product-launch.mp4`

Typical output:

- 1080p MP4
- 30 to 90 seconds
- product name, tagline, and CTA included

When delivering, report:

- chosen tone
- reveal timing
- aspect ratio
- whether countdown was used

## Guardrails

- do not invent the tagline if the user can provide it
- do not overload the launch with too many benefits
- do not skip the reveal moment
- do not use countdowns unless they actually support the launch
- do not let music overwhelm the product name, tagline, or CTA

## Example Request

```text
Product launch video, 60 seconds. Product: Gooseworks. Description: AI workspace that automates research, content creation, and outreach for growth teams. Tagline: "Work at AI speed." Tone: minimal. Reveal at 30 seconds. Proof: "500+ growth teams, 10x output." CTA: "Join the waitlist at gooseworks.ai." Music: ambient electronic build. Aspect ratio: 16:9.
```

Expected result:

- a launch narrative with tease, build, reveal, proof, and CTA
- a final `product-launch.mp4`
