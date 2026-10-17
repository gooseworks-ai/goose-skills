# Test by hand — research-audience

## Setup

1. Connect GooseWorks **staging** to your agent. Link this folder into your agent's skills folder (see the marketing-agent README).
2. Use the **Gooseworks** brand on staging (our own GTM) so the operator can judge fit from first-hand knowledge.

## The test

Ask: **"Find me 50 right-fit people at recruiting agencies to pitch, with verified emails."** (or your own ICP).

It passes if:

1. **No question before research.** The first thing you get is the report — not a question, not a definition to approve, not a credit ask. (Only an out-of-scope ask — consumers, journalists, investors — gets a one-line redirect first.)
2. **Web research happened, for free.** The report cites company sites, directories, job boards, news and public profile pages with dates and links, and has at least five finished rows found without spending credits (or says the universe is thinner than that, and why).
3. **One message, one credit yes.** After the report: three lines (biggest finding, what to send first, the link), the honest limit ("no email checker here"), then only the decisions — corrections to the *assumed* lines of the definition, an exclusions export, 1–2 proof lines to sign off, and **one** yes to "up to N credits" for a top-up that says what it adds. No second credit question before results.
4. **A document, not a chat summary.** `report.md` opens with "Do this first, because…", lists timely openings, marks the definition's lines *sourced* or *assumed*, gives every segment pain → proof → ask and **For you**, has **You vs them**, what was dropped, "before you send" per region flag, and "what we could not read". In a host with files you're offered to open it; in hosted chat it's an artifact/document or the full report.
5. **Rows are honest.** Every person row has a dated title source; no row says verified unless a checker did; pattern-guesses cite the published address they're built from; a shortfall is stated, never padded.
6. You would genuinely email at least 80% of the rows.

Then: say "yes, up to 300 credits" and correct one assumed line → it re-runs only what the correction touches, spends inside the ceiling, logs every charge, and re-delivers the report and list. Paste fake checker results for five rows (two invalid, one catch-all) → invalid dropped, catch-all to `catch-all.csv`, the rest `verified-by-tool`, counts re-issued.

Edge tests:
- "Research my audience" / "build me a persona" must **not** start this playbook; nor "find me influencers".
- "Find me 50 consumers to email" for an app → one-line redirect to partner or B2B lists.
- A DTC brand asking for retail buyers → chains as account rows plus dated buyer rows, boutiques as account rows, UK sole traders with no email or cold-DM route; the brand's own stockists read from its store locator and excluded.
- "Top this up every month" → offered as a paused schedule whose yes names a per-run ceiling.

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
