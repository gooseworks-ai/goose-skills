# Validate, critique, repair

_Step 6 of write-video-ad-script, in full._

Run the rule check in strict mode with shape, brand rules, customer words and angle context.
Pass references.json too. Generated dialogue must cite an observed conversation record;
street ads require the complete commercial interaction above. A claim-only research bank
or partial source cannot satisfy this requirement.
It checks research scope, angle preservation, source ids, template identity, required slots
(including repeated speakers), text limits, speakers and available assets. Strict mode also
enforces profiled speech budgets and explicit word limits exactly. Fix errors and
resolve material warnings. The machine cannot prove that a cited fact entails a claim.

Before full-context critique, run the scene-and-hook guide's brief-blind opening review.
Give a fresh reviewer only the exact first picture/action, audible words and rendered
text. Require an evidence-based account of what is happening and what comes next; do not
let the brief or ending rescue missing context. Repair a confusing opening before scoring
the full ad. Keep this diagnostic separate from frozen evaluation rubrics.

Then run the independent critic with the same context and references. Set its writer-family
to the actual writer and select a critic from a different model family; a critic from the
writer's own family is not independent under another product name. It sees the campaign
brief, recipe, visual plans and evidence, not just the lines. It checks strategic fit,
template fit, feasible visual proof, claim support, hook payoff, clarity and voice. Never
let a strong style score compensate for an unsupported claim or an impossible execution.
Apply supported edits, then recheck. The final chosen hook must also pass with the body.
Inspect `pass_rankings`, `needs_review` and `kill_reasons`. A split fatal-defect judgment
needs resolution; an order-sensitive top choice remains a shortlist. Do not treat a
merged average or Borda ranking as agreement between critic passes.
For podcast/street dialogue, each critic pass must reach at least 8/10 on spoken and
template_fit, with supported claims and no unresolved defects. This is the proposed
4/5 quality floor for those criteria, not a calibrated guarantee of human preference.
For a street ad also review situational credibility and the brand's useful role against
the words **and** visible actions. Ordinary vocabulary alone cannot clear either check.
Street `strategic_fit` must also reach 8/10 in every critic pass. A relevant reason to
consider this offering must appear in the actual encounter; a name, bedtime label or
incidental preparation detail cannot substitute for it. The merger treats a low or missing
street strategic score as unresolved even when speech, template fit and factual support
score highly. Diagnose a failed premise before proposing line edits.
If dialogue_ready is false, repair the exchange and recheck. After two supported repair
passes, retain a failed result as a draft and report the remaining defect; do not relax
the rubric or loop until the judge returns a desired number.

The files reference explains the critic's relay and failure exits. If it is unavailable,
do an explicit agent review against the same rubric and record that limitation; never
record a failed critic call as a pass. If every candidate fails, repair or regenerate
within the supported angle and recipe before review. Do not automatically choose the
highest-ranked rejected candidate.

**Optional Jev screen.** Jev may cheaply judge narrow text questions about relevance,
supported claims, format fit and hook payoff. Use separate criteria, keep probabilities,
include an insufficient-context route and compare with labelled examples before enabling
an automatic gate. Jev does not write repairs or inspect video. Keep the generative critic
for diagnosis and edits. The judge-contract reference defines the evaluation and proxy
integration boundary; Jev is not a required production provider.
