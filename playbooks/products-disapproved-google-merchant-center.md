---
slug: products-disapproved-google-merchant-center
id: merchant
kind: leak
outcome: stop
start: false
title: Products turned down in Google Shopping
seo_title: Products disapproved in Merchant Center? Fix with Claude
meta_description: >-
  List disapproved and limited Merchant Center products, match them to Shopify sales, and fix the
  disapprovals that cost the most revenue first.
hook: >-
  Your bestsellers might be invisible in Google Shopping, and the reason is in a report nobody
  opens.
answer: >-
  Products get disapproved or limited in Google Shopping for reasons like missing GTINs, price
  mismatches or image problems, and bestsellers can disappear without notice. Connect Merchant
  Center and Shopify to Claude and ask it to rank disapproved products by 90-day Shopify revenue.
  Fix the top reasons first, starting with in-stock items.
tools:
  - merchant
  - shopify
ask: >-
  In Merchant Center, list every product that is disapproved or limited, with the reason. Match each
  one to its Shopify sales over the last 90 days and sort by revenue, so I can see which
  disapprovals hurt most.
then: Fix the top reasons first (usually missing GTIN, price mismatch or image problems).
steps:
  - >-
    Connect Merchant Center and Shopify read-only, through a Claude connector or MCP server if you
    have one, or upload a diagnostics report and sales export.
  - Run the prompt to list disapproved or limited products and sort them by Shopify revenue.
  - Filter out products you no longer sell; only in-stock items matter.
  - Fix the top reasons first, usually missing GTIN, price mismatch or image problems.
  - Ask Claude to re-run the check weekly.
example: 38 products turned down, including 4 of the top 10 sellers.
check: Products you've stopped selling don't matter. Filter to items in stock.
cadence: Weekly
faq:
  - q: Why are my products disapproved in Google Merchant Center?
    a: >-
      Common reasons are missing GTINs, a price on the feed that does not match the site, image
      problems, or policy issues. Merchant Center shows the reason for each item.
  - q: Which disapprovals should I fix first?
    a: >-
      Fix the products that earn the most in Shopify. Ranking by revenue shows which fixes bring
      back the most sales. A disapproved bestseller costs far more than a disapproved slow seller,
      so start at the top of the list.
  - q: Does this need Claude, or will Grok work?
    a: >-
      Grok, ChatGPT, Muse or any assistant that can read your Merchant Center report and Shopify
      sales, whether connected or uploaded, can run it. The steps stay the same.
  - q: How often do disapprovals happen?
    a: >-
      They can appear any time a feed or policy changes. A weekly check catches them before a
      bestseller is missing for long. Feed apps and price changes are common triggers.
related:
  - stop-low-margin-products-eating-shopping-budget
  - get-products-recommended-by-ai-shopping-assistants
  - bestsellers-missing-from-meta-ads
updated: "2026-11-06"
---
