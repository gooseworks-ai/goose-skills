---
slug: ads-optimizing-for-wrong-conversion
id: wrong-goal
kind: leak
outcome: stop
start: true
title: Ads optimizing for the wrong goal
seo_title: Ads optimizing for the wrong goal? Check with Claude
meta_description: >-
  Check which Google Ads conversion actions and Meta optimization events your sales campaigns bid
  on, and switch them back to purchases.
hook: Your 'sales' campaign might be telling Google that a page view is a sale.
answer: >-
  Sales campaigns sometimes bid on page views, add-to-cart or sign-ups instead of purchases, because
  of a primary conversion setting or an ad set event. Connect Google Ads and Meta Ads to Claude, ask
  it to list each campaign's bidding goal and the spend behind it, then switch sales campaigns to
  bid on purchases.
tools:
  - google
  - meta
ask: >-
  In Google Ads, list every conversion action marked as primary, and which campaigns use it to bid.
  In Meta, list the optimization event for every active ad set. Flag any campaign meant to drive
  sales that is bidding on page views, add-to-cart, sign-ups or anything that is not a purchase.
  Show the spend going to each.
then: Switch those campaigns to bid on purchases. This is usually a one-setting fix.
steps:
  - >-
    Connect Google Ads and Meta Ads read-only, through a Claude connector or MCP server if you use
    one, or upload conversion settings and campaign exports.
  - Run the prompt to list primary conversion actions in Google and optimization events in Meta.
  - Check whether a small account bids on add-to-cart on purpose because it lacks purchase volume.
  - Switch any sales campaign bidding on a non-purchase event to bid on purchases.
  - Re-run the check monthly and after any account change.
example: 40% of Meta spend went to ad sets optimizing for add-to-cart. Google counted page views as sales.
check: >-
  Very small accounts sometimes bid on add-to-cart on purpose because there aren't enough purchases.
  Check that was a choice.
cadence: Monthly
faq:
  - q: Why is my Google Ads campaign counting page views as sales?
    a: >-
      A page view conversion action is probably marked as primary. Google bids toward every primary
      conversion, so it treats a page view like a sale.
  - q: Should my Meta ad sets optimize for add-to-cart?
    a: >-
      Usually not for sales campaigns. Purchase is the better goal. Very small accounts sometimes
      choose add-to-cart because they have too few purchases, so check it was a choice.
  - q: Will this prompt work in other assistants?
    a: >-
      It will. Any assistant that can read your Google and Meta campaign settings, connected
      directly or from exported files, can follow the same steps. That includes ChatGPT, Grok and
      Muse.
  - q: How hard is the fix?
    a: >-
      Usually one setting per campaign or ad set. Changing the goal can reset learning, so make the
      change at a quiet time. Watch results for a week after the switch.
related:
  - meta-pixel-not-tracking-purchases
  - meta-counting-purchases-twice
  - ad-sets-spending-with-no-sales
updated: "2026-11-06"
---
