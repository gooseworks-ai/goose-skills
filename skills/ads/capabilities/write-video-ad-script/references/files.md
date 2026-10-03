# Working files

Every file lives in the project's working folder under a script subfolder. The rule
check and the critic read these exact shapes. Fields not listed are ignored, so extra
notes are fine.

## shape.json: what the format needs (Step 1)

```json
{
  "format": "ugc-talking-head",
  "words_per_second": 3.0,
  "total_seconds": 20,
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
  (a chat message) or `lyric`.
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
video-scripts, then the brand id, then customer-words.json, so the next video for this
brand reuses it. If the file tools refuse, skip it; never write it into the user's own
folders.

## references.json: persuasion records (Step 3)

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

## candidates.json: the three concepts (Step 5)

```json
{
  "concepts": [
    {
      "id": "c1",
      "angle": "3am wake-ups",
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
        {"id": "proof", "text": "…"},
        {"id": "cta", "text": "…"}
      ]
    }
  ]
}
```

- Beat ids match the shape's ids, in the shape's order.
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
python3 <scripts folder>/lint_scripts.py --candidates working/script/candidates.json --shape working/script/shape.json --rules working/brand-rules.json --customer-words working/script/customer-words.json --references working/script/references.json --strict
python3 <scripts folder>/critique_scripts.py --candidates working/script/candidates.json --shape working/script/shape.json --rules working/brand-rules.json --customer-words working/script/customer-words.json --references working/script/references.json --brief "what the ad is for"
```

`--references` carries observed audio/video cadence evidence to both checks. `--strict`
enforces profiled speech budgets and explicit word limits exactly; it adds no research gate.

**The rule check exits** 0 when the scripts pass and 2 when there are errors to fix. Add
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

The critic's model defaults to a strong non-Claude model. Pass `--model` with another
OpenRouter id to change it (a Claude model is refused). With one concept it runs one
pass; with more, two passes in opposite orders.
