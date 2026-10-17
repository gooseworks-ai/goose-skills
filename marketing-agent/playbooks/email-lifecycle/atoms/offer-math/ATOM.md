---
name: offer-math
description: Internal step of email-lifecycle. Prices any discount, free-shipping threshold or reward in a flow or broadcast against contribution margin and states the break-even lift, for the human's yes. Not user-invoked.
---

# offer-math

**Reads:** `../../references/segments-cadence-offers.md` (ladder and formula); AOV and margin per product or category from `lifecycle/program.md` (human-stated); the standing first-order offer from learn-my-brand's `Standing offer:` fact (else the Brand record's business facts, read with `file_read`; never a search snippet); product records for price.

**Does:**
1. **Check the offer is allowed:** the standing offer, or a step of a ladder the human approved. Welcome never deeper than the standing offer; first cart reminder never discounted; no discount to returning full-price buyers in cart flows; no code twice in 30 days. Anything else is a proposal, not a draft.
2. **Compute** contribution per order, discount cost per order, share of contribution used, and the break-even lift, with the inputs shown. Free shipping: cost = average shipping cost × share of orders newly qualifying. Rewards (referral): cost per successful referral both sides vs contribution of the referred first order. Subscriptions and apps: use the subscription formula in the reference (store fee, months retained).
3. **Leakage:** shared vs unique code (if the sign-up form shows a shared code, repeat that code and flag the leakage as a proposal naming the popup edit — never switch it silently), stacking, exclusions, expiry, which segments see it (are full-price buyers in them?).
4. **Recommend one** — usually the cheapest offer that does the job, or a non-discount value (free shipping, gift with purchase, early access) — in two plain sentences.
5. **Unknown margin:** show cost per order in money, say "margin unknown", and do not call it affordable.

**Writes:** an offer box placed next to the flow or send that uses it, and into the "awaiting your yes" list. The approved depth is saved in `lifecycle/program.md`; the approved depth stays in the program sheet (a standing offer the human states is written at SKILL step 9).
