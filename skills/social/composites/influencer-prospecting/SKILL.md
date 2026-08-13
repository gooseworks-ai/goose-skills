---
name: influencer-prospecting
description: Find and evaluate creators, influencers, affiliates, and UGC partners using audience fit, content fit, authentic product adjacency, engagement quality, public contactability, commerce signals, and brand-safety evidence—not follower count alone.
---

# Influencer Prospecting

Produce a sourced, prioritized creator shortlist that a growth team can actually review and contact.

## Inputs

- Brand, product, target audience, markets, platforms, and campaign objective.
- Exclusions, ideal creator archetypes, follower range, and minimum/maximum shortlist size.

## Workflow

1. Translate the audience and objective into creator search themes, category phrases, hashtags, competitor mentions, and adjacent interests.
2. Use `scrapecreators-api` to discover candidates through creator search, popular-creator lists, profile search, relevant content, competitor mentions, and category keywords. Fetch each profile plus a recent-post sample.
3. Use `audience-research` to evaluate public audience and market-fit signals. Use `creator-profile-teardown`, transcripts, and comments on promising candidates to verify positioning, creative quality, sponsorship style, and audience response.
4. Inspect public link-in-bio pages, business contact paths, creator shops, TikTok Shop showcases, and Amazon Shop pages when relevant. Treat commerce presence as context, not proof of sales.
5. Score each candidate on audience fit, content fit, product adjacency, engagement quality, consistency, creative quality, sponsorship density, contactability, commerce relevance, and brand safety. Show the evidence behind every score.
6. Check for suspicious engagement, unrelated audience spikes, excessive sponsorship density, category conflicts, and recent safety concerns. Mark unknowns rather than guessing.
7. Segment the final list into test now, nurture, and pass. Match the collaboration idea to the objective: UGC production, gifting, affiliate, sponsorship, ambassador, or paid amplification.

## Output

Return a table with creator, platform, profile link, audience and content evidence, recent median metrics, relevant example posts, public shop or link-in-bio signals, fit score, confidence, risks, public contact path, and recommended collaboration angle. End with a pilot cohort, outreach premise, and test design.

Do not scrape private contact data or infer protected attributes. Public business contact details only.
