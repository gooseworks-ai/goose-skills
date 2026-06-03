# Sample Listings

Use this fixture to test the `bounty-board-auditor` workflow.

## Listings

| Board | Listing | Amount | Board Status | GitHub |
|-------|---------|--------|--------------|--------|
| ExampleRewards | Storybook select control bug | $110 | Open | https://github.com/storybookjs/storybook/issues/12641 |
| ExampleRewards | Archived repo bounty | $100 | Open | https://github.com/rodrigompy/bugb/issues/1 |
| ExampleBounties | macOS threading bounty | $250 | Open | https://github.com/jaseg/python-mpv/issues/61 |
| ExampleBounties | Broad ComfyUI integration | $1050 | Open | https://github.com/jbilcke-hf/clapper/issues/5 |

## Expected Classifications

- Storybook issue: `closed-on-github`
- Archived repo bounty: `repo-archived`
- macOS threading bounty: `withdrawn` if comments confirm payer withdrawal
- Broad ComfyUI integration: `needs-scope` if labels or comments show unresolved scope
