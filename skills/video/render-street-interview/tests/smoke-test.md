# render-street-interview smoke test (free)

1. From an empty folder: `python scripts/selftest.py` ends in `PASS`.
2. `python scripts/single_gen.py --brand demo-tallgrass-oat` prints a price and the full prompt
   and sends nothing (no key needed).
3. With three takes and their manifests in `<run>/working/takes/`:
   `python scripts/build_episode.py --episode liquid-death-ep2fix-v3 --run <run>` renders 22.64 s,
   11 shots, captions starting "QUICK / QUESTION. / WHAT'S / IN THIS / CAN?".
4. `python scripts/check-cut.py --episode <run>/output/looks/<name>.episode.json` runs every check
   and prints what it did not assess.
