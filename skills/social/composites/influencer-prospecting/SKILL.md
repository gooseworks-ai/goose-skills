---
name: influencer-prospecting
description: Find and evaluate creators for a brand using audience fit, content fit, authentic product adjacency, engagement quality, contactability, and brand-safety evidence—not follower count alone.
---

# Influencer Prospecting

Produce a sourced, prioritized creator shortlist that a growth team can actually review and contact.

## Inputs

- Brand, product, target audience, markets, platforms, and campaign objective.
- Exclusions, ideal creator archetypes, follower range, and minimum/maximum shortlist size.

## Workflow

1. Translate the audience and objective into creator search themes, category phrases, hashtags, competitor mentions, and adjacent interests.
2. Use `scrapecreators-api` to discover candidates and fetch each profile plus a recent-post sample.
3. Use transcripts and comments on a small selection of relevant videos to verify how the creator speaks and how the audience responds.
4. Score each candidate on audience fit, content fit, product adjacency, engagement quality, consistency, creative quality, contactability, and brand safety. Show the evidence behind every score.
5. Check for suspicious engagement, unrelated audience spikes, excessive sponsorship density, conflicts, and recent safety concerns. Mark unknowns rather than guessing.
6. Segment the final list into test now, nurture, and pass.

## Output

Return a table with creator, platform, profile link, audience/content evidence, recent median metrics, relevant example posts, fit score, risks, contact path when publicly available, and recommended collaboration angle. End with a pilot cohort and test design.

Do not scrape private contact data or infer protected attributes. Public business contact details only.
