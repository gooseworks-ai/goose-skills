---
slug: decide-what-to-restock-from-past-stockouts
id: stockout-evidence
kind: play
outcome: keep
start: false
title: Use past stock-outs to decide what to restock
seo_title: Decide what to restock from past stock-outs, with Claude
meta_description: >-
  Look back at every stock-out in the last year, see whether sales moved to similar products or
  vanished, and restock what shoppers won't replace.
hook: Every time a product sold out, you ran a free experiment. Read it.
answer: >-
  Past stock-outs show which products shoppers will replace and which they won't. Connect Shopify to
  Claude and ask it to find every top-product stock-out of three days or more in the last year,
  measure how much demand moved to similar items, and rank products by sales lost per day. Restock
  first where sales vanished.
tools:
  - shopify
ask: >-
  Find every period in the last 12 months where a top product was sold out for 3 days or more. For
  each, how much of its usual sales moved to similar products, and how much simply disappeared? Rank
  products by sales lost per day out of stock.
then: Restock first the products whose sales vanish when they're gone, not those whose buyers switch.
steps:
  - >-
    Connect Shopify to Claude read-only, through a connector or MCP server if available, or upload
    12 months of daily sales by product and inventory history.
  - >-
    Run the prompt so Claude finds each stock-out and measures how much demand moved to similar
    products.
  - >-
    Check that ad spend stayed steady during each stock-out, since a spend change would confuse the
    read.
  - Restock first the products whose sales vanish when they are gone.
  - Re-run before each stock order.
example: >-
  When one colour sold out, 70% of its sales moved to another. A different product's stock-outs lost
  almost everything.
check: Make sure ad spend didn't change during the stock-out. That would confuse the read.
cadence: Before each stock order
faq:
  - q: How do I know if shoppers switched to another product?
    a: >-
      Compare sales of similar products during the stock-out with their usual rate. If they rose by
      about what the missing product normally sold, buyers switched. If not, those sales were lost.
  - q: Why does ad spend matter here?
    a: >-
      If you cut or raised ads during a stock-out, sales of other products move for that reason too.
      Pick periods where spend stayed steady, or note the change so you can read around it.
  - q: Can I do this with an assistant other than Claude?
    a: >-
      Yes. Any assistant that can read your Shopify sales and inventory history, such as ChatGPT,
      Grok or Muse, can run the prompt on a live connection or an exported file.
  - q: What if I don't have stock history?
    a: >-
      Days with zero sales of a normally steady product are a rough stand-in for a stock-out.
      Shopify inventory reports can also show when stock hit zero for each item.
related:
  - shift-ad-spend-before-products-sell-out
  - when-to-reorder-new-product-launch
  - back-in-stock-emails-not-sending
updated: "2026-11-06"
---
