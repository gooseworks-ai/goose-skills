---
name: transcript-intelligence
description: Turn social-video transcripts into timestamped hooks, claims, objections, proof, calls to action, and reusable audience language. Use as a supporting capability for creator, competitor, trend, and demand research.
---

# Transcript Intelligence

Analyze what a video says, not just its caption or engagement count.

## Inputs

- One or more YouTube, TikTok, Instagram, Facebook, or X video URLs.
- The brand, product, or research question.
- Optional comparison dimensions such as hooks, objections, proof, or creator delivery.

## Workflow

1. Fetch the post metadata with `scrapecreators-api`.
2. Fetch the platform transcript when available. If unavailable, explicitly mark the item as caption-only; never invent spoken content.
3. Preserve timestamps and speaker changes.
4. Extract:
   - opening hook and first payoff;
   - problem, desired outcome, and audience language;
   - product claims and the evidence offered;
   - objections raised or answered;
   - calls to action;
   - quotable phrases, limited to short excerpts.
5. Compare repeated patterns across videos. Distinguish a single creator's style from category-wide evidence.

## Output

Return a table per video with source URL, timestamps, hook, claims, proof, objections, CTA, and confidence, followed by cross-video patterns and concrete implications for research or creative work.

## Guardrails

- Never present an auto-transcript as perfectly accurate.
- Flag unclear brand names, numbers, ingredients, prices, and regulated claims for verification.
- Treat high engagement as a distribution signal, not proof that a claim is true or a creative caused the result.
