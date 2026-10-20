# Run memory for write-outreach

How this playbook uses [the `run-memory` skill](../../run-memory/SKILL.md). Start before any drafting or reading; End after the pack or the results read. Only what is specific here.

## The job

| `job` | `subject` | `cadence` |
|---|---|---|
| `outreach` | the pack slug (`<D>-<slug>`, the folder under `outreach/`) | `ad hoc` (a results read after ~100 sends or two weeks) |

A results read for a pack is the **same job and subject** as the pack, so the second run finds the first run's record directly. A new pack for a new list is a new subject; its Start also reads the newest `outreach` records of other subjects (up to 3) for what the brand's outreach has shown so far.

## Openers and segments are tracked per row

So that results can be read per opener, the pack gives every row an `opener_id` — the kind of first line it got: `<signal type>-<angle>` (e.g. `hiring-before-start`, `new-leader-first-quarter`, `switch-intent-own-words`, `segment-pain` for rows with no personal hook) — and a `sequence_id` of `<pack-slug>:<shape>` (so packs that reuse a shape never mix). Both go in the send file and, **once, when the pack is delivered**, into the ledger rows' `opener_id` and `sequence_id` columns (outcomes-ledger, `entity: person`) — columns only; the status stays `listed` until the marketer reports a send.

## Start: "since last time"

**In results mode the paste goes into the ledger first** (reply-reader matches and writes every reply and every reported send), then the recount — otherwise "since last time" would show nothing new. Which pack the results belong to comes from the matched rows' `sequence_id`; the marketer is asked only if the rows span packs.

**Outcome sources:**
- **The ledger** (`research/audience/ledger.csv`) — the per-person truth. Recount, for this pack's rows (`sequence_id` starting with this pack's slug): contacted (`first_touch_date` set), replied, positive = **distinct rows** where `reply_category` is `interested` **or** `status` is `meeting` (a booked row is counted once), with meetings reported separately as a subset, meetings, not-a-fit, bounced, unsubscribed — **per segment, per opener and per touch** (`last_touch` at reply). When the marketer gives a total the ledger can't attribute ("sent to 32" with only the replies matched), record it as `reported, not in ledger`, give reply counts by segment and opener **without rates**, and ask for the sent list in the closing decisions — rates come once each sent row has its `first_touch_date`.
- This pack's `results.md` (earlier reads — aggregate counts and fixes only) and `results-working.md` (per-reply state and the open `Hold / Find / Quote` lines, and whether research-audience answered them). The record links both; it copies neither.
- The brain, with `brain_*` tools: `brain_search` since the last record, `source_types: ["learning"]` — new `[outreach …]` and `[outreach-copy …]` rules. Otherwise `brand_read` learnings. **Proof lines come only through [the `claims-gate` skill](../../claims-gate/SKILL.md)** — it reads brain claims itself (confirmed, with the full record checked for wording, scope, qualifier, evidence and expiry). This playbook never uses a claim straight from a brain search, a brain status or a found item.

**Check last run's recommendations** (the run-memory statuses): e.g. "send the hiring segment first" is `done` when the ledger shows that segment's touch 1 dates before the others; "sign off the proof line" is `done (marketer's words)` when the marketer says so, but the line is used only when claims-gate passes it (its scoped sign-off can record the marketer's words in this conversation); "switch titles to the ones referred" is `done` when a newer list or this pack's rows carry them. Then the verdict on the ones past review-by, with the recipe they recorded.

**Say, in 3–5 lines:** reply and meeting rates per segment and per opener with their sample-size label — e.g. "Since 19 Oct (60 contacted): the hiring openers got 4 positive replies from 25 (directional); the no-hook rows 0 from 20. Touch 2 brought 3 of the 7 replies. You said the 'a week of variations' line is signed off — I've put it through the claims sign-off, and this round uses it only if that check passes." Then what this run does with it (shift volume to the opener that's working, rewrite the one that isn't, keep the rest running) — never treating a directional result as settled.

**Sample size:** under 50 contacted in a group → counts only; 50+ but under ~10 positive replies → "directional only" (reading-results.md, the same rule as the ledger).

## End: the record

- **Numbers:** contacted, replied, positive, meetings, bounces, unsubscribes — per segment and per opener, with the window (touch 1 dates from–to), the label `reported` (the marketer's outcomes, via the ledger), and the sample-size label. For a new pack: rows drafted, rows with a personal hook vs `segment-pain`, rows held back (no checked address, region rule, suppressed, cool-down).
- **Recommendations:** the pack's "send first" call and the read's fixes (at most six), each with an id, owner (`marketer`, `research-audience` for targeting or titles, `agent`), review-by (the next read, about two weeks out) and **how we'll know**: the object (segment or opener), the metric (positive reply rate, meetings), the threshold, and the recipe — people whose touch 1 falls in a window, read from the ledger.
- **Decisions:** the marketer's own words (a proof line signed off, a sender, a volume), or "proposal, waiting for yes".
- **Links, not copies:** `Report:` the pack or results read; in "Checked", the ledger, the send file path, `results.md` and the lessons file. Numbers in the record are the headline counts only; the analysis lives in the results read and the lessons, linked.

## Never in a run record

No person's name, email, company-with-person, profile URL, reply text or ledger key. Opener ids, segment names, counts and rates only. Reply phrases worth keeping go to the quote bank through a `Quote needed` line, anonymised — never into the record.
