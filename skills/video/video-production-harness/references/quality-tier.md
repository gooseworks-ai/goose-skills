# Human version

Standard or Best is the customer's price, picked at the script approval. It sets where every shot starts. No video goes above 720p/768p unless the customer asks. A picture with a must-fix problem can move up to high quality from a small allowance; any video upgrade (Seedance, 1080p) needs the customer's new yes. A clip redo is paid from the approved total when it fits, otherwise after a new yes. Nothing is upgraded silently.

---

# Agent version

The customer picks Standard or Best at the script approval (`quality_tier`, State 2.5 in setup-and-script); Standard is the default. The tier sets each shot's starting setting (the **Standard / Best** column in [shot routing](shot-routing.md)), not a hard limit. Rules decided 16 Oct 2026:

| Step | Standard | Best |
|---|---|---|
| Pictures (people, storyboard, scenes) | GPT Image 2 **medium** | GPT Image 2 **high** |
| Talking shots | VEED Fabric **480p** (the same model) | Fabric **720p** |
| Shots with no speech | H3 **768P** | H3 **768P** |
| Seedance 2.0 | only with the customer's new yes, at **720p**, no face | the same (offered for product shots with no face and fast camera moves) |
| 1080p video (H3 or Seedance) | only when the customer asks | only when the customer asks |
| Delivered file | full size at the approved ratio (1080×1920 for 9:16): the 768P picture scaled up free with lanczos ([edit-video](../edit-video.md) Phase 2 and 8) | the same |

- **Both prices come from one shot list.** Save `draft.shot_list` with the script ([create-design-brief](../create-design-brief.md) step 12):
  - `stills: [{label, scene?}]`: every picture made before the clips, up to 60; `label` 1 to 200 characters; `scene` ties a still to its shot.
  - `shots: [{scene, kind: talking|broll, seconds, faces?, product_motion?}]`: up to 60; `scene` a script scene number; `seconds` 1 to 15, so split a longer scene into shots. A shot without `faces: false` is treated as having a face.
  - The server prices `talking` as Fabric and `broll` as H3 768P. A route it does not price (Seedance, 1080p, native H3 speech, H3 dialogue) needs the owner's yes to its own price first.
  - **Only H3, VEED Fabric and Seedance 2.0 make clips on a tiered video.** Any other fal video model (Veo, Kling, ...) is refused (`custom_video_tier_setting`): route those shots to H3.
- **Show each choice as the server gives it.** For Standard and Best show `custom_review.approval_quote.tier_quotes` `total_credits` and `yes_covers_up_to`, with no math of your own. A choice with `over_credit_cap` can't be approved: offer a smaller plan and re-quote. The owner's pick goes to `video_approve` as `quality_tier` with that choice's `total_credits`. A shot they want at the other choice, or on Seedance, goes in `draft.shot_overrides` `[{scene, tier?, seedance?: true, user_quote}]` (at least one of `tier` or `seedance`; each scene once, a script scene, their words 1 to 500 characters); save it and show the new totals first. Keep the same values in `shot-plan.json`.
- **Every tiered fal call** (GPT Image 2, Fabric, H3, Seedance) **names its setting** (`quality`, `resolution`), and a clip or a scene's still names its shot (`query.shot_scene`); a shared still (cast, set) with no scene leaves it out, so no scene's override applies to it, even on a picture upgrade. After the yes the server fills a missing GPT Image 2 quality or Fabric resolution from the choice, but send them anyway. Voice and music calls take neither.
- **Price a tiered call exactly as you will send it.** The free price check (`data_price_provider`) takes the same `shot_scene`, `upgrade_reason`, `upgrade_attempt`, `upgrade_why` and `upgrade_quote` as the paid call; with `data_price_provider` they are top-level fields of each request, next to `provider`, `path`, `body` and `project_id` (`shot_scene` as a number there). Leave them out and it prices a different call: an approved Seedance shot is refused, or a scene moved to Best is priced at medium.
- **Choose the resolution before picking takes.** Write it on the shot's routing line in the design brief. Switching resolution re-rolls the take: a new take, a new seed and a new review.
- **Seedance only for shots with no face, at 720p.** It refuses photoreal faces whatever model made them, a fresh Seedream v5 Pro face included (the shared model notes, 2026-09-29), and a refused submit still bills. 1080p only when the customer asks.
- **After a `must_fix` finding** ([check severity](check-severity.md)), or an `ask` finding the customer (or you, in `review_mode: auto`) chose to fix, **judge the shot:**
  - **retry once at the same setting** when a prompt fix should work (a wrong pose, a missing prop, the wrong framing);
  - **upgrade straight away** when the cheaper setting probably can't do it (small label text, a complex product shape, many parts that must stay exact).
  - Either way record a one-line reason in the plan. A retry at the same setting sends no upgrade query (it is not an upgrade) and is paid from the approved budget. One exception: a picture already at high (Best) may retry at `quality: high` with the `failed_attempt` params below; the server records it as `still_retry` and pays it from the picture allowance.
- **Only a picture is upgraded on your own judgment:** GPT Image 2 medium → high for that one picture, from `render_estimate.upgrade_allowance` (pictures only, about two upgrades). The call adds `query.upgrade_reason` `failed_attempt` with `query.upgrade_attempt` (the failed call's operation id) and `query.upgrade_why` (the one-line reason). The server records it on the plan.
- **A picture the customer asks to upgrade** (medium → high for that one picture) is the same call at `quality: high` with `query.upgrade_reason` `customer_asked` and their words in `query.upgrade_quote`, plus `query.shot_scene` unless it is a shared still. It is a picture upgrade, never a `shot_overrides` tier change, which would move the scene's clip too.
- **A video upgrade always needs the customer's new yes** with its price shown: H3 → Seedance 720p (no face), any → 1080p, Fabric 480p → 720p under Standard. Never make one after a failure on your own; the server refuses `failed_attempt` on a clip.
  - **Seedance:** it is offered only for a B-roll shot the shot list marks `faces: false` and `product_motion` (`tier_quotes.*.seedance_addons` lists each with its price). After their yes to that price, save `draft.shot_overrides` `{scene, seedance: true, user_quote}` with `video_change` custom draft; the shot list must mark that shot `faces: false`. That changes the review: get their approval of the new total, then send the Seedance 720p call with `query.shot_scene` and no upgrade params. Without the approved override the server refuses with `custom_video_seedance_needs_yes`.
  - **1080p, or Fabric 720p under Standard:** with the yes, the call adds `query.upgrade_reason` `customer_asked` and their words in `query.upgrade_quote` (Seedance at 1080p needs both the override and these).
- **Over the allowance**, or a `custom_video_upgrade_not_allowed` refusal: follow its `next_step`, and ask the customer for a new yes to the new total. Never upgrade silently.
- **A clip redo** (after the ingredient approval) is for a `must_fix` clip, or an `ask` clip the customer (or you, in `review_mode: auto`) chose to fix, and the customer pays for it. It never sends `reroll_scene` on a tiered video: a plain call for that scene books the same way, and older GooseWorks servers refuse `reroll_scene` there (`custom_video_reroll_not_in_allowance`). Price the redo with the free price check first:
  - **It fits the approved total** (what is charged so far plus this price stays inside it): make it as an ordinary call with `query.shot_scene`, paid from the approved total, and tell the customer in one line.
  - **It doesn't fit:** the price check lists `custom_video_budget_exceeded` in `blocked_by`, or the call is refused with it (409; `details.this_call_credits` is the redo's price, beside `committed_credits` and `approved_max_credits`). Follow its `next_step`: save the revised estimate, show the new total, and make the redo only after the customer's yes; the redo money is then in the approved total.
  - Add `customer_asked` + `upgrade_quote` only when the redo is above the choice's setting (1080p, or Fabric 720p under Standard). Never drop the scene to save the cost.
- Pictures before the ingredient approval never send `reroll_scene`: a retry there is the same call again, and an upgrade adds the `failed_attempt` query params; both are paid from the preview budget.

## Revisions and reused work

Keep the full creative scene plan, but put only remaining paid operations in preview/render estimates. Reused, hash-checked assets cost zero new credits; do not list their original generation again. Use zero for a local-only edit with no new paid work, while preserving real committed spend. Price new assets and any redo allowance with current supported requests, not a price or buffer remembered from another video.

The host's approval quote is cumulative: show its returned committed amount, remaining work and total distinctly. Never add committed spend into an estimate the host will add it to again, or change the approval total yourself. Script/ingredient changes still refresh affected approvals. A shot-list tier quote may price the whole plan: do not delete scenes or mark reused speech as B-roll to lower it. If the returned quote still counts reused work as new, report the mismatch on the same project and resolve the quote before requesting that spend; a hand-written estimate cannot override the server.
