# Smoke Test

1. `plan_takes.py --beats cutlist.json --character character.json --out takes` writes `takes/takes.json` and one `tN-prompt.txt` per take. No take is over 15s and no line is split across two takes.
2. `run_takes.py --spec takes/takes.json` (no `--go`) prints the plan and a cost estimate and spends nothing.
3. With approval: `run_takes.py --spec takes/takes.json --only t1 --go`, then `--go` for the rest. Every call goes through the GooseWorks fal-proxy (bills the Ads agent); nothing calls fal directly.
3a. Free, no provider call: `python -m pytest skills/ads/capabilities/create-creator-takes-h3/tests/test_run_takes_rejection.py` runs `run_takes.py` against a local mock proxy that refuses the take on likeness grounds. Pass when the run exits 3 after one submit, prints the reason, request id and charge state, and a second identical run exits 3 with no upload and no submit.
4. `join_takes.py --spec takes/takes.json --end <reel length> --out creator.mp4` joins with 0.10s dissolves.
5. `align_beats.py --beats cutlist.json --words creator.words.json --out cutlist.aligned.json` reports at least 70% of the script heard.

Pass when later takes carry t1's voice, the joined track runs the full reel length, and aligned boundaries sit between spoken words.
