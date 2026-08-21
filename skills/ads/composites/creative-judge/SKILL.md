---
name: creative-judge
description: Score generated ad creative against the brand's own voice and its historical winners before it ships. Grades brand fit, hook strength, claim clarity, and format discipline with an LLM judge, compares pairwise against the closest historical winner, and when performance labels exist, calibrates the judge against real outcomes and reports the correlation honestly. Writes winning and losing patterns back into the brand kit so the next generation run learns from them. Use after generating ad creative and before it ships, or when asked to "judge this ad", "score this creative", "is this ad any good", "compare these ad variants", or "calibrate the judge against performance".
tags: [ads, research]
---

# Creative Judge

Generation pipelines produce ad creative that is technically correct — right dimensions, right product, no policy violations — but still misses the brand's actual voice. A policy checker catches what is not allowed. Nothing upstream of this skill checks what is not *good*, and nothing feeds a real win or loss back into the brand context that shaped the next batch. This skill is that missing step: it grades creative before it ships, and it closes the loop from performance back into generation.

**Core principle:** the deterministic checks (does the ad exist, is it the right format, did it pass policy) are not this skill's job — compose with meta-ad-policy-checker for compliance. This skill grades quality: does the creative sound like the brand, does it hook attention in the first couple seconds, is the claim clear, does it respect the format it was built for. Where real performance data exists, it also grades itself — reporting how well its own scores predict what actually won.

## When to Use

- Right after a generation batch, before creative goes to a human for approval or to a platform for spend
- When asked to compare two or more variants of the same concept
- When asked whether a specific ad is any good, or ready to ship
- Periodically, to calibrate the judge against a brand's real campaign performance and decide whether to trust it more or less
- Never as a policy gate — hand policy risk to meta-ad-policy-checker, this skill assumes creative already passed or is being judged in parallel with it

## Phase 0: Intake

1. **The brand.** Read its brand kit — positioning, audience, voice, tone words, instructions, value props. This is the ground truth for brand fit; do not substitute a generic idea of "good ad copy."
2. **The creative under judgment.** One or more images/renders, plus whatever steering prompt or product was used to generate them.
3. **The reference set, if available.** The brand's own past creatives, each labelled with what actually happened to it — win, loss, or a real performance number (CTR, ROAS, CPA, hook rate). No reference set is a valid state; say so and skip calibration rather than inventing history.
4. **Mode** — `score` (grade the new creative alone), `compare` (pairwise against the closest historical winner or against each other), or `calibrate` (score the whole reference set and correlate against its real labels).

## Phase 1: The Rubric

Grade each creative on four dimensions, 1–5 each, grounded in the brand kit fields from Phase 0 rather than generic ad-copy taste:

- **Brand fit** — does the copy's tone match the kit's voice/tone words, or does it read like a template with the logo swapped in? Quote the specific word or phrase that confirms or contradicts the brand voice.
- **Hook strength** — does the first line or first visual beat earn a second look, specifically for this audience? A safe, generic opening line is a low score even if grammatically fine.
- **Claim clarity** — is the core claim (price, benefit, differentiator) legible at a glance, and does it match a real value prop or product fact from the kit rather than an invented one?
- **Format discipline** — does it respect the aspect ratio, text-safe zones, and length conventions of the format it was built for, without crowding or truncation?

Score each dimension with one sentence of evidence, not just a number. A creative that scores high on craft but does not sound like the brand is a brand-fit failure, not a pass with a caveat.

## Phase 2: Judge

Use an LLM to grade against the rubric above, strict and skeptical rather than encouraging — reward creative that actually sounds like this brand, penalize plausible-but-generic output the same way a human brand lead would reject a design comp that "looks fine" but is off-brand. Return a structured verdict per creative: per-dimension scores, one-line evidence per dimension, an overall score, and a one-paragraph reasoning summary.

Report **judge confidence**, not just a score: note whether the brand kit gave enough signal to grade brand fit with confidence (thin kits — few tone words, no instructions — should widen the confidence interval and say so), and flag any dimension where the judge is guessing rather than grounded.

## Phase 3: Pairwise Comparison

When a historical winner exists for the same product or angle, compare the new creative against it side by side rather than scoring in isolation — relative judgments are more reliable than absolute ones. State which one wins on each of the four dimensions and why, and give an overall preference with a confidence level (clear win, marginal, toss-up). If no comparable historical winner exists, say so explicitly rather than comparing against an unrelated creative.

## Phase 4: Calibration — Honesty Required

When a reference set with real performance labels exists, score every creative in it the same way as Phase 2, then correlate judge score against actual performance (Spearman or Pearson, whichever fits the label type; report which one and why).

**Report the number you actually get, not the number that would look good.** A weak or noisy correlation on a small reference set is a normal, useful finding — say so, say why it's likely weak (sample size, label noise, confounded creative variables), and say what would tighten it (a bigger reference set, cleaner labels, isolating one variable at a time). Do not round up, cherry-pick a subset that correlates better, or present a hypothetical number as measured. Small-sample correlation coefficients are noisy by construction; note the sample size next to every coefficient you report so it isn't read as more certain than it is.

## Phase 5: Write the Pattern Back

This is the step that closes the loop. Once judged (and calibrated, if a reference set exists), summarize what separated winning from losing creative in one or two concrete, reusable sentences — not a restatement of the score, a standing rule the next generation run can act on ("keep copy dark-humor and irreverent, avoid safe beauty-ad phrasing" is usable; "brand fit was 3.2/5" is not). Hand this to update-brand-kit as an `instructions` update so it persists as a standing rule and survives a later brand-research refresh. Confirm the exact instruction text with the user before writing it — this is a standing rule for every future generation, not a one-off note.

## Output

A structured verdict per creative (four dimension scores with evidence, overall score, confidence note), a pairwise comparison against the closest historical winner when one exists, a calibration section with the real correlation number and sample size when a reference set exists, and — once confirmed — the exact instruction text written back to the brand kit.

## Quality Checks

- Every dimension score is grounded in a specific brand kit field or a quoted line from the creative, not generic ad-critique language.
- Judge confidence is reported, and is lower when the brand kit itself is thin.
- Pairwise comparisons only happen against a genuinely comparable historical creative.
- The calibration number is the one actually computed, reported next to its sample size, with an honest reason if it's weak — never adjusted to look better.
- The write-back is a standing, reusable instruction, confirmed with the user, not silently applied.

## Failure Modes

| Symptom | Cause | Fix |
| --- | --- | --- |
| High score on obviously off-brand copy | Judge graded generic ad-copy quality instead of this brand's voice | Re-ground every dimension in the kit's actual tone/voice words before scoring. |
| Calibration correlation reported with unwarranted confidence | Small reference set treated as statistically solid | Always report sample size next to the coefficient and flag when it's too small to trust. |
| Compared against an unrelated "winner" | No genuinely comparable historical creative existed | State plainly that no comparable reference exists rather than forcing a comparison. |
| Write-back duplicates or contradicts an existing instruction | Kit's current instructions weren't read first | Read the kit's current instructions before proposing a new one; merge or supersede, don't just append. |
| Policy risk treated as a quality problem | Creative-judge tried to also gate compliance | Hand policy questions to meta-ad-policy-checker; this skill only grades quality. |
