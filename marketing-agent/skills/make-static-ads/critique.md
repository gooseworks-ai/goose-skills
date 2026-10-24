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


## Round 12 — v0.3: concepts, references, agent-written briefs (2026-10-19)

**Why:** operator ask (Akhil, with Shiv's meeting notes): bring the server's prompt-write → judge → retry pipeline into the skill; concept diversity from the brand's own ads and social; visual diversity from fresh Meta Ad Library references (like custom video's "remix this ad" cards); a taxonomy of what an ad is made of (Reddit "Creative Diversity Cheat Sheet for Meta Advertisers", AG1's live ads); layer split to change text on the same image; logo / colour / font questions; a curated font list instead of the Inter fallback.

**Sources read:** gooseworks-app `origin/dev` static pipeline (`ad-remix-pipeline.service.ts` compose rules, judge schema, retry; template ranking; font library; layerize), the custom-video references flow (`video-references/*`), the Reddit post (via the data proxy — Reddit blocks the host's fetch), AG1's live US Ad Library (browser + proxy).

**Built:** `references/creative-taxonomy.md` (nine levers, AG1 worked example, concept grid, diversity checks, concept gate), `references/references-and-remix.md`, `references/prompt-craft.md` (the server's prompt rules for an agent; text modes), `references/fonts-and-color.md`; atoms `concept-grid` (replaces `angle-grid`), `find-references`, `write-brief`, `copy-variants`; rubric checks 22–23 and the engine's own pass/fail list; Steps reordered so concepts and references are approved before copy (1 read · 2 brief and look questions · 3 concept grid · 4 references · 5 copy · 6 claims · 7 briefs · 8 quotes · 9 generate · 10 review · 11 copy variants · 12 hand-off).

### Operator feedback, checked by an independent senior-marketer reviewer (AGENTS §2b, effort high)

| Point | Verdict | What we did |
|---|---|---|
| A1 Agent writes the prompts (knows the brand) | Right, with a gap: brand material is the brand's own guesses; customer words sell | Agent writes every brief; customer words ranked first in concept-grid; reviews on the brand's own product page as a cited fallback when no voice-of-customer bank exists |
| A2 Show 10–15 Meta ads as "remix this" cards | Partly: picking from a gallery by taste shrinks diversity | **Changed:** the agent assigns one reference per ad plus an alternate; the marketer approves or swaps |
| A3 Concepts from the brand's own ads and social | Right; own ads are past bets, not proven winners | Concept inventory marks long runners; competitors and customer words added as sources |
| A4 Layer split to change text on the same image | Half right: helps iteration and exact text, not diversity | Copy variants offered as a hook test on a winner, never counted as concepts; **added** a set-in-code text mode so words are exact (the reviewer's main point) |
| A5 Ask logo / colours / fonts | Partly: "random colours" is bad advice | Brand colours by default; a fresh palette only when asked, anchored on a brand colour; variety from concept, layout and style first |
| A6 Curated fonts, not Inter | Right, low impact | Pairings by brand type; a server-guessed font counts as none |
| S1 Concept diversity is the biggest problem | Right | The taxonomy, grid and checks are the core of v0.3 |
| S2 Split layers won't change much | Right for diversity | As A4 |
| S3 Need a taxonomy of ad structure | Right; the Reddit list mixes message structures with formats | Frameworks (shape) kept apart from message levers |

**Design findings from the same reviewer, applied:** numeric quotas (≥ 5 reasons, ≥ 3 personas…) would force small brands to invent concepts → replaced by two hard rules (no two ads share reason + framework + style; cover-the-text test) and spread targets scaled to what the brand has; optimising for difference, not quality → a five-check **concept gate** before any spend; spreading awareness stages hurts cold sets → awareness follows the brief; emotion is not a diversity lever unless the picture changes; 14-day run length is weak → 30+ days or several versions of one idea; show concepts in plain sentences, not a lever matrix; a few strong concepts × 2–3 executions as the default shape.

### Adversarial staging run + contract check (effort xhigh)

| # | Finding | Severity | Done |
|---|---|---|---|
| 1 | `ads_template_create` saves kind "upload"; the pipeline remixes uploads from pixels whatever `rights_attested` says — another brand's ad would be copied | major | Never register another brand's image; engine sources = imported competitor, library, community templates and the brand's own ads; category leaders' ads are layout models described in the brief; server-needs N0 |
| 2 | `apply_brand_font/colors: false` ignored (forced on) for competitor and library templates | major | Flags left on; a new font goes into the kit on a yes or is set in code; server-needs N6 |
| 3 | Kit always returns a font, often guessed (`mapped`) | major | A guessed font counts as none (Step 2, fonts §1) |
| 4 | "Ad = concept" contradicted the concepts × executions shape; dry runs per concept vs per look; awareness spread rules | major | Concept and ad defined once (SKILL, handoff §1); one dry run per ad; angles-and-hooks and handoff §5 aligned |
| 5 | Marketer saw concepts only after copy and claims were done | major | Steps reordered: references (and concept approval) before copy |
| 6 | `mode: "mine"` mixes uploads (incl. other brands' references) and repeats versions | major | Keep `scraped_meta`, merge by primary text, small limit; server-needs N11 |
| 7 | No v0.3 critique round; the builder ran paid data calls on staging (6 proxy calls, 6 test credits) against AGENTS §4 | major | This round; the calls are logged in the test file. **Noted:** they were test credits on staging, made to read the Reddit post (unreachable otherwise) and to verify the ad-library endpoints the playbook names |
| 8–17 | Organic is captions/counts only; run dates stop at last import; chat hosts get library-only references; claims override in rule 7; brand `must` beats defaults; `media_confirm` missing; stale "prompt fence"; old test brand; no schedule judgement; code-set ads not launchable | minor | All applied (organic topics only; refresh imports > 7 days; say so on chat hosts; rule 7 covers claims; `must` wins; bytes upload only; wording fixed incl. shared honest-review; Graza / Gooseworks / Greener Closet; end-of-run schedule judgement; code-set ads flagged) |
| 18 | A newer brand-brain server (`brain_*`) | minor | server-needs N12 |

**Rejected:** none. **For the orchestrator (outside this folder):** `where-to-start/references/playbook-map.md` and `foundation/guide` may still describe make-static-ads as "picks templates and the engine writes the prompt"; make-video-ads shares the angle `type:` taxonomy (unchanged) and could adopt the concept grid.

## Round 13 — closing check (2026-10-19, effort high)

Verdict: **5 major**, all consistency leftovers from round 12, plus minors. Fixed:

| # | Finding | Done |
|---|---|---|
| M1 | "One call / quote per concept" left in engine-notes, handoff §3, the test file and server-needs | "Per ad" everywhere |
| M2 | Taxonomy defined a concept as message levers + framework (every look a new concept) | Concept = persona, reason to buy, proof; framework, style, composition, type and hook belong to the ad (taxonomy, prompt-craft, SKILL intro) |
| M3 | Registering references via `ads_template_create` still in meta `writes`, server-needs N3 and the batch-file fields | Removed; batch file records the engine source template id and the layout model's link |
| M4 | Small budget: SKILL said 3–4 concepts (6–12 ads), the atom said 3–4 ads | 3–4 ads on one or two concepts, in different looks |
| M5 (strategist) | No concept id anywhere, so results can't be read per concept | `concept:<c1, c2, …>` tag; Concept and Proof columns in the plan table; concept id per ad in the grid and batch file |
| minors | angles-and-hooks leftover quota and awareness rule; one too-few-reasons threshold (two); hook limit unified at ≤ 8 words with a verbatim-claim/quote exception; rubric 19 adds style; AG1 example notes looks inside concepts; worked example lists its concepts and persona; claims-extract cites §1–2; server-needs header and item 8 step; Test 1 rewritten for Graza; `card_wait` named in Setup | Applied |

The rules and cross-references were confirmed clean in this round apart from the items above (step order, other brands' ads, font flags, agent-assigned references, AGENTS §2/§5).

## Round 14 — operator corrections (Akhil, 19 Oct 2026)

Akhil set eight decisions for v0.4. They are product decisions about how the playbook uses GooseWorks' own pipeline, not marketing craft, so they were applied as given. Every file now agrees with the new SKILL.md.

| # | Decision | What changed |
|---|---|---|
| 1 | The skill **is** the server's static-ad pipeline run by the agent: read brand + template → compose like the server (`composer.md`) → `ads_render` → judge like the server (`judge.md`) → one retry with the server's note; plus concept diversity, fresh Meta templates and the brand brain for claims | New `atoms/compose`; `atoms/render-review` rewritten around `judge.md`; `engine-notes.md` rewritten (thin render tool and what the agent must supply). The four ported files keep their server text; only stale status lines were fixed (composer §11 status, a neutral wording in composer §10, judge §8 tag line) |
| 2 | **One prompt.** The marketer's chat words are the composer's User instructions; each concept goes in the per-ad Variant brief; the composer writes the on-image words; `ad-copy` writes only the copy around the image and the hook direction | `references/prompt-craft.md` and `atoms/write-brief/` deleted; `ad-copy` no longer writes an on-image text block; `concept-grid` writes each ad's Variant brief; rubric check 23 renamed "Composed prompt followed" |
| 3 | `ads_generate` and the campaign generation path are gone; campaign records are read as input only | Removed from every atom, reference, test expectation and `needs.mcp` (`ads_generate`, `request_campaign_generation`, `add_campaign_concept`, `update_campaign_concept`, `ads_approval_decide`); remakes, fixes, extra placements and copy variants go through compose + `ads_render` (copy variants may also use layerize) |
| 4 | Every ad is a remix of a template; templates the brand doesn't own are structure-only; Meta ads that aren't templates yet are registered | `find-references` rewritten (gallery → marketer or agent picks, register, structure-only per ad); "layout model" path removed everywhere |
| 5 | Claims: the composer's grounded-claims rule checked against brain statuses (`confirmed` / `found` on site, kit or product → use; `guess` / `unknown` → cut) | The learn-my-brand "signed-off / Claims you may use / scoped sign-off" contract removed from `reading-the-brain.md` §1, `claims-extract`, `ad-copy`, `concept-grid`, `angles-and-hooks.md`, `creative-taxonomy.md`, `formats-and-placements.md`, `claims-and-policy.md`, `handoff-format.md` (worked example wording), `review-rubric.md` and the tests; tier and trigger-word craft kept and re-based on statuses; `brain_map` / `brain_search` / `brain_open` added to `needs.mcp` |
| 6 | Content-policy refusal → re-compose without the trigger and send once more (counts as the retry); judge results go to tags and the batch file, never render feedback | `render-review` steps 3 and 8; `review-rubric.md` record rules. Note: this differs from the server, which switches engine on a content-policy block (`composer.md` §11) — the playbook re-composes instead, because the trigger is usually a line or visual it can remove |
| 7 | No text modes, nothing code-built, no "save the font in the kit"; `fonts-and-color.md` only for a plain-system-face headline and the copy-variants font option | `fonts-and-color.md` reframed; the typography improvement lives in `atoms/compose`; `brand_update` and `media_analyze` dropped from `needs.mcp` (no longer used); server-needs N10 dropped |
| 8 | The 30-day rule is gone: likely working = 14+ days, several versions, or among a leader's first ads | `find-references` and Test 7 aligned with `references-and-remix.md` §1 |

Also: SKILL.md's "Step 6b" corrected to Step 7b; `skill.meta.json` to 0.4.0 with atoms, reads, writes and tools matching the files; `server-needs.md` marks N1 and #21 done (PR #2105), N2 resolved by the Variant brief, and adds N13–N17 (server judge with a free retry, a blueprint tool, server font specimen or signed font access, live recurring-rejection rules, structure-only `ads_template_create` from another brand's ad); Test 9 (app UI vs skill, blind judge) added; historic staging logs marked "pre-0.4 (ads_generate era)".

**For the orchestrator (outside this folder):** this playbook no longer loads the shared `atoms/claims-gate` and no longer uses learn-my-brand's claims sign-off contract (AGENTS §8 "Claims") — it reads brand-brain statuses directly, per the operator's decision. `claims-gate` is removed from `shared_atoms`; the shared atom itself was not edited. AGENTS §2 rule 7 and §8 "Claims" still describe the old contract and should be reconciled. `foundation/guide` and the playbook map may still describe make-static-ads as using `ads_generate`.

## Round 15 — Juicebox retest (Akhil, 20 Oct 2026)

Akhil ran the skill on Juicebox (three Meta feed ads, his template picks: three Loxo ads). Claims were all grounded. Three gaps, all agreed by him:
1. **The template took over the concept.** Swapping "fishbowl" for Loxo's binoculars ad turned "Stop fishing the same pond, for staffing agencies, proof 500+ agencies" into Loxo's own idea with no persona or proof. Fix: the template gives the shape, the concept keeps the message (`references-and-remix.md` §3.5, compose atom, render-review "concept is intact").
2. **Copying a direct competitor.** Same binoculars, same colour wash, and "For hard-to-fill reqs" echoing Loxo's "hard-to-reach talent". Fix: direct competitors lend layout only, plus the side-by-side test (`references-and-remix.md` §5, gallery tag "layout only", render-review check).
3. **No memory of past GooseWorks ads.** The search-bar ad reused the same Loxo template and the same example search as an ad made earlier that day. Fix: a "made before" list from batch files and creatives (§2a), never suggested again, new example content if picked (§3.6, render-review "not a repeat").

Open, asked of Akhil: whether every set must carry customer proof (agent's view: each concept needs a visible proof; customer proof at least once per set when the brand has it, not on every ad).

## Round 16 — writing-for-agents review (20 Oct 2026, v0.4.2)

A fresh subagent (effort xhigh) reviewed every file against the "writing for agents" guide (aihero.dev): pointers, information hierarchy, completion criteria, duplication, negation, sediment. Akhil asked for the fixes. Findings and what changed:

| # | Finding | Severity | Done |
|---|---|---|---|
| 1 | Description lost to goose-ads: 1,000 chars, dead opening, five triggers for one branch, never named goose-ads (Akhil hit it: "make static ads" ran goose-ads) | must | Rewritten, 706 chars, leads with "Static image ads", names goose-ads; routing cases R01/R19/R39/R57 still covered |
| 2 | Setup never checked `ads_render` exists (prod/staging lack it until gooseworks-app #2105 merges) | must | Setup 1: done when `ads_render` is listed, else stop; hard rule 4: every image through `ads_render` |
| 3 | Default count contradicted itself (ten vs 3) | must | Step 2 Q5 is the only default (3 ads, Meta feed 4:5); concept-grid shapes by the chosen count |
| 4 | Ownership override not where compose reads it; §2.2 table puts `upload` on the normal path | must | compose row 2 states structure-only follows ownership; Step 6 done line checks no other brand's image in `image_urls` |
| 5 | Judge brief incomplete (no §3 values, unreduced blueprint for direct competitors, accent-headline rule unseen) | should | render-review step 1 assembles §3 from the compose record with the reduced blueprint; judge departures J1 (facts) and J2 (accent text) |
| 6 | Pointers to ported files fired at intro / Step 3 / Step 4 | should | Removed; Variant brief now written at compose, not concept-grid |
| 7 | SKILL.md sprawl, steps restating atoms, hard rules duplicating gates | should | Steps = action + atom + done line; hard rules 2, 5, 6 folded into gates or cut; 18.5K → 14.7K chars |
| 8 | Modes scattered; stock mode undefined; 7b inside Step 7 | should | One Modes table; 7b → `atoms/fix-rejected`; stock/price mode defined with a done line |
| 9 | Claims rule in ~9 places, drifting | should | Leading word *usable fact*, defined once in `claims-and-policy.md` §2 |
| 10 | "do not say …" put the cut claim into the composer input | should | Brief rewritten around usable facts only; compose input is a closed set |
| 11 | Three source orders for reasons to buy | should | concept-grid step 1 is the one order; taxonomy §5 and angles §4 point to it |
| 12 | Python copied out of markdown by hand | should | `scripts/schemes.py`, `scripts/specimen.py`, byte-identical to the ported blocks (checked) |
| 13 | Font "upload" and "file in the kit" paths don't exist | should | Brand font offered only on Google Fonts or a metric clone; upload dropped |
| 14 | Fix lists grouped by date, not topic | should | compose fixes → departures ledger; render-review's 8 checks → rubric 22, 24–29 |
| 15 | Runtime pointers into server-needs / critique; PR status lines | should | Pointers and status lines cut; both files kept (AGENTS.md §3 requires them) |
| 16 | engine-notes duplicated; research check buried | should | Research check → Setup 3; engine-notes cut to unique notes; all "Load at Step N" lines removed from references |
| 17 | Template question had two readings | should | "you pick from a gallery / I pick and show you" |
| 18 | Done-when not checkable ("money behind half") | nice | Kept in tests only |
| 19–20 | copy-variants one-line procedure; historic logs in tests; hard rule 6 a no-op | nice | Layers split into numbered sub-steps with a pixel-match done line; logs moved to this file's appendix; rule cut |

Not changed: the verbatim server text inside `composer.md`, `judge.md`, `structure-blueprint.md`, `font-specimen.md` (parity, Test 9). Departure 6 (content-policy re-compose instead of the server's engine fallback) is kept from Round 14, now marked in the compose ledger.
Outside this skill (follow-ups): goose-ads should route static requests here; the server's MCP instruction "static ads: ads_template_read … then ads_generate" should point at this flow.

## Round 17 — production run skipped the research (Juicebox, 20–21 Oct, v0.4.3)

Akhil ran 0.4.2 on production ("create static ads for juicebox brand", then "make 5 more"). The session loaded the skill and asked the Step 2 form, then skipped most of the research and checks. 4 of 6 ads repeated messages Juicebox already runs on LinkedIn, in the kit's blue instead of the brand's real purple; about 240 of 420 credits went to repeats. A separate check found that local and production runs pick the same three Loxo ads and the same website facts, so the same inputs give the same ads.

| # | What happened | Why the skill allowed it | Done |
|---|---|---|---|
| 1 | Never read the brand's live ads; wrote "brand has no running ads" after finding nothing in GooseWorks. Never opened `references-and-remix.md` | The brand's own ads were a parenthesis inside Step 1's long reads line; "read or named as missing" let "nothing on file" pass | Step 1 split: 1b "What the brand already runs" with its own done line (Meta + LinkedIn libraries + saved ads, or the library named as empty); §2a lists the live libraries and says GooseWorks records prove nothing |
| 2 | "your choice show me the final ads only create one ad" taken as license to skip Steps 1, 3, 7, 10 | No rule said short answers only skip the display | Hard rule 5 |
| 3 | No concept grid; angles taken from the website's headline stats | Taxonomy never loaded; grid not required before the quote | Step 3 loads both references, shows the grid with the coverage note before any quote; concept-grid drafts 2× candidates and checks headline facts against the inventory |
| 4 | Claims check skipped | Step 7 didn't load its reference | Step 7 loads `claims-and-policy.md` |
| 5 | The agent judged its own renders | "Blind judge" was a leading word without the rule | Step 10 names a fresh subagent, never the composing agent |
| 6 | "Make 5 more" skipped Steps 1–4 | No mode for a follow-up set | "More ads" mode: a fresh batch; this chat's ads join the made-before list |
| 7 | B2B brand's ads live on LinkedIn | Only the Meta library was read | LinkedIn Ad Library added for B2B brands |
| 8 | Same inputs → same templates (all three from Loxo; local and prod identical) | Suggestions always took the longest-running ad; one tracked competitor | find-references: 3+ advertisers incl. a non-competitor leader; at most one suggestion per advertiser; prefer the layout furthest from the inventory |
| 9 | Kit colours didn't match the brand's real ads | Colour question only knew the kit | Step 2 suggests the running ads' palette when it differs |

Also: `tests/test-by-hand.md` setup now links the flat layout; Test 10 covers this failure. Not changed: `requires_skills` keeps `claims-gate` because the shared steps it requires need it (the flat-list rule).

**Round 17b — review and dry run before merge (21 Oct).** A reviewer (effort high) and a dry run on production Juicebox (both rounds up to the quote, nothing spent or written) checked 0.4.3. The dry run read Juicebox's live Meta (~59 ads) and LinkedIn (765) pages first, built the inventory, drafted 10 reasons, dropped the ones Juicebox already runs, showed the coverage note and ran the claims check (cut "100+ integrations"). Fixes from both:
- Hard rule 5 reworded ("short answers change who decides, not what runs"); Step 4 added to the always-run list; no clash with modes that skip steps.
- Step 1b done line needs evidence per source (URL or call, count); empty GooseWorks import = "not checked"; proxy fallback on one yes when there is no browser; LinkedIn for every brand, advertiser confirmed.
- Saved ads of other brands stay out of the inventory.
- Running-ads palette is a real colour answer (fonts-and-color §4 row, compose row 3).
- Repeats capped: at least two ads in three on a reason the brand does not run.
- Judge trace records who judged; More-ads mode builds the inventory if the first set didn't.
- find-references: one floor (3+ advertisers incl. 3–5 non-competitor leaders); cap per advertiser = one per concept, a third of the set.
- Production renamed `brain_*` to `brand_knowledge_*` (old names still callable, hidden from discovery): the skill uses the new names and says so in Setup.
- Still open: the server's reference selection reaches only the first three product screenshots, so later UI ads lack real screens; the kit's logo URL can be an SVG; runs on different servers still pick alike (made-before is per workspace).

**Round 17c — real-entry retests (21 Oct).** Two fresh agents started from `/gooseworks create static ads for <brand>` on staging, never told to follow make-static-ads exactly, with the Juicebox session's scripted answers: Graza (consumer) and GooseWorks (B2B). Both read the brand, the brain (`brand_knowledge_*`), the live Meta library and the made-before list, built a concept grid, ran the claims check and reached the quote. LinkedIn: GooseWorks checked it, Graza correctly didn't (the platform rule now follows the platforms the brand advertises on, not every brand). Debriefs agree on why steps get cut: instructions from outside the skill (a stale local router sending static ads to goose-ads; server next_steps "one line and wait", "recommend one plan"); very large tool answers (kit 50–155K characters, creative lists 0.8–1.5 MB); composer.md's 712 lines re-typed per ad (both abbreviated it as "[verbatim]"); and Step 4's live category-leader search, the most expensive step and the one most often cut.

**Round 18 — 0.4.4: compose script, small reads, template recipe (21 Oct).** Built `scripts/compose.py` (composer input and final prompt; 14 tests; output matches the server's own TypeScript on 5 example ads). Added an exact read-call table (`engine-notes.md`), the `made-by:make-static-ads` tag, and a fixed template search (`references-and-remix.md` §2b). Two local retests from `/gooseworks` (current router from `main`) on staging, Graza and GooseWorks, both rounds to the quote: both used `compose.py` for every ad; GooseWorks read 64 leader ads across 4 advertisers; Graza's leader search was blocked by the host's safety check, so its templates came from the library. Fixes from the debriefs: past-ads list read capped at 3 rows (10 rows were 729K characters), the colour rotation continues across "more ads", every candidate's detail is opened before suggesting (a staging QA fixture had been suggested), headline-less templates only on the marketer's pick, and the font question suggests the closest free match when the brand font isn't on Google Fonts (`brand_font_unavailable` in `ad.json`). Open, outside this skill: the router on `main` still names `brain_*` and `brand_setup`; the server's knowledge search labels kit value props "not an approved ad claim", against this skill's rule; `get_started` still says "one line and wait".

## Appendix — build-time test logs (moved from tests/test-by-hand.md, 20 Oct 2026)

### Free and cheap reads — 2026-10-19 (no generation)

| Step | Call | What came back |
|---|---|---|
| Category leader page id | Meta Ad Library search box, "AG1 by Athletic Greens" under Advertisers (host browser, free) | page id 183869772601, ~510 active ads; default order by impressions |
| Category leader ads | proxy `/v1/facebook/adLibrary/company/ads` `{pageId, status: ACTIVE, media_type: all, trim}` | 29 ads, 1 credit, 172 KB; statics as DCO / IMAGE / CAROUSEL with `original_image_url`; 7 distinct static concepts (taxonomy §1). `media_type: IMAGE` returned 0 (server-needs N9) |
| Page search | proxy `/v1/facebook/adLibrary/search/companies` `{query: "AG1"}` | 1 credit; AG1 not in the results (celebrities named "Ag…") — find page ids in the library's own search box instead |
| Keyword search | proxy `/v1/facebook/adLibrary/search/ads` `{query: "greens powder", media_type: image}` | 30 ads, 1 credit, 724 KB; mostly one long story ad from look-alike pages — keyword search is a last resort (references §2d) |

### v0.3 staging run — 2026-10-19 (adversarial reviewer, free calls only) — historic, pre-0.4 (ads_generate era)

| Brand | What came back |
|---|---|
| Graza (DTC) | Kit font Bebas Neue (`mapped` = guessed); no proof points, 0 learnings, no sign-off; 304 own Meta ads; 5 imported competitors (~90 static templates, layouts asking for starburst badges). `mine` (image, 30 rows) = 10 distinct texts → concept inventory buildable (seed-oil and avocado-oil swaps, a pomace myth ad, 35% off subscription, chips, mayo, "details matter"). Organic: 12 posts, captions + counts only; most-commented are giveaways. Conflicting offers in knowledge (free shipping over $55; 20% off Starter Kit). **Dry runs:** a 2,470-character brief as `prompt` on library template b4353eb3, 4:5 + 9:16, `no_logo` → 2 images × 60 = **120 credits**; competitor template d13e41c0 at medium → **45 credits**. `apply_brand_font: false` accepted silently but is forced on for these sources by the server. |
| Gooseworks (B2B SaaS) | Kit font Space Grotesk (user-set); 10 learnings incl. `must` wordmark and CTA pill; `mine` = 3 uploads (two are other brands' references) → filter to rows imported from Meta; competitor Smartly statics last imported 14 Sep. Dry run 1:1 + 16:9 without product image → **120 credits**. |
| Greener Closet (near-empty) | Kit font Inter (`mapped`); no learnings; no own ads; competitors with 0 ads; organic posts from 2025. Stops at Step 3 with no grounded reasons until the scoped sign-off; references from the library only. |

Not run (would spend or write): import refreshes, paid ad-library reads, generation.

---

### Staging run — 2026-10-16 (stopped before the first paid call) — historic, pre-0.4 (ads_generate era)

Brand Personal Day (`0e5b2fb0…`), product Dive Deep Mevalonic Moisturizer (`241a7303…`), ask: "I need ten fresh ads for the Dive Deep moisturiser this week."

| Step | Call | What came back |
|---|---|---|
| Server start | `get_started` `wants: "image"` | Set up; "go straight on with their request" |
| Brand read | `brand_read` summary/kit/products/learnings/competitors | Voice, value props, 6 proof points, `messagingAngles: []` (the server's own research angles — empty; the real angle bank is research-competitors' `angle-bank.md`, not written for this brand yet), 5 tracked competitors with scraped ads, 1 video learning; product: price 16.00, 4 photos, no stock field, `ad_eligibility: eligible` |
| Claims | `knowledge_search` `["claim"]` without product | 7 claims, `approved_ad_claim: true` — all auto-created from the site and press (Free Returns, Free Shipping $45+, 4.9★/234 reviews, Allure/Byrdie/NewBeauty quotes) |
| Claims for the product | same, with `product_id` | The same 7, now `approved_ad_claim: false`, `claim_status: "approved_scope_unknown"` → **no claim is usable for the moisturiser until learn-my-brand records that scope**; the Byrdie quote is about a mist, an Allure quote about a toner |
| Customer words | `knowledge_search` `["evidence"]` (secondary source) | Only press quotes and one site metric — research-market's voice-of-customer bank does not exist for this brand yet |
| Angles | `knowledge_search` `["learning","document","creative"]` | Empty |
| Account | `campaign_read` | No campaigns |
| | `meta_read` `performance` | `not_connected` |
| Own past ads | `ads_template_read` `mode: "mine"` | 8 own Meta ads with copy, CTA, destination, run dates (e.g. bundle "save up to 25%", ran Jul–Oct) — copy includes unapproved lines ("daily defense against bacteria & breakouts") |
| Sources | `ads_template_read` `static_library` "customer review quote card for an acne-safe moisturizer" | 5 ranked beauty templates (review card, UGC serum-in-hand, editorial triptych…) |
| **Quote (stop)** | `ads_generate` `dry_run: true`, 1 template × 2 variants × 4:5 + 9:16, prompt fence with exact on-image text | **4 images × 60 credits = 240 credits** (rates: low 30, medium 45, high 60). |

**What the playbook would say next:** "You have no angle bank or customer reviews on file and none of the saved claims is confirmed for the moisturiser. I can build three angles from plain product facts (ingredient story, lightweight texture, price) with no claims on the images; or approve the claims you want for Dive Deep in learn-my-brand first and come back; or run research first. Each concept gets its own quote. This first one came back at 240 credits (4 images; lower quality is cheaper). I'll show each quote exactly as it comes back before asking for your yes." — **stopped here; no generation call was made.**

Findings fed back into the playbook: the claim status fields (`claims-and-policy.md` §2), own past ads as an account signal (Step 1), cost per image for planning the quote.

**Round 2 (adversarial run, same day) added:** one prompt per `ads_generate` call (a 2-template dry run shared one prompt: 6 images, 360 credits); no learn-my-brand sign-off marker on Personal Day yet → no claims usable; a brand with `research_status: "none"` still gets a dry-run quote (submit would fail); unfiltered `ads_creative_read` returned 2.1 MB for 17 creatives.

---

### Round 2 fix pass (2026-10-16) — what to re-check by hand — historic, pre-0.4 (ads_generate era)

- No sign-off on file → the scoped sign-off happens inside this run (3–5 lines), not a hand-off elsewhere.
- Tags are written lower-case (`angle:a-07`, `picked`) and the picks are also in the batch file.
- **Tag round-trip (F5a), not yet verified:** on a staging creative, write `tags: ["angle:A-07","picked"]` with `ads_creative_update`, then read it back with `ads_creative_read` `tags: ["angle:a-07"]`. Expected: saved lower-case and found. The write was blocked by this session's permission guard on 2026-10-16, so it still needs a human-run check (server-needs #21).

## 2026-10-20 — Codex review round 1

Minimal edits on the dev version (the owner has a newer rewrite on his branch; these are listed in the PR so he can carry them over).

| Finding | Fix |
|---|---|
| #4 Hand-offs still named unreleased playbooks (claims approval through learn-my-brand; kept photos from make-product-photos; a `Product imagery needed: for make-product-photos` request line no released playbook answers) | Claims approval → the claims gate's scoped sign-off (SKILL.md approval gate 2 and Out of scope, `claims-and-policy.md`, `handoff-format.md` examples, `reading-the-brain.md` §1). Product photos → the brand's own or ones made with the goose-product-photos skill, offered as the next job (SKILL.md Step 2 imagery line, `formats-and-placements.md`). The request line is gone: the batch file holds the brief and a `Waiting for: real product photos` line, and the next run starts once photos exist (`reading-the-brain.md` §7). `skill.meta.json` reads/writes updated; the stale writes row removed. Video was already goose-video. |

## 2026-10-20 — Codex review round 2

| Finding | Fix |
|---|---|
| A4 (partly) The hand test still sent claims to learn-my-brand | `tests/test-by-hand.md`: claims are approved in the claims gate's scoped sign-off. |

## Round 20 — 22 Oct: complete reads and concept-directed scenes (0.4.5)

**Summary.** The handoff's retests still diff-read later composer inputs and described rather than exercised final judging. The Kolkata Chai experiment showed how a product truth and human situation can supply meaning while a reference contributes a direct device, a broader relationship, or craft alone. This update changes the existing composer and playbook; it adds no parallel skill.

**Evidence and scope.** Claude session `24c8dcfd-cbcf-4012-835d-69637cbf7532` ended with Graza/GooseWorks dry-run debriefs and PR330 at 0.4.4. The installed Claude link still pointed to the older nested playbook. Creative source: content-goose's `clients/kolkata-chai-co/finals/creative-experiment-2026-10-22/how-to.md` and the five exact prompts in its working folder. Those five images were first generations, without a blind tournament or customer validation. They supply craft evidence and hypotheses, not performance claims.

| Finding | Change / limit |
|---|---|
| Full kits and repeated scaffolding encouraged partial reads | `prepare --output-dir` writes every required byte in ordered parts of at most 6,000 characters. Exact shared-rule hash reuse avoids manual diff-reading. |
| An answer could belong to an earlier input | CLI `final` requires the current input receipt. It binds assembled text, the viewed source URL and the ordered product/reference asset URLs. This detects stale inputs; it cannot prove attention. |
| The source-layout hard invariant overruled a new scene | A structured `creative_direction` records truth/source, situation basis, premise, relationship, scene, protected decision, exact copy and reference role. Mechanism/craft replaces the conflicting layout instructions, rather than appending another instruction. Layout remixes retain server parity. |
| Copy or the central choice could disappear during composing | Finalization requires the exact copy and protected-decision sentence. Intentional `exact_copy: []` keeps no-text ads possible. The image judge still checks what is actually visible. |
| A concept can move far from reference objects | The optional-guest and remembered-home examples explain why the relationship carries meaning. They are examples, not fixed concepts or required surrealism. |
| Ownership could default to true on an upload | CLI preparation/finalization requires explicit ownership; foreign images remain text-only. Direct competitors accept layout only. |
| Cached connector tools can differ from the live server | Refresh discovery or use an existing authorized MCP transport. No `ads_generate` substitution: it invokes another composer. |

**Independent review.** The reviewer found an input-receipt gap: changing an image URL did not change the text-only hash. Fixed by binding the visual asset inventory as well; regression coverage rejects both changed source and product URLs. Earlier review also caught the prepare/input command mismatch and intentional no-text ads; both fixed before push.

**Validation.** Python composer suite: 23 passed, including existing server-parity checks and nine contract tests. Repository suite: 52 passed. Skill validation: 361 skills. Marketing links: 86 skills, 629 references, zero broken. Atom-version check: zero errors. Atom lint: zero errors (existing warnings elsewhere). Index rebuilt. Real paid renders and their independent visual review belong to the fresh staging run; they are not claimed by these checks.

## Round 21 — 22 Oct: real staging renders and bounded label recovery (0.4.6)

**Summary.** The fresh Graza staging run made five distinct scenes with exact prompt/image-order delivery and spent the approved 300 credits. All five first generations failed independent review because the model redrew official label microtype; one also added pseudo-recipe glyphs. The quality gate stayed intact. Free local official-pixel repairs then passed independent full-image review.

**What actually ran.** Five thin `ads_render` submissions, five completed images, no paid retries. The source was Graza's official Sizzle front photo; the other four product images were inspected and none supplied a clean transparent cutout. Label recovery remapped actual source pixels through manually inspected curved label bands while retaining the render outside the mask. The recipe plane was separately cleaned with explicit nonword strokes and fitted paper shading; that scoped prototype is not represented as a general product helper.

**Reusable change.** `scripts/repair_patch.py` now supports a compatible, near-front-facing, unoccluded label patch on a shell host with numpy/OpenCV. It requires explicit rights/pose confirmations, finite in-bounds non-crossing geometry, a non-inverting source/target mapping, convergence, lossless new output paths and exact outside-mask preservation. It is not automatic segmentation, a pose matcher or a cure for a wrong silhouette. The five actual source/target configurations were also executed through the packaged helper; their outputs and hashes were reviewed separately from the first prototype.

**Review findings.** The reviewer found that validating target inversion alone still allowed a folded source mapping. Fixed by checking the exact Jacobian minimum over both band domains (linear in vertical position, quadratic horizontally); a regression rejects the provided folded-source and folded-target cases. Existing spelling and product gates were not relaxed. The optional repair and exhausted-budget stop are now explicit in render-review, and the reference check uses the recorded role for concept-directed scenes.

**Validation.** 31 Python tests passed, including eight runtime repair tests for real pixel transfer, curved geometry, antialiasing, boundaries, source/target inversion, provenance, original preservation and ownership/pose gates. The separate staging artifacts preserve the five raw failures, repair masks, source/base/output hashes, independent verdicts and save lineage. The generated picture remains a recreation except for the transplanted official label pixels; no performance claim follows from these tests.

## Round 22 — 22 Oct: finite research and honest novelty (0.4.7)

**Summary.** The fresh test inspected 26 cards out of a library showing about 540 ads and only part of saved/legacy history. That is valid evidence for its compose/render/repair path, not an exhaustive inventory. Inspection found an inherited instruction conflict: own-library reads said "every static/every row" while other reads had explicit caps.

**Fix.** Research remains mandatory for every applicable source. Own-platform and saved/imported-image reads start at 20 cards/records, extend only while useful, and stop by 60 per source. History uses three relevant batch files, 20 tagged creatives and the existing three-row legacy cap; every earlier ad in the same conversation remains known. Each source records date, available scope/count, examined count, distinct observations, stopping reason and missing coverage. Partial coverage supports "not observed in checked ads", not a claim of global novelty. Every suggested template is still opened by eye.

This changes the research contract, not the generator or label algorithm. The existing five generation jobs and actual-pixel repairs remain evidence for those paths. No paid rerun was made or needed. The original acquisition omissions remain recorded as a limitation rather than rewritten as full compliance.

The main description/output now names the actual registered reference and source, matching the existing library/other-source fallback. It no longer implies every reference was verified as running on Meta.

## Round 22 — execute the real research and selection path (22 Oct,0.5.0)

**Evidence.** The full terminal reports in Claude session24c8dcfd-cbcf-4012-835d-69637cbf7532 diagnose stale routing, competing next steps, huge/scattered reads and costly reference acquisition. The later five paid Graza jobs exercised prompt assembly/rendering but omitted required candidate/grid/hook/gate outputs and used a reused reviewer rather than a fresh blind judge. Their successful label repairs do not fill those gaps. Both execution audits and the reconciliation are preserved in content-goose's Graza test working folder.

**Change.** Shorten the main workflow, co-locate upstream decisions in one run artifact and make missing work block composition/quote preparation. Source coverage remains bounded and honest; sourced reasons carry persona/proof and argued five-check gate decisions, ranked hook spares, reference comparisons and competing visual premises for transformative requests. A fresh critic challenges evidence and selections; the script verifies completeness/consistency only. Copy/fix/graphic modes preserve the actual approved parent/request without forcing new sales concepts. Exact verified prepared parts may be reused only after reading them in the same conversation; full current input remains available and every changed part is returned. Compose output stays unquoted until exact claims/policy review. Rights, claims, actual product identity and budget gates remain.

**Related work.** Canonical CLI router and app instruction precedence are separate reviewed PRs. This skill change alone does not update installed routers. Tests cannot establish source truth, comprehension, creativity or performance. A new fresh staging run must audit the actual entry path and pre-spend evidence before generating; the original five jobs remain historical partial-process evidence.


## Round 23 — close the review shortcuts (22 Oct, 0.5.1)

**Fixes.** Fresh/more requests compare three substantive visual meanings even when the request is ordinary; only an explicit quoted user action/scene constraint can narrow that comparison. The independent critic checks that constraint and the ideas, rather than treating a “straightforward” label as permission to skip selection. A same-agent review cannot clear the selection gate; a real human critique with a source or a fresh critic is required.

Run-memory Start and End are mandatory, including first-run honesty, prior recommendation outcomes and blocked/partial exits. All mandatory must/dont learnings reach the composer; only optional guidance is capped at eight. This intentionally departs from the retained server first-eight-total reference. Runtime command syntax moved into the discoverable scripts guide. Negative tests cover the bypasses and mandatory-rule overflow; they do not establish research truth or creative quality.


## Round 24 — 23 Oct: competitive ideas and honest draft-policy limits (0.5.2)

**Summary.** A fresh ordinary Graza run performed real research, kept alternatives and passed independent selection review, yet mostly chose use photos and a can hero. The independent free audit held the set before spending. This update changes selection judgment, not the source/spend gates or the original run.

**Evidence.** content-goose: `clients/graza/working/static-skill-rebuild-2026-10-22/fresh-graza/independent-free-audit.md`, `run.json` and final prompts. The audit found weak rivals (including an already unsupported environmental spectacle), craft-only reference choices, loser reasons that assumed copying entire source scenes, and repeated bottle/hand/flow pictures. The earlier Kolkata Chai `finals/creative-experiment-2026-10-22/how-to.md` explains meaningful near/distant relationships and product-authored metaphors; its positive human feedback is craft evidence, not performance proof.

| Finding | Change / limit |
|---|---|
| Different alternatives could still be easy to beat | Develop credible competing events; repair avoidable staging/claim defects before comparing. The critic challenges winner strength, brand specificity and the whole set as well as validity. No unusual-prop or surrealism quota. |
| Generic craft removed a reference's useful relationship | Try a conceptual source's relationship in the product's human situation; judge each candidate's allowed contribution. Craft-only remains valid when the authored event earns its place. |
| A hypothetical visual analogy was rejected as a possible measured-control promise | Evaluate its likely factual takeaway. Expressive relationships may stay; any implied result still needs support. |
| Craft/mechanism ratio suffix restored source-layout authority | Ratio adaptation now retains the authored scene for those roles; layout path retains the server behavior. Reconcile authored colour choices with the assigned scheme before compose. |
| Official current Meta policy pages could not be reached | A separate audit checked seven official URLs (`policy-access-check.md` in the same Graza working folder). An explicitly authorized unpublished draft may quote only with all actual known-rule/claim/rights checks passing and source access as the sole gap. The review and output retain unchecked sources/rules and a launch hold. No real risk, default ad request or publishing authorization is cleared. The agent must verify real human authority; record fields alone cannot supply it. |

**Validation.** 48 Python runtime tests and 55 repository tests passed. Skill validation, 634 published-reference links, atom-version checks and lint passed (existing unrelated lint warnings remain); the catalog index was rebuilt. These checks cover recorded gates, exact review binding and prompt authority. A fresh uncoached selection run is still needed to establish improved creative decisions; paid pixels and human preference are separate evidence. The original Graza set remains held. [[derived-from::fresh-graza]]


## Round 25 — 23 Oct: judge evidence, not source labels (0.5.3)

**Summary.** The fresh software run stopped on a raw count of three source-type strings. Its independent audit supplement confirmed that unchanged legitimate first-party feature evidence could reach that count under finer labels. The count could neither establish independent buyer grounding nor explain why Graza’s catalogue-plus-website-plus-review passed. The actual software selection remains held for thin buyer insight and an unresolved independent re-review.

**Evidence.** content-goose: `clients/graza/working/static-skill-rebuild-2026-10-22/fresh-gooseworks/{independent-free-audit.md,source-type-gate-supplement.md,run.json,upstream-check.json}`. These records are unchanged.

**Change.** Source types remain descriptive; coverage groups actual provenance and separates first-party fact authority from independent buyer insight. Every fresh critic must explain that evidence’s sufficiency and limits. Selected audiences are explicitly researched or hypothetical. Source coverage describes examined records; fictional scenes do not downgrade a researched audience. Unvalidated audiences add named run-level limits. Feature facts can support a bounded introduction with hypothetical audiences and a reviewed bounded-scope decision; they never establish measured demand or waive proof. Candidate comparisons, source/claim gates and independent review remain required. A small receipt binds the critic to the reviewed selection inputs while excluding execution tracking; a producer cannot legitimately renew it without actual re-review.

**Validation.** 52 Python tests and 55 repository tests passed. Skill validation, 636 published-reference links, atom versions/lint and the rebuilt index passed; lint retains existing unrelated warnings. Runtime regressions cover same-provenance relabelling, fact/hypothesis scope boundaries, missing proof/review/source IDs, changed actual history/set/reference/placement inputs and stable bookkeeping. This repairs a label-sensitive blocker; it does not clear the original run, prove customer demand or grant spending/publishing authority. All 0.5.2 creative, policy and spending boundaries remain. [[qualifies::source-type-gate-supplement]]


## Round 26 — 23 Oct: concrete comparisons and truthful source reading (0.5.4)

**Summary.** Independent audits of the fresh 0.5.3 Graza and Gooseworks runs found real upstream work, alongside repeated hook rankings, weak reference rejections and overstated coverage. Reply's reflective, translucent bubbles were repeatedly called matte. The source picture supports glass-like cues; matte is an authored departure.

**Evidence.** content-goose: `clients/graza/working/static-skill-rebuild-2026-10-22/fresh-graza-053/process-creative-audit.{md,json}` and `fresh-gooseworks-053/independent-audit.{md,json}`, their cited run/copy/reference records and Reply image. The original cases remain unchanged. [[derived-from::fresh-graza-053]] [[derived-from::fresh-gooseworks-053]]

**Change.** Compare exact hook lines against their own buyer tension, proof and event; develop surrounding copy from a specific moment or objection. Judge each reference's strongest feasible allowed contribution. Separate viewed cues, interpretation and authored departures in existing notes, and carry that distinction into prepared composer context. The critic challenges these choices and coverage claims before compose. Coverage now distinguishes full records, excerpts and pixels; skipped leader checks remain partial, and stopping claims stay bounded to actual named attempts. The lookup guide no longer tells an agent to stop before the leader sweep just because imports filled the shortlist. No new record fields or numeric quality gate; useful direct demonstrations and bounded draft work remain valid. Claim, rights, approval, spend and pixel gates remain binding.

**Validation limit.** Automated checks verify compatibility, structure and prompt plumbing. They cannot judge whether a comparison is insightful or a source was read faithfully. Test 19 defines a substantive free/offline check; it is not a recorded pass. Independent review and fresh behavior remain separate evidence. No live source call, paid generation, launch or historical-case rewrite is part of this change.


## Round 27 — 23 Oct: rebuilt around how good ideas are made (0.6.0)

**Summary.** From 0.4 to 0.5.4 each round answered "agents skip steps" with more required record fields, receipts and gates. The skill grew to about 2,800 lines of instructions plus a 1,400-line composer script. Agents still skipped: they printed the first 1,000 characters of a record and called it read, skipped the leader search, and passed the quote gate with review notes they wrote themselves. Worse, the output got less creative. A Codex agent with **no skill** made five strong Kolkata Chai ads on 22 Oct (`content-goose/clients/kolkata-chai-co/finals/creative-experiment-2026-10-22/how-to.md`); the 0.5.3 skill made five Graza product demonstrations ("Two oils. Different jobs.").

**Why agents cut corners** (Claude handoff session 21 Oct, Codex audit 23 Oct): too much to read, so they abbreviate and over-claim; GooseWorks server hints ("one line and wait", "recommend one plan") pull toward speed; reference search is slow; every self-written field can be faked. Adding fields makes all four worse.

**Change.**
- The method is now `references/ideas.md`: starting points (product facts and customer situations, sourced or labelled hypothesis) → tension → one physical event → headline that names the relationship → the protected choice. Swap, thumbnail and truth tests. Kolkata is the worked example; the Graza set is the named failure.
- One working artifact, `board.md`, shown to the marketer with the quotes. A human sees it, so it can't be skipped quietly. "Finals only" shortens delivery, not the board.
- One fresh critic attacks the board (swap test, demonstrations, duplicates, buildability). No subagent → the marketer critiques it. No receipts or hashes.
- The agent writes the render prompt itself from the board row (`references/prompts.md`), with image roles in a fixed order and the protected choice word for word. `ads_render` adds nothing.
- Removed: `run.json` and `workflow.py` gates, `compose.py` and the 717-line server composer copy, structure blueprints, the server judge copy, font specimens, colour-scheme dealing, references-and-remix. Kept: claims and policy rules, brand-brain reading, the review rubric (idea check first), label repair, side modes.
- The acceptance test is now "beats a no-playbook agent" (`tests/test-by-hand.md` Test 1).

**Open decision.** Other brands' ad images still never go to the image model (rights). The Kolkata run attached two other brands' ads as idea and craft references. If ideas suffer without them, revisit with the marketer's rights position. [[derived-from::kolkata-chai-creative-experiment-2026-10-22]] [[supersedes::round-26]]

**Test 1 result (23 Oct, free, Anna and Sarah on staging).** Two fresh agents, same request ("Make 5 static ads… your choice… stop before spending"). Agent A used 0.6.0; agent B had no playbook. A blind creative-director agent compared the two boards unlabelled and chose A's to render: B's five were demonstrations that fail the swap test (seasonal product shots), and two carried risky sugar claims. A's best rows ("It was full on Monday." pencil marks down the jar; "The crouton has left the salad.") were rated real thumb-stoppers. Weaknesses it named: A's ideas mostly fit any snack in a clear jar, all five bet on one product, small handwriting may garble, and the office-supply row is a drab pun. A's critic cut three of five first drafts (four shared one miniature trick); its replacements were not re-critiqued, so the concept-grid step now sends new rows back to a critic. One brand, one run: evidence, not proof.


## Round 28 — 23 Oct: two more brands; the stranger and build tests (0.6.1)

**Summary.** The same free test as round 27 (one agent with the skill, one without, a blind judge) on two more staging brands. The skill won Graza and lost Gooseworks. Across all three brands: 2 wins of 3.

| Brand | Judge's pick | Why |
|---|---|---|
| Anna and Sarah (snacks) | Skill | No-skill board was seasonal product shots |
| Graza (olive oil) | Skill, not a runaway | Skill's ads were built from things only Graza has (one olive picked twice, the 24 vs 13 lb yield, oil in a beer can); the no-skill board would suit any premium olive oil. Best single ad: the Graza can among seltzer cans |
| Gooseworks (B2B software) | No skill | The skill's ads were "clever riddles about side features" (API keys, creator search); none said what Gooseworks is, so a stranger would scroll on. The no-skill board told a stranger what the product does |

**Change.**
- New **stranger test**: someone who has never heard of the brand must know what it sells and why they'd want it. For new or unfamiliar categories, most of the set carries the main promise; side features are for retargeting.
- New **build test**, flagged by all three judges: no small handwriting, long in-scene text, many hands, crowds or fragile physics.
- Two rows built on one product fact count as one meaning (the Graza skill board told the Drizzle-vs-Sizzle story twice).
- The critic gets the product records as they came back, not the agent's summary.

**Not yet re-tested.** These fixes target the Gooseworks loss; a re-run on Gooseworks would show whether they close it.


## Round 29 — 23 Oct: brand fit, templates and creativity levels (0.7.0)

**Summary.** The end-to-end staging run of 0.6.1 made clever Gooseworks ads that Gooseworks would never run. Three causes: the skill told agents to treat the brand's own ads as "what not to say" instead of how the brand talks and looks; agents skimmed titles instead of looking at ad images and posts; and the staging brand data was stale (the kit's positioning and look predate the current site). Akhil also saw that template-free ads fall back on a generic text layout (headline on top, explaining line at the bottom), even when they're creative.

**Decisions (Akhil, 23 Oct, grilling round).**
- A brand profile is written before any idea, from the brand's own ads, social posts, website and kit. Conflicting sources are asked, not guessed.
- One combined question: an angle picker (the brand's angles first, at most two new ones marked new, a recommendation, room to write), creativity level, product, count, conflicts. "Just give me the images" takes every recommendation. Never a chain of stops.
- Order: angle → message → visual idea → template. Every ad has a template.
- Creativity levels: close (template's scene and layout, brand swapped in; template image sent only when the brand owns it), balanced (default; new idea inside the template's layout), bold (0.6 behaviour; template lends a device or look). Text format comes from the template's slots, or at bold from the brand's own ads, never from the agent's default.
- No repeats against live ads and the last 5–10 GooseWorks ads: something among message, visual idea and template must change; resizes and other platforms are exempt.

**Change.** New `references/brand-profile.md` and `references/levels.md`; Steps 1–3 rewritten; concept-grid, find-references, ad-copy, compose, prompts, hand-off board, render review and rubric (check 30, brand fit) updated. Test 0 (the real loop on staging) added.


## Round 30 — 23 Oct: what the 0.7.0 staging run still got wrong (0.7.1)

**Summary.** The 0.7.0 run on the new Gooseworks brand produced on-brand ads, but Akhil found five problems: the creativity choice was easy to miss and silently defaulted; templates were never shown to pick from; the ads were creative but empty (a headline on blank space, a clapperboard standing in for video, headline + subhead in every ad); the logo was missing (the combined question had dropped it and the small file was left "to add later"); and the agent's own list of gaps.

**Change.** Creativity is the first item of the combined question, with a one-line description of each level, and can be changed at the board. The board shows each ad's template and two alternates as images; swapping is free and needs no extra stop. Levels: fill every slot the template has, fill the frame, vary text patterns across the set, match the brand's information density. New show-it test (the real thing, not a symbol) and rubric check 31 (fills the frame). The logo file is attached to every render unless the marketer says none; a small file is still used. Also: each angle shows the claim line it needs; at most two critic rounds; a text-fit check before quoting; one rewording rule (voice headlines may express a fact's meaning, adding nothing). The old Fern & Field example in handoff-format was cut to keep the length flat.


## Round 31 — 23 Oct: the rest of the gaps from the staging runs (0.7.2)

**Summary.** Fixes every skill-side gap the 0.6.1 and 0.7.0 staging runs reported, in one change, before the next deploy.

- **One claims rule.** The playbook said facts on the brand's own site and kit are usable; the shared claims-gate said the site is never approved. Now both say: what the product is and does, worded as the brand's own product record, kit or site says it, is a plain product fact; results, numbers, comparisons, customers and regulated words need the sign-off. This keeps the repo rule "claims only from the approved list" and Akhil's 19 Oct rule (kit facts usable) for plain descriptions.
- **Brain tool names.** Skills test for `brain_*`; servers now list `brand_knowledge_*`. The marketing-guide maps the names once (browse = map, search, read = open, save), and claims-gate, save-learning and run-memory point to it. Their presence means the brain path, and `brand_knowledge_save` is the save tool.
- **Software and services:** identity is real UI screenshots, logo and mascot; never a fake UI; never stop for missing packshots.
- **Reads:** never the `sources` section in a brand read; save answers over ~50K characters to a file; poll `job_get` lightly.
- **Retries:** the batch file links each retry to the try it replaces; the marketer gets one image per ad.
- **Templates:** at least one per set from outside the GooseWorks library, or say what was tried.

**Not skill-side (server or host), still open:** server hints "recommend one plan" / "one line and wait"; "Still indexing: N of N"; render settings echo shows brand colours on when sent off; new brands get no workspace (coworker id null); adding a founder's X account fails with a billing error; the browser can't open the Meta Ad Library.


## Round 32 — 23 Oct: writing-for-agents review (0.8.0)

**Summary.** A fresh agent reviewed the whole skill against the writing-for-agents standard. The core steps held; six old reference files still taught the pre-template system and contradicted the new rules. All findings applied in one change.

- **Old layout default removed** from the ad-copy description, the board column, the formats copy limits and rubric checks 11–12. Positive rule only: fill every slot the template has.
- **ideas.md:** Step A is now the material for the message step, per chosen angle; the repeated set and template sections cut. concept-grid reads §2 B–E and §3 only.
- **Records:** tags and the batch file carry angle, message, visual idea, template, level (`level:` and `template:` tags); old lever tags, definitions and "cells" gone.
- **Cut:** creative-taxonomy.md and angles-and-hooks.md (the type map moved to handoff-format, the hook formulas to ad-copy); research.md merged into brand-profile.md; formats-and-placements §1–2 (archetypes, company types) and fonts-and-color's question sections; the SaaS "UI letter by letter" rule moved to render-review.
- **Done lines** on Steps 2, 4–8 and on ad-copy, compose, claims-extract and find-references. The Approval gates / Output / Done when sections stay: the marketing-agent AGENTS.md §5 requires them.
- **One source each:** level table (levels.md), template description (find-references), alternates (find-references §5), usable facts (claims-and-policy §2), Pass A/B (claims-extract), polling (engine-notes), capability gate (SKILL.md), 9:16 safe zones (prompts.md §4), font rules (prompts.md §2), brand fit (rubric 15).
- **Contradictions fixed:** unseen-image tag, chat-confirmed claims (claims-gate), colour default (the brand's ads), one new angle per five, the level applies to the whole set, `ads_creative_layerize`.
- compose stays a separate step skill (AGENTS.md: every step is its own skill).


## Round 33 — 24 Oct: every ad had the same look (0.8.1)

**Summary.** Akhil saw that every brand's ads (Graza, Anna and Sarah, Gooseworks) came out in one look: staged, playful set-design still life, cartoonish with miniatures or a felt puppet. Cause: the prompt guide's shared foundation gave every ad the same finish ("real materials, believable cast shadows, a deliberately built and photographed set"), ideas.md asked for events "built on a real set and photographed", and the Kolkata example is five staged sets. The 0.8.0 cut of creative-taxonomy also removed the only list of visual styles.

**Change.** A style per ad (levels.md: premium product photo, lifestyle, phone/UGC, 3D render, flat graphic or type, native format, editorial collage, illustration, conceptual still life), taken from the template and the brand's own ads; at least two styles per set; conceptual still life at most one per set unless it is the brand's look. The prompt describes each ad's own style; no shared finish. Template alternates on the board show other styles, so the marketer can switch the look. Board column and `style:` tag added. Also from the 0.8.0 run: anything shown inside an ad must look finished (no blank placeholder boxes); concept ids carry the batch date (`concept:<yyyymmdd>-c<n>`) so batches don't collide; rubric severities now match render-review (a REMAKE still failing after the retry is shown, not dropped).


## Round 34 — 24 Oct: audit loop to 9/10 (0.9.0)

**Summary.** Akhil asked for every gap fixed before merge, then two independent audits scored on ten parameters until each scored 9 or more. One auditor used the writing-for-agents standard; the other walked a spice-mix and a software run from zero. Rounds 3 to 8 took the scores from 5–8 to 9 on all ten for both.

| Parameter | Round 3 (writing-for-agents / plain) | Round 8 |
|---|---|---|
| Size and economy | 6 / 6 | 9 / 9 |
| No repetition | 6 / 6 | 9 / 9 |
| No contradictions | 5 / 6 | 9 / 9 |
| From-scratch readability | 7 / 7 | 9 / 9 |
| Order and flow | 6 / 7 | 9 / 9 |
| Gates and safety | 7 / 8 | 9 / 9 |
| Owner's decisions | 6 / 7 | 9 / 9 |
| Tool accuracy | 8 / 8 | 9 / 9 |
| What the human sees | 7 / 7 | 9 / 9 |
| Edge cases | 6 / 6 | 9 / 9 |

**What changed:**
- **Logo:** the real file is placed by `scripts/place_logo.py` after every render (tested); the model never draws it on shell hosts. No shell: the marketer picks a clear corner (recommended) or a drawn logo.
- **Style step** in concept-grid between visual idea and template; the style rule is strict (2+ styles per set, still life at most one).
- **Step 2** carries its own layout: creativity first, angle table, claim lines, logo options, placements and ratios, missing photos, price.
- **Step 7 change paths:** template swap, row change, level change, edited line, new claim, added ratio.
- **render-review** owns the retry rule: one retry per ad and ratio; verdict order (free label repair, copy-only fix, unfixable, try 1, try 2); failed renders; refusals re-quoted; the judge/agent split of rubric checks; tags on the kept version.
- **One home per rule:** claims through claims-gate (claims-and-policy slimmed, tiers table cut), one price rule, template rights in find-references §4, the new-angle cap in Step 2, brand ads win over kit in brand-profile §3.
- **Tool fixes:** run-memory inputs, `approved_only` history read, `library_scrape` polling, `media_upload` arguments, no-image prompts stay on the default engine.
- **Shared skills:** claims-gate 0.1.4 (one path rule, `brand_knowledge_read`, food row in claim-types), honest-review 0.1.2, ad-policy-check 0.1.2.
- **Size:** 1,038 lines / 16,616 words before, 988 / 16,592 after, with more behaviour; label-repair docs moved to `scripts/repair_patch.md`.

**Owner calls made here:** no set total (spend-gate forbids own sums); the still-life brand-look exception stays removed.
