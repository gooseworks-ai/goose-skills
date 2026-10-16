# email-lifecycle — test by hand

## How to test it (sharpened after critique)

Run it on a brand with a real list — ideally one whose standing first-order offer and product margins you know, so you can judge the money math. Ask: **"Set up my welcome and abandoned-cart emails, and plan this week's sends."** (For a B2B or app brand: "Set up my trial / onboarding emails and plan this week's sends.")

It passes when, in order:
1. It reads your brand first, then asks two short messages at most (the second may carry the 3–5 claim lines your emails need, for your approval) (first: business model, tool and plan, consent, markets, standing offer, and whatever exports you can give including one test email's headers; second, after it picks the flows: only the facts those flows use, prefilled from your site) — not a 20-question form.
2. Before writing a word, it shows the deliverability and list report, every item green / red / unknown and marked verified, from you, or unknown. **No green it did not see.** Anything broken (authentication, unsubscribe, consent) is named with its fix.
3. It names the first flows for *your kind of business* and why (a store: abandoned checkout, welcome, post-purchase; a trial SaaS: activation, trial ending, upgrade nudge; an app: onboarding push, trial ending, win-back).
4. You load the **two flows you asked for, or the top two buildable today for your type**, into your own tool **without editing a single message** (any flow blocked by missing events or your plan says so exactly — if fewer than two are buildable on your plan, it says so first and the ready ones plus every blocked flow written with its blocker count) — trigger, filters, exits, timing, priority, subjects, previews, bodies, fallbacks, plain text and footer are all there in your tool's terms. Editing first means it failed.
5. Every discount sits next to its margin math and waits for your yes; none is deeper than your standing offer unless you approved a ladder.
6. This week's broadcasts arrive finished with segment, exclusions and send time; SMS only where you have SMS consent and only for high-intent moments.
7. Nothing was sent, scheduled or switched on. No claim appears that you never approved — if your claims were never signed off, it shows you the 3–5 lines your emails need and asks you to approve them right there.
8. Next run, it reads how each flow did against the target it set and rewrites the weakest message first.

Telltale failures: generic openers, fake urgency, a code in every email, opens used to pick winners or build segments, flows that collide, a "green" deliverability item nobody checked.

## Staging run — 2026-10-16, brand Personal Day (DTC acne-safe skincare)

This playbook makes no paid calls at all (no generation, no paid data); the run goes until the first human input.

| Step | Call | What came back |
|---|---|---|
| Connection | `account_whoami`, `brand_read` (list) | staging; Personal Day coworker agent `9d554b73-…` |
| Brain read | `brand_read` summary, products, onboarding, learnings | voice-relevant description, 20 products (names and tags only in lean mode; `product_ids` gives price and `offers`), 1 learning (a video-script rule), no email/SMS facts |
| Claims | `brand_read` `sections: ["learnings"]` (lean) | no `Claims sign-off (learn-my-brand,` marker, so status is not `signed-off`; the 7 research-created "approved" claims returned by a claim search are **not usable** under the contract. The run would put the 3–5 lines the welcome and checkout flows need (e.g. "Free returns", "Free shipping over $45") to the human in intake message 2 through the claims gate's scoped sign-off. *(Re-done in the 16 Oct cross-set fix pass; the original run read claims through search, now never-approved.)* |
| Program sheet | `file_read` `lifecycle/program.md` | `not_found` → first run (build mode) |
| Performance read | `file_list` `reports/performance/` | empty → step 1 says "no results read; flows judged on the human's export only" |
| Campaign legs | `campaign_read` brand | `[]` → no campaign broadcasts this week |
| Deliverability (host shell, free) | `dig TXT personalday.com`, `_dmarc.personalday.com`, `MX` | Root SPF present (`include:dc-…_spfm.personalday.com ~all`) → **present — not verified for marketing mail** (the email tool sends from its own return-path; needs a test email's headers); DMARC record `p=none` → present, pass unverified until the headers show `dmarc=pass`; DKIM → **unknown** (needs the headers); MX Google Workspace (reply-to can be monitored). *Corrected after the round-3 critique: the first pass had wrongly marked root SPF "verified".* |
| Intake (stopped here — human input) | — | would ask message 1: store + Klaviyo? plan? how the list was collected and SMS consent; US/Canada?; standing first-order offer (the site popup shows one — confirm whether it's a shared code); and from Klaviyo: the flows list, the 90-day campaign report, list size, one test email's full headers, the Postmaster chart if any. Message 2 (after picking the flows): margin range per category, returns/shipping "from your site — confirm", popup copy |

What the run would produce next, without spending: the deliverability report (SPF/DKIM/DMARC present but unverified until the test email's headers arrive, spam rate unknown → Postmaster chart, unsubscribe and footer → the same test email), then the flow plan (store, one-time + consumable: abandoned checkout → welcome → post-purchase; replenishment flagged "needs cycle per product first").

Not run: `brand_update` (standing offer and learnings are written only after the human states them); `file_write` of the program sheet (nothing human-confirmed yet to save).
