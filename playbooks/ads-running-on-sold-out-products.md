---
slug: ads-running-on-sold-out-products
id: sold-out-ads
kind: leak
outcome: stop
start: true
title: Ads still running on sold-out products
seo_title: Ads running on sold-out products? Find them with Claude
meta_description: >-
  Find Meta and Google ads still sending shoppers to sold-out Shopify products, see the wasted
  spend, and pause them before more budget goes.
hook: You are probably paying Meta to send people to a product they can't buy.
answer: >-
  Ads keep spending after a product sells out because Meta and Google do not check your Shopify
  stock. Connect Meta Ads, Google Ads and Shopify to Claude, ask it to match every ad that spent in
  the last 7 days to its product's stock, and pause the ads pointing at sold-out items. Turn them
  back on after restock.
tools:
  - meta
  - google
  - shopify
ask: >-
  List every ad that spent money in the last 7 days in Meta and Google. For each one, follow its
  link to the product in Shopify and check stock across every variant. Show me the ads pointing at
  products that are sold out, or that will sell out within 7 days at the current sales rate. For
  each, give the spend since it went out of stock.
then: >-
  Pause those ads. Turn them back on when the product is restocked. Ask Claude to re-run this every
  morning.
steps:
  - >-
    Connect Meta Ads, Google Ads and Shopify read-only, through a Claude connector or MCP server if
    you use one, or upload ad and inventory CSV exports.
  - >-
    Run the prompt to match each ad that spent in the last 7 days to its product's stock across
    every variant.
  - >-
    Check for pre-order products before acting; they may still sell, so only pause those whose cost
    per sale has clearly risen.
  - >-
    Pause the ads on sold-out or nearly sold-out products and note them so you can restart them
    after restock.
  - Ask Claude to re-run the check every morning.
example: 6 ads were still pointing at a sold-out bestseller. $1,400 spent in 5 days, 2 orders.
check: >-
  If the product takes pre-orders, it may still sell. Only pause when cost per sale has clearly
  risen.
cadence: Daily
faq:
  - q: Why do my ads keep running when a product is out of stock?
    a: >-
      Ad platforms do not read your store's inventory by default. An ad keeps its budget and keeps
      sending clicks to the product page until someone pauses it, even when every variant shows sold
      out.
  - q: Does this work with ChatGPT or other assistants?
    a: >-
      Yes. The prompt works in any assistant that can read your ad and Shopify data, whether through
      a live connection or exported CSV files. ChatGPT, Grok or Muse can run the same match if you
      give them the same reports.
  - q: Is it safe to give Claude access to my ad account?
    a: >-
      Use read-only access. Claude only needs to see ads, spend and links to find the problem. You
      pause the ads yourself, so nothing changes in your account unless you change it.
  - q: What about products that are only low on stock?
    a: >-
      The prompt also flags products likely to sell out within 7 days at the current sales rate.
      That gives you time to cut budget or restock before the ad starts wasting money.
related:
  - shift-ad-spend-before-products-sell-out
  - back-in-stock-emails-not-sending
  - decide-what-to-restock-from-past-stockouts
  - bestsellers-missing-from-meta-ads
updated: "2026-11-06"
---
