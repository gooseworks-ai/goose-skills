---
name: research-competitors-category-pass
description: >-
  Step of the research-competitors playbook: the worker brief covering the whole category, including
  searches, AI answers, community threads and category ad winners. Run research-competitors instead;
  not for direct use.
version: 0.1.0
---

# category-pass

You cover what no single rival pass sees: how buyers search and choose in this category, and where our brand stands. Do every section; never stop to ask whether to go deeper. Same rules as the `research-competitors-rival-pass` skill (`../research-competitors-rival-pass/SKILL.md`): don't load any skill or start subagents; about 12 searches and 10 fetches in a standard run; public pages only; every fact with its link and date inline; how sure in words; "Needs the browser" and "Couldn't read" lists. The main run has already done the field searches and chosen the rivals — you go deeper on the category: sections 3–7 (and 1–2 only to add what it missed).

**Inputs:** our brand, what it sells, its category in buyers' words, the rival list, company type, today's date.

## 1. Money searches

Search, in a clean browser or web search where possible: `best <category>` · `<category> software / tool / app` · `<rival> alternative` (each main rival) · `<rival> vs <rival>` · `<our brand> vs <rival>` · `<our brand> reviews` · our brand name alone. Record who ranks in the top results, who runs search ads on each query (including on our brand name — a rival bidding on us is a threat), and which "vs" and "alternatives" pages exist and who wrote them. Results vary by location; say where you searched from.

## 2. AI-answer presence

Ask the same prompts each time — `best <category> tool`, `alternatives to <main rival>`, `<our brand> vs <main rival>`, `what is <our brand>` — in every AI answer engine the host can reach (Google's AI Overview in search results counts; others as available). Record who is named, in what order, and how our brand is described, with the date. Where none can be reached, say so, and read improve-search-visibility's latest `search/visibility/<date>.md` if it exists.

## 3. Community — how buyers frame the choice

Last 90 days on Reddit (the category's subreddits), Hacker News, LinkedIn comment threads, Quora: `best <category>`, `<category> recommendation`, `<category> tool for <job>`, `switching from <rival>`. Themes with links: what buyers compare on, the words they use, which names come up together, and any rival drawing anger.

## 4. Creator demos and reviews

YouTube, TikTok, LinkedIn and X: `<category> tool demo`, `<category> review`, `best <category> <this year>`, and `<rival> demo` for any rival launch the rival passes flag. For the 3–5 best (by views or engagement relative to the creator's usual): link, date, creator, length, and the beat breakdown — hook · setup · reveal · proof · CTA · style. These are swipe-file candidates: the format is already proven with this audience.

## 5. Category-wide ad winners

Ads in the category from anyone, not just named rivals: TikTok Creative Center top ads for the category, Meta and LinkedIn ad-library keyword searches for the category's main terms, Google Transparency for category advertisers. Note long-running ads and repeated formats, and any new entrant advertising heavily.

## 6. Our own brand in the field

Where our brand shows up in sections 1–5, how it is described, and any recent coverage of our own news (from the main run's news scan) that buyers are reacting to.

## 7. Adjacent options

For each adjacent option the main run named (a spreadsheet, an agency, an in-house team, a DIY tool): how it is pitched (headline or the way buyers describe it), what it costs, and the top 5 complaints buyers have about it, with links. These are often the real competitor for small buyers.

## Return this, in this shape

```markdown
## Category — as of <date>
Money searches: <query → who ranks · who advertises · comparison pages> (searched from <location>)
AI answers: <prompt → engine → who is named, in order · how we're described> — or "not reachable"
Community themes: <theme — linked examples — names mentioned together>
Creator demos: <link · date · creator · length · beat breakdown> (top 3–5)
Category ad winners: <link · advertiser · start date · format · hook>
New entrants: <name — evidence>
Our brand in the field: <where we appear, how we're described>
Adjacent options: <option — pitch · cost · top 5 complaints (linked)>
Needs the browser: <page — the exact URL or search to open>
Couldn't read: <source — why — what it might have changed>
```
