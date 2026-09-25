# Direct Meta adapter

## Summary

Use this mode when there is no GooseWorks, but a Meta Marketing API token (with at least
`ads_read`) and the ad account id are available. Account facts are read from the Graph API; the
strategy goes to a local `ads/` folder.

## Launch capability (what the host can launch)

The direct writer bundled with `launch-meta-ad-campaign` creates **Traffic** campaigns only: one
campaign, one ad set, created paused. So decision rule 1's bridge applies exactly as for
GooseWorks. If the user will build the campaign themselves in Ads Manager instead, every objective
is available: write the right objective and skip the bridge.

## Files and the brief

- A local `ads/` folder, ids `local` (see the `meta-ad-manager` skill's direct adapter).
- There is no campaign record: the brief's facts are in the `strategy.md` v1 stub that intake
  wrote (goal, offer, destination, audience, budget, success number). Keep them when you write the
  full strategy.

## Account facts (decision rule 2)

Read them with Graph API GET calls on the ad account, never from memory:

| Fact | Read |
|---|---|
| Is the account cold? | lifetime spend: the account's `insights` with `date_preset=maximum`, field `spend`, in the account `currency`. (The account's `amount_spent` resets with its spend cap, so it is not always lifetime) |
| Is the account usable? | the ad account's `account_status` (1 = active) |
| Is tracking present? | the account's `adspixels`, with `last_fired_time` |
| Weekly volume of the target event | the account's `insights` for the last 7 complete days, `actions` for that event |
| Existing customers to exclude | the account's `customaudiences` (a customer list, by name) |

Write each result as an `- Observed:` line with its window, the read time as the sync time, and
`source meta:<account id>`.

## The hand-off

There is no generation service. Write one concept per angle (person, message, proof) into the
strategy's Creative plan, and hand the user a creative brief for the ads that will run. If the
user has their own generator, the 3x rule still applies to what they generate.
