# Report format

Load at steps 5–6 with the `write-report` skill (`../../write-report/SKILL.md`) — read it fully; its shape, length budget and §3 check govern. Examples are for a fictional B2B scheduling tool — never copy them.

## The market report

Brand copy `research/market/<YYYY-MM-DD>-read.md` (title `Market research — <Brand> — <YYYY-MM-DD>`, tags `research-market`, `market-research`, keep-history); local copy `gooseworks-reports/<brand-slug>/<YYYY-MM-DD>-market-research.md`. A monthly pulse is the same shape cut to one page: In short, Decisions, What changed, What people are saying, Baselines, Sources.

```markdown
# <Brand> — market research, <D Month YYYY>

## In short
**What we looked at:** <the market, the sources (news, prices, reviews, communities, search demand), the date, and the main limit — e.g. "most buyer voice is about rivals, not us", "search data from one country">.
1. **<Which market we're in, and how big the reachable part is>** — <so what> (<confirmed / likely / first look>).
2. **<The change that matters most>** — <so what> (<how sure>).
3. <Optional: what people are saying — so what (how sure).>
**So, do this first (because of <1 and 2>):** <one move, who, by when — resting on the findings above; if they are only a first look, or it needs an asset we haven't confirmed, the move is the one that confirms it>.
(≤ 150 words. A "growing" or "your lead buyer" here must be as sure in the body. A repeat run adds one line on what changed; a sibling report with a different first move or lead buyer gets one line, settled.)

## Decisions for you
| Decision | My recommendation | Matters by |
|---|---|---|
| Which market to compete in | <one, and why> | <date or "before the next campaign"> |
"Matters by" is never under a week from today unless something outside forces it (a rival's launch, a season, a price change) — then name it ("by 24 Oct — their offer ends then"). Each decision also points to the section it rests on.

## Which market we're in
<One sentence with the decision.> The 2–3 categories we could be filed under, what buyers call each (with evidence), who else sits in each, and the one we recommend — with what changes if you pick another.

## How big it is
<One sentence.> Top-down: two or three analyst figures (publisher, year, what they count). Bottom-up, the part we can reach: one line per buyer group — likely buyers × what they'd pay a year = total — each input linked or marked "an assumption, because…". Buyer groups come from your audience research's buyer groups; where there's none, they're marked "provisional — run audience research to confirm". Verdict: growing, flat or shrinking, and how sure.

## What's changing
3–6 changes from the last 12 months, newest first: what happened (linked, dated, checked on the primary page or marked "not confirmed") and what it means for us.

## How and where they buy
Where buyers first hear of products, how they compare, who signs off, how long it takes, where they buy — each line marked "evidence" or "our inference".

## What they pay
<The norm in one sentence.> A table of at least 8 products (up to 15): price, what you pay per, free tier or trial, read on the vendor's page or third-hand. Where we sit — or the conflict in our own prices.

## Where their attention is
The communities, newsletters, creators, events, ad platforms and AI answers that matter, with numbers where they exist and why each matters.

## When they buy
Seasons and triggers, each line marked measured, a proxy, a known pattern, or unknown.

## What people are saying
<One sentence with the point and the window ("In the last 30 days…").> How much people talked about us and the category (a sample; where we could and couldn't look; what our name gets confused with, or "nothing found"), how they feel, the themes with 3–5 buyers quoted word for word and linked, trends worth posting on with a post-by date, and a risk line ("no serious risk found" or what was sent to you).

## The competition in brief
At most 8 names, one line each, the strongest now, and the alternatives buyers use instead (a spreadsheet, an agency, the platforms' own free tools). "For a full look at rivals, run a competitor research."

## You vs them
| | What buyers say | For you |
|---|---|---|
| Where we're ahead — say it louder | | |
| Where we're behind | | |
| Where everyone sounds the same | | |

## Where this disagrees with your other reports (only if it does)
- <The audience report leads with X; this report sees Y, because…>

## What this means for positioning
Three lines: who we're for, what we're up against, why we win — as this research sees it, with the decision it implies. Writing the positioning itself is a separate job.

## What to do
1. <Move> — who does it · what it needs · how we'll know it worked (a number or something you can see) · by when.
(≤ 6, ranked.)

## What we're not doing, and why
- <The tempting move we decided against — one line why.>

## Baselines for next time
| Measure | Now | Source, date |
|---|---|---|
| Mentions of us in the window (sample) | | |
| AI answers that name us (of the questions asked) | | |
| Our review count and rating, per site | | |
| Our rank for "<main rival> alternative" | | |
| Our main social account's typical engagement | | |

## What we couldn't check
- <source — why — what it would change>

## Sources
- <title> — <link> — <date>
Source skew: <e.g. "Most buyer quotes come from Trustpilot, which over-represents complaints, so the anger at billing is likely overstated.">
```

**"For you" only where a finding matters,** as a plain sentence: does it fit us and why (from our facts), what to make or do, the claim it rests on (approved, "needs your OK", or "you'd need proof of X first"), and who does it in plain words. "Nothing to do here" is a fine answer; never invent a move to fill the line. Facts-only asks leave it out; with an empty brand brain: "I can't tell what fits you yet — tell me what you sell, to whom, and why people pick you, and I'll mark what fits."

**When most of the buyer voice is about rivals,** say "this is the category's voice, not yet your buyers'".

**Never in the report** (write-report §3): ids or codes, file paths, tool or playbook names, "free pass", "corpus", "worker", "maker", sum-style arithmetic, process narration, a preamble line above "In short", an unverified claim in "In short".

## Before you deliver — the check

Run write-report §3 (the `write-report` skill, `../../write-report/SKILL.md`): a miss blocks delivery. This playbook adds:
- **Every fact has its link and date inline**, next to the fact — not only in the sources list; the named source matches the link's site; a computed number shows its inputs.
- **"What to do":** each move names **who does it** as a role (the founder, whoever runs the website, the ad maker), a success check you can count or see, and a realistic date.
- Also banned: "worker", "maker", "free pass".

## The closing message (in chat, after the link)

```text
Do this first (because <the findings it rests on, in a few words>): <the move, who, by when>.
Report: [<title>](<local path>) · saved to your brand: [open](<link>)
Decide: 1. <one line, with my recommendation> 2. … (at most five, one line each)
<Repeat: one line with the reason and cadence — only if it would help>
```
Nothing else — no re-telling the findings.

## The brand-watch note — `research/market/watch/<YYYY-MM-DD>.md`

Only when something crossed a threshold; otherwise the file holds just the counts checked and the window. Title `Brand watch — <Brand> — <YYYY-MM-DD>`, tags `research-market`, `brand-watch`.

```markdown
# <Brand> — brand watch, <D Month YYYY>
Window: <since the last watch> · Checked: <platforms> · Mentions (sample): <n> (last watch: <n>)

## In short
1. <What crossed the threshold — how sure (confirmed / likely / first look)>.
**So, do this first (because of 1):** <the action, who, by when>.

## What happened
<quoted, linked, dated; reach; how many separate people; what we know and don't; who handles it>
Hold list (serious risks only): <ads, scheduled posts, emails that touch the product — for you to pause>

## What we couldn't check
## Sources
```

## Brand files

**`demand.md`** (title `Demand read — <Brand> — <D>`, tags `research-market`, `demand-read`, supersede): opens "Do this first, because…"; direction, seasonality, how buyers search (their phrasings), each line labelled measured · proxy · known pattern · unknown.

**`watchlist.md`**: shape in `listening-craft.md`.
