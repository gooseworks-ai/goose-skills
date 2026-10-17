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
