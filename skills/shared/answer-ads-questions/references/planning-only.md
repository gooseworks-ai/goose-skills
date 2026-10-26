# Planning-only mode

## Summary

Use this mode when neither GooseWorks nor a Meta token is available. There is no Meta data to
read, so this skill answers **no number questions**. It still answers "why" questions from the
local `ads/` docs.

## What to say

- **A number question** ("how are the ads doing?"): say you cannot read Meta from here, and name
  the access that would let you: the GooseWorks tools, or a Meta token with `ads_read` and the ad
  account id. Never estimate, and never quote an `Observed:` line as if it were current. You may
  offer the most recent dated `Observed:` line as history, with its date.
- **A "why" question**: answer from `decisions.md` exactly as the workflow says: the entry's date,
  what was recommended, who decided, and its evidence pointer.
- **"What have you noticed?"**: read the campaign's `state.md` open recommendations and say they
  are from the docs, not from a fresh read.

## Whose ads are Goose's

Nothing is launched in this mode, so there is no launch record and rule 5 never applies.
