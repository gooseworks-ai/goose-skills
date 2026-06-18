---
name: churn-risk-detector
description: >
  Scan support tickets, Slack channels, NPS scores, and usage patterns to flag accounts
  showing early churn indicators. Produces a weekly risk scorecard with severity tiers,
  root cause hypotheses, and suggested save plays per account. Designed for seed/Series A
  teams where the founder or a single CSM manages all accounts manually.
tags: [research]
---

# Churn Risk Detector

Surface accounts at risk of churning before it's too late. Aggregates signals from support, communication, and usage patterns into a scored risk report with specific save actions.

**Built for:** Early-stage teams with no CS platform (no Gainsight, no ChurnZero). You have a spreadsheet of customers, a Slack channel, and a support inbox. This skill turns those raw signals into an actionable churn risk list.

## When to Use

- "Which customers are at risk of churning?"
- "Run the weekly churn risk scan"
- "Flag accounts I should worry about"
- "Who haven't we heard from in a while?"
- "Produce a customer health report"

## Phase 0: Intake

### Account Data
1. **Customer list** — CSV or sheet with: company name, primary contact email, contract value (MRR/ARR), contract start date, renewal date (if known)
2. **Product/service type** — What are they paying for? (Helps calibrate expected engagement)

### Signal Sources (provide what you have)
3. **Support tickets** — Export from Intercom, Zendesk, or email (CSV with: customer, date, subject, status, resolution time)
4. **Slack channel history** — Customer Slack channel or shared channel messages
5. **NPS/CSAT scores** — Recent survey results with scores and comments
6. **Usage data** — Any metrics you track: logins, API calls, features used, active users (CSV export)
7. **Email/communication log** — Last touchpoints per account (dates + context)
8. **Billing data** — Payment failures, downgrades, discount requests

### Calibration
9. **What does "healthy" look like?** — Describe a healthy customer (e.g., "logs in daily, uses 3+ features, responds to emails within 24h")
10. **Known churn reasons** — Why have customers churned in the past? (helps weight signals)

## Phase 1: Signal Extraction

### 1A: Support Signal Analysis

From support ticket data, calculate per account:

| Signal | Calculation | Risk Weight |
|--------|-------------|-------------|
| **Ticket volume spike** | >2x their average in last 30 days | High |
| **Unresolved tickets** | Open tickets older than 7 days | High |
| **Escalation language** | Keywords: "cancel", "frustrated", "alternative", "not working", "disappointed" | Critical |
| **Response time degradation** | Your avg response time to this customer trending up | Medium |
| **Repeat issues** | Same problem reported 2+ times | High |

### 1B: Communication Signal Analysis

From Slack/email history:

| Signal | Calculation | Risk Weight |
|--------|-------------|-------------|
| **Gone silent** | No messages in 30+ days (was previously active) | High |
| **Decreasing frequency** | Message frequency dropped >50% vs prior 90 days | Medium |
| **Negative sentiment shift** | Tone changed from positive to neutral/negative | Medium |
| **Champion disengagement** | Primary contact stopped responding | Critical |
| **New stakeholder questions** | New person asking basic "what does this do?" questions | Medium (potential reorg) |

### 1C: Usage Signal Analysis (if data available)

| Signal | Calculation | Risk Weight |
|--------|-------------|-------------|
| **Login drop** | Active users down >30% vs prior month | High |
| **Feature abandonment** | Stopped using a key feature they previously used regularly | High |
| **Shallow usage** | Only using 1 feature when they're paying for many | Medium |
| **No growth** | Same number of seats/users for 6+ months | Low |
| **Export spike** | Sudden increase in data exports | Critical (may be migrating) |

### 1D: Commercial Signal Analysis

| Signal | Calculation | Risk Weight |
|--------|-------------|-------------|
| **Discount request** | Asked for pricing reduction | High |
| **Downgrade inquiry** | Asked about lower tier | Critical |
| **Payment failure** | Failed payment not resolved in 7+ days | High |
| **Contract approaching renewal** | <60 days to renewal with no renewal discussion | Medium |
| **Competitor mention** | Mentioned a competitor in any channel | High |

## Phase 2: Risk Scoring

### Scoring Model

Each account gets a composite risk score (0-100):

```
Risk Score = Σ (signal_weight × signal_present)

Weights:
  Critical signal = 25 points each
  High signal     = 15 points each
  Medium signal   = 8 points each
  Low signal      = 3 points each

Score cap: 100
```

### Risk Tiers

| Tier | Score | Label | Action Urgency |
|------|-------|-------|---------------|
| **Red** | 70-100 | Critical risk — likely to churn | This week |
| **Orange** | 40-69 | Elevated risk — needs attention | Within 2 weeks |
| **Yellow** | 20-39 | Early warning — monitor closely | Within 30 days |
| **Green** | 0-19 | Healthy — no action needed | Routine check-in |

## Phase 3: Save Play Generation

For each Red and Orange account, generate a specific save play:

### Save Play Template

```
ACCOUNT: [Company Name]
RISK TIER: [Red/Orange]
RISK SCORE: [X/100]
MRR/ARR: $[X]

SIGNALS DETECTED:
- [Signal 1] — [Evidence: specific data point]
- [Signal 2] — [Evidence]
- [Signal 3] — [Evidence]

ROOT CAUSE HYPOTHESIS:
[1-2 sentences: What do you think is actually going wrong?
 E.g., "Champion left the company and new stakeholder hasn't been onboarded"
 or "They hit a technical limitation with [feature] that's blocking their primary use case"]

RECOMMENDED SAVE PLAY:
1. [Immediate action — e.g., "Schedule a call with [contact] this week"]
2. [Follow-up — e.g., "Send a personalized Loom showing how to solve [specific issue]"]
3. [Structural fix — e.g., "Assign a dedicated onboarding session for new stakeholder"]

TALK TRACK:
"[2-3 sentences the CSM/founder can use to open the conversation naturally,
 without saying 'we noticed you might be churning']"

ESCALATION TRIGGER:
If [specific condition] by [date], escalate to [founder/CEO call].
```

## Phase 4: Output Format

```markdown
# Churn Risk Report — Week of [DATE]
Total accounts scanned: [N]
Data sources: [list what was available]

---

## Risk Summary

| Tier | Count | Total MRR at Risk |
|------|-------|-------------------|
| 🔴 Red (Critical) | [N] | $[X] |
| 🟠 Orange (Elevated) | [N] | $[X] |
| 🟡 Yellow (Early Warning) | [N] | $[X] |
| 🟢 Green (Healthy) | [N] | $[X] |

**Total MRR at risk (Red + Orange):** $[X] ([Y]% of total MRR)

---

## 🔴 Critical Risk Accounts

### [Company Name 1] — Score: [X]/100 | MRR: $[X]
**Signals:** [bullet list]
**Root cause:** [hypothesis]
**Save play:** [specific actions]
**Owner:** [who should act]
**Deadline:** [date]

### [Company Name 2] — ...

---

## 🟠 Elevated Risk Accounts

### [Company Name] — Score: [X]/100 | MRR: $[X]
**Signals:** [bullet list]
**Recommended action:** [1-2 sentences]

---

## 🟡 Early Warning Accounts

| Account | Score | Key Signal | Suggested Action |
|---------|-------|------------|-----------------|
| [Name] | [X] | [Signal] | [Action] |
| [Name] | [X] | [Signal] | [Action] |

---

## Trends vs Last Week

- Accounts moved Red → Green: [list — wins!]
- Accounts moved Green → Yellow/Orange: [list — new risks]
- Accounts churned since last report: [list]

---

## Signal Distribution

| Signal Type | Accounts Affected |
|------------|-------------------|
| Support ticket spike | [N] |
| Gone silent | [N] |
| Usage decline | [N] |
| Competitor mention | [N] |
| Payment issue | [N] |
| Champion disengagement | [N] |

---

## Recommended Focus This Week

1. **[Account]** — [Why + what to do]
2. **[Account]** — [Why + what to do]
3. **[Account]** — [Why + what to do]
```

Save to `risk-report-[YYYY-MM-DD].md` in the current working directory.

## Scheduling

Run weekly:

```bash
0 8 * * 1 python3 run_skill.py churn-risk-detector --client <client-name>
```

## Cost

| Component | Cost |
|-----------|------|
| All signal analysis | Free (LLM reasoning) |
| Slack/email parsing | Free |
| **Total** | **Free** |

## Tools Required

- Input data from CSV/sheets (support tickets, usage, NPS)
- **Optional:** Slack channel reading for communication signals
- No external API costs — pure analysis

## Trigger Phrases

- "Which customers are at risk?"
- "Run the churn risk scan"
- "Weekly customer health report"
- "Flag at-risk accounts"
