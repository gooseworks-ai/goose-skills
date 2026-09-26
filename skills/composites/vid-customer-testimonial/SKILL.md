---
name: vid-customer-testimonial
description: Create customer testimonial videos from verbatim quotes, customer identity details, and format choice. Use when the user needs social proof video for landing pages, sales decks, email follow-up, paid social, or website trust sections, and can provide the real customer words instead of a paraphrased marketing summary.
tags: [content, design, social]
---

# Vid Customer Testimonial

Create customer testimonial videos that turn real customer words into a high-trust proof asset.

This skill is for landing-page trust blocks, sales collateral, paid social proof, and email follow-up assets. The strongest output feels credible and specific, not scripted or overly polished.

## Best Fit

- Customer proof videos for landing pages
- Social proof clips for ads or social posts
- Testimonial inserts for sales decks
- Email follow-up trust assets
- Customer outcome highlights

## Use Something Else

- If the user needs a general talking-head explainer, use `vid-talking-head`.
- If the user needs product education or onboarding, use `vid-product-demo-screencast` or `vid-faq`.
- If the user only has a result stat and no quote, use a static proof graphic or another format instead of inventing a testimonial.

## Core Promise

1. Accept a real customer quote
2. Choose the right testimonial format
3. Highlight the most credible proof point
4. Add identity and result overlays
5. Export a trust-building MP4

## Non-Negotiable Input Rule

Use verbatim customer words whenever possible.

Do not rewrite the testimonial into polished brand copy. The authenticity of the quote is the asset.

## Inputs

| Parameter | Required | Default | Notes |
|-----------|----------|---------|-------|
| `customer_quote` | Yes | - | Real testimonial text |
| `customer_name` | Yes | - | Full customer name or approved display name |
| `customer_title` | No | none | Job title |
| `customer_company` | No | none | Company name |
| `customer_photo` | No | none | Headshot for AI animation |
| `product` | No | none | Product or service being praised |
| `format` | No | `text-on-video` | `talking-head`, `text-on-video`, or `split-screen` |
| `result_stat` | No | none | Outcome to emphasize |
| `aspect_ratio` | No | `16:9` | `16:9`, `9:16`, or `1:1` |
| `style` | No | `clean-slate` | Visual direction |
| `assets` | No | none | Logos, screenshots, supporting visuals |

## Format Selection

| Format | Best For | Notes |
|--------|----------|-------|
| `talking-head` | landing pages, email, sales decks | strongest when a customer photo exists |
| `text-on-video` | paid social and organic social | fastest and safest path |
| `split-screen` | before/after or problem/solution proof | useful when showing contrast or product visuals |

Use `text-on-video` by default if there is no customer photo or if speed matters most.

## Provider Guidance

| Tool | Best Use |
|------|----------|
| `HeyGen` | AI avatar or customer-likeness testimonial from a real photo |
| `D-ID` | animated customer headshot testimonial |
| `Typeframes` | text-on-video testimonial with branded motion treatment |
| `ElevenLabs` | voice cloning when the customer supplies usable audio |
| `Synthesia` | enterprise-grade testimonial presentation workflows |

## What Makes a Strong Testimonial

Favor:

- specific before-and-after language
- named result or timeframe
- role and company context
- believable phrasing

Avoid:

- generic praise with no concrete outcome
- heavy paraphrasing
- identity-free quotes if identity is actually available

## Workflow

### Step 1 - Intake

Resolve these before rendering:

1. The exact quote
2. Customer identity fields
3. The strongest result or proof point
4. Desired format
5. Channel and aspect ratio
6. Whether a customer photo exists
7. Brand/style preferences

If the user only gives a vague summary of what the customer felt, ask for the actual quote.

### Step 2 - Tighten Without Changing Meaning

You may trim for clarity and length, but do not alter the substance.

Rules:

- preserve the customer voice
- remove only obvious filler when needed
- keep the strongest proof line intact
- highlight one result stat if available

### Step 3 - Choose the Production Path

Use tools like:

- HeyGen
- D-ID
- Typeframes
- ElevenLabs
- Synthesia

Choose based on the format:

- talking-head when a customer photo and presenter-style trust matter
- text-on-video when the quote itself should be the hero
- split-screen when product visuals or contrast strengthen the story

### Step 4 - Build the Sequence

Use a structure like:

| Segment | Purpose | Visual |
|---------|---------|--------|
| 1 | Hook the trust signal | name, title, company |
| 2 | Main quote | quote body or first strong line |
| 3 | Result | stat overlay or proof callout |
| 4 | Brand close | logo or CTA if needed |

Keep the testimonial short. The best versions are usually 30 to 45 seconds.

## Output Defaults

- File: `testimonial.mp4`
- Resolution: `1080p`
- Format: `MP4`
- Typical duration: `30` to `90` seconds

## Prompt Tips

- use the customer quote verbatim whenever possible
- elevate one result stat as an on-screen callout if the quote includes measurable proof
- match format to placement: `text-on-video` for social, `talking-head` for landing pages, `split-screen` for contrast stories
- keep most testimonial cuts under `60 seconds`

## Delivery

Default output:

- `testimonial.mp4`

Typical output:

- 1080p MP4
- 30 to 90 seconds

When delivering, report:

- selected format
- result stat used
- whether a customer photo was used
- aspect ratio

## Guardrails

- do not fabricate quotes
- do not paraphrase away the customer voice
- do not overproduce the asset until it feels fake
- do not hide the result if one is available

## Example Request

```text
Customer testimonial video. Format: text-on-video. Quote: "Before Gooseworks, my team spent 4 hours a day just on research. Now we get the same output in 20 minutes. It changed how we operate." Customer: Sarah Kim, Head of Marketing, Acme Corp. Result stat: "95% reduction in research time." Style: midnight-editorial. Aspect ratio: 9:16.
```

Expected result:

- a short social-proof video centered on the real quote
- a final `testimonial.mp4`
