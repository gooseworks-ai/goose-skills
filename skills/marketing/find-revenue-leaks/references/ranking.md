# Ranking the findings

Load at step 4. Every finding gets three things: **money at stake** (where the data supports it), **how sure**, and **effort**. Then one order: leaks first, then plays.

## 1. Money at stake (per month, an estimate)

Only from the brand's own data in this run. **Show the math, the window and the source in one line**, and label the result **estimate**. Never use a playbook's `example`, an industry benchmark or a guess as the brand's number.

Pick the kind that fits the finding:

| Kind | What it counts | Math (per month) | Example line (illustrative numbers) |
|---|---|---|---|
| **Wasted spend** | Ad money going where it can't sell: sold-out products, countries you don't ship to, search terms or ad sets with no sales, bids on the wrong event | spend on the broken part in the window × 30 ÷ window days | "$1,050 in 14 days on 4 ad sets with no sales → about $2,250 a month (estimate, Meta export 1–14 Oct, claimed)" |
| **Lost sales** | Sales that stopped: a flow that stopped sending, a broken popup or code, a checkout or speed problem, unshipped orders | (the earlier steady rate − the rate now) × value per unit × 30 | "the cart email made $210 a week for 8 weeks, $0 since 3 Oct → about $900 a month (estimate, email tool's own revenue count, claimed)" |
| **Margin given away** | Discounts stacking, leaked creator codes, low-margin products eating budget, refunds after ad spend | the extra discount or cost in the window × 30 ÷ window days | "stacked codes took $640 off 38 sale orders in 30 days → about $640 a month (estimate, store orders)" |
| **Spend exposed** | Tracking breaks (pixel missing or double counting, wrong attribution): no money lost directly, but decisions on this spend rest on wrong numbers | the monthly spend the broken signal steers | "Meta optimises $9,000 a month on a purchase count that is 2× the store's (spend exposed, not a loss)" |
| **Upside** (plays) | A gain the brand's data points to: a free-shipping threshold, a bundle, a restock or reorder, an untapped region | only when the data gives both the base and a tested or measured rate; otherwise "not sized" | "orders between $40 and $50: 120 a month; a $50 threshold moving a third of them up by $8 → about $320 a month (estimate, store orders, untested)" |

Rules:
- **Labels on every number:** `truth` (the store's own orders and money), `claimed` (an ad platform's or email tool's own count), or `derived` (your math on those). Never add a claimed number to a truth number as if they were alike; prefer the store's number when both exist.
- **Window and freshness:** say the dates. A window under 7 days, or a one-off event (a single outage day), is sized for what it cost, not multiplied into a month.
- **Not sized** is a fine answer: "not sized: no store data for the period". Never invent the missing part.
- **Don't double count:** one cause, one number (`running-checks.md` §4). A finding inside a bigger one (one ad set inside "ad sets with no sales") is counted in the bigger one only.
- **Money is the marketer's own money,** in the store's currency. Credits (what GooseWorks charges) are never mixed into these sums.

## 2. How sure

The report's three words (the `write-report` skill's rule):
- **confirmed** — two independent sources agree, or the store's own data shows it directly (the store says sold out; the ad spent on it).
- **likely** — one good source, or a clear pattern with the innocent explanation not fully ruled out.
- **first look** — one sample, one browser, one day, or an export with gaps; needs a re-check.

A money estimate is never more sure than the finding under it.

## 3. Effort

One of three, with who does it:
- **Minutes** — a setting, a pause, a card update, a code retired (the marketer, in their tool).
- **An afternoon** — rebuild a flow, fix a feed, rewrite a few ads, move budget (the marketer or their email or ads person).
- **A project** — page speed, checkout changes, a new flow set, a feed relabel (a developer or several people).

## 4. The order

1. **Tracking breaks first** when they make other numbers unreliable (pixel misses purchases, purchases counted twice, sales bid on the wrong event). They lead even with no money estimate, because they change how to read the rest.
2. **Other leaks,** by money at stake, largest first. Ties: confirmed before likely before first look, then less effort first.
3. **Leaks not sized,** by how sure, then effort.
4. **Plays,** by upside where sized, then how sure, then effort. A play the data doesn't support is not listed (`running-checks.md` §4).

Then, after the ranked list: **Clean checks** (checked, nothing found, one line each with the window) and **Skipped checks** (grouped by the tool that would add them).

## 5. One finding, written

> **1. Ads still running on 3 sold-out products** — wasted spend, about **$1,900 a month** (estimate: $890 in 14 days on 6 ads, Meta export 23 Oct–5 Nov, claimed; stock from the store today, truth). How sure: **confirmed**. Effort: **minutes**, you.
> Ruled out: none of the three takes pre-orders.
> Recommended: pause those 6 ads now and switch them back on at restock. Worked if: the same check next week shows no ad on a sold-out product.
> Method: [the playbook](https://gooseworks.ai/playbooks/ads-running-on-sold-out-products)

(Numbers above are an example, not a result.)
