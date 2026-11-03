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
 *   - a snake_case name phrased as a tool call in text an agent reads and not listed
 *     or in `other_tools` (tools of other servers, with the reason):
 *     "call <name>" (any case), "<name> tool", and, for a name that starts like a
 *     GooseWorks tool (brand_, ads_, video_…), "use/run/invoke <name>", <name>( and a
 *     backticked name alone in a table cell
 *   - a one-word old name (`whoami`) in backticks
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
const NOT_TOOLS = new Set(Object.keys(NAMES.not_tools ?? {}));

const TEXT = /\.(md|markdown|txt|json|ya?ml|py|js|mjs|cjs|ts|sh|html)$/i;
// "call x" and "x tool" read as tool calls only in text an agent reads, not in code.
const PROSE = /\.(md|markdown|txt|html)$/i;
// Test folders are fixtures for a skill's own tests; nobody's agent reads them as instructions.
const SKIP_SEGMENTS = new Set(['tests', 'test', '__tests__', 'fixtures', 'node_modules']);
const SKIP_FILES = new Set(['package-lock.json']);

const WORD = /\b[a-z][a-z0-9]*(?:_[a-z0-9]+)+\b/g;
// Any MCP server name with "goose" in it, as hosts spell it (mcp__gooseworks__, mcp__claude_ai_GooseWorks__).
const PREFIXED = /\b(?:gooseworks:|mcp__\w*?goose\w*?__)([a-z][a-z0-9_]*)\b/gi;
const SNAKE = '([a-z][a-z0-9]*(?:_[a-z0-9]+)+)';
// The first word of every listed tool, minus verbs a script's own functions start with too.
const GENERIC_HEADS = new Set(['add', 'get', 'update', 'request', 'propose', 'prepare', 'pause', 'revert', 'refresh']);
const TOOL_HEADS = new Set(NAMES.actions.map((n) => n.split('_')[0]).filter((h) => !GENERIC_HEADS.has(h)));
const TOOL_CONTEXT = [
  new RegExp(`\\bcall(?:s|ing|ed)?\\s+\`?${SNAKE}\`?`, 'gi'),
  new RegExp(`\`?${SNAKE}\`?\\s+tools?\\b`, 'g'),
];
// Only for names that start like a GooseWorks tool: script functions use these forms too.
const TOOL_SHAPED = [
  new RegExp(`\\b(?:use|uses|using|run|runs|invoke|invokes)\\s+\`${SNAKE}\``, 'gi'),
  new RegExp(`\`?\\b${SNAKE}\`?\\(`, 'g'),
  new RegExp(`\\|\\s*\`${SNAKE}\`\\s*(?=\\|)`, 'g'),
];
const ONE_WORD = Object.keys(NAMES.renamed).filter((n) => !n.includes('_'));
const ONE_WORD_TICKED = ONE_WORD.length ? new RegExp(`\`(${ONE_WORD.join('|')})\``, 'g') : null;

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
      if (!LISTED.has(name) && !OTHER.has(name) && !RENAMED[name] && !REMOVED.has(name)) problems.push({ at, name, why: 'not a listed GooseWorks tool' });
    }
    const unknown = (name) => name === name.toLowerCase() && !LISTED.has(name) && !OTHER.has(name)
      && !NOT_TOOLS.has(name) && !RENAMED[name] && !REMOVED.has(name);
    const seen = new Set();
    const flag = (name) => {
      if (seen.has(name) || !unknown(name)) return;
      seen.add(name);
      problems.push({ at, name, why: 'named as a tool but not listed (add it to other_tools with a reason if it is another server\'s)' });
    };
    if (prose) {
      for (const re of TOOL_CONTEXT) {
        for (const m of line.matchAll(re)) {
          // "Call `load_fal_key()`": a script's function, unless it is named like a GooseWorks tool.
          const fn = line.slice(m.index + m[0].length).startsWith('(') || line.slice(m.index + m[0].length - 1).startsWith('(');
          if (fn && !TOOL_HEADS.has(m[1].split('_')[0])) continue;
          flag(m[1]);
        }
      }
      for (const re of TOOL_SHAPED) {
        for (const m of line.matchAll(re)) if (TOOL_HEADS.has(m[1].split('_')[0])) flag(m[1]);
      }
    }
    if (ONE_WORD_TICKED) {
      for (const m of line.matchAll(ONE_WORD_TICKED)) problems.push({ at, name: m[1], why: `renamed; use ${RENAMED[m[1]]}` });
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
  console.log(`Tool names: ${list.length} files, no old, hidden or unlisted GooseWorks tool names found (${NAMES.source_ref}).`);
}

if (require.main === module) main();

module.exports = { lintText };
