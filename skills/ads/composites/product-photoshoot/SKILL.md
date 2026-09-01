---
name: product-photoshoot
description: Create faithful studio, lifestyle, and on-model product photography through the GooseWorks Product Photos workflow, then approve selected results for reuse in future creative work.
---

# Product Photoshoot

Turn real catalog images into publish-ready product photography while preserving silhouette, materials, logo, packaging, and colorway. The GooseWorks backend uses the same generation, fidelity review, and retry pipeline as its Product Photos studio.

## Prerequisite

This workflow requires the GooseWorks MCP tools. If they are unavailable, tell the user how to install the GooseWorks MCP connection and stop before generation.

## Workflow

1. Resolve the brand with `brand_list` and the product with `brand_get_context { brand_id, sections: ["products"] }` (read `products.items`; `products_query` filters by name).
2. If the product is missing, import it with `brand_update { brand_id, patch: { products: [{ import_kind, import_url, name? }] } }` — `import_kind` is `product_url`, `shopify_store`, or `image_url` (a public image URL; requires `name`). Poll the returned job with `job_get { job_id, kind: "product_import" }`; do not re-submit an in-progress import.
3. Clarify the intended image: studio, lifestyle, on-model, close-up, setting, aspect, and count. Do not invent product attributes.
4. Call `photos_generate` with `dry_run: true` and show the user the credit estimate. Confirm count and quality before spending.
5. Call `photos_generate` with the chosen brand, product, category, controls, count, quality, and optional prompt. Human model imagery requires the user's rights attestation (`attestation_accepted: true`).
6. Poll `photos_get { brand_id, generation_id }` until `complete`, `partial_failure`, or `failed`. Do not submit a duplicate while it is running.
7. Show every result and status. Let the user choose the keepers; use `photos_update` with `action: "approve"` only for selected results and `action: "archive"` for rejected ones.

## Tool map

- Brand and catalog: `brand_list`, `brand_get_context` (`products` section), `brand_update` (product import via `patch.products`), `job_get` (`kind: "product_import"`)
- Cost and generation: `photos_generate` (`dry_run: true` for the quote), `photos_get`
- Results: `photos_list`, `photos_update` (`action: "approve"` / `"archive"`)

## Rules

- Ask before spending credits.
- Approved photos become reusable brand creative inputs; unapproved photos do not.
- A fidelity-flagged output may be shown for review but must not be described as approved.
- Never imply that a generated person is a real customer or spokesperson.
