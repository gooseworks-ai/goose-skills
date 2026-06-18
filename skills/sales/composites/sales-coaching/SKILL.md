---
name: sales-coaching
version: 1.0.0
description: >
  AI sales coach composite. Analyzes all available sales data — email campaigns,
  call recordings/transcripts, reply patterns, pipeline outcomes — to identify
  what the user does well, where they struggle, and how to improve. Finds
  patterns in top-performing emails, winning call techniques, successful objection
  handles, and deal progression. Produces personalized coaching recommendations
  based on their specific product, market, and selling style. Tool-agnostic.
tags: [research]
---

# Sales Coaching

An AI coach that studies everything you do in sales — your emails, your calls, your deals — finds the patterns in what works and what doesn't, and gives you specific, actionable coaching to get better.

This isn't generic sales advice ("always be closing"). It's coaching derived from YOUR data: your top-performing emails, your winning calls, your successful deal patterns, your most common objection fumbles, and your specific product's market.

**What makes this different from `sequence-performance`:**

| Composite | Focus | Output |
|-----------|-------|--------|
| `sequence-performance` | How is this campaign doing? | Campaign metrics + copy diagnosis |
| `sales-coaching` | How can THIS person sell better? | Personal skill assessment + coaching plan |

The other composite analyzes the work. This one coaches the worker.

## When to Auto-Load

Load this composite when:
- User says "how can I improve my sales", "coach me", "what am I doing wrong", "sales coaching", "help me sell better"
- User says "review my selling style", "analyze my calls", "what patterns do you see in my sales"
- User asks "why am I losing deals", "why aren't people responding", "what are my best emails doing differently"
- After a bad quarter/month and the user wants to diagnose personal performance
- As a periodic (monthly/quarterly) self-improvement exercise

---

## Step 0: Configuration (One-Time Setup)

### User Profile

| Question | Purpose | Stored As |
|----------|---------|-----------|
| What is your role? | Calibrate coaching level | `user_role` |
| How long have you been in sales? | Experience-appropriate advice | `experience_level` |
| What do you sell? (product/service, 2-3 sentences) | Context for all analysis | `product_description` |
| What's your average deal size? | Calibrate what matters | `avg_deal_size` |
| What's your typical sales cycle? | Calibrate velocity expectations | `sales_cycle_days` |
| What do you think your biggest weakness is? | Starting point for coaching | `self_assessed_weakness` |

**Role options:**
- `"sdr"` — Focus on prospecting, outreach, qualification, meeting booking
- `"ae"` — Focus on discovery, demos, negotiation, closing
- `"founder"` — Focus on everything (wearing multiple hats)
- `"sales_leader"` — Focus on team patterns, not just individual

### Data Sources

| Question | Options | Stored As |
|----------|---------|-----------|
| Where are your email campaigns? | Smartlead / Instantly / Outreach / CSV | `email_tool` |
| Where are your call recordings/transcripts? | Gong / Chorus / Fireflies / Otter / local files / none | `call_tool` |
| Where is your pipeline? | Salesforce / HubSpot / Pipedrive / Close / Supabase | `crm_tool` |
| Do you have call transcripts available? | Yes (path or tool) / No | `transcripts_available` |
| How far back should we analyze? | 30 / 60 / 90 / 180 days | `analysis_window` |

**Store config** in the current working directory or wherever the user prefers.

---

## Step 1: Collect Sales Data

**Purpose:** Pull all available sales data for analysis. The more data types available, the richer the coaching. But the system works with whatever is available.

### Input Contract

```
data_sources: { ... }                 # From config
analysis_window: integer              # Days to look back
user_role: string                     # From config
```

### Data Collection Matrix

| Data Type | What to Pull | What It Reveals |
|-----------|-------------|----------------|
| **Email campaigns** | All campaigns in window — copy, metrics, replies | Writing quality, messaging effectiveness, personalization skill |
| **Email replies** | Full reply text, classification | Objection handling, how prospects respond to you |
| **Call recordings/transcripts** | Full transcripts or recordings | Talk-to-listen ratio, discovery skill, objection handling, closing technique |
| **Pipeline deals** | All deals in window — stage, outcome, timeline | Deal management, velocity, where deals stall or die |
| **Meeting notes** | Post-call notes (if available) | Follow-through, note-taking discipline |
| **Calendar** | Meetings booked, held, no-shows | Time management, meeting quality |

**Pull from each configured source:**

#### Email Data
```
email_data: {
  campaigns: [
    {
      name: string
      date_range: { start: string, end: string }
      sequence: [
        {
          touch: integer
          subject: string
          body: string
          sent: integer
          opens: integer
          replies: integer
        }
      ]
      replies: [
        {
          sender: string
          sender_title: string
          reply_text: string
          category: string            # positive, objection, not interested, etc.
          touch_triggered: integer
        }
      ]
    }
  ]
  total_campaigns: integer
  total_emails_sent: integer
  total_replies: integer
  overall_reply_rate: percentage
}
```

#### Call Data
```
call_data: {
  calls: [
    {
      date: string
      prospect_name: string
      prospect_company: string
      call_type: string               # discovery, demo, follow-up, negotiation
      duration_minutes: integer
      transcript: string | null       # Full transcript if available
      recording_url: string | null    # Recording link if available
      outcome: string                 # "next step agreed", "no next step", "closed won", "closed lost"
      notes: string | null            # Post-call notes
    }
  ]
  total_calls: integer
  avg_duration: float
  outcome_distribution: { ... }
}
```

#### Pipeline Data
```
pipeline_data: {
  deals: [
    {
      name: string
      company: string
      stage: string
      created_date: string
      close_date: string | null
      outcome: "open" | "won" | "lost"
      loss_reason: string | null
      amount: number | null
      days_in_pipeline: integer
      source: string | null           # How the deal originated
      touches_before_close: integer | null
    }
  ]
  total_deals: integer
  win_rate: percentage
  avg_cycle_days: float
  avg_deal_size: number | null
}
```

### Output Contract

```
collected_data: {
  email_data: { ... } | null
  call_data: { ... } | null
  pipeline_data: { ... } | null
  data_richness: "full" | "partial" | "minimal"
  data_summary: string                # "Analyzing X campaigns, Y calls, Z deals over N days"
}
```

### Human Checkpoint

```
## Data Collected

| Source | Available | Volume |
|--------|-----------|--------|
| Email campaigns | Yes | X campaigns, Y emails sent, Z replies |
| Call transcripts | Yes/No | X calls, Y hours |
| Pipeline deals | Yes | X deals (W won, L lost, O open) |

Analysis window: [start] to [end]
Data richness: [full/partial/minimal]

Proceed with analysis? (Y/n)
```

---

## Step 2: Analyze Email Performance Patterns

**Purpose:** Go beyond campaign-level metrics. Find patterns in what makes YOUR best emails work and YOUR worst emails fail. Pure LLM reasoning.

### Process

#### A) Identify Top-Performing Emails

Across all campaigns, find:
- **Highest reply-rate subject lines** — What do they have in common?
- **Highest reply-rate email bodies** — What patterns exist?
- **Emails that generated positive replies** — What specifically triggered interest?
- **Emails that generated meetings** — The gold standard. What did these say?

For each top performer, extract:

| Pattern Element | What to Look For |
|----------------|-----------------|
| Subject line structure | Signal-reference? Question? Peer-framing? Length? |
| Opening line | Lead with them or with you? Signal reference? Question? Statement? |
| Body structure | How many paragraphs? Proof point placement? Length? |
| Personalization depth | Tier 1/2/3? What was personalized? |
| CTA type | Specific ask? Open-ended? Time-bound? |
| Tone | Casual? Professional? Provocative? Empathetic? |
| Framework used | PAS? BAB? Signal-Proof-Ask? AIDA? |
| Proof point type | Customer name? Metric? Case study? |

#### B) Identify Worst-Performing Emails

Same analysis on the bottom performers:
- What do low-reply emails have in common?
- Are there anti-patterns? (Long emails, generic openers, weak CTAs, no proof)
- Is there a consistent flaw across campaigns?

#### C) Compare Winners vs. Losers

| Dimension | Top 20% Emails | Bottom 20% Emails | Gap |
|-----------|---------------|-------------------|-----|
| Avg word count | [X] | [Y] | [shorter/longer] |
| Subject line length | [X chars] | [Y chars] | [delta] |
| Opens with "I" or "We" | [X%] | [Y%] | [self-focused vs. prospect-focused] |
| Contains proof point | [X%] | [Y%] | [proof usage gap] |
| Personalization tier | [avg tier] | [avg tier] | [personalization gap] |
| CTA clarity | [assessment] | [assessment] | [delta] |
| Has signal reference | [X%] | [Y%] | [signal usage gap] |

#### D) Objection Pattern Analysis

Across all replies classified as objections:

| Analysis | What It Reveals |
|----------|----------------|
| Most common objection | What you're running into most often |
| Objection by campaign/audience | Is targeting driving objections? |
| How you handle each objection (from follow-up emails) | Are your handles effective? |
| Objections that lead to meetings vs. dead ends | Which objections are actually handleable? |
| Objection language patterns | Exact words prospects use (copy these into your messaging) |

#### E) Reply Sentiment Analysis

| Category | Count | % | Trend |
|----------|-------|---|-------|
| Positive interest | X | Y% | +/- vs. earlier campaigns |
| Warm / curious | X | Y% | |
| Objection (handleable) | X | Y% | |
| Objection (terminal) | X | Y% | |
| Not interested | X | Y% | |
| Auto-reply | X | Y% | |

**Key question:** Is the ratio of positive-to-negative replies improving over time? Are you getting better at writing emails that generate interest, or are you stagnating?

### Output Contract

```
email_patterns: {
  top_performers: {
    common_patterns: string[]
    best_subject_lines: [ { subject: string, reply_rate: percentage, pattern: string } ]
    best_openers: [ { opener: string, campaign: string, why_it_works: string } ]
    winning_proof_points: string[]
    winning_ctas: string[]
    winning_tone: string
    winning_framework: string
  }

  bottom_performers: {
    common_anti_patterns: string[]
    worst_subject_lines: [ { subject: string, reply_rate: percentage, issue: string } ]
    common_mistakes: string[]
  }

  winner_vs_loser: {
    dimensions: [ { dimension: string, winners: string, losers: string, gap: string } ]
    biggest_differentiator: string
  }

  objection_patterns: {
    most_common: { objection: string, count: integer, handle_effectiveness: string }
    handleable_objections: [ { objection: string, best_handle: string, conversion_rate: string } ]
    terminal_objections: [ { objection: string, implication: string } ]
  }

  sentiment_trend: {
    direction: "improving" | "stable" | "declining"
    evidence: string
  }

  email_skill_grade: "A" | "B" | "C" | "D" | "F"
  email_skill_summary: string
}
```

---

## Step 3: Analyze Call Performance Patterns

**Purpose:** If call transcripts or recordings are available, analyze how the user performs on calls. If no call data exists, skip this step.

### Process

#### A) Structural Analysis (From Transcripts)

For each call transcript, measure:

| Metric | How to Calculate | What It Reveals |
|--------|-----------------|----------------|
| **Talk-to-listen ratio** | Word count (you) / word count (prospect) | >60% talking = talking too much. Best reps are 40-50% talk. |
| **Longest monologue** | Longest uninterrupted stretch by the seller | >90 seconds = you're lecturing, not selling. Keep it under 60s. |
| **Question count** | Number of questions asked | Discovery calls should have 10-15 questions. <5 = not discovering. |
| **Question depth** | Surface questions ("What do you do?") vs. deep ("What happens when that process breaks?") | Deep questions = strong discovery. Surface = going through motions. |
| **Filler word frequency** | Count of "um", "uh", "like", "you know", "basically", "honestly" | High frequency = lack of confidence or preparation. |
| **Call duration** | Total time | Too short (<15 min for discovery) = not going deep enough. Too long (>45 min) = not controlling the call. |

#### B) Discovery Quality Analysis

From call transcripts, evaluate:

| Dimension | What to Check | Good vs. Bad |
|-----------|--------------|-------------|
| **Pain discovery** | Did you uncover a real pain point? | Good: Prospect describes pain in their own words. Bad: You told them what their pain should be. |
| **Impact quantification** | Did you help them quantify the cost of the problem? | Good: "So that's costing you roughly $X/month." Bad: Never quantified. |
| **Decision process** | Did you ask who else is involved, timeline, budget? | Good: Clear understanding of BANT. Bad: Left the call not knowing. |
| **Current state** | Did you understand how they solve this today? | Good: Know their current tool/process. Bad: No idea what they do now. |
| **Compelling event** | Did you identify why now? | Good: Know the trigger (new leader, funding, deadline). Bad: No urgency established. |
| **Next step** | Did the call end with a clear, mutually agreed next step? | Good: Specific date/time/action. Bad: "Let me think about it" or "I'll follow up." |

#### C) Objection Handling on Calls

For each objection raised during calls:

| Analysis | What to Evaluate |
|----------|-----------------|
| Was the objection acknowledged? | Good: "I hear you, that's a valid concern." Bad: Immediately countering or ignoring. |
| Was it explored? | Good: "Tell me more about that." Bad: Jumped straight to handle. |
| Was the handle relevant? | Good: Addressed their specific concern. Bad: Generic response. |
| Was proof provided? | Good: "Company X had the same concern, here's what happened." Bad: "Trust me." |
| Did the conversation move forward? | Good: Objection resolved, back on track. Bad: Call stalled or ended. |

#### D) Demo / Presentation Analysis

If demo calls exist:

| Dimension | What to Check |
|-----------|--------------|
| **Feature dumping** | Did you show every feature, or only what's relevant to their pain? |
| **"So what?" test** | After showing a feature, did you connect it to their specific need? |
| **Prospect engagement** | Did the prospect speak during the demo, or was it a monologue? |
| **Customization** | Was the demo tailored to their use case, or generic? |
| **Time on product vs. slides** | Were you showing the actual product, or presenting slides? |

#### E) Winning vs. Losing Call Patterns

Compare calls that led to progression (next step, closed won) vs. calls that stalled or lost:

| Dimension | Winning Calls | Losing Calls | Gap |
|-----------|--------------|-------------|-----|
| Talk-to-listen | [ratio] | [ratio] | |
| Questions asked | [count] | [count] | |
| Pain discovered | [yes/no %] | [yes/no %] | |
| Next step agreed | [%] | [%] | |
| Objections surfaced | [count] | [count] | |
| Call duration | [avg min] | [avg min] | |

### Output Contract

```
call_patterns: {
  structural: {
    avg_talk_ratio: percentage
    avg_longest_monologue_seconds: integer
    avg_questions_per_call: float
    filler_word_frequency: "low" | "moderate" | "high"
    common_fillers: string[]
    avg_call_duration: float
  }

  discovery_quality: {
    pain_discovery_rate: percentage    # % of calls where real pain was uncovered
    impact_quantification_rate: percentage
    decision_process_mapped_rate: percentage
    next_step_agreed_rate: percentage
    common_gaps: string[]             # What's consistently missed in discovery
  }

  objection_handling: {
    objections_per_call: float
    acknowledgment_rate: percentage   # % of times objection was properly acknowledged
    exploration_rate: percentage      # % of times the objection was explored before handling
    resolution_rate: percentage       # % of times the objection was successfully handled
    weakest_objection_type: string    # Which type of objection you handle worst
    best_objection_type: string       # Which type you handle best
  }

  demo_quality: {
    feature_dumping_detected: boolean
    prospect_engagement_level: "high" | "moderate" | "low"
    customization_level: "tailored" | "semi-generic" | "generic"
    common_demo_mistakes: string[]
  } | null

  winning_vs_losing: {
    key_differences: [ { dimension: string, winners: string, losers: string } ]
    biggest_predictor: string         # Single biggest differentiator between winning and losing calls
  }

  call_skill_grade: "A" | "B" | "C" | "D" | "F"
  call_skill_summary: string
} | null
```

---

## Step 4: Analyze Deal Patterns

**Purpose:** Look at pipeline data to find patterns in deals you win vs. deals you lose. Pure computation + LLM reasoning.

### Process

#### A) Win/Loss Pattern Analysis

| Dimension | What to Compare (Won vs. Lost) |
|-----------|-------------------------------|
| Source channel | Which channels produce deals that close? |
| Lead persona/title | Which titles convert to closed deals? |
| Industry | Which verticals are you winning in? |
| Company size | What size companies do you close best? |
| Deal size | Do larger deals win more or less often? |
| Sales cycle length | Do faster deals win more? |
| Number of touches | How many interactions before close? |
| Stakeholders involved | Single-threaded vs. multi-threaded |
| Competitive situation | Do you win more in competitive or non-competitive deals? |

#### B) Velocity Analysis

| Pattern | What It Reveals |
|---------|----------------|
| Stage where deals stall longest | Your bottleneck — need to improve skill at this stage |
| Stage where most deals die | Your kill zone — what's going wrong here? |
| Deals that closed fastest | Your "sweet spot" — what do easy wins have in common? |
| Deals that dragged longest before winning | What made these hard? Can you avoid or accelerate? |

#### C) Activity-to-Outcome Correlation

| Activity | Correlation with Winning |
|----------|------------------------|
| More emails before first call | Positive, negative, or no correlation? |
| Faster first response time | Does speed matter? |
| Multi-channel (email + LinkedIn + call) | Do multi-channel deals win more? |
| Number of stakeholders contacted | Does multi-threading help? |
| Follow-up speed after calls | Does fast follow-up predict wins? |

### Output Contract

```
deal_patterns: {
  win_profile: {
    best_source: string
    best_persona: string
    best_industry: string
    best_company_size: string
    avg_winning_cycle_days: float
    avg_touches_to_close: float
    common_traits: string[]
  }

  loss_profile: {
    top_loss_reason: string
    loss_stage: string                # Where deals die most
    common_loss_traits: string[]
    recoverable_losses: string        # "X% of lost deals were timing — could be re-engaged"
  }

  velocity: {
    bottleneck_stage: string
    kill_zone_stage: string
    sweet_spot: string                # Description of your easiest wins
  }

  activity_correlations: [
    { activity: string, correlation: "positive" | "negative" | "none", insight: string }
  ]

  deal_skill_grade: "A" | "B" | "C" | "D" | "F"
  deal_skill_summary: string
}
```

---

## Step 5: Build Skill Assessment & Coaching Plan

**Purpose:** Synthesize email, call, and deal analysis into a personal sales skill assessment and a specific coaching plan. Pure LLM reasoning.

### Input Contract

```
email_patterns: { ... }              # From Step 2
call_patterns: { ... } | null        # From Step 3 (if calls available)
deal_patterns: { ... }               # From Step 4
user_role: string                    # From config
experience_level: string             # From config
product_description: string          # From config
self_assessed_weakness: string       # From config
```

### Skill Assessment Framework

Assess the user across sales skill dimensions relevant to their role:

#### SDR Skill Dimensions

| Dimension | Data Source | What to Evaluate |
|-----------|-----------|-----------------|
| **Prospecting quality** | Email targeting → reply relevance | Are you reaching the right people? |
| **Email copywriting** | Email patterns analysis | Are your emails compelling? |
| **Personalization** | Email patterns analysis | Do you go beyond merge fields? |
| **Signal recognition** | Email campaign angles | Are you using relevant signals? |
| **Objection handling (written)** | Reply analysis, follow-up emails | Do you handle objections well in email? |
| **Qualification** | Pipeline data — qualified vs. unqualified meetings | Are you booking quality meetings? |
| **Follow-up discipline** | Campaign structure, timing, sequence length | Do you follow up effectively? |
| **Volume & consistency** | Activity metrics over time | Are you doing enough, consistently? |

#### AE Skill Dimensions

| Dimension | Data Source | What to Evaluate |
|-----------|-----------|-----------------|
| **Discovery** | Call transcripts — questions asked, pain uncovered | Do you uncover real pain? |
| **Active listening** | Call transcripts — talk ratio, prospect engagement | Do you listen more than talk? |
| **Demo effectiveness** | Call transcripts — feature relevance, engagement | Do you demo to their pain? |
| **Objection handling (verbal)** | Call transcripts — objection resolution rate | Do you handle pushback well? |
| **Negotiation** | Deal data — discount patterns, close rates | Do you protect value? |
| **Deal management** | Pipeline data — velocity, stage progression | Do you move deals forward? |
| **Multi-threading** | Deal data — stakeholders contacted | Do you go wide in accounts? |
| **Closing** | Deal data — win rate, next step agreement | Do you close confidently? |

#### Founder Skill Dimensions

All SDR + AE dimensions, plus:

| Dimension | Data Source | What to Evaluate |
|-----------|-----------|-----------------|
| **Storytelling** | Call transcripts, email copy | Do you tell a compelling product story? |
| **Market positioning** | Email angles, competitive mentions | Do you position well against competition? |
| **Adaptability** | Variation across campaigns and calls | Do you adapt your approach to different prospects? |

### Scoring

For each dimension, assign a grade:

| Grade | Criteria |
|-------|---------|
| **A** | Top quartile performance. Clear strength. Data supports excellence. |
| **B** | Above average. Competent. Minor improvements possible. |
| **C** | Average. Functional but not differentiating. Clear room to grow. |
| **D** | Below average. Consistent issues visible in data. Needs focused work. |
| **F** | Significant weakness. Data shows this is hurting results. Priority fix. |

### Coaching Plan

For each dimension graded C or below, produce:

```
Skill: [dimension name]
Current grade: [grade]
Evidence: [specific data points that drive the grade]
Root cause: [why this is happening — not just what, but why]

Coaching recommendation:
1. [Specific, actionable thing to do differently]
2. [Exercise or practice to build this skill]
3. [Example from their own data of when they did this well vs. poorly]

Model to follow:
[Pull from their own top-performing emails/calls as examples.
"Your email in Campaign X did this perfectly — replicate that approach."]

Measurable goal:
[Specific metric to track improvement. E.g., "Increase question count per
discovery call from 6 to 12 over the next 30 days."]
```

### Personalized Playbook

Distill the user's winning patterns into a personal playbook:

```
## Your Winning Formula

Based on analyzing [X emails, Y calls, Z deals], here's what works for YOU:

### Your Best Email Pattern
Subject line style: [pattern]
Opening approach: [pattern]
Proof point that resonates: [specific proof]
CTA that converts: [specific CTA]
Ideal length: [word count]
Best framework: [framework]

Template (built from your own top performers):
> [Reconstructed template from their best emails]

### Your Best Call Pattern (if calls available)
Discovery approach: [how you open well]
Strongest questions: [questions that work for you]
Objection handle that works: [specific handle]
Demo style that converts: [approach]
Close technique: [how you get next steps]

### Your Win Profile
You close best when:
- The prospect is [title/seniority]
- The company is [size/industry]
- The deal came from [source]
- The cycle is [length]
- You [specific behavior that correlates with winning]
```

### Output Contract

```
skill_assessment: {
  overall_grade: "A" | "B" | "C" | "D" | "F"
  overall_summary: string

  dimensions: [
    {
      name: string
      grade: string
      evidence: string[]
      strength_or_weakness: "strength" | "neutral" | "weakness"
    }
  ]

  top_strengths: [
    { skill: string, evidence: string, advice: string }  # "Keep doing this"
  ]

  top_weaknesses: [
    {
      skill: string
      grade: string
      evidence: string[]
      root_cause: string
      coaching: string[]
      model_from_own_data: string | null
      measurable_goal: string
    }
  ]

  personalized_playbook: {
    best_email_pattern: { ... }
    best_call_pattern: { ... } | null
    win_profile: string
    template_from_top_performers: string
  }

  self_assessment_validation: {
    user_said: string                 # Their self-assessed weakness
    data_says: string                 # What the data actually shows
    aligned: boolean                  # Do they match?
    surprise_finding: string | null   # Something they didn't know about themselves
  }
}
```

---

## Step 6: Generate Coaching Report

**Purpose:** Produce the final coaching report — personal, actionable, and encouraging. Not a performance review. A coaching session.

### Report Structure

```
# Sales Coaching Report — [User Name]
**Based on:** [X emails, Y calls, Z deals] over [analysis window]
**Role:** [SDR/AE/Founder]
**Product:** [what they sell]

---

## Your Sales Scorecard

| Skill | Grade | Trend | Notes |
|-------|-------|-------|-------|
| [skill 1] | [grade] | [improving/stable/declining] | [one-line note] |
| [skill 2] | [grade] | [trend] | [note] |
| ... |

**Overall:** [grade] — [one-sentence summary]

---

## What You're Great At

Your data shows clear strengths in these areas. Keep doing these things.

### 1. [Strength #1]
**Evidence:** [specific data — "Your Signal-Proof-Ask emails generate 2.3x the reply rate of your other emails"]
**Why it works:** [brief explanation]
**Advice:** [How to lean into this strength even more]

### 2. [Strength #2]
**Evidence:** [data]
**Why it works:** [explanation]

### 3. [Strength #3]
...

---

## Where to Improve

These are your highest-impact coaching areas. Focus on one at a time.

### Priority 1: [Biggest Weakness]
**Current grade:** [grade]
**Evidence:** [specific data points — not vague criticism, specific examples]
**Root cause:** [Why this is happening. E.g., "You're asking 4 questions per discovery call. The calls
where you asked 10+ had a 3x higher progression rate. You're not going deep enough on pain."]

**What to do differently:**
1. [Specific, actionable change]
2. [Practice exercise]
3. [Example from their own data: "In your call with [prospect] on [date], you DID do this well — here's the transcript excerpt. Replicate that approach."]

**Your own proof it works:**
> [Quote from their own top-performing email or call where they did this well]

**Goal:** [Measurable goal with timeframe]

### Priority 2: [Second Weakness]
[Same structure]

### Priority 3: [Third Weakness]
[Same structure]

---

## Your Winning Patterns (Personal Playbook)

These patterns come from YOUR best work — not a textbook.

### Your Best Email Template
[Reconstructed from their top-performing emails]

**Subject:** [pattern]
> [Reconstructed body using their winning patterns]

**Why this works for you:** [pattern analysis]

### Your Best Discovery Approach (if calls available)
[Distilled from their winning calls]

1. **Open with:** [how they open their best calls]
2. **Key questions to always ask:** [their best questions]
3. **When you hear [objection], say:** [their best objection handle]
4. **Close the call with:** [how they get next steps in winning calls]

### Your Win Profile
**You close best when:**
- Prospect is [title] at a [size] [industry] company
- Deal came from [source/channel]
- Cycle is [X] days
- You [specific winning behavior]

**You struggle when:**
- Prospect is [profile]
- Deal involves [situation]
- You [specific losing behavior]

---

## Surprise Finding

[Something the data reveals that the user probably doesn't know about themselves.
E.g., "You think your weakness is closing, but your data shows your close rate is
above average. Your actual bottleneck is discovery — you're booking meetings that
aren't qualified. Improving qualification would have 3x more impact than working
on closing technique."]

---

## 30-Day Coaching Plan

| Week | Focus | Exercise | Measurable Target |
|------|-------|----------|-------------------|
| Week 1 | [skill] | [specific exercise] | [metric to hit] |
| Week 2 | [skill] | [exercise] | [metric] |
| Week 3 | [skill] | [exercise] | [metric] |
| Week 4 | Review + adjust | Re-run this analysis | Compare grades |

---

## Check Back In

Run this coaching analysis again in 30 days to measure improvement.
Track these specific metrics:
1. [Metric 1 — current: X, target: Y]
2. [Metric 2 — current: X, target: Y]
3. [Metric 3 — current: X, target: Y]
```

### Tone Guidance

This is a **coaching session**, not a performance review.

| Do | Don't |
|----|-------|
| Celebrate strengths first | Lead with weaknesses |
| Use their own data as examples | Use generic advice |
| Be specific ("your reply rate on Signal-Proof-Ask emails is 2.3x higher") | Be vague ("your emails could be better") |
| Provide exercises and practice | Just say "improve" |
| Show them proof from their own work that they CAN do this | Make it feel like they're failing |
| One priority at a time | Overwhelm with 10 things to fix |
| Frame weaknesses as "highest-impact opportunity" | Call them "failures" |

### Human Checkpoint

```
[Scorecard + top strengths + top weakness rendered]

---

Surprise finding: [the thing they didn't know]

Full coaching report includes:
- Detailed skill assessment across [X] dimensions
- Your winning email template (reconstructed from top performers)
- Your winning call pattern (if call data available)
- Your win profile (what deals you close best)
- 30-day coaching plan with weekly exercises
- Measurable goals to track improvement

View the full coaching report?
```

---

## Execution Summary

| Step | Tool Dependency | Human Checkpoint | Typical Time |
|------|----------------|-----------------|--------------|
| 0. Config | None | First run only | 5 min (once) |
| 1. Collect Data | Configurable (outreach tool, call tool, CRM) | Verify data volume | 2-3 min |
| 2. Email Patterns | None (LLM reasoning) | None — feeds into assessment | Automatic |
| 3. Call Patterns | None (LLM reasoning on transcripts) | None — feeds into assessment | Automatic |
| 4. Deal Patterns | None (computation + LLM reasoning) | None — feeds into assessment | Automatic |
| 5. Skill Assessment | None (LLM reasoning) | None — feeds into report | Automatic |
| 6. Coaching Report | None (LLM reasoning) | Review report | 10-15 min |

**Total human review time: ~15-20 minutes** for coaching that would normally require an experienced sales manager reviewing weeks of activity.

---

## Adapting to Data Availability

| Available Data | Analysis Depth | Report Quality |
|---------------|---------------|----------------|
| Emails + calls + pipeline | Full coaching across all dimensions | Best |
| Emails + pipeline (no calls) | Email skills + deal patterns. Call section skipped. | Good |
| Emails only | Email skills assessment. Deal and call sections skipped. | Partial but still useful |
| Calls + pipeline (no email data) | Call skills + deal patterns. Email section skipped. | Good |
| Pipeline only | Deal patterns only. Limited coaching but still reveals win/loss patterns. | Minimal |

**Minimum viable:** At least one of: email data, call data, or pipeline data.

---

## Tips

- **Run monthly for continuous improvement.** The coaching plan is designed in 30-day cycles. Re-run and compare grades.
- **The "surprise finding" is often the most valuable part.** People's self-assessment of their sales weaknesses is wrong ~60% of the time. The data reveals the real bottleneck.
- **Top-performing email templates from your own data beat any template library.** They've already been tested on your market with your product.
- **If call data is available, prioritize call coaching.** Calls have more surface area for improvement than emails, and call improvements have a higher ROI per fix.
- **The personalized playbook should be saved and reused.** It's a living document that evolves as the user's skills evolve.
- **Share the coaching report with a manager or mentor.** It provides the data for a structured 1:1 coaching conversation.
- **Focus on ONE weakness at a time.** The coaching plan prioritizes. Don't try to fix everything at once — that's how nothing gets fixed.
