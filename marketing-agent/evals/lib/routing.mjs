// Routing eval: give a model only the skill descriptions and one marketer ask;
// score whether it picks the playbook we expect.
import fs from 'node:fs';
import path from 'node:path';
import { ask, parseJsonLoose, pool } from './claude.mjs';
import { EVALS_DIR, listSkills, readJsonl, today } from './files.mjs';

const SYSTEM = fs.readFileSync(path.join(EVALS_DIR, 'prompts', 'routing.md'), 'utf8');

export async function runRouting({ model = 'haiku', limit, ids, concurrency = 4, outRoot }) {
  const skills = listSkills();
  const names = new Set(skills.map((s) => s.name));
  let cases = readJsonl(path.join(EVALS_DIR, 'routing', 'cases.jsonl'));
  if (ids?.length) cases = cases.filter((c) => ids.includes(c.id));
  if (limit) cases = cases.slice(0, limit);

  const catalogue = skills.map((s) => `- ${s.name}: ${s.description}`).join('\n');
  const outDir = path.join(outRoot ?? path.join(EVALS_DIR, 'results', today()), 'routing', model);
  fs.mkdirSync(outDir, { recursive: true });
  console.log(`Routing eval: ${cases.length} cases, ${skills.length} skills, model ${model} → ${path.relative(process.cwd(), outDir)}`);

  let cost = 0;
  const rows = await pool(cases, concurrency, async (c) => {
    const prompt = `Skills you can load:\n${catalogue}\n- none: no listed skill fits this ask.\n\nThe marketer says: "${c.ask}"\n\nWhich ONE skill do you load? Reply with JSON only: {"skill": "<exact skill name or none>", "why": "<one short line>"}`;
    let pick = 'ERROR';
    let why = '';
    try {
      const r = await ask({ model, system: SYSTEM, prompt, timeoutMs: 3 * 60_000 });
      cost += r.costUsd;
      const j = parseJsonLoose(r.text);
      pick = String(j.skill ?? '').trim();
      why = String(j.why ?? '').trim();
    } catch (e) {
      why = String(e.message).slice(0, 200);
    }
    const acceptable = [c.expected_playbook, ...(c.acceptable_alternatives ?? [])];
    const row = {
      id: c.id, ask: c.ask, kind: c.kind, expected: c.expected_playbook,
      acceptable: c.acceptable_alternatives ?? [], pick, why,
      exact: pick === c.expected_playbook,
      ok: acceptable.includes(pick),
      unknown_skill: pick !== 'none' && pick !== 'ERROR' && !names.has(pick),
    };
    console.log(`${row.ok ? (row.exact ? 'PASS ' : 'ALT  ') : 'FAIL '} ${c.id} ${JSON.stringify(c.ask).slice(0, 60).padEnd(60)} → ${pick}${row.ok ? '' : ` (want ${c.expected_playbook})`}`);
    return row;
  });

  fs.writeFileSync(path.join(outDir, 'results.jsonl'), rows.map((r) => JSON.stringify(r)).join('\n') + '\n');
  const summary = summarise(rows, model, cost);
  fs.writeFileSync(path.join(outDir, 'summary.md'), summary);
  console.log('\n' + summary);
  return { rows, cost, outDir };
}

function pct(n, d) { return d ? `${Math.round((100 * n) / d)}%` : '–'; }

function summarise(rows, model, cost) {
  const n = rows.length;
  const exact = rows.filter((r) => r.exact).length;
  const ok = rows.filter((r) => r.ok).length;
  const kinds = [...new Set(rows.map((r) => r.kind))];
  let md = `# Routing eval — ${model} — ${today()}\n\n`;
  md += `- **Accuracy (expected or an acceptable alternative): ${ok}/${n} (${pct(ok, n)})**\n`;
  md += `- Exact (the expected playbook only): ${exact}/${n} (${pct(exact, n)})\n`;
  md += `- Cost: about $${cost.toFixed(3)} (as reported by the CLI)\n\n`;
  md += `| Kind | Cases | Accuracy |\n|---|---|---|\n`;
  for (const k of kinds) {
    const rs = rows.filter((r) => r.kind === k);
    md += `| ${k} | ${rs.length} | ${pct(rs.filter((r) => r.ok).length, rs.length)} |\n`;
  }
  const misses = rows.filter((r) => !r.ok);
  md += `\n## Misses (${misses.length})\n\n`;
  if (!misses.length) md += 'None.\n';
  else {
    md += `| Id | Ask | Expected | Picked | Model's reason |\n|---|---|---|---|---|\n`;
    for (const r of misses) md += `| ${r.id} | ${r.ask} | ${r.expected}${r.acceptable.length ? ` (or ${r.acceptable.join(', ')})` : ''} | ${r.pick} | ${r.why.replace(/\|/g, '/')} |\n`;
  }
  return md;
}
