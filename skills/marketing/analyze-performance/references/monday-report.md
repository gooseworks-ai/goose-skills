# The Monday report — fixed shape

Load at step 6. The report is written and delivered through the `write-report` skill (`../../write-report/SKILL.md`): its shape, its language rules and its §3 checks all apply. This file adds what is specific here: the sections inside "The story", their order, and the labels. Same report, same day, same shape every week: consistency is what makes movement visible. Numbers below are illustrative.

```markdown
# <Brand> — performance read, week of 6–12 Oct 2026

## In short
**What we looked at:** 6–12 Oct vs last week, the 4-week average and last year; your Shopify, Meta and Google exports (weekend sales still landing). Not measured: email, Ulta.
Since last time: the "Sales – Broad" raise (1 Oct) can't be read until 15 Oct.
1. Spend rose 30% with no new store revenue (**confirmed**: your store export and both ad accounts).
2. New-customer orders: 412 against the 450 you need; each ad dollar brought $1.90 of new-customer revenue, under the $2.50 break-even (**confirmed**).
3. Your top two Meta ads are tiring: click rate down 35% in two weeks at flat spend (**likely**: Meta's counts).
**So, do this first (because of 1 and 2):** hold Meta scaling this week — you, before Thursday's paid check.

## Decisions for you (reply in one line)
1. **Which numbers do we run on?** Blended store numbers (recommended) or the platforms' own — see Two stories. Before Thursday's paid check.
2. **Learnings:** keep 1 and 2, or strike either; 2 would retire "<old entry>" — see Learnings proposed.
3. **Run the hook test 7 more days?** Recommended yes: it ended unclear — see Tests.

## The story

### Since last time
<3–5 lines from the run-memory outcome check: each earlier recommendation, done or not, and what it did.>

### Plumbing
No breaks found: Meta claims 1.26 purchases for every store order (4-week range 1.22–1.30; [Meta export](<file>) and [store export](<file>), 6–12 Oct).   OR   <the break, its symptom, where it likely is, the check, the fix, what it blocks>

### Business truth   (truth; source: [your Shopify orders export, 6–12 Oct](<file>), received 13 Oct)
| | This wk | Last wk | 4-wk avg | Same wk LY |  ← revenue-join.md table
Overclaim: claimed purchases ÷ store orders = 1.26 (4-wk 1.22–1.30) — a floor: email isn't in the exports. Pacing: $6.1k of $12k at day 12 of 31 (51%), ahead of plan.

### Channels   (claimed; one row per rostered channel)
| Channel | Spend | Claimed conversions / revenue | Claimed ROAS or CPA | vs target | Source | How sure |
| Meta | … | … | … | … | [Meta export, 6–12 Oct](<file>) | likely |
| Google | … | … | … | … | [Google export, 6–12 Oct](<file>) | likely |
| Email/SMS | — | used — not measured (send the Klaviyo flow and campaign files) | | | | |
| Organic Instagram/TikTok | — | top post 4.1× your usual | | | [the post](<link>), 9 Oct | first look |
Not used: apps, local · Future rows: creator codes, outreach, WhatsApp

### Two stories   (only when they disagree)
The platform story … · The blended story … · My recommendation … · What would settle it … · Your call (Decisions for you, 1).

### Why it moved
1. <cause> (<how sure>): <evidence> ([source](<link>), <date>).  …  Ruled out: …  Unconfirmed: …

### Creative ranking   (claimed)
| Angle | Hook | Format | Ads | Spend | Purchases | CPA | Click rate (trend) | Weeks won (of last 4) | Verdict (how sure) |
Coverage: … · Source: [Meta export, 6–12 Oct](<file>) and the ads GooseWorks made ([Ads Manager](<link>), synced 13 Oct)

### Email & SMS · Organic · Google · Apps · Local
One short block each, or "not measured" / "not used".

### Tests
| Test | What it needed to win | Result | Call | How sure | What happens now |
| Hidden pore-cloggers vs award hooks | CPA ≥ 20% lower, ≥ 40 purchases each | −12%; 31 vs 28 purchases | Unclear | first look | run 7 more days (Decisions for you, 3) |

### What to make next
| What | Why | Who makes it | By |
| 4 new hooks on "hidden pore-cloggers" (2 video, 2 static) | won 3 of the last 4 weeks ([last 4 reads](<link>)); click rate 1.6% → 1.1% since 29 Sep | video and static ads | 20 Oct |
| Turn [the post "<…>"](<link>) into a paid test | 4.1× your usual engagement (9 Oct) | static ads | 17 Oct |

### Learnings proposed   (kept only after you've seen them; strike any)
1. Open cold Meta hooks for Unplug strips (US) with hidden pore-cloggers, not awards · likely · review 13 Jan 2027 (evidence: Tests above)

Replan triggers fired: none | <each in plain words — "stock on the serum runs out before the sale ends: this is worth replanning">

## What to do   (recommendations — the paid run acts on them only after your yes)
1. **Hold the Meta budget** (whole account) — the paid run, Thursday. Why: the last extra dollars brought almost no new revenue. How sure: likely. Would change if: a step down loses under 15% of new revenue.
2. **Turn off the 3 award statics** — the paid run. Why: 2.4× the cost you can afford after $2.1k spent ([Meta export](<file>), 6–12 Oct). How sure: confirmed.
3. **Exclude 6 wasted Google search terms** — the paid run. Why: $347 on terms with no sales ([Google search terms export](<file>), 6–12 Oct). How sure: confirmed.
4. **Make 4 new hooks on "hidden pore-cloggers"** — the ad makers, by 20 Oct (see What to make next).

## What we're not doing, and why
- Scaling the Meta winner: real sales are below break-even (finding 2).
- Cutting "Founder story": 6 sales is too few to judge; re-check 20 Oct.

## What we couldn't check
- Email and SMS: no Klaviyo files (send the flow and campaign exports).
- Ulta sell-through: send the weekly portal report.
- Meta frequency: not in the export.

## Sources
- [Shopify orders export, 6–12 Oct](<file>) (received 13 Oct) · [Meta Ads export, 6–12 Oct](<file>) · [Google Ads export, 6–12 Oct](<file>) · [the ads GooseWorks made](<link>) (synced 13 Oct) · [the campaign plan](<link>) (v2, approved 2 Oct) · [last week's read](<link>) (6 Oct).
- Source skew: everything but the store export is the platforms' own counting, which overcounts; email is missing, so the overclaim figure is a floor.
```

On the reply: re-save the report with a `## Decisions` section (their words), record the story pick in `definitions.md`, write the kept learnings with their words as `user_statement`.

## Rules for the report

- **The shape is write-report's** (In short, Decisions for you, The story, What to do, What we're not doing, What we couldn't check, Sources with source skew), and its §3 checks block delivery. In short stays within its 150 words: What we looked at carries the referee, coverage, data maturity and the main gap (claims-only mode says so here first); then the since-last-time line, 2–3 numbered findings, and "So, do this first".
- **Keep these headings as written:** other playbooks and this one's steps look them up by name — Business truth, Two stories, What to make next, Learnings proposed, the "Replan triggers fired" line, Decisions for you (the decisions block), and the `## Decisions` section added on the reply.
- **Order inside The story:** Since last time → Plumbing → Business truth → Channels → the rest. The channel table has one row per **rostered** channel (a rostered channel without numbers is "used — not measured (send X)"); "Not used" and "Future rows" are one line each.
- **Two kinds of label, both required.** Each section or column says where its numbers come from: **truth** (the referee), **claimed** (a platform) or **derived**. Each finding and call says how sure in write-report's words — **confirmed**, **likely**, **first look** (`tests-and-learnings.md` § How sure) — never high / medium / low or a score.
- **Calls go in What to do**, at most six, numbered for this report only, each with who acts, why, how sure and "would change if". More than six → merge related calls (all Google exclusions are one move) and keep the six that matter most.
- **No internal ids.** Findings, calls and decisions are numbered for this report only; tests and angles go by their plain names. The angle-bank id and the brief's test number stay in the run record and in a learning's stored opening (SKILL.md Output), never in the report. No paths, tool or playbook names.
- Platform revenue is never quoted as truth; the two stories are never averaged.
- "What to make next" is in angle-and-hook terms with a maker and a date, and rests on the history (`run-memory.md`); "what worked" means it held 2+ runs or won a test.
- **Every material fact links its dated source** by write-report §1 (an export links to the marketer's file): inline, in its table's Source column, or on the section's source line; Sources lists them all. In short names its sources in words, as write-report's example does.
- If a replan trigger from the campaign brief fired (CAC breach, stock-out, tracking break…), say so in plain words ("this is worth replanning") on the Replan triggers fired line, and in In short when it changes the first move.
