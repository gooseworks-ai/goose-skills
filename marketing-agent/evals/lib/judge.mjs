// Judge: an LLM (Opus by default) scores each rubric criterion pass/fail with one
// line of evidence, per arm. Then a side-by-side summary per playbook.
import fs from 'node:fs';
import path from 'node:path';
import { ask, parseJsonLoose } from './claude.mjs';
import { EVALS_DIR, loadRubric, loadScenario, today } from './files.mjs';

const JUDGE_SYSTEM = fs.readFileSync(path.join(EVALS_DIR, 'prompts', 'judge.md'), 'utf8');
const TEXT_EXT = /\.(md|markdown|txt|csv|html?|json|ya?ml)$/i;
const MAX_FILE_CHARS = 80_000;
const MAX_FILES_CHARS = 200_000;
const MAX_TRANSCRIPT_CHARS = 250_000;

function readFiles(armDir) {
  const root = path.join(armDir, 'files');
  if (!fs.existsSync(root)) return { text: '(the agent wrote no files)', list: [] };
  const list = [];
  const walk = (d) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) walk(p); else list.push(path.relative(root, p));
    }
  };
  walk(root);
  let total = 0;
  let text = '';
  for (const rel of list) {
    if (!TEXT_EXT.test(rel)) { text += `\n=== FILE: ${rel} (binary, not shown) ===\n`; continue; }
    let body = fs.readFileSync(path.join(root, rel), 'utf8');
    if (body.length > MAX_FILE_CHARS) body = body.slice(0, MAX_FILE_CHARS) + `\n…[file cut at ${MAX_FILE_CHARS} chars]`;
    if (total + body.length > MAX_FILES_CHARS) { text += `\n=== FILE: ${rel} (left out: size budget) ===\n`; continue; }
    total += body.length;
    text += `\n=== FILE: ${rel} ===\n${body}\n`;
  }
  return { text: text || '(the agent wrote no files)', list };
}

function readTranscript(armDir) {
  let t = fs.readFileSync(path.join(armDir, 'transcript.md'), 'utf8');
  t = t.replace(/^# .*\n/, ''); // drop the "slug — mode" title so the judge is not told which arm it is
  if (t.length > MAX_TRANSCRIPT_CHARS) {
    // Keep every marketer message and agent message; clip tool traffic harder.
    t = t.replace(/^(\s*(?:\[sub-agent\] )?[←→] .{0,160}).*$/gm, '$1…');
    if (t.length > MAX_TRANSCRIPT_CHARS) t = t.slice(0, MAX_TRANSCRIPT_CHARS / 2) + '\n…[middle of transcript cut]…\n' + t.slice(-MAX_TRANSCRIPT_CHARS / 2);
  }
  return t;
}

export async function judgeArm({ slug, armDir, model = 'opus' }) {
  const rubric = loadRubric(slug);
  const scenario = loadScenario(slug);
  const files = readFiles(armDir);
  const transcript = readTranscript(armDir);
  const criteria = rubric.criteria.map((c) => `- ${c.id} [${c.tier}] ${c.text}`).join('\n');
  const prompt = `# The scenario (what the marketer wanted, and who they are)\n\n${scenario.text}\n\n# The rubric\n\n${rubric.text}\n\n# Criteria to score (score every one)\n\n${criteria}\n\n# The conversation transcript\n\n${transcript}\n\n# Files the agent wrote in the marketer's folder\n\nFile list: ${files.list.join(', ') || 'none'}\n${files.text}\n\n# Your answer\n\nJSON only:\n{"criteria": [{"id": "M1", "verdict": "pass" | "fail", "evidence": "<one line: a short quote or a concrete pointer, max 200 chars>"}, ...], "overall": "<two sentences: would a senior marketer use this output, and the single biggest gap>"}`;
  console.log(`  [${slug}] judging ${path.basename(armDir)} with ${model} (${Math.round(prompt.length / 1000)}k chars)…`);
  const r = await ask({ model, system: JUDGE_SYSTEM, prompt, timeoutMs: 15 * 60_000 });
  const j = parseJsonLoose(r.text);
  const byId = new Map((j.criteria ?? []).map((c) => [c.id, c]));
  const scored = rubric.criteria.map((c) => {
    const v = byId.get(c.id);
    return { ...c, verdict: v ? String(v.verdict).toLowerCase() : 'missing', evidence: v?.evidence ?? '' };
  });
  const out = {
    slug, arm: path.basename(armDir), judge_model: model, judge_cost_usd: r.costUsd,
    must_pass: scored.filter((c) => c.tier === 'must').every((c) => c.verdict === 'pass'),
    counts: count(scored), overall: j.overall ?? '', criteria: scored,
  };
  fs.writeFileSync(path.join(armDir, 'judge.json'), JSON.stringify(out, null, 2));
  console.log(`  [${slug}] ${out.arm}: must ${out.counts.must.pass}/${out.counts.must.total}, should ${out.counts.should.pass}/${out.counts.should.total}${out.counts.expert.total ? `, expert ${out.counts.expert.pass}/${out.counts.expert.total}` : ''} — ${out.must_pass ? 'PASS' : 'FAIL'}`);
  return out;
}

function count(scored) {
  const o = {};
  for (const tier of ['must', 'should', 'expert']) {
    const rs = scored.filter((c) => c.tier === tier);
    o[tier] = { pass: rs.filter((c) => c.verdict === 'pass').length, total: rs.length };
  }
  return o;
}

function readJson(f) { return fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : null; }

const mark = (v) => (v === 'pass' ? 'pass' : v === 'fail' ? '**FAIL**' : v ? `— ${v}` : '—');
const cell = (s) => String(s ?? '').replace(/\|/g, '/').replace(/\n/g, ' ');

/** results.json + summary.md for one playbook, from whatever arms exist. */
export function writePlaybookSummary(outDir, slug) {
  const arms = {};
  for (const arm of ['with-skill', 'baseline']) {
    const run = readJson(path.join(outDir, arm, 'run.json'));
    const judge = readJson(path.join(outDir, arm, 'judge.json'));
    if (run || judge) arms[arm] = { run, judge };
  }
  const results = { slug, date: today(), arms };
  fs.writeFileSync(path.join(outDir, 'results.json'), JSON.stringify(results, null, 2));

  const rubric = loadRubric(slug);
  const v = (arm, id) => arms[arm]?.judge?.criteria.find((c) => c.id === id);
  let md = `# ${slug} — eval ${today()}\n\n`;
  md += `| | With skill | Baseline |\n|---|---|---|\n`;
  const line = (label, f) => { md += `| ${label} | ${arms['with-skill'] ? f(arms['with-skill']) : '—'} | ${arms.baseline ? f(arms.baseline) : '—'} |\n`; };
  line('**Verdict (all must-pass)**', (a) => (a.judge ? (a.judge.must_pass ? '**PASS**' : '**FAIL**') : 'not judged'));
  line('Must-pass', (a) => (a.judge ? `${a.judge.counts.must.pass}/${a.judge.counts.must.total}` : '—'));
  line('Should-pass', (a) => (a.judge ? `${a.judge.counts.should.pass}/${a.judge.counts.should.total}` : '—'));
  line('Expert', (a) => (a.judge?.counts.expert.total ? `${a.judge.counts.expert.pass}/${a.judge.counts.expert.total}` : 'none yet'));
  line('Turns / stopped because', (a) => (a.run ? `${a.run.turns} / ${a.run.stopped}` : '—'));
  line('Files written', (a) => (a.run ? (a.run.files.join(', ') || 'none') : '—'));
  line('Minutes', (a) => (a.run ? a.run.minutes : '—'));
  line('Cost (subject + simulator + judge)', (a) => `$${((a.run?.subject_cost_usd ?? 0) + (a.run?.sim_cost_usd ?? 0) + (a.judge?.judge_cost_usd ?? 0)).toFixed(2)}`);
  md += `\n## Criteria\n\n| Id | Tier | Criterion | With skill | Baseline |\n|---|---|---|---|---|\n`;
  for (const c of rubric.criteria) {
    md += `| ${c.id} | ${c.tier} | ${cell(c.text.length > 120 ? c.text.slice(0, 117) + '…' : c.text)} | ${mark(v('with-skill', c.id)?.verdict)} | ${mark(v('baseline', c.id)?.verdict)} |\n`;
  }
  md += `\n## Judge's overall read\n\n`;
  for (const arm of Object.keys(arms)) md += `- **${arm}:** ${cell(arms[arm].judge?.overall || 'not judged')}\n`;
  md += `\n## Evidence\n\n| Id | With skill | Baseline |\n|---|---|---|\n`;
  for (const c of rubric.criteria) md += `| ${c.id} | ${cell(v('with-skill', c.id)?.evidence)} | ${cell(v('baseline', c.id)?.evidence)} |\n`;
  fs.writeFileSync(path.join(outDir, 'summary.md'), md);
  console.log(`  [${slug}] summary → ${path.join(outDir, 'summary.md')}`);
  return results;
}

/** One table across playbooks for a whole-suite run. */
export function writeSuiteSummary(outRoot, slugs) {
  let md = `# Marketing-agent evals — ${path.basename(outRoot)}\n\n| Playbook | With skill (must · should) | Baseline (must · should) | Skill helps? |\n|---|---|---|---|\n`;
  for (const slug of slugs) {
    const r = readJson(path.join(outRoot, slug, 'results.json'));
    const f = (a) => (a?.judge ? `${a.judge.must_pass ? 'PASS' : 'FAIL'} · ${a.judge.counts.must.pass}/${a.judge.counts.must.total} · ${a.judge.counts.should.pass}/${a.judge.counts.should.total}` : '—');
    const w = r?.arms['with-skill']?.judge;
    const b = r?.arms.baseline?.judge;
    const score = (j) => (j ? 2 * j.counts.must.pass + j.counts.should.pass + j.counts.expert.pass : 0);
    const helps = w && b ? (score(w) > score(b) ? 'yes' : score(w) === score(b) ? 'no difference' : '**no — baseline did better**') : '—';
    md += `| [${slug}](${slug}/summary.md) | ${f(r?.arms['with-skill'])} | ${f(r?.arms.baseline)} | ${helps} |\n`;
  }
  const routing = path.join(outRoot, 'routing');
  if (fs.existsSync(routing)) md += `\nRouting: see ${fs.readdirSync(routing).map((m) => `[${m}](routing/${m}/summary.md)`).join(', ')}.\n`;
  fs.writeFileSync(path.join(outRoot, 'summary.md'), md);
  console.log(`\nSuite summary → ${path.join(outRoot, 'summary.md')}`);
}
