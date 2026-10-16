# Human version

Standard or Best is the customer's price, picked at the script approval. It sets where every shot starts. No video goes above 720p/768p unless the customer asks. A picture that fails its check can move up to high quality from a small allowance; any video upgrade (Seedance, 1080p) needs the customer's new yes. Nothing is upgraded silently.

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
  - The server prices `talking` as Fabric and `broll` as H3 768P. A route it does not price (Seedance, 1080p, native H3 speech, H3 dialogue, Veo) needs the owner's yes to its own price first.
- **Show each choice as the server gives it.** For Standard and Best show `custom_review.approval_quote.tier_quotes` `total_credits` and `yes_covers_up_to`, with no math of your own. A choice with `over_credit_cap` can't be approved: offer a smaller plan and re-quote. The owner's pick goes to `video_approve` as `quality_tier` with that choice's `total_credits`. A shot they want at the other choice goes in `draft.shot_overrides` `[{scene, tier, user_quote}]` (each scene once, a script scene, their words 1 to 500 characters); save it and show the new totals first. Keep the same values in `shot-plan.json`.
- **Every tiered fal call** (GPT Image 2, Fabric, H3, Seedance) **names its setting** (`quality`, `resolution`), and a clip or a scene's still names its shot (`query.shot_scene`); a shared still (cast, set) with no scene leaves it out, so no scene's override applies to it. After the yes the server fills a missing GPT Image 2 quality or Fabric resolution from the choice, but send them anyway. Voice and music calls take neither.
- **Choose the resolution before picking takes.** Write it on the shot's routing line in the design brief. Switching resolution re-rolls the take: a new take, a new seed and a new review.
- **Seedance only for shots with no face, at 720p.** It refuses photoreal faces whatever model made them, a fresh Seedream v5 Pro face included (the shared model notes, 2026-09-29), and a refused submit still bills. 1080p only when the customer asks.
- **After a failed check, judge the shot:**
  - **retry once at the same setting** when a prompt fix should work (a wrong pose, a missing prop, the wrong framing);
  - **upgrade straight away** when the cheaper setting probably can't do it (small label text, a complex product shape, many parts that must stay exact).
  - Either way record a one-line reason.
- **Only a picture is upgraded on your own judgment:** GPT Image 2 medium → high for that one picture, from `render_estimate.upgrade_allowance` (pictures only, about two upgrades). The call adds `query.upgrade_reason` `failed_attempt` with `query.upgrade_attempt` (the failed call's operation id) and `query.upgrade_why` (the one-line reason). The server records it on the plan.
- **A video upgrade always needs the customer's new yes** with its price shown: H3 → Seedance 720p (no face), any → 1080p, Fabric 480p → 720p under Standard. Never make one after a failure on your own. With the yes, the call adds `query.upgrade_reason` `customer_asked` and their words in `query.upgrade_quote`.
- **Over the allowance**, or a `custom_video_upgrade_not_allowed` refusal: follow its `next_step`, and ask the customer for a new yes to the new total. Never upgrade silently.
- **A clip redo** (after the ingredient approval) at the same setting is the same call with `reroll_scene=<scene>`; the allowance covers pictures only, so it needs the customer's yes to its price (`query.upgrade_reason` `customer_asked`, their words in `query.upgrade_quote`). Pictures before the ingredient approval never send `reroll_scene`: a retry or upgrade there is the same call with the upgrade query params, paid from the preview budget.
