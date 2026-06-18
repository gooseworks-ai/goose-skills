---
name: verify-product-image
description: QC gate for a generated static ad image — verify the file opens, matches the requested dimensions, shows the correct product/subject (right shape, colour, label, logo), and has no garbled text or severe artifacts. Records pass/fail/needs-human in verification.md. Used as the final check in the static ad remix flow before shipping.
---

# verify-product-image

Verify image files open, match requested dimensions, show the requested subject/product, and have no severe artifacts.

## Checks

- Confirm required input files exist.
- Confirm output files or written plans match the skill contract.
- Record pass, fail, skipped, blocked, or needs human review in `verification.md`.
