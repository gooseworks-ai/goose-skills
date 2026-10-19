#!/usr/bin/env node
// Marketing-agent evals. See README.md. Node 20+, no dependencies; needs the `claude` CLI.
//
//   node run.mjs routing [--model haiku] [--limit 5] [--ids R01,R21]
//   node run.mjs playbook <slug ...|all> [--mode both|with-skill|baseline] [--subject-model sonnet]
//                [--sim-model haiku] [--judge-model opus] [--max-turns 8] [--turn-timeout 45]
//                [--arm-cap 60] [--effort high] [--keep-workspace] [--no-judge]
//   node run.mjs judge <results/<date>/<slug>> [--arm with-skill|baseline] [--judge-model opus]
//   node run.mjs all            routing + every playbook eval, both arms
//   node run.mjs list
import fs from 'node:fs';
import path from 'node:path';
import { runRouting } from './lib/routing.mjs';
import { runPlaybook } from './lib/behaviour.mjs';
import { judgeArmSafe, writePlaybookSummary, writeSuiteSummary } from './lib/judge.mjs';
import { EVALS_DIR, listPlaybookEvals, today } from './lib/files.mjs';

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
      for (const arm of flags.arm ? [flags.arm] : ['with-skill', 'baseline']) {
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
    case 'list':
      console.log('Behaviour evals:', listPlaybookEvals().join(', '));
      break;
    default:
      console.log(fs.readFileSync(new URL(import.meta.url), 'utf8').split('\n').slice(1, 10).join('\n').replace(/^\/\/ ?/gm, ''));
      process.exitCode = cmd ? 1 : 0;
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
