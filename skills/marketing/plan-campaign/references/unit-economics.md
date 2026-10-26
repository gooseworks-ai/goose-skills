# Unit economics: what the plan can afford to promise

Load at step 2 (economics and the top-down check) and step 5 (forecast and scenarios). Every number here is computed from the brand's own figures or asked; the rules of thumb below are starting points a senior marketer would use, labelled as such in the brief.

## 1. The allowable cost per customer (or lead)

Write it down once; every later call keys off it (run-paid-campaigns and analyze-performance read it from the brief).

**DTC / physical goods**
```
contribution per first order = AOV
  − COGS (product cost)
  − shipping + pick/pack actually paid by the brand
  − payment fees (~3%, check)
  − expected returns/refunds share × AOV
  − average discount given on this campaign's offer
```
- **Breakeven CAC on first order** = contribution per first order. A campaign that must pay back on the first order sets allowable CAC ≤ this.
- **LTV-allowed CAC** = contribution over the payback window the marketer accepts (e.g. 90 or 180 days of repeat contribution). Only use repeat behaviour the brand can show (repeat rate, orders per customer in 180 days). If unknown, plan to first-order breakeven and say so.
- Margin per SKU matters: a bundle or hero SKU with 70% gross margin can carry a CAC a 35%-margin SKU cannot. When the campaign features several SKUs, compute per featured SKU and use the weighted mix of the offer the ads actually push.

**B2B SaaS / lead-gen**
```
allowable cost per lead = allowable CAC × (lead → customer rate)
allowable CAC          = (ARPA × gross margin %) × payback months accepted (often 12, rule of thumb)
```
- Work the funnel down from closed revenue: lead → qualified (MQL/SQL) → opportunity → closed-won, using the brand's own rates. A plan that hits a cost-per-lead target but fills the funnel with leads sales rejects has failed; target cost per **qualified** lead or per opportunity where the brand can see it.
- Sales cycle length decides when a test is readable: a 60-day cycle means a 4-week campaign is judged on leading indicators (qualified meetings), not revenue. Say so in the test plan.

**B2B SaaS, self-serve**
```
allowable cost per paying account   = ARPA × gross margin % × payback months accepted (often ≤ 12)
allowable cost per activated signup = that × (activated → paid rate)
break-even cost per paying account  = ARPA × gross margin % × expected months retained (≈ 1 ÷ monthly churn)
payback (months)                    = cost per paying account ÷ (ARPA × gross margin %)
```
- **Always show break-even and payback** in the economics box, beside the expected cost per paying account. Never call a cost "normal" against the first month's price: $200 per paying account on a $29.50 plan at ~80% margin pays back in ~8.5 months, and at 10% monthly churn (~10 months retained) breaks even at ~$236 — it works only if churn holds. Churn is the brand's own number, else a labelled assumption.

**Consumer app**
```
allowable cost per install = (payer rate by day 30 × ARPPU over the payback window × margin after store fees)
                             or the activation-rate equivalent for ad-funded apps
```
- Store fees (15–30%) come off before margin. Install is never the goal metric; it is the cost line.
- **Pre-revenue:** there is no payer rate or ARPPU, so there is no allowable CAC — do not invent one. The marketer sets a provisional cap per activated user, labelled provisional, and the brief says unit economics cannot yet justify paid. The goal chain runs install → activation (the app's "aha" event) → trial → paid / retained day 7/30.

**Local business / services**
- Allowable cost per booked call / appointment / quote = average first-job value × margin × close rate. Many local and services businesses live on repeat or referral value; include it only if the owner can state it.

### The economics box (written at the top of every brief)

| Line | Value | Source |
|---|---|---|
| AOV (or ARPA / first-job value) | $48 | store, last 90 days (marketer) |
| Contribution per first order | $22 (46%) | AOV − COGS − ship/fulfil − payment fees − returns |
| Repeat contribution in the payback window | +$6 | 90-day repeat rate 25% (marketer) |
| **Allowable CAC** (break-even within the window) | **$28** | derived |
| Target CAC (the cushion the marketer wants) | $20 | marketer |
| Break-even first-order ROAS / MER | 2.2 | 1 ÷ contribution % |

Self-serve SaaS boxes add two lines: break-even cost per paying account and payback in months. Every value carries its source: *own history*, *marketer-stated*, *base rate (rule of thumb)* or *assumption*. run-paid-campaigns and analyze-performance inherit this box; they do not re-derive it. If margin isn't on file (`intake.md`), plan to a stated assumption, mark it, and put "confirm margin" first in What we couldn't check; ask it only when the whole plan turns on it.

**Inventory and capacity cap the plan.** DTC: units the forecast would sell vs stock on hand + inbound before the end date; days of cover at forecast sell-through; never plan paid spend behind a SKU with under ~3 weeks of cover. Local / services: bookings the plan would generate vs open slots or delivery capacity — a salon with 40 open slots cannot absorb 200 leads. Apps and SaaS: support/onboarding capacity for a spike, rarely binding.

## 2. Baseline, incremental target and the goal chain

Start from the goal and subtract the **baseline** — what happens with no campaign (last comparable period's orders/leads/installs, adjusted for season). The campaign is planned to the **incremental** target. Crediting the campaign for orders that would have come anyway is the commonest inflated plan.

Then convert incremental target → orders/leads → sessions/clicks → spend, per leg, with stated conversion assumptions, and compare to the budget. Show **three scenarios** (conservative / expected / optimistic) using the low, middle and high end of each assumption. If the plan hits the goal only in the optimistic scenario, the brief says so in its first lines.

One number marketing owns → broken into funnel and channel targets → each with a date. Example (DTC launch, numbers illustrative only):

| Level | Target | How it is derived | Readable by |
|---|---|---|---|
| North Star | 600 new customers by 31 Mar | marketer's number | 31 Mar |
| Paid (Meta) | 350 new customers at ≤ $38 CAC | $13.3k budget ÷ $38 | weekly from week 2 |
| Email/SMS | 180 first orders from list of 22k | launch sequence: 3 sends × ~0.3% conversion (brand's own past rate) | launch week |
| Organic + creators | 70 attributed (codes, link-in-bio) | past launch share | 2 weeks post-launch |
| Leading indicators | CTR ≥ 1.2%, LP→ATC ≥ 8%, ATC→purchase ≥ 35% | brand's own baselines | days 3–7 |

Every row must say where its number came from. A target derived from nothing is marked **assumption** and named in the brief's "assumptions to confirm" list.

## 3. Forecast sanity (the renegotiation case)

Before planning to the goal, check the math:
- **Implied CAC** = budget ÷ incremental goal. If it is well below the brand's historical blended CAC (or the category base rate when there is no history) with no new reason it will be cheaper, the goal likely needs a miracle — weigh it, say how far off it is, and show it in the scenarios.
- **Implied conversions vs. traffic**: goal ÷ the brand's site conversion rate = sessions needed. If sessions needed exceed what the budget can buy at plausible CPCs, say so.
- **Time**: a cold paid channel rarely reaches efficient CAC in its first 2–3 weeks (learning + creative iteration). A 10-day window on a new channel is a test, not a performance plan.
- **Meta run through GooseWorks on a sign-up or sales goal:** a campaign GooseWorks creates buys landing-page views (Traffic), not sign-ups. Price that leg as cost per sign-up ≈ cost per landing-page view ÷ the site's sign-up rate (each labelled), or make "the marketer sets up a conversion campaign in their ads manager (or through their own ads connector, by run-paid-campaigns' connector rule)" a dated calendar step and price it on conversions. Meta can only optimise for a sign-up it sees: ask once, in plain words, "Can Meta see when someone signs up?" (`intake.md`).

When the math does not hold, hand the marketer a **renegotiation case** before the plan, in this shape:

> **The gap.** The goal is 400 orders by 31 Mar. Baseline ~150. Incremental 250. Expected scenario delivers ~200 (email 60 + paid 140 at $25 CPA on $3.5k media). Gap ≈ 50 orders.
> **What each lever buys.** +$1,300 media closes it at the same CPA · or +3 weeks of runway · or a goal of 350 · or a different goal metric (e.g. 400 orders including the existing subscriber base).
> **Recommendation.** <one lever and why>. The plan below is written to <the lever the marketer picks>; until then it is written to the expected scenario and labelled so.

Never quietly plan to an impossible number, and never pick the lever yourself — agreeing the goal is the marketer's call.

## 4. Base rates (rules of thumb — label them as such)

Use the brand's own history first, the category's second, these last. State which one you used.
- DTC e-commerce site conversion: ~1–3% of sessions; new-visitor paid social traffic converts at the low end.
- Meta cold prospecting CPMs vary by market and season: roughly $8–25 US, higher in Q4 (Black Friday week can run 1.5–2× normal); a landing-page view often costs ~$0.50–2 on cold US traffic.
- Email: a healthy owned list converts ~0.1–0.5% of recipients per promotional send; launch sends to engaged segments do better; a fresh opt-in **waitlist** for the launched product can convert several times higher (use the brand's own waitlist data when it exists).
- B2B SaaS (rules of thumb, very wide): visitor → trial/signup 2–5%; trial → paid 10–25% (no card) or 40–60% (card up front); self-serve CAC often a few hundred dollars; LinkedIn CPL $80–250+.
- Apps: store-page conversion (view → install) often 20–40%; D7 retention often 10–25% by category.
- B2B paid social cost per lead: LinkedIn commonly $80–250+ per lead in the US; Google search on high-intent terms often lower per lead but capped by search volume.
- App install CPIs differ 10× by geography and category; never assume one without the brand's or category's data.

These are wide on purpose. If the plan's viability depends on where in the range the brand lands, the test plan's first job is to find out.
