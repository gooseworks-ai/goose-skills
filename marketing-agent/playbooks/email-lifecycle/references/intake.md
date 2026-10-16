# Intake — what to ask, and how

Load at "Before you start". Ask only what the brain, the program sheet and the human's last answers do not hold, each question prefilled with the best guess ("Looks like you're on Shopify + Klaviyo — right?"). Two short messages: **message 1** (≤ 8) before anything else; **message 2** (≤ 6) after the flows are chosen, only for facts those flows use, prefilled from the brand's own site (shipping, returns and FAQ pages, the sign-up popup) and labelled "from your site — confirm". A weekly run usually asks none. A flow whose facts are still open is staged "not ready: answer Qn".

## Message 1 (before anything else)
1. Only if the brand type or a campaign brief doesn't settle it: what does a customer do that counts as the win — an order, a subscription, a trial converting, a booking, a demo?
2. Which tool sends your email, SMS and push, and which plan? (Feature availability depends on the plan.)
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
- If the claims marker is not `signed-off`: the claims gate's scoped sign-off for the 3–5 lines the chosen flows need, as its own block (not counted in the six).
- Pre-launch: waitlist size and age, how people joined, the launch date, beta/TestFlight availability, and whether a sign-up or install reaches the email tool (a form, an integration, a tag the app sets) — the launch reminders' exclusion uses it.

## Never guessed
Consent status, discount depth, prices, stock, shipping and return promises, renewal terms, trial length, existing event names, claims, reward amounts, time zones. Missing at writing time → a visible [placeholder] with its question. Events that don't exist yet are not guessed either: they are proposed in a tracking plan (event, properties, when it fires, which flow uses it) labelled "proposed — confirm with engineering".

## Saving what the human said
Save the answers into `lifecycle/program.md` with the date and "from you". Facts for the brain are collected and written once at SKILL step 9 (one save-learning call): the standing offer and the policies the human confirmed (shipping, returns, guarantee), as `Standing offer: … [owner, date]` (shared with learn-my-brand) and `[lifecycle YYYY-MM-DD]` rules (never `Policy:`, which is learn-my-brand's) — so send-check and later runs can use them — and rules other playbooks must obey. A product-specific offer is appended to that product's `offers` only if the result stays under 280 characters.
