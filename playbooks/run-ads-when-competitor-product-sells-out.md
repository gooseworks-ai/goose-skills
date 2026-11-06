---
slug: run-ads-when-competitor-product-sells-out
id: competitor-soldout
kind: play
outcome: get
start: false
title: Run ads when a competitor's hero sells out
seo_title: Run ads when a competitor's bestseller sells out
meta_description: >-
  Watch competitor bestseller pages daily, spot when one sells out, and run a capped ad budget aimed
  at its buyers until it restocks.
hook: When your rival's bestseller is out of stock, their customers are looking for you.
answer: >-
  When a competitor's bestseller is out of stock, its shoppers look elsewhere. Using a web browser
  and the Meta Ad Library, ask Claude to check those product pages daily, report when one shows sold
  out and for how long, and whether its ads still run. Run a capped ad budget aimed at those buyers
  and stop the day it restocks.
tools:
  - browser
  - adlibrary
ask: >-
  Check the product pages of these competitor bestsellers every day: [links]. Tell me the day any of
  them shows sold out, and how long it stays out. Also note whether their ads for it are still
  running in the Meta Ad Library.
then: Run a capped budget of ads aimed at that product's buyers until they restock.
steps:
  - >-
    Give Claude the competitor product page links and the Meta Ad Library through web browsing. No
    login is needed.
  - >-
    Ask the playbook prompt to check the pages daily and report sold-out dates and whether their ads
    still run.
  - Check the page really shows sold out for all main sizes, not one variant or region.
  - >-
    Run a small capped ad budget aimed at that product's buyers, with a hard stop on the restock
    day.
  - Compare cost per sale with your usual ads, and keep the daily check running.
example: A rival's bestseller was sold out for four days. A small conquest budget ran until it came back.
check: Cap the budget and stop the day they restock.
cadence: Daily
faq:
  - q: Is it allowed to advertise when a competitor sells out?
    a: >-
      Yes, as long as your ads are truthful and do not misuse their trademarks. Target shoppers
      interested in the product type rather than claiming to be the brand. Check each ad platform's
      rules.
  - q: How do I track competitor stock every day?
    a: >-
      Ask Claude to visit the product pages once a day and note whether each shows sold out. A
      scheduled run or a simple reminder keeps it going.
  - q: How much should I spend?
    a: >-
      Keep it small and capped, and stop the day they restock. The window is short and the extra
      demand fades once the product is back.
  - q: Can other assistants run the daily check?
    a: >-
      Yes. Any assistant that can browse public pages, such as ChatGPT, Grok or Muse, can run this
      prompt. The data is public, so no login is needed.
related:
  - competitor-launched-a-sale
  - offer-weaker-than-competitors
  - find-ad-angles-you-have-never-tried
updated: "2026-11-06"
---
