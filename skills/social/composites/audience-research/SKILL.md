---
name: audience-research
description: Evaluate whether a creator, influencer, or brand account reaches the right audience using public profile, aggregate demographic, geography, language, content, comment, and commerce signals. Use for creator comparisons, sponsorship fit, market fit, and audience-quality research.
---

# Audience Research

Evaluate audience fit without pretending public social data is more complete than it is.

## Inputs

- Target audience, countries, languages, category, product, platform, and campaign goal.
- One or more creator or brand profiles.
- Optional Brand Core, exclusions, minimum thresholds, and comparison criteria.

## Workflow

1. Define the target audience and the decision this research must support.
2. Use `scrapecreators-api` to collect public profile data, available aggregate audience demographics, profile-region signals, recent content, follower or following samples, and public link-in-bio or shop pages. Separate creator location from audience location.
3. Sample recent comments with `comment-mining` when audience interest or purchase intent matters. Preserve the post and comment source links.
4. Assess market, language, category, product, community, and engagement-quality fit. Treat content and comment signals as directional evidence, not exact audience composition.
5. Score each fit dimension and attach a confidence level based on source coverage, sample size, recency, and agreement across signals.
6. Compare accounts on the same dimensions and recommend good fit, possible fit, or poor fit with the evidence behind the decision.

## Output

- Target-audience definition and coverage summary.
- Audience-fit table with market, language, category, engagement quality, evidence, fit score, and confidence.
- Account-by-account evidence with source links.
- Important mismatches, unknowns, and verification gaps.
- Sponsorship, creator-test, or market recommendation with the next validation step.

## Guardrails

- Use only public and aggregate signals. Never infer protected or sensitive attributes about individuals.
- Do not convert weak proxies into exact demographic percentages.
- Do not confuse creator location, follower location, commenter language, and audience geography.
- Mark unavailable data and low-confidence conclusions instead of filling gaps with assumptions.
