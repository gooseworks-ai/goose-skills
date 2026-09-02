---
name: vid-faq
description: Create FAQ videos from real question-and-answer pairs as talking-head, text-on-video, or animated MP4s. Use when the user needs support-deflection, pre-purchase objection handling, onboarding help, help-center explainers, or sales follow-up video content, and can provide the actual FAQs rather than a vague topic.
tags: [content, design, social]
---

# Vid FAQ

Create FAQ videos from real question-and-answer pairs, then export a single MP4 that answers the most important customer questions clearly and quickly.

This skill is for objection handling, support reduction, onboarding clarity, and buyer education. The end result should feel useful, specific, and easy to trust, not like a generic brand video.

## Best Fit

- Product FAQ videos for landing pages
- Sales follow-up videos that answer common objections
- Help-center or onboarding explainers
- Social FAQ clips for LinkedIn, Reels, or TikTok
- Multi-question YouTube or email-sequence FAQ assets

## Use Something Else

- If the user needs a creator-style paid social ad, use `vid-ugc-style`.
- If the user needs a drawn educational explainer, use `vid-whiteboard-animation`.
- If the user only needs static FAQ cards or screenshots, use `goose-graphics`.

## Core Promise

1. Accept a real list of questions and answers
2. Choose the right FAQ format for the channel
3. Tighten the answers for video pacing without changing meaning
4. Build a clear question-to-answer structure with titles, captions, and transitions
5. Export a clean MP4

## Non-Negotiable Input Rule

Do not generate the FAQ list from scratch unless the user explicitly asks for that upstream step elsewhere.

This skill works best when the user provides the real FAQs:

- actual customer objections
- real support questions
- real onboarding confusion points
- real sales-call questions

If the user says only "make an FAQ video about our product," stop and ask for the actual Q&A pairs.

## Inputs

| Parameter | Required | Default | Notes |
|-----------|----------|---------|-------|
| `faqs` | Yes | - | Array of `{ question, answer }` pairs |
| `format` | No | `talking-head` | `talking-head`, `text-on-video`, or `animated` |
| `avatar` | No | `default` | AI avatar ID if using talking-head |
| `voice` | No | `default` | TTS voice or cloned voice |
| `product` | No | none | Product name and brand context |
| `num_questions` | No | `all` | Limit to N questions for short variants |
| `aspect_ratio` | No | `16:9` | `16:9` or `9:16` |
| `captions` | No | `true` | Burn captions into video |
| `include_chapters` | No | `true` | Add chapter markers or visual separators |
| `style` | No | `clean-slate` | Visual direction for overlays and backgrounds |
| `assets` | No | none | Logos, screenshots, UI captures, diagrams, customer footage |

## Format Selection

Choose one path before scripting the video.

| Format | Best For | Notes |
|--------|----------|-------|
| `talking-head` | Trust-building, product clarity, sales follow-up | Strongest when a human or avatar should answer directly |
| `text-on-video` | Fast-turn social clips, branded FAQ cards, simple reels | Fastest to produce and easiest to localize |
| `animated` | Complex answers, onboarding steps, conceptual product behavior | Best when the answer needs more than a face and subtitles |

### Default Format Choice

Use `talking-head` by default when:

- the user wants trust and familiarity
- the question is objection-heavy
- the video is for landing pages, email follow-up, or sales enablement

Use `text-on-video` by default when:

- the video is short-form social
- speed matters more than personality
- the answer is short and benefits from big typography

Use `animated` by default when:

- the answer needs product visuals, diagrams, or motion overlays
- the concept is harder to explain with a face alone

## Workflow

### Step 1 - Intake

Resolve these before generating:

1. The actual Q&A list
2. Channel and audience
3. Desired format
4. Aspect ratio
5. Number of questions to include
6. Whether captions and chapters are needed
7. Voice or avatar requirements
8. Supporting assets and brand direction

If the user has too many questions, ask which should be prioritized or split the output into multiple videos.

### Step 2 - Order the Questions

FAQ sequencing matters.

Rules:

- lead with the most frequently asked question, not the most strategic one
- keep the strongest trust-building answer early
- group related questions together
- put setup or implementation questions after "what is it" and "is it safe"
- if the audience is cold traffic, open with the question most likely to stop the scroll

For long-form versions, use 5 to 10 questions.
For short-form versions, use 1 to 3 questions.

## FAQ Video Structures

### Long-Form

Use for:

- YouTube
- landing pages
- help centers
- sales email sequences

Rules:

- 5 to 10 questions
- chapter markers between questions
- consistent title card pattern
- one answer at a time

### Short-Form

Use for:

- Instagram Reels
- TikTok
- LinkedIn short video

Rules:

- 1 to 3 questions
- `9:16` aspect ratio by default
- lead with the question immediately
- keep each answer fast and direct

## Step 3 - Tighten the Answers

Each answer should be concise enough for video, but still trustworthy.

Answer rules:

- answer in 1 to 2 sentences first
- then add the minimum necessary context
- end with reassurance, clarity, or next step when useful
- avoid long disclaimers
- never leave "it depends" hanging without explanation

If an answer is too long, compress it rather than reading out a paragraph.

## Step 4 - Build the Run of Show

Before rendering, turn the FAQs into a scene list.

Use a structure like:

| Segment | Question | Answer Goal | Visual Treatment |
|---------|----------|-------------|------------------|
| 1 | "How is this different from X?" | Positioning | title card + direct answer |
| 2 | "Is my data private?" | Trust | calm close-up + reassurance |
| 3 | "How long does setup take?" | Simplicity | answer + UI screenshot |

Rules:

- one main question per segment
- show the question text clearly
- avoid stacking multiple objections inside one answer
- keep transition style consistent
- use chapters only when they actually help navigation

## Step 5 - Choose the Production Path

### Talking-Head Path

Use tools like:

- HeyGen
- Synthesia
- D-ID

Use when:

- a direct answer from a face builds trust
- the user wants presenter energy
- the FAQ is sales-facing or onboarding-facing

Talking-head rules:

- keep the framing simple
- show the question as an on-screen header
- use captions by default
- insert screenshots only when they clarify the answer

### Text-on-Video Path

Use tools like:

- Typeframes
- motion-graphics or typography-based video tools
- branded editor workflows for text-first social clips

Use when:

- the answer is short
- speed matters
- the channel is social-first

Text-on-video rules:

- keep text large and readable
- never put the full answer on screen at once if it becomes a wall of text
- use one visual pattern per question

### Animated Path

Use when:

- diagrams, icons, or product flows improve comprehension
- the answer needs more than a face and subtitles

Animated rules:

- use motion only to clarify
- keep the question visible up front
- avoid overproduced transitions that slow down the answer

## Writing Strong FAQ Answers

Use these defaults:

- first line: direct answer
- second line: context or explanation
- final beat: reassurance, result, or next step

Example pattern:

- "Yes, Gooseworks works with any browser."
- "It runs as a web app, so there is nothing to install."
- "Most teams are set up in under five minutes."

## Channel Rules

### Sales and Landing Pages

- favor `talking-head`
- keep authority high and pacing calm
- include trust and setup questions early

### Help Center and Onboarding

- favor `animated` or `text-on-video`
- optimize for clarity over persuasion
- include product screenshots when useful

### Social

- favor `text-on-video` or short `talking-head`
- keep one objection or one question per clip
- use `9:16` by default

## Delivery

Default output:

- `faq-video.mp4`

Typical output:

- 1080p MP4
- `16:9` for long-form
- `9:16` for social

When delivering, report:

- number of questions used
- selected format
- aspect ratio
- whether captions and chapter markers were included

## Guardrails

- do not invent FAQs unless explicitly asked to upstream
- do not rewrite the product truth into marketing fluff
- do not bury the answer under too much intro
- do not overload one clip with too many questions
- do not use a generic FAQ order when actual question frequency is known

## Example Request

```text
FAQ video, format: talking-head. Product: Gooseworks. FAQs: [{ Q: "How is this different from ChatGPT?", A: "ChatGPT is a conversation. Gooseworks is a workspace with memory, execution, and tool connections." }, { Q: "Is my data private?", A: "Yes. Your workspace is isolated and we do not train on your data." }, { Q: "How long does setup take?", A: "Under 5 minutes. Connect your tools and your agent is ready." }]. Voice: confident and friendly. Captions: true. Aspect ratio: 16:9.
```

Expected result:

- a structured FAQ video
- one segment per question
- a final `faq-video.mp4`
