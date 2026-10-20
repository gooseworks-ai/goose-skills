---
name: research-audience-people-and-contacts
description: >-
  For a list of companies, picks 1-3 current people per company in different buying roles, confirms
  each title with a dated source, finds a public contact route, labels email status honestly and flags
  regions with contact rules. Never contacts anyone. Use alone when you already have a vetted company
  list and the buyer titles; otherwise run research-audience.
version: 0.1.0
---

# people-and-contacts

**Reads:** passing accounts; personas and title synonyms; `../research-audience/references/contacts-and-compliance.md`; `../research-audience/references/data-sources.md`.

**Does:**
1. Free first, breadth before depth: for every kept account, get names and titles from the cheapest place first — the company's team, about and leadership pages, press releases, conference speaker pages, podcast guest pages, public profile headlines in web-search results (`"<title>" "<company>"`), the company's LinkedIn page's public people list. Paid profile reads only in the approved top-up, to confirm titles the free pass could not.
2. Pick by company size and role (champion + economic buyer; category buyer for retail). Max 3 per account, different roles.
3. Confirm current employer and title from a dated source (a dated search headline counts, labelled `search-headline`); if sources disagree, the newer wins; if unclear, drop. Chains → an account row with the vendor portal or buying-office route, plus 1–2 person rows (same `account_id`) for a category buyer confirmed by a dated source: LinkedIn route, email only if published or pattern-evidenced. Leave person rows out only when the retailer's vendor page says portal-only or not to contact buyers — note it in `notes`. Independent shops and small venues → one account-level row with the shop's published inbox (own-domain or published webmail) or IG/DM as the route; the owner's name only if a dated source gives it — an unnamed owner is not a reason to drop. Drop third-party recruiters and consultants (people who don't work for the account), fractional/advisor, interns, ex-, agency staff named for a client, competitor and own staff. When the account *is* a recruiting or staffing firm, its recruiters, sourcers and researchers are the users and champions — keep them.
4. Contact route — when the connector has email find and check, follow `../research-audience/references/data-sources.md` § When the contact routes exist (cheapest first, stop at the first found address the checker passes — one checker, a second only on `unknown` — never phones or personal modes). Otherwise: look for the exact work address on public pages (team page, press release, filing, speaker bio). Found → `email_candidate` with status `published (<url>)` (an address moves to `email` only after a checker passes it). Pattern-guess only when a published address at the same domain shows the pattern — cite it. A shop's own published webmail address counts as `published`. Otherwise record the best other route (LinkedIn, buying inbox, contact form, phone, IG for small shops).
5. Set the person's location and `region_flag`; exclude Germany/Austria by default unless the human said otherwise; flag UK sole traders/partnerships `UK-soletrader: consent needed` (Companies House check) and give them a visit or a letter as the route (`other_contact_route` = `visit/letter: <published shop address> (<url>)`) (phone only after a TPS check, noted; never a cold IG DM), with `email` blank; a Canadian or AU/NZ `pattern-guess` is not sendable — give another route or drop; other countries flagged `other:<country>`.

6. **Suppression check:** hash each person's keys the ledger's way (outcomes-ledger § Suppression without personal data) and drop any that match a suppressed `key_hash` — before any paid lookup on them.

**Writes:** people rows with title source and date, `email` (checker-passed only), `email_candidate`, `email_status`, `email_source`, `other_contact_route`, `person_location`, `region_flag`, `persona_role`.

**Rules:** never label an address verified unless a checker said so. Never use personal webmail or role addresses for people at companies with a named buyer (independent shops' published inboxes are the exception, as account rows), or anything behind a login.
