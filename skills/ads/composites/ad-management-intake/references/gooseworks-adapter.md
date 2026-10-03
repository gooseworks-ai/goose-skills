# GooseWorks adapter

## Summary

Use this mode when the GooseWorks tools are callable. Research, products and the campaign brief
come from GooseWorks; the `ads/` docs live in the brand's coworker workspace. Check a tool name
against the live tool list before trusting it: a tool can exist and still be hidden from a surface.

**The research step** (Step 1) is GooseWorks brand onboarding: inside the coworker `get_brand_kit`,
from outside `brand_onboarding` then `brand_read` (use `brand_get_context` only if advertised). **The brief's budget and date fields** are
`campaign_upsert`'s `budget_cents`, `starts_on` and `ends_on`.

## Inside the coworker (chat, messaging turns, scheduled runs)

| Step | Tool |
|---|---|
| Read the brand research and products | `get_brand_kit` (omit `brand_id`; the coworker's own brand is authoritative). `status: no_brand` means research is still running: say so and wait. Never substitute your own web research |
| Claims, proof, past learnings | `search_brain`. Brand kit context is **not** an approved claim |
| Existing campaigns and briefs | `list_campaigns`, `get_campaign` (`campaign_read` where the surface shows it) |
| Write the brief | `campaign_upsert` (shape below) |
| Ask structured questions | `render_ask_user`: 1–4 questions, each with 2–4 options, `header` at most 50 characters. The answer arrives as the next user message. The built-in AskUserQuestion is **disallowed** in the coworker, so never call it there |
| Read and write `ads/` | built-in `Read` / `Write` / `Edit` with **relative** paths (`ads/brand.md`). No `file_*` tools here. Never an absolute path, never shell edits |

## From an outside host (Claude Code, Cursor, any MCP client)

| Step | Tool |
|---|---|
| Research not done yet | `brand_onboarding` with `action: status`, then follow only its `next_step` until onboarding is complete |
| Read research and products | `brand_read` with `brand_id` and sections `kit`, `products`, `learnings`, `onboarding` (use older `brand_get_context` only if advertised). `catalog_search` searches skills and templates, **not** products |
| Existing campaigns and briefs | `campaign_read` (omit `campaign_id` and pass `brand_id` to list) |
| Write the brief | `campaign_upsert` (shape below) |
| Ask structured questions | the host's own question control (in Claude Code, AskUserQuestion: 1–4 questions, 2–4 options, "Other" added automatically) |
| Read and write `ads/` | `file_read` / `file_write` with `scope: { type: "agent", agent_id: <brand.coworker_agent_id> }`, from `brand_list`. **Always pass `scope`**, or the write lands in the user's default agent. Do not write a file and immediately start a coworker run that reads it: the coworker's file cache can be up to two minutes behind |

## The brief: `campaign_upsert`

- Fields: `name`, `goal`, `budget_cents` (integer cents, the **total**), `starts_on` / `ends_on`
  (`YYYY-MM-DD`; leave them out when the launch is not scheduled), `hero_product_ids`.
- `intake` is **strict**; any other key is rejected: `objective`, `about`, `audience` (a string or
  up to 5 strings), `core_message`, `situation`, `offer`, `hero_product_ids`, `constraints` (**an
  array of strings**, each at most 300 characters).
- There are no dedicated destination, price or run-length fields. The retired `goal_target`
  remains accepted for old campaign round-trips; do not fill it on a new campaign. The price
  goes in `offer`. The
  landing page, the run length when there are no dates, and the success number go in the brief
  markdown (`brief_md`) under `## Destination`, `## Budget and dates` and `## Success number`.

## Ids

`brand_id` and `coworker_agent_id` in `ads/README.md` and `ads/brand.md` come from `brand_read`
with no `brand_id` (use the older `brand_list` only if advertised).

## Author concepts in this agent, then save

Read the saved brand/product context and `campaign_read` before writing. **You write the campaign
and its ideas.** `propose_campaign_concepts` remains a compatibility server proposal; do not call
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
updates with `campaign_id`. An internal coworker uses its bound brand. Optional fields are `name`, `goal`, `status`, `starts_on`, `ends_on`,
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
Read `campaign_read` back before claiming saved. Saving planning data does not approve paid
creative generation; preserve the tool's existing credit estimate and explicit user approval.
