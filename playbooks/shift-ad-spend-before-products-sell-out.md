---
slug: shift-ad-spend-before-products-sell-out
id: stock-aware-spend
kind: play
outcome: keep
start: true
title: Shift spend before your hero product sells out
seo_title: Move ad spend before products sell out, using Claude
meta_description: >-
  Project which top products sell out before your peak at last year's pace, see the ad spend on
  each, and move budget to stock that lasts.
hook: Spending hard on a product that'll sell out before Black Friday is paying to run out early.
answer: >-
  Spending hard on a product that will sell out before peak season pays to run out early. Connect
  Shopify, Meta Ads and Google Ads to Claude and ask it to project stock for your top ten products
  at last year's peak pace, show spend on each, and suggest where to move budget. Reorder the
  products that won't last.
tools:
  - shopify
  - meta
  - google
ask: >-
  For my top 10 products, take current stock and the sales rate over the last 14 days. At last
  year's peak-season pace, which products sell out before [date]? For each, show how much ad spend
  points at it. Suggest which products to move spend toward.
then: Move spend toward products with stock to last the peak. Order more of the ones that won't.
steps:
  - >-
    Connect Shopify, Meta Ads and Google Ads to Claude read-only, through connectors or MCP servers
    if available, or upload inventory, sales and ad spend exports.
  - Run the prompt with your peak date so Claude projects which top products sell out first.
  - >-
    Use last year's peak-week pace, not this month's average. Peak weeks can run several times
    normal orders.
  - Move spend toward products with enough stock, and place reorders for the ones that won't last.
  - Re-run weekly in the run-up to a peak.
example: 3 top sellers would sell out by 20 Nov at last year's Black Friday pace.
check: Peak weeks can run 3 to 4 times normal orders. Use last year's peak, not this month's average.
cadence: Weekly before a peak
faq:
  - q: Why use last year's peak pace instead of current sales?
    a: >-
      Peak weeks can run three to four times normal orders. A forecast built on this month's average
      can say you have plenty of stock when you may sell out within days of the peak starting.
  - q: What if this product didn't exist last peak season?
    a: >-
      Use a similar product's peak pace, or apply your store-wide peak lift to the product's current
      sales rate. Treat the result as a rough range, not an exact date.
  - q: Will the same prompt work in ChatGPT?
    a: >-
      Yes. ChatGPT, Grok, Muse or any assistant that can read your Shopify inventory and ad spend,
      live or from uploaded files, can run it and give the same projection.
  - q: Should I stop ads on products that will sell out?
    a: >-
      Not always. Lower spend so stock lasts through the peak, and keep some coverage if a reorder
      will arrive in time. The goal is to have stock on the days that matter most.
related:
  - bestsellers-missing-from-meta-ads
  - ads-running-on-sold-out-products
  - decide-what-to-restock-from-past-stockouts
  - when-to-reorder-new-product-launch
updated: "2026-11-06"
---
