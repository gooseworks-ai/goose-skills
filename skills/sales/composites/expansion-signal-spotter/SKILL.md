---
name: expansion-signal-spotter
description: >
  Monitor existing customer accounts for upsell and cross-sell signals: team growth
  on LinkedIn, new job postings, product usage patterns, funding announcements, and
  public company news. Produces a weekly expansion opportunity list with context and
  talk tracks. Chains web search, LinkedIn profile monitoring, and job posting detection.
tags: [lead-generation]
---

# Expansion Signal Spotter

Find expansion revenue hiding in your existing customer base. Monitors accounts for signals that indicate they're ready to buy more — before they ask or before a competitor gets there first.

**Built for:** CS teams and founders at early-stage companies where expansion revenue is the fastest path to growth. You already have the relationship — this skill finds the timing.

## When to Use

- "Which customers are ready to expand?"
- "Find upsell opportunities in our accounts"
- "Run the weekly expansion signal scan"
- "Who should I pitch [new feature/tier] to?"
- "Monitor customer accounts for growth signals"

## Phase 0: Intake

### Account Data
1. **Customer list** — CSV or sheet with: company name, domain, primary contact LinkedIn URL, current plan/tier, MRR/ARR, seats/usage
2. **Product tiers** — What plans exist? What triggers an upgrade? (e.g., "Pro → Enterprise at 50+ seats")
3. **Cross-sell products** — Any add-ons or adjacent products you can sell?

### Signal Configuration
4. **Expansion triggers** — What signals mean "ready to buy more" for your product?
   - Team growth (new hires in relevant roles)
   - Funding announcement
   - Usage hitting plan limits
   - New department/use case interest
   - Champion promoted (more budget authority)
5. **Key contacts to monitor** — LinkedIn URLs of champions, decision-makers per account (if available beyond primary)

### Filters
6. **Minimum account value** — Only scan accounts above $X MRR? (Focus effort)
7. **Accounts to exclude** — Any accounts in active churn risk, paused, or in dispute

## Phase 1: Signal Detection

### 1A: Team Growth Signals

For each customer, search for hiring activity:

```
Search: "[company name]" hiring OR "we're hiring" OR "join our team"
Search: site:linkedin.com/jobs "[company name]" [relevant role keywords]
Search: "[company name]" "head of" OR "director of" OR "VP" [your product's domain]
```

Signals to detect:
| Signal | What It Means | Expansion Play |
|--------|---------------|----------------|
| **Hiring in your product's domain** | Growing the team that uses you | More seats / higher tier |
| **New leadership hire** | Budget holder arrived, will evaluate stack | Executive alignment meeting |
| **Hiring in adjacent team** | New department could use your product | Cross-sell / new use case |
| **Rapid headcount growth** | Scaling fast, needs to scale tools too | Volume upgrade |

### 1B: Funding & Financial Signals

```
Search: "[company name]" funding OR raised OR "series" OR investment 2026
Search: "[company name]" revenue OR growth OR expansion
```

| Signal | What It Means | Expansion Play |
|--------|---------------|----------------|
| **New funding round** | Cash in bank, expanding everything | Premium tier / annual contract |
| **Revenue milestone** | Business doing well, likely investing in tools | ROI-focused expansion pitch |
| **Acquisition** | New parent company = new budget | Enterprise plan / multi-team |

### 1C: Product Usage Signals (if usage data available)

From internal data, flag:

| Signal | Threshold | Expansion Play |
|--------|-----------|----------------|
| **Approaching plan limit** | >80% of seats/usage quota | Proactive upgrade offer |
| **New feature adoption** | Started using a feature in higher tier (via trial/beta) | Convert trial to paid |
| **Power user emergence** | 1+ users with 3x average usage | Champion for internal expansion |
| **Multi-team usage** | Users from 2+ departments | Department-level deal |
| **API usage growth** | API calls trending up month-over-month | Usage-based tier upgrade |

### 1D: Public Signal Monitoring

```
Search: "[company name]" launch OR "new product" OR partnership OR expansion
Search: "[company name]" "[your product category]" OR "[related use case]"
```

| Signal | What It Means | Expansion Play |
|--------|---------------|----------------|
| **New product launch** | May need your product for the new line | New use case pitch |
| **Geographic expansion** | Growing into new markets | Multi-region / additional seats |
| **Partnership announced** | Business growing, more complexity | Higher tier for scale |
| **Competitor of yours mentioned** | Evaluating alternatives | Retention + upgrade pre-empt |

### 1E: Champion & Stakeholder Signals

If monitoring champion LinkedIn profiles:

```
Search: "[champion name]" promoted OR "new role" OR "excited to announce"
```

| Signal | What It Means | Expansion Play |
|--------|---------------|----------------|
| **Champion promoted** | More authority, bigger budget | Propose expansion aligned to new scope |
| **Champion left** | Risk + opportunity (new person = fresh pitch) | Onboard new contact, re-pitch value |
| **New exec joined** | Potential new sponsor | Executive briefing |

## Phase 2: Opportunity Scoring

Score each expansion opportunity:

```
Expansion Score = Signal Strength × Account Value × Timing

Signal Strength (1-5):
  5 = Approaching plan limit + funding + team growth (multiple signals)
  4 = Strong usage signal + one external signal
  3 = One strong external signal (funding, hiring)
  2 = Usage trending up, no external confirmation
  1 = Weak or single minor signal

Account Value (multiplier):
  2.0x = Top 20% accounts by MRR
  1.5x = Mid-tier accounts
  1.0x = Smaller accounts

Timing (multiplier):
  2.0x = Signal detected this week (fresh)
  1.5x = Signal detected this month
  1.0x = Signal older than 30 days
```

### Opportunity Tiers

| Tier | Score | Action |
|------|-------|--------|
| **Hot** | 15+ | Schedule expansion call this week |
| **Warm** | 8-14 | Send value-add touchpoint, plant expansion seed |
| **Watch** | 3-7 | Add to next QBR agenda, monitor |

## Phase 3: Talk Track Generation

For each Hot and Warm opportunity, generate:

```
ACCOUNT: [Company Name]
CURRENT PLAN: [Plan] — $[MRR]/mo
EXPANSION TYPE: [Upsell / Cross-sell / Volume increase]
ESTIMATED EXPANSION: $[additional MRR]/mo

SIGNALS:
- [Signal 1] — [Source + date]
- [Signal 2] — [Source + date]

EXPANSION OPPORTUNITY:
[2-3 sentences: What should they buy and why now?]

TALK TRACK:
"[Opening line — connects the signal to their business goals, not your quota]"

"[Value bridge — how the expansion directly helps with what they're already trying to do]"

"[Soft ask — suggest next step without pressure]"

TIMING: [Why now is the right time — tied to signal]

RISK: [What could block this — budget freeze, champion change, etc.]
```

## Phase 4: Output Format

```markdown
# Expansion Signal Report — Week of [DATE]
Accounts scanned: [N]
Total expansion pipeline identified: $[X] additional MRR

---

## Summary

| Tier | Opportunities | Potential MRR |
|------|--------------|---------------|
| 🔥 Hot | [N] | $[X]/mo |
| 🟡 Warm | [N] | $[X]/mo |
| 👀 Watch | [N] | $[X]/mo |

---

## 🔥 Hot Opportunities

### [Company 1] — Current: $[X]/mo → Target: $[Y]/mo (+$[Z])
**Signals:** [list]
**Expansion type:** [Upsell to Enterprise / Add 20 seats / Cross-sell analytics]
**Talk track:** "[scripted opener]"
**Next step:** [Specific action + date]

### [Company 2] — ...

---

## 🟡 Warm Opportunities

### [Company] — Current: $[X]/mo | Signal: [brief]
**Recommended touchpoint:** [What to do — e.g., "Send case study of similar customer who expanded"]

---

## 👀 Watch List

| Account | Signal | Next Check |
|---------|--------|------------|
| [Name] | [Signal] | [Date] |

---

## Trends

- [N] accounts showing team growth signals (potential seat expansion)
- [N] accounts approaching usage limits
- [N] accounts with new funding (potential tier upgrade)

## Expansion Playbook Priority

This week, focus on:
1. **[Account]** — [Why: highest value + strongest signal]
2. **[Account]** — [Why]
3. **[Account]** — [Why]
```

Save to the current working directory or wherever the user prefers (e.g., `expansion/expansion-signals-[YYYY-MM-DD].md`).

## Scheduling

Run weekly:

```bash
0 8 * * 2 python3 run_skill.py expansion-signal-spotter
```

## Cost

| Component | Cost |
|-----------|------|
| Web search (hiring, funding, news) | Free |
| LinkedIn monitoring (if using linkedin-profile-post-scraper) | ~$0.50-1.00 |
| Job posting detection (if using job-posting-intent) | ~$0.50 |
| All analysis and talk tracks | Free (LLM reasoning) |
| **Total** | **Free — $1.50** |

## Tools Required

- **web_search** — for funding, news, hiring signals
- **fetch_webpage** — for career pages and announcements
- **Optional:** `linkedin-profile-post-scraper` for champion monitoring
- **Optional:** `job-posting-intent` for structured hiring signal detection

## Trigger Phrases

- "Find expansion opportunities in our accounts"
- "Which customers are ready for an upgrade?"
- "Run the expansion signal scan"
- "Weekly expansion opportunity report"
