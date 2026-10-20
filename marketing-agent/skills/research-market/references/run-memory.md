# Run memory for research-market

What this playbook hands the `run-memory` skill (`../../run-memory/SKILL.md`) at the start and the end of every run. The atom does the work; this file says what is specific here.

## Jobs

| `job` | When | `cadence` |
|---|---|---|
| `market research` | the full report — on ask, or quarterly | `quarterly` (on ask: `ad hoc`) |
| `market pulse` | the one-page "what changed" — monthly | `monthly` |
| `brand watch` | alerts only — weekly, daily during a launch or a crisis | `weekly` (or `daily` while it runs daily — say which) |

`playbook` = `research-market`; no `subject`. **A full report and a pulse take the newest record of either of those two jobs** as their last record and baseline (a pulse after a quarterly report reads the report). A brand watch only reads brand-watch records — its counts aren't comparable with a report's. `daily` cadence counts as old after 3 days.

**No run record, but an earlier report exists** (saved before run memory): say "first tracked run; last report <date>", take that report's baselines table as the before (labelled "from the <date> report"), and log its "What to do" moves as recommendations with new ids, each status taken from a source. **Nothing at all:** "first run" — no "since last time"; this run's numbers are the baseline.

## Numbers (the record's "Numbers" section)

| Number | How it's read | Label |
|---|---|---|
| Market chosen | the "which market" decision | — |
| Size, top-down | the analyst figures used | publisher, year, link; `public page` |
| Size, bottom-up | buyers × price per buyer group, each input with its source or "assumption" | `derived` |
| Price norm | median entry price and unit across the pricing table (n products) | `public page` |
| Search interest | Google Trends index for the 1–2 main terms, region, period — or "couldn't read" | `public page` (relative, not volume) |
| Mentions of us in the window | the listening worker's count, same query set | sample; `public page` |
| Feeling | positive n vs negative n | sample |
| AI answers that name us | n of N category questions | `public page` |
| Our review count and rating | per review site | `public page` |

A **brand watch** record keeps only: the window and its length in days, the watchlist's date, platforms checked, mentions **per day** (sample, same method), negative n, the negative themes seen (named, with counts), rivals' news checked, alerts sent (what, when). Its threshold "≥2× the last watch" compares mentions per day, against the previous brand-watch record on the same watchlist, never against a market report; a changed watchlist means "not comparable this time".

## Recommendations and how to check them

The report's "What to do" moves become the record's recommendations. **Owner mapping:** the founder, "whoever runs the website", the ad or content maker → `marketer` (or the maker playbook once it takes the move); waiting for a yes in GooseWorks → `approval page`; this job's next run → `agent`. **Not yet due** (review-by not reached, nothing shows): carried forward, never asked about — recorded with status `open` and its review-by date. Typical tests, with their **baseline recipe**:
- **A move to compete in the recommended market** (a homepage or category change): the brand's site or brand record shows the new category by <date> — fetch the page; `gooseworks:brain_search` / `brand_read` for the positioning field.
- **A post or content move on a trend or a voice's topic:** posted by its post-by date — `gooseworks:social_post_list`; its result belongs to analyze-performance.
- **Running audience research** (when there were no buyer groups): `research/audience/buyer-groups.md` exists by <date>.
- **A risk alert:** handled or not, from the marketer's answer only; never inferred.

`outcome_sources` = the brand's own sitemap, blog feed and pages (fetch; a planned page is matched by the title or slug stored in "how we'll know"), `gooseworks:brain_search` (or `brand_read`), `social_post_list`, the workspace files of research-audience and analyze-performance.

## The founder's answers

Save the run record **before** the closing message, and fold the one-line "saved" note into it. When the founder answers a decision in the same conversation, re-save the same day's record under the same title with the Decisions and owners updated. A later run treats a question as answered only from a dated Decision in a record. Questions on a scheduled run with no report (a quiet brand watch) are marked `to ask` with "asked on" empty, and asked in the next report or the next run with the founder present.

## Scheduled pulse or brand watch (nobody present)

Run-memory's scheduled rules apply in full. Free reads only; ask nothing; `unknown` statuses go once into "Decisions for you". A brand watch that finds nothing over a threshold sends nothing and still writes its record (the counts, "nothing crossed a threshold") — that is the next baseline. A run that can't read its sources writes `Not run: <why>` and keeps the previous baseline.

**Setting one up (on a yes, created paused, spend-gate branch C).** The worker runs on the server with no skills folder and no browser, so copy the method into `research/market/method/` with `gooseworks:file_write`, each file headed `Method version: <skill.meta.json version>, copied <date>`: `pulse.md` (this playbook's `references/report-format.md` pulse shape and the market-pass sections it re-reads: §3 what's changing, §5 prices, §7 demand, §9 baselines), `listening.md` (the listening atom and `references/listening-craft.md`), `run-memory.md` (this file), and `shared/run-memory.md`, `shared/write-report.md`, `shared/save-to-brain.md`, `shared/spend-gate.md` (a link inside them such as ../write-report/SKILL.md means shared/write-report.md). Then `gooseworks:automation_upsert` with `execution_mode: "agent"`, `enabled: false`, and one of these prompts:

```text
Market pulse (monthly, nobody present) for brand <brand name> (<brand_id>), workspace scope <scope>. Method version <version>, copied <date>. Read with file_read: research/market/method/pulse.md, listening.md, run-memory.md, and shared/*.md as referred to. Ask nothing; free reads only unless a ceiling is named below; never accept a proposal.
1. Start: the last record is the newest under runs/research-market/market-pulse/ or runs/research-market/market-research/ (either). None → first tracked run; an earlier report in research/market/ gives the before, labelled with its date. Check each open recommendation from a source (sitemap, blog feed, pages, social_post_list, brain_search or brand_read, research/audience/ files); not due yet → keep open, don't ask.
2. Re-read free: news for the brand and the category, the pricing pages in the last pricing table, Google Trends where it opens, what people are saying (listening.md, report mode, its depth caps). Compare with the record's numbers.
3. Write a one-page pulse report (research/market/<YYYY-MM-DD>-read.md, title "Market pulse — <brand name> — <YYYY-MM-DD>", tags research-market, market-pulse; In short: what was re-read since <last run date>, the 2–3 changes with how sure, then "So, do this first (because of …)"; unknown statuses once in Decisions for you) and import it; a serious risk goes in "Act now".
4. Write the run record at runs/research-market/market-pulse/<YYYY-MM-DD>.md (title "Run record — market pulse — <brand name> — <YYYY-MM-DD>", tags research-market, run-record; keep-history; import). If an import answer shows a price, skip it, keep the file, say so. A run that couldn't read its sources writes "Not run: <why>".
<Spending rule>
```

```text
Brand watch (<weekly | daily>, nobody present, alerts only) for brand <brand name> (<brand_id>), workspace scope <scope>. Method version <version>, copied <date>. Read with file_read: research/market/method/listening.md (brand-watch mode), run-memory.md, shared/*.md as referred to. Ask nothing; free reads only; never reply to or contact anyone.
1. Start: the newest record under runs/research-market/brand-watch/. None → first watch; say so; this run's counts are the baseline.
2. Brand-watch mode with research/market/watchlist.md: risk first, then mentions since the last watch (per day), negative themes, rivals' news, and the voices' convergence. Judge each threshold in listening.md against the last brand-watch record on the same watchlist.
3. Something crossed → write research/market/watch/<YYYY-MM-DD>.md in the brand-watch note shape (title "Brand watch — <brand name> — <YYYY-MM-DD>", tags research-market, brand-watch) and import it. Nothing crossed → no note.
4. Either way, write the run record at runs/research-market/brand-watch/<YYYY-MM-DD>.md (title "Run record — brand watch — <brand name> — <YYYY-MM-DD>", tags research-market, run-record; keep-history; import) with the window, its length, the watchlist date, mentions per day, negative themes, alerts or "nothing crossed a threshold". A run that couldn't read its sources writes "Not run: <why>".
```

