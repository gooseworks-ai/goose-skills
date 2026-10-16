# Critique log — research-audience

Every round: the finding, the fix, or why it was rejected. Critics were subagents (effort high; final round xhigh). None read old skills.

## Round 1 — before writing (2026-10-16)

### Scope critic

| # | Finding | Sev | Outcome |
|---|---|---|---|
| 1 | "Verified emails" cannot be delivered — no verifier on the MCP | major | **Fixed.** Email status per row (`verified-by-tool` only from a tool, `published`, `pattern-guess`, `catch-all`, `none`); verifier loop with the human's tool; Done-when reworded (see R2-C12 for the logged spec deviation). |
| 2 | Paid lookups were ignored ("no money moves") | major | **Fixed.** Credit gates (redesigned in R2). |
| 3 | Flat list of people — should be accounts first, buying roles | major | **Fixed.** Accounts × 1–3 people in different roles; account-level rows for portals/buying offices. |
| 4 | No calibration before the full build | major | **Fixed.** Five-account sample, "right kind?" before the full build. |
| 5 | Exclusions need a mechanism | major | **Fixed.** Uploaded/pasted exports, ledger, suppression, competitor domains, dedupe on root domain and parent. |
| 6 | Provenance and compliance per row | major | **Fixed.** Sources + retrieved date per row, region flags, "how this list was built" note. |
| 7 | Signals must match what the server can see | major | **Fixed.** Signal table maps each signal to a reachable source; noise list; URL + date rule. |
| 8 | Challenge the "50" default; show universe size | minor | **Fixed.** Size checked against capacity (asked, not capped); universe line in the summary. |
| 9 | Warm paths | minor | **Fixed.** Optional inputs, `warm_path` column, ranked first. |
| 10 | Output format and where it lives; no personal data in the brain | minor | **Fixed.** CSV + summary in the workspace; brand documents carry no personal data. |
| 11 | Company types need their own list unit, route and signals | major | **Fixed.** `references/list-by-company-type.md`. |
| 12 | Recurring/reactive work missing | major | **Fixed.** Ledger, top-ups, re-check before send, outcomes intake (atom), reminders (redesigned in R2). Watchers for job changes parked — no feed (server-needs #8). |
| 13 | Segments by angle × signal | minor | **Fixed.** |
| 14 | Explicit out-of-scope list | minor | **Fixed.** |
| 15 | Honest shortfall as stated behaviour | minor | **Fixed.** In step 7 and the QA atom. |

### Depth critic

All content adopted into references: excellent-output example and columns (`output-format.md`), finished-definition checklist and gates-then-points scoring with tiers (`fit-and-scoring.md`), signals with freshness windows and the evidence standard, noise list, hooks worth/worthless/banned (`signals-and-hooks.md`), email states, bounce ceilings, persona-by-company-size, junior failure modes, compliance basics, benchmarks (`contacts-and-compliance.md`), yield funnel (`data-sources.md`). Rejected: nothing. Adjusted: the 50-of-valid-only rule became "only verified rows count for sending" because nothing can be verified on the server today.

## Round 2 — after writing (2026-10-16)

### Adversarial run (DTC skincare → retail buyers; new AP-automation SaaS; pre-revenue habit app)

| # | Finding | Sev | Outcome |
|---|---|---|---|
| A1 | Webmail ban wipes out boutique rows | major | **Fixed.** A shop's own published webmail counts as `published`. |
| A2 | UK PECR: sole traders/partnerships need consent | major | **Fixed.** `UK-soletrader: consent needed` flag, non-email route offered. |
| A3 | Proposing the ICP into `audience` corrupts the consumer audience | major | **Fixed.** Only when the outbound buyer is the brand's own customer; never for retail/partner lists. |
| A4 | Asks "who the list is for" when the request said it | minor | **Fixed.** "What the brain and the request cannot settle". |
| A5 | Chains and boutiques mixed | major | **Fixed.** Ask the split; chains are account-level rows with portal/broker route. |
| A6 | Definition and scoring are SaaS-shaped | minor | **Fixed.** Retail variant (door count, price tier, assortment, review window) and its scoring. |
| B1 | Human learns "no verifier" too late | major | **Fixed.** Said once in Before you start. |
| B2 | Worked example invites copying (same AP brand) | major | **Fixed.** "Never reuse example values" in the definition reference, output format and the atom. Kept the example's industry: it is the clearest illustration and is now fenced. |
| B3 | Title confirmation impossible with hidden profile titles | major | **Fixed.** Dated search headline accepted, labelled, scored lower; summary says when `published` emails will be rare. |
| B4 | Tech gate wrecks yield | major | **Fixed.** Evidence-first sourcing for tech/situation gates. |
| B5 | Timing points not computable | minor | **Fixed.** high 40 / medium 28 / low 16 × freshness, with worked numbers; example rows recomputed. |
| B6 | CASL + pattern-guess | major | **Fixed.** Canadian pattern-guess never sendable. |
| B7 | No plan for a thin sample | minor | **Fixed.** Show what passed and why; fix the definition, never widen to fill. |
| C1 | Consumer requests pass Gate 1 before the rule loads | major | **Fixed.** Scope screen is the first step of Before you start. |
| C2 | Clarifying question omits press and early users | major | **Fixed.** The screen lists in- and out-of-scope options with where each goes. |
| C3 | 50 not challenged for partner lists | minor | **Fixed.** Partner/app lists default 20–30. |
| C4 | Turn pile-up | minor | **Fixed.** Gates merged (see X4). |
| X1 | Gate asks a yes in lookups, not credits | major | **Fixed** (with R2 contract #3): ceilings in credits. |
| X2 | Sample does not fit its ceiling | major | **Fixed.** Five accounts, ~50–70 lookups stated. |
| X3 | 8–12 lookups/person too low | major | **Fixed.** 13–20 with the missing rows added; counts shown by kind. |
| X4 | Too many gates | minor | **Fixed.** Two gates; handover is a boundary, not a gate. |
| X5 | Yield ratios contradict | minor | **Fixed.** One ratio, "kept" defined. |
| X6 | EU: GDPR vs ePrivacy conflated | major | **Fixed.** Two layers explained; every EU row "check the national rule"; DE/AT excluded by default. |
| X7 | "20–50 a week per sender" may talk users down | minor | **Fixed.** Asked as a question, never a cap. |
| X8 | `job_get` unused; doc import cost unverified; top-ups skip the sample | minor | **Fixed** `job_get` now follows `knowledge_import`; import cost stays an open server-need (#12); top-ups reuse the saved definition under a fresh ceiling. |

### Contract check

| # | Finding | Sev | Outcome |
|---|---|---|---|
| C1 | All tools exist; `job_get` unused | minor | **Fixed.** |
| C2 | Scheduled loop: agent jobs have no spend limit; paid cadence without a yes | major | **Fixed.** Reminders do free work only; paid work waits for a ceiling in session; saved paused; server-need #7. |
| C3 | Credit gates do not comply ("yes to the credit total"; own math) | major | **Fixed as far as the server allows.** Human sets a ceiling in credits; the playbook shows lookup counts by kind and server-reported charges, never its own total; stops at the ceiling; first answer's charge shown on a first run. Promoted to server-need #1. Residual: on a first-ever run, one lookup is spent before any price is visible — accepted, logged. |
| C4 | Learnings written to the ad-learnings store (analyze-performance owns it) | major | **Fixed.** Outcomes go to a dated brand document; no `brand_update` facts. |
| C6 | Audience proposal can overwrite consumer audience | major | **Fixed** (same as A3). |
| C7 | Ledger in a per-user workspace | major | **Fixed.** Organisation's shared workspace, keyed by brand id; residual risk logged in server-need #6. |
| C8 | Sibling read/write claims unbacked | minor | **Fixed.** Meta now says who reads what today; analyze-performance flagged as a possible reader. |
| C10 | Endpoint maps are vendor catalogue detail; duplicated | minor | **Partly fixed.** Kept as a working map with a note that the data-access foundation takes it over; no vendor price statements. Reason to keep: without paths, the agent has no way to know what the proxy can reach. |
| C11 | Hard-coded GooseWorks row; `get_started` not called; weights read like a decision tree | minor | **Fixed** row deleted; `get_started` called first when it is the first GooseWorks call. Weights kept as a rubric with "adjust with judgement and say why" — consistency across runs matters for re-tuning from outcomes. |
| C12 | Done-when deviates from the spec ("every email verified") | minor | **Logged here, kept.** The spec's promise cannot be kept by any playbook without a verifier on the server; the honest version is "zero invented emails, verified-by-tool only when a tool said so", with the human's verifier closing the gap. Frontmatter keeps the marketer's words "verified emails" as a trigger because that is what they say. |
| C13 | Fit definition found by `file_list` though saved as a document; stale documents | minor | **Fixed.** Found via `knowledge_search`, dated titles, newest wins. |
| C14 | Overlaps for consolidation | — | **Noted below.** |

### Staging run findings (see tests/test-by-hand.md)

- Workspace files are per user → shared workspace, brand id in paths.
- Competitor set contains a mis-resolved profile ("Jasper Ockeloen" on jasper.ai) → exclusions by root domain only.

## Overlaps for the consolidation pass

- **Outcomes intake** — same pattern as work-with-creators' `roster-outcomes` (human-reported results → ledger/roster → proposed rule changes → dated document).
- **Credit gate for unpriced public data** and the **provider path map** — duplicated in work-with-creators; belongs in `foundation/data-access`.
- **Brand-document write-back** (media_upload → knowledge_import → job_get) — shared with research-market and research-competitors.
- **Brain-read preamble, connection stop, tools_load, get_started, re-check date** — every playbook.
- **Privacy rules** (no protected-trait inference, no personal data in the brain) — shared with work-with-creators.
- **Ad-library checks** ("running ads now") — overlap research-competitors.

## Round 3 — final critic, xhigh (2026-10-16): adversarial + contract + "did R2 land?"

| # | Finding | Sev | Outcome |
|---|---|---|---|
| M1 | Independent boutiques: contact rules contradict; boutiques dropped or kept in breach (A1 half landed) | major | **Fixed.** Independents (one owner, ≤~10 staff) are account-level rows with the shop's published inbox (own-domain or published webmail) as the primary route; unnamed owner is not a drop reason. Updated contacts-and-compliance, people-and-contacts (step and Rules), QA checklist. |
| M2 | Ledger cannot suppress: no email column; account rows and sample rows never ledgered | major | **Fixed.** Ledger columns incl. `row_type`, `email`, `suppressed`; match email → profile URL → name+domain; account rows by domain+route; sample rows ledgered when shown. |
| M3 | First run spends without a yes at a shown price | major | **Fixed.** First-ever run stops after the first paid answer ("charged N; keep, change or stop?"), balance shown from `account_whoami`; run-notes written after the sample. R2-C3's "as far as the server allows" corrected. |
| M4 | Reminder job is not free (agent jobs run the coworker), cannot ask in "the next session", paused = never fires | major | **Fixed.** Automation removed (and from meta); `recheck_by` in summary and ledger; later runs flag stale lists for free; server-need #7 reworded. |
| m1 | Honest limit understates (LinkedIn-only rows; rare `published` without web tool) | minor | **Fixed.** Both said up front; sample's email-status mix shown at Gate 2. |
| m2 | Sample can stall on no-contact-route accounts | minor | **Fixed.** "Pass" = pass the gates; no-route is a yield fact; sample rows carry into the full list. |
| m3 | Exclusion ask wrong for DTC (consumer customer lists) | minor | **Fixed.** Retail/wholesale asks for stockists, retailers in talks, exclusivity, territories; never consumer lists. |
| m4 | Retail sourcing misses stockist/store-locator pages; wholesale route; sell-sheets owner | minor | **Fixed.** Stockist pages first source for retail; Faire/wholesale route asked; sell-sheets/line sheets flagged as **unowned by any playbook** (pillar 8 lists them) — for the map. |
| m5 | Investors missing from scope screen | minor | **Fixed.** Out (fundraising, no playbook). |
| m6 | CSV can't hold tabs/appendix/account rows/retail columns | minor | **Fixed.** `row_type`, retail columns, `catch-all.csv`, tier C → `dropped.csv`; test aligned. |
| m7 | Example scores impossible; no-signal tier undefined | minor | **Fixed.** Tier B = fit ≥45/60 with no signal; retail no-window rule; example rows recomputed with every block cited (88 = 20+20+8+40; 81 = 22+20+12+27; 48 = 18+20+10+0). |
| m8 | Hooks step orphaned | minor | **Fixed.** Step 6 runs the hook step per kept person. |
| m9 | Fit-definition doc could leak into consumer playbooks | minor | **Fixed.** Document opens with "who we pitch, not the brand's customers; not for ads or consumer copy". |
| m10 | Paid search used even when host has free search | minor | **Fixed.** Host search first. |
| m11 | Hosted chat can't get the file out | minor | **Fixed.** `file_url` download link (added to meta); local copy with a shell. |
| m12 | Top-up gates unspecified | minor | **Fixed.** Unchanged definition: one gate (confirm + full-build ceiling), no sample; changed: both gates. |
| m13 | Stop rule worded two ways; does full ceiling include sample? | minor | **Fixed.** "Before the next lookup could pass the ceiling"; ceilings separate. |
| m14 | No shared scope; get_started setup card | minor | **Fixed.** Fallback with warning; finish setup then resume. |

Contract: all tools exist and are used per schema; reads/writes all backed; YAML parses; sections in order; §3 files present.

## Round 4 — confirmation, xhigh (2026-10-16)

| # | Finding | Sev | Outcome |
|---|---|---|---|
| M1 | Tools behind `tools_load` never loaded → stall, or skipped re-run check repeats suppressed people | major | **Fixed.** `tools_load` once with the needed groups; `client` on every call; added to meta. |
| M2 | Named chain buyers dropped (portal-only rows) — R2-A5 overshot | major | **Fixed.** Chains: account row with the portal/buying-office route **plus** 1–2 dated, confirmed category-buyer person rows, unless the vendor page says portal-only (noted on the row). |
| m | "Never" list split; tier B/C overlap and "appendix"; summary template behind (two ceilings, recheck_by, national rule); "separate column/tab" leftovers; IG-only shops dropped; retail signals had no strength; brand choice and scope question before a brand read; stale re-check unpriced; Done-when assumes titles on account rows; critique overlaps stale | minor | **All fixed.** |

**Sibling conventions adopted in this round** (shared notes folder, 2026-10-16):
- Files live in the **brand coworker workspace** (`file_*` scope agent = the brand's `coworker_agent_id`), like every sibling — replaces the org shared scope chosen in R2-C7.
- Paid lookups are logged in the shared `research/credits-log.md` (replaces this playbook's own run-notes) so all playbooks quote from one price history.
- Brand documents: `file_write` → `media_upload` source workspace (inline bytes refuse markdown) → `knowledge_import` (verified free by the research session) → `job_get`.
- The consumer `audience` field is never written here: research-market owns it (it proposes it from evidence) — the conditional proposal from R2-A3 is removed to avoid two writers.

## Round 5 — confirmation, xhigh (2026-10-16)

| # | Finding | Sev | Outcome |
|---|---|---|---|
| M1 | Australia/NZ (and any `other:` country) had no send rule; AU/NZ pattern-guesses looked sendable | major | **Fixed.** `AU-NZ` flag treated like CASL (pattern-guess never sendable); `other:<country>` → "check the local rule"; both in the QA checklist and atoms. |
| m1 | Tier gap: weak late signal dropped a fit-46 row below a no-signal row | minor | **Fixed.** Fit ≥45/60 (retail ≥40) is tier B whatever the signal. |
| m2 | `get_started` could be skipped after `tools_load` | minor | **Fixed.** `get_started` first; staging result recorded in the test log. |
| m3 | Brand-doc workspace paths unnamed | minor | **Fixed.** `research-audience/fit-definition-<date>.md`, `outcomes-<date>.md`; read with `file_read` first. |
| m4 | server-needs leftovers (stop rule; import cost) | minor | **Fixed.** |
| m5 | Retail variant still read as account-only for chains | minor | **Fixed**, and the edge test checks buyer rows and boutique account rows. |
| m6 | No hooks for account rows | minor | **Fixed.** |
| m7 | Segment lines had no claims guard | minor | **Fixed.** Situation and angle only; signed-off claims only. |
| m8 | Prospect names in the shared credits log | minor | **Fixed.** Log the kind of query, never a name. |
| m9 | Example funnel didn't reconcile | minor | **Fixed.** Account drops 116, people drops 100. |
| m10 | Meta missing `catch-all.csv` | minor | **Fixed.** |
| m11 | No method to tell a UK sole trader | minor | **Fixed.** Companies House check. |
| m12 | DTC exclusions asked, not read | minor | **Fixed.** Read the brand's own store locator first. |

## Round 6 — confirmation, xhigh (2026-10-16)

| # | Finding | Sev | Outcome |
|---|---|---|---|
| M1 | UK sole-trader rows still looked email-sendable (flag only; independents' inbox as primary route; no QA line; summary counted them) | major | **Fixed.** Route is IG, phone or visit with `email` blank; excluded from email and sendable counts; QA line; CSV flag reads `UK-soletrader: consent needed`; summary line; DTC edge test. |
| m1 | Credits-log privacy wording only in SKILL.md | minor | **Fixed** in data-sources. |
| m2 | Lookup estimate ignored chain buyer rows and register checks | minor | **Fixed.** |
| m3 | Summary covered EU-UK only | minor | **Fixed.** One line per flag present (EU-UK, CASL, AU-NZ, UK-soletrader, other:, US). |
| m4 | Store-locator read could be a paid lookup before Gate 1; atom skipped stockists | minor | **Fixed.** Host reader only, else ask; stockists in the exclusion load. |
| m5 | Download link expires | minor | **Fixed.** Said, fresh link offered. |
| m6 | Partner list size disagreed | minor | **Fixed.** 20–30 everywhere. |

## Round 7 — confirmation, xhigh (2026-10-16)

| # | Finding | Sev | Outcome |
|---|---|---|---|
| M1 | The R6 sole-trader route (IG, phone, visit) was itself restricted: PECR counts social-media DMs as electronic mail; sole traders can be on the TPS | major | **Fixed.** Route is a visit or a letter; phone only after a recorded TPS check; IG for following, never a cold pitch. General rule added: DMs inherit the row's region rule. Updated in contacts-and-compliance, people-and-contacts, QA, summary, test. |
| m1 | Sole-trader exception missing from SKILL step 6, retail route, company-type table; "owner email" | minor | **Fixed** in all three. |
| m2 | No `notes` column; "contact_route" not a column | minor | **Fixed.** `notes` added; route lives in `email` / `other_contact_route`. |
| m3 | Summary had no count for non-email routes | minor | **Fixed.** |
| m4 | AU-NZ missing the "no unsolicited messages" condition and send-time duties | minor | **Fixed.** |
| m5 | "First-ever run" undefined with a shared credits log | minor | **Fixed.** No charge logged for these endpoints by any playbook. |

## Round 8 — confirmation, xhigh (2026-10-16): **No major findings.**

Round-7 fixes confirmed consistent across all files; all three runs (DTC to boutiques and chains in US/UK/AU/CA, new B2B SaaS, ambiguous consumer-app ask) complete with no stall or invention; contract clean. Minors applied:

| # | Finding | Outcome |
|---|---|---|
| m1 | UK companies can be on the CTPS; phone routes looked clear | **Fixed.** Any UK phone route: TPS/CTPS check recorded in `notes`. |
| m2 | "Letter" route without an address | **Fixed.** `visit/letter: <published shop address> (<url>)`; letter in the route lists. |
| m3 | One first-run stop while other endpoints stay unpriced | **Fixed.** Stop after the first answer from each unpriced endpoint. |
| m4 | UK independents' letter/visit-only rows surprised the human at the sample | **Fixed.** Said up front for retail lists with UK independents. |

**The loop ends here for research-audience: the last round found nothing major.**

## Cross-set review fix pass (2026-10-16, after reviews/2026-10-16-*.md and AGENTS §3/§5/§8)

| Source | Finding | Outcome |
|---|---|---|
| Orchestrator brief | Build the shared `atoms/outcomes-ledger/ATOM.md` from outcomes-intake + roster-outcomes, parametrised by entity | **Done** (owner: this session). Local `outcomes-intake` deleted; SKILL loads the shared atom with `entity: person`. |
| depth §6 | Tiers by fit × timing only; no account value for ABM | **Fixed.** Account value V1/V2/V3 (deal size, strategic fit; asked, else estimated and labelled) as a separate axis; V1 gets 1:1 depth; ranking by tier and value together; `value_tier` column. |
| depth §6 | "Why we're writing" is one line | **Fixed.** Three-line angle per segment — pain, proof, ask; proof only from signed-off claims via the claims gate, else "proof needed: <what would do>". |
| depth §6, §7 (D2) | Freshness multipliers read as a rulebook | **Fixed.** Timing is judgment with anchors (strength, recency, cap 40), reason written in the row; re-tuned from outcomes. |
| routing C4 / C12 / C13 | Slug reads as "audience research"; "who should we target" tie; cold-sequence routing | **Fixed in the description**: opens "Builds outbound prospect lists of businesses to pitch (not consumers)"; ends "Not for personas or customer research — that's market research (research-market)… Cold email sequences are not covered yet." Rename to `build-prospect-list` **not done** — slugs are the orchestrator's call (it changes every sibling's references). |
| contracts M9 | Playbook-named folder | **Fixed.** `research/audience/`. |
| contracts M19 / §8 money | Credits log schema and path | **Fixed.** `research/credits-log/<YYYY-MM>.md`, shared schema; query kind only. |
| contracts M10 / §8 money | Spend model differs from the shared one | **Fixed.** Spend follows `atoms/spend-gate` (probe → yes to "up to N credits", labelled estimate → stop). The R2–R8 "human sets the ceiling, never our own estimate" design is superseded by the shared rule. |
| contracts M11 / brief "Both" | RA refused schedules | **Changed.** Top-ups and re-checks offered opt-in per the spend-gate automation rule (created paused, per-run data ceiling named in the yes, run cost said). The earlier refusal's reason (no enforced cap) is answered by the shared rule; the server gap stays in server-needs #7. |
| contracts §3.5 | Brand documents never retired; ad-hoc titles | **Fixed.** `Prospect fit definition — <Brand> — <date>` via `atoms/save-to-brain` (`supersede`); lessons `Outreach lessons — …` (`keep-history`) via the ledger. |
| contracts M21 | Reads customers / logos / win-loss / do-not-contact that no one writes | **Fixed in meta and SKILL**: marked "usually not on file — asked". |
| contracts M12 | get_started without `wants` | **Fixed.** `wants: "more"`. |
| §5 | Atoms renamed `ATOM.md`; description ≤1,024 with "Not for"; never name playbooks/tools/vendors to the marketer | **Fixed.** 962 chars; marketer-facing lines say "email checker", "the creator playbook" is agent-side only. |
| §8 | Connection sentence; workspace fallback `brands/<brand-slug>/`; summary opens "Do this first, because…" | **Fixed.** |
| coverage M6 / M7 | Prospect lists dead-end (no sequences); no sell-sheets | **Not fixed here — scope.** Both need a new or split playbook (do-outreach writing half, retail collateral); the brief says no new playbooks or scope expansion (pending with Akhil). The segments' three-line angles are the hand-off a sequence writer would start from. |
| coverage (journalists) | Refuses journalist lists though PR research is the same pattern | **Not fixed — scope**, same reason; out-of-scope line unchanged. |

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

- Follow-up (2026-10-16): spend-gate's owner fixed the atom YAML, added our endpoints to `proxy-endpoints.md`, and changed the probe rule to one probe per run (pricier reads count their first call as their own probe inside the ceiling). Both playbooks, the fit-definition atom and the tests now follow it; data-sources.md points to the shared file for keys and pricing notes.

2026-10-16 final contract check: skill.meta.json `atoms` now lists only this folder's atoms; shared atoms moved to `shared_atoms` as plain slugs.
2026-10-16 orchestrator ruling: learnings use the new save-learning source `[outreach YYYY-MM-DD]` (SKILL.md write-back; outcomes-ledger step 5); bare `atoms/<shared>` paths converted to file-relative form.
