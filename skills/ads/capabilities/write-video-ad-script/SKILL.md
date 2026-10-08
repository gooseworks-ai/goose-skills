---
name: write-video-ad-script
description: Write a short-form video ad from an evidence-backed angle and the selected template's actual recipe. Reuses or fetches ad-angle-miner, preserves the chosen angle, plans words and visuals together, checks product claims and production fit, and delivers the strongest script with useful alternatives. Use before video production and for script rewrites. Customer language is one input alongside audience, promise, product proof, offer and format.
status: active
version: "1.0.4"
---

# Human version

**Summary.** Turn a researched advertising promise into a video this template can actually
make. First load the angle research, then bind it to the recipe's story, visuals, timing and
assets. Write and check the complete concept before the user reviews it. The output is one
recommended script, its visual plan and up to two viable alternatives. A model score is a
quality screen; ad results establish performance.

---

# Agent version

## When to use

Use before production for voiceover, dialogue, chat, cards or lyrics. For a silent format,
still plan its visual promise and payoff; skip spoken copy, not creative strategy.

When the user supplied exact lines, keep them verbatim. Check them in report-only mode and
raise material timing, claim or format conflicts. Rewrite only with their authorization.
This skill adds no review round of its own; the script goes into the run's existing review.

## Inputs and precedence

Read this skill's files reference before creating working files. Required context:

- The brand and exact product, current facts, voice and prohibited claims.
- Audience, campaign objective, offer and CTA, using saved context and brief first.
- The selected template and full recipe: instructions, config, choices, assets and inputs.
- A validated angle context from ad-angle-miner, including source records.
- Reference footage or its observed beat map, plus available brand assets.
- The current sourced creative brief and applicable project/brand decisions, including
  exact rejected wording, pronunciations and user-locked copy.

The user's explicit direction and chosen angle are fixed. The recipe determines what is
possible. If those conflict, explain the concrete conflict and offer a compatible execution
or format before production. Do not silently replace the angle or rewrite the template.
A reference provides a storytelling structure; the product's facts provide claims.

## Step 0. Load the angle research, explicitly

Load ad-angle-miner with `catalog_fetch {type: "skill", slug: "ad-angle-miner"}` unless its
instructions and handoff reference are already loaded; fetching it does not run research.
Reuse an existing angle bank (this run, the brief's pointer, the product's saved
angle-bank.json, then legacy miner output), normalize it to video-angle-bank.v1 with the
preparation script, and keep the selected angle. With no usable bank, run the miner in
video mode for this audience, product and template. Follow
[angle research](references/angle-research.md) for the order, the checks and what to
record; never claim the miner ran when it did not.

## Step 1. Bind the template before writing

Read the actual recipe, not just its catalogue card. Write shape.json with:

- Template id, format, story mechanism, audience and objective.
- Ordered slots, speakers, text kind, durations and explicit word/character/line limits.
- Product entrance, proof device, payoff and CTA placement allowed by this recipe.
- Available asset ids, permitted visual modes and any required demonstration.
- What can change and what stays fixed, including silence, music or lyric constraints.

For speech, read [pacing](references/pacing.md). Set the desired cadence from the brief's
explicit delivery direction or observed reference audio, then the recipe's default.
Preserve explicit recipe limits and record any conflict. Without usable evidence, use a
provisional 3 words per second for conversation or 2.5 for slow narration, labelled as a
fallback.

Budget each spoken beat from its speech window, excluding pauses, silent demonstrations
and end cards. Rates can differ across beats and speakers. Record the rate's source and
keep recipe estimates separate from observed rendered delivery. Carry this plan into
production direction. Read chat and cards against their own display time; lyric timing
follows bars and syllables. A word estimate does not prove that a generated read fits.
Do not change the recipe to express one run's target or promise forty words in fifteen
seconds.

Examples of adaptation, not a fixed format catalogue:

| Recipe | Script must do | Failure to reject |
|---|---|---|
| iMessage conversation | Build a believable exchange and reveal through short turns | A sales monologue split into bubbles |
| Product demonstration | Pair a supported benefit with a visible action or test | A testimonial over unrelated beauty shots |
| Creator narration | Match what is said to what appears at that moment | Invented personal results or unavailable footage |
| Silent product loop | Express one visual promise through reveal and final card | Forcing a spoken problem-solution script into it |
| Music or lyrics | Make the product story work within musical timing | Treating a lyric as ordinary voiceover |

If the recipe lacks enough information, inspect the demo and capability instructions.
Record any provisional timing. Resolve essential missing assets before approving a
production plan that relies on them. In a requested writing-only test, specify the
exact missing capture or reference and mark the draft not production-ready. A planned
demonstration is not verified proof; never generate a fake UI to fill the gap.

## Step 2. Form the creative brief

Before drafting, read current product evidence and the project's saved history, then save
`creative-brief.json` (files reference): variant, buyer situation, supported mechanism,
objective, offer (or "no offer supplied"), CTA, constraints, prior decisions with exact
rejected wording, locked words and delivery intent. Pass it to `prepare_angle_context.py
--brief`. Establish the message before choosing a reference. Buyer language sets voice;
it never substantiates a claim, and fiction never poses as a real review. Follow
[the creative brief](references/creative-brief.md) and
[buyer perspective and product explanation](references/buyer-and-mechanism.md).

## Step 3. Learn the reference's persuasion

Read the recipe's demo lines and timing, or inspect its footage when they are missing.
Add at most three relevant references from existing research. For each record the opening
visual and words, beat order, product entrance, proof, objection, payoff and CTA. Record
what transfers and what belongs to the source brand.

Match the reference's persuasive purpose to the creative brief, not just its category or
visible action. Complete inspection establishes what is in the source; it does not make
the source appropriate for this brand. Reject an unsuitable transfer before writing.

For dialogue, load [dialogue-writing](references/dialogue-writing.md). A format description,
product page or imagined beat map is not an observed conversation. Reuse the miner's
sources first; retrieve missing references when access is available.

For a **street ad**, inspect a complete commercial clip: its full visual interaction and
spoken exchange. Record the edited opening, visible setup, why the participant engages,
viewer hook, product connection, payoff, and any unseen approach as unknown. Match the
offering and visible interaction (sampling, mic-only service conversation, or challenge),
not just the format name. Keep ordered timestamped turns with words and actions; label
paraphrases and retain the full transcript evidence separately. A hook snippet or an
editorial radio interview cannot fill this gap. Load the selected renderer's
[[references::render-street-interview]] street-script-writing guide and run its selector.
If it returns needs-reference or unsupported-route, stop before writing dialogue for approval:
report the gap and its listed alternatives. A provisional creative review, or a note that no
complete reference was observed, is an open gate, not a pass.
Seed summaries are source leads until a complete project observation replaces them.

For a **podcast**, an appropriate publisher transcript can establish turn structure.
Editorial conversation may be provisional evidence of that mechanic, with missing
commercial context explicit. Neither a transcript nor sampled frames establishes vocal
delivery; record what was actually heard or viewed. Authorship and ad performance remain
unknown unless independently evidenced.

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

Load [scene and hook](references/scene-and-hook.md) before writing dialogue. Plan the
encounter, the literal first 0–3 seconds and the story's development/payoff first.
Separate the participant's filming context from the context actually given to a new
viewer. A complete question can be the hook; a reply-first opening needs its subject
or task established in the retained picture, words or rendered text.

For every beat write the exact line, speaker, visual action, production mode and existing
asset ids when applicable. Keep a proof plan and a claim ledger with current product fact
ids. Every hook variant must lead into the same body's promise; repair the body when the
promise changes.

Tie each material claim to the moment its demonstration is visible. Include action
completion, recognition and text-reading time in the existing scene plan. Inspect the
actual selected media before calling that plan feasible; metadata is a shortlist.
Keep product truth/style references separate from usable production footage. If the
needed proof is absent, narrow the claim or specify the missing capture; do not treat
a simulated result as evidence. A useful silent format still communicates through
exact on-screen words and visible actions, with no invented speech.

- Make the first moment intelligible and worth watching through words, visuals or both.
- Keep one main promise and pay it off visibly.
- Use the product's actual mechanism, differentiator or demonstration where the recipe fits.
- Match dialogue, cards and lyrics to their medium and the brand's voice.
- Make the offer and CTA clear. Respect the recipe's ending and permitted CTA placement.
- Brand visibility depends on objective and format. Do not ban an early product or brand
  simply because it is early.
- Include only supported product claims. A source id is traceability, not a semantic check.

For conversational formats, write the exchange before allocating it to timed slots.
Use [human speech and behavior](references/human-behavior.md), with matched language
evidence and the human's rejected examples. Establish ordinary immediate motives,
bounded speaker knowledge and why each question or recommendation happens now.
Give each person an intention and a reason to respond to the previous turn. Then trim
and add product inserts, captions and the CTA. Do not turn every slot into a sentence
from the product page or have the participant rehearse the presenter's selling points.

Before a street exchange, write a short situation brief: who the participant is in this
moment, why the interviewer is here, what invitation or visible task they accepted,
what each person wants, and how this brand helps with the resulting task or question.
Separate filming/recruitment assumptions from what the viewer sees. An edited ad may
begin with a later reaction; its action and context must make that opening intelligible.
Do not force greeting or consent dialogue into the cut. Write actions beside the words,
including preparation, handover, looking and listening time. If the premise needs more
time than the recipe permits, change the premise or flag a longer production route;
do not accelerate the speakers to hide the missing setup. A generic problem followed
by a pasted brand card does not establish a useful ad connection.

Create candidates.json with angle ids, evidence ids, claims, hooks, beats and visual plans.

## Step 6. Validate, critique, repair

Run the rule check in strict mode (shape, brand rules, customer words, angle context,
references), fix errors and material warnings, then run the brief-blind opening review and
the independent critic from a different model family. Podcast and street dialogue need at
least 8/10 on spoken and template_fit in every pass (street also on strategic_fit), with
supported claims. Repair at most twice, then report the remaining defect; never relax the
rubric or pick the best rejected candidate. Follow
[validate, critique, repair](references/validate-and-repair.md) for the exact checks,
critic exits and the optional Jev screen.

## Step 7. Deliver the review

Take the strongest eligible concept and validated hook into the recipe's native script
shape, with its visual plan. Show up to two viable alternatives in the same review when
the angle was open. Do not add a separate pause.

Explain briefly why this promise suits this audience and what the video will show. When
research is provisional or essential proof is missing, say so plainly. Keep private quote
links and customer data out of remixable review payloads; retain them in research provenance.

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

## Delivery handoff

Include the chosen delivery style, per-beat word counts and speech windows, intentional
pauses, recipe conflicts and unverified targets in the existing review. Production uses
the same plan and preserves recipe limits. Review finished audio for the complete read,
pronunciation, naturalness and sync before declaring delivery fixed.

Carry the brief's pronunciation source, energy progression, emphasized words, pauses
and phrases that should sound conversational into the voice-performance task. Keep
literal user copy fixed. Written read-throughs and word budgets are provisional until
the actual audio is heard and measured; never use a global speed-up to certify fit.
