---
name: write-outreach-outreach-qa
description: >-
  Step of the write-outreach playbook: the checks a finished outreach pack and send file must pass
  before delivery, covering facts, proof, compliance, length, asks and tone. Run write-outreach
  instead; not for direct use.
version: 0.1.0
---

# outreach-qa

Run on the whole pack and the send file. Fix every failure, then run again. Nothing about the check goes into the pack itself.

**Facts and proof**
- Every first line rests on its row's signal or hook URL and date (`signal_1_date` / `hook_date`); the fact still says that (a sample of 5 rows re-checked by link, or every row when under 10).
- No invented compliment, mutual connection, number, customer, result, peer story, "brands like X", "most teams we talk to". Every proof line went through claims-gate; cuts are listed with the proof that would restore them.
- Prices and product facts match the brand's site or brain, with the date read.

**Compliance**
- Each email has the sender's name and company, a postal address placeholder the marketer fills once, and the opt-out line.
- Row rules applied: no email body for `UK-soletrader` (letter instead), non-published `CASL` / `AU-NZ`, Germany/Austria rows; unchecked and catch-all addresses sit in `email_to_check`, never `email`; EU and unknown-country first emails carry the source-and-object line; the one-line country summary is in the pack.
- Suppressed, cooled-down and duplicate rows are out of the send file, with counts.

**Craft**
- Touch 1 50–90 words (fail over 120); follow-ups shorter; subjects under 50 characters (fail over 60); connection notes ≤200 characters (≤300 only if the marketer said paid).
- At most 6 touches per person; one ask per message; no calendar link to a stranger in touch 1; no attachment; at most one link.
- No banned words or openers (email-craft.md § Hard rules); nothing about us in the first sentence.
- Follow-ups each add something new; LinkedIn text differs from the email.
- Swap test: swap two rows' first lines — if they still fit, they're generic; rewrite.

**The pack**
- The brand copy holds no person's name, company or first line.
- write-report §3 passes; its first move is who to send to first and why (with no list, that there is no one yet). Outside tools the marketer runs (an email finder, a checker, a sending tool) may be named as examples, never endorsed.
- The send file imports: header row, one subject and body column per touch, no merged cells, UTF-8.
