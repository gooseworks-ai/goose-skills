# Direct Meta adapter

## Summary

Use this mode when there is no GooseWorks, but a Meta Marketing API access token and ad account
are available. The `ads/` docs are a local folder; Meta is read and written through the Graph
API directly. Launch goes through `launch-meta-ad-campaign`'s own direct adapter, which creates
everything paused and reads it back.

## The `ads/` docs

- A local `ads/` folder in the working directory the user chose for this brand. Create it on the
  first write. One folder per brand.
- Write `local` for `brand_id` and `coworker_agent_id` in `ads/README.md` and `ads/brand.md`.
- Read and write whole files with the host's file tools. Check the folder from the directory that
  holds `ads/`: `python3 <this skill's folder>/contract/validate.py ads`.

## Credentials

Keep the token in the environment (the launch skill's direct adapter names the variables:
the access token and the ad account id). Never put a token in the docs, a prompt, a command
argument or a log. The token needs `ads_read` for checks and answers, and `ads_management` for
launch and pause.

## Surfaces

- Chat in the agent host. There is no messaging channel: skip any "connect a channel" offer, and
  results reach the user in the chat reply.
- Scheduled checks only if the host has its own scheduler. Without one, run the checks when the
  user asks, and say that nothing checks the ads between conversations. "A line in the report"
  means a line in that check's chat reply.

## Stage → skills and calls

| Stage | What runs |
|---|---|
| intake, strategy | the stage skills, in their direct or planning-only mode. The campaign brief is kept in `strategy.md` (see `ad-management-intake`'s adapter) |
| create, review | a written creative brief per angle (message, proof, format). No generation service; the user supplies or makes the creatives |
| connect | the token and ad account in the environment. If a read fails on auth, say the Meta access needs renewing there. Never ask for the token in chat |
| launch | `launch-meta-ad-campaign`, direct Meta adapter. Record the campaign id it returns in `state.md` (`meta_campaign_id`); leave `meta_push_ids: []`. That campaign id is the **launch record**: every ad under it is the harness's own |
| turn on | the direct writer has no activation command. The user switches the campaign on in Ads Manager. Move `launch → live` (or `paused → live`) only after a read shows the campaign's `effective_status` is `ACTIVE` |
| quick check, deep check | Graph API insights reads (see `answer-ads-questions`' direct adapter), or `meta-ads-analyzer` when installed |
| fix and adjust | **Pause** only: set the ad, ad set or campaign `status` to `PAUSED` with the Graph API, then read it back. No revert. A budget change is a written recommendation the user makes in Ads Manager, or approves for you to make, every time |
| answers | `answer-ads-questions`, direct Meta adapter |

## Evidence pointers

In `decisions.md`, point at what you read: `meta:<object id> <since>..<until>` (for example
`meta:act_123 2026-09-17..2026-09-23`), or `user request` (see `contract/RULES.md` §1).
