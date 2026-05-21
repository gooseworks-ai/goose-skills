---
name: pricing-page-conversion-audit
version: 1.0.0
description: Audit a SaaS or product pricing page for conversion friction, packaging clarity, buyer confidence, objection handling, and upgrade-path alignment, then produce prioritized pricing-page experiments.
tags: [research]
---

# Pricing Page Conversion Audit

Use this composite when a user wants to improve how a pricing page converts visitors into trials, demos, purchases, upgrades, or sales conversations. It focuses on the user's own pricing page, not competitor monitoring.

## When to Load

Load this skill when the user asks for a pricing page audit, pricing conversion review, packaging clarity review, plan comparison critique, pricing objection analysis, upgrade path review, or help improving trial, demo, or checkout conversion from a pricing page.

Do not use this skill when the task is only to monitor competitor pricing changes. Use competitive pricing intel for competitor tracking.

## Outcome

Produce a practical audit that explains:

- Whether visitors can quickly understand which plan is for them.
- Whether the page builds enough confidence before asking for payment or a demo.
- Which plan, CTA, proof, FAQ, or packaging choices create friction.
- Which buyer objections are unanswered.
- Which pricing-page experiments should be tested first.

## Intake

Ask only for missing context. If a URL or screenshot is provided, start from that.

Useful inputs:

- Pricing page URL, screenshot, or pasted copy.
- Product category and target customers.
- Desired conversion goal, such as start trial, book demo, buy now, contact sales, or upgrade.
- Current conversion rates if available.
- Current plans, prices, usage limits, add-ons, and enterprise motion.
- Main buyer objections.
- Key competitors or alternatives if relevant.
- Any recent win-loss, trial conversion, or support feedback.

## Audit Flow

### 1. Clarify the Visitor's Job

Identify who arrives on the pricing page and what decision they are trying to make.

Common visitor jobs:

- Compare plans before starting a trial.
- Check whether the product fits a budget.
- Decide whether to self-serve or talk to sales.
- Validate a vendor for procurement.
- Understand upgrade limits after hitting a usage gate.
- Compare against a competitor or status quo.

Use this job to judge the page. Do not audit every pricing page as if it has the same goal.

### 2. Map the Page Structure

Summarize the visible flow:

- Headline and promise.
- Plan cards or package table.
- Primary and secondary CTAs.
- Feature comparison.
- Usage limits and add-ons.
- Proof and trust elements.
- FAQ and objection handling.
- Enterprise or sales-assist path.
- Checkout, demo, trial, or contact handoff.

Flag anything important that appears too late, is missing, or distracts from the decision.

### 3. Test Plan Clarity

Evaluate whether a buyer can answer these questions in under one minute:

- Which plan is right for me?
- What do I get at each level?
- What changes when I grow?
- What is included versus extra?
- What happens if I exceed a limit?
- Can I start without talking to sales?
- When should I talk to sales?

Look for unclear tier names, vague feature labels, hidden limits, missing examples, and plan cards that force the buyer to already understand internal product language.

### 4. Test Value Before Price

Check whether the page makes the value feel worth the price.

Assess:

- The headline connects pricing to an outcome.
- The plan descriptions map to buyer jobs, not internal bundles.
- The most important value drivers are visible near price.
- Proof appears near moments of doubt.
- The page explains why a higher plan costs more.
- The CTA matches the visitor's readiness.

If price appears before value is understood, recommend moving or rewriting supporting proof.

### 5. Diagnose Objection Handling

List unanswered buyer objections.

Common objections:

- Will this work for my team size or use case?
- Can I cancel, downgrade, or change plans?
- Is there a free trial or migration path?
- What support, onboarding, or implementation help is included?
- Is my data secure?
- Does this integrate with my stack?
- Why is this priced this way?
- What happens as usage grows?
- What is the difference between self-serve and enterprise?

Tie each objection to a specific page location where it should be handled.

### 6. Review CTA and Path Fit

Evaluate whether each CTA fits the plan and visitor intent.

Check:

- Self-serve plans should have low-friction CTAs.
- Enterprise or complex plans should offer a consultative path.
- Demo CTAs should explain what the visitor gets from the demo.
- Trial CTAs should reduce risk and clarify what happens next.
- Upgrade CTAs should reinforce the value unlocked.

Flag mismatches, such as asking low-ACV users to book a demo, hiding self-serve purchase behind sales, or pushing enterprise buyers into a generic trial.

### 7. Review Trust and Proof

Look for proof at the moment of decision.

Useful proof:

- Customer logos by segment.
- Short case-study outcomes.
- Security and compliance proof.
- Migration support.
- Usage or ROI examples.
- Third-party reviews.
- Guarantees, cancellation clarity, or support expectations.

Recommend proof only where it reduces a real objection. Avoid decorative social proof.

### 8. Check Packaging and Upgrade Logic

Assess whether packaging supports expansion without confusing buyers.

Look for:

- A clear good-better-best structure.
- A credible recommended plan.
- Feature gates that align with value and willingness to pay.
- Usage limits that are understandable.
- Add-ons that do not make the base plans feel incomplete.
- Enterprise gates that make sense.
- Upgrade triggers that match product usage.

If packaging itself is unclear, separate page-copy fixes from deeper packaging tests.

### 9. Prioritize Experiments

Rank fixes by likely impact, confidence, effort, and speed to learn.

Each experiment should include:

- Target visitor segment.
- Page element to change.
- Hypothesis.
- New copy, structure, CTA, proof, or packaging idea.
- Primary metric.
- Guardrail metric.
- Minimum sample or readout window.
- Decision rule.

Prefer a focused test plan over a long list of opinions.

## Output Format

Return:

- Executive summary with the biggest conversion blocker.
- Pricing page journey map.
- Plan clarity score.
- Value-before-price assessment.
- Objection handling gaps.
- CTA and path-fit review.
- Trust and proof recommendations.
- Packaging and upgrade-path findings.
- Prioritized experiment roadmap.
- Tracking changes needed to measure success.

## Quality Bar

Do not produce generic pricing advice. Every recommendation should name the visitor, the page moment, the friction, the proposed change, and the metric that should move.

If the page cannot be accessed or data is missing, produce a screenshot or copy-based heuristic audit and clearly mark confidence as directional. Ask for analytics only when it would change the recommendation.
