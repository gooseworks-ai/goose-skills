# Hand-off, sending checklist and country rules

Load at steps 6–7. The playbook writes; the marketer sends from their own mailbox and tool. These rules are flags and the reason, not legal advice.

## The whole path (in the pack, once, short)

Print this table in the pack when there is no list or it is the brand's first pack, ticking what is already done. Steps 2 and 4 are the ones first-timers miss.

| # | Step | I do | You do |
|---|---|---|---|
| 1 | Who, offer, proof | buyer groups, the angle per group, proof lines for your OK | approve the proof lines; pick the sender |
| 2 | **Mailboxes — start on day 1** | the setup list (checklist point 2) | a separate sending domain close to your brand name, SPF, DKIM and DMARC set, each mailbox warmed 2–4 weeks before cold sends |
| 3 | Accounts | right-fit companies, each with a dated reason | aim for **300–500 accounts** for a test you can read: at 2–4% positive replies, 41 people is about one reply |
| 4 | **People and emails** | the buyer at each account (name, title, LinkedIn) | find work emails with an email finder (such as Apollo or Hunter), check every one with a checker (such as ZeroBounce or NeverBounce), paste the results back |
| 5 | Copy | sequences, a first line per person, reply answers | correct the 3–5 sample first lines |
| 6 | Load | the send file in the import shape below | import it, set stop-on-reply, start slow (checklist point 3) |
| 7 | Replies | a draft answer for each reply; a results read after ~100 sends | send the answers |

When the connector can find and check addresses (research-audience's contact routes), step 4's "you do" shrinks to approving the credit ceiling.

## The send file (`send.csv`)

One row per person, plain UTF-8 CSV with a header, no merged cells — imports into common outreach tools and CRMs:

`row_type, account_id, first_name, last_name, email, email_to_check, email_status, company, domain, title, linkedin_url (from list.csv's profile_url), other_contact_route, region_flag, timezone, start_day, segment, sequence_id, opener_id, first_line, subject_1, body_1, day_1, subject_2, body_2, day_2, subject_3, body_3, day_3, subject_4, body_4, day_4, connection_note, li_message_1, letter_body, notes`

- `row_type` `account` (a shop, a chain's buying office) has no first name — the greeting is to the shop or team. `start_day` staggers people at the same `account_id` a few days apart. `letter_body` is filled for `UK-soletrader` rows (the postal address is in `other_contact_route`).

- Every body is the **finished text** for that person (merge fields already filled), so no tool-specific merge syntax is needed; follow-ups that reply in-thread leave their subject blank.
- Email status comes straight from research-audience's `list.csv`:

| list.csv | send.csv |
|---|---|
| `email` filled, `email_status` = `verified-by-tool (…)` | `email` filled — sendable |
| `email_candidate` with `published (<url>)` or `pattern-guess (…)` | `email` **blank**, `email_to_check` = the address, note "check this address first" — drafts are written, nothing sends until it's checked |
| a row in `catch-all.csv` | `email` blank, `email_to_check` filled, note "catch-all: send only in a small batch after the checked addresses perform" |
| `none`, or a region rule that forbids email | no email bodies; LinkedIn or letter only |

- A filled `email` whose status isn't `verified-by-tool` is treated as unchecked: it moves to `email_to_check`.
- `row_type` `account-to-find` (accounts with no named person yet) get no sequence — they're listed in the pack as "people to find first".
- Fields with line breaks are quoted (standard CSV). In the tool, build each step from the columns (`{{subject_1}}`, `{{body_1}}`, delay `day_2 − day_1`); `timezone` lets it send in their working hours.
- Before writing: drop rows that are suppressed (match each row's hashed keys against the ledger's `key_hash`) or in cool-down in the ledger, de-duplicate on email (keep the first), and report the counts ("42 rows; 6 left out: 3 unsubscribed, 2 contacted in the last 12 weeks, 1 duplicate").
- **Gmail only, no tool:** the pack also lays out each touch per person in order, ready to paste, with the day to send it.
- The send file holds people's data: it's saved in the workspace and locally, **never imported into the brand brain**.

## Your sending tool (asked once, in the first pack's decisions)

The guide's rule "The marketer's own tools" (the `marketing-guide` skill (`../../marketing-guide/SKILL.md`) §3), applied here; asked in the decisions box with the first draft, never before it. The send file is the same CSV for every tool.
- **None yet** → two or three that fit, as their choice, never an endorsement: a founder sending a few hundred a month — a cold-email sending tool (such as Instantly, Smartlead or lemlist); a team with a CRM — its own sequences (such as HubSpot's). Gmail alone works for a small first batch ("Gmail only" above).
- **Named, and its connector is listed in this session** → read it, read-only, instead of asking: sent list, replies, bounces and unsubscribes for the results read; sending domains and daily limits for the checklist. Never send, schedule, import or change anything through it.
- **Named, not connected** → say once that connecting it would let you read sends and replies instead of asking for pastes; then work from pastes and exports.

## Before you send — the marketer's checklist (in the pack)

1. **Check every address** with an email checker before the first send (unless research-audience already marked it checked). Unknown and catch-all addresses go in small batches only after the valid ones perform.
2. **Use your own domain, warmed up.** Best: a separate sending domain or subdomain close to your brand name, with its own mailboxes; set SPF, DKIM and DMARC; warm each new mailbox for 2–4 weeks before cold sends. Never send cold email from a shared or new tool inbox (including GooseWorks' workspace inbox).
3. **Start slow:** a few new people a day, rising over weeks to the volume in point 6; stop if bounces pass 2% or anyone complains.
4. **Plain text, few links, no open tracking.**
5. **Every email carries** the sender's real name and company, a physical postal address, and a plain opt-out line ("Not relevant? Reply 'no' and I won't email again."). Honour opt-outs at once.
6. **Count emails, not people:** about 30–50 emails a day per warmed-up mailbox in total, follow-ups included. **Never cold-email from your main domain's mailboxes** — a burned reputation stops your normal mail too.
7. **Stop on reply:** set the tool to stop a person's sequence when they reply on any channel.
8. **Report back:** paste replies and numbers here after ~100 sends or two weeks.

## Country rules (from each row's `region_flag`)

| Flag | What the pack does |
|---|---|
| `US` | CAN-SPAM: truthful sender and subject, the message identifiable as a commercial message (a plain sales email is), a postal address, a working opt-out that keeps working for at least 30 days after sending and is honoured within 10 business days. Every email includes them. |
| `EU-UK:<country>` | GDPR for holding the data (legitimate interest: relevant to their role, minimal data). **In the first email**, a short line says where their details came from and that they can object ("I found your details on <company>'s team page; reply 'no' and I'll delete them") — Art. 14 and 21 require it at first contact, not only on request; each country's own rule for the email itself — several require prior consent even for business email. The pack says "check <country>'s rule before sending" and keeps the email modest and role-relevant. **Germany and Austria:** no cold email (research-audience excludes them by default); LinkedIn only if the marketer decides. |
| `UK-ltd` | B2B email to the company address with sender identity and an opt-out (PECR); GDPR still applies, so the first email carries the source-and-object line. |
| `UK-soletrader: consent needed` | No email and no cold DM — a **letter** template instead (same angle, postal format); phone only after a TPS check the marketer records. |
| `CASL` (Canada) | Only to addresses published conspicuously without a "no solicitation" note, with a message that fits their role; identify the sender and include an unsubscribe. A pattern-guessed address is never emailed. |
| `AU-NZ` | As CASL: only conspicuously published addresses, role-relevant message, sender identified, working unsubscribe honoured within 5 business days (AU). |
| `other:<country>` | "Check the local rule before sending." |
| unknown (rows with no country, e.g. a pasted list) | Treated as the strictest likely case: opt-out line, sender identity, the source-and-object line; the pack's checklist says which rules to check before sending. **The pack always prints a one-line country summary.** |

**DMs inherit the row's rule:** a LinkedIn message or DM pitch is an electronic message too in the UK, EU, Canada and Australia.

## The pack's last section

"How these were written": the list and date they came from, the sources of each first line (the row's signal URL and date), which proof lines were signed off and which were cut. For the marketer's records.
