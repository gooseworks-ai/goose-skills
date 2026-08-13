---
name: competitor-social-research
description: Compare competitors' social content across platforms to identify recurring topics, formats, hooks, audience reactions, distribution patterns, and credible content opportunities for a brand.
---

# Competitor Social Research

Build an evidence-backed view of what competitors publish, what earns unusual attention, and where the brand can differentiate.

## Inputs

- The brand, 3–8 competitors, and target audience.
- Platforms and market.
- Default window: 90 days; default sample: 30 recent posts per competitor per platform.

## Workflow

1. Confirm official competitor handles and collect recent posts with `scrapecreators-api`.
2. Normalize metrics within each account and platform. Never compare raw TikTok views directly with LinkedIn reactions.
3. Label every post by topic, format, hook, proof type, CTA, product/education/entertainment intent, and audience problem.
4. Use `outlier-post-finder` to identify unusually strong posts relative to each account's own baseline.
5. Use `transcript-intelligence` for important video posts and `comment-mining` when audience reaction matters.
6. Separate repeated evidence from inference. Longevity or engagement suggests a pattern; it does not reveal spend, revenue, or causality.

## Output

- Competitor-by-platform coverage table.
- Content mix and cadence comparison.
- Hook, format, proof, and CTA patterns.
- Ten sourced outliers with why they may have worked.
- Saturated themes, whitespace, and five brand-specific experiments.
- Source appendix and limitations.
