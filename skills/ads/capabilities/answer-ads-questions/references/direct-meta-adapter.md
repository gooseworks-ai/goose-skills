# Direct Meta adapter

## Summary

Use this mode when there is no GooseWorks, but a Meta Marketing API token with `ads_read` and the
ad account id are available. Every read is a Graph API GET made this turn, so the numbers are
live: the **sync time is the moment of the read**, and the data window is the `time_range` you
passed. Keep the token in the environment; never put it in a reply, a file or a command argument.

## Reads → Graph API calls

| Read (workflow step 1) | Call | Window and sync time |
|---|---|---|
| Account totals for a window | the ad account's `insights`, `level=account`, `time_range` `{since, until}`, fields such as `spend`, `impressions`, `clicks`, `inline_link_clicks`, `actions`, `cost_per_action_type` | the `time_range`; the read time |
| Connection and sync state | the ad account itself: `account_status`, `disable_reason`, `currency`, `name` (see classes below) | the read time |
| Every entity at a level | the account's `campaigns`, `adsets` or `ads` with `effective_status`, plus `insights` at that `level`. Follow `paging.next` to the end before ranking | the `time_range`; the read time |
| A daily series | `insights` with `time_increment=1` for the entities in question | the `time_range`; the read time |
| One ad's context | the ad (`name`, `effective_status`, `creative`) and its `insights` | the `time_range`; the read time |
| Goose's own creatives | not available: there is no Goose record in this mode. Say so | — |
| A Goose push | not available in this mode (`meta_push_ids` stays empty). Say so | — |
| "Why…" and "what have you noticed" | the local `ads/` docs, as in the workflow | the entry's date |

Money comes back in the account's `currency`. `ctr` from the insights API is a **percent**
(2.1 means 2.1%), not a fraction. `cpc` is spend over all clicks; `cost_per_inline_link_click` is
per link click. Missing fields and missing days are unknown, not zero.

## Connection state → classes

| Class | How it shows up |
|---|---|
| Clean | the account read succeeds and `account_status` is 1 (active). **Any other value is not clean**: 2 (disabled) and 101 (closed) are Not connected; anything else (unsettled, in review, grace period…) is Partial, named in plain words |
| Partial | the account read succeeds but a later read in the turn fails or is throttled: name the part that failed and the numbers it affects |
| Stale | does not apply: direct reads are live. If Meta reports that recent data is still processing (today's numbers move), say today's figures are provisional |
| Not connected | an auth error (an expired or invalid token, missing `ads_read`), or `account_status` 2 or 101. Say the Meta access needs renewing; never ask for the token in chat |
| Error | any other failed read: say which read failed and why |

## Goose's ads

There are no Goose pushes in this mode. The **launch record** (rule 5) is the campaign id in
`state.md` (`meta_campaign_id`), which `launch-meta-ad-campaign`'s direct writer created: every
ad under that campaign is the harness's own, and pause applies to it (there is no revert). Every
other ad is the user's own and read-only here, unless a `decisions.md` entry says it was published
in an earlier GooseWorks session; then say so, and that this mode cannot confirm it.
