# Free hook replacement check

Generate the neutral fixture locally, replace its 2.4-second opening with the
1.5-second supplied hook, and inspect the complete 6.1-second output.

```bash
python3 scripts/make_demo.py --out-dir demo
python3 scripts/replace_hook.py --config demo/config.json
python3 -m unittest discover -s tests -v
```

Expect all source/body/audio/caption booleans true, 138 retained original frames,
duration delta -0.9s and review status needs_review. Tests need no credentials or
network. Optional HOOK_TEST_FONT exercises the kinetic text treatment.
