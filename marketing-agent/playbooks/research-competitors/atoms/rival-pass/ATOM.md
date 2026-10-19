---
name: rival-pass
description: >-
  Hidden step of research-competitors. The short brief one worker follows to research ONE rival (or our own
  brand) on every dimension at a capped depth — news, ads per library, founder and company posts, launches,
  pricing, positioning, buyer reviews, hiring, search — and return a same-shape profile with links and dates.
  Pasted whole into a subagent's instructions. Never listed.
---

# rival-pass — worker brief

You research **one rival** for **one brand** — or **our own brand** when the brief says so (then "openings" are our own events; skip "where we win"). The main run already chose the rivals and gave you the facts below.

**Rules for this worker**
- **Don't load any skill or playbook, and don't start subagents or workflows.** This brief is all you need. If a dimension needs more method, read only that section of `../../references/rival-craft.md`.
- **Depth cap (standard run):** about 12 web searches and 12 page fetches in total. Spend them by the company-type weighting below. A deep teardown (quarterly, or when asked) may double it. Stop a dimension when two reads add nothing new.
- Never stop to ask. Public pages only: never log in, sign up, use fake details, or use unofficial mirrors (the Wayback Machine is fine). Never check or repeat a claim about our brand that no source gave you.
- **Every fact carries its link and date inline** — the report quotes you directly. Say how sure you are in words ("confirmed", "likely", "a guess, because…").
- A page that needs the browser (ad libraries, X, LinkedIn posts, script-only pages, review pages that block fetch) goes on **Needs the browser** with the exact URL or search — never "none found".

**Inputs you get:** rival name and site · our brand, what it sells, its approved claims · the frame we compete in · company type · today's date · the rival's last saved snapshot, if any (report what changed since).

## Get these, in this order

1. **News, last 90 days** — 2–3 searches combining: shut down, acquired, raises, layoffs, pricing, launches, CEO. Anything in the last 30 days is a candidate opening, with the window it opens.
2. **Launches, last 90 days** — changelog or blog; the biggest one's demo, broken into hook · setup · reveal · proof · CTA, labelled **from video**, **from transcript only** or **from page text only**.
3. **Founder and exec posts** — 1–2 people: `site:linkedin.com/posts "<name>"`, `site:x.com "<name>"`; their repeated claims and teasers, linked — or "couldn't read (reason)".
4. **Ads** — Meta, LinkedIn, Google, TikTok libraries, by the advertiser's name: what you could read (top ads, start date, days running, hook) or "couldn't open (reason)" / "Needs the browser". Never spend, return on ad spend or "best ad" as fact.
5. **Pricing** — plans, price, the unit, free tier or trial, and whether read on the vendor's page or third-hand.
6. **Positioning** — the homepage headline **word for word**, who it's for, the lead claims.
7. **Buyers** — at least one praise and one complaint, quoted verbatim with links (review sites, Reddit, community), and how many you read.
8. **Hiring and search** — open roles by team (one look at the careers page); who ranks or advertises on "<rival> alternative".

## Weighting by company type

| Type | Spend most on | Spend least on (still check once) |
|---|---|---|
| B2B SaaS | LinkedIn ads and posts, founder posts, reviews (G2/Capterra), pricing, launches, comparison searches | Meta, TikTok |
| DTC / ecommerce | Meta and TikTok ads, creators, offers, Amazon/Trustpilot reviews | hiring, LinkedIn |
| Consumer app | app-store reviews and rank, TikTok/Instagram ads, onboarding and paywall | LinkedIn |
| Marketplace seller | listings, price and coupon history, review themes | founder posts, hiring |
| Local business | Google Business reviews, local ads, offers | hiring, LinkedIn |

## Return this, in this shape (about 400–600 words)

```markdown
## <Rival> — as of <date>
What they are: <one line> · Frame: <the category they claim>
News (90 days): <dated items with links> · Candidate openings: <event — date — window, or "none">
Launches: <dated> · Biggest launch breakdown (<from video | transcript only | page text only>): hook · setup · reveal · proof · CTA
Founder posts: <name, role — claims and teasers with links> or "couldn't read (reason)"
Ads: Meta <…> · LinkedIn <…> · Google <…> · TikTok <…> — each read (top ads, start dates, days) or "couldn't open (reason)"
Pricing: <plans, price, unit, trial> — <vendor page | third-hand>, <link, date>
Headline (word for word): "<…>" · for whom · lead claims
Buyers say: praise "<quote>" (<link, date>) · complaint "<quote>" (<link, date>) · n read
Hiring: <roles by team> · Search: <who ranks or advertises on "<rival> alternative">
Where we win / where we lose: <points, each with how sure>
Needs the browser: <exact URLs or searches>
Couldn't read: <source — why — what it would change>
Snapshot for next time: <ad ids + start dates, pricing text, headline, open roles, review count — last-checked date>
```
