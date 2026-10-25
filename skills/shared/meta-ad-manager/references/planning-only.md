# Planning-only mode

## Summary

Use this mode when neither GooseWorks nor a Meta token is available. The harness still does its
most valuable work: intake, strategy, and a creative brief the user can take to Ads Manager.
Nothing is read from or written to Meta, and the skill says so plainly rather than treating it as
a failure.

## The `ads/` docs

- A local `ads/` folder in the working directory, exactly as in the direct Meta adapter: `local`
  for both ids, whole-file writes, and `python3 <this skill's folder>/contract/validate.py ads`
  (run from the directory that holds `ads/`) to check it.
- The campaign brief is kept in `strategy.md` (see `ad-management-intake`'s adapter).

## Whose ads are Goose's

Nothing is launched in this mode, so there is no launch record.

## Stages available

| Stage | In this mode |
|---|---|
| intake | yes |
| strategy | yes. Account facts are unknown: assume a cold account with no tracking, and say so |
| create, review | a written creative brief per angle; no generation |
| launch | no. Hand over the strategy and the brief, and name the access a launch needs: GooseWorks, or a Meta token with `ads_management`, the ad account id and Page access. `launch-meta-ad-campaign`'s planning-only reference produces the Ads Manager checklist |
| checks, fixes, answers from Meta | no. "Why" questions are still answered from `decisions.md` |

The furthest stage a campaign can reach here is `review` (the user has approved the creative brief). Do not move it to `launch` or `live`.

## Final line

End each session with: what was written to `ads/`, that nothing was created in Meta, and the one
access step that would unlock the next stage.
