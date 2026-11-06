---
slug: email-past-buyers-about-launches-restocks
id: launch-email
kind: play
outcome: more
start: true
title: Treat every launch and restock as a reason to email past buyers
seo_title: Email past buyers on every launch and restock, with Claude
meta_description: >-
  Compare repeat orders in launch weeks with normal weeks, check whether past buyers heard about
  recent drops, and email them on every launch.
hook: Past buyers buy again in launch weeks. Make sure they hear about every launch.
answer: >-
  Past buyers tend to reorder in launch and restock weeks, but often never hear about the drop.
  Connect Shopify and Klaviyo to Claude and ask it to compare repeat orders in launch weeks with
  normal weeks, then check whether matching past buyers were emailed about the last five drops.
  Email them every time, matched to what they bought.
tools:
  - shopify
  - klaviyo
ask: >-
  Compare repeat orders per week in launch or restock weeks with normal weeks over the last 12
  months. Then list the last 5 launches or restocks and whether past buyers of that size, style or
  category were emailed about each.
then: Email past buyers on every drop, matched to what they bought before.
steps:
  - >-
    Connect Shopify and Klaviyo to Claude read-only, through connectors or MCP servers if available,
    or upload a Shopify orders export and a Klaviyo campaign list.
  - Run the prompt so Claude compares repeat orders in launch weeks with normal weeks.
  - Compare with weeks that had a promo but no launch, so other offers don't explain the lift.
  - Build segments of past buyers by size, style or category, and email them on every drop.
  - Re-run the check after each launch.
example: Repeat orders ran 1.5 to 5 times normal in launch weeks.
check: Launch weeks often include other promos. Compare with weeks that had a promo but no launch.
cadence: Every launch
faq:
  - q: Why email past buyers about launches?
    a: >-
      They already know and trust your products, and a launch gives them a fresh reason to buy. The
      check shows whether your launch weeks actually lift repeat orders for your store.
  - q: How do I match buyers to a launch?
    a: >-
      Use what they bought before: the same size, style or category as the new product or restock.
      Shopify order history holds this, and Klaviyo can build segments from it.
  - q: Does this work with other AI assistants?
    a: >-
      Yes. ChatGPT, Grok, Muse or any assistant that can read your Shopify orders and Klaviyo
      campaigns, live or from exports, can run the same prompt and give the same comparison.
  - q: What if launch weeks also had promos?
    a: >-
      Then the promo may explain the lift. Compare with weeks that had a promo but no launch to
      separate the two effects before you decide how much the launch email matters.
related:
  - when-to-reorder-new-product-launch
  - lapsed-customers-no-win-back-email
  - back-in-stock-emails-not-sending
  - klaviyo-missing-email-flows
updated: "2026-11-06"
---
