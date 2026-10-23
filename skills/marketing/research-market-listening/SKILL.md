---
name: research-market-listening
description: >-
  Step of the research-market playbook: the worker brief for listening to what people say about the
  brand and category, risks first. Run research-market instead; not for direct use.
version: 0.1.0
---

# listening

You listen to **what people are saying right now** about the brand, its founder, its products and its category, on the platforms its buyers use. Do every platform on the list before you return. Never stop to ask. The craft — the watchlist, name collisions, where and how to listen, who is speaking, how to classify, risk levels, outliers and trends — is `../research-market/references/listening-craft.md`; read it first.

**Inputs you get:** the brand, products, founder and execs, handles, rivals, category terms (brand brain first), company type, today's date, the window (last 30 days by default; last 7 when the ask says "this week"), the saved watchlist if any, the last report's "What people are saying" section if any.

**Worker rules:** don't load any skill or playbook and don't start subagents or workflows — this brief is all you need. Standard depth: about 12 searches and 12 page fetches; a brand watch, about 6 and 6; a quarterly full report may go deeper. **Every fact carries its link and date inline** — the report quotes you directly.

**Tools:** web search (recency words, `site:` queries) and web fetch, freely; the platforms' own public pages only — never unofficial mirrors, archives or unofficial APIs; never log in. Pages that need the browser go on "Needs the browser" for the main run. **The brand's own users** (comments on its posts, its community, reviews of it) are first-hand evidence: if a page won't open, finish that read with `site:` searches and fetches of the posts themselves rather than dropping it, and say how it was read. Free server reads the main run gives you (`organic` posts, `social_inspiration_search`) are extras.

## Two ways you run

- **Inside a market report:** all steps below; return the full shape.
- **Brand watch (alone, on a schedule or on ask):** steps 1–2, then the brand's mentions since the last watch (counted per day), the negative themes among them (named, with counts), a news check on the main rivals, and the voices' last 7 days for convergence only — risk first, alerts only. Return either the alerts that cross a threshold below, or exactly `nothing crossed a threshold` with the counts you checked (for the baseline). No positive themes, outliers or trends.

**Brand-watch thresholds** (alert when any is crossed): a serious or rising risk (craft file § Risk); brand mentions at ≥2× the last watch's count on the same method; a new negative theme raised by 3+ separate people; a post about the brand from an account with ≥100k followers or ≥50k views; misinformation about the brand; a rival's shutdown, price change or launch aimed at the brand's buyers.

## Steps

1. **Watchlist.** Use the saved one, or draft it: name forms, handle, products, founder, rivals, category and problem terms. Search the bare name first and write the name-collision exclusions.
2. **Risk first.** Search the brand, products and founder with words like recall, reaction, rash, scam, lawsuit, refund, broke, hacked, boycott. Anything serious (S1 in the craft file) goes at the very top of your return, marked **TELL THE FOUNDER NOW**, so the main run can alert them before the report.
3. **Listen.** Every query on every default platform for the company type, within the window: web search, then the platform's public pages, then the comments on the top posts. Tag who is speaking (independent · owned · affiliated) and undated items. Count only independent, dated, on-target items; say every count is a sample.
4. **Themes, outliers, trends.** Themes in people's words with n and two linked quotes; quotes worth keeping as buyer language; outlier candidates with their baselines (or "baseline not read"); trends with dated evidence and a post-by date.
5. **Voices the buyer follows.** Read their last 7 days (30 in a full report) and flag convergence, spike, underdog and controversy (craft file § Voices); in brand-watch mode only a convergence on our category is an alert.
6. **Rivals' conversation.** What people say about the main rivals (complaints, praise, switching talk) — same method, so the volumes are comparable; otherwise say "not comparable".

## Return this, in this shape

```markdown
## What people are saying — <brand> — <window> (as of <date>)
TELL THE FOUNDER NOW: <S1 items, or "none">
Watchlist: <the table> · name confused with: <…>
Mentions (sample): <n independent by platform> · positive n · negative n · mixed n · neutral n · questions n · affiliated shown n · undated n
Themes: <theme in their words — n — two quotes with links>
Risks: <S2 / S3 items with link, reach, separate people, what we know>
Sales signals, rival complaints, reuse candidates, creators who fit: …
Product requests and workarounds: <quote — link — date>
How close to buying: curiosity n · consideration n · price or availability n · comparison n · bought n · repeat n · recommends n
Voices: <topic — signal (convergence / spike / underdog / controversy) — who — links — post-by date>
Rivals' conversation: <rival — what people say — volume (same method) or "not comparable">
Outliers: <link · creator · multiple (baseline n) · hook · format · topic> — save list for the main run
Trends: <trend · first seen · platform · evidence · stage · fit · audio rights · post-by · confidence>
Quotes worth keeping (people's own words, for the report and for audience research to pick up): <verbatim · link to the post or comment itself, never a community's home page · date>
Source mix: <share of items by kind of source — e.g. complaints sites, developer forums, social> and how it bends the picture
Needs the browser: …
Couldn't read: <platform or page — why — what it would have added>
```
