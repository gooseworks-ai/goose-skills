# Worked flows — the quality bar

Load at step 4 before writing. These show the bar, not text to reuse. Every [bracketed] value is a placeholder that a real run fills from the brand brain or asks for — never invents. Brands here are fictional.

## A. Store welcome — [Fieldnote], barrier-repair skincare

Syntax below is Klaviyo's (the tool this example names). Klaviyo issues a new unique code each time a coupon tag renders in another message (verify in the tool), so later messages point back to the code from W1 instead of re-rendering it — and never quote an earlier message's subject, which may be an A/B variant; a real run uses the brand's own tool. Context: AOV [$58]. Standing first-order offer [10% off, unique code, 7-day expiry]. Voice: dry, ingredient-literate, never gushing. Banned: "glow-up", "holy grail", "game-changer". Hero products: [Barrier Cream $38], [Gentle Cleanser $24], [Starter Duo $54]. Single market (US); a US + Canada list would use dynamic prices or a country split.

Header: trigger joined [Newsletter] from [Popup – Main] (checkout opt-ins go to a short customer welcome instead) · flow filter: placed order zero times since starting, not in flow in last 90 days · exit on order → post-purchase · smart sending off for W1, on for W2–W5 · suppresses broadcasts 3 days after entry · code from pool [WELCOME10], 7-day expiry, no stacking, excludes [gift sets, subscriptions] · holdout 10% via a random-sample split after W1 (everyone gets the promised code).

**W1 — immediately. Job: deliver the code and make one product decision for them.**
Subject: "Your 10% code, plus where to start" · alt: "Start here (code inside)" · alt: "10% off, and the one product we'd pick first"
Preview: "Most people start with the cream. Here's why."
> Your code: **{% coupon_code 'WELCOME10' %}** — 10% off your first order, good until {% today '%A, %B %-d' delta_days=7 %}.
>
> If you're starting from zero, start with the [Barrier Cream]. It's the one product in the line that does the most on its own: [ceramides, cholesterol and fatty acids in the ratio skin uses]. Use it morning and night for two weeks before adding anything else. Then you'll know what it's doing.
>
> Already have a cleanser you like? Keep it. We'd rather you buy one thing and use it than buy four and quit.

CTA: "Shop the Barrier Cream" → product page; text link "See everything". Product block: static hero; if out of stock, swap to [Starter Duo].

**W2 — +1 day. Job: the point of view. Builds belief, not a sale.**
Subject: "Why we don't sell a 10-step routine" · alt: "Fewer products, on purpose" · alt: "The boring reason your skin is irritated"
Preview: "Your skin barrier, in 90 seconds."
Body (~120 words): the barrier in one image ("mortar between bricks"); what breaks it (over-exfoliating, hot water, stacking actives); one line bridging to the cream. Split on `skin_concern` from the quiz: redness / dryness paragraph; default paragraph when empty. CTA: "Read the 2-minute guide".

**W3 — +2 days. Job: proof.**
Subject: "“I stopped buying moisturisers” — [Name], [city]" · alt: "[4,812] reviews, the honest ones" · alt: "What two weeks actually looks like"
Preview: "Including the 3-star review we learned the most from."
Body: three short real reviews (one critical, with the brand's answer); one approved claim in its exact words; no before/after unless approved. Split: clicked W1 or W2 → product block for the clicked item; else hero.

**W4 — +2 days. Job: honest deadline (only because the code really expires).**
Subject: "2 days left on your 10%" · alt: "Before your code expires" · alt: "Your code ends {% today '%A' delta_days=2 %}" (check the tag renders in Klaviyo subject lines before using it)
Preview: "No pressure. Just the date."
> Two days left on the 10% code from our first email (the one we sent the day you signed up). After that it's full price, which is fine too.
>
> The [Starter Duo] is the most-reordered first purchase: cleanser + cream, [$54], ships free over [$50].
>
> [30-day returns, even opened.]

CTA: "See the Starter Duo" → product page (the code from W1 applies at checkout). SMS branch (SMS consent, no order) +2h: "[Fieldnote]: your 10% code ends in 2 days. Starter Duo → [link] Reply STOP to opt out"

**W5 — +3 days. Job: earn replies (reader data and a deliverability signal). Plain text, from [Founder].**
Subject: "Quick question" · alt: "Can I ask you something?" · alt: "What made you sign up?"
Preview: "A one-line reply is perfect."
> I read every reply to this email. What's the one thing your skin is doing that you'd change? Hit reply — I'll tell you honestly whether we can help, or who can.

No button, no discount. After the flow, non-buyers join the engaged-30 broadcast segment.

**Shared-code variant** (the popup shows one code for everyone, no expiry): W1 prints the popup's shared code as plain text and drops the "good until" line; the header drops the pool and expiry; drop W4's deadline email (there is no real date), and C3's condition becomes "subscribed via the popup (any time) and placed order zero times", restating the code without urgency ("Your 10% code still works: [CODE]"); flag the leakage to the marketer as a proposal to move to unique codes.

**Why it is senior:** one job per message; the discount appears where it belongs and nowhere else; urgency comes from a real date; lengths run 40–150 words; the voice decides for the reader; one message exists to earn replies.

## B. Store abandoned checkout — same brand

Header: trigger Started Checkout · filters: placed order zero times since starting; not in flow in last 7 days; checkout value ≥ [$15] · exit on order · above browse and cart in priority (they suppress anyone in this flow) · split at entry: first order vs returning · first-timers get *their existing welcome code re-surfaced*, never a new or deeper one; returning customers get no discount · product block loops the checkout items with a fallback image and hides any line at zero stock.

| # | Delay | Job | Subject / alts | Preview | Body essentials | CTA |
|---|---|---|---|---|---|---|
| SMS | +30 min, SMS consent, quiet hours | catch the interruption | "[Fieldnote]: your cart's saved. Pick up here → [link] Reply STOP to opt out" | — | < 160 characters, no offer | link |
| C1 | +1h | remind, no pitch | "You left something at checkout" / "Still deciding?" / "Your [Barrier Cream] is waiting" | "Saved exactly as you left it." | items; one line on what they get; if under the free-shipping line: "you're $X away" | "Return to checkout" (restores the cart) |
| C2 | +23h | remove the objection | "The questions people ask before buying" / "Will it work on sensitive skin?" / "Returns, shipping and the rest" | "Short answers, no fine print." | three answers (returns, sensitivity, how long a jar lasts [≈ 8 weeks]); one review | "Finish checkout" |
| C3 | +48h, only if subscribed via [Popup – Main] within the last 7 days AND placed order zero times (the tool keeps no per-person coupon expiry, so the condition is built from the sign-up date) | last nudge with the existing offer | "Your 10% still works this week" / "One last thing" | "Then we'll stop." | point to the code from the first welcome email (don't re-render a unique coupon tag — it would issue a new code); "we'll stop emailing about this cart" | "Finish checkout" |

## C. B2B trial ending — [Ledgerly], bookkeeping software, 14-day trial

Header: trigger trial_started · each step checks `subscription_status`; exits on `converted` · from [Account owner name], plain text · no discount (pricing is fixed) · goal metric trial→paid.

**T-3 (day 11). Job: show what they built, so leaving has a cost.**
Subject: "What you've set up in Ledgerly so far" · alt: "3 days left — here's your account"
> Hi {{ first_name|default:"there" }} — in the last 11 days you connected {{ bank_accounts_count }} bank account(s) and categorised {{ transactions_categorised }} transactions. That work stays if you pick a plan before {{ trial_end|date }}.
>
> If you haven't run your first P&L yet, it takes about two minutes: [link to Reports]. Most teams decide after they see it.

Split: `first_report_run` = false → the P&L paragraph; true → "Your [month] P&L is ready to share with your accountant: [link]."

**T-1, expired, +2 days** follow the same rule: one job each (the plan choice with the one plan [most similar teams] pick; what happens to their data; a reply-to-extend offer only if the marketer approved extensions).

## D. Local booking reminder — [Northside Physio]

SMS −24h: "[Northside Physio]: see you tomorrow {{ appt_time }} with {{ clinician_first_name }}. Need to move it? {{ reschedule_link }} Reply STOP to opt out"
SMS −2h: "[Northside Physio]: see you at {{ appt_time }}. Parking is behind the building."
No treatment details in any message (health privacy). No-show +1h: "We missed you today — rebook here when it suits: {{ link }}". Written for the booking tool, not the email tool.
