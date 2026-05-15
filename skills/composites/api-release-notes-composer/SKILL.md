---
name: api-release-notes-composer
description: >
  Turn a raw list of merged PRs, tickets, commits, or a plain diff summary into structured, semver-aware API changelog entries for developer audiences. Produces additive, breaking, deprecated, and removed sections, writes concise developer-facing prose for each change, and flags upgrade implications. Pure reasoning skill scoped to API versioning comms. Use when an API team needs to convert ship artifacts into a polished changelog before a release — not for general product launch kits (use feature-launch-playbook) and not for support articles (use help-center-article-generator).
tags: [content, research]
---

# API Release Notes Composer

Turn raw ship data into clean, developer-facing API release notes. This skill handles the mechanical and editorial work of converting PRs, tickets, and commit messages into a structured, semver-versioned changelog that API consumers can actually act on.

**Built for:** API teams, developer-experience writers, and backend engineers who need a polished changelog entry before a release goes out — without spending an hour wrangling copy.

## Best Fit

- Weekly or monthly API version releases
- Individual endpoint additions, changes, and removals
- Breaking-change windows with migration requirements
- Deprecation notices with sunset timelines
- SDK patch and minor release notes

## Use Something Else

- If you need a full launch kit — email, social, in-app banner, LinkedIn post — use `feature-launch-playbook`.
- If you need support KB articles or step-by-step how-to docs, use `help-center-article-generator`.
- If you need the full breaking-change comms kit (migration guide + channel copy), use `breaking-change-comms-kit`.
- If you need a recurring developer digest newsletter, use `developer-newsletter-composer`.

## Inputs

| Field | Required | Notes |
|-------|----------|-------|
| `version` | Yes | Semver string: `2.4.0`, `1.0.0-rc.1`, etc. |
| `previous_version` | No | Anchors the diff window for readers |
| `release_date` | No | ISO date string or human-readable |
| `raw_changes` | Yes | PR list, ticket list, commit log, diff summary, or plain prose bullet list |
| `api_surface` | No | REST, GraphQL, gRPC, or WebSocket — affects section framing |
| `audience` | No | External consumers, internal teams, or both |
| `include_migration_hints` | No | Default: `true` for breaking changes |
| `format` | No | `markdown` (default), `json`, or `html` |

## Phase 0 — Intake

Ask only for what is missing. Do not prompt for every field up front.

1. What version is being released?
2. What is the raw list of changes? (PRs, tickets, commits, or prose)
3. Is this an external developer-facing changelog or an internal one?
4. Are there any known breaking changes?
5. Is there a release date to include?

If the user pastes a raw commit log or PR list directly, start processing immediately without asking for confirmation.

## Phase 1 — Change Classification

Before writing anything, classify each change into one of five buckets:

| Bucket | Semver Impact | What belongs here |
|--------|---------------|-------------------|
| **Added** | Minor | New endpoints, new fields, new query params, new event types |
| **Changed** | Patch or Minor | Behavior tweaks, response shape adjustments that don't break consumers |
| **Breaking** | Major | Removed endpoints, renamed fields, changed required params, new auth requirements |
| **Deprecated** | Minor | Endpoints or fields still functional but sunset-scheduled |
| **Fixed** | Patch | Bug fixes, correctness improvements, performance without contract change |
| **Removed** | Major | Previously deprecated items now gone |
| **Security** | Patch or Major | Vulnerability patches, auth behavior hardening |

### Classification Rules

- If the change removes or renames a field, endpoint, or enum value → **Breaking**
- If the change adds a new optional field or endpoint → **Added**
- If the change modifies an existing response without removing anything → **Changed**
- If the change was already deprecated in a prior version and is now gone → **Removed**
- If no consumers need to change code → **Fixed** or **Changed**
- When unsure, err toward **Breaking** and flag it for review

Produce a classification table before writing prose:

```
CHANGE CLASSIFICATION

Breaking (2):
- PR #482: Removed `user.legacy_id` field from /v2/users response
- PR #501: Changed auth header from `X-Token` to `Authorization: Bearer`

Added (3):
- PR #477: New GET /v2/users/:id/sessions endpoint
- PR #489: Added `created_by` field to /v2/projects response
- PR #495: New webhook event: `project.archived`

Fixed (1):
- PR #498: Pagination cursor now stable under concurrent writes

Deprecated (1):
- PR #503: GET /v1/users is now deprecated; sunset: 2026-10-01
```

Show this classification to the user if there are breaking changes, and ask for confirmation before drafting changelog prose.

## Phase 2 — Semver Version Check

Validate the provided version number against the classified changes:

| Scenario | Correct Version | Flag if Wrong |
|----------|----------------|---------------|
| Only **Fixed** changes | Patch bump (x.y.Z) | Warn if minor or major bumped unnecessarily |
| **Added** but no breaking | Minor bump (x.Y.0) | Warn if patch used |
| Any **Breaking** or **Removed** | Major bump (X.0.0) | Hard flag if minor or patch used |

If the declared version and the change classification disagree, surface the mismatch clearly:

```
⚠ Version mismatch: You declared 2.3.1 (patch), but the changes include
breaking: removed `user.legacy_id`. This is a major version bump (3.0.0).
Proceed with 2.3.1 anyway, or update the version?
```

## Phase 3 — Write the Changelog Entry

Use the following structure. Omit sections that have no entries.

### Changelog Entry Template

```markdown
## [VERSION] — RELEASE_DATE

### Breaking Changes

> ⚠ Action required before upgrading.

- **Removed `user.legacy_id`** — The `legacy_id` field has been removed from all `/v2/users` responses. Use `id` instead. [Migration guide →](#migration-legacy-id)
- **Auth header format changed** — `X-Token` is no longer accepted. Use `Authorization: Bearer <token>`. Update your request headers before upgrading.

### Added

- **`GET /v2/users/:id/sessions`** — Returns the active sessions for a user. Supports `limit` and `cursor` pagination parameters.
- **`created_by` on projects** — All `/v2/projects` responses now include a `created_by` object with `id`, `name`, and `email`.
- **`project.archived` webhook event** — Fired when a project moves to archived state. See [Webhook Events →](#webhooks).

### Fixed

- Pagination cursors for `/v2/users` are now stable under concurrent write loads. Previously, a cursor could skip items when new records were inserted mid-page.

### Deprecated

- **`GET /v1/users`** — This endpoint is deprecated and will be removed on **2026-10-01**. Migrate to `GET /v2/users`. [Migration guide →](#migration-v1-users)
```

### Prose Rules

- Lead with the change name in **bold**
- Use plain, active-voice developer English
- Do not invent behavior or claims not present in the source data
- For breaking changes: always include what to use instead
- For deprecated items: always include the sunset date if known
- For new endpoints: name the endpoint path, not just the feature name
- Avoid marketing language: no "powerful", "seamless", "industry-leading"
- Aim for one to three sentences per entry; no essay paragraphs

### Length Targets

| Change count | Expected length |
|-------------|-----------------|
| 1-5 changes | 150-300 words |
| 6-15 changes | 300-600 words |
| 16+ changes | Group into subsections by resource or domain |

If there are more than 15 changes, group them:

```markdown
### Added

#### Users API
- ...

#### Projects API
- ...

#### Webhooks
- ...
```

## Phase 4 — Migration Hints (Breaking Changes)

When there are breaking changes, append a migration section unless `include_migration_hints` is false.

```markdown
## Migration Guide — v2.3.x → v3.0.0

### `user.legacy_id` removal

**Before:**
```json
{ "id": "usr_01", "legacy_id": "12345" }
```

**After:**
```json
{ "id": "usr_01" }
```

**What to change:** Replace any reads of `user.legacy_id` with `user.id`. The `id` field has been stable since v2.0.

---

### Auth header change

**Before:**
```http
X-Token: your-token-here
```

**After:**
```http
Authorization: Bearer your-token-here
```

**What to change:** Update your HTTP client configuration to use the `Authorization` header with the `Bearer` scheme.
```

Migration hint rules:
- Show a before/after code pair for every breaking change where possible
- Keep code examples minimal — enough to show the change, not a full tutorial
- If a migration is complex, note that a full guide is available and link a placeholder

## Phase 5 — Output

Default format: Markdown.

Deliver:
1. The full changelog entry
2. Migration section (if applicable)
3. A two-sentence TL;DR suitable for a Slack/Discord announcement
4. Recommended semver version (if it differs from what was declared)

### TL;DR Template

```
v3.0.0 is out. Breaking: removed `user.legacy_id` and changed auth header format.
Upgrade path: swap `X-Token` for `Authorization: Bearer`, drop `legacy_id` reads, and
use `GET /v2/users/:id/sessions` for session data (new).
```

## Guardrails

- Do not invent API behavior not present in the source changes
- Do not write marketing copy — this is a technical changelog
- Do not skip the version mismatch check
- Do not omit migration hints for breaking changes without the user explicitly disabling them
- Do not merge a patch and a major change into a single vague "improved reliability" bullet
- If source data is too sparse to write accurate prose, ask for clarification before guessing
