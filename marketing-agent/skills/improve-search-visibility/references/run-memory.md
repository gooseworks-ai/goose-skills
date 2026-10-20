# Run memory for improve-search-visibility

What this playbook hands the `run-memory` skill (`../../run-memory/SKILL.md`) at the start and end of every run. The atom does the work: it finds the last record, checks recommendations, writes "since last time" and saves the new record. This file says what is specific to search: the per-question baseline, how to tell real movement from noise, and how to check whether last run's five fixes shipped.

## Job

| `job` | When | `cadence` |
|---|---|---|
| `search visibility check` | every run: the first one, a monthly scheduled run, a re-check after a fix ships, or "am I in ChatGPT yet?" | `monthly` |

`playbook` = `improve-search-visibility`. No `subject`: one record covers the whole question set. File: `runs/improve-search-visibility/search-visibility-check/<YYYY-MM-DD>.md`.

**What it does not replace.** These files stay the source of truth, and the record links them by path without copying them:
- `search/questions.md`: the question set, its ids and its version.
- `search/page-map.md`: the roadmap and each page's state.
- `search/fixes/<date>.md`: the finished fix text.
- `search/visibility/<date>-runs.md`: the verbatim answers.

The record holds only the snapshot below, the five fixes as recommendations, and their outcomes.

**When each Start step runs.** Atom steps 1–2 (find and read the last record, read what happened since) run before the free pass, so the free pass knows which questions and fixes to re-check. Steps 3–4 (check each fix, write since last time) run **after** the free pass, from its answers: never ask a question twice, and never write since last time before today's answers exist.

**First run.** There is no record yet. If `search/visibility/` has reports from before run memory existed, the newest one is the baseline: say so ("compared with the check on 18 Oct, before this run kept notes"). Otherwise this run's snapshot becomes the baseline.

## Numbers: the per-question snapshot

The record's header names the question set version actually asked this run, and states once how it was checked: browser signed out, from <location>, 3 tries for the most important questions. Cells then say only what differs (`pasted`, `not checked`). This keeps a 15-question snapshot well inside the atom's size limit. One row per question asked, plus summary counts. Labels follow the atom:
- `derived`: our own checks (AI answers, web search).
- `claimed`: Search Console, which is Google's own report.
- `truth`: the brand's own analytics.

| id (set v<N>) | ChatGPT | AI Overview | AI Mode | Google page one | Web search | Named instead (top one) |
|---|---|---|---|---|---|---|
| Q3 (key) | 0 of 3 · browser, signed out, US | not shown | named | #7 (top-up) | on page one | Canva |

- **ChatGPT cell:** named k of N, plus the route: `browser, signed out, <location>`, `pasted`, or `not checked`. A question asked once says so.
- **AI Overview and AI Mode cells:** `named`, `not named`, `not shown` (no AI answer appeared), or `not checked`.
- **Google page one:** the position, or `not on page one` from the paid top-up. Otherwise `—`.
- **Web search:** on page one or not, from the host's search, labelled as web search.

**Summary counts**, each one stated per route:
- Named on X of N buying questions.
- Brand facts: wrong / unsupported / right.
- Rival page-type gap counts, from the rival content map.
- When shared: Search Console clicks and impressions for the brand's pages over the last 28 settled days (end 3 days before today), with the country.
- When shared: AI-referral visits over the same 28 days (chatgpt.com, perplexity.ai and similar referrers).

## Comparing question by question (the "since last time")

**The baseline is per cell.** For each question and engine, it is the newest record where that cell was actually checked the same way. It is not simply the newest record. A cell that wasn't checked this run is written `not checked; last: 0 of 3, 2026-09-18 (browser)`, so the value survives any number of runs that couldn't check it.

Movement is judged only between like and like. Anything else is "not comparable", never a change.
- **Same question.** Same id. A reworded question gets a **new id** (the question-set atom retires the old one: "reworded → Q14, v2"), so the same id always means the same words. A new id has no baseline yet. Keep swaps to the 3 the question-set atom allows, so most questions stay comparable.
- **Same route and place.** Browser signed out against browser signed out, from the same browser location. Pasted answers compare only with pasted answers, and web search only with web search. The paid Google top-up compares only with an earlier top-up.
- **Noise rule.** AI answer lists rarely repeat.
  - **Key questions (3 tries):** a change of 2 or more tries (0 → 2, 3 → 1) is "moved". A change of 1 is "wobbled, watch it".
  - **Questions asked once:** a flip is "changed once, not a trend".
  - **Google:** on or off page one, or 3 or more positions, is "moved".
  - **A trend** needs the same direction on two checks in a row (three for single-try questions).
- **Totals.** Compare totals only over the questions asked both times, the same way, and say how many: "on the 7 buying questions asked both times: named on 1 today, 0 on 18 Sep". A total built from single tries that each only "changed once" is reported as a first look, not as movement. It counts as **moved** only when at least one of the most important questions passes the 2-of-3 rule, or a second check agrees. Until then it stays out of "In short". Never set today's count beside a count taken with a different set or route.
- **Who moved in.** When a rival newly wins a question, name the source the answer cites. That is usually the reason.
- An earlier run's answers are still never counted in today's numbers. They are the baseline for the comparison, shown as "last checked <date>".

## Recommendations: the five fixes, checked

**Open fixes come first in this run's five.** A fix from last time that is still open and still worth doing keeps its id. It goes into this run's five first, marked "still open from <date>", never re-issued as new. New fixes fill the rest, up to five. Anything else is parked on the roadmap (`page-map.md`), and the report says so in one line.

Each of the five fixes in the report becomes a recommendation:
- **id:** `<YYYYMMDD>-<n>`, carried unchanged until it is done or dropped.
- **owner:** `marketer`, or `make-content` for a new page brief.
- **parts:** a fix with several parts (measurement: Search Console, Bing, the AI-referral baseline; a title and an opening) lists them in the `what` cell. It is `done` only when every part is shown. Otherwise it is `not done (partly: title live; opening unchanged)`.
- **No personal data:** an inclusion request names the publication and the list, never its author.
- **review by:** see below.
- **how we'll know:** the questions it targets (by id), the engine, today's cell for each, and the recipe: same question version, same route and location, 3 tries for key questions.

Roadmap rows that are not in the five stay in `page-map.md` and are not recommendations.

**Did it ship? `done` only from a source, never from a draft or an inference.**

| Fix kind | How to check, free | Done when |
|---|---|---|
| Page text (title, opening answer, FAQ text, comparison table) | fetch the live page | the page shows the change; quote the new title or first line |
| New page from a brief | fetch the URL; look for it in the sitemap | the page is live (200), in the sitemap and indexable. A make-content draft naming the brief means "drafted, not live", which is `not done` |
| Structured data | view-source on the page; with a browser, the rendered page too | the markup is present and matches the fix. Missing from the raw HTML but the site builds pages with scripts, and no rendered check → `unknown` |
| Crawler access, robots rules, CDN bot blocking | robots.txt; fetch as each bot (needs a shell) | the rule or block is gone |
| Profiles (review sites, Wikidata, business profile) | open the profile as a person would | the profile shows the change |
| App store listing | the listing page | the text matches |
| Measurement (Search Console, Bing, AI-referral baseline) | page source first: Google and Bing verification tags, and the analytics tag. A tag is partial evidence (the account exists), not proof the data flows | the marketer confirms, or shares a Search Console or analytics number. With tags only: `not done (partly: …)` or `unknown`. The question goes once into "Decisions for you" |
| Inclusion or correction request to a list owner | the list page | sent: only the marketer can say. Result: the list now names the brand, or the false fact is gone |

**Review by counts from the day it went live, which the first record can't know.** A new recommendation is written as `4 weeks after live` (a changed page), `8 weeks after live` (a new page) or `next check after the list changes` (a third-party list). These are relative timings, not dates. The run that first sees a change live records `live: first seen <date>`, or the marketer's own date if they give one, and turns the relative timing into a date from that day. A list request's review date is the next scheduled or expected check. Before the date the verdict is `too early`, with the date it becomes readable. Never judge a change from the date it was recommended.

**Did it work?** For a `done` fix past its review-by date, re-ask its targeted questions with the stored recipe.
- `worked`: the targeted questions moved past the noise rule in the expected direction, **and** the answer now names or cites the fixed page or list.
- `can't tell`: they moved, but the answer cites something else. Also when another change landed on the same questions in the window (a rival launch, a second fix), or the route differs from the baseline.
- `didn't work`: shipped, past review-by, and the targeted questions are unchanged over two checks. Don't repeat that fix; say what the next attempt changes.
- **With Search Console shared:** compare the page's clicks and impressions for the 28 days before it went live with the 28 days after, same country, read once the second window has settled (about 31 days after live). Label it `claimed`.
- **No experiment readouts from search.** These verdicts come from our own checks (`derived`), not from truth or claimed numbers. So search saves no `experiment_readout` fact; the result lives in the record and the report.

Never write "the fix caused it". Write "moved after the fix shipped, and the answer now cites your page".

## Scheduled monthly check (nobody present)

The atom's scheduled rules apply in full. In this playbook:
- **No browser on the scheduled host** (the usual case today) means ChatGPT, AI Overview and AI Mode can't be re-asked.
  - Their cells say `not checked (scheduled run, no browser); last: <value, date>`, so the per-cell baseline survives. A missing check is never a 0.
  - The report says plainly that the AI answers weren't re-asked.
  - "Decisions for you" offers the 5-question paste set, or a check together next time.
  - The goose-aeo engine on the server would close this gap (`server-needs.md` §1).
- **Still check, free:**
  - every open fix's ship status, using the table above;
  - web search for each category question;
  - news about the brand and rivals;
  - robots.txt and the sitemap;
  - rival sitemap counts.
- **No paid top-up** unless the automation's yes named a per-run ceiling.
- **The report** opens with what changed since the last check, through write-report. "Nothing material changed" is a valid report. A run that could read nothing writes a `Not run: <why>` record.

## The scheduled job's prompt

The server-side agent does not have this playbook, so the automation prompt must be self-contained. Write it when creating the automation, with the brand and paths filled in:
- **Who and where:** the brand's name and id, and its coworker workspace. Never edit the site, profiles or listings; never send anything; free reads only (or the named ceiling). Never save a learning or an experiment readout.
- **Read:** the newest record in `runs/improve-search-visibility/search-visibility-check/`, plus `search/questions.md` and the newest `search/fixes/` file. Each question and engine's baseline is the newest record where that cell was checked the same way.
- **Check each open fix:** fetch the page, the sitemap or robots.txt. `done` only when the live page shows every part of the fix, never from a draft. Record `live: first seen <date>`, and judge a result only after its review timing from that day (changed page 4 weeks, new page 8 weeks).
- **Re-ask:** only if a browser is available, signed out, 3 tries for the most important questions. Otherwise write `not checked; last: <value, date>`. Run the web search for each category question either way.
- **Compare:** like with like (same question id, same way of asking). One change is noise, and a trend needs two checks. Totals only over questions asked both times. Never write that a fix caused a change.
- **Report:** to `search/visibility/<date>.md`. It opens with what changed since last time, in plain words, with no question ids, codes, tool names or paths. Open questions go once into "Decisions for you", skipping any the last record shows as already asked. Save the report to the brand as `Search visibility — <Brand> — <date>` (keep-history).
- **Run record:** `runs/improve-search-visibility/search-visibility-check/<date>.md`, saved to the brand as `Run record — search visibility check — <Brand> — <date>` (keep-history, earlier ones never deleted). Counts only, no personal data. If fetch and web search both fail, write a `Not run: <why>` record that carries every open fix forward.

`outcome_sources` = the brand's live pages, sitemap and robots.txt (fetch); its profiles and store listing (browser); make-content's drafts naming the briefs (`content/drafts/`); Search Console and analytics when the marketer shares them; the marketer's own word in the conversation.
