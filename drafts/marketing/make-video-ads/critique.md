# make-video-ads — critique log

## Round 1 — before writing (2026-10-16)

Two subagents, effort high: a **scope** critic (senior video / UGC creative director) and a **depth** critic (senior DR video scriptwriter). Both also read the live staging descriptions of the video tools.

### Scope (25 findings)

| # | Finding | Severity | Done |
|---|---|---|---|
| 1 | One video is not a test; the norm is one angle × 3–5 hooks | major | After the final gate, offer a 2–3 hook test on the approved body (`video_batch` `more_like` `change: "hook"`). **Partly rejected:** a hook set is *not* the default up front — videos cost 200–3,600 credits each and the server itself advises reviewing the first real take before batching; making the lead first, then hooks, protects the budget |
| 2 | Step order fights the engine (format before script) | major | Reordered: angle → format (reference / style) → script inside the plan → check → gate → make → review |
| 3 | Reference remix is the engine's default; rules missing | major | Step 4: reference first; borrow structure, never claims, offer, music, words or people; competitor ads never footage |
| 4 | Gates named wrong (style: one yes; custom: script + ingredients) | major | `paths-and-gates.md` §1; Step 7; `atoms/present-gate` |
| 5 | Self-review spends without a yes; agent can't watch video | major | Review via render transcript + scenes (`media_analyze`, verified on staging); honest "checked / only you can judge" note; fixes priced |
| 6 | No placement-version or cut-down tool | major | Each extra ratio/length a new priced video; server-needs #6 |
| 7 | AI actors, fake testimonials, likeness, disclosure | major | Speaker rule (`claims-policy-and-people.md` §3) |
| 8 | Regulated categories and personal-attribute hooks | major | §4; market asked up front; "Can't sleep?" test |
| 9 | Cost-awareness thin | major | `account_whoami` early; price bands from styles; 20% buffer is money-only |
| 10 | Captions/sound-off as a checked output | minor | Rubric #6, captions on by default |
| 11 | Music licensing, trending sounds | minor | §4 Music; launch note for in-platform sounds |
| 12 | Real footage vs generated | minor | Step 4 searches the brand's footage first; real product image for label shots |
| 13 | Format menu by message | minor | `angles-formats-and-company-types.md` §2 |
| 14 | SaaS/apps: screen product | major | §3; never generated UI |
| 15 | Local business | major | §3 |
| 16 | Marketplace retail-media video | minor | §3 — stated as not covered yet |
| 17 | Services: the expert is the product | minor | §3 |
| 18 | DTC offers and stock | minor | Step 2 (real offer only) |
| 19 | "More like this winner" mode | major | Modes; Step 3 iterate rule |
| 20 | Rotation and disapproval flows | major | Modes; Test 4 |
| 21 | Re-cut own footage / creator UGC | minor | §4 "From your own footage" (`media_excerpt`, `video_import`) |
| 22 | No write-back | major | `video_review` + `brand_update` facts (Step 10) |
| 23 | Hosted path is asynchronous | major | Before you start #4; Step 8 hand-off and end turn |
| 24 | Say what can't be done | minor | Review note |
| 25 | Trim/route; empty angle bank → labelled engine candidates | minor | Step 3 offers engine candidates labelled "untested — not from your research" |

### Depth

| Finding | Done |
|---|---|
| Two traces (idea; claim words), customer words carry pain not benefit | §1 |
| Pictures and supers make claims | §2; script-check over line + on_screen + picture |
| Speaker rule (FTC 16 CFR 465) | §3 |
| Three human moments on custom (script, ingredients, final) | paths-and-gates |
| Card rule vs gate content | Post trace before the card call; server-needs #4 |
| Re-dos vs pricing | Silent only when covered; two rounds |
| Honest review without eyes | review-rubric §2–4 |
| Hook test after the gate | Step 10 |
| Market/placement before writing | Step 2 |
| Write-back | Step 10 |
| `keep_claims` misuse | §5 |
| Excellent script + junior contrast + 4 hooks | `excellent-script-example.md` |
| Beat tables, wps, text density, safe zones | `script-craft.md` |
| `script_provenance: write-video-ad-script` alignment | server-needs #5 (consolidation) |

### Staging findings fed back (same day)
- `media_analyze` works on finished renders (transcript, shots, on-screen text) — the review path is real in chat hosts; a "Check: passed" render had a product/line mismatch the transcript exposed → review-rubric §2.
- "Creator product review" and several styles cast generated people as buyers or fake social proof → §3 "styles that put words in fake mouths"; server-needs #1.
- `may_claim` held other products' press quotes; product-page efficacy passes engine warnings → §1; server-needs #2.
- `candidates_too_similar` and the script judge → write-script step 8.
- The server asks agents to fetch its own script guide → Step 5 note; server-needs #5.

### Overlap to note for consolidation
script-check ≈ make-static-ads claims-check + policy-check; review-render's product-fidelity part ≈ make-product-photos fidelity-check.

## Round 2 — after writing (2026-10-16)

**Adversarial run** (Personal Day moisturiser as shell and chat host; Gooseworks LinkedIn; a pre-revenue app; "more like the day-in-the-life video"; "rejected for personal attributes"), read-only on staging, plus the **contract check**.

| # | Finding | Severity | Done |
|---|---|---|---|
| A1 | "Follow every next_step" contradicts several: the 20% buffer silently re-approves word changes; "don't mention other scripts"; "never pre-pick a style"; engine advice suggested a "Does your…?" hook; list reads return stale next_steps | major | Hard rules box with an explicit overrides list (#3, #6) |
| A2 | Gate can't be built in the stated order; "time" column invented for templates | major | Check candidates before saving; `use_candidate` to keep the checked lead; times only where the plan has them |
| A3 | Nothing to trace to; claims scoped too late | major | Labelled brand sources (kit audience, top organic posts, marketer's words); Step 2 batched claim-scope question |
| A4 | Product images carry unapproved claims ("97%…", "boosts collagen") | major | script-check reads text inside images and clips; clean packshots preferred |
| A5 | Speaker rule misses engine casting ("Maya" first-person usage); defined differently in three files; "more like" multiplies defects | major | One canonical speaker test (claims §3); applied to every style; review the source before batching; batch through script-check and the gate |
| A6 | Chat host: reference pick → custom → needs a shell; `coworker_enabled` unchecked; uploads > 8 MB impossible | major | Chat host = styles only; `coworker_enabled` checked; app-library upload path |
| A7 | Production footage search returns other brands' fixtures and unconsented real people | major | Footage check (brand, flags, rights, consent) |
| A8 | Length/ratio can't be met (templates 9:16, unstated length) | major | Fit line per style from the template details; say plainly what it will be |
| A9 | Review reports false defects (sampled frames, STT errors) | major | "Please confirm at <time>"; "not seen" vs "missing"; fixes only for confirmed defects; never "ready" |
| A10 | Custom script-phase yes already spends; gate drops required sentences | major | Question built from the answer's required sentences; says what the first yes spends; stop on `budget_exceeded` |
| A11 | Disapproval fix underspecified; first-person rewrite collides with the speaker test | major | Step 11 |
| A12 | Ignores the brand's best owned videos and a celebrity founder's rights | major | Owned-footage cut first (shell); consent covers name, story, endorsement, paid usage |
| C-M1–M4 | Sign-off contract, VoC bank, angle bank, performance read paths | major | `reading-the-brain.md` (video version) |
| C-M9 | `insight` learning per video refused / misattributed | major | Attribution in names and launch notes; learnings only with the human's words |
| C-M10 | No naming mechanism | major | Name format set on create / change / batch (paths-and-gates §6) |
| C-M11 | Launch notes (incl. AI-label obligation) only in chat | major | `ads/videos/<project_id>.md` |
| C-M12 | Inspiration library read missing | major | Step 1/4 via `reading-the-brain.md` §5; tools in needs |
| minors | `campaigns`/`social`/`files` groups; `catalog_fetch` in needs; candidate rule vs one angle; no-product styles for a physical product; balance check; failures in state note; competitor sanity; credit mismatch; Meta not connected; hosted return; over-asking; example rhythm vs brand learning; top-level `knowledge_intent`; distinct photo counts; keyframes | minor | All applied |

**Partly rejected:** A1's suggestion to list other candidates in one line — dropped in favour of the server's rule (mention only when asked); it costs nothing and avoids a fight with the card UI.

## Round 3 — final verification (2026-10-16, effort xhigh)

Re-run of all six scenarios (shell and chat host), contract and depth. Verdict: **4 major**; every tool matched; works in a chat host with no shell.

| # | Finding | Done |
|---|---|---|
| M1 | No launch copy; a text-caused rejection had nowhere to go (run-paid-campaigns hands it back to the makers) | Step 9 writes 2–3 script-checked launch-copy options into `ads/videos/<project_id>.md`; Step 11 rewrites text-caused rejections here |
| M2 | Text outside scenes (`answers.tagline`, offer, end card) unchecked — staging render shipped "acne-safe skincare" | script-check extracts `answers`, `extra`, end-card fields; write-script sets `answers` deliberately; gate shows end-card text; rubric #2; server-needs 10a |
| M3 | Script judge rewrites reach the gate unchecked | Diff shown words; re-check; resend checked lead; re-post trace; server-needs 10b |
| M4 | Speaker test inconsistent (rubric stricter), spoken lines only, label may not render in some styles | Rubric #4 points to §3; on-screen/caption first person covered; label must be confirmed renderable from the template, else narrator; Test 4 aligned; server-needs 10c |
| minors | Stale sign-off key; same-angle candidate fallback; `video_batch` has no per-video name (order fixed: batch → hooks → names via `video_change` → check → one gate → `quote_ids`); chat-host route in the overrides list; weekly read names make-video-ads; roster records proposed rights only; Step 11 reads `state.md`, re-reviews, covers outside videos; rotation `served`; "sent to learn-my-brand" now a list in the launch notes; `user_quote` only on custom; example's proof relabelled; app-library upload as a logged exception; owned footage must show this product; voice choice; LinkedIn takes 9:16; section order | All applied (the chat-approved claim path removed here too, as in make-static-ads M3) |

## Round 4 — closing check (2026-10-16, effort xhigh)

Verdict: **1 major** (round-3 fixes all present; 32/32 tools; walks in shell and chat hosts clean).

| # | Finding | Done |
|---|---|---|
| M1 | Hook variants stopped at approval — no make, review, keep/reject or launch-notes file per variant, so run-paid-campaigns could launch variants without the AI-label flag or checked copy | Step 10 now runs Steps 7–9 per batch video and writes one `ads/videos/<project_id>.md` per kept variant |
| minors | End-card text can't be fixed by `video_fix` (new draft route + server ask); disclosure bullet aligned with renderable labels; one line before the batch card; launch copy `description`; Step 11 copy fix reads the current copy and needs a yes; roster path; "catalogue fact the marketer confirms" → plain product fact; server "claim-grade" hints overridden by rule 1; judge swap keeps the committed angle and re-sets the name; custom approval fields; `patch.facts` | Applied |

## Round 5 — confirmation (2026-10-16, xhigh)

**No major findings.** Round-4 M1 consistent across SKILL.md Step 10, reading-the-brain §6, paths-and-gates §6, present-gate and meta; matches the live contract (`video_batch` `more_like` / `videos[].hook`, `video_approve` `quote_ids`, `video_make` `batch_id`, `video_review` per project). Minor applied: the hook-variant test now expects per-variant review and launch-notes files. Also applied from make-static-ads round 6: claims are verbatim or a listed variant only — no own paraphrase.

## Cross-set review fix pass (2026-10-16, orchestrator round 2)

Inputs: `reviews/2026-10-16-{coverage,contracts,depth,routing}.md`, AGENTS.md §3/§5/§8 (new). Shared atoms now used instead of local copies: `claims-gate`, `save-learning`, `spend-gate`, `save-to-brain` (owners: learn-my-brand / research-market); `ad-policy-check` and `honest-review` (owner: this session, built from the three playbooks' policy checks and render reviews).

| Finding | Done |
|---|---|
| Depth MAJOR: unsigned brand | Step 2 runs `claims-gate`'s scoped sign-off for the 3–5 lines the script needs; declined → facts only |
| Depth: one video is not a test | The gate offers two priced options — lead only, or lead + 2 hook variants (`video_batch` lines, `count: 3`, `change: "hook"`) — with both quotes exactly as given and a one-line trade-off |
| Routing C1: rejected video ad | This playbook owns the fix (Step 11 "Rejected video ad — fix it"); ads team only detects |
| Routing C7: "I need UGC" | Description: "a UGC-style video made with AI (no real creator)"; "Not for real creators filming for you — unsure? ask: AI-made or a real person" |
| Routing C15: organic phone-shot video | Description and Step 2: a produced ad, not a phone-shot organic post |
| Contracts M17 | Approved campaign briefs only (via shared conventions) |
| Contracts M18 | Meta wording updated |
| §5 / §8 | Description 1,013 characters in `>-`; atoms → `ATOM.md`; claims through `claims-gate`, policy through `ad-policy-check`, review through `honest-review`, spend through `spend-gate`, learnings through `save-learning`; "20%" buffer wording and other restated limits removed; no playbook names to the marketer ("the desktop or terminal app" line reworded) |

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
2026-10-16 orchestrator ruling: learning prefix split from make-static-ads: this playbook writes `[video YYYY-MM-DD]` (SKILL.md step 9, references/reading-the-brain.md), so neither maker can retire the other's rules.
