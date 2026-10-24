# Human version

**What this folder is.** The GooseWorks marketing agent's skills, rebuilt from scratch: 14 released playbooks, their steps ("atoms"), the shared steps and 2 foundation skills, all published to the GooseWorks catalog as separate skills. Customers reach them through the `gooseworks` entry skill's router (`skills/entry/gooseworks/routes.json`). Three more (learn-my-brand, make-video-ads, make-product-photos) are built but held back in `drafts/marketing/` until their server work exists (the owner, 20 Oct; see `drafts/marketing/README.md`). A playbook is one marketer want, done end to end ("fill my email flows", "which ad won and what do I make next").

**Where things live.** The skills are in `skills/marketing/<slug>/` (published: `scripts/build-index.js` lists every folder there in `skills-index.json`, domain `marketing-agent`, and a merge to `dev` syncs them to staging). This guide and the backlog are in `docs/marketing/`; evals in `evals/marketing/`; held-back playbooks in `drafts/marketing/`. **Critique logs, server gaps and review reports are private:** they live in goose-lab under `plan/marketing-agent/` (§3). The old GTM library was deleted on 23 Oct (`retired-skills.json`, tag `legacy-gtm-final`); we built these from scratch rather than patch it.

**The rules in one breath.**
- Never read `skills/video/`, `skills/shared/`, `parts/` or `collections/`. Build from the specs and from first principles of marketing.
- Never edit anything outside `skills/marketing/`, `docs/marketing/`, `evals/marketing/` and `drafts/marketing/` here, and `plan/marketing-agent/` in goose-lab.
- Critique hard and often, with subagents: **scope** (did we miss work a marketer does?) and **depth** (would a senior marketer accept this output?). Log every round in goose-lab, `plan/marketing-agent/critiques/<slug>.md`.
- Each builder owns its own folders only. No git writes. One PR at the end.

---

# Agent version

## 1. Source material (read these, in this order)

All in the GooseWorks Company OS repo (goose-lab, private) under `plan/marketing-twin/`:

| File | What it gives you |
|---|---|
| `specs/NN-<playbook>.md` | **Your hand-off sheet.** The want, inputs, steps, output, approval gates, done-when, how to test, out of scope. Start here. |
| `00-what-a-marketer-does.md` | The full inventory of marketing work (day-one inputs + all pillars). The measuring stick for scope. |
| `01-how-the-work-gets-done.md` | Per pillar: what a good marketer must know, and the process they follow. The measuring stick for depth. |
| `01-what-the-agent-must-know.md` | The knowledge the agent needs, split into company facts / craft / live data. |
| `01a-source-maps-by-section.md` | Where each kind of knowledge comes from. Large; grep your pillar, don't read it whole. |
| `decisions-and-parking-lot.md` | Every decision (D1–D5) and what was rejected. Respect the decisions. |

**Do not read** `skills/video/`, `skills/shared/`, `parts/`, `collections/`, or old skills anywhere (the `legacy-gtm-final` tag, goose-studio, goose-lab `coworkers/`). This is a deliberate rebuild; old skills pollute the design. Read `skills/marketing/` freely: the playbooks, steps and foundation skills are what you build on. The other exception: the GooseWorks MCP tool descriptions (see §4) are the server contract, and you must read them.

## 2. Architecture rules (decided; do not re-litigate)

From the goose-skills rebuild plan and the marketing-twin decisions (both in goose-lab):

1. **The user is an AI agent with a computer** (Claude Code, Codex, Cursor…) doing a founder's or marketer's work. Hosted chat connectors (Claude.ai, ChatGPT) have no shell: every playbook must still work there using MCP-only steps.
2. **Playbooks are listed and user-invoked. Atoms are hidden** and loaded by a playbook. Users only ever see playbooks.
3. **Media, money and state live on the GooseWorks MCP.** Reference a tool by name as `gooseworks:<tool>`. Never re-describe its parameters (the live schema is the truth). Never invent a tool.
4. **No vendor keys, ever.** Public data goes through the GooseWorks data proxy (`gooseworks:data_call_provider` and friends). No `APIFY_API_TOKEN`, `FAL_KEY`, `APOLLO_API_KEY`, `ELEVENLABS_API_KEY`, `OPENAI_API_KEY` in any file.
5. **The brand brain is the single memory** (D5). Read it first (`brand_read`, `knowledge_search`, or whatever the live MCP exposes). Write durable results back into it (claims list, competitor set, voice-of-customer bank, learnings). If the write-back tool does not exist yet, record it in goose-lab `plan/marketing-agent/server-needs/<slug>.md`; do not fake it with a local file pretending to be memory (except local mode, `skills/marketing/marketing-guide/SKILL.md` §5, in the playbooks that declare it).
6. **Without the GooseWorks connection a playbook stops** with one clear sentence telling the user to connect GooseWorks, except local mode (`skills/marketing/marketing-guide/SKILL.md` §5) in the playbooks that declare it. It never half-runs.
7. **Never invent facts.** No made-up offers, claims, proof, customers or numbers. Claims come only from the brand's approved-claims list; anything else is cut and shown to the human.
8. **Money moves and publishing are human decisions.** Spend, launches, sends and posts are proposals the human approves. Paid generation needs the user's yes to the credit total first.
9. **Workflows never call other playbooks.** They chain through written artifacts: one playbook writes, the next reads (see each spec's "from sibling playbooks"). A playbook may **offer** the next job to the human in plain words; it never starts another playbook itself — the human's own request does.
10. **Do not grow the surface** (the owner, 16 Oct). No new playbooks, and no new jobs inside a playbook, beyond its spec and the review fixes. A missing job goes on `BACKLOG.md` with a checkable trigger; the playbook says plainly "this isn't covered yet".
11. **Judgment stays with the model** (D2). Encode craft and process, not decision trees. A playbook that only makes the model slightly better is a guide, not a playbook; say so in your critique if you find one.

## 2b. Operator feedback is input, not orders (decided 18 Oct)

The person hand-testing a playbook is often the product owner or an engineer, not a marketer. Their feedback is valuable signal about what feels wrong, but it is not marketing truth. Before changing a playbook because of operator feedback:
1. Have an independent senior-marketer reviewer (a subagent that has not seen our playbook) check the feedback: what is right, what is wrong, what is missing.
2. Act on what holds. Push back, with reasons, on what doesn't, and say so to the operator plainly.
3. Add what the operator missed.
Log the verdict for each point in the playbook's critique log (goose-lab `plan/marketing-agent/critiques/<slug>.md`).

## 3. Folder layout and ownership

```
docs/marketing/
├── AGENTS.md                this file (owner: orchestrator)
├── README.md                human overview + how to test (owner: orchestrator)
└── BACKLOG.md               jobs not covered yet
drafts/marketing/<slug>/     built but held back (not published)
evals/marketing/             routing and behaviour evals
skills/marketing/<slug>/     one flat folder per published skill — each is its own catalog skill
    ├── <playbook>/          a playbook (owner: the session assigned it)
    │   ├── SKILL.md             the playbook
    │   ├── skill.meta.json      metadata (format below)
    │   ├── references/*.md      craft knowledge the playbook loads when needed
    │   └── tests/test-by-hand.md  the spec's "How to test it", sharpened after critique (stays in this repo, never published)
    ├── <playbook>-<step>/   a step only that playbook uses (SKILL.md + skill.meta.json), owned with it
    ├── <shared-step>/       a step several playbooks load (claims-gate, run-memory…; owner named in §8)
    └── marketing-guide/, marketing-data-access/   foundation skills (owner: orchestrator)

goose-lab (private): plan/marketing-agent/
    ├── critiques/<slug>.md      every critique round for that playbook or shared step
    ├── server-needs/<slug>.md   tools/data the playbook needs that the MCP does not have today
    └── reviews/                 cross-set critique reports
```

This repo is public. **Builder history never goes in it:** critique rounds, server gaps, reviews, people's names, session ids and real client or staging brand names go to goose-lab. Examples in published files use fictional brands.

**Why flat.** The catalog ships each skill as its own folder only, and an install puts them side by side (`~/.agents/skills/<slug>/`). With one flat folder per slug, `../<slug>/SKILL.md` resolves the same here, in an install, in the catalog archive and in the evals.

- **You write only inside your own playbook's folders** (`skills/marketing/<playbook>/` and `skills/marketing/<playbook>-<step>/`). Never touch another playbook's folder, this file, or anything outside the marketing folders above.
- **A step several playbooks share lives once, as its own skill** (claims gate, save-to-brain, spend gate…; list in §8). Load it from there; never copy it into your playbook. Only the owner named in §8 edits a shared atom; others send the owner a request.
- **No git writes.** No `git add`, `commit`, `stash`, `checkout`, `reset`, branch changes. Several sessions share this worktree; the orchestrator makes one commit and one PR at the end.

## 4. The GooseWorks MCP (the server contract)

Load the tool list with ToolSearch (`+gooseworks` and `+gooseworks-staging`). Read the descriptions of the tools your playbook needs. Name only tools that exist. If what the playbook needs is missing, write it in goose-lab `plan/marketing-agent/server-needs/<slug>.md` with: the need, which step needs it, and what the playbook does meanwhile (ask the human, degrade, or stop).

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
- **Every step is its own small skill** (decided 20 Oct by the owner): `skills/<slug>/SKILL.md` with `name`, `description` and `version`. A step that works alone says "<what it does>. Use alone when you already have <inputs>; otherwise run <playbook>." Every other step says "Step of the <playbook> playbook: …. Run <playbook> instead; not for direct use." Shared steps say which playbooks load them.
- **`name` is the folder name (the slug)** and slugs are unique across the whole catalog: a playbook's own step is `<playbook>-<step>`. The `version` in SKILL.md and `skill.meta.json` must match (the catalog reads SKILL.md; `scripts/validate-skills.js` checks). Raise it when the skill changes.
- **Never name a playbook, tool, id, model or vendor to the marketer.** Say what happens next in plain words ("I'll check your claims first"), not "run research-audience". The one exception: two or three outside tools the marketer must run themselves (an email finder, an email platform), as examples, never an endorsement (`skills/marketing/marketing-guide/SKILL.md` §3). Credits are quoted exactly as GooseWorks gives them: never dollars, never your own sums.

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
  "category": "playbooks",
  "tags": ["<from schemas/skill-meta.schema.json>"],
  "collections": ["brand-growth"],
  "collection_stage": "research | analyze | create",
  "requires_skills": ["<every skill it uses, flattened>"]
}
```

A step's meta is shorter: `slug`, `category: "capabilities"`, `tier: "atom"`, `version`, `playbook` (its playbook; a shared step has `used_by` instead), `tags`, `standalone`, `requires_skills`.

- **Referring to another skill:** "the `<slug>` skill (`../<slug>/SKILL.md`)", or `../<slug>/<file>` for a file inside it, file-relative (one more `../` from `references/` or `tests/`). The path works on disk; the slug lets a hosted agent fetch it (`marketing-guide` explains this once). Files inside the skill stay plain relative paths (`references/<file>.md`). Never link `unreleased/`, `BACKLOG.md` or this file from a published skill.
- **`requires_skills`** lists every skill it refers to, **flattened**: only one level of dependencies is delivered, so a playbook also lists what its steps need. A step does not list the playbook that runs it, unless it works alone and reads that playbook's references. Shared steps and foundation skills never require a playbook. `node scripts/check-skill-links.js` (in CI) checks every reference resolves in the installed layout, names a listed dependency, and that the list is flat.

## 6. The critique loop (the most important part)

The bar is: **these skills are the work a marketer does, at the depth a great marketer does it.** Missing a job or going shallow is the failure we are guarding against. Use subagents for every critique (`effort: high`; `xhigh` for the final round). Run at least these, and loop until a round finds nothing major:

1. **Scope critic, before you write.** Give it the spec, the pillar's section of page 00 and page 01. Ask: what does a senior marketer do in this job that the spec misses? Which company types (DTC, B2B SaaS, consumer app, marketplace seller, local business, services) would find it incomplete? What recurring and reactive work around it is missing?
2. **Depth critic, before you write.** Ask: what does an excellent output look like, concretely? What would a senior practitioner check that a junior misses? Which frameworks, benchmarks and failure modes must the playbook encode?
3. **Adversarial run, after you write.** Have a subagent run the playbook as written, step by step, for three different brands (a DTC skincare brand, a just-launched B2B SaaS, a pre-revenue consumer app). Where does it break, stall, ask something it should have known, invent something, or produce output a marketer would rewrite?
4. **Contract check, after you write.** Every tool named exists on the MCP; every "reads" item has a writer; every "writes" item has a reader or a reason; nothing violates §2.

Log every round in goose-lab `plan/marketing-agent/critiques/<slug>.md`: the finding, the fix, or why it was rejected. A finding you decide not to fix needs a reason a reviewer can check.

## 7. Done for a builder session

- Each assigned playbook has every file in §3, filled.
- The last critique round found nothing major, and the critique log shows it.
- One staging run per playbook up to the first paid step, recorded in `tests/test-by-hand.md` (what you ran, what came back).
- A short report to the orchestrator: what you built, the biggest open gaps, and the server-needs highlights.

## 8. Shared conventions (added after the 16 Oct cross-set review)

Every playbook follows these exactly. The shared atoms implement them; the reviews behind them are in goose-lab `plan/marketing-agent/reviews/2026-10-16-*.md`. Server facts below were checked in gooseworks-app `origin/dev`.

### Shared atoms and their owners

| Shared step (`skills/marketing/<slug>/SKILL.md`) | Does | Owner session |
|---|---|---|
| `claims-gate` | Load the brand's claims contract once, classify every claim-like span, keep / rewrite / cut, list each cut with the proof that would restore it. Also the inline **scoped sign-off**: when no sign-off exists, put the 3–5 lines this job needs to the human and record their answer through the contract in its §5. Makers keep their own extract step (on-image text, page sections, post copy). | orchestrator (was learn-my-brand, held back 20 Oct) |
| `save-learning` | The one seam for writing learnings into the brand brain, by the rules below. Holds any interim handling of today's server. | orchestrator (was learn-my-brand, held back 20 Oct) |
| `voice-card` | Build, read and update `brand/voices/<handle>.md`; the brand's rules (every `dont` and `must`, the claims contract, the confirmed brand voice) beat a card's style. | orchestrator (was learn-my-brand, held back 20 Oct) |
| `save-to-brain` | Workspace file → brand document, with `versioned: supersede | keep-history`. | research-market |
| `spend-gate` | Engine-quoted branch and proxy branch (probe, ceiling, log); automation rule. | research-market |
| `outcomes-ledger` | Human-filled status per person or creator, permanent suppression, re-check date, dated lessons. | research-audience |
| `ad-policy-check` | Paid-ad platform rules (Meta, TikTok, Google, LinkedIn) incl. personal-attribute and before/after rules. Organic, email and creator disclosure share `skills/marketing/ad-policy-check/disclosure.md`. | make-static-ads |
| `honest-review` | Shared principles for reviewing generated media: by eye vs automatic read, what to do when the agent cannot see images, remake only on a priced yes, two tries. Rubrics stay per playbook. | make-static-ads |
| `write-report` | Write any research, plan, strategy or report for a human reader (summary first, plain words, flow, no ids or jargon) and deliver it so it opens: a local file with a clickable link, an artifact in hosted chat, plus a saved copy with a link. **Every playbook that hands over a document uses it.** | orchestrator |
| `run-memory` | Gives a repeatable playbook a memory of its own runs. **Start:** find the last run record, check each earlier recommendation (done / not done / unknown, and its measured result), and write 3–5 lines of "since last time". **End:** save a short run record (checked, numbers, decisions, recommendations with id, owner, review-by date and test, outcomes of the last ones) through `save-to-brain`. | orchestrator |

The connection preamble, brand pick, workspace scope, the shared runtime rules (claims, money, research pattern, schedules) and the index of every sibling artifact path live in `skills/marketing/marketing-guide/SKILL.md` (owner: orchestrator). The runtime text points there or to an atom, never to this file. The sections below keep the decisions and why.

### Connection
Runtime rule: `skills/marketing/marketing-guide/SKILL.md` §1. Local mode (guide §5) is declared by `skill.meta.json` `needs.gooseworks` starting "optional": plan-campaign, run-paid-campaigns, analyze-performance only.

### Workspace
Runtime rules: `skills/marketing/marketing-guide/SKILL.md` §2 (scope, read before write, request lines) and §4 (every path, who writes it, who reads it).
- When a playbook changes a path, it updates guide §4's table in the same change. Paths only the held-back playbooks write are in `drafts/marketing/README.md`.
- `ads/campaigns/<slug>/` follows the server's campaign-harness contract: `state.md` frontmatter with `meta_push_ids` / `goose_campaign_id`; recommendations as `- R<n> (YYYY-MM-DD): …`; decisions as `### YYYY-MM-DD — <title>` blocks.

### Brand documents
Runtime rules: `skills/marketing/save-to-brain/SKILL.md` (title, tags, upload → import → retire → verify).

### Learnings and the brand brain
Runtime rules: `skills/marketing/save-learning/SKILL.md` (learnings and typed facts, openings, prefixes) and `skills/marketing/save-to-brain/SKILL.md` (documents).
- **Two seams only** (orchestrator ruling, 16 Oct; typed `brain_save` targets added 20 Oct). Brain **memory** (learnings and documents) is written only through those two atoms. Typed brand fields a playbook's spec owns (`brand_update` kit / products / onboarding / audience proposals, `knowledge_import` of the brand's own published URLs, `competitor_save`, `campaign_upsert`, and the matching typed `brain_save` targets) are written directly by that playbook, as `found`; audience, plan, budget and positioning changes wait for the human's yes in the app.
- **Do not design around today's server limits.** The rebuild removes the silent cut of long fact text and the engines' small fact window. Playbooks never ration or shorten learnings; any interim handling lives inside `save-learning`.
- The fixed-opening facts (`Claims sign-off (learn-my-brand, …`, `Claims you may use —`, …) keep learn-my-brand's opening as a data format although it is unreleased; only `claims-gate` §5 writes the marker and claims.

### Brand Brain tools (decided 19 Oct)
Prefer `brain_*` where listed and fall back to `brand_read` / `knowledge_search` otherwise: production does not list `brain_*` yet, so every brain step needs its fallback, and playbooks do not change when production gets it. Runtime rules, including found vs confirmed: guide §1.4; writes through the two atoms above.

### Run memory (decided 19 Oct)
- **Every repeatable playbook** (anything that can run again for the same brand, weekly, monthly or on request) loads its last run record at the start and saves a new one at the end, through `skills/marketing/run-memory/SKILL.md`. Scheduled runs with no human present do both. Anything needing a yes waits as a proposal, and open questions go into the report's "Decisions for you".
- **Recommendations are checked, not forgotten.** Each one carries an id, an owner, a review-by date and a test ("how we'll know"). The next run marks it done / not done / unknown from a source, never from inference, and judges its result against the recorded baseline. A move that didn't work is not repeated without a new reason.
- **Ads playbooks** keep a **per-ad scorecard** in every record (run-paid-campaigns, analyze-performance). run-paid-campaigns also keeps a short **money-move table**: each budget change, pause or launch with its `R<n>` / `change_id` / `push_id`, from → to, applied date, **baseline recipe** (object, metric, window, attribution, ad ids) and verdict. The next run re-pulls both windows and judges the extra results against the allowable cost, after the change's learning days and with settled data. The campaign harness files (`state.md`, `decisions.md`) stay the source of truth for approval state and checks; the record links them and never forks them.
- A run record is a few hundred words, never the report, and never holds personal data.

### Claims
Runtime rules: `skills/marketing/claims-gate/SKILL.md` (both paths: the older sign-off marker, and confirmed brain claims when `brain_*` is listed). Across the playbooks, "signed-off claims" means claims usable through `claims-gate` on either path.

### Money and publishing
Runtime rules: `skills/marketing/spend-gate/SKILL.md` (engine quotes, the proxy ceiling and credits log, automations) and guide §3 "Publishing".

### Public web pages
Reading a public web page with the host's own fetch, browser or **web search** is allowed (no key involved): news, press, funding, launches, changelogs, job posts, ad-library pages. Bulk social, search and ad-library reads go through the proxy (`skills/marketing/marketing-data-access/SKILL.md`).

### Research playbooks: the shared pattern (decided 17 Oct, after the first hand tests)
The first hand tests failed the same way: questions before research, two credit yeses before any result, almost no web search, a chat summary instead of a report. The fix (free pass first, one message, one credit yes, a readable report, "For you" on every finding) is `skills/marketing/marketing-guide/research-pattern.md`, pointed to from guide §3.

### Schedules (decided 18 Oct; cadences set after the marketer review)
The agent judges whether a schedule helps and offers it only then; never for one-off jobs. Cadences and the scheduled-worker rule: guide §3 **Schedules.**

### Social listening lives in research-market (decided 18 Oct)
listen-social is no longer a playbook. Its listening steps are an atom of research-market (category and brand conversations, customer language). Reply drafting moves to BACKLOG.md. Readers of its old outputs read research-market's report instead.

### Creative tags
Lower-case only (`angle:a-07`, `picked`, `offer-ends:20261031`), queried lower-case. Picks also go in the batch file.

### Keep SKILL.md lean
SKILL.md holds the process. Edge-case procedure (dates, paging, re-runs, save order) goes in an atom; craft goes in references. Every research or plan report opens with the In short shape in `skills/marketing/write-report/SKILL.md` §1: what we looked at, the key findings, then "So, do this first". Working records that planners read still open with "Do this first, because…".
