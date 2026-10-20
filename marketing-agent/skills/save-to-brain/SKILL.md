---
name: save-to-brain
description: >-
  Shared step of the marketing playbooks (research-market, plan-campaign, make-content,
  analyze-performance): saves a finished file to the brand and makes it searchable. It either replaces
  older versions or keeps dated history, then checks that the file can be found. Loaded by those
  playbooks; not for direct use.
version: 0.1.1
---

# save-to-brain

Every durable artifact goes through this atom. Never keep the only copy in chat or on the local disk, and never tell the marketer about workspaces, documents or imports — say "saved to your brand" or what failed in plain words.

**Local mode** (no GooseWorks, [the `marketing-guide` skill](../marketing-guide/SKILL.md) §5) is the one exception. It calls no `gooseworks:` tool, and `brand_id` and `coworker_agent_id` are not needed:
- **Host with files:** with the host's own file tools, read `gooseworks-local/<brand-slug>/<path>` if it exists, merge by step 1's rules (never-overwrite included), write it, and read it back. Skip steps 2–6. Say "saved in this folder", never "saved to your brand".
- **Hosted chat without files:** nothing can be saved. Give the whole file in chat under its path and say "This isn't saved anywhere: paste it back next time and I'll pick up from it." Skip steps 1–6.

## Inputs (the calling playbook supplies them)

| Input | Rule |
|---|---|
| `brand_id`, `brand_slug`, `coworker_agent_id` | From the `gooseworks:brand_read` list answer. |
| `path` | The playbook's own path in the marketing-guide's §4 table (`research/market/…`, `research/competitors/…`). Dates `YYYY-MM-DD`. |
| `artifact` | The artifact name, used in the title and tags (for example `Voice-of-customer bank`, `voc-bank`). |
| `title` | `<Artifact> — <Brand> — <YYYY-MM-DD>`; records with numbered versions add ` v<N>`, and a suffixed file adds the same suffix (step 1). |
| `tags` | `[<playbook>, <artifact-slug>]`, plus any extra key the caller needs to tell copies apart (for example `rival:<slug>`). All lower-case. **The first tag is the document's creator**: normally the calling playbook; a shared atom that writes on behalf of another owner puts that owner first (voice-card, claims-gate). |
| `versioned` | `supersede` — a record that is replaced by its newest version (a bank, a profile, a landscape, an angle bank, a watchlist). `keep-history` — a dated period artifact (a weekly report, a digest, a dated read); older ones are history and are never deleted. |
| `import` | `yes` (default) or `no` — `no` for working files that must stay out of brand knowledge (unsent reply drafts, raw item lists, pasted private material). |

## Brand Brain tools

`brain_save` has **no document or report target**. Its targets are learning, fact, claim, audience, competitor, product, kit fields, operating-plan sections and proposals. So documents keep the route below (workspace file → `media_upload` → `knowledge_import`) on every server. What changes when `brain_*` tools are listed:
- **Read-back** (step 6) uses `gooseworks:brain_search` with `source_types: ["document"]`, and `gooseworks:brain_open` on the hit to read it in full. Otherwise use `gooseworks:knowledge_search`.
- **Status.** An imported document is *found*: never call it confirmed, and it is never an approved claim (the marketing-guide §1.4).
- **Indexing lags.** `brain_search` can answer "Still indexing: N of M". That means "saved, not yet searchable", not a failure. Do not re-import.

## Workspace scope

The scope in [the `marketing-guide` skill](../marketing-guide/SKILL.md) §2, on every file call and on the upload's workspace source. With no coworker, tell the human once: "This brand has no coworker yet, so I saved it in your general workspace under its name."

## Steps

1. **Read before you write** (the marketing-guide §2). `gooseworks:file_list` the folder, then `gooseworks:file_read` the file if it exists. Merge: keep every existing row (ids are stable), add new rows, update changed rows in place, never silently drop a row — mark it `status: retired (<reason>, <date>)`. Keep the file's header lines current. In another playbook's file, only add lines under your own request lines.
   **Never overwrite another copy.** A `keep-history` file this run did not write already at the path (another session, an earlier run today) stays: suffix this one's file name — the job slug where the caller has one, then `-2`, `-3` — and its title the same way (` — <job slug>`, ` (2)`, ` (3)`), because step 5 deletes a copy with exactly this title. A `supersede` record is meant to be replaced and keeps its name.
2. **Write the file** with `gooseworks:file_write` (same scope). If `import: no`, stop here.
3. **Register it as a brand document** with `gooseworks:media_upload` — scope brand, kind document, source workspace (this path, this scope), `title`, `tags`. The inline bytes source does not take text documents; always go through the workspace.
4. **Import it** with `gooseworks:knowledge_import` (the new media id), then `gooseworks:job_get` (kind `knowledge_ingest`, with `brand_id`) until it is ready. If any answer shows a price, stop and ask the human before going on.
5. **Retire old copies** — only after step 4 is ready. List earlier copies with `gooseworks:media_list` (scope brand, kind document) and keep only rows that carry **every** tag the caller passed (including keys such as `rival:<slug>`) and whose **first tag** (the creator) is the caller's first tag — never the copy just imported, never a document whose first tag names someone else. Then:
   - `versioned: supersede` — delete (`gooseworks:media_update` `delete`) those whose title matches this title apart from the date (and version).
   - `keep-history` — delete only a copy with exactly this title (a re-run of the same period, written to the same file); other periods, and same-day copies with a suffixed title, are history and are never deleted.
   Deleting the upload also removes its knowledge, so search stops returning stale rows. The workspace file is never deleted.
6. **Verify.** Search with a query that should hit the new content, using `source_types: ["document"]`: `gooseworks:brain_search` when `brain_*` tools are listed, otherwise `gooseworks:knowledge_search`. If it does not come back (or the brain says it is still indexing), say "saved, not yet searchable". Never claim it is in the brain when it is not.

## If a tool is missing

Call `gooseworks:tools_load` once with the group (`files`, `media`, `brand`). If it still fails, give the artifact to the human in chat, say plainly that it is not saved to their brand, and record the failure in the run's hand-over.
