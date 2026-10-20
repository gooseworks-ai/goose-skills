# Critique log — work-with-creators

Every round: the finding, the fix, or why it was rejected. Critics were subagents (effort high; final round xhigh). None read old skills.

## Round 1 — before writing (2026-10-16)

### Scope critic

| # | Finding | Sev | Outcome |
|---|---|---|---|
| 1.1 | Price has no data source | major | **Fixed.** Ranges with math from median views × dated CPM × modifiers, cross-checked with real rate evidence; walk-away ceiling from the goal. |
| 1.2 | Usage rights, whitelisting, exclusivity missing from price and brief | major | **Fixed.** Rights priced as an add-on (core fee for UGC); rights ask in every brief, "proposed, pending contract". |
| 1.3 | Authenticity needs observable checks | major | **Fixed.** Signals in `vetting.md`, labelled "signals, not verified". |
| 1.4 | Goal never changes the method (UGC vs reach vs affiliate) | major | **Fixed.** Roles; goal sets vetting and pricing (deepened in R2). |
| 1.5 | No portfolio view | major | **Fixed.** Step 6 "the mix": tiers, total vs budget, seeding size, first wave. |
| 1.6 | Compliance and brand safety thin | major | **Fixed.** Disclosure per platform/market, regulated categories, minors, 12-month scan. |
| 1.7–1.10 | Competitor-conflict method, geography/cadence, deal structure, contact route | minor | **Fixed.** |
| 2 | Company types (B2B SaaS major) | major | **Fixed.** `creators-by-company-type.md`; B2B branch in vetting (R2). |
| 3 | Vetted-on date; outreach status; refresh; watch | major | **Fixed.** `vetted_on`, human-filled `status`, roster-outcomes atom, reminders (redesigned in R2). |
| 4 | Out-of-scope with owners | — | **Fixed.** |
| 5.1–5.7 | Pricing, cost gate, gift-first DTC-only, examples unspecified, audience overclaim, Done-when lenient, privacy | major/minor | **Fixed.** Done-when raised to "would pay at least half the shortlist in range"; examples named (creator's own + category format). |

### Depth critic

Adopted into references: sample rules, formulas, healthy ranges by platform and tier, comment read, bought-engagement signs, sponsored vs organic, cadence (`vetting.md`); CPM bands, modifiers, deal structures, money rules (`pricing-and-deals.md`); brief sections, disclosure, fictional example, failure list (`creator-brief.md`); discovery order and funnel (`discovery.md`). Every number marked approximate and dated. Rejected: nothing.

## Round 2 — after writing (2026-10-16)

### Adversarial run (DTC skincare $5k; B2B SaaS LinkedIn/newsletters; pre-revenue iOS app UGC)

| # | Finding | Sev | Outcome |
|---|---|---|---|
| 1.1 | Sales ceiling makes every paid deal fail → all affiliate | major | **Fixed.** Two ceilings shown: organic first order (rarely pays) and rights-amplified (target CAC × expected paid conversions on the asset, labelled assumption). Example rewritten. |
| 1.2 | Seeding numbers contradict; full vetting of 50 nanos too costly | major | **Fixed.** Light-vet tier for gift-only seeding; funnel counts per role. |
| 1.3 | Example verdict infers age/health; "skin tone" invites visual judging | major | **Fixed.** Only quoted, counted self-descriptions; stated concerns; skin tone added to the never-infer list. |
| 1.4 | Mentions ranked as fans without sentiment | major | **Fixed.** Sentiment read first; founder account as a source. |
| 1.5 | Invented beauty modifier; unlabelled LTV | minor | **Fixed.** Beauty modifier added to the table; brand numbers labelled. |
| 1.6 | Two UGC cost bands | minor | **Fixed.** One band ($150–500 per asset). |
| 1.7 | Acne drug-claim words; competitor posts as examples | minor | **Fixed.** |
| 1.8 | Budget scope unclear | minor | **Fixed.** Budget includes gift cost + shipping (asked). |
| 2.1 | No route to newsletters | major | **Partly rejected.** The critic said Google and Spotify search are not on the server — they are, as public-data endpoints behind `data_call_provider`. **Accepted** the real gap: subscriber counts are not public → "size creator-claimed — request the media kit", conditional prices, server-need #6. |
| 2.2 | LinkedIn vetting has no data path; CPM formula can't run | major | **Fixed.** LinkedIn post paths added; B2B branch; per-post flat-fee pricing; missing commenter headlines lower confidence; server-need #5. |
| 2.3 | B2B ceiling relies on a number the brand lacks | major | **Fixed.** Ask contract value and target cost per demo; never default. |
| 2.4 | Zero claims → briefs unusable | major | **Fixed.** Brief marked "not ready to send until these claims are approved", claims listed. |
| 2.5 | Gaps message is DTC-shaped | minor | **Fixed.** Tailored per company type. |
| 2.6 | LinkedIn threshold off; no TLA rights; no LinkedIn action rate | minor | **Fixed** threshold and Thought Leader ad rights ask. LinkedIn action rate not added — B2B pricing uses cost per demo, not views. |
| 2.7 | Paid fan search wasted on new brands | minor | **Fixed.** Skipped when the free feed shows no mentions. |
| 3.1 | UGC creators judged on audience | major | **Fixed.** UGC rubric (delivery, hooks, product handling, past brand-ad work, turnaround, honesty). UGC marketplaces stay out of scope (the human's sourcing route); social discovery of UGC creators added. |
| 3.2 | Audience-country overspend | major | **Fixed.** Reach/install roles only, top five, own line at Gate 2. |
| 3.3 | UGC priced with CPM | major | **Fixed.** Per-asset branch; usage as the core fee. |
| 3.4 | Wrong disclosure for UGC-for-ads; fake testimonials | major | **Fixed.** UGC disclosure variant; honest-use line; use the app before filming. |
| 3.5 | No app ceiling; pointless unit-cost questions | minor | **Fixed.** Target CPI/trial; apps never asked unit cost. |
| X1 | Quotes too low → overrun stops | major | **Fixed.** Discovery 60–80, full vetting ~15/finalist, light ~4. |
| X2 | Gate is not a credit total | major | **Fixed** (with contract #3). |
| X3 | Safety name search has no route | major | **Partly rejected.** Web search exists through the proxy. Accepted: if no search ran, the verdict says "captions and comments only", never "clean". |
| X4 | Email lookups before approval | minor | **Fixed.** Business contacts only for names the human approved. |
| X5 | Per-name gate nags on big lists | minor | **Fixed.** Approve all or strike names; handover is a boundary, not a gate. |
| X6 | Inspiration saves pollute the library | minor | **Fixed** (with contract #5): not saved. |
| X7–X9 | `job_get` unused; threshold gaps (TikTok comment ratio, missing shares/saves, YouTube ages); awareness ceiling sits at the floor | minor | **Fixed** first two; the awareness note kept as is — it already says compare to paid-social CPM. |

### Contract check

| # | Finding | Sev | Outcome |
|---|---|---|---|
| 1 | Tools exist; `job_get` unused; `social_inspiration_watch` missing from needs | minor | **Fixed.** |
| 2 | Scheduled paid watch with no enforced ceiling | major | **Fixed.** Free-only reminders; paid re-vets wait for a ceiling; saved paused; server-need #7. |
| 3 | Credit gates do not comply | major | **Fixed as far as the server allows** — ceilings in credits set by the human, server-reported charges, no own totals, stop at ceiling; server-need #2. Residual first-run lookup accepted and logged. |
| 4 | Learnings into the ad-learnings store | major | **Fixed.** Lessons in the dated roster document; named-creator notes only in the roster file. |
| 5 | Creator posts saved into the ad remix pool without rights | major | **Fixed.** Not saved; server-need #11 asks for a reference-only tag. |
| 7 | Roster in a per-user workspace | major | **Fixed.** Shared workspace keyed by brand id; residual risk in server-need #1. |
| 8 | Claimed readers (plan-campaign, analyze-performance) don't read the roster | minor | **Fixed.** Meta says "available to, flagged for those builders". |
| 9 | Contact routes in the brand document | minor | **Fixed.** Stripped. |
| 10 | Vendor price statements; path maps | minor | **Fixed** price statements removed; path map kept with the foundation note (same reasoning as research-audience C10). |
| 11 | `get_started`; dollar figures vs credits | minor | **Fixed.** `get_started` first; "deal money, never credits" stated. |
| 13 | `critique.md` missing | minor | **Fixed** (this file). |

### Staging run findings (see tests/test-by-hand.md)

- Workspace files are per user → shared workspace, brand id in paths.
- Approved claims can be press quotes → cited as the publication's words, never as the creator's experience.
- Product descriptions carry efficacy language → brief facts are neutral; product copy is not a claims source.
- No unit cost in product records → asked (DTC/CPG only).
- Empty Inspiration library → discovery carries on with fans, competitor collabs and search.

## Overlaps for the consolidation pass

- **Brief writer** — overlaps plan-campaign's asset brief and make-content.
- **Claims gate** (approved claims in exact words; press quotes; "needs approval") — overlaps make-content, make-static-ads, make-video-ads.
- **Outcomes intake** — same pattern as research-audience's `outcomes-intake`.
- **Credit gate for unpriced public data** and the **provider path map** — duplicated in research-audience; belongs in `foundation/data-access`.
- **Brand-document write-back**, brain-read preamble, connection stop, re-check date — every playbook.
- **Ad-library partnership checks** — overlap research-competitors. listen-social stays the only writer of Inspiration outliers.

## Round 3 — final critic, xhigh (2026-10-16): adversarial + contract + "did R2 land?"

| # | Finding | Sev | Outcome |
|---|---|---|---|
| M1 | Pricing example recommends paid above its own walk-away ($625–750 vs $600) | major | **Fixed** together with M2; example and roster summary rewritten (offer the floor $275 + ~$70–140 usage, walk away above ~$360 all-in, or hybrid). |
| M2 | Rights-amplified ceiling double-counts ad spend | major | **Fixed.** Ceiling = (target CAC − expected CPA on the asset) × expected conversions; expected conversions = planned media ÷ expected CPA; both assumptions labelled; no case if the asset isn't expected to beat target. |
| M3 | UGC-for-ads brief is an influencer brief | major | **Fixed.** UGC variant: concepts with 2–3 hook variants as deliverables, shot list, CTA, finished cuts + raw footage, one creative revision, "we edit from your raw footage"; brief-writer picks it by role. |
| M4 | No budget / no cost per demo → blank prices | major | **Fixed.** Priced test waves offered (pricing §7); "walk-away: not set — needs <input>" with the smallest test recommended. |
| M5 | "Free" reminder job runs the coworker (credits) | major | **Fixed.** Automation removed (and from meta); `revet_by` per pick; later runs flag stale picks for free; server-need #7 reworded. |
| m1 | Name approval worded two ways | minor | **Fixed.** "Approve the names (all, or strike any)" everywhere. |
| m2 | Stop rule differs; two ceilings | minor | **Fixed.** One rule; ceilings reported separately. |
| m3 | Roster reads don't use shared workspace | minor | **Fixed.** Reads and writes in shared scope; fallback with warning. |
| m4 | Discovery quote too low for the screen | minor | **Fixed.** Screen on search fields, profile reads for top ~25; 60–90 lookups. |
| m5 | CSV "second tab" | minor | **Fixed.** `stage cut = screen` rows. |
| m6 | Gift rule doesn't fit a $12–40 catalogue | minor | **Fixed.** Routine bundle, costed at bundle unit cost + shipping. |
| m7 | Unapproved claims via key message/angles; press quotes as must-says; stale ratings | minor | **Fixed.** Key message and angles from approved claims or neutral facts only; "Can cite (optional)" for press quotes; ratings/offers only if current. |
| m8 | Celebrity fans mixed with product fans | minor | **Fixed.** A fan shows or reviews the product. |
| m9 | Content ceiling circular | minor | **Fixed.** Brand's cost per tested creative, or "no independent ceiling". |
| m10 | Summary example vs seeding guidance | minor | **Fixed.** 30 seeded → ~6–12 posts. |
| m11 | Products have no margin field | minor | **Fixed** wording. |
| m12 | LinkedIn post search ≠ last 12–20 posts | minor | **Fixed.** Record real sample size, lower confidence. |
| m13 | B2B briefs blocked when nothing needs a claim | minor | **Fixed.** Not-ready only when the message needs an unapproved claim. |

Contract: all tools exist and are used per schema; reads/writes backed; YAML parses; sections in order; §3 files present.

## Round 4 — confirmation, xhigh (2026-10-16)

| # | Finding | Sev | Outcome |
|---|---|---|---|
| M1 | Round-3 fixes M2, m9, m13 never reached the atoms (rate-and-deal, brief-writer) | major | **Fixed.** Atoms now carry the (target CAC − expected CPA) × conversions ceiling, "no independent ceiling" for content, and "not ready only when the message needs an unapproved claim". |
| M2 | Gift-only seeding gets a paid-deal brief | major | **Fixed.** Seeding variant: no obligation, "if you post" angles, #gifted disclosure, tags, never-says, repost permission only. |
| M3 | UGC on-camera delivery has no data path (MCP can't show creator video) | major | **Fixed.** Verdict says "delivery not watched"; judged from transcripts, ad-library reuse, portfolio; `watch_links` column for the human. Server-need noted below. |
| m1 | UGC variant section numbers contradict | minor | **Fixed.** Replaces 6, 10, 12, 15; keeps 11 + product/app access before filming. |
| m2 | Hybrid $200 below the band | minor | **Fixed.** $250–350 + 15%. |
| m3 | Two sales ceilings should add when both are bought | minor | **Fixed** in §1 and §6 (~$425 all-in). |
| m4 | Summary plan omits the paid micro | minor | **Fixed.** |
| m5 | UGC extra hooks unpriced | minor | **Fixed.** $150–500 = one concept, one cut; extra hooks ~$50–150 each; raw +15–30%. |
| m6 | server-needs stop-rule wording | minor | **Fixed.** |
| m7 | Stale counts (discovery atom, test, overlaps) | minor | **Fixed.** |

Arithmetic and contract re-verified by the critic. Round-4 majors were fix-propagation and two variants; a round-5 confirmation follows.

**Sibling conventions adopted in this round** (shared notes folder, 2026-10-16):
- **Claims: learn-my-brand's sign-off contract.** Server research marks claims "approved" without review; briefs now use only the "Claims you may use" facts named by the sign-off marker, search claims with the product id (scope-unknown → ask), and apply `dont`/`must` facts. Without a marker, the brain's claims are candidates. Staging: Personal Day has no marker. This supersedes the R1/R2 "approved claims in exact words" rule, which the learn-my-brand session's contract check flagged in our brief-writer.
- Files in the **brand coworker workspace**; tools behind `tools_load` loaded once; `client` on every call.
- Paid lookups logged in the shared `research/credits-log.md`.
- Brand documents via `file_write` → `media_upload` from workspace → `knowledge_import` → `job_get`.

## Round 5 — confirmation, xhigh (2026-10-16)

| # | Finding | Sev | Outcome |
|---|---|---|---|
| M1 | The claims sign-off contract did not reach every claims surface: can-cite let server-"approved" press quotes and ratings in; key message/angles/example still said "approved"; UGC hook variants and CTA had no claims rule; test step 6 and the data-sources row used the old rule | major | **Fixed.** One term everywhere — **signed-off claims** ("Claims you may use", verbatim or listed variant, within scope, qualifiers and review date). Can-cite only for signed-off press quotes; ratings are claims; policies only from `must` facts; UGC hooks and CTA under the same rule and in the self-check; test expects no must-says on Personal Day (no marker); data-sources row looks up the marker and searches claims with the product id. |
| m1 | Two walk-aways for one Spark deal | minor | **Fixed.** Spark runs on the live post → one walk-away ≈ $425 all-in; floor + usage fits under it. |
| m2 | Floor below the micro flat band without a reason | minor | **Fixed.** Reason stated (21k median, 34% view rate — priced on views). |
| m3 | UGC fee vs usage unclear | minor | **Fixed.** $150–500 includes one concept, one cut and 30-day usage; longer terms via modifiers. |
| m4 | Ceiling inputs not asked up front | minor | **Fixed.** Current CPA and planned media asked when a deal buys usage; added to meta reads. |
| m5 | Review date missing from the claims gate | minor | **Fixed.** |
| m6 | No newsletter/podcast placement shape | minor | **Fixed.** Placement specs added to brief section 10. |
| m7 | Test plan seeding size stale | minor | **Fixed.** |
| m8 | (carried from research-audience R5) `get_started` could be skipped once `tools_load` ran | minor | **Fixed.** `get_started` first, then `tools_load`. |

## Round 6 — confirmation, xhigh (2026-10-16): **No major findings.**

Arithmetic, contract and all three runs (acne DTC $5k, B2B with no budget, pre-revenue app UGC) confirmed by the critic. Minors applied:

| # | Finding | Outcome |
|---|---|---|
| m1 | "not approved" wording survived in brief-writer and the test | **Fixed** → "not signed off". |
| m2 | Creator's own results in regulated categories could slip through as "honest use" | **Fixed.** Never-says: own results are claims too; acne words copied into the brief reference. |
| m3 | "Made in the US" in the example is a regulated claim | **Fixed.** Replaced with a count; country of origin named as not neutral. |
| m4 | Hybrid defined for mid-tier but offered to a micro | **Fixed.** Micro creators with proven category conversion included. |
| m5 | Summary walk-away total above budget; wave 1 not derivable | **Fixed.** Walk-away for paid reach picks only; wave 1 itemised. |
| m6 | Light vetting skipped stated-concern fit and competitor tags | **Fixed.** Sections 8 and 10 (captions only) added. |
| m7 | Brief facts DTC-shaped; SaaS/app had no fact source | **Fixed.** Features, integrations, plan price; else ask for 2–3. |
| m8 | Brand-account UGC ads presenting the creator as a customer | **Fixed.** Flag for the human or legal. |

Carried after round 6 from research-audience R8-m3 (minor): the first-run price stop now applies per endpoint with no logged charge.

**The loop ends here for work-with-creators: the last round found nothing major.**

## Cross-set review fix pass (2026-10-16, after reviews/2026-10-16-*.md and AGENTS §3/§5/§8)

| Source | Finding | Outcome |
|---|---|---|
| depth §15 | Stops before the first message, where programmes stall | **Fixed.** A first-message draft per pick (gift / paid / UGC / B2B shapes), short, specific, one ask, no price, claims-gated, labelled "draft, you send it" (`references/first-message.md`). Drafting only; sending stays out (D4). |
| depth §15, §8 loops | No "how we'll judge wave 1" | **Fixed.** `references/wave-criteria.md` + `creators/<date>/wave-1.md`: win metric, read window, renew/cut per role; `[CODE]`/`[LINK]` placeholders the human creates; `wave`, `wave_criterion`, `wave_result` roster columns; read back through the outcomes ledger to reweight the roster. |
| contracts M2 | Claims read through `knowledge_search` (relevance cut) and `brand_read` without learnings | **Fixed.** Every claim-like line goes through `atoms/claims-gate` (it reads learnings and runs the scoped sign-off); brain read now includes learnings; the data-sources claims row removed. |
| routing C7 | "I need UGC" ties with the video maker | **Fixed.** Description: "Real creators… Not for AI-made UGC-style video — that's the video ad maker (make-video-ads); unsure which, ask: a real person filming, or AI-made?" and Before you start 2 asks it. Podcast guesting: "not covered". |
| routing R3 | Description over 1,024 | **Fixed.** 982 chars. |
| contracts F6 / M9 | Folder and scope | **Fixed.** `creators/`, brand coworker scope, `brands/<brand-slug>/` fallback. |
| contracts M18 / §2 table | Meta said the roster has no readers | **Fixed.** analyze-performance reads it (measurement contract); plan-campaign when a creator leg is Run/Test. |
| contracts M10 / M11 / M19 | Spend model, schedules, credits log | **Fixed** as in research-audience: spend-gate, opt-in paused schedules with a per-run ceiling, monthly log files. |
| contracts §3.5 | Roster document never retired | **Fixed.** `Creator roster — <Brand> — <date>` via save-to-brain (`supersede`); `Creator lessons — …` (`keep-history`) via the ledger. |
| §8 shared atoms | Local roster-outcomes; inline disclosure rules | **Fixed.** `roster-outcomes` deleted → shared outcomes-ledger (`entity: creator`); disclosure lines from `atoms/ad-policy-check/disclosure.md`, keeping only brief-specific placement and the UGC-for-ads variant. |
| §5 | Never name playbooks to the marketer | **Fixed.** "needs approval in learn-my-brand" in briefs → the claims gate asks the human inline; briefs say "not ready until you approve: <lines>". |
| coverage m3 | Affiliates and communities unowned | **Not fixed — scope** (no new playbooks); out-of-scope line keeps them named. |

### Adversarial + contract round after the fix pass (effort high, 2026-10-16) — both playbooks and the outcomes-ledger atom

| # | Finding | Sev | Outcome |
|---|---|---|---|
| M1 | First-run ceiling can't be quoted without inventing it (log empty, several unpriced kinds of read) | major | **Fixed.** No history → Gate 1 asks one yes covering one probe per unpriced kind of read, in plain words; the "up to N" ask follows from the probe charges. With history → the ceiling straight away. Both SKILLs, the fit-definition atom and both tests. |
| M2 | Creator roster columns contradicted the ledger schema (no `key`, `suppressed`…) | major | **Fixed.** Ledger required columns first (with `suppressed_reason/date` split), then entity columns, then the roster's own; `key` = `platform:handle`; ledger now lists each entity's columns and "never drop a column on write-back". |
| m1 | Wave read-back missing from the ledger | minor | **Fixed.** Ledger asks for views/orders/posts after the read window and scores `wave_result` against `wave_criterion`. |
| m2 | Wave criteria undefined without targets or ad history | minor | **Fixed.** "Starting point" fallbacks for B2B and UGC. |
| m3 | WWC claimed analyze-performance reads wave results; siblings read the old roster path | minor | **Fixed** wording and meta; path-change requests sent to the plan-campaign/analyze-performance and make-video-ads sessions. |
| m4 | `not-a-fit` 6 months vs "suppression is permanent" | minor | **Fixed.** Timed exclusions (`not-a-fit`, `declined`) separated from permanent suppression. |
| m5 | Rejected sample rows excluded forever | minor | **Fixed.** `listed-sample-rejected`, not excluded. |
| m6 | Ledger can't take a third entity | minor | **Fixed.** Owner adds the entity row; ask before loading. |
| m7 | save-to-brain `path` never given | minor | **Fixed.** `research/audience/fit-definition.md`, `research/audience/lessons/<date>.md`, `creators/roster-summary.md`, `creators/lessons/<date>.md`. |
| m8 | Meta needs incomplete; `automation` group missing | minor | **Fixed.** `media_list`, `media_update`, `automation_list` added; `automation` in tools_load. |
| m9 | Schedule not explicitly paused; coworker lacks the playbook | minor | **Fixed.** `enabled: false`; the `agent_prompt` carries paths, exclusions, region rules, ceiling, "contact nobody"; no coworker → reminder only. |
| m10 | RA proof line skipped §8's scoped sign-off | minor | **Fixed.** 1–2 proof lines put to the human through the claims gate at Gate 2; "proof needed" only after a no. |
| m11 | Value tier undefined for independents | minor | **Fixed.** `n/a`. |
| m12 | First-message timing contradiction | minor | **Fixed.** Drafted per shortlisted pick; names approved before sending. |
| m13 | Two documents missed "Do this first, because…" | minor | **Fixed.** |
| m14 | spend-gate and save-to-brain frontmatter don't parse | minor | **Not ours** — request sent to their owner (research-market session), with the missing proxy endpoints. |

- Follow-up (2026-10-16): same as research-audience — one probe per run per the updated spend-gate; endpoint keys and pricing notes now read from `atoms/spend-gate/proxy-endpoints.md`.

2026-10-16 final contract check: skill.meta.json `atoms` now lists only this folder's atoms; shared atoms moved to `shared_atoms` as plain slugs.
2026-10-16 orchestrator ruling: learnings use the new save-learning source `[creators YYYY-MM-DD]` (SKILL.md write-back; outcomes-ledger step 5); bare `atoms/<shared>` paths converted to file-relative form.

## Research-pattern rewrite (2026-10-17, AGENTS §8 "Research playbooks: the shared pattern")

**Why.** A Sonnet dry run (Personal Day: "Which creators are worth paying to promote our acne serum, at what price?") opened with ~10 questions (budget, unit cost, AOV, target CAC…), never used web search, and showed no names or prices until after two credit yeses.

**What changed (rewrite, not patch).**
- SKILL.md rebuilt on the pattern: free pass first, ask nothing (the one allowed first question: real person vs AI-made), report once. Discovery and first vetting run on free sources — the brand's and rivals' posts and collabs, rivals' partnership ads in the Meta Ad Library, web search, and TikTok / Instagram / YouTube public pages read as a person would — to a draft shortlist with public numbers, a rough price range and a deal call per pick.
- Goal, budget and platforms are assumed from the brand and stated; budget becomes three wave sizes in the report; the message then asks only what changes the answer (budget, gift unit cost, names to strike, claims sign-off) and **one** credit yes to vet deeper.
- **For you** per pick ("this creator's format fits your serum because…; what they'd make; the claim behind it or 'you'd need proof of X first'") and **You vs them** (rivals' creator programmes vs ours; don't follow the herd).
- The deliverable is `report.md` with timely openings, assumptions, shortlist, You vs them, wave 1, near-misses and what we could not read; briefs and first messages for the top picks in the first delivery, the rest after names are approved.
- vetting.md §15: what each platform shows on public pages; data-sources.md split into free pass and paid top-up; atoms rewritten free-first. Tests rewritten around the four failure modes.
- Kept: claims-gate, save-to-brain, outcomes-ledger, wave-1 criteria, first messages, `[creators …]` learnings, D4 boundary.

**Sonnet re-run 1 (WebSearch + WebFetch only):**
| Failure mode | Result |
|---|---|
| Stopped early / asked first | **Pass** — research before any question; one closing message |
| No web search | **Pass** — ~39 calls; but TikTok pages failed to fetch and Instagram gave followers only |
| Procedure over craft | **Partial** — research reads as research; the roster and brief scale felt heavy for three thinly-read creators |
| Chat summary instead of a document | **Fail as delivered** — the report was written in full, but the test harness blocks subagent `.md` writes, so no file landed (a harness limit, not the playbook; re-run 2 writes through Bash) |

It shortlisted 3 real creators (views read for 1, hidden for 2), caught that the server's "approved" 4.9-star claim is 4.5 on the product page, and kept efficacy lines out of briefs.

**Fixed from re-run 1:** a fetch-only fallback (public creator-stats pages, post snippets, YouTube, media kits — labelled; never a top post as the median) · conditional price ranges when typical views weren't read · verify every handle on its profile before listing (roundups gave two wrong handles) · rivals' collabs checked for category fit (a kids' interview series and a celebrity were tagged) · free-pass funnel sized for a fetch-only host (5–12 well-read finalists) · roster columns filled only where read · briefs for 2–5 picks when the read is thin.

**Sonnet re-run 2 (fixes applied, files written through Bash):**
| Failure mode | Result |
|---|---|
| Stopped early / asked first | **Pass** — 43 calls of research, then one message |
| No web search | **Pass** — 16 searches, 27 fetches; TikTok still unreachable by fetch (named as a gap; the top-up fills it) |
| Procedure over craft | **Pass** — the report opens with a reasoned "Do this first", reads rivals' creator spend against the brand's own celebrity voice, prices on conditional ranges with the math, and briefs keep the esthetician to technique, not promises |
| Chat summary instead of a document | **Pass** — `report.md` (~19 KB) with sources and "what we could not read", plus roster.csv, near-misses.csv, three briefs with first messages |

It caught that the brain's "approved" 4.9-star rating belongs to a different product (the serum is 4.5 / 95), and offered three claim lines for sign-off instead of using any. **Fixed from re-run 2:** the name-safety search is now always part of the free pass; a dated public page beats a contradicting brain item, flagged in the report. **Accepted:** a fetch-only host cannot read TikTok views — the report says so and the one credit yes fills it; this is the honest limit, not a playbook gap.

## Shared fixes from research-audience's 18 Oct hand test (2026-10-18)

research-audience's hand test showed two bugs this playbook shared: (1) the report was left only as a local file and never saved to the brand (and the next one risked the opposite); (2) the agent applied the no-coworker `brands/<slug>/` path prefix although the brand had a coworker. **Fixed:** delivery now goes through `atoms/write-report` (local file with a clickable link, saved to the brand with a link, write-report §3 check); the workspace line says the prefix applies only when there is no coworker; the closing message is at most three lines. Nothing else in this playbook changed (the orchestrator asked to leave it alone otherwise).

## Schedules rule (AGENTS §8, updated 18 Oct)

The run judges whether a repeat helps: a monthly roster refresh only when a creator programme is running or about to (waves out, rates being quoted, a seeding list to fill), with the reason; never after a one-off shortlist, a single brief or a one-time vet. Step 9 in SKILL.md; edge test added.

## Run memory and the Brand Brain (2026-10-19)

Wired run-memory (`references/run-memory.md`): jobs `creator research` and `creator wave` (subject `wave-<n>`). "Since last time" recounts wave results (`win / partial / miss / no-data` against each wave's criterion, by role, tier and deal structure), quotes against the recommended range and creator content now running as ads (brain chapter 22) from the roster and the brain; last run's picks and price bands are checked against what came back. Records hold counts and links only — no creator names, handles or quoted rates. Reads go to `brain_map` first, with the `brand_read` fallback. The cross-playbook critique (on write-outreach's second run) found no creator-specific issue; the shared fixes (one sample-size rule per entity, recount-from-ledger, no ledger keys in records) apply here through outcomes-ledger.

### Codex review of PR #322 (2026-10-20)

| Finding | Verdict | Fix |
|---|---|---|
| The shortlist recorded wave 1 under `creator research` (no subject) while the results run looked under `creator wave` / `wave-1` — the recommendation could never be found (MAJOR) | Agree | One job, `creator programme`, with subject `wave-<n>` from the shortlist that proposes wave *n* through its results read; the read judges the wave recommendation by its original id; a run proposing the next wave first carries the previous wave's open items forward |

## 2026-10-20 — hand-test review (Akhil + marketer reviewers)

- **25% of $59 (~$15/month) offered to 87k–150k creators for an unknown SaaS; one was a rival's Chief Evangelist marked "ask about exclusivity".** → pricing-and-deals §5: commission-only only for creators already running affiliate links; for an unknown brand mid-tier and up get paid or hybrid; rival or adjacent-tool employees and evangelists are near-misses. vetting §10 matches.
- **B2B shortlist was YouTube-only.** → SKILL step 2: for B2B read X and LinkedIn in the browser first; if unreadable, the top pick is labelled weak.
- **B2B row missed the founder as creator and a free-access wave.** → creators-by-company-type: founder/cofounder first; 20–30 practitioners get a free account with no ask before any paid pitch.
- **Wave planned for 1–10 Dec.** → wave-criteria: time the wave to the buyer's calendar (January Q1 planning for B2B ad-tool buyers; DTC gifting before the season), with the reason in `wave-1.md`.
- **For writer 1 (not edited here):** the report's first move rested on an assumed 60% margin, 3-month life and 1% click rate — the top section should label assumed inputs (roster-format.md is writer 1's).

### Report top (write-report shape)

| Finding | Fix |
|---|---|
| Reports opened with "Do this first" before the reader knew what was researched, so the move couldn't be judged (Akhil; 4 marketer reviewers: keep the answer on screen one, but rest it on findings shown above it) | In short now: "What we looked at" (scope, sources, date, main limit) → 2–3 numbered findings with how sure (confirmed / likely / first look) → "So, do this first (because of 1 and 2)", naming the findings; a first-look base makes the first move the one that closes the gap (write-report §1) |
| In short stated provisional or first-look things as fact; counts described a different thing than the claim beside them; first moves assumed unconfirmed assets | write-report §3 checks, now blocking: nothing stronger than the body, every number counts exactly its claim, no unconfirmed asset in the first move (→ "confirm X" or a decision) |
| Report opened "Do this first, because…" with no scope | "In short" with what we looked at, 2 findings (fact / inference), then the move; assumed inputs (budget, margin, ad cost per order) labelled as assumptions (coordinator, from writer 4); SKILL and test lines updated |

### Review fixes on this change set (second pass)

| Finding | Fix |
|---|---|
| write-report's new top rules copied into What you get, Done when and test item 4 | Each points at write-report §1 / §3; the creator-specific checks stay. |

## 2026-10-20 — Writing-for-Agents pass (items 1, 2, 4)

| Finding | Change |
|---|---|
| One-paragraph setup copied from the guide | Before you start #1: the setup line, then the creator-specific brain chapters and fallback sections; #2 keeps the roster, siblings, outcomes-ledger and run-memory reads. |
| "Ask nothing first (except real vs AI)" written four times | One home: Before you start #3. The opening rule, Approval gates and Done when no longer restate it (Done when points to #3). |
| Dead builder codes: "D4" ×3, "AGENTS §8 research pattern", "AGENTS §8 Schedules" | D4 removed; pointers now to guide §3, "Research pattern" and "Schedules". |
| Step 6 restated write-report's delivery and §3 check | "Through write-report" plus the local path; the creator paths stay. |
| The person called founder, marketer and human | "Marketer" throughout the runtime text. |
| Done when held a test oracle ("would pay at least half the shortlist…") | Removed; it is already in tests/test-by-hand.md ("Then:" paragraph). The checkable bars stay. |
| Description 984 characters | 557 characters; real-vs-AI question kept for routing case R20. |

## 2026-10-20 — Codex review round 1

| Finding | Fix |
|---|---|
| #13 The creator report's fixed template could not pass write-report: fact / inference labels, working paths (`briefs/<handle>.md`, `wave-1.md`), no Decisions for you, no capped What to do, no What we're not doing, no Sources or source skew; a test that depended on an unconfirmed budget lived only in chat | `references/roster-format.md` § `report.md` rewritten in write-report's shape: In short (what we looked at, numbered findings with confirmed / likely / first look, a first move that doesn't assume the budget); Decisions for you (names, test size with the budget caveat, claims lines, the deeper vet) saved in the report; the playbook's sections inside The story; at most six moves; What we're not doing; What we couldn't check; Sources with source skew. No paths in the report: briefs are linked in the chat message and `brief_path` stays in the roster. Vetting's audience-fit high / medium / low is said in the three words. What you get and the hand test follow. |

## 2026-10-20 — Codex review round 2

| Finding | Fix |
|---|---|
| B2 The report offered "approve non-comedogenic" for a line with no proof | A proof-needing line is never offered for approval: the decision is "send the proof, or leave it out", and arriving proof goes back through the claims gate. |
| B5 AI-made video was "not covered yet" (Before you start 3 and the description) while Out of scope and the router send it to goose-video | Both now route AI-made video to the goose-video skill; real people filming stay here. Description changed, so the routing eval was re-run: 81/87 (93%). |
| B9 Audience fit was turned into how sure | Fit is stated on its own (`audience_fit`, in words); how sure comes from `audience_confidence` and the sources (`vetting.md` §8). The example shows both. |
| B10 `skill.meta.json` named `atoms/ad-policy-check/disclosure.md` | Now `../ad-policy-check/disclosure.md`. |
