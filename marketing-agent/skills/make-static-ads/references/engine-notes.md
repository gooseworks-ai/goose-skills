# Engine notes — how the GooseWorks ad tools behave

The live tool answers are the truth for parameters. These notes cover what the tool descriptions don't say.

- **`ads_render` is thin.** It sends the agent's `prompt` and `image_urls` (public https, in order) to the image model word for word and does nothing else. Everything the server pipeline does around the image model, the agent does itself (the `make-static-ads-compose` skill (`../../make-static-ads-compose/SKILL.md`), the `make-static-ads-render-review` skill (`../../make-static-ads-render-review/SKILL.md`)). Every retry is a paid render.
- **Read sizes.** For Steps 1–5 read summary, kit, products and competitors lean (with `product_ids`); a lean read already returns every `must` and `dont` learning. For compose, read the kit and learnings in full **once per batch** (the kit is very large; a shell host saves it and reads fields with `jq`). Never `detail: "full"` on every section at once.
- **The kit's font may be a guess.** The kit always returns a font, often one the server guessed (`typography.source: "mapped"`), and Inter for many software, finance and services brands. That is why Step 2 asks.
- **List reads are heavy.** An unfiltered `ads_creative_read` carries video plans and can be very large — always filter (`approved_only`, `tags`, `batch_id`) with a small `limit`.
- **Edits are unquoted.** `regenerate`, `precision_edit` and `resize` return no dry-run price, so they are not used. Every remake, text fix, extra placement and copy variant is a composed, quoted `ads_render` call (copy variants may also use the layer split).
- **Polling.** `job_get` (`kind: "ads_batch"`) reports the batch `status` as `complete` when done and each creative's `pending` count; stop when every `pending` is 0.
- **Campaign records are input only.** `campaign_read` gives an approved campaign's brief and concepts (use them only when the brief's Status line says "Approved"); this playbook never generates through the campaign tools.
