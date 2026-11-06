---
slug: meta-pixel-not-tracking-purchases
id: tracking-stopped
kind: leak
outcome: stop
start: true
title: Purchases stopped recording in your ad account
seo_title: Meta not tracking purchases? Check it against Shopify
meta_description: >-
  Compare Meta purchases with Shopify orders day by day to see when tracking broke, how long it has
  been down, and what to check first.
hook: Your ads can look like they stopped working when really your tracking did.
answer: >-
  When Meta suddenly shows few or zero purchases while Shopify still has orders, tracking usually
  broke, not the ads. Connect Meta Ads and Shopify to Claude and ask it to compare daily purchases
  with daily orders for 30 days. A sudden change in the ratio shows the start date. Then check the
  pixel and the Shopify channel connection.
tools:
  - meta
  - shopify
ask: >-
  For each of the last 30 days, compare the purchases Meta recorded with the orders Shopify
  recorded. Work out the usual ratio. Flag any day where Meta recorded zero purchases while Shopify
  had orders, and any day the ratio moved more than 30% away from normal. Tell me when it started.
then: >-
  If purchases dropped to zero, check the pixel and the Shopify channel connection right away: Meta
  is now bidding blind.
steps:
  - >-
    Connect Meta Ads and Shopify read-only, through a Claude connector or MCP server if available,
    or upload daily purchase and order exports.
  - Run the prompt to compare Meta purchases with Shopify orders for each of the last 30 days.
  - >-
    Remember Meta always counts fewer orders than Shopify; look for a sudden ratio change, not the
    normal gap.
  - >-
    If purchases dropped to zero, check the pixel and the Shopify sales channel connection right
    away.
  - Ask Claude to re-run the comparison every day.
example: Meta recorded 0 purchases for 4 days while $3,000 was spent. Shopify had 140 orders.
check: >-
  Meta only counts orders it can link to an ad, so it is always below Shopify. Look for a sudden
  change in the ratio, not the gap itself.
cadence: Daily
faq:
  - q: Why is Meta showing zero purchases when I have orders?
    a: >-
      Usually the pixel or the Shopify connection to Meta stopped sending purchase events. A theme
      change, app update or expired channel connection can cause it. Meta then bids without sales
      data.
  - q: Is it normal for Meta to show fewer sales than Shopify?
    a: >-
      Yes. Meta only counts orders it can link to an ad, so its number is always lower. What matters
      is a sudden change in the ratio between the two, which points to a tracking break.
  - q: Can I run this with Grok or ChatGPT instead of Claude?
    a: >-
      You can. Any assistant that can read your daily Meta purchases and Shopify orders, either
      connected or from exported files, can follow the same prompt and spot the change.
  - q: How fast should I fix broken tracking?
    a: >-
      Right away. While purchases are not recorded, Meta's bidding has no sales signal, so spend can
      drift toward people who do not buy. Every day you wait adds spend.
related:
  - meta-counting-purchases-twice
  - ad-sets-spending-with-no-sales
  - ads-optimizing-for-wrong-conversion
updated: "2026-11-06"
---
