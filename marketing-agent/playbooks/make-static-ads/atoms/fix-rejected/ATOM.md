---
name: fix-rejected
description: Internal mode of make-static-ads. Fixes a static image ad the platform rejected — finds the ad, maps the platform's reason to the line or element at fault, fixes copy for free or re-composes the image text on a quote, re-runs the claims and policy checks, and answers the request. A rejected video is the video playbook's job.
---

# fix-rejected

Runs in place of Steps 1–12. Steps 3–6 of the playbook do not run: no new concepts.

**Reads:** the open `Fix needed: for make-static-ads` line in `ads/campaigns/<slug>/rotation-requests.md` and the health line of `ads/campaigns/<slug>/state.md` (`gooseworks:file_read`), or, asked in chat, the ad and the platform's exact reason (ask for both if missing); the creative (`gooseworks:ads_creative_read` by tag, or `gooseworks:ads_template_read` `mode: "mine"`); its batch-file entry.
**Writes:** the fix in the batch file under the ad; a `Fix ready:` answer under the request line (re-read the file, insert, write the whole file back with `gooseworks:file_write`).

1. **Find the ad** and read its copy, its on-image text and its compose record.
2. **Map the reason** to the exact line or element at fault (`../../../../atoms/ad-policy-check/ATOM.md`).
3. **Fix it:**
   - The fault is in the copy around the image → rewrite that line (`atoms/ad-copy/ATOM.md`). Free.
   - The fault is in the image → re-compose with `atoms/compose/ATOM.md`, the creative's own render as the template (it is the brand's own ad, normal path), the fix as the User instructions; then `gooseworks:ads_render` `dry_run: true`, the quote as given, the marketer's yes, submit, and judge it (`atoms/render-review/ATOM.md`).
   - Nothing in the ad breaks the rule → say so and suggest asking the platform for a review.
4. **Re-run both checks** on the fixed ad: `atoms/claims-extract/ATOM.md` and `ad-policy-check`.
5. **Answer** `Fix ready:` under the request, and offer to save the lesson in the marketer's words (`../../../../atoms/save-learning/ATOM.md`).
