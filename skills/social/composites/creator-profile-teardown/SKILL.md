---
name: creator-profile-teardown
description: Analyze a creator, influencer, founder, competitor, or brand social account to explain its positioning, content pillars, winning posts, hooks, formats, series, calls to action, and audience response. Use when the user wants to understand why an account works and what patterns to test without copying it.
---

# Creator Profile Teardown

Turn a social profile into a sourced, repeatable content playbook.

## Inputs

- Profile URL or handle and platform.
- Brand, audience, market, and the decision the teardown should inform.
- Optional time window, sample size, Brand Core, and comparison account.

## Workflow

1. Confirm the official account and use `scrapecreators-api` to collect profile metadata, public links, and a representative recent-post sample.
2. Use `outlier-post-finder` to compare posts against the account's own baseline. Separate repeatable outliers from giveaways, collaborations, paid distribution, and isolated viral events.
3. Use `transcript-intelligence` on important videos and `comment-mining` where audience response affects the conclusion.
4. Identify the account's audience promise, positioning, personality, content pillars, recurring series, formats, hooks, proof, calls to action, visual patterns, and cadence.
5. Separate observed mechanics from inferred explanations. Explain several plausible drivers when causality is uncertain.
6. Translate the strongest patterns into brand-specific tests. Adapt the mechanism and audience insight, not the creator's wording or identity.

## Output

- Positioning, promise, audience, voice, and profile-funnel summary.
- Content-pillar and recurring-series table with sourced examples.
- Ranked outlier posts with normalized lift and possible drivers.
- Hook, format, proof, CTA, cadence, and audience-response patterns.
- What to adapt, what not to copy, and five prioritized tests for the user's brand.
- Coverage, source appendix, confidence, and limitations.

## Guardrails

- Do not reduce the teardown to a profile summary; identify repeatable mechanics.
- Do not copy distinctive wording, private details, likeness, or personal identity.
- Do not claim that a pattern caused performance when the evidence only shows correlation.
- Preserve source links and clearly label inference.
