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

- **Facts** authorize only what their current source supports for this exact product.
- **Quotes** preserve buyer language and attributed experience, with brand/product or
  competitor/category scope. They do not authorize general claims or fake testimonials.
- **References** describe observed storytelling. Keep paid, verified organic and unknown
  distribution separate. Duration, variants and views are not conversion labels.
  Podcast/street directions additionally retain dialogue_mode, observed=true,
  observed_scope, speaker_turns and transfer_rule so the writer can study actual
  conversation. Preserve transcript-only and editorial-source limitations. The
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
