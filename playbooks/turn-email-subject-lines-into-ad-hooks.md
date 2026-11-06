---
slug: turn-email-subject-lines-into-ad-hooks
id: subject-to-hook
kind: play
outcome: get
start: false
title: Turn your best email subject line into an ad
seo_title: Turn your best email subject lines into ad hooks
meta_description: >-
  Find your top email subject lines from the past year, check whether any became ad hooks, and draft
  new ad hooks from the rest.
hook: Your best-performing subject line has probably never been used as an ad hook.
answer: >-
  Your best email subject lines have already been tested on real customers, yet they may never have
  appeared in an ad. Connect Klaviyo and Meta Ads, ask Claude for your top campaigns by open or
  click rate and whether those lines were used as ad hooks. Draft hooks from the unused ones, launch
  them, and compare on cost per sale.
tools:
  - klaviyo
  - meta
ask: >-
  List my 10 email campaigns with the highest open rate in the last 12 months, with their subject
  lines. Then check my Meta ads: has any of those lines or ideas been used as an ad hook? Draft 3 ad
  hooks from the unused ones.
then: Launch them as new ads and let Meta sort them on cost per sale.
steps:
  - >-
    Connect Klaviyo and Meta Ads read-only through a Claude connector or MCP server, or export
    campaign and ad reports and upload them.
  - Ask the playbook prompt for your top subject lines and whether each has been used as an ad hook.
  - Check click rate as well as open rate, since Apple Mail inflates opens.
  - Launch the drafted hooks as new ads on a capped budget alongside your current ads.
  - Compare on cost per sale after a fair test period, and re-run the check each quarter.
example: A subject line opened at 42% and had never been used in an ad.
check: Open rates are inflated by Apple Mail. Prefer click rate if you have it.
cadence: Quarterly
faq:
  - q: Why would an email subject line work as an ad?
    a: >-
      A subject line that many subscribers opened has already shown it catches attention. The same
      idea can work as the first line of an ad. It is a starting point to test, not a sure win.
  - q: Are open rates reliable for this?
    a: >-
      Not fully. Apple Mail privacy features can mark emails as opened when no one read them. Prefer
      click rate when you have it, and use open rate only to shortlist ideas.
  - q: How many hooks should I test?
    a: >-
      Start with a few, such as three, so each gets enough budget to read. Run them alongside your
      current ads and let results on cost per sale decide which to keep.
  - q: Can ChatGPT or Grok do this?
    a: >-
      Yes. Any assistant with access to your email and ad data can run this prompt, whether through
      a connection or from campaign and ad reports you export and upload.
related:
  - turn-best-organic-posts-into-ads
  - find-ad-angles-you-have-never-tried
  - find-customer-objections-your-ads-miss
updated: "2026-11-06"
---
