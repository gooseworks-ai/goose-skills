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
| 3 | **Reply drafts** — finished replies to comments, mentions and DMs on the brand's own posts and in the places it is mentioned, each with a recommendation (reply / take private / stay silent), disclosure on third-party communities, and holding statements in a crisis; the human sends. Owner: **run-organic-social**, which already runs the daily engagement routine. research-market's brand-watch mode finds the threads and flags risks; this card drafts the replies. The old craft is in git history at `playbooks/listen-social/references/reply-drafting.md` | Mode in run-organic-social | DTC and consumer brands with active comment sections; any brand in a crisis | 3 customers ask for reply drafts after a research-market run flags threads, or the first crisis where a drafted holding statement is needed |
| 4 | **Search-ad copy** — Google responsive search ads, sitelinks, keyword themes, starter negatives; Apple Search Ads keywords | Mode in `make-static-ads` | B2B SaaS, local and DTC whenever plan-campaign marks Google Search "Run" | The first customer with a live Google Search line in a plan |
| 5 | **write-my-positioning** — 2–3 positioning options, a messaging framework traced to approved claims, boilerplate, homepage hero lines | New playbook | Just-launched B2B SaaS, services firms, pre-launch apps, in week 1 | 3 founders in a month where where-to-start reports "no positioning", or the first services customer |
| 6 | **do-outreach (sending half)** — sending sequences from the customer's own domain and mailboxes, warm-up, stop-on-reply, reply handling in the product. **The writing half is built (19 Oct): write-outreach** drafts sequences, first lines, replies and results reads; the human sends | Sending layer (server) + a mode in write-outreach | B2B founders and sellers running outbound weekly | A sending layer that connects the customer's own mailbox (not the @agentmail.to workspace inbox), and 3 customers who use write-outreach ask to send from GooseWorks |
| 7 | **Sales collateral** — one-pagers, battlecards, demo scripts, sell-sheets | Mode in `make-content` | B2B launches (plan-campaign lists them on asset lists); CPG retail pitches | Built together with #4 or #5, whichever comes first |
| 8 | **optimize-listings v1** — Amazon/marketplace listing audit and copy, the listing image set, feed health (Merchant Center, Meta catalogue, TikTok Shop); plus Amazon rows in analyze-performance and Sponsored Products moves in run-paid-campaigns | New playbook + modes | Amazon and marketplace sellers from week 1 (about 15–20% of their work is served today); DTC brands when a feed disapproval stops catalogue ads | The first marketplace seller signs up, or feed disapprovals show up in 2 accounts |
| 9 | **manage-reviews** — reply drafts and rating watch across Google, app stores, Amazon, Trustpilot (review-request emails already exist in email-lifecycle's flows) | New playbook | Local businesses, apps and Amazon sellers, weekly | The first local or app customer, or a review-site read becomes available through the data proxy |
| 10 | **run-my-week** — one weekly sequence that runs the recurring playbooks in the right order, with one intake and one calendar of everything going out | Foundation piece (not a listed playbook) | Every customer once more than 3 playbooks run weekly; today a human must drive the Monday loop | Scheduled runs are live for 2+ playbooks at one customer |
| 11 | **watch-and-alert** — tell me when something needs me: competitor move, ad rejected, mention spike, stock-out | Foundation piece | Everyone, reactively | The server's watcher layer exists (parking lot P2) |
| 12 | **audit-my-pages** — conversion audit of the pages ads send traffic to: message match, test ideas | Mode in `analyze-performance` first | DTC and B2B with paid traffic | The page-audit part inside analyze-performance is used by 3 customers |
| 13 | **Brand incident across channels** — a crisis branch for email and organic, not just paid and social | Modes | Any brand during a crisis or recall | The first real incident at a customer |
| 14 | **Multi-location local** — per-location reporting, weekly Google Business Profile posts, local listings | Modes in analyze-performance and run-organic-social | Multi-location services and franchises | The first multi-location customer |
| 15 | **Launch extras** — Product Hunt kit, webinar follow-up, community posts, affiliate recruiting | Modes in make-content | B2B and app launches | 3 customer asks |
| 16 | **PR drafts** — launch press release, gift-guide pitches, press kit (research plus drafts; the human pitches) | Mode in make-content | DTC gifting season, launches | 3 customer asks |
| 17 | **B2B content roadmap** — a topic and keyword roadmap, not just single pieces | Mode in improve-search-visibility | B2B SaaS doing content-led growth | 3 B2B customers using make-content for search pieces |
| 18 | **whatsapp-flows** — broadcasts, catalogue and click-to-WhatsApp flows | New playbook | Brands in WhatsApp-first markets (India, Brazil, Indonesia) | The first customer in a WhatsApp-first market, and an approved sending route |
| 19 | **Standing account list** — every company that fits, scored and refreshed: new fits added, stale ones retired after two missed refreshes, 2–3 people watched per top account | Mode in research-audience (list mode) | B2B teams running account-based outbound every week | The connector has company and people search (research-audience server-needs #3–#4), and 2 customers re-run list mode on the same definition monthly |

## Seed notes for cards #5 and #7 (from the old library, 19 Oct)

The old skills are being deleted; these keep what was worth having. Craft only — not their structure, vendor calls or keys.

- **#5 write-my-positioning — seed: `skills/brand/composites/launch-positioning-builder/SKILL.md` (in git history).** Keep its April Dunford spine:
  - what buyers use instead (rivals, substitutes, doing nothing);
  - the brand's unique attributes turned into value, each with proof;
  - a message hierarchy (one headline claim, two or three supporting messages);
  - messages by buyer group;
  - where to use them (homepage, ads, sales deck, bios);
  - a "what we're not saying" list.

  Its category-choice rules (existing vs sub-category vs new) were already ported into research-market's "which market are we in". When built: proof goes through `atoms/claims-gate` (never the old "proof points library"); buyer groups and quotes come from research-audience; rivals and the frame come from research-competitors; the market decision from research-market. The output follows `atoms/write-report`.
- **#7 Sales collateral — seed: `skills/competitive-intel/composites/battlecard-generator/SKILL.md` § "Phase 3: Output — Battlecard" (in git history).** Keep the one-page sheet a salesperson opens five minutes before a call:
  - a 30-second version;
  - questions that frame the deal;
  - landmine questions to plant;
  - objections with answers;
  - an honest feature and price comparison (the hidden costs from its § "1E Pricing Deep Dive");
  - where we win (lead with these), where we lose (don't engage there) and where it's close;
  - short email replies for common moments.

  When built: it reads research-competitors' rival records (already the evidence) and research-audience's objections, and every comparative claim needs sign-off and dated proof through `atoms/claims-gate`.

## Still skipped on purpose

Retail and trade marketing, offline and experiential, martech operations, and cross-functional work stay skipped, for the reasons on the plan's map (tab 5): off the current buyers, relationship-driven, or human work. The coverage review flagged one of these as doubtful: pillar 20 (local and field) for multi-location businesses. That is card #14 above.

## Server work that unblocks several cards

These are not playbooks, but several cards above wait on them. Each playbook's `server-needs.md` has the detail.
- A claim-approval tool (approve, reject, retire) — every maker depends on it.
- A typed home in the brand brain for margins, stock, offers and email programs — cards #1, #7.
- Reading the customer's own tools (email, Search Console, Seller Central) — cards #1, #7, #11.
- A sending layer — card #6 (sending half), #18.
- The lead-data routes on the connector (people search, email find, email check — they exist on the server's CLI proxy) — research-audience list mode, write-outreach (`playbooks/research-audience/server-needs.md`).
- A watcher layer — cards #9, #10.
