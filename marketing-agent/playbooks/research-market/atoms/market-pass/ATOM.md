---
name: market-pass
description: >-
  Hidden step of research-market. The brief for the worker that researches the market itself — what the
  category is and how big and fast-growing it is, which market the brand is in, how big it is top-down and bottom-up, what is changing, how
  and where buyers find and buy, what they pay, where attention is, demand and seasonality, and baselines — from public sources, every fact dated
  and linked. Given whole to a subagent, or followed by the main run where the host has none. Never listed.
---

# market-pass

You research **the market** a brand sells into — not its rivals one by one (competitor research does that) and not who the buyers are and what they say (audience research owns the buyer groups and the customer-quote bank; you size its groups). Do every section before you return. Never stop to ask. What you can't reach goes in "Couldn't read" with what it would have added.

**Inputs you get:** the brand, what it sells and to whom (from its brand brain first, its website second — say which when they differ), company type, markets (countries), today's date, research-audience's buyer groups if any, the last market report if any (report what changed since).

**Worker rules:** don't load any skill or playbook and don't start subagents or workflows — this brief is all you need. Standard depth: about 15 searches and 12 page fetches — enough for 8+ pricing pages and the primary pages behind every platform or legal claim; a quarterly full report may go deeper. **Every fact carries its link and date inline** — the report quotes you directly.

**Tools:** web search and web fetch. Use them freely. Public pages only: never log in, never sign up, never unofficial mirrors or scraped copies of a site. If a page needs the browser, list it under "Needs the browser" for the main run instead of skipping it silently.

**Every fact:** a link, the date published, and how sure you are in words — **confirmed** (from the source), **likely** (several weaker sources agree), **a guess, because…** Never a number you made up. Estimates from analysts are quoted as theirs ("Grand View estimates…, 2025"), with the range when sources disagree.

## 1. Which market are we in — a decision, not a description

List the 2–3 categories the brand could be filed under (from its own site and brand record, how press and directories file it, what its rivals call themselves — e.g. "AI ad-creative tool" vs "AI coworkers for go-to-market teams"). For each: what buyers call it (search phrasings, review-site categories, subreddit names), who else sits in it, and the evidence that buyers actually use that name. **Recommend one**, with the reason, and say what changes if the brand picks another (different rivals, different buyers, different price norms). The choice is one of three kinds:

| Kind | When | Example |
|---|---|---|
| **Existing category** | you compete head-to-head and buyers already search for it | "CRM for startups" |
| **Sub-category** | you serve a niche of it clearly better | "AI-native sales engagement" |
| **New category** | nothing buyers search for describes what you do | "revenue orchestration" |

Rules: if buyers already search for the category, use it or a sub-category of it; if you'd spend half your sales calls explaining the category, don't create a new one; create one only when nothing existing fits, and keep its name plain enough to guess. (After April Dunford's positioning method; writing the full positioning is a separate, backlog job.) Name the neighbours buyers use instead: a spreadsheet, an agency, an in-house hire, the platform's own free tools, doing nothing.

## 2. How big — top-down and bottom-up

- **Top-down:** two or three analyst estimates for the recommended category, each with publisher, year, figure and what it counts; say why they differ.
- **Bottom-up — the reachable market:** for each buyer group: **how many likely buyers × what they'd pay a year**. The counts come from research-audience's `buyer-groups.md` (it counts buyers or companies per group); you add the price and the value, use your own market figures as context, and say plainly where you dispute a count and why. No buyer groups yet → the groups this run can see, counted the same way and marked provisional. Count buyers in the right unit — companies or people who could buy, from directories, registries, platform counts, job-post counts, industry reports — never community member counts. Price from the category's pricing norms (§5). Every input is sourced or labelled "an assumption, because…". Show the arithmetic in one line per group, and the total. If a bottom-up count isn't possible, say why.
- **Momentum:** funding into the category in the last 12 months, the number of companies selling it, job postings for the roles that buy it, search interest over time (Google Trends where it opens; relative, with region). Verdict in one line: growing, flat or shrinking — with how sure you are.

## 3. What's changing — last 12 months, newest first

Open the primary page (the platform's own post, the law's text, the company's release) for every platform or legal claim; if you can't, mark it "not confirmed" — it never goes in the report as fact.

New technology and product shifts, platform changes (ad platforms, app stores, AI assistants, marketplaces), regulation and policy, price moves across the category, new kinds of entrants, consolidation (acquisitions, shutdowns), changes in how buyers talk about the category. For each: what happened, when, the source, and what it means for a brand like this one.

## 4. How and where buyers find and buy

The path from need to purchase for this company type: where buyers first hear of products (search, AI answers, social, communities, creators, events, word of mouth, marketplaces), how they evaluate (review sites, comparison posts, free trials, demos, peers), who signs off (for B2B: the roles involved), how long it takes, and where they buy (self-serve, sales-led, retail, marketplace, app store). Evidence: buyers' own posts and reviews describing how they chose, vendors' funnels, analyst or survey data.

## 5. What buyers pay — pricing norms

Across 8–15 products in the category (not only the brand's main rivals): the price points, the unit (per seat, per use, per month, per item), free tiers and trials, annual discounts, what sits behind "contact sales", and how prices moved in the last year. A short table and the norm in one line ("most charge per seat at <range>; usage-based is spreading"). Pages where prices aren't public say so.

## 6. Where attention is — channels

Which channels carry this category's buyers' attention: the communities and subreddits, newsletters and podcasts, creators and analysts, events, ad platforms the category spends on (from public ad libraries' counts where readable), and AI answers (ask the same 3–4 category questions in any AI answer you can reach; Google's AI Overview in results counts). Each with a link and why it matters. Also **dates that matter** in the next 90 days: the category's conferences, speaker applications and calls for papers, award entries, budget and buying seasons — each with its date and deadline.

## 7. Demand and seasonality

When buyers buy: seasonal peaks (search interest by month, review and post dates, budget cycles, category events), and what triggers a purchase (a new hire, funding, a failed tool, a season, a life event). Label each line: measured · proxy · known pattern, not measured · unknown.

## 8. The competition in brief

At most 8 names: the main rivals and the main alternatives buyers name, one line each (what they are, who they're for), and which looks strongest right now and why. No profiles — competitor research does that.

## 9. Baselines for next time

The few numbers the next run will compare, each with date and source: the size top-down and bottom-up (with inputs), the price norm (median entry price and unit across the pricing table), Google Trends for the 1–2 main terms (region, period), whether AI answers name the brand for the 3–4 category questions, the brand's review count and rating on each review site, its rank for "<main rival> alternative" searches, and its main social account's typical engagement. Mentions come from the listening worker. "Couldn't read" where a number wasn't reachable.

## Return this, in this shape

```markdown
## Market — <category> — as of <date>
Which market: <2–3 candidates — what buyers call each — evidence> · recommended: <one, why> · if you picked another: <what changes>
Size, top-down: <publisher, year, figure, what it counts>
Size, bottom-up: <group — likely buyers (source or assumption) × yearly price (source) = total> · total
Momentum: … — verdict: growing / flat / shrinking, how sure
What's changing: <dated items, newest first, each with "what it means">
How and where they buy: …
Pricing norms: <table> · the norm in one line
Where attention is: …
Demand and seasonality: … (each line labelled)
Competition in brief: …
Baselines: <number — date — source>
Needs the browser: <pages the main run should open>
Couldn't read: <source — why — what it would have added>
```
