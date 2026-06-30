# Turn a real failure into a new question

When a skill produces a bad answer in real use, capture it as a new eval/training
question so (a) the optimizer can learn to fix it and (b) you never regress on it
again. Paste the prompt below into Claude Code (or hand it to an agent).

## Where to add the result

- Add to **`test/`** → a regression guard: the run will always re-check this case.
- Add to **`train/`** → the optimizer (tutor) learns to fix this kind of failure.
- Best practice: add the real failing case to **test**, and add 1–2 *similar* cases
  to **train** so the fix generalizes instead of memorizing this one.

Files live at `skillopt/data/<skill>/{train,val,test}/items.json` (a JSON array).

## The prompt (fill in the blanks, paste to an agent)

```
You are turning a REAL failing run of the "<SKILL-NAME>" skill into an eval question.

CONTEXT TO READ FIRST:
- The skill definition: skills/.../<SKILL-NAME>/SKILL.md
  (read its "When to Use" and its input/intake section so the question is realistic)

THE FAILING RUN:
- Input the skill received (the user's request + any data/CSV/context):
  <paste it here, OR point to the session/transcript>
- The skill's actual output:
  <paste the output here>
- What was wrong with it:
  <describe the problem — or write "you decide what's wrong" and let the agent judge>

DO THIS:
1. EXTRACT the input the skill received, verbatim and self-contained (user task +
   any data). Remove secrets/PII/account ids — replace with realistic fakes.
2. WRITE A RUBRIC = an answer-key listing what a CORRECT answer MUST contain.
   Mark the specific thing this run got wrong as "CRITICAL: ..." so the judge
   will fail any answer that repeats the mistake.
3. EMIT one JSON item in this exact shape (matching skillopt/data/<skill>/ files):
   {
     "id": "real-<short-slug>",
     "task_type": "<category>",
     "prompt": "<the user task text>",
     "csv": "<the data, if any — else omit>",
     "rubric": "CRITICAL: <the thing it got wrong>. <other must-haves>."
   }
4. RECOMMEND which split to append it to (test = regression guard, train = learn
   to fix), in one line.

OUTPUT ONLY: the JSON item, then the one-line split recommendation. Nothing else.
```

## After you get the JSON

Append it to the array in the right split file, e.g.:
`skillopt/data/meta_ads_analyzer/test/items.json`, then re-run:

```bash
./skillopt-venv/bin/python skillopt/run.py
./skillopt-venv/bin/python skillopt/report.py skillopt/outputs/meta_ads_poc --open
```

The UI will now show this case; if the skill still fails it, you'll see it score
low — and after optimization, whether the tutor's edit fixed it.
