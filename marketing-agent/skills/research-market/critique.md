# Critique log — research-market

## Round 1 — scope + depth, before writing (subagent, effort high, 2026-10-16)

Inputs: spec 03, page 00 (§3, pillar 1, parts 3–4), page 01 (pillars 1–2), source-map greps, the staging server contract, reader specs 04/07/08/15/16/17.

| # | Finding (severity) | Resolution |
|---|---|---|
| 1 | One persona is the wrong unit; plan-campaign reads segments, creators need an audience target; buyer ≠ user ≠ payer; no anti-persona (MAJOR) | Output is 2–4 segments with roles + an anti-persona; single segment only when evidence shows no split (SKILL step 6, output-formats § Segments). |
| 2 | Competitor write-back conflicts with the contract: `competitor_save` tracks (cap 10, starts research) and research-competitors requires a yes; indirect/do-nothing cannot be stored (MAJOR) | Read roster + suggestions first; typed list in the read; `competitor_save` only for directs the founder confirms by name (steps 5, 9, 10). Server need #7. |
| 3 | "Approval gates: none" is wrong — proxy calls, mentions and Trustpilot sync are paid; no ScrapeCreators price check (MAJOR) | Spend gate via `atoms/paid-pull` (plan, credit total, yes; probe call on first use). Spec's "none" overridden; logged here. Server need #3. |
| 4 | Demand check has no data source; would invite invented seasonality (MAJOR) | Labelled proxies (competitor ad dates, review/post dates, search suggestions, category priors) or "unknown" (step 7, mining-method § Demand). Server need #5. |
| 5 | Review-surface reach not stated; ToS limits (Trustpilot, G2, Places) (MAJOR) | Per-company-type source map with reachability marks brain / proxy / browser / export / unreachable and ToS notes (references/sources-by-company-type.md). Server needs #4, #6. |
| 6 | Private evidence ignored (tickets, surveys, returns, sales calls) (MAJOR) | Asked for every run; mined as `private` rows (before you start, step 3). Server need #8. |
| 7 | JTBD forces, triggers, objections, questions not first-class (MAJOR) | Full taxonomy + force + awareness + job on every row (mining-method § Tagging). |
| 8 | Boundary with listen-social unstated (MAJOR) | Out of scope: this is a dated snapshot; listen-social owns weekly mentions/trends; listen-social tags `VoC` quotes for the next refresh. |
| 9 | Company-type breaks (DTC gifting, B2B committee, app churn, marketplace per-ASIN, local volume, services near-zero) (MAJOR) | Source map table per type; B2B segment variant (role × size, buying committee); geography field for local; cold-start defaults for services. |
| 10 | No refresh layer; reactive triggers missing (MAJOR) | Step 11: cadence + triggers; saved review/source refresh automation, paused until enabled, only on a yes. |
| 11 | Cold start undefined (MAJOR) | Ladder (sources reference) + evidence floor (~30 substantive items or no established theme) → stop + interview/survey kit (step 8, recognition-and-interviews.md). |
| 12 | Done-when rewards flattery (DEPTH MAJOR) | Read must name a finding that contradicts or extends the founder's stated belief; three cold questions; founder's belief recorded verbatim up front (steps 1, 9). |
| 13 | "20+ quotes" is the wrong bar — saturation is (DEPTH MAJOR) | Batches of 20–25, stop at two batches with no new theme, report n read; established = 3+ quotes from 2+ sources (mining-method). Done-when keeps the spec's 20 minimum. |
| 14 | Sample bias rules missing (DEPTH MAJOR) | Rating stratification, recency, verified/incentivised flags, syndication dedupe, frequency ≠ vividness (mining-method § Sampling). |
| 15 | Quote integrity: verbatim, links, outcome statements ≠ claims, testimonial permission (DEPTH MAJOR) | `contains_claim`, `testimonial_ok`, verbatim rules, retrieved date (mining-method § Quote integrity). |
| 16 | Brand vs competitor vs category must be labelled (DEPTH MAJOR) | `about` field on every row and split counts on every theme. |
| 17 | Persona fields need evidence ids and confidence; demographics weak; ad targeting ≠ buyers (DEPTH MAJOR) | Output format requires ids + confidence; "unknown — ask" for unevidenced fields; rule in mining-method § Segments. |
| 18 | Frameworks: encode JTBD forces, taxonomy, awareness, sophistication, objection→resolver; skip stock personas, empathy maps, VPC, TAM, Kano (DEPTH) | Encoded / listed as overkill in mining-method. |
| 19 | Minor: switching direction, WTP, search language, named hangouts, product-bug list, method note (MINOR) | All in taxonomy and formats. |
| 20 | Write-back shape: two dated documents, audience proposal, ≤5–8 insight facts after the test, competitor_save for confirmed directs only, never claims (contract) | Adopted with ≤5 facts; plus the workspace files (sibling convention: brand coworker workspace) so files are overwritable and structured. |

Rejected / changed from the critic:
- Critic suggested only documents. **Changed:** canonical copy is the brand coworker's workspace file (the convention two sibling sessions already use for their artifacts), plus the knowledge import. Reason: readers need a stable path to read and merge; imports cannot be replaced by key (server need #2).

Overlaps noted for the consolidation pass: `atoms/paid-pull` and `atoms/save-to-brain` are identical in research-competitors and listen-social; a claims check (approved-claims lookup) also appears in make-* playbooks.

## Round 2 — adversarial run (3 brands) + contract check (subagents, effort high, 2026-10-16)

Brands simulated: Personal Day (DTC skincare, Claude Code with browser), a 6-week-old B2B SaaS (hosted chat, MCP only), a pre-revenue ADHD habit app (Cursor with shell). Contract check across the three playbooks against the 88-tool staging list, AGENTS §2–5, specs and sibling folders.

| # | Finding (severity, source) | Resolution |
|---|---|---|
| 1 | Spend gate unworkable: ~10 unpriced yeses on a first run; per-playbook logs (MAJOR, adversarial) | `atoms/paid-pull` rewritten: one probe per run (result kept), staged yeses (A searches, B dependent calls), shared `research/credits-log.md`, server-priced tools use their own price, human sees plain-language plan with no tool/vendor names. |
| 2 | Worked example sits in the test brand's own category; would be copied (MAJOR) | All examples moved to a fictional dog-food brand; rule added: every segment name and trait must trace to this run's T-/V- ids (output-formats, mining-method). |
| 3 | Synced reviews cannot be mined as rows (snippets only) (MAJOR) | Rows labelled `via synced evidence (snippet)`; star/theme-specific searches; server need #11. |
| 4 | Cold-start trigger wrong both ways (competitor volume lifts it; private notes don't count) (MAJOR) | Floor = own customers + prospects + private read; competitor volume never lifts it; run mode decided at the floor check; `about: prospect` added. |
| 5 | Nothing asks the founder which competitors to track (MAJOR) | Fourth recognition question; step 10 saves only names picked there. |
| 6 | Verbatim/links not protected across long runs; private rows have no link (MAJOR) | Write-as-you-go to `voc-bank.jsonl`, never retype; 10% link re-check (min 5) at the floor step; private citations `private:<path>#<date>`; Done-when reworded. |
| 7 | 21-column table chunks badly in knowledge search (MAJOR adversarial; MINOR contract #23) | Self-describing quote blocks in the .md + filterable `voc-bank.jsonl`. |
| 8 | B2B best sources mishandled; summaries instead of verbatim (MAJOR) | Ask for raw transcript excerpts and 15–20 pasted competitor G2 reviews; `paste` mark. |
| 9 | Pre-revenue competitors picked from memory (MAJOR) | Candidates from founder answer, waitlist answers, one community search; labelled; founder OK before paid pulls. |
| 10 | Readers search `evidence`, not documents (MAJOR, contract #2) | "How readers find it" column; NOTICE-from-research-listen-session.md posted for plan-campaign, make-static-ads, run-organic-social, improve-search-visibility. |
| 11 | Listen-social VoC hand-off never read (MAJOR, contract #5) | Before-you-start reads `social/listening/` VoC-tagged quotes; meta reads updated. |
| 12 | Frontmatter invalid YAML (MAJOR, contract #1) | `description: >-` folded block; parsed with PyYAML. |
| 13 | Evidence floor checked after segments (MINOR, contract #12) | Floor check moved to step 6, before segments. |
| 14 | Learnings written as agent proposals are refused by the server (found by a sibling's staging test) | Insights shown, saved only on the human's yes with `user_correction` + their reply as `user_statement`; refresh deactivates replaced `[market …]` rows. Server need #12. |
| 15 | Minor: tools_load group `ads`; `brand_source_refresh` name; knowledge_sync limits; USD ceilings on refresh automations; read `kit` audience first; demand proxy survivor bias; recognition loop and "cold"; insights pile-up; audience merge; saturation never triggers; survey variants; population check; personal-attribute flag; Amazon login; TikTok comment links; named creators need evidence; get_started protocol; file_list before file_read; needs list gaps | All applied (SKILL Before you start/steps 2–11, mining-method, sources, recognition, output-formats, meta). |

Rejected / changed:
- "Verify ScrapeCreators paths before shipping": done instead against the vendor's published OpenAPI spec (query keys and recency options now in `references/public-data.md`); no paid call was made to confirm them on the proxy — the first real run's probe does that.
- "In hosted chat, 'accept in the app' breaks 'everything happens here'": kept as a proposal — `knowledge.audience` accepts agent proposals and the founder's acceptance is their decision; the read says the proposal is waiting on the brand.

## Round 3 — final adversarial + contract re-check (subagent, effort xhigh, 2026-10-16)

Verdict: not clean (3 MAJOR). All fixed:

| # | Finding (severity) | Resolution |
|---|---|---|
| 1 | `competitor_research mentions` treated as priced on a card; its schema has no quote/confirm field — could spend without a priced yes (MAJOR) | paid-pull (all three copies): priced like a proxy row from the credits log, its first use can be the probe, never called before a yes to a total that includes it; step 2 wording; server need #3 extended. |
| 2 | Cold start fires wrongly when own evidence sits on one platform ("established" needs 2+ sources) (MAJOR) | Established = 3+ rows from 3+ distinct authors, "single source" flagged; floor clause uses distinct authors about brand/prospect. |
| 3 | 10% link re-check impossible in hosted chat → Done-when unreachable (MAJOR) | Re-check only where the host can open pages; otherwise compare to stored text and say "links not re-opened (no browser here)"; Done-when and mining-method reworded. |
| 4–13 | Minor: policy flags missing from quote blocks; append wipes files; `about: private` conflates source; cold-start contradictions; Done-when gaps; founder correction vs proposal collision; step 11 ceilings and reminder; save-to-brain scope and delete target; meta gaps; cross-reference drift; missing Reads/Writes labels | Quote blocks carry personal-attribute / incentivised / status; read-modify-write everywhere; `source_class` added (pasted rival G2 reviews never lift the floor); kit handed over then steps 7–11 continue with own evidence, no audience proposal without own segments; Done-when "yes or partly", "≤ approved", founder-rejection branch; correction written first, proposal merged after; smallest USD ceilings proposed and labelled, `Next refresh:` header line as the reminder; atom fixes; meta needs/reads; cross-refs and labels fixed; tests aligned. |

## Round 4 — confirmation pass (subagent, effort xhigh, 2026-10-16)

Verdict: **clean** — the three round-3 MAJORs verified fixed and consistent across SKILL, references, atoms, meta and tests; frontmatter parses (1,005 chars); atoms and public-data byte-identical; adversarial check of a pre-revenue app with a waitlist in hosted chat holds (prospect rows count toward the floor, candidates confirmed before paid pulls, no audience proposal without own segments).

Minor findings, all applied: paid-pull recency wording aligned with the recency rule (all copies); mentions described as "repeat inside cache window free, otherwise paid"; `Next refresh:` line added to the read's format; test pass lines aligned ("yes or partly", public links only, "not re-opened" without a browser); personal data stripped from private quotes and insights never quote claim/personal-attribute rows; server-needs step reference corrected.

**Final state: clean at round 4 (xhigh); later listen-social rounds touched only the shared `atoms/paid-pull` recency wording and `references/public-data.md` paging rules, both verified byte-identical and consistent with this playbook in rounds 5–7.**

## Round 8 — fix pass from the 16 Oct cross-set review (2026-10-16)

| Source | Change |
|---|---|
| depth §3 (MINOR ×2) | Segments ranked in a priority table (evidence share, pain intensity, willingness-to-pay signal, reachability, product fit) with a named primary segment and its job; a two-line message implication per segment (what to lead with, the objection to pre-empt). The read and every research artifact open with "Do this first, because…". |
| contracts M20 | The audience summary is written only as an `agent_proposal`; a founder's stated correction is quoted in the proposal's rationale and the read, never written as a correction from here. |
| routing C4/C12 | Description adds "research my audience", "who should we target"; ends "Not for a list of businesses or people to pitch — research-audience". |
| AGENTS §3/§5/§8 | Local `atoms/paid-pull` and `atoms/save-to-brain` copies deleted; the playbook loads the shared `atoms/save-to-brain/ATOM.md` and `atoms/spend-gate/ATOM.md` (this session owns both) and `atoms/save-learning`, `atoms/claims-gate` (learn-my-brand). `references/public-data.md` moved once to `atoms/spend-gate/proxy-endpoints.md`. Description rewritten in `>-` form under 1,024 characters with a "Not for … — use …" line. Connection sentence, `get_started`, `brands/<slug>/` no-coworker fallback and credits log `research/credits-log/<YYYY-MM>.md` per §8. |
| contracts F1/F2/M4 (learnings) | Learnings through save-learning: at most 3 rules per run, ≤300 characters, prefix per §8, only on the human's words, retiring this playbook's own earlier facts in the same call. |
| contracts M10/M11, routing U4/U5 (money) | Spend through the spend gate: one probe, a yes to a ceiling labelled an estimate, stop at it, log every charge; tool caps taken in dollars are described in words, never quoted; automations created paused and switched on only on a yes. |
| contracts M3 | "A lean read can miss the marker" removed — a lean `brand_read` returns every must/dont. |

Rejected / deferred: none.

## Round 9 — adversarial + contract critique of the fix pass (subagent, effort high, 2026-10-16)

Fix-pass verdict across the set: not clean. For this playbook 2 MAJOR, both fixed:
| # | Finding | Resolution |
|---|---|---|
| 5 (MAJOR) | recognition-and-interviews still told the agent to write the founder's correction to the brand as `user_correction` (contradicting M20 and bypassing save-learning) | The correction is quoted in the read and the audience proposal's rationale; if they want it as a rule, it is offered as one of the ≤ 3 learnings through save-learning. |
| 6 (MAJOR) | The read's "Next" line named playbooks to the marketer | Plain-word next steps; "never name a playbook to the marketer". |
| 10–12 (MINOR) | Refresh automation without a coworker; `automation_list` missing from needs; learnings retired too broadly; "Not for X — Y" missing "use" | Refresh offered only with a coworker; needs updated; retire only the facts a new rule replaces or contradicts; "— use". |
Shared atoms (this session owns them): frontmatter made valid `>-` YAML (MAJOR); "Retire old copies" step now covers both modes and requires every caller tag; spend-gate's credits log follows the no-coworker fallback and one probe prices all proxy reads (MINOR).

## Round 10 — confirmation (subagent, effort high, 2026-10-16)

Verdict: **clean**. Minor: server-needs row 3 still pointed at the removed paid-pull atom — now `atoms/spend-gate` branch B.

2026-10-16 orchestrator: removed workarounds for today's 300-char/8-fact server limits per Akhil — the Brand Brain rebuild removes them; interim handling lives only in atoms/save-learning.

2026-10-16 final contract check: skill.meta.json: removed "≤300 chars" from the learnings line (save-learning forbids shortening to fit today's server); shared atoms moved to `shared_atoms`.
2026-10-16 orchestrator ruling: bare `atoms/<shared>` paths in server-needs.md converted to file-relative form; save-to-brain now defines the creator as a document's first tag (voice-card and claims-gate already tag that way).

## Rebuild on the AGENTS §8 research pattern (2026-10-17)

**Why.** The orchestrator's literal Sonnet dry run, on Juicebox asking "Who actually buys this, and what do they say in their own words?", found four failures:
- its first output was a question message asking the founder to hand-copy 15–20 G2 reviews;
- it refused to open public G2 pages;
- it ran only 3 web searches;
- it would have ended at "Cold start" with a chat summary.

**What changed (rewrite, not patch):**
- **Top rule:** "free pass first, ask nothing, report once". The "ask only what is missing" block and the recognition test as a separate stop are gone. The founder's belief comes from the brand's audience field (or "none on record").
- **News first** (step 2) for the brand and the category.
- **The free pass (step 3)** reads three corpora — own customers, the 3–5 closest rivals' customers, the category:
  - review sites read page by page in the host browser like a person (no bulk scraping, no login);
  - community threads found by web search;
  - one worker per corpus where the host has subagents.
  - `sources-by-company-type.md` was rewritten: G2, Capterra and TrustRadius moved from "paste" to "browser". Paste is now only for private material, asked in the closing message for a specific gap. The proxy is only the paid top-up.
- **Cold start** is declared only after the full free pass, and the report shows what was read.
- **"For you" and "You vs them"** (AGENTS §8 point 7): shapes added to `output-formats.md`. The read became the readable report, adding "what I read" with a couldn't-read list. Brand-document titles and tags are now defined.
- **One closing message (step 9)** holds:
  - the recognition check;
  - private material named specifically;
  - claims sign-off;
  - the one-yes paid top-up;
  - rivals to track;
  - the area to go deeper on;
  - rules and refresh.
- **Supporting files:**
  - Demand adds Google Trends where the browser opens it.
  - mining-method treats quotes on vendors' "alternatives" pages as pitch, not buyer evidence.
  - meta 0.2.0: claims-gate added to `shared_atoms`; unused tools dropped.
  - server-needs steps renumbered.
  - the test now fails any question before the report.
- **Paths readers use** (`research/market/<D>-read.md`, `personas.md`, `voc-bank.md`/`.jsonl`, `demand.md`) are unchanged; the guide index needs no change.

## Rebuild — Sonnet re-run (2026-10-17)

Sonnet, web search and page fetch only (no browser, no GooseWorks calls), Juicebox, "Who actually buys this, and what do they say in their own words?". The first attempt was lost to a laptop shutdown; the second ran to completion.

**Against the four failure modes of the old version:**
1. **First output a question asking the founder to hand-copy G2 reviews:** gone. No question came before the report; the closing message held the decisions.
2. **Refused to open public G2 pages:** gone. It tried G2, Capterra, TrustRadius and Reddit itself (all blocked page fetch in this test) and used the review sites' own search snippets.
3. **Only 3 web searches:** now 60, reading about 330 items across own, rival and category sources, with workers per corpus.
4. **Ended at "cold start" with a chat summary:** a full document report. Cold start was declared only after the full read (about 18 distinct first-hand authors on Juicebox itself), with a provisional primary segment — lean in-house talent teams at startups and scale-ups. It kept 59 quotes (re-opened 13; 12 matched verbatim, 1 retired), and included "For you" lines, "You vs them" and the interview kit.

It also found the Fetcher opening unprompted, through news first: what Fetcher's users valued, and the 19 Nov window.

**Playbook defects it reported, fixed:**
- **Verbatim rule vs a summarising fetch tool.** Each row now records how its words were captured (`capture: page / snippet / fetch-excerpt`). `fetch-excerpt` rows count for themes but never become hooks or ad lines until seen on the page.
- **Second-hand quotes.** A review quoted on a vendor's blog is never a row; the review site's own search snippet is first-hand.
- **The floor was undefined.** A new "The evidence floor" section in recognition-and-interviews says what counts: first-hand only, not curated, editorial or second-hand; a rival's customers count only when actively moving to us.
- **Two conflicting first lines.** The report now always opens "Do this first, because…"; in a cold start that line is the interview kit, starting with the provisional segment, and segments are marked provisional with no audience proposal.
- **The closing message was too long.** It now has at most five numbered decisions, the rest one line each as optional.
- **"N credits" needed a paid probe before the report.** With no history the founder names N, and nothing paid runs before the report.
- **Smaller fixes:**
  - Relative dates become `~YYYY-MM`.
  - Themes resting on rows older than 24 months are "dated" and never carry the primary segment.
  - Stratification is said to be impossible where a site can't sort.
  - With workers, the main run writes their rows as each returns, and theme and segment are filled later.
  - Review sites may be named as sources.
  - Contradictory brand facts go to "For the founder" and are never used as claims.
- **New rule (also in listen-social and research-competitors):** only a site's own public pages — never unofficial mirrors, scraped copies or unofficial APIs.

**Not changed:** "Connect GooseWorks first" stays the stop when no GooseWorks tools are listed; the test overrode it, and the saves need GooseWorks.

**Still weak:**
- A fetch-only host can't open most review sites, so first-hand own-brand evidence there is thin and a cold start is likely for B2B brands. A host browser, or server-needs #4/#6, closes it.
- SKILL.md is about 1,180 words of process, over the ~1,000 target.


## Rebuild 3 — market research, listening folded in, write-report (2026-10-18)

**Why.** The founder's 18 Oct hand test on GooseWorks ("i want to do the market research for gooseworks"). Read from the transcript:
- It drifted into rival complaints, not the market.
- A worker read about 40 of GooseWorks' own Product Hunt comments, saved none, then stalled 52 minutes on a browser approval prompt. The main run never told the founder, threw the work away, and called it a cold start.
- It used the production server although the test folder names staging, then rewrote the host's permission settings unasked.
- It briefed workers from the website's prices instead of the brain's.
- It never read its own references.
- It skipped the quote check.
- It saved only by raw upload.
- The report read like agent notes: ids, "free pass", "corpus", arithmetic.

**Decisions** (AGENTS §8, 18 Oct):
- Market research is about the market.
- listen-social is folded in as an atom.
- Every report goes through `atoms/write-report`.
- Schedules: a monthly repeat.

**What changed (rewrite):**
- **Scope.** SKILL.md and the description were rewritten around the market: the category, size and growth, what's changing, how and where buyers find and buy, pricing norms, where attention is, demand, who buys and their words, what people are saying now. Rivals get one short section that points to competitor research. Optional areas: the market · the buyers · what people are saying.
- **Three worker briefs:**
  - `atoms/market-pass` (new), for the market dimensions;
  - `atoms/buyer-voice` (new), which keeps the mining method and saves rows as it goes, so a stopped worker's rows are kept;
  - `atoms/listening` (new, from listen-social), with the craft in `references/listening-craft.md`: watchlist, name collisions, own public pages only, who's speaking, classify, risk with an immediate alert and hold list, outliers saved to the inspiration library, trends with post-by dates.
  - Reply drafting is a BACKLOG card.
- **Process fixes from the transcript:**
  - use the server the project names;
  - create a missing brand from its site without asking;
  - don't show an unrelated get_started menu;
  - brand facts from the brain over the website;
  - never change the host's settings;
  - hand each worker its brief in full;
  - keep a stopped worker's output;
  - say so when a worker stalls;
  - the main run opens browser-only pages itself, with one line to the founder first, and never sits silent on a prompt;
  - check every number, date and quote against what a worker returned;
  - a late read means rewriting the report, never patching it.
- **The report.** `references/report-format.md` replaces output-formats.md and follows write-report:
  - "In short" first, then a story with a "For you" sentence on each section, "You vs them", what to do, what we couldn't check, and sources;
  - no ids or jargon;
  - a local file `gooseworks-reports/<slug>/<D>-market-research.md` plus the brand copy `research/market/<D>-read.md` with its link.
- **The closing message:** at most three lines and five decisions, including the monthly repeat.
- **Supporting files:** meta 0.3.0 (new atoms, write-report in `shared_atoms`, brand_setup, file_url, inspiration tools, meta_read); server-needs adds listen-social's brand-mention search, spike watcher and trend data, plus #18 (a browser that doesn't ask per site); the test now uses the founder's exact ask and grades against write-report §3.
- **listen-social deleted.** Its critique history is appended below. Readers were repointed by a helper session: analyze-performance, run-organic-social, make-static-ads, make-video-ads, make-content, work-with-creators, where-to-start, email-lifecycle, learn-my-brand's record template, the router, the guide §4 index, README, and the save-learning, save-to-brain and spend-gate atoms.

**Schedules rule updated (AGENTS §8, 18 Oct):** the repeat offer in step 7 is now a judgment call — offered only when repeating would help this brand, with the reason and a cadence; never for one-off questions. (The in-flight re-run used the earlier fixed-offer wording.)

## Rebuild 3 — Sonnet re-run (2026-10-18)

Sonnet ran the founder's exact ask ("i want to do the market research for gooseworks") with read-only staging, web search and page fetch only, no browser, and workers handed their briefs.

**Result:**
- **It is market research now.** The report covers:
  - size with named analyst estimates;
  - funding into the category;
  - what's changing (Meta opening ad accounts to AI assistants, photo-to-video, AI-ad disclosure laws from the EU, California and Meta's 30 Oct terms);
  - how buyers buy;
  - a pricing-norms table;
  - channels;
  - demand;
  - buyers in their own words, from 18 comments by GooseWorks' own users and about 270 read overall;
  - what people are saying in the last 30 days (almost nothing about GooseWorks; anger at rivals' billing);
  - competition in one short section.
- **No question before the report.**
- **Against write-report §3:**
  - "In short" leads with "Do this first" (talk to 5–8 real users);
  - plain words and a story that flows;
  - no ids or agent terms found;
  - every section ends with a plain "For you";
  - You vs them, what to do, the interview kit, couldn't-check and sources are all there.
- **Weaknesses:** a preamble line sat above "In short", and the brand-copy link was a placeholder because saves were off in the test.

**Defects it reported, fixed:**
- **The browser heads-up vs "don't message the founder":** status notes are now allowed and questions are not.
- **No fallback without a browser:** review-site snippets, fetchable public pages and free server reads, said once in "In short".
- **A same-day repeat:** it replaces the earlier report and opens with what changed, with no preamble; an older bank is converted.
- **Cold-start wording:** "18 of about 270" is allowed; sum-style arithmetic isn't.
- **A garbled sentence** in step 5 was rewritten.
- **The cyclist on the saved rival list:** bad roster entries are dropped and named.
- **"Hand it over in full" was ambiguous:** it now says paste the brief's full text.

These edge cases moved into a new local atom, `atoms/edge-cases`, to keep SKILL.md near 1,100 words.

**Still weak:**
- Reddit, G2 and Capterra are unreadable without a browser, so the lead buyer stays provisional for B2B-ish brands.
- Fetch returns excerpts, never page-verified quotes.


## Round 4 — senior-marketer review (2026-10-18): verdicts per AGENTS §2b

Source: `marketing-agent-test/results/reviews/research-review.md` (§2, §3, §6). Akhil approved applying the ranked fixes; positioning stays on the backlog. Each point was checked before acting.

| Review point | Verdict | What changed / why not |
|---|---|---|
| §6 #1 Buyer groups and the customer-quote bank have one owner, research-audience; market sizes and reads them | **Agree** | Removed the buyer-voice worker, mining-method, sources-by-company-type and recognition-and-interviews (handed to the audience session in the shared notes folder). research-market now reads `research/audience/buyer-groups.md` (confirmed by the audience session: audience counts buyers or companies per group; market multiplies by price, uses its own figures as context, and says where it disputes a count; audience imports the old `research/market/voc-bank.*` and personas once). It no longer writes `personas.md` or `voc-bank.*`. Trigger phrases were rescoped: "who is my customer", "voice of customer" and "who actually buys this" are removed from the description. Not done here: readers of `research/market/voc-bank.*` and `personas.md` in seven other playbooks — that is the audience session's half, flagged to the orchestrator. |
| §6 #3 Brand-watch mode: listening alone, risk first, alerts only; weekly, daily in launch or crisis; silent below threshold. Reply drafts up the backlog, owner run-organic-social | **Agree** | Listening atom: "two ways you run", plus explicit brand-watch thresholds. SKILL: a "Brand watch — alerts only" section and `research/market/watch/<D>.md`. BACKLOG: reply drafts moved from #18 to #3, owner run-organic-social; internal card references renumbered. Caveat: scheduled runs have no browser, so a scheduled watch reads only search and fetchable pages, and the offer says so. A true always-on alert still needs the server's watcher (watch-and-alert, backlog). |
| (follow-up) research-market no longer proposes the brand's audience field | **Agree** | research-audience proposes `knowledge.audience` now; `brand_update` removed from research-market's needs. |
| §6 #4 Decide which market; size it bottom-up; delete "skip TAM/SAM/SOM" | **Agree** | market-pass §1 is now a decision: 2–3 candidate categories, which one buyers use, a recommendation, and what changes otherwise. §2 is top-down (publisher, year) plus bottom-up (likely buyers × price per buyer group, inputs sourced or labelled assumptions, never community counts). The skip line went with mining-method. |
| §6 #6 Read sibling reports, state disagreements, end with "what this means for positioning" | **Agree** | Brain read now includes `research/audience/`, `research/competitors/` and `plans/`. The report has a "where this disagrees" section (only when it does) and "what this means for positioning" (a pointer; write-my-positioning stays on the backlog). |
| §6 #8 Cadences | **Agree** | A monthly one-page pulse plus a full report each quarter; brand watch weekly, daily in a launch or crisis. The offer is still a judgment, with the reason, and says scheduled runs have no browser. |
| Source balance and skew line; baselines | **Agree** | The listening return has a source mix; the report's sources end with a skew line; the market-pass returns baselines; the report keeps a fixed baselines table. |
| write-report changes (Decisions box, not-doing section, length budget, "For you" only where it matters, no unverified claim in "In short") | **Agree** | `references/report-format.md` rewritten to the new shape, including a one-page pulse and the brand-watch note. |
| §3 #7 For B2B, offer the paid read in the opening message rather than after a thin report | **Push back** | The test runs had no browser; with one, the free pass reads part of these sources. An upfront offer reintroduces a pre-research question and a spend ask before any result — the exact failure §8 was written to stop. Kept: the top-up comes after the free pass, and the report says plainly what it couldn't read. Revisit if browser-equipped runs still can't read Reddit, G2 or LinkedIn. |
| §8 one upfront customer-data question | **Not used here** | Customer data serves buyer groups, which audience research now owns; it asks. Market sizing reads audience's results. |
| (noticed) write-report's banned-vendor list includes "Claude", but GooseWorks' own product claim is "inside Claude" | **Flag to the orchestrator** | A brand whose product names a vendor would fail the mechanical check for stating its own facts. write-report needs an exception for the brand's own product facts. |

## Round 5 — eval fixes (2026-10-19; v2 run, with skill 11/17 must-pass vs baseline 3/17)

Each failing check was confirmed against `evals/results/2026-10-19-v2/research-market/with-skill/session.jsonl` before acting. No re-runs this round.

| Check | Verdict | What changed / why not |
|---|---|---|
| M10 / E1 "market-size figures fabricated" ($2.51B Mordor, 14,500 buyers, $3,588, $536M) | **Mostly judge noise** | $2.51B and the Mordor attribution are in a web-search result. 14,500 came from a saved audience report (contamination from another run, but reading it is what the playbook asks). $3,588 is $299 × 12, and $536M is the sum. The real fault underneath is E2. |
| E2 / S5 no inline links; sources list with no URLs | **Real — fixed** | Worker briefs now require every fact with its link and date inline. A pre-delivery check in `report-format.md` says links sit next to facts, sources match their site, and a computed number shows its inputs. |
| M5 buyers not quoted word for word with links | **Real — fixed, with a §2b note** | Step 5 now quotes 3–5 buyers word for word with links, from research-audience's bank or this run's listening, never composites. Note: the full quote work belongs to research-audience; market quotes a few to ground the story. |
| E3 "In short" leaned on a second-hand quote | **Real — fixed** | The check counts the 150 words and bars anything the body calls unconfirmed or second-hand. |
| E9 platform claims not checked on the primary page | **Real — fixed** | market-pass §3: open the primary page for every platform or legal claim, or mark it "not confirmed", and it never appears as fact. |
| E10 pricing table had 7 products | **Real, minor — fixed** | "At least 8 products". |
| E12 name confusion not stated | **Real** | Caused by the run skipping the listening worker. The report shape now says "what our name gets confused with, or 'nothing found'"; the depth floor (below) makes the listening run. |
| S6 closing message too long | **Real — fixed** | An exact closing-message shape in `report-format.md`: one line to do first, two links, at most five one-line decisions, one repeat line. |
| Depth: no workers, 10 searches, **0 page fetches** | **Real — fixed** | Both workers now run (or the main run does both in turn), each with a standard depth: market about 15 searches and 12 fetches, listening about 12 and 12. Workers never load skills or start their own subagents. |
| An earlier report exists (shared staging brand) | **Contamination — one real rule** | edge-cases: reuse a report newer than 30 days as the base (re-check what moves, deliver what changed, never re-deliver it untouched) or refresh in full; say which, in chat and in the first "In short" bullet. |

Expected cost now: about **$4–5 and ~15 minutes** per full report (two lean workers plus the main run), up from $2.18 and 14 minutes, which was too thin.

## Round 6 — ports from the old library (2026-10-19): verdicts per AGENTS §2b

Sources: `marketing-agent-test/results/old-vs-new/research-ci-brand-seo.md`, `social-monitoring-content.md` and `design-research-tools.md` (the Wayback section). Old skills were read as reference only: craft taken, never their structure, vendor wrappers or keys.

**Bug fixed first: readers of the moved quote bank.**
- Repointed to `research/audience/voc-bank.*` and `buyer-groups.md`: plan-campaign (SKILL, two atoms, meta), run-organic-social (meta, calendar-craft, test), improve-search-visibility (SKILL, atom, question-list, meta), work-with-creators (SKILL, data-sources), the voice-card atom.
- Path and owner name only, in the excluded playbooks: make-static-ads and make-video-ads (reading-the-brain, meta), make-content (content-brief atom, meta, test), learn-my-brand (description, brain-map, out-of-scope line). run-paid-campaigns only reads `research/market/demand.md`, which is unchanged.
- The guide index has a research-audience row (`buyer-groups.md`, `voc-bank.*`, the report and its readers).
- where-to-start's map describes research-market and research-audience by their new jobs; customer interviews point to research-audience.
- The router's research-audience row carries the buyer and persona asks.

| Port | Verdict | Where it went |
|---|---|---|
| Category-choice rules (launch-positioning-builder §2A) | **Ported** | market-pass §1: existing vs sub-category vs new, with the rules "buyers already search for it → use it", "half the sales calls explaining → don't create one", create only when nothing fits and keep it plain. |
| Events and deadlines (industry-scanner "Industry Events") | **Ported** | market-pass §6: conferences, speaker applications and calls for papers, award entries, buying seasons — with dates. |
| Idea validation (product-demand-research, all of it) | **Ported** | New `references/idea-validation.md`: hypotheses first, attention vs buying signals, social-commerce pass, scoring in words, the cheapest next test with a pass mark. SKILL routes "is there demand for …?" there, and the description gains that trigger. |
| Free feeds (hacker-news-scraper, blog-feed-monitor) | **Ported, as URL recipes** | listening-craft: the Hacker News search URL (search_by_date, tags, created_at_i window); RSS/Atom discovery (the head link, then the common feed paths). No Python, since hosted chats have no shell. |
| Transcripts (transcript-intelligence) | **Ported, as a paid top-up** | listening-craft: transcripts of the top 5–10 videos per platform, with the "auto-transcripts aren't exact" guardrail. |
| Product request and workaround tags; buying-intent scale (comment-mining steps 2–4) | **Ported** | listening-craft § Classify; the listening atom's return shape counts each step. Parent context kept, and rivals' ad comments read. |
| Trend test, five responses, horizon (trend-discovery steps 3, 6) | **Ported** | listening-craft § Outliers and trends. |
| Outlier baseline per format; flag collaborations and paid boosts (outlier-post-finder step 3) | **Ported** | listening-craft § Outliers. |
| Voices the buyer follows (kol-content-monitor Phases 3, 5; kol-discovery Phases 1–3) | **Ported** | listening-craft § Voices: signal types (convergence, spike, underdog, controversy), the post-within-3-days rule, and the discovery method (LinkedIn post search is a paid top-up). The listening atom gains a step; in brand-watch mode only a convergence on our category is an alert. |
| Objection map with answers; "how buyers decide" fields | **Not ported here — push back on the placement** | Both reviews place them in research-audience (gaps #6, #7), which owns buyer groups and quotes since 18 Oct. Putting them in market research would bring back the overlap the 18 Oct review removed. Flagged for the audience session. |
| Daily industry scan | **Rejected** | The review agrees: a daily cadence is noise. Monthly pulse plus brand watch instead. |
| Old scripts (logo scraping, Apify fallbacks) | **Rejected as code** | Methods only, as URL recipes. Scripts need a terminal and some need vendor keys. |

## Round 7 — run memory and the Brand Brain (2026-10-19)

**Wired in.**
- "Read the brain" now starts with `brain_map`, then `brain_open` and `brain_search`, when `brain_*` tools are listed, with `brand_read` and `knowledge_search` as the fallback.
- A new Before-you-start step 3 runs run-memory Start. A new step 7 saves the run record **before** the closing message, and the one-line "saved" note is folded into that message.
- New `references/run-memory.md`:
  - jobs: `market research` (quarterly or on ask), `market pulse` (monthly), `brand watch` (weekly, daily during a launch or crisis);
  - the numbers: the market chosen, size top-down and bottom-up with inputs, price norm, Google Trends, mentions, feeling, AI answers, reviews;
  - the brand-watch record fields;
  - tests and outcome sources for recommendations;
  - how the founder's answers are recorded;
  - method copies and agent prompts for the scheduled pulse and brand watch.
- Brand watch runs Start and End as job `brand watch`.
- Meta: `run-memory` in `shared_atoms`, the `brain_*` tools in needs, run records in writes.

**Critique (subagent, high effort): a scheduled weekly watch with nobody present, and a first run with no history.** 11 major and 15 minor findings across both playbooks. Fixed here:
- **A pulse after a quarterly report read only pulse records.** Now the last record is the newest of either job (report or pulse); brand watch stays separate.
- **An older report with no run record made the run say "first run" and "what changed" at once.** Now it says "first tracked run; last report <date>", uses that report's baselines labelled with its date, and logs its moves as recommendations with new ids.
- **The founder's decisions never reached the record**, because the closing message came before the save. Now the save comes first, and a same-day re-save records answers given afterwards.
- **research-market had no scheduled prompt or method copy.** Both are added for the pulse and the brand watch, self-contained, because the server-side worker has no skills folder.
- **Brand-watch thresholds couldn't be judged in brand-watch mode.** The mode now counts mentions per day and names negative themes; it also checks rivals' news and the voices' convergence. The record stores the window length and the watchlist date, and a changed watchlist means "not comparable".
- **Market numbers didn't match what market-pass returns.** Both lists now hold the same numbers (adding price norm and Google Trends).
- **"Write-report's short form" doesn't exist.** It now points to the brand-watch note shape.
- **The guide said watch notes held "alerts, or counts only".** Now: alerts only when a threshold is crossed; counts live in the run record. Method files are listed.
- **No owner mapping** between report roles and record owners: added.
- **Planned pages had no URL to check.** "How we'll know" stores the planned title or slug, and the check reads the brand's sitemap and blog feed.

**Flagged to the orchestrator, not edited here** (shared run-memory atom and AGENTS, owned elsewhere):
- the atom has no `open` status for a recommendation not due yet — handled here as `unknown — not due until <date>`, never asked;
- "asked on" exists only in the Outcomes table, not in Recommendations, so a carried question's date gets lost;
- `daily` is missing from the cadence list (handled here as "old after 3 days");
- open questions are routed to "the report's Decisions for you" even on quiet scheduled runs that send no report (handled here as `to ask` in the record);
- AGENTS §8 Schedules says every scheduled run produces a report, which contradicts silent watches;
- the atom's saved-line wording "so next week starts from here" is wrong for quarterly and ad hoc jobs.

## Appendix — listen-social critique history (playbook removed 18 Oct; its listening now lives here as atoms/listening)

## Critique log — listen-social

### Round 1 — scope + depth, before writing (subagent, effort high, 2026-10-16)

Inputs: spec 05, page 00 (§6, §8, pillars 5, 11, 12, 21, parts 3–4), page 01 (pillars 5, 11), source-map greps, the staging server contract, reader specs 08/09/12/15/16/17.

| # | Finding (severity) | Resolution |
|---|---|---|
| 1 | Brand-mention search does not exist; paid raw calls cannot be priced (MAJOR) | Step 3 pull plan through `atoms/paid-pull`: query × platform × caps, estimate from last week's charges, probe on first use, yes to the total; competitor mentions via `competitor_research mentions`. Server needs #1, #3. |
| 2 | Done-when unmeetable on unreachable surfaces; gaps hidden (MAJOR) | Coverage table opens every report; human can paste; Done-when restated to covered surfaces plus named gaps. |
| 3 | Thin query set, no noise control (MAJOR) | Watchlist with misspellings, handle, domain, products, founder, hashtags, exclusions; precision per query; versioned (queries-and-coverage.md). |
| 4 | No week-over-week memory (MAJOR) | Reads last week's report first; deltas on the same query set; first run labelled baseline; spike = >2× (classify-and-route / report format). |
| 5 | No routing; report becomes a dump (MAJOR) | Exactly one route per item from a fixed list (classify-and-route.md). |
| 6 | Crisis is one line (MAJOR) | S1/S2/S3 triage, fields per flag, S1 stops the pass and goes first in chat, holding-line must/must-nots, agent-never list, timing honesty (crisis-triage.md). |
| 7 | Reply drafts lack hard rules (MAJOR) | Approved claims only, regulated-category rules, disclosure on third-party communities, community rules → stay silent, voice-unapproved fallback (reply-drafting.md). |
| 8 | "Overperformed" undefined (MAJOR) | Outlier multiple vs the author's median of last 10–20 posts, ≥3×, ≥5 posts, ≥48h, own posts excluded (outliers-and-trends.md). |
| 9 | Trend judgement needs evidence (MAJOR) | Evidence, stage, fit, brand safety, audio rights, post-by date, confidence; skips with reasons. Server need #8. |
| 10 | Sentiment overclaimed (MAJOR) | Six classes, counts with n, no % under ~30, two quotes per theme, sarcasm → unclear, never from emoji alone. |
| 11 | Company-type breaks (MAJOR) | Default platforms and named gaps per type; pre-revenue = category-only listening, "0 mentions" said plainly. |
| 12 | Write-back shape unspecified (MAJOR) | Report + replies as workspace files and knowledge document; outliers via `social_inspiration_save` with the defined note and tags; ≤3 insight facts after review; versioned watchlist. |
| 13 | Recurring layer mis-stated (MINOR) | `automation_upsert` agent mode offered on a yes with the per-run cap (step 12). Server need #6. |
| 14 | Cap comment mining (MINOR) | Pull caps in queries-and-coverage.md. |
| 15 | Share of voice only on equal query sets (MINOR) | classify-and-route § Share of voice. |
| 16 | Privacy, minors (MINOR) | classify-and-route § Privacy; step 7. |
| 17 | UGC = rights request, not permission (MINOR) | Approval gates; route "UGC rights request". |
| 18 | Competitor-complaint replies never disparage (MINOR) | reply-drafting rules. |
| 19 | Exclude own posts from outliers (MINOR) | Step 7. |

Rejected / changed from the critic:
- Critic proposed the reply queue only as a report section. **Changed:** separate `replies-<date>.md` in the workspace so the human can work through it, plus the chat hand-off; no product tool holds a queue (server need #5).
- Spec's open item says the standing weekly run waits on P2. **Changed:** offered now through `automation_upsert`, opt-in, cost stated; missing piece is a server-side credit ceiling.

### Round 2 — adversarial run (3 brands) + contract check (subagents, effort high, 2026-10-16)

| # | Finding (severity, source) | Resolution |
|---|---|---|
| 1 | Counting window drops the 12-hour-old crisis (MAJOR) | Two windows: counts = last completed Mon–Sun week; triage = start of that week up to now; out-of-window risk labelled "this week, not in counts", never dropped. |
| 2 | Crisis fires late; S1/S2 ambiguous; route conflict; no budget for the check (MAJOR) | Risk-first scan at step 5 with S1/fast S2 posted in chat immediately; numeric S1 thresholds (≥50k views/24h, ≥100k followers, ≥3 separate posters, press; public-figure founder counts); `support` as second tag; crisis reserve of 3 calls in every plan. |
| 3 | Holding statement could amplify a single complaint (MAJOR) | Brand-wide statement only for S1 or multi-poster issues; single S2 = on-post reply + private draft; "never suggest a cause" added. |
| 4 | Weekly automation a thinner playbook without safety rules; unattended spend; S1 unseen (MAJOR, adversarial + contract #7) | Method files saved to `social/listening/method/`; prompt runs steps 4–11 in full with the claims contract and crisis must-nots; two options: free only, or a standing weekly credit total approved as such (not server-enforced — said); report-not-alert said at opt-in; cost shown after week one. Server needs #6, #14. |
| 5 | Null coworker not handled (MAJOR) | save-to-brain writes to the default workspace and says so; automation needs a coworker. |
| 6 | Searches return all-time results (MAJOR) | `references/public-data.md` with recency keys (date_posted, timeframe, uploadDate…) checked against the vendor OpenAPI; X marked relevance sample. |
| 7 | Query template misses "anyone tried <brand>?" threads (MAJOR) | Bare name scoped to the category's subreddits and hashtags. |
| 8 | Template invites invented precision numbers (MAJOR) | Fictional example brand; first-run precision "–". |
| 9 | Spend gate barely workable; probes not reused; spend outside the gate in step 2 (MAJOR) | Shared paid-pull rewrite (one probe kept, stages A/B); step 2 calls no paid tool. |
| 10 | Founder posts counted as mentions; untracked rivals (MAJOR) | Owned voices excluded from counts, sentiment and outliers; untracked rivals tracked (free) or searched as queries. |
| 11 | Claims and voice not per learn-my-brand's contract (MAJOR, contract #6) | Before you start reads the sign-off learning → Brand record; voice-unapproved keyed off it. |
| 12 | Frontmatter invalid YAML (MAJOR, contract #1) | Folded block. |
| 13 | Minor: header missing Unclear and share of voice; community-rules method; first-run trends; vendor details in report; get_started; link checks; regulated list (employment/AI hiring, privacy, ADHD = health, adverse-event log); pre-revenue defaults; timezone; brand selection; escalation from watchlist; owned founder posts; organic freshness; hosted-chat caps; full items file for dedupe; empty sections collapse; fewer first-run stops; "deep rival" defined; external id on saves; platform `other`; trend `first seen` column; stored mentions not free | All applied (SKILL, all six references, meta, server-needs #2, #12–14). |

Rejected / changed:
- "Save watchlist and report as documents only when no coworker": changed to the default workspace + document (save-to-brain), so the file stays mergeable; readers fall back to knowledge_search.

### Round 3 — final adversarial + contract re-check (subagent, effort xhigh, 2026-10-16)

Verdict: not clean (5 MAJOR). All fixed:

| # | Finding (severity) | Resolution |
|---|---|---|
| 1 | Pulls ("past week", 1 page) don't reach the counting week; undercount and false Δ (MAJOR) | Narrowest recency option that reaches the counting Monday (month when the run is >6 days later), page newest-first until older than Monday or cap; cap hit → `≥n (cap hit)` and no Δ; Monday-morning cron default. |
| 2 | Dedupe drops "not in counts" items and live S1s (MAJOR) | Drop only `in_counts: true`; count the rest now; items with a severity stay `open` and are re-read each run until the human closes them. |
| 3 | Single-poster S1 could get a brand-wide holding statement (MAJOR) | Brand-wide only for 3+ separate people, press, contamination/injury/recall/legal; any single poster gets on-post reply + private draft + escalation, statement held with its trigger (SKILL, crisis-triage, reply-drafting). |
| 4 | `competitor_research mentions` assumed priced on a card (MAJOR) | Priced like a proxy row (shared paid-pull fix). |
| 5 | Report looks stale to run-organic-social on arrival (file dated by week start) (MAJOR) | Line 2 carries `Run:` and `Trends read: … · valid to: …`; output table says freshness = line 2; NOTICE to run-organic-social. |
| 6–17 | Minor: method folder lacked SKILL and atoms; `execution_mode: "agent"`; free-only header; share of voice comparability; lean learnings read; replies/items imported into knowledge; crisis hold on promo replies; needs gaps; unlisted subreddit-details and Facebook-post paths; audio-rights guessing; automation cost review; test contradictions; misleading wording | Method folder includes SKILL.md, references and atoms; agent mode named; "not searched / not measured" headers; "not comparable this week"; full learnings read; replies/items workspace-only; crisis hold; needs updated; paths dropped (Facebook video search added to public-data); audio rights "unverified" unless flagged; automation runs shown at the top of every chat run; tests and wording aligned. |

### Round 4 — confirmation pass (subagent, effort xhigh, 2026-10-16)

Verdict: not clean (2 MAJOR). Fixed:

| # | Finding (severity) | Resolution |
|---|---|---|
| 1 | Round-3 recency fix incomplete: SKILL step 3, paid-pull and the coverage table still said past-week; a Friday run would miss Monday–Thursday (MAJOR) | All recency wording now points to `public-data.md` § Recency rule (narrowest option reaching the counting Monday, month when >6 days); the stale override clause removed; server need #1 says paged to the counting Monday, ≤3 pages; paid-pull aligned in all three copies. |
| 2 | Same-week re-run (automation Monday, chat Friday) would de-duplicate everything and overwrite Monday's items file (MAJOR) | Baseline = the week before this run's counting week; a re-run merges this week's items file (flags and open items kept), recounts, and updates the report in place with a new `Run:` line; the automation prompt says the same. |
| 3–7 | Minor: brand-wide trigger "injury" collided with single-poster rule; open items not carried forward; standing total vs "never inherits a yes"; method file paths collide; reply-drafting claims wording | "Contamination, recall or legal action confirmed by the brand, a regulator or the press — one person's reported reaction or injury is a single-poster item" (SKILL, crisis-triage, reply-drafting, test); open items copied forward, "not re-read (free-only run)"; paid-pull exception for a standing weekly total; `method/SKILL.md`, `method/references/<name>.md`, `method/atoms/<atom>/SKILL.md`; "Claims you may use" learnings win over the Brand record. |

### Round 5 — confirmation pass for listen-social (subagent, effort xhigh, 2026-10-16)

Verdict: not clean (2 MAJOR). Shared atom: consistent (byte-identical in all three; no conflict with research-market or research-competitors). Fixed:

| # | Finding (severity) | Resolution |
|---|---|---|
| 1 | Re-run detection and baseline depended on an undefined file date; the automation prompt still used "the latest" files (MAJOR) | Every run file (report, items, replies) is dated the counting week's Monday, never the run date (SKILL step 4, report-format, meta); the prompt's baseline is the week before this counting week, a file for this counting week means a re-run; header "Compared against: <prior counting week's report date>". |
| 2 | Paging stop rule assumed date-sorted results; Instagram, YouTube and LinkedIn return a month in relevance order, so counts were one page's slice shown as exact (MAJOR) | Three paging rules (date-sorted: stop at the counting Monday; recency-filtered relevance: page to the end or cap, count in-window only; no filter: labelled sample); coverage table corrected; same rule in `public-data.md` (all three copies). |
| 3–7 | Minor: test trigger wording; replies file overwritten on re-run; unattended stage B approval; S1 lines could push the parsed header; earlier same-week report copies left in knowledge | "3 or more separate people"; replies merged (earlier R-ids kept); the standing total covers stage A, B and the crisis reserve; S1/S2 go to the Risk flags line and Act now, header shape kept; every earlier copy with the tags is retired. |

### Round 6 — confirmation pass for listen-social (subagent, effort xhigh, 2026-10-16)

Verdict: not clean (2 MAJOR); round-5 MAJORs verified closed (date convention and paging rules consistent; Friday/Monday/Wednesday walk passes). Fixed:

| # | Finding (severity) | Resolution |
|---|---|---|
| 1 | A skipped week drops open crises: the baseline was only "the prior week" with no rule when that file is missing (MAJOR) | Baseline = the newest report/items dated before this counting Monday; if older, "Compared against: <date> (not the prior week)", no Δ, last-week themes n/a; every open item carried forward whatever its age (SKILL, report-format, automation prompt, Done-when); skipped-week drill added to tests. |
| 2 | An early stop on a noisy date-sorted query showed an undercount as exact (MAJOR) | Early stop (page under 50% on-target) before results run out or the Monday is reached makes the count a floor `≥n (stopped: Q<n>)`, no Δ. |
| 3–9 | Minor: `in_counts` semantics for carried items; prompt step 0 wording; re-run `Run:` line vs fixed header; ISO week ambiguity; incomplete endpoint lists; stale server-needs wording; no date-convention test | `in_counts` defined (carried items `false`, counted next only if dated in its week); `items-<this counting week's Monday>.jsonl`; `Run: <first>; <this run>` on line 2; "the counting week's ISO week" in title, table and tags; TikTok hashtag, Instagram general, Pinterest, Facebook videos listed as unfiltered, Threads as filtered; server-needs reworded; date-convention drill added. |

### Round 7 — confirmation pass for listen-social (subagent, effort xhigh, 2026-10-16)

Verdict: **clean (0 MAJOR)** — round-6 MAJORs verified closed and consistent (skipped-week baseline and carry-forward; early-stop floors); the date-convention drill walks through Friday → Monday automation → Wednesday re-run correctly.

Minor findings, all applied: the skipped-week drill now actually skips a week (11-02 vs 10-12); carried-forward items dated inside the current counting week are counted and flagged `in_counts: true`; Mentions header lists the early-stop floor and every no-Δ case; re-run updates `Run: <first>; <this run>` and `Triage covered up to:` separately; report-format loads at step 4 too and the items schema has `excerpt`; stale "1 page each" in the test fixed.

**Final state: research-market clean (round 4), research-competitors clean (round 4), listen-social clean (round 7).**

### Round 8 — fix pass from the 16 Oct cross-set review (2026-10-16)

| Source | Change |
|---|---|
| depth §5 (MINOR ×2), routing listen-social line 167 | Counting window, file names, baseline, re-run merge, de-duplication, open items and paging moved out of SKILL.md into the local atom `atoms/listening-window/ATOM.md`; SKILL.md cut by about a third. A short-form report under ~20 items. |
| contracts M6 | The weekly report has one predictable path: `social/listening/<D>-report.md` (`<D>` = the counting week's Monday); items and replies are `<D>-items.jsonl`, `<D>-replies.md`. Readers take the newest `*-report.md`; freshness is line 2's `Run:`. |
| coverage m1 | An S1 comes with a cross-channel hold list (GooseWorks-launched ads via `meta_read`, scheduled posts, promo emails) for the human to pause. |
| routing C10/C11 | Description says "(what people say, not what they run)" and "Not for writing posts on a trend — run-organic-social". |
| contracts M22 | Voice label follows the claims gate: "voice not yet confirmed" when the marker says voice is provisional. |
| §8 "Do this first" | The report's line 1 is "Do this first, because…"; the parsed header lines follow on lines 2–7 in unchanged shapes. |
| save-to-brain keep-history | The report is a period artifact: other weeks are never deleted; only a same-week re-run replaces its own earlier copy. |
| AGENTS §3/§5/§8 | Local `atoms/paid-pull` and `atoms/save-to-brain` copies deleted; the playbook loads the shared `atoms/save-to-brain/ATOM.md` and `atoms/spend-gate/ATOM.md` (this session owns both) and `atoms/save-learning`, `atoms/claims-gate` (learn-my-brand). `references/public-data.md` moved once to `atoms/spend-gate/proxy-endpoints.md`. Description rewritten in `>-` form under 1,024 characters with a "Not for … — use …" line. Connection sentence, `get_started`, `brands/<slug>/` no-coworker fallback and credits log `research/credits-log/<YYYY-MM>.md` per §8. |
| contracts F1/F2/M4 (learnings) | Learnings through save-learning: at most 3 rules per run, ≤300 characters, prefix per §8, only on the human's words, retiring this playbook's own earlier facts in the same call. |
| contracts M10/M11, routing U4/U5 (money) | Spend through the spend gate: one probe, a yes to a ceiling labelled an estimate, stop at it, log every charge; tool caps taken in dollars are described in words, never quoted; automations created paused and switched on only on a yes. |
| contracts M3 | "A lean read can miss the marker" removed — a lean `brand_read` returns every must/dont. |

Rejected / deferred:
- coverage MAJOR "manage-reviews: build it or absorb it into listen-social as a reviews surface": deferred — the orchestrator said no new playbooks or scope expansion while it is pending with Akhil. Out of scope now names review-site replies as not covered yet.
- contracts M21 (crisis contact has no writer): learn-my-brand's to add; this playbook keeps asking and stores the answer in the watchlist.

### Round 9 — adversarial + contract critique of the fix pass (subagent, effort high, 2026-10-16)

For this playbook 3 MAJOR, all fixed:
| # | Finding | Resolution |
|---|---|---|
| 3 (MAJOR) | The standing run followed only steps 4–11, skipping the free reads and the pull plan | The prompt follows steps 1–11: watchlist read but not changed, step 3 planned inside the standing ceiling with no yes (skipped in free-only runs), step 12 and the learnings offer skipped. |
| 6 (MAJOR) | "Who acts" and the crisis note named playbooks to the marketer | Plain words ("a content brief", "the founder", "always-on alerts aren't available yet"). |
| 7 (MAJOR) | Method files could drift from the live playbook (contracts review, unlogged) | Method files and prompt carry `Method version: <version>, copied <date>`; re-copied on change or switch-on; shared-atom copies refreshed only then. |
| 8, 11, 12, 14 (MINOR) | Same-week report replacement sat under a supersede-only step; learnings retired too broadly; "— use"; upper-case week tag | save-to-brain's "Retire old copies" covers keep-history exact-title replacement; retire only replaced or contradicted facts; "— use"; `week:2026-w41`. |
listening-window atom: clean.

### Round 10 — confirmation (subagent, effort high, 2026-10-16)

Verdict: 1 MAJOR (wording), fixed: the coverage table's "not covered" cell named a playbook to the marketer — now "paste them; a customer-research run reads reviews"; the creator-candidate route reads "a creator-partnership candidate". Minor: the standing-run prompt now does Before-you-start items 2–3 itself, asks nothing, and searches untracked rivals instead of offering to track them. Same-week re-run walked clean. After these one-line fixes nothing major remains open.

2026-10-16 orchestrator: removed workarounds for today's 300-char/8-fact server limits per Akhil — the Brand Brain rebuild removes them; interim handling lives only in atoms/save-learning.

2026-10-16 final contract check: skill.meta.json: removed "≤300 chars" from the learnings line (save-learning forbids shortening to fit today's server).
2026-10-16 final contract check: references/report-format.md: the standing-run copy step names the shared atoms' real location (`../../../atoms/`).
2026-10-16 final contract check: skill.meta.json `atoms` now lists only this folder's atoms; shared atoms moved to `shared_atoms`.
2026-10-16 orchestrator ruling: reply drafting uses the shared ../ad-policy-check/disclosure.md (§1) for disclosure instead of its own rule (references/reply-drafting.md, SKILL.md); the community rules check stays; bare `atoms/<shared>` path in server-needs.md converted.

### Rebuild on the AGENTS §8 research pattern (2026-10-17)

**Why.** The orchestrator's literal Sonnet dry run, on Personal Day asking "What are people saying about me and my category this week?", found three failures:
- it opened with questions, a watchlist confirmation and a credit yes, all in one message;
- it never used web search;
- it ended with a chat summary.

**What changed (rewrite, not patch):**
- **Top rule:** "free pass first, ask nothing, report once". The only interruption allowed is an S1 risk, posted in chat the moment it is found.
- **Step 1, the watchlist:** the agent drafts it itself. It searches the bare name first to find name collisions and writes the exclusions ("personal day" = a day off); queries-and-coverage now has a "Name collisions" section. The watchlist is `v1 (draft)`, run as is and confirmed in the closing message.
- **Step 2, news first.**
- **Step 3, the free pass:** web search with recency and `site:` queries, plus public pages in the host browser (Reddit sorted new, tag and search pages, YouTube upload-date filter), comments on the top posts, and free server reads. Counts are labelled "free-pass sample"; the window atom's new "Free-pass counts" section shows no week-over-week change when the method changed. The paid proxy pull is now the top-up offered in the closing message under one yes; the coverage table marks proxy rows "paid top-up".
- **"For you" and "You vs them"** (AGENTS §8 point 7) in report-format, and in the short form too. The themes column became "For you".
- **The report is delivered as a document** (a local file offered, or an artifact in hosted chat).
- **One closing message (step 10)** holds: replies to send, the draft watchlist, an escalation contact if none, the paid top-up, the weekly run, and rules.
- **Supporting files:**
  - outlier baselines are read on public profile pages, or "baseline not read";
  - the standing-run agent prompt is renumbered to the new steps;
  - meta 0.2.0;
  - server-needs renumbered, with #17 (GooseWorks web search for hosts without their own) added;
  - the test fails any question before the report, no web search, or a chat summary.
- **Paths and the fixed report header lines** are unchanged, apart from the new values "free-pass sample" and "none (free pass)", so analyze-performance's parser is unaffected.

### Rebuild — Sonnet re-run (2026-10-17)

Sonnet, web search and page fetch only (no browser, no GooseWorks calls), Personal Day, "What are people saying about me and my category this week?", on a Saturday.

**Against the three failure modes of the old version:**
- **Questions before the report:** none. The watchlist, escalation contact, credit ceiling, weekly run and rules all went into the closing message.
- **Web search:** used — news first, then four parallel workers (Reddit and forums · TikTok/IG/YouTube · news/X/LinkedIn · rival conversation), about 66–70 searches in all.
- **A chat summary:** none. It delivered a full report (header lines, Act now, so-what, For you, You vs them, coverage, mentions, themes, rival conversation, trends, the reply queue) and a closing message with only decisions.
- **Also passed:** the bare name was checked first; PTO and day-off senses, a novel and an unrelated account became exclusions; the report says what the name was confused with.

**Findings:**
- 2 independent in-window Reddit mentions, both positive or neutral.
- An old (May) Reddit post challenging the "acne-safe" claim (two palmitate esters). Its recommendation was stay silent and hold a standby reply.
- Rival signal: commenters repeatedly name CLEARSTEM's free pore-clogger checker, and CLEARSTEM reached Target on 10 Sep.
- No S1 or S2.

**Limits of the test setup (not the playbook):**
- Search ignored `site:` and recency.
- Reddit, TikTok, YouTube and X were blocked to fetch.
- So the free pass was thin and the honest headline was "nothing bad in what I could read". In a host with a real browser the free pass reads these pages.

**Playbook defects it reported, fixed:**
- **No "thin free pass" mode.** The so-what now opens with a coverage line when most platforms couldn't be read, and the top-up for them becomes the first decision.
- **"This week" asked mid-week.** The window atom now adds a "This week so far" block, not counted, plus a one-line note.
- **The short form dropped "You vs them".** It now has a one-line version.
- **Affiliated voices undefined** (paid adviser, gifted posts, affiliates, fan reposts, retailers). Now an `affiliated` tag, shown but never counted. A famous founder's name counts only with a topic word.
- **Undated items undefined.** Now "date unknown": triaged, never counted.
- **The worker used a third-party Reddit archive and mirrors to get round blocks.** Now: only the platforms' own public pages or the sanctioned paid read; never unofficial mirrors, archives or unofficial APIs.
- **The search tool ignores minus terms.** Exclusions are now applied when reading results.
- **"For you" repeated** between the section and the rows. The section now ranks the actions and points to rows.
- **The watchlist title date** is now the run date.
- **An S1 with no escalation contact.** The alert asks who handles it — the one thing allowed before the report.

**Not changed:**
- claims-gate never treats the live site as approved. The test told the run to, so its "approved" lines were a simulation; in real runs, unapproved lines say "needs your sign-off".
- Share of voice stays "not comparable" unless the method matches.

**Still weak:** a fetch-only host can't read Reddit, TikTok, YouTube or X, so the listening free pass there is mostly coverage gaps plus the paid top-up. server-needs #17 (GooseWorks web search and page fetch) is the fix.

- **19 Oct, Codex review 2 of the run-memory PR:** not-yet-due recommendations now use the shared atom's `open` status instead of `unknown`, so they never reach "Decisions for you" before their review date.

## 2026-10-20 — hand-test review (Akhil + marketer reviewers)

- **A sign-up conversion benchmark (3–5%) was applied to a whole market** ("$4.6M–$14M realistic year one" for a brand with 0 reviews and 0 ads; "300K–450K solo founders" unsourced). → market-pass §2: reachable value first, then a separate sourced "share we could realistically win" line; never a conversion rate on a market count; flag when the largest input is an assumption; no year-one revenue figure for a brand with no sales, reviews or ads. Return shape has both lines.
- **"Which market" contradicted the brand's positioning and was due "by Wed 21 Oct".** → SKILL step 5: say plainly when the recommendation contradicts stated positioning, list what wasn't tested, frame it as the founders' decision, no deadline under a week unless something outside forces it. market-pass §1 asks the worker to flag it.
- **Buyer-voice links went to community home pages; borrowed quotes weren't re-checked.** → SKILL step 5 and the listening return shape: link to the post itself; quotes from an earlier report re-opened or labelled "not re-checked".
- **Price norms averaged unlike purchases** ($999 service with $29 tools into a "$39 middle entry price"). → market-pass §5: group the table by what the price buys, a norm per group, never a cross-group average; §9 baseline uses the brand's group.
- **The own-users pass was dropped when browser permissions got tiresome.** → edge-cases: finish the same reads with search and fetch; listening: the brand's own users are first-hand evidence, finished another way, never dropped.
- Not edited here: the report format's "Matters by" column (writer 1's file) — the under-a-week rule lives in SKILL step 5.

### Report top (write-report shape)

| Finding | Fix |
|---|---|
| Reports opened with "Do this first" before the reader knew what was researched, so the move couldn't be judged (Akhil; 4 marketer reviewers: keep the answer on screen one, but rest it on findings shown above it) | In short now: "What we looked at" (scope, sources, date, main limit) → 2–3 numbered findings with how sure (confirmed / likely / first look) → "So, do this first (because of 1 and 2)", naming the findings; a first-look base makes the first move the one that closes the gap (write-report §1) |
| In short stated provisional or first-look things as fact; counts described a different thing than the claim beside them; first moves assumed unconfirmed assets | write-report §3 checks, now blocking: nothing stronger than the body, every number counts exactly its claim, no unconfirmed asset in the first move (→ "confirm X" or a decision) |
| "It is growing" in In short when the body said "likely" | Template note: a "growing" or "lead buyer" in In short must be as sure in the body |
| Decision deadlines under a week with nothing forcing them (coordinator, from writer 4) | "Matters by" never under a week unless something outside forces it, named |
| Idea validation, brand watch and the monthly pulse prompt | Same order: what we looked at → verdict or findings with how sure → "So, do this first" |
| Test | test-by-hand item 5 checks the new top; a fail line for the 20 Oct case |

### Review fixes on this change set (second pass)

| Finding | Fix |
|---|---|
| write-report's new top rules copied into Done when, report-format's check and test item 5 | Each now points at write-report §3 and keeps only this playbook's own checks (baselines table, inline links, roles and dates on moves, the extra banned words, For you only where it matters). |

## 2026-10-20 — Writing-for-Agents pass (items 1, 2, 4)

| Finding | Change |
|---|---|
| Copied setup (server choice, connection line, get_started, `client`, brand pick, brain_* read) | One "Setup first" line to guide §1–2, plus what is unique: `wants: "more"`, create a missing brand, no unrelated menu, the fallback brand_read sections, the files this job reads, the brain-vs-site conflict rule |
| "AGENTS §8 research pattern" | "guide §3 **Research pattern**" |
| Run-memory start restated the atom | Pointer: the three job names and `references/run-memory.md` |
| Step 5 restated report-format (lead order, sibling disagreement, positioning, For you, source skew, baselines) and market-pass §2 | Kept only the provisional-groups rule, a pointer to the share rule, the contradiction-with-positioning rule, the quote rules and the trace check |
| Step 6 restated write-report's delivery | Deliver through write-report with this job's topic and brand path; `demand.md`, `watchlist.md` and outliers stay |
| Step 8 restated the default cadences and spend-gate branch C | Pointer to guide §3 **Schedules** |
| Brand watch repeated the out-of-scope reply-drafts line | Removed from the brand-watch section |
| Output table repeated guide §4's rows | Pointer line |
| Done when had no run record and no quote bar | Added the run record and "3–5 buyers quoted word for word, linked to the post" |
| "Founder" and "marketer" both named the user | "Marketer" in SKILL.md; "the founders' decision" kept as a role |
| Description 1,009 characters, opened "Use when a founder or marketer asks" | 713 characters, leading with "Market research and brand watch". Routing cases R17, R34, R61 and R63 still match; R50 (a complaint spreading) rests on "tell me if something blows up" |

## 2026-10-20 — Codex review round 2

| Finding | Fix |
|---|---|
| B10 "The worker briefs are in `atoms/`" | "its step skills (`research-market-<step>`)". |
