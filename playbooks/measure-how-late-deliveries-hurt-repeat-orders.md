---
slug: measure-how-late-deliveries-hurt-repeat-orders
id: late-delivery
kind: play
outcome: more
start: false
title: Price the cost of late deliveries
seo_title: Measure how late deliveries hurt repeat orders
meta_description: >-
  Compare second-order rates for first orders delivered on time versus late, and use the gap to
  weigh the cost of faster shipping.
hook: A first order that arrives late may cost you the second one.
answer: >-
  A first order that arrives late may cost you the second order. Connect Shopify and ask Claude to
  split first-time orders from the last 12 months into on time and three or more days late, then
  compare the share of each group that ordered again within 90 days. Use any gap to weigh the cost
  of faster shipping.
tools:
  - shopify
ask: >-
  For first-time orders in the last 12 months, compare the time from order to delivery. Split them
  into on time and 3+ days late. What share of each group placed a second order within 90 days?
then: If late orders repeat much less, that's the cost to set against faster shipping.
steps:
  - >-
    Connect Shopify read-only through a Claude connector or MCP server, or export orders with
    fulfillment and delivery dates as a CSV and upload it.
  - Ask the playbook prompt to compare 90-day repeat rates for on-time and late first orders.
  - >-
    Check that late orders are not mostly from one region or product, which would skew the
    comparison.
  - Use the gap to price faster shipping or a better carrier, and test it on a set date.
  - Compare repeat rates before and after the change, and re-run twice a year.
example: Late first orders repeated at 14%. On-time ones at 22%.
check: >-
  Carrier delays are close to random, which makes this a fair comparison. Check that late orders
  weren't mostly from one region.
cadence: Twice a year
faq:
  - q: Why do late first orders matter so much?
    a: >-
      The first order sets the customer's view of your store. A late delivery can make them less
      likely to try you again, even if the product was fine.
  - q: Is this a fair comparison?
    a: >-
      Mostly, because carrier delays are close to random. Still check that late orders were not
      mostly from one region, product or sale period, since those can differ in repeat rate for
      other reasons.
  - q: Does Shopify track delivery dates?
    a: >-
      Shopify records fulfillment, and many carriers send delivery status back through tracking. If
      delivery dates are missing, use the shipping app or carrier export instead.
  - q: Can I run this in another assistant?
    a: >-
      Yes. ChatGPT, Grok, Muse or any assistant that can read your order and delivery data can run
      it, through a connection or from an export file.
related:
  - shopify-orders-not-shipped
  - ask-lapsed-customers-why-they-never-returned
  - find-regions-buying-below-population-share
updated: "2026-11-06"
---
