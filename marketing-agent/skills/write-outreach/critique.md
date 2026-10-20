# Critique log — write-outreach

Every round: the finding, the fix, or why it was rejected. Critics are subagents (effort high; final round xhigh). Built 19 Oct 2026 from the orchestrator's "complete lead gen" brief and the old-vs-new review (`marketing-agent-test/results/old-vs-new/leads-outreach-sales.md`, gap 1).

## Round 0 — design (2026-10-19)

**Why it exists now.** The review found the list dead-ends: "write a cold email sequence" routed to nothing, while the old library had ready craft. Akhil overrode the backlog decision for the writing half; sending stays on the backlog (the only GooseWorks mailbox is a new @agentmail.to inbox, wrong for cold email).

**Craft taken from the old skills** (read as reference only; structure and vendor wrappers dropped): email-drafting (structure, frameworks, personalisation depth, subject lines, sequence design, hard rules); linkedin-message-writer (types, limits, rules); linkedin-outreach (lead source → sequence; cool-down); hiring, leadership-change, funding, champion-move and news signal outreach (angles and timing); customer-win-back-sequencer (window, churn reason × change, score); sequence-performance (per-touch reply rate, sample sizes, reply categories, what to fix); cold-email-outreach (one column per touch hand-off); disqualification-handling; sales-call-prep objections.

**Dropped on purpose:** client examples and their proof lines; the old "3–4x more effective" style numbers (no source); open-rate benchmarks and open tracking (Apple Mail inflates opens; tracking pixels hurt delivery); lead sources built on people who liked or reacted to posts; "#OpenToWork" and "same school" hooks; guessed personal emails and phone calls; launching campaigns from the agent.

**Conflicts in the old craft, settled:** subject length — write under 50, QA fails over 60; LinkedIn connection note — write to 200 characters (free accounts) unless the marketer says paid (300); new-leader timing — weeks 2–8 best (the old tiers said under 30 days, the tips 30–60); funding — never open on the amount; win-back score bands — high ≥ 8, medium 4 to under 8, low under 4 (the old bands had gaps).

**Fictional examples** use the accounts-payable seller from research-audience's references (never the eval's prospects or GooseWorks), so nothing in the references can be copied into a run.

## Round 1 — depth (senior outbound lead) and adversarial walks (2026-10-19, subagents, effort high)

| # | Finding | Verdict | Fix |
|---|---|---|---|
| 1 | The "we use a rival" answer said "most teams we talk to do" — implies customer conversations GooseWorks doesn't have (the eval's M8 reply) | Agree | "Makes sense — <rival> is a solid choice"; a rule against implied customers or usage |
| 2 | Follow-ups allowed a "peer example", inviting invented peer stories | Agree | Signed-off proof only; else a general practice framed as such, or a resource |
| 3 | Free LinkedIn accounts can add notes to only a few invites a month | Agree | Said in the limits; at volume the invite goes without a note and the line moves to message 1 |
| 4 | Sequence and send file implied 8 touches | Agree | At most 6 in all (4 emails, the request, one LinkedIn message); columns trimmed |
| 5 | Volume counted new people, not emails | Agree | 30–50 emails a day per mailbox in total; never cold-email from the main domain |
| 6 | GDPR Art. 14 stated as "on request" | Agree | The source-and-object line in the first email for EU-UK and unknown-country rows |
| 7 | Email statuses didn't match research-audience; catch-alls contradicted | Agree | Mapping table; `email_to_check` column; research-audience now puts only checked addresses in `email` |
| 8 | Angles weren't in a file this playbook reads | Agree | research-audience writes `segments.csv`; read with the list's `report.md` |
| 9 | Cool-down could never start | Agree | Results mode asks once when touch 1 went out; sets `contacted`, `sequence_id`, `last_touch` |
| 10 | Sample-size rules contradicted | Agree | Judge on replies: under ~10 positive per group = directional; same rule in the ledger |
| 11–12 | Test C expected guessed suppressions; category names drifted | Agree | Test asks for who; decision table uses the category ids |
| 13 | No quote bank → invented buyer words | Agree | Two or three free searches, else "not yet from buyers" |
| 14 | The pack would break write-report's 3,000 words | Agree | Body holds sequences once and 3 sample first lines per segment; per-person text in the send file or an appendix; Sources with a skew line |
| 16–17 | Pseudonymous posts; "replace the hire" wording | Agree | Real-name posts only, never link accounts; "ready before the hire" |
| 18 | CAN-SPAM and AU details incomplete | Agree | Identifiable as commercial, opt-out live 30 days; AU 5 business days |
| 19 | Thin send-file hand-off | Agree | `row_type, account_id, other_contact_route, timezone, start_day, day_n, letter_body`; CSV quoting; how to map to tool steps |
| 20 | Missing reply types | Agree | `how-did-you-get-this`, `no-show` |
| 21 | Example names overlapped the eval's prospects | Agree | Examples renamed |
| 22 | Eval M6 asks for UK/EU guidance though the pasted rows have no region | **Keep the check, change the playbook** | A real marketer pasting rows has no region column either; unknown-country rows now get the strictest-likely treatment and the pack always prints a one-line country summary — so M6 is fair |
| A1 | Consented consumers (waitlists) would get a cold B2B sequence | Agree | Mode check: consumers who signed up → email-lifecycle, one line |
| A2 | Counts-only results leave angry and not-relevant people live | Agree | Ask once for who; the next list holds those accounts until then |
| A3 | Retail pitches got a SaaS sequence and invented margins | Agree | A retail-buyer shape (no LinkedIn for independents, samples, line sheet); "wholesale terms needed" as a decision |
| A4 | Unnamed referrals ("talk to our CTO") | Agree | A `Find needed` request line to research-audience, never a guessed person |
| A5 | One angry reply stopped everything; small samples triggered big changes | Agree | One angry reply suppresses one person; under the sample line, fixes are said as hints |

## Round 2 — final contract review across both playbooks, shared files and evals (2026-10-19, subagent, effort xhigh)

16 findings, all agreed and fixed: unchecked addresses can no longer reach `email` (people-and-contacts writes `email_candidate`; the send file treats any unverified `email` as unchecked); the pack's brand copy holds no person's name, company or first line (same for score-a-list's report); `UK-ltd` and `US` flags handled on both sides; results mode delivers the read first and asks in its closing decisions; pasted rows are ledgered so replies can be suppressed; `Hold / Find / Quote` request lines live in `results.md` and research-audience reads all open ones; `segments.csv` and `catch-all.csv` documented; `account-to-find` row type skipped here; an inbound-replies mode for leads who asked (`consent_basis: asked-us`); daily volume and sample-size rules aligned; QA no longer narrates itself in the pack; the router's one exception for "find leads and write my emails" plus a routing case; small drifts (reply categories, one checker, `hook_date`, worker caps, LinkedIn message length, README count, guide paths). Not fixable here: AGENTS §8's folder list lacks `outreach/` and its learnings-prefix line names only research-audience for `[outreach …]` — flagged to the orchestrator.

## Round 3 — run memory and the Brand Brain (2026-10-19)

**Built:** run-memory wired in (`references/run-memory.md`): job `outreach`, subject = the pack, so a results read two weeks later finds the pack's record; "since last time" recounts reply and meeting rates **per segment and per opener** from the ledger; recommendations ("send first", proof sign-offs, fixes) carry ids, owners, review-by dates and a ledger-based test; the record holds counts and links only. Every row gets an `opener_id` and a `<pack-slug>:<shape>` `sequence_id` in the send file and the ledger at delivery. Reads go to `brain_map` first with the `brand_read` fallback.

**Critique — a second run on 2 Nov after pasted outcomes (subagent, effort high):**

| # | Finding | Verdict | Fix |
|---|---|---|---|
| 1 | Start recounted before the paste reached the ledger → "nothing since" | Agree | Results mode writes the paste to the ledger first, then recounts |
| 2 | Rates per segment impossible when only repliers can be matched | Agree | Unattributable totals recorded as `reported, not in ledger`; counts without rates; the sent list asked for in the closing decisions |
| 3 | No first-touch date in the ledger (status_date is overwritten) | Agree | `first_touch_date` column, never overwritten — anchors rates and the cool-down |
| 4 | A proof line counted as signed off from chat or a claim search hit | Agree | The recommendation can be `done (marketer's words)`, but the line is used only after claims-gate records it or the brain shows it confirmed |
| 5 | run-memory allows "the row keys of the playbook's own ledger" — person keys are emails | Agree, not my atom | Our run-memory files forbid ledger keys; flagged to the orchestrator for the atom |
| 6 | The imported results read had no personal-data rule | Agree | Brand copy holds counts, rates and fixes only; per-reply notes and request lines in `results-working.md` (not imported) |
| 7 | Three sample-size rules | Agree | One rule: under 50 contacted → counts only; under ~10 positive → directional (reading-results, the ledger, both run-memory files) |
| 8 | `sequence_id` reused across packs, and written twice | Agree | `<pack-slug>:<shape>`, written once at delivery |
| 9 | `[outreach]` prefix had two writers | Agree | write-outreach uses `[outreach-copy …]`; save-learning and AGENTS need the new source — flagged |
| 10 | A "take me off" from an unknown address was never suppressed | Agree | It gets a new suppressed row (key, reason, date) |
| 11 | "Try in Q1" replies weren't excluded | Agree | `recontact_after` column, honoured by the exclusion step |
| 12 | Rates stored three times; wrong lessons path; titles without the slug | Agree | Record links the read and lessons; lessons path fixed; pack and results titles carry the slug |

## Round 4 — Codex review of PR #322 (2026-10-20)

| Finding | Verdict | Fix |
|---|---|---|
| run-memory let a claim be used because the brain shows it `confirmed`, bypassing claims-gate (MAJOR) | Agree | Proof comes only through claims-gate (its §1.5 checks confirmed brain claims against the full record); no direct use of brain statuses or search hits; the "since last time" example says the line is used only if the check passes |
| Unmatched stop/bounce created a row holding the raw address, kept forever (MAJOR, outcomes-ledger) | Agree | reply-reader writes a suppression-only row with a one-way `key_hash`; the raw address only on the marketer's yes; the send file matches hashed keys |
| run-memory read the request lines from `results.md` | Agree | Reads and links `results-working.md` for per-reply state and request lines; `results.md` stays aggregate |
| `outreach-copy` source | Checked | Registered centrally; this playbook writes `[outreach-copy …]` and reads both `[outreach …]` and `[outreach-copy …]` |

## Round 5 — second Codex review of PR #322 (2026-10-20)

| Finding | Verdict | Fix |
|---|---|---|
| Positives counted twice: "interested + meetings", while a booked row keeps `reply_category: interested` (MAJOR) | Agree | Positive = distinct rows where `reply_category` is `interested` or `status` is `meeting`; meetings reported separately as a subset — in reading-results.md and both run-memory files (write-outreach, research-audience) |

## 2026-10-20 — hand-test review (Akhil + marketer reviewers)

Akhil: "it created the audience, then didn't point me to how I find the leads I have to email." Validated as right by the reviewer (session trace).

| Finding | Fix |
|---|---|
| Step 4 only handled "no list **and** no buyer groups"; with groups saved, it silently wrote templates | Step 4 now keys on "no list on file", groups or not: still writes the sequences, then the no-list closing |
| Step 8 forced "**Send first:** <segment, N a day>" with zero people ("in-house growth leads, 10–15 a day") | No-list closing opens "**Before you can send:** you don't have anyone to send these to yet", offers (a) *build the list* — about 50 companies and their buyer, saying plainly it can't find or check emails and that the marketer runs a finder and checker (example tools named, as the marketer's own step) — and (b) paste a list. Never a send volume without people |
| The list offer was the 5th bullet under Decisions | It is now the opening block |
| No end-to-end picture of who does what | `references/handoff-and-compliance.md` § The whole path: offer → mailboxes from day 1 → 300–500 accounts (41 people ≈ 1 reply) → people and emails → copy → load → replies, agent vs marketer; in the pack when there's no list or it's the first pack |
| Prices in copy came from the brain, not live | Step 6: every price or offer re-read live (guide: live facts before copy) |
| Sender assumed silently | A decision: the person who runs the buyer calls may sign better |
| Sequence would land in BFCM for DTC targets | Step 1 timing check against the buyer's calendar: LinkedIn now with a January angle, or hold |
| Routing: demo-request replies and reconnects | Description triggers added; automated list emails stay with email-lifecycle |

Test D added to `tests/test-by-hand.md`.

### Report top (write-report shape)

| Finding | Fix |
|---|---|
| Reports opened with "Do this first" before the reader knew what was researched, so the move couldn't be judged (Akhil; 4 marketer reviewers: keep the answer on screen one, but rest it on findings shown above it) | In short now: "What we looked at" (scope, sources, date, main limit) → 2–3 numbered findings with how sure (confirmed / likely / first look) → "So, do this first (because of 1 and 2)", naming the findings; a first-look base makes the first move the one that closes the gap (write-report §1) |
| In short stated provisional or first-look things as fact; counts described a different thing than the claim beside them; first moves assumed unconfirmed assets | write-report §3 checks, now blocking: nothing stronger than the body, every number counts exactly its claim, no unconfirmed asset in the first move (→ "confirm X" or a decision) |
| Another session overwrote 2026-10-20-outreach.md | write-report §2: never overwrite a report — add the job slug, then -2; same for the brand copy's workspace path (except supersede records) |
| Pack and results In short | What we read and the findings (with sample sizes and how sure) before who to send to first or the fix; outreach-qa check updated |
| Consistency pass: step 6 cited "live facts before copy", a rule name the guide doesn't use | Now cites the guide's "Live facts" rule, §3. |

### Review fixes on this change set (second pass)

| Finding | Fix |
|---|---|
| write-report bans vendor names and its check now blocks delivery, but the pack's whole-path table names Apollo/Hunter/ZeroBounce/NeverBounce | write-report §1 and AGENTS.md §5 carry one exception pointing at the guide §3 rule: two or three outside tools the marketer runs themselves, as examples, never an endorsement. outreach-qa's pack check now points at write-report §3 and states the exception. |
| The no-list closing offered "about 50 right-fit companies" while handoff-and-compliance says a readable test needs 300–500 accounts | Step 8 offers a first batch of about 50 and says plainly a readable test needs 300–500 accounts, built in batches. |
| Two versions of the live-facts rule (here: always re-read today; guide: only when > 14 days old) | The guide's rule is now: prices, plans, free offers and credit amounts in copy, a plan or a forecast are always re-read live in the same run; other facts when > 14 days old or sources disagree. Step 6 points to it without restating. |
| Owner (Akhil): never asks which sending tool the marketer uses | Step 5: the sending tool is one decision, asked once in the first pack's decisions (the guide's "The marketer's own tools"); `references/handoff-and-compliance.md` § Your sending tool: none → two or three options that fit, as their choice; connected → read sends, replies, bounces, sending domains (read-only, never sends or changes anything); not connected → one line on connecting, then pastes. `reading-results.md` reads results from a connected tool. |
| SKILL.md +15.7% vs origin/dev | The counts-only and `Hold needed` detail moved to `references/reading-results.md` § Counts only; In short now points at write-report §1; a duplicate lessons path dropped. 2,179 → 2,503 words (+14.9%). |

## 2026-10-20 — Writing-for-Agents pass (items 1, 2, 4)

| Finding | Change |
|---|---|
| Setup copied from the guide (connect, `get_started`, `tools_load`, `client`, scope, brain_map core, "waiting items never proof") | Before you start #1 is the guide's setup line; #2 keeps only the outreach reads: chapters 14, 22, 23 and products, the brain_search focus, the fallback `brand_read` sections, the claims read step and the workspace files. |
| What you get #1 restated write-report's shape (3,000-word body, In short, not-doing, couldn't-check, source skew) | One line pointing at write-report, then only the outreach additions. |
| Two win-back triggers in the description ("win back accounts that churned", "reconnect with accounts that went quiet") | Merged into one; description 1,007 → 680 characters. Consumer win-back still routes to email-lifecycle. |
| Not changed (item 3, later) | The no-list closing and the results branch stay where they are. |
