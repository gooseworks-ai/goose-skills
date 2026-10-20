# Test by hand — research-audience

## Setup

1. Connect GooseWorks **staging** to your agent. Link this folder into your agent's skills folder (see the marketing-agent README).
2. Use the **Gooseworks** brand on staging (our own GTM) so the operator can judge fit from first-hand knowledge.

## The test

Ask, on the GooseWorks brand: **"i want to do the audience research for gooseworks"** (Akhil's words in the 18 Oct hand test).

It passes if:

1. **Audience research, not a prospect list.** The report covers who the audience is (2–5 buyer groups by situation, each sized in buyers or companies with sourced inputs — never subreddit members — and who uses, pays and approves), what each wants, their problems and how we solve them, why they buy and why they leave (where the brand has data), their own words (at least five first-hand quotes for the lead group — no vendor blogs, case studies or job posts), where they gather (with evidence the group is there) and how to reach them (three moves per group). No list of named people unless asked.
2. **At most one question before research** — the customer-data ask (an export, cancel reasons, win/loss notes), only because the brand has customers; "go" starts the free pass. No "which group should I go deeper on?".
3. **The lead group clears the evidence bar** (the customer data, or 5+ distinct first-hand people from 2+ kinds of source, mostly recent) — or the lead is labelled "provisional — <what's missing>" and the gap is a decision. A lead resting on two people and a company's own blog fails.
4. **Moves rest on what the run read.** "Do this first" cites sources in the report; a move on a forum the run couldn't open is labelled unverified and isn't first. Fail: a first move to post on a site listed under "what we couldn't check".
5. **The report passes write-report §3** (check its list: the top says what was looked at and the findings before the first move). Also: a provisional lead is never "your most likely paying group"; one line on agreement or difference with the market and competitor reports; a local file with a clickable link (or an artifact), and saved to the brand with a link. The buyer groups and quote bank are saved as their own files.
6. **One short closing message** in the step 8 shape: "Do this first", the two links, the decisions ending with "want a list of named people in <lead group>?". No file lists, no findings recap.
7. **Cost:** at most three group workers, none nested, none loading a skill; about 80 web calls in all; a few dollars, not tens.

Fail (20 Oct hand test): "Do this first" before the reader knows what was researched; a provisional lead stated as settled in "In short"; a same-week sibling report with a different first move or lead buyer, not named or settled; a report delivered over its word budget.

List-mode tests (the eval: `evals/playbooks/research-audience-list/`):
- **Build:** "find me 50 right-fit people to pitch gooseworks to, with emails. growth or marketing leads at consumer brands that run a lot of meta ads" → **no audience pass first**; rows within the run; accounts with gate evidence (ad-library pages, company pages, dated); people with dated title sources; honest email status (no "verified" without a checker); a signal or "none" per row; region flags; a shortfall with the universe size; `list.csv` plus a short list report; the closing decisions offer the messages for the list. At most three workers, none loading a skill; about 100 web calls.
- **Switch intent:** "who's looking for an alternative to AdCreative.ai?" → Hacker News and forum posts by identifiable people at fitting companies (authors only, never people who liked or replied), each with the post, its date and their words; anonymous posts become quotes, not leads.
- **Score a list:** upload 20 fictional sign-ups (some gmail, one competitor's staff, two demo requests) → free-mail rows not looked up as companies, the competitor flagged out, the demo requests "answer first" within an hour, every row with tier, confidence and action, the 10-row calibration table at the top.
- **Watch:** "tell me when any of these 10 past users changes jobs" (a fictional list) → a baseline, the paid per-run cost stated, a watch offered **created paused** with a standing ceiling; no emails stored.
- **Developer tool:** for a dev-tool brand, "find companies adopting tools like ours" → GitHub activity on rivals' repos, company clusters of 3+, the buyer listed (not the developers), no commit emails.
- **With the contact routes** (once the connector has them): a count and a sample before any reveal; every address checked before it is called sendable; no phones.

Edge tests:
- "What's the market size for AI ad tools?" / "how do people buy in our category?" → not this playbook (market research).
- "Find me influencers" → not this playbook.
- A re-run a month later → reads the saved buyer groups and quote bank and says what changed.
- "What's our market and who's in it?" → market research; "who are our buyers?" → this playbook. The two descriptions share no trigger phrase.
- Repeats: after the audience report, a refresh twice a year — or on a trigger (a new product, a new market, a shift in who buys or why they leave) — is offered only with a reason tied to this brand; after a list-mode run, **no** repeat of the list is offered (a watch may be, with its reason).

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
