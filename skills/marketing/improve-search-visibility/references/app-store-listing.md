# App store listing audit

Load at step 1 (free pass, atom store-listing-audit). Only when there is an app — live, or before release as a launch-day draft (an App Store pre-order page can go live before release once a build is approved).

## What is indexed
- **iOS App Store:** app name (30), subtitle (30) and the keyword field (100, private — ask for it) are indexed. Promotional text (170) is not indexed and can change any time. Name, subtitle and keywords change only with a new version submission. Screenshot caption text appears to be extracted since mid-2025; any ranking effect is disputed and small.
- **Google Play:** title (30), short description (80), full description (4,000) are indexed; there is no keyword field — Play reads the visible text.

## Rules
- Words combine across iOS fields: never repeat a word across name, subtitle and keywords; no plurals duplicates; skip "app" and "free"; commas, no spaces.
- No competitor brand names or trademarks (rejection risk).
- The first three screenshots show in search results: each caption carries one buyer job in plain words; no logo splash first.
- Ratings: average and count vs three competitors; recent-review themes. Below ~4.3 the fix is a native rating prompt after a positive moment — an engineering ticket, not copy.
- Bundle iOS metadata changes with the next app release; say so on the fix.

## The audit table
| Field | Now | Proposed | Count | Why |
Then: rating vs competitors, the "best app for X" AI-answer rows from the check, and the landing page's facts (platforms, price, free tier) — which answer engines also read.

## Example (fictional — Driftly, sleep sounds)
Now: name "Driftly", subtitle "Your calm place", screenshot 1 a logo splash.
| Field | Proposed | Count |
|---|---|---|
| Name | Driftly: Sleep Sounds & Naps | 28/30 |
| Subtitle | White Noise, Rain & Lullabies | 29/30 |
| Keywords | insomnia,relax,fan,brown,pink,baby,ambient,asmr,ocean,storm,thunder,timer,bedtime,snore,tinnitus | 96/100 |
| Screenshot 1 | Fall asleep to rain & brown noise | |
| Screenshot 2 | A timer that fades out, never jolts | |
| Screenshot 3 | Works offline. No account needed | |
| Play short description | Rain, white noise & brown noise sleep sounds with a timer. Works offline. | 73/80 |
"brown" in keywords + "Noise" in the subtitle matches "brown noise"; "calm" is left out because it is a rival's trademark. Captions like "works offline" are claims: kept only if the claims gate allows them (SKILL step 4).
