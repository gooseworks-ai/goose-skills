---
slug: use-customer-review-language-in-product-copy
id: review-copy
kind: play
outcome: convert
start: false
title: Turn review language into page copy
seo_title: Use customer review language in your product copy
meta_description: >-
  Find the phrases and worries customers repeat in reviews, check which your product page misses,
  and add them near the top.
hook: Your customers already wrote your best product description. It's in your reviews.
answer: >-
  Your reviews hold the words customers use to explain why they buy and what worried them first.
  Using public reviews and a browser, ask Claude to find the most repeated phrases and worries for a
  product, then check which ones the product page already covers. Add the missing ones near the top
  of the page and watch add-to-cart rate.
tools:
  - reviews
  - browser
ask: >-
  Read my product reviews for [product]. Find the phrases customers repeat most when they explain
  why they love it or what they were worried about before buying. Then check the product page: which
  of those phrases and worries does it already cover, and which are missing?
then: Add the missing phrases to the page, starting near the top. Watch add-to-cart rate.
steps:
  - >-
    Give Claude your public review pages and product page URL through web browsing, or export your
    reviews as a CSV and upload it.
  - >-
    Ask the playbook prompt to find repeated praise and worries, then compare them with the current
    product page.
  - >-
    Check that a phrase is common across many reviews, not loud in a few. Skip claims you cannot
    back up.
  - Update one page at a time on a set date, starting near the top. Note the date.
  - Compare add-to-cart rate before and after, then repeat for the next product each quarter.
example: "'Doesn't irritate my skin' appeared in 200 reviews and on no page."
check: Change one page at a time, on a set date, so you can read the effect.
cadence: Quarterly
faq:
  - q: Why use review wording instead of writing my own copy?
    a: >-
      Customers describe the product in the words other shoppers search and think in. Those phrases
      often name the exact worry a new buyer has. Your own copy may describe features instead.
  - q: Which reviews should I read?
    a: >-
      Read both happy and unhappy reviews. Five-star reviews show why people love it. Lower ratings
      and early questions show what worried them before buying, which is often the gap on your page.
  - q: Why change only one page at a time?
    a: >-
      If you change many pages at once, you cannot tell which change moved the number. One page, on
      a set date, gives you a clean before and after for add-to-cart rate.
  - q: Can I paste this prompt into ChatGPT?
    a: >-
      Yes. The prompt works in ChatGPT, Grok, Muse or any assistant that can browse your review and
      product pages, or read a review export you upload.
related:
  - find-customer-objections-your-ads-miss
  - get-products-recommended-by-ai-shopping-assistants
  - ad-price-different-from-landing-page
updated: "2026-11-06"
---
