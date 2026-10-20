# make-static-ads — critique log

## Round 1 — before writing (2026-10-16)

Two subagents, effort high: a **scope** critic (senior paid-social creative lead) and a **depth** critic (senior performance creative strategist / DR copywriter). Full reports were kept in the session scratchpad; the findings and what was done with them are below.

### Scope (25 findings, 17 major)

| # | Finding | Severity | Done |
|---|---|---|---|
| 1 | Nothing reads what is live, winning or fatiguing before making | major | Step 1 reads performance read, `meta_read`, past batches, own scraped ads (`mode: "mine"`) and writes a state note |
| 2 | Brief intake too thin (objective, stage, persona, destination, mandatories, test question) | major | Step 2 one-screen brief, pre-filled, asks only gaps |
| 3 | Claims check after generation; image models add claims | major | Pass A before spend + Pass B on renders; prompt fence |
| 4 | Copy outside the image undefined — not launchable | major | Every ad a complete unit (2 primary texts, headline, description, CTA, destination) |
| 5 | No angle × concept × hook structure | major | `atoms/angle-grid`, one variable per cell |
| 6 | No menu of static archetypes | major | `references/formats-and-placements.md` §1, ≤ 40% per archetype |
| 7 | No naming/tagging contract | major | `handoff-format.md` §2 tags + name; manifest on campaign record / tags |
| 8 | No iterate-on-winner / rotation mode | major | Modes in Before you start; rotation rule in Step 3 |
| 9 | Reactive work missing (disapproval, stock-out, competitor move) | major | Disapproval fix (Step 5b, policy-check), stock/price mode; competitor move → read research-competitors' digest (routed, not scraped) |
| 10 | Regulated and special ad categories need their own path | major | Category classification in Step 2; policy-check; claims-and-policy §3–4 |
| 11 | Rights and authenticity (fake reviews, AI people as customers, UGC rights, competitor logos) | major | Rubric #6, #20; claims-and-policy "four doors" |
| 12 | B2B SaaS and services unsupported | major | formats-and-placements §2; "product or proof visible" |
| 13 | Local, app, marketplace, international modules | minor | formats-and-placements §2 (marketplace retail media stated as not covered yet) |
| 14 | "Nothing that looks cheap" contradicts native formats; silent remakes spend | major | Rubric judges each archetype by its own standard; remake allowance inside the one quote |
| 15 | Placements, safe zones, legibility | major | formats-and-placements §3; rubric #11, #13 |
| 16 | Offers, promo calendar, expiry | major | Offer terms + end date asked; `offer-ends` tag; claims check on offers |
| 17 | Destination / message match | minor | Each ad names its destination; rubric #21 flags mismatch to analyze-performance |
| 18 | Graphics side door needs a minimum process | major | `atoms/graphic-request` |
| 19 | Weekly cadence and volume | minor | Opt-in weekly refresh offered at the end. **Rejected:** sizing volume from spend — spend data belongs to run-paid-campaigns; the playbook asks for the count instead of guessing it |
| 20 | No brand-brain write-back | minor | Feedback, `dont` learnings, tags, manifest |
| 21 | Cut live competitor scraping | minor | Reads the saved pool only; points to research-competitors |
| 22 | Done-when bar too low (1 of 10) | minor | Raised: half the set, ≥ 3 angles and archetypes, zero claim misses incl. drawn text, complete units |
| 23 | No usable imagery → stop and route to make-product-photos | minor | Step 2 |
| 24 | Boundary with run-paid-campaigns on structure | minor | Recommends a test structure only |
| 25 | No-connection sentence | minor | Before you start #1 |

### Depth

| Finding | Done |
|---|---|
| Claims too late, once | Pass A / Pass B |
| Remakes unbudgeted | ~20% remake allowance inside the quote; beyond it → ask again; two rounds then drop |
| "Ten ads" undefined | Defined: one concept in every ratio its placements need; quote on that |
| Hard diversity test | "They buy because…" + differ on stage, driver or persona; fail if > 40% one angle or < 3 stages |
| Four doors for claims (VoC, template badges, visuals, model hallucination) | claims-and-policy, ad-copy, render-review |
| Labels too thin | Tags: angle, type, archetype, hook, stage, batch, test, offer end, claims, src, picked; hook source + claim ids in the hand-off |
| Write-back of rejections | `ads_creative_update` reason codes; durable lessons as `dont` facts |
| Prompt fence | ad-copy step 8; Step 4 |
| Stock/price re-check before hand-over | Step 10 re-reads the product record |
| Excellent example + junior contrast | `handoff-format.md` §5 |
| 20-check rubric with severities | `references/review-rubric.md` |
| Claim tiers T1–T5 / Never, trigger lexicon, no fusion | `claims-and-policy.md` §2 |
| Market sophistication; one angle taxonomy with video | `angles-and-hooks.md` |
| Specs stated as "check the live ads guide", no performance numbers | formats-and-placements |

### Staging findings fed back (same day)
- Product-scoped claim search returns `approved_scope_unknown` for every Personal Day claim, and the list holds press quotes about other products → claims-and-policy §2 "read the status fields".
- Own scraped ads carry copy, CTA, destination and run dates → Step 1 signal (copy is not a claim).
- Cost per image (60 at high) → quote planning in the test file.

### Overlap to note for consolidation
`claims-check`, `policy-check` and the claims reference overlap with make-video-ads' `script-check` and claims reference (same tiers, triggers, status-field rule). `render-review` overlaps make-product-photos' `fidelity-check` (product fidelity). Candidates for shared atoms.

## Round 2 — after writing (2026-10-16)

Two subagents, effort high: an **adversarial run** on staging (Personal Day moisturiser; Gooseworks as a just-launched B2B SaaS; an empty brand as a pre-revenue app; a disapproval) using read calls and free dry runs only, and a **contract check** across all three creative playbooks against the staging tool snapshot, AGENTS §2–5 and the sibling playbooks' published artifacts.

| # | Finding | Severity | Done |
|---|---|---|---|
| A1 | `ads_generate` takes one prompt per call — "one credit total" for ten concepts is the agent's own sum, which the server forbids; `variants` can't carry different hooks | major | Engine facts block; one dry run and submit per concept; quotes shown as returned; variants = re-rolls |
| A2 | Remake allowance can't be quoted (edit dry runs price only `animate`) | major | Allowance removed; remakes as quoted `ads_generate` remixes from `creative_ids`, precision edits named with the per-image rate, each on a yes |
| A3 / C-M1 | learn-my-brand's claims sign-off contract ignored; proof points not scope-checked (Byrdie mist / Allure toner quotes) | major | `reading-the-brain.md` §1 four-step contract; claims-check rewritten; proof points are candidates |
| A4 | Zero usable claims for the hero product → the set loses its positioning at Step 5 | major | Step 2 batched "can ads say these about <product>?" question; sensory tier added to claims §2 |
| A5 | Unfiltered `ads_creative_read` returned 2.1 MB | major | Filtered reads with small `limit` only; server-needs #5 |
| A6 | Unresearched brand gets a quote, submit fails after the yes | major | `research_status` checked first |
| A7 | "No images → make-product-photos" wrong for SaaS/apps | major | Company-type branch; `allow_without_product_image`; `Product imagery needed:` line for physical products |
| A8 | "Real screenshots only" impossible — the engine redraws | major | Stated plainly; letter-by-letter check or drop; B2B defaults to text-native archetypes; server-needs #8 |
| A9 | Contradicts the server: marketer picks the source; no ids/check names in chat | major | Step 6 shows options with previews, one suggestion, marketer swaps; plain-words hand-off; ids in tags and batch file |
| A10 | `get_started` next_step can skip Steps 1–5; cards end the turn mid-run | major | Hard rule 5 + Before you start #2 precedence; resume at Step 1 after a card |
| A11 | Stated ad budget ignored | major | Step 2 sizes the set to 3–4 concepts for a small budget. **Reverses round 1's rejection** of sizing from spend: when the founder names a budget it is an input, not a guess |
| A12 / C-M8 | Tag writes replace the set; `picked` would wipe trace tags; slugs over 40 chars | major | Read-merge-write rule; `src:` = 8-char id prefix; ≤ 30-char slugs |
| A13 | Campaign path discards the angle grid; `count` vs `planned_ads` | major | Grid written into concepts; `count` = the number asked |
| A14 | Disapproval fix unrunnable | major | Step 5b five-step path incl. copy-only fix, review request, no resubmission |
| A15 | Thin template library; `remix_spec` imports claims | major | Read template detail; similarity floor; Done-when archetypes "as many as the library allows" |
| C-M2 | Voice-of-customer read from `["evidence"]`, not research-market's bank | major | `reading-the-brain.md` §2 (voc-bank file / document); evidence as second source |
| C-M3 | Angle bank read from `kit.messagingAngles`, not `angle-bank.md`; no `A-NN` traceability | major | §3; tags `angle:A-NN`; mapping table to engine angle types |
| C-M4 | analyze-performance's read unreachable via `knowledge_search` | major | `file_read` `reports/performance/<date>.md`; file tools in needs |
| C-M5 | Graphic side door had no paths or file tools | major | §6 names the three request formats; answer line written back; file tools added |
| C-M6 | Spend on numbers the server never quoted; "standing allowance" in another playbook's file | major | Removed; yes in chat each time |
| C-M7 | `ratios` described as top-level | major | "On each source item" everywhere |
| C-M9 | Agent-proposed learnings are refused by the server; would be misattributed | major | Lessons offered to the human, saved only with their words |
| C-M11 | Hand-off only in chat | major | `ads/batches/<yyyymmdd>-<slug>.md` written with `file_write` |
| minors | Wrong step numbers in claims reference; brand voice vs personal-attribute rule; price currency; conflicting offer sources; own-ad run length; learning scope by format; quality lever; `sad` only for engine faults; founder's reasons → valueProps; LinkedIn via `resize`; pre-launch brief; integration names; search-bar UI; per-mode Done-when; rotation source and missing frequency; kept photos read; per-step Reads/Writes | minor | All applied |

**Rejected:** A-minor 2 (re-described tool parameters). Kept only the parameter notes that change behaviour (ratios placement, tag limits, filters); a reviewer can check each remaining mention is a trap the agent would otherwise fall into, not a schema copy.

## Round 3 — final verification (2026-10-16, effort xhigh)

One subagent re-ran five scenarios (Personal Day, Gooseworks LinkedIn, empty app with $500, a graphic request, a rotation request) against the revised files, re-checked the contract and judged depth. Verdict: **4 major**, each a one-to-three-line fix; the spend gate held in all five runs; every tool and `needs.mcp` entry matched; round-2 fixes present.

| # | Finding | Done |
|---|---|---|
| M1 | Batch file listed no ad copy; run-paid-campaigns launches from it verbatim (the server stores no copy) | `reading-the-brain.md` §7 lists the full per-ad fields; Step 10 and meta writes updated |
| M2 | Campaign path: "proof … or empty" stalls generation (server needs non-empty proof; scope-unknown claims refused); "campaign exists" undefined | Campaign must be for this ask; proof = a signed claim the server accepts, else a plain product fact; `concept_ids` + `count`; server-needs #19 |
| M3 | Chat-approved claims bypassed learn-my-brand's gate (spec: "no exceptions"; round 2 had added the path without logging the departure) | **Path removed.** Step 2 offers learn-my-brand's one-claim mode or a facts-only set; hard rule 1, gate 2, claims §2, claims-check and reading-the-brain §1 aligned |
| M4 | Step 1 brain read ~249,000 characters | Lean reads + learnings alone in full; engine facts; server-needs #20 |
| minors | Graphic mode replaces Steps 2–10; VoC `.jsonl` flags and `V-NN`; rotation `For:`/`Status: open` and `served`; disapproval reason from `state.md`; budget into the batch file; research `running` vs `none` vs no website; edit price is not a quote; `weak_copy` misuse; Description column; diversity vs small budget; kit `screenshotUrls`; null coworker scope; CTA rule → NOTE; Reads/Writes on Steps 7–8; Andromeda/carousel/LinkedIn 4:5; weekday in the example; `card_wait` in needs | All applied |
| 14 | "Hard rules" section before "What you get" breaks AGENTS §5 order | Moved inside "Before you start" (all three playbooks) |

Also applied from learn-my-brand's updated contract: the sign-off rules are now named "Claims you may use" and read in full from learnings; the record title carries `v<N>`.

## Round 4 — closing check (2026-10-16, effort xhigh)

Verdict: **2 major** (round-3 fixes all confirmed present; contract clean: 24/24 tools, description 1,023 characters, §5 order, sibling paths and line formats match).

| # | Finding | Done |
|---|---|---|
| M1 | The claims reference still let an unsigned claim ship (scope "ask the human", "needs sign-off" label, `claims:signoff` tag, test expectation) | Status fields only narrow a signed claim; scope comes from learn-my-brand; unsigned lists are cut with restore-proof; set note "claims not signed off — facts only"; tag `claims:facts-only`; test reply fixed |
| M2 | Paid edits (`precision_edit`, `resize`) ran with no engine quote | Not used unless their own dry run returns credits; every remake, text fix and extra placement is a quoted `ads_generate` remix (`creative_ids` + `render_id`, ratio on the item) |
| minors | Graphic answer line overwrote the requester's file (now re-read, insert, write full file); value-prop write-back removed (kit value props hold approved claims only; whole-array replace); `ratios` on campaign concepts; rotation Done-when allows a new angle when exhausted; Step 2 lists the likely angles' claims; `happy` on the current render; meta reads wording | Applied. **For the orchestrator:** `where-to-start/references/playbook-map.md:60` still says make-static-ads takes "3–5 claim lines confirmed in the chat" — that file is outside this session's folders |

## Rounds 5–6 — confirmation (2026-10-16)

**Round 5** (xhigh, all three playbooks): video and photos clean. Static: **1 major** — round 4's "quoted remix only" rule had not reached `formats-and-placements.md` (a paid `resize` line) or server-needs #3/#13. Fixed; minors applied (press quotes must be signed; "needs your call" limited to policy and taste; test wording).

**Round 6** (high, static only): **2 major** — (1) the T2 tier still let an unlisted "narrowed paraphrase" ship with a flag, against learn-my-brand's "verbatim or a listed variant" rule, and the worked example used one; (2) the test file's model reply extrapolated ten quotes from one and summed them. Fixed: T2 is now "listed variant"; any unlisted rewording is cut with restore-proof "add it as a listed variant in learn-my-brand" (same rule applied in make-video-ads); example A2 uses C1 verbatim; the reply shows only the one real quote. `ads_creative_edit` stays in needs.mcp for when edits can be quoted (noted in server-needs #3).

**Round 7** (high, static only): rules clean (no unlisted rewording, no chat approval, no unquoted edit, no own-number prices; cross-references resolve). **3 major, all in the worked example** (handoff-format §5): C1 reworded C5 while labelled verbatim; B3 invented five stars and lacked attribution; D1's visual kept the implied claim the row cut. Fixed: C1 verbatim and dated; B3 attributed with no stars; D1 re-concepted (jar alone) with the visual cut listed. Minors applied: any paraphrase is a new claim unless listed; learnings saved only with the human's own words (test); generic "most X" comparisons treated as comparatives needing a signed claim (B1 re-concepted as a benefit stack; formats and angles references aligned).

**Round 8** (high, static example and hook formulas): **4 major, all in examples** — hook formulas contradicted the comparative and replacement rules ("Most moisturisers: … This one: both", "nothing else was safe", "Stop layering five products"); A1's strike-through joke implied an unstated time-bound result; C2 reworded a customer line and posed it as a customer post; D1's usage line had no source. Fixed: hook formulas rewritten so each passes the claims check (situation call-out, signed number, verbatim social proof, old-way contrast, founder's real words, label-directions instruction); A1 pain-only line with the joke shown as cut; C2 brand-voice third person; label directions added to the hypothetical and cited for D1; C1 a stat card with no invented reviews; B2 sources stated; the "why it is excellent" line restated accurately. The rules themselves were confirmed clean in rounds 7–8; only illustrative content needed changes.

**Round 9** (high, strict bar on examples): **3 major, all example wording** — the old-way hook re-created A1's cut implication; a hook reworded C4 ("5 ceramides in one jar"); D2 used a founder quote the hypothetical never put on file. Fixed (old way = the customer's pain; C4 verbatim; founder story F1 added to the premise and cited). Minors: two primary texts per ad (not per angle); B2 notes V5 is pain only, no oily-skin suitability claim.

**Round 10** (high, strict bar on examples): **4 major, all hook-example lines** ("It sold out for a reason" — an unsigned social-proof claim; a "non-comedogenic" contrarian with no signed basis; "Will it break me out?" implying an unsigned answer; "One layer in the morning" not matching the label). Fixed by rewriting the hook section so every example cites the item on file it comes from (C1–C5, V1–V5, label directions, F1); mining bullets now say outcome phrases stay as pain or need a signed claim.

**Round 11** (high, strict bar): **No major findings.** All nine hook examples trace to items on file; no rule contradictions. Minors applied (instruction hook quotes the label exactly; listicle example no longer implies switching from other products).

**Final state:** rules confirmed clean in rounds 7–11; examples clean in round 11; video and photos clean in round 5. The loop ends here.

## Cross-set review fix pass (2026-10-16, orchestrator round 2)

Inputs: `reviews/2026-10-16-{coverage,contracts,depth,routing}.md`, AGENTS.md §3/§5/§8 (new). Shared atoms now used instead of local copies: `claims-gate`, `save-learning`, `spend-gate`, `save-to-brain` (owners: learn-my-brand / research-market); `ad-policy-check` and `honest-review` (owner: this session, built from the three playbooks' policy checks and render reviews).

| Finding | Done |
|---|---|
| Depth MAJOR: unsigned brand → facts-only set and a hand-off elsewhere | Step 2 runs `claims-gate`'s scoped sign-off for the 3–5 load-bearing lines inside the run; declined → facts-only |
| Routing C1: "my ad got rejected" | This playbook owns the fix for image ads (5b renamed "Rejected ad — fix it"); description "my image ad got rejected or disapproved — fix it"; Out of scope says the ads team only scans for rejections |
| Routing Gap-1: search ad copy | Description and Out of scope: "Not for search text ads (not covered yet)". **Not built:** a search-ads mode is scope expansion, pending with Akhil |
| Routing #57: direct "header image for my newsletter" | Graphic mode accepts a direct ask as well as a request line |
| Contracts F5a/b: tag writes may not reach the server; tags are lower-cased | Tags lower-case everywhere; picks and the manifest also in the batch file (record of truth). **F5a unverified:** the staging write test was blocked by this session's permission guard — logged as server-needs #21 with the exact test |
| Contracts F5c: "analyze-performance reads the manifest" | Claim dropped; analyze-performance reads tags |
| Contracts M7: `Product imagery needed:` never answered | Request line now in the shared format with `return to:`; make-product-photos answers with `Product imagery ready:`; this playbook reads the answer next run |
| Contracts M11: weekly refresh with no tool or gate | Dropped |
| Contracts M17: draft campaign briefs | Campaign path only when the brief's Status says "Approved" |
| Contracts M18: stale meta wording | Meta rewritten |
| §5: description ≤ 1,024 in `>-` form with "Not for…"; atoms → `ATOM.md`; no playbook/tool names to the marketer | Done (968 characters); local `policy-check` deleted (shared `ad-policy-check`); `claims-check` → `claims-extract` (extract step only; verdicts in `claims-gate`) |
| Contracts 2.3: restated MCP parameter limits in SKILL.md ("Engine facts") | Moved to `references/engine-notes.md`; tag-count/length limits deleted |
| Workspace: no coworker → `brands/<slug>/` prefix | `reading-the-brain.md` |
| Coverage m4: carousels | **Not built** (scope expansion pending with Akhil); graphic mode says plainly carousels can't be made here |
| Depth minor: "≥ 3 awareness stages or the set fails" is a rule for judgment | Kept with its exceptions (retargeting-only, small budget, iterate/rotation) — it is a diversity floor for a fresh ten-ad set, not a cold-prospecting rule; logged rather than removed |

### Fix-pass critique round (adversarial + contract, subagent at effort high, 2026-10-16)

Verdict: 6 majors and minors across the three playbooks and the two owned shared atoms. All fixed except where noted.

| # | Finding | Sev | Fix |
|---|---|---|---|
| M1 | Request lines and answers did not match §8 (`<Kind> needed: for <playbook> · … · return to:`; `<Kind> ready:`) | major | Rotation / Fix / Product imagery / Graphic lines and answers rewritten in both makers and photos |
| M2 | Photos wrote archive `reason`s, which the engine turns into brand-wide "dont"s | major | Rejects archived with no reason; a rule the human states goes through save-learning (`[photos …]`, max 3); SKILL, fidelity-check, rubric, meta aligned |
| M3 | Photos lacked the §8 workspace rule; "omit scope when null" contradicted it | major | Setup step 0 (coworker scope, else `brands/<slug>/` + tell the human); shot-list reference fixed |
| M4 | Video variants dropped the lead | major | Lead kept; `video_batch` count 2 with hook change; quotes shown as given, never added |
| M5 | Video claims route-outs still sent the human elsewhere | major | Scoped sign-off via claims-gate inline |
| M6 | Owned shared atoms: frontmatter not `>-` (invalid YAML in honest-review), root-relative links | major | `>-` form; links `../claims-gate/ATOM.md`, `../save-learning/ATOM.md` |
| m | Rubrics wrote learnings with `brand_update` directly | minor | Through save-learning |
| m | Playbook names in user-facing lines (T2 restore-proof, photos Test 3) | minor | Plain words |
| m | `angle:A-NN`, stale claims-and-policy §3 pointer | minor | `angle:a-07`; pointer to ad-policy-check §2 |
| m | Photos test asserted a labelled sum; video "say what a hook test would cost" | minor | Quotes one by one; a hook test priced only once quoted |
| m | Graphic request ran ad-account reads; email header ratio not an engine ratio; no-product graphics | minor | Own lean reads; 16:9 + flag; `allow_without_product_image` labelled "product not shown" |
| m | UGC "AI-made or a real person?" promised in the description, not asked | minor | Video Step 2 asks once |
| m | Imagery request written into a batch file that did not exist yet | minor | Step creates the batch file with the brief |
| m | `media_update` missing from photos needs | minor | Added |
| m | Lean SKILL.md: video Steps 5–6 restated atoms; photos Step 2 upload mechanics | minor | Pointers to write-script step 8 / present-gate 2b and 4; mechanics moved to source-audit §8 |

Rejected: none this round. Still open: F5a tag round-trip unverified (staging write blocked by this session's permission guard; static server-needs #21).

2026-10-16 orchestrator: removed workarounds for today's 300-char/8-fact server limits per Akhil — the Brand Brain rebuild removes them; interim handling lives only in atoms/save-learning.

2026-10-16 final contract check: references/reading-the-brain.md §6, skill.meta.json and tests: graphic requests read as `Graphic needed: for make-static-ads · …` lines in the three requesters' files (old `Header art needed:` / plain asset lines still accepted).
2026-10-16 final contract check: atoms/honest-review (owned here): its users' rubric atoms are now linked by resolvable paths.

## 2026-10-20 — Codex review round 1

Minimal edits on the dev version (the owner has a newer rewrite on his branch; these are listed in the PR so he can carry them over).

| Finding | Fix |
|---|---|
| #4 Hand-offs still named unreleased playbooks (claims approval through learn-my-brand; kept photos from make-product-photos; a `Product imagery needed: for make-product-photos` request line no released playbook answers) | Claims approval → the claims gate's scoped sign-off (SKILL.md approval gate 2 and Out of scope, `claims-and-policy.md`, `handoff-format.md` examples, `reading-the-brain.md` §1). Product photos → the brand's own or ones made with the goose-product-photos skill, offered as the next job (SKILL.md Step 2 imagery line, `formats-and-placements.md`). The request line is gone: the batch file holds the brief and a `Waiting for: real product photos` line, and the next run starts once photos exist (`reading-the-brain.md` §7). `skill.meta.json` reads/writes updated; the stale writes row removed. Video was already goose-video. |

## 2026-10-20 — Codex review round 2

| Finding | Fix |
|---|---|
| A4 (partly) The hand test still sent claims to learn-my-brand | `tests/test-by-hand.md`: claims are approved in the claims gate's scoped sign-off. |
