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
python3 <scripts folder>/lint_scripts.py --candidates working/script/candidates.json --shape working/script/shape.json --rules working/brand-rules.json --customer-words working/script/customer-words.json
python3 <scripts folder>/critique_scripts.py --candidates working/script/candidates.json --shape working/script/shape.json --rules working/brand-rules.json --customer-words working/script/customer-words.json --brief "what the ad is for"
```

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
