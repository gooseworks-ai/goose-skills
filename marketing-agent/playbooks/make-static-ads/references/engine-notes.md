# Engine notes — how the ad engine behaves (staging, 2026-10-16)

Load at Steps 1, 7 and 9. These shape the method; the live tool answers are the truth for parameters.

- **Research first.** Generation needs the brand's research complete (`brand_read` → `research_status: "complete"`); otherwise it fails after the yes. `running` → wait (`job_get` `kind: "brand_research"`) or come back; `none` → the brand isn't set up yet (say so in plain words; setup is a separate job); a brand with no website or store link can't complete research → images can't be generated yet: offer the grid, copy and prompt fences as a copy-only deliverable.
- **Brand reads.** Read summary, kit, products and competitors lean (with `product_ids`); a lean read already returns every `must` and `dont` learning. Never `detail: "full"` on everything — it adds a very large context bundle.
- **One prompt per call.** `ads_generate` gives every template and variant in a call the same words, so each concept is its own call: one dry-run quote, one submit. `variants` are re-rolls of the same text, never hook variants. Ratios are set per source item.
- **Edits are unquoted.** `regenerate`, `precision_edit` and `resize` return no dry-run price, so they are not used until they can be quoted. Every remake, text fix and extra placement is an `ads_generate` remix of the creative (`source.creative_ids` with `render_id`, the new ratio on the item), dry-run first.
- **List reads are heavy.** An unfiltered `ads_creative_read` carries video plans and can be very large — always filter (`approved_only`, `tags`, `batch_id`) with a small `limit`.
- **Tags replace the whole set** and are stored lower-case: read the creative's current tags, merge, write the full set once; write and query lower-case (`angle:a-07`). Whether tag writes reach the server is unverified (server-needs) — picks also go in the batch file, which is the record of truth.
- **Campaign path.** Use a campaign's concepts only when its brief's Status line says "Approved". A concept needs non-empty proof to generate; the server refuses a claim whose product scope is unknown. Size with `count` = the number asked (`planned_ads` triples it).
