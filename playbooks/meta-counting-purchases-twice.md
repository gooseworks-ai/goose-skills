---
slug: meta-counting-purchases-twice
id: double-count
kind: leak
outcome: stop
start: false
title: Purchases counted twice
seo_title: Meta counting purchases twice? Check ROAS with Claude
meta_description: >-
  Find out whether Meta counts each order twice by comparing its purchases with Shopify orders, and
  learn which duplicate event to remove.
hook: If your ROAS looks too good to be true, check whether each order counts twice.
answer: >-
  If Meta records more purchases than Shopify has orders, the purchase event is likely firing twice,
  often from two pixels or two apps on the thank-you page. Connect Meta Ads and Shopify to Claude,
  ask it to list days where Meta's count beats Shopify's, and check $0, replacement and renewal
  orders. Then remove the duplicate event.
tools:
  - meta
  - shopify
ask: >-
  Compare Meta's recorded purchases with Shopify orders for the last 30 days. If Meta records more
  purchases than Shopify has orders on any day, list those days. Then check whether $0 orders,
  replacement orders or subscription renewals are firing purchase events.
then: >-
  Fix the duplicate event (usually two pixels or two apps firing Purchase on the thank-you page).
  Your real cost per sale is higher than you think.
steps:
  - >-
    Connect Meta Ads and Shopify read-only, via a Claude connector or MCP server if you have one, or
    upload 30 days of purchase and order exports.
  - Run the prompt to list days where Meta recorded more purchases than Shopify orders.
  - >-
    Recount after removing $0, replacement and subscription renewal orders, since those inflate
    counts without a pixel bug.
  - >-
    Find and remove the duplicate Purchase event, usually a second pixel or app on the thank-you
    page.
  - Re-run the check weekly to confirm the counts line up.
example: >-
  Meta counted 1.6 purchases for every real order. The purchase event fired twice on the thank-you
  page.
check: >-
  Recount after removing $0 and replacement orders. Those inflate the count without being a pixel
  bug.
cadence: Weekly
faq:
  - q: Why does Meta show more purchases than I have orders?
    a: >-
      The purchase event is usually firing more than once per order. Two pixels, two apps or a
      manual code snippet plus an app on the thank-you page are common causes.
  - q: How does double counting affect my ROAS?
    a: >-
      It makes ROAS look higher than it is. Your real cost per sale is higher than the report shows,
      so budget decisions based on it can overspend.
  - q: Does the prompt work outside Claude?
    a: >-
      Yes. ChatGPT, Grok, Muse or any assistant that can read the same Meta and Shopify numbers,
      connected or as uploaded files, can run this comparison.
  - q: Do $0 orders count as purchases in Meta?
    a: >-
      They can. Free replacement orders and some subscription renewals can fire purchase events.
      Remove them from the count before deciding the pixel is broken. Then compare again.
related:
  - meta-pixel-not-tracking-purchases
  - ads-optimizing-for-wrong-conversion
  - ad-sets-spending-with-no-sales
updated: "2026-11-06"
---
