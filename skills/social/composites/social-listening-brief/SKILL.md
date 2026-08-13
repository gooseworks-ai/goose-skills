---
name: social-listening-brief
description: Produce a decision-ready brief of current brand, product, category, and competitor conversations across social platforms, including sentiment drivers, questions, risks, and growth opportunities.
---

# Social Listening Brief

Summarize what people are saying and what the brand should do next.

## Inputs

- Brand/product, competitors, category terms, market, platforms, and time window.
- The decision this brief should inform.
- Known aliases, misspellings, product names, and campaign phrases.

## Workflow

1. Build transparent query groups: owned brand, products, competitors, category, problems, and campaign terms.
2. Collect public posts and comments with `scrapecreators-api`. Use `comment-mining` for high-value threads and preserve source links.
3. Deduplicate reposts and separate owned content, earned mentions, creator content, customer questions, complaints, and spam.
4. Cluster conversations by topic, emotion, purchase stage, and intent. Validate sentiment against the original context; sarcasm defeats naive labels.
5. Compare current patterns with an earlier baseline when available.
6. Identify action items for content, community, customer support, creative, landing pages, or product research.

## Output

- Executive summary.
- Coverage, query set, and sample limitations.
- Conversation volume and theme table using sample counts.
- Sentiment drivers with representative linked examples.
- Top questions, objections, praise, complaints, creator signals, and competitor mentions.
- Emerging risks and opportunities.
- Prioritized actions with owner type and urgency.

Never call a public social sample representative of all customers. Do not infer sensitive personal traits.
