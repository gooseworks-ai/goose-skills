# Working files

Every file lives in the project's working folder under a script subfolder. The rule
check and the critic read these exact shapes. The strict rule check also consumes the shared angle context and visual plan.
Keep research sources separate from product claim authorization.

## shape.json: what the format needs (Step 1)

```json
{
  "template_id": "template-demo",
  "format": "ugc-talking-head",
  "requires_visuals": true,
  "allowed_visual_modes": ["existing", "text"],
  "available_asset_ids": ["product-photo", "demo-clip"],
  "words_per_second": 3.0,
  "total_seconds": 21,
  "cta_beat": "cta",
  "beats": [
    {"id": "hook",  "speaker": "creator", "seconds": 3, "kind": "spoken"},
    {"id": "pain",  "speaker": "creator", "seconds": 5, "kind": "spoken"},
    {"id": "proof", "speaker": "creator", "seconds": 7, "kind": "spoken"},
    {"id": "card",  "seconds": 2, "kind": "on_screen", "max_words": 6, "optional": true},
    {"id": "cta",   "speaker": "creator", "seconds": 4, "kind": "spoken"}
  ]
}
```

- `kind` is one of `spoken` (voiceover or dialogue), `on_screen` (a text card), `bubble`
  (a chat message), `lyric`, or `visual` (a silent action with no text budget).
- `max_words` overrides the seconds-based budget for a beat.
- `optional` beats may be left out.
- The first beat is the opening beat; every hook must fit its budget.
- Ids may repeat when the format alternates (a chat thread: them, me, them, me). Each
  concept beat fills the next slot with that id, in order.

### Speech timing for this run

Read [pacing](pacing.md). Add these fields to the shape and spoken beats; they do not
modify the recipe. This example uses a hypothetical brief target, not a measured result:

```json
{
  "words_per_second": 3.0,
  "pacing_source": {"kind": "brief", "detail": "Brief requests a brisk, natural creator read."},
  "delivery_guidance": {"words_per_second": 1.9, "basis": "recipe_estimate", "detail": "Existing recipe guidance, not independently tested."},
  "total_seconds": 15,
  "beats": [
    {"id": "hook", "kind": "spoken", "seconds": 3, "pause_seconds": 0.5},
    {"id": "proof", "kind": "spoken", "seconds": 7, "speech_seconds": 5, "words_per_second": 2.6,
     "pacing_source": {"kind": "brief", "detail": "Leave room to see the product action."}},
    {"id": "cta", "kind": "spoken", "seconds": 3, "max_words": 7},
    {"id": "endcard", "kind": "on_screen", "seconds": 2, "max_words": 6}
  ]
}
```

- `words_per_second` is the desired rate, inherited from the shape unless a spoken beat
  overrides it. Different templates and ads keep different rates.
- `pacing_source` has `kind` (recipe, reference, brief or fallback) and a concrete `detail`.
  Reference sources also require `reference_id` pointing to an observed audio/video
  record in references.json. Transcript-only records cannot establish cadence. Legacy
  files without a source receive an explicit unverified legacy/fallback label in lint.
- `speech_seconds` is the audible speech window within `seconds`. Otherwise it defaults
  to `seconds` minus `pause_seconds`. Both are nonnegative; the speech window plus pauses
  cannot exceed the beat. Remaining time can carry silent visual action. Bracketed cues
  do not automatically allocate a pause; record its duration explicitly.
- `delivery_guidance` optionally preserves a recipe estimate or an observed rendered
  baseline: `words_per_second`, `basis` (recipe_estimate or observed_render), and `detail`
  identifying the recipe or rendered evidence. It is inherited or overridden by beat.
  A target above it raises W_PACING_EXPERIMENT; it is not a hard engine ceiling or a pass.
- For these timing profiles the budget is the smaller of speech-window × rate (rounded)
  and any explicit `max_words`. Strict lint allows no extra word-count tolerance. A
  target cannot override a recipe's word limit; W_PACING_LIMIT exposes the conflict.
  Legacy shapes retain the max_words override and existing estimate tolerance.
- Ordered selected beat durations must fit `total_seconds`, including pauses and silent
  beats. Omitted optional beats reserve no time; repeated ids keep separate slots.
- Only `spoken` beats count toward spoken totals. Chat, cards, visual-only beats and
  lyrics keep their separate reading/layout or musical checks. The timing report is an
  ordered array so repeated ids retain their own speakers' windows and rates.

Lint writes per-concept `timing` rows with slot, id, words, speech_seconds,
words_per_second, target_words, word_budget, max_words, pacing_source, delivery_guidance,
required_words_per_second and estimated_speech_seconds. Keep these rows with the reviewed
native script and production direction. They are estimates, not generated-audio evidence.

## customer-words.json: the buyers' own words (Step 2)

```json
{
  "brand_id": "…",
  "updated": "2026-10-01",
  "quotes": [
    {"id": "q1", "text": "I was waking up at 3am every single night and staring at the ceiling",
     "source": "https://…", "kind": "review", "rating": 5, "tag": "moment"},
    {"id": "q2", "text": "the smell is calm, not fake spa lavender",
     "source": "https://…", "kind": "comment", "tag": "outcome"}
  ]
}
```

- `kind` is one of `review`, `comment`, `forum`, `ticket` or `brand`.
- `tag` is one of `pain`, `desire`, `objection`, `outcome`, `moment` or `switching`.
- `text` is verbatim and `source` is the real link.

Save a copy to the GooseWorks workspace with the MCP file tools (file_write), at
video-scripts, then the brand id, then the product id, then customer-words.json, so the next video for this
brand reuses it. If the file tools refuse, skip it; never write it into the user's own
folders.

## references.json: persuasion records (Step 3)

The checker accepts a record list, a single record, or the selector's context envelope
with a `references` list. Pass the selector output directly; do not rewrite its records.

Dialogue records additionally require observed conversation provenance. This podcast
example records paraphrased turn functions, not invented dialogue or a copied transcript:

```json
{
  "id": "conversation-1",
  "url": "https://publisher.example/interview",
  "dialogue_mode": "podcast",
  "observed": true,
  "observed_scope": "transcript",
  "speaker_turns": [
    {"speaker": "host", "does": "describes one concrete habit"},
    {"speaker": "guest", "does": "reacts to that habit"},
    {"speaker": "host", "does": "clarifies the guest's reaction"}
  ],
  "transfer_rule": "Transfer habit, reaction and clarification; not wording or claims.",
  "limitations": "Editorial transcript; audio delivery and ad performance unverified."
}
```

Use dialogue_mode podcast or street-interview. At least three observed turns from
two speakers and a real source pointer are required. **Street ads additionally need**:

- commercial true and commercial_evidence; excluded/editorial records cannot pass;
- inspection coverage complete-clip, modalities visual and transcript, duration_s and method;
- ad_interaction strings: edited_opening, visible_setup, participant_reason, viewer_hook,
  product_connection, payoff, unseen_setup (explicitly unknown where outside the edit);
- ordered speaker_turns with start, end, text, speaker and does; label paraphrases and
  retain/link the complete transcript evidence;
- allowed_offering_types, interaction_types, transfer_rule and observation limitations.

Run [[references::render-street-interview]]'s prepare_script_context with offering_type
and interaction_type before writing. Its detailed street-script-writing guide explains
the shared record. Keep source-brand claims separate from current product facts.
Store the candidate's situation_brief alongside its words/actions for review.
Cite the record in the candidate's
reference_id. The lint check verifies these inputs, not the truth of an observation or
the human quality of a script. The critic must inspect the same record. Transcript-only
observations must not claim to have heard delivery or watched reactions.

```json
[
  {"id": "r1", "source": "format demo", "url": "https://…",
   "hook": "…", "hook_family": "confession",
   "beats": [{"role": "hook", "seconds": 3, "words": 9, "does": "admits the problem"}],
   "product_enters": "second 6", "proof_device": "pours coffee on it",
   "objection": "price", "cta": "…", "why_it_works": "…",
   "transfer_rule": "keep the confession-then-demo move; never reuse its lines or offer"}
]
```

## angle-context.json and preparation

Read ad-angle-miner's video-handoff reference. Its bank is the source of truth. Run:

```
python3 <scripts folder>/prepare_angle_context.py --bank working/script/angle-bank.json --brand-id brand-demo --product-id product-bottle --template-id template-demo --angle-id a1
```

Omit angle-id only when the direction is open. The output preserves the bank and filters
to eligible angles, with template_id and locked_angle_ids. A missing or incompatible
selected angle is an error, not permission to invent a replacement.

## candidates.json: eligible concepts (Step 5)

```json
{
  "brand_id": "brand-demo",
  "product_id": "product-bottle",
  "template_id": "template-demo",
  "concepts": [
    {
      "id": "c1",
      "angle_id": "a1",
      "angle": "the exact selected angle text",
      "evidence_ids": ["f1", "q1"],
      "claims": [{"text": "the stated product claim", "fact_ids": ["f1"]}],
      "proof_plan": "show the actual product action authorized by the recipe",
      "persona": "a nurse off night shifts who can't switch off",
      "awareness": "problem-aware",
      "angle_type": "pain",
      "quote_ids": ["q1"],
      "reference_id": "r1",
      "product_fact": "lavender and magnesium",
      "typicality": 0.2,
      "hooks": [
        {"id": "c1h1", "family": "confession", "text": "…"},
        {"id": "c1h2", "family": "named-enemy", "text": "…"}
      ],
      "beats": [
        {"id": "hook", "text": "…"},
        {"id": "pain", "text": "…"},
        {"id": "proof", "speaker": "creator", "text": "…",
         "visual": {"description": "show the real product action", "mode": "existing",
                    "asset_ids": ["demo-clip"]}},
        {"id": "cta", "text": "…"}
      ]
    }
  ]
}
```

- Beat ids match all required slots, in order, including repeated ids.
- With strict mode, every beat has its recipe speaker and a visual object (description,
  mode and actual asset_ids for existing media), not only the example proof beat.
- Every product claim is in claims and cites current facts for this exact product.
  Quotes provide language; they do not substantiate general results. The critic checks
  uncited claims and whether the cited fact actually supports the wording.
- Every concept preserves angle_id and the selected angle text, and cites evidence_ids.
- The first beat's text is the recommended hook.
- Delivery cues in brackets or parentheses, like [pause] or (laughs), are not counted
  as words.

## history.jsonl: what this brand picked (Step 8)

One JSON object per line, in the workspace next to the customer-words bank. The file
tools can't append: read the file, add the line and write it back.

```json
{"date": "2026-10-01", "format": "…", "shipped": {"concept": "c2", "hook": "c2h3", "angle": "…"},
 "passed_on": [{"concept": "c1", "angle": "…"}], "edits": [{"beat": "cta", "before": "…", "after": "…"}]}
```

## Running the two scripts

Both scripts are in this skill's scripts folder: the folder where the runtime saved this
skill's scripts when it fetched the skill. Run them **from the project folder**, the one
that holds working/. Call each script by its path in the scripts folder: their file
arguments, and the relay's result paths, are relative to where you run them.

```
python3 <scripts folder>/lint_scripts.py --candidates working/script/candidates.json --shape working/script/shape.json --rules working/brand-rules.json --customer-words working/script/customer-words.json --angle-context working/script/angle-context.json --references working/script/references.json --strict
python3 <scripts folder>/critique_scripts.py --candidates working/script/candidates.json --shape working/script/shape.json --rules working/brand-rules.json --customer-words working/script/customer-words.json --angle-context working/script/angle-context.json --references working/script/references.json --brief "what the ad is for"
```

**The rule check exits** 0 when the scripts pass and 2 when there are errors to fix.
Use strict mode for newly generated scripts. Legacy calls remain readable, but they do
not enforce the research handoff. Strict mode also enforces profiled speech budgets and
explicit word limits exactly; references carry observed delivery evidence. A source id
check establishes traceability only. Add
`--report-only` for lines the user wrote: it reports but never fails, and skips the
buyer-quote checks.

**The critic exits** as follows:

- **0**: the critique is saved to critique.json.
- **3**: relay mode (no GooseWorks credentials on this machine). It wrote one request
  per pass at once under working/mcp-requests/. For each one:
  1. Make the call with data_post_provider.
  2. Poll job_get until it is complete.
  3. Save job_get's result.output where the request says. The whole job_get reply is
     also accepted.

  Then run the same command again. The video project id must be exported first: every
  paid call is billed to it.
- **4**: no usable answer (cut off, not JSON, ids that match nothing, or a wrong file
  saved by hand). Fix or delete the bad result file and re-run, or judge the concepts
  yourself.

Set `--writer-family` to the actual writer (anthropic, openai, google or other), and
`--model` to an available OpenRouter model from a different family. A Codex/OpenAI
writer must not use the default OpenAI critic. Legacy calls default writer-family to
anthropic. With one concept it runs one pass; with more, two passes in opposite orders.
