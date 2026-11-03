# SMS, push, in-app and WhatsApp

Load at step 4 when a flow has an SMS, push or in-app leg, and at step 6 for SMS broadcasts.

## SMS — high-intent moments only
Use for: checkout or cart left, back in stock, a sale's last hours, a booking reminder, a delivery or appointment change. Not for: newsletters, education, every promo.

Compliance (US; verify current rules, practitioner summary as of late 2026):
- Prior express written consent for marketing texts, collected separately from email consent.
- 10DLC brand and campaign registration (or a verified toll-free number); unregistered traffic is blocked.
- Brand name in the message; "Reply STOP to opt out" on the first message and periodically.
- Honour STOP, QUIT, END, REVOKE, OPT OUT, CANCEL, UNSUBSCRIBE (FCC rule in force since April 2025); the broader revoke-all rule is delayed to 31 Jan 2027.
- Send 8am–9pm recipient local time; some states are stricter (Florida and Oklahoma 8am–8pm and at most 3 messages in 24 hours).
- Carrier content bans: cannabis, firearms and similar; alcohol and some categories need age gating.
Outside the US: Canada (CASL express consent), the EU/UK (GDPR; double opt-in common in Germany), India (DLT template registration). Ask the market; never assume US rules travel.

Benchmarks (practitioner ranges, not a primary source): campaign click 5–10%; flow click 10–20%; opt-out 0.5–1.5% per campaign (> 2% = too frequent or wrong audience).

Cost: SMS is paid per segment (≈ 160 GSM characters; emoji switch to 70-character segments). Show the segment count for each message; whole-list SMS sends are a proposal.

## Push and in-app (apps)
- **Permission:** iOS asks once; the first ask is precious. Prime with an in-app soft prompt after the first value moment ("Want a nudge when your [streak] is about to break?"), then the system prompt. Android 13+ also requires permission.
- **Opt-in benchmarks** (2025–26, compare by platform, never blended): Airship median ~49% iOS, ~53% Android; other vendors report higher Android.
- **Copy:** one idea, 40–90 characters, about the user's own progress, content or unfinished action. Deep link to the exact screen.
- **Frequency:** ≤ 1 push a day in week one, less after; quiet hours by local time.
- **In-app:** no permission gate; use for onboarding steps, feature discovery, the paywall and the rating prompt (the platform's native prompt, after a positive moment — an engineering ticket).
- Store billing (subscriptions bought in the App Store or Play) means win-back offers run through the store's own offer codes; say so.

## WhatsApp (named later phase)
Where the market lives in chat (India, Southeast Asia, Brazil, much of Latin America, Africa, the Middle East), WhatsApp can be the primary channel. It needs Meta-approved templates, marketing vs utility categories (priced differently), opt-in and the 24-hour service window. Trigger: when the list's main market is one of these, or the brand already sells over WhatsApp, the deliverability report's first line says WhatsApp is likely the main channel and is not covered yet. This playbook does not write WhatsApp templates.
