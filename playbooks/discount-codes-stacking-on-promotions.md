---
slug: discount-codes-stacking-on-promotions
id: stacking
kind: leak
outcome: keep
start: false
title: Codes stacking on top of a promo
seo_title: Discount codes stacking on promos? Check with Claude
meta_description: >-
  Find Shopify orders where a discount code stacked on an automatic discount or bundle, see the
  extra discount cost, and decide what to turn off.
hook: Your 'buy 2 get 1' might be getting a second discount on top.
answer: >-
  Codes can stack on top of an automatic discount or bundle offer when Shopify's combination
  settings allow it, giving away margin twice. Connect Shopify to Claude and ask it to find 90 days
  of orders with a code on top of a promo, the extra discount cost, and which codes stack most. Then
  turn off stacking for those codes.
tools:
  - shopify
ask: >-
  Find orders in the last 90 days that used a discount code on top of an automatic discount or
  bundle offer. How many orders, and how much extra discount did that cost? Which codes stack most
  often?
then: Turn off stacking for those codes, on a set date and outside a big sale, then compare.
steps:
  - >-
    Connect Shopify read-only, through a Claude connector or MCP server if available, or upload a
    90-day order export with discount columns.
  - Run the prompt to find orders where a code stacked on an automatic discount or bundle.
  - Ask which combinations were meant to be allowed, such as staff codes.
  - >-
    Turn off stacking for the unplanned codes on a set date, outside a big sale, then compare
    results.
  - Re-run the check monthly.
example: A returning-customer code stacked on the bundle deal. About $900 a month in extra discount.
check: >-
  Some stacking is planned (for example staff codes). Ask which combinations were meant to be
  allowed.
cadence: Monthly
faq:
  - q: Can Shopify discount codes stack with automatic discounts?
    a: >-
      Yes, if the discount's combination settings allow it. Each code and automatic discount has its
      own settings, so one loose setting can let a code stack on every promo.
  - q: How much does stacking cost?
    a: >-
      It depends on your codes and order volume. The prompt adds up the extra discount from stacked
      orders, for example a monthly total, so you see your own number.
  - q: Will this work with ChatGPT?
    a: >-
      Yes. Upload your Shopify order export or connect your store to any assistant that can read it,
      and the same prompt applies. ChatGPT, Grok and Muse can all work through it.
  - q: Should I turn off stacking during a sale?
    a: >-
      Better not. Change it on a quiet date so you can compare before and after without a big sale
      muddying the numbers. A clean test date gives you a fair read on what stacking costs.
related:
  - shopify-discount-code-stopped-working
  - creator-discount-code-on-coupon-sites
  - do-deep-first-discounts-hurt-repeat-rate
updated: "2026-11-06"
---
