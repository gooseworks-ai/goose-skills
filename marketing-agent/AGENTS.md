# Human version

**What this folder is.** The GooseWorks marketing agent's skills, rebuilt from scratch: 17 playbooks plus 3 foundation skills. A playbook is one marketer want, done end to end ("fill my email flows", "which ad won and what do I make next").

**Why a separate folder.** We are scrapping the old 295-skill library, not patching it. Building in a clean folder keeps the old skills out of the builders' heads and keeps the live ad engine untouched. Nothing here is published: the catalog build only reads `skills/` and `parts/`.

**The rules in one breath.**
- Never read `skills/`, `parts/`, `collections/` or `skillopt/`. Build from the specs and from first principles of marketing.
- Never edit anything outside `marketing-agent/`.
- Critique hard and often, with subagents: **scope** (did we miss work a marketer does?) and **depth** (would a senior marketer accept this output?).
- Each builder owns its own folders only. No git writes. One PR at the end.

---

# Agent version

## 1. Source material (read these, in this order)

All in the goose-lab checkout at `/Users/akhil/projects/content-goose/plan/marketing-twin/`:

| File | What it gives you |
|---|---|
| `specs/NN-<playbook>.md` | **Your hand-off sheet.** The want, inputs, steps, output, approval gates, done-when, how to test, out of scope. Start here. |
| `00-what-a-marketer-does.md` | The full inventory of marketing work (day-one inputs + all pillars). The measuring stick for scope. |
| `01-how-the-work-gets-done.md` | Per pillar: what a good marketer must know, and the process they follow. The measuring stick for depth. |
| `01-what-the-agent-must-know.md` | The knowledge the agent needs, split into company facts / craft / live data. |
| `01a-source-maps-by-section.md` | Where each kind of knowledge comes from. Large; grep your pillar, don't read it whole. |
| `decisions-and-parking-lot.md` | Every decision (D1–D5) and what was rejected. Respect the decisions. |

The visual map: https://claude.ai/artifact/6PAQXoadLzETsFd57vP79a (the same content as the files above).

**Do not read** `skills/`, `parts/`, `collections/`, `skillopt/`, or old skills anywhere (goose-studio, content-goose `coworkers/`). This is a deliberate rebuild; old skills pollute the design. The one exception: the GooseWorks MCP tool descriptions (see §4) are the server contract, and you must read them.

## 2. Architecture rules (decided; do not re-litigate)

From Shiv's goose-skills rebuild plan and Akhil's marketing-twin decisions:

1. **The user is an AI agent with a computer** (Claude Code, Codex, Cursor…) doing a founder's or marketer's work. Hosted chat connectors (Claude.ai, ChatGPT) have no shell: every playbook must still work there using MCP-only steps.
2. **Playbooks are listed and user-invoked. Atoms are hidden** and loaded by a playbook. Users only ever see playbooks.
3. **Media, money and state live on the GooseWorks MCP.** Reference a tool by name as `gooseworks:<tool>`. Never re-describe its parameters (the live schema is the truth). Never invent a tool.
4. **No vendor keys, ever.** Public data goes through the GooseWorks data proxy (`gooseworks:data_call_provider` and friends). No `APIFY_API_TOKEN`, `FAL_KEY`, `APOLLO_API_KEY`, `ELEVENLABS_API_KEY`, `OPENAI_API_KEY` in any file.
5. **The brand brain is the single memory** (D5). Read it first (`brand_read`, `knowledge_search`, or whatever the live MCP exposes). Write durable results back into it (claims list, competitor set, voice-of-customer bank, learnings). If the write-back tool does not exist yet, say so in `server-needs.md`; do not fake it with a local file pretending to be memory.
6. **Without the GooseWorks connection a playbook stops** with one clear sentence telling the user to connect GooseWorks. It never half-runs.
7. **Never invent facts.** No made-up offers, claims, proof, customers or numbers. Claims come only from the brand's approved-claims list; anything else is cut and shown to the human.
8. **Money moves and publishing are human decisions.** Spend, launches, sends and posts are proposals the human approves. Paid generation needs the user's yes to the credit total first.
9. **Workflows never call other playbooks.** They chain through written artifacts: one playbook writes, the next reads (see each spec's "from sibling playbooks"). A playbook may **offer** the next job to the human in plain words; it never starts another playbook itself — the human's own request does.
10. **Do not grow the surface** (Akhil, 16 Oct). No new playbooks, and no new jobs inside a playbook, beyond its spec and the review fixes. A missing job goes on `BACKLOG.md` with a checkable trigger; the playbook says plainly "this isn't covered yet".
11. **Judgment stays with the model** (D2). Encode craft and process, not decision trees. A playbook that only makes the model slightly better is a guide, not a playbook; say so in your critique if you find one.

## 2b. Operator feedback is input, not orders (Akhil, 18 Oct)

Akhil is an engineer, not a marketer. His hand-test feedback is valuable signal about what feels wrong, but it is not marketing truth. Before changing a playbook because of operator feedback:
1. Have an independent senior-marketer reviewer (a subagent that has not seen our playbook) check the feedback: what is right, what is wrong, what is missing.
2. Act on what holds. Push back, with reasons, on what doesn't, and say so to the operator plainly.
3. Add what the operator missed.
Log the verdict for each point in the playbook's `critique.md`.

## 3. Folder layout and ownership

```
marketing-agent/
├── AGENTS.md                this file (owner: orchestrator)
├── README.md                human overview + how to test (owner: orchestrator)
├── foundation/<slug>/       marketing-agent (the router), guide, data-access (owner: orchestrator)
├── atoms/<atom>/ATOM.md     shared atoms several playbooks load (owner named in §8)
├── reviews/                 cross-set critique reports
└── playbooks/<slug>/        one folder per playbook (owner: the session assigned it)
    ├── SKILL.md             the playbook
    ├── skill.meta.json      metadata (format below)
    ├── references/*.md      craft knowledge the playbook loads when needed
    ├── atoms/<atom>/ATOM.md   hidden steps only this playbook uses
    ├── tests/test-by-hand.md  the spec's "How to test it", sharpened after critique
    ├── critique.md          every critique round: findings, what changed, what was rejected and why
    └── server-needs.md      tools/data the playbook needs that the MCP does not have today
```

- **You write only inside your own `playbooks/<slug>/` folders.** Never touch another playbook's folder, this file, or anything outside `marketing-agent/`.
- **A step several playbooks share lives once in `atoms/`** (claims gate, save-to-brain, spend gate…; list in §8). Load it from there; never copy it into your playbook. Only the owner named in §8 edits a shared atom; others send the owner a request.
- **No git writes.** No `git add`, `commit`, `stash`, `checkout`, `reset`, branch changes. Several sessions share this worktree; the orchestrator makes one commit and one PR at the end.

## 4. The GooseWorks MCP (the server contract)

Load the tool list with ToolSearch (`+gooseworks` and `+gooseworks-staging`). Read the descriptions of the tools your playbook needs. Name only tools that exist. If what the playbook needs is missing, write it in `server-needs.md` with: the need, which step needs it, and what the playbook does meanwhile (ask the human, degrade, or stop).

Test against **staging** (`gooseworks-staging` tools), never production. Read-only and research calls are fine. **Stop before any call that spends credits** (generation, paid data) and record what you would have run.

## 5. SKILL.md shape

Frontmatter:

```yaml
---
name: <slug>
description: >-
  <trigger phrases first, in the marketer's words; then what it delivers; then "Not for X — use Y" for its nearest neighbour>
---
```

- **Description ≤ 1,024 characters** (the Agent Skills limit several hosts enforce). Always use the `>-` block form: a description that opens with a quoted phrase and continues after the quote is invalid YAML.
- **Atoms are not skills.** An atom's file is `atoms/<atom>/ATOM.md` (not `SKILL.md`), so hosts that scan folders never list it.
- **Never name a playbook, tool, id, model or vendor to the marketer.** Say what happens next in plain words ("I'll check your claims first"), not "run learn-my-brand". Credits are quoted exactly as GooseWorks gives them: never dollars, never your own sums.

Body sections, in order: **What you get** (the output, concretely) · **Before you start** (connection check, brain read, what to ask only if missing) · **Steps** (the process a great marketer follows, each step saying what it reads and writes) · **Approval gates** · **Output and write-back** · **Done when** · **Out of scope** (and which playbook owns it).

Write for an agent: precise, imperative, no filler. Put long craft knowledge (frameworks, benchmarks, checklists, examples of excellent output) in `references/` and load it at the step that needs it, so the SKILL.md stays short.

`skill.meta.json`:

```json
{
  "slug": "<slug>",
  "tier": "playbook",
  "version": "0.1.0",
  "pillar": "<pillar number and name from page 00>",
  "intents": ["<what the marketer says>", "..."],
  "reads": ["<artifact or brain item it reads, and from which playbook>"],
  "writes": ["<artifact or brain item it writes back>"],
  "needs": { "mcp": ["gooseworks:<tool>"] },
  "atoms": ["<local atom slug>"],
  "shared_atoms": ["<shared atom slug>"]
}
```

- `atoms`: this playbook's own local atoms only (`playbooks/<slug>/atoms/<atom>/`), as plain slugs. `shared_atoms`: atoms it loads from the shared `marketing-agent/atoms/` folder, as plain slugs.
- **Shared-atom paths inside a playbook** are always file-relative: `../../atoms/<atom>/ATOM.md` from the playbook's `SKILL.md`, `../../../atoms/<atom>/ATOM.md` from `references/` or `tests/`, `../../../../atoms/<atom>/ATOM.md` from inside a local atom. Never the bare `atoms/<atom>` shorthand, which reads as the playbook's own `atoms/` folder.

## 6. The critique loop (the most important part)

The bar is: **these skills are the work a marketer does, at the depth a great marketer does it.** Missing a job or going shallow is the failure we are guarding against. Use subagents for every critique (`effort: high`; `xhigh` for the final round). Run at least these, and loop until a round finds nothing major:

1. **Scope critic, before you write.** Give it the spec, the pillar's section of page 00 and page 01. Ask: what does a senior marketer do in this job that the spec misses? Which company types (DTC, B2B SaaS, consumer app, marketplace seller, local business, services) would find it incomplete? What recurring and reactive work around it is missing?
2. **Depth critic, before you write.** Ask: what does an excellent output look like, concretely? What would a senior practitioner check that a junior misses? Which frameworks, benchmarks and failure modes must the playbook encode?
3. **Adversarial run, after you write.** Have a subagent run the playbook as written, step by step, for three different brands (a DTC skincare brand, a just-launched B2B SaaS, a pre-revenue consumer app). Where does it break, stall, ask something it should have known, invent something, or produce output a marketer would rewrite?
4. **Contract check, after you write.** Every tool named exists on the MCP; every "reads" item has a writer; every "writes" item has a reader or a reason; nothing violates §2.

Log every round in `critique.md`: the finding, the fix, or why it was rejected. A finding you decide not to fix needs a reason a reviewer can check.

## 7. Done for a builder session

- Each assigned playbook has every file in §3, filled.
- The last critique round found nothing major, and `critique.md` shows it.
- One staging run per playbook up to the first paid step, recorded in `tests/test-by-hand.md` (what you ran, what came back).
- A short report to the orchestrator: what you built, the biggest open gaps, and the `server-needs.md` highlights.

## 8. Shared conventions (added after the 16 Oct cross-set review)

Every playbook follows these exactly. The shared atoms implement them; the reviews behind them are in `reviews/2026-10-16-*.md`. Server facts below were checked in gooseworks-app `origin/dev`.

### Shared atoms and their owners

| Atom (`atoms/<slug>/ATOM.md`) | Does | Owner session |
|---|---|---|
| `claims-gate` | Load learn-my-brand's claims contract once, classify every claim-like span, keep / rewrite / cut, list each cut with the proof that would restore it. Also the inline **scoped sign-off**: when no sign-off exists, put the 3–5 lines this job needs to the human and record their answer through learn-my-brand's exact contract. Makers keep their own extract step (image text, video scenes). | learn-my-brand |
| `save-learning` | The one seam for writing learnings into the brand brain, by the rules below. Holds any interim handling of today's server. | learn-my-brand |
| `voice-card` | Build, read and update `brand/voices/<handle>.md`; learn-my-brand's rules beat a card's style. | learn-my-brand |
| `save-to-brain` | Workspace file → brand document, with `versioned: supersede | keep-history`. | research-market |
| `spend-gate` | Engine-quoted branch and proxy branch (probe, ceiling, log); automation rule. | research-market |
| `outcomes-ledger` | Human-filled status per person or creator, permanent suppression, re-check date, dated lessons. | research-audience |
| `ad-policy-check` | Paid-ad platform rules (Meta, TikTok, Google, LinkedIn) incl. personal-attribute and before/after rules. Organic, email and creator disclosure share `atoms/ad-policy-check/disclosure.md`. | make-static-ads |
| `honest-review` | Shared principles for reviewing generated media: by eye vs automatic read, what to do when the agent cannot see images, remake only on a priced yes, two tries. Rubrics stay per playbook. | make-static-ads |
| `write-report` | Write any research, plan, strategy or report for a human reader (summary first, plain words, flow, no ids or jargon) and deliver it so it opens: a local file with a clickable link, an artifact in hosted chat, plus a saved copy with a link. **Every playbook that hands over a document uses it.** | orchestrator |
| `run-memory` | Gives a repeatable playbook a memory of its own runs. **Start:** find the last run record, check each earlier recommendation (done / not done / unknown, and its measured result), and write 3–5 lines of "since last time". **End:** save a short run record (checked, numbers, decisions, recommendations with id, owner, review-by date and test, outcomes of the last ones) through `save-to-brain`. | orchestrator |

The connection preamble, brand pick, workspace scope and the index of every sibling artifact path live in `foundation/guide` (owner: orchestrator).

### Connection
- No `gooseworks:` tools listed (after one `tools_load` for a missing group) → say only: "Connect GooseWorks first — I <do this job> through it." Nothing else runs.
- First GooseWorks call of a conversation: `get_started` with the marketer's words. Its answer settles setup and the brand only; this playbook's gates win.
- `tools_load` groups: brand, media, files, ads, campaigns, meta, social, automation, data, helper.

### Workspace
- Every file uses the brand coworker scope from the `brand_read` list (`coworker_agent_id`). No coworker → default workspace with every path prefixed `brands/<brand-slug>/`, and tell the human. Never the org shared scope.
- Folders: `runs/<playbook>/<job-slug>/` (run records) · `brand/` · `research/{market,competitors,audience}/` · `creators/` · `social/{listening,calendar}/` · `content/` · `search/` · `lifecycle/` · `ads/{batches,videos,campaigns}/` · `reports/performance/` · `plans/`. Dates `YYYY-MM-DD`.
- Read before write (`file_write` replaces the file). In another playbook's file, only append under your own request lines.
- Request lines: `<Kind> needed: for <playbook> · <what> · return to: <path>`. Answer under it: `<Kind> ready: <link or ids> · <date>`. The requester reads its answers on its next run.
- `ads/campaigns/<slug>/` follows the server's campaign-harness contract: `state.md` frontmatter with `meta_push_ids` / `goose_campaign_id`; recommendations as `- R<n> (YYYY-MM-DD): …`; decisions as `### YYYY-MM-DD — <title>` blocks.

### Brand documents
Title `<Artifact> — <Brand> — <YYYY-MM-DD>` (records add ` v<N>`); tags `[<playbook>, <artifact>]`. Write the file → `media_upload` (document) → `knowledge_import` → `job_get` until ready → delete the previous version of a record (never period artifacts such as weekly reads) → confirm with `brain_search` where listed, else `knowledge_search`. Any answer showing a price → stop and ask.

### Learnings and the brand brain
- **Two seams only.** Playbooks write to the brand brain through `atoms/save-learning` (short rules) and `atoms/save-to-brain` (documents). Nothing else writes brain memory directly: these two atoms are the only way to write brain **memory** (learnings and documents). Typed brand fields a playbook's spec owns — `brand_update` kit / products / onboarding / audience proposals, `knowledge_import` of the brand's own published URLs, `competitor_save`, `campaign_upsert`, and the matching **typed `brain_save` targets** (`audience`, `operating_plan`, `competitor`, `product`, kit fields) — are written directly by the playbook whose spec owns that field, as its spec says (orchestrator ruling, 16 Oct; brain targets added 20 Oct). Such a save is `found`, never `confirmed`; audience, plan, budget and positioning changes wait for the human's yes in the app, and the playbook says so. Learnings and documents still go only through the two seams. The rebuilt Brand Brain (`brain_*` tools) is live on staging; the two atoms already use it when it is listed (see "Brand Brain tools" below), so playbooks do not change when production gets it.
- **Do not design around today's server limits.** The rebuild removes the current silent cut of long fact text and the ad/video engines' small fact window, and the video agent gets the full brand context. Playbooks must not ration learnings or shorten them to fit today's limits. Any interim handling lives inside `save-learning`, nowhere else.
- Learnings are written only with the human's own words as the statement. One exception, brain path only: `run-memory` may save a numbers-only measured readout (kind 23 `experiment_readout.<id>`, a `worked` / `didn't work` verdict with its truth/claimed label) without them, never from a scheduled run; it is a result, never a rule. One idea per learning, so it can be found, merged and retired. Retire your own superseded learnings when you write a new one. Prefix `[<source> YYYY-MM-DD]`: learning (analyze-performance, plus ` A-NN` for an angle) · market · angle A-NN · listening · search · lifecycle · content · social · ads (make-static-ads) · video (make-video-ads) · photos · outreach (research-audience) · outreach-copy (write-outreach) · creators (work-with-creators). learn-my-brand's facts keep their fixed openings, and only learn-my-brand writes or retires them (`Policy:` included); `Standing offer:` is the one opening shared with email-lifecycle. `must`/`dont` only for rules the human stated.

### Brand Brain tools (decided 19 Oct)
- **Prefer `brain_*` where listed; fall back otherwise.** Read: `brain_map` first (core rules, never-list, items waiting for the human's yes, chapter read hints), then `brain_open` / `brain_search` for the task. Without them: `brand_read`, then `knowledge_search`. Write: only through `save-learning` (learnings, and typed facts where a registered field fits) and `save-to-brain` (documents). `brain_save` has no document or report target yet, so documents keep the `media_upload` → `knowledge_import` route on both servers.
- **Agent saves are found, not confirmed.** Rules, positioning, audience, voice, pricing, offers and plan changes wait for the human's yes in the GooseWorks app. Never present an agent save, or an item waiting for a yes, as confirmed. Never accept a proposal unless the human said so in this conversation. Items with `is_public: false` stay internal, even in drafts.
- Production does not list `brain_*` tools yet (19 Oct). Every brain step needs its fallback.

### Run memory (decided 19 Oct)
- **Every repeatable playbook** (anything that can run again for the same brand, weekly, monthly or on request) loads its last run record at the start and saves a new one at the end, through `atoms/run-memory`. Scheduled runs with no human present do both. Anything needing a yes waits as a proposal, and open questions go into the report's "Decisions for you".
- **Recommendations are checked, not forgotten.** Each one carries an id, an owner, a review-by date and a test ("how we'll know"). The next run marks it done / not done / unknown from a source, never from inference, and judges its result against the recorded baseline. A move that didn't work is not repeated without a new reason.
- **Ads playbooks** keep a **per-ad scorecard** in every record (run-paid-campaigns, analyze-performance). run-paid-campaigns also keeps a short **money-move table**: each budget change, pause or launch with its `R<n>` / `change_id` / `push_id`, from → to, applied date, **baseline recipe** (object, metric, window, attribution, ad ids) and verdict. The next run re-pulls both windows and judges the extra results against the allowable cost, after the change's learning days and with settled data. The campaign harness files (`state.md`, `decisions.md`) stay the source of truth for approval state and checks; the record links them and never forks them.
- A run record is a few hundred words, never the report, and never holds personal data.
- Marker: a `must` fact starting `Claims sign-off (learn-my-brand,` with status token `signed-off`, `pending-client` or `not-signed`. Match `signed-off` exactly. This is the older path. When `brain_*` tools are listed, `claims-gate` reads the brain's claim statuses instead: only `confirmed` claims, opened and checked, are usable; no marker is needed; a line approved in chat waits as *found* until the human confirms it in the app. Playbooks do not change.
- `signed-off` → usable claims are the `Claims you may use —` facts in `brand_read` learnings (a lean read returns every must/dont), one claim per learning, verbatim, in scope, before its review date, with its qualifier. Variants and proof: the Brand record the marker names, read with `file_read`, never through search snippets.
- Not approved: search snippets, kit `approvedClaims` / `proofPoints` / `valueProps`, `["claim"]` search rows, the live site, a yes in chat that did not go through `claims-gate`.
- Across the playbooks, "signed-off claims" means claims usable through `claims-gate` on either path; only the older path looks for the marker.
- A line the job needs that isn't usable (older path: no `signed-off` marker or not on the list; brain path: not a confirmed brain claim) → run `claims-gate`'s scoped sign-off for those lines; if the human declines, plain product facts only (name, price, size, listed ingredients, how to use; never benefit wording).
- Always apply every `dont` and `must`.

### Money and publishing
- Engine-priced work (ads, photos, video): dry run, the quote exactly as given, the human's yes, then submit.
- Proxy data: one yes to a ceiling "up to N credits", estimated from the credits log (or, with no history, from one small probe run inside that same ceiling), labelled an estimate; stop at it; log every charge in `research/credits-log/<YYYY-MM>.md` (`date | playbook | tool/endpoint | query kind | items | credits`).
- Automations are created paused. The yes names any standing per-run data ceiling; never spend data credits in a scheduled run without one.
- Nothing is sent, posted, launched, paused or switched on without the human's yes in this conversation.

### Public web pages
Reading a public web page with the host's own fetch, browser or **web search** is allowed (no key involved): news, press, funding, launches, changelogs, job posts, ad-library pages. Research playbooks should use web search for news and recent events by default, not only when asked. Bulk social, search and ad-library reads go through the proxy (`foundation/data-access`).

### Research playbooks: the shared pattern (decided 17 Oct, after the first hand tests)

Applies to research-competitors, research-market (which now includes social listening), research-audience, work-with-creators and improve-search-visibility. The first hand tests failed the same way: questions before research, two credit yeses before any result, almost no web search, a chat summary instead of a report.

1. **Free pass first, ask nothing** — with one exception: when the brand already has customers, the agent may ask **one specific question up front** for the brand's own customer data (a customer list or export, win/loss notes, churn reasons, support themes), because that is the best source and no public read replaces it. Then the free pass. Before the first message to the marketer, do everything free: the brand brain and saved files; web search, news first (launches, funding, shutdowns, hires, press) for the brand and every subject; the host browser on public pages (websites, pricing, changelogs, ad libraries, app stores, Reddit threads, review pages); the server's free reads. Cover every dimension of the job for every main subject; never stop after one source to ask "go deeper?".
2. **Then one message:** what was found, the draft answer, and only the decisions left (scope, a paid top-up, what to act on). Never ask a fact the free pass could find.
3. **One credit yes, not two.** Show the estimate for the paid top-up and get one yes to a ceiling "up to N credits"; stop at it. Paid reads deepen a free result; they are never the starting point. (Mechanics: `atoms/spend-gate`.)
4. **A readable report is the deliverable**, written and delivered through `atoms/write-report` (human-readable, opens with one click, saved to the brand). Never leave a report only on the GooseWorks server.
5. **Public review sites** (G2, Capterra, Trustpilot, app stores, Reddit): read pages with the host browser the way a person would. No bulk scraping, no paging through hundreds of reviews by script.
6. **An optional area picker** is fine when the ask is broad: "Everything" is the default, recommended option; whatever is picked is covered completely.
7. **Every finding that matters ends in "For you"** ("nothing to do here" is a valid answer; don't invent moves to fill the line). Read the brand's own side in the free pass too (its ads in the same libraries, recent posts, product and pricing, approved claims, past learnings). Each finding closes with: does this fit us (yes/no and why, from our facts); if yes, what to make (format, hook, product, the approved claim that backs it) and which maker does it. The report has a "You vs them" section: ahead (say it louder), behind, and where everyone sounds the same. Research recommends; it never makes the asset.
   - **Guardrails:** don't follow the herd: when every rival does X, that is a reason to consider something else, and recommendations weigh what buyers say over what rivals do. No proof, no claim: a recommendation that needs an unapproved claim says "you'd need proof of X first".
   - **Facts-only mode:** when the ask is facts only (an investor update, a board slide, a market map), skip "For you". With an empty brand brain, say "I can't tell what fits you yet" and offer to learn the brand first, instead of guessing.

### Schedules (decided 18 Oct; cadences set after the marketer review)
At the end of every run, the agent **judges** whether repeating this job on a schedule would help this brand, and offers it only when it would, with the reason and a cadence. Default cadences:
- **Market:** a monthly one-page pulse ("what changed") plus a full report each quarter.
- **Competitors:** weekly, silent unless something crosses a threshold; a full teardown each quarter.
- **Audience:** twice a year, or when a trigger fires (new product, new market, a big shift in win/loss).
- **Brand watch** (research-market's mode): weekly by default, daily during a launch or a crisis; alerts only.
- **Social calendar:** every two weeks. **Search visibility:** monthly. **Performance:** weekly.
Never for one-off jobs (a single post, a photo set, a one-time list). Each scheduled run writes a run record (`atoms/run-memory`). It sends a report through `atoms/write-report`, opening with what changed since the last one, only when something crosses the job's threshold or a question is due. Quiet watches stay silent but still save their record. Schedules are created paused and follow `atoms/spend-gate`'s automation rule.

### Social listening lives in research-market (decided 18 Oct)
listen-social is no longer a playbook. Its listening steps are an atom of research-market (category and brand conversations, customer language). Reply drafting moves to BACKLOG.md. Readers of its old outputs read research-market's report instead.

### Creative tags
Lower-case only (`angle:a-07`, `picked`, `offer-ends:20261031`), queried lower-case. Picks also go in the batch file.

### Keep SKILL.md lean
SKILL.md holds the process. Edge-case procedure (dates, paging, re-runs, save order) goes in an atom; craft goes in references. Every research or plan artifact opens with "Do this first, because…".
