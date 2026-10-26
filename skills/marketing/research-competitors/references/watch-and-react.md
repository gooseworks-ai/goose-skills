# Watch and react

Both modes use the same dimension list as the teardown (`rival-craft.md`) and compare against each rival's saved **Snapshot** block. A quiet week is a valid result — but "no change" only ever covers what was actually re-read.

## Weekly watch — "what changed this week?"

For every main rival, re-read and diff:
1. **News** (last 7–14 days): the rival-craft §1 queries, plus our own brand. Any shutdown, acquisition, price change, outage, launch or funding is a react-now item and leads the note.
2. **Ads:** every library from rival-craft §2 — new ads (start date after the last snapshot), ads gone since the last snapshot (full-library reads only; never from a sample), ideas gaining versions.
3. **Founder and company posts:** new posts beating their usual engagement; new claims or teasers.
4. **Launches:** changelog, release notes, Product Hunt, launch posts — and the first third-party demos of anything new.
5. **Pricing and headline:** pricing-page and homepage text against the snapshot.
6. **Hiring:** open roles by team against the snapshot.
7. **Reviews and community:** new complaint or praise themes; spikes.
8. **Search and AI answers:** the category pass's prompts, if anything moved.
9. **Free feeds** (what a scheduled run, with no browser, can still read): each rival's blog and changelog feed, diffed since the last snapshot (the `<link rel="alternate" type="application/rss+xml">` in the page head, else `/feed`, `/rss`, `/atom.xml`, `/feed.xml`, `/rss.xml`, `/blog/feed`, `/index.xml`); Hacker News search for launches in the category (`https://hn.algolia.com/api/v1/search_by_date?query=<rival>&tags=story` or `show_hn`, `&numericFilters=created_at_i><last run>`); each rival's `/sitemap.xml` for new comparison, alternatives or pricing pages.
10. **Email, events, partnerships:** new newsletter offers; the next flagship event (a launch often lands on it — an early warning); new integrations or platform partners.

Report only what crossed a threshold:

| Area | Report when |
|---|---|
| News | anything material in the window (always) |
| Ads | a new idea (not a new size of an old one) · an idea crosses 30 / 60 / 90 days · an idea gains 3+ versions · active count moves ≥25% (full-library reads only) |
| Pricing / offer | any price, plan, unit, trial or guarantee change (a pricing-model change is critical; price, free tier: high; tiers or feature gating: medium — rival-craft §6) · a new discount ≥10% or switch offer |
| Positioning | a new headline promise · a new "vs" or "alternatives" page |
| Product | a launch, a new tier, a deprecation |
| Founder voice | a post at ≥3× their usual engagement · a new claim about the category or about us |
| Hiring | ≥3 new roles in one team · a new country or segment · a freeze |
| Reviews / community | a theme appearing 3+ times in the week · rating moves ≥0.1 |
| Search / AI | a rival newly named for one of our prompts · a rival bidding on our name |
| Email / events / partners | a new switch or discount offer by email · a flagship event in the next 30 days · a partnership with a platform we rely on |

### The what-changed report — `research/competitors/watch/<YYYY-MM-DD>.md`

A report like any other, written through the `write-report` skill (`../../write-report/SKILL.md`) (plain words, no ids; a local copy `gooseworks-reports/<brand-slug>/<YYYY-MM-DD>-competitors-what-changed.md` when run in a host with files). Line 2 stays fixed because analyze-performance reads it.

```markdown
# <Brand> — what changed with competitors, week of <D Month YYYY>
Week of <date> · <n> changes that matter · rivals watched: <names> · not re-checked this time: <areas, with when they were last checked>

## In short
**What we looked at:** <rivals and sources re-read since <last run date>, and what was carried forward unread>.
1. <The biggest change against the stored numbers — so what (confirmed / likely / first look).>
2. <…> (2–3 in all; then one line on how last time's recommendations stand.)
**So, do this first (because of <1>):** <the one move that matters now, who, by when — or "nothing needs action this week">.

## Decisions for you
| Decision | My recommendation | Matters by |
|---|---|---|

## Act now (only if something can't wait)
## The changes that matter — what happened (linked) · what it means · who acts (the campaign plan, a new ad, an email to customers, a comparison page, the founder)
## By rival (changes only)
## What to do
(≤ 6, each with who does it, what it needs, how we'll know, by when — these become the run record's recommendations)
## What we're not doing, and why
## Angles to add or retire
## Checked, no change
## What we couldn't check
## Sources
(with a source-skew line)
```

Then rewrite each rival's Snapshot block (keep the old one as `## Previous snapshot`), save each changed rival record through the `save-to-brain` skill (`../../save-to-brain/SKILL.md`) (`supersede`, its `Competitor file:` title and tags), and save the note through the `save-to-brain` skill (`../../save-to-brain/SKILL.md`) (`keep-history`, title `Competitor watch — <Brand> — <date>`, tags `research-competitors`, `competitor-watch`).

### Scheduled repeat (only on a yes)

Weekly by default when rivals are active: a what-changed report only when something crosses a threshold above — otherwise nothing is sent and only the snapshots are refreshed — plus a full teardown each quarter (a normal run). Scheduled runs have no browser: they read news, pages that fetch can read and the server's free samples, never the ad libraries; say so when offering it.

Follow the `spend-gate` skill (`../../spend-gate/SKILL.md`) branch C. Needs a coworker; without one, say so and keep running on ask. Before asking, say what the scheduled run can and cannot re-read: it uses free sources — the server's competitor research and samples, and web search and pages if the scheduled worker has them — and never spends on data unless the yes names a per-run ceiling. Its own run cost is unknown until the first run; show it afterwards from `gooseworks:automation_list`.

On a yes: copy the method for the scheduled worker into `research/competitors/method/` with `gooseworks:file_write` (each file headed `Method version: <skill.meta.json version>, copied <date>`; re-copied whenever the run is changed or switched on). The worker runs on the server with no skills folder and no browser, so the method must be complete on its own:
- `watch.md` — this file (dimensions, thresholds, the what-changed shape), plus the category's AI-answer and money-search prompts copied from the last report;
- `rival-craft.md` — `rival-craft.md` (the §1 news queries, the §6 price-change severity, the Wayback recipe);
- `run-memory.md` — this playbook's `references/run-memory.md`;
- `shared/run-memory.md`, `shared/write-report.md`, `shared/save-to-brain.md`, `shared/spend-gate.md` — copies of those shared atoms (a link inside them such as ../write-report/SKILL.md means shared/write-report.md).
Then create the automation paused (`gooseworks:automation_upsert`, `execution_mode: "agent"`, the prompt below as `agent_prompt`, a weekly cron in the human's timezone, `enabled: false`) and switch it on only when the human says so. The guide's file index lists these method files.

```text
Competitor watch (weekly, nobody present) for brand <brand name> (<brand_id>), workspace scope <scope>. Method version <version>, copied <date>. Read with file_read, in this order: research/competitors/method/watch.md, run-memory.md, rival-craft.md, and shared/*.md as they are referred to. Ask nothing; spend nothing beyond the spending rule; never accept a proposal.
1. Start: the last record is the newest file under runs/research-competitors/competitor-watch/ OR runs/research-competitors/competitor-research/ (either job). None → this is the first tracked run: say so; an earlier report in research/competitors/ gives the before, labelled with its date. Read the record whole. Check each open recommendation: pages and posts from the brand's sitemap.xml and blog feed (new since the recommendation's date, matched by its planned title or slug), then fetch the page; also social_post_list, campaign_read, competitor_read. Mark done / not done only from a source; not due yet → keep open, don't ask; otherwise unknown.
2. The rivals are the ones in the last record's Numbers rows (not every file in research/competitors/). For each: re-read what you can free — news (rival-craft §1 queries), blog and changelog feeds, Hacker News search, the sitemap, pricing and homepage text, careers page, review page; competitor_research (no mentions), ads_template_read mode competitor, brand_read section organic. Never the ad libraries: carry their counts forward marked "carried, not re-read". Diff against the record's numbers and the rival's Snapshot block; grade price changes by rival-craft §6; keep only changes over watch.md's thresholds. A react-now item goes into "Act now" only — no questions.
3. Something crossed → write research/competitors/watch/<YYYY-MM-DD>.md in watch.md's what-changed shape (plain words, no ids; In short: what was re-read since <last run date>, the 2–3 changes with how sure, then "So, do this first (because of …)"; unknown statuses once in Decisions for you, with today as asked-on) and import it (media_upload scope brand, kind document, source workspace; title "Competitor watch — <brand name> — <YYYY-MM-DD>"; tags research-competitors, competitor-watch; knowledge_import; wait until ready; delete only an earlier document with exactly this title). Nothing crossed → no report; questions are marked "to ask" in the record.
4. Either way: update each changed rival's Snapshot — fields you re-read get today's date, fields you didn't keep their value and last-read date; keep the previous block as "Previous snapshot" — and re-import that rival's record (title "Competitor file: <Rival> — <brand name> — <date>", tags research-competitors, competitor-file, rival:<slug>; delete only older documents with that rival's title). Then write the run record at runs/research-competitors/competitor-watch/<YYYY-MM-DD>.md (title "Run record — competitor watch — <brand name> — <YYYY-MM-DD>"; tags research-competitors, run-record; keep-history; import) with the numbers, what crossed or "nothing crossed a threshold", and every open recommendation carried forward with its id. If any import answer shows a price, skip that import, keep the files, and say so in the report or record. A run that could not read its sources writes "Not run: <why>" instead and keeps the previous baseline.
<Spending rule: "Free sources only." | "Paid reads up to <N> credits this run, logged in research/credits-log/<YYYY-MM>.md; stop at the ceiling.">
Never state a rival's spend or results; label inferences; never contact anyone; never add or remove rivals.
```

## React now — one rival made a move

The alert goes out this turn — don't run a full teardown first.

1. **Verify** with a dated public source — their page, a filing, press, the founder's post (in a hosted chat without web access, a dated link or screenshot from the human). Check list price vs promo, everyone vs new customers, and the country. Hearsay is logged "unverified" and nothing else happens.
2. **Read the market's reaction:** community threads, third-party demos or posts, review spikes, press — first 24–72 hours. Check our own brand's news too — the founder may already be part of the story (an acquisition, a partnership, a statement).
3. **The alert** (short; a note in the rival's record plus the chat):
   - What happened (linked, dated) and the **window** it opens (e.g. "until data deletion on <date>").
   - The move (spec §4): switch campaign, counter-position, defend, comparison page — with a **draft brief** (audience, offer, channel, assets, end date) and any claims that need the founder's sign-off.
   - For a launch we already do better: our own demo of the same job this week, in the format the market is already sharing (format, never their script), naming them only on comparison pages and only with dated proof.
   - A shutdown or layoffs: offer a home for their customers' work, never mock the rival or its people.
   - Search ads on a rival's brand or launch terms only after the `ad-policy-check` skill (`../../ad-policy-check/SKILL.md`) (trademark rules differ by platform and country).
   - Always offer "do nothing" with its trade-off. Price matching is the founder's call — never recommend it by reflex.
4. **Save** a dated `## Move <date>` note in the rival's record through the `save-to-brain` skill (`../../save-to-brain/SKILL.md`) (`supersede`, title `Competitor file: <Rival> — <Brand> — <date>`, tags `research-competitors`, `competitor-file`, `rival:<slug>`).
5. **At the end:** if the company isn't tracked, ask whether to add it (`gooseworks:competitor_save` on a yes).
