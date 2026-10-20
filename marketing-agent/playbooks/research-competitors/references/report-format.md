# Report format

Load at steps 5–6, with `../../../atoms/write-report/ATOM.md` (read it fully — its shape, length budget (body ≤ 3,000 words) and §3 check govern). A busy founder reads the top section and knows what changed and what to do. Examples are for a fictional B2B scheduling tool — never copy them.

## The report

Brand copy `research/competitors/<YYYY-MM-DD>-report.md` (title `Competitor research — <Brand> — <YYYY-MM-DD>`, tags `research-competitors`, `competitor-report`, keep-history); local copy `gooseworks-reports/<brand-slug>/<YYYY-MM-DD>-competitor-research.md`. A repeat run opens "In short" with what changed since the last report.

```markdown
# <Brand> — competitor research, <D Month YYYY>

## In short
- **Do this first:** <one move, who does it, and why — never something this report calls table stakes, never unverified>.
- <the biggest thing a rival did — and so what>
- <where we're ahead or behind — and so what>
- <a timely opening or a threat, with its end date>
(≤ 150 words. A repeat run opens with what changed since the last report.)

## Decisions for you
| Decision | My recommendation | Matters by |
|---|---|---|

## The frame we compared in
One line: the category we compete in, the other frames we could claim, and why we picked this one (it decides which rivals matter).

## Timely openings (only when there are any)
### <What happened>, <date> — the window closes <date, and why that date>
What happened (linked), who it affects, the move, the claims that need your OK — and for a counter-position, why it's worth answering (we're the challenger, we do it better, we have dated proof, our answer reaches enough of their buyers).

## Who we compared, and why
The 3–6 rivals buyers compare us with now and how we know; the alternatives buyers use instead (doing it themselves, an agency, the platforms' own tools).

## The rivals, one by one
### <Rival>
<One sentence: what they are and what matters most about them now.>
- **What's new:** last 90 days (dated, linked).
- **What they're running:** ads per platform (or "couldn't open (reason)" / "none found, <date>" only where the library loaded); founder and team posts.
- **How they sell:** headline word for word, price and what you pay per (vendor page or third-hand), trial or demo.
- **What buyers say:** a praise and a complaint, quoted and linked.
- **Customers:** named ones (confirmed / likely), and logos that left their site this year — likely lost, a switch target.
- **Where we win, where we lose.**
**For you:** <only if it matters>

## How they compare
- **Pricing:** list price and unit; **what a buyer like ours actually pays a month** (one stated scenario, e.g. "a 10-person team making 40 ads a month"); the cheapest tier that has the features buyers care about; hidden costs; changed recently. Us in the same table.
- **Messaging:** headline word for word, who it's for, lead claims.
- **Channel scorecard, judged against each one's stage** (a seed-stage rival with no analyst coverage isn't weak): self-serve and free trial · search and content · reviews · founder voice · paid ads · events · partners and marketplaces · community · video — each "strong", "fine for their stage", "weak" or "couldn't check", with the evidence. The biggest gap nobody fills is a candidate move.
- **Topics:** a short table — topics each rival publishes on that we don't, and topics buyers ask about that nobody covers.

## You vs them
| | What | For you |
|---|---|---|
| Where we're ahead — say it louder | | |
| Where we're behind | | |
| Where everyone sounds the same | <at least 2 phrases shared by 2+ rivals> | <what to say instead> |

## Formats and angles worth testing
The top 5 formats (linked; why we think they work; how we'd make our own) and the top 5 angles (the reason to buy, who it's for, where it came from, proof status). The rest live in the angle bank for the ad makers.

## Where this disagrees with your other reports (only if it does)

## What this means for positioning
Three lines: who we're for, what we're up against, why we win — as this research sees it.

## What to do
1. <Move> — who does it · what it needs · how we'll know it worked (a number or something you can see, on a realistic timeline) · by when.
(≤ 6, ranked.)

## What we're not doing, and why
- <e.g. "Not answering Higgsfield's launch: they're 100× our reach and we can't prove we do video better.">

## What we're watching
What the next run checks, and what makes us tell you sooner.

## Baselines for next time
| Measure | Us | Each main rival | Source, date |
|---|---|---|---|
| Rank for "<rival> alternative" searches | | | |
| AI answers that name us (of the questions asked) | | | |
| Review count and rating | | | |
| Active ads per library (where read) | | | |

## What we couldn't check
- <source — why — what it would change>

## Sources
- <title> — <link> — <date>
Source skew: <e.g. "Buyer quotes are mostly Trustpilot, which over-represents complaints.">
```

**"For you" only where a finding matters,** as a plain sentence, never shorthand ("nothing to do here" is fine): does it fit us and why (from our facts); what to make or do; the claim it rests on — approved, "needs your OK", or "you'd need proof of X first"; and who does it in plain words (static ads, video ads, organic posts, creators, landing page, email, the founder, the campaign plan). When every rival does the same thing, that is a reason to weigh something else; what buyers say outweighs what rivals do. Facts-only asks leave it out. With an empty brand brain: "I can't tell what fits you yet — I can learn your brand first."

**Never in the report** (write-report §1): angle or quote ids, file paths, tool or playbook names, "Fact / Inferred" tags (say "confirmed", "likely", "a guess, because…"), symbols instead of words, "jobs served" lines, links to local working files, process narration. When a dimension couldn't be read for every rival, say it once in plain words in "In short" and under "What we couldn't check" — never a column of question marks.

## Before you deliver — the check

Count, don't estimate, and fix every miss:
- **"In short":** at most 5 bullets and **150 words** (count them); the first is "Do this first:" with one action, who does it and why; nothing in it that the body calls unconfirmed, second-hand or needing sign-off.
- **Every fact has its link and date inline**, next to the fact — not only in the sources list; the named source matches the link's site; a computed number shows its inputs.
- **Body under 3,000 words** (count it, excluding sources); cut detail no decision needs.
- **"What to do":** at most 6 moves, each naming **who does it** (a role: the founder, whoever runs the website, the ad maker), what it needs, a success check you can count or see, and a realistic date.
- None of: ids or codes, file paths, tool, skill or playbook names, "worker", "maker", "free pass", process narration.

## The closing message (in chat, after the link)

```text
Do this first: <one line>.
Report: [<title>](<local path>) · saved to your brand: [open](<link>)
Decide: 1. <one line, with my recommendation> 2. … (at most five, one line each)
<Repeat: one line with the reason and cadence — only if it would help>
```
Nothing else — no re-telling the findings.

## A rival record — `research/competitors/<rival-slug>.md` (supersede)

Line 1: `COMPETITOR RESEARCH — rivals' claims and prices, not ours. Superseded by newer dated versions.` Line 2: `Do this first, because… <the one move this rival's file implies>`. Then the rival's profile as returned by `../atoms/rival-pass/ATOM.md`, ending with its **Snapshot** block (ad ids and start dates — or the library links checked and "not read" — pricing text, headline text, open roles by team, review themes, last-checked date). Title `Competitor file: <Rival> — <Brand> — <date>`, tags `research-competitors`, `competitor-file`, `rival:<slug>`. The weekly watch diffs against this snapshot; keep the previous one as `## Previous snapshot`.

## Landscape — `research/competitors/landscape.md` (supersede)

Line 1: the same marker. Line 2: "Do this first, because…". Then the latest report's "You vs them", "How they compare" and "Formats and angles worth testing" sections, so planners have one stable file. Title `Competitor landscape — <Brand> — <date>`, tags `research-competitors`, `competitor-landscape`.

## Angle bank — `research/competitors/angle-bank.md` (supersede)

Line 1: the marker. Line 2: "Do this first, because… <brief A-NN now>". One row per angle in the shape of `angles-and-gaps.md`, ids stable across runs (`A-07`); makers tag ads `angle:a-07`. The ids live here for the makers, never in the report. Title `Angle bank — <Brand> — <date>`, tags `research-competitors`, `angle-bank`.

## What-changed reports — `research/competitors/watch/<YYYY-MM-DD>.md` (keep-history)

The shape, including the fixed line 2 that analyze-performance reads (`Week of <date> · <n> changes that matter · rivals watched: <…> · not re-checked this time: <…>`), is in `watch-and-react.md` — one place, so the two never drift. Title `Competitor watch — <Brand> — <date>`, tags `research-competitors`, `competitor-watch`.
