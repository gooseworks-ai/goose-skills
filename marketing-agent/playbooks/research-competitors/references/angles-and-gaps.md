# Angles and white space

Load at steps 12–13.

## An angle is not copy

An angle is a reason to buy aimed at a specific buyer, with what it takes to make it believable. A rival's headline is evidence that a reason to buy is being tested; it is never our output. One angle = one reason to buy. "Stops the scratching", "stops the scratching in two weeks" and "itch-free dog" are one angle with three hooks.

## Angle row (required fields)

| Field | What goes in it |
|---|---|
| `id` · `slug` | `A-NN`, stable forever — the key the makers tag ads with (lower-case: `angle:a-07`) and analyze-performance cites; plus a short slug as a human label. Never renumber; retire with a reason. |
| name | Short, buyer-language |
| reason to buy | One sentence: what the buyer gets |
| segment · awareness | research-market segment id (S1…) and Schwartz level |
| emotional driver | relief, trust, belonging, status, control, pride… |
| objection it answers | in buyer words, with quote id |
| product(s) | product id and name from `brand_read` |
| offer | an offer the brand actually runs, or "none — feature no offer" (never invent one) |
| market evidence | which rivals run it: cluster, variant count, days running, 2 ad links each |
| saturation | k of n rivals lead with it |
| buyer evidence | voice-of-customer quote ids and the theme's count — or "no buyer evidence yet" |
| proof wording | the exact claim text the claims gate (`../../../atoms/claims-gate/ATOM.md`) allows — learn-my-brand's "Claims you may use" facts once signed off; before that, plain product facts only |
| proof gap | what we would need and do not have — excluded until learn-my-brand approves it |
| status | **briefable** (proof wording exists) · **needs proof** · **do not use** (with reason: off-brand, a rival's trademark claim, regulated) |
| formats | the formats that suit it |
| reference ads | 1–3 rival ads for structure only (template ids from `ads_template_read`, or media ids) |
| hook directions | 2–3 hook types — directions, not finished lines |
| how we differ | what our execution does that theirs does not |
| guardrails | never reuse their claim, visual, slogan or name; comparative only with the human's yes and proof; personal-attribute rule below |
| test status | untested / testing / won / lost / mixed — with dates, refreshed by this playbook from analyze-performance's latest report and learnings citing the `A-NN`, ads tagged `angle:a-nn` (queried lower-case), and videos whose names carry it |

**Personal-attribute and regulated categories** (health and conditions, skin conditions, weight, mental health, finances, and similar): no hook may say or imply the viewer has the condition ("Your itchy skin…", "Your ADHD brain…") — write about the product or a situation instead. Any wording about treating, curing, managing or improving a condition is "do not use (regulated)" unless it is an approved claim.

## The white-space matrix

Rows: every reason to buy found in rivals' ads and pages, plus every established theme in the voice-of-customer bank that no rival addresses. Columns: each rival (cell = leads with it / mentions it / absent, with the longest run length in days), then **buyer weight** (the theme's quote count and share of kept quotes), then **our proof** (yes / partial / none).

Classify each row:
- **Gap** — buyer weight is real, no rival leads with it, we have or can get proof. These become the top angles.
- **Unvalidated** — unclaimed and no buyer evidence. It may be unclaimed because it does not sell. Brief only as a small test, said so. Without a voice-of-customer bank every row is unvalidated.
- **Contested** — several rivals lead with it and it runs long. Proven demand; we need a sharper execution, a different segment, or a better proof, not the same message.
- **Table stakes** — everyone says it (a category convention). Must be present somewhere; never the lead.

A gap claimed with no buyer evidence is an invented gap. Do not report it as white space.

## Frameworks

Use: the matrix above, the offer-architecture table, awareness levels on every hook, the hook taxonomy in `reading-ads-honestly.md`, a format line per rival. Optional: a two-axis positioning map — only with axes taken from the evidence (for example price × "vet-led vs lifestyle"), never invented. Skip: SWOT, Porter's five forces, TAM, estimated share of voice or traffic (an ad-count ratio across the set, from full-library reads, is the only honest proxy, and say it is one).

## What a senior rejects

Angles that are reworded rival copy; any claim not on the approved list; "ran longest so it works" without caveats; spend or ROAS talk; undated facts; dead links; generic angles ("social proof"); ten angles that are one reason to buy; gaps without buyer evidence; ads read from the wrong Meta page; a hook that tells the viewer they have a condition.
