# Contacts, email status and compliance

Load at list-mode step 5 and in the QA pass. The rule that protects the human: **a bounced list burns their sending domain.** A few percent of hard bounces trains inbox providers to route the domain to spam; every later send then fails, good contacts included, and recovery takes weeks. Padding the list to hit a number is the worst thing this playbook can do.

## Picking the people inside an account

| Company size | Who to pick |
|---|---|
| Under 50 staff | Founder/CEO or the person who owns the function |
| 50–250 | VP or Head of the function |
| 250–2,000 | Director/Head **plus** a hands-on manager as champion |
| 2,000+ | Director or Senior Manager — never the C-suite cold |

- 1–3 people per account, in **different** roles (champion feels the pain daily; economic buyer owns the budget; for retail, the category buyer and sometimes the merchandise planner). Never two peers on the same team — they compare inboxes.
- Concentration cap: max 3 per account, max ~10% of the list from one parent company.
- Rows from the same account share an `account_id` so the human can stagger contact.

## Confirming the person is real and current

- Current employer and title from a dated public source (company team page, press, conference speaker page, a recent post signed with the title, the public profile). Public profiles often hide titles; a **search-result headline** (the title line a search shows for the profile) is acceptable when dated — label it `search-headline (<date>)` and score persona lower. No dated source at all → drop.
- Profiles lag job changes by months. If two sources disagree, the newer dated one wins; if you cannot tell, drop.
- Drop: third-party recruiters and consultants who don't work for the account, "fractional", "advisor", interns, "ex-" titles, agency staff whose title names the client brand, the seller's own staff, competitor staff, anyone at an excluded domain. (Selling *to* recruiting firms: their recruiters and sourcers are the buyers — keep them.)
- A title on the company's own current team page counts as seen on the date you read it (`company page, read <date>`); an undated third-party page does not.
- Title-keyword traps: "Account Executive" is not finance; "Head of Growth" at a 3-person company is a founder.
- Location is the **person's** location, not the company HQ (it drives the region flag).

## Contact route and email status

Every row gets a contact route. **`email` holds only an address a checker passed** (`verified-by-tool`) — so a list imported into a sending tool can never send to an unchecked address. Published and pattern-built addresses go in **`email_candidate`** with their `email_status` until checked. Other routes go in `other_contact_route` (LinkedIn profile, company contact form, buying-office inbox or portal, a business's published main phone line only (never a personal or mobile number; US numbers checked against the Do-Not-Call rules by the human; UK after a TPS/CTPS check), IG/DM for small shops, visit/letter):

| Status | Meaning | Where it goes |
|---|---|---|
| `verified-by-tool (<checker>, <date>)` | A checker said valid — the connector's email check, or the human's checker results. Two checkers agreeing → note "two checks". | Main list, sendable |
| `published (<url>)` | The exact address is printed on a public page (company site, press release, filing, speaker page, link-in-bio). Still verify before sending. | `email_candidate`, "check before sending" |
| `pattern-guess (unverified)` | Built from the domain's pattern, and **only** when at least one published address at the same domain shows that pattern (cite it). One example → label `pattern-guess (one example)`, lower confidence; two or more matching examples → `pattern-guess`. | `email_candidate` only; never counts as verified; never sent unchecked |
| `catch-all` | Verifier says the domain accepts everything — unconfirmable | `catch-all.csv`; send only in small batches after valid sends perform |
| `none` | No email route found | Keep only if another route exists (LinkedIn, contact form, buying inbox, phone, IG/DM for small shops) |

Never: personal webmail (gmail, outlook.com…) for a person at a company with its own domain; role addresses (info@, sales@) for person-level rows at companies with a named buyer; anything behind a login or against a site's terms; a guessed address with no pattern evidence.

Account-level rows: **independent shops and small venues** (one owner, roughly ≤10 staff) — the shop's own published inbox (`hello@shop.com`, or a published webmail address in the bio, link-in-bio page or contact page, `published (<url>)`) or IG/DM is the primary route — except UK sole traders and partnerships (visit or letter; phone after a TPS check — below); add the owner's name only when a dated source names them. **Chains** — the buying-office inbox or vendor portal on the account row, plus 1–2 person rows for a dated, confirmed category buyer unless the vendor page says portal-only.

**The verification loop.** When the connector can check addresses, the run checks every address itself before handover ([data-sources.md](data-sources.md) § When the contact routes exist). Until then, at handover, tell the human exactly which column to run through their checker (any common tool) and to paste or upload the result. Either way: `valid` → the address moves from `email_candidate` to `email`, status `verified-by-tool`; catch-alls → `catch-all.csv`; `invalid` → address dropped (the row stays only with another route); `unknown` → not sendable, re-check later; then re-issue the counts. Only verified rows count toward "people you would email" for sending.

Benchmarks (approximate, industry practice): hard bounces under 2% per send (aim under 1%); spam complaints under 0.3% (the Google/Yahoo bulk-sender line), aim under 0.1%; roughly 20–35% of B2B domains are catch-all; B2B contact data decays about 2–3% a month (25–30% a year), so re-check anything older than 30–60 days before sending.

## Compliance flags (set per row; the human decides)

This playbook gives flags and the reason, not legal advice.

- **Provenance on every row**: source URLs and retrieved date. Add a one-paragraph "how this list was built" note to the report for the human's records (sources, date, purpose).
- **EU / EEA / UK / Switzerland** — flag `EU-UK` with the country. Two layers apply: GDPR governs holding the data (legitimate interest, Art. 6(1)(f): relevant to the person's role, minimal data, an easy opt-out, and telling the person where their data came from — Art. 14); each country's **ePrivacy rules govern the email itself**, and they differ — several countries require prior consent even for B2B email. Default for every EU row: "check the national rule before sending". **Germany and Austria**: consent-required — excluded by default unless the human says otherwise.
- **UK limited companies** — flag `UK-ltd`: B2B email to a corporate address is allowed with an opt-out and sender identity (PECR); GDPR still applies to holding the data. No "check the national rule" needed.
- **UK sole traders and partnerships** (many independent shops) count as individuals under PECR: cold email needs consent. To tell: search the free Companies House register for the business and **match on the registered address or an officer named on the shop's own site**, not on the name alone (trading names differ; an unrelated company can share the name). No matched limited company → treat it as a sole trader or partnership; a shop that publishes only a webmail address and has no matched company is a sole trader. Flag `UK-soletrader: consent needed`: PECR treats social-media DMs as electronic mail too, and sole traders can register with the TPS (the UK do-not-call list). So the route is **a visit or a letter**; phone only after a TPS check recorded in `notes`; IG is for following and engaging, never a cold pitch DM. Leave `email` blank (any published address goes in `notes`), and keep these rows out of the "contactable by email" and sendable counts. Limited companies with corporate addresses: B2B email with an opt-out. Any UK phone route: a TPS (sole traders) or CTPS (companies) check, recorded in `notes`.
- **Canada** — flag `CASL`. Cold email needs consent; the implied-consent exception covers only addresses conspicuously published without a "no solicitation" note, where the message matches the person's role. Record where the address was published. A Canadian `pattern-guess` is never sendable (not conspicuously published) — give that person a LinkedIn or other route, or drop them.
- **Australia / New Zealand** — flag `AU-NZ`, treated like CASL: the Spam Act 2003 (AU) and the UEM Act (NZ) require consent; it can be inferred only where the address is conspicuously published, with no "no unsolicited messages" statement next to it, and the message fits the person's role. At send time both require the sender identified and a working unsubscribe. Record where it was published. A `pattern-guess` is never sendable — give another route or drop.
- **Any other country** — flag `other:<country>` and put "check the local rule before sending" in the summary.
- **DMs are electronic messages too.** An IG or LinkedIn DM pitch inherits the row's region rule (EU-UK national rule, UK sole traders, CASL, AU-NZ), exactly as an email would.
- **US** — `CAN-SPAM` applies at send time (truthful headers and subject, a physical address, a working opt-out honoured within 10 business days). Flag `US` on the row; note it in the summary.
- **Private individuals** (donors, residents, consumers) are not B2B contacts — this playbook does not build lists of them.
- **Suppression**: the human's do-not-contact list and anyone who unsubscribed in past outcomes are excluded on every run, forever.
