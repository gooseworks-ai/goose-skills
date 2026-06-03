---
name: bounty-board-auditor
description: Audit public bounty, reward, and paid-issue boards against GitHub source-of-truth state. Detect stale open listings, closed GitHub issues, archived or missing repositories, withdrawn payouts, reserved bounties, crowded duplicate PRs, and unclear assignment state.
tags: [research, competitive-intel, lead-generation, monitoring]
user-invocable: true
allowed-tools: Bash, Read, Write, Edit, Grep, Glob, WebFetch
argument-hint: "[bounty board URL or GitHub issue URLs]"
---

# Bounty Board Auditor

Audit public bounty/reward listings before contributors waste time or maintainers get duplicate PR noise.

Use this skill when the user wants to:

- Check whether paid GitHub issues are still actionable.
- Audit a bounty board, reward marketplace, or sponsor issue list.
- Find stale open listings that are closed or contradicted on GitHub.
- Prepare a maintainer/platform cleanup report.
- Decide whether a bounty is worth attempting.

## Inputs

Accept any of:

- A bounty/reward board URL.
- A GitHub organization or repository.
- A list of GitHub issue URLs.
- A CSV/Markdown list of bounty listings.
- A minimum payout threshold.
- A target buyer type: `platform`, `maintainer`, `sponsor`, or `contributor`.

Ask for missing scope only when needed. If the user provides a board URL or issue list, start auditing.

## Output

Produce a Markdown report with:

- Executive summary.
- Findings table.
- Evidence-backed per-issue findings.
- Recommended public status wording.
- Buyer/action next steps.

## Optional Script

Use the included script when the input is a Markdown or CSV file containing GitHub issue URLs:

```bash
node ${CLAUDE_SKILL_DIR}/scripts/audit_bounty_board.mjs \
  --input ${CLAUDE_SKILL_DIR}/examples/sample-listings.md \
  --output bounty-board-audit.md
```

For deterministic local testing without GitHub API calls:

```bash
node ${CLAUDE_SKILL_DIR}/scripts/audit_bounty_board.mjs \
  --input ${CLAUDE_SKILL_DIR}/examples/sample-listings.md \
  --offline
```

## Workflow

### 1. Normalize Listings

For each candidate listing, extract:

- Platform or board name.
- Listed repository.
- Listed issue or PR URL.
- Listed payout amount.
- Listed status.
- Listed solver/attempt count, if available.
- Last updated date, if visible.

If a listing does not expose a GitHub issue URL, search for the exact title and repository name before marking it unknown.

### 2. Validate GitHub Source State

For every GitHub-backed listing, check:

- Repository exists.
- Repository is public or reachable.
- Repository is not archived.
- Issue exists.
- Issue state: open or closed.
- Issue state reason, if available.
- Assignees.
- Labels such as `bounty`, `paid`, `good first issue`, `blocked`, `to refine`, `reserved`, `released`, `completed`, or amount labels.
- Comments mentioning payout withdrawal, reservation, assignment, claim, stop-work, completed work, or maintainer clarification.
- PRs referencing the issue.

Prefer primary GitHub issue/PR state over marketplace snippets.

### 3. Classify Each Listing

Use these statuses:

- `active`: GitHub issue is open, repository is active, payout path is still plausible, and crowding is low.
- `closed-on-github`: marketplace says open but GitHub issue is closed.
- `repo-unavailable`: repository or issue URL returns 404, moved, private, deleted, or cannot be resolved.
- `repo-archived`: repository is archived.
- `withdrawn`: comments say bounty/reward will not be honored.
- `reserved`: comments say bounty is assigned or reserved for a specific person.
- `crowded`: multiple PRs, claim comments, `/attempt`, `/boss champion`, or equivalent signals already exist.
- `needs-scope`: issue is labeled `to refine`, `needs spec`, `blocked`, or has vague acceptance criteria.
- `needs-reconfirmation`: payout state is ambiguous and should be confirmed before work starts.

### 4. Risk Rules

Flag as high priority when:

- Marketplace status says open but GitHub is closed.
- Repository is archived or unavailable.
- Payer explicitly withdrew payment.
- Payout is large and listing looks low-competition, but GitHub says reserved/closed.

Flag as medium priority when:

- Multiple PRs exist for the same bounty.
- The issue is assigned but marketplace still invites solvers.
- Maintainer comments ask contributors to stop submitting.

Flag as low priority when:

- Issue is open but broad or needs scope clarification.
- Payout amount is low and crowding is moderate.

### 5. Recommended Status Wording

Use concise public wording:

- Closed on GitHub. Reward is not currently actionable.
- Repository archived. Reward is hidden until the repository is active again.
- GitHub repository is unavailable. Reward is hidden until the issue URL resolves.
- Bounty withdrawn by payer in GitHub comments. Do not start for payment unless the payer reconfirms.
- Bounty reserved for a specific maintainer/contributor. Do not start for payout.
- High competition: multiple solution PRs already exist. Check maintainer comments before starting.
- Spec not final. Ask maintainer for scope confirmation before implementation.
- Payer confirmation required before new work starts.

### 6. Report Template

```markdown
# [Platform/Repo] Bounty Board Audit

Date: [YYYY-MM-DD]

## Executive Summary

[2-4 sentences explaining the main trust/actionability problem.]

## Findings Table

| Listing | Amount | Board Status | GitHub State | Classification | Priority |
|---------|--------|--------------|--------------|----------------|----------|
| [repo#issue](url) | [$] | [open/unknown] | [open/closed/404/archived] | [status] | [high/medium/low] |

## Findings

### Finding 1: [Title]

Surface:

- Board: [url]
- GitHub: [url]

Evidence:

- [primary-source evidence]
- [comment/PR/label evidence]

Risk:

[Why this misleads contributors or burdens maintainers.]

Recommended action:

[Concrete status/label/copy update.]

Suggested wording:

> [public-facing status text]

## Next Action

[Email/contact/issue/comment recommendation.]
```

## Contributor Guidance

If the user wants to attempt a bounty, do not recommend implementation unless:

- GitHub issue is open.
- Repository is active and reachable.
- Payout rules are visible.
- No maintainer comment says stop, reserved, withdrawn, or completed.
- Assignment rules are satisfied.
- Existing PR count is low or the user has explicit maintainer confirmation.

If these checks fail, recommend a cleanup audit or confirmation message instead of a PR.

## Evidence Standard

Do not claim a payout is available from a marketplace listing alone. Treat payment as unverified until primary source evidence supports it.

Do not claim money was earned unless there is proof of acceptance and payment.
