# Flow library

Load at step 2 (choose the flows) and step 4 (write them). Starting defaults, not rules: the model adjusts to the brand's price, consideration cycle and data. Every flow listed here is buildable; a run builds only the subset that pays first.

## 1. Which flows first, by business type

Rank inside the set by expected value = intent of the trigger × monthly volume through it × margin per conversion. A live flow that is broken (buyers still get cart emails, a dead code, a wrong link) outranks any missing flow.

| Business | First three, in order | Why | Wrong or premature here |
|---|---|---|---|
| Store, one-time purchase | 1. abandoned checkout · 2. welcome · 3. post-purchase → second order | Highest intent first; welcome earns the most in total; the first-to-second-order drop is the biggest leak | Referral before ~1,000 customers; replenishment for durable goods |
| Store, consumable | 1. abandoned checkout · 2. welcome (with subscribe option if one exists) · 3. replenishment per SKU cycle | Missed reorders are the leak | Win-back before the reorder cycle is known |
| Store, subscription | 1. abandoned checkout · 2. failed payment (dunning) + upcoming-renewal notice · 3. cancel-save | Involuntary churn is often the largest single loss; several US states require renewal notices | Promo-heavy calendar to subscribers |
| B2B, product-led trial | 1. activation onboarding keyed to events · 2. trial ending (T-3, T-1, expired, extend) · 3. usage-limit upgrade nudge / product-qualified-lead alert to sales | Conversion follows activation, not days elapsed | Cart, browse, post-purchase, discounts, SMS |
| B2B, sales-led demo | 1. demo booked → reminders + no-show recovery · 2. post-demo / stalled-deal nurture with proof · 3. newsletter nurture for not-ready and closed-lost | No-shows and stalled deals are where pipeline leaks | Cart, discounts, SMS; rep-sent sequences belong to write-outreach |
| Consumer app, subscription | 1. day 0–7 activation (push + in-app + email) with permission priming · 2. trial ending / paywall abandon · 3. lapsed-subscriber win-back | Activation decides renewal; store billing is outside the brand's control; many emails are relay addresses, so push leads | Cart, email discount ladders |
| Consumer app, freemium | 1. first value → habit (streaks, saved progress) · 2. day 7 / day 30 dormant re-engagement · 3. in-app upgrade prompt at the usage limit | Retention multiplies every acquisition dollar | Broadcast-heavy calendars, SMS |
| Marketplace (one set per side) | Buyers: welcome → first transaction · saved-search / new-inventory alerts · two-sided review request. Sellers: listing completion → first sale | Liquidity on both sides; new inventory is the marketplace's back-in-stock | One segment plan for both sides |
| Local business (clinic, gym, salon, restaurant) | 1. booking reminder + no-show recovery · 2. post-visit review request · 3. rebook / recall (6-month recall, class-pack or membership lapse) | SMS-first; reviews drive local search; health businesses keep treatment details out of messages | Cart, browse, weekly promo blasts |
| Services firm | 1. inquiry / lead-magnet nurture (plain text, from the founder) · 2. consult booked → reminder, no-show, proposal follow-up · 3. monthly newsletter to prospects and past clients | Trust and long cycles; referrals come from staying in touch | Cart, discounts, SMS promos; ask for case studies, not product reviews |
| Pre-launch / waitlist (any type: an app before release, a SaaS before trials, a store before launch) | 1. waitlist re-confirm (its own send, ready on its own — no exclusion needed) + launch sequence (announce — ready on its own; +2 days reminder, last call — the reminders exclude converters, or launch-link clickers as a stand-in, and only they wait on that exclusion; beta/TestFlight invite if one exists) · 2. the type's first activation flow, drafted for launch day · 3. a plain-text founder note: why we built it | Activation and trial flows have no volume yet; the launch is the money moment. A waitlist older than 3 months is treated as a dormant list (re-confirm first) | Win-back, cadence calendars, discount ladders |
| Creator / newsletter | 1. welcome (safelist ask, reply prompt, best past issues) · 2. free → paid upsell or referral programme · 3. sunset / re-engagement | Sponsors and paid tiers pay for engaged readers; pruning protects revenue | Cart, browse, discount ladders |

Ranking uses volume: a flow whose trigger fires a handful of times a month ranks below one that fires hundreds, however high its intent. A flow listed "needs X first" is replaced by the next buildable flow in the ranking, so a run never ships fewer flows than it promised — unless fewer are buildable on the plan, which the plan's first line says (SKILL step 2).

Booking-led businesses often send reminders from the booking tool (Mindbody, Jane, Zenoti, Calendly, Vagaro) rather than the email tool: write the copy and settings for that tool and say so.

## 2. The library

Per flow: trigger · messages · typical delays · the job of each message · what shifts it · exclusions. Delays are from the trigger unless marked "+" (after the previous message).

### Store flows
- **Welcome (prospect).** Trigger: joined list via a sign-up form (branch on capture source; a checkout opt-in gets a short customer welcome instead). 3–5 emails (+1 SMS if SMS consent): 0, +1d, +2d, +2d, +3d. Jobs: deliver what the form promised + one product decision · the point of view (why this brand) · proof · honest deadline on the code (only if the code has a real expiry) · a reply-earning note from a person. High price or long consideration (> ~$150 AOV): 5–7 over 2–3 weeks with more education. Exit on order.
- **Abandoned checkout.** Trigger: started checkout. 2–3 (+1 SMS): 30–60 min, ~24h, ~48–72h. Jobs: remind with the items · remove the objection (returns, fit, shipping, how long it lasts) · last nudge with the *existing* welcome code for first-timers only, if still valid. Returning customers: first two only, no discount. Suppresses cart and browse.
- **Abandoned cart (added to cart, no checkout).** 2: 2–4h, 24h. Suppressed when in the checkout flow.
- **Browse abandonment.** Trigger: viewed a product 1–2+ times, no add-to-cart, identified visitor. 1–2: 2–6h, 24–48h. Light touch, no discount, show the viewed item plus 2 related.
- **Post-purchase.** Trigger: fulfilled/delivered (not order date). 3–4: on delivery (how to use, what to expect), +7d (tips, the second-use moment), +14–21d (cross-sell by category bought). Branch first vs repeat customer.
- **Replenishment.** Trigger: ordered SKU X. 1–2 (+SMS): at cycle −7d, at cycle. Per-SKU cycle from the catalogue or the marketer. Skip if repurchased or subscribed. Not written without a known cycle.
- **Back-in-stock.** Trigger: subscribed to an alert. 1 (+SMS): on restock; reminder +24h if still in stock. Batch if stock < waitlist so nobody is promised what won't ship.
- **Price drop.** Trigger: viewed or carted item's price fell. 1. Only for stores with real price changes; never fabricate a "drop".
- **Review request.** Trigger: delivered. 1–2: +7–14d (+21–30d for products whose results take time, like skincare). Every customer, never only happy ones (Google policy, FTC 2024 reviews rule). Needs the review platform named.
- **Referral.** Trigger: second order or a 4–5 star review. 1–2 right after. Needs a real programme, reward and fraud controls signed off.
- **Win-back.** Trigger: no order in ~1.5–2× the median repurchase interval. 2–3: 0, +7d, +14d. Durable goods: long or skip.
- **VIP / loyalty tier.** Trigger: crossed the VIP definition. 1–2: early access, a thank-you, no discount by default.
- **Birthday / anniversary.** Only if the date was collected with consent. 1.
- **Subscription:** failed payment (dunning) 3–4 over the retry window; upcoming renewal 1 at the legally required lead time; cancel-save 1–2 at cancel intent (pause, skip, swap before discount).
- **Sunset / re-permission.** Trigger: no click or order in 90–180d and ≥ 8–10 sends received. 2: "still want these?" with a one-click keep link, +5d, then suppress (keep the record). Proposal only.

### B2B flows
- **Activation onboarding (product-led trial).** 5–8 over the trial, keyed to activation events: each step checks whether the milestone is done and skips if so. Jobs: one setup step per message, the "aha" action, social proof from a similar company, an invite-a-teammate step.
- **Trial ending.** T-3, T-1, expired, +2d (extend or downgrade path).
- **Usage-limit / upgrade nudge.** At 80% and 100% of a limit.
- **Product-qualified-lead routing.** Written as a rule the marketer configures in the CRM: the events and thresholds that alert sales, the alert text, the SLA.
- **Demo booked.** Confirmation, −24h, −1h reminders; no-show +15 min (reschedule link), +1d, +4d — from the rep's name, plain text.
- **Post-demo / stalled deal.** Same day recap + next step, +2d, +5d, +10d; proof matched to the prospect's segment. Sales-owned while the deal is open: written for the rep's approval.
- **Closed-lost / not-ready nurture.** Monthly newsletter + a quarterly "what changed" note.

### App flows (push, in-app, email)
- **Onboarding.** In-app at first session; push day 0 (only after permission), 1, 3, 7. Ask for push permission after the first value moment via a soft pre-prompt. ≤ 1 push a day in week one.
- **Habit.** Streak or progress reminders at the user's usual time.
- **Trial ending / paywall abandon.** Push + email at T-2, T-0.
- **Dormant re-engagement.** D7, D14, D30; what's new or what they left unfinished.
- **Rating prompt.** In-app only, after a positive moment, via the platform's native prompt (an engineering ticket, not copy).

### Local and services
- **Booking reminder / no-show.** −24h, −2h (SMS); no-show +1h rebook link.
- **Post-visit review request.** +2–24h, to every client, the direct review link.
- **Recall / rebook.** At the service's natural interval (dental 6 months, hair 6–8 weeks, class pack at 80% used).
- **Inquiry nurture.** 4–6 plain-text emails over 3–4 weeks from the founder: one useful idea each, a case study, a clear next step.

### Newsletter (B2B, services, creators)
make-content writes the editorial issue, subject included (`content/newsletter/<date>.md`). This playbook owns the cadence, segment, send time, exclusions and staging, and slots the issue into the calendar. For services and B2B, the newsletter is often the whole nurture programme.

## 3. What every flow needs before it is written
- The trigger event exists in the tool (ask for the exact event name if unsure: "Started Checkout", "trial_started"), or is in this run's tracking plan — then the flow is written and marked `not ready: needs events E1–E3 live`.
- The data the splits use exists (customer type, skin concern, plan). An exclusion's conversion that isn't in the tool yet ("already signed up / installed") goes in the tracking plan: the flow is written and marked `not ready: needs events E1` — or, where the tool segments on email clicks, a click on the launch link stands in for it (plus an "Already have it? Ignore this" line) and the flow can be ready.
- The offer it uses is the standing offer or an approved ladder step.
- For referral, review, loyalty, subscription and booking flows: the platform and programme are named.
Missing split data → write the default branch only and note the split for later. If the flow cannot run at all without something (the offer, a replenishment cycle, a review platform, a reward programme), it is listed "needs X first" and not written; if only the plan can't run it, even as scheduled broadcasts (loadable-flow-format, plan reality), it is written tool-neutral and marked `not ready: needs tool decision T1`.

## 4. Buildable today — plan reality and blockers

Load at step 2 after picking the candidate flows.

- **"Buildable today"** = the tool and plan can run it now with the data it has. "Fewer than two buildable" counts across the business type's whole flow set, not only the flows asked for — a product-led brand asking for trial onboarding on a free plan still gets its waitlist launch sequence written. If fewer than two are buildable, the plan's first line says so; the done-when is then met by the ready flows plus every blocked flow written with its blocker.
- **Asked-for but blocked** → written with its blocker, and the next buildable flow is written too. A flow that "needs X first" (§3) is named and replaced by the next buildable one.
- **Plans without automation** (HubSpot free, OneSignal free, Mailchimp's lowest tiers — `loadable-flow-format.md` plan-reality column): a fixed-date sequence (waitlist re-confirm, launch announce + reminders, founder note) is built as scheduled broadcasts with an active (dynamic) exclusion list, and the sign-up welcome as the form's autoresponder — in the tool's own terms, ready to load. Count sends after exits before calling a plan too small.
- **Exclusions need the conversion in the tool** (a form, an integration, a property or tag the product sets). Missing → it goes in the tracking plan and only the reminders wait on it; the re-confirm and the announce are ready on their own. Where the tool segments on email clicks, a click on the launch link stands in for the conversion (plus an "Already have it? Ignore this" line).
- **Only a flow the plan cannot run even as broadcasts** (it needs per-person triggers or product events: onboarding, trial ending, cart) is said first, gets the cheapest route proposed as a tool decision, and is written tool-neutral, keyed to events.
- **Status lines.** In the flow files every id is paired with words, because the marketer may open the file: `ready to load` (`· switch on after fix #1 — verify your sending domain`) · `not ready: answer Q3 — your returns window` · `not ready: needs events E1–E3 live — your app must tell the email tool who installed` · `not ready: needs tool decision T1 — your plan can't run event-triggered flows`. **In chat, never show the ids:** say the blocker in words ("waiting on your answer about returns", "needs your app to tell the email tool who installed", "your plan can't run this — options below").
