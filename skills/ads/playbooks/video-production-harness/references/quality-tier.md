# Human version

Standard or Best is the customer's price, picked at the script approval. It sets where every shot starts. One shot can move up a level when it fails its check or the customer asks; the agent says why, and nothing is upgraded silently.

---

# Agent version

The customer picks Standard or Best at the script approval (`quality_tier`, State 2.5 in setup-and-script); Standard is the default. The tier sets each shot's starting setting (the **Standard / Best** column in [shot routing](shot-routing.md)), not a hard limit:

| Step | Standard | Best |
|---|---|---|
| Pictures (people, storyboard, scenes) | GPT Image 2 **medium** | GPT Image 2 **high** |
| Talking shots | VEED Fabric **480p** (the same model) | Fabric **720p** |
| Shots with no speech | H3 **768P** | H3 768P; **1080P** for a shot marked `detail` (legible labels, logos or on-screen text, or a skin close-up); **Seedance 2.0 1080p** for a shot marked `faces: false` and `product_motion` |
| Delivered file | 1080×1920: the 768P picture scaled up free with lanczos ([edit-video](../edit-video.md) Phase 2 and 8) | 1080×1920 |

- **Both prices come from one shot list.** Save `draft.shot_list` with the script ([create-design-brief](../create-design-brief.md) step 12):
  - `stills: [{label, scene?}]`: every picture made before the clips, up to 60; `label` 1 to 200 characters; `scene` ties a still to its shot.
  - `shots: [{scene, kind: talking|broll, seconds, detail?, faces?, product_motion?}]`: up to 60; `scene` a script scene number; `seconds` 1 to 15, so split a longer scene into shots. A shot without `faces: false` is treated as having a face.
  - The server prices `talking` as Fabric and `broll` as H3 (Seedance only for Best's `faces: false` + `product_motion` shots). A route it does not price (native H3 speech, H3 dialogue, Veo) needs the owner's yes first.
- **Show each choice as the server gives it.** For Standard and Best show `custom_review.approval_quote.tier_quotes` `total_credits` and `yes_covers_up_to`, with no math of your own. A choice with `over_credit_cap` can't be approved: offer a smaller plan and re-quote. The owner's pick goes to `video_approve` as `quality_tier` with that choice's `total_credits`. A shot they want at the other choice goes in `draft.shot_overrides` `[{scene, tier, user_quote}]` (each scene once, a script scene, their words 1 to 500 characters); save it and show the new totals first. Keep the same values in `shot-plan.json`.
- **Every tiered fal call** (GPT Image 2, Fabric, H3, Seedance) **names its setting** (`quality`, `resolution`) and its shot (`query.shot_scene`). After the yes the server fills a missing GPT Image 2 quality or Fabric resolution from the choice, but send them anyway. Voice and music calls take neither.
- **Choose the resolution before picking takes.** Write it on the shot's routing line in the design brief. Switching resolution re-rolls the take: a new take, a new seed and a new review.
- **Seedance only for shots with no face.** It refuses photoreal faces whatever model made them, a fresh Seedream v5 Pro face included (the shared model notes, 2026-09-29), and a refused submit still bills. Use 1080p: 720p is an upscale and reads soft.
- **Upgrade one shot, never the whole video.** A shot moves up a level (medium → high, Fabric 480p → 720p, H3 768P → 1080P, H3 → Seedance 1080p for a `faces: false` shot) only when it failed its check at the cheaper setting, or the customer asked. After a failed check, H3 1080P is only for a `detail` shot; the customer may ask for it on any shot. **After one failed check, judge the shot:**
  - **retry once at the same setting** when a prompt fix should work (a wrong pose, a missing prop, the wrong framing);
  - **upgrade straight away** when the cheaper setting probably can't do it (small label text, a complex product shape, many parts that must stay exact).
  - Either way record a one-line reason. The upgraded call adds `query.upgrade_reason` `failed_attempt` with `query.upgrade_attempt` (the failed call's operation id) and `query.upgrade_why` (the one-line reason), or `customer_asked` with the customer's words in `query.upgrade_quote`. The server records it on the plan. It comes out of `render_estimate.upgrade_allowance`; a `custom_video_upgrade_not_allowed` refusal names its `next_step`: over the allowance, ask the customer for a new yes to the new total. Never upgrade silently.
- **A redo the customer asks for** at the same setting is the same call with `reroll_scene=<scene>`, `query.upgrade_reason` `customer_asked` and their words in `query.upgrade_quote`, paid from the allowance.
