---
slug: shopify-discount-code-stopped-working
id: code-stopped
kind: leak
outcome: stop
start: false
title: A discount code stopped working
seo_title: Discount code stopped working? Find out why with Claude
meta_description: >-
  Spot Shopify discount codes whose weekly orders collapsed, check whether they expired or hit a
  limit, and fix the emails that still promise them.
hook: Your best discount code can die on a Tuesday and nobody gets an alert.
answer: >-
  A discount code can stop working when it expires, hits a usage limit or gets edited, and Shopify
  sends no alert. Connect Shopify and Klaviyo to Claude and ask it to chart weekly orders for your
  top 10 codes over 6 months. It flags sharp drops and why. Re-enable or replace the code and update
  emails that promise it.
tools:
  - shopify
  - klaviyo
ask: >-
  List my top 10 discount codes by orders over the last 6 months. For each, show orders per week.
  Flag any code whose weekly orders fell by more than 70% compared with its usual level, and check
  whether it expired, hit a usage limit or was edited.
then: Re-enable or replace the code. Update any emails or popups that still promise it.
steps:
  - >-
    Connect Shopify and Klaviyo read-only, through a Claude connector or MCP server if you use one,
    or upload discount and order exports.
  - Run the prompt to chart weekly orders for your top 10 discount codes.
  - Skip codes that ended on purpose with a campaign; only flag codes still promised somewhere live.
  - Re-enable or replace broken codes, and update any emails or popups that still promise them.
  - Ask Claude to re-run the check weekly.
example: WELCOME10 brought 60 orders a week until 12 Oct. Now it brings 2.
check: Codes tied to one campaign end on purpose. Only flag codes still promised somewhere live.
cadence: Weekly
faq:
  - q: Why did my Shopify discount code stop working?
    a: >-
      The most common reasons are an end date, a usage limit, or an edit to its rules, such as a new
      minimum order. Shopify does not notify you when this happens.
  - q: How do I find codes promised in my emails?
    a: >-
      Ask Claude to search your live Klaviyo flows and forms for the code. Any email that still
      promises a dead code frustrates shoppers at checkout.
  - q: Do I need Claude for this?
    a: >-
      No. ChatGPT, Grok or Muse can run the same prompt if they can read your Shopify discount
      orders and Klaviyo content, either connected or from exports.
  - q: Is it safe to connect Shopify?
    a: >-
      Use read-only access. Claude reads orders and discount settings. You change the code yourself
      in Shopify. Nothing changes in your store unless you change it. Read access is enough to find
      a dead code and see why it stopped.
related:
  - email-signup-popup-stopped-working
  - discount-codes-stacking-on-promotions
  - expired-sale-ads-still-running
  - creator-discount-code-on-coupon-sites
updated: "2026-11-06"
---
