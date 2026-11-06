---
slug: do-deep-first-discounts-hurt-repeat-rate
id: discount-depth
kind: play
outcome: more
start: false
title: Check whether deep first discounts buy worse customers
seo_title: Check if deep first-order discounts hurt repeat buys
meta_description: >-
  Group first-time customers by the discount on their first order and compare repeat rate and
  revenue per customer after six months.
hook: Customers won at 30% off may come back far less than those won at 10%.
answer: >-
  Customers won with a deep first discount may come back less than those won with a small one.
  Connect Shopify and ask Claude to group first-time customers from the last 18 months by
  first-order discount, then show repeat rate and revenue per customer after six months. If deep
  discounts bring weaker customers, test a smaller welcome offer.
tools:
  - shopify
ask: >-
  Group first-time customers from the last 18 months by the discount on their first order: none, up
  to 10%, 10-20%, over 20%. For each group, show the repeat-purchase rate and revenue per customer
  after 6 months.
then: If deep discounts bring worse customers, test a smaller welcome offer.
steps:
  - >-
    Connect Shopify read-only through a Claude connector or MCP server, or export 18 months of
    orders with discount codes as a CSV and upload it.
  - >-
    Ask the playbook prompt to group first orders by discount depth and compare repeat rate and
    revenue after six months.
  - Check whether deep discounts mostly ran in big sales. Compare groups within the same season.
  - Test a smaller welcome offer on part of new visitors, keeping the current offer for the rest.
  - Compare repeat rate between the two groups after a few months, and re-run twice a year.
example: Customers won at 30% off repeated 40% less than those won at 10% off.
check: >-
  Deep discounts often run in big sales, which bring different shoppers. Compare within the same
  season.
cadence: Twice a year
faq:
  - q: Do deep discounts always bring worse customers?
    a: >-
      No. Sometimes they bring in loyal buyers who would not have tried you otherwise. That is why
      you check your own data instead of assuming. The pattern differs by store and product.
  - q: Why wait six months to compare?
    a: >-
      Repeat purchases take time. Six months gives most customers a fair chance to order again.
      Shorter windows can make every group look similar, which hides the real difference.
  - q: What if deep discounts only ran during big sales?
    a: >-
      Then the shoppers differ, not just the discount. Compare groups won in the same season or sale
      period so you are not mixing holiday buyers with everyday buyers.
  - q: Can I paste the prompt into ChatGPT or Muse?
    a: >-
      Yes. Any assistant that can read your Shopify orders and discount codes can use it, whether it
      connects directly or reads an order export you upload.
related:
  - discount-codes-stacking-on-promotions
  - creator-discount-code-on-coupon-sites
  - ask-lapsed-customers-why-they-never-returned
updated: "2026-11-06"
---
