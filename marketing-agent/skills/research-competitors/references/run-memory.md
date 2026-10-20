# Run memory for research-competitors

What this playbook hands the `run-memory` skill (`../../run-memory/SKILL.md`) at the start and the end of every run. The atom does the work (find the last record, check recommendations, write "since last time", save the new record); this file says what is specific here.

## Jobs

| `job` | When | `cadence` |
|---|---|---|
| `competitor research` | a full run — on ask, or the quarterly teardown | `quarterly` (on ask: `ad hoc`) |
| `competitor watch` | the what-changed run — weekly scheduled, or "what changed this week?" | `weekly` |

`playbook` = `research-competitors`; no `subject` (one record covers all rivals). **The last record is the newest record of either job** — a watch after a quarterly teardown reads the teardown (its fresh ad counts and new recommendations), and a teardown reads the last watch. Each run saves under its own job.

**No run record, but an earlier report exists** (saved before run memory): say "first tracked run; last report <date>", take that report's baselines table as the before (labelled "from the <date> report"), and log its "What to do" moves as recommendations with new ids, each status taken from a source. **Nothing at all:** "first run" — no "since last time"; this run's numbers are the baseline.

**What it does not replace:** each rival's record (`research/competitors/<slug>.md`) and its **Snapshot** block stay the source of truth for per-rival state — ad ids and start dates, pricing text, headline, open roles. The run record keeps only the numbers below and links the rival records by path; it never copies a snapshot.

## Numbers (the record's "Numbers" section)

One row per main rival, plus a row for us. Each cell carries its read date and how it was read; every number is `public page` (as read, not verified), except our own figures from the brand's data.

| Number | How it's read | Unit / note |
|---|---|---|
| Active ads per library (Meta, LinkedIn, Google, TikTok) | the library page, by advertiser | a count labelled with what it counts (Meta "active now", Google "shown since <date>") — never 0 unless the library loaded; compare a library only with itself across runs |
| Longest-running active ad | the library | days, with its ad id |
| Entry price and a typical buyer's monthly cost | pricing page (scenario from rival-craft §6) | $/month; "not public" |
| Launches in the last 90 days | changelog, news | count, with the biggest named |
| Reviews on the main review site | the review page | count and rating, with the site |
| Open roles | careers page | count, biggest team |
| Us: rank for "<main rival> alternative" | web search, signed out | position in the top 20, or "not in top 20" |
| Us: AI answers that name us | the 3–4 category questions | n of N |

The watch's thresholds (`watch-and-react.md`) are judged against these numbers and the rival snapshots, never against memory.

## Recommendations and how to check them

The report's "What to do" moves become the record's recommendations: id, owner, review-by date and "how we'll know". **Owner mapping:** the founder, "whoever runs the website", the ad or content maker → `marketer` (or the maker playbook once it takes the move); waiting for a yes in GooseWorks → `approval page`; this job's next run → `agent`.

**Not yet due:** a recommendation whose review-by date hasn't come, with nothing showing yet, stays **open** — carried forward unchanged and never asked about, with status `open` and its review-by date. Typical tests, with their **baseline recipe** (what to re-read, the same way, next time):
- **A page or post we publish** (comparison, alternatives, pricing explainer, a blog post): store the planned page title and slug in "how we'll know". Check: the brand's `/sitemap.xml` and blog feed for pages added since the recommendation's date, then fetch the match; rank for "<rival> alternative" in the top 20 by <date + 8 weeks> — the same signed-out search. Ranking moves slowly: never judge a page under 6 weeks old.
- **An ad or post on an angle** (owner: the ad or content maker): exists by <date> — `gooseworks:social_post_list`, `gooseworks:campaign_read`, or `gooseworks:meta_read` for ads GooseWorks launched; its result belongs to analyze-performance — link its report, don't re-judge here.
- **A rival tracked or dropped:** `gooseworks:competitor_read`.
- **A move we decided not to make** ("What we're not doing") is recorded as a decision, not a recommendation.

`outcome_sources` = the brand's own sitemap, blog feed and pages (fetch), `social_post_list`, `campaign_read`, `meta_read` (GooseWorks-launched ads only), `competitor_read`, analyze-performance's latest report.

## The founder's answers

Save the run record **before** the closing message, and put the one-line "saved" note into that message. When the founder answers a decision in the same conversation, re-save the same day's record under the same title (keep-history replaces only that exact title) with the Decisions and owners updated. A later run treats a question as answered only from a dated Decision in a record.

## Scheduled watch (nobody present)

Run-memory's scheduled rules apply in full. Here specifically:
- Free reads only (news, pages and feeds a fetch can read, the server's free samples); never the ad libraries — the record says "ad libraries not read (scheduled run)" under Not checked, and the ad-count cells keep the previous value marked "carried, not re-read".
- **Nothing crossed a threshold** → no report is sent, but the run record is still written: the numbers re-read, "nothing crossed a threshold", the open recommendations carried forward. That record is the next baseline.
- **Something crossed** → a what-changed report through write-report: what was re-read, what changed against the stored numbers, then "So, do this first (because of …)", in "In short"; its "Decisions for you" holds any `unknown` statuses (once each, with the date asked).
- **Questions on a quiet week** (no report goes out): mark the item `to ask` in the record with "asked on" empty; it is asked in the next report or the next run with the founder present.
- A run that can't read its sources (a connection missing, every page failing) writes a `Not run: <why>` record and keeps the previous baseline.
