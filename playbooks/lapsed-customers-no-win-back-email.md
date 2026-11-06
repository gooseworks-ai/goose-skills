---
slug: lapsed-customers-no-win-back-email
id: lapsed
kind: leak
outcome: more
start: true
title: Lapsed customers nobody emails
seo_title: Lapsed customers nobody emails? Win them back with Claude
meta_description: >-
  Count past buyers who haven't ordered in six months, see how many are still subscribed, and set up
  a win-back flow you can measure.
hook: Thousands of your past buyers haven't ordered in 6 months, and nobody's asking them back.
answer: >-
  Lapsed buyers often go unemailed because no win-back flow exists. Connect Shopify and Klaviyo to
  Claude and ask how many buyers have not ordered in six months, how many are still subscribed, and
  whether any flow targets them. Then build a win-back flow and hold back a small random slice to
  measure what it adds.
tools:
  - shopify
  - klaviyo
ask: >-
  How many customers bought at least once but haven't ordered in 6 months? How many of them are
  still subscribed to email? Is any flow or campaign aimed at them? Show the size of the group and
  what a 2% return rate would be worth at my average order value.
then: Set up a win-back flow. Hold back a small random slice so you can count what it really added.
steps:
  - >-
    Connect Shopify and Klaviyo to Claude read-only, through a connector or MCP server if available,
    or upload a Shopify customer export and a Klaviyo list of flows.
  - >-
    Run the prompt to size the lapsed group, see who is still subscribed, and estimate what a small
    return rate is worth.
  - Count only customers who are still opted in to email.
  - Build a win-back flow, and hold back a small random slice who do not get it.
  - Re-run monthly and compare the flow's group with the held-back slice.
example: 1,800 past buyers hadn't ordered in 6 months. None got a win-back email.
check: Count only people who are still opted in, and measure against the held-back slice.
cadence: Monthly
faq:
  - q: How long before a customer counts as lapsed?
    a: >-
      The playbook uses six months without an order. Adjust that to how often people normally rebuy
      what you sell. A product people use up quickly may need a shorter window.
  - q: Why hold back a slice of customers?
    a: >-
      Some lapsed buyers would come back anyway. A small random group that gets no win-back email
      shows how many return on their own, so you can count what the flow really added.
  - q: Can another AI assistant do this?
    a: >-
      Yes. Any assistant that can read your Shopify customers and Klaviyo flows, such as ChatGPT,
      Grok or Muse, can answer the same prompt. Exported files work if it has no live connection.
  - q: What should a win-back email say?
    a: >-
      Remind them what they bought, show what is new or related, and give one clear reason to come
      back. A discount is optional, so try a version without one first and compare.
related:
  - klaviyo-missing-email-flows
  - ask-lapsed-customers-why-they-never-returned
  - klaviyo-flow-stopped-sending
  - email-past-buyers-about-launches-restocks
updated: "2026-11-06"
---
