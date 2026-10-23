# make-content: critique log

Every round: the finding, the fix, or why it was rejected. Critics are subagents (effort high; xhigh for the final round). None read old skills.

## Round 1: scope critic (before writing)

| # | Finding | Severity | Resolution |
|---|---|---|---|
| 1 | "Any kind of content" is unbounded, with no per-format rules. | MAJOR | Fixed: a closed v1 format list with an anatomy each, picked by intent (references/formats.md). Anything else is routed or declined. |
| 2 | POV asked as yes/no, not captured. | MAJOR | Fixed: a 5-question interview, including a voice note via media_upload + media_analyze (references/point-of-view.md). Answers saved to `content/pov/`. |
| 3 | The claims check covers brand claims only; industry stats either gut how-tos or slip through. | MAJOR | Fixed: world facts need a source opened in this run, cited inline; otherwise cut. Never cite from memory (atoms/claims-check). |
| 4 | One voice only; bylines need a person's voice. | MAJOR | Fixed: author voice cards at `brand/voices/<slug>.md`, shared with run-organic-social. A per-person store in the brain is listed in server-needs #2. |
| 5 | Refreshing old content is missing. | MAJOR | Fixed: a refresh path delivered as a redline. The audit that picks which pieces to refresh stays with improve-search-visibility and analyze-performance. |
| 6 | Repurposer targets and ingestion are undefined. | MAJOR | Fixed: the platform list is asked once and saved as a fact; a native rule per target; an ingestion table (repurposing.md §1). A public-video transcript is a server need (#6). |
| 7 | No drafts store, and the spec promises live data the server can't give. | MAJOR | Fixed: workspace files under `content/` (server-needs #1). The "rising questions" input is taken from a page brief, the voice-of-customer bank or the human; the brief states "live data: none available" (server-needs #7). **Partly rejected:** the critic suggested make-content also create TikTok/IG `social_post_create` drafts. Not done. Dated, slotted posts are run-organic-social's, and two writers into the same post queue would collide. |
| 8 | Boundaries with run-organic-social and email-lifecycle are blurred. | MAJOR | Fixed: make-content writes undated cuts from an asset, and run-organic-social dates and slots them. The editorial newsletter issue is here; promo broadcasts are email-lifecycle's. Stated in Out of scope. |
| 9 | Case studies have no path through the gate. | MAJOR | Fixed: the case study is drafted from the interview with `[CUSTOMER APPROVAL NEEDED]` on each item, delivered as blocked, and routed to learn-my-brand. Before/after uses approved testimonials only. |
| 10 | Real-marketer inputs are missing: length, reading level, house style, inventory, regulated rules, language, CTA destination, deadline. | MAJOR | Fixed: in the brief template and "ask only what is missing". Translation is out of scope. |
| 11 | Recurring work is not named. | MAJOR | Fixed: a newsletter path with a saved issue template. The refresh queue comes from analyze-performance. |
| 12 | Company-type gaps (B2B comparison/launch/changelog; DTC buying guides, routines, before/after; app what's-new; local GBP; services POV; creator show notes). | MAJOR | Fixed: all added to formats.md. PDP/listing copy, sales decks, proposals and sponsor reads are named out of scope. |
| 13 | Reactive triggers are not routed. | MINOR | Fixed: step 1 reads sibling inputs (page brief, asset list, what-to-make-next). A news moment needs POV, so it goes through the interview. |
| 14 | No publish kit. | MINOR | Fixed: the publish kit in formats.md, required on long-form. |
| 15 | No outline gate, no chunking. | MINOR | Fixed: the brief and outline get a yes for long-form and case studies, and long pieces are drafted section by section with file_write. |
| 16 | Some exclusions are implicit. | MINOR | Fixed: Out of scope names press releases, sales collateral, PDP/listing copy, sponsor reads and translation. |
| 17 | The test only covers easy paths. | MINOR | Fixed: tests add a case study or comparison gate path and a video-source repurpose. |

## Round 1: depth critic (before writing)

All of the critic's top-10 must-encodes are encoded:

| Must-encode | Where |
|---|---|
| Arguable thesis | content-brief gate 1 |
| Proof slots and `[PROOF NEEDED]` | brief + editing pass 1 |
| No fabrication | editing pass 1 #8, claims-check, POV rules |
| Substance before line, plus the so-what and swap tests | two-pass-edit |
| Lede rule and BLUF | editing pass 2, formats |
| AI-tell ban list | editing.md, mechanical, with the removals reported |
| Atomic units | source-to-units |
| Per-platform hooks | repurposing.md §4 |
| Interview, with a no-POV downgrade | point-of-view.md |
| Claims table per piece | claims-check output |

Anatomies for the brief, article, case study (SCR), newsletter, short-video table and webinar set went into formats.md and repurposing.md. Encode-vs-overrated frameworks went into formats.md (intent table; no keyword density, no padding to competitor length).

**Rejected:**
- A Flesch score as a gate. It is kept only as a check, with readability targets stated.
- Exact platform caps stated as fact. Uncertain figures are marked (?) and treated as soft defaults.

## Overlaps to consolidate later

- **claims-check:** run-organic-social carries the same procedure as its post-check step 4; plan to extract it as a shared atom. make-static-ads and email-lifecycle will need the same.
- **Voice cards:** `brand/voices/<slug>.md` is shared with run-organic-social by path convention. Whichever runs first creates it.
- **Brief writer:** make-static-ads and make-video-ads likely carry their own brief atoms.

## Round 2: contract check (after writing)

| # | Finding | Severity | Resolution |
|---|---|---|---|
| M1 | The claims source contradicts learn-my-brand's sign-off contract: we used `knowledge_search ["claim"]` as the approved list, with an "approved by research" label. | MAJOR | Fixed: atoms/claims-check follows the contract (marker in learnings → the Brand record's Approved claims table; no marker → plain product facts only, everything else "needs learn-my-brand sign-off"). The research-approved label is dropped, and the spec's "usable only once signed off" is now honoured. |
| M2 | The VoC bank is read from the wrong place. | MAJOR | Fixed: `file_read research/market/voc-bank.md`, falling back to `knowledge_search ["document","evidence"]` (content-brief; meta). |
| M3 | "Proposed" do/dont facts go live at once (facts have no pending state). | MAJOR | Fixed: an inferred rule is asked as a question and written only on the human's yes, as `user_correction`, with an explicit kind. Server-needs #11 added. |
| M4 | A recording can't be uploaded from a chat host with no shell. | MAJOR | Fixed: chat hosts use a platform transcript or caption export, or upload in the GooseWorks app, then `media_list` + `media_analyze`. Server-needs #12 added. |
| M5 | The critique loop and the staging run were not done. | MAJOR | Fixed: rounds 2–3 are logged here, and the staging run is recorded in tests/test-by-hand.md. |
| m1–m15 | `job_get` kind; url-import cost; doc/PDF text path and no third-party imports; page-brief path; section refs; brand kit examples read; meta writer and reader attribution; optional imports | MINOR | All fixed: `job_get` names `kind: "knowledge_ingest"` + `brand_id`; url import "expected free, stop if priced"; PDFs read directly, and only the brand's own docs/pages are imported; `search/briefs/<page-slug>.md`; refs corrected; kit reference examples read in the brief; meta reads/writes name writers and readers; voice cards and the newsletter template are imported as brand documents once confirmed (drafts deliberately not). |

## Round 2: adversarial run, three brands (Personal Day DTC, Gooseworks B2B SaaS, Spellbound consumer app), after writing

| # | Finding | Severity | Resolution |
|---|---|---|---|
| 1 | The claims gate strips the brand's core positioning ("acne-safe") without warning; source order unclear. | MAJOR | Fixed: Before you start #4 warns before drafting and offers learn-my-brand. The source order is signed-off claim → product spec field → nothing; description and value-prop efficacy wording is never a fact. |
| 2 | A brand with no proof gets a draft that is ~45% brackets. | MAJOR | Fixed: proof gate in step 3. If fewer than half the H2s are proofed, stop at the brief with a "what unlocks this draft" list. |
| 3 | A comparison page can't pass both the thesis and claims gates. | MAJOR | Fixed: a situational verdict ("pick us if…; pick them if…"), built from criteria with no superlatives, founder-confirmed (formats.md). |
| 4 | Information gain and "what top results say" get filled from memory. | MAJOR | Fixed: judged only against competitor content in hand; otherwise "not checked (no search data)" (brief, editing.md). |
| 5 | The repurposer breaks on short silent clips (most brand TikToks). | MAJOR | Fixed: mine caption/visible_text/scenes, OCR is not a quote, rank instead of the threshold under 30s, recommend a richer own asset, skip platforms where the source already lives. Confirmed in my own staging read (11.7s, empty transcript). |
| 6 | A case study has no path when there's no transcript. | MAJOR | Fixed: Before you start #5 asks for the transcript, the written permission and the results period; a 6-question customer interview guide (point-of-view.md); an early-story variant. |
| 7 | The platform list and house style go into learnings that ad playbooks read as creative rules. | MAJOR | Fixed: `content/channels.md` in the workspace; learnings hold only real writing rules. Server-needs #10. |
| 8 | Voice match needs real lines two brands don't have. | MAJOR | Fixed: fallback order (author card → kit lines → own captions → site lines → pasted → "voice unmatched", plain copy). |
| 9 | No rights check for third-party characters or real people. | MAJOR | Fixed: third-party IP / real-person row in claims-check; server-needs #13. |
| 10 | The first newsletter run stacks ~15 asks. | MAJOR | Fixed: a proposed default template, ≤4 questions, and an editor's-note lead from this week's notes with no POV interview unless it argues a position. |
| 11 | The spec departs on sign-off. | MAJOR | Fixed by M1 above. |
| 12–22 | Applicability; inspiration fallback; platform discovery; refs; `tools_load`; edit-order contradiction; app-store limits; brain-vs-human conflicts; competitor-dossier sanity; audience conflict; suggesting topics; handover size | MINOR | All fixed: press quotes go only on the product they name, and unknown applicability is not brand-wide; `competitor_top_posts` fallback with a category filter; platforms from `relationship: self` organic_social sources; refs corrected; `tools_load` used only "if your host offers it" (absent on the full staging tool list, present per the snapshot's base set); order is now substance → claims → readability + AI-tells, and the swap-test contradiction is resolved; both stores' limits, and v1.0 has no what's-new; ask which is true and save it; check domain/handle before citing; audience-fit gate 6 in the brief; 3 "unverified: you pick" questions allowed; one claims block per set and the strongest 3 shown in chat. |
| Guide-only | Pass 1 written answers inflate every run; proof density is spammy | — | Accepted: only thesis, swap test, fakes and CTA are written; the rest are silent checks. The "one per ~150 words" density target stays as a long-form check only. The proof gate prevents bracket spam. |

**Not adopted:** the server's own `next_step` text says "Claim-grade proof is an approved claim or the kit's proofPoints as written". We follow learn-my-brand's stricter contract instead, because research writes those claims without a human and the spec requires sign-off. Flagged for the orchestrator to reconcile with the server team.

**Also from the run:** an outside edit (another session or the orchestrator) added `gooseworks:get_started` to every meta file. Matched by adding the sibling convention to Before you start #1 (first GooseWorks call: `get_started`, `wants: "more"`).

## Round 3: final critic (xhigh), adversarial re-run + contract + depth

Re-run on Personal Day (the Oct 10 Lili White House TikTok, 63s with a transcript), Gooseworks (a how-to) and Spellbound (a newsletter). Verdict: **NOT CLEAN, 2 MAJOR**. The critic judged the format anatomies and repurposer "senior-grade and genuinely native", and the Personal Day carousel "edit, not rewrite".

| # | Finding | Severity | Resolution |
|---|---|---|---|
| 1 | Learnings are read in lean mode, so the sign-off marker, qualifiers and `dont` rules can fall out of the window and every signed-off claim would be cut. | MAJOR | Fixed: claims-check, SKILL #3 and content-brief read learnings with `detail: "full"`, check the count against `learnings_total`, and can fall back to `knowledge_search ["learning"]`. Same fix applied to run-organic-social. |
| 2 | Knowledge pieces stall at the brief for brands with no brain proof, because no step gathers public sources. | MAJOR | Fixed: a **Public sources** step in content-brief (2–5 primary sources + up to 3 top-ranking pieces when the host has web tools; URL and date logged; never from memory). The proof gate now runs after it and after the interview, counts only H2s with factual claims, and counts interview lines as proof. |
| m1 | Stale cross-refs (repurposing §4, claims-check output). | MINOR | Fixed. |
| m2 | Platform discovery ignores run-organic-social's roster. | MINOR | Fixed: `content/channels.md` → `social/accounts.md` → self sources. |
| m3 | No rule for sensitive topics or dated sources. | MINOR | Fixed: a sensitive-topic row in claims-check (resource line from a source or the brand's standard line, else `[RESOURCE LINE NEEDED]`; no product tie-in), and stale "today is…" framing is dropped (repurposing.md). |
| m4 | The founder-story row conflicts with the repurposer. | MINOR | Fixed: verbatim from the source asset, speaker named and timestamped, is allowed. |
| m5 | Unclear where store policies come from. | MINOR | Fixed: product record or the brand's own live policy page opened this run; else cut. |
| m6 | One version per platform is thin for 2-platform DTC brands. | MINOR | Fixed: more than one surface per platform when strong units outnumber platforms. |
| m7 | The newsletter first run asks in two rounds. | MINOR | Fixed: one message carries the template questions and the ask for notes; with no notes, an "unverified: you pick" issue from the brain. |
| m8 | The voice-note path fails in chat hosts. | MINOR | Fixed: upload in the GooseWorks app or paste the recorder's transcript. (The m4a limit was untested and is not encoded.) |
| m9 | A staging test file was left behind. | MINOR | Fixed: test files deleted from the Personal Day workspace after the run log was recorded. |

## Round 4: verification critic (xhigh), both playbooks

It confirmed every round-3 fix landed, cross-references resolve, the make-static-ads side-door contract matches, and the staging workspace is clean. Verdict: **NOT CLEAN, 1 MAJOR.**

| # | Finding | Severity | Resolution |
|---|---|---|---|
| 1 | Round 3 made the main brain read seven sections with `detail: "full"`, about 304K characters on Personal Day, which a chat host can't hold. Full mode also returns no `learnings_total`. | MAJOR | Fixed: the first read is lean (it returns `learnings_total`), then learnings alone in full with the count compared, then `product_ids`. "Never request `detail: \"full\"` across many sections" added. content-brief reads the kit in full only alone and only when needed. |
| m1 | learn-my-brand's contract counts "Claims you may use" `must` facts and `must` policy facts. | MINOR | Fixed. The claims block was rewritten to the current contract (brain-map, "How siblings read this"): "Claims you may use" facts when signed off; plain product facts + current policies otherwise. The block is now **identical** in make-content's claims-check and run-organic-social's post-check, including world facts (a source opened this run, or a plain instruction with no factual claim) and taglines (a name only once signed off). |
| m2 | Product records have no ingredient or size fields. | MINOR | Fixed: mechanical facts stated in the description count; its benefit wording does not. |
| m3 | A quote from a named person on a cut carries no gate here. | MINOR | Fixed: the repurposed set's version block carries "PERSON YES NEEDED (<name>)" so the flag travels into run-organic-social. |

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

## Round 7: cross-set review fix pass (reviews/2026-10-16-{coverage,contracts,depth,routing}.md; AGENTS.md §3/§5/§8 changes)

| Source | Finding | Resolution |
|---|---|---|
| AGENTS §5 | Description ≤1,024 in `>-` form; atoms as `ATOM.md`; never name playbooks/tools/ids to the marketer | Fixed: the description is rewritten in `>-` form (984 characters), with "Not for … — use …" lines; atoms renamed to `atoms/<atom>/ATOM.md`; user-facing lines name no playbooks (`SKILL.md:30` and `:85` were the offenders; the scoped sign-off and "want me to put these into a two-week calendar?" replace them). |
| AGENTS §8 / contracts | Shared atoms replace local copies | Fixed: local `claims-check` deleted. Brand claims → `marketing-agent/atoms/claims-gate/ATOM.md`, including its **scoped sign-off**, which replaces "write around them"; this also answers coverage M4's "write around them" complaint for one piece. Content-only spans (world facts, competitor facts, stories, sensitive topics, third-party rights) moved to `references/fact-rules.md`. Voice cards → `atoms/voice-card` (slug = handle). Learnings → `atoms/save-learning` (`[content YYYY-MM-DD]`, ≤300 chars, ≤3 a run). Imports → `atoms/save-to-brain` (newsletter template `versioned: supersede`, which retires old document versions). Proxy reads → `atoms/spend-gate`. |
| contracts M3 | "Lean can miss the marker" is false; lean returns every must/dont | Fixed: lean read only. Full learnings only for `do`/`insight`/`template_hint`. |
| depth (make-content 4) | Search-intent briefs skip the search-results read | Fixed: content-brief reads the top results before briefing any search-intent piece (host web search free, or one `/v1/google/search` proxy read under the spend gate). "Information gain: not checked" now ships only when the marketer declines the read. |
| depth | Asks for 10–20 pasted LinkedIn/X posts though the proxy reads them | Fixed: author voice cards source posts through the proxy (`/v1/twitter/user-tweets`, `/v1/linkedin/search/posts` or `company/posts`, `/v1/threads/search`) under the spend gate; pasting is the fallback. server-needs #8 narrowed. |
| contracts M7 | make-content never reads its `Graphic ready:` answers | Fixed: asset lines and image notes use the §8 request-line format (`Graphic needed: for make-content · … · return to: <path>`), and step 1 reads the `Graphic ready:` answers on the next run. |
| contracts | Retire old document versions | Fixed: via save-to-brain `versioned: supersede` for the template. Voice-card retirement is owned by the voice-card atom. |
| routing C6 | Single posts and repurposing vs the calendar | Fixed: the description owns "write one LinkedIn / X post / thread" and "turn this webinar / video / blog into posts", and says "Not for a dated posting calendar — use run-organic-social". A new **single-post path** (step 3) runs with no brief or calendar intake. |
| routing F13 | "First pass of everything" invites press releases, product pages and decks | Fixed: the description now reads "Write articles, newsletters, scripts and repurposed posts" and names what isn't covered. |
| routing (make-content steps) | Steps 1–3, then unnumbered paths | Fixed: paths are numbered 1–7 (5a refresh, 5b newsletter). |
| contracts M22 | No voice sign-off signal | Deferred to learn-my-brand (marker owner). The voice-card atom will carry a `voice: confirmed | provisional` read once LMB adds it. |

**Rejected or parked (with reason):**
- Coverage M3 (landing and destination pages), M7 (enablement: one-pagers, battlecards, sell-sheets), m6 (press release), m3 (Product Hunt and webinar kits), m2 (local formats such as flyers, local partner pitches, referral cards): **not added**. The orchestrator ruled no scope expansion pending Akhil, landing-page copy and sales collateral included. The description and Out of scope say plainly these are not covered yet.
- Coverage m5 (editorial roadmap): topic choice stays with the marketer and plan-campaign, per the spec's out-of-scope line. It is a map question for the orchestrator.
- Depth §7 (verbatim-only claims are over-constrained outside regulated categories): this is claims-gate's rule (learn-my-brand owns it). Not changed here.
- Depth §6 (formats.md anatomies restate model knowledge): kept for now. The anatomies carry the gates (case-study blocking, comparison verdict shape, v1.0 what's-new). Trimming them is a candidate for the consolidation pass.

## Round 8: adversarial + contract (high), both playbooks

Verdict **NOT CLEAN: 1 MAJOR, 7 MINOR**. Confirmed passing: the `>-` descriptions, ATOM.md naming, no leftover shared-atom copy, consistent shared-atom paths, no playbook names in user lines, correct tool use, and the search-results read happening before the brief under the spend gate.

| # | Finding | Severity | Resolution |
|---|---|---|---|
| 1 | Single post: "the account's voice card" makes the voice-card atom build a card, which means a paid read or a 10-question interview for one post. | MAJOR | Fixed in step 3: use the account's card if it exists, else the brand card built free from `brand_read organic` (≥8 posts), else two-pass-edit's fallback, labelled "voice provisional". Never a paid read or interview for one post; a card is offered afterwards. |
| m1 | A single post never asks whose account it is for. | MINOR | Fixed: the #5 ask includes "brand page or a named person". repurposing.md §4: a company page uses the "we" voice; a person's profile uses only their own words, with PERSON YES NEEDED. |
| m2 | Step 4 order (outline before POV; proof gate runs after POV). | MINOR | Fixed: brief (search read, sources) → POV → proof gate → outline gate → draft, numbered. |
| m3–m4 | The search-read yes isn't bundled into #5; hosts with no fetch. | MINOR | Fixed: the yes is asked in the #5 message; with no fetch, titles and snippets are used and labelled "snippets only". |
| m5 | `media_update` missing from needs; credits log missing from writes. | MINOR | Fixed. |
| m6 | LinkedIn and Threads reads are keyword searches; `/v1/twitter/user-tweets` is unverified. | MINOR | Fixed: the voice-card atom and `spend-gate/proxy-endpoints.md` are the source; posts are kept only where the author matches the person; X posts are pasted until research-market verifies an own-feed endpoint (pending dependency, noted for its owner). |
| m7 | No single-post or SEO test. | MINOR | Fixed: tests 5 and 6. |

Pending dependencies (not defects here): `foundation/guide` not yet written (the preamble is inline meanwhile); learn-my-brand's `voice: confirmed | provisional` token; an X own-feed endpoint in `proxy-endpoints.md`.

## Round 9: confirmation (high)

**make-content: CLEAN (no major findings).** Every Round-8 fix was confirmed, and the single-post walk on Personal Day reaches a draft with no brief, intake or paid read. Two minors fixed: the scoped sign-off lines ride in the #5 message (Test 5 updated), and server-needs row 8 now says LinkedIn/Threads are author-matched and X is pasted.
Round 10 alignment: the scoped sign-off ask now uses the claims gate's exact condition (never when someone else approves claims), matching run-organic-social.

2026-10-16 orchestrator: removed workarounds for today's 300-char/8-fact server limits per Akhil — the Brand Brain rebuild removes them; interim handling lives only in atoms/save-learning.

2026-10-16 final contract check: graphic request lines now `Graphic needed: for make-static-ads · …`, and the expected `Graphic ready:` answer includes its date, as make-static-ads writes it (references/formats.md, references/repurposing.md).
2026-10-16 final contract check: references/repurposing.md: the set template's asset line and gate note no longer name playbooks (the marketer reads the set).
2026-10-16 final contract check: shared-atom paths `marketing-agent/atoms/...` → file-relative `....` (SKILL.md, atoms, references).
2026-10-16 final contract check: voice-card path placeholder `brand/voices/<slug>.md` → `<handle>.md` (skill.meta.json, atoms/content-brief, server-needs.md); `atoms` vs `shared_atoms` split in skill.meta.json.
2026-10-16 orchestrator ruling: the hand-over ends with an offer of the posting calendar, never starting it (AGENTS §2 rule 9); the claims step (SKILL.md step 6, atoms/two-pass-edit) loads ../ad-policy-check/disclosure.md for sponsored, affiliate, gifted or creator-collaboration pieces.

## 2026-10-20 — hand-test review (Akhil + marketer reviewers)

- **No X Article / long post / thread anatomy.** → formats.md: a new anatomy (when to pick each, what shows before "Show more", the share post, check X's limits this run). SKILL What you get and the description now name X articles and long posts (coordinator ask, for routing; description 1,018 characters).
- **A category-grading piece built on rivals' complaints before our own answer was settled; rivals identifiable from rating ranges.** → fact-rules (grading row) and point-of-view: settle our answer on the same test first, else the replies do the teardown; don't make rivals identifiable by detail unless naming is approved.
- **Adopted hook "Our credits expire every month. One rival's last two."** → editing: hooks lead with the reader's pain, never our weakness or a rival comparison; reviewer suggestions go through the same checks.
- **Fill-ins grew 1 → 4 though the credit-cost answer was in the brand's quickstart.** → SKILL step 4.5: check the brand's own public docs before leaving a fill-in; fill-ins shrink between drafts.
- **Quotes without links; prices from memory.** → fact-rules: no quote without a link to its actual page; prices and offers re-read live the same day, pointing to the guide's live-facts-before-copy rule.
- **Consistency pass: fact-rules cited "live facts before copy", a rule name the guide doesn't use.** → Now cites the guide's "Live facts" rule, §3.

### Review fixes on this change set (second pass)

| Finding | Fix |
|---|---|
| Two versions of the live-facts rule (fact-rules: re-read on the live page the same day; guide: only when > 14 days old) | The guide's rule now always re-reads prices, plans, free offers and credit amounts that go into copy; fact-rules' price row points to it without restating. |

## 2026-10-20 — Writing-for-Agents pass (items 1, 2, 4)

| Finding | Change |
|---|---|
| Contradiction: the brain read was `brand_read` only, with no `brain_*` path, while the guide reads the Brand Brain first | Before you start #1 is now the guide's setup line (§1–2 carries both paths) plus this playbook's reads: brain chapters 2, 5, 11, 22 and a lean `sources`/`organic` read; the fallback `brand_read` sections line kept; `content/`, `brand/voices/`, `content/channels.md` and the platform order kept. |
| Connection, `get_started`, `client`, brand/workspace scope and "talk in outcomes" copied from the guide and the server | Deleted; the guide and the server carry them. |
| The claims rule written three times (Before you start #4, step 6.2, Approval gates) | One live copy in Approval gates § Claims (now holding the scoped sign-off details and the someone-else-approves exception); Before you start #2 and step 6.2 point to it. |
| Orphaned "(step 4)" and "#5 message" pointers | Now "(Steps, 4.1)" and "the intake message" (Before you start #3). |
| Write paths listed per step and again in Output | Per-step "Writes" lines removed; Output carries the full paths (dated file names added). The page draft's line-one rule stays in step 4.5. |
| "(AGENTS §2 rule 9)" runtime pointer into a builder doc; "pillar 11" in references/formats.md | Both removed. |
| Done when was a test oracle ("edits rather than starts over", already in tests/test-by-hand.md) | Checkable per-path bars: units table, hook + 2 alternatives, brief + recorded outline yes + publish kit, redline with reasons, saved template; on every path an edit note, one claims block and every gap tagged. |
| Description 1,018 characters with synonyms and a deliverables list | 693 characters: what it is, one trigger per branch (carousel copy kept for routing case R46), the Not-for lines. |
