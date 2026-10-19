---
name: save-to-brain
description: >-
  Shared atom (owner: research-market session). Saves one artifact into the brand brain — the workspace file is the canonical copy, the imported brand document makes it findable on any host. One mode per artifact - versioned supersede (a record whose newest version replaces the old) or keep-history (dated period artifacts). Loaded by any playbook that saves a durable artifact; never listed.
---

# save-to-brain

Every durable artifact goes through this atom. Never keep the only copy in chat or on the local disk, and never tell the marketer about workspaces, documents or imports — say "saved to your brand" or what failed in plain words.

## Inputs (the calling playbook supplies them)

| Input | Rule |
|---|---|
| `brand_id`, `brand_slug`, `coworker_agent_id` | From the `gooseworks:brand_read` list answer. |
| `path` | The playbook's own folder under the AGENTS §8 layout (`research/market/…`, `research/competitors/…`). Dates `YYYY-MM-DD`. |
| `artifact` | The artifact name, used in the title and tags (for example `Voice-of-customer bank`, `voc-bank`). |
| `title` | `<Artifact> — <Brand> — <YYYY-MM-DD>`; records with numbered versions add ` v<N>`. |
| `tags` | `[<playbook>, <artifact-slug>]`, plus any extra key the caller needs to tell copies apart (for example `rival:<slug>`). All lower-case. **The first tag is the document's creator**: normally the calling playbook; a shared atom that writes on behalf of another owner puts that owner first (voice-card, claims-gate). |
| `versioned` | `supersede` — a record that is replaced by its newest version (a bank, a profile, a landscape, an angle bank, a watchlist). `keep-history` — a dated period artifact (a weekly report, a digest, a dated read); older ones are history and are never deleted. |
| `import` | `yes` (default) or `no` — `no` for working files that must stay out of brand knowledge (unsent reply drafts, raw item lists, pasted private material). |

## Workspace scope

- Scope = `{type: "agent", agent_id: <coworker_agent_id>}` on every file call and on the upload's workspace source.
- No coworker (`coworker_agent_id` is null): write to the default workspace with every path prefixed `brands/<brand_slug>/`, and tell the human once: "This brand has no coworker yet, so I saved it in your general workspace under its name." Never the organization's shared scope.

## Steps

1. **Read before you write.** `gooseworks:file_list` the folder, then `gooseworks:file_read` the file if it exists — `gooseworks:file_write` replaces the whole file. Merge: keep every existing row (ids are stable), add new rows, update changed rows in place, never silently drop a row — mark it `status: retired (<reason>, <date>)`. Keep the file's header lines current. In another playbook's file, only add lines under your own request lines (AGENTS §8).
2. **Write the file** with `gooseworks:file_write` (same scope). If `import: no`, stop here.
3. **Register it as a brand document** with `gooseworks:media_upload` — scope brand, kind document, source workspace (this path, this scope), `title`, `tags`. The inline bytes source does not take text documents; always go through the workspace.
4. **Import it** with `gooseworks:knowledge_import` (the new media id), then `gooseworks:job_get` (kind `knowledge_ingest`, with `brand_id`) until it is ready. If any answer shows a price, stop and ask the human before going on. An imported document is searchable reference, never an approved ad claim.
5. **Retire old copies** — only after step 4 is ready. List earlier copies with `gooseworks:media_list` (scope brand, kind document) and keep only rows that carry **every** tag the caller passed (including keys such as `rival:<slug>`) and whose **first tag** (the creator) is the caller's first tag — never the copy just imported, never a document whose first tag names someone else. Then:
   - `versioned: supersede` — delete (`gooseworks:media_update` `delete`) those whose title matches this title apart from the date (and version).
   - `keep-history` — delete only a copy with exactly this title (a re-run of the same period); other periods are history and are never deleted.
   Deleting the upload also removes its knowledge, so search stops returning stale rows. The workspace file is never deleted.
6. **Verify.** `gooseworks:knowledge_search` with a query that should hit the new content, `source_types: ["document"]`. If it does not come back, say "saved, not yet searchable" — never claim it is in the brain when it is not.

## If a tool is missing

Call `gooseworks:tools_load` once with the group (`files`, `media`, `brand`). If it still fails, give the artifact to the human in chat, say plainly that it is not saved to their brand, and record the failure in the run's hand-over.
