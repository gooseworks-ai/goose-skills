---
name: comment-mining
description: Mine comments and replies on social posts, videos, and ads for recurring customer language, questions, objections, desired outcomes, complaints, product requests, purchase signals, and creative opportunities. Use for voice-of-customer research grounded in linked source evidence.
---

# Comment Mining

Turn public comment threads into evidence a growth team can use.

## Inputs

- Brand/product and research question.
- Post, reel, video, or ad URLs; or creators/competitors to sample.
- Target market, platforms, time window, and desired sample size.

## Workflow

1. Use `scrapecreators-api` to collect post context, top-level comments, and replies from the relevant platforms. Sample across multiple posts and creators instead of overfitting to one viral thread.
2. Preserve parent-and-reply context where it changes meaning. Remove obvious spam, duplicate comments, tag-only replies, and giveaways unless they are the subject of the study.
3. Code each useful comment into one or more buckets: pain, desired outcome, objection, question, comparison, use case, purchase intent, product request, workaround, delight, complaint, churn risk, or exact product language.
4. Mark buying-intent strength separately: curiosity, consideration, price or availability question, comparison, stated purchase, repeat use, and recommendation.
5. Cluster semantically similar statements while retaining representative wording, the post context, and source links.
6. Report prevalence as sample counts by platform and source type, not market-wide percentages.
7. Convert the strongest clusters into testable messages, hooks, FAQ topics, product questions, or research follow-ups.

## Output

- Coverage and sampling method.
- Ranked theme table with top-level and reply counts, representative language, source links, and confidence.
- Objection and question bank.
- Purchase, product-request, workaround, and churn signals.
- Recommended next tests for creative, landing pages, content, or product research.
- Limitations and gaps.

Never expose private information, infer sensitive traits, or claim the sample represents all customers.
