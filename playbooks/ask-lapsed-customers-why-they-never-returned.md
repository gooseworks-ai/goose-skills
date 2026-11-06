---
slug: ask-lapsed-customers-why-they-never-returned
id: quiet-leavers
kind: play
outcome: more
start: false
title: Ask customers who never came back why
seo_title: Ask one-time customers why they never came back
meta_description: >-
  Find first-time buyers who never reordered, returned or complained, and send a short honest survey
  email to learn what to fix.
hook: The customers who never complained and never came back know something you don't.
answer: >-
  Customers who never complained and never came back often know what to fix. Connect Shopify and
  Klaviyo, ask Claude to find first-time buyers from 3 to 12 months ago who never reordered,
  returned or contacted support, and draft a short three-question email with no discount. Send it,
  read every answer, and use it to decide what to fix.
tools:
  - shopify
  - klaviyo
ask: >-
  Find first-time customers from 3 to 12 months ago who never ordered again, never returned anything
  and never contacted support. How many are there? Draft a short, honest 3-question email asking
  why, with no discount attached.
then: Send it. Read every answer. Use it to decide what to fix, not to claim a result.
steps:
  - >-
    Connect Shopify and Klaviyo read-only through a Claude connector or MCP server, or export
    orders, returns and support contacts and upload them.
  - Ask the playbook prompt to count these quiet customers and draft the short three-question email.
  - >-
    Check that the list excludes people who unsubscribed, returned items or already got a win-back
    offer.
  - Send the email to the segment, with no discount attached, and read every reply.
  - Use the answers to choose what to fix, not to report revenue. Re-run twice a year.
example: 1,100 good first-time buyers never came back and never got in touch.
check: This guides decisions. Don't report it as revenue.
cadence: Twice a year
faq:
  - q: Why not offer a discount in the email?
    a: >-
      A discount changes why people reply and attracts bargain answers. A plain, honest question
      gets more useful feedback about what kept them from buying again.
  - q: What should the three questions ask?
    a: >-
      Keep them short and open. For example: what you hoped for, whether the product met it, and
      what would bring you back. Claude drafts a version you can edit.
  - q: Can I count the replies as revenue?
    a: >-
      No. This guides decisions about what to fix. If a fix later lifts repeat orders, measure that
      separately against last year or a held-back group.
  - q: Can I send this prompt to ChatGPT or Muse?
    a: >-
      Yes. Any assistant that can read your orders, returns and email list, including ChatGPT, Grok
      or Muse, can run it, connected or from exported files.
related:
  - lapsed-customers-no-win-back-email
  - measure-how-late-deliveries-hurt-repeat-orders
  - do-deep-first-discounts-hurt-repeat-rate
updated: "2026-11-06"
---
