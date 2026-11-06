---
slug: ads-showing-in-countries-you-dont-ship
id: no-ship
kind: leak
outcome: stop
start: false
title: Ads shown where you don't ship
seo_title: Ads shown where you don't ship? Find them with Claude
meta_description: >-
  Compare your Shopify shipping countries with Meta spend by country to find ad sets showing ads
  where you cannot deliver, then restrict them.
hook: Some of your ad budget is probably going to countries you can't deliver to.
answer: >-
  Ad sets can show ads in countries your store does not ship to when targeting is broad or set to
  worldwide. Connect Meta Ads and Shopify to Claude and ask it to compare your shipping countries
  with 30 days of Meta spend by country. It names the ad sets spending where you cannot deliver.
  Restrict those ad sets.
tools:
  - meta
  - shopify
ask: >-
  List the countries my Shopify store ships to. Then break down my Meta spend for the last 30 days
  by country. Show any spend in countries I don't ship to, and the ad sets responsible.
then: Restrict those ad sets to countries you ship to.
steps:
  - >-
    Connect Meta Ads and Shopify read-only, through a Claude connector or MCP server if you have
    one, or upload a spend-by-country report and your shipping zones.
  - Run the prompt to compare spend by country with the countries you ship to.
  - Check whether any brand-awareness campaigns target worldwide on purpose.
  - Restrict the flagged ad sets to countries you ship to.
  - Re-run the check monthly.
example: $400 went to ads shown in countries the store doesn't ship to.
check: Brand-awareness campaigns may be global on purpose.
cadence: Monthly
faq:
  - q: Why are my Meta ads showing in other countries?
    a: >-
      Targeting may be broad, set to worldwide, or include regions you added once and forgot.
      Advantage audience options can also widen reach. A broken shipping zone setting in Shopify can
      also cause a mismatch.
  - q: How do I see Meta spend by country?
    a: >-
      Break down an ad report by country in Ads Manager, or ask Claude to pull it. Then compare it
      with the shipping zones in Shopify.
  - q: Can Grok or ChatGPT do this instead?
    a: >-
      Yes. Any assistant that can read your Meta spend by country and Shopify shipping zones,
      connected or as uploaded files, can run this prompt. The data is the same, so the result is
      too.
  - q: Is spend outside my shipping area always wasted?
    a: >-
      For sales campaigns, yes. Brand-awareness campaigns may run globally on purpose, so check
      before restricting them. A shopper in a country you cannot deliver to cannot buy, so every
      click there is lost money.
related:
  - find-regions-buying-below-population-share
  - ad-sets-spending-with-no-sales
  - bot-traffic-skewing-conversion-rate
updated: "2026-11-06"
---
