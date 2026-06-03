# bounty-board-auditor

Audit public bounty, reward, and paid-issue boards against GitHub source-of-truth state.

This skill helps agents avoid stale or misleading paid work by classifying listings as active, closed, archived, unavailable, withdrawn, reserved, crowded, or needing scope confirmation.

## Example Requests

- Audit this bounty board for stale open issues: `https://example.com/bounties`
- Check whether these GitHub bounty issues are still worth attempting.
- Create a maintainer-facing cleanup report for this repo's paid issues.
- Find open-looking rewards where GitHub says the issue is closed or the repo is archived.

## What It Produces

- A Markdown audit report.
- Evidence-backed findings.
- Recommended public status wording.
- A contributor recommendation: attempt, ask for confirmation, or avoid.
- Optional sample input/output artifacts for review.

## Examples

- `examples/sample-listings.md`: small input fixture with mixed board states.
- `examples/sample-report.md`: expected report shape and recommendation style.

## Script

Run a deterministic smoke test without GitHub API calls:

```bash
node scripts/audit_bounty_board.mjs --input examples/sample-listings.md --offline
```

Run the self-test:

```bash
node scripts/test_audit_bounty_board.mjs
```

## Good Fit

- Bounty platforms.
- OSS maintainers with paid issue programs.
- Contributors doing AI-assisted bounty work.
- Sponsor teams trying to reduce duplicate PR noise.
