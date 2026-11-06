---
slug: set-free-shipping-threshold-from-order-data
id: shipping-threshold
kind: play
outcome: convert
start: false
title: Set your free-shipping threshold from your real orders
seo_title: Set your free-shipping threshold from real order data
meta_description: >-
  Use 90 days of Shopify orders to see where order values cluster and set a free-shipping threshold
  that nudges more orders up.
hook: If most orders are $62 and free shipping starts at $100, almost nobody reaches it.
answer: >-
  If your free-shipping threshold sits well above your typical order, few shoppers reach it. Connect
  Shopify, ask Claude for the spread of order values over 90 days and the share of orders just below
  the threshold, then pick one that nudges those orders up. Change it on a set date and compare
  order value, shipping cost and margin.
tools:
  - shopify
ask: >-
  Show the spread of my order values for the last 90 days. Where is the free-shipping threshold, and
  what share of orders sit within $10 below it? Suggest a threshold that would nudge the most orders
  up without giving free shipping to orders that already qualify.
then: Change it on a set date and compare average order value and shipping cost before and after.
steps:
  - >-
    Connect Shopify read-only through a Claude connector or MCP server, or export 90 days of orders
    as a CSV and upload it.
  - >-
    Ask the playbook prompt for the spread of order values and the share of orders sitting just
    below your current threshold.
  - >-
    Check margin, not just order value. Free shipping costs money, so confirm the new threshold
    still pays after shipping.
  - Change the threshold on a set date and note it. Set a review date about 30 days out.
  - >-
    Compare average order value, shipping cost and margin before and after, and re-run the analysis
    each quarter.
example: 38% of orders sat $3 to $9 below the next useful threshold.
check: Read the margin, not just order value. Free shipping costs money.
cadence: Quarterly
faq:
  - q: What is a good free-shipping threshold?
    a: >-
      There is no single right number. A useful threshold sits a little above where many of your
      orders already land, so shoppers can reach it by adding one item. Your own order data shows
      where that is.
  - q: Will lowering the threshold lose money?
    a: >-
      It can. You pay shipping on more orders, and some orders that would have qualified anyway get
      it for free. That is why you should read margin after shipping, not just average order value,
      before and after the change.
  - q: How long should I wait before judging the change?
    a: >-
      Give it a few weeks of normal trading, outside a big sale. Compare the same metrics for a
      similar period before the change. Seasonal swings can look like a result, so also compare with
      the same weeks last year if you can.
  - q: Does this work with ChatGPT, Grok or Muse?
    a: >-
      Yes. Any assistant that can read your Shopify orders can run the same prompt. Connect it if
      the assistant supports that, or export your orders to a CSV file and upload it.
related:
  - show-bundle-offer-on-product-pages
  - do-deep-first-discounts-hurt-repeat-rate
  - mobile-checkout-losing-sales
updated: "2026-11-06"
---
