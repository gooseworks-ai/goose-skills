# Report format

Load at steps 5–6, with `../../../atoms/write-report/ATOM.md` (read it fully — its §1 shape and §3 check govern). The report is for a busy founder: the top section alone tells them what we found and what to do. Examples below are for a fictional B2B scheduling tool — never copy them.

## The market report

Brand copy `research/market/<YYYY-MM-DD>-read.md` (title `Market research — <Brand> — <YYYY-MM-DD>`, tags `research-market`, `market-research`, keep-history); local copy `gooseworks-reports/<brand-slug>/<YYYY-MM-DD>-market-research.md`.

```markdown
# <Brand> — market research, <D Month YYYY>

## In short
- **Do this first:** <the one move, and why, in one sentence>.
- <the biggest finding about the market — and so what>
- <the biggest finding about the buyers — and so what>
- <what people are saying right now — and so what>
- <one more if it matters: a timely opening, a risk>

## The market at a glance
<One sentence with the point.> What buyers call it, how big it is and how fast it's growing (with whose estimate and when), and our verdict — growing, flat or shrinking — with how sure we are.

## What's changing
<One sentence with the point.> 3–6 changes, newest first, each: what happened (linked, dated) and what it means for us.
**For you:** <one plain sentence: what to do about it, or "nothing yet — watch it">

## Who buys, and why
<One sentence naming the buyer to lead with and the job they hire the product for.> Then each buyer group in a short paragraph: who they are (in their own words), what pushes them to look, what nearly stops them, what they compare us with, the words they use and never use, two or three short quotes with links. A small table ranks the groups (how much evidence, how sharp the pain, signs they'd pay, how easy to reach, how well we fit).
**For you:** <e.g. "Lead with the 'four-minute week' — their words — for ops leads at 20–200-person agencies. Make a static ad and a landing-page headline from it; the time-saved line needs your OK first. Who: static ads, landing page.">

## How and where they buy
<One sentence.> Where they first hear of products, how they compare, who signs off, how long it takes, where they buy. **For you:** …

## What they pay
<One sentence with the norm.> A short table of 8–15 products: price, what you pay per, free tier or trial. Where we sit. **For you:** …

## Where their attention is
<One sentence.> The communities, newsletters, creators, events, ad platforms and AI answers that matter, each with why. **For you:** …

## When they buy
<One sentence.> Seasons and triggers, each said as measured, a proxy, a known pattern, or unknown. **For you:** …

## What people are saying
<One sentence with the point, and the window: "In the last 30 days…".> How much people talked about us and the category (a sample — say where we could and couldn't look), how they feel (positive n vs negative n), the themes in their words with quotes, **trends worth posting on, each with a post-by date**, and any risks with what we know. **For you:** <e.g. "Three people asked whether it works with Outlook — post a 30-second demo this week. Who: organic posts.">

## The competition in brief
<One sentence.> At most 8 names, one line each, and which looks strongest now. "For a full look at rivals, run a competitor research."

## You vs them
| | What buyers say | For you |
|---|---|---|
| Where we're ahead — say it louder | | |
| Where we're behind | | |
| Where everyone sounds the same | | <what to say instead, in buyers' words> |

## What to do
1. <Move> — who does it · what it needs · how we'll know it worked.
2. …

## What we couldn't check
- <source or question — why — what it would change>

## Sources
- <title> — <link> — <date>
```

**"For you" is a plain sentence,** never shorthand: does it fit us and why (from our facts), what to make or do, the claim it rests on (approved, "needs your OK", or "you'd need proof of X first"), and who does it in plain words (static ads, video ads, organic posts, creators, landing page, email, the founder, the campaign plan). Facts-only asks leave it out. With an empty brand brain: "I can't tell what fits you yet — I can learn your brand first."

**Cold start** (`recognition-and-interviews.md` § The evidence floor): the first bullet is "Do this first: talk to 5–8 recent buyers, starting with <the likely buyer>, because only <n> of the <N> things I read came first-hand from your own buyers"; buyer groups are marked "likely, not yet confirmed"; the interview kit goes in before "What we couldn't check".

**A narrow ask** (one area only) keeps the same shape with only that area's sections, and says in "In short" which areas weren't covered this time.

**A repeat run** opens "In short" with what changed since the last report.

**Never in the report** (write-report §1): ids or codes, file paths, tool or playbook names, "free pass", "corpus", "cold start" as a label, sum-style arithmetic ("24+11+7, overlapping") — a plain "18 of about 270" is fine — process narration, or a preamble line above "In short". Brand facts that contradict each other (two prices) go in one line under "What we couldn't check" and are never used in "For you".

## Brand files (data for the other playbooks — readable, plain)

**`voc-bank.md`** (title `Voice-of-customer bank — <Brand> — <D>`, tags `research-market`, `voc-bank`, supersede): opens "Do this first, because… <which quotes to brief from>"; one line on what was read; then the themes in buyers' words, each with its quotes — quote, who said it (self-description), where, date, link. Quotes that make a claim or name a personal condition are marked "buyer words only — don't use as a claim". Filterable copy: `voc-bank.jsonl`, one row per quote with `id`, `verbatim`, `about`, `capture`, `platform`, `url`, `posted`, `retrieved`, `stars`, `self_descriptor`, `type`, `theme`, `segment`, `vividness`, `contains_claim`, `personal_attribute`, `status` (ids stable; a dead link becomes `retired`).

**`personas.md`** (title `Buyer segments — <Brand> — <D>`, tags `research-market`, `buyer-segments`, supersede): opens "Do this first, because… lead with <buyer> and their job <job>"; the ranking table; then each buyer group by name with who they are, their job, triggers, worries and what answers them, words they use and don't, alternatives, where they hang out, what to lead with — each with example quotes. B2B: role × company size and who signs off.

**`demand.md`** (title `Demand read — <Brand> — <D>`, tags `research-market`, `demand-read`, supersede): opens "Do this first, because…"; direction, seasonality, how buyers search (their phrasings), each line labelled measured · proxy · known pattern · unknown.

**`watchlist.md`**: shape in `listening-craft.md`.
