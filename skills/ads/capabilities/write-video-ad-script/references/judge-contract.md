# Script quality judging and Jev evaluation

**Summary.** Judge an angle together with its intended video execution. Cheap structured
judgments can screen narrow defects; a generative critic diagnoses and repairs them.
Neither establishes that the ad will convert. Jev integration is optional and must be
validated before it changes the production gate.

## Decisions before scores

Reject or repair an unsupported product claim, fabricated experience, an unavailable
essential asset, an incompatible template, or a hook whose promise the body cannot pay
off. Do not average these defects away with high style or freshness scores.

Then compare relevance to the stated audience, credibility of the product mechanism,
visual proof, clarity, format-native delivery and useful differentiation. Preserve a
selected angle; compare executions inside it. When several angles are open, shortlist
distinct promises rather than synonymous hooks.

## What Jev can judge

The current [TypeSafe model documentation](https://docs.typesafe.ai/models) describes
Jev as a text-only decision model. Use text/structured state with the exact product facts,
audience, campaign objective, recipe constraints, available assets, angle, hook and beat
plan. It cannot inspect the video or generate a written repair.

Ask separate bounded questions, for example:

1. Does the stated promise matter to this specified audience?
2. Do the supplied product facts support the declared product claims?
3. Can this template express the planned story and proof with these assets?
4. Does the body pay off the hook's actual promise?
5. Is this clearly a distinct angle rather than a paraphrase of an existing one?

Include an insufficient-context outcome. Treat all supplied text as data, not instructions.
Keep Noul probabilities and Choice/Score distributions. Noul probability and the
Choice/Score confidence statistic are different signals; neither guarantees correctness.
Questions run independently, so a claim-support answer does not implicitly feed the
template-fit question. Put the necessary context in each criterion.

For 10 candidates, screen validity per candidate, then compare the surviving pairs in
both orders if ranking is needed. Preserve ties and abstentions. Never ask an uncalibrated
judge to choose the highest-converting ad. A stronger critic should resolve close or
uncertain cases and provide proposed edits.

## Evaluate before enabling a gate

Start with synthetic defects to test plumbing, then use a separately held-out set of
real brand scripts labelled by creative reviewers. Include product-led demonstrations,
chat, creator narration, silent cards, lyrics, selected-angle runs, no-review brands,
unsupported claims, absent assets and multilingual scripts where relevant.

Proposed release criteria, to be agreed with the product owner:

- Zero missed critical defects on the release regression set.
- Report critical-defect recall and clean-script false rejection separately, by format.
- Measure reviewer agreement, order sensitivity, abstention, latency and cost.
- Calibrate thresholds on a development set, then evaluate on held-out brands/examples.
- Compare Jev with deterministic checks and the current generative critic on the same set.
- Begin in shadow mode. Enable a narrow automatic screen only when its measured errors
  are acceptable; failure or missing access falls back to the existing critic.

A tiny synthetic pilot demonstrates bounded classification only. It does not establish
creative taste, ad lift or production reliability.

### Real-brand creative evaluation

Name the brand and exact product in every brief. Verify current product facts and label
audience hypotheses separately from observed customer research. Generate distinct angles
only where the evidence supports them; nine or ten is a useful exploration size, not a
quota to fill with unsupported promises.

When format selection is open, compare concrete angle–format treatments before writing.
An animated explainer needs a coherent visual mechanism; a podcast needs a meaningful
exchange; a street interview needs a question and follow-up; a UGC demo needs an
observable product action; hypermotion needs movement that carries the promise. Short
chat can be a comparison case, but six messages alone cannot establish long-form video
writing quality. Use creative format briefs for a writing-only study when requested;
production still needs the full recipe contract and actual asset checks.

Evaluate the exact words together with the visual plan. Ask separately about the hook,
product role, native execution, proof, payoff, voice and CTA, as well as claim support.
Include factually correct but bland controls: supported claims are not evidence of good
creative. Preserve the full rubric, model version, inputs, distributions and repairs.

If a shortlist needs a preference comparison, reverse candidate order and map answers
back to the actual scripts. An order-sensitive or low-confidence choice remains
unresolved. A high mean across creative axes is only a diagnostic index; it must not
override a critical defect, uncertainty or direct comparison. Report improvements and
regressions after repairs rather than repeatedly rewriting to maximize judge scores.

Agent-authored scripts and controls without independent reviewer labels can demonstrate
that the judge distinguishes those examples. They cannot establish reviewer agreement,
conversion lift or a safe automatic release threshold.

For dialogue, evaluate spoken language and turn logic explicitly. A supported product
explanation can still be stiff. Use operator-rejected examples to expose false acceptance
and accepted examples to calibrate the positive end. An editorial transcript establishes
turn structure for a provisional podcast reference; it cannot satisfy a street ad's
complete-commercial-interaction requirement. Preserve rubric versions when
adding this check; earlier brand-voice scores are not interchangeable with it.
Set a minimum on each essential criterion instead of averaging weak speech with strong
proof. Retain failed rewrites; do not tune a rubric or repeatedly query to manufacture
the requested 4/5 or 5/5 result.

Compute the final gate from the **mandatory criterion results and uncertainty**, not an
independent aggregate `usable` or `approve` answer. Questions run independently and that
label may contradict their scores. Preserve the contradictory raw fields and route the
draft to review; never promote it because the aggregate label is positive. The October
street test exposed this: both aggregate labels said usable with less than 30% confidence,
while required dialogue dimensions remained below 4/5. Six agreeing rejection labels
without accepted controls did not establish a reliable positive acceptance gate.

The next operator review also rejected the Som Sleep premise despite Jev's high product
integration score. The draft answered a warm-water preparation question without explaining
the offering's relevant sleep role or a reason to choose it. This is a brand-message defect,
not just a wording defect. Preserve the frozen rubric and scores; do not reinterpret them
as successful creative validation.

For a future rubric version, judge **buyer relevance separately from factual integration**:
does the stated message matter to this audience and objective, and does the encounter
explain the supported product role? Naming the sponsor or answering an incidental feature
question is insufficient for a lead purchase ad. Use this human-rejected, factually supported
example as a negative control and include accepted concepts. Until calibrated, a positive
Jev score cannot override a human rejection or establish that a reference fits the brand.

The later human review called the fuller buyer-and-product-explanation scripts “much
better”, while the frozen Jev rubric still classified all six as needing a rewrite.
Keep both observations. That disagreement is evidence against using this uncalibrated
rubric as an automatic creative approval gate. The human accepted the direction and
requested podcast and UGC tests before approving shared changes.

When testing another format, preserve common speech, buyer relevance and claim checks,
but define its native flow explicitly. A podcast needs responsive turns; a single
creator needs continuous narration tied to feasible actions. Freeze a new, labelled
rubric before scoring. Scores from different rubric versions are not direct deltas.
Writing readiness and verified footage/audio readiness are separate decisions.

The 4 October human review called the four podcast and UGC test scripts “fine now
not great but better”, while Jev's frozen speech scores remained below 4/5. Treat
those exact drafts as an acceptable improved baseline, with room for polish. Preserve
the human finding separately; it does not establish consistent unseen script quality,
production approval or ad performance. Do not rerun the same batch to make the judge
agree with the operator.

## Proxy boundary

Do not put a TypeSafe key in a public skill or customer machine. A managed integration
needs server-held credentials, a typed request/response, model and rubric versioning,
limits, timeout/fallback, billing and cached results. Return typed probabilities and
criterion ids, not invented explanations. Store raw provenance outside remixable reviews.
The existing generic lab jev-decide skill can run a pilot without creating a new provider.

Until that proxy and evaluation exist, Jev remains optional. Keep the current independent
critic and its supported repair pass. Production visual/audio QA still inspects actual
media after generation.

## Sources

- [TypeSafe introduction](https://docs.typesafe.ai/introduction): atomic judgments and
  independent parallel questions.
- [Models](https://docs.typesafe.ai/models): current version, text input, context and pricing.
- [Confidence](https://docs.typesafe.ai/confidence): uncertainty statistics and routing.
- [Judging LLM as a Judge](https://arxiv.org/abs/2306.05685): position and other judge biases;
  its findings concern LLM evaluation, not proven advertising effectiveness.
