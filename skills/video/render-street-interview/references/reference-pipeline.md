# Street interview: pipeline, looks, cost and quality checks

**Summary.** The stage-by-stage pipeline (which stages are paid and which are free), the five finishing looks, what costs money, and the quality checks every cut must pass.

Part of the street-interview development record, split out of [`REFERENCE.md`](../REFERENCE.md). It is history, not today's runbook: `SKILL.md` and the selected recipe win where they differ. Brands, seeds and props are those experiments' (fictional brand names), never another brand's defaults. File names in backticks (`TAKES.md`, `selftest.py`, `brands/...`) are relative to the skill folder.

---

## Pipeline

```
brand-research        real facts and real assets              [required first]
write 4 beats         question, two wrong, one right          [fits 12-15s or it does not ship]
brands/<slug>.json    the creative, as data; copy the demo    [free; brandkit.py validates it]
selftest.py           the format survived the split           [free; no network, no ffmpeg]
single_gen.py         ONE call; dry run prints price + prompt  [PAID, 12s/720p]
  or variants_gen.py  six alternative grammars                [REFUSES: all six fail the lint]
fit_grade.py          SOLVE the grade for THIS take            [free; --write-brand stores it]
build_looks.py        grade + brand layer, 5 treatments        [free; --dry-run needs no ffmpeg]
recut.py              drop the dead air; pace                  [free; writes a .plan.json map]
check-cut.py          the ship gate; --falsify first           [free]
falsify-all.py        plant a fault for EVERY check            [free; run it after touching one]
measure-pace.py       shot lengths off the render              [free; the gate does not see pace]
bench.py              every take AND every real reference,     [free; no network]
                      same axes, same code, one table
```

`build.py` chains generate -> grade -> recut -> gate in one command, and its output is a graded
re-cut TAKE, not a finished ad: nothing in that chain draws a caption, a title or an end card.
The brand layer is `build_looks.py`, and it runs from the UN-recut take. Two pipelines, and only
one of them finishes a video. See Critical knowledge 20-22.

`bench.py` is the benchmark, and it exists because every realism number this format has quoted
was measured by a different ad-hoc command on a different subset of files. It measures our takes
and the real references on one set of axes -- shot-length distribution, cuts per second, detail at
a FIXED pixel width, black point, face-region saturation, per-shot ambience floor, LUFS, true peak
-- and prints the band each row is in or out of, plus the band **re-derived from the reference rows
in that same run**, so an inherited band that does not reproduce is visible instead of applied.
Run it before believing any claim in this file.

Two layers, and neither holds the other's job:

| | |
|---|---|
| `scripts/format_spec.py` | the prompt scaffold, the shot grammar, and the clause list the gate lints for. Format knowledge. No brand appears in it. |
| `brands/<slug>.json` | product and its reference photo, location, question, cast, dialogue, props, seed, caption copy, series header, logo, end card, measured cuts, measured ambience window. |

`check-cut.py` imports its clause list from `format_spec` rather than keeping a copy, so a clause
cannot be deleted from the prompt without the gate noticing, and `single_gen.py`'s dry run runs
the identical lint before any spend.

Every script takes `--brand <slug>` (default `grimwater`, or `$STREET_INTERVIEW_BRAND`).

Every script resolves the repo root by marker and the run folder by `--run`
(default `projects/street-interview/`, or `$STREET_INTERVIEW_RUN`). See `scripts/paths.py`:
none of them may assume they sit next to the take, which is what broke all of them once.

Historical reference build: `projects/street-interview/` was private and gitignored. Its footage, approved take and colour target are optional development evidence, not inputs that a customer must re-fetch. Start with the bundled generic brand config, bind this project's assets and choices, and use zero-strength finishing unless a real colour reference is supplied.

## The five looks

One take, five finished treatments, all free. Each is a published grammar, not a palette:

| look | grammar |
|---|---|
| `clean` | title, two burned answers, a gold payoff, a dark end card |
| `subway` | SubwayTakes: a brand bar up the whole video, an occupation pill, sentence-case captions on a plate. The strongest "this is a series" signal |
| `karaoke` | TikTok-native: two or three words at a time, huge, centred, ~4 changes/sec |
| `bare` | no captions under the speech at all. The honest control |
| `doc` | documentary lower third, muted grade, no shouting |

## Cost

Each generation (12s, 720p, Seedance 2.0) is a paid call; `--fast` is the cheaper endpoint.
GooseWorks quotes the price. The five looks on top of a take cost nothing, which is why the
cheap axis of variation is the brand layer and not the generation.

Most of the development spend went on the assembled approach that this skill now exists to
stop anyone repeating.

## Quality checks

1. `check-cut.py` passes. TEN checks, A to I plus R, each one tied to something that was
   actually rejected: format; length inside the 15s single-call cap; **provenance** (exactly one
   generation manifest, and the render is the take plus one end card, so a stitched cut fails);
   **prompt lint** (the clauses that were paid for are present, the vocabulary that was rejected
   is absent, and the product is in shot 1 and the final shot); no caption across a cut;
   graphics inside y=285..1635; **per-shot ambience floor** inside the real reference's band;
   -14 LUFS +/-0.7 with true peak under -1.5 dBTP; every scripted line audible under Whisper;
   and **R**, detail and black point on the render against the real-footage bands, measured at a
   fixed 720px width so the number is not a function of the scaler.
   A check that could not run prints `NOT RUN` and the gate exits non-zero. A WARN used to print
   above `PASS` with exit 0 -- see Critical knowledge 19.
2. `check-cut.py --falsify` first. It plants an out-of-zone caption and asserts F reports it,
   then an over-sharpened frame and asserts R reports it. A gate that has never failed is not a
   gate, and five detectors written for this format were themselves the bug -- see `TAKES.md`.
3. `falsify-all.py` for the whole gate, not just those two. It plants a fault for every check
   and reports which check caught it; anything that cannot fail is not a check. Free. Last full
   run 2026-09-30: all eleven plants caught by their own check (A, B, C, C2, D, E, F, G, H, I,
   R) -- and read Critical knowledge 18 before believing a MISSED, because two of the first
   eleven plants were simply too weak.
4. `measure-pace.py` on the render. The gate does not look at pace. Reference band 1.54-1.62s.
5. Watched end to end (`/watch`). The gate cannot tell whether a face reads as AI or whether a
   viewer can follow the video; every metric in an earlier scorecard passed while the cut was
   incomprehensible. The gate now prints what it did NOT assess on every run, pass or fail,
   because a PASS here has been read as "this is good" before.
6. Nobody has listened to the audio on this stack. Every audio judgement here is measured, and
   that limit should be stated when handing a cut over.
