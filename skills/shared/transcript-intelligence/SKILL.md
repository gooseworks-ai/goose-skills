---
name: transcript-intelligence
description: Turn TikTok, Instagram, YouTube, Facebook, X, LinkedIn, Reddit, or Rumble transcripts into timestamped hooks, claims, objections, proof, calls to action, sponsorship signals, and reusable content atoms. Use directly for transcript analysis or as support for creator, competitor, trend, demand, and repurposing work.
---

# Transcript Intelligence

Analyze what a video says, not just its caption or engagement count.

## Inputs

- One or more TikTok, Instagram, YouTube, Facebook, X, LinkedIn, Reddit, or Rumble post or video URLs.
- The brand, product, or research question.
- Optional comparison dimensions such as hooks, objections, proof, or creator delivery.

## Workflow

1. Fetch the post metadata with `scrapecreators-api`.
2. Fetch the platform transcript when available. For YouTube, collect public sponsorship signals when relevant. If a transcript is unavailable, explicitly mark the item as caption-only; never invent spoken content.
3. Preserve timestamps and speaker changes.
4. Extract:
   - opening hook and first payoff;
   - problem, desired outcome, and audience language;
   - product claims and the evidence offered;
   - objections raised or answered;
   - calls to action and disclosed sponsorships;
   - quotable phrases, limited to short excerpts.
5. Compare repeated patterns across videos. Distinguish a single creator's style from category-wide evidence.

## Output

Return a table per video with source URL, platform, timestamps, hook, claims, proof, objections, CTA, sponsorship signal when available, content atoms, and confidence, followed by cross-video patterns and concrete implications for research, repurposing, or creative work.

## Guardrails

- Never present an auto-transcript as perfectly accurate.
- Flag unclear brand names, numbers, ingredients, prices, and regulated claims for verification.
- Treat high engagement as a distribution signal, not proof that a claim is true or a creative caused the result.
