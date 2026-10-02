# Human version

**Summary.** A street interview can show an object or explore a situation without one.
Keep the technical capture rules fixed. Choose the premise and source examples for the
brand. Write an exchange people have a reason to participate in, then fit it to the take.
The original product-guess execution is preserved. Mic-only conversation supports script
and prompt previews; performed audio and video remain unverified.

| Fixed for this renderer | Dynamic creative |
| --- | --- |
| 9:16, 720p preview, 6–15 seconds per generation | Product guessing or mic-only conversation |
| One location within a take, consistent mic and eyeline, native in-scene audio | Question, audience, participant, setting and tone |
| Exact approved words; measured cuts/captions; graphics drawn locally | Follow-up, answer, brand entrance and ending |
| Product guards when product-guess is selected | Product reference required only for product-guess |

# Agent version

## Choose an execution and prepare references

`product-guess` uses a real standalone object reference and the existing handover/reveal
renderer. `conversation` uses a single participant and an interviewer without a product,
phone or screen. Conversation shots are question, answer, followup and optional silent
reaction. Do not put product handling into this mode. It is preview-only until delivery
is validated; the paid runner refuses it.

Reuse the user's compatible reference first, then approved brand work and inspected library
entries. Run `scripts/prepare_script_context.py --brief <brief.json> --references <project-refs.json>
--out <script-context.json>`. The seed library contains contrasting observed exchanges,
not universal lines to copy. Tag new records by format, execution modes, language, audience
and buying context. Store source, observation scope, speaker turn functions, transfer rule,
authorship evidence and limitations. Keep user-private sources project-scoped.

If selection says `needs-reference`, search its targeted queries, inspect an actual exchange,
record it and run selection again. A URL, caption or imagined example is insufficient.
If only transcripts are available, record that delivery is missing. Product claims still
come from the current angle bank; source-brand facts and endorsements do not transfer.

## Write before timing the shots

1. Load [[composes::write-video-ad-script]] with the scoped [[derived-from::ad-angle-miner]]
   angle, recipe, selected references and current product facts. Return the reference ids
   and identify the specific turn mechanic used; never claim to have observed missing media.
2. Pick a question the selected person could answer without knowing the sponsor. Use an
   actual detail, event, opinion or visible object. Avoid questions built solely to open a
   feature pitch, such as asking for the exact capability the brand sells.
3. Give the participant an independent concern. Let their answer cause the follow-up.
   Do not make them conveniently discover the brand, endorse it or ask for a link.
   A repeated phrase is not automatically a useful follow-up. State what the interviewer
   learned from that reply and what the next question seeks to understand. If a setup
   asks about outfits but the answer abruptly becomes a fit complaint, repair that jump.
4. Write two distinct exchanges, not synonym variations. Uneven turn lengths are allowed.
   Use ordinary spoken words. Do not sprinkle filler, laughter or hesitation to simulate
   humanity. Read the words without stage directions before adding performance notes.
5. Connect the brand through one supported explanation or the ending. A mic-only exchange
   can lead to a brand card; nobody must recite the slogan or website. Record the relevance
   of that ending. No fake purchase history, credentials or results. Generated scenes carry
   an AI-generated dramatization disclosure in the locally drawn brand layer.
6. Then map words into native brand config shots. Conversation timing uses a provisional
   ceiling of 2.5 words/second including both voices; this does not verify performed timing.
   A longer conversation needs a separately validated production route, not rushed speech.
   For the current preview, the ending is a 4-second card with at most 10 words including
   the brand and CTA. Check its claims separately; do not promise a result from a feature.

## Review and stopping rule

Use the writer's dialogue review and a separate words-only reading. Natural language and
turn logic must each reach the proposed 4/5 floor; supported facts and a good average do
not compensate. Keep uncertainty visible. Jev screens; a generative critic identifies
exact failed lines and may propose one supported repair. After at most two repair passes,
keep a failing exchange as a draft. Human review decides whether the words are usable.

The October street trial found that supplying references alone did not clear the proposed
quality floor. Do not treat a reference id as evidence that the dialogue works. Read the
brand card separately: an adjustable slide does not establish that a band stays put,
and shared brand context does not establish that a new teammate is already caught up.

Run the native config validation and `single_gen.py --brand <config.json>` dry run before
review. Preserve product-guess regression checks. Do not label a successful dry run as a
successful video or assume a reference-conditioned draft has become human quality.
