---
name: product-photoshoot
description: Create faithful studio, lifestyle, and on-model product photography through the GooseWorks Product Photos workflow, then approve selected results for reuse in future creative work.
---

# Product Photoshoot

Turn real catalog images into publish-ready product photography while preserving silhouette, materials, logo, packaging, and colorway. The GooseWorks backend uses the same generation, fidelity review, and retry pipeline as its Product Photos studio.

## Prerequisite

This workflow requires the GooseWorks MCP tools. If they are unavailable, tell the user how to install the GooseWorks MCP connection and stop before generation.

## Workflow

1. Resolve the brand with `list_ad_brands` and the product with `list_brand_products`.
2. If the product is missing, use `import_product` with a product URL, Shopify store, or public image URL. Poll `get_product_import`; do not re-submit an in-progress import.
3. Clarify the intended image: studio, lifestyle, on-model, close-up, setting, aspect, and count. Do not invent product attributes.
4. Call `estimate_product_photos` and show the user the credit estimate. Confirm count and quality before spending.
5. Call `generate_product_photos` with the chosen product, category, controls, count, quality, and optional prompt. Human model imagery requires the user's rights attestation.
6. Poll `get_product_photo_generation` until `complete`, `partial_failure`, or `failed`. Do not submit a duplicate while it is running.
7. Show every result and status. Let the user choose the keepers; use `approve_product_photo` only for selected results and `archive_product_photo` for rejected ones.

## Tool map

- Brand and catalog: `list_ad_brands`, `list_brand_products`, `import_product`, `get_product_import`
- Cost and generation: `estimate_product_photos`, `generate_product_photos`, `get_product_photo_generation`
- Results: `list_product_photos`, `approve_product_photo`, `archive_product_photo`

## Rules

- Ask before spending credits.
- Approved photos become reusable brand creative inputs; unapproved photos do not.
- A fidelity-flagged output may be shown for review but must not be described as approved.
- Never imply that a generated person is a real customer or spokesperson.
