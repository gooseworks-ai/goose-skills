# dialogue-cut

## 1.0.2

- A file path may be a Windows path (`C:\...` or `C:/...`). Every file going in or out was refused on Windows before, because a path had to start with `/`. Rebuilt with the shared path fix; nothing else changed from 1.0.1.

## 1.0.1

- A line under the 0.5 s cut floor whose neighbours can each spare only part of its shortfall now takes time from both (the line before gives what it can, the next line the rest), instead of staying short and failing the plan's minimum-cut check. Every edit 1.0.0 made is unchanged.

## 1.0.0

- First version: the podcast recipe's cut planner (plan_cuts.py) and compose (compose_master.py) as a free part. Plain, split and dynamic edits of one lipsync clip per line over a fixed two-host voice track; reframes, split seams, the idle listener or a product photo below, the payoff single, the warm-lift-grain look, the end card; the plan's self-checks and a drift check on the render; the §4.12 size rule.
