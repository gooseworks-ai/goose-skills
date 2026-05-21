---
name: win-loss-analysis
version: 1.0.0
description: Analyze won and lost deals using CRM data, sales notes, buyer feedback, competitor context, and pricing signals to explain why deals close or slip and produce a revenue improvement plan.
tags: [research]
---

# Win Loss Analysis

Use this composite when a user wants to understand why deals are won, why deals are lost, and what the team should change in positioning, qualification, pricing, enablement, or sales process. It turns scattered CRM fields, call notes, buyer language, and competitive context into a grounded win-loss diagnosis.

## When to Load

Load this skill when the user asks for win loss analysis, lost deal analysis, closed won review, closed lost review, loss reason synthesis, competitive loss analysis, sales postmortem, pipeline quality diagnosis, or why win rate changed.

Do not use this skill for a generic pipeline forecast unless the user specifically wants to explain deal outcomes. Use pipeline review first when the primary task is coverage, stage aging, or forecast hygiene.

## Outcome

Deliver a concise report that answers:

- Which patterns separate won deals from lost deals.
- Which loss reasons are real versus convenient CRM labels.
- Which competitors, objections, pricing issues, or missing capabilities most often change outcomes.
- Which segments should be prioritized, avoided, or handled differently.
- Which playbook, messaging, pricing, enablement, or qualification changes are most likely to improve win rate.

## Intake

Ask for only the missing information needed to begin. If the user provides partial data, proceed and mark confidence levels.

Core inputs:

- Date range.
- Deal population, such as all closed deals, one segment, one region, one product line, or one sales team.
- CRM export or deal list with outcome, amount, stage history, close date, owner, source, segment, competitor, and loss reason if available.
- Sales notes, call summaries, buyer emails, support notes, or interview transcripts.
- Current ICP, positioning, pricing, and qualification criteria.

Optional inputs:

- Competitor battlecards.
- Product usage or trial behavior before purchase.
- Proposal or quote history.
- Discounting data.
- Implementation requirements.
- Renewal or expansion outcomes for closed-won accounts.

## Analysis Flow

### 1. Define the Comparison Set

Start by defining the population being compared. Separate closed-won, closed-lost, no-decision, churn-before-close, and disqualified deals if the data allows.

Avoid comparing unlike deals. Segment by customer type, deal size, acquisition channel, product line, geography, sales motion, and time period before drawing conclusions.

If sample size is small, say so clearly and treat findings as directional.

### 2. Clean the Outcome Data

Normalize messy CRM fields before analysis.

Check for:

- Loss reasons that are too broad, such as no budget or not interested.
- Missing competitor values.
- Deals marked closed lost when they were actually unqualified.
- Deals marked no decision but counted as competitive losses.
- Duplicate accounts or reopened opportunities.
- Owner-entered notes that contradict the selected loss reason.

Create a cleaned outcome taxonomy. Keep the original CRM labels available, but do not trust them blindly.

### 3. Compare Won Versus Lost Deals

Find patterns across the deal population.

Compare:

- Account fit and segment.
- Buyer persona and seniority.
- Pain severity and urgency.
- Source or campaign.
- First meeting quality.
- Time to first value or proof.
- Number of stakeholders.
- Executive involvement.
- Security, legal, or procurement friction.
- Pricing and discounting.
- Competitor present.
- Product capability gaps.
- Implementation complexity.

Separate correlation from likely cause. A pattern is only a recommendation if it points to a decision the team can change.

### 4. Extract Buyer Language

Read notes, emails, call summaries, and interview snippets for the words buyers used.

Classify buyer language into:

- Positive value signals.
- Urgency signals.
- Trust signals.
- Decision criteria.
- Objections.
- Confusion.
- Competitor comparisons.
- Pricing concerns.
- Implementation concerns.
- No-decision signals.

Quote short phrases only when they reveal the buyer's actual decision logic. Summarize repeated language instead of over-quoting.

### 5. Diagnose Loss Reasons

For every major loss category, identify the real underlying cause.

Common real causes:

- Poor fit that should have been disqualified earlier.
- Pain was not urgent enough.
- The buyer understood the product but did not trust the proof.
- The champion lacked power.
- Pricing was not aligned with perceived value.
- A competitor owned the key decision criterion.
- Required feature or integration was missing.
- Implementation risk felt too high.
- The sales process failed to create a clear next step.
- The buyer stayed with the status quo.

Label each cause as preventable, partially preventable, or not preventable. This keeps the team from wasting energy on losses it should accept.

### 6. Analyze Wins Without Romanticizing Them

Wins are not automatically proof that the sales process is good. Identify what actually made the deal work.

Look for:

- A strong trigger event.
- Clear pain with a deadline.
- High-fit use case.
- Strong champion.
- Executive buyer involvement.
- Proof or reference that reduced risk.
- Simple implementation path.
- Pricing that matched value.
- Competitor weakness.
- Product usage before purchase.

Capture what should be repeated and what was luck.

### 7. Identify Segment Strategy Changes

Turn patterns into go-to-market choices.

Recommend:

- Segments to pursue harder.
- Segments to qualify out sooner.
- Segments that need different messaging.
- Segments that need sales-assist, founder involvement, or solution engineering.
- Segments where self-serve or lower-touch motion is better.
- Competitor matchups that deserve dedicated battlecards.

Tie each recommendation to observed win-rate, deal-size, cycle-time, or buyer-language evidence.

### 8. Build the Improvement Plan

Rank changes by revenue impact, confidence, effort, and time to learn.

Possible changes:

- Update qualification questions.
- Rewrite discovery prompts.
- Add proof near a recurring trust objection.
- Create or update a battlecard.
- Change pricing packaging or discount guardrails.
- Add a sales-assist trigger.
- Add product or integration proof to the sales process.
- Adjust handoff between marketing, sales, and customer success.
- Stop pursuing a low-fit segment.
- Create a reactivation path for recoverable lost deals.

Each recommendation must name the deal segment, the observed pattern, the proposed change, the owner, and the success metric.

## Output Format

Return:

- Executive summary with the most important win and loss drivers.
- Data quality note and confidence level.
- Cleaned outcome taxonomy.
- Won versus lost comparison.
- Buyer-language themes.
- Top preventable losses.
- Top repeatable win factors.
- Competitor and pricing findings.
- Segment strategy recommendations.
- Ranked improvement plan.
- CRM and tracking changes needed for better future analysis.

## Quality Bar

Do not produce a list of generic sales tips. A useful win-loss analysis should make the team more selective, sharper in messaging, better at proving value, and clearer about which losses are worth preventing.

When evidence is weak, say what is weak and propose the smallest next evidence pull, such as five lost-deal interviews, a notes export for one segment, or a competitor-tag cleanup. Do not pretend noisy CRM fields are truth.
