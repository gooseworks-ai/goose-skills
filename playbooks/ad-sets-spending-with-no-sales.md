---
slug: ad-sets-spending-with-no-sales
id: spend-no-sales
kind: leak
outcome: stop
start: false
title: Ad sets spending with no sales
seo_title: Ad sets spending with no sales? Find them with Claude
meta_description: >-
  List Meta and TikTok ad sets that spent several times your normal cost per sale with zero
  purchases, then pause or cut them.
hook: One ad set can quietly spend three times your normal cost per sale and sell nothing.
answer: >-
  Some ad sets keep spending for weeks without a sale because nobody checks them against the
  account's normal cost per purchase. Connect Meta Ads or TikTok Ads to Claude, ask it to find ad
  sets that spent more than 3 times your average cost per purchase in 14 days with no purchases,
  then pause them or move the budget.
tools:
  - meta
  - tiktok
ask: >-
  Work out my average cost per purchase over the last 30 days. Then list every ad set that has spent
  more than 3 times that amount in the last 14 days with zero purchases. Sort by spend.
then: Pause them or cut their budget. Move the money to the ad sets that are selling.
steps:
  - >-
    Connect Meta Ads and TikTok Ads read-only, through a Claude connector or MCP server if
    available, or upload ad set performance exports.
  - Run the prompt to find ad sets over 3 times your average cost per purchase with zero purchases.
  - Confirm tracking works first, and skip new ad sets in their first 3 days.
  - Pause the flagged ad sets or cut their budget, and move the money to ad sets that sell.
  - Ask Claude to re-run this twice a week.
example: One ad set spent $1,200 with no sales. The account's usual cost per sale is $40.
check: >-
  Make sure tracking is working first (see the playbook above). A new ad set in its first 3 days may
  not have had time.
cadence: Twice a week
faq:
  - q: How long should I let an ad set run with no sales?
    a: >-
      A common rule is to act once it has spent about 3 times your normal cost per purchase with no
      sales. New ad sets get a few days to settle before you judge them.
  - q: What if my tracking is broken?
    a: >-
      Then every ad set can look like it has no sales. Check that purchases are being recorded
      before pausing anything. A broken pixel makes good ad sets look bad, and pausing them would
      cut real sales.
  - q: Can I use ChatGPT for this?
    a: >-
      Yes. The prompt works with ChatGPT, Grok, Muse or any assistant that can see your ad set spend
      and purchases, live or through an exported report.
  - q: Is it safe to connect my ad account?
    a: >-
      Give read-only access. Claude only reads spend and results. You make the pause or budget
      change yourself. Read access is enough to find the ad sets that spend without selling.
related:
  - meta-pixel-not-tracking-purchases
  - ads-optimizing-for-wrong-conversion
  - google-ads-search-terms-not-converting
  - bot-traffic-skewing-conversion-rate
updated: "2026-11-06"
---
