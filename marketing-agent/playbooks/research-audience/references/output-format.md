# Output format

Load at steps 4–6 (rows, report) and 8 (re-delivery).

## `list.csv` columns (in this order; one row per person)

`row_type, rank, tier, value_tier, value_evidence, fit_score, fit_reason, segment, persona_role, first_name, last_name, title, title_source_url, title_seen_date, profile_url, email, email_status, email_source, other_contact_route, company, domain, account_id, employees, employees_source, industry, person_location, region_flag, signal_1, signal_1_url, signal_1_date, signal_2, signal_2_url, signal_2_date, hook, hook_url, warm_path, notes, sources, retrieved_date`

- `region_flag`: `EU-UK:<country>` (check national rule), `UK-soletrader: consent needed`, `CASL`, `AU-NZ`, `US`, `other:<country>` (check local rule). `title_source_url` may be a `search-headline (<date>)`.
- `row_type`: `person` or `account` (chains' portal or buying-office row, with any confirmed buyers as person rows under the same `account_id`; independent shops with a published inbox, IG, or — UK sole traders — a visit/letter address).
- Retail lists add `doors, price_tier, stocks_competitor, review_window` after `industry`.
- Tier C rows go to `dropped.csv` with their reason; after a verifier pass, catch-alls move to `catch-all.csv`.
- `warm_path`: only from what the human supplied (connections export, investor list, customer champion); blank otherwise.
- Plain CSV, UTF-8, header row, no merged cells — imports into common CRMs and outreach tools.
- `dropped.csv`: `company, domain, person (if any), stage dropped, reason`.

## `report.md` — the deliverable (what the marketer reads first)

Write it so a founder can act on it without opening the CSV. Every fact has a date and a link and is labelled **fact** or **inference**. Fictional example below — never reuse its values.

```
# Prospect report — <Brand> — <YYYY-MM-DD>

## Do this first, because…
Send to the 6 V1 agencies in S1 this week: each posted a sourcer or recruiter role in the last 14 days (links below) — they are feeling the pain now, and job posts go stale in ~45 days.

## Timely openings (live this week)
- Brightfold Talent — hiring 3 sourcers, posted 2026-10-09 [link] · fact. For you: lead with the sourcing-hours angle; Dana Ruiz (Head of Delivery) is the route.
- Harlow Search — new MD started 2026-09-28 [link] · fact. For you: new leaders reset tooling in their first quarter — ask for a teardown of their sourcing stack.

## The list in one paragraph
41 people at 23 accounts (asked: 50). 12 from free sources fully confirmed; 29 need a title check — the top-up below confirms them. Universe: ~140 agencies match in US/UK (inference from directory counts [link]). Contactable by email: 18 published · 15 pattern-backed · 8 other route only (LinkedIn / phone / portal).

## Who we're pitching (draft definition — correct anything marked assumed)
- Motion: founder-led outbound · List unit: agency × buying committee · sourced: juicebox.ai/customers [link]
- Agencies: tech and healthcare staffing, 10–200 recruiters, US/UK · assumed (from customer logos)
- Buyers: Head of Delivery / Talent (champion), Founder or MD under 50 staff (buyer) · assumed
- Account value: V1 = 50+ recruiters (team plan) · V3 = under 10 · assumed (pricing page [link])
- Out: current customers, rival vendors' staff, Germany/Austria, DNC list (none on file)

## Segments — angle and For you
### S1 Hiring sourcers now (14; 6 V1)
- Pain: their team is growing faster than their sourcing hours — every new hire adds manual search. (inference from 14 live job posts)
- Proof: you'd need proof of a time saving first — e.g. one customer's hours per hire (none signed off).
- Ask: "Worth 15 minutes before the new sourcers start?"
- For you: fits — our product replaces exactly the search work these roles do (product page [link]). Send first; V1 accounts get 3 people each.
### S2 New leader <90 days (11) …
### S3 Fit, no live signal (7 — send after S1–S2 perform) …

## You vs them
- 5 accounts post jobs naming a rival sourcing tool [links]. Ahead: <signed-off differentiator, or "you'd need proof of X first">. Behind: <what rivals offer we don't, from their pages>. Everyone says "AI sourcing" — don't lead with it.

## What we dropped and why
Accounts (116): 58 size outside band · 22 customer/open deal · 9 subsidiary of a listed parent · 27 could not confirm the trigger.
People (100): 12 left the company · 3 ex-rival staff · 6 recruiters/consultants · 62 no contact route · 17 failed QA or the concentration cap.

## Before you send
Run the `email` column through your own email checker and paste the results back — I'll drop failures and re-issue the counts. One line per region flag present (EU-UK: check the national rule; CASL and AU-NZ: send only to addresses whose published source is recorded; UK sole traders: no email or cold DM — visit or letter; US: CAN-SPAM at send time).

## What we could not read
- Titles hidden on 29 public profiles (the top-up confirms them) · LinkedIn people search beyond public pages · 4 agency sites blocked automated reading.

## How this list was built
Public company pages, public profiles, directories, job boards and news, read on <dates>; no purchased data; purpose: B2B outreach about <product>. Keep this note with the list. Re-check anything unsent by <recheck_by>.
```

## Sample rows (FICTIONAL — the bar, not data; never reuse these values)

| tier | score | person | company | fit_reason | signal | hook | email_status |
|---|---|---|---|---|---|---|---|
| A | 88 | Dana Ruiz, Controller | Brightfold (brightfold.example), 640 staff, US | Gates passed: US, 640 staff (company page 2026-10-14), not a customer. Account: wholesale distributor mid-band (+20). Persona: Controller owns AP, team page (+20). Tech: NetSuite named in a finance job post, not AP's own (+8). Timing: hiring 2 AP specialists, posted 2026-10-02, live 2026-10-15 (+40). | "2× AP Specialist roles open since 2026-10-02" [url] | Posted 2026-09-28 about month-end close taking 9 days [url] | published (brightfold.example/team) |
| A | 81 | Sam Okafor, VP Finance | Harlow Freight, 900 staff, US | Gates passed… Account: core band (+22). Persona: economic buyer (+20). Tech: NetSuite on the integrations page (+12). Timing: started as VP Finance 5 weeks ago, from a NetSuite shop (+27). | "New VP Finance since 2026-09-11" [url] | Spoke on a CFO podcast about "killing paper invoices" 2026-09-19 [url] | pattern-guess (first.last, evidenced by jo.lin@harlowfreight.example on the press page) |
| B | 48 | Lee Tan, Finance Ops Manager | Corvel Goods, 310 staff, US | Gates passed… Account: lower band (+18). Persona: champion (+20). Tech: NetSuite in a job post (+10). Timing: none live (0) — tier B on fit ≥45/60. | none | none found | none — LinkedIn route only |

What makes these good: every number is sourced and dated; the reason names the gates and the points; the signal says why *now*; the hook is a fact tied to the pain; the email status says exactly how much to trust the address.
