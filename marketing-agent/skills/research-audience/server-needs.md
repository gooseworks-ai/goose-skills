# server-needs — research-audience

What this playbook needs that the customer's GooseWorks connector does not have. Checked against gooseworks-app `origin/dev` (a31cc243d, 19 Oct 2026) and the staging tool list. Ordered by priority. Each: the need, the exact ask, and what the playbook does meanwhile.

## The core gap: the lead routes exist, but not on the connector

The server already proxies people search, email finding and email checking for the CLI (`POST /v1/proxy/orthogonal/run {api, path, body?, query?}` and `/v1/proxy/{apollo,fiber,crustdata,pdl}/*`, in `apps/api/src/routes/proxy.route.ts`; prices in `apps/api/src/services/orthogonal.service.ts`). The connector the playbooks use, `data_call_provider` / `data_post_provider`, accepts only `scrapecreators`, `fal` and `elevenlabs` (`providerEnum` in `apps/api/src/app-mcp-server/mcp-tools/files/schemas.ts`). So a list is built from public pages at ~13–20 lookups per person, and no address can be checked.

### The ask (in this order)

| # | Add to `data_call_provider` | Allow only these paths | Why this order | Price today (orthogonal.service.ts) |
|---|---|---|---|---|
| 1 | **Email verify** — provider `hunter` and `tomba` (or one `orthogonal` provider with a path allow-list) | hunter `GET /v2/email-verifier?email=`; tomba `GET /v1/email-verifier?email=`; fiber `POST /v1/validate-email/single` | A bounced list burns the customer's sending domain. Verifying addresses we already have is the cheapest, safest win, and it removes the "run your own checker" step | Not in the fixed table → returned `priceCents` + 10%, or the 2-credit fallback; fiber $0.02 fixed (~3 credits) |
| 2 | **Work-email find** for a named person at a domain | tomba `GET /v1/linkedin?url=` (no `enrich_mobile`); tomba `GET /v1/email-finder`; hunter `GET /v2/email-finder`; sixtyfour `POST /find-email` with `mode: "PROFESSIONAL"` only; aviato `/person/email` | Turns "LinkedIn only" rows into contactable rows | tomba LinkedIn $0.01 (~2 credits); sixtyfour $0.05 (~6); aviato $0.04 (~5); others unverified |
| 3 | **People search** by title, function, seniority, company size, industry, geography | aviato `POST /person/search`, `/person/simple/search`; fiber `POST /v1/people-search`, `/v1/natural-language-search/profiles` | The speed old users came for: a count and a sample before paying for reveals | aviato $0.02 flat (~3 credits); fiber $0.02 × pageSize (25 → 60 credits) |
| 4 | **Company search** | fiber `/v1/natural-language-search/companies`; hunter `POST /v2/discover` | Accounts at scale for broad lists | fiber varies; hunter unverified |

**Never allow:** apollo `mixed_people/api_search` (deprecated in `mcp-server/tool-tiers.ts`: returns obfuscated names); any `enrich_mobile`, phone-finder or `mode: "PERSONAL"` path (no personal emails or phones — legal risk, and our rules forbid them); LinkedIn reactions or commenters.

**With it, also:**
- Return `cost.credits` on every answer, as scrapecreators answers do — the playbook logs it and stops at the ceiling.
- **A free quote** for these paths: extend `data_price_provider` with the fixed and per-page table in `orthogonal.service.ts` (or a `quote_only` flag), so the one credit yes shows a real number, not an estimate.
- Never write an email address or a person's name into server logs that the brand can see; the playbook's credits log records the query kind only.

### Approval and cost rules the playbook will follow when these exist

- **One yes to a ceiling**, per the `spend-gate` skill (proxy branch): "up to N credits for <what>", estimated from the credits log or a probe inside the ceiling; stop at it; log every charge.
- **Search before reveal:** people search returns a count and a sample first; the marketer sees "≈4,800 match; here are 10" before any per-person spend.
- **Cheapest route first, stop early:** for each account, the cheapest finder first; stop at three good people per account and at the first found address the checker passes; one checker by default, a second only on `unknown`. Verify every address before it is called sendable.
- **Verify status meanings** (hunter): `valid` → sendable; `accept_all` → catch-all, small batches only; `unknown` → not proof of invalid, re-check later; `invalid` → drop. Disposable or webmail flags → drop for person rows at companies with their own domain. Two checkers agree → high confidence.
- **Nothing personal:** work addresses only; no phones; no personal webmail for people at companies with a domain.

### Meanwhile (works honestly today)

Public pages first (team pages, press, speaker pages, profile headlines in search results, published addresses); `pattern-guess` only with a published address at the same domain as evidence; every address labelled by how far to trust it; the marketer runs their own checker and pastes results back, which the playbook merges (`contacts-and-compliance.md` § The verification loop). Paid LinkedIn profile and company reads (scrapecreators) confirm titles in the approved top-up.

## Other needs

| # | Need | Step | Meanwhile |
|---|---|---|---|
| 5 | **Job-change and hiring feeds** (role changes for named people; job posts by company and function) | Watches, signals | Champion watch through the paid LinkedIn profile read (snapshot, then compare), only for the champions list (public praise under their own name, or people the marketer named); hiring through careers pages and job boards via web search. |
| 6 | **Scheduled runs with an enforced credit ceiling** — `automation_upsert` jobs have no spend-limit field | Watches | Per spend-gate's automation rule: created paused; the yes names a standing per-run ceiling; the ceiling lives in the job prompt. |
| 7 | **A lists / contacts store in the product** (rows, statuses, suppression every playbook respects) | List, ledger | Files in the brand coworker workspace (`research/audience/`). Risk: with no coworker, a teammate can't see the ledger. Personal data never goes to the brain. |
| 8 | **CRM read** (customers, open deals, past contacts) for exclusions and inbound scoring | Before you start, score-a-list | The marketer uploads or pastes an export. |
| 9 | **Web page reading through the proxy** for hosts with no web tool | Free pass | Host web tools; hosted chat without them gets thinner lists, said plainly. |
| 10 | **Fresh firmographics and funding** | Signals | Funding counts only with a dated press source, never alone. |
| 11 | **A sending layer** (domains, warm-up, sequences, reply handling) | — | Out of scope. write-outreach drafts; the marketer sends from their own tool. GooseWorks' @agentmail.to inbox is not a cold-email sender. |
