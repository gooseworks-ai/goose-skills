---
campaign: <slug>
stage: <enum: intake|strategy|create|review|launch|live|paused|ended>
goose_campaign_id: <optional id>
meta_push_ids: <list>
meta_campaign_id: <optional id>
updated_at: <date>
updated_by: <string>
---
<!--
ads/campaigns/<slug>/state.md — where this campaign is in the harness loop. Written by the
orchestrator, launch and fix-and-adjust after every action. Holds ids and pointers, never Meta
facts: spend, delivery status and rejections are read from tools when needed.

campaign           The folder slug.
stage              Harness stage. Must match this campaign's row in ads/README.md.
goose_campaign_id  The Goose campaign id once one exists, else `none`.
meta_push_ids      Goose Meta push ids for this campaign, e.g. [push_1, push_2]; [] before launch.
meta_campaign_id   The Meta campaign id once pushed, else `none`.
updated_at         Date of the last write (YYYY-MM-DD).
updated_by         The skill that wrote it (meta-ad-manager, launch-meta-ad-campaign, …).
-->

# State — <campaign name>

## Open recommendations
<!-- Recommendations waiting on the user, one bullet each:
`- R<n> (YYYY-MM-DD): <what Goose recommends> — evidence <pointer> — awaiting | approved | declined`.
When one is decided, append the outcome to decisions.md and remove it here. "None." if empty. -->

## Pre-approved rules
<!-- Actions the user approved in advance, with limits, e.g. "pause any ad whose CPA is above
2x target after 3 complete days". Budget changes are never pre-approved for now. "None." if empty. -->

## Last check
<!-- The last quick or deep check: date, kind, and a pointer (report:<id>). The next check
opens by saying whether the last recommendation was done. -->
