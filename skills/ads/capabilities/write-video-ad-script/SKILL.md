---
name: write-video-ad-script
description: Write a short-form video ad from an evidence-backed angle and the selected template's actual recipe. Reuses or fetches ad-angle-miner, preserves the chosen angle, plans words and visuals together, checks product claims and production fit, and delivers the strongest script with useful alternatives. Use before video production and for script rewrites. Customer language is one input alongside audience, promise, product proof, offer and format.
status: active
---

# Write Video Ad Script

**Summary.** Turn a researched advertising promise into a video this template can actually
make. First load the angle research, then bind it to the recipe's story, visuals, timing and
assets. Write and check the complete concept before the user reviews it. The output is one
recommended script, its visual plan and up to two viable alternatives. A model score is a
quality screen; ad results establish performance.

## When to use

Use before production for voiceover, dialogue, chat, cards or lyrics. For a silent format,
still plan its visual promise and payoff; skip spoken copy, not creative strategy.

When the user supplied exact lines, keep them verbatim. Check them in report-only mode and
raise material timing, claim or format conflicts. Rewrite only with their authorization.
The runtime owns research-spend permissions and production approval. Follow its existing
review round; this skill adds no approval round of its own.

## Inputs and precedence

Read this skill's files reference before creating working files. Required context:

- The brand and exact product, current facts, voice and prohibited claims.
- Audience, campaign objective, offer and CTA, using saved context and brief first.
- The selected template and full recipe: instructions, config, choices, assets and inputs.
- A validated angle context from ad-angle-miner, including source records.
- Reference footage or its observed beat map, plus available brand assets.

The user's explicit direction and chosen angle are fixed. The recipe determines what is
possible. If those conflict, explain the concrete conflict and offer a compatible execution
or format before production. Do not silently replace the angle or rewrite the template.
A reference provides a storytelling structure; the product's facts provide claims.

## Step 0. Load the angle research, explicitly

**Fetch ad-angle-miner through the skill catalogue if its instructions and handoff reference
are not already loaded.** It is a declared dependency. Fetching it does not run research.

Check, in order:

1. An angle bank or selected idea already present in this run.
2. The brief's research pointer and selected angle id.
3. The brand and product's saved video-scripts workspace: angle-bank.json, beside
   customer-words.json. Check a legacy brand-level bank only if its product scope matches.
4. Legacy angle-bank Markdown and ideas JSON from a previous miner run. Read their actual
   sources and normalize them into the shared handoff; never manufacture missing evidence.

The shared handoff is video-angle-bank.v1, defined in ad-angle-miner's video-handoff reference.
Use the preparation script to check brand, product, source ids and template compatibility,
and write angle-context.json. Preserve selected ids and the original angle. Keep facts,
quotes and observed ad structures separate. Refresh changing prices, offers and claims
against current product sources; research age alone does not invalidate every insight.

**If no usable bank exists, run ad-angle-miner in video mode**, limited to this audience,
product and selected template. Reuse existing evidence. Its output is an angle bank, not a
second script-writing workflow. Paid research follows the runtime's permissions. If access
is missing or paid research is declined, build a smaller, explicitly provisional bank from
verified product facts and available references. Do not require 20 reviews or invent quotes.

If the user has already chosen an angle, research supports that direction; it does not
reopen the choice. If the selected angle cannot be supported, name the missing proof and
propose a supported version. Never pretend to have run the miner when it could not run.

## Step 1. Bind the template before writing

Read the actual recipe, not just its catalogue card. Write shape.json with:

- Template id, format, story mechanism, audience and objective.
- Ordered slots, speakers, text kind, durations and explicit word/character/line limits.
- Product entrance, proof device, payoff and CTA placement allowed by this recipe.
- Available asset ids, permitted visual modes and any required demonstration.
- What can change and what stays fixed, including silence, music or lyric constraints.

For speech, load [pacing](references/pacing.md). Separate **desired cadence** from recipe
limits and generation evidence. Use the brief's explicit delivery direction or actually
observed reference audio for this ad's target, then the recipe's default. Preserve explicit
recipe limits. If these disagree, record the conflict instead of quietly choosing the
slower rate and deleting the message. Without usable context, use a provisional 3 words
per second for conversation or 2.5 for slower narration, labelled as a fallback.

Budget each spoken beat from its speech window, excluding silent demonstrations, end cards
and intentional pauses. Rates can differ across beats and speakers. Record the rate's
source and keep recipe estimates separate from observed rendered delivery. Carry this
timing plan into production direction. Read chat and cards against their own display time
and layout. Lyric timing follows bars and syllables. A word estimate never establishes
that speech or text fits the finished cut. Do not change the recipe to express this run's
target, promise forty words in fifteen seconds, or apply a universal speed-up.

Examples of adaptation, not a fixed format catalogue:

| Recipe | Script must do | Failure to reject |
|---|---|---|
| iMessage conversation | Build a believable exchange and reveal through short turns | A sales monologue split into bubbles |
| Product demonstration | Pair a supported benefit with a visible action or test | A testimonial over unrelated beauty shots |
| Creator narration | Match what is said to what appears at that moment | Invented personal results or unavailable footage |
| Silent product loop | Express one visual promise through reveal and final card | Forcing a spoken problem-solution script into it |
| Music or lyrics | Make the product story work within musical timing | Treating a lyric as ordinary voiceover |

If the recipe lacks enough information, inspect the demo and capability instructions.
Record any provisional timing. Resolve essential missing assets before proposing a script
that relies on them.

## Step 2. Form the creative brief

For each eligible angle, write a compact brief:

- One audience in a recognizable situation, and its awareness or buying context.
- One promise that matters, and why this product can credibly deliver it.
- The mechanism or differentiator, supported facts and one feasible proof device.
- The desire, identity, tension or objection the story uses. Pain is optional.
- The offer, CTA, visual opening and payoff, within the selected format.

Buyer language improves relevance and voice. It is not a mandatory plot and does not
substantiate the brand's claims. Competitor complaints suggest a research question; they
do not establish that this product fixes it. Quotes may be attributed as real quotes when
appropriate, never recast as an invented narrator's own purchase or result. Fictional
scenes must not masquerade as genuine interviews, reviews or customer experience.

Reuse collected quotes and history before collecting more. Store verbatim quotes with real
sources and their product/competitor scope. A product-led demo or launch may have no quotes;
verified facts and a strong feasible demonstration are valid foundations.

## Step 3. Learn the reference's persuasion

Read the recipe's demo lines and timing, or inspect its footage when they are missing.
Add at most three relevant references from existing research. For each record the opening
visual and words, beat order, product entrance, proof, objection, payoff and CTA. Record
what transfers and what belongs to the source brand.

For a podcast or street interview, load [dialogue-writing](references/dialogue-writing.md). Obtain at least
one actually observed conversation in that format, preferably the brand's own or a
relevant ad, and record its speaker turns. A format description, product page or imagined
beat map is not a conversation reference. A publisher transcript can establish turn
structure; only inspected audio/video establishes delivery, pauses and reactions.
If a nearby editorial interview is used, state that it supplies conversation mechanics,
not commercial performance or product claims. Record missing commercial/delivery evidence
and keep that execution provisional. Reuse the miner's sources first; retrieve missing
references rather than asking the user to supply them when access is available.

Keep performance labels honest: running duration and variants show advertiser persistence;
views show reach or engagement. Neither proves conversions, profitability or causal lift.
Use measured first-party results when available and keep audience, placement, objective and
measurement window attached. Never describe an untested reference as a proven winner.

## Step 4. Choose distinct angle–execution pairs

When the angle is open, work from up to 10 researched candidates. Filter unsupported
promises and incompatible executions first, then shortlist up to three with genuinely
different promises or proof devices. Do not create ten paraphrases to fill a quota.

When the angle is selected, keep its id and promise. Write one concept with hook variations,
or several executions within the same direction when useful. Batch assignments should be
different where the brief permits, and use the bank once per brand and product.

Rank relevance, product credibility, template fit, feasible proof and hook payoff before
freshness. Prefer clear, well-supported familiar angles over obscure weak ones. No arbitrary
novelty cutoff. Fewer than three good concepts is better than padded alternatives.

## Step 5. Write words and visuals together

For every beat write the exact line, speaker, visual action, production mode and existing
asset ids when applicable. Keep a proof plan and a claim ledger with current product fact
ids. Every hook variant must lead into the same body's promise; repair the body when the
promise changes.

- Make the first moment intelligible and worth watching through words, visuals or both.
- Keep one main promise and pay it off visibly.
- Use the product's actual mechanism, differentiator or demonstration where the recipe fits.
- Match dialogue, cards and lyrics to their medium and the brand's voice.
- Make the offer and CTA clear. Respect the recipe's ending and permitted CTA placement.
- Brand visibility depends on objective and format. Do not ban an early product or brand
  simply because it is early.
- Include only supported product claims. A source id is traceability, not a semantic check.

For conversational formats, write the exchange before allocating it to timed slots.
Give each person an intention and a reason to respond to the previous turn. Then trim
and add product inserts, captions and the CTA. Do not turn every slot into a sentence
from the product page or have the participant rehearse the presenter's selling points.

Create candidates.json with angle ids, evidence ids, claims, hooks, beats and visual plans.
Keep the proof and CTA when repairing timing. Offer tighter wording, a longer execution
within the recipe, or an explicitly evaluated faster read. Do not drop essential content
just to hit a generic word count.

## Step 6. Validate, critique, repair

Run the rule check in strict mode with shape, brand rules, customer words and angle context.
Pass references.json too. Generated podcast/street dialogue must cite an observed
conversation record; a claim-only research bank cannot satisfy this requirement.
It checks research scope, angle preservation, source ids, template identity, required slots
(including repeated speakers), text limits, speakers and available assets. Fix errors and
resolve material warnings. The machine cannot prove that a cited fact entails a claim.

Then run the independent critic with the same context and references. Set its writer-family
to the actual writer and select a critic from a different family; a blanket ban on Claude
does not make an OpenAI critic independent of a Codex writer. It sees the campaign
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

## Step 7. Deliver the review

Take the strongest eligible concept and validated hook into the recipe's native script
shape, with its visual plan. Show up to two viable alternatives in the same review when
the angle was open. Do not add a separate pause. Existing runtime approval still applies.

Explain briefly why this promise suits this audience and what the video will show. When
research is provisional or essential proof is missing, say so plainly. Keep private quote
links and customer data out of remixable review payloads; retain them in research provenance.
Include the chosen delivery style, per-beat word counts and speech windows, intentional
pauses, recipe conflicts and unverified delivery targets. The production handoff carries
the same timing plan and preserves recipe limits. A finished-audio check must establish
the complete read, pronunciation, naturalness and sync before declaring delivery fixed.

## Step 8. Learn from decisions and results

Read and update the brand's script history: selected angle id, template and recipe version,
hooks, user edits, rejected concepts and reasons. Preserve the user's exact edits. Store
standing brand rules through the runtime's normal brand update flow.

Keep user approval, generated quality scores and paid performance separate. A liked script
is not a converting ad. When results arrive, attach spend, impressions, audience, placement,
objective and window. Learn which angle–format pairs worked without treating every loss
as a copy failure.

## Quality checks

The selected angle survives, the claim ledger is supported, the script fits the actual
recipe, every essential visual can be made, the hook pays off, and the user receives a
complete proposal that does not require repairing obvious defects.

## Related

- [[composes::ad-angle-miner]] — evidence and shared video handoff.
- [[composes::watch]] — observe reference footage when its beat map is missing.
