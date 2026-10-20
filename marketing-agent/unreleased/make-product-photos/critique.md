# make-product-photos — critique log

## Round 1 — before writing (2026-10-16)

One subagent covering scope and depth (senior e-commerce creative director), effort high. Its verdict: the spec as written was close to "engine plus a polite wrapper" — a guide, not a playbook (AGENTS §2.10). The fixes below are what turn it into a playbook.

| # | Finding | Severity | Done |
|---|---|---|---|
| 1 | Spec's test can't run: `count` is 1/2/4/8; water bottle isn't apparel/beauty/cpg; no credit gate | major | Step 5 maps shots to legal calls, dry-runs every call, one total, one yes; Test 1 uses a core category, Test 2 keeps the bottle as the edge case |
| 2 | No honesty gate (condensation, extra parts, on-skin results, food styling, size lines) | major | `fit-and-honesty.md` §2; checked before prompts and as F12 first on outputs |
| 3 | Shot list should be slots from the surface, not styles | major | `shot-list-and-surfaces.md` §1–2; Step 4 |
| 4 | Audit the source photos first | major | `atoms/source-audit`; Step 2 |
| 5 | House-style card, written back | major | Step 3; `shot-list-and-surfaces.md` §3; saved as `template_hint` |
| 6 | Fidelity rubric independent of the server; `flagged` unhandled; can't-see path | major | `fidelity-rubric.md`; `atoms/fidelity-check`; Step 7 |
| 7 | Route by company type; SaaS triggers the phrase | major | Step 1; `fit-and-honesty.md` §1 |
| 8 | Recurring triggers (launch, colourway, seasonal, ad-engine brief, retire) | major | `shot-list-and-surfaces.md` §5 |
| 9 | Learning pollution from archive; agent pre-approving; attestation set by agent | major | Step 9 rules; server-needs #1; attestation only on the human's words |
| 10 | Test fixes; zero false passes; SaaS negative test | major | `tests/test-by-hand.md` |
| — | Variants: one call per `variant_id`, never "make it blue" | major | Step 4, shot-list-and-surfaces §4 |
| — | Surface rules: ad copy space, email crops, marketplace tripwire, feed metadata | major | shot-list-and-surfaces §2 |
| — | On-model: no real likeness, no size/fit lines, no children | major | fit-and-honesty §3 |
| — | Present against the page (grid test, page order) | minor | Step 8 |
| — | Calibrate the checker on a real photo | minor | fidelity-rubric §5 |
| — | Infographics and colourway line-ups out of scope | minor | Out of scope |

### Staging findings fed back (same day)
- `media_analyze` reads the real label text (incl. "51.4 ML") off a product photo — the source audit's ground truth and the size the record lacks → source-audit step 4.
- Dry-run: 60 credits per output, retries included → Step 5 quote.
- Product photo assets carry `rights_status: unverified` — noted; photos come from the brand's own catalogue.

### Overlap to note for consolidation
fidelity-check's product checks overlap make-static-ads' render-review (#3 right product) and make-video-ads' review-render (product fidelity).

## Round 2 — after writing (2026-10-16)

**Adversarial run** (Personal Day moisturiser; Braxley Bands on-model and "new colourway"; Gooseworks; a simulated render-only smart bottle), read-only plus free dry runs, and the **contract check**. Verdict: a playbook in intent, a guide in execution — the craft did not reach the engine. Fixes move the effort into reference curation, prompt construction, hero-first and a bounded human check.

| # | Finding | Severity | Done |
|---|---|---|---|
| A1 | Dry run validates nothing; controls may be dropped (`overridden_controls`, default ratio 1:1) | major | Shot rows written into `prompt`; known controls only; hero alone first, read back ratio/controls |
| A2 | Reference photos polluted (claim graphics, a mini, duplicates, a generated image) | major | source-audit classes; only product-only, this size/colour, deduplicated |
| A3 | Size ambiguity; OCR treated as truth; staging anecdote hard-coded | major | "Which size does this page sell?"; OCR a hint; anecdote removed |
| A4 | No-vision path collapses; style card would be invented | major | Two modes; no card without vision; marketer-picked anchor |
| A5 | Wrong output shape; unbounded polling | major | Real fields named; bounded polling; never resubmit; `workflow_error` handled |
| A6 | Write-backs pollute ground truth and brand rules | major | Provenance exclusion; archive reason only for durable "Don't …" rules |
| A7 | Honesty source (product copy) allows banned shots; sign-off ignored; airbrushed skin as taste | major | Physical facts only; results only from signed claims; skincare default; `misleading` |
| A8 | Pre-launch render-only stalls | major | Pre-launch path in Step 1 |
| A9 | Colourways are sibling products; host device trips F10; hands need attestation | major | Sibling-product rule via `listed_at`; host-device rule; attestation for any body part |
| C-M1 | Claims sign-off contract | major | fit-and-honesty §2 |
| C-M9 | Style card saved without intent (would sit pending / be refused) | major | `user_correction` with the marketer's confirmation |
| minors | Own math on quotes; quality lever; `get_started` never called; SaaS route; `notes`/`ai_creative_notes`; ratio generation-level; retries per call; anchor from another product; unmet "three studio shots" substitute; calibrate on product-only photos; honesty list duplicated (now one list, others point to it); rights unverified; `published_at`; `media_upload` for the missing photo; imagery briefs now written by make-static-ads | minor | All applied |

## Round 3 — final verification (2026-10-16, effort xhigh)

Re-run (Personal Day in both host types; Braxley on-model and new colourway; Gooseworks; pre-launch render; packaging change), contract and depth. Verdict: **4 major**; on AGENTS §2.10 "a playbook, not a guide". All four were about what the engine treats as the real product and getting images in / memory out.

| # | Finding | Done |
|---|---|---|
| M1 | Store-imported AI images pass as real (`hf_…`, `pomelli-image`; `brand_catalog` only means "from the store") | Generator filename patterns; duplicates take the most suspicious class; "made with an AI tool?" question; server-needs 6a |
| M2 | Anchor rule passed an approved generated hero as a reference (contradicting Hard rule 2) | References = real product-only photos only; generated hero is a prompt-described style anchor |
| M3 | No way to get a new real image in, especially in a chat host; `kind: "render"` is the video kind | Step 2 "getting a new real image in" (shell / chat / not-yet-imported / new packaging); `media_confirm` in needs |
| M4 | Style card and "Don't …" rules written but never read back | Step 1 reads learnings in full; Step 3 reuses a saved card ("still right?") and updates it by `id`; Step 4 applies saved rules |
| should-fix | Hero-first now includes the fidelity check; workspace scope for `ads/batches`; one "not checked by eye" label; make-static-ads named in the SaaS route; `media_analyze` states; renders captioned as renderings; apparel flat-lay / ghost-mannequin slot; section order | All applied |

## Round 4 — closing check (2026-10-16, effort xhigh)

Verdict: **1 major** (round-3 fixes all present and working on staging data: Blackout's renamed copy shares the `pomelli-image` revision; Strength/Retro carry `hf_` files).

| # | Finding | Done |
|---|---|---|
| M1 | `media_upload` `kind: "reference"` + `product_name` makes every new angle the product's hero in the brand kit | Angles uploaded as `kind: "image"` with angle tags and no `product_name`; the hero only on the human's say-so; server-needs 6b |
| minors | Retiring old photos = archive with no reason (Step 9); hero check in "cannot see" mode asks "carry on?"; earlier outputs detected by matching `photos_read` and kit generated URLs (server-needs #4 reworded); AI-tool question when no original filename; card prefix "Product photo house style:"; colourway found in Step 1 with tie handling; chat-host sibling anchor described in words; `file`/`workspace` before `bytes`; meta writes and tests updated | Applied |

## Round 5 — confirmation (2026-10-16, xhigh)

**No major findings.** Round-4 M1 consistent across SKILL.md Steps 1–2, server-needs 6b, meta and tests, and matches the live `media_upload` contract. Minor applied: tests now expect each quote as given with the sum labelled, not "one total".

## Cross-set review fix pass (2026-10-16, orchestrator round 2)

Inputs: `reviews/2026-10-16-{coverage,contracts,depth,routing}.md`, AGENTS.md §3/§5/§8 (new). Shared atoms now used instead of local copies: `claims-gate`, `save-learning`, `spend-gate`, `save-to-brain` (owners: learn-my-brand / research-market); `ad-policy-check` and `honest-review` (owner: this session, built from the three playbooks' policy checks and render reviews).

| Finding | Done |
|---|---|
| Depth: in hosts that can't see images the check shrinks to a generic checklist | Field-by-field compare of the output's and the reference's automatic reads (counts, label text, colour words, product and size, extra things in frame), each mismatch named; checklist aimed at what the reads can't settle (`references/fidelity-rubric.md` §4) |
| Routing U5 / contracts 3.8: "the sum labelled as your sum" | Quotes shown one by one exactly as given; credits charged reported per call |
| Contracts M7: imagery requests never answered | Answers `Product imagery ready: <links> · <date>` under the request |
| §8 learnings ≤ 300 characters | The house-style card moved from a `template_hint` fact to `brand/photo-style.md` + a brand document via `save-to-brain`; stated rules via `save-learning` with `[photos YYYY-MM-DD]` |
| Routing R4: `wants: "image"` can draw the static-ads card | Kept `wants: "image"` (there is no photos value); its answer settles setup and brand only — the router-level decision is the orchestrator's |
| §5 | Description 996 characters in `>-` with "Not for…"; atoms → `ATOM.md`; no playbook names to the marketer |

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

2026-10-16 final contract check: references/shot-list-and-surfaces.md: the ads-side imagery request read in the §8 format (`Product imagery needed: for make-product-photos · … · return to: ads/batches/<YYYY-MM-DD>-<slug>.md`), with the `Product imagery ready:` answer, matching make-static-ads and SKILL.md.
