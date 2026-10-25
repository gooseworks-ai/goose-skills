#!/usr/bin/env node
'use strict';

/**
 * Every GooseWorks tool a published skill names must be one the customer
 * server lists today (scripts/lib/action-names.json `actions`). It reads every
 * file under skills/ and docs/ except test fixtures, in every family.
 *
 * Fails on:
 *   - an old name the server renamed or hides (`renamed`); the message names the listed tool to use
 *   - a removed name (`removed`)
 *   - gooseworks:<name> or mcp__<goose server>__<name> that is not listed
 *   - "call <name>", "calls <name>" or "<name> tool" for a snake_case name that is
 *     not listed and not in `other_tools` (tools of other servers, with the reason)
 *
 * Refresh the list from gooseworks-app: node scripts/refresh-action-names.js --app <dir>.
 * Usage: node scripts/check-tool-names.js [paths...]
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const NAMES = require('./lib/action-names.json');
const LISTED = new Set(NAMES.actions);
const OTHER = new Set(Object.keys(NAMES.other_tools ?? {}));
const RENAMED = NAMES.renamed;
const REMOVED = new Set(NAMES.removed);

const TEXT = /\.(md|markdown|txt|json|ya?ml|py|js|mjs|cjs|ts|sh|html)$/i;
// "call x" and "x tool" read as tool calls only in text an agent reads, not in code.
const PROSE = /\.(md|markdown|txt|html)$/i;
// Test folders are fixtures for a skill's own tests; nobody's agent reads them as instructions.
const SKIP_SEGMENTS = new Set(['tests', 'test', '__tests__', 'fixtures', 'node_modules']);
const SKIP_FILES = new Set(['package-lock.json']);

const WORD = /\b[a-z][a-z0-9]*(?:_[a-z0-9]+)+\b/g;
const PREFIXED = /\b(?:gooseworks:|mcp__[a-z0-9-]*goose[a-z0-9-]*__)([a-z][a-z0-9_]*)\b/g;
const TOOL_CONTEXT = [
  /\bcall(?:s|ing|ed)?\s+`?([a-z][a-z0-9]*(?:_[a-z0-9]+)+)`?/g,
  /`?([a-z][a-z0-9]*(?:_[a-z0-9]+)+)`?\s+tools?\b/g,
];

function files(targets) {
  const out = execFileSync('git', ['ls-files', '-z', '--', ...targets], { cwd: ROOT, encoding: 'utf8' });
  return out.split('\0').filter((f) => f && TEXT.test(f) && !SKIP_FILES.has(path.basename(f))
    && !f.split('/').some((s) => SKIP_SEGMENTS.has(s)));
}

function lintText(text, { prose = true } = {}) {
  const problems = [];
  const lines = text.split('\n');
  lines.forEach((line, i) => {
    const at = i + 1;
    for (const [name] of line.matchAll(WORD)) {
      if (RENAMED[name]) problems.push({ at, name, why: `hidden or renamed; use ${RENAMED[name]}` });
      else if (REMOVED.has(name)) problems.push({ at, name, why: 'removed from the server' });
    }
    for (const m of line.matchAll(PREFIXED)) {
      const name = m[1];
      if (!LISTED.has(name) && !RENAMED[name] && !REMOVED.has(name)) problems.push({ at, name, why: 'not a listed GooseWorks tool' });
    }
    for (const re of prose ? TOOL_CONTEXT : []) {
      for (const m of line.matchAll(re)) {
        const name = m[1];
        if (!LISTED.has(name) && !OTHER.has(name) && !RENAMED[name] && !REMOVED.has(name)) {
          problems.push({ at, name, why: 'named as a tool but not listed (add it to other_tools with a reason if it is another server\'s)' });
        }
      }
    }
  });
  return problems;
}

function main() {
  const targets = process.argv.slice(2);
  const list = files(targets.length ? targets : ['skills', 'docs']);
  let count = 0;
  for (const file of list) {
    const text = fs.readFileSync(path.join(ROOT, file), 'utf8');
    for (const p of lintText(text, { prose: PROSE.test(file) })) {
      count++;
      console.log(`${file}:${p.at}: ${p.name}: ${p.why}`);
    }
  }
  if (count) {
    console.error(`\n${count} tool-name problem(s) in ${list.length} files. Listed tools: scripts/lib/action-names.json (${NAMES.source_ref}).`);
    process.exit(1);
  }
  console.log(`Tool names: ${list.length} files, every GooseWorks tool named is listed (${NAMES.source_ref}).`);
}

if (require.main === module) main();

module.exports = { lintText };
