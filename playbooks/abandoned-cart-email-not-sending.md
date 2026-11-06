---
slug: abandoned-cart-email-not-sending
id: flow-filter
kind: leak
outcome: stop
start: false
title: A flow filter skips real shoppers
seo_title: Abandoned cart email not sending? Check filters with Claude
meta_description: >-
  Compare Shopify checkout starts with Klaviyo flow entries to see how many shoppers miss your
  abandoned-checkout email, and which filter skips them.
hook: 1,400 people started checkout last week. How many got your email?
answer: >-
  When few shoppers get your abandoned-checkout email, a flow filter is often skipping them, such as
  a rule that excludes anyone who ever ordered. Connect Shopify and Klaviyo to Claude and ask it to
  compare checkout starts with flow entries and first-email sends. If fewer than half get it, Claude
  names the rule to loosen or fix.
tools:
  - klaviyo
  - shopify
ask: >-
  How many people started a checkout last week in Shopify? How many of them entered my
  abandoned-checkout flow in Klaviyo, and how many got the first email? If fewer than half got it,
  show me the flow's trigger and filters and tell me which rule is excluding them.
then: >-
  Loosen or fix the filter. A common cause is a 'has placed an order ever' rule that skips every
  past customer.
steps:
  - >-
    Connect Shopify and Klaviyo read-only, through a Claude connector or MCP server if you have one,
    or upload checkout and flow exports.
  - Run the prompt to compare last week's checkout starts with flow entries and first-email sends.
  - Count only shoppers who never finished; people who bought within the hour should be skipped.
  - Loosen or fix the filter that excludes real shoppers, such as a 'has placed an order ever' rule.
  - Re-run the check monthly.
example: 1,400 started checkout. 90 got the first email.
check: People who bought within the hour should be skipped. Count only those who never finished.
cadence: Monthly
faq:
  - q: Why are so few people getting my abandoned cart email?
    a: >-
      A trigger or flow filter is usually excluding them. A rule that skips anyone who has ever
      placed an order removes every past customer from the flow.
  - q: Should people who already bought get the email?
    a: >-
      No. Anyone who finished the order within the hour should be skipped. The count that matters is
      shoppers who started checkout and never bought. Those people need the email most.
  - q: Does this prompt need Claude?
    a: >-
      No. ChatGPT, Grok, Muse or any assistant with access to your Shopify checkouts and Klaviyo
      flow numbers, live or exported, can run it. The method is the same in each.
  - q: How often should I check my flow filters?
    a: >-
      Monthly, and after any edit to the flow. Filters change quietly when someone copies or
      rebuilds a flow. A quick monthly check catches a bad filter before it costs a full quarter of
      recovered carts.
related:
  - klaviyo-flow-stopped-sending
  - klaviyo-missing-email-flows
  - lapsed-customers-no-win-back-email
updated: "2026-11-06"
---
