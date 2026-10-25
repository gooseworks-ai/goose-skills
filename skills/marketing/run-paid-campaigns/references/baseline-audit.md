# First-run account baseline

Load at step 0, the first time this playbook runs on an account (and again when the structure changed a lot). A senior operator never moves money in a new account before knowing its shape. Use the marketer's exports (campaign / ad set / ad, last 30 days if they have it, else 14) plus, with GooseWorks, `meta_read` performance for the ads GooseWorks made (local mode: the connector's account-wide reads instead, `local-mode.md`). Do this first, because every later move depends on whether the account can learn at all.

## What to map

| Look at | How | What it usually seeds |
|---|---|---|
| **Ad sets vs the learning floor** | per ad set: optimisation event, conversions in the last 7 days vs ~50 (Meta's guideline), daily budget vs ~50 × allowable ÷ 7 | consolidation instructions (merge thin ad sets into one, broad targeting); a higher-funnel event if even one can't be fed |
| **Overlap and fragmentation** | several ad sets with similar audiences, interest stacks, one ad per ad set | consolidation; audience exclusions (purchasers out of prospecting) |
| **Spend concentration** | share of spend on the top concept and the top 3 ads | if one ad carries > ~50%: a rotation request before it fatigues; if spend is spread over 20+ ads with few conversions each: fewer, stronger concepts |
| **Creative age and mix** | days live per top ad; formats (static / video / carousel), angles (from the makers' tags where present) | rotation cadence; gaps in formats the placements need |
| **Click-rate trend on the top ads** | 3-day vs 14- or 28-day click rate at similar spend | early fatigue flags |
| **Retargeting and brand share** | spend on retargeting and brand-search vs prospecting | keep them out of the scale case (low incrementality); cap retargeting share |
| **Tracking and attribution** | conversion event firing, attribution setting, platform conversions vs store orders (from the weekly read) | fix moves; whether results can be trusted this week |
| **Account hygiene** | spending limit set, payment method, rejected ads, special ad category declared where needed | instructions |

## Output

A short "Account at a glance" block as the first section of the first proposal's story (`### Account at a glance`, before Checks and pacing; the main finding also goes in In short): 5–8 lines, each a finding with its number and the move it seeds ("4 of 6 ad sets get under 10 purchases a week — I propose merging them into one (move 3)"). Record the baseline date and the key counts in `state.md`'s header so later runs can see what changed. No moves are applied from the audit by itself — they go into the same proposal and the same approvals.
