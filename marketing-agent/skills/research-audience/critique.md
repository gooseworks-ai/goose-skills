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

## Research-pattern rewrite (2026-10-17, AGENTS §8 "Research playbooks: the shared pattern")

**Why.** research-competitors' first hand test failed, and a Sonnet dry run of this playbook (Juicebox: "50 right-fit people at recruiting agencies, with verified emails") showed the same failure: a question message first, two credit yeses before even a five-row sample, no web search until after Gate 1, a chat message plus a CSV link at the end.

**What changed (rewrite, not patch).**
- SKILL.md rebuilt on the pattern: free pass first, ask nothing, report once. The agent drafts the fit definition itself from the brand's own site and brain (every line marked *sourced* or *assumed*), builds real rows from free sources — web search, directories, company sites and LinkedIn public pages, job boards, news, team pages — and the first message is the report plus the decisions left.
- One credit yes, after the draft (spend-gate branch B), only to deepen: titles hidden on public profiles, firmographics at scale, more accounts to reach the number. The two gates and the separate probe yes are gone.
- The deliverable is `report.md` (Do this first; timely openings; the draft definition; segments with pain → proof → ask and **For you**; **You vs them**; what was dropped; before you send; what we could not read; how it was built). Written as a file, offered to open, saved through save-to-brain.
- Atoms rewritten to match: fit-definition drafts and never waits; account-sourcing and people-and-contacts free-first; signals news-first with timely openings; score-segment-qa writes For you and You vs them. data-sources.md split into "free pass" and "paid top-up". Tests rewritten around the four failure modes.
- Kept: claims-gate (read step first, scoped sign-off in the message), save-to-brain, outcomes-ledger, `[outreach …]` learnings, all compliance rules.

**Sonnet re-run on the same ask (WebSearch + WebFetch only, no GooseWorks):**
| Failure mode | Result |
|---|---|
| Stopped early / asked first | **Pass** — no question before the report; one closing message with the draft, decisions and one ceiling ask |
| No web search | **Pass** — ~48 calls (15 searches, 33 fetches); rows came from agency team pages |
| Procedure over craft | **Mostly pass** — the output reads as research (Do this first, segments with For you, honest You vs them). Thin results came from the fetch tool (protected emails, blocked sites), not the playbook |
| Chat summary instead of a document | **Pass** — `report.md` written, opening "Do this first, because…" |

Result: 9 real people at 5 agencies (5 published, 1 pattern-guess, 3 other route), stated honestly as a shortfall with the top-up to reach 50.

**Fixed from the re-run:** "drop recruiters" contradicted a recruiting-firm ICP (now: third-party recruiters only; a recruiting firm's own recruiters are the buyers) · "email 80%" vs honest no-email rows (now "reach out to 80% by the route given") · undated team pages (a title on the company's current page counts as seen when read) · pattern from one example (labelled `pattern-guess (one example)`) · fetch tools miss protected emails (record "address on page, protected", never guess) · breadth before depth for names and titles. **Accepted, not changed:** a no-history top-up can't be priced — spend-gate's rule (the human names the ceiling, the first read shows the price) is the shared answer.

## Rescope to audience research (2026-10-18, after Akhil's hand test on GooseWorks)

**Akhil's verdict:** the worst of the six — "It told me who should I reach to, only one two names, nothing else. It should have given a broader view." The ask was "i want to do the audience research for gooseworks".

**Bugs found in the transcript (beyond his note):**
1. The ask was audience research; the playbook ran a cold prospect list — the job itself was wrong.
2. It stopped after ~12 web calls and 3 people at 2 agencies, then asked "which buyer should I go deeper on?" — the free-pass rule broken in spirit; the brand's main audience (consumer-brand marketers, per the brain's own audience text) was never researched.
3. Nothing was saved to the brand — the report lived only as a local file.
4. It used the no-coworker `brands/<slug>/` path prefix although the brand had a coworker, so the workspace read found nothing.
5. The report was a "Prospect report" with codes and agent notes, not something a founder could act on.
6. (Host, not playbook) one call went to production GooseWorks before switching to staging.

**What changed (rewrite).** research-audience is now audience research: who the audience is (2–5 named segments, the primary one named), what they want, their problems and how we solve them, their language, where they hang out (named communities, publications, podcasts, events with activity evidence) and how to find and reach them — with For you and How rivals talk to them. New `references/audience-research.md` (craft + report shape) and `atoms/segment-pass` (one worker per segment, every dimension, never stops to ask). Every report goes through `atoms/write-report` (local file with a clickable link or an artifact, saved to the brand with a link, §3 check). The prospect list is now **list mode**, only when asked (`references/list-mode.md` wraps the earlier fit, sourcing, people, signals, scoring and ledger atoms); its report section is written for a founder with no codes. Boundary: market size, trends and how people buy stay with research-market; this playbook reuses research-market's segments and voice-of-customer bank and never redoes them. The workspace line now says the `brands/` prefix applies only with no coworker.

**Open for the orchestrator:** research-market's description still claims "research my audience", "who should we target", "build me a persona", and it proposes the brand's `audience` field. After the split, those triggers and that proposal arguably belong here. Not changed (not my folder); this playbook does not write `audience` until the orchestrator rules.

**Sonnet re-run on Akhil's exact ask** (WebSearch + WebFetch only; ~78 calls):
| Check | Result |
|---|---|
| Asked first / stopped to ask "which segment" | **Pass** — no question before delivery; segment order and the top-up left as closing decisions |
| Web research | **Pass on volume, thin on quality** — Reddit, LinkedIn, X, G2, Capterra blocked for a fetch-only host; quotes came from Hacker News, Product Hunt, Shopify forums, Anthropic's case study, job posts — each labelled |
| Audience research, not a list | **Pass** — 4 named segments (agent-native operators primary, as "a best bet"; in-house growth leads; agencies; solo founders), each with wants, problems with how we solve them, 7–8 quotes, 4–9 named places, reach moves |
| Readable report document | **Pass** — `gooseworks-reports/gooseworks/2026-10-18-audience.md`, closing message three lines |

**Graded against write-report §3:** top five lines say what to do first and why (post a shown-work build in r/ClaudeAI, because the site pitches agent users, no rival does, and Meta just opened its connector) — **pass**; a non-marketer can follow it — **pass**; no ids, paths, tool or playbook names — **pass** (agent tools named only as the audience's own words); link opens — **pass** locally (brand link was a simulation placeholder). Weaknesses: ~4,200 words; "In short" bullets ran to paragraphs; a methods paragraph near the top. It also surfaced a real finding: the site sells a skill layer for agents while the saved brand text sells a coworker for consumer brands.

**Fixed from the re-run:** quotes — say who is speaking, prefer the last 12 months, employers' job posts aren't audience voice, and thin sources are stated, never padded · reach moves — three for the top one or two segments, one honest line for the rest · conflicting brand facts — rank on evidence and make the story choice the first decision · report length ~1,500–2,500 words, one-sentence "In short" bullets, no methods section at the top (limits go in "What we couldn't check").

**Schedules (AGENTS §8, updated 18 Oct):** the run now judges whether a repeat helps — a quarterly audience refresh only when the audience is moving, with the reason; never after a list-mode run.

## Senior-marketer review fixes (2026-10-18, research-review.md — audience 2.5/5)

Per AGENTS §2b each point was checked against the files and the re-run, not just applied. Positioning stays on the backlog (Akhil).

| # | Reviewer point | Verdict | What changed |
|---|---|---|---|
| R1 | One owner for buyer groups and the quote bank; distinct triggers (§6 #1) | **Agree** | This playbook now owns `research/audience/buyer-groups.md` and `voc-bank.md` / `.jsonl` (same row schema the makers filter on, plus `buying_role`, `source_class`) and proposes the audience field. New `references/quote-bank.md` (who counts as voice, sampling, integrity, tags, themes, skew, saved format). Description triggers are buyer/customer asks only and end "Not for market size, trends or pricing norms". research-market's half is its own session; pb-research was sent the paths and schema. |
| R2 | One upfront question for the brand's own customer data (§6 #2) | **Agree** | Before-you-start step 3: one specific export per company type (`audience-research.md` § Customer data), plus cancel reasons, win/loss and support themes; only when the brand has customers; "go" skips it. Customer data wins conflicts; only counts and patterns reach the brain. |
| R3 | Lead buyer rested on two people and a vendor blog | **Agree** | § Evidence bar: a lead group needs the customer data, or 5+ distinct first-hand people from 2+ kinds of source, mostly within 18 months; else "no clear lead yet" and the gap becomes a decision. |
| R4 | "Do this first" on a channel the run couldn't read | **Agree** | Moves rest on sources read; a move on an unread place is labelled "unverified — read the community and its rules first" and is never first (SKILL step 5, `audience-research.md` §6, segment-pass §4–5 mark each place read/unread). |
| R5 | Community size used as group size | **Agree** | Size in buyers or companies, bottom-up, inputs sourced or labelled; member counts are reach (§1, segment-pass §0, data-sources). |
| R6 | Agency blog copy and 2021–22 quotes as voice | **Agree** | quote-bank.md excludes vendor, agency, case-study (incl. a company about its own team), job-post and second-hand text; ≥70% of quotes from the last 18 months; old-dominated themes are "dated". |
| R7 | Solo founders ranked last despite the $29 price | **Agree, as a rule** | Ranking criteria now say price fit counts — a budget that matches our price is a fit. The ranking itself stays a per-run judgment. |
| R8 | No buying roles; no own users | **Agree** | Uses / pays / approves per group; customer data first. |
| R9 | Win/loss and churn missing (§3 #3) | **Agree** | "Why they leave" and "why we win or lose" tables where the brand has data; quote-bank tags `switch`, `why they left`, `why we won / lost`. |
| R10 | Over length; paragraph "In short" | **Agree** | Through write-report's budget (≤150-word In short, ≤3,000 body, ≤6 moves); the §9 example now has a decisions box, "what we're not doing" and a skew line. |
| R11 | Cadence: twice a year or on a trigger (§6 #8) | **Agree** | Step 9 and the tests; triggers: a new product, a new market, a shift in who buys or why they leave. Never after a list. |
| R12 | Sibling consistency / one "Do this first" (§3 #8) | **Agree** | Step 5 and §7: read the market and competitor reports and say in one line where this agrees or differs. |
| R13 | For B2B, offer the paid read in the opening message (§3 #7) | **Push back (partly)** | The opening slot is now the customer-data question, which changes the answer more than any paid read (the reviewer's own point 2); a second upfront ask breaks AGENTS §8 (paid reads never the starting point, one question). The reviewer also notes the gap is partly the browserless test host. Instead: when the forums that matter were unreadable, the top-up is the **first** closing decision, named by the gap it fills. |
| R14 | Three reach moves for every group (rubric M4) vs "three for the top one or two" (my last round) | **Comply, with a caveat** | Three moves per group; for lower-ranked groups they are small, cheap tests labelled lower priority. Risk: filler moves for weak groups — the evidence and read-only rules still apply to each. |
| R15 | Baselines to measure against (§3 #9) | **Not this playbook** | The listed numbers (mentions, AI answers, review count, alternative-search rank) are market and competitor baselines. The audience equivalent — group sizes and the source mix — is already saved for the next run's "what changed". |
| R16 | What buyers would pay (§3 #11) | **No change now** | It belongs to an interview kit, which doesn't exist; price-fit evidence from reviews and threads is already tagged `price / value`. Backlog with positioning. |
| R17 | Keep list mode's email/compliance rules out of the audience flow | **Already so** | They load only in list mode (`list-mode.md`). |
| R18 | Brand-watch mode, market frame-of-reference | **Not this playbook** | research-market's half. |

Flags for the orchestrator (other folders): makers and plan-campaign still read `research/market/voc-bank.*` and market's personas — move them to `research/audience/voc-bank.*` and `buyer-groups.md`; research-competitors' "who your buyers are → research-market" pointer is stale; this playbook now proposes `knowledge.audience`, so research-market should stop.

No Sonnet re-run this round (per the orchestrator); the eval suite scores next.

### Contract critic against the eval rubric (subagent, effort high)

| Finding | Verdict | Outcome |
|---|---|---|
| Example report titled "GooseWorks", with customer numbers, invites copying on the eval brand | Agree | Renamed "Acme Creative (fictional)". |
| "No clear lead yet" fails M3/E7 (a primary must be named) | Agree — reconciles R3 with the rubric | The top-ranked group is always named; below the evidence bar it is "provisional — <what's missing>", kept out of "In short" as settled, and the gap is a decision; the audience-field proposal is skipped for a provisional lead. |
| write-report's "≤ 6 moves" vs three reach moves per group (M4) | Agree | Here: group reach moves sit in their sections and don't count toward "What to do" (≤6). write-report itself is not my file — flagged. |
| "Do this first" has no owner (E3); "couldn't check" lacks what it would change and the group lists (E4); "In short" numbers unlinked (E2) | Agree | Fixed in audience-research §9 and SKILL step 7; write-report's own wording flagged. |
| "mostly" vs "at least 70%" recent | Agree | SKILL Done-when says at least 70%. |
| Leftover "research-market sizes them" while this playbook sizes | Agree | Market figures are context; group sizes are counted here (SKILL, data-sources, meta). |
| data-sources asks a probe yes then a ceiling yes | Agree | Copied §8: one yes, probe inside the ceiling. |
| Places count four per top group vs four for the lead | Agree | Four for the lead group, everywhere. |
| data-sources step 7 → step 8 | Agree | Fixed. |
| write-report banned list misses "free pass", "worker", "maker", "corpus" (E5) | Agree | Not my file — flagged. |

## Eval round 2026-10-19-v2 (with skill 12/18 must, baseline 5/18; $32.20, 40 min)

Each failure was checked against the with-skill transcript and report before fixing. No eval or Sonnet re-run this round (orchestrator).

| Check | Judge said | Confirmed? | Cause → fix |
|---|---|---|---|
| M9, E3 | "In short" led with a finding; "Do this first" sat near the end; >150 words | Yes (five paragraph bullets; "Do this first" was a section after the groups) | The report shape lived in write-report only and the run never followed it. `audience-research.md` § The report now gives the exact headings in order, bullet 1 literally "Do this first: move — who — because", and a count-before-handover list; SKILL step 7 says read write-report and use that shape. |
| M10, E5 | Playbook names and a file path in "What we're not doing" | Yes ("— research-market", "research/market/ from 18 Oct") | The run copied SKILL's Out-of-scope list. "What we're not doing" is now tempting moves for this brand, never a scope list; other work is named "the market report (18 Oct)", never a playbook, path or folder. Body 5,950 words → per-section word budget (lead ~900, others ~350). |
| M4, E10 | Only the lead group had problem → solution mapping and moves | Yes | Every group gets the same five parts (shorter for lower ranks, never missing one); the problems table carries solved / partly / not solved and proof status. |
| E6 | Moves without owner, needs, dated numeric check | Yes | Every move (group and "What to do"): who, what it needs, a success check with a number and a date. |
| E9 | Lead quotes ~43% from the last 18 months; trade-press and vendor lines as voice | Yes (Digiday's unnamed "brand rep", an ad-tool vendor blog, an agency founder's blog) | Workers never got the voice rules (they loaded the whole skill instead and skimmed). The worker brief now carries them inline; trade press and analyst articles added to the exclusions; the main run filters on return and counts the recent share, saying "thin on recent voice" when under 70%. |
| E2 | "via multiple secondary sources", bare domains, source name ≠ link | Yes | Every fact has its own inline link and date; a bare domain or "secondary sources" is not a source. |
| S3, S6 | No named-list offer; long closing message with file lists and a findings recap | Yes | Step 8 is now a literal three-line shape ending with "want a list of named people in <lead group>?". |
| "Agreement with the 18 Oct campaign plan" | — | Contamination (an earlier run's plan on the shared staging brand) | Ignored; the consistency rule itself is right. |

**Cost — the main fix.** The run spent ~95% of its cost in 20 subagents: the main run started four group workers, each group worker started five more (per source and topic), and **every one loaded the whole skill** (21 loads). About 1,100 web calls and ~60M context tokens. Changes:
- Depth matches the ask: quick (no workers, ~20 calls), standard (default: at most three group workers, one level, ~80 calls in all), deep (on request or after the paid yes: up to five workers, same caps).
- The worker brief is `atoms/segment-pass` pasted whole (≈800 words), opening "don't load any skill, don't read playbook files, don't start other agents". Workers never start workers; never one per source or topic.
- Per worker: at most 12 searches and 10 page reads, search before fetch, page reads asked for exact sentences, a return of at most 700 words.
- Report written once; the brand copy is the same text.
Expected per standard run on Sonnet: roughly $3–6 (three workers ≈ $0.7 each, main ≈ $2–3), 10–15 minutes; quick ≈ $1–2. An estimate from token counts, not measured.

**§2b pushbacks**
- **S2 (five linked quotes for every group): keep five for the lead, three for others.** Five for every group is what produced the padding the senior review flagged (agency blog copy to hit a count) and costs a worker's budget on low-ranked groups. The senior review's own check (A3) asks three per top group. Lower groups say "thin" when they have fewer.
- **Depth vs cost:** the lead group will carry fewer quotes than this run's 13 (5–8). That is the right trade for a customer paying per run; the quality checks are about who is speaking and how recent, not volume.

### Contract critic after the eval fixes (subagent, effort high)

All agreed and fixed: 70% recent in every group's report quotes (older rows stay in the bank) · problems table gains quote + link + date · worker return fields carry dates · a 4th/5th group's moves labelled unverified unless resting on a read page · repeat offer states cadence · workers make no GooseWorks calls · quote-bank sampling and saving moved to the main run, written once, re-check capped at 3 · sibling reports read once in step 2 · write-report's "offer to open it" skipped (step 8 is the whole message) · the report's banned list adds worker, free pass, corpus, maker. Flagged to the orchestrator (not my file): write-report's own banned list should add those four words.

## Lead gen completed (2026-10-19, Akhil: "complete lead gen")

**Input.** The old-vs-new review of 72 old lead-gen, outreach and sales skills (`marketing-agent-test/results/old-vs-new/leads-outreach-sales.md`). Old skills were read **as reference only** this round (orchestrator's permission), through two subagents that extracted craft into notes; structure and vendor wrappers dropped. A third subagent mapped the server's lead routes in gooseworks-app `origin/dev`.

**What changed in list mode**
- **Straight to the list.** A list ask no longer runs the audience pass first; it starts from the saved buyer groups or drafts the fit from the ask, site and brain, and offers the audience report afterwards (the old flow made list users wait through research they didn't ask for).
- **Three jobs, picked from the ask:** build a list; **score a list they bring** with inbound triage (`references/score-a-list.md`: free-mail check, hard yes/no and confidence rules, a 10-row calibration table shown with the rest, urgency tiers with response times, boosters and dampeners, the action table, referral / nurture / polite no); **standing watches** (`references/watches.md`: champion moved by snapshot-then-compare on the paid profile read, account hiring, switch intent; created paused with a standing ceiling).
- **Sources by situation** (`references/list-sources.md`): database (when routes exist), switch intent (pain words not solution words; nine kinds of buying language with strengths; the Hacker News search API, free), hiring (role map, tiers by post age, one level above the role), new leaders, rivals' customers, events (speakers, sponsors, exhibitors — never attendee lists), developer activity (GitHub weights, multi-repo people, 3+ people at one company = adoption, write to the buyer; no commit emails), ad libraries, past champions, directories.
- **Signals table** gains switch intent, rivals' customers, event roles and developer adoption, with windows and strength anchors.
- **Speed and cost:** at most three workers on short briefs, 25 searches + 20 reads each, ~100 web calls for a 50-row ask; bigger asks deliver the full account list with people for the top accounts.
- **Server routes** (`server-needs.md`, rewritten): exact paths and prices for email check (first), work-email find, people search and company search; never the deprecated Apollo search, phone finders or personal modes; cost and approval rules (count and sample before reveals, cheapest first, stop at three good people, check every address). `data-sources.md` § When the contact routes exist tells the run to use them as soon as the connector lists them; until then it works honestly as before.
- **The list leads somewhere:** the closing decisions offer the messages for the list (write-outreach); `score-segment-qa` no longer says "the human writes from the angle".
- Shared: `outcomes-ledger` adds write-outreach as a loader, `sequence_id / last_touch / reply_category` columns and the 12-week cool-down after a sequence ends with no reply.

**Never brought back:** scraping who liked, reacted or commented; personal emails and phones; attendee and RSVP lists; commit emails; Smartlead launching; SMS; Supabase pipelines; any committed real-people data (all examples fictional, `.example` domains).

**Evals written, not run:** `evals/playbooks/research-audience-list/` (the marketer asks for the list — the 19 Oct scenario always declined it) and `evals/playbooks/write-outreach/`; legacy mappings added; 10 routing cases added and R07/R43 re-pointed.

### Round 1 on list mode — depth (senior demand-gen) and adversarial walks (2026-10-19, subagents, effort high)

| # | Finding | Verdict | Fix |
|---|---|---|---|
| 1 | ~100 web calls can't build 50 people at 13–20 lookups each | Agree | The report's first line says what the free pass builds: the full account list with gates and signals, people with routes for the top 10–15 accounts, the rest "people to find"; the routes build every row once they exist |
| 2 | Many reference lines still said "ask" before rows; the outcomes ask could fire first | Agree | Every such line now "assume, label, correct after rows"; customer list, outcomes and open fit lines move to the closing decisions; fit-definition no longer "plays back for a yes" |
| 3 | Unchecked addresses sat in the sendable `email` column | Agree | `email` holds only checker-passed addresses; published and pattern-built ones go in `email_candidate` |
| 4 | Attendee and buyer lists allowed in three files, banned in one | Agree | Exhibitors, speakers and sponsors only, everywhere |
| 5 | Handles could be matched across sites; GitHub's terms on unsolicited email | Agree | A row only from the author's own profile on the same site; never cross-site matching; GitHub → accounts only, never developers |
| 6 | Inbound triage dropped demo requests; no lead age; no cap on huge exports | Agree | Nothing that asked is dropped; `lead_age` + overdue flag; score from the file first, fill gaps for the top ~100 only |
| 7 | GitHub keyless rate limit; star/watcher weights | Agree | Company lookups for the top ~50 only; stars and watchers dropped; usage from manifests and imports, not interest |
| 8 | Switch-intent searches outran the budget; windows disagreed; no rival-event trigger | Agree | Top two queries per kind, one 30-day window; "rival event" signal row |
| 9 | Stale step numbers; list report had two shapes | Agree | Load lines renumbered to list-mode's order (with a 5b hooks step); the list is its own report |
| 10 | Two checks on every address; providers check unspecified; wrong spend-gate section | Agree | One checker, a second only on `unknown`; read the provider list from the tool description and probe once; § C |
| 11 | Watches had no state; one alert per person forever; no cost | Agree | `watch/queries.md`, `watch/seen.csv`; alerts keyed on person + new employer; cost per run stated |
| 12 | No account-list refresh (tam-builder) | **Backlog** | BACKLOG #19 (standing account list), built when the connector has company search |
| 13 | No developer-tools row; Product Hunt; small-company job boards; lessons logic | Agree | Row added; Product Hunt source; Workable, Wellfound, Indeed; lessons use write-outreach's reading-results table |
| 14 | No retention; phone routes | Agree | Never-contacted ledger and watch rows deleted after 12 months (suppressed keys kept); phone only a business's published main line, after DNC/TPS checks |
| A1 | A consumer waitlist would be scored and looked up by name | Agree — the worst finding | Consumer test first in score-a-list: no lookups, no ledger rows, no outreach list; pick who to talk to; email-lifecycle for any email |
| A2 | Companies House match by name could mark a sole trader emailable | Agree | Match on registered address or an officer; webmail-only shop with no matched company = sole trader; a `UK-ltd` flag |
| A3 | Angles didn't reach write-outreach | Agree | `segments.csv` written next to `list.csv` |
| A4 | "…then write the emails" still got an offer | Agree | When the ask includes the messages, list mode goes straight on to write-outreach |
| A5 | write-outreach results never read here | Agree | Step 2 reads the newest `outreach/*/results.md` for referrals and lessons |

## Run memory and the Brand Brain (2026-10-19)

Wired run-memory (`references/run-memory.md`): jobs `audience research`, `prospect list` (subject = the list), `lead scoring`, and one per watch. "Since last time" recounts what earlier lists and alerts led to from the outcomes ledger (per list, segment, source and signal), checks last run's moves, and steers this run (weight what replied, demote what didn't, with the sample-size rule). Records hold counts and links only — **no ledger keys**, since person keys are emails or profile URLs. Reads go to `brain_map` first (with the waiting-for-yes items) and fall back to `brand_read`; the buyer-group proposal becomes one `brain_save` `audience` item per group when the brain is listed (waits for the marketer's yes), else the `brand_update` proposal. The outcomes-ledger atom gained a "With run-memory" section (ledger = per-row truth, record = summary + link, recount don't carry, restate on change) and the `first_touch_date` and `recontact_after` columns from the write-outreach critique (logged there).

### Codex review of PR #322 (2026-10-20)

| Finding | Verdict | Fix |
|---|---|---|
| outcomes-ledger (owned here) kept raw addresses forever for suppressions, and created rows for unmatched stops/bounces (MAJOR) | Agree | New § Suppression without personal data: `key_hash` (SHA-256 of the normalised key); a suppressed row keeps only the hash, reason, date and list id; unmatched stops get a hash-only row; a host that can't hash stores nothing and asks once before keeping a raw address; people-and-contacts drops candidates whose hashed keys match before any paid lookup |
| Direct `brain_save` for audience records | Allowed (AGENTS §8, 20 Oct ruling) — checked | The save is `status: found`, `is_public: false`, and each item waits for the marketer's yes in the app; never called confirmed |

## 2026-10-20 — hand-test review (Akhil + marketer reviewers)

From the cold-outreach hand test (session 8571396a): the paid list run delivered 41 people and 0 email addresses for an email sequence; the list was built for the group ranked #3 with 0 confirmed members, passed in from a stale pack; the lead group rested on 6 reviewers, 5 of them Trustpilot complaints about rivals.

| Finding | Fix |
|---|---|
| The email gap (no finder or checker on the connector) was only said after the paid run | list-mode § Before building: the first lines of the first message say it, before any top-up is offered; SKILL step 6 points there |
| A stale group name from an older pack drove the build | Re-read the **current** buyer groups at run time; if the asked group isn't the lead, one line before building; a group carried only from an old file → build the current lead |
| Accounts came from the model's memory of well-known brands | account-sourcing step 0: every account from a named, dated search; marketers → ad-library keyword or category search, page by page, never scripted paging |
| "Most ads wins" picked enterprises for a low-price tool | list-by-company-type: an ad-count band (≈5–60 live ads, creatives > 30 days) for low-price self-serve tools |
| A lead rested on rival reviews only | Evidence bar: one kind of source must not be rival reviews |
| Groups shown without any size | An order of magnitude whenever any proxy exists, labelled rough |
| The paid forum read was one decision among several when Reddit/G2/LinkedIn were blocked | Step 8: it is always the first decision then, worded as what it settles |

### Report top (write-report shape)

| Finding | Fix |
|---|---|
| Reports opened with "Do this first" before the reader knew what was researched, so the move couldn't be judged (Akhil; 4 marketer reviewers: keep the answer on screen one, but rest it on findings shown above it) | In short now: "What we looked at" (scope, sources, date, main limit) → 2–3 numbered findings with how sure (confirmed / likely / first look) → "So, do this first (because of 1 and 2)", naming the findings; a first-look base makes the first move the one that closes the gap (write-report §1) |
| In short stated provisional or first-look things as fact; counts described a different thing than the claim beside them; first moves assumed unconfirmed assets | write-report §3 checks, now blocking: nothing stronger than the body, every number counts exactly its claim, no unconfirmed asset in the first move (→ "confirm X" or a decision) |
| "Your most likely paying group" in In short while the lead was provisional | In short names a provisional lead as provisional, and the first move closes the evidence gap; example rewritten in the new shape (146 words) |
| List report top | "What we looked at" (sources, asked group, what the free pass covered) before who to contact first |
| Test | test-by-hand item 5 checks the new top; a fail line for the 20 Oct case |

### Review fixes on this change set (second pass)

| Finding | Fix |
|---|---|
| skill.meta.json said buyer groups and the quote bank are read by "the ad and video makers"; video ads are held back | Now "the static-ad maker (make-static-ads)", in the meta and the SKILL's write-back table. |
| write-report's new top rules copied into Done when and test item 5 | Both point at write-report §3; the playbook's own checks stay (provisional lead, agreement with sibling reports, saved groups and bank). |

## 2026-10-20 — Writing-for-Agents pass (items 1, 2, 4)

| Finding | Change |
|---|---|
| Copied setup (get_started, tools_load groups, connection line, `client`, brain_* and brand_read reads, found vs confirmed, coworker scope) | One "Setup first" line to guide §1–2, plus what is unique: the chapters to open, the fallback brand_read sections, the files this job reads, the outreach request lines |
| One-time import of an older market quote bank, already in quote-bank.md | Removed from SKILL.md |
| "AGENTS §8 research pattern", "AGENTS §8 Schedules", "(D3)", "See server-needs.md" | Guide §3 **Research pattern** and **Schedules**; the other two removed |
| "Aim for a few dollars a run" (the marketer sees credits, never dollars) | "Keep to these call caps; paid reads are credits, only after the one credit yes" |
| Step 3's 70% recency rule copied quote-bank.md § Sampling | Pointer; Done when checks "the quote bank's recency rule" |
| Step 6 copied list-mode.md § Before building, delivery and connector notes | Pointer to list-mode.md (list mode stays in SKILL.md; moving it is item 3) |
| Step 7 restated write-report's checks and delivery | Deliver through write-report with this job's topic and brand path; the brain_save field list stays |
| Step 9 restated the default cadence and spend-gate §C | Pointer to guide §3 **Schedules** |
| Done when pointed at a "step 3 budget" that is not in step 3 | Now "the Standard depth caps above" |
| Description 1,016 characters, opened with a definition, not a leading word | 745 characters, leading with "Audience research". All expected routing cases still have a matching phrase; R76 (developers using a rival's open-source repo) rests on "find accounts to pitch" |

## 2026-10-20 — Codex review round 2

| Finding | Fix |
|---|---|
| B10 `server-needs.md` named `atoms/spend-gate` | "the spend-gate skill". |
