---
slug: find-regions-buying-below-population-share
id: regions
kind: play
outcome: get
start: false
title: Find regions buying below their share
seo_title: Find regions that buy below their population share
meta_description: >-
  Compare each state's share of your orders with its share of population, check Meta delivery there,
  and test regional ads on a cap.
hook: Some big states may buy far less from you than their population says they should.
answer: >-
  Some large states or regions may buy far less from you than their population suggests. Connect
  Shopify and Meta Ads, ask Claude to compare each region's share of orders with its share of
  population, and check whether your ads reach those regions. Fix delivery gaps first, then test a
  regional angle on a capped budget.
tools:
  - shopify
  - meta
ask: >-
  Break down my Shopify orders for the last 12 months by state (or region). Compare each one's share
  of orders with its share of the population. Then check Meta delivery by region. Which large
  regions buy well below their share, and are my ads even reaching them?
then: Fix delivery first. Then test a regional angle on a capped budget.
steps:
  - >-
    Connect Shopify and Meta Ads read-only through a Claude connector or MCP server, or export
    orders by region and ad delivery reports and upload them.
  - >-
    Ask the playbook prompt to compare order share with population share by region and check ad
    delivery.
  - Check shipping times and weather first. They explain some gaps and spending will not fix them.
  - Fix delivery gaps, then test a regional angle on a capped budget with a review date.
  - >-
    Compare orders from that region with last year or with a similar region you left alone, and
    re-run twice a year.
example: Three large states bought well below their population share.
check: Shipping time and weather explain some gaps. Check those before spending.
cadence: Twice a year
faq:
  - q: Why would a big state buy less than expected?
    a: >-
      Common reasons are slow or costly shipping, weather or season, local competitors, or ads that
      rarely reach that region. The data shows the gap. Checking these reasons tells you whether it
      can be fixed.
  - q: Where do I get population data?
    a: >-
      Public census figures by state or region work fine. Claude can look them up with web search or
      you can supply a table. You only need shares, not exact counts.
  - q: How do I measure a regional test?
    a: >-
      Compare orders from the tested region with the same period last year, or with a similar region
      you did not change. That gives a fair baseline instead of claiming the whole lift.
  - q: Will this work with other assistants?
    a: >-
      Yes. Any assistant that can read your orders and ad delivery data, including ChatGPT, Grok or
      Muse, can run this prompt from a connection or exported files.
related:
  - ads-showing-in-countries-you-dont-ship
  - measure-how-late-deliveries-hurt-repeat-orders
  - ads-optimizing-for-wrong-conversion
updated: "2026-11-06"
---
