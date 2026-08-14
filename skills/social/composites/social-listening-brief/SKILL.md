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
2. Collect public posts and comments with `scrapecreators-api`. Select sources for the audience and category from TikTok, Instagram, YouTube, Facebook, LinkedIn, X, Reddit, Threads, Bluesky, and Pinterest rather than forcing every platform into every brief.
3. Deduplicate reposts and separate owned content, earned mentions, creator content, customer questions, complaints, and spam.
4. Cluster conversations by topic, emotion, purchase stage, and intent. Validate sentiment against the original context; sarcasm defeats naive labels.
5. Separate repeated signals supported across accounts, posts, or platforms from isolated comments and single-post spikes. Compare the current window with an earlier baseline when available.
6. State what was searched but not found; absence in a public sample is not proof that a conversation does not exist.
7. Identify action items for content, community, customer support, creative, landing pages, or product research.

## Output

- Executive summary.
- Coverage, query set, and sample limitations.
- Conversation volume and theme table using sample counts and repeated-versus-isolated labels.
- Sentiment drivers with representative linked examples.
- Top questions, objections, praise, complaints, creator signals, and competitor mentions.
- Emerging risks and opportunities.
- Prioritized actions with owner type and urgency.

Never call a public social sample representative of all customers. Do not infer sensitive personal traits.
