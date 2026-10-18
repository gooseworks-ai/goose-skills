# Output format

List mode only. Load at list-mode steps 4–5 (rows) and when writing the list section.

## `list.csv` columns (in this order; one row per person)

`row_type, rank, tier, value_tier, value_evidence, fit_score, fit_reason, segment, persona_role, first_name, last_name, title, title_source_url, title_seen_date, profile_url, email, email_status, email_source, other_contact_route, company, domain, account_id, employees, employees_source, industry, person_location, region_flag, signal_1, signal_1_url, signal_1_date, signal_2, signal_2_url, signal_2_date, hook, hook_url, warm_path, notes, sources, retrieved_date`

- `region_flag`: `EU-UK:<country>` (check national rule), `UK-soletrader: consent needed`, `CASL`, `AU-NZ`, `US`, `other:<country>` (check local rule). `title_source_url` may be a `search-headline (<date>)`.
- `row_type`: `person` or `account` (chains' portal or buying-office row, with any confirmed buyers as person rows under the same `account_id`; independent shops with a published inbox, IG, or — UK sole traders — a visit/letter address).
- Retail lists add `doors, price_tier, stocks_competitor, review_window` after `industry`.
- Tier C rows go to `dropped.csv` with their reason; after a verifier pass, catch-alls move to `catch-all.csv`.
- `warm_path`: only from what the human supplied (connections export, investor list, customer champion); blank otherwise.
- Plain CSV, UTF-8, header row, no merged cells — imports into common CRMs and outreach tools.
- `dropped.csv`: `company, domain, person (if any), stage dropped, reason`.

## The list in the report

List mode adds one section to the audience report (shape: `audience-research.md` §9; rules: `../../../atoms/write-report/ATOM.md`). Write it for the founder: plain words, no codes. Say segments and tiers in words ("agencies hiring sourcers now", "top accounts"), never "S1" or "V1" — those labels live only in the CSV.

```
## The list: 41 people to pitch at 23 agencies
**Send first:** the six largest agencies hiring sourcers right now — each posted the role in the last 14 days ([links](…)).
- Found 41 of the 50 asked: the market is thinner than it looks — about 140 agencies match in the US and UK.
- Email: 18 printed on the agency's own site, 15 built from a pattern we saw there, 8 reachable only on LinkedIn or by phone. None is checked yet — run them through your email checker first.
- Angle for the hiring group: *their pain* — every new hire adds manual search; *proof* — you'd need a customer's hours saved first; *ask* — "worth 15 minutes before the new sourcers start?"
- Before you send: EU/UK rows need the local rule checked; Canada and Australia only to addresses printed on their own pages; UK sole traders by letter or visit, never cold email.
- The full list with sources: [list.csv](…)
```

## Sample rows (FICTIONAL — the bar, not data; never reuse these values)

| tier | score | person | company | fit_reason | signal | hook | email_status |
|---|---|---|---|---|---|---|---|
| A | 88 | Dana Ruiz, Controller | Brightfold (brightfold.example), 640 staff, US | Gates passed: US, 640 staff (company page 2026-10-14), not a customer. Account: wholesale distributor mid-band (+20). Persona: Controller owns AP, team page (+20). Tech: NetSuite named in a finance job post, not AP's own (+8). Timing: hiring 2 AP specialists, posted 2026-10-02, live 2026-10-15 (+40). | "2× AP Specialist roles open since 2026-10-02" [url] | Posted 2026-09-28 about month-end close taking 9 days [url] | published (brightfold.example/team) |
| A | 81 | Sam Okafor, VP Finance | Harlow Freight, 900 staff, US | Gates passed… Account: core band (+22). Persona: economic buyer (+20). Tech: NetSuite on the integrations page (+12). Timing: started as VP Finance 5 weeks ago, from a NetSuite shop (+27). | "New VP Finance since 2026-09-11" [url] | Spoke on a CFO podcast about "killing paper invoices" 2026-09-19 [url] | pattern-guess (first.last, evidenced by jo.lin@harlowfreight.example on the press page) |
| B | 48 | Lee Tan, Finance Ops Manager | Corvel Goods, 310 staff, US | Gates passed… Account: lower band (+18). Persona: champion (+20). Tech: NetSuite in a job post (+10). Timing: none live (0) — tier B on fit ≥45/60. | none | none found | none — LinkedIn route only |

What makes these good: every number is sourced and dated; the reason names the gates and the points; the signal says why *now*; the hook is a fact tied to the pain; the email status says exactly how much to trust the address.
