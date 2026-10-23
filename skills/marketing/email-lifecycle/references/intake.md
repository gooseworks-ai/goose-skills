# Intake — what to ask, and how

Load at "Before you start". Ask only what the brain, the program sheet and the marketer's last answers do not hold, each question prefilled with the best guess ("Looks like you're on Shopify + Klaviyo — right?"). Two short messages: **message 1** (≤ 8) before anything else; **message 2** (≤ 6) after the flows are chosen, only for facts those flows use, prefilled from the brand's own site (shipping, returns and FAQ pages, the sign-up popup) and labelled "from your site — confirm". A weekly run usually asks none. A flow whose facts are still open is staged "not ready: answer Qn".

## Message 1 (before anything else)
1. Only if the brand type or a campaign brief doesn't settle it: what does a customer do that counts as the win — an order, a subscription, a trial converting, a booking, a demo?
2. Which tool sends your email, SMS and push, and which plan? (Feature availability depends on the plan.) Ask it first unless the brain names the tool — the guide's rule "The marketer's own tools" (the `marketing-guide` skill (`../../marketing-guide/SKILL.md`) §3):
   - **None yet** → two or three that fit, as their choice, never an endorsement: a store — an ecommerce email and SMS tool (such as Klaviyo or Omnisend); product-led SaaS or an app — an event-based tool (such as Customer.io or Loops); a small list or a service business — a simple newsletter tool (such as Brevo or Mailchimp). Flows are written in the chosen tool's terms (generic, labelled so, until they pick).
   - **Named, and its connector is listed in this session** → read it, read-only, before asking anything else: lists and segments, consent fields, live flows and their results, the last 90 days' sends, the sending domain. Drop the questions it answers (often 3 and 6). Never create, edit, schedule, pause or send through it.
   - **Named, not connected** → say once: "If your <tool> can connect to this chat, connecting it lets me read your lists and past sends instead of asking you." Never claim it can unless you see a connector for it. Then ask the rest below.
3. How did people join the list, and which channels did they agree to (email, SMS, push)? Any list that was bought, scraped or imported from Amazon/Etsy orders?
4. Which countries is the list in? (Consent and quiet-hour rules differ.)
5. Only if the brain doesn't hold it: stores — your standing first-order offer, or "none"; others — any trial extension or launch pricing.
6. Optional — whatever you can grab in a few clicks (skip any; it just shows as "not checked"):
   - a screenshot of your list of automated emails, and the campaigns report for the last 90 days;
   - the hidden "original" text of one recent email you received from your own list — it shows whether inbox providers trust your sending. In Gmail: open the email → the three dots (⋮) → "Show original" → "Copy to clipboard", then paste it here. Outlook: open it → ⋯ → View → "View message source". Apple Mail: View → Message → All Headers;
   - if you use Google's sender dashboard (Postmaster Tools), a screenshot of its spam-rate chart.
7–8. Only the facts the top flow cannot be written without (usually the sign-up promise).

## Message 2 — only what the chosen flows use
- Stores: margin per product or per category (a range is enough); typical shipping time and the returns policy as stated on the site; how long a product lasts before reorder (replenishment); which products are low on stock this week; the popup or sign-up promise (exact copy); the review platform (Judge.me, Okendo, Yotpo, Google); any referral or loyalty programme and its reward.
- Subscriptions: billing tool, retry schedule, renewal-notice rules in their markets.
- B2B: trial length; the activation event(s) in the product; the events the email tool receives; who in sales gets alerted and how fast they follow up; the CRM.
- Apps: push opt-in rate by platform; the key in-app events; where subscriptions are billed.
- Local: the booking tool; services and their natural rebook interval; the Google review link.
- Services: the lead magnet or inquiry form; the booking link.
- Everyone, when writing: sender name and reply-to; the email template in the tool; blackout dates; products never to discount. The footer address comes from the tool's own footer tag — don't ask.
- If the claims gate finds no usable claim for lines the flows need (older path: the marker is not `signed-off`; brain path: no confirmed brain claim): the claims gate's scoped sign-off for the 3–5 lines the chosen flows need, as its own block (not counted in the six).
- Pre-launch: waitlist size and age, how people joined, the launch date, beta/TestFlight availability, and whether a sign-up or install reaches the email tool (a form, an integration, a tag the app sets) — the launch reminders' exclusion uses it.

## Never guessed
Consent status, discount depth, prices, stock, shipping and return promises, renewal terms, trial length, existing event names, claims, reward amounts, time zones. Missing at writing time → a visible [placeholder] with its question. Events that don't exist yet are not guessed either: they are proposed in a tracking plan (event, properties, when it fires, which flow uses it) labelled "proposed — confirm with engineering".

## Saving what the marketer said
Save the answers into `lifecycle/program.md` with the date and "from you". Facts for the brain are written once, at SKILL step 9, in one the `save-learning` skill (`../../save-learning/SKILL.md`) call, and only for what other playbooks must obey (send-check and later runs use them):
- a standing offer the marketer stated: `Standing offer: … [owner, date]` (the one opening shared with a full brand pass);
- every other rule as a `[lifecycle YYYY-MM-DD]` learning: brand-wide policies they confirmed (shipping, returns, guarantee) and rules like "never discount the starter kit".

Never write or retire a `Policy:` fact: that fixed opening belongs to a full brand pass, which is not released. Read the existing `Standing offer:`, `Policy:` and `[lifecycle …]` facts first: same → write nothing; a confirmed policy that differs from a `Policy:` fact → show both, write your `[lifecycle]` rule only on the marketer's yes, and tell them the brand record still says otherwise until they update it there; a different `Standing offer:` or `[lifecycle]` fact → replace only on the marketer's explicit "replace it". Cadence, sunset rule and approved discount depth stay in `lifecycle/program.md` (they matter only here). A product-specific offer is appended to that product's `offers` only if the result stays under 280 characters.
