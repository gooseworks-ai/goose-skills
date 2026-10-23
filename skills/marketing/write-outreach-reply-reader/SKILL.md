---
name: write-outreach-reply-reader
description: >-
  Step of the write-outreach playbook: sorts outreach replies by type, matches each to its prospect
  row, sets that person's status and keeps useful exact words. Run write-outreach instead; not for
  direct use.
version: 0.1.0
---

# reply-reader

**Reads:** the replies the marketer pasted or uploaded; `research/audience/ledger.csv`; the pack the replies answer (`outreach/<D>-<slug>/pack.md`); [`../write-outreach/references/replies-and-objections.md`](../write-outreach/references/replies-and-objections.md).

**Does:**
1. For each reply: the category (`interested · send-info · question · timing · using-rival · price · wrong-person · not-interested · how-did-you-get-this · no-show · stop · angry · out-of-office · bounce`), which touch it answered, and the person's exact words that matter (an objection, a pain phrase, a named rival, a date).
2. Match to the ledger row by email, then profile URL, then name + root domain (outcomes-ledger's keys). Unmatched replies are shown back, never guessed onto a row — a `stop`, `angry` or `bounce` from an unknown address gets a suppression-only row holding just its `key_hash`, the reason and the date (outcomes-ledger § Suppression without personal data); keeping the raw address needs the marketer's yes. The matched rows' `sequence_id` tells which pack the replies belong to.
3. The status it gives (replies-and-objections.md table): `replied`, `meeting`, `not-a-fit`, `unsubscribed`, `do-not-contact`, `bounced` — and `recontact_after` for `timing`. `stop`, `angry` and `bounce` are permanent suppressions.
4. One reply → hand back for the draft answer. A batch → counts by category, by touch and by segment for reading-results.md.
5. Pain phrases worth keeping → a request line in this pack's `results-working.md` (`Quote needed: for research-audience · <phrase, segment, date> · return to: outreach/<D>-<slug>/results-working.md`), with no name or email. Unnamed referrals → `Find needed:` lines there too.

**Writes:** the ledger through the `outcomes-ledger` skill (`../outcomes-ledger/SKILL.md`) (`entity: person`, statuses only from the replies the marketer gave — never inferred), and the category counts.

**Rules:** never mark anyone `contacted` or `replied` on inference; never draft a pitch to a `stop` or `angry` reply; no names, emails or reply text in the brand brain — counts and anonymised phrases only.
