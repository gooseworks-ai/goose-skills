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

## Round 6 — hand test 18 Oct (Akhil, GooseWorks brand) → research pattern + write-report, proved by a Sonnet re-run

**Akhil's findings:** links didn't open (docs only in the workspace, paths shown as links; he had to ask for local copies); docs hard to read ("like the skill isn't being used — default Claude format").

**More bugs found in the transcript:** 5 intake questions + a question-list approval before any check (4–5 stops before "am I in ChatGPT?" was answered); probe yes then ceiling yes (two credit yeses, contradicting spend-gate); `data_price_provider` called twice for lookups it can't price; Google refused the browser so AI Overview/AI Mode went unchecked without a fallback in the free path; 3 ChatGPT answers scored before they finished loading; six separate documents (report, fixes, page map, questions, runs, briefs) with question ids, "Runs·route", "0/1", robots/schema jargon in the top section.

| Change | Where |
|---|---|
| Free pass first, ask nothing: brain, site, draft question set, ChatGPT signed out in the host browser, Google AI answers when allowed, web search for who ranks and for news, profiles, app lookup, foundation | SKILL steps 1, new `references/free-pass.md`, atoms question-set / citation-check / page-and-foundation-check |
| One message with the draft answer and all decisions left; question set shown for edits, not approved first | SKILL step 2, question-list, question-set atom |
| One credit yes (spend-gate B): ceiling from the log, or the human names it with the first lookup as the probe inside it; never call the price-check tool for lookups; paid Google page one is a top-up, never the start | SKILL step 2–3, citation-protocol Credits |
| Wait-until-finished rule; retry once; never score an unfinished answer | citation-protocol, citation-check atom |
| One report through `atoms/write-report` (local file + link, artifact in hosted chat, saved copy + link); report template rewritten to write-report's shape with a "for whoever edits your site" closing section; ban list (ids, "0/1", "surface", tool names, paths) | SKILL step 5, report-template, fix-writer (two versions of every fix) |
| Roadmap, briefs and fixes carry no ids | page-map, fix-writer |
| Shared bug in email-lifecycle: workspace paths offered as files | email step 8 now delivers the pack through write-report (minimal change) |

**Rule-10 note:** spec 14's "agree the question list first" gate became "show the list for edits after the free answer" — the AGENTS §8 research pattern (decided 17 Oct) overrides it; the question set is drafted from the brain and site and is cheap to change.

**Sonnet re-run (Sonnet, high effort, staging, GooseWorks, Akhil's exact words; paid top-up declined, 0 credits):**
- Stops before the first answer: **0** (was 4–5). Gating messages in total: **1**. First message answered "am I in ChatGPT?" (named 5/5 on brand questions, 0/8 on buyer questions; who wins instead; the pattern), with the draft five and the decisions in one block.
- Free pass reached ChatGPT (22 runs), Google AI Overview, AI Mode and page one in the browser.
- Report: local file in the marketer's folder with a clickable link; saved copy link verified (HTTP 200). Graded against write-report §3: **pass** — top five lines say what to do first and why; a non-marketer can follow it; no ids, tool names or paths in the story; links open. Minor: "must-win" and an untranslated "sitemap" in the story; one guessed editor field name ("page copy keys") in the developer section.

**Fixed from the re-run's own notes:** draft five ranked with prioritising before the first message (they changed between message and report); browser-outside-target-country rule; saved answers stated as assumptions, not re-asked; same-day re-run overwrites and bumps the roadmap version; name-collision fix type (Gooseworx hijacked "is Gooseworks legit" in Google's AI answer); URL prefill and parallel tabs for speed; report ban list adds "must-win", sitemap jargon, guessed editor field names.

**Open for the orchestrator:** the re-run found `tools_load` missing on staging although §8 names it; the paste-set conflict with the server's "no other app" rule (server-needs §1) and the host-browser ruling (contracts 2.4) still stand.

## Round 7 — schedules rule (AGENTS §8, 18 Oct)

The fixed "offer a monthly re-run" in step 5 became a judgment: offer a repeat only when it would help this brand, with the reason and a cadence (monthly by default; weekly only during a launch or a close fight for a must-win question). One-off asks get a single re-check after the fix instead; pre-launch gets a first check the week after launch. Created paused under spend-gate's automation rule; each scheduled report opens with what changed. Output table and Out of scope updated to match.

## Round 8 — independent senior-marketer review of the 18 Oct re-run (graded 4/5), applied per AGENTS §2b

Source: `marketing-agent-test/results/reviews/social-plan-search-review.md` (search parts, ranked fix #8, eval criteria §4). Each point checked, not just obeyed.

| Review point | Verdict | What changed / why not |
|---|---|---|
| Positioning decided silently (re-run retitled outbound pages to ads) | **Agree** | Free pass reads the positioning the site sells today; the question set covers every audience; the decisions message asks "which buyer do we want to win?" with a recommendation; fixes that retitle pages across positionings stay conditional on the answer (SKILL steps 1–2, question-set, free-pass) |
| No demand data | **Agree, with a limit** | Every cluster states its demand source: Search Console, Keyword Planner (only if the brand shares its Ads account), Google Trends and autocomplete (free, relative), a vendor prompt-volume estimate only if the brand already has that account — labelled "estimate"; else "no demand data, ranked by judgment" (page-map, prioritising, question-set). *Limit:* GooseWorks has no keyword or prompt-volume tool, and AGENTS §2.4 forbids vendor keys, so we can't fetch Keyword Planner or Profound/Ahrefs data ourselves (server-needs §8 already asks for it) |
| "No prompt-volume data exists" is stale | **Agree** | Replaced in citation-protocol and the question-set atom: vendor estimates exist, used only when the brand has them, always labelled estimates |
| 79–90 templated `/brand/` pages not read | **Agree, reframed** | New foundation row and free-pass step: sample any large templated page set first; thin → top of the risk list as a proposal (improve, consolidate or noindex) with risk and undo. Framed as a quality risk to check, not an asserted site-wide penalty — that would be a claim we can't verify |
| Signed-out ChatGPT isn't what signed-in buyers see; Perplexity, Gemini, Claude skipped | **Agree on the limit; partial pushback on the engines** | Every report states the signed-out limit in "couldn't check". Perplexity is checked signed out when buyers are technical or AI-native. **Pushback:** Claude, Gemini and Copilot's consumer apps require sign-in; borrowing the founder's account would personalise the answer and breaks the browser rules, so they are named as not checked rather than run |
| Search Console + Bing should be "fix 0" | **Agree in spirit** | Measurement comes first in the five when missing (Search Console, Bing, plus an AI-referral baseline in analytics). Kept inside the five rather than as a sixth so the "at most five fixes" rule (rubric E7) holds |
| AI-referral baseline missing | **Agree** | Added to the measurement fix (visits from chatgpt.com, perplexity.ai and similar in the brand's analytics) |
| Monthly re-check with one run reports noise | **Agree** | Scheduled checks run every key question 3 times and call a trend only after 2–3 checks; a "nothing material changed" report is valid |
| Outreach emails weak; lists often affiliate-driven | **Agree** | Inclusion template now needs a reason the editor's readers gain (a data point, a reproducible test, an honest "when not to use us"); affiliate-driven lists flagged as a human decision |
| Broke its own rules ("must-win", guessed editor field, "sitemap" in In short) | **Agree** | write-report's mechanical check now runs before delivery with this playbook's extra banned list (must-win, key question, probe, proxy, surface, row, runs·route, 0/1, Q-ids, guessed field names); In short must hold only verified points. "must-win" renamed to "key question" inside the playbook so the term stops leaking into reports |
| write-report additions (decisions box, "not doing", length budget, source skew) | **Agree** | Report template follows them |
| §8 now allows one upfront customer-data question | **Pushback (not used here)** | For search the brand's own data is Search Console, which is optional and asked in the decisions message. An upfront question would delay the answer the ask is about, and the eval's must-pass E1 requires no question before the first answer |
| Rubric E2/E5/E9 | Applied | Each AI table states date, browser location and signed-out state; single-run answers are "a first look", unfinished ones "didn't finish"; every engine statement about the brand gets right / wrong / unsupported; competitor facts only from the competitor's own page, read this run and cited |

Not re-run (per orchestrator: the eval suite scores it next).

## Round 9 — fixes from the 19 Oct evals (v1: stopped after one turn, no file; v2: 11/16 must-pass with the skill vs 7/16 without)

Each failing check confirmed against `evals/results/2026-10-19-v2/improve-search-visibility/with-skill/transcript.md` and its files before fixing. The eval host had no browser.

| Check | Confirmed cause in the run | Playbook cause → fix |
|---|---|---|
| v1 M6 / pattern "report written without being asked" | v1 pasted everything in chat; v2 turn 1 ended "Ready to write the full report — say the word" | Step 2 let the report wait for the decisions → step 2 now writes, checks and delivers the report **in the same turn**, then the message; answers, pasted ChatGPT answers and the top-up update the same report |
| E1 (must) counts in the first message | first message gave a qualitative ChatGPT read "based on yesterday's run" | No rule on counts or on earlier runs → first message leads with counts of what was checked **this run** (ChatGPT, or web search on a no-browser host, with ChatGPT "not checked today — last checked <date>") |
| E2 (must) runs/date/location/signed-out per row | yesterday's ChatGPT table presented as today's, no per-row notes | Earlier answers are history, never today's evidence (SKILL Before you start 2, citation-check step 3); every table row carries its own "checked" note (report template) |
| M9 (must) / pattern "every number traces to a source" | "27,000+ GitHub stars" for Block's Goose — no source opened in the run; v1 had stale prices $99/$299/$599 | New free-pass rule: every number traces to a source opened this run, cited with its date; figures from memory are cut or checked |
| E9 (must) unapproved claims in fix copy | "closes the loop… growth outcomes" (the brand's own site copy) and a Preflight/InspectAd comparison table from pages never read | fix-writer: the brand's own marketing lines are claims (cut, rewrite to plain facts, or `[needs your sign-off]`); no rival table or outreach line unless each cell comes from that rival's page read this run |
| E12 (must) link, saved copy, banned words | bare path in backticks; brand save attempted via `brand_update` (rejected) and working files written to a local look-alike folder; "proxy" and "surface" in the report | Step 5: mechanical check before delivery (search the file for each banned word), markdown link not a bare path, save through save-to-brain (`file_write` to the GooseWorks workspace + import, link via `file_url`), never `brand_update` for a report, say plainly if the save fails; "proxy" wording banned in the template |
| S6 closing message | listed three working-file paths plus extras | Chat after delivery: three lines, never working files or paths |
| S7 saved to brand | see E12 | see E12 |
| E3 3–6 brand-accuracy questions | reused yesterday's set with 2 brand questions | question-set: a re-run tops the saved set up to the mix (≥ 3 brand questions, every audience) before running |
| E10 AI-referral baseline | Search Console + Bing only | The measurement fix always has three parts: Search Console, Bing, AI-referral baseline in analytics |

**Not fixed — noise or contamination:** the agent's malformed tool calls (`brand_read` with `id`, `knowledge_search` with `source_ids`) are model slips, not playbook text. Yesterday's saved run on the shared staging brand is contamination; the playbook still now treats any earlier run as history only.

**Pushback (§2b):**
- **E1 on a host without a browser.** "Answer 'am I named in ChatGPT?' with counts" can't be met honestly when the host cannot reach ChatGPT. Recycling yesterday's counts (what the run did) or estimating would be worse. The playbook answers with today's web-search counts, says ChatGPT was not checked today and gives the last-checked date and the paste set. The criterion should accept that.
- **E2 "every row states runs, date, location, signed-in/out".** Right in substance; repeating four fields on every row makes the table hard for a founder to read. Kept as a short per-row "checked" note ("19 Oct · signed out · 3 tries") with location stated once above the table.

## Round 10 — ports from the old library (19 Oct old-vs-new review, `research-ci-brand-seo.md`)

Old skills read as reference only (skills/seo: site-content-catalog, programmatic-seo-spy, seo-content-audit, seo-opportunity-finder, topical-authority-mapper, programmatic-seo-planner; competitive-intel landing-page-intel; brand update-brand-kit). Craft taken; no scripts, structure, vendor wrappers or keys.

| Review point | Verdict | What changed / why not |
|---|---|---|
| 3a. Rival page-type map is missing ("they have 12 comparison pages; you have none") | **Agree — ported, free** | New `references/rival-content-map.md`: sitemaps of the brand + 3–5 rivals (sitemap → index → robots → feed; never crawl page by page), every URL sorted into 14 page types, templated sets sampled and scored 1–5 on depth, unique value, data, freshness, internal links, and a page-type gap table. A gap counts only when ≥ 2 rivals invest **and** it answers a question in our set (no herd-following). A gap becomes one "needed" row in the roadmap, never a whole set. Wired into SKILL step 1, free-pass 9b and its outputs |
| 3b. Topic gap table, templated-page planning (pattern scoring, blueprint, build sequence), topic-cluster architecture | **Agree, deferred** | All need keyword volume and difficulty, which we can't fetch (server-needs §8). Listed at the end of `rival-content-map.md` as the seed for backlog #17 (B2B content roadmap); note left for the orchestrator. Building a templated set goes in the report's "What we're not doing" |
| 3c. Commercial-intent filter | **Agree — ported** | question-list: value is now buying intent 1–5 (5 = maps straight to the product … 1 = traffic that rarely buys), keep ≥ 3; winnability stays 1–3. question-set atom updated |
| 3d. Internal linking plan | **Agree — ported** | page-map brief: hub ↔ page both ways, siblings in the cluster, glossary/explainer → page, each with the page, exact anchor and position |
| 11a. Tracking-pixel / analytics detection | **Agree, scoped** | foundation-check row: which analytics and ad pixels the homepage and one money page run. It decides where the AI-referral baseline goes; no analytics → part of the measurement fix. A measurement blocker, never sold as a ranking issue |
| 11b. Email-record checks (SPF/DKIM/DMARC) in the search foundation check | **Pushback** | Email deliverability has nothing to do with search or AI answers; a red SPF in a search report is noise the marketer can't act on here. email-lifecycle already checks it — properly, from headers, not a root DNS guess (our own round-3 fix). The review itself places it in a shared site-signals reference for research-competitors, research-audience, email-lifecycle and where-to-start, not search. AGENTS rule 10: don't grow the surface |
| 4. Brand-name pronunciation | **Agree on the craft; pushback on the owner** | Recording a pronunciation fact is learn-my-brand's job (the review puts it there); search never writes one. Search *reads* it if present and turns the spoken form into the spellings buyers type ("Goose Works", "Goosework", "Gooseworx"): brand questions, Organization `alternateName`, the namesake line (entity-and-local). No fact and a name that's easy to mishear → a question in "couldn't check". learn-my-brand has no such fact yet — flagged to the orchestrator |
| 5a. goose-aeo as the missing AI-answer check tool | **Agree** | server-needs §1 names it: hosted server-side behind `data_call_provider` with GooseWorks' keys, enables scheduled monthly re-checks (no browser today), rows labelled "asked through the engine's API". Never a vendor key in a skill |
| 5b. Keyword data provider (DataForSEO) behind the proxy | **Agree** | server-needs §8 rewritten and raised to HIGH: volume, difficulty, keywords per rival page/pattern, traffic estimates, backlinks, app-store popularity. Meanwhile rules unchanged: no invented volumes, no vendor keys |
| 5c. Scraping Semrush / Ahrefs / BuiltWith pages | **Agree it's not worth it** | Stated in server-needs §8. Tag detection from page source covers what BuiltWith gave us |
| Old scripts (sitemap parsers, Apify crawls) | **Not ported** | The host's fetch reads sitemaps; methods kept, scripts not |

Also fixed while here: server-needs step numbers still pointed at the pre-research-pattern 11-step flow; one stale "must-win" left in server-needs §2.

Not re-run (per orchestrator: no evals or re-runs this round).

## Round 11 — run memory and the Brand Brain (19 Oct), critic on a second monthly run (effort high)

**Wired.**
- New `references/run-memory.md`: job `search visibility check` (monthly).
  - A per-question snapshot is the baseline.
  - Comparisons are like with like, with a noise rule.
  - The five fixes are recommendations, checked for "did it go live" from the live page, sitemap or profile, and "what moved after it".
  - Has a scheduled-run section and a self-contained automation prompt.
- SKILL: brain_map first (core, required reads, chapters 2/5/7/8/9/17), with the brand_read fallback kept. Run-memory Start and End. "Since last time" opens the first message and the report's story; the template has a new section.
- citation-check reads the baseline; meta and server-needs §2 (chapter 8 has no `brain_save` target) updated.

**Critic scenario.** 18 Sep first run, then two 19 Oct variants: (A) a host with a browser, homepage title changed, comparison page drafted but not live, one question reworded and two added; (B) a scheduled server run with no browser. It found 9 major and 10 minor problems.

| Finding | Verdict | Fix |
|---|---|---|
| A scheduled run with no browser loses the ChatGPT baseline: the newest record "with Numbers" has only web-search numbers | **Agree (major)** | The baseline is per cell: the newest record where that cell was checked the same way. Not-checked cells carry `last: <value, date>` |
| Review-by needs a ship date nobody knows; the first record would fix a date too early | **Agree (major)** | Relative timings (`4 weeks after live`, `8 weeks after live`); the run that first sees it live records `live: first seen <date>` and fixes the date from then |
| Multi-part fixes (title + opening; Search Console + Bing + AI-referral) marked done when one part shipped | **Agree (major)** | `done` only when every part is shown, else `not done (partly: …)` |
| Carried open fixes plus five new ones means about 10 moves, or re-issued ids | **Agree (major)** | Still-open fixes come first in this run's five with their ids ("still open from <date>"); new ones fill the rest; anything else is parked on the roadmap |
| A reworded question keeps its id, so different wordings get compared | **Agree (major)** | A rewording gets a new id and the old one is retired; the record names the set version actually asked (question-set atom, question-list) |
| Totals of single tries ("3 of 8, was 0 of 8") read as movement, and the In short example implied cause | **Agree (major)** | Totals only over questions asked both times, with the count stated; "moved" only when a key question passes 2-of-3 or a second check agrees; template examples rewritten without causal wording |
| The scheduled prompt leaves out brand and workspace, titles and saves, review timings, banned wording, `asked on`, the no-learnings rule, Not run, the per-cell baseline | **Agree (major)** | Prompt section rewritten to cover each |
| Since-last-time due at Start, before today's answers exist | **Agree (major)** | Atom steps 1–2 before the free pass, steps 3–4 after it, from its answers; no double asking |
| First message (with since-last-time) vs "at most three lines" in chat | **Agree (major)** | Step 2's message is the first-turn output; the three-line rule applies to later re-deliveries; the atom's "saved notes" line folds into the link line |
| Record size with a method in every cell | Agree | The method is stated once in the record header; cells say only what differs |
| Measurement check ignored free evidence | Agree | Verification and analytics tags in the page source are partial evidence, never proof |
| Script-built markup gives a false "not done" | Agree | Missing in raw HTML on a script-built site with no rendered check → `unknown` |
| A list request's review date isn't a date | Agree | The next scheduled or expected check |
| Run-memory words leaking into the report | Agree | Template bans "baseline", "route", "snapshot", "recipe", "noise rule", "review by", "cell", "derived", "claimed" and recommendation ids |
| An experiment readout needs a truth/claimed label; search verdicts are derived | Agree | Search saves no experiment readout |
| meta missing `file_url`; review-request section named two ways | Agree | Added; one name: "For your email program — review requests" |
| question-set description still said "gets the human's yes" | Agree | Now "shows it for edits after the first answer" |
| The Search Console window ran past the review date | Agree | 28 days before vs 28 after, read once settled (about 31 days) |
| The record was saved before the files it links | Agree | Saved after `questions.md` and `fixes/` |
| The list author's name could enter the record | Agree | Publication and list only |
| Shared files: write-report bans "GPT" (matches ChatGPT); the AGENTS claims bullets sit under "Run memory"; AGENTS line 179 "v<N>" reads as if it applies to run records; the atom's "next week starts from here" is wrong for monthly jobs; a brain-only record can't be read in full on production | **Agree, not mine to edit** | Passed to the orchestrator in the shared notes folder |

**Pushback (§2b).** "Each monthly run compares question-by-question citations" can't hold on a scheduled server run today: it has no browser, so it can't ask ChatGPT or Google's AI. The run checks every fix's ship status, web search, news and sitemaps free. It marks the AI answers "not checked" with the last value carried, and offers the paste set or a check together. The real fix is the goose-aeo engine on the server (server-needs §1).

Not re-run (per orchestrator: no evals).

## 2026-10-20 — hand-test review (Akhil + marketer reviewers)

- **noindex was recommended for old pages "kept live for ads" that still made a false claim.** → gap-to-fix: retiring or merging a page defaults to a 301 redirect to the matching page plus updated internal links; noindex only when no equivalent exists; check live ads, emails and profiles first. finished-fix-examples (g) shows the finished fix.
- **All five fixes were on-site while the engines cited round-ups and rival comparison pages; round-ups pushed to Q1 2027.** → prioritising: when citations lean on third-party pages, at least one of the five is off-site, and it starts this week.
- **Reviews were not used as a lever** (low volume, filed under an old domain). → gap-to-fix review row: the review ask (post-purchase or post-install with the direct link; Google Business Profile reviews where the business has one) and claiming or merging an old-domain profile.

### Report top (write-report shape)

| Finding | Fix |
|---|---|
| Reports opened with "Do this first" before the reader knew what was researched, so the move couldn't be judged (Akhil; 4 marketer reviewers: keep the answer on screen one, but rest it on findings shown above it) | In short now: "What we looked at" (scope, sources, date, main limit) → 2–3 numbered findings with how sure (confirmed / likely / first look) → "So, do this first (because of 1 and 2)", naming the findings; a first-look base makes the first move the one that closes the gap (write-report §1) |
| In short stated provisional or first-look things as fact; counts described a different thing than the claim beside them; first moves assumed unconfirmed assets | write-report §3 checks, now blocking: nothing stronger than the body, every number counts exactly its claim, no unconfirmed asset in the first move (→ "confirm X" or a decision) |
| "Google already ranks you 2nd" in In short from one browser read in India | "What we looked at" states where from and the limit; one ask / one browser / one country is "first look", never a rank fact. Examples in the template made fictional (they named GooseWorks and real rivals); page-map line points to "So, do this first" |

## 2026-10-20 — Writing-for-Agents pass (items 1, 2, 4)

| Finding | Change |
|---|---|
| Step 1 restated references/free-pass.md (~460 words) | Step 1 is the pointer plus the two rules only SKILL had (rank the draft five; every number traces to a source). The details free-pass.md lacked (battlegrounds, atom names, 12–15 questions per audience, positioning examples, templated-set warning, demand sources, gap rows to roadmap) moved into free-pass.md. |
| Setup copied from the guide | Before you start #1 is the setup line (with the loose brand-name match kept); #2 keeps the chapters, fallback sections, sibling files, run memory and claims contract read. |
| Step 2 described claims-gate internals (marker paths) | "A claim the claims gate can't use yet". |
| "AGENTS §8" ×2, "pillar 11"; "AGENTS §8" in references/free-pass.md and rival-content-map.md | Pointers now to guide §3 ("Research pattern", "Schedules", "Public data"); pillar 11 removed. |
| Step 5 listed the working-file saves that the Output table also lists, and restated write-report §2 delivery | Step 5 points to write-report §2 and to the Output table; save modes moved into the table rows. |
| Done when mixed bars with test oracles | Done when: first message leads with k-of-N counts; report has the per-question table, roadmap and exactly five fixes (or fewer, stated); banned-word scan clean; saved with a link. The re-ask oracle is test item 5; "start one fix that week" added to test item 6. |
| "Human" for the person | "Marketer" throughout. |
| Description did not say what the skill is | Now starts "Search and AI-answer visibility (SEO, AEO, GEO). Use when…"; 891 → 694 characters. |
