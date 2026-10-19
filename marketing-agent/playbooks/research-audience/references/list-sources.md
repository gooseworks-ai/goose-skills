# Where a list comes from — pick the source by the situation

Load at list-mode step 2. The source decides how warm the list is. Pick one or two that fit the ask; say which and why in the report. Every source here is public or reached through a GooseWorks route; none needs a vendor key.

| Source | Best when | How warm | Free today? |
|---|---|---|---|
| **People and company database** (title, function, size, industry, region) | Broad lists fast; "50 VPs of X at Y-size companies" | Cold — pair with a signal | Only when the connector has the route (server-needs); else the free pass below |
| **Switch intent** — people saying "alternative to X", "moving off X" | Known rivals; the warmest cold list | Hot (days) | Yes — web search, Hacker News, public forum threads |
| **Hiring** — job posts for a role the product replaces or supports | Urgency and budget | Warm (weeks) | Yes — careers pages, job boards via web search |
| **New leader in the buying role** | Any B2B motion | Warm (2–8 weeks in) | Partly — announcements, press, public posts; most moves are never announced (a database route sees them) |
| **Rivals' public customers** — case studies, testimonial authors, logo walls | Category already bought | Warm | Yes |
| **Events** — speakers, sponsors, exhibitors, workshop hosts | Niche or technical buyers; a date to anchor | Warm around the date | Yes — public speaker and sponsor pages |
| **Developer activity** — issues, PRs, forks on rivals' or category repos | Developer tools, technical buyers | Warm | Yes — the public GitHub API, keyless |
| **Running ads now** — ad libraries | Selling to marketers (creative, agencies, martech) | Lukewarm | Yes in the browser; at volume through the paid ad-library reads |
| **Past champions** — people who praised the product publicly, or the marketer's own list | Any brand with users | Hot when they move | Yes for the list; job-change checks are paid profile reads (watches.md) |
| **Product Hunt** — recent launches in the category and adjacent ones | Early-stage buyers, developer and SaaS tools | Warm (new launches buy tools) | Yes — public launch pages; the makers are the company's founders |
| **Directories, associations, store locators, exhibitor lists** | Retail, local, industrial, niche B2B | Cold | Yes |

Early-stage or broad ask → database (or the free pass) plus switch intent. Known rivals → switch intent plus rivals' customers. Niche → events plus directories. Urgency matters → hiring plus new leaders. Developer tools → developer activity plus switch intent.

## Switch intent — the searches that find buyers, not builders

**Search pain words, not solution words.** "AI workflow automation" finds vendors, builders and investors; "invoice matching is killing month-end" finds the people living with it. Write 15–25 phrases a tired operator would type, in four kinds: staffing pain (hiring, turnover, burnout), operational friction (manual steps, broken hand-offs), cost and scale pain, and one named workflow that hurts. Exclude rival names on their own and generic tech titles.

Nine kinds of buying language, strongest first (score them in the row's reason):

| Kind | Strength | Search shapes |
|---|---|---|
| Looking for an alternative | 9 | "<rival> alternative", "alternative to <rival>", "looking for <category>" |
| Migrating | 9 | "migrating from <rival>", "moving away from <rival>", "switching from" |
| Built our own | 9 | "we built our own <thing>", "Show HN" posts for what we replace |
| Rival pain | 8 | "<rival> issues", "frustrated with <rival>", "<rival> doesn't support" |
| Comparing tools | 8 | "<A> vs <B>", "which <category> should I use" |
| Scaling pain | 7 | "<problem> at scale", "breaks with <n> users" |
| Price pain | 7 | "<rival> too expensive", "cheaper alternative to <rival>" |
| Missing feature | 7 | "does <rival> support <feature>", "wish <rival> had" |
| Problem questions | 6 | "how to <job>", "best way to <problem>", "recommendations for <category>" |

The top two queries per kind (18 searches), more only for the kinds that return buyers. One lookback: 30 days (90 for rivals' launches and case studies). **Hacker News** (free, no key): the public search API's by-date endpoint, `https://hn.algolia.com/api/v1/search_by_date?query=<q>&tags=story` and again with `tags=comment`, `numericFilters=created_at_i><unix time of the lookback>`, up to 200 hits per page; dedupe by item id; keep the text and the parent story title. Reddit and forums: web search with `site:` filters, then read the thread in the host browser; at volume, the paid Reddit search. **Only the author of a post or comment counts** — never the people who liked, upvoted or replied around them. The row's signal is the post itself (URL, date, their words).

Turn a post into a list row only when **the author's own profile on that same site** names the person and a company that fits. **Never match a handle to a real identity across sites** (no searching a Reddit or HN username elsewhere). An anonymous handle is a quote for the bank, not a lead.

## Hiring — map the roles once

From the fit definition: roles the product **replaces** (the strongest signal — they are budgeting for what we automate), **augments**, roles that **buy**, **champion** and **use**, and job-ad keywords that confirm relevance (and cut false matches).

- **Tiers:** a "replaces" role posted within 7 days → act today; "replaces" 7–14 days, or "augments" under 7 days with several posts → this week; "augments" or keyword-only → queue; weak once you read the ad → drop.
- **Strength:** 3+ relevant posts, or 2+ with a senior one → high (scaling the function); 2 posts or one senior → medium; else low. A senior hire (head, director, VP) = a strategic buy; an IC = an operational buy.
- **Who to list:** one level above the role being hired — growth or marketing roles → the marketing leader above ~80 staff, the founder below; sales roles → the sales leader; RevOps or GTM roles → the revenue leader (founder below ~80).
- Search: `"<role>" "<company type>" site:boards.greenhouse.io OR site:jobs.lever.co OR site:jobs.ashbyhq.com OR site:apply.workable.com OR site:wellfound.com`, plus Indeed and the careers page (small companies often post only there). Re-check the post is live on handover day.

## Events

Look 180 days ahead and 90 back: conferences (web search "<industry> conference <year>", "<technology> summit", "<rival> conference" — rivals often host one; public speaker platforms and calls for papers), meetups by topic and city, podcasts ("<topic> podcast", episodes on "<problem>"), hackathon project galleries. **List from public pages only:** speakers and workshop hosts (strongest — an employer-approved public statement of priorities), panellists, podcast guests, sponsors (budget for the space; higher tier = more invested), organisers, exhibitors. **Never attendee or RSVP lists**, even when a page shows them. The row's signal is the talk or sponsorship with its date.

## Developer activity

The public GitHub API (no key; mind its rate limit) on 3–8 repos the buyer would touch: rivals' repos, category-defining repos, popular libraries in the space.
- **Weights:** issue opener 5 (a real use case and pain) · PR author 5 · contributor 4 · fork 3. (Stars and watchers are too weak and too costly to read.) Rank by the number of scanned repos a person touched first, then by total weight; look up the self-declared company only for the top ~50 (the keyless API allows about 60 requests an hour).
- **Usage, not interest:** stars, forks and issues show interest; **use** shows in code. Search for the SDK's package name in public manifests and imports (web search `site:github.com "<package-name>" package.json OR requirements.txt OR go.mod`, and the repo's public "Used by" / dependents page). One public repo of a company that imports it is enough for "uses"; say "uses" in a row only when an import or manifest was seen, otherwise "active on the repo".
- **Company clusters:** normalise the self-declared company field on profiles; **3 or more active people at one company = the company is adopting** — an account-level signal. **List only the account**, and find the **buyer** (engineering or product lead) through the usual people step from other public sources. Never list or contact the developers themselves: GitHub's terms forbid using its data for unsolicited email, and a contribution isn't consent to be pitched.
- **Drop:** bots (`[bot]` logins, dependency and CI bots, account type Bot) and the repo owner's staff (the owning org's public member list, or the profile's company field). **Never use commit emails** — not as a route, not as a filter.

## Rivals' public customers

Case studies, logo walls, testimonial authors on the rival's site or review pages, integration partner pages. They already buy the category; the angle is an honest difference. Check they're still a customer (the case study's date; a recent job post naming the rival's tool).

## Past champions

Phase one, once: people who praised the product in public (reviews on public review sites, public posts about the product), each with the link they published, plus any champion list the marketer supplies (their own users or contacts). Never look up people by name in a people database to build this list, and never store their emails. Then watch them for job moves (watches.md).
