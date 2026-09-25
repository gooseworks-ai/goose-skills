---
name: meta-ad-manager
description: Front door and loop owner of a Meta (Facebook/Instagram) ad harness. Reads the brand's ads/ docs, works out which campaign the user means and which stage it is at, hands off to the stage skill that runs it (intake, strategy, creative, launch, checks, fixes, answers), and writes every stage change back to the docs. Use it when someone wants to run ads on Meta, comes back to ads they started earlier, a stage skill hands back, or a scheduled check fires.
---

# Meta Ad Manager

**What this is for.** Someone says "I want to run ads on Meta", or comes back a week later and
says "where are we?", or a scheduled check wakes up. This skill works out where things stand
from the brand's ad docs, picks the next step, hands it to the skill that does that step, and
writes down what happened and why. It never makes the user repeat themselves.

**It does not do the stage work itself.** Intake, strategy, making creatives, launching,
checking and fixing each belong to their own skill. This skill decides which one runs, sets the
tone, and keeps the docs true.

**The docs contract is law.** How to read and write the files and the rules for numbers are in
[contract/RULES.md](contract/RULES.md). The file shapes are in
[contract/templates/](contract/templates/), and [contract/validate.py](contract/validate.py)
checks a folder. Read `RULES.md` before your first write.

## Where this skill's files are

Every path in this skill (`contract/…`, `references/…`) is relative to **this skill's own
folder**, not to your working directory:

| Installed by | This skill's folder |
|---|---|
| GooseWorks (the in-app coworker) | `agent-config/skills/meta-ad-manager/` in the workspace |
| The goose-skills installer | the folder the installer printed; in Claude Code, wherever you placed it (for example `.claude/skills/meta-ad-manager/`) |

The stage skills below are installed with this one and sit beside it, in the same parent
folder. `ads/` itself is never inside a skill folder.

## Choose one mode

Use the first mode that is available, and read its adapter before Step 1:

1. **GooseWorks** when the GooseWorks tools are callable (the in-app coworker, or any agent
   with the GooseWorks MCP). Read [references/gooseworks-adapter.md](references/gooseworks-adapter.md).
2. **Direct Meta** when there is no GooseWorks, but a Meta access token and ad account are
   available. Read [references/direct-meta-adapter.md](references/direct-meta-adapter.md).
3. **Planning only** when neither is available. Read
   [references/planning-only.md](references/planning-only.md). Intake, strategy and the creative
   brief still work; nothing is read from or written to Meta.

**"The adapter"** in the workflow below means the file for the mode you chose. A campaign stays
in the mode it started in; say so if the user's access changes mid-campaign.

## Stage skills

| Skill | Stage it runs | Notes |
|---|---|---|
| `ad-management-intake` | intake: business facts, familiarity, the campaign brief; creates the `ads/` files | every mode |
| `ads-north-star-strategy` | strategy: goal, audience, budget split, creative count, test frame | every mode |
| campaign planning + creative generation | create and review | GooseWorks generates; other modes write a creative brief |
| `launch-meta-ad-campaign` | launch: readiness, paused build, readback, confirmation | GooseWorks or direct Meta |
| a quick check (daily report) | quick check on live campaigns | where the adapter has one |
| `meta-ads-analyzer` | deep check on complete days | when installed |
| fix-and-adjust actions (pause, revert, budget change, replace creative) | acting on an approved recommendation | the adapter lists what it supports |
| `answer-ads-questions` | factual questions about the ads | every mode |

The first four and the answers skill are installed with this one. When a listed skill is not
installed, the workflow's Fallback column says what to do. Outside GooseWorks, "campaign planning +
creative generation" means the adapter's written creative brief, and the check and fix rows are
what the adapter lists.

## Inputs

- **The message** — the user's words, or the automation's prompt for a scheduled run.
- **The surface** — chat, a messaging channel, a scheduled run, or an outside agent host. It
  changes only Step 0 and whether you may ask questions.
- **The brand's `ads/` folder** — the adapter says where it is. It may not exist yet.
- **The docs contract** — `contract/RULES.md` and `contract/templates/`.

<!-- shared:meta-ad-manager start -->
<!-- This block is maintained in ONE place and copied byte-for-byte into both the
     maintainers' source copy and the published goose-skills copy. Edit one, copy
     it to the other, and run the parity script before shipping either. -->

## Workflow

### Step 0 — Surface gate

The harness needs a conversation to ask questions and get approvals.

- **Web chat, a messaging channel, or an outside agent host:** go on. Web chat is a full
  surface; never send its user elsewhere to continue.
- **A surface with no conversation** (a button or form that started the request, with no chat
  behind it): tell the user in one sentence to continue in chat or connect a messaging channel,
  and stop. Write nothing.
- **Scheduled run:** go on, but you may not ask questions (see Step 6).

Follow-ups after launch arrive in the report. If the user asks how they will hear about
results and has no messaging channel, say how the report reaches them and offer to connect a
channel. Do not block on it.

### Step 1 — Read the index

Read `ads/README.md`. Always first, always the whole file.

- **It does not exist** → this brand has never started the harness. Route to intake (Step 4)
  and write nothing yourself: `ad-management-intake` creates `ads/brand.md`, the index and the
  campaign folder, after it has stated its assumptions to the user (its Step 5 comes before its
  Step 6). Only on the fallback path (intake not installed) do you write them yourself, as below.
  The folder must always be valid under the contract, and that needs `ads/brand.md`, which needs
  the business type and the user's familiarity. Once you have those two (research usually gives
  the business type; familiarity is one question) **and** you have stated your assumptions, write
  `ads/brand.md`, `ads/README.md` and the new campaign folder (Step 2) **together, in one turn**.
  Both files need the brand's id and its coworker agent id in the frontmatter; the adapter says
  where they come from (outside GooseWorks, write `local` for both). Never write a placeholder or
  `none` for either.
- **It exists** → read the Campaigns table. Each row is a campaign slug, its stage, the last and
  next action. Do not open any campaign folder yet.

### Step 2 — Pick the campaign

| Situation | Do |
|---|---|
| No campaigns, or the user clearly wants something new ("now ads for our new serum") | Start a new campaign (below) |
| One campaign that is not `ended` | That one |
| Several, and the message names a product, offer or campaign that matches one slug or its last/next action | That one. Say which in the reply, in the user's words ("Picking up the gift bundles campaign.") |
| Several, and nothing in the message decides it | Ask **one** question listing the open campaigns in plain words, with each one's next action. Never guess |
| Scheduled run | Every campaign at `live` or `paused`, one at a time (Step 6) |

**Starting a new campaign.** Pick a short kebab-case slug from the product or offer
(`holiday-gift-bundles`) and route to intake. When `ad-management-intake` is installed it creates
the folder and the index row with that slug; do not write them twice. On the fallback path, create `ads/campaigns/<slug>/` with all
three files, following the templates:

- `state.md` — `campaign: <slug>`, `stage: intake`, `goose_campaign_id: none`,
  `meta_push_ids: []`, `meta_campaign_id: none`, `updated_at: <today>`,
  `updated_by: meta-ad-manager`; Open recommendations, Pre-approved rules and Last check each
  `None.`
- `strategy.md` — `campaign: <slug>`, `product_ids` (catalog ids if known, else `[]`),
  `version: 1`, `updated_at: <today>`, `based_on: intake <today>`, and every section heading
  with "Not decided yet — the strategy stage sets this." under it (the same stub intake writes).
- `decisions.md` — one entry `### <today> — Campaign opened`: Recommended gives the reason (the
  user's request, quoted briefly), Evidence `user request`, Decided `<user> asked for it`, Outcome
  `opened`.

Add the row to the index in the same turn. For a brand with no `ads/` yet, this happens together
with `ads/brand.md` (Step 1).

### Step 3 — Read only what this campaign needs

Read `ads/campaigns/<slug>/state.md`. Then only what the next step needs:

- `ads/brand.md` **frontmatter only** (`familiarity`, `business_type`) on any turn that talks to
  the user, for tone (RULES.md §3 allows this). The body only when the next step needs a business
  fact: intake, strategy, a deep check, or a question the docs might already answer.
- `strategy.md` — for create, review, launch and deep check.
- `decisions.md` — when an open recommendation is being decided, for a quick or deep check (to
  follow up the last recommendation), and when the user asks "why did we…".

Never read other campaigns "for context".

### Step 4 — Route

Find the row for the campaign's `stage` and the user's intent. Hand off to the skill in **Runs**.
If that skill is not installed, do what the **Fallback** column says.

| Stage, or intent | Runs | Fallback while it is missing |
|---|---|---|
| `intake`, or `ads/brand.md` missing | `ad-management-intake` | Ask the goal-first questions from `launch-meta-ad-campaign` Stage 1 that the docs do not already answer, plus the familiarity question ("How much have you used Meta Ads before: never, a little, or a lot?"). **At most four questions per turn**, familiarity and the goal first; the rest wait for later turns unless the user asks to answer everything at once. State what you are assuming instead of asking. Write business facts to `ads/brand.md` and campaign facts (goal, audience, budget, destination) to the campaign brief (the adapter says where it lives). Never create a brief file under `ads/` |
| Meta is not connected and the next step needs it | the connection repair flow | — |
| `strategy` | `ads-north-star-strategy` | Use `launch-meta-ad-campaign`'s test-design stage and write the result into `strategy.md` |
| `create`, `review` | campaign planning and creative generation, as `ads-north-star-strategy` hands it off: about three times the creatives the plan needs, so the user can choose. **Nothing that spends credits runs without the user's yes** (a cost quote, or the approval step the generation flow provides); an approved plan is not approval to spend credits | — |
| `launch` | `launch-meta-ad-campaign` | — |
| `live` or `paused` + a daily scheduled run, or "send me the report" | quick check (the daily report) | — |
| `live` or `paused` + "dig in", "what's working", or a weekly scheduled run | `meta-ads-analyzer` as a deep check | — |
| An open recommendation in `state.md` is approved or declined | the fix-and-adjust action it names | Pause and revert only. Say plainly that a budget change or creative swap is not available yet |
| Any stage + a question in chat ("how are the ads doing?", "how much have we spent?") | `answer-ads-questions` | Answer from the read tools only, with each number's data window and sync time (RULES.md §5). Never from the docs |
| `live` or `paused` + an open recommendation still awaiting + "what's next?" | Put that recommendation to the user as the one next step, with its evidence; act only on a yes | — |
| The user asks to pause ads or a campaign | the pause action (their request is the approval); stage `live → paused` when the whole campaign stops | — |
| The user asks to turn paused ads back on | Say it will start spending again, and how much per day, and get an explicit yes. Then the launch skill's confirmation flow; stage `paused → live` after Meta confirms | — |
| The user asks to stop a campaign for good | Confirm once, pause everything still running, then stage `→ ended` | — |
| `ended` | Nothing. Say it ended and when, and offer a new campaign | — |

**Stage skills never get a new question the docs already answer.** Pass them what you read.

**Planning without Meta is allowed.** A missing Meta connection blocks launch, checks and
fixes, not intake, strategy or creative.

### Step 5 — Hand-back and write-back

When a stage skill returns, decide whether the campaign moves stage.

**Allowed moves:** `intake → strategy → create → review → launch → live`, `live ↔ paused`, and
any stage `→ ended`. Do not skip a stage, with one exception: a user who already has approved
creatives and asks to publish them may go from `intake` straight to `launch` once `ads/brand.md`
exists; the launch skill's test design is then written to `strategy.md`, and the decisions entry
says why the stages were skipped. `review → launch` needs the user's approval of the
creatives. `launch → live` needs Meta to confirm the ads exist (the launch skill's readback), not
a successful write.

On every stage change, in the same turn, write **all three**:

1. **`state.md`** — set `stage`, `updated_at` (today), `updated_by: meta-ad-manager`. Keep ids the
   stage skill wrote.
2. **`ads/README.md`** — that campaign's row: Stage (must equal `state.md`), Last action (what
   just happened, one clause), Next action (what happens next and who owns it), Updated (today).
   Update `updated_at` in the frontmatter.
3. **`decisions.md`** — append one entry at the end:

   ```
   ### 2026-09-24 — Stage: strategy → create
   - Recommended: Move to creatives: the strategy is set (3 ads from 9, $30/day for 14 days) and the user agreed to it.
   - Evidence: user request
   - Decided: Maya approved the strategy
   - Outcome: moved to create
   ```

   The Recommended line is the reason. Evidence is a pointer (`report:<id>`, `push:<id>`,
   `finding:<id>`, or the form the adapter names) or `user request`. Never make up a pointer:
   use one only when a tool or report gave you that id.

**A decision without a stage change** (an open recommendation approved or declined, a pause of
one ad) still writes: append a `decisions.md` entry with what was decided (or fill the matching
`- Outcome: pending` line), remove the `R<n>` line from `state.md` Open recommendations, set
`updated_at` and `updated_by`, and update the index row's Last action, Next action and Updated.
If `strategy.md` still says the decided item is awaiting approval, update that line (and its
`updated_at`) so the docs never state something that is no longer true.

Whole-file writes: read the file, change it, write it all back (RULES.md §4). If nothing was
decided and no stage changed (a question answered, a check with nothing new), write nothing except
what the stage skill itself owns.

Then tell the user, in their tone (below), what happened and what happens next. One next step,
not a menu.

### Step 6 — Scheduled runs

Only on a host that runs scheduled checks (the adapter says whether yours does). No one is there
to answer, so:

- Never ask a question. Anything that needs a decision becomes an open recommendation in
  `state.md` (`- R<n> (<date>): <what> — evidence <pointer> — awaiting`) and a line in the report.
- Go through each `live` or `paused` campaign on its own: read its `state.md` and `decisions.md`,
  run the check the schedule names, and write back before starting the next one.
- Open every check by saying whether the last recommendation was acted on, from `decisions.md`.
- Any write to `state.md` (a new `R<n>`, Last check) also sets `updated_at` and `updated_by`,
  and the index row's Last action and Updated.
- A weekly deep check with nothing above the evidence threshold stays silent in the report
  except for one line saying so.

## How to talk to the user

Read `familiarity` from `ads/brand.md`. Until intake has recorded it, treat the user as a
novice. Never guess "expert".

| Familiarity | Before each recommendation | Then |
|---|---|---|
| `novice` | One plain sentence explaining the idea, with no ad jargon | The recommendation, in business words |
| `intermediate` | A short clause of explanation only for terms beyond the basics | The recommendation and the key evidence |
| `expert` | Nothing | The recommendation and the evidence, with Meta's own terms allowed |

The same recommendation, two ways:

- **Novice:** "Meta needs a few days of results before it can tell which ad works, a bit like a
  new salesperson learning the pitch. So I'd leave all three ads running until Friday before we
  change anything. OK to wait?"
- **Expert:** "Hold changes until Friday: two ad sets are still in learning (18 and 23 of ~50
  weekly conversions), and a budget edit now resets it. Approve the hold?"

For every level: use the vocabulary rules in `launch-meta-ad-campaign` ("How to talk to the
user"). Talk about the business, not Meta's objects. Surface a raw id only when the user asks.

## Decision Rules

- **Never ask what the docs answer.** Before asking the user for a fact, look for it in the
  index, the campaign's `state.md` and `strategy.md`, and the body of `ads/brand.md` (reading
  them for this is allowed at any stage). Business type, unit economics, familiarity,
  connected accounts, claims rules, the budget, the goal and the audience are all recorded
  there once known. If it is written down, use it and say so ("Going with the $45 target cost
  per subscriber you gave me").
- **One question at a time for routing.** Stage skills may ask more; this skill asks at most one.
- **Numbers from tools are observations.** Never write a Meta number into the docs as a fact or
  call it "current" (RULES.md §5).
- **Numbers in a reply** come from one of three places: a tool read this turn (with its window and
  sync time), the user, or a dated `Observed:` line in the docs quoted **as the evidence behind a
  recommendation already made** ("the 22 Sep report, covering 16–21 Sep, had the gift ad at $71 per
  order"). A saved snapshot is never an answer to "how is it doing"; read the tools for that.
  Always say the snapshot's date. Before **acting** on an approved recommendation, re-read the
  tools; if the picture has changed, say so and ask again.
- **Evidence pointers stay in the docs.** In a reply, name the evidence in words ("the 22 Sep
  report"), not by id, whatever the familiarity level.
- **The docs record decisions, not Meta's state.** Spend, delivery and rejections are read from
  tools when needed.
- **Budget changes always need the user's approval**, every time. Pause is the only action that
  can be pre-approved (in `state.md` Pre-approved rules).
- **Credits are spend too.** Anything that uses credits (generating creatives, research runs) gets a cost quote and the user's yes first, every time.
- **At most four questions in a turn**, across every stage. Ask the ones where a wrong guess changes money, claims or legal exposure; state the rest as assumptions.
- **Never activate spend from here.** Launch keeps objects paused until the user confirms in the
  launch skill's own flow.

<!-- shared:meta-ad-manager end -->

## Output

- A reply to the user (or a report line on a scheduled run): where the campaign stands, what just
  happened, and one next step.
- The `ads/` docs updated per Step 5, and valid under the contract: from the directory that holds
  `ads/`, `python3 <this skill's folder>/contract/validate.py ads`.

## Quality Checks

- `ads/README.md` was read first, and only the campaign in play was opened.
- Index Stage equals `state.md` `stage` for every row you touched.
- Every stage change has its `decisions.md` entry, appended at the end; nothing earlier changed.
- No question asked whose answer is in the docs.
- The wording matches `familiarity`; novice when unknown.
- No number read from a tool is in the docs without an Observed tag. Every number in the reply
  came from a read this turn, the user, or a dated Observed line quoted as a recommendation's
  evidence with its window.
- A scheduled run asked nothing and left every open decision in `state.md`.

## Failure Modes

| Symptom | Cause | Fix |
| --- | --- | --- |
| The user is asked for their budget or business type again | The docs were not read before asking | Read the index, `state.md`, `strategy.md` and `brand.md` first; quote what is there |
| Index says `strategy`, `state.md` says `create` | One of the two writes in a transition was skipped | Write both in the same turn; the validator flags the mismatch |
| A campaign "resumes" at the wrong product | Two campaigns, and the message was guessed | If the message does not name one, ask the one routing question |
| Files written but nothing appears on the next run | Written somewhere other than where the adapter keeps `ads/` | Use the adapter's paths exactly |
| `contract/RULES.md` "does not exist" | Opened relative to the working directory | Paths are relative to this skill's folder (see "Where this skill's files are") |
| The routed skill is not installed | A stage skill is missing on this host | Use the Fallback column; do not improvise a new flow |
| The user is told "your ads are live" after a write | A write is not delivery | Only move to `live` after the launch skill's readback |
| A scheduled run asks a question nobody sees | The scheduled rules were skipped | Turn it into an open recommendation in `state.md` |
