# GooseWorks Marketing Agent — skills rebuilt from scratch

**In short**
- The skills a marketing agent needs to do the whole job of a marketer: **17 playbooks** (one marketer want each, done end to end) and **3 foundation skills**: `marketing-agent` (the router that picks a playbook), `guide` (shared setup and rules) and `data-access` (live public data with no vendor keys).
- Built from scratch in this folder. The old library under `skills/` is being scrapped, not patched. This folder is not published to any catalog yet.
- Each playbook is built from its spec, then attacked by critics for **scope** (missed work) and **depth** (shallow output) until they find nothing major. Every round is logged in the playbook's `critique.md`.
- Source plans: [the Marketing Agent map](https://claude.ai/artifact/6PAQXoadLzETsFd57vP79a) (Akhil) on top of [the goose-skills rebuild plan](https://goose-publish.shiv-861.workers.dev/goose-skills-rebuild/) (Shiv).

## The playbooks

| # | Playbook | The marketer says |
|---|---|---|
| 1 | where-to-start | "I don't know what to do first — guide me." |
| 2 | learn-my-brand | "Learn my brand once — stop asking me every time." |
| 3 | research-market | "Who actually buys this, and what do they say in their own words?" |
| 4 | research-competitors | "What are my competitors running right now, and what works for them?" |
| 5 | listen-social | "What are people saying about me and my category this week?" |
| 6 | research-audience | "Find me 50 right-fit people with verified emails." |
| 7 | plan-campaign | "I have this budget and a launch date — what do I run, where?" |
| 8 | make-static-ads | "I need ten fresh ads this week and I have no designer." |
| 9 | make-video-ads | "Everyone says video converts — I cannot produce it myself." |
| 10 | make-product-photos | "Studio-quality photos of my product without a shoot." |
| 11 | run-paid-campaigns | "Take the winner, scale it, kill the loser." |
| 12 | analyze-performance | "What worked this week, on every channel, and what do I make next?" |
| 13 | email-lifecycle | "Cart and welcome emails make money while I sleep — mine do not exist." |
| 14 | improve-search-visibility | "When people ask ChatGPT or Google for products like mine, am I in the answer?" |
| 15 | work-with-creators | "Which creators are worth paying, at what price — and what should they make?" |
| 16 | make-content | "Write the first pass of everything." |
| 17 | run-organic-social | "Keep my accounts alive: calendar, posts, replies." |

## What we are not building yet

[BACKLOG.md](BACKLOG.md) lists the marketing jobs these 17 do not cover yet, each with who needs it and what should make us build it. Decided 16 Oct: keep the surface at 17 until these are built and tested well.

## How to test a playbook

1. Connect GooseWorks **staging** to your agent.
2. Link the playbook into your agent's skills folder, for example:
   `ln -s "$PWD/marketing-agent/playbooks/make-content" ~/.claude/skills/make-content`
3. Follow that playbook's `tests/test-by-hand.md`. It passes when its "Done when" line holds.

## Later: retiring the old library

Deleting old skills under `skills/` is a separate step after this set is tested. **Ad-creation skills used by live recipes stay** until the new playbooks replace them: before deleting any ads skill, check which recipes are live in production and which skills they call.

For builders: read [AGENTS.md](AGENTS.md) first.
