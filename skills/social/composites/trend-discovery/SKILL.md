---
name: trend-discovery
description: Discover rising category conversations, formats, sounds, questions, and creator patterns across social platforms, then separate durable demand signals from short-lived noise.
---

# Trend Discovery

Find trends a brand can use without producing a generic list of popular hashtags.

## Inputs

- Brand, category, audience, market, and platforms.
- Decision horizon: react this week, plan next month, or shape a quarter.
- Optional competitor and creator seed list.

## Workflow

1. Build search seeds from category language, problems, desired outcomes, products, competitors, creators, and adjacent interests.
2. Use `scrapecreators-api` to collect trending feeds, hashtag/search results, and recent posts from seed accounts.
3. Compare the recent window with a baseline. A trend must show acceleration, cross-account repetition, or migration across platforms—not merely high lifetime views.
4. Use `outlier-post-finder` and `transcript-intelligence` to understand the content, not just the metric.
5. Classify each signal as emerging, accelerating, established, fading, or seasonal. Score brand fit, audience fit, shelf life, production effort, and reputational risk.
6. Turn the best signals into a response: participate, adapt the format, answer the question, create an evergreen variant, or ignore.

## Output

- Coverage and baseline.
- Ranked trend table with evidence, source links, stage, confidence, shelf life, and brand fit.
- Format/audio/topic patterns.
- Five recommended content tests with a clear reason and timing.
- Watchlist and false positives.

Do not claim a trend from one viral post. Label directional evidence and missing data.
