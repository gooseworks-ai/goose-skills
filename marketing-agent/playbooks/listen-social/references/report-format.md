# Report format

Load at steps 8–10. The header lines are parsed by analyze-performance and the next run — keep their shape exactly. File names, the counting week, the baseline, re-runs and the items file are in `../atoms/listening-window/ATOM.md`; `<D>` is the counting week's Monday.

## social/listening/<D>-report.md — full form

```markdown
Do this first, because… <one sentence: the single most important action this week and why — or "nothing needs action this week">
Week of: <D> to <Sunday> (<timezone>) · Run: <run date and time>[; <re-run date and time>] · Triage covered up to: <run date and time> · Trends read: <run date> · valid to: <latest post-by> · Watchlist: v<n> · Compared against: <prior counting week's report date | <date> (not the prior week) | baseline week>
Mentions: <n (free-pass sample) | n | ≥n (cap hit: Q<n>) | ≥n (stopped: Q<n>)> (Δ <+/-n> vs last week; none when the count is a floor, the baseline is not the prior week, the method differs from last week's, or it is the baseline week) · Positive <n> · Negative <n> · Mixed <n> · Neutral <n> · Questions <n> · Unclear <n>
Share of voice (covered surfaces, same method): <brand> <n> · <rival> <n> | not comparable this week (different sources) | sample only (free pass)
Risk flags: S1 <n> · S2 <n> · S3 <n> · open from earlier weeks <n>
Credits: <none (free pass) | spent of approved ceiling> · Data freshness: own and rival posts synced <date>
Links: <all opened | Act-now + 5 opened | as returned, unchecked>
# Listening report — <Brand> — <D>

## Act now (0–3 items)
1. <S1/S2> — <one line> — <link> — poster reach <n> — velocity <…> — separate posters <n> — what we know / don't — recommendation — owner — draft R-03 — <in counts | this week, not in counts | open since <date>>
   Hold list (S1 only): <paid ads, scheduled posts, promo emails touching the product — for the human to pause>

## So what (five lines max)
Line 1 when the free pass couldn't read most of the default platforms: "I could read <platforms>; I couldn't read <platforms> — nothing bad in what I could read is not the same as nothing bad." The paid top-up for those platforms is then the first decision in the closing message.

## This week so far (<Mon>–<today>, not counted — only on a mid-week run)

## For you (the 3–5 things to do, ranked — each points to its row below; rows keep their own one-line "For you", never repeated here word for word)
For you: fits — <why, from our facts> → do: <post Y on <platform> · reply to these 3 threads (R-01–R-03) · brief a creator on this format · fix the FAQ> · claim: "<approved line>" (or "<line>" — needs your sign-off; or "you'd need proof of <X> first") · who: <organic posts / the founder / support / creators / static ads / video ads>
Plain words for "who", never a playbook or tool name. Facts-only asks skip this. With an empty brand brain: "I can't tell what fits you yet — I can learn your brand first."

## You vs them
| | What people say (theme, n) | Evidence (links) | For you |
|---|---|---|---|
| Ahead — say it louder | | | |
| Behind | | | |
| Everyone sounds the same | | | <what to say instead — people's words over rivals' habits> |

## Coverage
| surface | status | why |
|---|---|---|

## Mentions
| platform | brand | products | founder (by others) | each rival | Δ vs last week |
|---|---|---|---|---|---|
Notable items:
| id | link | date | author (reach) | engagement | class | route | note |
|---|---|---|---|---|---|---|---|

## Comment themes
| theme (their words) | n | last week | direction | quotes (links) | For you |
|---|---|---|---|---|---|

## Competitor conversation
Complaint and praise themes per rival, with links (what people say about them — not what they run).

## Outliers saved
| link | creator | multiple (baseline n) | hook · format · topic | saved as |
|---|---|---|---|---|

## Trends
| trend | first seen | platform | evidence | stage | fit | audio rights | risk | post-by | confidence |
|---|---|---|---|---|---|---|---|---|---|
Skipped: <trend> — <reason>

## Routed out
Support: … · Adverse-event log: … · UGC rights asks: … · Creator candidates: … · Sales signals: … · VoC quotes for customer research: …

## Reply queue
<n> drafts — see <D>-replies.md · reply <n> · take private <n> · stay silent <n>

## Gaps and next week
Queries to add / drop (precision) · surfaces not covered · proposed reads and ceiling
```

## Short form (fewer than ~20 items collected)

Same seven header lines and title, then only:

```markdown
## Act now (0–3 items, or "none")
## So what (two or three lines; line 1 is the coverage line when most platforms couldn't be read)
## For you (1–3 lines, or "nothing to act on this week")
## You vs them (one line each: ahead · behind · same — or "not enough to compare this week")
## Coverage (one line per surface)
## This week's items
| link | date | author (reach) | class | route | note |
## Trends worth a look (only if any; same columns as the full form)
## Next week
Queries to add / drop · proposed reads and ceiling
```

A quiet week says so plainly — "2 brand mentions across 6 queries on 5 platforms; nothing needs action" — never padded with empty sections. Endpoint-level spend stays in `research/credits-log/<YYYY-MM>.md`, never in the report.

## <D>-replies.md

One block per draft with the fields in `reply-drafting.md`, ordered: S1, S2, then by reach. Workspace only.

## Standing run (only on a yes)

Follow `../../../atoms/spend-gate/ATOM.md` branch C. Before asking, explain the options and the cost honestly:
- **Free sources only** — web search and public pages (if the scheduled worker has them), own and rival posts, managed-account metrics, the research runs' discovered posts. No data spend; counts are samples (the header says so), and without web tools mentions by others are not searched.
- **Free sources plus paid reads** — up to a standing per-run ceiling the human names in the yes ("up to N credits a run"), only on kinds of read with a logged price; the run stops at it. GooseWorks does not enforce this ceiling on scheduled jobs today, so it lives in the prompt — say so.
- Either way, the scheduled run's own cost is not priced in advance; after its first run, show the credits from `gooseworks:automation_list`.
- The run writes a report; it is not an alert. Nobody sees an S1 until someone opens it.

On a yes (needs a coworker; without one, say so and keep running on ask):
1. Save the method for the coworker with `gooseworks:file_write` under `social/listening/method/`, each file headed `Method version: <skill.meta.json version>, copied <date>` (re-copied whenever the run is changed or switched on; the shared-atom copies are refreshed only then): `SKILL.md` (this playbook), `references/<name>.md` (all six references), `atoms/listening-window/ATOM.md`, and the shared atoms it loads — `shared/save-to-brain.md`, `shared/spend-gate.md`, `shared/proxy-endpoints.md`, `shared/claims-gate.md`, `shared/save-learning.md` (copies of the shared atoms in `../../../atoms/`).
2. `gooseworks:automation_upsert` — `execution_mode: "agent"`, the prompt below as `agent_prompt` (brackets filled), named "Listening — weekly", a Monday-morning cron in the human's timezone, created paused (`enabled: false`).
3. Switch it on only when the human says so in this conversation. After its first run, read `gooseworks:automation_list` and tell them what it used.

Agent prompt:

```text
Weekly social listening for brand <brand_id>. Method version <version>, copied <date>. Follow social/listening/method/SKILL.md steps 1 to 9 in full, with its references and atoms in that folder (shared atoms are under method/shared/): at step 1 read watchlist.md and do not change it; at step 3 run the free pass, then paid reads only within the spending rule below, asking for no yes; skip step 10 (no questions, no learnings offer). Do Before you start item 2 with this brand_id (no get_started, ask nothing — missing answers go under Gaps); search untracked rivals as normal queries, never offer to track them.
Spending rule: <"Free sources only: never call a tool that spends credits." | "You may spend up to <N> credits this run on paid reads, only on kinds of read with a logged price in research/credits-log/; log every charge there; stop at the ceiling. It covers every read and the crisis reserve; ask for no further yes.">
Rules that never bend: never post, reply, comment, DM, hide, delete, report or contact anyone; claims only as the claims gate allows; holding statements per crisis-triage.md, never suggesting a cause.
Files: social/listening/<D>-report.md, <D>-replies.md, <D>-items.jsonl, where <D> = this counting week's Monday; merge, never overwrite, if they already exist. Save only the report as a brand document (save-to-brain, keep-history).
Put any S1 or S2 in the Risk flags line and Act now, with the escalation contact from the watchlist and, for S1, the hold list. End with a chat summary whose first lines are any S1/S2 items.
```
