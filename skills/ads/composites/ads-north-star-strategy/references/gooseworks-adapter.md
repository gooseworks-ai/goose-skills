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

- **Files:** `file_read` / `file_write` with `scope: {type: "agent", agent_id: <brand.coworker_agent_id from brand_read without brand_id>}` (older `brand_list` only if advertised).
  Leaving out `scope` writes to the wrong agent. Do not write and then immediately start a coworker
  run that reads the file: its file cache can be up to two minutes behind.
- **Research:** `brand_read {brand_id, sections: ["kit", "products", "learnings", "onboarding"]}` returns existing brand facts and products. Use `brand_get_context` only when that older name is advertised. `catalog_search` searches
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

## Author concepts in this agent, then save

Read the saved brand/product and campaign context before writing. Outside the coworker, use
`brand_read` (kit, products, learnings, onboarding) and `campaign_read`. Inside the coworker, use
`get_brand_kit`, `get_product_knowledge` and `get_campaign` (`list_campaigns` to find existing campaigns).
Check the advertised tool list. **You write the campaign and its ideas.** `propose_campaign_concepts` remains a compatibility server proposal; do not call
it to outsource creative reasoning. Keep the supplied occasion, offer, audiences and product ids.
Give each audience a distinct angle, a short complete title and one usable message about the
selected product. Use only that product's facts.

`kit.approvedClaims` includes `id`, exact `text`, `applicability` and `product_id`. Brand scope
applies to the company; product scope only to that product; **unknown is not brand-wide**.
For approved claim proof, keep the exact text and save
`evidence: [{kind: "approved_claim", ref: <claim id>, summary: <exact text>}]`.
Goose checks this association and current approval. Performance evidence explains why an angle
was chosen; it is not a customer claim. If no applicable claim exists, use a verified product fact
or save `proof: ""` and state what is missing. Generation remains blocked until proof is filled.
Older connections without claim applicability cannot certify a brand-wide rating; use verified
product facts or leave proof missing. Never assign another product's rating.

**Save fields.** `campaign_upsert` creates on the public connector with `brand_id` and
updates with `campaign_id`. An internal coworker uses its bound brand. Internal creation also
requires `creation_decision`: first read every current campaign and usable creative, explain
continue/change/create and any overlap, then obtain the user's explicit choice to create.
Pass `{mode: "create_new", explanation: <why a new campaign fits, at least 10 characters>,
user_confirmed: true, overlap_checked_campaign_ids: [...], overlap_checked_project_ids: [...]}`
with the actual inspected ids (empty lists only when none exist). Never invent confirmation.
An update with `campaign_id` does not need this decision; do not send the internal-only field
to the public connector. Optional fields are `name`, `goal`, `status`, `starts_on`, `ends_on`,
`budget_cents` (total integer cents), `channels`, `hero_product_ids`, `intake`, `brief_md`, `concepts`.
Intake preserves `objective`, `about`, `audience`, `core_message`, `situation`, `offer`,
`hero_product_ids` and `constraints` (list). Omit unknown optional facts; never invent dates or money.

Each concept requires `person`, `message`, `proof` (empty when missing). Optional: `id`, `name`,
`moment`, `product_id`, `template_ids`, `variant_count`, `evidence`, `confidence`, `engine`,
`quality`, `ratios`. Omitted templates retain existing picks when saving the same id; new concepts
follow the tool's current auto-pick guidance. Keep `product_id` stable when editing its copy.

Use `add_campaign_concept` for one new idea and `update_campaign_concept` for one existing idea.
`save_campaign_concepts` or `campaign_upsert.concepts` replaces the entire ordered list: read ids,
retain the concepts to keep, and send the whole list only when replacement/reordering is intended.
Read back with `campaign_read` outside or `get_campaign` inside before claiming saved. Saving planning data does not approve paid
creative generation; preserve the tool's existing credit estimate and explicit user approval.
