---
name: demo-script-builder
description: Build buyer-specific product demo scripts from discovery notes, pain points, personas, product capabilities, proof points, and success criteria.
tags: [content, outreach]
---

# Demo Script Builder

Turn discovery notes into a product demo that feels specific to the buyer. This skill creates a demo narrative, scene plan, talk track, setup checklist, proof points, objection pivots, and follow-up assets for sales-led B2B software demos.

Core principle: a strong demo is not a feature tour. It is a buyer-specific story that starts with the problem, proves the relevant workflow, checks for agreement at key moments, and ends with a concrete next step.

## When To Use

- A seller has completed discovery and needs to prepare a tailored demo.
- A founder needs a repeatable demo script for a specific vertical or persona.
- A sales engineer needs a scene-by-scene plan before configuring a demo environment.
- A team wants to standardize demos without making them generic.
- A buyer has specific requirements that must be shown, not just described.
- A stalled opportunity needs a sharper demo focused on the buyer's real decision criteria.

## Inputs

Ask for the smallest complete packet available:

1. Buyer company, industry, size, and business unit.
2. Attendees, titles, authority level, and what each person cares about.
3. Discovery notes, pain points, current workflow, and urgency.
4. Product or package being demonstrated.
5. Features, integrations, workflows, reports, automations, or controls available to show.
6. Proof points: customer stories, benchmarks, pilot data, screenshots, metrics, or testimonials.
7. Decision criteria and must-show requirements.
8. Known objections: price, timing, switching cost, integration, security, adoption, stakeholder alignment.
9. Desired next step after the demo.
10. Time available for the demo and whether it is live, recorded, or hybrid.

If inputs are incomplete, build a conservative script and flag missing details that would make the demo sharper.

## Operating Rules

- Start from the buyer's problem, not the product menu.
- Show fewer things with more relevance. A 20-minute demo should not try to cover the whole product.
- Every demo scene must answer a buyer question or prove a decision criterion.
- Include pauses for confirmation. Do not wait until the end to discover the demo missed the mark.
- Separate talk track from operator notes so the presenter knows what to say and what to click.
- Do not invent product capabilities, customer proof, certifications, pricing, or implementation promises.
- If a feature is uncertain, label it as a question for the product or sales engineering owner.
- Include a fallback if a live integration, dataset, or environment fails.

## Workflow

### Phase 1: Define The Demo Thesis

Write one sentence:

This demo will show how [buyer/team] can move from [current painful workflow] to [desired outcome] by using [product capability], with proof that [decision criterion] can be met.

Then identify:

- Primary buyer pain.
- Desired business outcome.
- Must-prove product capability.
- Main risk the demo must reduce.
- Next step the demo should earn.

## Phase 2: Choose The Demo Arc

Pick one arc:

- Before and after: show current pain, then improved workflow.
- Day in the life: follow one user through a realistic task.
- Exception handling: show how the system handles edge cases and failures.
- Executive outcome: show dashboards, ROI, controls, and decision visibility.
- Technical validation: show integrations, data flow, permissions, audit trail, and reliability.
- Pilot kickoff: show the exact workflow that will be tested in a pilot.

Use only one primary arc. Add secondary scenes only if they support the same buying decision.

## Phase 3: Build The Scene Plan

Create a scene table:

- Scene number
- Buyer question answered
- What to show
- Talk track
- Operator notes
- Proof point
- Confirmation question
- Risk if skipped

Common scene types:

- Problem recap.
- Current workflow mirror.
- First value moment.
- Core workflow.
- Collaboration or handoff.
- Reporting or executive visibility.
- Integration or data flow.
- Admin, security, or controls.
- Edge case or exception.
- Implementation preview.
- Success metric review.
- Next-step alignment.

Each scene should have a clear reason to exist. Remove scenes that do not support a buying decision.

## Phase 4: Write The Talk Track

For each scene, write presenter-ready language:

- Setup: why this scene matters to the buyer.
- Show: what is happening on screen.
- Translate: why it changes the buyer's workflow or outcome.
- Check: a question that confirms relevance.

Use buyer language from discovery notes when available. Avoid vague claims such as "streamlined", "powerful", or "easy" unless the screen demonstrates exactly what those words mean.

Example confirmation questions:

- Is this close to how your team handles this today?
- Would this remove the manual step you mentioned?
- Who else would need to validate this workflow?
- What would you need to see before trusting this report?
- If this worked in your environment, would it satisfy the pilot criterion?

## Phase 5: Prepare Demo Assets

Create a setup checklist:

- Demo environment
- Login or permissions
- Sample account or workspace
- Sample data
- Integrations connected
- Reports or dashboards preloaded
- Backup screenshots or recording
- Browser tabs or files needed
- Roles and handoffs
- Known limitations to avoid or disclose

Create a proof checklist:

- Customer story to mention
- Metric to cite
- Screenshot or artifact
- Security or compliance note
- Integration proof
- Implementation timeline note
- Support or onboarding proof

Do not include proof that has not been verified.

## Phase 6: Handle Objections In The Demo

Map objections to demo pivots:

- Objection
- When it may appear
- What to show
- What to say
- Evidence needed
- Follow-up owner

Common objections:

- We already do this manually.
- We already have another tool.
- This looks hard to implement.
- I am worried about data quality.
- Security will need to approve this.
- The team may not adopt it.
- We do not have budget yet.
- This does not match our workflow.

Keep responses honest. If the answer requires a follow-up from product, security, legal, or implementation, say so and add it to the follow-up list.

## Phase 7: Close With A Next Step

Write the closing sequence:

1. Recap the buyer's original problem.
2. Summarize the two or three moments that mattered most.
3. Ask what did and did not match their workflow.
4. Confirm remaining decision criteria.
5. Propose the next step.

Next-step options:

- Technical validation session.
- Security review.
- Pilot scoping call.
- Business case review.
- Procurement intro.
- Executive sponsor call.
- Implementation planning session.
- Follow-up demo for another stakeholder.

## Quality Bar

Before finalizing, verify:

- The demo thesis is buyer-specific.
- The first scene is not a generic product overview.
- Each scene answers a buyer question or reduces a buying risk.
- There are confirmation questions throughout the demo.
- The setup checklist is practical enough for someone to run.
- Unsupported product, security, legal, pricing, or implementation claims are flagged.
- The ending asks for a concrete next step.
- The output can be used by both a seller and a sales engineer.

## Output Format

Return:

1. Demo thesis.
2. Recommended demo arc.
3. Scene-by-scene demo plan.
4. Presenter talk track.
5. Operator setup checklist.
6. Objection pivot table.
7. Proof checklist.
8. Follow-up email.
9. Missing-information checklist.

Use markdown tables for the scene plan, objections, proof checklist, and setup checklist unless the user asks for CSV.

## Example Prompts

- Build a demo script from these discovery notes.
- Turn this buyer's pain points into a 30-minute product demo.
- Create a technical validation demo for this prospect.
- Help me prepare a founder-led demo for a healthcare buyer.
- Rewrite our generic demo into a persona-specific talk track.
