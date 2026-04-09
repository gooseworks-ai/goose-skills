---
name: pipeline-review
version: 1.0.0
description: >
  Pipeline analysis composite. Pulls deal/meeting data from any CRM or tracking
  system, analyzes the pipeline over a user-defined period (weekly, fortnightly,
  monthly, quarterly), and produces both an executive summary and a detailed
  diagnostic report. Covers volume, qualification rates, source effectiveness,
  stage velocity, stuck deals, and actionable recommendations. Tool-agnostic —
  works with any CRM (Salesforce, HubSpot, Pipedrive, Close, Supabase, CSV).
tags: [research]
---

# Pipeline Review

Pulls deal and meeting data from whatever system the user tracks their pipeline in, analyzes it over a chosen time period, and produces a report that answers the questions a founder, sales leader, or AE actually cares about: Are we booking enough? Are they qualified? Where are deals getting stuck? What's working and what isn't?

**Two output modes:**
- **Executive summary:** 1-page snapshot. Numbers, trends, red flags. What a founder reads over morning coffee.
- **Detailed diagnostic:** Full data tables, stage-by-stage breakdown, source analysis, stuck deal list, and specific recommendations.

Both are always produced. The executive summary sits at the top of the report.

## When to Auto-Load

Load this composite when:
- User says "review my pipeline", "pipeline report", "how's our pipeline looking", "deal review"
- User says "1:1 prep", "board meeting prep", "weekly sales review"
- An upstream workflow (Pipeline Ops, daily BDR rhythm) triggers an end-of-period review
- User asks about meeting quality, conversion rates, or pipeline health

---

## Step 0: Configuration (One-Time Setup)

On first run, collect and store these preferences. Skip on subsequent runs.

### Data Source Config

| Question | Options | Stored As |
|----------|---------|-----------|
| Where do you track your pipeline? | Salesforce / HubSpot / Pipedrive / Close / Supabase / Google Sheets / CSV / Notion / Other | `crm_tool` |
| How do we access it? | API / Export CSV / MCP tools / Direct query | `access_method` |
| What object represents a "deal" in your system? | Opportunity / Deal / Lead / Meeting / Custom | `deal_object` |

### Pipeline Stage Definitions

| Question | Purpose | Stored As |
|----------|---------|-----------|
| What are your pipeline stages in order? | Map data to a standard funnel | `pipeline_stages` |
| Which stage means "qualified"? | Qualification rate calculation | `qualified_stage` |
| Which stage means "closed won"? | Win rate calculation | `won_stage` |
| Which stage means "closed lost"? | Loss analysis | `lost_stage` |
| What is your expected sales cycle length? (days) | Identify stuck deals | `expected_cycle_days` |

**Example stage mapping:**
```
pipeline_stages: [
  "Lead",
  "Meeting Booked",
  "Meeting Held",
  "Qualified (Discovery Done)",
  "Proposal Sent",
  "Negotiation",
  "Closed Won",
  "Closed Lost"
]
qualified_stage: "Qualified (Discovery Done)"
won_stage: "Closed Won"
lost_stage: "Closed Lost"
expected_cycle_days: 30
```

### Field Mapping

Different CRMs use different field names. Map the user's fields to standard analysis fields.

| Standard Field | Purpose | Stored As | Examples |
|---------------|---------|-----------|---------|
| Deal name | Identification | `field_deal_name` | "Name", "Deal Name", "Opportunity Name" |
| Company | Account grouping | `field_company` | "Company", "Account", "Organization" |
| Stage | Funnel position | `field_stage` | "Stage", "Pipeline Stage", "Status" |
| Owner | Rep-level analysis | `field_owner` | "Owner", "Assigned To", "Rep" |
| Source | Channel attribution | `field_source` | "Lead Source", "Source", "Channel", "UTM Source" |
| Created date | Period filtering | `field_created_date` | "Created Date", "Created At", "Date Added" |
| Close date | Velocity tracking | `field_close_date` | "Close Date", "Expected Close", "Closed At" |
| Amount | Revenue analysis | `field_amount` | "Amount", "Deal Value", "ARR", "MRR" |
| Last activity date | Stale deal detection | `field_last_activity` | "Last Activity", "Last Modified", "Last Touched" |
| Meeting date | Meeting analysis | `field_meeting_date` | "Meeting Date", "Call Date", "Demo Date" |
| Qualification status | Qual rate | `field_qual_status` | "Qualified", "ICP Fit", "BANT Score" |
| Loss reason | Loss analysis | `field_loss_reason` | "Loss Reason", "Closed Lost Reason", "Disqualification Reason" |

**Not all fields are required.** The analysis adapts to whatever data is available. Minimum viable: deal name + stage + created date.

### Benchmarks (Optional)

| Question | Purpose | Stored As |
|----------|---------|-----------|
| What's your target meeting volume per week/month? | Compare actuals to goals | `target_meetings` |
| What's your target qualification rate? | Flag if below target | `target_qual_rate` |
| What's your target win rate? | Flag if below target | `target_win_rate` |
| What's your target pipeline value? | Revenue gap analysis | `target_pipeline_value` |

**Store config** in the current working directory or wherever the user prefers.

---

## Step 1: Pull Pipeline Data

**Purpose:** Extract deal/meeting data from the configured CRM for the specified time period.

### Input Contract

```
period: {
  type: "weekly" | "fortnightly" | "monthly" | "quarterly" | "custom"
  start_date: string              # ISO date (auto-calculated from type, or user-specified)
  end_date: string                # ISO date (default: today)
  comparison_period: boolean      # Include prior period for trend comparison (default: true)
}
crm_tool: string                  # From config
access_method: string             # From config
field_mapping: { ... }            # From config
```

### Process

Based on `crm_tool` and `access_method`:

| CRM | Access Method | How to Pull |
|-----|--------------|-------------|
| **Salesforce** | API / CSV export | SOQL query or user uploads CSV export |
| **HubSpot** | API / CSV export | Deals API or user uploads CSV export |
| **Pipedrive** | API / CSV export | Deals API or user uploads CSV export |
| **Close** | API / CSV export | Leads/Opportunities API or CSV |
| **Supabase** | Direct query | Query deals/outreach_log tables |
| **Google Sheets** | Sheets API / CSV | Read sheet or user exports CSV |
| **Notion** | Notion MCP | Query database |
| **CSV** | File read | User provides file path |

**Pull two datasets:**
1. **Current period:** All deals created or active within the specified date range
2. **Comparison period:** Same-length prior period (e.g., if reviewing last 2 weeks, also pull the 2 weeks before that)

### Data Standardization

Regardless of source, normalize all data into a standard structure:

```
deals: [
  {
    id: string
    name: string
    company: string
    stage: string                   # Mapped to pipeline_stages
    owner: string | null
    source: string | null           # Lead source / channel
    created_date: string            # ISO date
    close_date: string | null       # ISO date
    last_activity_date: string | null
    meeting_date: string | null
    amount: number | null
    qualification_status: string | null
    loss_reason: string | null
    days_in_current_stage: integer  # Calculated
    total_age_days: integer         # Calculated from created_date
  }
]
```

### Output Contract

```
pipeline_data: {
  current_period: {
    start_date: string
    end_date: string
    deals: [...]                    # Standardized deal records
    deal_count: integer
  }
  comparison_period: {
    start_date: string
    end_date: string
    deals: [...]
    deal_count: integer
  } | null
}
```

### Human Checkpoint

```
## Data Pulled

Source: [CRM name]
Current period: [start] to [end] — X deals
Comparison period: [start] to [end] — Y deals
Fields available: [list of mapped fields]
Fields missing: [any unmapped fields — analysis will adapt]

Data looks correct? (Y/n)
```

---

## Step 2: Analyze Pipeline

**Purpose:** Run the full analysis across seven dimensions. Pure computation + LLM reasoning — inherently tool-agnostic.

### Input Contract

```
pipeline_data: { ... }               # From Step 1
pipeline_stages: string[]            # From config
qualified_stage: string              # From config
won_stage: string                    # From config
lost_stage: string                   # From config
expected_cycle_days: integer         # From config
benchmarks: { ... } | null           # From config (optional)
```

### Analysis Dimensions

Run all seven analyses on the current period data. Where comparison period exists, calculate period-over-period trends.

---

#### Analysis 1: Volume Metrics

**Questions answered:** How many meetings/deals did we book? Is the volume going up or down?

| Metric | How to Calculate |
|--------|-----------------|
| Total deals created | Count deals with `created_date` in period |
| Meetings booked | Count deals that reached "Meeting Booked" stage or have a `meeting_date` |
| Meetings held | Count deals at or past "Meeting Held" stage |
| No-show rate | (Meetings booked - Meetings held) / Meetings booked |
| Period-over-period change | Compare to comparison period |
| vs. Target | Compare to `target_meetings` if set |
| Weekly run rate | Total / weeks in period |

**Output:**
```
volume: {
  deals_created: integer
  meetings_booked: integer
  meetings_held: integer
  no_show_count: integer
  no_show_rate: percentage
  weekly_run_rate: float
  vs_prior_period: {
    deals_change: percentage          # "+15%" or "-8%"
    meetings_change: percentage
  } | null
  vs_target: {
    target: integer
    actual: integer
    gap: integer                      # Positive = ahead, negative = behind
  } | null
}
```

---

#### Analysis 2: Qualification Breakdown

**Questions answered:** How many meetings were qualified? Unqualified? What's our qualification rate?

| Metric | How to Calculate |
|--------|-----------------|
| Qualified deals | Deals at or past `qualified_stage` |
| Unqualified deals | Deals that were closed lost before reaching `qualified_stage`, or deals marked as unqualified |
| Qualification rate | Qualified / (Qualified + Unqualified) |
| Pending qualification | Deals still between "Meeting Held" and `qualified_stage` |
| Disqualification reasons | Group `loss_reason` for deals lost pre-qualification |
| vs. Prior period | Compare qualification rate |
| vs. Target | Compare to `target_qual_rate` if set |

**Output:**
```
qualification: {
  qualified_count: integer
  unqualified_count: integer
  pending_count: integer
  qualification_rate: percentage
  vs_prior_period: percentage_change | null
  vs_target: { target: percentage, actual: percentage } | null
  top_disqualification_reasons: [
    { reason: string, count: integer, percentage: percentage }
  ]
}
```

---

#### Analysis 3: Source / Channel Attribution

**Questions answered:** Where are leads coming from? Which sources produce the most qualified meetings?

| Metric | How to Calculate |
|--------|-----------------|
| Deals by source | Group by `source`, count |
| Meetings by source | Group by `source`, count meetings |
| Qualification rate by source | For each source: qualified / total |
| Best source (volume) | Source with most deals |
| Best source (quality) | Source with highest qualification rate (min 5 deals for statistical relevance) |
| Source with highest conversion to won | Source with best close rate |
| Source trends | Compare to prior period |

**Output:**
```
source_attribution: {
  by_source: [
    {
      source: string
      deals_created: integer
      meetings_booked: integer
      meetings_qualified: integer
      qualification_rate: percentage
      deals_won: integer
      win_rate: percentage
      revenue: number | null
      vs_prior_period: percentage_change | null
    }
  ]
  best_volume_source: string
  best_quality_source: string
  best_conversion_source: string
  source_concentration_warning: string | null   # Flag if >60% from one source
}
```

---

#### Analysis 4: Stage Distribution & Velocity

**Questions answered:** Where are deals sitting in the pipeline? How fast are they moving through stages?

| Metric | How to Calculate |
|--------|-----------------|
| Deal count by stage | Group active deals by current `stage` |
| Revenue by stage | Sum `amount` per stage |
| Average days in each stage | For deals that passed through each stage, average `days_in_current_stage` |
| Stage-to-stage conversion | What % of deals move from one stage to the next |
| Pipeline velocity | (Deals × Win Rate × Avg Deal Size) / Avg Cycle Length |
| Total pipeline value | Sum of `amount` for all active deals |
| Weighted pipeline | Sum of (amount × stage probability) for each deal |

**Stage probability defaults** (override with actual data if available):
```
Lead: 5%
Meeting Booked: 10%
Meeting Held: 20%
Qualified: 40%
Proposal Sent: 60%
Negotiation: 80%
Closed Won: 100%
Closed Lost: 0%
```

**Output:**
```
stage_analysis: {
  by_stage: [
    {
      stage: string
      deal_count: integer
      revenue: number | null
      weighted_revenue: number | null
      avg_days_in_stage: float
      conversion_to_next_stage: percentage
    }
  ]
  total_pipeline_value: number | null
  weighted_pipeline_value: number | null
  pipeline_velocity: number | null
  avg_cycle_length_days: float
  vs_expected_cycle: string          # "On pace", "X days slower than expected", etc.
}
```

---

#### Analysis 5: Stuck Deals & At-Risk Pipeline

**Questions answered:** Are there deals that have been sitting too long? What's at risk of going stale?

| Metric | How to Calculate |
|--------|-----------------|
| Stuck deals | Deals where `days_in_current_stage` > 2× average for that stage, OR > `expected_cycle_days` total |
| No activity deals | Deals where `last_activity_date` > 14 days ago |
| Aging deals | Deals where `total_age_days` > 1.5× `expected_cycle_days` |
| At-risk revenue | Sum of `amount` for stuck + no activity + aging deals |
| Concentration risk | Any single deal > 30% of total pipeline value |

**Stuck deal threshold:** A deal is "stuck" if it's been in its current stage for more than 2× the average time deals spend in that stage. If we don't have enough data for stage averages, use these defaults:

| Stage | Expected Max Days |
|-------|------------------|
| Lead | 3 days |
| Meeting Booked | 7 days |
| Meeting Held | 5 days |
| Qualified | 10 days |
| Proposal Sent | 14 days |
| Negotiation | 14 days |

**Output:**
```
stuck_and_at_risk: {
  stuck_deals: [
    {
      name: string
      company: string
      stage: string
      days_in_stage: integer
      expected_max_days: integer
      owner: string | null
      amount: number | null
      last_activity: string | null
      recommended_action: string      # "Follow up", "Ask for timeline", "Qualify out"
    }
  ]
  no_activity_deals: [
    {
      name: string
      company: string
      stage: string
      days_since_activity: integer
      owner: string | null
      recommended_action: string
    }
  ]
  at_risk_revenue: number | null
  concentration_risks: [
    { deal_name: string, amount: number, percentage_of_pipeline: percentage }
  ] | null
}
```

---

#### Analysis 6: Win/Loss Analysis

**Questions answered:** What's our win rate? Why are we losing deals?

| Metric | How to Calculate |
|--------|-----------------|
| Win rate | Won / (Won + Lost) for deals closed in period |
| Win rate by source | Group by source |
| Win rate by owner | Group by rep |
| Average deal size (won) | Avg `amount` of won deals |
| Average time to close | Avg days from created to closed won |
| Top loss reasons | Group `loss_reason`, count |
| Loss stage distribution | At which stage are deals most often lost? |
| vs. Prior period | Compare win rate |
| vs. Target | Compare to `target_win_rate` if set |

**Output:**
```
win_loss: {
  deals_won: integer
  deals_lost: integer
  win_rate: percentage
  vs_prior_period: percentage_change | null
  vs_target: { target: percentage, actual: percentage } | null
  avg_deal_size_won: number | null
  avg_days_to_close: float
  win_rate_by_source: [ { source: string, win_rate: percentage, count: integer } ]
  win_rate_by_owner: [ { owner: string, win_rate: percentage, count: integer } ] | null
  top_loss_reasons: [
    { reason: string, count: integer, percentage: percentage }
  ]
  loss_by_stage: [
    { stage: string, lost_count: integer, percentage: percentage }
  ]
}
```

---

#### Analysis 7: Forecast & Coverage

**Questions answered:** Are we going to hit our number? Do we have enough pipeline to cover the target?

Only run this analysis if `target_pipeline_value` or revenue targets are configured.

| Metric | How to Calculate |
|--------|-----------------|
| Pipeline coverage ratio | Weighted pipeline / remaining quota |
| Commit forecast | Sum of deals in Negotiation + Proposal stage |
| Best case forecast | Commit + Qualified deals × historical win rate |
| Gap to target | Target - best case forecast |
| Required deals to close gap | Gap / average deal size |
| Required meetings to close gap | Required deals / historical meeting-to-close rate |

**Output:**
```
forecast: {
  target: number
  commit_forecast: number
  best_case_forecast: number
  gap_to_target: number
  pipeline_coverage_ratio: float     # 3x+ is healthy, <2x is risky
  deals_needed_to_close_gap: integer
  meetings_needed_to_close_gap: integer
  coverage_assessment: "Healthy (3x+)" | "Adequate (2-3x)" | "At risk (<2x)" | "Critical (<1x)"
} | null
```

---

### Output Contract (Full Analysis)

```
analysis: {
  period: { type, start_date, end_date }
  volume: { ... }
  qualification: { ... }
  source_attribution: { ... }
  stage_analysis: { ... }
  stuck_and_at_risk: { ... }
  win_loss: { ... }
  forecast: { ... } | null
}
```

No human checkpoint after this step — the analysis feeds directly into report generation.

---

## Step 3: Generate Report

**Purpose:** Transform the raw analysis into two report formats: an executive summary and a detailed diagnostic. Pure LLM reasoning.

### Input Contract

```
analysis: { ... }                     # From Step 2
benchmarks: { ... } | null            # From config
```

### Executive Summary Format

One page. Numbers and trends. What a founder or sales leader needs to see in 60 seconds.

```
# Pipeline Review — [Period Type]: [Start Date] to [End Date]

## Snapshot
| Metric | This Period | Prior Period | Change |
|--------|------------|-------------|--------|
| Meetings booked | X | Y | +/-Z% |
| Meetings held | X | Y | +/-Z% |
| Qualification rate | X% | Y% | +/-Z pts |
| Win rate | X% | Y% | +/-Z pts |
| Pipeline value | $X | $Y | +/-Z% |
| Avg deal size | $X | $Y | +/-Z% |
| Avg days to close | X | Y | +/-Z |

## Red Flags
- [Any metric trending down significantly]
- [Stuck deals above threshold]
- [Pipeline coverage below 2x]
- [Single source >60% of pipeline]
- [No-show rate above 20%]

## Green Lights
- [Metrics trending up]
- [Sources performing well]
- [Stages moving faster than expected]

## Top 3 Actions
1. [Most impactful thing to do this week]
2. [Second most impactful]
3. [Third most impactful]
```

### Detailed Diagnostic Format

Full data tables, charts (as markdown tables), and commentary.

```
# Pipeline Diagnostic — [Period]

## 1. Volume
[Volume metrics table]
[Commentary: is volume on track? Trending up or down? Meeting goals?]

## 2. Qualification
[Qualification breakdown table]
[Disqualification reasons table]
[Commentary: are we meeting with the right people? Common DQ reasons to address?]

## 3. Source Effectiveness
[Source attribution table — sorted by qualification rate]
[Commentary: which channels are working? Which are wasting time?
 Where should we invest more? Where should we cut?]

## 4. Stage Distribution & Velocity
[Stage breakdown table with counts, revenue, avg days, conversion rates]
[Commentary: where is the pipeline fat? Where is it thin?
 Is velocity healthy or slowing?]

## 5. Stuck Deals
[Stuck deals table with recommended actions]
[No-activity deals table]
[Commentary: total at-risk revenue, common patterns in stuck deals]

## 6. Win/Loss Analysis
[Win rate table — overall, by source, by owner]
[Loss reasons table]
[Loss by stage table]
[Commentary: why are we losing? At which stage? Any patterns?]

## 7. Forecast & Coverage (if targets set)
[Forecast table]
[Coverage assessment]
[Commentary: will we hit the number? What needs to happen?]

## Recommendations
[Numbered list of specific, actionable recommendations based on the data.
 Each recommendation should cite the specific data point that drives it.]
```

### Recommendations Logic

Generate recommendations based on patterns found in the analysis:

| Pattern | Recommendation |
|---------|---------------|
| Qualification rate <40% | "Review ICP targeting — we're meeting with too many unqualified prospects. Top DQ reason is [X]. Consider tightening [source/criteria]." |
| No-show rate >20% | "Implement meeting confirmation flow — send reminders 24h and 1h before. Current no-show rate of X% is costing Y meetings/period." |
| One source >60% of pipeline | "Diversify lead sources — [source] drives X% of pipeline. If this channel underperforms, pipeline collapses. Test [alternative channels]." |
| High-quality source with low volume | "Scale [source] — it has a X% qualification rate (best in pipeline) but only Y% of volume. Invest more here." |
| Deals stuck in a specific stage | "Unblock [stage] — X deals averaging Y days (2× normal). Common pattern: [observation]. Recommended: [specific action]." |
| Win rate declining | "Win rate dropped from X% to Y%. Top loss reason shifted to [Z]. Consider: [specific response]." |
| Pipeline coverage <2x | "Pipeline coverage is [X]x against [target]. Need Z more qualified deals to close the gap. At current conversion rates, that requires W meetings." |
| Average cycle lengthening | "Deals are taking X days longer to close vs. prior period. Bottleneck is at [stage]. Consider: [specific action to accelerate]." |
| High loss rate at specific stage | "X% of losses happen at [stage]. This suggests [interpretation]. Consider: [action]." |

### Output Contract

```
report: {
  executive_summary: string           # Markdown formatted
  detailed_diagnostic: string         # Markdown formatted
  recommendations: [
    {
      priority: "high" | "medium" | "low"
      area: string                    # "volume", "qualification", "source", "velocity", "stuck", "win_loss", "forecast"
      recommendation: string
      data_point: string              # The specific metric that drove this recommendation
      expected_impact: string         # What fixing this would do
    }
  ]
  stuck_deal_actions: [
    {
      deal_name: string
      company: string
      action: string
      owner: string | null
    }
  ]
}
```

### Human Checkpoint

Present the executive summary first, then offer the detailed diagnostic:

```
[Executive Summary rendered]

---

Full detailed diagnostic is also available.

Actions from this review:
1. [High priority recommendation]
2. [High priority recommendation]
3. [Medium priority recommendation]

Stuck deals requiring immediate attention:
| Deal | Company | Stage | Days Stuck | Action |
|------|---------|-------|------------|--------|
| ... | ... | ... | ... | ... |

Want to see the full diagnostic? Or take action on any of these recommendations?
```

---

## Step 4: Export & Share (Optional)

**Purpose:** Save the report and optionally push it to the user's preferred location.

### Process

Based on user preference:

| Destination | How |
|-------------|-----|
| **Markdown file** | Save to the current working directory |
| **Google Sheets** | Export data tables to a sheet (metrics, deal list, source breakdown) |
| **Notion** | Push to a Notion database page via Notion MCP |
| **Slack** | Send executive summary to a channel |
| **Email** | Send via AgentMail API (agentmail.dev) or other email API |
| **stdout** | Just display it (default) |

---

## Execution Summary

| Step | Tool Dependency | Human Checkpoint | Typical Time |
|------|----------------|-----------------|--------------|
| 0. Config | None | First run only | 5 min (once) |
| 1. Pull Data | Configurable (CRM API, CSV, Supabase, etc.) | Verify data looks correct | 1-2 min |
| 2. Analyze | None (computation + LLM reasoning) | None — feeds directly to report | Automatic |
| 3. Generate Report | None (LLM reasoning) | Review executive summary, drill into details | 5-10 min |
| 4. Export | Configurable (file, Sheets, Notion, etc.) | Optional | 1 min |

**Total human review time: ~10-15 minutes** for a full pipeline review that would normally take 30-60 minutes of manual CRM digging.

---

## Adapting to Data Availability

Not every CRM has every field. The analysis degrades gracefully:

| Missing Field | What Gets Skipped | Analysis Still Works? |
|--------------|-------------------|----------------------|
| `amount` | Revenue metrics, weighted pipeline, forecast | Yes — volume and stage analysis still run |
| `source` | Source attribution (Analysis 3) | Yes — everything else still runs |
| `loss_reason` | Loss reason breakdown | Yes — win/loss rate still calculates |
| `owner` | Per-rep analysis | Yes — aggregate metrics still run |
| `last_activity_date` | No-activity deal detection | Partially — stuck deals still detected via stage duration |
| `close_date` | Velocity, avg days to close | Partially — stage distribution still works |
| Comparison period data | Period-over-period trends | Yes — single period analysis still produces full report |

**Minimum viable data for a useful report:** Deal name + Stage + Created date. Everything else enriches but isn't required.

---

## Cadence Guide

| Review Type | Period | Audience | Focus |
|-------------|--------|----------|-------|
| **Weekly standup** | Last 7 days | Sales team | Volume, stuck deals, this week's priorities |
| **Fortnightly review** | Last 14 days | Sales leader | Qualification, source effectiveness, trends |
| **Monthly review** | Last 30 days | Founder / VP Sales | Full diagnostic, win/loss, forecast |
| **Quarterly business review** | Last 90 days | Leadership / Board | Trends, unit economics, strategic recommendations |

The report depth automatically scales with the period length. A weekly review emphasizes volume and stuck deals. A quarterly review emphasizes trends, conversion rates, and strategic patterns.

---

## Tips

- **Run this at a consistent cadence.** The value compounds — trends only become visible when you have multiple data points. A monthly review is 10x more useful when you can compare to the last 3 months.
- **Don't skip the stuck deals section.** This is where the immediate ROI lives. Every stuck deal surfaced and unblocked is revenue accelerated.
- **Source attribution is the highest-leverage insight.** Knowing that LinkedIn generates 3x the qualification rate of cold email means you should shift budget and effort. Most teams never run this analysis.
- **Watch for vanity metrics.** "We booked 40 meetings" means nothing if qualification rate is 15%. Volume without quality is a waste of everyone's time.
- **The no-show rate is a hidden leak.** Most teams track meetings booked but not meetings held. A 25% no-show rate means 1 in 4 meetings is wasted effort. Fix with confirmation sequences.
- **Pipeline coverage below 2x is a red flag.** If you need $100K this quarter and your weighted pipeline is $150K, you probably won't make it. Healthy is 3x+.
- **Loss reason data is only useful if reps actually fill it in.** If 80% of losses say "Other" or are blank, the loss analysis is meaningless. Fix data hygiene first.
