---
name: comment-mining
description: Mine comments on social posts and ads for recurring customer language, questions, objections, desired outcomes, purchase signals, and creative opportunities. Use for voice-of-customer research grounded in linked source evidence.
---

# Comment Mining

Turn public comment threads into evidence a growth team can use.

## Inputs

- Brand/product and research question.
- Post, reel, video, or ad URLs; or creators/competitors to sample.
- Target market, platforms, time window, and desired sample size.

## Workflow

1. Use `scrapecreators-api` to collect comments and post context. Sample across multiple posts and creators instead of overfitting to one viral thread.
2. Remove obvious spam, duplicate comments, tag-only replies, and giveaways unless they are the subject of the study.
3. Code each useful comment into one or more buckets: pain, desired outcome, objection, question, comparison, use case, purchase intent, delight, complaint, or exact product language.
4. Cluster semantically similar statements while preserving representative source links.
5. Report prevalence as sample counts, not market-wide percentages.
6. Convert the strongest clusters into testable messages, hooks, FAQ topics, product questions, or research follow-ups.

## Output

- Coverage and sampling method.
- Ranked theme table with count, representative language, source links, and confidence.
- Objection and question bank.
- Purchase and churn signals.
- Recommended next tests for creative, landing pages, content, or product research.
- Limitations and gaps.

Never expose private information, infer sensitive traits, or claim the sample represents all customers.
