# Segments, cadence and offers

Load at step 3 (segments, cadence), step 5 (offers) and in the monthly mode (sunset).

## Engagement segments (after Apple Mail Privacy Protection: clicks, orders and activity, not opens)

| Segment | Definition (use the company's own words for customer, repeat, lapse) |
|---|---|
| Engaged-30 | clicked or ordered in the last 30 days, or subscribed in the last 14 |
| Engaged-60 / 90 / 180 | same logic, longer windows |
| Lapsed | subscribed > 180 days, no click or order in 180 days |
| New customer | exactly 1 order |
| Repeat | 2+ orders |
| VIP | top ~10% by 12-month revenue, or ≥ [3] orders — the company's definition wins |
| At risk | no order in 1.5× the median repurchase interval |
| By category bought | per main category |
| B2B | trial / active / at-risk (usage drop) / churned; by role and plan |
| App | new (0–7 days), active, dormant 7 / 30, subscriber / free |

Opens may appear only as a secondary OR condition with machine opens excluded where the tool flags them; never alone. Security scanners click links: filter bot clicks where the tool allows.

**RFM (stores with order history):** score recency, frequency and money 1–5 by quintile, monthly. Champions → early access, no discount. Loyal → cross-sell. Promising (recent, one order) → second-purchase push. At risk (low recency, high frequency/money) → personal win-back. Hibernating → sunset candidates.

## Flow priority map and frequency cap
Highest intent wins: checkout > cart > browse; any transactional or booking message > marketing. Write which flow suppresses which and for how long, and one global cap (e.g. ≤ 1 marketing email per 16h, ≤ [3–5] per week per person across flows and broadcasts). Exclude recent purchasers (last [3–7] days) from promotional broadcasts, open support tickets from promos, and active subscribers from acquisition offers.

## Cadence (a proposal; the marketer approves)
- Default starting point for a store: engaged-30 2–3 sends a week; engaged-90 1 a week; 90–180 two or three a month, best content only; lapsed only via re-permission.
- B2B and services: a newsletter weekly to monthly, plus flows. Creators: the publishing schedule is the cadence.
- Non-sale weeks: roughly 60–70% useful (education, stories, new things, how-to) to 30–40% promotional. Every promotional send still carries something useful.
- Tentpoles (Black Friday, anniversary, a launch): a temporary increase with an end date, approved ahead, followed by a pull-back week.
- Any increase is a new proposal; it never creeps up silently. Watch unsubscribes (< 0.3% per send is fine; ≥ 0.5% means fatigue or targeting) and complaints (< 0.1%).

## Offers

### The ladder
Offers come only from the standing first-order offer or a ladder the marketer approved. Defaults until then:
- Welcome: never deeper than the standing first-order offer.
- Cart / checkout: the first reminder never discounts; first-timers may see their existing welcome code again; returning full-price customers get none.
- Win-back: one step at most, approved, ideally a non-discount value first (free shipping, a gift with purchase, early access).
- Nobody receives the same code twice in 30 days. Codes are unique, single-use, non-stacking, with an expiry and exclusions (gift cards, subscriptions, sale items as the brand decides).

### Margin math (shown beside every discount)
```
contribution per order = AOV − product cost − fulfilment and shipping − payment fees
discount cost per order = AOV × discount %
share of contribution used = discount cost ÷ contribution
break-even lift = (orders that would happen anyway × discount cost) ÷ (contribution − discount cost)
```
Worked example: AOV $58; product cost 22% = $12.76; fulfilment $9; fees 3% = $1.74 → contribution **$34.50**. 15% off = $8.70 = **25% of contribution**; 10% off = $5.80 (17%). If 100 orders happen anyway, 15% to all of them costs $870; each extra order nets $25.80 → needs **+34 orders (34% lift)** to break even; 10% needs **+20**.
Say it plainly: "This 15% costs $8.70 an order, a quarter of what we make on it. It pays only if it lifts orders by more than a third. I recommend the standing 10%."
Subscriptions and apps: value per subscriber = price × (1 − store or payment fee: App Store/Play 15–30%) × expected months retained; a trial extension or first-month discount costs its value on every subscriber who would have paid anyway. App-store subscriptions use the store's own offer codes and win-back offers.
Unknown margin: show the cost per order in money, say margin is unknown, and do not call any discount "affordable". A shared or stackable code is flagged "leakage risk: the cost spreads to people who would have bought anyway".

## Sunset policy (proposal only)
- Who: no click or order in [90] days for frequent senders ([180] for low frequency or long purchase cycles) and ≥ [8] sends received.
- How: a 2-message re-permission flow ("Still want these?" with a one-click keep link), then suppress — do not delete; the record is kept for compliance.
- The proposal names the slice: its size, its revenue in the last 12 months (usually near zero), and the expected effect on complaint rate and inbox placement.
