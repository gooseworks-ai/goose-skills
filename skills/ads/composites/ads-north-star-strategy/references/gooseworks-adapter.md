# GooseWorks adapter

## Summary

Use this mode when the GooseWorks tools are callable. Inputs come from GooseWorks research, the
campaign record and the connected ad account. The strategy is written to the `ads/` docs in the
brand's coworker workspace. Creatives are requested through GooseWorks and wait for the user's
approval before anything spends.

## Launch capability (what the host can launch)

GooseWorks launches **Traffic** campaigns only, with 2–3 ads in a new campaign. It pays for
landing-page views when the destination check found a Meta pixel, and link clicks otherwise.
Leads and Sales objectives cannot be launched from GooseWorks yet. That is why decision rule 1's
bridge exists: when the right objective is Leads or Sales, write it, write the Traffic bridge
judged on cost per lead or purchase, and write the one-line limit.

## Inside the coworker (chat, messaging turns, scheduled runs)

- **Files:** `ads/README.md`, then `ads/brand.md` and `ads/campaigns/<slug>/{strategy,state,decisions}.md`,
  with the built-in `Read` / `Write`, paths relative to the workspace root. Never an absolute path.
- **Brand research:** `get_brand_kit`, `get_product_knowledge`.
- **The brief:** `get_campaign` (intake answers, the brief and concepts).
- **Account facts** (decision rule 2): `meta_status_get` with `view: "summary"` (lifetime spend,
  tracking, event volume), and `get_meta_ad_context` for a specific ad.

## From an outside host (Claude Code, Cursor, any MCP client)

- **Files:** `file_read` / `file_write` with `scope: {type: "agent", agent_id: <brand.coworker_agent_id from brand_list>}`.
  Leaving out `scope` writes to the wrong agent. Do not write and then immediately start a coworker
  run that reads the file: its file cache can be up to two minutes behind.
- **Research:** `brand_get_context` returns brand facts and products. `catalog_search` searches
  skills and templates, **not** products.
- **The brief:** `campaign_read`, `campaign_upsert`.
- **Account facts:** the Meta read tools the host shows (`meta_status_get`, `list_meta_entities`).
  If none are visible, treat the account facts as unknown and say so.

## The hand-off: concepts and creatives

- One campaign concept per angle (person, message, proof): `add_campaign_concept` /
  `update_campaign_concept`, or `campaign_upsert` with `concepts` from outside.
- Creatives: `request_campaign_generation` with **`planned_ads`** = the ads that will run. The
  tool triples it (the 3x rule). Use **`count`** only for a number the user named, and never pass
  both. From outside, also pass `target: {brand_id}`. `planned_ads` can be at most 20.
- Report `requested_creatives` / `planned_creatives`. If the result has a `shortfall`, tell the
  user and add templates or raise versions before requesting the rest.
- **Nothing spends until the user approves** in the approval queue (the Generate button, or
  `ads_approval_decide`). Tell the user where to approve.
