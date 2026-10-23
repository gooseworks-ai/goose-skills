# Engine notes — how the GooseWorks ad tools behave

The live tool answers are the truth for parameters. These notes cover what the tool descriptions don't say.

- **`ads_render` is thin.** It sends the agent's `prompt` and `image_urls` (public https, in order) to the image model word for word and does nothing else. The agent writes the whole prompt (`prompts.md`) and judges the result (the `make-static-ads-render-review` skill (`../../make-static-ads-render-review/SKILL.md`)). Every retry is a paid render.
- **Read small, read once.** Tool answers can be huge (a full kit is 50–150K characters; an unfiltered creatives list is over 1 MB). Use these calls, and on a shell host save the big ones to a file once per batch and read fields from the file (`jq`) instead of reading the answer again:

| Need | Call | Size |
|---|---|---|
| Brand, products, competitors, `must`/`dont` learnings (Steps 1–5) | `brand_read` `sections: ["summary","kit","products","competitors","learnings"]` (lean, the default) | small |
| One product's full record | `brand_read` `product_ids: [<id>]` | small |
| Kit and learnings in full, for prompts (once per batch) | `brand_read` `sections: ["kit","learnings"]`, `detail: "full"` → save to `kit.json` | very large: save once, read every field used by this batch |
| Brand facts and claims | `brand_knowledge_browse` once, then `brand_knowledge_search` with `source_types` and `product_id`, `limit` ≤ 25 | medium |
| Ads this playbook made before | `ads_creative_read` `tags: ["made-by:make-static-ads"]`, `limit: 20` | small |
| Other ads made in GooseWorks (in the app, or before this tag existed) | the brand's batch files first; then `ads_creative_read` `limit: 3`, opening single ones with `creative_id`. Never page through the list | very large: video projects ride along on every row (10 rows were over 700K characters in a test) |
| Own and competitor imported ads | `ads_template_read` `mode: "mine"` / `"competitor"`, `filters.format: "image"`, `limit: 20` | medium |
| One template | `ads_template_read` `template_id` | small |

Never `detail: "full"` on every section at once, never the `sources` section (saved web passages; it alone can pass 100K characters), and never a creatives list without `tags`, `status`, `batch_id` or `approved_only`. An answer over about 50K characters: save it to a file once and read fields from the file.
- **Polling.** Every `job_get` answer repeats the full prompt. Poll every 30–60 seconds, or check the render's image URL instead.
- **Capability gate.** `ads_generate` is not an adapter for `ads_render`: it re-composes the prompt and may add source images. With no thin render tool, report the missing capability and stop before spending.
- **The kit's font may be a guess.** The kit always returns a font, often one the server guessed (`typography.source: "mapped"`), and Inter for many software, finance and services brands. That is why Step 2 asks.
- **Edits are unquoted.** `regenerate`, `precision_edit` and `resize` return no dry-run price, so they are not used. Every remake, text fix, extra placement and copy variant is a written, quoted `ads_render` call (copy variants may also use the layer split).
- **Polling.** `job_get` (`kind: "ads_batch"`) reports the batch `status` as `complete` when done and each creative's `pending` count; stop when every `pending` is 0.
- **Campaign records are input only.** `campaign_read` gives an approved campaign's brief and concepts (use them only when the brief's Status line says "Approved"); this playbook never generates through the campaign tools.
