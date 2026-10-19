# Human version

**What this is.** Evals that tell us whether each marketing playbook actually helps. For each playbook we run the same marketer's ask up to three times — **with** the new playbooks, with the **old** goose-skills a user would have used for the job (legacy), and with **no** marketing skills (baseline) — and an AI judge scores each run against the same pass/fail checklist. If the baseline or the old skills do as well, the new playbook isn't earning its place.

**In short**
- **Two kinds of eval.** *Routing:* given only the 19 skill descriptions, does a model pick the right playbook for 68 real asks? *Behaviour:* does a full run of a playbook deliver what a good marketer would, compared with no skill?
- **Seven behaviour evals so far**, one per hand-tested playbook: research-market, research-audience, research-competitors, run-organic-social, plan-campaign, improve-search-visibility, where-to-start. All use the GooseWorks brand on **staging**, with Akhil's real opening asks from the 18 Oct hand tests.
- **Nothing is spent or published.** Paid and publishing GooseWorks tools are switched off for the agent, production GooseWorks is blocked, and the simulated marketer declines every top-up.
- **Every arm starts from the same brand state.** The runner snapshots the staging Gooseworks brand before an arm and undoes that arm's changes afterwards (details below).
- **Results land in `evals/results/<date>/`** (not committed): one `summary.md` per playbook with a side-by-side table.

## How to run one

From this folder (`marketing-agent/evals/`), with Node 20+ and the `claude` CLI signed in:

```bash
# Routing: all 68 asks, cheap (Haiku). About 3 minutes.
node run.mjs routing

# One playbook, both arms, default models (Sonnet agent, Haiku marketer, Opus judge).
node run.mjs playbook research-market

# Every behaviour eval, then the routing eval, plus a suite summary.
node run.mjs all

# The three-way comparison for one playbook (baseline, legacy, with-skill).
node run.mjs playbook research-market --mode all

# Re-score saved runs (for example after adding expert criteria to a rubric).
node run.mjs judge results/2026-10-18/research-market
```

Useful options: `--mode with-skill|baseline|both` · `--subject-model sonnet|opus|haiku` · `--judge-model opus` · `--max-turns 10` · `--arm-cap 60` (wall-clock minutes per arm; the arm stops with "time cap") · `--turn-timeout <min>` (default: the arm cap) · `--effort high` · `--keep-workspace` (keep the temp folder to inspect) · `--no-judge` · `--out <dir>`.

## Before the first run: clean the staging brand once

Earlier hand tests and evals left reports, plans and a campaign on the staging Gooseworks brand. Arms would read them. List what would go, then apply:

```bash
node run.mjs brand-clean --since 2026-10-16          # dry run: lists, changes nothing
node run.mjs brand-clean --since 2026-10-16 --apply  # deletes files and documents, archives campaigns
```

It only touches marketing folders (research/, plans/, social/, search/, brand/…) and documents, learnings and campaigns dated on or after `--since`. Items it cannot remove through the tools (inspiration saves, competitor rows) are listed as "flag" and left alone. Each run writes its list to `results/brand-clean/`.

## How to read the results

Open `results/<date>/<playbook>/summary.md`:

| Row | What it tells you |
|---|---|
| **Verdict** | PASS only if every must-pass criterion passed. |
| Must-pass / Should-pass | How many criteria passed in each arm. |
| Criteria table | Each criterion, with-skill vs baseline, side by side. |
| Evidence table | The judge's one-line quote for every verdict, so you can check it. |

**The skill helps** when the with-skill arm passes must-pass criteria the baseline fails. If both pass or both fail the same way, the skill adds little for that ask. `results/<date>/summary.md` puts all playbooks in one table when you run `all`.

To check the judge, open the arm folder: `transcript.md` (the whole conversation, every tool call), `files/` (the reports the agent wrote), `judge.json`, and `run.json` (turns, cost, why it stopped).

## Cost and time (rough)

| Eval | Time | Cost |
|---|---|---|
| Routing, 68 asks on Haiku | ~3 min | ~$1 |
| One behaviour eval, both arms | 10–120 min (60 min cap per arm) | ~$3–45 (research-competitors with the skill: ~45 min, ~$35) |
| The whole suite (7 playbooks + routing) | 5–12 hours, run unattended | ~$80–250 |

The agent (Sonnet) doing real research is most of the cost: a research run reads dozens of pages and spawns workers. The judge (Opus) adds about $1–3 per arm, the simulated marketer cents. Costs are what the CLI reports (`total_cost_usd`); on a Claude subscription they count against usage limits rather than a bill. GooseWorks credits spent: zero.

## Things to know

- **Brand isolation (added 19 Oct).** On 19 Oct arms read each other's saved work on the shared staging brand: the competitors skill arm re-delivered a same-day report in 4 minutes; where-to-start built its advice on a plan an earlier eval saved. Now each arm: (1) snapshots the brand (files in the brand and default workspaces, documents and other media, learnings, campaigns, competitors, automations, inspiration saves, onboarding answers, coworker notes, staging credits); (2) runs; (3) undoes what it changed — new files deleted, changed files written back, new documents and learnings deleted, new campaigns archived, new automations deleted, onboarding and notes restored; (4) checks nothing is left over. It only undoes changes the arm's own tool calls explain, so other people's work on staging during the arm is left alone. **What it can't undo** (no tool for it): competitor rows, inspiration saves, edits to a campaign that existed before. Those are listed in `run.json` → `brand_reset.flagged` and in the summary's "Reset" column. Turn it off with `--no-reset`.
- **Why this design** (compared on 19 Oct): a new brand per arm needs `brand_setup` with a website to get a real kit, which runs research (time, possibly credits), gives each arm a slightly different brand, and leaves brands behind (there is no brand delete tool). A pool of pre-made test brands needs the same reset between uses plus work to keep the copies identical; it only pays off if arms run in parallel, which they can't (one staging account). Snapshot-and-undo on the real brand is free, deterministic (direct server calls, no model), keeps the real kit, products and competitors, and leaves an audit trail.
- **The legacy arm (`--mode legacy`).** Installs, instead of the new playbooks, the old goose-skills a user would have used for the same job: `legacy/mapping.json` (2–4 per playbook, chosen from the router's routes, plus each one's `requires_skills`). They are copied from `skills/` in the goose-skills checkout above `marketing-agent/` (set `GOOSE_SKILLS_DIR` to use another checkout; it should be on `dev`). Check one without running an agent: `node run.mjs legacy-check all`. Many old skills need keys: `run.json` → `legacy.keys` lists what each needs and `legacy.key_failures` what actually failed for lack of a key or login. Those are findings about the old skills, not harness bugs.
- **Every arm runs as a user logged in to staging.** The agent gets a sandbox home: the real Claude config and user-level skills, but `~/.gooseworks/credentials.json` points at the **staging** CLI login. So old skills that read the CLI login reach staging, never production (the real home's login is production and is blocked). Old skills that call the GooseWorks API through `curl` can spend **staging test credits**; the runner records staging credits before and after every arm (`brand_reset.credits_spent`).
- **Old skills' paid data reads are blocked.** Skills that go through the GooseWorks data proxy hit a tool the evals switch off (no spending); the denials are in each turn's `permission_denials`.
- **No browser.** Headless runs have web search and web fetch, not a real browser, in both arms. Steps that need a browser (ad libraries, logged-out ChatGPT) degrade the same way for both.
- **The agent's other user-level skills and MCP servers are present in both arms** (for example the published `gooseworks` skill and the GooseWorks server's own instructions). That is the realistic baseline: a customer with GooseWorks connected but without these playbooks.
- **Expert criteria.** Six rubrics include pass/fail checks from the two senior-marketer reviews of 18 Oct (`marketing-agent-test/results/reviews/research-review.md` and `social-plan-search-review.md`). Checks the reviewers marked *new* need a playbook change first, so they are scored but not yet must-pass. where-to-start has no expert review yet. After editing a rubric, re-score saved runs with `node run.mjs judge …` instead of re-running.
- **New must-pass check (19 Oct): "Volunteered the document".** It fails when the marketer had to ask for a document before any file existed. The older "readable document" check still passes in that case, so together they separate volunteered reports from requested ones. Not added to where-to-start, whose deliverable is a chat answer.
- **The reviews changed two checks.** Agreeing with the marketer that "video works better on X" no longer passes; the agent must check and give a sourced verdict. And research playbooks may ask one specific question for the brand's own customer data before researching.

---

# Agent version

## Layout

```
evals/
├── run.mjs                     CLI entry (routing | playbook | judge | all | brand-clean | legacy-check | list)
├── lib/claude.mjs              spawns `claude -p` with a clean env; ask() for no-tool model calls
├── lib/files.mjs               skill frontmatter reader, scenario/rubric parsers
├── lib/routing.mjs             routing eval
├── lib/behaviour.mjs           subject ↔ simulator loop, workspace setup, transcript condensing
├── lib/judge.mjs               judge call, per-playbook and suite summaries
├── lib/mcp.mjs                 tiny MCP client for GooseWorks STAGING (auth from ~/.claude.json, refuses non-staging URLs)
├── lib/brandstate.mjs          brand snapshot, per-arm undo (attributed to the arm's own tool calls), one-time cleanup
├── lib/legacy.mjs              legacy arm: resolve and copy old skills + dependencies, key scan, key-failure scan
├── legacy/mapping.json         new playbook → old skills a user would have used
├── prompts/routing.md          system prompt for the routing picker
├── prompts/subject-note.md     appended to the subject's system prompt (staging, no spend, no browser)
├── prompts/simulator.md        system prompt for the simulated marketer (hard rules: decline top-ups, never approve spend/publishing)
├── prompts/judge.md            system prompt for the judge
├── routing/cases.jsonl         68 routing cases
├── playbooks/<slug>/scenario.md, rubric.md
└── results/                    gitignored output
```

## How a behaviour run works

1. **Workspace.** A fresh temp folder with: a neutral `README.md` (says "use staging"), `.claude/settings.json` copied from the hand-test folder (`~/projects/marketing-agent-test`, override with `GOOSE_EVAL_TEST_DIR`; denies production GooseWorks). `with-skill` also symlinks the 16 playbooks + 3 foundation skills into `.claude/skills/`, plus `.claude/{atoms,foundation,BACKLOG.md}` (playbooks reach shared atoms as `../../atoms`). `legacy` copies the old skills from `legacy/mapping.json` (plus their `requires_skills`, transitively, from `skills-index.json`) into `.claude/skills/` and writes `.claude/legacy-skills.json`. `baseline` adds nothing. Every arm also gets a sandbox home (`<tmp>/home`): links to the real `~/.claude`, `~/.claude.json`, `~/Library` (keychain), `~/.agents`, `~/.npm`, and `~/.gooseworks/credentials.json` → the staging CLI profile. The subject's Bash allow-list (same in every arm) adds python3, node, npx, export, jq and gooseworks, which old skills use; reading the real `~/.gooseworks/` is denied.
   **Brand snapshot** (unless `--no-reset`): taken before turn 1 via `lib/brandstate.mjs`. After the last turn the runner snapshots again, plans the undo, keeps only actions the arm's own tool inputs/results mention (file path, media id or title, learning id or text, campaign id or name, automation id), applies them, re-checks, and writes `brand_reset` into `run.json` (undone, flagged, errors, left_over, credits_before/after/spent).
2. **Subject turn.** `claude -p --model <subject> --output-format stream-json --verbose --append-system-prompt <subject-note> --permission-mode dontAsk --allowedTools … --disallowedTools …`, message on stdin, `--session-id` on turn 1 and `--resume` after. Env is cleaned to HOME/PATH/USER/SHELL/TMPDIR/LANG: an inherited `CLAUDE_CODE_SIMPLE` forces `--bare` (no OAuth) and an inherited `ANTHROPIC_BASE_URL` points at the wrong endpoint.
3. **Permissions.** `dontAsk` denies anything not allowed. Allowed: Read/Glob/Grep, Write/Edit inside the workspace only (`Write(./**)`), WebSearch, WebFetch, Skill, Task/Agent, TodoWrite, read-only Bash (curl, ls, cat, …), `mcp__gooseworks-staging`. Denied: production GooseWorks, `AskUserQuestion` (the subject must ask in text), and the staging tools that spend or publish (list `PAID_OR_PUBLISHING` in `lib/behaviour.mjs`).
4. **Simulator.** After each subject turn, Haiku gets `scenario.md`, the conversation (marketer messages + the subject's final message per turn) and the list of document files in the workspace, and returns `{"done", "reply", "why"}`. It answers the agent's decision questions as the persona, declines paid top-ups and other jobs, and says "ok, go on" when the agent pauses mid-work. **Enforced in code:** for a report job (`requires_report`, default true) DONE is refused while no document file exists — the marketer asks once for the full report as a doc; if there is still none, the arm stops with "no report file after asking". An empty reply becomes "ok, go on.". A DONE that still carries a typed answer sends the answer first (once in a row). The arm also stops at `max_turns` or at the wall-clock arm cap ("time cap", default 60 min; a running turn is killed at the cap).
5. **Collect.** Every file the subject wrote (outside `.claude/`) is copied to `<arm>/files/`; the full session JSONL (and sub-agent transcripts) to `<arm>/session.jsonl` and `<arm>/session/`; per-turn stream-json to `<arm>/turns/`; a condensed `transcript.md`; `run.json` with turns, costs, stop reason and a per-turn log. The temp folder is deleted unless `--keep-workspace`.
6. **Judge.** One no-tool call per arm with the scenario, the full rubric, a judge-sized transcript built from `turns/*.jsonl` and the files (text up to 80k chars each, 200k total). The transcript keeps every agent message in full; tool calls are short, results clipped, and each sub-agent is one line (its tool counts and what it searched or read). If it is over 180k chars, tool calls are folded into count lines. The judge answers one line per criterion (`M1 | pass | evidence`, then `OVERALL: …`), which survives quotes in evidence better than JSON; a reply missing criteria is retried once; the raw reply is saved in `judge-raw.txt`. Before judging, a code check searches the **full** tool results (main agent and sub-agents) and the marketer's messages for every number in the agent's files and tells the judge which ones appear nowhere, because the judge only sees clipped tool results. A judge or arm failure is logged (`judge-error.txt`, `arm-error.txt`) and the suite carries on. Output: `<arm>/judge.json`, then `summary.md` + `results.json` per playbook and `summary.md` per suite (one row per arm: verdict, must/should/expert, turns, stop reason, minutes, cost).

## Formats

**`routing/cases.jsonl`** — one JSON object per line:
```json
{"id":"R22","ask":"Who should we target?","expected_playbook":"research-audience","acceptable_alternatives":["research-market"],"kind":"vague","source":"routing-review #22","note":"optional"}
```
`expected_playbook` is a skill name or `"none"` (not covered yet). A pick is correct if it equals `expected_playbook` or is in `acceptable_alternatives`. The 60 original asks come from `reviews/2026-10-16-routing.md` §1b, updated for 18 Oct (listen-social folded into research-market; research-audience is now audience research, lists only on request); R61–R68 are added asks, mostly Akhil's hand-test openers. The picker sees every `playbooks/*/SKILL.md` and `foundation/*/SKILL.md` description, read fresh on each run, plus a `none` option.

**`playbooks/<slug>/scenario.md`** — sections the runner reads:
- `## Opening ask` — the first ```` ```text ```` fence is sent verbatim as the first message.
- `max_turns: N` anywhere in the file (default 8; the seven scenarios use 10, where-to-start 6).
- `requires_report: false` for jobs whose deliverable is a chat answer (where-to-start). Default true.
- The whole file goes to the simulator as its persona sheet, and to the judge as context.

**`playbooks/<slug>/rubric.md`** — criteria are lines `- **M1** — text` (also `S1…`, `E1…`). M = must, S = should, E = expert; an E line containing "(must)" counts as must. Everything else in the file is shown to the judge as context.

## Add a behaviour eval

1. `mkdir playbooks/<slug>` with the playbook's exact slug.
2. Write `scenario.md`: brand (a staging brand), the opening ask (a real marketer's words where we have them — hand-test transcripts are in `~/.claude/projects/-Users-akhil-projects-marketing-agent-test/*.jsonl`), and a persona sheet with every fact the marketer might be asked. Keep the hard rules: decline paid top-ups, never approve publishing or spend.
3. Write `rubric.md` from the playbook's "Done when", its `tests/test-by-hand.md`, the four failure modes and write-report §3. Judge outcomes, never "followed step 4" — the baseline must be able to pass.
4. Check it parses: `node run.mjs list`, then a cheap smoke run: `node run.mjs playbook <slug> --mode with-skill --subject-model haiku --judge-model sonnet --max-turns 1`.
5. If the playbook needs a staging tool that is in `PAID_OR_PUBLISHING`, don't remove it from the list; record in the rubric that the step is out of reach in evals.

## Add a routing case

Append a line to `routing/cases.jsonl` with the next free id. Use `acceptable_alternatives` only when a second playbook is genuinely right too, and say why in `note`.
