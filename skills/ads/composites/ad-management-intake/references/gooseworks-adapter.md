# GooseWorks adapter

## Summary

Use this mode when the GooseWorks tools are callable. Research, products and the campaign brief
come from GooseWorks; the `ads/` docs live in the brand's coworker workspace. Check a tool name
against the live tool list before trusting it: a tool can exist and still be hidden from a surface.

**The research step** (Step 1) is GooseWorks brand onboarding: inside the coworker `get_brand_kit`,
from outside `brand_onboarding` then `brand_get_context`. **The brief's budget and date fields** are
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
| Read research and products | `brand_get_context` with `brand_id` (products and the onboarding profile's missing fields are among its sections). `catalog_search` searches skills and templates, **not** products |
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
- There is no destination, price, run-length or success field. The price goes in `offer`. The
  landing page, the run length when there are no dates, and the success number go in the brief
  markdown (`brief_md`) under `## Destination`, `## Budget and dates` and `## Success number`.

## Ids

`brand_id` and `coworker_agent_id` in `ads/README.md` and `ads/brand.md` come from `brand_list`.
