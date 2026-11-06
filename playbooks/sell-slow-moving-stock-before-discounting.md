---
slug: sell-slow-moving-stock-before-discounting
id: slow-stock
kind: play
outcome: keep
start: false
title: Sell slow stock to likely buyers before discounting
seo_title: Sell slow stock to past buyers before discounting
meta_description: >-
  Find products with months of excess stock, match them to past buyers of the same style, and email
  that group before any markdown.
hook: Before you mark down slow stock, email the people who bought that style before.
answer: >-
  Before marking down slow stock, tell the people who bought that style before. Connect Shopify and
  Klaviyo, ask Claude to list products with more than six months of stock and the cash tied up, and
  find subscribed past buyers of the same style, color or category. Email that narrow group first,
  then discount only what is left.
tools:
  - shopify
  - klaviyo
ask: >-
  List products with more than 6 months of stock at the current sales rate, with the cash tied up in
  each. For each, find past customers who bought the same style, colour or category, and how many
  are still subscribed.
then: Email that narrow group first, at full price or a small offer. Discount only what's left.
steps:
  - >-
    Connect Shopify and Klaviyo read-only through a Claude connector or MCP server, or export
    inventory, orders and subscriber lists and upload them.
  - >-
    Ask the playbook prompt to list slow stock with cash tied up and the subscribed past buyers who
    match each product.
  - >-
    Check stock counts are current and that the products are not slow because of a fault or bad
    reviews.
  - Email the narrow segment first at full price or a small offer, holding back a slice to compare.
  - Count orders against the held-back slice, discount only what remains, and re-run each quarter.
example: $40K sat in slow colours. A few thousand past buyers of that colour family had never been told.
check: Send to a narrow segment first, and count orders against a held-back slice.
cadence: Quarterly
faq:
  - q: How do I know which stock is slow?
    a: >-
      Divide units on hand by your recent sales rate. If it would take more than six months to sell
      at that pace, it is slow. Claude can do this per product from your inventory and orders.
  - q: Why email past buyers before discounting?
    a: >-
      People who bought the same style or color already like it, so some will buy at full price. A
      markdown gives that margin away to everyone, including buyers who would have paid more.
  - q: How do I measure whether the email worked?
    a: >-
      Hold back a random slice of the matched segment. Compare orders from those who got the email
      with those who did not over the same days.
  - q: Can I use this prompt with Muse or ChatGPT?
    a: >-
      Yes. Any assistant that can read your inventory, orders and email lists can run it, either
      connected to the tools or from files you export.
related:
  - lapsed-customers-no-win-back-email
  - back-in-stock-emails-not-sending
  - shift-ad-spend-before-products-sell-out
updated: "2026-11-06"
---
