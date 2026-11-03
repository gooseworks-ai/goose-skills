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

const TRANSCRIPT_BUDGET = 180_000;

function readTurns(armDir) {
  const run = JSON.parse(fs.readFileSync(path.join(armDir, 'run.json'), 'utf8'));
  const dir = path.join(armDir, 'turns');
  const files = fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.endsWith('.jsonl')).sort() : [];
  return files.map((file, i) => {
    const events = [];
    for (const line of fs.readFileSync(path.join(dir, file), 'utf8').split('\n')) {
      if (!line.trim()) continue;
      try { events.push(JSON.parse(line)); } catch { /* partial line from a killed turn */ }
    }
    const log = run.log?.[i] ?? {};
    return { message: log.marketer ?? '', finalText: log.agent_final ?? '', timedOut: !!log.timed_out, events };
  });
}

const clip = (s, n) => { s = String(s ?? ''); return s.length > n ? s.slice(0, n) + ` …[+${s.length - n} chars]` : s; };
const resultText = (c) => (typeof c.content === 'string' ? c.content : Array.isArray(c.content) ? c.content.map((x) => (x.type === 'text' ? x.text : '')).join(' ') : '');
const shortName = (n) => n.replace(/^mcp__[^_]+(?:-[^_]+)*__/, '');

/**
 * A judge-sized transcript. The agent's own messages to the marketer are always kept in full.
 * level 1: main tool calls with short args and short results; each sub-agent collapsed to one line.
 * level 2: tool calls grouped into one count line per burst; no results.
 * level 3: level 2, and long mid-turn agent messages clipped (the final message per turn stays whole).
 */
export function judgeTranscript(turns, level) {
  let md = '';
  turns.forEach((t, i) => {
    md += `\n## Turn ${i + 1}\n\n### MARKETER\n${t.message}\n\n### AGENT (in order)\n`;
    const subs = new Map(); // parent_tool_use_id -> { tools: {}, n }
    for (const e of t.events) {
      if (!e.parent_tool_use_id || e.type !== 'assistant') continue;
      const s = subs.get(e.parent_tool_use_id) ?? { tools: {}, n: 0, reads: [] };
      for (const c of e.message?.content ?? []) {
        if (c.type !== 'tool_use') continue;
        s.n++;
        s.tools[shortName(c.name)] = (s.tools[shortName(c.name)] ?? 0) + 1;
        const what = c.input?.query ?? c.input?.url;
        if (what && s.reads.length < 25) s.reads.push(clip(what, 90));
      }
      subs.set(e.parent_tool_use_id, s);
    }
    let burst = {};
    const flush = () => {
      const k = Object.keys(burst);
      if (k.length) md += `[tool calls: ${k.map((n) => `${n}×${burst[n]}`).join(', ')}]\n`;
      burst = {};
    };
    for (const e of t.events) {
      if (e.parent_tool_use_id) continue; // sub-agent traffic is summarised at its Task call
      if (e.type === 'assistant') {
        for (const c of e.message?.content ?? []) {
          if (c.type === 'text' && c.text.trim()) { flush(); md += `AGENT SAYS: ${level >= 3 ? clip(c.text, 3000) : c.text}\n\n`; }
          if (c.type === 'tool_use') {
            const sub = subs.get(c.id);
            const subNote = sub ? ` [sub-agent made ${sub.n} tool calls: ${Object.entries(sub.tools).map(([n, k]) => `${n}×${k}`).join(', ')}${level === 1 && sub.reads.length ? `; searched/read: ${sub.reads.join(' · ')}` : ''}]` : '';
            if (level === 1) md += `→ ${shortName(c.name)}(${clip(JSON.stringify(c.input), 160)})${subNote}\n`;
            else burst[shortName(c.name)] = (burst[shortName(c.name)] ?? 0) + 1;
          }
        }
      } else if (e.type === 'user' && level === 1) {
        for (const c of Array.isArray(e.message?.content) ? e.message.content : []) {
          if (c.type === 'tool_result') md += `← ${c.is_error ? 'ERROR ' : ''}${clip(resultText(c).replace(/\s+/g, ' '), 220)}\n`;
        }
      }
    }
    flush();
    md += `\n### AGENT FINAL MESSAGE THIS TURN\n${t.finalText || '(none)'}\n`;
    if (t.timedOut) md += '\n(turn stopped: time limit)\n';
  });
  return md;
}

function readTranscript(armDir) {
  const turns = readTurns(armDir);
  for (const level of [1, 2, 3]) {
    const t = judgeTranscript(turns, level);
    if (t.length <= TRANSCRIPT_BUDGET || level === 3) {
      return t.length <= TRANSCRIPT_BUDGET ? t : t.slice(0, TRANSCRIPT_BUDGET / 2) + '\n…[middle of transcript cut]…\n' + t.slice(-TRANSCRIPT_BUDGET / 2);
    }
  }
}

/**
 * Deterministic aid for "traceable / no invented facts" checks. The judge only sees clipped tool
 * results, so we search the FULL raw tool results (main agent and sub-agents) and the marketer's
 * messages for every number the report states, and tell the judge which ones appear nowhere.
 */
export function factCheck(armDir, filesText) {
  const dir = path.join(armDir, 'turns');
  if (!fs.existsSync(dir)) return '';
  let evidence = '';
  for (const file of fs.readdirSync(dir)) {
    for (const line of fs.readFileSync(path.join(dir, file), 'utf8').split('\n')) {
      let e;
      try { e = JSON.parse(line); } catch { continue; }
      if (e.type !== 'user') continue;
      const content = e.message?.content;
      if (typeof content === 'string') { evidence += content + '\n'; continue; }
      for (const c of Array.isArray(content) ? content : []) {
        if (c.type === 'tool_result') evidence += resultText(c) + '\n';
        else if (c.type === 'text') evidence += c.text + '\n';
      }
    }
  }
  const norm = (x) => x.toLowerCase().replace(/[,\s]/g, '');
  const hay = norm(evidence);
  const tokens = new Set();
  const re = /(?:\$|£|€)?\d{1,3}(?:,\d{3})+(?:\.\d+)?\+?|(?:\$|£|€)\d+(?:\.\d+)?\s?(?:[kKmMbB]\b)?|\d+(?:\.\d+)?\s?(?:%|[kKmMbB]\b)|\d{3,}\+?/g;
  for (const m of filesText.matchAll(re)) {
    const t = m[0].trim();
    if (/^(19|20)\d\d$/.test(t)) continue; // years
    tokens.add(t);
    if (tokens.size >= 120) break;
  }
  const found = [];
  const missing = [];
  for (const t of tokens) {
    const core = norm(t).replace(/\+$/, '');
    const alts = [core];
    const km = core.match(/^([$£€]?)(\d+(?:\.\d+)?)([km])$/);
    if (km) alts.push(km[1] + String(Math.round(Number(km[2]) * (km[3] === 'k' ? 1e3 : 1e6))));
    (alts.some((x) => hay.includes(x)) ? found : missing).push(t);
  }
  if (!tokens.size) return '';
  return `Numbers stated in the agent's files: ${tokens.size}. Found somewhere in the full tool results or the marketer's messages: ${found.length}. NOT found anywhere (possibly invented, computed by the agent, or reformatted — check before failing): ${missing.join(' · ') || 'none'}.`;
}

/** Parse "M1 | pass | evidence" lines (falls back to JSON). */
export function parseVerdicts(text) {
  const byId = new Map();
  let overall = '';
  for (const line of text.split('\n')) {
    const m = line.match(/^\s*[-*]?\s*\**([MSE]\d+)\**\s*\|\s*\**(pass|fail)\**\s*\|\s*(.*)$/i);
    if (m) byId.set(m[1].toUpperCase(), { verdict: m[2].toLowerCase(), evidence: m[3].trim() });
    const o = line.match(/^\s*\**OVERALL\**\s*[:|]\s*(.*)$/i);
    if (o) overall = o[1].trim();
  }
  if (!byId.size) {
    try {
      const j = parseJsonLoose(text);
      for (const c of j.criteria ?? []) byId.set(c.id, { verdict: String(c.verdict).toLowerCase(), evidence: c.evidence ?? '' });
      overall = j.overall ?? overall;
    } catch { /* nothing parseable */ }
  }
  return { byId, overall };
}

export async function judgeArm({ slug, armDir, model = 'opus' }) {
  const rubric = loadRubric(slug);
  const scenario = loadScenario(slug);
  const files = readFiles(armDir);
  const transcript = readTranscript(armDir);
  const facts = factCheck(armDir, files.text);
  const criteria = rubric.criteria.map((c) => `- ${c.id} [${c.tier}] ${c.text}`).join('\n');
  const ids = rubric.criteria.map((c) => c.id);
  const prompt = `# The scenario (what the marketer wanted, and who they are)\n\n${scenario.text}\n\n# The rubric\n\n${rubric.text}\n\n# Criteria to score (score every one)\n\n${criteria}\n\n# The conversation transcript\n\nThe agent's messages are complete. Tool traffic is summarised, so judge research breadth from the tool-call lines and the sources cited in the files.\n\n${transcript}\n\n# Files the agent wrote in the marketer's folder\n\nFile list: ${files.list.join(', ') || 'none'}\n${files.text}${facts ? `\n\n# Automatic number check (searched the FULL tool results, not the clipped transcript)\n\n${facts}\nTool results in the transcript above are clipped, so a fact missing from the clipped lines may still be sourced: use this check for traceability.` : ''}\n\n# Your answer\n\nExactly ${ids.length} lines, one per criterion, in this order (${ids.join(', ')}), each:\n<id> | pass or fail | <evidence, one line, max 200 characters>\nThen one last line:\nOVERALL: <two sentences: would a senior marketer use this output, and the single biggest gap>\nNo other text, no JSON, no headings.`;
  console.log(`  [${slug}] judging ${path.basename(armDir)} with ${model} (${Math.round(prompt.length / 1000)}k chars)…`);
  let parsed;
  let cost = 0;
  let raw = '';
  for (let attempt = 1; attempt <= 2; attempt++) {
    const r = await ask({ model, system: JUDGE_SYSTEM, prompt, timeoutMs: 15 * 60_000 });
    cost += r.costUsd;
    raw += `=== attempt ${attempt} ===\n${r.text}\n`;
    parsed = parseVerdicts(r.text);
    if (ids.every((id) => parsed.byId.has(id))) break;
    console.log(`  [${slug}] judge reply covered ${ids.filter((id) => parsed.byId.has(id)).length}/${ids.length} criteria${attempt === 1 ? '; retrying once' : ''}`);
  }
  fs.writeFileSync(path.join(armDir, 'judge-raw.txt'), raw);
  const scored = rubric.criteria.map((c) => {
    const v = parsed.byId.get(c.id);
    return { ...c, verdict: v ? v.verdict : 'missing', evidence: v?.evidence ?? '' };
  });
  const out = {
    slug, arm: path.basename(armDir), judge_model: model, judge_cost_usd: cost,
    transcript_chars: transcript.length,
    must_pass: scored.filter((c) => c.tier === 'must').every((c) => c.verdict === 'pass'),
    counts: count(scored), overall: parsed.overall, criteria: scored,
  };
  fs.writeFileSync(path.join(armDir, 'judge.json'), JSON.stringify(out, null, 2));
  console.log(`  [${slug}] ${out.arm}: must ${out.counts.must.pass}/${out.counts.must.total}, should ${out.counts.should.pass}/${out.counts.should.total}${out.counts.expert.total ? `, expert ${out.counts.expert.pass}/${out.counts.expert.total}` : ''} — ${out.must_pass ? 'PASS' : 'FAIL'}`);
  return out;
}

/** judgeArm that never throws: a failure is logged and saved, and the suite goes on. */
export async function judgeArmSafe(args) {
  try {
    return await judgeArm(args);
  } catch (e) {
    const msg = String(e?.stack || e).slice(0, 4000);
    console.log(`  [${args.slug}] JUDGE FAILED for ${path.basename(args.armDir)}: ${msg.split('\n')[0]}`);
    fs.writeFileSync(path.join(args.armDir, 'judge-error.txt'), msg);
    return null;
  }
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

const ARM_ORDER = ['with-skill', 'legacy', 'baseline'];
const ARM_LABEL = { 'with-skill': 'With skill (new playbooks)', legacy: 'Legacy (old skills)', baseline: 'Baseline (no skills)' };
const score = (j) => 2 * j.counts.must.pass + j.counts.should.pass + j.counts.expert.pass;

/** results.json + summary.md for one playbook, from whatever arms exist. */
export function writePlaybookSummary(outDir, slug) {
  const arms = {};
  for (const arm of ARM_ORDER) {
    const run = readJson(path.join(outDir, arm, 'run.json'));
    const judge = readJson(path.join(outDir, arm, 'judge.json'));
    if (run || judge) arms[arm] = { run, judge };
  }
  const results = { slug, date: today(), arms };
  fs.writeFileSync(path.join(outDir, 'results.json'), JSON.stringify(results, null, 2));

  const rubric = loadRubric(slug);
  const present = ARM_ORDER.filter((a) => arms[a]);
  const v = (arm, id) => arms[arm]?.judge?.criteria.find((c) => c.id === id);
  const head = (first) => `| ${first} | ${present.map((a) => ARM_LABEL[a]).join(' | ')} |\n|${'---|'.repeat(present.length + 1)}\n`;
  let md = `# ${slug} — eval ${today()}\n\n` + head('');
  const line = (label, f) => { md += `| ${label} | ${present.map((a) => f(arms[a])).join(' | ')} |\n`; };
  line('**Verdict (all must-pass)**', (a) => (a.judge ? (a.judge.must_pass ? '**PASS**' : '**FAIL**') : 'not judged'));
  line('Must-pass', (a) => (a.judge ? `${a.judge.counts.must.pass}/${a.judge.counts.must.total}` : '—'));
  line('Should-pass', (a) => (a.judge ? `${a.judge.counts.should.pass}/${a.judge.counts.should.total}` : '—'));
  line('Expert', (a) => (a.judge?.counts.expert.total ? `${a.judge.counts.expert.pass}/${a.judge.counts.expert.total}` : 'none yet'));
  line('Turns / stopped because', (a) => (a.run ? `${a.run.turns} / ${a.run.stopped}` : '—'));
  line('Files written', (a) => (a.run ? (a.run.files.join(', ') || 'none') : '—'));
  line('Minutes', (a) => (a.run ? a.run.minutes : '—'));
  line('Cost (subject + simulator + judge)', (a) => `$${((a.run?.subject_cost_usd ?? 0) + (a.run?.sim_cost_usd ?? 0) + (a.judge?.judge_cost_usd ?? 0)).toFixed(2)}`);
  line('Brand reset (undone / flagged / errors)', (a) => (a.run?.brand_reset?.actions ? `${a.run.brand_reset.undone} / ${a.run.brand_reset.flagged.length} / ${a.run.brand_reset.errors.length}` : a.run?.brand_reset?.error ? 'FAILED' : 'off'));
  if (arms.legacy?.run?.legacy) {
    const L = arms.legacy.run.legacy;
    md += `\n## Legacy arm: old skills\n\n- Installed: ${L.installed.map((s) => s.slug + (s.picked ? '' : ' (dependency)')).join(', ')}\n- Loaded by the agent: ${L.loaded.join(', ') || 'none'}\n- Vendor keys a logged-in user lacks: ${L.keys.missing_vendor_keys.join(', ') || 'none'}\n- Key or login failures seen: ${L.key_failures.length ? L.key_failures.map((k) => `${k.skill} (${cell(k.evidence).slice(0, 120)})`).join('; ') : 'none'}\n`;
  }
  md += `\n## Criteria\n\n` + head('Id | Tier | Criterion').replace('|---|', '|---|---|---|');
  for (const c of rubric.criteria) md += `| ${c.id} | ${c.tier} | ${cell(c.text.length > 120 ? c.text.slice(0, 117) + '…' : c.text)} | ${present.map((a) => mark(v(a, c.id)?.verdict)).join(' | ')} |\n`;
  md += `\n## Judge's overall read\n\n`;
  for (const arm of present) md += `- **${arm}:** ${cell(arms[arm].judge?.overall || 'not judged')}\n`;
  md += `\n## Evidence\n\n` + head('Id');
  for (const c of rubric.criteria) md += `| ${c.id} | ${present.map((a) => cell(v(a, c.id)?.evidence)).join(' | ')} |\n`;
  fs.writeFileSync(path.join(outDir, 'summary.md'), md);
  console.log(`  [${slug}] summary → ${path.join(outDir, 'summary.md')}`);
  return results;
}

/** One table across playbooks for a whole-suite run: one row per arm. */
export function writeSuiteSummary(outRoot, slugs) {
  const frac = (c) => (c?.total ? `${c.pass}/${c.total}` : '–');
  let md = `# Marketing-agent evals — ${path.basename(outRoot)}\n\n`;
  md += `A run passes only if every must-pass criterion passes. Cost = agent + simulated marketer + judge, as reported by the CLI.\n\n`;
  md += `| Playbook | Arm | Verdict | Must | Should | Expert | Turns | Stopped because | Min | Cost | Reset |\n|---|---|---|---|---|---|---|---|---|---|---|\n`;
  let total = 0;
  const helps = [];
  for (const slug of slugs) {
    const outDir = path.join(outRoot, slug);
    for (const arm of ARM_ORDER) {
      const run = readJson(path.join(outDir, arm, 'run.json'));
      const judge = readJson(path.join(outDir, arm, 'judge.json'));
      if (!run && !judge && !fs.existsSync(path.join(outDir, arm))) continue;
      const failed = fs.existsSync(path.join(outDir, arm, 'judge-error.txt')) && !judge ? 'judge failed' : fs.existsSync(path.join(outDir, arm, 'arm-error.txt')) ? 'run failed' : null;
      const cost = (run?.subject_cost_usd ?? 0) + (run?.sim_cost_usd ?? 0) + (judge?.judge_cost_usd ?? 0);
      total += cost;
      const reset = run?.brand_reset?.actions ? `${run.brand_reset.undone} undone${run.brand_reset.left_over.length ? ', LEFT OVER' : ''}` : run?.brand_reset?.error ? 'FAILED' : 'off';
      md += `| [${slug}](${slug}/summary.md) | ${arm} | ${failed ?? (judge ? (judge.must_pass ? '**PASS**' : 'FAIL') : '—')} | ${frac(judge?.counts.must)} | ${frac(judge?.counts.should)} | ${frac(judge?.counts.expert)} | ${run?.turns ?? '—'} | ${run?.stopped ?? '—'} | ${run?.minutes ?? '—'} | $${cost.toFixed(2)} | ${reset} |\n`;
    }
    const j = Object.fromEntries(ARM_ORDER.map((a) => [a, readJson(path.join(outDir, a, 'judge.json'))]));
    const scored = ARM_ORDER.filter((a) => j[a]).map((a) => `${a} ${score(j[a])} (${frac(j[a].counts.must)} must)`);
    if (scored.length > 1) {
      const best = ARM_ORDER.filter((a) => j[a]).sort((x, y) => score(j[y]) - score(j[x]))[0];
      helps.push(`- **${slug}:** best = ${best === 'with-skill' ? best : `**${best}**`} · ${scored.join(' · ')}`);
    }
  }
  md += `\nTotal cost: $${total.toFixed(2)}\n\n## Does the skill help?\n\nScore = 2 × must passed + should passed + expert passed. Within 2 points is judge noise (see README).\n\n${helps.join('\n') || 'Not enough judged pairs.'}\n`;
  const routing = path.join(outRoot, 'routing');
  if (fs.existsSync(routing)) md += `\nRouting: see ${fs.readdirSync(routing).map((m) => `[${m}](routing/${m}/summary.md)`).join(', ')}.\n`;
  fs.writeFileSync(path.join(outRoot, 'summary.md'), md);
  console.log(`\nSuite summary → ${path.join(outRoot, 'summary.md')}`);
}
