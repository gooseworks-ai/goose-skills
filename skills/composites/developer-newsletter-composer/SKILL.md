---
name: developer-newsletter-composer
description: >
  Assemble a recurring developer-facing changelog newsletter from a list of shipped work: release highlights, deprecations approaching sunset, ecosystem and integration news, and a clear call to action. Scoped to DX/DevRel changelog newsletters sent to API consumers and developer communities — not newsletter discovery or sponsorship tools (use newsletter-monitor or sponsored-newsletter-finder) and not general product email copy (use feature-launch-playbook). Use when a DevRel team needs to ship a developer digest that reads like it was written by an engineer, not a marketer.
tags: [content, social]
---

# Developer Newsletter Composer

Write a developer changelog newsletter from raw shipped work. This skill assembles recurring developer digests — the kind of email or community post that API consumers and developer community members actually read: signal-dense, technically precise, no fluff, and built around what changed this week or month.

**Built for:** DevRel leads, API PMs, and developer community managers who ship a recurring developer newsletter but spend too long turning ship data into readable prose.

## Best Fit

- Weekly or monthly API developer digests
- SDK release and changelog newsletters
- Developer community Substack or Beehiiv publications
- GitHub Discussions or Discord announcements summarizing recent changes
- Internal engineering all-hands update emails with an API consumer angle

## Use Something Else

- To discover newsletters to sponsor or partner with, use `sponsored-newsletter-finder` or `newsletter-monitor`.
- To write general product launch emails, use `feature-launch-playbook`.
- To write a single API release's changelog entry, use `api-release-notes-composer`.
- To write a breaking-change announcement email only, use `breaking-change-comms-kit`.

## Inputs

| Field | Required | Notes |
|-------|----------|-------|
| `period` | Yes | Time range: "week of May 12", "April 2026", etc. |
| `shipped_items` | Yes | List of releases, PRs, features, fixes shipped this period |
| `deprecations` | No | Upcoming deprecations and their sunset dates |
| `ecosystem_notes` | No | Partner integrations, community contributions, third-party news |
| `cta` | No | Primary call to action for this issue |
| `publication_name` | No | Name of the newsletter or publication |
| `audience` | No | External API consumers, internal engineers, or community |
| `tone` | No | Technical/direct (default), friendly-developer, formal |
| `format` | No | Email (default), Markdown for GitHub/Discord, or both |
| `issue_number` | No | Issue number for publications that track issues |

## Phase 0 — Intake

Ask only for what is missing.

1. What period does this issue cover?
2. What shipped this period? (Paste a list of PRs, tickets, release notes, or bullet points)
3. Are there any deprecations approaching their sunset date that developers need to act on?
4. Any ecosystem or integration news to include?
5. What should the reader do after reading this? (Primary CTA)

If the user pastes a raw list of changes, start organizing immediately.

## Phase 1 — Content Triage

Before writing, sort the raw ship data into buckets and identify what deserves the most space:

### Triage Buckets

| Bucket | What belongs here | Space weight |
|--------|-------------------|--------------|
| **Highlights** | New capabilities, notable endpoints, SDK features, performance wins | Heavy |
| **Action required** | Breaking changes going live, deprecations reaching deadline | Always lead if present |
| **Deprecations** | Upcoming sunsets, migration windows opening | Medium if actionable |
| **Fixes** | Bug fixes and correctness improvements | Light — bullet list only |
| **Ecosystem** | New integrations, community contributions, third-party tools | Medium |
| **Coming up** | Announced upcoming changes, previews | Light |

Produce a triage summary before writing:

```
CONTENT TRIAGE — Week of May 12, 2026

Action required (1):
- v1 users endpoint retires June 1 — migration window closing

Highlights (2):
- New batch create endpoint for /v2/projects
- Python SDK 3.0 released with async-first design

Deprecations (1):
- X-Token header deprecated since Jan 2026 — 30 days to sunset

Fixes (3):
- Cursor stability fix for /v2/users under concurrent load
- Webhook signature verification now handles non-UTF-8 bodies
- Rate limit headers now include Retry-After on 429

Ecosystem (1):
- New community Zapier integration by @contributor_handle
```

Show this triage if there is an "action required" item. The team may want to promote it to a standalone breaking-change email instead of burying it in the digest.

## Phase 2 — Newsletter Structure

### Standard Structure

```
[Subject line / headline]

[Short intro — 1-2 sentences. What period, what tone, hook the reader.]

⚠ [Action required section — only if present. Always first.]

🚀 [Highlights — 1-3 items with enough context to be useful]

🔧 [Fixes — brief bullet list]

📦 [Ecosystem / integrations — optional]

📅 [Coming up — optional]

[CTA]

[Footer: unsubscribe, docs link, community link]
```

## Phase 3 — Write the Issue

### Subject Line

```
[API Name] Developer Digest — [Period]: [Headline change or feature]
```

Examples:
- "Gooseworks API Digest — May 2026: Python SDK 3.0 + batch endpoints"
- "Gooseworks Developer Update — Week of May 12: Action required before June 1"

Rules:
- Include the period
- If there is an action-required item, the subject must signal it
- Do not use emoji in the subject line
- Keep under 60 characters if possible

### Intro (2 sentences max)

```markdown
Here's what shipped in the [API Name] ecosystem this week. One item requires action before [date].
```

Rules:
- State the period
- If action is required, say so in the intro
- No "excited to share" or "we're thrilled to announce"

### Action Required Section

```markdown
## ⚠ Action required before [Date]

**[Change name]** — The [old behavior] stops working on **[Date]**. If you haven't migrated yet,
[one-sentence action]. Full migration guide: [URL]
```

Rules:
- Bold the change name
- Bold the deadline date
- One-sentence action
- Single link to migration guide
- Do not bury this section — it goes first

### Highlights Section

Write 1–3 highlight items. Each item gets 2–4 sentences.

```markdown
## 🚀 This week

**[Feature or endpoint name]**
[What it is in one sentence. What problem it solves or what it enables. How to use it or where to find it in the docs.]

---

**Python SDK 3.0**
The Python SDK is now async-first. All methods return coroutines by default; if you need
synchronous behavior, use the `SyncClient` class. [See the migration guide →](URL)
```

Highlight rules:
- Lead with the name in bold
- One sentence on what it is
- One sentence on why it matters
- One sentence with a link to docs, examples, or the full changelog entry
- Do not summarize every PR — pick 1–3 items that represent the most value to readers

### Fixes Section

```markdown
## 🔧 Fixes

- **Pagination cursors** — Cursors for `/v2/users` are now stable under concurrent write loads.
- **Webhook signatures** — Signature verification now handles request bodies with non-UTF-8 content.
- **Rate limit headers** — `Retry-After` header is now included on all `429` responses.
```

Fixes rules:
- Bold the affected area
- One sentence per fix
- No bug IDs or PR numbers unless the audience is internal
- 3–8 bullets maximum; group if there are more

### Ecosystem Section

```markdown
## 📦 Ecosystem

**Zapier integration by @contributor_handle** — The community has shipped a Zapier integration
that connects [API Name] events to 5,000+ apps. [Install it →](URL)
```

### Coming Up Section

```markdown
## 📅 Coming up

- `GET /v1/users` retires **June 1, 2026** — 30 days to migrate. [Migration guide →](URL)
- Python SDK 3.1 planned for June — adds streaming response support.
```

### CTA

```markdown
Questions? Join us in [#api-community](URL) or reply to this email.

→ [Full changelog](URL)  |  [Docs](URL)  |  [Status page](URL)
```

## Phase 4 — Tone and Voice Rules

Apply to every section:

- Write to developers, not end users
- Use endpoint paths, field names, and method names — not marketing names
- Active voice throughout
- No "powerful", "seamless", "world-class", "exciting", "delighted"
- No "we're thrilled to announce" or "we're excited to share"
- Numbers and specifics over vague claims: "50ms faster" not "noticeably faster"
- If you can't say what improved specifically, say "bug fix" and move on
- Emoji in section headers only — not in prose

## Phase 5 — Format Variants

### Email (default)

Plain text with Markdown-compatible headers. Include an unsubscribe footer placeholder.

### Markdown for GitHub / Discord

Use Discord-compatible Markdown (no HTML). Bold with `**`, no `<details>` blocks. Keep under 2000 characters for Discord; use a link to the full version if longer.

### Both

Deliver email version first, then a clearly marked Discord/GitHub variant.

## Phase 6 — Output

Deliver:
1. Subject line (3 variants if useful)
2. Full newsletter body in requested format(s)
3. Triage summary used to build the issue
4. Any `[URL: ...]` placeholders that need real links
5. A note if any shipped item should be promoted to a standalone breaking-change email instead

## Guardrails

- Do not invent features or fixes not present in the source data
- Do not write marketing copy — this is developer-to-developer communication
- Do not bury action-required items — they must appear first
- Do not skip the "coming up" section when there are known upcoming deprecation deadlines
- Do not write more than 3 highlights — more than that loses developer attention
- If the user provides more than 3 highlight candidates, ask which ones matter most
