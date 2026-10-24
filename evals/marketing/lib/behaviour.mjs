// Behaviour eval: run one playbook's scenario as a multi-turn conversation between
// a headless Claude Code "subject" and a simulated marketer, once WITH the
// marketing skills linked and once WITHOUT (baseline), then judge both.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { ask, parseJsonLoose, runClaude } from './claude.mjs';
import { NOT_PUBLISHED_DIRS, EVALS_DIR, listSkills, loadScenario, loadRubric, today } from './files.mjs';
import { judgeArmSafe, writePlaybookSummary } from './judge.mjs';
import { installLegacy, keyFailures } from './legacy.mjs';
import { connectBrand, snapshot, planReset, applyPlan, attributeToArm } from './brandstate.mjs';

export const ARMS = ['baseline', 'legacy', 'with-skill'];

// The workspace's .claude/settings.json (production GooseWorks denied, staging allowed). Default: the copy
// committed next to run.mjs. GOOSE_EVAL_SETTINGS names another file; GOOSE_EVAL_TEST_DIR a hand-test folder
// whose .claude/settings.json is used (for example one that also denies a connector's own tool prefix).
export const SETTINGS_FILE = process.env.GOOSE_EVAL_SETTINGS
  || (process.env.GOOSE_EVAL_TEST_DIR ? path.join(process.env.GOOSE_EVAL_TEST_DIR, '.claude', 'settings.json') : path.join(EVALS_DIR, 'settings.json'));

// GooseWorks staging tools that spend credits, publish, or touch ad accounts.
// Blocked for the subject in both arms so an eval can never spend.
// competitor_research has a free refresh mode but its mentions mode is paid, so it is blocked whole.
const PAID_OR_PUBLISHING = [
  'data_call_provider', 'data_post_provider', 'knowledge_sync', 'ads_library_scrape', 'competitor_research',
  'ads_generate', 'ads_creative_edit', 'photos_generate', 'photos_update',
  'video_make', 'video_create', 'video_batch', 'video_fix', 'video_change', 'video_approve', 'video_import',
  'request_campaign_generation', 'goose_run_task',
  'social_post_create', 'social_post_update', 'social_inspiration_watch', 'automation_upsert',
  'prepare_meta_ad_push', 'pause_meta_ad_push', 'revert_meta_ad_push', 'propose_meta_budget_change',
  'propose_meta_creative_replacement', 'ads_approval_decide',
];

const ALLOWED_TOOLS = [
  'Read', 'Glob', 'Grep', 'Edit(./**)', 'Write(./**)', 'WebSearch', 'WebFetch', 'Skill', 'Task', 'Agent', 'TodoWrite',
  'Bash(curl:*)', 'Bash(ls:*)', 'Bash(cat:*)', 'Bash(mkdir:*)', 'Bash(date:*)', 'Bash(head:*)', 'Bash(tail:*)',
  'Bash(grep:*)', 'Bash(wc:*)', 'Bash(find:*)',
  // What old skills run (scripts, the CLI). Same list in every arm so only the skills differ.
  'Bash(python3:*)', 'Bash(node:*)', 'Bash(npx:*)', 'Bash(export:*)', 'Bash(jq:*)', 'Bash(gooseworks:*)',
  'mcp__gooseworks-staging',
];

const DISALLOWED_TOOLS = [
  'mcp__gooseworks', // production GooseWorks
  'mcp__a7a7f498-8597-4c8c-bb6a-3d2d1ef9be6d', // production GooseWorks (desktop connector id)
  'AskUserQuestion', // headless: the subject must ask in plain text so the simulator can answer
  ...PAID_OR_PUBLISHING.map((t) => `mcp__gooseworks-staging__${t}`),
  // The real home's CLI login is PRODUCTION; the sandbox home's is staging. Keep the real one out of reach.
  `Read(/${os.homedir()}/.gooseworks/**)`, `Bash(cat ${os.homedir()}/.gooseworks/credentials.json)`,
];

const SUBJECT_NOTE = fs.readFileSync(path.join(EVALS_DIR, 'prompts', 'subject-note.md'), 'utf8');
const SIM_SYSTEM = fs.readFileSync(path.join(EVALS_DIR, 'prompts', 'simulator.md'), 'utf8');

/**
 * A sandbox home for the subject: the real Claude config, keychain, user-level skills (~/.agents, ~/.claude/skills)
 * and npm cache are linked in, but ~/.gooseworks/credentials.json points at the STAGING CLI login. So old skills
 * that read the CLI login (GOOSEWORKS_API_KEY) get staging, like a user logged in to staging. Same in every arm.
 */
function sandboxHome(root) {
  const home = path.join(root, 'home');
  fs.mkdirSync(path.join(home, '.gooseworks'), { recursive: true });
  for (const n of ['.claude', '.claude.json', 'Library', '.agents', '.npm']) {
    const target = path.join(os.homedir(), n);
    if (fs.existsSync(target)) fs.symlinkSync(target, path.join(home, n));
  }
  const staging = path.join(os.homedir(), '.gooseworks', 'profiles', 'staging', 'credentials.json');
  if (fs.existsSync(staging)) fs.symlinkSync(staging, path.join(home, '.gooseworks', 'credentials.json'));
  else console.warn('warning: no staging CLI login (~/.gooseworks/profiles/staging/credentials.json); old skills that need it will fail');
  return home;
}

/**
 * A fresh workspace (README + .claude/settings.json) plus a sandbox home.
 * with-skill copies every published marketing skill flat by slug into .claude/skills/<slug>/ (what the catalog ships: no
 * tests/, nothing from drafts/marketing/); legacy copies the old skills from legacy/mapping.json; baseline adds nothing.
 */
function prepareWorkspace(slug, mode) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), `goose-eval-${slug}-${mode}-`));
  const dir = path.join(root, 'ws');
  fs.mkdirSync(path.join(dir, '.claude'), { recursive: true });
  const home = sandboxHome(root);
  const settings = SETTINGS_FILE;
  if (fs.existsSync(settings)) fs.copyFileSync(settings, path.join(dir, '.claude', 'settings.json'));
  else console.warn(`warning: ${settings} not found; relying on --disallowedTools only`);
  // Same README for both arms; it must not mention the skills.
  fs.writeFileSync(path.join(dir, 'README.md'),
    '# Marketing workspace\n\nUse **GooseWorks staging** only. Production GooseWorks tools are blocked in this folder.\n');
  if (mode === 'with-skill') {
    const skillsDir = path.join(dir, '.claude', 'skills');
    fs.mkdirSync(skillsDir);
    // Side by side, as a terminal install lays them out: skills reach each other as ../<slug>/.
    for (const s of listSkills()) {
      fs.cpSync(s.dir, path.join(skillsDir, s.slug), {
        recursive: true,
        filter: (src) => !(path.dirname(src) === s.dir && NOT_PUBLISHED_DIRS.has(path.basename(src))),
      });
    }
  }
  const legacy = mode === 'legacy' ? installLegacy(slug, dir) : null;
  return { root, dir, home, legacy };
}

export { prepareWorkspace };

async function subjectTurn({ cwd, home, sessionId, first, message, model, effort, timeoutMs, rawFile }) {
  const args = [
    '-p', '--model', model, '--output-format', 'stream-json', '--verbose',
    '--append-system-prompt', SUBJECT_NOTE,
    '--permission-mode', 'dontAsk',
    '--allowedTools', ...ALLOWED_TOOLS,
    '--disallowedTools', ...DISALLOWED_TOOLS,
    ...(first ? ['--session-id', sessionId] : ['--resume', sessionId]),
    ...(effort ? ['--effort', effort] : []),
  ];
  const out = fs.createWriteStream(rawFile);
  const events = [];
  const r = await runClaude({
    args, input: message, cwd, home, timeoutMs,
    onLine: (line) => { out.write(line + '\n'); try { events.push(JSON.parse(line)); } catch { /* ignore */ } },
  });
  await new Promise((res) => out.end(res));
  const result = events.findLast((e) => e.type === 'result');
  const texts = events.filter((e) => e.type === 'assistant' && !e.parent_tool_use_id)
    .flatMap((e) => (e.message?.content ?? []).filter((c) => c.type === 'text').map((c) => c.text));
  const finalText = (result?.result || texts.at(-1) || '').trim();
  return {
    events, finalText, timedOut: r.timedOut, code: r.code, stderr: r.stderr.slice(-2000),
    costUsd: result?.total_cost_usd ?? 0, ms: r.ms, isError: !result || result.is_error,
    denials: result?.permission_denials ?? [],
  };
}

async function simulate({ scenarioText, history, model, reportFiles, requiresReport, askedForReport }) {
  const convo = history.map((h) => `${h.role === 'marketer' ? 'MARKETER' : 'AGENT'}:\n${h.text}`).join('\n\n---\n\n');
  const state = [
    `This job's deliverable is ${requiresReport ? 'a written report or plan you can open as a document' : 'an answer or recommendation in the chat'}.`,
    `Document files the agent has written in your folder so far: ${reportFiles.length ? reportFiles.join(', ') : 'none'}.`,
    askedForReport ? 'You already asked once for the full report as a document.' : '',
  ].filter(Boolean).join('\n');
  const prompt = `${scenarioText}\n\n=== Conversation so far ===\n\n${convo}\n\n=== Facts for your decision (you can see your own folder) ===\n${state}\n\n=== Your move ===\nYou are the marketer. Reply with JSON only: {"done": true|false, "reply": "<what you type back, empty if done>", "why": "<one short line for the eval log>"}`;
  let cost = 0;
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const r = await ask({ model, system: SIM_SYSTEM, prompt, timeoutMs: 5 * 60_000 });
      cost += r.costUsd;
      const j = parseJsonLoose(r.text);
      return { done: !!j.done, reply: String(j.reply ?? '').trim(), why: String(j.why ?? ''), costUsd: cost };
    } catch (e) {
      if (attempt === 2) return { done: false, reply: 'ok, go on.', why: `[simulator failed twice: ${String(e.message).slice(0, 120)}]`, costUsd: cost };
    }
  }
}

function clip(s, n) {
  s = String(s ?? '');
  return s.length > n ? s.slice(0, n) + ` …[+${s.length - n} chars]` : s;
}

function resultText(c) {
  if (typeof c.content === 'string') return c.content;
  if (Array.isArray(c.content)) return c.content.map((x) => (x.type === 'text' ? x.text : `[${x.type}]`)).join(' ');
  return '';
}

/** Readable transcript for the judge and for humans: every message, every tool call, clipped tool results. */
export function condense(turns, { toolArgs = 300, toolResult = 400 } = {}) {
  let md = '';
  turns.forEach((t, i) => {
    md += `\n## Turn ${i + 1}\n\n### MARKETER\n${t.message}\n\n### AGENT (actions and messages, in order)\n`;
    for (const e of t.events) {
      const sub = e.parent_tool_use_id ? '  [sub-agent] ' : '';
      if (e.type === 'assistant') {
        for (const c of e.message?.content ?? []) {
          if (c.type === 'text' && c.text.trim()) md += `${sub}AGENT SAYS: ${e.parent_tool_use_id ? clip(c.text, 600) : c.text}\n\n`;
          if (c.type === 'tool_use') md += `${sub}→ ${c.name}(${clip(JSON.stringify(c.input), toolArgs)})\n`;
        }
      } else if (e.type === 'user') {
        for (const c of Array.isArray(e.message?.content) ? e.message.content : []) {
          if (c.type === 'tool_result') md += `${sub}← ${c.is_error ? 'ERROR ' : ''}${clip(resultText(c).replace(/\s+/g, ' '), toolResult)}\n`;
        }
      }
    }
    md += `\n### AGENT FINAL MESSAGE THIS TURN\n${t.finalText || '(none)'}\n`;
    if (t.timedOut) md += `\n(turn timed out)\n`;
  });
  return md;
}

function walk(dir, base = dir, out = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    const rel = path.relative(base, p);
    if (rel === '.claude' || rel === 'README.md' || ent.name === '.DS_Store') continue;
    if (ent.isDirectory()) walk(p, base, out);
    else if (ent.isFile()) out.push(rel);
  }
  return out;
}

function findSessionFile(sessionId) {
  const root = path.join(os.homedir(), '.claude', 'projects');
  for (const d of fs.readdirSync(root)) {
    const f = path.join(root, d, `${sessionId}.jsonl`);
    if (fs.existsSync(f)) return { file: f, dir: path.join(root, d, sessionId) };
  }
  return null;
}

const DOC_EXT = /\.(md|markdown|html?|txt|csv|pdf|docx?)$/i;
/** Document-like files the subject wrote in the workspace (what a marketer could open). */
function reportFiles(cwd) {
  return walk(cwd).filter((rel) => DOC_EXT.test(rel));
}

const ASK_FOR_REPORT = "can you give me the full report as a doc i can open? the chat summary isn't enough for me to share.";

/**
 * Brand isolation: snapshot the staging brand before the arm, undo the arm's changes after it, then check.
 * Returns a record for run.json. Never throws: a failed reset is recorded and the suite goes on.
 */
async function resetBrand(before, opts, label, events) {
  try {
    const ctx = await connectBrand(opts.brandSlug ?? 'gooseworks'); // fresh MCP session: the arm may have run an hour
    const after = await snapshot(ctx, { withContents: false });
    const spent = before.credits != null && after.credits != null ? before.credits - after.credits : null;
    if (spent) console.log(`  [${label}] STAGING CREDITS CHANGED during the arm: ${before.credits} → ${after.credits}`);
    // The arm's own tool traffic (main agent and sub-agents): only changes it explains are undone.
    const haystack = events.map((e) => JSON.stringify(e.message?.content ?? '')).join('\n').replace(/\\\//g, '/');
    const plan = attributeToArm(planReset(before, after), haystack);
    const done = await applyPlan(ctx, plan);
    const residue = attributeToArm(planReset(before, await snapshot(ctx, { withContents: false })), haystack).filter((a) => a.op !== 'flag');
    const n = (r) => done.filter((d) => d.result === r).length;
    console.log(`  [${label}] brand reset: ${done.length - n('flagged') - n('error')} undone, ${n('flagged')} flagged, ${n('error')} errors, ${residue.length} left over`);
    return { snapshot_at: before.taken_at, credits_before: before.credits, credits_after: after.credits, credits_spent: spent, actions: done, undone: done.length - n('flagged') - n('error'), flagged: done.filter((d) => d.result === 'flagged').map((d) => d.label), errors: done.filter((d) => d.result === 'error').map((d) => `${d.label}: ${d.error}`), left_over: residue.map((a) => a.label) };
  } catch (e) {
    console.log(`  [${label}] BRAND RESET FAILED: ${String(e.message).slice(0, 200)}`);
    return { error: String(e.message).slice(0, 500) };
  }
}

/** One arm (baseline, legacy or with-skill): the whole conversation, saved to armDir. */
export async function runArm({ slug, mode, armDir, opts }) {
  const scenario = loadScenario(slug);
  const maxTurns = opts.maxTurns ?? scenario.maxTurns;
  fs.mkdirSync(path.join(armDir, 'turns'), { recursive: true });
  const ws = prepareWorkspace(slug, mode);
  const cwd = ws.dir;
  let before = null;
  if (opts.reset !== false) {
    try {
      before = await snapshot(await connectBrand(opts.brandSlug ?? 'gooseworks'));
    } catch (e) {
      console.log(`  [${slug} · ${mode}] brand snapshot failed, arm runs WITHOUT isolation: ${String(e.message).slice(0, 200)}`);
    }
  }
  const sessionId = crypto.randomUUID();
  const started = Date.now();
  const turns = [];
  const history = [];
  const log = [];
  let message = scenario.ask;
  let stopped = 'turn cap';
  let subjectCost = 0;
  let simCost = 0;
  let askedForReport = false;
  const capMs = (opts.armCapMin ?? 60) * 60_000;
  const turnMs = (opts.turnTimeoutMin ?? opts.armCapMin ?? 60) * 60_000;
  console.log(`  [${slug} · ${mode}] workspace ${cwd}`);

  for (let n = 1; n <= maxTurns; n++) {
    const remaining = capMs - (Date.now() - started);
    if (remaining < 60_000) { stopped = 'time cap'; break; }
    const timeoutMs = Math.min(turnMs, remaining);
    console.log(`  [${slug} · ${mode}] subject turn ${n}: ${clip(message.replace(/\s+/g, ' '), 100)}`);
    const t = await subjectTurn({
      cwd, home: ws.home, sessionId, first: n === 1, message, model: opts.subjectModel, effort: opts.effort,
      timeoutMs, rawFile: path.join(armDir, 'turns', `turn-${String(n).padStart(2, '0')}.jsonl`),
    });
    subjectCost += t.costUsd;
    turns.push({ message, ...t });
    history.push({ role: 'marketer', text: message }, { role: 'agent', text: t.finalText || '(no reply)' });
    log.push({ turn: n, marketer: message, agent_final: t.finalText, cost_usd: t.costUsd, ms: t.ms, timed_out: t.timedOut, error: t.isError ? t.stderr : undefined, permission_denials: t.denials.map((d) => d.tool_name) });
    console.log(`  [${slug} · ${mode}] subject turn ${n} done in ${Math.round(t.ms / 1000)}s, $${t.costUsd.toFixed(2)}${t.timedOut ? ' (TIMED OUT)' : ''}${t.isError ? ' (ERROR)' : ''}`);
    if (t.timedOut && timeoutMs === remaining) { stopped = 'time cap'; break; }
    if (t.isError && !t.finalText) { stopped = t.timedOut ? 'subject turn timed out' : 'subject error'; break; }

    const docs = reportFiles(cwd);
    const sim = await simulate({ scenarioText: scenario.text, history, model: opts.simModel, reportFiles: docs, requiresReport: scenario.requiresReport, askedForReport });
    simCost += sim.costUsd;
    // DONE but with an answer typed: the agent asked something, so send the answer (once in a row).
    if (sim.done && sim.reply && !log.at(-2)?.simulator?.why?.includes('[code: done with a reply')) {
      sim.done = false;
      sim.why = `[code: done with a reply → reply sent] ${sim.why}`;
    }
    // The agent paused mid-work with nothing to answer: nudge it on.
    if (!sim.done && !sim.reply) { sim.reply = 'ok, go on.'; sim.why = `[code: empty reply → nudge] ${sim.why}`; }
    // Enforced in code, not only in the prompt: a report job is not done until a document exists.
    if (sim.done && scenario.requiresReport && !docs.length) {
      if (askedForReport) {
        log.at(-1).simulator = { done: true, reply: '', why: `${sim.why} [code: still no report file after asking once]` };
        console.log(`  [${slug} · ${mode}] simulator: DONE — still no report file after asking once`);
        stopped = 'no report file after asking'; break;
      }
      sim.done = false;
      sim.reply = ASK_FOR_REPORT;
      sim.why = `[code: no report file yet, asked for it] ${sim.why}`;
    }
    if (sim.reply === ASK_FOR_REPORT || /full report|as a doc|document i can open/i.test(sim.reply)) askedForReport = true;
    log.at(-1).simulator = { done: sim.done, reply: sim.reply, why: sim.why };
    console.log(`  [${slug} · ${mode}] simulator: ${sim.done ? 'DONE' : clip(sim.reply.replace(/\s+/g, ' '), 100)} (${sim.why})`);
    if (sim.done) { stopped = 'marketer satisfied'; break; }
    if (n === maxTurns) { stopped = 'turn cap'; break; }
    message = sim.reply;
  }

  // Collect what the subject wrote (reports, CSVs, drafts) and the full session transcript.
  const files = walk(cwd);
  for (const rel of files) {
    const dest = path.join(armDir, 'files', rel);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(path.join(cwd, rel), dest);
  }
  const sess = findSessionFile(sessionId);
  if (sess) {
    fs.copyFileSync(sess.file, path.join(armDir, 'session.jsonl'));
    if (fs.existsSync(sess.dir)) fs.cpSync(sess.dir, path.join(armDir, 'session'), { recursive: true });
  }
  fs.writeFileSync(path.join(armDir, 'transcript.md'), `# ${slug} — ${mode}\n\nWorkspace files written: ${files.length ? files.join(', ') : 'none'}\n` + condense(turns));
  const allEvents = turns.flatMap((t) => t.events);
  const legacy = ws.legacy ? {
    installed: ws.legacy.installed.map((s) => ({ slug: s.slug, picked: s.picked, required_by: s.required_by, keys_needed: s.keys_needed })),
    missing: ws.legacy.missing,
    keys: ws.legacy.keys,
    loaded: [...new Set(allEvents.flatMap((e) => (e.message?.content ?? []).filter((c) => c.type === 'tool_use' && c.name === 'Skill').map((c) => c.input?.skill)))],
    key_failures: keyFailures(allEvents, ws.legacy.installed.map((s) => s.slug)),
  } : undefined;
  const brandReset = before ? await resetBrand(before, opts, `${slug} · ${mode}`, allEvents) : { skipped: opts.reset === false ? 'disabled (--no-reset)' : 'snapshot failed' };
  const meta = {
    slug, mode, session_id: sessionId, subject_model: opts.subjectModel, sim_model: opts.simModel,
    turns: turns.length, stopped, arm_cap_min: capMs / 60_000, files, subject_cost_usd: subjectCost, sim_cost_usd: simCost,
    minutes: Math.round((Date.now() - started) / 6000) / 10, legacy, brand_reset: brandReset, log,
  };
  fs.writeFileSync(path.join(armDir, 'run.json'), JSON.stringify(meta, null, 2));
  if (!opts.keepWorkspace) fs.rmSync(ws.root, { recursive: true, force: true });
  else meta.workspace = ws.root;
  console.log(`  [${slug} · ${mode}] stopped: ${stopped}; ${turns.length} turn(s); files: ${files.length}`);
  return meta;
}

/** Run the arms in order (each starts from the same brand state, thanks to the reset), judge, summarise. */
export async function runPlaybook(slug, opts) {
  loadRubric(slug); // fail fast on a broken rubric
  const outDir = path.join(opts.outRoot ?? path.join(EVALS_DIR, 'results', today()), slug);
  const modes = opts.mode === 'both' ? ['baseline', 'with-skill'] : opts.mode === 'all' ? ARMS : String(opts.mode).split(',');
  for (const m of modes) if (!ARMS.includes(m)) throw new Error(`unknown mode ${m} (use ${ARMS.join(', ')}, both or all)`);
  console.log(`\n=== ${slug} (${modes.join(' + ')}) → ${path.relative(process.cwd(), outDir)}`);
  for (const mode of modes) {
    const armDir = path.join(outDir, mode);
    if (fs.existsSync(armDir)) fs.rmSync(armDir, { recursive: true, force: true });
    try {
      await runArm({ slug, mode, armDir, opts });
    } catch (e) {
      console.log(`  [${slug} · ${mode}] ARM FAILED: ${String(e?.stack || e).split('\n')[0]}`);
      fs.mkdirSync(armDir, { recursive: true });
      fs.writeFileSync(path.join(armDir, 'arm-error.txt'), String(e?.stack || e));
      continue;
    }
    if (!opts.noJudge) await judgeArmSafe({ slug, armDir, model: opts.judgeModel });
  }
  return writePlaybookSummary(outDir, slug);
}
