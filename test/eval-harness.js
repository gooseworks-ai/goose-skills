#!/usr/bin/env node
'use strict';

/**
 * Local skill-eval harness (Phase 1).
 *
 * Runs a skill against its colocated eval.json by injecting the local SKILL.md
 * straight into Claude (no platform / API search), capturing everything it
 * produces into a normalized manifest, gating with deterministic assertions,
 * then scoring with an LLM judge. A human label is added later via the HTML
 * report (test/report.js).
 *
 * Usage:
 *   node test/eval-harness.js --skill meta-ads-analyzer
 *   node test/eval-harness.js --skill meta-ads-analyzer --case csv-fixture-happy-path
 *   node test/eval-harness.js --eval skills/composites/meta-ads-analyzer/eval/eval.json
 *   node test/eval-harness.js --skill meta-ads-analyzer --no-judge
 *   node test/eval-harness.js --skill meta-ads-analyzer --dry-run
 *   node test/eval-harness.js --skill meta-ads-analyzer --include-skipped   # run skip:true cases too
 *
 * Output (gitignored): .eval-runs/<skill>/<runId>/<case>/
 *   input.json  trace.jsonl  manifest.json  assertions.json  judgment.json  result.json
 *   workspace/  (the cwd the skill ran in — fixtures + everything it wrote)
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const { parseTrace, buildManifest, runAssertions } = require('./lib/manifest');
const { resolveDependencies } = require('./lib/deps');
const { judgeCase } = require('./lib/judge');

const ROOT = path.resolve(__dirname, '..');
const RUNS_DIR = path.join(ROOT, '.eval-runs');
const SKILLS_DIR = path.join(ROOT, 'skills');

// ── args ─────────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
function getArg(name) {
  const eq = args.find((a) => a.startsWith(`--${name}=`));
  if (eq) return eq.split('=')[1];
  const idx = args.indexOf(`--${name}`);
  if (idx !== -1 && args[idx + 1] && !args[idx + 1].startsWith('--')) return args[idx + 1];
  return null;
}
const skillArg = getArg('skill');
const evalArg = getArg('eval');
const caseFilter = getArg('case');
const budget = getArg('budget') || '1.50';
const noJudge = args.includes('--no-judge');
const dryRun = args.includes('--dry-run');
const includeSkipped = args.includes('--include-skipped');

const log = (m) => console.log(m);

// ── locate eval.json ─────────────────────────────────────────────────────────

function findEvalForSkill(slug) {
  const found = [];
  (function walk(dir) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      if (e.name === 'node_modules' || e.name.startsWith('.')) continue;
      const full = path.join(dir, e.name);
      if (e.isDirectory()) walk(full);
      else if (e.name === 'eval.json' && path.basename(path.dirname(full)) === 'eval') found.push(full);
    }
  })(SKILLS_DIR);
  return found.find((f) => {
    try {
      return JSON.parse(fs.readFileSync(f, 'utf8')).skill === slug;
    } catch {
      return false;
    }
  });
}

const evalPath = evalArg
  ? path.resolve(process.cwd(), evalArg)
  : skillArg
    ? findEvalForSkill(skillArg)
    : null;

if (!evalPath || !fs.existsSync(evalPath)) {
  console.error('Could not find eval.json. Pass --skill <slug> or --eval <path>.');
  process.exit(1);
}

const evalSpec = JSON.parse(fs.readFileSync(evalPath, 'utf8'));
const evalDir = path.dirname(evalPath);
const skillMdPath = path.join(evalDir, '..', 'SKILL.md');
if (!fs.existsSync(skillMdPath)) {
  console.error(`SKILL.md not found next to eval dir: ${skillMdPath}`);
  process.exit(1);
}
const skillBody = fs.readFileSync(skillMdPath, 'utf8');
const skill = evalSpec.skill;

// ── claude runner ────────────────────────────────────────────────────────────

function runClaudeSync({ prompt, cwd = process.cwd(), extraArgs = [], timeoutMs = 5 * 60 * 1000 }) {
  const cliArgs = ['--print', '--no-session-persistence', ...extraArgs, prompt];
  const res = spawnSync('claude', cliArgs, {
    cwd,
    encoding: 'utf8',
    timeout: timeoutMs,
    maxBuffer: 64 * 1024 * 1024,
    env: { ...process.env },
  });
  return { stdout: res.stdout || '', stderr: res.stderr || '', code: res.status };
}

// spawnClaude adapter passed to deps/judge (they only need {stdout}).
const spawnClaude = (opts) => runClaudeSync(opts);

// ── run prompt ───────────────────────────────────────────────────────────────

function buildRunPrompt(caseObj, fixtureNames) {
  return `You have ONE skill loaded below. Follow its instructions exactly to complete the task. \
Do not search for or use any other skill. Do not ask clarifying questions — use reasonable defaults.

Your current working directory contains any input files referenced in the task. \
Write your final report and any other output files INTO the current working directory \
(e.g. ./report.md) so they can be collected.

<skill name="${skill}">
${skillBody}
</skill>

Files available in your working directory: ${fixtureNames.length ? fixtureNames.join(', ') : '(none)'}

Task: ${caseObj.prompt}`;
}

// ── per-case execution ───────────────────────────────────────────────────────

function makeRunId() {
  const n = new Date();
  const p = (x) => String(x).padStart(2, '0');
  return `${n.getFullYear()}-${p(n.getMonth() + 1)}-${p(n.getDate())}-${p(n.getHours())}${p(n.getMinutes())}${p(n.getSeconds())}`;
}

function runCase(caseObj, runDir) {
  const caseDir = path.join(runDir, caseObj.name);
  const workspace = path.join(caseDir, 'workspace');
  fs.mkdirSync(workspace, { recursive: true });

  // Seed fixtures into the workspace.
  const fixtureNames = [];
  for (const rel of caseObj.fixtures || []) {
    const src = path.resolve(evalDir, rel);
    const base = path.basename(rel);
    fs.copyFileSync(src, path.join(workspace, base));
    fixtureNames.push(base);
  }

  // Resolve dependencies (incl. MCP auto-resolve via subagent).
  const dep = resolveDependencies(evalSpec, caseObj, { spawnClaude, log });
  if (!dep.ok) {
    log(`  [SKIP] ${caseObj.name} — ${dep.reason}`);
    const result = { case: caseObj.name, status: 'SKIPPED', reason: dep.reason, satisfied: dep.satisfied };
    fs.writeFileSync(path.join(caseDir, 'result.json'), JSON.stringify(result, null, 2) + '\n');
    return result;
  }

  const prompt = buildRunPrompt(caseObj, fixtureNames);
  fs.writeFileSync(path.join(caseDir, 'input.json'), JSON.stringify({
    skill, case: caseObj.name, taskPrompt: caseObj.prompt, fixtures: fixtureNames, dependencies: dep.satisfied,
  }, null, 2) + '\n');

  // Run the skill.
  log(`  [RUN]  ${caseObj.name} …`);
  const t0 = Date.now();
  const { stdout, stderr, code } = runClaudeSync({
    prompt,
    cwd: workspace,
    extraArgs: ['--verbose', '--output-format', 'stream-json', '--permission-mode', 'bypassPermissions', '--max-budget-usd', budget],
  });
  const elapsed = ((Date.now() - t0) / 1000).toFixed(1);

  // Persist raw trace.
  const events = [];
  for (const line of stdout.split('\n')) {
    const t = line.trim();
    if (!t) continue;
    try { events.push(JSON.parse(t)); } catch { /* skip non-json */ }
  }
  fs.writeFileSync(path.join(caseDir, 'trace.jsonl'), events.map((e) => JSON.stringify(e)).join('\n') + '\n');
  if (stderr.trim()) fs.writeFileSync(path.join(caseDir, 'stderr.txt'), stderr);

  // Build manifest + assertions.
  const trace = parseTrace(events);
  const manifest = buildManifest({ trace, workspace, fixtures: fixtureNames, skill, caseName: caseObj.name });
  manifest.elapsedSeconds = parseFloat(elapsed);
  manifest.exitCode = code;
  fs.writeFileSync(path.join(caseDir, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');

  const assertions = runAssertions(manifest, caseObj.assertions);
  fs.writeFileSync(path.join(caseDir, 'assertions.json'), JSON.stringify(assertions, null, 2) + '\n');

  // Safety guard: read-only skill must not have mutated anything.
  const safetyViolation = evalSpec.safety?.readOnly && manifest.side_effects.length > 0;

  // LLM judge.
  let judgment = { verdict: 'skipped', score: null, reasoning: 'judge disabled' };
  if (!noJudge) {
    judgment = judgeCase({ skill, prompt: caseObj.prompt, rubric: caseObj.rubric, manifest, spawnClaude, log });
  }
  fs.writeFileSync(path.join(caseDir, 'judgment.json'), JSON.stringify(judgment, null, 2) + '\n');

  // Overall status: assertions must pass AND no safety violation AND judge not failing.
  let status = 'PASS';
  if (events.length === 0) status = 'ERROR';
  else if (safetyViolation) status = 'FAIL';
  else if (!assertions.allPassed) status = 'FAIL';
  else if (!noJudge && judgment.verdict === 'fail') status = 'FAIL';
  else if (!noJudge && (judgment.verdict === 'error')) status = 'PARTIAL';

  const result = {
    case: caseObj.name,
    status,
    elapsedSeconds: parseFloat(elapsed),
    costUsd: manifest.cost_usd,
    assertions: { passed: assertions.passed, total: assertions.total },
    safetyViolation,
    judge: { verdict: judgment.verdict, score: judgment.score },
    artifacts: manifest.artifacts.map((a) => ({ type: a.type, label: a.label })),
  };
  fs.writeFileSync(path.join(caseDir, 'result.json'), JSON.stringify(result, null, 2) + '\n');

  const color = status === 'PASS' ? '\x1b[32m' : status === 'FAIL' ? '\x1b[31m' : '\x1b[33m';
  log(`  [${color}${status}\x1b[0m] ${caseObj.name} — ${elapsed}s, assertions ${assertions.passed}/${assertions.total}, judge ${judgment.verdict}${judgment.score != null ? ` (${judgment.score}/5)` : ''}`);
  return result;
}

// ── main ─────────────────────────────────────────────────────────────────────

let cases = evalSpec.cases || [];
if (caseFilter) cases = cases.filter((c) => c.name === caseFilter);
const runnable = cases.filter((c) => includeSkipped || !c.skip || c.name === caseFilter);

if (dryRun) {
  console.log(`\nDry run — skill "${skill}" (${evalPath})`);
  for (const c of cases) {
    const skipNote = c.skip && !includeSkipped && c.name !== caseFilter ? `  [skipped: ${c.skipReason || 'skip:true'}]` : '';
    console.log(`  - ${c.name}${skipNote}`);
    console.log(`      task: ${c.prompt.slice(0, 100)}`);
    console.log(`      fixtures: ${(c.fixtures || []).join(', ') || '(none)'} | assertions: ${(c.assertions || []).length} | rubric: ${c.rubric ? 'yes' : 'no'}`);
  }
  process.exit(0);
}

if (runnable.length === 0) {
  console.error('No runnable cases (all skipped? pass --include-skipped or --case <name>).');
  process.exit(1);
}

const runId = makeRunId();
const runDir = path.join(RUNS_DIR, skill, runId);
fs.mkdirSync(runDir, { recursive: true });

console.log(`\nSkill Eval — ${skill} (run ${runId})`);
console.log(`Cases: ${runnable.length} | Judge: ${noJudge ? 'off' : 'on'} | Budget: $${budget}/run\n`);

const results = [];
for (const c of runnable) results.push(runCase(c, runDir));

const summary = {
  skill,
  runId,
  evaluatedAt: new Date().toISOString(),
  total: results.length,
  pass: results.filter((r) => r.status === 'PASS').length,
  fail: results.filter((r) => r.status === 'FAIL').length,
  partial: results.filter((r) => r.status === 'PARTIAL').length,
  skipped: results.filter((r) => r.status === 'SKIPPED').length,
  error: results.filter((r) => r.status === 'ERROR').length,
  results,
};
fs.writeFileSync(path.join(runDir, '_summary.json'), JSON.stringify(summary, null, 2) + '\n');

console.log(`\nDone — ${summary.pass} PASS, ${summary.fail} FAIL, ${summary.partial} PARTIAL, ${summary.skipped} SKIPPED, ${summary.error} ERROR`);
console.log(`Run dir: ${path.relative(ROOT, runDir)}`);
console.log(`\nView report:  node test/report.js ${path.relative(ROOT, runDir)} --open`);

process.exit(summary.fail + summary.error > 0 ? 1 : 0);
