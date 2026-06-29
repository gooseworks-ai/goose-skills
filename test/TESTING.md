# Skill Evaluation & Testing

A local-first harness for evaluating skills. A skill isn't a pure function — it's
a non-deterministic agent run with side effects — so "testing" means **running the
skill for real, capturing everything it produces, and grading it** with cheap
deterministic checks + an LLM judge + (optionally) a human label.

Everything runs **locally** through your own `claude` CLI. No backend, no platform
API. The harness injects the skill's local `SKILL.md` straight into Claude.

```
┌── author-time (committed) ──────────┐     ┌── run-time (local only) ──────────┐
│ <skill>/eval/eval.json   ← spec     │     │ .eval-runs/<skill>/<runId>/<case>/ │
│ <skill>/eval/fixtures/   ← inputs   │ ──▶ │   input.json  trace.jsonl          │
│ schemas/eval.schema.json            │     │   workspace/  manifest.json        │
│ test/eval-harness.js  test/judge…   │     │   assertions.json  judgment.json   │
│ test/report.js                      │     │   report.html  (+ exported labels) │
└─────────────────────────────────────┘     └────────────────────────────────────┘
```

## Quick start (POC: meta-ads-analyzer)

```bash
node test/eval-harness.js --skill meta-ads-analyzer --dry-run          # list cases
node test/eval-harness.js --skill meta-ads-analyzer                    # run + judge
node test/report.js .eval-runs/meta-ads-analyzer/<runId> --open        # view input/output
```

Useful flags: `--case <name>` (one case), `--no-judge` (assertions only, fast/cheap),
`--include-skipped` (run `skip:true` cases), `--budget 1.50` (USD per run).

## The four pieces

### 1. Input — `eval.json` `cases[].prompt` + `fixtures[]`
Each case is a starting world: the task prompt plus fixture files copied into the
run **workspace** (the cwd the skill runs in). Locally, "fixtures" are just seed
files — no mocking infra. For meta-ads-analyzer that's a Meta Ads CSV export.

### 2. Output — the normalized **manifest**
However heterogeneous the output (text, table, N files, images, HTML, side
effects), the harness collapses it into one `manifest.json` envelope:
`{ messages, artifacts[], side_effects[], tool_calls[], cost_usd }`. Artifacts are
typed (`text` / `table` / `image` / `html` / `file`) by scanning the workspace +
the final assistant message. One envelope → one renderer.

### 3. UI — `test/report.js`
Generates a self-contained `report.html`: **Input** (prompt + fixtures) on the
left, **Output** (artifact envelope rendered by type) on the right, plus
assertions, the judge verdict, and a 👍/👎 + notes panel with an **Export labels**
button. Human labels calibrate the judge.

### 4. Author-time spec — ships with the skill
A skill ships with `eval/eval.json` the way code ships with tests:
- `ioContract` — declared inputs + expected output shape (drives UI + review).
- `dependencies` — CLI / env / **MCP** the skill needs (see below).
- `cases[]` — prompt, fixtures, `assertions[]`, `rubric`.
- `safety` — `readOnly` / `mutatesExternalState` (guards real-account writes).

See [`schemas/eval.schema.json`](../schemas/eval.schema.json) for the full format and
[`skills/composites/meta-ads-analyzer/eval/eval.json`](../skills/composites/meta-ads-analyzer/eval/eval.json)
for a worked example.

## Grading: assertions → judge → human

1. **Assertions** (deterministic gate) — `artifact_produced`, `no_tool_errors`,
   `no_external_mutations`, `output_contains_all/any`, `tool_called_any`,
   `max_cost_usd`. Cheap, run first.
2. **LLM judge** — scores the rubric 1–5 with a pass/fail verdict and per-criterion
   notes. Catches "plausible-but-wrong" analysis the assertions can't.
3. **Human label** — recorded in the HTML report, exported as `labels.json`. This is
   the dataset that tells you whether the judge itself can be trusted.

A case is `PASS` only if assertions pass, there's no safety violation, and the
judge didn't fail it.

## External MCP dependencies (auto-resolve via subagent)

Some skills need a connected MCP (e.g. meta-ads-analyzer's *live* path needs the
Meta Marketing API). Declare it under `dependencies.mcp`:

```jsonc
"mcp": [{
  "name": "meta-ads",
  "mode": "subagent-auto",          // vs "manual" (skip if missing)
  "neededForCases": ["live-api"],
  "setupPrompt": "Ensure an MCP named 'meta-ads' is connected & authenticated; else reply UNAVAILABLE.",
  "verify": "get_recommendations"
}]
```

Before a case runs, the harness checks `claude mcp list`. If the MCP is missing and
`mode` is `subagent-auto`, it **spawns a setup subagent** (`claude --print` with the
`setupPrompt`) to provision/authenticate it, then re-checks. If still unmet, the
case is **skipped with a reason** — never silently passed. The fixture (CSV) path
needs no MCP, so it's the default; the live case is `skip:true` until the MCP is
configured.

## What's committed vs local-only

| Committed (push) | Local-only (`.gitignore`) |
|---|---|
| `<skill>/eval/eval.json` (the spec) | `.eval-runs/` (all run output) |
| `<skill>/eval/fixtures/*` (sample inputs) | traces, manifests, judgments |
| `test/eval-harness.js`, `test/lib/*`, `test/report.js` | `report.html`, exported `labels.json` |
| `schemas/eval.schema.json`, this doc | |

Rationale: the **spec + fixtures + harness** are the reusable, reviewable contract —
they belong in git so every checkout can run the eval. **Run output** is large,
non-deterministic, and may contain live account data / PII, so it stays local
(`.eval-runs/`). Promote a run to a shareable record by exporting labels or
committing a curated summary deliberately — not by default.

## Authoring an eval for a new skill

1. Create `skills/<…>/<slug>/eval/eval.json` (copy meta-ads-analyzer's, validate
   against the schema).
2. Drop sample inputs in `eval/fixtures/`.
3. Write ≥1 case: a realistic `prompt`, the `fixtures`, a few `assertions`, and a
   `rubric` describing what a domain expert would require.
4. Set `safety.readOnly` correctly. If the skill mutates external state, keep live
   cases `skip:true` until there's a throwaway/sandbox account.
5. `node test/eval-harness.js --skill <slug>` and review the report.
