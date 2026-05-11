---
name: roi-calculator-builder
description: Build a buyer-facing ROI calculator for B2B SaaS or services from product value props, pricing, customer proof, and buyer assumptions.
tags: [content, research]
---

# ROI Calculator Builder

Build a credible buyer-facing ROI calculator, not a vanity spreadsheet. The output should help a prospect test the business case in their own numbers while giving sales and marketing a defensible asset for conversion, follow-up, and objection handling.

## When to Use

- A team wants an ROI calculator for a website, demo flow, sales deck, proposal, or lead magnet.
- A landing page needs quantified value beyond vague productivity claims.
- Sales needs a simple business-case model for budget conversations.
- Marketing has customer outcomes but no structured calculator.
- A founder wants to turn proof points into an interactive conversion asset.

## Intake

Collect only what is needed to build a defensible model. If an input is missing, state the assumption and mark confidence.

Required:

1. Product or service description.
2. Target buyer and use case.
3. Main outcome the buyer cares about.
4. Pricing or expected annual cost range.
5. At least one source of proof: customer quote, case study metric, benchmark, support data, product analytics, or a clearly stated estimate.

Helpful:

1. Current conversion page or sales deck.
2. Common objections.
3. Existing customer segments.
4. Competitive alternatives.
5. Sales cycle stage where the calculator will be used.
6. Implementation time, onboarding cost, and expected adoption curve.

## Model Design

### Choose the ROI Motion

Pick one primary motion and one secondary motion. Do not mix too many benefit types in the headline calculation.

| Motion | Best For | Core Calculation |
| --- | --- | --- |
| Labor savings | Automation, internal tools, support tooling | hours saved multiplied by loaded hourly cost |
| Revenue lift | Sales, marketing, conversion, retention | incremental volume multiplied by conversion rate and average value |
| Cost avoidance | Security, compliance, infra, risk | expected avoided incidents or spend reduction |
| Speed to value | Ops, product, analytics, devtools | cycle time reduction multiplied by throughput or opportunity value |
| Quality improvement | QA, support, compliance, content | defect reduction multiplied by rework cost or churn impact |
| Headcount leverage | AI agents, workflow automation | workload absorbed divided by equivalent team capacity |

### Set the Buyer Inputs

Use no more than seven buyer-controlled inputs. More than that lowers completion rate.

Preferred input order:

1. Company size or team size.
2. Current volume of the process.
3. Current time or cost per unit.
4. Current conversion, error, or failure rate.
5. Expected improvement percentage.
6. Annual product cost.
7. Implementation or onboarding cost.

For each input define:

- Human label.
- Plain-language helper text.
- Default value.
- Conservative low and high bounds.
- Unit.
- Whether the buyer can edit it.
- Reason for the default.
- Confidence: high, medium, or low.

### Use Conservative Defaults

Default assumptions should be boring and believable. The calculator can include an upside case, but the first result should survive a skeptical buyer review.

Rules:

- Prefer customer-proven values over industry averages.
- Use ranges when evidence is weak.
- Never use the best customer result as the default.
- Show the baseline before the improvement.
- Separate hard savings from soft benefits.
- Include implementation cost if the buyer will think about it anyway.

## Calculation Structure

Create three scenarios:

1. Conservative: low improvement, higher implementation cost, slower adoption.
2. Expected: most likely case based on available evidence.
3. Upside: optimistic but still plausible.

For each scenario calculate:

- Baseline annual cost or lost opportunity.
- Improved annual cost or gain.
- Annual gross benefit.
- Annual product and implementation cost.
- Net benefit.
- Payback period.
- ROI multiple.

Also include a sensitivity table showing which two assumptions drive the result most.

## Credibility Checks

Before writing final copy, run these checks:

1. If the result sounds too large, reduce the default improvement or add adoption ramp.
2. If the model depends on an unverifiable claim, label it as an estimate.
3. If the buyer has to know internal data they likely do not have, replace the input with a simpler proxy.
4. If one input changes the answer by more than half, call it out in the sensitivity section.
5. If savings and revenue lift are both present, avoid double-counting the same improvement.
6. If the product cost is unknown, provide a placeholder and make the calculator ask for it.

## Output

Return a launch-ready brief with these sections.

### 1. Calculator Positioning

- Name of calculator.
- Target buyer.
- Use case.
- Primary promise.
- Best placement: website, demo follow-up, outbound asset, proposal, or customer success review.
- One-sentence CTA.

### 2. Inputs

| Input | Default | Range | Editable | Confidence | Default Rationale |
| --- | --- | --- | --- | --- | --- |
|  |  |  |  |  |  |

### 3. Formula Map

Describe each formula in plain English. Include enough detail for a marketer, sales engineer, or developer to implement it without guessing.

Required formulas:

- Baseline annual cost or opportunity.
- Improvement impact.
- Gross annual benefit.
- Net annual benefit.
- Payback period.
- ROI multiple.

### 4. Scenario Table

| Scenario | Gross Benefit | Total Cost | Net Benefit | Payback | ROI Multiple |
| --- | --- | --- | --- | --- | --- |
| Conservative |  |  |  |  |  |
| Expected |  |  |  |  |  |
| Upside |  |  |  |  |  |

### 5. Buyer-Facing Copy

Include:

- Hero headline.
- Two-sentence explanation.
- Input helper text.
- Result headline.
- Result breakdown labels.
- Disclaimer that the output is an estimate, not a guaranteed result.
- CTA copy.

### 6. Sales Follow-Up

Write:

- Three discovery questions based on the calculator inputs.
- Two objection handles for weak assumptions.
- One follow-up email that references the buyer's calculated result.
- One internal note telling sales which input to inspect first.

### 7. Implementation Notes

Give a concise handoff for whoever builds it:

- State management needs.
- Validation rules.
- Formatting rules for numbers and percentages.
- Analytics events to track.
- CRM fields worth capturing.
- Privacy note for any sensitive buyer inputs.

## Quality Bar

A good ROI calculator has these traits:

- A skeptical CFO can follow the math.
- A sales rep can explain it in under one minute.
- A buyer can adjust the assumptions without reading instructions.
- Marketing can turn the output into a lead capture asset.
- The result is useful even when the buyer lowers the assumptions.

## Common Failure Modes

- Too many inputs.
- Inflated defaults.
- Combining hard savings and soft value into one fake precision number.
- No scenario range.
- No payback period.
- Hiding product cost.
- Using jargon labels instead of buyer language.
- Asking for sensitive data before trust is earned.
- Treating the calculator as a spreadsheet instead of a conversion flow.
