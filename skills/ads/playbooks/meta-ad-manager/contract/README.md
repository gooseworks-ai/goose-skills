# Meta ad harness: docs contract

This folder defines the files the Meta ad harness keeps for each brand, and the rules for
reading and writing them. Every harness skill (the orchestrator, intake, strategy, launch,
checks, fix-and-adjust) follows it.

| File | What it is |
|---|---|
| [RULES.md](RULES.md) | **Start here.** Where the files live, the exact file-tool calls, read order, number rules |
| [templates/](templates/) | One template for each harness file. Comments explain every field. The templates are also the schema the validator checks against |
| [validate.py](validate.py) | Checks an `ads/` folder against the templates and rules. Python standard library only |
| [examples/sample-brand/ads/](examples/sample-brand/ads/) | A fictional brand with one live campaign and one in strategy. It validates |
| [tests/](tests/) | `python3 -m unittest discover tests`. The sample passes, and each rule has fixtures that must fail |

The harness layout, wherever the mode's adapter keeps the brand's `ads/` folder:

```
ads/
  README.md                  index: every campaign, stage, last and next action
  brand.md                   business facts shared by all campaigns
  campaigns/<slug>/
    strategy.md              what the campaign is trying to do, and why
    state.md                 harness stage, ids, open recommendations
    decisions.md             append-only log of recommendations and decisions
```

To change the contract, edit the template **and** the sample in the same change, then run the
tests. The validator reads the templates, so a new required section or field takes effect
immediately.
