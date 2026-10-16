# Playbooks to build later

**In short**
- These are marketing jobs the current 17 playbooks do not cover. Each one is written down on purpose, with who needs it and what should make us build it.
- **Decision (Akhil, 16 Oct 2026): build none of these now.** Building and testing 17 playbooks well comes first; a bigger surface now would make that harder.
- The list comes from the plan's backlog plus the 16 Oct coverage review (`reviews/2026-10-16-coverage.md`), which ran five company types through a full quarter using only these playbooks.
- Until a card is built, playbooks say plainly "this isn't covered yet" and never fake the work.

## How to read a card

- **Gap:** the work a marketer does that nothing here does.
- **Who hits it:** the company type and the moment.
- **Build when:** a trigger we can check. "Someday" is not a trigger.
- **Shape:** a new playbook, or a mode added to an existing one.

## Ranked by how soon a customer gets stuck

| # | Card | Shape | Who hits it | Build when |
|---|---|---|---|---|
| 1 | **plan-offers** — design a sale or offer backwards from margin: mechanic, depth, code plan, a brief for every channel, a post-mortem | New playbook | DTC brands every promo season; also local (new-customer offers), apps (trials), Amazon (coupons, deals) | The first paying DTC brand asks for promo help, or 6 weeks before a major promo date (Black Friday 27 Nov 2026 is already inside that window) |
| 2 | **Landing and product page copy** — campaign landing pages, product pages, homepage and pricing page, popups, waitlist pages | Mode in `make-content` | Every paid launch (the page must match the ad); B2B homepage and pricing; app waitlists | The first launch where run-paid-campaigns' page-match check blocks a launch, or 3 customer asks |
| 3 | **Search-ad copy** — Google responsive search ads, sitelinks, keyword themes, starter negatives; Apple Search Ads keywords | Mode in `make-static-ads` | B2B SaaS, local and DTC whenever plan-campaign marks Google Search "Run" | The first customer with a live Google Search line in a plan |
| 4 | **write-my-positioning** — 2–3 positioning options, a messaging framework traced to approved claims, boilerplate, homepage hero lines | New playbook | Just-launched B2B SaaS, services firms, pre-launch apps, in week 1 | 3 founders in a month where where-to-start reports "no positioning", or the first services customer |
| 5 | **do-outreach (writing half)** — email and LinkedIn sequences per segment, first lines, reply templates; the human sends | New playbook | B2B founders in weeks 2–3 holding a prospect list and no words; services firms; brands pitching retail buyers | 3 customers who ran research-audience ask "now what do I send?" (sending and reply handling wait for a sending layer) |
| 6 | **Sales collateral** — one-pagers, battlecards, demo scripts, sell-sheets | Mode in `make-content` | B2B launches (plan-campaign lists them on asset lists); CPG retail pitches | Built together with #4 or #5, whichever comes first |
| 7 | **optimize-listings v1** — Amazon/marketplace listing audit and copy, the listing image set, feed health (Merchant Center, Meta catalogue, TikTok Shop); plus Amazon rows in analyze-performance and Sponsored Products moves in run-paid-campaigns | New playbook + modes | Amazon and marketplace sellers from week 1 (about 15–20% of their work is served today); DTC brands when a feed disapproval stops catalogue ads | The first marketplace seller signs up, or feed disapprovals show up in 2 accounts |
| 8 | **manage-reviews** — reply drafts and rating watch across Google, app stores, Amazon, Trustpilot (review-request emails already exist in email-lifecycle's flows) | New playbook | Local businesses, apps and Amazon sellers, weekly | The first local or app customer, or a review-site read becomes available through the data proxy |
| 9 | **run-my-week** — one weekly sequence that runs the recurring playbooks in the right order, with one intake and one calendar of everything going out | Foundation piece (not a listed playbook) | Every customer once more than 3 playbooks run weekly; today a human must drive the Monday loop | Scheduled runs are live for 2+ playbooks at one customer |
| 10 | **watch-and-alert** — tell me when something needs me: competitor move, ad rejected, mention spike, stock-out | Foundation piece | Everyone, reactively | The server's watcher layer exists (parking lot P2) |
| 11 | **audit-my-pages** — conversion audit of the pages ads send traffic to: message match, test ideas | Mode in `analyze-performance` first | DTC and B2B with paid traffic | The page-audit part inside analyze-performance is used by 3 customers |
| 12 | **Brand incident across channels** — a crisis branch for email and organic, not just paid and social | Modes | Any brand during a crisis or recall | The first real incident at a customer |
| 13 | **Multi-location local** — per-location reporting, weekly Google Business Profile posts, local listings | Modes in analyze-performance and run-organic-social | Multi-location services and franchises | The first multi-location customer |
| 14 | **Launch extras** — Product Hunt kit, webinar follow-up, community posts, affiliate recruiting | Modes in make-content | B2B and app launches | 3 customer asks |
| 15 | **PR drafts** — launch press release, gift-guide pitches, press kit (research plus drafts; the human pitches) | Mode in make-content | DTC gifting season, launches | 3 customer asks |
| 16 | **B2B content roadmap** — a topic and keyword roadmap, not just single pieces | Mode in improve-search-visibility | B2B SaaS doing content-led growth | 3 B2B customers using make-content for search pieces |
| 17 | **whatsapp-flows** — broadcasts, catalogue and click-to-WhatsApp flows | New playbook | Brands in WhatsApp-first markets (India, Brazil, Indonesia) | The first customer in a WhatsApp-first market, and an approved sending route |

## Still skipped on purpose

Retail and trade marketing, offline and experiential, martech operations, and cross-functional work stay skipped, for the reasons on the plan's map (tab 5): off the current buyers, relationship-driven, or human work. The coverage review flagged one of these as doubtful: pillar 20 (local and field) for multi-location businesses. That is card #13 above.

## Server work that unblocks several cards

These are not playbooks, but several cards above wait on them. Each playbook's `server-needs.md` has the detail.
- A claim-approval tool (approve, reject, retire) — every maker depends on it.
- A typed home in the brand brain for margins, stock, offers and email programs — cards #1, #7.
- Reading the customer's own tools (email, Search Console, Seller Central) — cards #1, #7, #11.
- A sending layer — card #5 (sending half), #17.
- A watcher layer — cards #9, #10.
