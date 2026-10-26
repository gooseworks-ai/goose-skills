# Budget split and test plan

Load at step 5 (budget, tests, forecast). Rules of thumb are labelled; the brand's own history beats every one of them.

## 1. Budget lines (the whole budget, not just media)

| Line | What goes in it |
|---|---|
| Media — proven | Channels/angles with the brand's own evidence of hitting allowable CAC |
| Media — promising | Channels/angles with partial evidence (a test that nearly cleared, a competitor proof) |
| Media — experiments | New channels/angles under test, capped |
| Held reserve | 10–20% of media, released on a test win (scale), to cover a miss, or — when everything is a test — committed to the best-reading test by a named date; never left idle by default |
| Production | Credit-made assets (statics, video, photos) as **counts** — priced in credits at make time by the maker playbooks, never converted to dollars here; dollars only for freelancers, shoots, samples |
| Creators | Fees, product seeded (at cost), shipping, usage rights / whitelisting |
| Offer cost | Margin given away by an offer **the marketer named** (discount × forecast orders × AOV); none if no offer — never invent one |
| Tools | Any new tool the plan needs |

Default media shape (rule of thumb): **~70% proven / ~20% promising / ~10% experiments**, plus the reserve. A brand with no proven channel has no 70% bucket: the plan is tests plus a reserve that follows the best-reading test, and says so. Avoid locking the whole budget into one unproven bet.

## 2. Per-leg minimum viable spend

For every paid leg write: % of budget · $ amount · the leg's minimum to learn (`channel-decision.md` table) · **clears minimum? yes/no**. A leg below its minimum is a judgment call, written down: run it anyway (e.g. one purchase-optimised campaign on a seasoned pixel is normal practice below the floor), merge it, re-scope the event (knowing a higher-funnel event can buy lower-quality traffic), shrink it to a directional test, or cut it.

Meta's learning floor, as a worked example: ~50 optimisation events per ad set per week → weekly ad-set budget ≈ 50 × target CPA. At a $25 CPA that is ~$1,250/week (~$5.4k/month) per ad set. A $3,000/month Meta budget cannot fully feed even one purchase-optimised ad set — a judgment call: run one on a seasoned pixel anyway, or optimise a higher event, and say which.

## 2b. Retargeting frequency check (small audiences burn fast)

Any leg aimed at a known list or site visitors (past users, lapsed customers, retargeting) states its **audience size** and **expected weekly frequency** before it gets a budget:

```
matched people ≈ list size × match rate (often 40–60% for an uploaded consumer email list, ~30–60% for business emails — rule of thumb)
weekly impressions = weekly spend ÷ CPM × 1,000
weekly frequency ≈ weekly impressions ÷ matched people
```

Example: $450 over 4 weeks against 1,000 emails → ~500 matched; at a $20 CPM that is ~5,600 impressions a week → **~11 per person per week**. Far too many: the same people see the same ad until they ignore or hide it. Cap the leg so frequency stays at about **5 a week** (up to ~8 only with several fresh creatives rotating), and move the rest of the money to where it can reach new people or to the reserve. A small list is reached more cheaply by email and a personal note than by paid reminders.

## 3. Phasing

Split each leg across **pre-launch / launch week / sustain** (or week by week for an always-on replan). Launch weeks are front-loaded on owned channels (list, existing customers) and creators; paid ramps after the first read rather than spending the peak on day one blind.

Check the arithmetic: lines sum to the total; per-leg spend ÷ expected CPA = the goal chain's per-leg target. If they disagree, the brief is wrong — fix it before showing it.

## 4. Test plan

Every test is written before it starts, in this table (analyze-performance calls each test against exactly these columns):

| # | Hypothesis | Variable (one) | Cells | Budget / cell | Readable when | Ends | Primary metric | Win / Lose / Unclear → action |
|---|---|---|---|---|---|---|---|---|
| 1 | An ingredient-transparency angle ("check your moisturiser's label") beats an award-proof angle on cold Meta | angle | 2 angles × 3 variants, one ad set per angle (ads inside one ad set are not a fair split) | $1,200 | each angle ≥ ~30 purchases, or a gap > ~50% | launch + 14 d | CPA (claimed, checked against store new-customer orders) | Win: release reserve to the winner · Lose: retire angle, brief new one · Unclear: extend 7 days once, then call |

Rules of craft:
- **One variable per test.** Angle before execution: test the reason to buy before polishing the hook, format or colour.
- **Small budgets test big swings** (angle, offer, audience, channel), never small executions. Detecting a 20% lift on a 2% conversion rate needs on the order of ~20k visitors per arm; most launch budgets cannot read anything that subtle.
- **Readable by the date.** Budget per cell must buy enough conversions before the end date. Rule of thumb: judge a creative only after ~2–3 × target CPA spent on it; under ~30 conversions per arm a result is only readable when the gap is large (~50%+). If the budget cannot buy that, test fewer cells.
- **Decision rule for every outcome**, including Unclear. A test with no kill rule never ends.
- **Primary metric is the business number** (store-joined orders, qualified leads, retained users), not the platform's. Leading indicators (CTR, cost per landing-page view, add-to-cart rate) are named as early reads, not the call.
- **Know the past.** Search the learnings log first (`knowledge_search` with `source_types: ["learning"]`); never re-buy a test the brand already paid for unless something material changed.

## 5. Paid structure line (what run-paid-campaigns stages against)

For each paid leg write one line: objective/optimisation event, number of campaigns/ad sets, audience approach (broad / interest / retargeting / lookalike), budget type and amount, creative count at launch, destination, and how it will be applied — **product levers** (Meta via GooseWorks) or **written instructions** (every other platform, and any Meta object GooseWorks did not create). Example:

> Meta — one duplicate of the marketer's purchase-optimised "Sales – Broad" ad set per angle (written instruction; $90/day each), then one GooseWorks push of 3 ads into each (after a sync) → /new-serum?utm_source=meta&utm_medium=paid_social&utm_campaign=serum-launch&utm_content=<angle>-<src id>. Applied: Goose creatives pushed into that ad set (GooseWorks levers); its daily budget change is a written instruction.
> Meta (angle test, when no conversion ad set exists) — one GooseWorks Traffic-objective campaign **per cell** when $/cell must hold (a single campaign's 2–3 ads share one budget), lifetime $300 each over 10 days, broad US, Facebook placements only, read on cost per landing-page view and store conversion of its UTM traffic — a different, cheaper test than T1; the winner graduates into a conversion ad set.
> Google Search — 1 campaign, problem and competitor terms, $40/day, maximise conversions → /serum (written instructions).

**What GooseWorks levers can build on Meta today:** pushing Goose creatives into an ad set that already exists, or a new **Traffic-objective** campaign (landing-page views or link clicks, lifetime budget, broad countries). A new purchase-, lead- or install-optimised campaign, radius targeting, or any change to an ad set GooseWorks didn't create is written instructions.

Do not design the account beyond this line; run-paid-campaigns executes and flags anything the server cannot express.
