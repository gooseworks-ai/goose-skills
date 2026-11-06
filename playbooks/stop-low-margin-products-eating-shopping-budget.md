---
slug: stop-low-margin-products-eating-shopping-budget
id: margin-shopping
kind: play
outcome: keep
start: false
title: Stop low-margin products eating Shopping spend
seo_title: Stop low-margin products eating Google Shopping spend
meta_description: >-
  Work out margin per product from Shopify costs, compare it with Google Shopping spend, and bid
  less on thin-margin products.
hook: Your lowest-margin products may be taking the biggest share of your Shopping budget.
answer: >-
  Low-margin products can take a large share of your Google Shopping budget. Connect Shopify, Google
  Ads and Merchant Center, ask Claude to work out margin per product after cost and shipping and
  compare it with each product's share of Shopping spend. Label products by margin in your feed and
  bid less on the thin ones.
tools:
  - shopify
  - google
  - merchant
ask: >-
  Using product cost in Shopify, work out the margin on each product after cost and shipping. Then
  show each product's share of Google Shopping spend for the last 90 days. Flag products with under
  15% margin that take a large share of spend.
then: Label products by margin in your feed and bid less on the thin ones.
steps:
  - >-
    Connect Shopify, Google Ads and Merchant Center read-only through a Claude connector or MCP
    server, or export product costs and Shopping reports and upload them.
  - >-
    Ask the playbook prompt to work out margin per product and flag thin-margin products taking a
    large share of spend.
  - >-
    Check that product cost is filled in correctly in Shopify. Missing costs make the result
    guesswork.
  - >-
    Add a margin label in your feed and lower bids on thin-margin products in steps, with a review
    date.
  - >-
    Compare Shopping spend share and profit after the change with the prior period, and re-run each
    quarter.
example: 22 products under 15% margin took 30% of Shopping spend.
check: Product cost must be filled in correctly in Shopify, or this is guesswork.
cadence: Quarterly
faq:
  - q: How do I label products by margin in Merchant Center?
    a: >-
      Use a custom label field in your product feed, for example high, mid and low margin. You can
      then split Shopping or Performance Max campaigns by that label and set different targets.
  - q: What if my product costs are not in Shopify?
    a: >-
      Fill them in first, or supply a cost sheet. Without real costs, the margin math is a guess and
      may push budget the wrong way.
  - q: Should I stop advertising low-margin products?
    a: >-
      Not always. Some bring in new customers who go on to buy more later. Lower bids first and
      watch total profit, not just Shopping return, before cutting further.
  - q: Can ChatGPT or Grok run the same analysis?
    a: >-
      Yes. Any assistant that can read your product costs and Shopping spend can run this prompt,
      either through a connection or from exported product and campaign reports.
related:
  - measure-roas-after-returns-and-refunds
  - products-disapproved-google-merchant-center
  - google-ads-search-terms-not-converting
updated: "2026-11-06"
---
