# Planning-only fallback

## Summary

When no safe write adapter is available, still deliver a complete Meta campaign plan. State that nothing was created and identify the exact access needed for a later launch. Do not delete or weaken campaign architecture, audience, copy, budget, tracking, and monitoring guidance just because publishing is unavailable.

## Intake and recommendation

Collect the product/offer and URL, desired business result, Meta objective, budget and duration, geography, audience/ICP, funnel stage, landing page, tracking status, existing creative, competitors, B2B/B2C context, and any special-ad-category implications.

Recommend the objective and explain tradeoffs. Distinguish awareness, traffic, lead generation, sales/conversions, engagement, and app promotion. If the expected conversion volume cannot support optimization, recommend consolidation or an earlier measurable event rather than pretending the learning phase will succeed.

## Plan contents

Produce a skimmable campaign brief containing:

1. **Campaign overview:** objective, budget, dates/timezone, geography, placements, conversion event, tracking assumptions, and success metrics.
2. **Architecture:** campaign → ad sets → ads tree. Separate prospecting, lookalike, and retargeting only when the budget and available first-party data justify them.
3. **Audience strategy:** demographics, broad/interest/custom/lookalike inputs, exclusions, estimated rationale, and data prerequisites. Do not invent available Meta targeting attributes.
4. **Creative and copy matrix:** angle, format/placement, hook, primary text, headline, description, CTA, destination, and the variable each ad tests.
5. **Budget and bidding:** allocation by ad set, budget type, starting strategy, learning-phase constraints, and conditions for changing bids.
6. **Destination and policy review:** rendered-page result, message/claim match, CTA, redirects, tracking, warnings, blocked claims, and special-category handling.
7. **Tracking checklist:** Pixel/Conversions API, events, UTMs, attribution assumptions, custom audiences, and a test-conversion step.
8. **Launch checklist:** exact Ads Manager fields and a requirement to create everything paused for review.
9. **Monitoring plan:** delivery checks in days 1–3, early signal review in days 4–7, conversion-quality review after sufficient data, and explicit stop/scale rules.

## Handoff

Save the brief to `meta-campaign-plan-YYYY-MM-DD.md` when the environment supports files, or provide it inline. End with:

- **Created in Meta:** No
- **Why:** no approved write adapter was available
- **Next access needed:** either GooseWorks launch tools or a Meta token with `ads_management`, the ad-account ID, and Page access
- **Safety:** no write or activation was attempted
