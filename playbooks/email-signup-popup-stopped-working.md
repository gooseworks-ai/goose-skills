---
slug: email-signup-popup-stopped-working
id: popup
kind: leak
outcome: stop
start: true
title: Sign-up popup stopped working
seo_title: Email sign-ups dropped? Check your popup with Claude
meta_description: >-
  See whether a sign-up drop came from your popup, its offer or traffic by charting Klaviyo sign-ups
  against GA4 sessions and Shopify code orders.
hook: Email sign-ups halving overnight is rarely a traffic problem.
answer: >-
  When email sign-ups fall sharply while site traffic holds steady, the popup usually broke or its
  offer changed. Connect Klaviyo, Google Analytics and Shopify to Claude, ask it to chart daily
  sign-ups against sessions for 90 days, and check the form, its offer and welcome-code orders.
  Restore the popup and test it yourself.
tools:
  - klaviyo
  - ga4
  - shopify
ask: >-
  Chart email sign-ups per day for the last 90 days next to site sessions per day. Flag any day
  sign-ups fell by more than 40% while sessions held steady. Then check: is the popup form still
  live, did its offer change, and are welcome-code orders in Shopify falling at the same time?
then: >-
  Restore the popup or its offer. Sign up yourself with a test address to check the code arrives and
  applies at checkout.
steps:
  - >-
    Connect Klaviyo, Google Analytics and Shopify read-only, through a Claude connector or MCP
    server if available, or upload sign-up, session and order exports.
  - Run the prompt to chart daily sign-ups next to sessions and flag sudden drops.
  - Ask whether someone changed the popup on purpose; then the finding is the cost of that choice.
  - >-
    Restore the popup or its offer, then sign up with a test address to confirm the code arrives and
    works.
  - Re-run the check weekly.
example: >-
  The popup switched from 10% off to a giveaway on 3 Oct. Sign-ups fell 55% and welcome-code orders
  fell with them.
check: >-
  If someone changed the popup on purpose, the finding is 'here is what that choice costs', not 'it
  broke'.
cadence: Weekly
faq:
  - q: Why did my email sign-ups suddenly drop?
    a: >-
      If traffic stayed the same, the popup likely stopped showing, broke on some devices, or its
      offer changed. A weaker offer can cut sign-ups even when the form works.
  - q: How do I test my sign-up popup?
    a: >-
      Sign up yourself with a test email address. Check that the welcome email arrives and that the
      code applies at checkout. Try it on a phone and a desktop, since a popup can break on one and
      not the other.
  - q: Can other assistants run this prompt?
    a: >-
      Yes. Any assistant that can read the same sign-up, session and order data, connected or from
      an uploaded file, can follow it. That includes ChatGPT, Grok and Muse.
  - q: What if we changed the popup on purpose?
    a: >-
      Then nothing is broken. The useful output is what the change cost in sign-ups and welcome-code
      orders, so you can decide whether to keep it.
related:
  - shopify-discount-code-stopped-working
  - klaviyo-flow-stopped-sending
  - check-email-domain-dmarc-record
updated: "2026-11-06"
---
