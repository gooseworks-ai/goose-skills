---
name: reply-reader
description: >-
  Hidden step of write-outreach. Reads one reply or a batch of outbound replies, puts each in a reply category, matches it to its
  ledger row, says the status it gives, and pulls out the exact words worth keeping. Never contacts anyone. Never listed.
---

# reply-reader

**Reads:** the replies the marketer pasted or uploaded; `research/audience/ledger.csv`; the pack the replies answer (`outreach/<D>-<slug>/pack.md`); [references/replies-and-objections.md](../../references/replies-and-objections.md).

**Does:**
1. For each reply: the category (`interested · send-info · question · timing · using-rival · price · wrong-person · not-interested · how-did-you-get-this · no-show · stop · angry · out-of-office · bounce`), which touch it answered, and the person's exact words that matter (an objection, a pain phrase, a named rival, a date).
2. Match to the ledger row by email, then profile URL, then name + root domain (outcomes-ledger's keys). Unmatched replies are shown back, never guessed onto a row.
3. The status it gives (replies-and-objections.md table): `replied`, `meeting`, `not-a-fit`, `unsubscribed`, `do-not-contact`, `bounced` — and a re-contact date for `timing`. `stop`, `angry` and `bounce` are permanent suppressions.
4. One reply → hand back for the draft answer. A batch → counts by category, by touch and by segment for reading-results.md.
5. Pain phrases worth keeping → a request line in this pack's `results.md` (`Quote needed: for research-audience · <phrase, segment, date> · return to: outreach/<D>-<slug>/results.md`), with no name or email. Unnamed referrals → `Find needed:` lines there too.

**Writes:** the ledger through `../../../../atoms/outcomes-ledger/ATOM.md` (`entity: person`, statuses only from the replies the marketer gave — never inferred), and the category counts.

**Rules:** never mark anyone `contacted` or `replied` on inference; never draft a pitch to a `stop` or `angry` reply; no names, emails or reply text in the brand brain — counts and anonymised phrases only.
