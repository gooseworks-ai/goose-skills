#!/usr/bin/env node
'use strict';

/**
 * Everything CI checks that runs offline, in one command:
 *
 *   npm run check:all [-- --base <ref>] [-- --allow-skip]
 *
 * The groups match the CI jobs (.github/workflows/ci.yml):
 *   validate     npm run ci
 *   atom-checks  the atom, skill-version and part checks, compared with --base
 *                (default: the merge base of origin/dev and HEAD, the branch a
 *                pull request targets)
 *   part-tests   npm run test:parts (needs ffmpeg and a playwright-core
 *                Chromium; KIT_FFMPEG defaults to the ffmpeg on PATH), then
 *                the "every part test ran" guard
 *   imessage     render-imessage-chat's browser tests (needs
 *                `npm ci --prefix skills/video/render-imessage-chat/scripts` and
 *                `npx playwright install chromium` there)
 *   media        pytest over skills/ and test/ (a skip fails), the custom-video regressions and
 *                the podcast-skit gates (needs ffmpeg, pytest, Pillow, numpy,
 *                requests, opencv)
 *
 * Every group runs even when an earlier one fails; the summary lists each.
 * A group whose tools are missing is reported as skipped, and a skip fails the
 * run (so a green run means what a green CI means) unless --allow-skip.
 * The deploy and publish jobs are not offline and are not run.
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');

function parseArgs(argv) {
  const args = { base: null, allowSkip: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--allow-skip') args.allowSkip = true;
    else if (a === '--base') args.base = argv[++i];
    else if (a.startsWith('--base=')) args.base = a.slice(7);
    else throw new Error(`unknown argument ${a} (use --base <ref> or --allow-skip)`);
  }
  return args;
}

function sh(cmd, { cwd = ROOT, env = {}, shell = true } = {}) {
  console.log(`\n$ ${cmd}`);
  const res = spawnSync(cmd, { cwd, env: { ...process.env, ...env }, stdio: 'inherit', shell });
  return res.status === 0;
}

function quiet(cmd, args, opts = {}) {
  const res = spawnSync(cmd, args, { cwd: ROOT, encoding: 'utf8', ...opts });
  return res.status === 0 ? res.stdout.trim() : null;
}

function has(cmd) {
  return quiet('sh', ['-c', `command -v ${cmd}`]) !== null;
}

function pickBase(ref) {
  if (ref) return quiet('git', ['rev-parse', '--verify', `${ref}^{commit}`]);
  return quiet('git', ['merge-base', 'origin/dev', 'HEAD']);
}

const groups = [
  {
    name: 'validate',
    run: () => sh('npm run ci'),
  },
  {
    name: 'atom-checks',
    run: ({ base }) => {
      if (!base) return { skip: 'no base: fetch origin/dev, or pass --base <ref>' };
      const steps = [
        `node scripts/atom-lint.js --base ${base} --direct --strict`,
        `node scripts/check-atom-versions.js --base ${base} --direct`,
        `node scripts/check-skill-versions.js --base ${base} --direct`,
        `node scripts/check-parts.js --base ${base} --direct`,
        'node parts/_tools/lint.mjs',
      ];
      return steps.map((s) => sh(s)).every(Boolean);
    },
  },
  {
    name: 'part-tests',
    run: () => {
      const ffmpeg = process.env.KIT_FFMPEG || 'ffmpeg';
      if (ffmpeg === 'ffmpeg' && !has('ffmpeg')) return { skip: 'no ffmpeg on PATH (or set KIT_FFMPEG)' };
      // The kit's own answer to "can the browser tests run here?", so they are skipped up front, not run half.
      const probe = spawnSync(process.execPath, ['--input-type=module', '-e', "const m = await import('./parts/_tools/kit-harness.mjs'); const why = m.browserMissing(); if (why) { console.log(why); process.exit(1); }"], { cwd: ROOT, encoding: 'utf8' });
      if (probe.status !== 0) return { skip: (probe.stdout || probe.stderr).trim() || 'no browser for the part tests' };
      const log = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'gs-part-tests-')), 'part-tests.log');
      // bash, for pipefail (as CI's shell: bash step).
      const ran = sh(`set -o pipefail; npm run test:parts 2>&1 | tee "${log}"`, { env: { KIT_FFMPEG: ffmpeg }, shell: 'bash' });
      return sh(`node scripts/require-all-tests-ran.js "${log}"`) && ran;
    },
  },
  {
    name: 'imessage',
    run: () => {
      const dir = path.join(ROOT, 'skills', 'video', 'render-imessage-chat');
      if (!fs.existsSync(path.join(dir, 'scripts', 'node_modules', 'playwright'))) {
        return { skip: 'run `npm ci --prefix scripts && cd scripts && npx playwright install chromium` in skills/video/render-imessage-chat' };
      }
      return sh('node --test --test-concurrency=1 tests/test_safe_area.js tests/test_chat.js', { cwd: dir });
    },
  },
  {
    name: 'media',
    run: () => {
      if (!has('ffmpeg')) return { skip: 'no ffmpeg on PATH' };
      const py = has('python3') ? 'python3' : 'python';
      if (quiet(py, ['-c', 'import pytest, PIL, numpy, requests, cv2']) === null) {
        return { skip: `${py} lacks pytest, pillow, numpy, requests or opencv-python-headless` };
      }
      // As CI: an OFL font in the repo for render-hook-replacement's text route, and a skip fails.
      const font = path.join(ROOT, 'parts/captions-layer/1.5.0/assets/fonts/Montserrat-Bold.ttf');
      const log = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'gs-pytest-')), 'pytest.log');
      const ran = sh(`set -o pipefail; ${py} -m pytest -q -rs skills test 2>&1 | tee "${log}"`, { env: { HOOK_TEST_FONT: process.env.HOOK_TEST_FONT || font }, shell: 'bash' });
      return [
        ran && sh(`node scripts/require-all-tests-ran.js "${log}"`),
        sh(`${py} -m pytest -q test/custom-video-regressions.py`),
        sh(`${py} skills/video/render-podcast-skit/scripts/selftest.py`),
      ].every(Boolean);
    },
  },
];

function main() {
  const args = parseArgs(process.argv.slice(2));
  const base = pickBase(args.base);
  if (base) console.log(`Comparing with ${base.slice(0, 9)}${args.base ? ` (${args.base})` : ' (merge base of origin/dev and HEAD)'}.`);
  const results = [];
  for (const group of groups) {
    console.log(`\n━━ ${group.name} ━━`);
    const out = group.run({ base });
    results.push({ name: group.name, state: out && out.skip ? 'skipped' : out ? 'passed' : 'FAILED', note: out && out.skip });
  }
  console.log('\n━━ check:all ━━');
  for (const r of results) console.log(`  ${r.state.padEnd(8)} ${r.name}${r.note ? `: ${r.note}` : ''}`);
  const failed = results.some((r) => r.state === 'FAILED');
  const skipped = results.some((r) => r.state === 'skipped');
  if (skipped && !args.allowSkip) console.log('\nA skipped group fails the run; install what it names, or pass --allow-skip.');
  process.exit(failed || (skipped && !args.allowSkip) ? 1 : 0);
}

main();
