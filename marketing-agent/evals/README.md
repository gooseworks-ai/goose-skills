# Human version

**What this is.** Evals that tell us whether each marketing playbook actually helps. For each playbook we run the same marketer's ask twice — once **with** the skills installed, once **without** (baseline) — and an AI judge scores both against the same pass/fail checklist. If the baseline does as well, the skill isn't earning its place.

**In short**
- **Two kinds of eval.** *Routing:* given only the 19 skill descriptions, does a model pick the right playbook for 68 real asks? *Behaviour:* does a full run of a playbook deliver what a good marketer would, compared with no skill?
- **Seven behaviour evals so far**, one per hand-tested playbook: research-market, research-audience, research-competitors, run-organic-social, plan-campaign, improve-search-visibility, where-to-start. All use the GooseWorks brand on **staging**, with Akhil's real opening asks from the 18 Oct hand tests.
- **Nothing is spent or published.** Paid and publishing GooseWorks tools are switched off for the agent, production GooseWorks is blocked, and the simulated marketer declines every top-up.
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

# Re-score saved runs (for example after adding expert criteria to a rubric).
node run.mjs judge results/2026-10-18/research-market
```

Useful options: `--mode with-skill|baseline|both` · `--subject-model sonnet|opus|haiku` · `--judge-model opus` · `--max-turns 8` · `--turn-timeout 45` (minutes per agent turn) · `--effort high` · `--keep-workspace` (keep the temp folder to inspect) · `--no-judge` · `--out <dir>`.

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
| One behaviour eval, both arms | 40–120 min | ~$10–40 |
| The whole suite (7 playbooks + routing) | 5–12 hours, run unattended | ~$80–250 |

The agent (Sonnet) doing real research is most of the cost: a research run reads dozens of pages and spawns workers. The judge (Opus) adds about $1–3 per arm, the simulated marketer cents. Costs are what the CLI reports (`total_cost_usd`); on a Claude subscription they count against usage limits rather than a bill. GooseWorks credits spent: zero.

## Things to know

- **Staging state carries over.** Both arms read and write the same staging GooseWorks brand. A run that saves a report to the brand makes that report visible to the next run. The runner runs the **baseline first** so the skill arm can't help it; still, earlier hand tests' saved work is visible to both arms.
- **No browser.** Headless runs have web search and web fetch, not a real browser, in both arms. Steps that need a browser (ad libraries, logged-out ChatGPT) degrade the same way for both.
- **The agent's other user-level skills and MCP servers are present in both arms** (for example the published `gooseworks` skill and the GooseWorks server's own instructions). That is the realistic baseline: a customer with GooseWorks connected but without these playbooks.
- **Expert criteria.** Six rubrics include pass/fail checks from the two senior-marketer reviews of 18 Oct (`marketing-agent-test/results/reviews/research-review.md` and `social-plan-search-review.md`). Checks the reviewers marked *new* need a playbook change first, so they are scored but not yet must-pass. where-to-start has no expert review yet. After editing a rubric, re-score saved runs with `node run.mjs judge …` instead of re-running.
- **The reviews changed two checks.** Agreeing with the marketer that "video works better on X" no longer passes; the agent must check and give a sourced verdict. And research playbooks may ask one specific question for the brand's own customer data before researching.

---

# Agent version

## Layout

```
evals/
├── run.mjs                     CLI entry (routing | playbook | judge | all | list)
├── lib/claude.mjs              spawns `claude -p` with a clean env; ask() for no-tool model calls
├── lib/files.mjs               skill frontmatter reader, scenario/rubric parsers
├── lib/routing.mjs             routing eval
├── lib/behaviour.mjs           subject ↔ simulator loop, workspace setup, transcript condensing
├── lib/judge.mjs               judge call, per-playbook and suite summaries
├── prompts/routing.md          system prompt for the routing picker
├── prompts/subject-note.md     appended to the subject's system prompt (staging, no spend, no browser)
├── prompts/simulator.md        system prompt for the simulated marketer (hard rules: decline top-ups, never approve spend/publishing)
├── prompts/judge.md            system prompt for the judge
├── routing/cases.jsonl         68 routing cases
├── playbooks/<slug>/scenario.md, rubric.md
└── results/                    gitignored output
```

## How a behaviour run works

1. **Workspace.** A fresh temp folder with: a neutral `README.md` (says "use staging"), `.claude/settings.json` copied from the hand-test folder (`~/projects/marketing-agent-test`, override with `GOOSE_EVAL_TEST_DIR`; denies production GooseWorks). `with-skill` also symlinks the 16 playbooks + 3 foundation skills into `.claude/skills/`, plus `.claude/{atoms,foundation,BACKLOG.md}` (playbooks reach shared atoms as `../../atoms`). `baseline` links nothing.
2. **Subject turn.** `claude -p --model <subject> --output-format stream-json --verbose --append-system-prompt <subject-note> --permission-mode dontAsk --allowedTools … --disallowedTools …`, message on stdin, `--session-id` on turn 1 and `--resume` after. Env is cleaned to HOME/PATH/USER/SHELL/TMPDIR/LANG: an inherited `CLAUDE_CODE_SIMPLE` forces `--bare` (no OAuth) and an inherited `ANTHROPIC_BASE_URL` points at the wrong endpoint.
3. **Permissions.** `dontAsk` denies anything not allowed. Allowed: Read/Glob/Grep, Write/Edit inside the workspace only (`Write(./**)`), WebSearch, WebFetch, Skill, Task/Agent, TodoWrite, read-only Bash (curl, ls, cat, …), `mcp__gooseworks-staging`. Denied: production GooseWorks, `AskUserQuestion` (the subject must ask in text), and the staging tools that spend or publish (list `PAID_OR_PUBLISHING` in `lib/behaviour.mjs`).
4. **Simulator.** After each subject turn, Haiku gets `scenario.md` plus the conversation (marketer messages + the subject's final message per turn) and returns `{"done", "reply", "why"}`. It stops when the deliverable is handed over, or at `max_turns`.
5. **Collect.** Every file the subject wrote (outside `.claude/`) is copied to `<arm>/files/`; the full session JSONL (and sub-agent transcripts) to `<arm>/session.jsonl` and `<arm>/session/`; per-turn stream-json to `<arm>/turns/`; a condensed `transcript.md`; `run.json` with turns, costs, stop reason and a per-turn log. The temp folder is deleted unless `--keep-workspace`.
6. **Judge.** One no-tool call per arm with the scenario, the full rubric, the transcript (title stripped so the arm isn't named; tool traffic clipped) and the files (text up to 80k chars each, 200k total). Returns `{criteria:[{id, verdict, evidence}], overall}` → `<arm>/judge.json`. Then `summary.md` + `results.json` in the playbook folder.

## Formats

**`routing/cases.jsonl`** — one JSON object per line:
```json
{"id":"R22","ask":"Who should we target?","expected_playbook":"research-audience","acceptable_alternatives":["research-market"],"kind":"vague","source":"routing-review #22","note":"optional"}
```
`expected_playbook` is a skill name or `"none"` (not covered yet). A pick is correct if it equals `expected_playbook` or is in `acceptable_alternatives`. The 60 original asks come from `reviews/2026-10-16-routing.md` §1b, updated for 18 Oct (listen-social folded into research-market; research-audience is now audience research, lists only on request); R61–R68 are added asks, mostly Akhil's hand-test openers. The picker sees every `playbooks/*/SKILL.md` and `foundation/*/SKILL.md` description, read fresh on each run, plus a `none` option.

**`playbooks/<slug>/scenario.md`** — sections the runner reads:
- `## Opening ask` — the first ```` ```text ```` fence is sent verbatim as the first message.
- `max_turns: N` anywhere in the file (default 8).
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
