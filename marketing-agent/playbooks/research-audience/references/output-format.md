# Output format

Load at steps 3 (sample rows), 7 and 8.

## `list.csv` columns (in this order; one row per person)

`row_type, rank, tier, value_tier, value_evidence, fit_score, fit_reason, segment, persona_role, first_name, last_name, title, title_source_url, title_seen_date, profile_url, email, email_status, email_source, other_contact_route, company, domain, account_id, employees, employees_source, industry, person_location, region_flag, signal_1, signal_1_url, signal_1_date, signal_2, signal_2_url, signal_2_date, hook, hook_url, warm_path, notes, sources, retrieved_date`

- `region_flag`: `EU-UK:<country>` (check national rule), `UK-soletrader: consent needed`, `CASL`, `AU-NZ`, `US`, `other:<country>` (check local rule). `title_source_url` may be a `search-headline (<date>)`.
- `row_type`: `person` or `account` (chains' portal or buying-office row, with any confirmed buyers as person rows under the same `account_id`; independent shops with a published inbox, IG, or — UK sole traders — a visit/letter address).
- Retail lists add `doors, price_tier, stocks_competitor, review_window` after `industry`.
- Tier C rows go to `dropped.csv` with their reason; after a verifier pass, catch-alls move to `catch-all.csv`.
- `warm_path`: only from what the human supplied (connections export, investor list, customer champion); blank otherwise.
- Plain CSV, UTF-8, header row, no merged cells — imports into common CRMs and outreach tools.
- `dropped.csv`: `company, domain, person (if any), stage dropped, reason`.

## `summary.md` (what the human reads first)

```
Do this first, because…: send to S1 this week — hiring for the pain is the strongest live signal, and 6 of its 14 accounts are V1.

List: <name> · built <date> · for <motion>
Delivered: 41 people at 23 accounts (asked: 50). Contactable by email: 33 published or pattern-evidenced; 8 other route only (LinkedIn / IG / phone / portal / visit / letter).
Why short: the universe is thin — ~140 accounts match the definition in US/CA; 22 were customers or open deals.
Before you send: run the `email` column through your email checker and paste the results back — I will drop failures and re-issue the counts. One line per flag present — EU-UK (6): check the national rule before sending (some countries need consent even for B2B), give an opt-out and a source notice; Germany/Austria excluded as agreed. CASL (4) and AU-NZ: send only to addresses whose published source is recorded (no "no unsolicited messages" note); identify yourself and include a working unsubscribe. DMs follow the same rules as email. UK-soletrader (3): no email or cold DM — visit or letter; phone only where the TPS check in `notes` is clear. other:<country>: check the local rule. US: CAN-SPAM at send time (true headers and subject, a physical address, an opt-out honoured within 10 business days).

Funnel: 212 screened → 96 passed gates → 141 people → 58 contactable → 41 delivered.
Accounts dropped (116): 58 size outside band · 22 customer/open deal · 9 subsidiary of a listed parent · 27 could not confirm NetSuite.
People dropped (100): 12 left the company · 3 ex-competitor staff · 6 recruiters/consultants · 62 no contact route · 17 failed the QA re-check or the concentration cap.

Segments — three-line angle each (pain → proof → ask):
S1 Hiring AP staff (14; 6 V1)
  Pain: the AP team is growing faster than the process — every new hire adds manual matching.
  Proof: proof needed — a signed-off customer result on invoice time would do (none on file).
  Ask: "Worth 15 minutes before the next AP hire starts?"
S2 New finance leader <90 days (11)
  Pain: a new leader inherits month-end pain and resets tooling in the first quarter.
  Proof: <a signed-off claim, verbatim> — or "proof needed: <what would do>".
  Ask: a short teardown of their current close process.
S3 Switched to NetSuite (9) · S4 Fit, no live signal (7 — send after S1–S3 perform) …

Each angle is situation and angle only; the proof line is a signed-off claim (claims gate) or says what proof is missing — never an invented number.

Credits: sample 61 of the 70 you approved; full build 351 of the 400 you approved.
Re-check anything you haven't sent by <recheck_by date>.
How this list was built: public company pages, public profiles, job boards and press found by web search on <dates>; no purchased data; purpose: B2B outreach about <product>. Keep this note with the list.
```

## Sample rows (FICTIONAL — the bar, not data; never reuse these values)

| tier | score | person | company | fit_reason | signal | hook | email_status |
|---|---|---|---|---|---|---|---|
| A | 88 | Dana Ruiz, Controller | Brightfold (brightfold.example), 640 staff, US | Gates passed: US, 640 staff (company page 2026-10-14), not a customer. Account: wholesale distributor mid-band (+20). Persona: Controller owns AP, team page (+20). Tech: NetSuite named in a finance job post, not AP's own (+8). Timing: hiring 2 AP specialists, posted 2026-10-02, live 2026-10-15 (+40). | "2× AP Specialist roles open since 2026-10-02" [url] | Posted 2026-09-28 about month-end close taking 9 days [url] | published (brightfold.example/team) |
| A | 81 | Sam Okafor, VP Finance | Harlow Freight, 900 staff, US | Gates passed… Account: core band (+22). Persona: economic buyer (+20). Tech: NetSuite on the integrations page (+12). Timing: started as VP Finance 5 weeks ago, from a NetSuite shop (+27). | "New VP Finance since 2026-09-11" [url] | Spoke on a CFO podcast about "killing paper invoices" 2026-09-19 [url] | pattern-guess (first.last, evidenced by jo.lin@harlowfreight.example on the press page) |
| B | 48 | Lee Tan, Finance Ops Manager | Corvel Goods, 310 staff, US | Gates passed… Account: lower band (+18). Persona: champion (+20). Tech: NetSuite in a job post (+10). Timing: none live (0) — tier B on fit ≥45/60. | none | none found | none — LinkedIn route only |

What makes these good: every number is sourced and dated; the reason names the gates and the points; the signal says why *now*; the hook is a fact tied to the pain; the email status says exactly how much to trust the address.
