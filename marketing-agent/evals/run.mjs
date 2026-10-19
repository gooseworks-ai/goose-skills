#!/usr/bin/env node
// Marketing-agent evals. See README.md. Node 20+, no dependencies; needs the `claude` CLI.
//
//   node run.mjs routing [--model haiku] [--limit 5] [--ids R01,R21]
//   node run.mjs playbook <slug ...|all> [--mode all|both|with-skill|legacy|baseline] [--subject-model sonnet]
//                [--sim-model haiku] [--judge-model opus] [--max-turns 8] [--turn-timeout 45]
//                [--arm-cap 60] [--effort high] [--keep-workspace] [--no-judge] [--no-reset] [--brand gooseworks]
//   node run.mjs judge <results/<date>/<slug>> [--arm with-skill|legacy|baseline] [--judge-model opus]
//   node run.mjs all [--mode all]   routing + every playbook eval (default arms: baseline + with-skill)
//   node run.mjs brand-clean [--brand gooseworks] [--since 2026-10-16] [--apply]   (dry run unless --apply)
//   node run.mjs legacy-check [slug ...|all] [--keep-workspace]   (builds the legacy workspace, runs no agent)
//   node run.mjs list
import fs from 'node:fs';
import path from 'node:path';
import { runRouting } from './lib/routing.mjs';
import { runPlaybook, prepareWorkspace } from './lib/behaviour.mjs';
import { judgeArmSafe, writePlaybookSummary, writeSuiteSummary } from './lib/judge.mjs';
import { EVALS_DIR, listPlaybookEvals, today } from './lib/files.mjs';
import { connectBrand, snapshot, planSince, applyPlan, describePlan } from './lib/brandstate.mjs';

function parseArgs(argv) {
  const pos = [];
  const flags = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith('--')) { pos.push(a); continue; }
    const key = a.slice(2);
    const next = argv[i + 1];
    if (next === undefined || next.startsWith('--')) flags[key] = true;
    else { flags[key] = next; i++; }
  }
  return { pos, flags };
}

const { pos, flags } = parseArgs(process.argv.slice(2));
const cmd = pos.shift();
const outRoot = flags.out ? path.resolve(flags.out) : path.join(EVALS_DIR, 'results', today());

const behaviourOpts = {
  mode: flags.mode || 'both',
  subjectModel: flags['subject-model'] || 'sonnet',
  simModel: flags['sim-model'] || 'haiku',
  judgeModel: flags['judge-model'] || 'opus',
  maxTurns: flags['max-turns'] ? Number(flags['max-turns']) : undefined,
  armCapMin: Number(flags['arm-cap'] || 60), // wall-clock cap per arm, minutes
  turnTimeoutMin: flags['turn-timeout'] ? Number(flags['turn-timeout']) : undefined, // default: the arm cap
  effort: flags.effort || undefined,
  keepWorkspace: !!flags['keep-workspace'],
  noJudge: !!flags['no-judge'],
  reset: !flags['no-reset'], // snapshot the staging brand before each arm and undo the arm's changes after it
  brandSlug: flags.brand || 'gooseworks',
  outRoot,
};

/** One playbook's failure is logged and the suite goes on. */
async function runPlaybookSafe(slug) {
  try {
    await runPlaybook(slug, behaviourOpts);
  } catch (e) {
    console.log(`\n!!! ${slug} FAILED: ${String(e?.stack || e)}`);
  }
}

async function main() {
  switch (cmd) {
    case 'routing':
      await runRouting({
        model: flags.model || 'haiku',
        limit: flags.limit ? Number(flags.limit) : undefined,
        ids: flags.ids ? String(flags.ids).split(',') : undefined,
        concurrency: Number(flags.concurrency || 4),
        outRoot,
      });
      break;
    case 'playbook': {
      const slugs = pos[0] === 'all' || !pos.length ? listPlaybookEvals() : pos;
      for (const slug of slugs) await runPlaybookSafe(slug);
      if (slugs.length > 1) writeSuiteSummary(outRoot, slugs);
      break;
    }
    case 'judge': {
      const dir = path.resolve(pos[0] || '');
      const slug = path.basename(dir);
      for (const arm of flags.arm ? [flags.arm] : ['with-skill', 'legacy', 'baseline']) {
        if (fs.existsSync(path.join(dir, arm, 'run.json'))) await judgeArmSafe({ slug, armDir: path.join(dir, arm), model: behaviourOpts.judgeModel });
      }
      writePlaybookSummary(dir, slug);
      break;
    }
    case 'all': {
      await runRouting({ model: flags.model || 'haiku', outRoot });
      const slugs = listPlaybookEvals();
      for (const slug of slugs) await runPlaybookSafe(slug);
      writeSuiteSummary(outRoot, slugs);
      break;
    }
    case 'brand-clean': {
      const since = flags.since || '2026-10-16';
      const ctx = await connectBrand(flags.brand || 'gooseworks');
      const snap = await snapshot(ctx, { withContents: false });
      const plan = planSince(snap, since);
      const dir = path.join(EVALS_DIR, 'results', 'brand-clean');
      fs.mkdirSync(dir, { recursive: true });
      const stamp = new Date().toISOString().replace(/[:.]/g, '-');
      console.log(`Staging brand ${ctx.brand.name} (${ctx.brand.id}); workspaces ${ctx.scopes.join(', ')}; since ${since}\n`);
      console.log(describePlan(plan) || 'Nothing to clean.');
      if (flags.apply) {
        const done = await applyPlan(ctx, plan);
        fs.writeFileSync(path.join(dir, `${stamp}-applied.json`), JSON.stringify({ since, brand: ctx.brand, done }, null, 2));
        const errs = done.filter((d) => d.result === 'error');
        console.log(`\nApplied: ${done.filter((d) => !['flagged', 'error'].includes(d.result)).length} · flagged ${done.filter((d) => d.result === 'flagged').length} · errors ${errs.length}`);
        for (const e of errs) console.log(`  error: ${e.label}: ${e.error}`);
      } else {
        fs.writeFileSync(path.join(dir, `${stamp}-dry-run.json`), JSON.stringify({ since, brand: ctx.brand, plan }, null, 2));
        console.log(`\nDRY RUN: nothing changed. Re-run with --apply to delete/archive the items above (flagged items are never touched).`);
      }
      break;
    }
    case 'legacy-check': {
      const slugs = pos[0] === 'all' || !pos.length ? listPlaybookEvals() : pos;
      for (const slug of slugs) {
        const ws = prepareWorkspace(slug, 'legacy');
        const skillsDir = path.join(ws.dir, '.claude', 'skills');
        const onDisk = fs.readdirSync(skillsDir).sort();
        const bad = onDisk.filter((s) => !fs.existsSync(path.join(skillsDir, s, 'SKILL.md')));
        const cred = path.join(ws.home, '.gooseworks', 'credentials.json');
        const credBase = fs.existsSync(cred) ? JSON.parse(fs.readFileSync(cred, 'utf8')).api_base : 'MISSING';
        const L = ws.legacy;
        console.log(`\n=== ${slug}`);
        console.log(`picked: ${L.installed.filter((s) => s.picked).map((s) => s.slug).join(', ')}`);
        console.log(`dependencies: ${L.installed.filter((s) => !s.picked).map((s) => `${s.slug} (for ${s.required_by})`).join(', ') || 'none'}`);
        if (L.missing.length) console.log(`not found in skills-index: ${L.missing.map((m) => `${m.slug}${m.via ? ` (for ${m.via})` : ''}`).join(', ')}`);
        console.log(`on disk in .claude/skills: ${onDisk.length} folders${bad.length ? `; WITHOUT SKILL.md: ${bad.join(', ')}` : ', all with SKILL.md'}`);
        console.log(`new playbooks present: ${onDisk.some((s) => s === slug || s === 'marketing-agent') ? 'YES (wrong)' : 'no'}; sandbox CLI login → ${credBase}`);
        console.log(`keys from the CLI login: ${L.keys.from_cli_login.join(', ') || 'none'}`);
        console.log(`vendor keys a logged-in user lacks: ${L.keys.missing_vendor_keys.join(', ') || 'none'}`);
        if (L.keys.optional_keys.length) console.log(`optional keys: ${L.keys.optional_keys.join('; ')}`);
        for (const k of L.keys.skills_needing_missing_keys) console.log(`  needs a missing key: ${k}`);
        if (!flags['keep-workspace']) fs.rmSync(ws.root, { recursive: true, force: true });
        else console.log(`workspace kept: ${ws.root}`);
      }
      break;
    }
    case 'list':
      console.log('Behaviour evals:', listPlaybookEvals().join(', '));
      break;
    default:
      console.log(fs.readFileSync(new URL(import.meta.url), 'utf8').split('\n').slice(1, 12).join('\n').replace(/^\/\/ ?/gm, ''));
      process.exitCode = cmd ? 1 : 0;
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
