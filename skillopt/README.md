# SkillOpt integration — optimize skills, don't just test them

This wires our skills into [microsoft/SkillOpt](https://github.com/microsoft/SkillOpt),
which treats a **skill document as a trainable artifact** (the model stays frozen)
and improves it with a training-style loop. Everything — the student, the tutor,
the judge, the question-generator — runs through the **already-authenticated
Claude CLI** (`claude_chat` backend). **No API key needed.**

> Sibling tool: [`../test/TESTING.md`](../test/TESTING.md) just *grades* a skill
> (with a nice HTML report). This folder *improves* a skill. Read that one first
> if you only want pass/fail testing.

---

## Glossary (plain English)

| Term | What it is |
|---|---|
| **skill** | the cheat-sheet handed to the AI (`SKILL.md`) |
| **seed** | the starting cheat-sheet for a run |
| **student / target** | the AI doing the task with the current cheat-sheet (LLM) |
| **judge** | grades each answer 0–1 against an answer-key (LLM). Decides nothing. |
| **rubric** | the answer-key: what a correct answer must contain |
| **tutor / optimizer** | reads the student's failures and rewrites the cheat-sheet (LLM) |
| **examiner / gate** | keeps the rewrite only if a held-out split scores higher |
| **round / step** | one cycle of tutor-edits → examiner-checks |
| **train / val / test** | three question piles: train→tutor learns, val→examiner decides, test→final honest grade (nobody acts on it) |
| **generator** | an LLM that writes the questions from the skill's *contract* (LLM) |
| **contract** | the skill's interface — name, description, when-to-use, inputs — **never its method** |

The loop: `rollout (student) → reflect (tutor) → gate (examiner) → final test`.

---

## Files

```
skillopt/
  setup.sh                 # one-command setup (venv + install + fetch prompts)
  requirements.txt         # pins skillopt==0.1.0
  fetch_prompts.py         # downloads prompts the wheel forgets to ship (run by setup.sh)

  extract_contract.py      # pull ONLY the contract from SKILL.md/meta.json (no method)
  generate_questions.py    # agent writes train/val/test questions from the contract
  calibrate_rubrics.py     # strengthen rubrics until a junk answer FAILS them (per --split)
  discriminate.py          # diagnostic: full-skill vs junk-seed → does the test discriminate?
  make_dataset.py          # hand-written seed scenarios (meta-ads ref) + real capture as test

  envs/meta_ads_analyzer/
    dataloader.py          # loads items, preserves prompt/csv/rubric
    adapter.py             # rollout (skill→files→judge→hard/soft) + reflect ; generic.
                           #   target+judge run via Claude CLI under a sandbox-exec WRITE-JAIL
                           #   (writes confined to the per-run workspace; reads/network free)

  run.py                   # --skill <slug> : single-skill backend wiring + cfg + trainer
  run_batch.py             # many skills: --category/--skills/--all, --jobs N, --calibrate, --force
  report.py                # --open : self-contained HTML "system view" of a run

  CAPTURE_FAILURE.md       # ⭐ build train/val/test from REAL user feedback (turn a bad output into a question)

  data/<slug>/{train,val,test}/items.json   # the questions (gitignored — may hold real data)
  outputs/<slug>/                            # best_skill.md, history.json, report.html, steps/ (gitignored)
```

(`<slug>` is the skill name with dashes→underscores, e.g. `meta_ads_analyzer`.)

---

## Setup (one-time)

```bash
cd goose-skills
bash skillopt/setup.sh
```

Creates `skillopt-venv/` (gitignored), installs `skillopt`, fetches the missing
prompts. **Prereqs:** Claude CLI logged in (`claude` → `/login`); optionally
`META_ADS_TOKEN` in `.env` only if you want to capture *real* Meta data.

---

## The full loop, for ANY skill

```bash
VENV=./skillopt-venv/bin/python

# 1. MAKE QUESTIONS — agent reads the skill's CONTRACT ONLY (no method = no leakage)
$VENV skillopt/extract_contract.py  --skill <slug>                 # inspect what it will read
$VENV skillopt/generate_questions.py --skill <slug> --n-train 6 --n-val 3 --n-test 3

# 2. CALIBRATE RUBRICS — REQUIRED, and on BOTH train and val (see "Making the test GOOD").
#    train hard ⇒ the tutor has failures to learn from; val hard ⇒ the gate can tell improvement.
$VENV skillopt/calibrate_rubrics.py --skill <slug> --split train
$VENV skillopt/calibrate_rubrics.py --skill <slug> --split val
$VENV skillopt/discriminate.py     --skill <slug> --split val      # optional: confirm it DISCRIMINATES

# 3. OPTIMIZE — the tutor/examiner loop
$VENV skillopt/run.py --skill <slug> --smoke                       # cheap: 1 rollout + 1 judge
$VENV skillopt/run.py --skill <slug>                               # full tiny run
#   --weak-seed : start from a 2-line skill to demonstrate a gain

# 4. SEE IT — local UI
$VENV skillopt/report.py skillopt/outputs/<slug_underscored> --open
```

Output lands in `skillopt/outputs/<slug>/`: `best_skill.md` (winning cheat-sheet),
`history.json` (per-step scores), `report.html` (the UI).

> ⚠️ **Re-running `run.py` RESUMES from the existing `outputs/<slug>/` (runtime_state.json
> + steps/).** That's a feature for continuing an interrupted run, but it means a plain
> re-run will reuse stale predictions and only redo the final evals. To re-run a skill
> **cleanly** after changing the harness, questions, or rubrics, delete its output dir
> first (`rm -rf skillopt/outputs/<slug_underscored>`) — or use `run_batch.py --force`,
> which wipes it for you.

### Many skills at once — `run_batch.py`

```bash
# whole category, 3 skills in parallel, calibrate train+val, fresh (wipes each output dir)
$VENV skillopt/run_batch.py --category ads --jobs 3 --force --calibrate

# explicit list; calibrate val only to save time (NOT recommended — see the train/val note)
$VENV skillopt/run_batch.py --skills brand-research,competitor-ad-intelligence \
      --jobs 2 --force --calibrate --cal-splits val
```

Per skill it runs: generate (if missing) → calibrate (`--cal-splits`, default `train,val`)
→ optional discriminate → optimize → report. It is **resumable** (skips skills whose
`best_skill.md` exists unless `--force`), **continue-on-error** (one skill failing never
aborts the batch), and writes a machine summary to `outputs/_batch_<selector>.json`.
`--force` **wipes each skill's output dir** so the whole optimization is redone fresh.

### The three sources of questions

| Source | What | When to use |
|---|---|---|
| **Real user feedback** ⭐ | [`CAPTURE_FAILURE.md`](CAPTURE_FAILURE.md) — turn an actual bad skill output into a question + rubric | **best** — real, unbiased, hard by definition |
| Agent-generated | `generate_questions.py` — from the contract only | breadth / cold-start when you have no real data yet |
| Hand-written | `make_dataset.py` — reference scenarios | examples / debugging the harness |

## ⭐ Building the test set from real user feedback (the best source)

This is the highest-value way to make questions, and it fixes the two weaknesses
of the other sources (they're written by us, so they can be biased and too easy).

When a skill produces a **bad answer in real use**, capture it:

1. Open [`CAPTURE_FAILURE.md`](CAPTURE_FAILURE.md) and paste in three things: the
   **input** the skill received, its **bad output**, and **what was wrong** (or let
   the agent decide).
2. The agent extracts the input (secrets/PII stripped) and writes a **rubric**
   answer-key that marks the exact mistake as `CRITICAL:`.
3. It returns a ready `items.json` entry and tells you which split to add it to:
   - add to **`test/`** → a permanent regression guard (never regress on this again)
   - add 1–2 similar cases to **`train/`** → so the tutor *learns to fix* this class
     of failure (not just memorize this one case)
4. Re-run `run.py` + `report.py` — the UI shows whether the skill now handles it.

This closes the loop: **production failures → tests → an improved skill → fewer
failures.** Over time your `test/` pile becomes a real-world-grounded benchmark
that no synthetic generator can match.

### Hand-written reference scenarios
`$VENV skillopt/make_dataset.py` — the meta-ads seed scenarios, for reference/debugging.

---

## Making the test actually GOOD (the part that matters most)

A score of 1.0 usually means the **test is too easy**, not that the skill is
perfect — if a 2-line junk skill also scores 1.0, the test measures nothing.
Two tools keep the test honest:

```bash
# DIAGNOSE: run each question with the full skill vs a junk seed. A good test
# makes the full skill PASS and junk FAIL ("DISCRIMINATES"). "TOO EASY" = junk
# also passes → the rubric is too lenient.
$VENV skillopt/discriminate.py --skill <slug> --split val

# FIX: strengthen rubrics until a shallow answer fails them — do this on BOTH splits.
$VENV skillopt/calibrate_rubrics.py --skill <slug> --split train
$VENV skillopt/calibrate_rubrics.py --skill <slug> --split val
```

**The rubric is the answer-key, and it's the real lever.** The judge only scores
against the rubric — a weak rubric ⇒ everything passes ⇒ all 1.0s. `calibrate_rubrics.py`
generates a shallow answer, and if the rubric passes it, has an LLM add `CRITICAL:`
items until it fails — so the test discriminates by construction.

> 🔑 **Calibrate `train` AND `val` — not just `val`.** This is the single most common
> way to get a useless run. The two splits do different jobs:
> - **train** feeds the **tutor**: it reads the questions the seed skill *fails* and
>   edits the skill to fix them. If train is too easy (seed passes everything,
>   `rollout_hard=1.0`), the tutor has **no failure signal** → its edits are unguided,
>   fix one val question while breaking another, net zero → the gate **rejects** them →
>   **no improvement, ever.**
> - **val** feeds the **examiner/gate**: it decides whether an edit is kept. If val is
>   too easy the gate can't tell a better skill from the seed.
>
> Calibrating val-only (e.g. `--cal-splits val`) makes the gate honest but leaves the
> tutor blind. You need both hard. `run_batch.py` calibrates both by default.

### Folding a human's desired answer into the rubric
Sometimes you know what the output *should* contain. Encode it as a CRITICAL
requirement two ways:
- add an `"expect": "<what the answer must contain>"` field to an item in `items.json`, or
- one-off: `$VENV skillopt/calibrate_rubrics.py --skill <slug> --item <id> --expect "must give a concrete daily budget to exit Learning"`

Recommended cadence: **generate → calibrate_rubrics (train + val) → discriminate** (until
questions say DISCRIMINATES) **→ run**. Skipping calibration is why scores collapse to 1.0;
skipping it on *train* is why a run shows no improvement.

---

## Judging output files (text + images, soon video)

A skill's real output is often a **file**, not just the chat reply. The target runs
in a persistent per-item `workspace/`, every file it writes is captured, and the
judge reads them:
- **text/csv/json/md** → inlined into the judge prompt
- **images** → the judge opens them with its **vision** (`--add-dir` + the Read tool)
- **binary/video** → noted by name for now (video frame-extraction is the next step)

This means the judge grades the actual deliverable. Two implementation details that
are easy to get wrong (both are handled in `adapter.py`):

- **The target runs with `--permission-mode bypassPermissions`** — otherwise `Write`
  is disabled and file-producing skills score 0. **But bypassPermissions also lets a
  skill write anywhere on disk** (a real `extract-source-sample` run overwrote files in
  a sibling repo). That is why writes are confined by the **sandbox write-jail** below —
  the two go together; never enable one without the other.
- **The judge prompt is delivered via STDIN, not as an argv positional.** When
  `--add-dir`/`--permission-mode` are present, the CLI does not recognize a trailing
  positional prompt → it falls back to reading stdin and (since stdin is inherited)
  blocks forever, which looks like a judge "timeout". Passing the prompt on stdin fixes
  it and also avoids argv-length limits on the large judge prompt.

---

## Sandbox — the target/judge can't write outside the workspace

The target and judge run with `bypassPermissions` (so they never block on a prompt
headlessly). That bypasses **Claude's** permission layer, so a skill that names an
absolute path to a real repo *would* write to it. To stop that, every `claude`
invocation is wrapped (macOS) in **`sandbox-exec` with a write-jail**:

- **deny** all file writes under `PROTECT_ROOT` (default: the directory holding your
  sibling repos, derived from the checkout — typically `~/projects`),
- **re-allow** writes only under the per-run `workspace/` (and temp + `~/.claude`),
- reads and network are untouched (web-fetch skills still work).

Knobs (env vars):
- `SKILLOPT_PROTECT_ROOT=<dir>` — override the protected root.
- `SKILLOPT_NO_SANDBOX=1` — disable the jail (**not recommended**; only off macOS or for
  debugging). Off macOS / without `sandbox-exec` the wrap is a no-op, so on those
  platforms run only skills you trust to stay in their workspace.

Verify it's working: a skill that tries an absolute write outside the workspace should
get `Operation not permitted`, and `git -C <sibling repo> status` should stay clean
after a run.

---

## How it maps to SkillOpt

| SkillOpt concept | Here |
|---|---|
| dataset (train/val/test) | `data/<slug>/` — agent-generated and/or real capture |
| rollout (run target) | `adapter.rollout` → Claude CLI, skill as the system prompt |
| reward 0–1 | LLM judge vs the rubric → `hard` (pass/fail) + `soft` (0–1) |
| reflect (propose edits) | `skillopt.gradient.reflect.run_minibatch_reflect` |
| gate (accept if val ↑) | SkillOpt's validation gate (`gate_metric: soft`) |
| `best_skill.md` | `outputs/<slug>/best_skill.md` |

---

## Known issues / caveats (read this)

- **`skillopt 0.1.0` ships no prompt files** — `fetch_prompts.py` (run by setup) downloads them. If reflect errors with `Prompt '…' not found`, re-run it.
- **`router.set_backend("claude")` is broken upstream** — `run.py` sets the backend global directly. Don't "fix" it back to the official call.
- **Descriptions can leak the method.** The contract excludes the skill body, but a skill's *description* may name its approach (meta-ads' does). The generator is told to ignore method hints; for full blindness, **write method-neutral descriptions**.
- **A strong base model hides skill gains.** All roles default to `claude-opus-4-8` (override per role via `GEN_MODEL` / `OPTIMIZER_MODEL` / `TARGET_MODEL` / `JUDGE_MODEL`). A capable base model is good enough that a 2-line skill can already pass easy questions → optimization shows no gain. The test must be **hard and discriminating** (a weak skill fails, a strong one passes) or the gate has nothing to improve. This is why question quality matters more than anything.
- **Split sizes are derived from the data, not hardcoded.** `generate_questions.py` defaults to **6 train / 3 val / 3 test**, and `run.py` reads the actual counts from `data/<slug>/` to set `train_size`/`sel_env_num`/`test_env_num` (an earlier hardcoded `train_size=3` caused a `train_size != split-size` crash). Change the pile sizes by regenerating with different `--n-*`, not by editing the cfg.
- **Cost/time:** every stage is real Claude calls, and calibration adds a junk-target+judge pass per item per split. With the sandbox + tool-using target, a single skill can take 10–30+ min. Use `run_batch.py --jobs N` to parallelize across skills; scale depth via `run.py` cfg (`steps_per_epoch`, `num_epochs`).

---

## What's NOT done yet (gaps)

- **`adapter.py` is named `meta_ads_analyzer`** but is generic (items just need `prompt`/`csv`/`rubric`). Not yet renamed to a neutral `generic` env.
- **Generated input data is always called `csv`** — fine for tabular skills; a non-tabular skill would want a different input field. (`dataloader._normalize_item` also drops any `expect` field on load — harmless, since `calibrate_rubrics` folds `expect` into the rubric, which *is* preserved.)
- **No author guideline** enforcing method-neutral descriptions (the last leakage vector).
- **Sandbox is macOS-only** (`sandbox-exec`). On Linux/CI the write-jail is a no-op — add an equivalent (bubblewrap/container) before running untrusted skills there.
- **Video artifacts** are noted by name only; frame-extraction for the judge is the next step.
- **SkillOpt's optional WebUI dashboard** isn't wired; `report.py` is our own local UI instead.

### Status (what HAS run)
- 17 ads-category skills have been exercised end-to-end (agent-generated questions).
- A real accepted improvement has been demonstrated (e.g. `brand-research`, val 0.47→0.70 with train+val calibration) — earlier `delta=0` runs were the too-easy-questions / val-only-calibration traps, now documented above.
- Trustworthy numbers still require **train+val calibration** and a **clean** (`--force`) re-run; pre-fix/val-only/resumed results in `outputs/` should be regenerated.
