# Test by hand — research-audience

## Setup

1. Connect GooseWorks **staging** to your agent. Link this folder into your agent's skills folder (see the marketing-agent README).
2. Use the **Gooseworks** brand on staging (our own GTM) so the operator can judge fit from first-hand knowledge.

## The test

Ask: **"Find me 50 right-fit people with verified emails."**

It passes if, in order:

1. **Before any search** it reads the brand and plays back a finished fit definition — motion, list unit, firmographics, situation/trigger, personas with title synonyms, account value (asked: what a big vs small account is worth), disqualifiers, negative ICP, exclusions, list size — and waits for your yes. It asks for missing pieces (exclusions file, weekly capacity, geography) in **one** message, and does not invent an ICP or customers.
2. In the same message it asks a yes to spend: on a first run (nothing priced yet) one yes for a single probe read, and the "up to N credits" sample ask in the next message from its charge; with price history, "up to N credits" for the sample straight away, labelled an estimate. No paid lookup before your yes. It says up front that there is no email checker — and never names a tool, vendor or playbook to you.
3. It shows **five finished sample rows** and asks "right kind?", reports what the sample actually charged, and asks a yes to "up to N credits" for the full build.
4. It hands over the list and **stops**: nobody contacted, nothing sent, nothing written to a CRM.
5. Every row: (person rows) a dated source for the current title; a contact route; an honest `email_status` (no row says verified unless a verification tool said so), a fit score with a reason that names the gates and points, any signal with a URL and date, a segment, a region flag, and (account-based lists) a value tier V1/V2/V3 with its evidence.
6. The summary opens "Do this first, because…", gives every segment a three-line angle — pain, proof (a signed-off claim, or "proof needed: …"), ask — and states delivered vs asked and **why**, the funnel, what was dropped and why, credits spent, and exactly what you must do before sending (run the email column through your verifier).
7. The operator would genuinely email at least 80% of the rows. **Telltale failure:** padding — stale, unconfirmed or guessed people kept to reach 50.

Then paste fake verifier results for five rows (two invalid, one catch-all) and check it drops the invalid, moves the catch-all to `catch-all.csv`, marks the rest `verified-by-tool`, and re-issues the counts.

Re-run test: ask "top up the list with the next 20". It must find the saved definition and ledger, ask for outcomes once (not require them), and never repeat a person.

Edge tests:
- Routing: "Research my audience" or "build me a persona" must **not** start this playbook (that's market research); "Find me influencers" must not either.
- Schedules: "top this up every month" → an opt-in, paused schedule whose yes names a per-run credit ceiling; no data spend in a scheduled run without one.
- A brand with no ICP in the brain: it must propose 2–3 labelled candidate definitions, not guess one.
- "Find me 50 consumers to email" for a consumer app: it must say private individuals are out of scope and offer partner/B2B lists instead.
- A DTC brand asking for retail buyers: chains get an account row (portal / buying office) **plus** dated category-buyer rows; boutiques are account rows with the shop's published inbox or IG — UK sole traders (no limited company on Companies House) with no email or cold-DM route — visit or letter, phone only after a recorded TPS check; the brand's own stockists are excluded after reading its store locator.

## Staging run log

### 2026-10-16 — Gooseworks brand (c14ca9fa…), up to the first paid step

What ran (all free):
- `get_started` (wants more, the ask, brand Gooseworks) → setup done, "go on with their request", no card; lists the org's 8 brands.
- `account_whoami` → staging, org "gooseworks", 4,165 credits available.
- `brand_read` (summary, onboarding, competitors, learnings, accounts, sources, full) → description: "shared, self-improving AI coworker … for fast-growing consumer brands"; onboarding profile empty (role, ad_spend, goals, platforms missing); **no learnings**; competitor sources: PENCIL, AdCreative.ai, Smartly.io, Omneky, "Jasper Ockeloen".
- `knowledge_search` "ideal customer profile …" and "research-audience fit definition, customers and logos, outbound outcomes, do-not-contact list" → only brand-kit context: **audience** = "Marketing managers, growth leads, and founders at fast-growing consumer brands — and the agencies serving them …", positioning, one value prop. **No customers, no logos, no win/loss, no past outbound, no saved definition, no claims.**
- `competitor_read` → 5 competitors. **"Jasper Ockeloen" is a mis-resolved cyclist profile** attached to the jasper.ai domain — the competitor *domain* is right, the profile is wrong. Exclusion by root domain still works; the playbook must never exclude or include by competitor name or social handle alone.
- `file_list` query `research-audience` → no earlier run (no definition, no ledger).

What Gate 1 would play back (the playbook's draft, for the operator's yes):
> Motion: GooseWorks founder-led sales outbound. Unit: consumer brand × marketing leader (plus agencies serving consumer brands, as a second list).
> Firmographics: DTC / consumer brands, roughly 10–200 staff, US/UK/CA/AU, selling online. Situation (the timing): running Meta ads now — 10+ active ads in the ad library — with thin or stale creative (few new ads in the last 30 days), or hiring a creative / performance marketer, or a launch.
> Personas: Head of Growth / Head of Marketing / Performance Marketing Manager (champion); Founder/CEO at under 50 staff (buyer). Synonyms: "Growth Lead", "Director of Ecommerce", "Paid Social Manager".
> Disqualifiers: competitor domains (trypencil.com, adcreative.ai, smartly.io, omneky.com, jasper.ai); existing GooseWorks customers (**need your export**); agencies (separate list); Germany/Austria.
> Negative ICP: **unknown — no loss notes in the brain; tell me who never buys.**
> Size: 50 asked — how many can you actually work this week?
> Questions in one message: customer/open-deal export? weekly capacity? confirm geography?

Stopped here: Gate 1 needs the operator's yes; the next call would be paid.

First paid calls it would make after Gate 1 and Gate 2 (not run):
- `data_call_provider` scrapecreators `/v1/facebook/adLibrary/search/companies` and `/v1/facebook/adLibrary/company/ads` for consumer-brand advertisers in the chosen categories (the "running Meta ads now" signal), and `/v1/google/search` for "Head of Growth" + DTC brand queries.
- Gate 1 would ask one yes for a single probe read (no charges logged yet), then — next message, from its per-call charge — "up to N credits" for the five-account sample (about 50–70 lookups), labelled an estimate. (Round 2, 2026-10-16: gate rewritten to the shared spend-gate; not re-run on staging — the gates are unchanged in what they call.)

Findings from this run, fixed in the playbook: workspace files are per user, not per brand → files now go to the brand coworker workspace (the sibling convention); the competitor set can be mis-resolved → exclusions by root domain only (score-segment-qa / fit-definition).
