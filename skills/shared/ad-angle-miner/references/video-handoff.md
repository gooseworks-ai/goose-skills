# Video angle research handoff

**Summary.** This is the shared input contract between ad-angle-miner and
write-video-ad-script. Preserve angle ids, product scope and sources so a later run can
write from the research without guessing or collecting it again. An angle is a promise;
a template is how the promise is expressed.

## Saved location and selection

Use the GooseWorks workspace file tools at `video-scripts/<brand_id>/<product_id>/angle-bank.json`.
Keep `customer-words.json` beside it and a project-local copy under `working/script/`.
Read the existing bank before replacing it; preserve ids for unchanged angles. One bank
has one brand and product scope. For several products, retain separate product banks
rather than overwriting another product's research or mixing claims. A legacy brand-level
bank is reusable only when its product_id matches.

Pass the bank itself or a readable workspace pointer, selected angle id, product id and
template id to the video runtime. A hook-only handoff loses the strategy and evidence.
When the runtime cannot save a pointer, keep the full context in the current run. Workspace
failure is a reuse limitation, not permission to fabricate a bank in a later session.

The caller also hands the writer the **current creative brief**, read from the existing
Brain/brand and project records: exact variant, buyer situation, supported mechanism,
objective, current offer/CTA, constraints, applicable prior rejections and pronunciations,
locked words and delivery intent. Keep source pointers/revisions and missing evidence
visible. This run-specific brief travels as `creative_brief` inside the prepared angle
context via the writer's `--brief` option; the writer's files reference defines it.
Do not overwrite the reusable angle bank with one project's taste or let an old bank
replace a newer explicit direction. Quotes and preferences never become product facts.
The writer and the chosen custom/template production skill receive the same brief.

## Required JSON shape

```json
{
  "schema_version": "video-angle-bank.v1",
  "brand_id": "brand-demo",
  "product_id": "product-bottle",
  "researched_at": "2026-10-02",
  "audience": "commuters carrying a drink beside a laptop",
  "objective": "product purchase",
  "offer": null,
  "cta": "Shop the bottle",
  "facts": [
    {"id": "f1", "product_id": "product-bottle", "text": "A screw-top lid",
     "source": "https://example.com/product", "verified_at": "2026-10-02"}
  ],
  "quotes": [
    {"id": "q1", "text": "I keep my drink in a separate pocket",
     "source": "https://example.com/review", "scope": "category", "tag": "moment"}
  ],
  "references": [
    {"id": "r1", "source": "https://example.com/ad", "kind": "paid",
     "observation": "Shows the closure before a packing scene",
     "metric": {"active_days": 35}, "performance_known": false}
  ],
  "angles": [
    {"id": "a1", "angle": "Show the closure before packing",
     "promise": "A bottle with a visibly secure screw closure",
     "awareness": "solution-aware", "angle_type": "proof",
     "evidence_ids": ["f1", "q1", "r1"],
     "compatible_template_ids": ["template-demo"],
     "fit_reason": "The recipe supports close-up product actions",
     "proof_plan": "Show the actual closure; do not claim leak-proof without a verified test",
     "missing_inputs": [], "evidence_status": "supported", "research_score": 78}
  ]
}
```

This is a synthetic illustration, not research about a real brand. Real sources must
actually have been read. Use canonical product ids when available; for a standalone
brief use a stable run-local product key and keep it consistent.

## Evidence meaning

New video banks include the following on every angle:

```json
"buyer_case": {
  "role_or_routine": "the current campaign consumer",
  "task_or_decision": "a concrete task or choice",
  "available_inputs": "what they already have",
  "current_approach": "what they do now, if relevant",
  "constraint": "what matters to this choice",
  "desired_output": "what they want instead",
  "evidence_ids": ["q1"],
  "status": "sourced concern; proposed scene is authored"
},
"product_role": {
  "buyer_action": "what the buyer supplies or does",
  "operation_or_purpose": "supported operation or intended role",
  "output_or_role": "what they receive or use it for",
  "why_it_helps": "the connection to this case",
  "fact_ids": ["f1"],
  "limits": "what is not established"
}
```

These fields extend v1 without invalidating older sourced banks. The writer enriches
a missing case or role from existing evidence before writing, preserving the selected
id and promise. If evidence cannot support the connection, record the gap and a
provisional status; do not fabricate details or silently replace the chosen angle.
Context fields explain strategy, not dialogue. The actual ad must still communicate
the useful connection without relying on its private brief.

- **Facts** authorize only what their current source supports for this exact product.
- **Quotes** preserve buyer language and attributed experience, with brand/product or
  competitor/category scope. They do not authorize general claims or fake testimonials.
- **References** describe observed storytelling. Keep paid, verified organic and unknown
  distribution separate. Duration, variants and views are not conversion labels.
  Dialogue directions additionally retain dialogue_mode, observed=true,
  observed_scope, speaker_turns and transfer_rule so the writer can study actual
  conversation. Street ads require a complete inspected commercial interaction:
  commercial_evidence, inspection coverage/modalities/duration/method, ordered timestamped
  turn text and actions, ad_interaction setup/reason/hook/product connection/payoff,
  explicit unseen-setup limits, offering/action compatibility and observation limitations.
  Partial hooks or editorial transcripts cannot satisfy that requirement. Keep full
  private transcripts project-scoped and link them; label paraphrased turn content.
  Podcast editorial references remain provisional with their limitations. The
  writer's files reference defines these fields; do not relabel an invented beat map
  as observed dialogue.
- **Angles** cite those evidence ids and template ids whose full recipes were checked.
  A provisional angle records missing support. It cannot be described as proven.

Validate and select with the writer's preparation script. It rejects wrong product or
brand scope, missing sources, duplicate ids, unknown evidence and an incompatible
selected angle. It checks traceability; an agent or critic still checks semantic truth,
freshness, audience relevance and production feasibility.

Legacy Markdown banks are read-only source material for migration. Assign stable ids
to actual records and preserve source text. Missing facts, links or template compatibility
need research or an explicit provisional status, never invented defaults.

## Related

- [[references::write-video-ad-script]] — validates and consumes this contract.
