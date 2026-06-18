---
name: verify-product-image
description: QC gate for a generated static ad image — verify the file opens, matches the requested dimensions, shows the correct product/subject (right shape, colour, label, logo), and has no garbled text or severe artifacts. Records pass/fail/needs-human in verification.md. Used as the final check in the static ad remix flow before shipping.
---

# verify-product-image

Verify image files open, match requested dimensions, show the requested subject/product, and have no severe artifacts.

## Checks

- Confirm required input files exist.
- Confirm output files or written plans match the skill contract.
- **Product/asset:** the featured hero is the brand's real product (or app UI for SaaS), matching the
  kit asset — not a mascot, logo, or placeholder standing in for the product.
- **Brand alignment:** colours come from the intended source (the reference's palette for
  `style_source: template`, the kit's documented `colors` for `brand`) — **no invented/off-brand
  colour** (e.g. an accent pulled off a logo or mascot). Typography matches the kit's fonts.
- **Text/logo:** copy and label text are real and correctly spelled; any logo is the brand's correct,
  undistorted mark.
- Record pass, fail, skipped, blocked, or needs human review in `verification.md`.
