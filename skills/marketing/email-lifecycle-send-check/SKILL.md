---
name: email-lifecycle-send-check
description: >-
  Checks a drafted email flow or broadcast before it is loaded: flow logic and exits, overlaps, offer
  depth and codes, stock, claims, consent and legal footer, SMS rules, rendering, voice and AI-copy
  tells, and the goal metric. Returns a pass / fixed / open-question table. Use alone when you already
  have the finished draft and the brand's product and policy facts; otherwise run email-lifecycle.
version: 0.1.0
---

# send-check

**Reads:** the drafted flows and broadcasts; `../email-lifecycle/references/copy-craft.md`; `../email-lifecycle/references/deliverability.md`; `../email-lifecycle/references/sms-push-whatsapp.md`; the result of the `claims-gate` skill (`../claims-gate/SKILL.md`) for every message (run first, in SKILL step 7); `../ad-policy-check/disclosure.md` (in the `ad-policy-check` skill) for email and SMS disclosure; product records; `lifecycle/program.md`.

**Checks — each item pass / fixed / open question:**
- **Flow logic:** purchasers exit on every step ("placed order since starting"); checkout suppresses cart suppresses browse; a cross-flow cap and smart sending set; re-entry windows set; post-purchase keyed to delivery, not order date; replenishment uses the product's cycle and skips subscribers; every split has a default branch; a sequence built as broadcasts carries an active (dynamic) exclusion list on every send after the first, never a static one; the plan's monthly send limit is respected.
- **Offers:** none deeper than allowed (offer-math ran); unique, single-use, non-stacking codes with expiry; recent purchasers excluded from promos; full-price returning customers never discounted in cart flows.
- **Stock and data:** every featured product in stock; prices pulled live, not typed; every merge tag has a fallback; dynamic blocks hide out-of-stock lines.
- **Claims:** the claims gate has run on every message and its cuts are applied (this atom does not judge claims itself). Shipping, returns and guarantee promises match the `Policy:` facts and the `[lifecycle]` policy rules, including ones confirmed in this run's message 2 and written at step 9. Drug-like wording and financial promises the gate kept are still flagged for a human read — the sentence, not the whole category.
- **Compliance:** consent per market (no abandoned-checkout email to non-subscribed Canadian contacts; CASL implied-consent windows); footer with legal name and postal address via the tool's own tag, visible unsubscribe and preference link, one-click unsubscribe header noted for the tool; SMS: separate consent, brand name, STOP language, quiet hours, local rules for the markets; review requests go to all customers, not only happy ones; no marketing to marketplace-sourced buyers.
- **Rendering:** single column, mobile first, live text, alt text on every image, full plain-text part, dark-mode-safe logo, HTML under 102 KB, seed tests listed for Gmail, Outlook, Apple Mail, Yahoo.
- **Voice and craft:** brand banned words; the 14-item failure list in `copy-craft.md`; one job and one primary CTA per message; subject and preview not repeating.
- **Measurement:** goal metric per flow (never opens); holdout only on always-on marketing flows with enough volume (never transactional, legally required, booking, dunning or one-time launch messages — "no holdout — <reason>"); the random-sample split sits after the message that delivers what the form or a transaction promised — a holdout placed before it fails; one test per flow or send; UTMs consistent.

**Writes:** a check table per flow and per send at the end of each file; open questions collected into the "awaiting your yes" list. A message with an unresolved claim or compliance failure is not staged as ready.
