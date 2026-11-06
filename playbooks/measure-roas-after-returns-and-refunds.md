---
slug: measure-roas-after-returns-and-refunds
id: return-adjusted
kind: play
outcome: keep
start: false
title: Judge ads on sales after returns
seo_title: Measure ROAS after returns and refunds
meta_description: >-
  Work out return on ad spend per category before and after refunds, and find categories that look
  good until returns come back.
hook: A category with great ROAS can lose once you count what comes back.
answer: >-
  A category with strong return on ad spend can lose money once refunds are counted. Connect
  Shopify, Meta Ads and Google Ads, ask Claude for revenue, refund rate and ad spend by category
  over six months, and compare ROAS before and after refunds. Lower spend on high-return categories
  and fix the reason for returns, often sizing.
tools:
  - shopify
  - meta
  - google
ask: >-
  For each product category, show revenue, refund rate and ad spend for the last 6 months. Work out
  return on ad spend before and after refunds. Which categories look good before returns and bad
  after?
then: Lower bids or spend on high-return categories. Fix the reason for returns (often sizing).
steps:
  - >-
    Connect Shopify, Meta Ads and Google Ads read-only through a Claude connector or MCP server, or
    export orders, refunds and ad spend and upload them.
  - Ask the playbook prompt to compare ROAS before and after refunds for each product category.
  - Use orders at least 45 days old so refunds have time to come in.
  - >-
    Lower bids or spend on high-return categories in steps, and set a review date. Look into the
    main return reason.
  - Compare net ROAS after the change with the prior period, and re-run each quarter.
example: One category showed 3.1x ROAS, but 34% came back. Net of returns, a 2.4x category won.
check: Give refunds time to come in. Use orders at least 45 days old.
cadence: Quarterly
faq:
  - q: What is return-adjusted ROAS?
    a: >-
      It is return on ad spend after you subtract refunded revenue. Ad platforms usually count the
      sale when it happens and never see the return, so their ROAS can look better than what you
      keep.
  - q: Why use orders at least 45 days old?
    a: >-
      Returns arrive weeks after the order. If you include recent orders, many refunds have not
      happened yet, and every category looks better than it really is.
  - q: Should I stop advertising high-return categories?
    a: >-
      Not straight away. First lower spend in steps and fix the cause of returns, such as unclear
      sizing. If net ROAS stays weak after that, cut further.
  - q: Do I need Claude for this, or will any assistant work?
    a: >-
      Any assistant that can read your order, refund and ad spend data will work, including ChatGPT,
      Grok or Muse, from a connection or exported reports.
related:
  - stop-low-margin-products-eating-shopping-budget
  - meta-counting-purchases-twice
  - ad-sets-spending-with-no-sales
updated: "2026-11-06"
---
