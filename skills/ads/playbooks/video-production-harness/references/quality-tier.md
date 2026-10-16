# Human version

Standard or Best is the customer's price, picked at the script approval. It sets where every shot starts. One shot can move up a level when it fails its check or the customer asks; the agent says why, and nothing is upgraded silently.

---

# Agent version

The customer picks Standard or Best at the script approval (`quality_tier`, State 2.5 in setup-and-script); Standard is the default. The tier sets each shot's starting setting (the **Standard / Best** column in [shot routing](shot-routing.md)), not a hard limit:

| Step | Standard | Best |
|---|---|---|
| Pictures (people, storyboard, scenes) | GPT Image 2 **medium** | GPT Image 2 **high** |
| Talking shots | VEED Fabric **480p** (the same model) | Fabric **720p** |
| Shots with no speech | H3 **768P** | H3 768P; **1080P** only for legible labels, logos or on-screen text, or a skin close-up; **Seedance 2.0 1080p** only for shots with no face that need hard motion or an exact product |
| Delivered file | 1080×1920: the 768P picture scaled up free with lanczos ([edit-video](../edit-video.md) Phase 2 and 8) | 1080×1920 |

- **Both prices come from one shot list.** The design brief writes each shot's Standard and Best setting and prices both; the script approval shows both totals. The owner's pick (`quality_tier`, plus any `shot_overrides`) is saved in `shot-plan.json`.
- **Every paid request names its setting** (`quality`, `resolution`). A request with no quality is priced as high.
- **Choose the resolution before picking takes.** Write it on the shot's routing line in the design brief. Switching resolution re-rolls the take: a new take, a new seed and a new review.
- **Seedance only for shots with no face.** It refuses photoreal faces whatever model made them, a fresh Seedream v5 Pro face included (the shared model notes, 2026-09-29), and a refused submit still bills. Use 1080p: 720p is an upscale and reads soft.
- **Upgrade one shot, never the whole video.** A shot moves up a level (medium → high, H3 768P → 1080P, H3 → Seedance 1080p) only when it failed its check at the cheaper setting, or the customer asked. **After one failed check, judge the shot:**
  - **retry once at the same setting** when a prompt fix should work (a wrong pose, a missing prop, the wrong framing);
  - **upgrade straight away** when the cheaper setting probably can't do it (small label text, a complex product shape, many parts that must stay exact).
  - Either way record a one-line reason. The upgraded call carries `upgrade: {reason: "failed_attempt", failed_attempt_id: "<the failed attempt>", why: "<one line>"}`, or `{reason: "customer_asked", customer_quote: "<their words>"}`, and the plan lists it. An upgrade comes out of the quote's allowance; over it, ask the customer for a new yes to the new total. Never upgrade silently.
