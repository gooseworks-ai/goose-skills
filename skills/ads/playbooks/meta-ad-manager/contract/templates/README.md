---
brand_id: <id>
coworker_agent_id: <id>
updated_at: <date>
---
<!--
ads/README.md — the campaign index. Every harness run reads this file FIRST, then opens
only the campaign folder it needs.

brand_id           The GooseWorks brand id (from brand_list). Never the brand name.
                   Outside GooseWorks (a local ads/ folder): `local`, here and below.
coworker_agent_id  The brand's coworker agent (brand_list → coworker_agent_id). This agent's
                   workspace is where this folder lives; outside hosts pass it as the file-tool scope.
updated_at         Date of the last write to this file (YYYY-MM-DD).
-->

# Ads — <brand name>

## Campaigns

<!--
One row per folder under campaigns/, including ended ones. Rows and folders must match.

Campaign     The folder slug (kebab-case), exactly as on disk.
Stage        Must equal the `stage` in that campaign's state.md:
             intake | strategy | create | review | launch | live | paused | ended.
             This is the HARNESS stage (where Goose's work is), not Meta delivery status.
Last action  What Goose last did, one short clause.
Next action  What happens next and who owns it ("user approves budget", "deep check Mon").
Updated      YYYY-MM-DD of the last change to this row.
-->

| Campaign | Stage | Last action | Next action | Updated |
|---|---|---|---|---|
| <slug> | <stage> | <last action> | <next action> | <date> |
