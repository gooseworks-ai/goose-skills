# Fit definition and scoring

Load at list-mode step 1 (writing the definition) and step 6 (scoring).

## A finished fit definition contains all of this

A definition is finished when someone else could build the same list from it. If any line below is blank, assume it from the site, the brain and the ask, label it "assumed" (or "not a filter" on purpose), and let the human correct it after they see rows.

**The example column is fictional and only shows the level of detail. Never reuse its values** — every value in a real definition comes from the brain or from the human, and a line nobody can fill stays a question.

| Part | What to write | Example (fictional seller of accounts-payable software) |
|---|---|---|
| **Who the list is for** | The motion: sales outbound, retail/wholesale buyer pitch, partnership ask, distributor recruitment, supply-side recruiting, agency new business | Sales outbound, founder-led |
| **List unit** | What one "account" is (see list-by-company-type.md) | Company × finance buying committee |
| **Firmographics** | Industry list *with what each means*, employee band, revenue band if it matters, geography, ownership/stage | US/CA wholesale distributors and manufacturers, 200–2,000 employees, privately held or PE-backed |
| **Technographics** | Required / complementary / competitor tools, and how each will be detected | Runs NetSuite (detected from job posts, careers pages, integration pages) |
| **Situation / trigger** | The moment that creates need — this is what makes the list timely | AP team growing, new finance leader, ERP change |
| **Personas** | 1–3 roles: title, seniority, function, *which pain they own*, title synonyms to search | Controller / AP Manager (champion, owns the pain); VP Finance / CFO (economic buyer) — synonyms: "Accounting Manager", "Head of Finance", "Director of Accounting" |
| **Account value** (account-based lists) | What a big vs small account is worth — deal size and strategic fit — and the V1/V2/V3 rule | V1: 1,000+ staff or a named reference segment; V3: under 250 staff |
| **Disqualifiers (gates)** | Hard no's | Existing customers, open deals, competitors, partners, the seller's own staff, do-not-contact list, Germany/Austria (consent rules) |
| **Negative ICP** | Looks like a fit, never buys — ideally from loss notes | Companies on SAP (lost 4 of 4); under 150 staff (no AP team) |
| **Exclusion sources** | The files the human supplied, and the standing ledger | customers.csv (412 domains), ledger.csv |
| **Size** | What the human asked for, checked against what they can work (assume about 100 new people a week unless they said — never cap them; they correct it in the decisions) and the account cap | 40 people, max 3 per account |

Show it with the rows as one compact block in plain words, assumed lines first — never wait for a yes before building. A vague line is worthless; if a line still says "any", say what that will do to the list ("any industry" → the list will be mostly noise).

## Retail and wholesale variant

For lists of retailers, boutiques, distributors or venues, replace firmographics and technographics with the **retail profile**:

| Part | What to write |
|---|---|
| Retailer type and split | Chains vs independents (assume from the ask and the brand's stockists; label it); category (e.g. clean-beauty boutiques, pharmacies, grocery) |
| Size | Door count (chains) or single/multi-location (independents) |
| Price tier and fit | Price band of what they stock vs the brand's price |
| Assortment | Stocks a direct competitor (yes/no — evidence of category fit, not a disqualifier unless the human says so) |
| Geography | Region or radius |
| Timing | The retailer's line-review / category-reset window (the retailer's published vendor calendar; otherwise "unknown — tell us if you know it" in the decisions), new store openings |
| Route | Chains: an account row with the vendor portal, buying office or broker, **plus 1–2 dated category-buyer rows** (never a guessed person); independents: an account row with the published shop inbox or IG (UK sole traders: no email or cold DM — see contacts-and-compliance), owner named only from a dated source |

Scoring for retail lists: account match 35 (type, price tier, assortment fit), persona/route 15 (owner or buyer named, or a published shop inbox), evidence 10, timing 40 where a review window or opening is known. Tier B if fit is at least 40 of 60 whatever the timing, otherwise out; tier A needs a known window or opening. Never invent a window.

**When the brain has no ICP at all** (new brand, founder unsure): do not invent one. Build on the strongest of two or three candidate definitions (from what the brand sells and who its known customers are), name the others in the report as alternatives, and let the human switch after seeing rows. Label it a proposal.

## Scoring: gates first, then points

Must-haves are **gates**: fail one and the row is dropped (and listed in `dropped.csv` with the gate it failed). A gated-out row never appears with a low score.

Points, out of 100 (adjust weights only with the human's yes, or from outcomes):

| Block | Points | How |
|---|---|---|
| Account match | 25 | How squarely the account sits inside the firmographic core (centre of the band, named industry) vs the edges |
| Persona exactness | 20 | Exact title and function owning the pain, from a dated page = 20; from a dated search headline only = 12; adjacent title = 10; plausible but unconfirmed = 0 (and say so) |
| Tech / situation evidence | 15 | Evidence of the required stack or situation, cited |
| Timing | 40 | Strongest live signal, weighed by strength and recency (judgment with the anchors in signals-and-hooks.md). No signal = 0 |

**Account value** (account-based lists — B2B, distributors, chains): a separate axis, not points. Set it from what the human said a big vs small account is worth — expected deal size (seats, locations, doors, annual value) and strategic fit (a logo that opens a segment, a reference customer). Value tiers: **V1** (top: 1:1 depth — up to 3 people, the deepest hook, a custom angle), **V2** (standard), **V3** (worth a light touch only). Cite the evidence ("48 locations, company page 2026-10-14"). No value input from the human → estimate from size evidence and label it "estimated". Independent shops and venues: `n/a` — they are ranked on fit and timing only.

Tiers (fit + timing):
- **A** — 75+ and at least one fresh signal.
- **B** — 55–74, or a fit of at least 45 of the 60 fit points whatever the signal.
- **C** — under 55 and fit under 45/60. Goes to `dropped.csv` with its reason, never the main list.

**Every point needs its reason in the row**, in this shape:

> "Gates passed: US, 640 staff (LinkedIn company page, 2026-10-14), NetSuite named in a live AP job post, not a customer. Controller owns AP (+20). Hiring 2 AP specialists, posted 2026-10-02, still open 2026-10-15 (+40)."

Junk: "Strong fit — finance leader at a growing company." If the reason could be pasted onto another row unchanged, it is junk.

The list is ranked by fit tier and value together: an A/V1 account gets the most care; a B/V1 often outranks an A/V3 — say why in the summary.

## Re-tuning from outcomes

When the human feeds back replies/meetings/bounces (the shared outcomes ledger): compare reply and meeting rate by segment, by tier and by signal type. Raise the weight of signals that convert, demote segments that do not, add to the negative ICP anything that replied "not a fit". Show the change and get a yes before it becomes the saved definition. Small numbers (under ~10 positive replies, or under 50 contacted, per segment) are directional only — say so.
