---
slug: back-in-stock-emails-not-sending
id: back-in-stock
kind: leak
outcome: more
start: false
title: Back-in-stock demand left waiting
seo_title: Back-in-stock emails not sending? Check with Claude
meta_description: >-
  Match Klaviyo back-in-stock requests to products that are in stock again in Shopify, and see who
  is still waiting for an email.
hook: 210 people asked to hear when it's back. It's back. Nobody told them.
answer: >-
  Back-in-stock requests go unanswered when the flow is off, in draft, or not tied to restocked
  items. Connect Klaviyo and Shopify to Claude and ask it to match every request to products now in
  stock, count waiting shoppers per product, and confirm whether they were emailed. Send the emails
  now and make the flow live.
tools:
  - klaviyo
  - shopify
ask: >-
  List every back-in-stock request in Klaviyo for products that are now in stock in Shopify. How
  many people are waiting per product, and has anyone been emailed?
then: Send the back-in-stock emails now and make sure the flow is live.
steps:
  - >-
    Connect Klaviyo and Shopify to Claude read-only, through a connector or MCP server if available,
    or upload a back-in-stock request export and a Shopify inventory report.
  - Run the prompt so Claude lists waiting shoppers for each product that is now in stock.
  - Confirm in Klaviyo whether each group was emailed. There is no gray area here.
  - >-
    Send the back-in-stock emails now, and check the flow is live and triggered by inventory
    changes.
  - Re-run weekly, and after every restock.
example: 210 people waited on a size that had been back for a week.
check: None. Either they were emailed or they weren't.
cadence: Weekly
faq:
  - q: Why didn't my back-in-stock flow send?
    a: >-
      Common causes are a flow left in draft or turned off, a trigger not linked to inventory
      updates, or a variant restocked under a new listing. Checking requests against live stock
      shows which one applies.
  - q: How fast should I email after a restock?
    a: >-
      As soon as stock is live. People who asked to be told are among your warmest shoppers, and the
      item can sell out again before they hear about it.
  - q: Can I use ChatGPT or Grok for this?
    a: >-
      Yes. The prompt works with any assistant that can read your Klaviyo requests and Shopify
      inventory, through a connection or exported files. ChatGPT, Grok and Muse all work this way.
  - q: What if I have more requests than stock?
    a: >-
      Email the people who asked first, or send in batches as stock allows. Telling everyone at once
      can lead to disappointed shoppers or oversold orders if inventory is tight.
related:
  - klaviyo-flow-stopped-sending
  - klaviyo-missing-email-flows
  - ads-running-on-sold-out-products
  - decide-what-to-restock-from-past-stockouts
updated: "2026-11-06"
---
