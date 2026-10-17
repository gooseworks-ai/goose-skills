# Critique log — listen-social

## Round 1 — scope + depth, before writing (subagent, effort high, 2026-10-16)

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

## Round 2 — adversarial run (3 brands) + contract check (subagents, effort high, 2026-10-16)

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

## Round 3 — final adversarial + contract re-check (subagent, effort xhigh, 2026-10-16)

Verdict: not clean (5 MAJOR). All fixed:

| # | Finding (severity) | Resolution |
|---|---|---|
| 1 | Pulls ("past week", 1 page) don't reach the counting week; undercount and false Δ (MAJOR) | Narrowest recency option that reaches the counting Monday (month when the run is >6 days later), page newest-first until older than Monday or cap; cap hit → `≥n (cap hit)` and no Δ; Monday-morning cron default. |
| 2 | Dedupe drops "not in counts" items and live S1s (MAJOR) | Drop only `in_counts: true`; count the rest now; items with a severity stay `open` and are re-read each run until the human closes them. |
| 3 | Single-poster S1 could get a brand-wide holding statement (MAJOR) | Brand-wide only for 3+ separate people, press, contamination/injury/recall/legal; any single poster gets on-post reply + private draft + escalation, statement held with its trigger (SKILL, crisis-triage, reply-drafting). |
| 4 | `competitor_research mentions` assumed priced on a card (MAJOR) | Priced like a proxy row (shared paid-pull fix). |
| 5 | Report looks stale to run-organic-social on arrival (file dated by week start) (MAJOR) | Line 2 carries `Run:` and `Trends read: … · valid to: …`; output table says freshness = line 2; NOTICE to run-organic-social. |
| 6–17 | Minor: method folder lacked SKILL and atoms; `execution_mode: "agent"`; free-only header; share of voice comparability; lean learnings read; replies/items imported into knowledge; crisis hold on promo replies; needs gaps; unlisted subreddit-details and Facebook-post paths; audio-rights guessing; automation cost review; test contradictions; misleading wording | Method folder includes SKILL.md, references and atoms; agent mode named; "not searched / not measured" headers; "not comparable this week"; full learnings read; replies/items workspace-only; crisis hold; needs updated; paths dropped (Facebook video search added to public-data); audio rights "unverified" unless flagged; automation runs shown at the top of every chat run; tests and wording aligned. |

## Round 4 — confirmation pass (subagent, effort xhigh, 2026-10-16)

Verdict: not clean (2 MAJOR). Fixed:

| # | Finding (severity) | Resolution |
|---|---|---|
| 1 | Round-3 recency fix incomplete: SKILL step 3, paid-pull and the coverage table still said past-week; a Friday run would miss Monday–Thursday (MAJOR) | All recency wording now points to `public-data.md` § Recency rule (narrowest option reaching the counting Monday, month when >6 days); the stale override clause removed; server need #1 says paged to the counting Monday, ≤3 pages; paid-pull aligned in all three copies. |
| 2 | Same-week re-run (automation Monday, chat Friday) would de-duplicate everything and overwrite Monday's items file (MAJOR) | Baseline = the week before this run's counting week; a re-run merges this week's items file (flags and open items kept), recounts, and updates the report in place with a new `Run:` line; the automation prompt says the same. |
| 3–7 | Minor: brand-wide trigger "injury" collided with single-poster rule; open items not carried forward; standing total vs "never inherits a yes"; method file paths collide; reply-drafting claims wording | "Contamination, recall or legal action confirmed by the brand, a regulator or the press — one person's reported reaction or injury is a single-poster item" (SKILL, crisis-triage, reply-drafting, test); open items copied forward, "not re-read (free-only run)"; paid-pull exception for a standing weekly total; `method/SKILL.md`, `method/references/<name>.md`, `method/atoms/<atom>/SKILL.md`; "Claims you may use" learnings win over the Brand record. |

## Round 5 — confirmation pass for listen-social (subagent, effort xhigh, 2026-10-16)

Verdict: not clean (2 MAJOR). Shared atom: consistent (byte-identical in all three; no conflict with research-market or research-competitors). Fixed:

| # | Finding (severity) | Resolution |
|---|---|---|
| 1 | Re-run detection and baseline depended on an undefined file date; the automation prompt still used "the latest" files (MAJOR) | Every run file (report, items, replies) is dated the counting week's Monday, never the run date (SKILL step 4, report-format, meta); the prompt's baseline is the week before this counting week, a file for this counting week means a re-run; header "Compared against: <prior counting week's report date>". |
| 2 | Paging stop rule assumed date-sorted results; Instagram, YouTube and LinkedIn return a month in relevance order, so counts were one page's slice shown as exact (MAJOR) | Three paging rules (date-sorted: stop at the counting Monday; recency-filtered relevance: page to the end or cap, count in-window only; no filter: labelled sample); coverage table corrected; same rule in `public-data.md` (all three copies). |
| 3–7 | Minor: test trigger wording; replies file overwritten on re-run; unattended stage B approval; S1 lines could push the parsed header; earlier same-week report copies left in knowledge | "3 or more separate people"; replies merged (earlier R-ids kept); the standing total covers stage A, B and the crisis reserve; S1/S2 go to the Risk flags line and Act now, header shape kept; every earlier copy with the tags is retired. |

## Round 6 — confirmation pass for listen-social (subagent, effort xhigh, 2026-10-16)

Verdict: not clean (2 MAJOR); round-5 MAJORs verified closed (date convention and paging rules consistent; Friday/Monday/Wednesday walk passes). Fixed:

| # | Finding (severity) | Resolution |
|---|---|---|
| 1 | A skipped week drops open crises: the baseline was only "the prior week" with no rule when that file is missing (MAJOR) | Baseline = the newest report/items dated before this counting Monday; if older, "Compared against: <date> (not the prior week)", no Δ, last-week themes n/a; every open item carried forward whatever its age (SKILL, report-format, automation prompt, Done-when); skipped-week drill added to tests. |
| 2 | An early stop on a noisy date-sorted query showed an undercount as exact (MAJOR) | Early stop (page under 50% on-target) before results run out or the Monday is reached makes the count a floor `≥n (stopped: Q<n>)`, no Δ. |
| 3–9 | Minor: `in_counts` semantics for carried items; prompt step 0 wording; re-run `Run:` line vs fixed header; ISO week ambiguity; incomplete endpoint lists; stale server-needs wording; no date-convention test | `in_counts` defined (carried items `false`, counted next only if dated in its week); `items-<this counting week's Monday>.jsonl`; `Run: <first>; <this run>` on line 2; "the counting week's ISO week" in title, table and tags; TikTok hashtag, Instagram general, Pinterest, Facebook videos listed as unfiltered, Threads as filtered; server-needs reworded; date-convention drill added. |

## Round 7 — confirmation pass for listen-social (subagent, effort xhigh, 2026-10-16)

Verdict: **clean (0 MAJOR)** — round-6 MAJORs verified closed and consistent (skipped-week baseline and carry-forward; early-stop floors); the date-convention drill walks through Friday → Monday automation → Wednesday re-run correctly.

Minor findings, all applied: the skipped-week drill now actually skips a week (11-02 vs 10-12); carried-forward items dated inside the current counting week are counted and flagged `in_counts: true`; Mentions header lists the early-stop floor and every no-Δ case; re-run updates `Run: <first>; <this run>` and `Triage covered up to:` separately; report-format loads at step 4 too and the items schema has `excerpt`; stale "1 page each" in the test fixed.

**Final state: research-market clean (round 4), research-competitors clean (round 4), listen-social clean (round 7).**

## Round 8 — fix pass from the 16 Oct cross-set review (2026-10-16)

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

## Round 9 — adversarial + contract critique of the fix pass (subagent, effort high, 2026-10-16)

For this playbook 3 MAJOR, all fixed:
| # | Finding | Resolution |
|---|---|---|
| 3 (MAJOR) | The standing run followed only steps 4–11, skipping the free reads and the pull plan | The prompt follows steps 1–11: watchlist read but not changed, step 3 planned inside the standing ceiling with no yes (skipped in free-only runs), step 12 and the learnings offer skipped. |
| 6 (MAJOR) | "Who acts" and the crisis note named playbooks to the marketer | Plain words ("a content brief", "the founder", "always-on alerts aren't available yet"). |
| 7 (MAJOR) | Method files could drift from the live playbook (contracts review, unlogged) | Method files and prompt carry `Method version: <version>, copied <date>`; re-copied on change or switch-on; shared-atom copies refreshed only then. |
| 8, 11, 12, 14 (MINOR) | Same-week report replacement sat under a supersede-only step; learnings retired too broadly; "— use"; upper-case week tag | save-to-brain's "Retire old copies" covers keep-history exact-title replacement; retire only replaced or contradicted facts; "— use"; `week:2026-w41`. |
listening-window atom: clean.

## Round 10 — confirmation (subagent, effort high, 2026-10-16)

Verdict: 1 MAJOR (wording), fixed: the coverage table's "not covered" cell named a playbook to the marketer — now "paste them; a customer-research run reads reviews"; the creator-candidate route reads "a creator-partnership candidate". Minor: the standing-run prompt now does Before-you-start items 2–3 itself, asks nothing, and searches untracked rivals instead of offering to track them. Same-week re-run walked clean. After these one-line fixes nothing major remains open.

2026-10-16 orchestrator: removed workarounds for today's 300-char/8-fact server limits per Akhil — the Brand Brain rebuild removes them; interim handling lives only in atoms/save-learning.

2026-10-16 final contract check: skill.meta.json: removed "≤300 chars" from the learnings line (save-learning forbids shortening to fit today's server).
2026-10-16 final contract check: references/report-format.md: the standing-run copy step names the shared atoms' real location (`../../../atoms/`).
2026-10-16 final contract check: skill.meta.json `atoms` now lists only this folder's atoms; shared atoms moved to `shared_atoms`.
2026-10-16 orchestrator ruling: reply drafting uses the shared ../../atoms/ad-policy-check/disclosure.md (§1) for disclosure instead of its own rule (references/reply-drafting.md, SKILL.md); the community rules check stays; bare `atoms/<shared>` path in server-needs.md converted.

## Rebuild on the AGENTS §8 research pattern (2026-10-17)

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

## Rebuild — Sonnet re-run (2026-10-17)

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
