---
slug: find-ad-angles-you-have-never-tried
id: creative-coverage
kind: play
outcome: get
start: false
title: Map which ad angles you've never tried
seo_title: Find the ad angles you have never tried
meta_description: >-
  Tag your ads by angle, audience and format, compare with your competitors, and fill the most
  promising empty spots with new ads.
hook: Most brands run the same three ad ideas in different colours.
answer: >-
  Many stores run the same few ad ideas in different colors. Connect Meta Ads, open the Meta Ad
  Library, and ask Claude to tag your ads by angle, audience and format, show the grid with empty
  cells, and do the same for your competitors. Fill the most promising empty cells with new ads and
  compare on cost per sale.
tools:
  - meta
  - adlibrary
ask: >-
  Tag every active and recent ad I've run by angle (problem, benefit, social proof, comparison,
  offer, founder story), by audience it speaks to, and by format (static, video, UGC, carousel).
  Show it as a grid and highlight the empty cells. Do the same for my 3 closest competitors.
then: Fill the most promising empty cells with new ads. Let Meta sort them.
steps:
  - >-
    Connect Meta Ads read-only through a Claude connector or MCP server, or export your ad list, and
    give Claude the Meta Ad Library through browsing.
  - >-
    Ask the playbook prompt to tag ads by angle, audience and format and show empty cells for you
    and your competitors.
  - Check which empty cells competitors fill with long-running ads. Empty does not mean good.
  - Launch new ads in the most promising empty cells on a capped test budget.
  - Compare new ads on cost per sale against current ones, and re-run the grid monthly.
example: 5 ads in 6 months, all the same angle. Competitors had launched 25 that month.
check: Empty doesn't mean good. Start with cells where competitors have long-running ads.
cadence: Monthly
faq:
  - q: What is an ad angle?
    a: >-
      It is the main idea an ad uses to persuade, such as a problem, a benefit, social proof, a
      comparison, an offer or a founder story. Two ads with different colors but the same idea share
      one angle.
  - q: Why look at competitors' long-running ads?
    a: >-
      Advertisers tend to keep ads that pay for themselves. A competitor ad that has run for months
      suggests that angle may work in your category. It is a hint, not proof.
  - q: How many new ads should I launch?
    a: >-
      Start with a few cells, one or two ads each, so each gets enough budget to read. Let cost per
      sale decide which angles to expand.
  - q: Does this prompt work outside Claude?
    a: >-
      Yes. Any assistant that can read your ads and the public Ad Library, such as ChatGPT, Grok or
      Muse, can run it from a connection, links or an exported ad list.
related:
  - find-customer-objections-your-ads-miss
  - turn-email-subject-lines-into-ad-hooks
  - turn-best-organic-posts-into-ads
updated: "2026-11-06"
---
