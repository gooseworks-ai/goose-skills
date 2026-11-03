---
campaign: <slug>
product_ids: <list>
version: <int>
updated_at: <date>
based_on: <string>
---
<!--
ads/campaigns/<slug>/strategy.md — what this campaign is trying to do and why. Written by the
strategy skill at launch and revised at each deep check. Reasoning is part of the file: a
decision without its "because" is not finished.

campaign     The folder slug.
product_ids  Catalog product ids this campaign advertises, e.g. [prod_123]. Reference, never
             copy, the product description.
version      Starts at 1; +1 each time the strategy changes. The change is also a
             decisions.md entry.
updated_at   Date of the last write (YYYY-MM-DD).
based_on     What this version rests on: "intake 2026-09-24", "deep check 2026-10-01".

Plan numbers here (budget, ad count, test length) are Goose's decisions and are written plainly.
Anything measured goes on an `- Observed:` line with its window and sync time.
-->

# Strategy — <campaign name>

## Goal
<!-- The business outcome in the user's words (trials, purchases, demo calls). -->

## Audience
<!-- Who the ads are for and how Goose will reach them (broad, interests, lookalike). -->

## Objective and placements
<!-- Meta objective and placement mix, each with the reason. -->

## Budget
<!-- Daily or lifetime amount, split across ad sets, and the approved ceiling. -->

## Creative plan
<!-- Ads needed, the angles and formats for diversity, and the 3x rule: generate three times
the count so the judge loop and the user can choose. -->

## Test frame
<!-- What is being compared, for how long, and the minimum evidence before judging. -->

## Success metric
<!-- The one number that says it worked, and the threshold. -->

## Reasoning
<!-- Why this plan over the obvious alternatives, and what would change it. -->
