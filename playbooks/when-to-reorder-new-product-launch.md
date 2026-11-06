---
slug: when-to-reorder-new-product-launch
id: early-read
kind: play
outcome: get
start: false
title: Read early sales on a new drop and reorder fast
seo_title: "When to reorder a new product: read early sales with Claude"
meta_description: >-
  Compare daily sales on new products with plan, adjusted for stock-outs and discounts, and see
  which to reorder now and which to stop pushing.
hook: Ten days of sales tell you whether to reorder, if you adjust for stock and price.
answer: >-
  Early sales on a new product can tell you whether to reorder within about ten days, if you adjust
  for stock-outs and discounts. Connect Shopify to Claude and ask it to compare sales per day with
  plan for products launched in the last 30 days. Judge on days 4 to 10, then reorder strong
  sellers.
tools:
  - shopify
ask: >-
  For products launched in the last 30 days, compare sales per day with what I planned. Adjust for
  days out of stock and any discount. Which are running well above or below plan? Which should I
  reorder now?
then: Reorder the strong ones before they sell out. Stop pushing the weak ones.
steps:
  - >-
    Connect Shopify to Claude read-only, through a connector or MCP server if available, or upload
    daily sales and inventory for recent launches with your sales plan.
  - >-
    Run the prompt so Claude compares sales per day with plan, adjusted for days out of stock and
    discounts.
  - Ignore the first three days. Your email list inflates launch-week sales, so read days 4 to 10.
  - Reorder products running well above plan, and stop pushing those well below it.
  - Re-run weekly for every new launch.
example: After 10 days, a new colour was running at 2.3 times plan.
check: Launch-week sales are inflated by your email list. Look at days 4 to 10.
cadence: Weekly
faq:
  - q: Why skip the first few days of a launch?
    a: >-
      Launch-week sales are inflated by your email list and most loyal buyers. Days 4 to 10 show
      demand from everyone else, which is closer to what the product will sell over time.
  - q: How do stock-outs affect the read?
    a: >-
      A product that sold out for three days looks weaker than it is. Claude divides sales by the
      days it was actually in stock, so the rate reflects real demand rather than empty shelves.
  - q: Can ChatGPT or Muse run this?
    a: >-
      Yes. The prompt works with any assistant that can read your Shopify sales and inventory,
      including ChatGPT, Grok and Muse, through a connection or an uploaded export.
  - q: What if I didn't set a sales plan?
    a: >-
      Compare with a similar past launch over the same days instead. That still shows whether the
      new product is running ahead of or behind what you would normally expect.
related:
  - decide-what-to-restock-from-past-stockouts
  - shift-ad-spend-before-products-sell-out
  - email-past-buyers-about-launches-restocks
updated: "2026-11-06"
---
