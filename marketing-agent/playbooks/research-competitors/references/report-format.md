# Report format

Load at steps 5–6, with `../../../atoms/write-report/ATOM.md` (read it fully — its §1 shape and §3 check govern). A busy founder reads the top section and knows what changed and what to do. Examples are for a fictional B2B scheduling tool — never copy them.

## The report

Brand copy `research/competitors/<YYYY-MM-DD>-report.md` (title `Competitor research — <Brand> — <YYYY-MM-DD>`, tags `research-competitors`, `competitor-report`, keep-history); local copy `gooseworks-reports/<brand-slug>/<YYYY-MM-DD>-competitor-research.md`. A repeat run opens "In short" with what changed since the last report.

```markdown
# <Brand> — competitor research, <D Month YYYY>

## In short
- **Do this first:** <the one move, and why, in one sentence>.
- <the biggest thing a rival did — and so what for us>
- <where we're ahead or behind — and so what>
- <a timely opening or a threat, with its end date>

## Timely openings (only when there are any)
### <What happened>, <date> — the window closes <date>
<One sentence with the point.> What happened (linked), who it affects, the move (audience, offer, channels, what to make, end date), and the claims that need your OK.
**For you:** <a plain sentence>

## Who we compared, and why
<One sentence.> The 3–6 rivals buyers compare us with now and how we know (searches, reviews, AI answers), plus the alternatives buyers use instead (a spreadsheet, an agency, an in-house hire).

## The rivals, one by one
### <Rival>
<One sentence: what they are and the one thing that matters most about them right now.>
- **What's new:** launches, funding, hires, price changes (dated, linked).
- **What they're running:** their ads on each platform (or "no ads found on Meta, LinkedIn, Google, TikTok, <date>"), the long-running ones and what they say; what their founders and team post.
- **How they sell:** headline in their words, price and what you pay per, free trial or demo.
- **What buyers say:** two or three short quotes (linked) — praise and complaints.
- **Where we win, where we lose.**
**For you:** <a plain sentence: fits or not and why; what to make, the claim it rests on, who makes it>

## How they compare
A pricing table (price, what you pay per, free tier or trial, changed recently), a messaging table (their headline, who it's for, the claims they lead with), and where each one shows up (ads by platform, social, founder posts, events — "lots", "some", "none found", "couldn't check").

## You vs them
| | What | For you |
|---|---|---|
| Where we're ahead — say it louder | | |
| Where we're behind | | |
| Where everyone sounds the same | | <what to say instead, in buyers' words> |

## Formats worth borrowing
8–15 ads, demos and posts that are working in the category (fewer if ads couldn't be read — say so): what it is (linked), why we think it's working (how long it has run, how many versions, engagement against the account's usual), how it's built (hook, beats, length), and **for you** — how we'd make our own version: our hook, the feature that fills the reveal, the proof line, length, channel. Their structure, never their words.

## Angles worth testing
10–20 angles in plain words: the reason to buy, who it's for, where it came from (a complaint, a gap, a launch we beat), and whether we can say it now, need proof first, or need your OK.

## What to do
1. <Move> — who does it · what it needs · how we'll know it worked.

## What we're watching
What a repeat run will check, and what would make us tell you sooner (a shutdown, a price change, a big launch, a rival bidding on our name).

## What we couldn't check
- <source — why — what it would change>

## Sources
- <title> — <link> — <date>
```

**"For you" is a plain sentence,** never shorthand: does it fit us and why (from our facts); what to make or do; the claim it rests on — approved, "needs your OK", or "you'd need proof of X first"; and who does it in plain words (static ads, video ads, organic posts, creators, landing page, email, the founder, the campaign plan). When every rival does the same thing, that is a reason to weigh something else; what buyers say outweighs what rivals do. Facts-only asks leave it out. With an empty brand brain: "I can't tell what fits you yet — I can learn your brand first."

**Never in the report** (write-report §1): angle or quote ids, file paths, tool or playbook names, "Fact / Inferred" tags (say "confirmed", "likely", "a guess, because…"), symbols instead of words, "jobs served" lines, links to local working files, process narration. When a dimension couldn't be read for every rival, say it once in plain words in "In short" and under "What we couldn't check" — never a column of question marks.

## A rival record — `research/competitors/<rival-slug>.md` (supersede)

Line 1: `COMPETITOR RESEARCH — rivals' claims and prices, not ours. Superseded by newer dated versions.` Line 2: `Do this first, because… <the one move this rival's file implies>`. Then the rival's profile as returned by `../atoms/rival-pass/ATOM.md`, ending with its **Snapshot** block (ad ids and start dates — or the library links checked and "not read" — pricing text, headline text, open roles by team, review themes, last-checked date). Title `Competitor file: <Rival> — <Brand> — <date>`, tags `research-competitors`, `competitor-file`, `rival:<slug>`. The weekly watch diffs against this snapshot; keep the previous one as `## Previous snapshot`.

## Landscape — `research/competitors/landscape.md` (supersede)

Line 1: the same marker. Line 2: "Do this first, because…". Then the latest report's "You vs them", "How they compare" and "Angles worth testing" sections, so planners have one stable file. Title `Competitor landscape — <Brand> — <date>`, tags `research-competitors`, `competitor-landscape`.

## Angle bank — `research/competitors/angle-bank.md` (supersede)

Line 1: the marker. Line 2: "Do this first, because… <brief A-NN now>". One row per angle in the shape of `angles-and-gaps.md`, ids stable across runs (`A-07`); makers tag ads `angle:a-07`. The ids live here for the makers, never in the report. Title `Angle bank — <Brand> — <date>`, tags `research-competitors`, `angle-bank`.

## Watch notes — `research/competitors/watch/<YYYY-MM-DD>.md` (keep-history)

Line 1: `COMPETITOR RESEARCH — rivals' claims and prices, not ours. Weekly record; kept as history.` Line 2: `Week of <date> · <n> material changes · rivals watched: <…> · not re-read this run: <…>` (analyze-performance reads it). Line 3: "Do this first, because…". Title `Competitor watch — <Brand> — <date>`, tags `research-competitors`, `competitor-watch`. Shape in `watch-and-react.md`.
