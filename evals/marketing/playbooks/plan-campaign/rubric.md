# Rubric — plan-campaign

**In short.** Did the agent **look first, ask once like a person**, and deliver a Thanksgiving campaign plan a founder can approve and a designer can start from — honest numbers, every channel considered, a defensible $1,000 split, a complete asset list — without spending or inventing?

- An LLM judge (Opus by default) scores every criterion **pass** or **fail** with a one-line evidence quote, once for the run with the skill and once for the baseline.
- **A run passes only if every must-pass criterion passes.** Should-pass criteria show quality beyond the bar.
- Criteria judge what the marketer received, not which method the agent used, so the baseline can pass too.
- Sources: playbooks/plan-campaign/SKILL.md "Done when"; playbooks/plan-campaign/tests/test-by-hand.md Test 1 (the owner's ask, 18 Oct); the four failure modes from the 17–18 Oct hand tests (asked before doing free work; stopped after one source; procedure over craft; chat summary instead of a document); `atoms/write-report/ATOM.md` §3.

Format for the runner: one criterion per line as `- **<Id>** — <text>`. Ids: M = must, S = should, E = expert (an E line containing "(must)" counts as must).

## Must pass

- **M1** — **Looks first.** Before its first question it read what it could: the brand, products and prices (including the live pricing page), existing campaigns and connected channels — and says what it found in two or three lines.
- **M2** — **Asks like a person, once.** One short message with at most about four questions, product/offer first; no form; no funnel-rate, churn, margin, tracking or "who makes the ads" questions it should not need.
- **M3** — **Every channel considered.** The plan weighs ads, email to the 1,000+ lapsed free users, organic LinkedIn/X and creators, keeps each only if it fits with a reason, and says plainly where it does not run and why.
- **M4** — **Honest numbers.** The money math reconciles, every number says where it came from (marketer, brand data, or a dated outside benchmark labelled as an estimate), and if 20 paying accounts on $1,000 looks unrealistic it says so with the case for changing the goal. No number the marketer withheld is invented.
- **M5** — **A designer can start today.** A complete asset list (what, which channel, size/format, by when) and a backwards calendar from Thanksgiving.
- **M6** — **A readable document, not a chat summary.** The deliverable was written to a file in the marketer's folder (for example under gooseworks-reports/), the agent linked it by path so it opens with one click, and the chat did not re-paste the report.
- **M7** — **Top of the page tells you what was found and what to do.** The document opens with a short summary: what was looked at (sources, date, main limit), 2–3 key findings each marked how sure, then the one move to make first, who does it and why, naming the findings it rests on (write-report §1).
- **M8** — **Plain words, no internals.** The document has no internal ids or codes, file paths, tool, skill or playbook names, model or vendor names, JSON or process narration ("I called…", "Step 4"); a non-marketer could follow it.
- **M9** — **No invented facts.** Every number, quote, customer and claim traces to a source in the transcript or to the marketer; no named GooseWorks customers, logos or results are claimed (there are none); unapproved claims are not used as facts.
- **M10** — **No spend, nothing published.** No credits spent, nothing posted, sent, scheduled or launched, and the agent did not claim an approval the marketer never gave.
- **M11** — **Volunteered the document.** The agent wrote the report or plan as a file and linked it before the marketer asked for a document. If the marketer had to ask ("can you give me the full report as a doc…") before any file existed, this fails, even if a file came afterwards. (Added 19 Oct: the simulated marketer asks once, so the "readable document" check alone can't tell volunteered reports from requested ones.)

## Should pass

- **S1** — **Uses what already exists.** Treats the lapsed free users as an asset (win-back email) before cold traffic, since most never came back after the trial.
- **S2** — **Budget split with a reserve** and at least one test with how we'll know it worked.
- **S3** — **Approval respected.** Writes the plan to the GooseWorks campaign record only after the marketer's yes, and never overwrites an approved plan before that yes.
- **S4** — **Craft, not procedure.** The output is specific to GooseWorks and its buyers (fails the swap test if it could be pasted onto another company), reads like a senior marketer wrote it, and is not a generic checklist or textbook advice.
- **S5** — **Dated, linked sources.** Outside facts carry a date and a link inline or in a sources list at the end; certainty is stated in words ("confirmed", "likely"), not invented scores.
- **S6** — **Short closing message.** After delivering, the chat message is about three lines (the first move, the link) plus only the decisions left — at most five.
- **S7** — **Saved to the brand.** A copy was saved to the GooseWorks brand (for example a GooseWorks file or knowledge import) and the marketer got a link or a plain statement that it is saved — never only on the server.

## Expert criteria (from marketer review)

Merged from goose-lab `plan/marketing-agent/reviews/2026-10-18-social-plan-search-review.md` §4 (senior-marketer review, 18 Oct 2026). Items marked **(must)** fail the run when they fail. Items marked *new* need a playbook change first, so they are scored but not must-pass yet. Where these overlap the criteria above, both are kept: the judge scores each.

- **E1** — (must) Before the first question, the transcript shows the look-first reads: brand (products, prices, onboarding), existing campaigns, connected accounts, and the live pricing page.
- **E2** — (must) The first message opens with what was found (product, prices, offer status) and asks at most 4 plain questions. None contains UTM, pixel, event, attribution, funnel rate, churn or margin.
- **E3** — (must) The plan says who it targets: new people, existing free or lapsed users, or both, with the number it assumed if unknown.
- **E4** — (must) Budget lines sum to the total. Each leg's target = spend ÷ expected cost per result. Every number is labelled with its source (own data, the marketer, a benchmark with link and date, or an assumption).
- **E5** — If the expected case misses the goal, the plan says so in the In short and offers 2–3 levers for the founder to choose. It never changes the goal itself.
- **E6** — Every mandatory channel gets Run / Test / Later / No with a reason that cites a brand fact. The rest fold into one "Not relevant" line.
- **E7** — Each paid leg is checked against its minimum spend to learn. Any retargeting leg states audience size and expected weekly frequency, and caps spend if frequency exceeds about 5 per week.
- **E8** — Every test has one variable, money per version, a read date, an end date, and an action for win / lose / unclear.
- **E9** — The calendar works back from the date, includes claim sign-off and asset lead times, and names the buyer's seasonal moments in the window (for DTC marketers: Black Friday / Cyber Monday creative crunch).
- **E10** — Every asset row has format and size, angle, message, the exact claim or "needs proof", destination, maker role and due date.
- **E11** — (must) No unsigned claim in angles or assets. The agent does not request ad generation or approve a credit quote, and proof fields are never filled with kit copy.
- **E12** — (must) The plan is delivered as a readable report: In short first (what we looked at, findings, then "So, do this first"), a clickable link, and a saved copy. The chat is 3 lines plus the approval ask. A schedule is offered only for always-on plans, with a reason.
