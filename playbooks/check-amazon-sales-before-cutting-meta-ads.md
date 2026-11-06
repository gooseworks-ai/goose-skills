---
slug: check-amazon-sales-before-cutting-meta-ads
id: amazon-halo
kind: play
outcome: get
start: false
title: Count the Amazon halo before cutting Meta
seo_title: Check Amazon sales before you cut Meta ads
meta_description: >-
  Find weeks when Meta spend dropped, see what happened to Amazon and Shopify sales after, and count
  that before cutting ads.
hook: Meta ads can look unprofitable while quietly driving your Amazon sales.
answer: >-
  Meta ads can look unprofitable on site sales while also driving Amazon sales. Connect Meta Ads,
  Shopify and Amazon Seller Central, ask Claude to find weeks when Meta spend was cut or paused,
  what happened to Amazon and Shopify sales after, and your Amazon share of sales. If Amazon dropped
  when Meta paused, count that before cutting.
tools:
  - meta
  - shopify
  - amazon
ask: >-
  Over the last 12 months, find any week where Meta spend was cut sharply or paused. What happened
  to Amazon sales and Shopify sales in the weeks after? What share of my total sales is on Amazon?
then: If Amazon sales dropped when Meta paused, count that before cutting.
steps:
  - >-
    Connect Meta Ads, Shopify and Amazon Seller Central read-only through a Claude connector or MCP
    server, or export weekly spend and sales reports and upload them.
  - >-
    Ask the playbook prompt to find past Meta cuts or pauses and compare Amazon and Shopify sales in
    the weeks after.
  - >-
    Check what else changed then, such as prices, Amazon ads or stock. Treat the result as a
    warning, not proof.
  - If you still cut, do it in steps with a review date and watch Amazon sales weekly.
  - Re-run this before any big cut, and compare with the same weeks last year.
example: Meta looked weak on site sales, but 35% of sales were on Amazon.
check: Other things change at the same time (prices, Amazon ads). Treat this as a warning, not proof.
cadence: Before any big cut
faq:
  - q: What is the Amazon halo effect?
    a: >-
      It is when ads seen on Meta lead people to buy on Amazon instead of your site. Meta cannot
      track those sales, so its reports undercount what the ads do.
  - q: How can I tell if Meta drives my Amazon sales?
    a: >-
      Look at past weeks when Meta spend dropped sharply. If Amazon sales fell soon after and
      nothing else changed, that is a sign. A planned holdout by region gives a clearer read.
  - q: Is this proof that Meta works?
    a: >-
      No. Other things often change at the same time, like prices, Amazon ads or stock levels. Use
      it as a warning to test carefully, not as proof to keep spending.
  - q: Will another assistant handle this prompt?
    a: >-
      Yes. ChatGPT, Grok, Muse or any assistant that can read your ad spend and sales from both
      channels can run it, connected or from weekly exports.
related:
  - when-to-reorder-new-product-launch
  - ad-sets-spending-with-no-sales
  - meta-counting-purchases-twice
updated: "2026-11-06"
---
