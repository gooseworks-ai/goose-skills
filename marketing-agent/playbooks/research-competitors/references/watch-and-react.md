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
9. **Email, events, partnerships:** new newsletter offers; the next flagship event (a launch often lands on it — an early warning); new integrations or platform partners.

Report only what crossed a threshold:

| Area | Report when |
|---|---|
| News | anything material in the window (always) |
| Ads | a new idea (not a new size of an old one) · an idea crosses 30 / 60 / 90 days · an idea gains 3+ versions · active count moves ≥25% (full-library reads only) |
| Pricing / offer | any price, plan, unit, trial or guarantee change · a new discount ≥10% or switch offer |
| Positioning | a new headline promise · a new "vs" or "alternatives" page |
| Product | a launch, a new tier, a deprecation |
| Founder voice | a post at ≥3× their usual engagement · a new claim about the category or about us |
| Hiring | ≥3 new roles in one team · a new country or segment · a freeze |
| Reviews / community | a theme appearing 3+ times in the week · rating moves ≥0.1 |
| Search / AI | a rival newly named for one of our prompts · a rival bidding on our name |
| Email / events / partners | a new switch or discount offer by email · a flagship event in the next 30 days · a partnership with a platform we rely on |

### The what-changed report — `research/competitors/watch/<YYYY-MM-DD>.md`

A report like any other, written through `../../../atoms/write-report/ATOM.md` (plain words, no ids; a local copy `gooseworks-reports/<brand-slug>/<YYYY-MM-DD>-competitors-what-changed.md` when run in a host with files). Line 2 stays fixed because analyze-performance reads it.

```markdown
# <Brand> — what changed with competitors, week of <D Month YYYY>
Week of <date> · <n> changes that matter · rivals watched: <names> · not re-checked this time: <areas, with when they were last checked>

## In short
- **Do this first:** <the one move that matters now — or "nothing needs action this week">.
- <the 2–3 biggest changes, each with its so what>

## Act now (only if something can't wait)
## The changes that matter — what happened (linked) · what it means · who acts (the campaign plan, a new ad, an email to customers, a comparison page, the founder)
## By rival (changes only)
## Angles to add or retire
## Checked, no change
## What we couldn't check
## Sources
```

Then rewrite each rival's Snapshot block (keep the old one as `## Previous snapshot`), save each changed rival record through `../../../atoms/save-to-brain/ATOM.md` (`supersede`, its `Competitor file:` title and tags), and save the note through `../../../atoms/save-to-brain/ATOM.md` (`keep-history`, title `Competitor watch — <Brand> — <date>`, tags `research-competitors`, `competitor-watch`).

### Scheduled repeat (only on a yes)

Weekly by default when rivals are active: a what-changed report only when something crosses a threshold above — otherwise nothing is sent and only the snapshots are refreshed — plus a full teardown each quarter (a normal run). Scheduled runs have no browser: they read news, pages that fetch can read and the server's free samples, never the ad libraries; say so when offering it.

Follow `../../../atoms/spend-gate/ATOM.md` branch C. Needs a coworker; without one, say so and keep running on ask. Before asking, say what the scheduled run can and cannot re-read: it uses free sources — the server's competitor research and samples, and web search and pages if the scheduled worker has them — and never spends on data unless the yes names a per-run ceiling. Its own run cost is unknown until the first run; show it afterwards from `gooseworks:automation_list`.

On a yes: save this file's dimension list, thresholds and note shape to `research/competitors/method/watch.md` (headed `Method version: <skill.meta.json version>, copied <date>`; re-copied whenever the run is changed or switched on), then create the automation paused (`gooseworks:automation_upsert`, `execution_mode: "agent"`, the prompt below as `agent_prompt`, a weekly or monthly cron in the human's timezone, as they chose, `enabled: false`) and switch it on only when the human says so.

```text
Competitor what-changed report (<weekly | monthly>) for brand <brand_id>. Method version <version>, copied <date>. Follow research/competitors/method/watch.md.
For each main rival in research/competitors/<slug>.md: re-read every dimension in the method file you can reach, in its order for this company type (B2B: news, founder posts, LinkedIn and Google ad libraries, changelog, pricing and headline, hiring, reviews, events and partners; DTC: news, Meta and TikTok ads, organic, offers and email, reviews) — web search and pages if you have them; free server reads: competitor_research (no mentions), ads_template_read mode competitor, brand_read section organic, diff against the Snapshot block, and keep only changes that cross the thresholds. Dimensions you could not re-read go on line 2 as "not re-read", never as "no change".
Write research/competitors/watch/<YYYY-MM-DD>.md in the what-changed report shape — plain words, no ids, opening with what changed; rewrite each Snapshot (keep the previous one) and re-import each changed rival record the same way under its "Competitor file: <Rival> — <Brand> — <date>" title, deleting only older documents with that rival's "Competitor file: <Rival> — <Brand>" title. Import the note (media_upload scope brand, kind document, source workspace, same scope; title "Competitor watch — <Brand> — <YYYY-MM-DD>"; tags research-competitors, competitor-watch; then knowledge_import and wait until ready). Delete only an earlier document with exactly this title; never another week's.
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
   - Search ads on a rival's brand or launch terms only after `../../../atoms/ad-policy-check/ATOM.md` (trademark rules differ by platform and country).
   - Always offer "do nothing" with its trade-off. Price matching is the founder's call — never recommend it by reflex.
4. **Save** a dated `## Move <date>` note in the rival's record through `../../../atoms/save-to-brain/ATOM.md` (`supersede`, title `Competitor file: <Rival> — <Brand> — <date>`, tags `research-competitors`, `competitor-file`, `rival:<slug>`).
5. **At the end:** if the company isn't tracked, ask whether to add it (`gooseworks:competitor_save` on a yes).
