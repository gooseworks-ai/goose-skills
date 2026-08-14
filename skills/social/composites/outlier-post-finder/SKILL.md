---
name: outlier-post-finder
description: Find posts that materially outperform an account's normal baseline and explain the hook, topic, format, timing, and audience response patterns worth testing.
---

# Outlier Post Finder

Identify unusual performance relative to the account that published the post.

## Inputs

- Profile URLs or handles and platforms.
- Window and sample size; default to 50 recent posts per account.
- Metric priority such as views, engagement, shares, comments, or saves when available.

## Workflow

1. Fetch profile and recent posts with `scrapecreators-api`.
2. Normalize each metric for account size and platform. Use a robust account baseline such as the median, not the single best post.
3. Compute an outlier multiple for comparable posts. Keep format differences visible rather than blending all formats into one baseline.
4. Review the post itself. Use `transcript-intelligence` for video and comments when audience reaction matters.
5. Explain possible drivers—hook, topic, format, collaboration, timeliness, paid/earned distribution indicators—without asserting causality.
6. Extract reusable principles, not copied creative.

## Output

Return the baseline method, ranked outliers, source links, normalized metrics, outlier multiple, hook/topic/format analysis, audience response, confidence, and brand-specific experiments.

Flag missing metrics, deleted posts, giveaways, paid boosts, and platform mismatches as limitations.
