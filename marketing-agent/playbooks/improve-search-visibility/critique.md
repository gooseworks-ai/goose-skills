# improve-search-visibility — critique log

Every round: the finding, the fix, or why it was rejected. Critics are subagents; none read old skills (including the installed `aeo` skill, deliberately unread).

## Round 1 — scope critic (before writing, effort high)

Input: spec 14, page 00 Part 1 + pillar 4 + Parts 3–4, page 01 pillar 4, source map §8, decisions D1–D5.

| # | Sev | Finding | Resolution |
|---|---|---|---|
| 1 | MAJOR | "ChatGPT, Google" too vague: Google is organic, AI Overviews and AI Mode | Fixed: one column per surface; Perplexity/Gemini/Copilot only when the buyer uses them |
| 2 | MAJOR | No sampling method; answers vary by run, memory, location, model | Fixed: `references/citation-protocol.md` (fresh, logged out, country set, repeated runs, k of N, unstable flag) |
| 3 | MAJOR | No step reads why the winner won | Fixed: source-type classification (step 4) + pattern step 5 + `references/gap-to-fix.md` lever table |
| 4 | MAJOR | Out-of-scope excludes the highest-leverage AEO fix (getting into cited lists) | **Partly accepted, flagged for the orchestrator:** a single drafted inclusion request per cited page, sent by the human, counts as a fix; link-building campaigns and PR stay out (spec 14 Out of scope keeps "relationship work"). This is a narrow deviation from the spec's wording; reason: without it, the pattern most often found (absent from cited lists) has no fix this week |
| 5 | MAJOR | Comparison/alternatives pages missing | Fixed: brief type to make-content; competitor-name stance asked; claims gate on competitor facts |
| 6 | MAJOR | Question list skips brand questions where AI states false facts | Fixed: 3–6 brand-accuracy questions always; fact check vs brain; "AI says something false" entry point |
| 7 | MAJOR | Foundation check misses AI-crawler access (robots, CDN bot blocking, JS-only content, Bing) | Fixed: `references/foundation-check.md` retrieval vs training bots, CDN test, JS visibility, Bing index |
| 8 | MINOR | llms.txt | Fixed: never one of the five (gap-to-fix hard limits) |
| 9 | MINOR | Schema oversold; FAQ rich results restricted | Fixed: schema as hygiene; FAQ rich results now removed for all sites (verified: Google, May 2026); visible Q&A is the fix |
| 10 | MAJOR | Search Console never used; near-winners and internal links missing | Fixed: asked at intake; near-winners in step 6; internal links in foundation check and fix types |
| 11 | MAJOR | Local reduced to "entity footprint" | Fixed: local module (Business Profile per location, NAP, review count/recency/replies) in `entity-and-local.md`; review-request brief to email-lifecycle |
| 12 | MINOR | Wikipedia/Reddit/YouTube limits | Fixed: hard limits in gap-to-fix (no Wikipedia article, disclosed replies only, YouTube → video brief) |
| 13 | MINOR | Merchant feeds are now an AI surface | Fixed: named as gap → optimize-listings (backlog) in Out of scope |
| 14 | MAJOR | Re-runs not comparable | Fixed: versioned question set; same engines, country, runs; per-question diff; fix dates logged; trend only after 2–3 runs |
| 15 | MAJOR | No reactive entry points | Fixed: competitor suddenly cited / traffic drop (4 causes told apart) / AI states something false — named stages (P1) |
| 16 | MAJOR | Must-ask inputs (countries, app, Search Console, CMS, who ships, competitor stance, locations) | Fixed: intake in Before you start (≤ 6 questions, prefilled) |
| 17 | MAJOR | Too broad for one run; contradiction between "finished fixes" and "briefs" | Fixed: first run 12–15 questions; five finished fixes; briefs listed under the five, never counted |
| 18 | MAJOR | Measurement honesty | Fixed: can/cannot-claim list in citation-protocol; report header always shows n, date, location, logged-out |
| 19 | MAJOR | Spot-check must be reproducible | Fixed: copyable prompt per row, "check it yourself" box, unstable rows flagged; done-when spot-checks stable rows only |

## Round 1 — depth critic (before writing, effort high)

| Finding | Resolution |
|---|---|
| FAQ rich results removed for all sites (7 May 2026) | Verified by a separate web search; written into gap-to-fix, finished-fix-examples (b) |
| Google says no special AI files/markup needed; llms.txt speculative | gap-to-fix hard limits |
| OpenAI bots differ (OAI-SearchBot = search inclusion; GPTBot = training; ChatGPT-User = user fetch); Google-Extended does not affect AI Overviews | foundation-check retrieval vs training split |
| ChatGPT often answers without searching; memory answers aren't fixable this week | "search used" recorded; memory answers labelled (SKILL step 4, citation-protocol, prioritising time-to-show) |
| Source mix moves fast by category | battlegrounds.md note: measured each run, never assumed |
| AI citations overlap little with Google top 10 | separate columns; ranking and citation are separate checks |
| Run counts: Google organic 1, AIO/AI Mode 2, ChatGPT 3 (5 must-wins) | adopted (critic 1 said 3 everywhere; organic results are stable enough at 1 and cost credits) |
| Two forms per question (AI conversational with constraints; Google short) | question-list.md |
| Five worked fixes | finished-fix-examples.md (a)–(f) |
| CWV thresholds incl. INP; app-store indexing limits | foundation-check.md; app-store-listing.md |
| Prioritisation and time to show | prioritising.md |
| Failure modes (advice instead of artifacts, schema theatre, keyword stuffing, invented facts…) | fix-writer "Never" + gap-to-fix limits |
| Depth critic said outreach is out of scope ("name the gap only"), scope critic said allow inclusion asks | Resolved as in scope finding 4: one drafted request per cited page, human sends |

## Server reality found while building (staging, 2026-10-16)
- No AI-answer tool on the MCP. Google organic results only, via `data_call_provider` scrapecreators `/v1/google/search` (confirmed from the provider's public docs: query, region, page; organic url/title/description; 1 provider credit per request). → server-needs §1.
- `data_price_provider` prices only fal and ElevenLabs, so a scrapecreators run cannot be quoted in credits ahead → server-needs §7.

## Overlaps to note for the consolidation pass
- `fix-writer`'s claims check overlaps make-content's `claims-check` atom.
- `entity-footprint`'s review-request brief and email-lifecycle's review-request flow are the same journey from two sides.
- research-competitors does a light competitor-footprint read; the citation check's "named instead" data could feed it.

## Round 2 — adversarial run (after writing, effort high)

Three brands (Personal Day DTC skincare on staging; 3-month-old Webflow SaaS; pre-revenue iOS app), Claude Code without a logged-out browser and claude.ai without a shell.

| # | Sev | Finding | Resolution |
|---|---|---|---|
| 1 | MAJOR | Human paste handoff unrealistic (~64 pastes), screenshots lose sources, k of 1 never stable | Fixed: minimum paste set (5 questions; ChatGPT ×2, AI Mode ×1 = 15 pastes) in plain steps incl. "click Sources"; pasted rows "k of 2, run by you"; done-when spot-check by a colleague or on a different day |
| 2 | MAJOR | Hosted chat conflicts with server instructions (no other app, no technical questions) | Partly fixed: asks reworded in plain marketer language; view-source asks removed (developer checklist instead); "what does it run on" is optional. **Open for the orchestrator:** the server instruction needs a carve-out for "open ChatGPT, paste this, copy the answer back" (server-needs §1) |
| 3 | MAJOR | Blockers found after paid lookups | Fixed: new step 2 "free blocker check" before anything paid; unindexed/blocked → fix #1 and the paid check shrinks |
| 4 | MAJOR | Credit gate undercounts (`site:` lookups) and quotes "1 provider credit" (own math) | Fixed: count includes index checks; run one, quote its actual credits and the total, then yes; Reddit/YouTube removed from steps (server-needs §6 says not used yet) |
| 5 | MAJOR | No pre-launch path | Fixed: pre-launch in step 1, battlegrounds row, question-set (category + name collision), store-listing launch-day draft |
| 6 | MAJOR | Claims sign-off untestable; health-claim wording | Fixed: learn-my-brand's contract; ratings/counts/prices re-read from the live page; no treat/cure/prevent wording; facts used by the five get one yes as a set |
| 7 | MAJOR | Shopify markup example would duplicate theme JSON-LD and hard-code price | Fixed: read existing JSON-LD first; Liquid edit with live values; Webflow route; static block shown as target shape only |
| 8 | MAJOR | New site with no Search Console has no fix | Fixed: verification + sitemap lever (Search Console and Bing), counts in the five |
| 9–19 | MINOR | "#14" impossible; stability undefined for N≠3; winnability before data; generic brand names; driving the founder's browser / CAPTCHAs; API-proxy invites a local key; share of voice vs wrong set; review-incentive rule too blunt for G2; header overstates; re-run diffs across methods; hosted fetch limits | All fixed in citation-protocol, question-list, report-template, gap-to-fix, entity-and-local, foundation-check, atoms |

Rule-10 verdict from the critic: a real playbook (question design, honest sampling, lever-by-cause, finished fixes); the AI-answer half depended on an unworkable handoff → fixed by 1–4.

## Round 2 — contract check (after writing, effort high)

| # | Sev | Finding | Resolution |
|---|---|---|---|
| 1 | MAJOR | `tools_load` never mentioned | Fixed (Before you start 1, needs) |
| 2 | MAJOR | Claims sign-off not testable | Fixed (learn-my-brand contract) |
| 3 | MINOR | Monthly re-run names no tool; unattended run would spend credits | Fixed: `automation_upsert`, created paused; each run does the free steps then asks a yes to that run's total |
| 4 | MINOR | server-needs step numbers; near-winner positions 8–20 vs 4–15 | Fixed |
| S1 | MAJOR | No credit total; "1 provider credit" is not a GooseWorks price | Fixed (run one, quote actual, yes to total) |
| S2 | MINOR | `site:` lookups outside the count; Bing `site:` has no MCP route | Fixed (counted; Bing via host fetch or not checked) |
| S3 | MINOR | Hosted fallbacks missing (profiles, listings, CDN test) | Fixed (screenshot or not checked; CDN needs a shell) |
| S4 | MINOR | research-competitors reads the report but isn't listed; conventions note line format wrong | Fixed (Output table, meta, shared note v2) |
| S5 | MINOR | "evidence" read not in the steps | Fixed (question-set uses `source_types: ["evidence"]` + voc-bank file) |
| — | added | Report and program sheet imported into brand knowledge (media_upload + knowledge_import, free), following research-market's verified pattern, so rule 5's brain write-back holds on hosts that never open the workspace | — |

## Round 3 — final critic, adversarial + contract (effort xhigh)

Verified as passing: step numbers consistent across SKILL/atoms/references/server-needs; won/unstable defined identically in three places; all 13 tools exist; every read has a writer and every write a reader (checked against make-content, research-competitors, email-lifecycle, analyze-performance folders); §5 order; no vendor keys.

| # | Sev | Finding | Resolution |
|---|---|---|---|
| 1 | MAJOR | AI Overviews never observed without a browser (paste set covered ChatGPT + AI Mode only) | Fixed: paste set adds AI Overview (copy with "Show more", or "none"); 20 pastes; SKILL step 4 and atom aligned |
| 2 | MAJOR | Brand fact check never guaranteed (paste set = must-wins, which are non-brand) | Fixed: paste set = up to 4 must-wins + at least one brand question (pre-launch: name collision) |
| 3 | MAJOR | First paid lookup ran before any yes; "free blocker check" couldn't detect "not indexed" | Fixed: ask a yes to one probe — the site-wide `site:` lookup, which also answers "indexed?" — then quote the total from its actual credits and wait for the yes; SKILL steps 2/4, gates, citation-protocol, foundation-check, server-needs §7, test-by-hand |
| 4 | MINOR | Google rows can't be "stable" yet the spot-check asks for stable rows | Fixed: stability applies to AI surfaces; Google organic rows checked as in/out of top 10 (±3) |
| 5 | MINOR | Run counts stated differently (saved set, report header) | Fixed: one `runs·route` line in question-list, report header, question-set atom |
| 6 | MINOR | Paste settings vs spot-check settings differ ("search on", signed-in Temporary Chat) | Fixed: chatgpt.com in a private window not signed in; "no sources" recorded; "search on" removed |
| 7 | MINOR | Learning write refused as agent_proposal (verified by plan/paid/analyze session) | Fixed: show the pattern, save on confirmation with `user_correction` + the human's words (also applied to email-lifecycle) |
| 8 | MINOR | Knowledge-import lifecycle incomplete; appendix would import wrong AI-stated facts into the brain | Fixed: tag `search-visibility`, `job_get` until ready, `media_list` by tag to find the old asset, report imported without the appendix and with wrong facts labelled |
| 9 | MINOR | Monthly automation under-specified | Fixed: agent job, not enabled, name/schedule/time zone, self-contained prompt that stops before paid lookups |
| 10 | MINOR | Lean brand_read can miss the sign-off marker | Fixed: `detail: "full"` (also applied to email-lifecycle) |
| 11 | MINOR | tools_load named too few groups | Fixed (any group a named tool needs) |
| 12 | MINOR | Fix example (a) used the wrong Shopify path and raw HTML | Fixed: Products → Collections fields (Title, Search engine listing, Description) + rename side-effect note |
| 13 | MINOR | Page brief lacked make-content's "cluster" and structure | Fixed: cluster name + H2 outline added |
| 14 | MINOR | Hosted chat without fetch writes copy fixes blind | Fixed: knowledge_import import mode for the 3–6 pages, inside the credit total, read via knowledge_search |
| 15 | MINOR | Stale test record; overclaiming description; Bing not asked in intake | Fixed |

## Round 4 — confirmation critic (effort xhigh) — **no MAJOR findings**

All three round-3 MAJOR fixes verified correct and consistent across SKILL, protocol, atoms, saved-set line, report header, server-needs and tests (20-paste set incl. AI Overview; ≥ 1 brand question; probe yes → `site:` probe → total from charged credits → yes). Step numbers and description length verified.

| # | Sev | Finding | Resolution |
|---|---|---|---|
| 1 | MINOR | server-needs §1 described the old paste set | Fixed |
| 2 | MINOR | test step 5 still said "Temporary Chat, search on", stable rows only; atom said "(search on)" | Fixed |
| 3 | MINOR | Agent-browser rule allowed a Temporary Chat (signed in → founder's account) | Fixed: private window not signed in; Temporary Chat only if forced, never in the founder's account; recorded |
| 4 | MINOR | Two overlapping "Indexed" rows; table at step 2 could trigger the paid lookup early; Bing results scraping | Fixed: one row (Search Console, else the step-4 probe after its yes; Bing via Webmaster Tools only) |
| 5 | MINOR | Page imports (hosts without fetch) outside the credit total | Fixed: their own line inside the same yes |
| 6 | MINOR | Probe unpriced; "N × credits" own math | Fixed: read `research/credits-log.md` (shared price history from the research session) for the probe ask; total quoted as "N lookups × X as charged"; charges appended to the log |
| 7 | MINOR | Pre-launch with no site: `site:` probe wasted | Fixed: probe is the name-collision lookup |
| 8 | MINOR | Imported report copies can't be reliably replaced | Fixed: dated title; readers use the newest; delete is housekeeping |
| 9 | MINOR | "AI says something false" entry had no paste set | Fixed: brand questions replace the must-wins |
| 10 | MINOR | Description overclaimed coverage without a browser | Fixed |
| 11 | MINOR | Voice-of-customer bank is a document, not evidence rows (also flagged by the research session's notice) | Fixed: `source_types: ["document","evidence"]` + the file read |
| — | added | research session notice: G2, Capterra, Trustpilot, Amazon forbid automated collection | Fixed: never fetched; screenshot / vendor-portal view or "not checked" |
| — | added | get_started first (server instructions; siblings do it) | Fixed (Before you start 1, needs) |

**Loop status: the last round found nothing major. Done for this playbook.**

## Round 5 — cross-set review fix pass (16 Oct) + adversarial/contract critic (effort high)

Inputs: AGENTS.md §3/§5/§8 changes and `reviews/2026-10-16-{contracts,coverage,depth,routing}.md`.

| Review finding | Resolution |
|---|---|
| Contracts F3 (MAJOR) — claims from snippets, live page and a chat yes | Shared `atoms/claims-gate`: contract read up front, scoped sign-off at step 10 with the fix list, gate over every factual sentence; the live page supplies plain product facts only; fix-writer, store-listing atom, fix examples and app-store reference no longer accept "the human" or ratings from the page |
| Depth / coverage m5 — no cluster→page map or roadmap; no demand weighting | New `references/page-map.md` + step 9: standing map (cluster, primary query, demand from Search Console, page, best position, state incl. merge/parked, winnable, priority, owner, quarter from stated capacity); five fixes and briefs drawn from it; saved as a superseding brand record |
| Depth — briefs not in make-content's shape | Briefs follow make-content's content-brief input (format/length from its list, audience, intent, questions, information gain, H2s, facts with sources, claims, CTA "to confirm with you") |
| Depth §5 — asks whether an app exists | Apple's public lookup + Play page via host fetch (web search fallback); asked only if unclear |
| Routing U5 / contracts 3.8 / M10 — own credit sums | Shared `spend-gate` proxy branch: probe yes → ceiling "up to N credits", estimate, stop, log in `research/credits-log/<YYYY-MM>.md`; atoms no longer quote totals |
| Routing U6 — technical asks | Search Console as an optional click-by-click ask |
| Routing F14 / R3 | Description 923 chars, `>-`, Business Profile / local search, "Not for…" |
| Contracts F2 / M4 | Pattern stays in documents; only human-stated rules (e.g. competitor naming) through `save-learning` |
| Contracts M8 / M11 / §3.5 | Report (keep-history) and page map (supersede) through `save-to-brain`; verbatim runs kept out (`import: no`) |
| Contracts M12 / M14 / F6 / M3 / M19 | get_started `wants: "more"`; §8 connection trigger; `brands/<slug>/` fallback; lean read; monthly credits log |
| AGENTS §3 | Atoms renamed `ATOM.md` |

Critic findings after the pass (all fixed):

| # | Sev | Finding | Resolution |
|---|---|---|---|
| 1 | MAJOR | Verbatim AI answers (wrong facts) would be imported with the report | Runs saved separately with `import: no`; template points to them |
| 2 | MAJOR | Claims still entered via "the human", "live site" and page ratings | All routed through the gate; ratings only as approved claims or mirrored markup |
| 3 | MAJOR | citation-check and page-and-foundation atoms still quoted own totals | Inside the ceiling; charges reported in the gate's words |
| 4 | MAJOR | Saved learning was an observation | Only human-stated rules saved; pattern in documents |
| 5–15 | MINOR | stale step numbers; store links asked; Bing never asked; stale tests/server-needs; meta needs; intake answers not kept; page map thin (no capacity, position, owner, merge); brief CTA/length/format; two "Do this first"; critique not logged | All fixed; server-needs adds keyword volume/difficulty and local-pack rank |

Open for the orchestrator: (1) the paste set vs the server's "no other app" instruction (server-needs §1); (2) a ruling on driving signed-out ChatGPT/Google in the host browser (contracts table 2.4). Not re-verified by a further critic round after these fixes.

2026-10-16 final contract check: fixes-file section renamed "For your email program — review requests" (was "For email-lifecycle"; the human reads that file); email-lifecycle's reader updated to match (SKILL.md, skill.meta.json).
2026-10-16 final contract check: save-learning call: retire only the earlier `[search …]` facts the new rule replaces or contradicts (was "the previous search fact"), per the atom (SKILL.md, skill.meta.json).
2026-10-16 final contract check: skill.meta.json `atoms` now lists only this folder's atoms; shared atoms moved to `shared_atoms`.
2026-10-16 orchestrator ruling: review replies are not covered (BACKLOG #8 manage-reviews): removed reply drafting from the local module (references/entity-and-local.md, references/gap-to-fix.md, atoms/entity-footprint); out of scope now says replies and review monitoring are backlog, this playbook only reports count, recency and reply rate.
