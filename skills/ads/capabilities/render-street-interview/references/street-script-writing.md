# Human version

**Summary.** Decide what this brand's ad needs to communicate before choosing an interaction
or reference. Use a complete inspected commercial interaction to develop that idea, then
write a coherent situation before dialogue. Keep camera, audio and timing rules fixed;
choose the participant, visible setup, actions, hook and ad connection for the brand.
Product guessing retains its existing renderer. Mic-only, prepared-sample and visible-task
conversations produce **script and prompt previews only**; performed media remains unverified.

| Fixed capture and delivery rules | Dynamic story choices |
| --- | --- |
| 9:16, 720p preview, one take of 6–15 seconds | Execution and interaction subtype |
| One corner and light, stable framing, consistent mic and eyeline, native in-scene audio | Premise, participant role, participation reason and visible task |
| Exact approved words, both people speak, no added model speech | Edited opening, reply-led follow-up, actions and reaction beats |
| Product-guess guards; measured cuts/captions and locally drawn graphics on rendered work | Supported brand explanation, product role, hook and payoff |

| Interaction | Available now | Visible setup |
| --- | --- | --- |
| `product-guess` | Existing object renderer | Standalone product reference, guesses and reveal |
| `mic-only` | Conversation preview | A relevant exchange or service explanation, without a product or device |
| `product-sample` | Conversation preview | An already prepared sample in a plain cup; no exact package reference |
| `concept-challenge` | Conversation preview | A described visible task using non-UI props |

The first frame may be a participant reply or silent action from an edited encounter.
Do not force a greeting or consent exchange into the ad. Do record how participation
works in the proposed situation, and distinguish it from what the reference actually shows.
The retained opening must establish its subject through the actual picture, words or
rendered text. Private setup notes cannot explain an answer to a missing question.

---

# Agent version

## Establish the brand message before selecting a reference

Load the writer's `references/buyer-and-mechanism.md`. Research the current buyer's
actual task, inputs, workaround, constraint and desired output. Preserve any human
acceptance of speech separately from unresolved explanation or buyer relevance.
Put the supported connection between the situation and the product into the actual
exchange or feasible action. A short natural exchange that omits how the product
helps is not a complete explanation. If that explanation exceeds this recipe's
6–15-second take, label the script as requiring a longer production route; do not
expand the fixed take limit or strip out the useful explanation to pass it.

Read current brand/product positioning and the selected angle, not only preparation facts.
State the audience, campaign objective, what the viewer should understand, why that matters
to this buyer, and the supported product role. Label audience assumptions and missing proof.
For a purchase-oriented ad, a truthful feature is insufficient without a relevant reason
to choose the offering. An explicitly requested preparation FAQ can have a narrower purpose.

Develop the premise from that message. Then choose the subtype and reference that can
express it. A physical drink does not automatically require sampling; a service does not
automatically require a problem-and-pitch exchange. Check the source's persuasion as well
as its actions: what question or objection does it resolve, and can this brand truthfully
use that structure? Do not narrow the audience or invent a buying concern to justify an
already selected example. Reject a fully inspected reference when its persuasive purpose
does not fit. The selector validates recorded compatibility, not this creative decision.

The Som Sleep trial exposed this error: a tasting reference led to warm-water preparation
as the whole message. That explains how to prepare a drink, but does not explain its sleep
role or a relevant reason to choose it. A sip can demonstrate taste; it cannot demonstrate
a later sleep effect. Sampling may serve a genuine taste objection within an established
brand idea, but it must not substitute for that idea. Keep unknown benefits or mechanisms
explicit instead of inventing claims to repair the connection.

## Choose a subtype and inspect the whole commercial interaction

Use `mode=product-guess` with `interaction_type=product-guess` for the legacy object
renderer. Use `mode=conversation` with `interaction_type=mic-only`, `product-sample` or
`concept-challenge` for previews. These are story choices, not claims of verified media
support. Product-sample uses a prepared plain cup; it cannot bind an exact package image.
Mic-only may explain a service without a device. Concept-challenge uses only described
non-UI props. No conversation subtype accepts a phone, screen, UI or scene-image binding.

Read the renderer's `SKILL.md`, `REFERENCE.md` and `READINESS.md`. Load
[[composes::write-video-ad-script]] with the scoped [[derived-from::ad-angle-miner]] angle
and current brand facts. Preserve the legacy product-guess scaffold and its regression
checks; do not transplant its handover, wrong answers or winner into a conversation.

Run `scripts/prepare_script_context.py --brief <brief.json> --references <project-refs.json>
--out <script-context.json>`. The brief must identify `brand_id`, `mode`, language,
audience group, buying context, **`offering_type` (`physical|service|digital`)** and
**`interaction_type` (`product-guess|mic-only|product-sample|concept-challenge`)**.
Offering and visible interaction must both fit the selected reference.

Prefer compatible user observations, then project observations and inspected commercial
examples. **Seed snippets are research leads.** A URL, caption, isolated transcript turn,
radio exchange or editorial interview cannot fill a street-ad reference gap. Do not fall
back to radio or editorial banter because an ad source is harder to inspect.

Inspect the complete commercial clip's **visual timeline and spoken exchange**, including
its ending. Record the following in the project reference record:

- Commercial evidence, source, language, observation method, full clip duration and
  `inspection.coverage=complete-clip` with both `visual` and `transcript` modalities.
- Ordered `speaker_turns` with observed content, speakers, functions and clip timestamps;
  label paraphrases and link the full transcript evidence. Include the whole exchange,
  not selected lines that flatter the concept. Read the transcript for spoken language.
- A full visual timeline that records the opening, setup, actions, product appearance,
  transition to the brand and payoff. A transcript cannot establish these events.
- `ad_interaction.edited_opening`, `visible_setup`, `participant_reason`, `viewer_hook`,
  `product_connection`, `payoff` and `unseen_setup`.
- `allowed_offering_types`, `interaction_types`, a specific `transfer_rule`, limitations
  and authorship evidence when available. Keep private source material project-scoped.

Record unseen recruitment, prior instructions or sampling setup as **unknown** unless the
source shows or explicitly establishes them. A plausible recruitment explanation is an
inference, never an observed fact. The new ad's proposed participation reason can differ;
label it as the authored plan. Do not transfer the source brand's claims or endorsements.

If selection returns `needs-reference`, inspect and save a compatible full commercial
interaction, then select again. Keep the reference gap explicit until it is filled.
Selection checks recorded coverage and fit; it cannot establish truthful observation,
script quality, authorship or ad performance.

## Write a situation brief before words

Save a short situation brief with the fields below. A reviewer should understand the
whole ad from this brief before reading dialogue.

| Field | Required decision |
| --- | --- |
| Brand message and buyer relevance | What this ad should communicate, why it matters to this audience, and which current facts support the product's role |
| Reference and transfer | Selected ids, exact observed mechanic used, and observation limits |
| Participant and role | Who this adult is in this scene; their independent concern |
| Visible setup | What is in frame before the first spoken line; any prepared props or task |
| Participation reason | Why they join this proposed encounter; separate authored setup from source evidence |
| Edited opening and hook | The reply, question or action that makes the viewer want the next beat |
| Exchange logic | What each reply establishes and why it earns the next question or action |
| Product role and ad connection | What supported product fact helps explain, resolve or reframe this exact situation |
| Payoff and ending | What the viewer learns or sees, plus the relevant brand explanation or CTA |
| Unknowns and timing | Missing evidence, planned action pauses and a feasible take duration |

Choose a useful premise: a sensory comparison, a specific visible task, a decision or
trade-off, an observed misconception, or a participant's relevant concern. A routine or
frustration is one option, not a required template. A challenge must serve the product
idea; do not add arbitrary contests, rewards or gimmicks to manufacture participation.

The ad connection must be earned by the situation. A generic problem followed by a logo
card is insufficient. State what the viewer now understands about the offering and which
current fact supports that understanding. A supported interviewer explanation can do this;
the participant need not endorse the sponsor, recite a slogan or ask for a link.
Also check why that understanding matters to the stated objective. Naming the product or
answering an incidental preparation question does not by itself make a useful lead ad.

## Write the requested exchange, then map actions and timing

Load the writer's `references/human-behavior.md` as well as its dialogue guide. Keep
the participant's immediate purpose separate from the advertiser's message. Bound what
each person knows, follow the actual reply and establish why a recommendation happens
here. Use matched parent/reply language evidence and preserve manager-rejected examples.
An ad may promote openly; believable human speech and behavior are the target.

Before dialogue, load the writer's `references/scene-and-hook.md`. Save the encounter
start separately from a time-mapped first 0–3 seconds: literal image/action, exact audible
words and any exact rendered text. State what a new viewer understands, what they want
answered, what changes during the exchange, and how the supported brand role earns the
payoff. A complete interviewer question can be the strongest opening. Do not require
reply-first editing or hide a necessary question to fit the duration.

1. Write **the count the user requested**. If a general writer guide proposes two exchanges
   and this request asks for one, write one. Keep alternatives distinct when requested.
2. Pick a question this participant could answer without knowing the sponsor. Let the reply
   earn the follow-up. State what the interviewer learned and what the next turn seeks.
   Repeating a word is not automatically a follow-up; repair abrupt topic jumps.
3. Use ordinary spoken words and unequal turn lengths where useful. Read the words alone.
   Do not add filler, fake laughter, artificial hesitation or forced greeting/consent speech
   to simulate a real encounter. An edited ad can start after recruitment.
4. Keep history and claims supported. No invented purchase, use history, credentials,
   customer result or instant efficacy. A tasting action can support a sensory response;
   it cannot establish that a sleep drink immediately improved sleep or caused relaxation.
   Generated participants are staged; specify an AI-generated dramatization disclosure in
   the locally drawn brand layer.
5. Map the approved words and visible actions into config shots. Use `kind` values `question`, `answer`,
   `followup`, `reaction` or `action`, `speaker=interviewer|participant`, `line`, and optional text
   `visual`, `action` and `manner`. Question/followup belong to the interviewer; answer
   belongs to the participant. Reaction/action are silent; action needs a description.
6. An edited participant answer or silent action/reaction may precede the first question.
   `cfg.question` must exactly mirror the **first actual interviewer question**, which is
   spoken once in the shot list. Preserve edit order; do not move or repeat the question
   to satisfy an opening template. Both speakers still need spoken lines.
7. Keep **3–8 ordered shots in a 6–15-second take** and no more than **2.5 spoken words per
   second across both voices**. This ceiling is provisional, not a timing target. Leave
   breathing room for the sip, choice, pause or reaction. Cut words or simplify the task
   when actions cannot fit; do not rush speech to make the numbers pass.
8. Specify a separate 4-second ending card with at most 10 words including brand and CTA.
   Review its claims and relation to the situation separately. The card cannot repair an
   unearned product connection or promise a result that the scene did not establish.

For new conversation configs, supply `interaction` with `type`, nonempty `visible_setup`
and `participant_reason`, plus optional `props` description. Use the selected subtype
for `interaction.type`. Legacy configs without this object remain mic-only. Product-sample
is an already prepared plain cup, not product-guess handling or package-reference support.
Do not add a `product` object, episode role, product grammar or reference binding to any
conversation preview.

## Review and stop at the supported surface

First show a fresh reviewer only the literal opening's picture/action, words and rendered
text, withholding the brief, participant intentions and ending. Require the reviewer to
describe the situation, topic and expected next answer using only those inputs; flag any
context they invented. Rebuild an opening that depends on private notes before full-ad
scoring. This diagnostic does not replace the commercial reference or alter a frozen rubric.
An opening-only test still found the manager-rejected Som and Goose lines plausible.
Basic topic comprehension is not creative acceptance; this check cannot clear human speech,
story interest or ad quality. Retain the human rejection even when the model disagrees.

Review the situation, full visual sequence, dialogue and ad connection separately. Use
the writer's dialogue review and a words-only reading. Natural language and turn logic
must each reach the proposed 4/5 floor; factual support and a good average do not compensate.
Jev screens; a generative critic names exact failed beats and may propose one supported
repair. After at most two repairs, retain a failing exchange as a draft for human review.

The October street trial found that reference ids alone did not clear the quality floor.
Review the complete interaction and brand card together. A product feature alone does not
establish a customer result, and an observed opening does not establish unseen recruitment.

A later brand-first trial still failed the required quality floor after complete commercial
references and two creative repairs. A reviewer with separate context but the same model
family accepted the final wording; Jev rejected it. Neither technical validation nor that
review established human acceptance. Keep conflicting judgments visible and the result a
draft. Brand-led concepts and supported claims are necessary inputs, not proof that the
exchange sounds human or makes a compelling ad.

The manager subsequently rejected both final cold opens for missing viewer context and
awkward speech. Answers about bedtime planning and repeating an ad brief began without
the question or another visible explanation of the topic. The same-family review had
seen the supporting brief, so its approval did not establish that a new viewer could
follow the opening. Preserve these drafts as rejected; test the new opening plan separately.

Run native config validation and `single_gen.py --brand <config.json>` before review.
Keep product-guess regression checks. Human review happens on the saved situation brief,
script, action timeline, ending-card specification and full prompt preview. **Every
conversation subtype remains preview-only; `--yes` refuses it.** A valid dry run verifies
configuration and prompt construction, not performed speech, sampling, UI, camera quality
or a finished video.
