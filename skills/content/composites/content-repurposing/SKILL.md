---
name: content-repurposing
description: Turn public social videos, transcripts, posts, creator research, or the user's own source material into platform-specific LinkedIn posts, X posts and threads, short-form scripts, newsletters, blog outlines, carousel briefs, and content calendars. Use when the user wants to reuse a strong idea without copying the source.
---

# Content Repurposing

Convert source material into original, voice-matched content for the channels the user actually needs.

## Inputs

- Source URLs, transcripts, posts, research reports, or owned source material.
- Target audience, brand or company voice, platforms, formats, objective, and desired quantity.
- Optional Brand Core, voice guide, campaign, offer, CTA, and publishing window.

## Workflow

1. Confirm which sources may be transformed and whether they are owned, quoted, or used only as inspiration.
2. For a video source, use `transcript-intelligence` to obtain or analyze its transcript. Do not download, transcode, or edit the video, and do not introduce an FFmpeg dependency. If the user already supplied a transcript or captions, work from them directly. If only a URL is available and the current environment cannot call the transcript provider, ask for the transcript or captions; do not improvise a terminal-only media workflow.
3. Use `outlier-post-finder` or `creator-profile-teardown` when the user wants to repurpose a winning pattern rather than a single source.
4. Extract content atoms: hooks, stories, claims, proof, frameworks, questions, examples, objections, visuals, and calls to action. Retain the source and support for every factual atom.
5. Choose only formats that fit the audience and objective. Define the platform constraint, distinct angle, and intended action for each output.
6. Rewrite from the user's perspective and voice. Use `create-linkedin-content` and `create-x-content` for final platform tuning when those formats are requested.
7. Produce ready-to-edit drafts, not a list of generic ideas. Vary the structure by platform and include attribution notes where a source materially influenced the output.
8. Self-check for voice, factual support, repetition, plagiarism risk, platform fit, and whether each derivative stands on its own.

## Runtime paths

- **Transcript or text supplied:** fully terminal-free. Repurpose the supplied material directly.
- **Public video URL with GooseWorks MCP:** use `transcript-intelligence`, then call the managed provider through the live `call_data_provider` schema. No terminal or separate provider key is required.
- **Public video URL with GooseWorks CLI:** use `transcript-intelligence` and its declared provider dependency, then continue with the transcript.
- **Public video URL without either provider path:** explain that the transcript cannot be fetched in this environment and request pasted captions or a transcript.

## Output

- Source inventory and content-atom table.
- Repurposing map showing source atom, target format, audience, angle, and CTA.
- Platform-ready drafts grouped by channel.
- Optional carousel or visual briefs for `goose-graphics` when requested.
- Suggested publishing sequence and content calendar when requested.
- Attribution notes, factual checks, and items requiring user review.

## Guardrails

- Adapt ideas, evidence, and structures; do not plagiarize distinctive language or creative expression.
- Quote only short, necessary excerpts and retain attribution.
- Do not flatten every platform into the same draft with a different character count.
- Do not invent facts, personal experience, customer proof, or first-person claims for the user.
- Do not require FFmpeg or a local terminal. This skill transforms source meaning into written content; it does not process video files.
