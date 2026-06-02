---
name: trial-conversion-diagnostic
version: 1.0.0
description: Diagnose why free trials, freemium signups, or product-led onboarding are not converting into paid customers, then produce a prioritized activation and conversion experiment plan.
tags: [research]
---

# Trial Conversion Diagnostic

Use this composite when a user wants to improve free trial, freemium, self-serve, or product-led conversion. It combines funnel data, activation behavior, onboarding friction, lifecycle messaging, pricing signals, and customer language into a practical experiment plan.

## Trigger Phrases

Load this skill when the user asks for help with trial conversion, free trial drop-off, signup to paid conversion, freemium monetization, product-led growth, activation, onboarding completion, aha moment discovery, or why users sign up but do not pay.

Do not use this skill for pure ad campaign analysis, pure churn prevention, or pure inbound lead routing unless the product trial or freemium journey is the central problem.

## Core Outcome

Produce a short diagnostic and a ranked plan that answers:

- Where users are dropping before paid conversion.
- Which user segments are most likely to convert.
- Which activation behaviors predict payment.
- What onboarding, messaging, pricing, or sales-assist changes should be tested first.
- What evidence would prove each recommendation worked.

## Intake

Ask only for the missing context needed to start. If the user already provided data, proceed and state assumptions.

Required context:

- Product and target customer.
- Trial, freemium, or self-serve model.
- Current conversion goal, such as signup to activated, activated to paid, or trial to paid.
- Date range and user segment, if relevant.
- Available data sources, such as product analytics, billing exports, CRM records, support tickets, sales notes, lifecycle emails, onboarding screens, or user interviews.

Useful optional context:

- Activation definition currently used by the team.
- Pricing and packaging.
- Trial length or free plan limits.
- Existing onboarding steps and lifecycle messages.
- Known customer objections.
- Any recent product or pricing changes.

## Analysis Flow

### 1. Map the Journey

Create a plain-language journey from first signup through paid conversion. Include only steps that users actually experience.

Typical stages:

- Signup completed.
- First meaningful setup action.
- First value moment.
- Repeat usage or collaboration.
- Upgrade prompt or sales handoff.
- Payment or paid plan activation.

For each stage, capture the owner, available evidence, expected user intent, and likely friction.

### 2. Validate the Activation Definition

Check whether the current activation metric is close to real product value. A good activation signal should be observable, reachable early, correlated with paid conversion, and meaningful to the user.

Classify the activation definition as:

- Strong: tied to a real value moment and measurable.
- Weak: easy to measure but not clearly tied to value.
- Missing: no explicit activation definition.
- Too late: happens after users have already decided whether to continue.
- Too broad: counts low-intent behavior as success.

If the definition is weak, propose one or two stronger alternatives and explain what event or evidence would confirm them.

### 3. Segment Before Averaging

Do not rely on blended conversion rates alone. Segment users before drawing conclusions.

Useful cuts:

- Acquisition source or campaign.
- Persona, company size, or use case.
- Signup intent, such as invite, demo, template, integration, or content.
- Plan type, geography, or team size.
- Completed setup path.
- Usage depth in the first day, week, and trial period.

Highlight segments where conversion is unusually high or low. Treat those differences as clues, not final answers.

### 4. Diagnose Drop-Off

For each major drop-off point, identify the most likely cause and the evidence behind it.

Common causes:

- Unclear promise before signup.
- Setup requires too much work before value.
- Empty-state experience does not guide the next action.
- Integration or import step blocks progress.
- The product has value, but the paid trigger arrives before trust is built.
- Pricing packaging does not match the user's first job.
- Lifecycle messages repeat generic nudges instead of responding to actual behavior.
- Human help arrives too late for high-intent accounts.

Separate observed evidence from hypotheses. When evidence is missing, recommend the smallest data pull or interview that would reduce uncertainty.

### 5. Review Onboarding and Lifecycle Touches

Inspect onboarding screens, empty states, checklists, product nudges, emails, chat messages, and sales-assist triggers if available.

Score each touch on:

- Clarity: the user knows what to do next.
- Relevance: the message matches the user's goal or segment.
- Value orientation: it points to a concrete outcome, not just a feature.
- Timing: it arrives when the user can still act.
- Friction: it reduces effort instead of adding steps.

Flag redundant, generic, or mistimed touches. Preserve touches that help users reach value faster.

### 6. Connect Pricing to Usage

Review whether the paid conversion ask matches the value the user has already experienced.

Look for:

- Upgrade gates before the user sees enough value.
- Free limits that hide the core value instead of demonstrating it.
- Paid plan names that do not map to buyer jobs.
- Missing proof near the upgrade moment.
- Enterprise leads trapped in a self-serve flow when sales-assist would help.
- Small teams pushed toward high-friction sales motion when self-serve would work better.

Recommend pricing or packaging tests only when they connect directly to observed behavior.

### 7. Build the Experiment Plan

Rank recommendations by likely impact, confidence, effort, and speed to learn.

Each experiment should include:

- Target segment.
- Hypothesis.
- Change to make.
- Metric that should move.
- Guardrail metric.
- Minimum readout period or sample threshold.
- Owner or function.
- Evidence needed to keep, iterate, or stop.

Prefer a small number of decisive experiments over a long list of vague improvements.

## Output Format

Return:

- Executive summary with the primary conversion bottleneck.
- Journey map with drop-off points.
- Activation definition assessment.
- Segment insights.
- Ranked root causes.
- Experiment plan for the next two to four weeks.
- Data gaps and fastest ways to close them.
- Suggested dashboard or tracking changes.

Keep recommendations concrete. Avoid generic advice such as improve onboarding, send more emails, or optimize pricing unless the recommendation names the exact user, moment, message, and metric.

## Quality Bar

The final answer is only useful if a growth, product, or founder team can take action without another strategy meeting. Every recommendation should tie back to observed evidence, a named user segment, and a measurable conversion step.

If the data is too thin, produce a discovery plan rather than pretending certainty. Name the three fastest evidence pulls that would make the diagnostic reliable.
