---
name: answer-ads-questions
description: Answer questions about a brand's Meta ads (spend, results, which ad is winning, is it paused, why did Goose do that) only from reads made in the same turn, with the data window and sync time on every number and a plain caveat when the connection is stale or partial. Use it whenever a user asks how their ads are doing or why an ad action was taken.
---

# Answer Ads Questions

**In one line:** answer "how are my ads doing?" from a tool you called this turn, say which
days the numbers cover and when they were last synced, and say out loud when the data is
incomplete.

- **Numbers come from tools, never from memory or the docs.** The `ads/` docs explain *why*
  Goose did something. They are not a source of metrics.
- **Every number carries its window and sync time.** "You spent $212 from Sep 17 to Sep 23
  (data last synced Sep 24, 09:00 UTC)."
- **Partial, stale or disconnected data is said straight after the answer**, never buried or left out.
- **This skill only reads.** It never pauses, changes or writes anything.

## Where this skill's files are

Paths are relative to **this skill's own folder**, not your working directory (in GooseWorks:
`agent-config/skills/answer-ads-questions/`). The harness docs contract ships with the
`meta-ad-manager` skill, installed beside this one.

## Choose one mode

Use the first mode that is available:

1. **GooseWorks** when the GooseWorks Meta read tools are callable. Read
   [references/gooseworks-adapter.md](references/gooseworks-adapter.md).
2. **Direct Meta** when there is no GooseWorks, but a Meta token with `ads_read` and the ad
   account id are available. Read [references/direct-meta-adapter.md](references/direct-meta-adapter.md).
3. **Planning only** when neither is available. Read
   [references/planning-only.md](references/planning-only.md).

**"The adapter"** below means the file for the mode you chose.

## Purpose

Give a user a true, dated answer about their Meta ads that they could act on. The usual way
this goes wrong is that the agent repeats a number from an earlier turn or a report, and
presents it as current. Or it misses that half the account did not sync. This skill fixes
the source (a tool read this turn) and the framing (window, sync time, connection state).

Reach for it on any question about spend, results, delivery, which ad is best or worst, whether
a push is live or paused, what Goose has noticed, or why Goose made a decision.

## Inputs

- **The user's question** (required), in their words.
- **The brand's `ads/` folder** (optional). Per the harness contract (the `meta-ad-manager` skill's `contract/RULES.md`):
  `ads/README.md` first, then only the campaign in play. Read `ads/brand.md` for one field
  only: `familiarity`. A brand with no `ads/` folder has never run the harness. That is fine
  for metric questions. For "why" questions it means there is no recorded decision.

<!-- shared:answer-ads-questions start -->
<!-- This block is maintained in ONE place and copied byte-for-byte into both the
     maintainers' source copy and the published goose-skills copy. Edit one, copy
     it to the other, and run the parity script before shipping either. -->

## Workflow

### 1. Pick the read from the question

The adapter maps each read below to a real tool or API call, and says where each read's data
window and sync time come from.

| The user asks… | Read | Also read |
|---|---|---|
| "How are my ads doing?", spend, results for a period | account totals for a window | the connection state, whenever it is not clean |
| "Is Meta connected?", "why is data missing?" | the connection and sync state | the diagnostics, if the sync state does not explain it |
| "Which campaign / ad set / ad is best or worst?" | every entity at that level. **Read every page** before you rank | — |
| A trend, day by day, "since Tuesday" | a daily series for the entities in question | — |
| One specific ad | that ad's context (performance, link to Goose, freshness). If the user gave a name, find the id from the ad list first | — |
| "How are the ads Goose made doing?" | the performance of Goose's own published creatives | the connection state, for the sync time |
| A Goose push: "did it go live?", "is it paused?" | that push's state, using the push id from the campaign's `state.md` (`meta_push_ids`) | — |
| "Why did you pause / change / recommend that?" | `ads/README.md`, then that campaign's `decisions.md` | — |
| "What have you noticed?", "anything wrong?" | the campaign's `state.md` `## Open recommendations` | fresh account totals |

**Only claim a read you made.** If the host has no read for something (alerts, a watch, a push
record), never say "I checked" or "there are no alerts". Say what you did read, and that the rest
is not visible from here.

### 2. Check the connection before you say any number

For any question that ends in a Meta number, read the connection state once in the turn, in
addition to the numbers. Some reads report "ok" while the connection is only partly synced, so
the numbers' own status is not enough. The adapter says which read carries the connection
state and how each class below shows up.

| Class | What you say |
|---|---|
| **Clean**: connected, last sync finished | The numbers, with window and sync time. |
| **Partial**: some parts of the last sync failed | **Read the sync detail first.** A caveat that only says "partial" or "some data may be incomplete" fails. Name the part that failed, in plain words ("ad images didn't finish syncing"). Say which numbers that part affects. Then give them. |
| **Stale**: the last good sync is old | Give the numbers, say how old they are ("last synced 3 days ago"), and **make no recommendation**. |
| **Not connected**: never connected, needs re-authorising, failed or disconnected | No numbers. Say Meta needs reconnecting (the adapter says where). Never ask for a token in chat. |
| **Error**: the read failed, or there is no brand | Say you could not read the data and why. No numbers. |

### 3. Answer by the six rules

1. **Only say a number a read returned this turn.** Not one from memory, an earlier turn, a
   report, or an `Observed:` line in `state.md` or `decisions.md`. You may quote a docs number
   only as history, with its own date: "the Sep 23 report showed $41 per subscriber".
2. **Every number carries its window and sync time**, in plain words, with money in the ad
   account's currency. Report rates as the adapter says the source returns them (a fraction or
   a percent): 0.021 as a fraction is "2.1%". Null means *unknown*. Never say it is zero.
   Missing days are unknown too.
3. **Say the connection state when it is not clean** (step 2), in the sentence right after the
   answer.
4. **The docs are for decisions and reasoning, never for metrics.** For "why", quote the
   `decisions.md` entry: its date, what was recommended, who decided, and **its `Evidence:`
   pointer, written out** (for example "evidence: push 15b8dfb0"). If no entry covers it,
   say "I don't have a recorded decision for that". Never reconstruct a reason. If the push
   record shows the ad was changed outside Goose (in Ads Manager), say someone changed it
   outside Goose. Do not say Goose did it.
5. **An ad Goose did not publish is read-only.** An ad is Goose's only when its context says
   Goose published it (a Goose push is its source), **or** when a push listed in the campaign's
   `state.md` `meta_push_ids` has an item with that ad id, **or** when the adapter's own launch
   record includes it. Only then do Goose's pause and revert apply (the adapter says which of
   them exist). Everything else:
   - "No Goose link recorded" alone **does not prove Goose had nothing to do with it**. A push
     the read cannot see (another brand's record, a creative uploaded by hand) looks the same.
     So before you say "Goose didn't make this", check the pushes in `state.md`, and whether
     the ad name carries a `[gw:…]` tag. With a tag but no push item, say it uses a Goose
     creative but you can't confirm Goose published it.
   - A link that says the ad *uses* a Goose creative, but was not pushed by Goose: say exactly
     that. It was **not published through Goose**.
   - With no Goose pushes at all (the adapter says when that is the case), every ad is the
     user's own.

   For every ad that is not Goose's, answer from the reads and do not offer to pause, edit,
   replace or scale it. If the user asks what to do, the most you offer is new creatives.
6. **Match the wording to `familiarity`** from `ads/brand.md`:
   - `novice`: no jargon. Give a one-line meaning for any metric you use ("CTR, the share of
     people who saw the ad and clicked").
   - `intermediate`: use the terms with a short gloss.
   - `expert`: terse. Metric names, no glosses.
   - Missing or unknown: `intermediate`.

**Rules for reading any source:**

- A clipped or truncated result: narrow the window, the entities or the metrics, and read
  again. Never answer from a clipped result.
- A result that withholds numbers (for example, the ad's creative was replaced): say that.
  Don't estimate.
- Never recompute a metric the source returned, and never compare against outside benchmarks.
- **Name a metric exactly as the source defines it.** Cost per click over *all* clicks is not
  cost per link click. A return on ad spend of `0` with no purchases tracked means no purchases
  were tracked, not a result.
- **Report what a number is, not a business verdict.** A return on ad spend of 0.7 is "about
  70¢ of Meta-reported purchase value per $1 spent". It is not "losing money": Meta's purchase
  value is its own attributed figure, not revenue, margin or repeat purchases. The same goes
  for "profitable" and "wasting money".
- **Never call data "complete"** or vouch for a total ("the total holds"). A clean connection
  means the last sync finished, not that every row is proven. Say which parts synced and which
  failed, and let the numbers stand as reported.
- A same-length comparison period can be shown side by side. Do not say the account is "up"
  or "down".
- Performance of Goose's own creatives is not attribution. Never call it that, and when there
  are no Goose creatives with data, say so rather than falling back to account totals.

### 4. Shape the reply

1. One sentence that answers the question, with its window and sync time.
2. The caveat, if there is one, immediately after.
3. Any other numbers, each with its window and sync time.
4. At most one next step. None when the data is stale. None that changes an ad Goose did not
   publish.

## Output

A chat reply in the shape above. Nothing is written: not the `ads/` docs, not Meta, not memory.

Example (intermediate, partial connection):

> You spent **$212** on Meta from **Sep 17 to Sep 23** (data last synced **Sep 24, 09:00
> UTC**). One caveat: the last sync only partly finished, because ad creatives didn't import. Spend
> and clicks came through, but per-ad breakdowns may be missing some ads.

<!-- shared:answer-ads-questions end -->

## Quality Checks

- Every number in the reply appears in a read made this turn.
- Every number has a date range and a sync time next to it.
- The connection state was read this turn, and its class decided what was said.
- A "why" answer cites a `decisions.md` entry date and evidence pointer, or says there is no record.
- No offer to change an ad that Goose did not publish.
- The words "currently", "right now" and "live numbers" never describe a synced figure.
- No business verdicts ("losing money", "profitable") and no "complete" claims.

## Failure Modes

| Symptom | Cause | Fix |
| --- | --- | --- |
| Clean totals while the account is half-synced | Only the numbers' own status was checked | Read the connection state every time (step 2) |
| "Your CPA is $41" when nothing was read this turn | The number came from `state.md`, a report or an earlier turn | Read it, or quote the number as dated history |
| "Best ad" is wrong | Ranked the first page only | Read every page before ranking |
| "Goose paused it because it was underperforming", but no decision says so | A reason was made up | Quote `decisions.md`, or say there is no recorded decision |
| Offers to pause an ad the user built themselves | Treated every ad in the account as Goose's | Rule 5: Goose's only with a Goose push behind it |
| "No alerts" | Claimed a read that does not exist on this host | Say only what was read |
