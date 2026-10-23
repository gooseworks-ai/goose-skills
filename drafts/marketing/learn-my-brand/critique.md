# Critique log: learn-my-brand

Every round: the finding, the fix, or why it was rejected. Severity: **M** major, **m** minor.

## Round 0 — contract survey (builder, before writing)

Read the staging MCP tool list (88 tools after loading every group) and a real staging brand (Personal Day, DTC acne skincare).
- Research writes 7 claims as `approved` with no human review; `valueProps` hold unreviewed efficacy and award claims. → Shaped the whole claims step (audit everything as candidates).
- No tool writes a claim's status, proof points, the operating plan, or an unknowns ledger. `brand_update` takes typed knowledge fields (≤ 2,000 chars) as `user_correction` (owner's words) or `agent_proposal` (pending in the app), and `facts` (must/do/dont/template_hint/insight). → brain-map.md, server-needs.md.
- `knowledge_import` turns an uploaded document into searchable brand knowledge. → The brand record document as the interim home for what has no typed field.

## Round 1 — scope critic (before writing, effort high)

| # | Finding | Sev | Resolution |
|---|---|---|---|
| 1 | The claims gate is fiction against today's brain: research already marks claims approved, siblings will use them. | M | Fixed. Step 4 audits every claim-shaped line (approvedClaims, proofPoints, valueProps, tagline, product text, ad hooks) as a candidate; sign-off marker fact; rejected claims as `dont` facts; value props rewritten; server-needs #1. |
| 2 | Walking all nine inputs is too heavy and breaks page 01's ten-facts rule. | M | Fixed. intake-craft.md settles only the brand-owned facts (what we sell + hero, who for, type/stage, claims, never-say, voice/logo/colours, approver, owner's positioning line, who we lose to); everything else is recorded unknown with the playbook that will ask. |
| 3 | The output promise doesn't match what can be written; pending proposals are invisible. | M | Fixed. brain-map.md is the explicit write contract; only owner-confirmed items are written (user_correction); proposals are named as waiting in the app; server-needs #6. |
| 4 | Claim model too thin (type, scope, expiry, disclaimer); offers are not claims. | M | Fixed in claims-craft.md (full record). Partly rejected: offers and policies stay in the claims list as type "offer, price, policy" because ads state them as facts and they expire; they are also written to the product's `offers` field. |
| 5 | Section 14 (rules we can't break) has no owner. | M | Fixed. Category detection in step 3, category-rules.md rule packs, never-say tagged law/platform/owner, "not legal advice". |
| 6 | Must state what it writes today vs what is missing. | M | Fixed: brain-map.md table + server-needs.md. Rejected: the interim unknowns ledger as `insight` facts. Learnings feed ad generation, so budget/margin gaps there would pollute creative prompts; the ledger lives in the brand record document instead. |
| 7 | No update or reactive mode. | M | Fixed. Four modes: full, update, one claim, sweep (opt-in monthly). |
| 8 | The approver may not be the user. | M | Fixed. "Pending client approval" state, forwardable sign-off sheet, marker says nothing beyond product facts is approved. |
| 9 | Public/internal/embargo tagging missing. | M | Fixed. Asked once in step 4; `dont` facts with dates; visibility tags in the brand record. |
| 10 | Company-type gaps (DTC policies/programmes, B2B permissions/certs/roadmap, app ratings, marketplace channel scope, locations, services rules, regulated, multi-market). | M | Fixed. intake-craft.md company-type add-ons; category-rules.md; locations flagged unsupported (server-needs #10). |
| 11 | Voice confirmation underspecified. | m | Fixed. voice-craft.md + voice-calibrate atom: real lines, triad test, keep-or-kill, terminology, locale, founder vs brand voice. |
| 12 | Documents should come in first. | m | Fixed. Step 2. |
| 13 | Contradiction precedence; confirm unconfirmed saved sources. | m | Fixed. Step 3 and intake-craft.md; step 2 confirms `self` sources. |
| 14 | Boundary trims: asset check to logo/colours/fonts; competitors one question; positioning only the owner's line; story deferred. | m | Fixed. |
| 15 | Replace the self-quiz with a read-back. | m | Partly accepted. Step 8 is a one-screen read-back plus three probes answered from a fresh read of the brain (proves the write-back landed, costs the founder nothing). The full ten-question test stays in tests/test-by-hand.md, as the spec's Done-when requires. |
| 16 | Done test too soft. | m | Fixed. Adversarial probes, regulated and B2B brands, ≤ 10 questions, auto-approved claims must be flagged. |
| 17 | Q5 can be answered. | m | Noted in the report: the residue is a real playbook (claims audit and gate, rules, voice rules, product truths, unknowns, update mode), not just two gates. |

## Round 2 — depth critic (before writing, effort high)

| # | Finding | Sev | Resolution |
|---|---|---|---|
| 1 | Treat every brain claim and value prop as a candidate; name the store for sign-off. | M | Fixed (as round 1 #1, #6). |
| 2 | Full claim record fields; taxonomy with substantiation per type; senior checks (puffery, implied claims, "up to", small samples, testimonials implying typicality, awards age, comparative tests, regional rules). | M | Fixed. claims-craft.md encodes all of it. |
| 3 | Never-say from three sources, each with a safe alternative. | M | Fixed. |
| 4 | Sign-off by risk tier; no rubber stamp; default product facts only. | M | Fixed. |
| 5 | Voice: is/is-not with tension, falsifiable rules with plausible "don'ts", AI-slop banned list, flex tables, mechanics; extraction trust order; triad test; failure modes. | M | Fixed. voice-craft.md. |
| 6 | Intake craft: draft-then-confirm, never-ask list, contradictions with interim default, provenance, ledger fields. | M | Fixed. intake-craft.md. |
| 7 | A rigorous ten-question test with traps and hard fails. | M | Fixed. tests/test-by-hand.md Part 2. |
| 8 | Ten failure modes. | M | Covered across claims-craft.md, voice-craft.md and the SKILL.md rules. |
| 9 | Category → regulator table; quarterly re-validation; exact words for every sign-off. | m | Fixed: category-rules.md, sweep mode, verbatim approver words. |

## Round 3 — adversarial run (after writing, effort high; Personal Day live read-only, a B2B SaaS with an agency user, a pre-launch app)

| # | Finding | Sev | Resolution |
|---|---|---|---|
| 1 | Time budget is fiction: ~60 decisions and ~25 one-at-a-time high-risk claims on a real DTC brain. | M | Fixed. Time budget stated (20–30 min, 15–20 decisions); triage by reach: only the ~5 widest-reach high-risk claims asked one at a time, the rest recorded "not approved yet" without asking; product-facts-only default on any sign of time pressure (SKILL.md step 4, claims-craft.md §4–5). |
| 2 | Nothing saved until the end; a founder who bails loses everything. | M | Fixed. Save after steps 3, 4 and 5; record status "in progress, resume at step N"; new Resume mode. |
| 3 | The $35 update has no clean home; old $45 stays live; no landing-page check; invented "US" scope. | M | Fixed. Brand-wide policies → `must` fact + record; offers need "is the site updated?" before ads use them; template never adds an unstated scope. Old research claims stay in the brain (no tool): the `dont`/`must` facts and the marker override them; server-needs #1. |
| 4 | Beauty pack wrong both ways for OTC acne products. | M | Fixed. Per-product OTC question; never-say scoped per product (category-rules.md). |
| 5 | Press quotes and testimonials launder drug/efficacy claims. | M | Fixed. "Quoted claims are the brand's claims" rule (claims-craft.md). |
| 6 | Claim stores missed (description, audience, creativeAxes, ad offers/angles, lines inside voice) and never rewritten. | M | Fixed. Collect list extended; description and audience rewritten at save. |
| 7 | Voice examples import claims and break Meta's personal-attributes rule (including the playbook's own example). | M | Fixed. Example replaced; every "we say" line screened against claims and never-say. |
| 8 | Fonts clash; palette and fonts have no writable field. | m | Fixed. Step 6 flags clashes; palette and fonts in the record; server-needs #12. |
| 9 | Owner-made learnings vs research voice not reconciled. | m | Fixed. Owner rules win; clash shown (voice-craft.md, atom). |
| 10 | Product names as claims had no path. | m | Fixed. Names verbatim only, never extended into a claim. |
| 11 | Full read of 8 sections overflows hosted chats; media_list noise. | m | Fixed. Kit full alone; other sections lean; `product_ids` in batches; `scope: brand`. |
| 12 | `user_context` treated as the owner's words. | m | Fixed. "Founder said" line only, and still confirmed. |
| 13 | Not-public question asked in three places. | m | Fixed. Step 4 only. |
| 14 | Known-false claim ("SOC 2 compliant") stays live in pending mode. | M | Fixed. Chat user's stated facts recorded now; claims they say are false pulled at once. |
| 15 | Pending approval has no return path. | M | Fixed. "Client sign-off back" mode with relayed provenance. |
| 16 | Sign-off sheet can't be answered. | m | Fixed. "Decisions needed" section with a decision column, reply format and voice guide. |
| 17 | SOC 2 modelled as a certificate. | m | Fixed. Attestation report, type, date; never "certified". |
| 18 | B2B pack misses AI-capability, data-use, recording-consent claims. | m | Fixed (category-rules.md). |
| 19 | Design partners are a material connection; permission per name. | m | Fixed (category-rules.md, intake-craft.md). |
| 20 | Provenance tags lack agency / via-agency. | m | Fixed (template, intake-craft.md). |
| 21 | Pre-launch setup path breaks (placeholder brand, TestFlight not accepted, setup questions). | M | Fixed. `brand_setup status` first, follow `next_step`, answer its questions from what was said, reuse the placeholder, never create a second brand. |
| 22 | Triad test has nothing to start from pre-launch. | m | Fixed. Founder pastes 5–10 posts; never invent a "real line". |
| 23 | Consumer-app pack thin (health data, beta quotes, embargo). | m | Fixed. |
| 24 | "Who we lose to" assumes sales. | m | Fixed. "What buyers use instead, including nothing". |
| 25 | Brand record "replace" doesn't replace. | M | Fixed. Dated titles, delete the old media asset, marker names the record that counts; server-needs #13. |
| 26 | Hosted chat can't hand-write base64. | M | Fixed. `file_write` → `media_upload` source `workspace`. |
| 27 | Marker undiscoverable; ~70 facts flood learnings. | M | Fixed. Marker written last with lookup instructions; facts consolidated (approved claims in one or a few `must` facts, not-approved in one or two `dont`s, voice rules in one or two `do`s); server-needs #14. |
| 28 | "Siblings send claims back here" breaks AGENTS §2.9. | m | Fixed. Siblings cut and tell the human; the human runs one-claim mode. |
| 29 | Monthly sweep has no tool. | m | Fixed. `automation_upsert` named; the scheduled sweep only lists, never approves. |
| 30 | Batch-approval rules contradict. | m | Fixed. One rule everywhere: low batch, medium visible groups of 3–5, high one at a time. |

## Round 4 — contract check (after writing, effort high; both playbooks)

| # | Finding | Sev | Resolution |
|---|---|---|---|
| 1 | Brand record replacement leaves old copies searchable. | M | Fixed (as round 3 #25). |
| 2 | Lean `brand_read` can miss the sign-off marker. | M | Fixed. Marker found via `knowledge_search ["learning"]` or a full learnings read, in step 8, the marker text and the sibling contract. |
| 3 | brain-map put agent text inside `user_statement`. | M | Fixed. Only the owner's typed words; explicit approval that stands on its own. |
| 7 | `patch.products` has no `hero`; reason belongs in `ad_eligibility_reason`. | m | Fixed. |
| 8 | Only primary/accent colours writable. | m | Fixed (round 3 #8). |
| 9 | Two voice fields; siblings read the kit. | m | Fixed. Voice, audience, description, value props written to `patch.kit`; positioning and tagline to `patch.knowledge`; which field `kit.voice` shows is recorded as unverified (server-needs #8). |
| 10 | Parameters re-described (limits, encodings). | m | Fixed. Limits and encodings removed; "the live schema is the truth" stated. |
| 11 | Sweep has no tool. | m | Fixed (round 3 #29). |
| 12 | meta labels `user_context` as brand brain; overstated readers. | m | Fixed. Readers listed as they really are; unknowns ledger "for the owner and the next run". |
| 13 | Fact writes unverified. | m | Accepted as open: server-needs #15. A throwaway-brand write test was blocked by this session's permission check (shared staging resource). |
| 14 | "No brand" can't happen. | m | Fixed. Placeholder handling. |
| 16 | Siblings bypass the contract. | M (chain) | Cannot be fixed inside this folder. Made it easy to follow (approved claims as `must` facts, marker with lookup instructions, "How siblings read this" in brain-map.md) and handed the contract and the list of mismatching siblings to the orchestrator in the shared notes. |

## Round 5 — final-round critic (effort xhigh; Personal Day live read-only with an impatient founder who insists on an unproven claim; an agency user on B2B SaaS)

Verdict: 3 major findings, 13 minor. Craft judged acceptable to a senior brand strategist and a compliance reviewer; contract clean except the hosted-chat context budget.

| # | Finding | Sev | Resolution |
|---|---|---|---|
| M1 | Reads can fill a hosted chat's context (~570 KB of tool output per full run: kit full re-read at every save, a 54 KB "lean" read with competitors and sources, a 92 KB unfiltered media list). | M | Fixed. Kit full read once; lean read without competitors (competitor_read covers them) and sources read alone only when needed; media_list by kind; the write-back atom reads learnings only; step 8 reads kit lean. Test log's size claims corrected. |
| M2 | Save "parts" per step could drop confirmed items for good (rewritten value props left live). | M | Fixed. Every save writes everything confirmed and not yet written, across all parts; the atom's input is the ledger, not "since the last save"; part numbers removed from steps 3–5. |
| M3 | Brand record lifecycle: rebuilt from search snippets then the old one permanently deleted; same-day title collisions; no precedence between table and rules. | M | Fixed. Previous version read in full with `file_read` from the shared workspace; versioned titles and paths (`<date> v<N>`); marker rewritten at every save naming the version; delete the old asset only after the new import succeeds and keeps every row; "the rules win, the table is proof detail". |
| a | Owner insists on an unproven claim: no status, no attestation route. | m | Fixed. Owner attestation allowed for verifiable business facts only; "not approved — owner disagrees" status. |
| b | Time budget given three ways; shortcuts only for claims. | m | Fixed. One budget everywhere; time-pressure shortcuts for every step. |
| c | No pending path for voice; agency facts vs `user_statement`. | m | Fixed. Voice goes to the sheet when the approver is absent; facts from the person in the chat are recorded in their words, tagged `[agency]`. |
| d | `automation` group missing. | m | Fixed. |
| e | Meta inaccuracies (get_started listed, per-claim facts, description write, update-mode tools). | m | Fixed. Update mode names `knowledge_search ["creative","document"]` and `campaign_read`. |
| f | Approved claims as `must` facts could read as "include in every ad". | m | Fixed. Phrased as a permission: "Claims you may use — only these, verbatim, only when relevant". |
| g | Adapalene isn't a monograph active; resorcinol missing. | m | Fixed. |
| h | Precedence lists differ. | m | Fixed; one order. |
| i | Stale test log (write targets). | m | Fixed. |
| j | Test asks for a top objection nothing settles. | m | Fixed. Ledgered as "waits for research-market"; test accepts that answer. |
| k | Template says the agent checked the site. | m | Fixed. Owner-attested. |
| l | No write path for brand type. | m | Fixed (`patch.kit.brand_type`). |
| m | Hosted chats can't upload an attached PDF. | m | Fixed. Read it in the chat with `[owner's doc]` provenance, or ask for a public link to import. |

## Round 6 — final re-check (effort xhigh; Personal Day traced end to end: full run stopped after claims, a fresh-session resume, and an update a week later)

**Verdict: no major findings.** Nothing confirmed is lost on the normal path; the marker names the current record; no unapproved claim is readable as approved by a sibling following the contract; tool params valid; context ~250 KB of reads per session, workable on a hosted chat. Minors fixed:

| # | Finding | Resolution |
|---|---|---|
| m1 | Marker written before the record exists. | Fixed. Save order: typed fields → record written and imported → rules with the marker last → old asset deleted. |
| m2 | Retired facts may still be returned. | Fixed. Step 8 checks exactly one active marker and no retired text; deletes superseded facts if they show; server-needs #15. |
| m3 | Siblings could read claims facts truncated. | Fixed. Contract says read them in full. |
| m4 | New policy value could reach ads before the site matches. | Fixed. Policy fact carries "not in ads until the site shows it". |
| m5 | Fonts probe unanswerable from the fresh read. | Fixed. Step 8 reads the record; contract points to it for fonts and palette. |
| m6 | Marker state confused with run status. | Fixed. Marker states claims status and always names the version. |
| m7 | "Every row" rule blocked updates; no Retired section. | Fixed. "Carried over, deliberately changed or retired"; Retired claims table added. |
| m8 | Provisional voice ambiguous. | Fixed. Provisional voice lives in the record only. |
| m9 | Positioning never audited; candidate lists differ. | Fixed and aligned. |
| m10 | Update test contradicted the references. | Fixed. |
| m11 | Precedence order mismatch. | Fixed. |
| m12 | Atom's typed-field list short. | Fixed. |
| m13 | Update mode read the full kit; old asset lookup implicit. | Fixed. Kit lean in update and one-claim modes; old asset found by title. |
| m14 | Unsaved items lost to the next session. | Fixed. Listed in the record's status line. |

## Round 7 — cross-set review fix pass (orchestrator brief; reviews/2026-10-16-{contracts,depth,routing,coverage}.md; AGENTS §3, §5, §8)

This session now also owns the shared atoms `atoms/claims-gate`, `atoms/save-learning` and `atoms/voice-card` (built first, because other sessions point to them).

| Finding | Source | Resolution |
|---|---|---|
| Marker (~500 chars) and multi-claim facts cut silently at 300 chars | contracts F1 (MAJOR) | Fixed. One claim per fact (`Claims you may use — C<n> "…" · scope · qualifier · review <date>`), marker ~200 chars with a status token; every fact read back and compared (`atoms/brain-write-back`, `atoms/claims-gate` §5, `atoms/save-learning`). |
| Ad and video engines see only the 8 newest facts; claims rules fall out first | contracts F2 (MAJOR) | Fixed within our control. Write order is least important first, claims → not approved → never-say → marker last; voice rules moved out of facts into the kit voice (one `Banned words —` fact remains) so fewer facts compete; the claims list stays short by triage. Server ask logged (server-needs #15: rank must/dont first, raise the cap, reject >300 chars). |
| Workspace in the org shared scope | contracts F6 (MAJOR) | Fixed. Brand record at `brand/records/<date>-v<N>.md` in the brand coworker scope, saved through `atoms/save-to-brain` (`versioned: supersede`). |
| Marker status words disagree; "not yet signed off" contains "signed off" | contracts M1 | Fixed. Tokens `signed-off | pending-client | not-signed`, matched exactly. |
| No voice sign-off signal | contracts M22 | Fixed. `voice: confirmed | provisional` in the marker. |
| Standing offer lives in two places; update mode misses learnings | contracts M5 | Fixed. `Standing offer: … [owner, date]` shape (same as email-lifecycle); update mode searches `["learning", "creative", "document"]`. |
| Items siblings read that LMB never writes (crisis contact, customers/logos, win/loss, do-not-contact, spend approver, unit cost) | contracts M21 | Fixed. Unknowns ledger rows with when each is asked, in plain words. |
| server-needs #15 stale (facts "accepted without knowledge_intent", "source feedback"), brain-map "lean can miss the marker", "unverified un-index" | contracts M18, 3.3, 3.5 | Fixed: #15 rewritten from the server facts; lean read returns every must/dont; deleted media drops out of search. |
| get_started skipped | contracts M12, routing R4, AGENTS §8 | Fixed. First call `get_started` with `wants: "more"`; card kept to one line. |
| Save protocol inline in step 7 (3.6k-word SKILL.md) | depth (LMB 4.5) | Fixed. Protocol in `atoms/brain-write-back`; SKILL.md step 7 is two lines; SKILL.md 2.2k words. |
| Makers stuck on facts-only output when nothing is signed off | depth cross-set #1 (MAJOR) | Fixed. `atoms/claims-gate` §4 scoped sign-off for the 3–5 load-bearing lines, recorded through the exact contract (§5). |
| Description over 1,024 chars; no "Not for" clause | routing R3, AGENTS §5 | Fixed. `>-`, 908 chars, "Not for … research-market / positioning". |
| An action inside "Done when" | routing (LMB line 118) | Fixed. The monthly sweep offer moved to step 8. |
| Atom files named SKILL.md | AGENTS §5 | Fixed. `atoms/<atom>/ATOM.md`. |
| Playbook names in owner-facing text (the Brand record) | AGENTS §5 | Fixed. The record's unknowns say "when you plan a campaign"; SKILL.md tells the agent never to name tools or playbooks to the owner. |
| Amazon-only seller can't set a brand up from a link | coverage M1 | Partly: setup with no accepted link uses the placeholder and pasted listings (step 5). No new playbook (decision pending with Akhil). |

Rejected or left as is, with reasons:
- **"Who it's for" has no ranked reasons-to-buy** (depth MINOR): by design; message hierarchy is positioning work (write-my-positioning, backlog; coverage decision pending).
- **≤3 new facts per run** (§8): learn-my-brand's claims contract is the stated exception (one fact per approved claim plus the marker); the triage keeps the list short. Recorded in `atoms/save-learning` step 3.
- **Scoped sign-off sets `signed-off`**: deliberate. The token means "the list is human-approved", not "every claim was audited"; a short list is still a signed list. A later full pass extends it.

## Round 8 — adversarial + contract critique of the round-7 fix pass (effort high; Personal Day live read-only; a maker's scoped sign-off; both playbooks and the three shared atoms)

Verdict: 7 major findings (4 in this playbook or its shared atoms), 18 minor. Fixed:

| # | Finding | Sev | Resolution |
|---|---|---|---|
| 1 | `Not approved —` and `Never say —` still packed several lines into one fact (Personal Day's list is ~500 chars, cut at 300) | M | Fixed. No "not approved" fact at all: the marker already says only `Claims you may use` rules are approved; the full list is in the record. At most two `Never say —` facts, one pattern each. SKILL, meta, server-needs, brain-map and tests aligned. |
| 2 | Two definitions of the current Brand record; a pending-client save never rewrote the marker, so the next save dropped rows | M | Fixed. Current record = highest `v<N>` in `brand/records/` everywhere (claims-gate, brain-write-back, SKILL step 1); claims-gate §4.2 spells out the pending-client save and rewrites the marker. |
| 3 | Scoped sign-off left a contradicting "not approved" fact and pushed never-say rules out of the engines' 8-fact view | M | Fixed. No "not approved" fact exists (see 1); §5 retires and re-adds the `Never say —` rules after the claims; cap 5 claims + 2 never-say + marker. |
| — | Write order relies on timestamps of rows written in one call (minor 5) | m | Fixed robustly: the marker is always written alone in a second call (brain-write-back, claims-gate, save-learning); the open server question is in server-needs #15. |
| m1–3 | Fact kinds unspecified; offers written twice; forced end date | m | Fixed. Kinds stated per opening; offers and policies stated in copy are claims, written once; `Policy:` only for operating rules; `Standing offer:` takes `until <date> | ongoing`. |
| m4 | `Standing offer:` has two writers | m | Fixed. Named exception in save-learning; learn-my-brand retires email-lifecycle's fact when the owner changes the offer. |
| m6 | "One call / ≤3 facts" vs claims-gate's own call | m | Fixed. Exception reworded to learn-my-brand's saves and claims-gate §5 (≤8 in one call); a maker's own learnings stay ≤3. |
| m7 | needs.mcp incomplete | m | Fixed (`media_update`). |
| m9 | voice-card title/tags and precedence | m | Fixed. Title `Voice card <handle> — <Brand> — <date>`, tags `[voice-card, voice-<handle>]` so any writer supersedes; brand rules win, a person's card wins on style. |
| m10 | claims-gate pointed into a playbook folder; no-coworker path; review dates; first record's status | m | Fixed. `atoms/claims-gate/claim-types.md` and `record-skeleton.md` beside the atom; coworker fallback path; review dates aligned with claims-craft; skeleton status "scoped sign-off only; full brand pass not done". |
| m11 | Offers: product record vs claims | m | Fixed. claims-gate §1.7: a product's price and `offers` are plain facts only when the human confirms in this job they are live. |
| m12 | Template status words vs tokens | m | Fixed (tokens, plus voice). |
| m13 | Playbook names in the owner's ledger | m | Fixed (intake-craft: write "when you …"; tests). |
| m14 | Stale test and critique text | m | Fixed. |
| m15 | Time pressure leaves unapproved claims in the kit | m | Fixed. One yes/no on the rewritten value props and description even under time pressure; on a no, an `agent_proposal` and an unknowns row. |
| m18 | get_started repeats when chained | m | Fixed ("unless already made in this conversation"). |
| m8 | save-to-brain frontmatter is invalid YAML | m | Not ours (owner: research-market session); passed on in the report to the orchestrator. |

## Round 9 — focused re-check (effort high; full run, an update and a maker's scoped sign-off traced fact by fact)

Verdict: 3 major findings (all in this playbook or its shared atoms). Fixed:

| # | Finding | Sev | Resolution |
|---|---|---|---|
| 1 | A pending-client scoped sign-off rewrote a signed-off marker as `pending-client`, switching off every approved claim for every sibling | M | Fixed. Status rule (claims-gate §4.2, brain-write-back step 3, claims-audit, claims-craft, SKILL): an approved list stays `signed-off`; new lines wait on the sign-off sheet; `pending-client` only when nothing is approved yet. Record skeleton status is a placeholder. |
| 2 | Never-say rules not reliably among the engines' 8 newest; an update could retire them for good | M | Fixed. At every save the second call carries the never-say rules (re-added unchanged) and the marker, in learn-my-brand and in claims-gate §5; `Policy:`/`Not public —` are retired only when changed; save-learning step 4 matches; the read-back checks both never-say rules are active. |
| 3 | The `Banned words —` fact overflows 300 characters and the cut words had no home | M | Fixed. Full list under "Banned:" in the kit voice and in a new Voice section of the record; the fact holds the owner's own words first. |
| m | save-learning had no exception for claims-gate retiring learn-my-brand's facts | m | Fixed. |
| m | save-to-brain's "never another playbook's document" vs shared records and cards | m | Within our files: the tags name the creator (`learn-my-brand` for records, `voice-card` for cards). Asked the save-to-brain owner (research-market session), via the orchestrator, to read the creator from the tags. |
| m | "About eight" facts vs a real count of 11 | m | Fixed: "about 8–12". |
| m | Rejected proof points as `dont` facts; "brand-wide policy → must fact" ambiguity | m | Fixed: both go to the record's "Not approved" table or become `Claims you may use` facts. |
| m | needs.mcp missing `knowledge_sync`, `media_analyze` | m | Fixed. |
| m | No-brand situation answers relied only on where-to-start's reminder | m | Fixed: step 3 records answers the founder already gave in the conversation in the record's business facts. |
| m | Template example dates didn't fit | m | Fixed. |
| m | Tests (two facts for one offer; "one call") | m | Fixed. |
| — | Other playbooks' facts push the marker out of the engines' view after a few runs | — | Known server limit; server-needs #15 (rank must/dont first). Nothing a playbook can prevent. |

## Round 10 — verification (effort high)

Fixes 2 and 3 from round 9 confirmed; fix 1 incomplete. 2 major findings, fixed:

| # | Finding | Sev | Resolution |
|---|---|---|---|
| 1 | claims-gate §5 still hard-coded `signed-off` (a pending path through §5 could write `signed-off` with nothing approved) | M | Fixed. §5's marker uses the status token and repeats the status rule word for word (same text in brain-write-back); §4.2 covers the no-marker / nothing-approved case (`pending-client`). |
| 2 | Once a list is signed off, nothing tells a maker that a client approves new lines | M | Fixed. The marker carries `approver: owner | client <name>` (≈210 chars with a long name); claims-gate §4.2 reads it before asking; server-needs #5 corrected. New test variant covers it. |
| m | intake-craft "claims stay pending client approval"; brain-write-back missing the token for "asked, approved nothing" | m | Fixed (`not-signed`). |
| m | server-needs said the marker alone goes in the second call; claims-gate read-back didn't check never-say rules or retry a failed second call; save-learning "at most 8 in one call"; brain-map "marker last" | m | Fixed everywhere. |
| m | Banned list missing from brain-map row 11, SKILL output and meta; changed banned list not retired | m | Fixed. |
| m | `Policy:` "one rule per fact" not stated in brain-write-back | m | Fixed. |
| m | No test for a scoped sign-off on a signed-off brand with a client approver | m | Added. |

## Overlaps to note for the consolidation pass
- Done in round 7: the claims check every maker needs is the shared `atoms/claims-gate` (this playbook's `claims-audit` stays local as the whole-brand version); learnings rules are `atoms/save-learning`; voice cards are `atoms/voice-card`; the Brand record goes through research-market's `atoms/save-to-brain`.
- The old shared-notes contract file is superseded by `atoms/claims-gate` (marked so in the notes folder).

2026-10-16 orchestrator: removed workarounds for today's 300-char/8-fact server limits per Akhil — the Brand Brain rebuild removes them; interim handling lives only in atoms/save-learning.

2026-10-16 final contract check: skill.meta.json learnings line matched to brain-write-back (one call; one fact per never-say line; removed the stale "about 8–12", "≤300 chars" and "at most two" rationing).
2026-10-16 final contract check: references/intake-craft.md: the owner-read unknowns ledger says "waits for customer research" (no playbook name).
2026-10-16 final contract check: atoms/claims-gate/claim-types.md (owned here): link to claims-craft.md made resolvable.
2026-10-16 final contract check: skill.meta.json `atoms` now lists only this folder's atoms; shared atoms moved to `shared_atoms`.
2026-10-16 orchestrator ruling: `Policy:` stays learn-my-brand's own opening (save-learning now says so; email-lifecycle writes `[lifecycle]` rules instead); bare `atoms/<shared>` paths converted to file-relative form across SKILL.md, atoms, references, tests and server-needs.md.
