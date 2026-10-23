---
name: make-static-ads-fix-rejected
description: >-
  Step of the make-static-ads playbook: fixes a static image ad the platform rejected — finds the ad, maps the platform's reason to the line or element at fault, fixes copy for free or re-composes the image text on a quote, re-runs the claims and policy checks, and answers the request. A rejected video is the video playbook's job. Run make-static-ads instead; not for direct use.
version: 0.6.0
---

# fix-rejected

Runs in place of the playbook's steps: no new board. The rejected ad's board row and prompt (in its batch file) are the basis; keep its idea and change only what the rule requires.

**Reads:** the open `Fix needed: for make-static-ads` line in `ads/campaigns/<slug>/rotation-requests.md` and the health line of `ads/campaigns/<slug>/state.md` (`gooseworks:file_read`), or, asked in chat, the ad and the platform's exact reason (ask for both if missing); the creative (`gooseworks:ads_creative_read` by tag, or `gooseworks:ads_template_read` `mode: "mine"`); its batch-file entry.
**Writes:** the fix in the batch file under the ad; a `Fix ready:` answer under the request line (re-read the file, insert, write the whole file back with `gooseworks:file_write`).

1. **Find the ad** and read its copy, its on-image text, its board row and its prompt.
2. **Map the reason** to the exact line or element at fault (the `ad-policy-check` skill (`../ad-policy-check/SKILL.md`)).
3. **Fix it:**
   - The fault is in the copy around the image → rewrite that line (the `make-static-ads-ad-copy` skill (`../make-static-ads-ad-copy/SKILL.md`)). Free.
   - The fault is in the image → rewrite its prompt with the `make-static-ads-compose` skill (`../make-static-ads-compose/SKILL.md`): the same scene with the faulty line or element changed; the rejected render may be attached as the brand's own image to keep the look. Then `gooseworks:ads_render` `dry_run: true`, the quote as given, the marketer's yes, submit, and judge it (the `make-static-ads-render-review` skill (`../make-static-ads-render-review/SKILL.md`)).
   - Nothing in the ad breaks the rule → say so and suggest asking the platform for a review.
4. **Re-run both checks** on the fixed ad: the `make-static-ads-claims-extract` skill (`../make-static-ads-claims-extract/SKILL.md`) and `ad-policy-check`.
5. **Answer** `Fix ready:` under the request, and offer to save the lesson in the marketer's words (the `save-learning` skill (`../save-learning/SKILL.md`)).
