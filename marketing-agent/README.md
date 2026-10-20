# GooseWorks Marketing Agent — skills rebuilt from scratch

**In short**
- The skills a marketing agent needs to do the whole job of a marketer: **14 released playbooks** (one marketer want each, done end to end; 3 more are built but held back, see [unreleased/](unreleased/README.md)) and **3 foundation skills**: `marketing-agent` (the router that picks a playbook), `guide` (shared setup and rules) and `data-access` (live public data with no vendor keys).
- Built from scratch in this folder. The old library under `skills/` is being scrapped, not patched. This folder is not published to any catalog yet.
- Each playbook is built from its spec, then attacked by critics for **scope** (missed work) and **depth** (shallow output) until they find nothing major. Every round is logged in the playbook's `critique.md`.
- Source plans: [the Marketing Agent map](https://claude.ai/artifact/6PAQXoadLzETsFd57vP79a) (Akhil) on top of [the goose-skills rebuild plan](https://goose-publish.shiv-861.workers.dev/goose-skills-rebuild/) (Shiv).

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

[BACKLOG.md](BACKLOG.md) lists the marketing jobs these playbooks do not cover yet, each with who needs it and what should make us build it. Decided 16 Oct: keep the surface at 17 until these are built and tested well. Decided 18 Oct: social listening became a step of research-market, so the surface is 16; drafting replies to comments and DMs is not covered yet (BACKLOG card "Reply drafts"). Decided 19 Oct (Akhil): lead generation is completed — research-audience's list mode builds, scores and watches lists, and **write-outreach** writes the emails and LinkedIn messages; sending stays with the marketer (BACKLOG #6), so the surface was 17. Decided 20 Oct (Akhil): learn-my-brand, make-video-ads and make-product-photos are held back from the first release until the server work they need exists, so the released surface is 14 ([unreleased/README.md](unreleased/README.md)).

## How to test a playbook

1. Connect GooseWorks **staging** to your agent.
2. Link the playbook into your agent's skills folder, for example:
   `ln -s "$PWD/marketing-agent/playbooks/make-content" ~/.claude/skills/make-content`
3. Follow that playbook's `tests/test-by-hand.md`. It passes when its "Done when" line holds.

## Later: retiring the old library

Deleting old skills under `skills/` is a separate step after this set is tested. **Ad-creation skills used by live recipes stay** until the new playbooks replace them: before deleting any ads skill, check which recipes are live in production and which skills they call.

For builders: read [AGENTS.md](AGENTS.md) first.
