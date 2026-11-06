---
slug: conversion-rate-dropped-on-every-channel
id: funnel-step
kind: leak
outcome: convert
start: false
title: One funnel step suddenly dropped
seo_title: Conversion rate dropped everywhere? Find why with Claude
meta_description: >-
  Track your funnel week by week by channel and device, find the step that fell everywhere at once,
  and pin down the day it changed.
hook: If conversion drops on every channel at once, the problem is your site, not your ads.
answer: >-
  When conversion falls on every channel at once, a site change is the usual cause: a theme update,
  a new app or a checkout edit. Connect Google Analytics and Shopify to Claude, ask for eight weeks
  of funnel steps by channel and device, and find the first day a step fell. Then check what changed
  that day.
tools:
  - ga4
  - shopify
ask: >-
  Show the funnel for the last 8 weeks, week by week: sessions, product views, add to cart, checkout
  started, purchase. Split it by channel and by device. Find any step that fell more than 20% across
  every channel at the same time, and compare with the same weeks last year. Tell me the first day
  it changed.
then: "Look at what changed on the site that day: a theme update, a new app, a checkout change."
steps:
  - >-
    Connect Google Analytics and Shopify to Claude read-only, through a connector or MCP server if
    available, or upload a GA4 funnel export and a Shopify orders report.
  - >-
    Run the prompt so Claude builds the weekly funnel by channel and device and compares it with
    last year.
  - Rule out bot traffic with the junk-traffic playbook, and rule out normal seasonal dips.
  - >-
    List every site change made on the day the step fell: theme updates, new apps, checkout
    settings.
  - Undo or fix that change, then watch the funnel step for the next week.
  - Re-run weekly so a drop is caught within days.
example: Add-to-cart to checkout fell 30% on every channel from the same day an app was installed.
check: >-
  Rule out bot traffic first (see the junk-traffic playbook) and seasonality (compare with last
  year).
cadence: Weekly
faq:
  - q: How do I know the problem is my site and not my ads?
    a: >-
      Check whether the drop shows on every channel at the same time. An ads problem usually hits
      one channel. A drop across paid, email and organic together points to something on the site
      itself.
  - q: What counts as a big enough drop?
    a: >-
      The playbook flags any step that fell more than 20% across every channel at once. Treat that
      as a starting threshold, not a rule, and adjust it to how much your numbers normally move week
      to week.
  - q: Can I use a different assistant than Claude?
    a: >-
      Yes. ChatGPT, Grok, Muse or any assistant that can read your Google Analytics and Shopify data
      will work with the same prompt, whether connected live or given exported reports.
  - q: What are the most common causes?
    a: >-
      A theme update, a newly installed app, a change to checkout or shipping settings, or a broken
      script. Matching the first day of the drop to your list of recent changes usually finds the
      cause.
related:
  - bot-traffic-skewing-conversion-rate
  - mobile-checkout-losing-sales
  - meta-pixel-not-tracking-purchases
  - landing-page-slow-on-mobile
updated: "2026-11-06"
---
