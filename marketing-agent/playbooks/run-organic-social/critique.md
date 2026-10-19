# run-organic-social: critique log

Every round: the finding, the fix, or why it was rejected. Critics are subagents (effort high; xhigh for the final round). None read old skills.

## Round 1: scope critic (before writing)

| # | Finding | Severity | Resolution |
|---|---|---|---|
| 1 | No account audit before planning. | MAJOR | Fixed: atoms/account-audit covers the last posts, top and bottom 5 with the why, cadence kept, best slots, and bio and pinned rewrites. It uses `brand_read organic` (own TikTok/IG posts with metrics, seen on staging) and pasted posts for other platforms. |
| 2 | No path for a brand with no platforms. | MAJOR | Fixed: recommend 2–3 platforms, each with a job; the human picks; never "all of them" (calendar-craft.md, step 2). |
| 3 | Founder ghostwriting intake is missing. | MAJOR | Fixed: a founder voice card with a stance ledger, never-says list and `[NAME: …]` slots (references/voice-card.md). **Changed from the critic's suggestion:** stored as a workspace file shared with make-content, not as a `brand_update` voice proposal, because the brand's single `voice` field would be overwritten by a person's voice (server-needs #7). |
| 4 | Pillars, mix ratios and series are not defined or kept. | MAJOR | Fixed: per account, 3–5 pillars, ratios and 1–2 named series. Managed TikTok/IG accounts use `social_strategy_upsert` (after a yes); other platforms use `social/accounts.md`. |
| 5 | The per-slot output is too thin to post from. | MAJOR | Fixed: the slot anatomy (references/slot-anatomy.md) adds alternative hooks, first comment, keywords, alt text, an asset line, a named shooter and an engagement plan. |
| 6 | No posting hand-off and no reconciliation. | MAJOR | Fixed: a posting sheet, an optional CSV for the human's own scheduler, and a reconciliation step at the start of each later run. The human's edits become voice learnings. `social_post_update` status "posted" is used as a record only. |
| 7 | Only one mode, but the work is recurring and reactive. | MAJOR | Fixed: run modes are fill, refill, mid-cycle insert, launch, crisis pause and the seasonal pass (calendar-craft.md). |
| 8 | Live-data claims overstate the tools. | MAJOR | Fixed: trends come from listen-social's report and the inspiration library only; posting times are labelled "starting guess" without own data; no paid scrapes without a credit yes. |
| 9 | The calendar has nowhere to live. | MAJOR | Fixed in the interim with `social/calendar/<date>.md` in the workspace, stated plainly; server-needs #2 asks for a calendar object. |
| 10 | Cadence realism. | MINOR | Fixed: the cadence kept over the last 8 weeks + 20%, a solo ceiling, time costs per format, and pushback with numbers. |
| 11 | No engagement plan. | MINOR | Fixed per slot (comment prompt, first comment, tags, first-hour note). **Rejected:** the fortnightly "10 accounts to comment on" list. It would need live feeds and veers into community management, which is parked. |
| 12 | One idea, native cuts. | MINOR | Fixed: step 6 says a make-content cut is re-fitted, not pasted; platform-native.md says to rewrite per platform. |
| 13 | Disclosure and UGC rights. | MINOR | Fixed: post-checks.md §4 covers #ad, employee disclosure, a draft of the UGC rights ask, contest rules and TikTok music. |

Company-type gaps (DTC drops/BFCM/Pinterest/UGC; B2B founder vs company page, PDF carousels, webinar promo, employee variants; app faceless formats; two-sided marketplace pillars; local per-location variants; creators) were added to calendar-craft.md "By company type".

Community posting (Reddit, Facebook groups, Discord), Amazon Posts and GBP are named out of scope.

MCP guardrails were added to step 7: never `approve`, never `render: true`, never `organic_creative_queue`; `social_strategy_upsert` and `social_post_create render:false` only after a yes.

## Round 1: depth critic (before writing)

All of the critic's top-10 are encoded:

| # | Must-encode | Where |
|---|---|---|
| 1 | Share checklist and swap test | post-checks §1 |
| 2 | No invented founder experience | voice-card.md, founders |
| 3 | Measured voice card | voice-card.md |
| 4 | Rewrite per platform | platform-native.md |
| 5 | Hook first, plus alternatives | step 6, slot anatomy |
| 6 | Calibrated AI-tell blacklist | post-checks §2 |
| 7 | Cadence realism | calendar-craft.md |
| 8 | Trend fit, tone tiers and expiry table | post-checks §5 |
| 9 | Script and carousel docs | slot-anatomy.md |
| 10 | Platform mechanics | platform-native.md, cross-platform section |

Platform anatomy and examples for X, LinkedIn (personal and company), IG carousel/Reels/Stories, TikTok, Shorts, Threads, Facebook and Pinterest are in platform-native.md. Uncertain items are marked (?).

**Rejected:** Reddit as a drafting target. It is out of v1, for the reason given in Out of scope.

## Overlaps to consolidate later

- post-check step 4 duplicates make-content's claims-check atom; extract it as a shared atom.
- Voice cards (`brand/voices/`) are shared with make-content by path.
- The platform-native rules overlap with make-content's references/repurposing.md §4. This file is the deeper one; make the shared reference the single source in the consolidation pass.

## Round 2: contract check (after writing)

| # | Finding | Severity | Resolution |
|---|---|---|---|
| M1 | The claims source contradicts learn-my-brand's contract. | MAJOR | Fixed: post-check §4 follows the marker plus Brand record, with three tiers (names · what it does · outcomes/numbers/press only if signed off). Before sign-off, plain product facts only. |
| M2 | The VoC bank is read from the wrong place. | MAJOR | Fixed: `research/market/voc-bank.md` (+ document fallback), in voice-card.md, SKILL.md step 6 and the meta. |
| M3 | Proposed facts go live at once. | MAJOR | Fixed: asked as a question, written only on yes (slot-anatomy Reconciliation, SKILL Output). Server-needs #14. |
| M5 | The loop and the staging run were not done. | MAJOR | Fixed: rounds 2–3 logged; staging run recorded in tests. |
| m5 | Listening-report path is vague. | MINOR | Fixed: `social/listening/<date>.md` and its post-by dates (plan-calendar, post-checks §5). |
| m6 | `social_post_list` is unused; media_confirm is missing. | MINOR | Fixed: `social_post_list` finds V0 ids in reconciliation; media_confirm, knowledge_import and job_get added to needs. |
| m7 | `organic_creative_queue` is misdescribed. | MINOR | Fixed: now described as the product's posting to-do list for approved rendered creatives, part of the parked flow. |
| m8 | Hand-built carousel contradiction. | MINOR | Fixed: the sentence is removed; never render here. |
| m10 | The standing mix isn't confirmed. | MINOR | Fixed: pillars, mix and series are proposed in the intake message and saved on yes. |
| m11–m15 | Writer attribution; unbuilt readers; posted patch unverified; optional imports | MINOR | Fixed: meta reads/writes re-attributed; posted patch falls back to the calendar file if refused; confirmed voice cards and reconciled calendars are imported as brand documents. |

## Round 2: adversarial run, three brands, after writing

| # | Finding | Severity | Resolution |
|---|---|---|---|
| 1 | The founder gate misses brand posts that speak for a named person (Lili's habits on the brand account). | MAJOR | Fixed: a **person gate** on any line attributing words, habits, use or opinions to a named person, on any account (post-check §8, voice-card "Named people", Approval gates), plus material-connection disclosure (post-checks §4). |
| 2 | Claims scope contradicts itself, with no tiering. | MAJOR | Fixed: three tiers (post-check §4); category education is a world fact. |
| 3 | "Kit proof point" is unscoped. | MAJOR | Fixed: `kit.proofPoints`, `valueProps`, `description` and the voice example lines are never proof alone. |
| 4 | Done-when contradicts flex slots. | MAJOR | Fixed: each flex slot ships an evergreen fallback "swap if a trend lands"; Done-when updated. |
| 5 | No fallback for a thin voice corpus. | MAJOR | Fixed: minimum ~8 posts; otherwise a 10-question voice interview, a provisional card and a labelled format test. |
| 6 | No new-account mode; company type read from a misleading field. | MAJOR | Fixed: "new account" run mode (handle, bio, pinned post, first 9 posts); company type inferred from description and audience; general-knowledge caveat; reads research-market personas. |
| 7 | Intake comes before the audit, with many undeclared stops. | MAJOR | Fixed: read and audit silently, then **one intake message, one checkpoint** carrying the audit, cards, the plan and capacity (Before you start #4–5). |
| 8 | Output volume would degrade drafts. | MAJOR | Fixed: week 1 drafted fully, 3 days shown in chat, the rest to file, week 2 in a second pass, compact Stories. |
| 9 | The audit asks for more data than the tools return. | MAJOR | Fixed: the actual window stated, top/bottom 3 under 15 posts, cut-off captions flagged, bio/pinned pasted. Server-needs #12–13. |
| 10–21 | Press quotes ≠ VoC; claim must match product; own posting times; seasonal date lookup and Halloween; tool naming; misdated example; TikTok format alternation; invented example facts; competitor relevance; voice-card yes in gates; internal names in customer text; guide-only items | MINOR | All fixed: press ≠ buyer words; claims matched to the slot's product; own times as the starting guess; dates looked up with a web tool or confirmed by the human, and dated moments are fixed slots with no TREND flag; `gooseworks-staging` prefix and conditional `tools_load`; Mon 19 Oct; sub-format alternation; examples labelled "shape only, invented"; skip off-category competitor posts; voice cards and the plan are in Approval gates; the opening line names no internal tools or playbooks. Guide-only items (ratios, half-life table, line-up test) are kept as defaults, and the playbook labels them as such. |

## Round 3: final critic (xhigh), adversarial re-run + contract + depth

Re-run on Personal Day (3 slots drafted; verdicts "light edits", "light edits", "post as is"; the Lili slot gated correctly), Gooseworks (a founder LinkedIn post) and Spellbound (new-account mode). Verdict: **NOT CLEAN, 4 MAJOR**. The critic judged it native on all seven platforms, and the 10–15 slot cadence realistic for a solo marketer.

| # | Finding | Severity | Resolution |
|---|---|---|---|
| 1 | Third-party IP, real people's likeness and mature content are only checked in trend slots. Spellbound's catalog has licensed characters and real streamers, and Halloween invites "Lady Dimitrescu". | MAJOR | Fixed: post-checks §4 and post-check step 6 now cover every slot (no unlicensed characters, franchises, logos or real people, including user-made catalog items) and age-sensitive content. Mirrored in make-content's repurposing.md. |
| 2 | Nothing gathers enough founder material to fill founder slots, so drafts end up as `[NAME:]` blanks. | MAJOR | Fixed: the intake message asks for raw material sized to the planned slots (one prompt per slot), saved to `content/pov/`. Drafts use it, `[NAME:]` is only for unanswered prompts, and an empty person slot is cut or swapped. |
| 3 | Product records are never read, yet claims allow only product-record facts. | MAJOR | Fixed: Before you start #3 reads `products`, then `product_ids` for slotted products. Step 6 says product facts come from those records only, and their outcome phrasing is still a claim. Same fix in make-content. |
| 4 | Carousels are routed to make-static-ads' side door, which accepts single images only. | MAJOR | Fixed: the human designs carousels from the slide table (time counted in capacity), and the side door makes at most the slide-1 cover. The handover reads `Graphic ready:` lines into the posting sheet's "Asset ready?" column. Same fix in make-content. |
| m | Flag names; re-running live posts; one shoot across placements; new-account grid proof and handle check; vote mechanics vs bait; never pass `carousel`; organic video via the phone; clock change; agent-note wording; staging test files | MINOR | All fixed. Flags are PERSON YES NEEDED throughout. The variety check includes `own_posts`. One shoot is counted once across TikTok, Reels and Shorts. The new-account grid's proof post appears only with signed-off proof, and the handle is checked. Choose-your-path votes are content. `carousel` is never passed. Video defaults to the phone. The clock-change note is in the seasonal pass. The listen-social line is marked as an agent note. Test files were deleted from staging. |

## Round 4: verification critic (xhigh), both playbooks

It confirmed every round-3 fix landed, there is no posting/approve/queue/render path (checked against the live schema, where `render` defaults to true and the playbook always passes `false`), and the Oct 19–Nov 1 walk works on staging. Verdict: **NOT CLEAN, 2 MAJOR.**

| # | Finding | Severity | Resolution |
|---|---|---|---|
| 1 | The same oversized seven-section full read, and an impossible `learnings_total` check. | MAJOR | Fixed exactly as in make-content: a lean read, learnings alone in full with the count compared, then `product_ids`; full detail is never requested across sections. |
| 2 | The "Names" tier let the unapproved tagline ("acne-safe skincare…") through as a name, contradicting make-content. | MAJOR | Fixed: a tagline counts as a name only once signed off, and one carrying a descriptor or outcome is an outcome claim until then. The claims block is now identical across both playbooks. |
| m1 | Raw material was gathered only for person-voiced accounts, so Lili on the brand account got none; three files still described the old `[NAME:]` behaviour. | MINOR | Fixed: raw material is gathered for every named person the plan features, on any account. post-check §8, voice-card.md and the tests are aligned with step 6. |
| m2 | The claims block differed from make-content's (pending case, category education, `must` facts). | MINOR | Fixed by the shared block. |
| m3 | The sensitive-topic row was missing (values posts win for Personal Day). | MINOR | Fixed: post-check 6b and post-checks §4. |
| m4 | The voice-card minimum triggers two interviews for one brand voice. | MINOR | Fixed: posts in the same voice on different platforms pool toward the ~8-post minimum. |

## Round 5: closing verification (xhigh), both playbooks

Every round-4 fix was confirmed on staging. The lean seven-section read is 53K characters (down from 304K); the lean read returns `learnings_total: 1` and the learnings-only full read is ~0.3K; the tagline loophole is closed; the claims blocks diff as identical. Verdict: **NOT CLEAN, 1 MAJOR**, caused by learn-my-brand updating its contract mid-review, not by our fixes.

| # | Finding | Severity | Resolution |
|---|---|---|---|
| 1 | learn-my-brand's contract now requires reading "Claims you may use" from the **full learnings read**, because search snippets cut qualifiers, scope and review dates. Both SKILL.md files offered search as an equal alternative. | MAJOR | Fixed in both: the claims block's step 2 reads claims only from the full learnings read, never snippets. SKILL #3 uses search only to find the marker when the full read comes back short, and says so in the claims check. The blocks still diff identical. |
| m1 | make-content's brief anatomy still listed "kit proof point" as proof. | MINOR | Fixed: "Claims you may use" fact or product fact (field), in content-brief and formats.md. The brief's kit-read sentence was rewritten. |
| m2 | run-organic-social's test log called the voice card provisional, contradicting the pooling rule. | MINOR | Fixed: pooled across IG + TikTok, 8 measurable posts, not provisional. |
| m3 | make-content's SKILL omitted current policies from the usable sources. | MINOR (make-content) | Fixed in step 4 and Approval gates. |
| m4 | Optional: read `sources` only when no channel file exists. | MINOR | Not adopted: `sources` is the only free signal for the brand's own accounts on a first run, and the lean read is already holdable (53K). |

## Round 6: closing confirmation (xhigh), both playbooks

Verdict: **make-content CLEAN (no major findings). run-organic-social CLEAN (no major findings).** All round-5 fixes landed. The two claims blocks are word-for-word identical and match the current learn-my-brand reading contract (re-read during the round). All 9 frontmatters parse, descriptions are ≤1,536, the meta JSON is valid, there are no vendor keys and no new tools.

| # | Finding | Severity | Resolution |
|---|---|---|---|
| 1 | run-organic-social post-checks.md §3 implied that `knowledge_search ["claim"]` rows count as proof after sign-off. | MINOR (predates round 5) | Fixed: "whatever their `approved` label, before or after sign-off; only the 'Claims you may use' facts are." |

**Loop closed:** this round found nothing major.

## Round 7: cross-set review fix pass (reviews/2026-10-16-*.md; AGENTS.md §3/§5/§8 changes)

| Source | Finding | Resolution |
|---|---|---|
| AGENTS §5 | `>-` description ≤1,024; `ATOM.md`; no internal names to the marketer | Fixed: the description is 960 characters with "Not for … — use …" lines; atoms renamed; the opening line names no tools or playbooks. |
| AGENTS §8 / contracts | Shared atoms | Fixed: post-check step 4 → `marketing-agent/atoms/claims-gate/ATOM.md` (the scoped sign-off runs once per calendar), plus the social spans (world facts, product match, past posts are not proof). Disclosure → `atoms/ad-policy-check/disclosure.md`. Voice cards → `atoms/voice-card`; references/voice-card.md now keeps only the social additions (post sources, corpus minimum and pooling, interview, measurements, the person rule). Learnings → `atoms/save-learning` (`[social YYYY-MM-DD]`). Reconciled calendars → `atoms/save-to-brain` (`keep-history`). Proxy reads → `atoms/spend-gate`. |
| contracts M3 | Lean read is enough | Fixed: lean only; full learnings only for `do`/`insight`. |
| depth (run-organic-social 4) | Learn loop is thin | Fixed: **1–2 named format tests** per calendar (hypothesis · slots on each side · metric vs the account's median · read date). At refill each test gets a win/lose/unclear verdict with numbers, the mix is reweighted, and a result becomes a learning only on the marketer's agreement (calendar-craft.md "Format tests", slot-anatomy Reconciliation, plan-calendar step 4). |
| depth | Pull the account's posts through the proxy | Fixed: account-audit and voice-card read Instagram, TikTok, X, LinkedIn and Threads posts through the proxy under the spend gate, with the yes asked in the single intake message. The free `brand_read organic` comes first, and pasting is the fallback. |
| routing 2c | No hosted-chat route for the CSV | Fixed: `gooseworks:file_url` `mode: "download"` link alongside the workspace file. |
| depth §6 | Platform norms restate model knowledge | Fixed: platform-native.md trimmed from ~1,130 to ~520 words. It keeps only reach and flag mechanics (link placement, see-more truncation, IG sends and slide-2 re-serve, commercial-music rule, search phrase, Shorts links, Pinterest lead time, safe zones). The generic examples are gone. |
| routing C6 / C15 / C10 | Single post vs calendar; organic platform and phone video; trend wording | Fixed: the description owns "slot these posts into my calendar", "write a post on this trend", "a TikTok or Reel script to shoot on my phone" and "which platforms should we be on (organic)?", with "Not for a single post or repurposing one piece — use make-content". Before you start #2: a single-post ask is written directly with no two-week intake, then the calendar is offered. |
| contracts M7 | Request-line format | Fixed: asset lines use `Graphic needed: for run-organic-social · … · return to: social/calendar/<date>.md`, and `Graphic ready:` answers are read at refill. |

**Rejected or parked (with reason):**
- Coverage m4 (carousel render): it belongs to make-static-ads' graphic-request mode, outside this folder. Out of scope now says "carousel rendering is not available yet"; the marketer designs from the slide table.
- Coverage M9 (a recurring "run-my-week" sequence) and m2 (Business Profile slots in the calendar): router/foundation and scope questions, pending Akhil. GBP stays "not covered yet".
- Coverage m3 (community posting): stays out of v1, for the reason in Out of scope.
- Depth §6 (mix ratios): kept as labelled starting defaults, because the format tests now move them per account.

## Round 8: adversarial + contract (high), both playbooks

Verdict **NOT CLEAN: 2 MAJOR, 8 MINOR**. Confirmed passing: tool use (`file_url` download, `render: false` only, no approve/queue/carousel, `patch.status`), and format tests named, placed, headed and read back.

| # | Finding | Severity | Resolution |
|---|---|---|---|
| 1 | The scoped claims sign-off ran at post-check after drafting: a second blocking message, then a rewrite of every slot. | MAJOR | Fixed: the 3–5 claim lines go into the single intake message (#6); post-check applies the recorded answer, and declined lines become plain product facts. |
| 2 | The single-post guard came before the brand read, and fell into the voice-card build. | MAJOR | Fixed: it is now Before you start #4, after the brand read. It skips the audit, sweep and intake; runs the scoped sign-off for that post only; uses the card → brand card (free) → kit lines with "voice provisional"; never opens a paid read or interview. |
| m1 | Stale "step 2 above" in Out of scope. | MINOR | Fixed: "Before you start #4". |
| m2 | The flex label named a playbook and differed from plan-calendar. | MINOR | Fixed: "trend: swap within 48h if one lands" everywhere. |
| m3 | Description triggers include single-post asks while it says "Not for a single post". | MINOR | Fixed: "Not for a standalone post or repurposing one piece — use make-content". Trend and phone-script asks are handled by #4. |
| m4 | Cards that depend on the paid read can't be in the intake. | MINOR | Fixed: they are shown afterwards, with the first three days, for the yes. |
| m5 | New account: no tool to check handles; no median for tests. | MINOR | Fixed: check with host fetch or ask; the baseline is the window's own median, and first-cycle verdicts default to "unclear" unless the gap is >2×. |
| m6 | `file_url` scope unnamed. | MINOR | Fixed: same coworker scope, `expires_in_seconds: 3600`. |
| m7 | `media_list` and `media_update` missing from needs; credits log missing from writes. | MINOR | Fixed. |
| m8 | Endpoint table issues; no test read-back check in tests. | MINOR | Fixed: verified endpoints only, author-matched, X pasted; Test 3 checks the verdicts, and Test 4 (single post) was added. |

## Round 9: confirmation (high)

**NOT CLEAN: 1 MAJOR**, created by the round-8 m4 fix.

| # | Finding | Severity | Resolution |
|---|---|---|---|
| 1 | Approval gates said cards are used only after a yes in the intake, contradicting #6 (paid-read cards shown later, with the first three days). | MAJOR | Fixed: those cards are shown in the intake or with the first three days; until the yes a card is provisional, and drafts say "voice provisional". |
| m1 | Single-post #4 skipped the reads it needs (cards, rules, accounts, listening) and never asked platform or account; post-check said the sign-off was asked in the intake. | MINOR | Fixed: #4 reads those, asks one message (platform and account, plus this post's claim lines); post-check §4 names #4's message. |
| m2 | A drafted line outside the recorded sign-off answer could trigger a second ask. | MINOR | Fixed: it is cut or written as plain product facts; never a second ask this run. |
| m3 | Step 2 and server-needs rows 4 and 6 were stale against "X pasted" and the flex label. | MINOR | Fixed. |

## Round 10: confirmation (high)

**CLEAN (no major findings).** All four Round-9 fixes are confirmed consistent with each other and with the shared claims gate, with no second checkpoint and frontmatter valid (964 characters). One optional minor applied: the claim-line ask runs "when the claims gate's scoped sign-off applies (nothing signed off, or a needed line not on the list; never when someone else approves claims)". make-content got the same wording.

2026-10-16 orchestrator: removed workarounds for today's 300-char/8-fact server limits per Akhil — the Brand Brain rebuild removes them; interim handling lives only in atoms/save-learning.

2026-10-16 final contract check: listen-social's report read as the newest `social/listening/<D>-report.md` (was `<date>.md`), freshness by its line-2 `Trends read:` date (SKILL.md, skill.meta.json, atoms/plan-calendar, references/post-checks.md).
2026-10-16 final contract check: graphic request lines now `Graphic needed: for make-static-ads · …` (the playbook that answers, as in every other request line) (SKILL.md, references/slot-anatomy.md).
2026-10-16 final contract check: references/slot-anatomy.md: the calendar template's Source and Asset lines no longer name playbooks (the marketer reads the calendar).
2026-10-16 final contract check: shared-atom paths `marketing-agent/atoms/...` → file-relative `../../atoms/...` (SKILL.md, atoms, references).
2026-10-16 final contract check: voice-card path placeholder `brand/voices/<slug>.md` → `<handle>.md` as the voice-card atom names it (skill.meta.json, server-needs.md); `atoms` vs `shared_atoms` split in skill.meta.json.

## Round 11: rebuild after Akhil's hand test (18 Oct, GooseWorks brand, X)

**Akhil's verdict: "among the worst".** His feedback:
- it doesn't know what works on each platform;
- it didn't know X now gives video more reach;
- it had no real strategy for reaching people;
- its X posts were generic ones no human would post or watch;
- it couldn't read the social media it needed;
- its document was hard to read.

**The transcript showed more failures:**
- questions before any research;
- pushback on his video point ("I can't confirm that… treat it as a hypothesis") instead of checking;
- kit value props used as "plain product facts";
- "check the brand kit" treated as claim approval;
- `file_list` called without the brand coworker scope (it landed in the org's default agent);
- `client` sent to `brand_read` (rejected);
- the product plugged into nearly every post ("We built Gooseworks so that…");
- "I'll read every reply" and bracket-filled recap posts;
- no X content read at all;
- nothing saved or delivered as a document.

**What changed (rebuilt around the platforms):**

| Change | Where |
|---|---|
| **Research each platform as it works now, before anything else**: dated web-search card per platform (reach signals, formats rising and fading, what small accounts can do, recent changes, X Premium); 8–15 linked niche examples with patterns; the brand's and the person's own accounts. Hard gate: no draft report without the card and examples. | New atom `atoms/platform-research` |
| **A strategy per platform**: account job, dated platform facts, niche patterns with our version, topics (product as proof, not the point), hooks from examples, format mix (video-first when rewarded), cadence and times in the audience's time zone, **how this account breaks in** (named accounts, 15–30 replies a day for 0→1k X, communities, quote posts), how we'll know. | New `references/platform-strategy.md` |
| **Flow per AGENTS §8's research pattern**: free pass (ask nothing) → draft report with strategy and three days of posts built only from found material, then one message (credit yes, exact claim lines, raw-material prompts, unknowns) → deepen → final report. Platform beliefs from the marketer are checked, not argued. | SKILL.md |
| **Posts modelled on what works**: every slot names its "Modelled on" example; screen-recording video for software; reply plan per post; the founder test in post-checks §1b (only they could write it, not an ad, sounds like them on that platform, follows a proven pattern, no bait, video where rewarded). | slot-anatomy, post-checks, post-check atom |
| **Delivered through `atoms/write-report`** in a readable shape: In short → per platform → posts (first three days, then an "All posts" appendix) → posting sheet → what we couldn't check → sources. No ids or syntax. Local file plus brand document plus link. | New `references/report-shape.md` |
| **Mechanics fixes**: coworker scope on every file call; `client` only where the schema has it; don't `card_wait` on the get_started card; value props are never facts; "check the brand kit" is not a yes. | SKILL.md |

## Round 12: critic on the rebuild (high)

Verdict **NOT CLEAN: 5 MAJOR**. All fixed.

| # | Finding | Resolution |
|---|---|---|
| M1 | 11 of 14 days lived only in an unreadable workspace file. | The report carries an "All posts" appendix in the readable shape; the workspace calendar is only the machine copy. |
| M2 | Draft posts were written before the material they need; no checks. | Step 1 mines public raw material (the person's posts, changelog, docs, blog, GitHub). The draft's posts use only found material and plain facts, pass post-check, and show "needs from you" lines, never bracket skeletons. |
| M3 | No free route that actually reads X. | Per-platform "free routes that work" table: the signed-in host browser with X advanced search (`min_faves:`, `filter:native_video`), else `site:x.com` web search over the past month and single post pages; YouTube, LinkedIn and TikTok/IG notes; find who buyers watch from the people they follow. |
| M4 | X growth plan too thin; no rule for judging without numbers. | Added: X Premium research; 15–30 substantive replies a day with notifications on target accounts; quote posts and communities; disclosed teammate engagement, never pods. The X cadence for a new account is 1–2 posts a day plus replies. "Judging what works" rule: public view counts, engagement relative to followers, "pattern, numbers not seen", never invent. Marketer beliefs are verified, not argued. |
| M5 | Two credit yeses in the audit. | One yes to a ceiling under spend-gate B, probe inside it; the contradictory "X pasted" removed. |
| minors | Step refs, server-needs wording (listening report, intake, `brand_update` → save-learning), tests wording, meta (drop `brand_update`, add `competitor_read`), relative data-access paths, atom frontmatter, voice interview in the ask list, `card_wait`, paid X row's recency | All fixed. Out of this folder (reported to the orchestrator): `foundation/guide` §4 and spend-gate/proxy-endpoints still name listen-social. |

## Round 13: Sonnet re-run 1 on Akhil's exact ask (staging Gooseworks; turn 1 plus turn 2 "start with X…"; paid reads declined, nothing spent)

**Graded against write-report §3 and "would a human post this?"**

**Pass:**
- **Platform research, done before any question.** 20+ dated web searches and pages, including X's open-sourced ranking code (Sep 2026), the head of product's July statement that video is close to half of impressions, the in-app video editor, Original Content Rewards, the link-penalty reversal, the AI-reply crackdown, and Buffer's format study. Video was agreed with sources and turned into a test, not argued against.
- **Niche read.** 11 named, linked X accounts with follower counts, read logged out in the browser.
- **Strategy.** A real strategy for a zero-follower founder: account job, four topic lanes, hooks lifted from examples, five posts a week (four screen-recorded videos), posting times in India and New York time with the US clock change, a daily reply routine, and a pinned intro and bio.
- **Report and claims.** The report reads cleanly: "Do this first" up top, dated sources, "What we couldn't check" (including price conflicts between the kit and the site). Claims were handled correctly: "check the brand kit" was not taken as a yes, and four exact lines were offered.

**Fail:**
- **The posts are not postable.** Days 2 and 3 are mostly `[NAME: …]` fill-ins (task, steps, flaw, prompt). They are templates, which is what Akhil hated. The run predated the round-12 rule to mine public material.
- **Thin reply routine.** 5 replies a day, short of the 15–30 for 0→1k now in the strategy.
- **Housekeeping.** The report was saved to an undefined `social/report/` path, the draft was imported as a brand document, and the voice card was built from the brand account's 5 posts rather than the founder's own.

**Fixes after run 1:**
- Every post must be postable as written: at most one short fill-in. Otherwise it is rebuilt from found material (the brand's published runs and videos, changelog, docs, the person's past posts) or replaced by a post that needs no private material. Never a template. (SKILL step 4, post-checks §1b.7, report-shape.)
- `[NAME: …]` syntax is banned from the report.
- The draft report is not saved as a brand document; the final goes to `social/plans/<date>-social-plan.md` and to save-to-brain.

**Staging leftovers from run 1** (Gooseworks coworker workspace): `social/{accounts.md,audit,calendar,report,research}` and two brand documents ("Social plan … 2026-10-18" and a DRAFT). Deleting the folder was blocked as a mass delete; listed for cleanup. `brand/voices/brand.md` and `content/pov/2026-10-18-founding-engineer.md` were deleted.

**Schedules rule (AGENTS §8, updated 18 Oct):** added SKILL step 8. At the end of a full plan, judge whether a repeat helps. If it does, offer a two-week refill with the reason: re-read each platform and the niche, judge the tests, write the next two weeks, and open a new report with what changed. Created paused via `automation_upsert` under spend-gate C. Never for a single post.

## Round 14: Sonnet re-run 2 on Akhil's exact ask (the fixed version; staging Gooseworks; paid reads declined, nothing spent)

**Grade: PASS on write-report §3 and "would a human post this?"**

- **Research before questions.** ~20 dated web searches; 25+ public X post pages and 8 LinkedIn post pages read in the browser; 15 linked X examples with views and follower counts.
- **Platform facts, sourced and dated.**
  - Video is "close to half the impressions" (X's head of product, 7 Jul). The brand's own numbers agree: its one video got 1,258 views against a 456 median for its text posts.
  - The open-sourced ranking reads video watch time.
  - Original Content Rewards reward originals over re-uploads; links go in replies.
  - X Communities were retired 30 May 2026, so replies are the way in.
  - Premium's size is unconfirmed.

  Video-first was adopted (5 screen recordings and 5 text posts), with a test.
- **Strategy.**
  - Account job, four topic lanes, and hooks from the examples.
  - Posting times in IST and New York, with the US clock change and Diwali noted.
  - **12 named reply targets with reasons, and a daily routine.**
  - A borrowed-audience move under the co-founder's video post.
- **Posts.** All ten are postable as written: nine have no fill-in, one has an optional one. They are built from the brand's public install file, changelog, docs and repo, and each names its linked model post. Samples:
  - "Before you paste an install prompt into your agent, read what it does…" (a screen recording with a timed script);
  - "Three things that were wrong with our video ads, from our public changelog" (with a screenshot).

  They read like an engineer, not an ad. The product share is high, but it is shown as proof, and the report says why and how the founder's own material will replace those posts.
- **Report.** "Do this first", "what you told me and what I did with it", per-section "so what" and "how sure", a posting sheet, and "what we couldn't check". It was delivered locally, saved to the brand, and linked.
- **Claims.** "Check the brand kit" was not a yes; five exact lines are offered by number.

**Conflicts the run surfaced, fixed:**
- The hard gate forced full research on platforms the marketer might not pick: full depth now applies to the named or top platform, with a lighter card for the others.
- The founder product-share cap clashed with "build from found material": public company material may be used as proof, said in the report.
- An unknown account owner in the draft: write for the most likely one and state the assumption.
- The reply plan names whom to reply to and what kind of specific to add, without drafting replies (reply drafting is backlogged).
- The Communities advice is now conditional on the research.

Noted, not changed: the leftover documents from run 1 polluted `knowledge_search` (a test artifact); save-to-brain's delete step and leftover titles (the atom owner's call). The schedule offer (step 8) was added after run 2 started, so it has not been run-tested yet.

**Staging leftovers (Gooseworks coworker workspace and brand documents), for cleanup:**
- run 1: `social/{accounts.md,audit,calendar,report,research}` and two documents;
- run 2: the `-run2` files under `social/` and `brand/voices/`, plus documents "Social plan (run2) — Gooseworks — 2026-10-18" and "Voice card founding-engineer-run2 …".

## Round 15: independent senior-marketer review (18 Oct; AGENTS §2b), Akhil's social feedback and run 2's output

Source: `marketing-agent-test/results/reviews/social-plan-search-review.md`. **Organic social graded 3/5:** a big step up, but over-corrected.

### Verdicts on Akhil's feedback (logged per §2b)

| # | Akhil's point | Reviewer's verdict | What we did |
|---|---|---|---|
| 1a | Each platform works differently; know what works there now | Right | Kept: platform research before anything. |
| 1b | "X gives more reach to video today" | **Partly right, mostly unproven.** "Video ≈ half of impressions" is video's share of all views. Buffer (18.8M posts) and Ordinal (B2B-skewed, to May 2026) found text level or ahead per post. | Reversed video-first. Every format needs a reason. On X, a founder's everyday post is text plus a screenshot unless current per-post evidence says otherwise. A marketer's platform belief gets a web check and a verdict (confirmed / contradicted / unclear) that names share vs per-post. |
| 1c | Build a strategy for how to get seen | Right | Kept, sharpened (below). |
| 1d | Posts were generic | Right | Kept "postable as written". The stranger test and brand-risk check were added. |

### The reviewer's ranked fixes for this playbook (§5)

| # | Fix | Done |
|---|---|---|
| 1 | Reverse the "no pushback" pass criterion. | Done. tests Test 1: a pass is a web check plus a verdict with a source; agreeing is not a pass, and neither is refusing unchecked. The telltale failures list both. |
| 2 | Symmetric format reasons; text plus screenshot is the default on X for founders. | Done in SKILL (What you get, step 2 belief check, step 4), platform-strategy §2 and the X craft list, post-checks §1b.6. |
| 3 | Premium as a researched line item; links reported both ways. | Done: platform-research (paid verification, price and tiers, link statements next to the data), platform-strategy §7 (a recommendation for this account; usually the cheapest lever in a reply-led plan; buying it is the marketer's call), platform-native X. |
| 4 | Reply targets lean to the buyer; 10–15 replies a day. | Done: 15–25 named accounts, at least half followed by the buyer, at most 3 direct competitors, a buyer-tied reason each; 10–15 substantive replies in two short windows in the audience's morning, scaled to the person's hours. |
| 5 | Content mix plus brand risk. | Done: at least 3 in 10 useful to a stranger, at most half mainly about the product (SKILL step 4, post-checks §1b.9). The brand-risk question is post-checks §1b.8, wired into atoms/post-check. |
| 6 | One blocking question. | Done: SKILL Before you start #4 allows one blocking question up front, when a single fact changes everything and no public source answers it (e.g. the handle). |
| 10 | Log the verdicts. | This section. |

**Also adopted from the review's §2 (what nobody asked for):**
- A line to the business: a tracked link in the reply or first comment, with signups or clicks read at each refill (SKILL step 4, strategy §8).
- An audience check: say once if the platform reaches people other than the buyer, then follow the marketer's choice.
- Source quality: a vendor "algorithm" page is never the only source; each card has a platform statement or a sized study; share and per-post findings are labelled.
- At least 3 examples from accounts under 10k followers.
- The report shape now follows the updated write-report: "In short" ≤150 words with confirmed points only, a dated "Decisions for you" box, "What we're not doing, and why", a ~3,000-word body with the posts appendix outside it.

### Pushback (§2b), with reasons
- **Don't hardcode "text by default" either.** The reviewer's per-post evidence predates X's July 2026 video push: Buffer's sample is Aug 2024–Aug 2025, and Ordinal runs to May 2026. So the playbook makes text plus a screenshot the *prior* for X founder accounts, and lets fresh per-post evidence flip it. That's the reviewer's own rule ("unless research shows otherwise"), stated so neither direction becomes dogma.
- **"10–15 replies" is folklore too.** The reviewer says so about 15–30, and none of the guides is measured research. We use 10–15 as a starting point scaled to the person's hours, and the format tests and refill read decide from the account's own results.
- **Premium:** we recommend it when the research supports it, but never as a purchase made for the marketer, and with today's price looked up. The reviewer notes X reorganised tiers on 12 Oct, so a fixed price would go stale.
