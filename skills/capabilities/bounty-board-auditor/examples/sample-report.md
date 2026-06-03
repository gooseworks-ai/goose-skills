# ExampleRewards Bounty Board Audit

Date: 2026-06-02

## Executive Summary

The sample board has several open-looking rewards that are not cleanly actionable when checked against GitHub. The highest-risk issues are listings where the board says open but GitHub shows closed, archived, unavailable, withdrawn, reserved, or heavily crowded state.

## Findings Table

| Listing | Amount | Board Status | GitHub State | Classification | Priority |
|---------|--------|--------------|--------------|----------------|----------|
| storybookjs/storybook#12641 | $110 | Open | Closed/completed | closed-on-github | High |
| rodrigompy/bugb#1 | $100 | Open | Repo archived, issue closed | repo-archived | High |
| jaseg/python-mpv#61 | $250 | Open | Open issue, payout withdrawn in comments | withdrawn | High |
| jbilcke-hf/clapper#5 | $1050 | Open | Open issue, scope not final | needs-scope | Medium |

## Findings

### Finding 1: Storybook #12641 Shows Open On The Board But Closed On GitHub

Surface:

- Board: ExampleRewards
- GitHub: `https://github.com/storybookjs/storybook/issues/12641`

Evidence:

- Board status says open.
- GitHub issue state is closed.
- GitHub state reason is completed.

Risk:

Contributors may start work for a reward that is no longer actionable on the source issue.

Recommended action:

Synchronize board state from GitHub and hide the listing from active rewards.

Suggested wording:

> Closed on GitHub. Reward is not currently actionable.

### Finding 2: Archived Repo Bounty Is Still Listed As Open

Surface:

- Board: ExampleRewards
- GitHub: `https://github.com/rodrigompy/bugb/issues/1`

Evidence:

- Board status says open.
- GitHub repository is archived.
- GitHub issue state is closed.

Risk:

An archived repository is not a normal implementation target. Contributors may waste time on a reward that cannot be merged.

Recommended action:

Hide archived-repository rewards from active listings.

Suggested wording:

> Repository archived and issue closed on GitHub. Reward is not currently actionable.

### Finding 3: Bounty Withdrawn In GitHub Comments

Surface:

- Board: ExampleBounties
- GitHub: `https://github.com/jaseg/python-mpv/issues/61`

Evidence:

- Board status says open.
- GitHub comments say the bounty is no longer active and will not be honored.

Risk:

This is a direct payout trust issue. The board invites work that the payer says they will not pay for.

Recommended action:

Mark as withdrawn or require payer reconfirmation.

Suggested wording:

> Bounty withdrawn by payer in GitHub comments. Do not start for payment unless the payer reconfirms.

### Finding 4: High-Value Listing Needs Scope Confirmation

Surface:

- Board: ExampleBounties
- GitHub: `https://github.com/jbilcke-hf/clapper/issues/5`

Evidence:

- Board status says open.
- The issue is broad and requires scope refinement before implementation.

Risk:

The amount is attractive, but the implementation target is not crisp enough for safe contributor work.

Recommended action:

Add a preflight state before contributors start implementation.

Suggested wording:

> Spec not final. Ask maintainer for scope confirmation before implementation.

## Next Action

Send the board operator a concise cleanup report with exact stale listings, GitHub evidence, and recommended public wording.
