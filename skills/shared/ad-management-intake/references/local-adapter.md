# Local adapter

## Summary

Use this mode when there is no GooseWorks: a host with a direct Meta connection, or planning only.
Intake never touches Meta, so both work the same way. Research comes from the brand's own pages,
and everything is written to a local `ads/` folder.

## Research (the skill's "research step")

- If the user gave you notes or documents about the brand, read those first. They count as
  research; label facts from them "(per <name>, brand notes)".
- Then, if the host has web tools, read the brand's own site: the home page, the pricing page,
  the product pages, the about page. Nothing more: no broad market study.
- With no notes and no web tools, there is no research: treat the brand as cold (up to 20
  questions in total, still at most four a turn).
- Say which notes or pages you read when you state your assumptions.

## Questions

Use the host's own question control (in Claude Code, AskUserQuestion: 1–4 questions, 2–4
options). Without one, ask in plain numbered text, still at most four a turn.

## The `ads/` docs

- A local `ads/` folder in the working directory the user chose for this brand. Create it on the
  first write.
- Write `local` for `brand_id` and `coworker_agent_id`.
- Whole-file writes with the host's file tools. Check the folder with the `meta-ad-manager`
  skill's validator, run from the directory that holds `ads/`:
  `python3 <meta-ad-manager folder>/contract/validate.py ads`.

## The brief lives in `strategy.md`

There is no campaign record outside GooseWorks, and the contract allows no extra files in `ads/`.
So the brief's facts go into the campaign's `strategy.md` **v1 stub**, each labelled as the
Output section says. This is the one exception to "if `strategy.md` exists, leave it alone":
intake owns these brief lines in local mode.

| Brief fact | `strategy.md` section |
|---|---|
| goal (what the money should produce), offer and price, destination, constraints | `## Goal`, as short labelled lines (`Offer:`, `Destination:`, `Constraints:`) |
| audience | `## Audience` |
| total budget and run time (the brief's budget and date fields) | `## Budget` |
| the success number | `## Success metric` |

Every other section stays "Not decided yet — the strategy stage sets this." A correction to one
of these facts rewrites that line and appends the `Corrected:` entry to `decisions.md`. If the
strategy was already approved, the next strategy run treats the correction as a re-read.
