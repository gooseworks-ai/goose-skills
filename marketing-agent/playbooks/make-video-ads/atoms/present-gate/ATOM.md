---
name: present-gate
description: Internal step of make-video-ads. Presents the script gate (and on the custom path the ingredients gate) so the human can say yes confidently — the saved script, its traces, real vs generated, the length and ratio it will actually be, the exact price and what the yes covers — and records the yes in their own words.
---

# present-gate

**Reads:** the saved plan and its quote (`gooseworks:video_change` / `video_read` answers), script-check's output, `references/paths-and-gates.md` §2, §4–5.
**Writes:** the human's approval through `gooseworks:video_approve`.

1. **Before the plan card is drawn** (Step 5 checks candidates before saving): post the pitch, claim and source trace, cuts, people and disclosures, real vs generated, the actual length and ratio, up to three risks. After the card is up, add only what it does not show; without cards print `card.text_summary` as it is and add only those notes. Never print the script twice; mention the other saved scripts only when asked.
2. **The question** is built from the answer's required sentences: the price as printed, "your yes covers up to N credits if the price shifts", the voice it covers; on custom, the data-sharing sentence word for word and what the script-phase yes spends now (presenter stills, voice auditions); on a shell host, that the video maker will be set up and run on their computer.
2b. **Two options when the style allows a batch:** lead only, or lead + 2 hook variants. Variants keep the lead project: draft two more with `gooseworks:video_batch` `lines` (same style, `count: 2`, `change: "hook"`), give each the lead's full scenes with only the hook changed (`video_change`), name and script-check them. Show the shared body once plus each variant's hook words, and the lead's quote and the batch's quote exactly as given — never added together. Trade-off in one line: a readable hook test vs a body defect repeated in all three (lead only is the safer first run for a new style). If the marketer picks lead only, remove the drafts (`videos[].remove`). Approve with the lead's `quote_id` and, for variants, the batch's `quote_ids` and total.
3. **Wait.** A card on screen → one short line; wait for the press or their words.
4. **Record the yes:** ready-made style → `video_approve` with `quote_id` and `quoted_credits`. Custom → `video_approve` `custom` with `phase`, `review_token`, `total_credits` (from the approval quote), `expected_revision`, the chosen `quality_tier`, and `user_quote` = their exact words. A batch → `quote_ids` and the batch total. Never approve on your own.
5. **Ingredients gate (custom):** the actual prepared pieces (presenter look, voice audition, key stills) and the cumulative price; second yes → `phase: "ingredients"`.
6. **After a yes:** a price change inside the engine's price buffer may be re-approved silently only if words, claims, people and music are unchanged; any change is shown again first. Committed above approved, or `budget_exceeded` → stop and ask.
