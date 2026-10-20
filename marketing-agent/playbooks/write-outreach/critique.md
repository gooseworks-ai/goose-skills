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
