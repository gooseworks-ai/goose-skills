# Data sources, costs and yield

Load at step 2 (quote) and steps 4–6 (sourcing). Every paid lookup goes through the GooseWorks proxy; no vendor keys anywhere.

## What exists today (checked 2026-10-16)

The GooseWorks MCP has **no** people search, no company database, no email finder, no email verifier and no funding/hiring/intent feed (see server-needs.md). The list is built from public pages, read through:

| Need | How | Cost |
|---|---|---|
| Brand, ICP, customers, competitors, past learnings | `gooseworks:brand_read`, `gooseworks:knowledge_search`, `gooseworks:competitor_read` | Free |
| Last run's definition, list and ledger; the shared credits log | `gooseworks:file_list`, `gooseworks:file_read` (brand coworker workspace) | Free |
| Search the web for accounts, people, job posts, press, published emails | The host's own web search **first, when it has one** (free). Otherwise `gooseworks:data_call_provider`, provider `scrapecreators`, path `/v1/google/search` (region and recency filters exist) | Free on the host; paid through the proxy |
| Company facts: size, industry, HQ, founded, funding block, a few employees, recent posts | same proxy, `/v1/linkedin/company` | Paid, per lookup |
| A person's public profile (location, experience employers, recent posts; titles are often hidden) | same proxy, `/v1/linkedin/profile` | Paid, per lookup |
| What a person or company has posted lately (pain statements, hooks) | `/v1/linkedin/search/posts`, `/v1/linkedin/company/posts`, `/v1/twitter/user-tweets`, `/v1/threads/user/posts` | Paid, per lookup |
| Who is running ads now (budget signal; strong for selling to marketers) | Meta: `/v1/facebook/adLibrary/search/companies`, `/v1/facebook/adLibrary/company/ads`; Google: `/v1/google/adLibrary/advertisers/search`, `/v1/google/company/ads`; LinkedIn: `/v1/linkedin/ads/search`; TikTok: `/v1/tiktok/ad-library/search` | Paid, per lookup |
| Small consumer shops and venues (owner, IG, link-in-bio contact) | `/v1/instagram/profile`, `/v1/linktree`, `/v1/linkbio`, `/v1/komi`, `/v1/pillar` | Paid, per lookup |
| Developer-tool ICPs | `/v1/github/user`, `/v1/github/repository` | Paid, per lookup |
| The company's own public pages (team, careers, contact, press, partners) | The host's own web-reading tool **if it has one** — public pages only, no logins, respect the site's terms. In a hosted chat without one, use search results and company pages from the proxy instead. | Free |

Paths are from the provider's public documentation as checked on 2026-10-16. The live tool is the truth: if a path is refused or changed, say so in one line and use another route. Never put a key, token or secret in a query.

Not usable for this playbook even though it exists: `/v1/find-creator-emails` (built for creators' public business emails — fine for work-with-creators, not for B2B people); `/v1/detect-age-gender` (never infer protected traits about prospects).

## Credits

Spending follows `../../../atoms/spend-gate/ATOM.md` (proxy branch): a probe with the human's yes for an endpoint with no logged charge, then a yes to "up to N credits", labelled an estimate, drawn from logged charges; stop at it. `gooseworks:data_price_provider` does not price these lookups (server-needs #1). Every charge is logged in `research/credits-log/<YYYY-MM>.md` (`date | playbook | tool/endpoint | query kind | items | credits`) — the kind of query, never a prospect's name. Never retry a failed paid call blindly; a resubmit pays again. This file only says how many lookups each stage takes (below), so the estimate has counts to stand on.

## Yield (approximate, from outbound practice — use it to size the lookup counts you show)

To deliver ~50 contactable people in B2B, "kept" meaning an account that passes every gate:

| Stage | Count | Typical lookups |
|---|---|---|
| Accounts screened (search results, ad-library hits, lists the human supplied) | 200–250 | ~1 search per 8–10 candidates → 20–30 |
| Accounts kept (gates confirmed on the company page) | ~100 (about 2–2.5 screened per kept) | 1 company read each → ~100 |
| Signal checks on kept accounts | ~100 | 1–2 searches each → 100–200 |
| People found | ~140 | 1 search to find the profile + 1 read each → ~280 |
| Hidden titles needing a second source | ~40% of people | 1 search each → ~55 |
| With a usable contact route | 60–70 | 1–2 searches for published emails / pattern evidence each → 60–120 |
| Hooks | ~50 | 1 search each → ~50 |
| Handover re-checks (job posts still live, five-row QA) | — | ~15 |
| Delivered after QA | ~50 | — |

Roughly **13–20 lookups per delivered person** for a B2B list; the five-account calibration sample takes about **50–70 lookups**. Lists sourced from evidence (job posts naming a tool) keep more of what they screen. Retail-independent, local and marketplace lists are cheaper per row (one account row, simpler routes); chains add 1–2 buyer-row lookups each, and each UK independent adds one register check (paid search when the host has no web reader). Re-runs are cheaper: definition, exclusions and many accounts are already known.

The paths above say only what to pull and why. Query keys, recency options, paging and per-endpoint pricing notes are in `../../../atoms/spend-gate/proxy-endpoints.md` ("Profiles, creators and companies" and the search sections) — use them from there.
