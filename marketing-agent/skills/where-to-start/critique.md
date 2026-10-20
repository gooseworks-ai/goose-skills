# Critique log: where-to-start

Every round: the finding, the fix, or why it was rejected. Severity: **M** major, **m** minor.

## Round 1 — scope critic (before writing, effort high)

| # | Finding | Sev | Resolution |
|---|---|---|---|
| 1 | No constraint diagnosis; every answer forced to be a playbook. | M | Fixed. Step 3 names one binding constraint with its evidence; situation-lens.md §1 lists nine constraints with signs; it heads the output. |
| 2 | "Fix the basics first / not a playbook" missing as an outcome. | M | Fixed. situation-lens.md §5; output-shape.md allows a human first step plus at most one playbook; test case 3. |
| 3 | Off-map gaps must be named, not mis-routed. | M | Fixed. playbook-map.md gap table with backlog card names (write-my-positioning, plan-offers, audit-my-pages, optimize-listings, do-outreach, watch-and-alert) and no-playbook areas. |
| 4 | The five questions are never named. | M | Fixed. questions.md: the five, why each changes the answer, which brain fields answer them first. |
| 5 | Answers evaporate; breaks D5 and "stop asking me". | M | Fixed. situation-save atom: onboarding enums per brand (owner's words) + a dated situation note in `user_context.goals`. Partly limited: no per-brand home exists for goal/budget/date, so the note is per account; server-needs #1. |
| 6 | Stages time-based and too coarse; plateau missing; other axes. | M | Fixed. Four evidence-based stages incl. "stalled or leaking"; axes in situation-lens.md §8–9. |
| 7 | Map not annotated by company type. | M | Fixed as a lens table (heaviest work on and off the map per type), explicitly not a route (D2). Rejected: a "usual first move per type" column, because it reads as a rulebook and would override the constraint. |
| 8 | learn-my-brand need-gated, not automatic; rich brain → read-back; flag unvetted claims. | m | Fixed. Map entry, step 4, step 1 claim check for regulated categories. |
| 9 | Return visits. | m | Fixed. Step 1 return-visit mode with three cases. |
| 10 | Output additions (constraint, not-yet, bring, come-back trigger, hand-off). | m | Fixed. output-shape.md. |
| 11 | Boundaries to state. | m | Fixed. Out of scope + step 1 "no other data". |
| 12 | Test set too narrow. | m | Fixed. Seven cases in tests/test-by-hand.md. |
| 13 | Name the free reads. | m | Fixed. Step 1. |

## Round 2 — depth critic (before writing, effort high)

| # | Finding | Sev | Resolution |
|---|---|---|---|
| 1 | Stages too coarse; "stalled or leaking" is the commonest confused founder. | M | Fixed (as round 1 #6). |
| 2 | The map has holes where many constraints live; must be allowed to say "you do X first". | M | Fixed (round 1 #2–3). |
| 3 | Ad bias: the product sells ads. | M | Fixed. situation-lens.md §10; step 4 says it; test case 3. |
| 4 | Founder time and unfair advantages missing from questions. | M | Fixed. Questions 3 and 4. |
| 5 | Date awareness (BFCM 27–30 Nov 2026). | M | Fixed. situation-lens.md §7 compares against today's date; example (b); test case 2. |
| 6 | Target output shape with three worked examples. | M | Fixed. output-shape.md (three from the critic, lightly edited, plus an off-map services example). |
| 7 | Craft as framing, not rules (constraint, stage, one-or-two, leverage, basics, feasible inputs, date, company type). | M | Fixed. situation-lens.md, written as questions and defaults with overriding signs. |
| 8 | Question craft: read first, one message, options, "I don't know" as data, one follow-up. | M | Fixed. questions.md. |
| 9 | Seventeen failure modes. | M | Covered in SKILL.md steps, situation-lens.md and the test fail conditions. |
| 10 | Reviewer rubric. | M | Fixed. tests/test-by-hand.md scoring. |
| 11 | Base rates, cost of each recommendation, the order after this. | m | Base rates added with "roughly" (situation-lens.md). Cost: "Bring" carries founder time; credit appetite is in the map's entries for the paid makers. "Order after this": replaced by "come back when", to avoid a multi-step plan (plan-campaign's job). |

## Round 3 — adversarial run (after writing, effort high; Personal Day live read-only, a B2B SaaS, a pre-launch app, a return visit)

| # | Finding | Sev | Resolution |
|---|---|---|---|
| 1 | Lean read lacks `existingAds`. | M | Fixed. `ad_library_ad_count` from the brand list plus one `knowledge_search` across evidence, learnings, documents and creatives; server-needs #6. |
| 2 | `get_started` hijacks the flow. | M | Fixed. Skip the card here, or `wants: "more"` and one line; server-needs #5. |
| 3 | "Latest brand" picks the wrong brand. | M | Fixed. Name the assumed brand or ask; test case 8. |
| 4 | Questions miss "what changed?", repeat rate, partner/beta usage. | M | Fixed. Stage-matched fit proxy in question 2. |
| 5 | Compound questions hide ~11 asks. | M | Fixed. "At most five asks in total"; state what can be worked out (season). |
| 6 | learn-my-brand pick-vs-Bring contradiction. | M | Fixed. One rule in the map; step 4 points to it. |
| 7 | knowledge_search too narrow. | m | Fixed (as #1). |
| 8 | Example invents Shopify; model copies tools. | m | Fixed. Examples rewritten; "never name a tool, platform, number or asset they didn't". |
| 9 | "Blindness before spend" misfires. | m | Fixed. "Before *more* spend"; calendar can tip a tie. |
| 10 | Credit costs missing for research playbooks. | M | Fixed. "Costs" line on every map entry, checked in step 4. |
| 11 | Infeasible direct asks. | m | Fixed. Hand off but name the blocker in one line. |
| 12 | Empty placeholder brand. | m | Fixed. |
| 13 | Aggressive reply target. | m | Fixed (examples replaced). |
| 14 | Examples act as an answer key (a D2 rulebook by the back door). | M | Fixed. Examples now for company types and situations unlike the test cases (local clinics, a marketplace, a subscription with churn, a services firm); explicit "illustrations, not answers"; test cases rewritten so none matches an example. |
| 15 | plan-campaign input gate too loose for pre-fit companies. | m | Fixed. Its "must bring" adds a proven channel or an explicit test decision. |
| 16 | Situation note fragile (legacy per-agent, overwritten across brands). | M | Fixed within limits. One labelled block per brand in `context_md`, other lines untouched; scope stated in server-needs #1. |
| 17 | Claimed readers don't read it. | M | Fixed. Readers stated truthfully (next visit, learn-my-brand); the hand-off carries answers in the same session; server-needs #1. |
| 18 | Return-visit rules backfire. | M | Fixed. "Same advice is fine, same scope is not"; ask why only if not said; return output gets a first line on what changed. |
| 19 | Saved before the founder agrees. | m | Fixed. Save after agreement or the one adjustment (or "not agreed" if they leave). |
| 20 | Housekeeping: staging log, BFCM hard-coded, Q4 bands vs enum, missing test cases. | m | Fixed. Log present; Black Friday rule stated generally; guard kept with its reason; cases 8–10 added. |

## Round 4 — contract check (after writing, effort high)

| # | Finding | Sev | Resolution |
|---|---|---|---|
| 2 | Lean read can miss the Claims sign-off marker. | M | Fixed. `knowledge_search ["learning"]` "Claims sign-off". |
| 4 | Readers of the situation note overstated. | M | Fixed (round 3 #17). |
| 5 | Note's home fragile; use `context_md`. | m | Fixed (round 3 #16). |
| 14 | "No brand" can't happen. | m | Fixed (round 3 #12). |
| 15 | Q4 money bands vs `ad_spend` enum. | m | Fixed. Guard kept with its reason (question 4 asks what they can put in, not what they spend). |
| D2 | The parenthetical feasibility list read like a rule. | m | Fixed. Replaced by "check each pick's must-bring and cost line". |

## Round 5 — final-round critic (effort xhigh; four fresh founders run against the live map and sibling SKILL.md files)

Verdict: 2 major findings, 12 minor. Runs (a) Personal Day and (c) a solo consultant passed every MUST; (b) a dog-walking marketplace and (d) a pre-launch candle brand failed because of untrue map entries.

| # | Finding | Sev | Resolution |
|---|---|---|---|
| M1 | Map and example (b) promised research-audience output it does not produce (verified emails, private individuals, gig workers; stricter "must bring" than the sibling). | M | Fixed. Fits/Produces/Must bring rewritten from research-audience's own SKILL.md (businesses only, accounts-first, list sizes by type, no verifier); example (b) rewritten (referrals from current tutors off the map, research-audience only for tutoring businesses); new gap row for recruiting individual supply; marketplace lens row updated. |
| M2 | Map misstated research-market (persona even pre-launch) and plan-campaign (pre-fit gate) for pre-launch founders. | M | Fixed. research-market's cold-start behaviour stated (under ~30 own items: category language, no persona, interview kit), pre-launch fit only with a waitlist/beta; plan-campaign's gate rewritten: a pre-launch brand with a date is its launch mode, zero paid by default. |
| m1 | "Next playbook won't ask again" contradicts server-needs. | m | Fixed. |
| m2 | make-content doesn't write press releases. | m | Fixed. |
| m3 | analyze-performance's page check overstated. | m | Fixed. |
| m4 | improve-search-visibility costs misstated. | m | Fixed. |
| m5 | learn-my-brand time given three ways. | m | Fixed: 20–30 minutes everywhere, matching its SKILL.md. |
| m6 | "Distribution" label not among the constraints; no supply row. | m | Fixed. Supply row added; examples relabelled. |
| m7 | learn-my-brand as a pick for new accounts eats a slot. | m | Fixed. Under "Bring" unless brand facts are the constraint. |
| m8 | tools_load groups missed `brand`. | m | Fixed. |
| m9 | Onboarding patch intent unstated. | m | Fixed. |
| m10 | Staging log invented "Shopify" and research angles. | m | Fixed; log corrected to what staging returned. |
| m11 | Case-study inputs understated in example (d). | m | Fixed. |
| m12 | run-paid-campaigns must-bring missed the approved brief. | m | Fixed. |

## Round 6 — final re-check (effort xhigh; map checked entry by entry against all 16 sibling SKILL.md files and their references; three fresh founders: dog-walking marketplace, pre-launch candle brand, two-shop bakery)

**Verdict: no major findings.** Round 5's majors confirmed fixed; all three runs pass every MUST and the regret test; D2 and AGENTS §2 hold. Minors fixed:

| # | Finding | Resolution |
|---|---|---|
| 1 | learn-my-brand "Must bring" still said 15–30 minutes. | Fixed (20–30). |
| 2 | Lens said research-audience needs a firm fit definition. | Fixed (roughly who they sell to). |
| 3 | email-lifecycle "Fits" under-promised (waitlist, marketplace, local flows). | Fixed. |
| 4 | run-organic-social new-account and launch modes missing. | Fixed. |
| 5 | plan-campaign must-bring overstated (goal number, zero paid, fit gate). | Fixed; the fit line labelled as where-to-start's own view. |
| 6 | research-market demand read overstated (no search-interest tool). | Fixed. |
| 7 | improve-search-visibility must-bring wrong (it drafts the questions). | Fixed. |
| 8 | Local lens credited listen-social with review replies. | Fixed (improve-search-visibility drafts them; listen-social reads reviews only by paste). |
| 9–10 | make-product-photos declines food service/hospitality/real estate; not the listing image set. | Fixed. |
| 11 | make-static-ads must-bring (claims can be confirmed in chat; research must be complete). | Fixed. |
| 12 | Hand-off offer had no wording for a human-only first move. | Fixed. |
| 13 | Examples still near some test personas. | Wording softened; tests now require one held-out case invented on the day. |
| 14 | learn-my-brand put in front of fact-only picks in regulated categories. | Fixed: only for picks that state benefits, results, health, ingredient or allergen facts. |
| 15 | meta said 17 playbooks; `tools_load` existence. | Fixed to 16 others; `tools_load` confirmed on staging (in the base tool list, 2026-10-16). |

## Round 7 — cross-set review fix pass (orchestrator brief; reviews/2026-10-16-*.md; AGENTS §5, §8)

| Finding | Source | Resolution |
|---|---|---|
| Not allowed to look at the site, store or ads before asking | depth (WTS 4), cross-set #5 | Fixed. Step 1 "Look before asking": up to three of the brand's own public pages with the host's fetch or browser, plus the brand list's ad count; no competitors, no paid data; skipped (and said) when the host can't fetch. |
| Base rates thin (four bullets) | depth | Fixed. `references/base-rates.md`: rough ranges per company type (DTC, B2B SaaS, consumer app, two-sided marketplace, marketplace seller, local, services, creator) and how to use them in "worked if". |
| Per-brand facts in agent `user_context` (refused without an agent; LMB forbids it) | contracts M15, §2.5 | Fixed. `brand/situation.md` in the brand coworker scope, imported as `Situation — <Brand> — <date>` through `atoms/save-to-brain`; learn-my-brand reads that file. `user_context` dropped everywhere. |
| "sales are flat and I don't know why" beats analyze-performance for "why did sales drop" | routing C5 (MAJOR) | Fixed. Description says "sales are flat and I don't know where to start" and "Not for … reading why this week's numbers moved (use analyze-performance)"; Before-you-start hands that ask off. |
| get_started skipped | contracts M12, routing R4, AGENTS §8 | Fixed. First call `get_started`, `wants: "more"`, card in one line; server-needs #5 rewritten. |
| Playbook names said to the founder (hand-off "Want to start <playbook>?", examples, gap quotes) | AGENTS §5 | Fixed. "Say it as" plain names in every map entry; output shape and examples use them; gap-table quotes reworded. |
| Description over the new limit / not `>-` | AGENTS §5 | Fixed. `>-`, 898 chars. |
| Atom file named SKILL.md | AGENTS §5 | Fixed (`atoms/situation-save/ATOM.md`). |
| Amazon seller not a recognised type | coverage M1 | Fixed within scope: marketplace-seller row in the lens, the map's company-type table (with its off-map work named) and base rates. No new playbook. |

Rejected or left as is:
- **The playbook map should become foundation-router knowledge** (depth cross-set #6; contracts "static copy can drift"): the orchestrator's call; the map stays here until the router takes it. It was checked against all 16 sibling SKILL.md files in round 6.
- **Coverage gaps (offers, positioning, outreach, CRO, listings)**: no new playbooks or gap rows beyond what exists, per the brief (decision pending with Akhil).

## Round 8 — adversarial + contract critique of the round-7 fix pass (effort high; just-launched B2B SaaS and pre-revenue app runs)

| # | Finding | Sev | Resolution |
|---|---|---|---|
| 4 | Founder-facing "Bring" wording named learn-my-brand | M | Fixed: "first, about 20–30 minutes to sign off what you may claim and how you sound". |
| 5 | No brand: promised the answers would be kept, but nothing stored them | M | Fixed. Says plainly they can't be saved yet; if the brand is set up later in the same conversation, situation-save runs then. Test case 10 covers it. |
| 6 | Saved after the hand-off, so the next playbook read nothing | M | Fixed. Save first, then start the next step on a yes. |
| 7 | Trial → paid base rate was the freemium figure | M | Fixed. Opt-in trial ~15–25%, card-up-front ~40–60%, freemium ~2–5%, design partners → paying; plus owned audience → waitlist and waitlist → launch installs (minor 17). |
| m7 | needs.mcp incomplete | m | Fixed (file_write, media_upload, knowledge_import, job_get, media_list, media_update, brand_update). |
| m14 | Test case 1 failed a run for reading the site; "coworker notes" | m | Fixed: fails only beyond three own pages, competitors, ad libraries or paid data, or for naming a playbook or tool. |
| m16 | "Name the backlog card" could surface internal names | m | Fixed: use the "What to say" line only. |
| m18 | get_started repeats when chained | m | Fixed. |

## Round 9 — focused re-check (effort high)

No major findings for this playbook (round 8's four are confirmed fixed; saves before hand-off; plain names; base rates sane). Minor fixed: a gap-table line said "the playbooks will use it" to the founder → "everything I make for you will use it".

## Round 10 — eval 2026-10-19-v2 fix pass (lost to no skill: 5/10 must-pass vs 7/10)

**Evidence checked against the transcript** (`evals/results/2026-10-19-v2/where-to-start/with-skill/transcript.md`). Every failing verdict holds: the run asked one question (which brand), never asked a situation question, quoted a campaign plan an earlier eval had saved on the shared staging brand as "your plan", named "no approved claims" as the constraint, carried the plan's Meta legs forward, set "worked if: list pulled, Meta connected, claims signed off by Oct 23", and said "your context is saved" with no save made. An independent senior-marketer reviewer (§2b; had not seen this playbook) agreed and judged the run a little worse than scored: M5 should fail too (every fact it cited came from the saved plan, none from the founder), M10 and M6 are borderline ("off the map", feasibility by luck).

**What in our text caused it, and the fix:**

| Failing check | Cause in the playbook's own text | Fix |
|---|---|---|
| M3, M4, M9 (wrong constraint, ads endorsed, regret) | Step 1's search for "ads running, offers, results, what was tried" pulls saved plans, and nothing said they are other sessions' outputs. "Map what you found against the five questions" let the plan answer them. The step-1 claims-marker check and the map's learn-my-brand "Bring" line primed "no approved claims"; the lens had no rule that a setup step is not a constraint, and no "activation" row for the freemium leak | Step 1: earlier work is evidence, not the situation — name it with its date, ask whether it still stands, never call it "your plan", use its facts only as confirmations, treat it as a second opinion and say so if your read differs. Step 3 and lens §1: the constraint is about customers or the business; a missing setup step (claims, account connection, a list export) is never the constraint. Lens: new **Activation** row (sign-ups who never reach a first useful result; talk to those who paid then cancelled; add the missing event); re-reaching an existing list is not buying attention. Output shape: an unconfirmed saved plan is never the basis of the first move. |
| M2 gap / no situation learned (and M5, M6 by luck) | Step 2 "A rich brain may need none" and questions.md "a rich brain may need none or two" let a brain full of other jobs' documents replace the founder | Step 2 "Ask the founder (always, before any advice)": questions 2, 4, 5 (where it's stuck, what they can put in, goal and date) are always asked on a first visit; skip one only if said in this conversation or confirmed on an earlier visit; never recommend in the same message as the questions. Question 3 also asks what they were thinking of trying next, so their idea ("maybe run some ads?") gets an answer. |
| M7 (worked if) | output-shape said only "a concrete signal with a number and a timeframe" | An outcome the founder can see in their own numbers, with a number and a date; task completion is never a "worked if". Step 5 repeats it. |
| M8 (false save claim) | output-shape's hand-off template itself said "your answers are saved, so I won't ask again", inside the recommendation, before agreement; step 6's "save first" never fired after the founder's "makes sense" | The template no longer mentions saving; step 6: save as soon as they agree ("makes sense", "ok" count), and say "saved" only after the save returns. |
| S2 (next big date) | Lens §7 existed, but nothing made the read name the date | Step 3: name the next big date for the business and for its customers. |
| M10 risk | output-shape taught the label "Off the map, alongside (you)" | Label is "You, this week:"; internal labels and version numbers banned. |
| M1 detail (reviewer) | Brand pick offered five of the brands, leaving out the right one | Never offer a partial list; name the assumed brand or ask by name. |

**§2b verdicts on the eval's criteria** (reviewer-checked):
- **Accepted as right:** M1, M4, M7, M8, M10, S1, S3, S4 — fixed above.
- **M2 is too loose** (a cap with no floor; the skill passed it while learning nothing). We now require the founder-owned questions; suggest the rubric add "learns the goal, deadline and time/money, by asking or confirming".
- **M3 is too narrow as worded.** "Activation and retention, not traffic" is right here, but fit or first-value is an equally senior read; any constraint about why existing sign-ups don't convert should pass. Our lens covers both (Activation row says when it is fit).
- **M5 should require at least one fact the founder confirmed** — otherwise facts lifted from a saved document pass.
- **S2 bundles leverage and date, and frames the date wrongly for this business.** GooseWorks doesn't need a Black Friday sale; its buyers are making Black Friday ads now and go quiet from about Nov 20, and the founder's own end-of-November goal is the binding date. Our step 3 now asks for the date for the business and for its customers.
- **Missing from the rubric** (passed to the orchestrator): talk to those who paid then cancelled; who the 1,000 actually are; an activation event; a goal sanity check (20 of 1,000 ≈ 2%); hands-on onboarding for the first 20.
- **Contamination is an eval-harness issue too:** each arm should start from a clean brand (or the scenario should plant the saved plan on purpose and score how it is handled — test case 11 now does).

**Why the skill should now beat a plain model.** The baseline won on judgment and lost on grounding (it never looked at the brand: M1 and M2 failed). The skill already won on grounding; the defects were all in its own text — it let saved documents replace the founder and offered a template that claimed a save. With the founder-owned questions always asked, saved work demoted to evidence, setup steps barred from the constraint, an Activation row, outcome-based "worked if" and save-then-say, it keeps its grounding advantage (looks first, plain names, ≤5 asks, one screen, saves) and now has the same diagnosis path the baseline used, plus the calendar and leverage checks the baseline missed (S2, S3). Not verified by a re-run (no eval runs this round, by instruction).

## Overlaps to note for the consolidation pass
- The playbook map (references/playbook-map.md) is the same knowledge the foundation router needs. Candidate to move to foundation and share.
- situation-save writes the same business facts plan-campaign asks for; both should read one home once server-needs #1 ships.

2026-10-16 final contract check: references/playbook-map.md: the gaps table's "What to say" line no longer says "playbook" to the founder.
2026-10-16 final contract check: references/playbook-map.md: cost lines follow the spend gate (engine price shown first; public-data reads within a credit ceiling approved first), not "the total is shown first".
2026-10-16 final contract check: skill.meta.json `atoms` now lists only this folder's atoms; `save-to-brain` moved to `shared_atoms`.
2026-10-16 orchestrator ruling: a playbook may offer the next job but never starts another playbook (AGENTS §2 rule 9): step 6, step 3 and the hand-off line in references/output-shape.md now offer in plain words; references/playbook-map.md local row lists a review-request brief, not review-reply drafts; bare `atoms/<shared>` paths converted to file-relative form.

## 2026-10-20 — hand-test review (Akhil + marketer reviewers)

Scored worse than no skill in one eval (weak evidence; causes fixed).
- **Agent-written plans and setup flags read as facts; the skill pointed at process steps ("claims not signed off") instead of activation.** → SKILL step 1: flags, onboarding fields, learnings and "blockers" an agent wrote are proposals, checked against the founder's words; step 3: check fit, activation, retention and pricing before any marketing move. (Earlier work and the setup-step rule were already there; extended.)
- **Five numbered questions holding ~14 asks.** → questions.md: each numbered question is one ask; the fit proxy moved to the follow-up round; an explicit "fourteen asks is fourteen".
- **Saved the buyer/strategy before the founder agreed.** → SKILL step 6 and situation-save Rules: run only after they answered; buyer, audience or strategy lines only once agreed.
- **"Talk to N users" before asking for notes.** → Q3 asks for user or cancel-call notes to paste.
- **Product-scope calls given as advice; "price-churners aren't our audience" vs solo founders as best customers.** → SKILL step 5 and situation-lens: scope calls shown as the founders' decisions; questions.md follow-up: ask who the churners were before saving.
- **One founding engineer given social + cold email + creators at once.** → SKILL step 5 and situation-lens §4: sequence by hours, with the trigger for each next move.
- tests/test-by-hand.md case 12 covers all of the above.

### Review fixes on this change set (second pass)

| Finding | Fix |
|---|---|
| Step 1 treats agent-written learnings as proposals, but the lean brand read used here doesn't show who wrote a learning | Step 1: on that read, every plan, flag and learning not plainly in the founder's own words is something to confirm. |

## 2026-10-20 — Writing-for-Agents pass (items 1, 2, 4)

| Finding | Change |
|---|---|
| Brand pick said "name the one you assume … or ask", against guide §1 (ask by name, never default) | Setup now follows the guide; test case 8 expects "asks by name, never defaults" |
| Copied setup (connection line, get_started, tools_load, brand_read pick) and a brand_read-only brain read with no brain_* path | One "Setup first" line to guide §1–2, plus only what is unique here (`wants: "more"`, `ad_library_ad_count`, no partial brand lists, empty placeholder brands, no brand setup here); step 1 keeps the fallback brand_read sections and knowledge_search tags as one line |
| On the brain path, found items had no rule | Step 1: every found item, and every item waiting for a yes, is something to confirm; the "not in the marketer's own words → confirm" rule stays for the lean read |
| Builder ids at runtime: AGENTS §2 rule 9, D2 (twice), and the "Decision rulebooks — judgment stays with the model" out-of-scope no-op | Removed |
| Opening routing sentence repeated the description; the talk rule repeated guide §3 | Removed; kept the "Say it as" pointer |
| Output and write-back restated situation-save (no-brand case, later-in-conversation case) | One pointer line to the atom |
| Done when not checkable; "under about 250 words" here vs "about 200–250" in output-shape | Done when is now a checklist (≤ 5 asks, constraint with evidence, worked-if with number and date, ≤ 250 words, saved only after agreement or "not saved"); step 5, output-shape and test check 8 all say "at most 250 words" |
| "Founder" and "marketer" both named the user | "Marketer" in SKILL.md; "the founders' decision" kept as a role. References and the atom still say "founder" (later pass) |
| Description 898 characters, opened with a quote, listed deliverables | 562 characters: what it is first, one trigger per branch, "Not for" kept. Routing cases R15 and R28 still match |

## 2026-10-20 — Codex review round 2

| Finding | Fix |
|---|---|
| B5 The gaps table said video ads and product photos "aren't covered yet" while the router sends them to goose-video and goose-product-photos | The two rows and the company-type table route them there (with a no-GooseWorks line). |
| B10 `skill.meta.json` named `atoms/save-to-brain` | Now the save-to-brain skill reference. |
