# Planning-only mode

## Summary

Use this mode when neither GooseWorks nor a Meta token is available. The strategy is still the
whole deliverable: the user takes it to Ads Manager. Nothing is read from Meta.

## Launch capability (what the host can launch)

The user builds the campaign themselves in Ads Manager, where every objective is available. So
write the **right** objective and its optimization goal, and skip decision rule 1's bridge. Say
plainly that the account was not read.

## Files and the brief

- A local `ads/` folder, ids `local` (see the `meta-ad-manager` skill's planning-only reference).
- The brief's facts are in the `strategy.md` v1 stub that intake wrote. Keep them.

## Account facts

Unknown. Assume a cold account with no tracking, write that as an assumption (never as an
`- Observed:` line), and add the three reads that would replace it to the strategy's Reasoning:
lifetime spend, whether a pixel fires, and the weekly count of the target event.

## The hand-off

Write one concept per angle into the Creative plan and a creative brief the user can hand to a
designer or a generator. The 3x rule applies to whatever they generate. End with the Ads Manager
settings the strategy implies (objective, optimization goal, one ad set, budget, placements) and
the note that everything should be created paused and reviewed before it spends.
