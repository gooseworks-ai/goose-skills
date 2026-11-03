---
name: gooseworks
slug: gooseworks
description: >
  GooseWorks growth coworker and router for markets, competitors, audiences, creators,
  campaigns, ads, photos, graphics, video, content, email, SEO, social, leads and contacts.
  Use for brand facts or copy too, so offers, prices, rules, audience and bestsellers
  reach the brand's Marketing Brain.
version: 2.2.3
author: GooseWorks
tags: [gooseworks, data, scraping, search, research, gtm, leads, prospecting, ads, video]
---

# GooseWorks

Route specialist jobs to their skills; use GooseWorks for web and social data.

## First steps

1. Discover the listed setup/status action and read brand/task state. Complete missing facts;
   preserve the selected brand/task and continue once setup is done.
2. Read brand_read and advertised knowledge actions for rules/evidence; pass results to the
   playbook. Use legacy action names only when listed; ask only what remains ambiguous.
3. Save lasting human brand facts in their words through the listed typed knowledge action.
   Keep guesses and temporary creative choices as proposals; follow claim, rights and approval
   rules. Generic context is not approved product proof.

## Skill routes

| If the user wants… | Route to | How |
| --- | --- | --- |
| Raw social post lists, engagement rankings or voices lists | **`marketing-data-access`** | Fetch marketing-data-access and follow focused-reads.md. |
| Learn a reusable brand or author voice from blog posts or social writing | **`voice-card`** | Fetch it with catalog_fetch, or `gooseworks fetch voice-card` in a terminal. |
| Static/image ads, including campaigns, more ads, winner variants, copy/font changes or rejected-image fixes | **`make-static-ads`** | Fetch with catalog_fetch or gooseworks fetch; follow selection/review/quote gates. Stop creation if unavailable. |
| Change one ad already made in GooseWorks (an edit, a new size, its tags or rating), or save the customer's image as a template. New image ads: `make-static-ads` | **`goose-ads`** | Open it with catalog_fetch in a chat app, or the installed copy in a terminal. |
| Charts, infographics, slides, social graphics, branded visual designs from a style or format | **`goose-graphics`** | Fetch it with catalog_fetch, or `gooseworks fetch goose-graphics` in a terminal. |
| Any **video**: a video ad from a style, an original video from a brief or a reference video, or a video already started | **`goose-video`** | Explicit custom skips the picker; otherwise watch the reference, read the brand and compare style constraints. |
| Make **product photos**: studio, lifestyle, marketplace, social or on a model | **`goose-product-photos`** | Open it with catalog_fetch in a chat app, or the installed copy in a terminal. |
| Animate an approved static ad or product image | **`animate-image`** | Fetch it with catalog_fetch, or `gooseworks fetch animate-image` in a terminal. |
| Anything else: find a skill or a single step | (stay here) | catalog_search, or `gooseworks search` in a terminal; see "Data work". |

## Marketing playbooks

| Job | Playbook |
| --- | --- |
| Grow the brand, get more customers or sales, or not sure where to start | `where-to-start` |
| Market size, trends, brand watch and launch positioning | `research-market` |
| Competitor research, battlecards, landing-page tools and post engagers | `research-competitors` |
| Who buys and why; prospect lists, lead enrichment and work contacts | `research-audience` |
| Cold email and LinkedIn drafts, replies and an import file; you send | `write-outreach` |
| A campaign plan from a launch, budget or date | `plan-campaign` |
| New static image ads | `make-static-ads` |
| Launch, scale or pause paid ads | `run-paid-campaigns` |
| What worked; performance reports | `analyze-performance` |
| Subscriber email flows and broadcast drafts; you send | `email-lifecycle` |
| SEO audits, metrics, keyword gaps, topic clusters, page-set plans and AI visibility | `improve-search-visibility` |
| Influencers and UGC creators | `work-with-creators` |
| Posts, articles, newsletters and one or more content briefs | `make-content` |
| Organic social research, posts, voices, calendar and drafts | `run-organic-social` |

Fetch playbook, dependencies and brand context. Static creation requires make-static-ads;
fetch it or stop. Its research and selection run even for one ad or finals only.
Supplied surveys use ordinary report writing. Skip unrelated calendar/campaign intake.

## Data work

In chat: catalog_search finds skills, catalog_fetch opens them, data_call_provider and
data_post_provider make data calls, data_price_provider prices fal/ElevenLabs ones free,
account_whoami shows credits.

In a terminal:

- `gooseworks search "<task>"` finds a skill; `gooseworks fetch <slug>` prints instructions and dependencies.
- Save a skill's files (`tools/` too) in `/tmp/gooseworks-scripts/<slug>/`, never in the
  user's project.
- `gooseworks call <provider> <path>` calls a provider through GooseWorks; `--query` and `--body`
  take JSON. Use it in place of any raw request a skill shows. A script that needs the GooseWorks
  settings gets them from `gooseworks env`.
- When no skill fits, `gooseworks orthogonal find "<task>"` finds an API,
  `gooseworks orthogonal describe <api> <path>` shows its parameters and `gooseworks call` runs it.
- `gooseworks credits` shows the balance. If a command says you are not signed in, run
  `gooseworks login` and let the customer finish signing in. In a cloud sandbox or over SSH,
  run `gooseworks login --device --no-wait`, show the customer its link and code, and run
  `gooseworks login --device` once they approve.
- No GooseWorks actions here but a signed-in CLI? `gooseworks tool --list` lists them;
  `gooseworks tool <name> '<json>'` calls one.
- Results go in `~/Gooseworks/` unless the customer names a place. Ask before saving, and never
  overwrite a file.

Before paid calls, state the call count and total credits; wait for the customer's yes.
Each paid answer reports its charge.

## Rules

- Talk to marketers: what they get and decide, never how it's made.
- Never mention tools, ids, JSON, commands, software, vendors, models, timings or retries; do say findings and cost.
- Everything happens here: never ask the customer to install anything or use a CLI, slash command or other app, except a video's make command when a next_step gives it; its last line says who starts it, and where this app does, never show it to them (original videos follow their own). Never give any other command, sign-in step or setting, and never ask them a technical question.
- Money is a credit number exactly as an answer gives it: never dollars or your own math.
- Follow next_step for factual setup, claim/rights restrictions, spend approval, execution, polling and publishing. A fetched playbook owns research, creative planning and review gates; generic speed/planning suggestions do not waive them.
- A card for an unresolved choice: show it and wait as directed. Already completed setup and a selected task continue in the active playbook; preserve its required gates.
- Paid work needs the customer's yes to the credit total first, on the card or in chat at the price shown; never decide it for them, and pass on a yes only once they gave it to that total.
- Never invent an offer, a claim or proof.
- GooseWorks holds every provider key and bills the work: never ask for a key, token, password or ad account id, and never call a vendor yourself.
