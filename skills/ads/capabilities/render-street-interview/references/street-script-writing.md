# Human version

**Summary.** Start with a complete inspected commercial street interaction, then write a
coherent situation before writing dialogue. Keep the camera, audio and timing rules fixed;
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

---

# Agent version

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

## Write the requested exchange, then map actions and timing

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

Review the situation, full visual sequence, dialogue and ad connection separately. Use
the writer's dialogue review and a words-only reading. Natural language and turn logic
must each reach the proposed 4/5 floor; factual support and a good average do not compensate.
Jev screens; a generative critic names exact failed beats and may propose one supported
repair. After at most two repairs, retain a failing exchange as a draft for human review.

The October street trial found that reference ids alone did not clear the quality floor.
Review the complete interaction and brand card together. A product feature alone does not
establish a customer result, and an observed opening does not establish unseen recruitment.

Run native config validation and `single_gen.py --brand <config.json>` before review.
Keep product-guess regression checks. Human review happens on the saved situation brief,
script, action timeline, ending-card specification and full prompt preview. **Every
conversation subtype remains preview-only; `--yes` refuses it.** A valid dry run verifies
configuration and prompt construction, not performed speech, sampling, UI, camera quality
or a finished video.
