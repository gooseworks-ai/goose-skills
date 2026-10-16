# Output formats

Load at step 14. **Example values are for a fictional fresh dog-food brand, on purpose — never copy them into real output.** Every file opens with the marker line so the brand's own knowledge search never mistakes a rival's claim for ours.

## Marker lines

Every competitor artifact's line 1 tells readers (and the brand's own search) that these are rivals' claims, not ours:
- records that are replaced by newer versions (competitor files, landscape, angle bank): `COMPETITOR RESEARCH — rivals' claims and prices, not ours. Superseded by newer dated versions.`
- the weekly watch digest (kept as history): `COMPETITOR RESEARCH — rivals' claims and prices, not ours. Weekly record; kept as history.`

## research/competitors/<slug>.md

```markdown
COMPETITOR RESEARCH — rivals' claims and prices, not ours. Superseded by newer dated versions.
Do this first, because… <what this rival's moves mean for us in one sentence>
# <Rival> — competitor file — <brand>
Tier: direct · Website: <url> · Meta page: <id> (server check: CONFIRMED) · Confirmed by the founder: <date>
Ads active as of: <scrape date> · read: <full active library, country <market> | partial — sample only (server sample of n, all countries)> · Links spot-checked: 5 of 5 / not checked (no browser here)
Last checked: <date> · Sources: server research <date>, browser <date>, pasted by the founder <date>

## Positioning — read-by-fetch <date>
H1: "<quoted>" (<url>) · Speaks to: <segment> · Wants to be known for: <one line>
Versus us: <where their message differs from ours>

## Offer — read-by-fetch <date>
| item | value | source | date | change since last |
|---|---|---|---|---|
| Hero plan | <price> per <unit> (list; intro offer <x>% first box, new customers only) | <url> | <date> | – |

## Funnel
C1 → quiz (<url>) → plan page → 50% first-box popup (email). Proof stack: vet-formulated badge, review count, press logos.

## Ads — Meta, active as of <scrape date>
| cluster | reason to buy | hook type | awareness | offer | proof | format | variants seen | earliest start | days running | page | ads |
|---|---|---|---|---|---|---|---|---|---|---|---|
| C1 itch relief | "stops the scratching" | problem call-out | problem-aware | 50% first box | vet | video | 6 | 2026-08-03 | 71 | quiz | <link>, <link> |
Inference (medium, sample): C1 has several variants started over ten weeks — consistent with a concept being iterated. No spend or results are public. Counts beyond the sample: not read.

## Content — <status>
## Social — <status>
## Releases — <status>
## Search and AI footprint (light) — <status>
## Review signal — <status>
Site 4.6★ / 2,400 (velocity n/a — first snapshot) · Complaint themes: stomach upset on switching (V-044, V-071)

## Our read (inference)
Betting on: … · Attack surface: … · Do not copy: … · Confidence: …

## Not read
<section>: <reason>

## Snapshot <date>
<see watch-and-react.md>
## Previous snapshot <date>
```

## research/competitors/landscape.md

```markdown
COMPETITOR RESEARCH — rivals' claims and prices, not ours. Superseded by newer dated versions.
Do this first, because… <the gap to take, or "no validated gap yet — find out what buyers say first">
# Competitive landscape — <brand>
Last updated: <date> · Set: <rivals with tiers> · Do-nothing / DIY: <what buyers do instead, quote ids>
Buyer evidence: voice-of-customer bank <date> | "no buyer evidence yet — every row unvalidated"
Category conventions (everyone says it): …
## Reasons-to-buy matrix
| reason to buy | Rival A | Rival B | Rival C | buyer weight | our proof | class |
|---|---|---|---|---|---|---|
## Gaps · Unvalidated · Contested · Table stakes
## Offer comparison (us vs each rival)
## Optional positioning map (axes from evidence only)
```

## research/competitors/angle-bank.md

```markdown
COMPETITOR RESEARCH — rivals' claims and prices, not ours. Superseded by newer dated versions.
Do this first, because… <brief A-NN now, because <evidence>>
# Angle bank — <brand>
Last updated: <date> · Angles: <n> (briefable <n>, needs proof <n>, do not use <n>) · Claims source: sign-off <date> | "no sign-off yet — product facts only"
How to use: brief from one angle; tag every ad made from it `angle:a-nn` (lower-case, e.g. `angle:a-07`) so results come back to this row.

## A-07 — Vet-led, not trendy (slug: vet-led-not-trendy)
Reason to buy: a food designed with vets, not a fad diet
Segment · awareness: S1 · solution-aware
Driver: trust · Objection answered: "these subscription brands are all marketing" (V-044)
Product(s): <id> <name> · Offer: none — feature no offer
Market evidence: Rival A C1 (6 variants, 71 days, <link>, <link>); Rival B absent · Saturation 1/5
Buyer evidence: T-05, 14 quotes (11% of kept)
Proof wording: "<exact approved claim text>" (a "Claims you may use" learning, signed off <date>)
Proof gap: "clinically shown to reduce itching" — not approved; excluded
Status: briefable
Formats: vet talking head, static myth-bust · Reference ads (structure only): <template id>, <template id>
Hook directions: myth-bust, founder story
How we differ: lead with the vet's process, not the ingredient list
Guardrails: do not reuse Rival A's "#1 vet-recommended" claim or its lab visual; no comparative naming; no "your dog's allergies" hooks
Test status: untested (checked <date>)
```
