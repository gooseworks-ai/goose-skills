# Written-instruction mode

The accepted interim for every platform without GooseWorks levers (Google, TikTok, LinkedIn, Pinterest, Apple Search Ads, Amazon…) **and** every Meta object GooseWorks did not create — unless the marketer's own ads connector can make the change (`meta-levers.md` § With an ads-platform connector). With no GooseWorks and no connector, the whole run is cards. Same proposal shape, same change log, the marketer's hands. Never silently substitute Meta for a channel the brief chose.

## First, the current state

Ask for an export of the last 14 days at campaign / ad group (ad set) / ad level with spend, results, cost per result, CTR, and — where the platform offers it — frequency, CPM, impression share, search terms. A screenshot is fine. Never assume current values; if none is given, phrase changes relatively ("raise by 20%: if it shows $50, set $60").

## No-export mode

If the export doesn't arrive, still run: state coverage as a % of known spend ("I can see 31% of Meta spend; Google not visible"), pacing **unknown**, and only the moves the visible data supports. Cards for objects you can't see are phrased relatively and carry no evidence claim ("If Search – Non-brand's CPA in your dashboard is above $60 this month, lower its daily budget by 20%"). End with one line on what an export (or a dashboard screenshot) would unlock. Ask for full exports at most every two weeks.

## Card format — one card per change, under a minute each

```
Google — exclude 6 wasted search terms · <account> › Search – Non-brand › Ad group "acne serum"
Why: 31% of last 14 days' spend ($347) went to 6 terms with 0 conversions (this week's performance read).
Do:  Campaigns › Search – Non-brand › Insights and reports › Search terms
     Tick these 6 terms → Add as negative keyword → Phrase match → Campaign level → Save
     "free acne treatment" · "acne scar surgery" · "accutane side effects" · "diy acne mask" · "acne meaning" · "acne in dogs"
Don't touch: bid strategy, budgets.
Check: the 6 terms show "Excluded" in the search terms list.
Expected: ~−$170/week wasted spend; conversions unchanged.
Reply: "done" (with the time, if not now).
```

Rules: each card has a plain title (platform — what changes); internally it is an open recommendation `R<n>` in `state.md`, but the id never appears on the card; safest first, grouped by object; exact names copied from the export; paste-ready values; one guardrail line; one check line; expected effect (direction/range or "unknown"); a reply line.

## Click paths (verify against the current UI; platforms move menus)

- **Google Ads budget:** Campaigns › select campaign › Budget column pencil › new daily budget › Save. Smart Bidding target: Campaign › Settings › Bidding › Target CPA/ROAS (change ≤ 15–20% at a time).
- **Google pause:** Campaigns/Ad groups/Ads › status dot › Pause.
- **TikTok Ads Manager:** Campaign › Ad group › Edit › Budget & schedule; pause with the toggle on the ad row.
- **LinkedIn Campaign Manager:** Campaign group › Campaign › Edit › Budget & schedule; Ads tab › toggle the named ad Off.
- **Meta Ads Manager (non-Goose objects):** Campaigns/Ad sets/Ads tab › toggle off to pause; ad set row › Budget pencil; duplicate via the Duplicate button (for horizontal scaling).
- **Apple Search Ads:** Campaign › Ad group › Edit › Daily budget / Default max CPT bid; Keywords › negatives; Custom product pages are set in App Store Connect and chosen per ad group.

## Amazon / marketplace (Sponsored Products, Brands, Display)

- **Budget / bids:** Campaign Manager › campaign › Settings › Daily budget; Ad group › Default bid. Judge on TACoS (ad spend ÷ total sales) as well as ACoS.
- **Search terms:** Campaign › Ad group › Search terms (or a Search term report) → add irrelevant terms as negative exact/phrase; harvest converting terms into an exact-match campaign.
- **Pause:** toggle the campaign, ad group or keyword off. Never advertise an ASIN that is out of stock or lost the Buy Box.

## Logging

Each card is an open recommendation `- R<n> (YYYY-MM-DD): …` in `state.md` (status awaiting the marketer) and, once the marketer replies "done", a `### YYYY-MM-DD — <title>` block in `decisions.md` with the confirmed time applied (grammar in `proposal-and-log.md`); then its bullet is removed. Results are measured from the confirmed time only. If a card is unconfirmed after ~48 hours, ask once. A card the marketer declines is logged as declined with their reason.
