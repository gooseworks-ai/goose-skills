# GooseWorks Marketing Agent — skills rebuilt from scratch

**In short**
- The skills a marketing agent needs to do the whole job of a marketer: **14 released playbooks** (one marketer want each, done end to end; 3 more are built but held back, see [drafts/marketing/](../../drafts/marketing/README.md)), their steps, and **2 foundation skills**: `marketing-guide` (shared setup and rules) and `marketing-data-access` (live public data with no vendor keys). Customers reach the playbooks through the `gooseworks` entry skill's router (`skills/entry/gooseworks/routes.json`).
- **Where they live:** `skills/marketing/<slug>/`, one flat folder per skill. Each is its own catalog skill (14 playbooks, 70 steps, 2 foundation skills = 86), listed in `skills-index.json` under domain `marketing-agent`. A merge to `dev` publishes them to staging; `main` to production. Built from scratch, published from 20 Oct; the old GTM library they replace was deleted on 23 Oct (`retired-skills.json` maps each old skill to its playbook).
- Each playbook is built from its spec, then attacked by critics for **scope** (missed work) and **depth** (shallow output) until they find nothing major. Every round is logged in the private goose-lab repo (`plan/marketing-agent/critiques/<slug>.md`), with the server gaps and cross-set reviews beside it.
- Source plans: the Marketing Agent map and the goose-skills rebuild plan, both in goose-lab.

## The playbooks

| # | Playbook | The marketer says |
|---|---|---|
| 1 | where-to-start | "I don't know what to do first — guide me." |
| 2 | research-market | "What's happening in my market, and where is it heading?" |
| 3 | research-competitors | "What are my competitors running right now, and what works for them?" |
| 4 | research-audience | "Who are my buyers, what do they want, and where do I find them — and give me a list of the right people." |
| 5 | plan-campaign | "I have this budget and a launch date — what do I run, where?" |
| 6 | make-static-ads | "I need ten fresh ads this week and I have no designer." |
| 7 | run-paid-campaigns | "Take the winner, scale it, kill the loser." |
| 8 | analyze-performance | "What worked this week, on every channel, and what do I make next?" |
| 9 | email-lifecycle | "Cart and welcome emails make money while I sleep — mine do not exist." |
| 10 | improve-search-visibility | "When people ask ChatGPT or Google for products like mine, am I in the answer?" |
| 11 | work-with-creators | "Which creators are worth paying, at what price — and what should they make?" |
| 12 | make-content | "Write the first pass of everything." |
| 13 | run-organic-social | "Keep my accounts alive: calendar, posts, replies." |
| 14 | write-outreach | "I have the list — now what do I send them, and how do I answer the replies?" |

## What we are not building yet

**Today: 14 released playbooks**, and no new playbooks until the gaps in [BACKLOG.md](BACKLOG.md) are built and tested. Three more (learn-my-brand, make-video-ads, make-product-photos) are built but held back until the server work they need exists ([drafts/marketing/README.md](../../drafts/marketing/README.md)). Not covered yet: drafting replies to comments and DMs, and sending outreach (write-outreach writes the emails and LinkedIn messages; the marketer sends them). Social listening is a step of research-market, not its own playbook. BACKLOG.md lists each gap with who needs it and what should make us build it.

## How to test a playbook

1. Connect GooseWorks **staging** to your agent.
2. Make a test folder anywhere (called `<test-folder>` here) and link **every** marketing skill into its skills folder, side by side, so `../<slug>/` links resolve (a playbook needs its steps and the shared steps). From the repo root:
   ```bash
   T=<test-folder>; mkdir -p "$T/.claude/skills"
   cp evals/marketing/settings.json "$T/.claude/settings.json"   # production GooseWorks denied, staging allowed
   for d in "$PWD"/skills/marketing/*/; do ln -sfn "${d%/}" "$T/.claude/skills/$(basename "$d")"; done
   ```
   Links left over from older layouts are dead: delete them first (`find "$T/.claude" -maxdepth 2 -type l ! -exec test -e {} \; -print -delete`). Open your agent in `<test-folder>`.
3. Follow that playbook's `tests/test-by-hand.md`. It passes when its "Done when" line holds.

## The old library

Deleted on 23 Oct. Every old skill is in `retired-skills.json` with the playbook that replaces it (or none, with a reason), and stays readable at tag `legacy-gtm-final`. The few older skills that video skills, these playbooks or gooseworks-app still use live in `skills/shared/`, each listed in `retired-skills.json` with who uses it and when it can go.

For builders: read [AGENTS.md](AGENTS.md) first.
