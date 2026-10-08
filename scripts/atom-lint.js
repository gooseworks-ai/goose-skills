#!/usr/bin/env node
'use strict';

/**
 * Atom lint: what a video atom may say.
 *
 *   node scripts/atom-lint.js [--base <ref>] [--strict] [--quiet]
 *
 * Atoms hold craft (how to drive a model or a tool, and how to check the
 * piece). Prices, approvals, setup, keys and which AI app runs them belong
 * to GooseWorks, so an atom never states them. Each finding names the rule
 * it breaks; ids with a dot before the name come from the rulebook
 * (money.credits_only, money.one_price, setup.no_install, keys.never_ask,
 * action.real_names_only, author.size_limits, author.no_rule_copies), the
 * rest are atom rules (atom.no_client_names, atom.one_billing_helper,
 * model.current_ids).
 *
 * Old debt warns; new debt fails. With --base, a finding fails when the
 * branch adds it: it is in an atom the branch changed and was not there on
 * the base. Atoms listed in atom-lint/config.json strict_atoms fail on any
 * finding, so a cleaned atom stays clean. --strict fails on every finding
 * (the final switch, GV-73). Without --base nothing is compared, so only
 * strict atoms can fail.
 *
 * A true finding that is creative content (a phone mockup that draws the
 * ChatGPT app, say) is allowed in the atom's skill.meta.json:
 *   "lint_allow": [{ "rule": "...", "match": "...", "reason": "..." }]
 */

const fs = require('fs');
const path = require('path');
const lib = require('./lib/atoms');
const ACTION_NAMES = require('./atom-lint/action-names.json');

const { ROOT, CONFIG } = lib;

const PROSE_EXT = new Set(['.md', '.markdown', '.txt']);
const JSON_EXT = new Set(['.json']);
const CODE_EXT = new Set(['.py', '.js', '.mjs', '.cjs', '.ts', '.sh', '.bash']);
// Test folders are fixtures for the atom's own tests, never read by the AI.
const SKIP_SEGMENTS = new Set(['tests', 'test', '__tests__', 'fixtures']);
// Lock files and manifests are tooling, not text anyone reads.
const SKIP_FILES = new Set(['package.json', 'package-lock.json']);
// JSON keys whose string values are notes a person or the AI reads.
const JSON_TEXT_KEYS = new Set(['description', 'example_prompt', 'note', 'notes']);

function wordList(names) {
  return new RegExp(`\\b(?:${names.map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})\\b`, 'g');
}

const LIVE_ACTIONS = new Set(ACTION_NAMES.live);

/**
 * Text rules. `scope` says which file kinds a rule reads: prose (markdown),
 * json (comment and description strings) and code (scripts). Money, setup,
 * keys, approvals and app names are about text the AI reads, so code is out
 * of scope for them; old action names and model ids break code too.
 */
const TEXT_RULES = [
  {
    id: 'money.credits_only',
    what: 'a dollar amount; atoms never state a price',
    scope: ['prose', 'json'],
    patterns: [
      /(?<![\w$\\])\$\s?\d[\d,]*(?:\.\d+)?(?:\s?[kKmM]\b)?/g,
      /\b\d[\d,]*(?:\.\d+)?\s?(?:USD|dollars?|cents?)\b/g,
      /\b\d[\d,]*(?:\.\d+)?¢/g,
      /\bUSD\s?\d[\d,]*(?:\.\d+)?/g,
    ],
  },
  {
    id: 'money.one_price',
    what: 'a credit amount; every price comes from GooseWorks',
    scope: ['prose', 'json'],
    patterns: [/\b\d[\d,]*(?:\.\d+)?(?:\s?[-–]\s?\d[\d,]*(?:\.\d+)?)?\s?(?:k\s)?credits?\b/gi],
  },
  {
    id: 'author.no_rule_copies',
    what: 'approval or spend-gate text; the customer says yes once, on the card, never per call',
    scope: ['prose', 'json'],
    patterns: [
      /\b(?:ask|wait)\s+for\s+(?:the\s+)?(?:user'?s?\s+|customer'?s?\s+|operator'?s?\s+|their\s+|explicit\s+|written\s+)*(?:approval|confirmation|go-?ahead|sign-?off|permission|okay|ok|yes)\b/gi,
      /\b(?:get|obtain|request|requires?|needs?)\s+(?:the\s+)?(?:user'?s?|customer'?s?|operator'?s?|their|explicit|written)\s+(?:explicit\s+)?(?:approval|confirmation|go-?ahead|sign-?off|permission|okay|ok|yes)\b/gi,
      /\bconfirm\s+with\s+the\s+(?:user|customer|operator)\b/gi,
      /\bafter\s+(?:the\s+)?(?:user'?s?\s+|customer'?s?\s+|operator'?s?\s+|explicit\s+|written\s+)*(?:approval|confirmation|sign-?off|go-?ahead)\b/gi,
      /\bafter\s+the\s+(?:user|customer|operator)\s+(?:approves|confirms|says\s+yes|signs\s+off)\b/gi,
      /\bapprov\w*\s+(?:each|every)\s+(?:paid\s+|billable\s+)?(?:step|call|generation|render|clip|piece)\b/gi,
      /\b(?:approval|paid[- ]step|spend|cost|budget)\s+gate\b/gi,
      /\bCHOICES FIRST\b/g,
      /\(y\/n\)/gi,
    ],
  },
  {
    id: 'setup.no_install',
    what: 'an install or login line; the kit sets up the computer',
    scope: ['prose', 'json'],
    patterns: [
      /\b(?:npm|pnpm|yarn|bun)\s+(?:install|i|ci|add)\b/gi,
      /\b(?:pip3?|pipx|uv\s+pip)\s+install\b/gi,
      /\bpython3?\s+-m\s+pip\s+install\b/gi,
      /\b(?:brew|apt-get|apt|winget|choco|port)\s+install\b/gi,
      /\b(?:npx\s+(?:-y\s+)?)?playwright\s+install\b/gi,
      /\bnpx\s+(?:-y\s+)?(?:goose-skills|gooseworks)\b/gi,
      /\bgooseworks\s+(?:login|install|setup|doctor|update)\b/gi,
      /\bcurl\b[^\n|]*\|\s*(?:ba|z)?sh\b/gi,
      /\binstall\s+(?:claude code|codex|cursor|node(?:\.js)?|ffmpeg|ffprobe|python|chromium|playwright|homebrew)\b/gi,
      /\b(?:log|sign)\s?in\s+(?:to|with)\s+(?:gooseworks|fal|elevenlabs|higgsfield)\b/gi,
    ],
  },
  {
    id: 'keys.never_ask',
    what: 'asks for or sets a provider key; GooseWorks holds every key',
    scope: ['prose', 'json'],
    patterns: [
      /\bexport\s+[A-Z][A-Z0-9_]*_(?:KEY|TOKEN|SECRET)\b/g,
      /\b[A-Z][A-Z0-9_]*_(?:KEY|TOKEN|SECRET)=\S/g,
      /\bset\s+(?:your\s+)?[A-Z][A-Z0-9_]*_(?:KEY|TOKEN|SECRET)\b/g,
      /\b(?:ask|prompt)\s+(?:the\s+)?(?:user|customer|operator|them)\s+(?:for|to\s+(?:paste|provide|enter|share))\s+(?:an?\s+|their\s+|the\s+|your\s+)?(?:[\w-]+\s+){0,2}(?:key|token|password|secret)\b/gi,
      /\b(?:get|create|grab|obtain)\s+(?:an?\s+|your\s+)?(?:[\w-]+\s+)?api\s+key\b/gi,
    ],
  },
  {
    id: 'atom.no_client_names',
    what: 'names an AI app; an atom works the same in every app',
    scope: ['prose', 'json'],
    patterns: [/\b(?:Claude(?:\s+(?:Code|Desktop))?|claude\.ai|ChatGPT|Codex|Cursor)\b/g],
  },
  {
    id: 'action.real_names_only',
    what: 'names a removed action; name only actions that exist today',
    scope: ['prose', 'json', 'code'],
    patterns: [wordList(ACTION_NAMES.removed)],
    // mcp__<gooseworks server>__<action> must also be a live action. Other
    // servers' tools are not ours to check.
    extra: (line) => {
      const hits = [];
      for (const m of line.matchAll(/\bmcp__([a-z0-9-]*goose[a-z0-9-]*)__([a-z][a-z0-9_]*)\b/g)) {
        if (!LIVE_ACTIONS.has(m[2])) hits.push({ match: m[0], index: m.index });
      }
      return hits;
    },
  },
  {
    id: 'model.current_ids',
    what: 'a model id the proxy refuses or that is retired',
    scope: ['prose', 'json', 'code'],
    patterns: [/\bfal-ai\/nano-banana-2\b/g, /\bkling-video\/v2\.1\b/gi, /\bKling\s?v?2\.1\b/g],
  },
];

const RULE_IDS = new Set([
  ...TEXT_RULES.map((r) => r.id),
  'atom.one_billing_helper',
  'author.size_limits',
]);

const WHAT = Object.fromEntries(TEXT_RULES.map((r) => [r.id, r.what]));
WHAT['atom.one_billing_helper'] = `a full copy of the billing helper; keep the one copy in ${CONFIG.billing_helper.home}`;
WHAT['author.size_limits'] = 'over the size limit';
WHAT['atom.lint_allow'] = 'a lint_allow entry needs a known rule, a match and a reason';

function fileKind(relInAtom) {
  const parts = relInAtom.split('/');
  if (parts.slice(0, -1).some((p) => SKIP_SEGMENTS.has(p))) return null;
  const base = parts[parts.length - 1];
  if (SKIP_FILES.has(base)) return null;
  const ext = path.extname(base).toLowerCase();
  if (PROSE_EXT.has(ext)) return 'prose';
  if (JSON_EXT.has(ext)) return 'json';
  if (CODE_EXT.has(ext)) return 'code';
  return null;
}

function scanLines(text, rules, kind, file, out) {
  const lines = text.split(/\r?\n/);
  for (const rule of rules) {
    if (!rule.scope.includes(kind)) continue;
    lines.forEach((line, i) => {
      const hits = [];
      for (const re of rule.patterns) {
        re.lastIndex = 0;
        for (const m of line.matchAll(re)) hits.push({ match: m[0], index: m.index });
      }
      if (rule.extra) hits.push(...rule.extra(line));
      // One finding per stretch of text: when two patterns of a rule overlap
      // ("python3 -m pip install" and "pip install"), keep the longer one.
      hits.sort((a, b) => a.index - b.index || b.match.length - a.match.length);
      let end = -1;
      for (const hit of hits) {
        if (hit.index < end) continue;
        end = hit.index + hit.match.length;
        out.push({ rule: rule.id, file, line: i + 1, match: hit.match.trim() });
      }
    });
  }
}

/** Strings a person or the AI reads inside a JSON file, with their line. */
function jsonTexts(raw) {
  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    return [];
  }
  const texts = [];
  const visit = (value, key) => {
    if (typeof value === 'string') {
      if (key && (key.startsWith('_') || JSON_TEXT_KEYS.has(key))) texts.push(value);
    } else if (Array.isArray(value)) {
      for (const v of value) visit(v, key);
    } else if (value && typeof value === 'object') {
      for (const [k, v] of Object.entries(value)) visit(v, k);
    }
  };
  visit(data, null);
  return texts.map((text) => {
    const probe = JSON.stringify(text).slice(1, 41);
    const at = raw.indexOf(probe);
    const line = at < 0 ? 1 : raw.slice(0, at).split('\n').length;
    return { text, line };
  });
}

/**
 * Findings for one atom. `files` is [{ path, bytes: Buffer }] with repo paths.
 */
function lintAtom(atom, files) {
  const findings = [];
  for (const { path: file, bytes } of files) {
    const rel = file.slice(atom.dir.length + 1);
    const base = path.posix.basename(rel);

    if (base === CONFIG.billing_helper.file && atom.slug !== CONFIG.billing_helper.home) {
      if (bytes.length > CONFIG.billing_helper.shim_max_bytes) {
        findings.push({ rule: 'atom.one_billing_helper', file, line: 1, match: `${base} copy` });
      }
    }

    const kind = fileKind(rel);
    if (!kind) continue;
    const text = bytes.toString('utf8');

    if (kind === 'prose' && path.extname(base).toLowerCase() !== '.txt') {
      const limit = rel === 'SKILL.md' ? CONFIG.limits.skill_md_bytes : CONFIG.limits.other_md_bytes;
      if (bytes.length > limit) {
        findings.push({
          rule: 'author.size_limits',
          file,
          line: 1,
          match: `${bytes.length} bytes, limit ${limit}`,
          bytes: bytes.length,
        });
      }
    }

    if (kind === 'json') {
      for (const { text: t, line } of jsonTexts(text)) {
        const local = [];
        scanLines(t, TEXT_RULES, 'json', file, local);
        for (const f of local) findings.push({ ...f, line: line + f.line - 1 });
      }
    } else {
      scanLines(text, TEXT_RULES, kind, file, findings);
    }
  }
  return findings;
}

function headFiles(atom) {
  return lib.listFiles(ROOT, atom.dir).map((p) => ({ path: p, bytes: fs.readFileSync(path.join(ROOT, p)) }));
}

function baseFiles(base, atom) {
  return lib
    .listFilesAt(ROOT, base, atom.dir)
    .map((p) => ({ path: p, bytes: lib.readAt(ROOT, base, p) }))
    .filter((f) => f.bytes !== null);
}

/** Validates lint_allow and returns [allows, problems]. */
function readAllows(atom, meta) {
  const allows = [];
  const problems = [];
  const list = meta ? meta.lint_allow : undefined;
  if (list === undefined) return [allows, problems];
  if (!Array.isArray(list)) {
    problems.push({ rule: 'atom.lint_allow', file: `${atom.dir}/skill.meta.json`, line: 1, match: 'lint_allow must be a list' });
    return [allows, problems];
  }
  for (const entry of list) {
    const ok =
      entry &&
      RULE_IDS.has(entry.rule) &&
      typeof entry.match === 'string' &&
      entry.match.trim() &&
      typeof entry.reason === 'string' &&
      entry.reason.trim();
    if (ok) allows.push(entry);
    else problems.push({ rule: 'atom.lint_allow', file: `${atom.dir}/skill.meta.json`, line: 1, match: JSON.stringify(entry) });
  }
  return [allows, problems];
}

function isAllowed(finding, allows) {
  return allows.some(
    (a) =>
      a.rule === finding.rule &&
      finding.match.includes(a.match) &&
      (!a.file || finding.file.endsWith(`/${a.file}`)),
  );
}

/** Marks each head finding new when the base did not have it. */
function markNew(head, base) {
  const counts = new Map();
  const sizeOnBase = new Map();
  for (const f of base) {
    if (f.rule === 'author.size_limits') {
      sizeOnBase.set(f.file, f.bytes);
      continue;
    }
    const key = `${f.rule}\0${f.file}\0${f.match}`;
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  for (const f of head) {
    if (f.rule === 'author.size_limits') {
      // A file already over the limit may shrink, never grow.
      f.isNew = !sizeOnBase.has(f.file) || f.bytes > sizeOnBase.get(f.file);
      continue;
    }
    const key = `${f.rule}\0${f.file}\0${f.match}`;
    const left = counts.get(key) || 0;
    if (left > 0) {
      counts.set(key, left - 1);
      f.isNew = false;
    } else {
      f.isNew = true;
    }
  }
}

function parseArgs(argv) {
  const args = { base: null, strict: false, quiet: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--base') args.base = argv[++i];
    else if (a.startsWith('--base=')) args.base = a.slice(7);
    else if (a === '--strict') args.strict = true;
    else if (a === '--quiet') args.quiet = true;
    else throw new Error(`unknown argument ${a}`);
  }
  return args;
}

function run(argv) {
  const args = parseArgs(argv);
  const base = lib.resolveBase(ROOT, args.base);
  const changed = base ? lib.changedFiles(ROOT, base) : new Set();
  const atoms = lib.listAtoms(ROOT);
  const strictAtoms = new Set(CONFIG.strict_atoms);

  const results = [];
  let allowed = 0;
  for (const atom of atoms) {
    const meta = lib.readMeta(ROOT, atom.dir);
    const [allows, problems] = readAllows(atom, meta);
    const head = lintAtom(atom, headFiles(atom)).filter((f) => {
      if (isAllowed(f, allows)) {
        allowed++;
        return false;
      }
      return true;
    });
    const touched = base && [...changed].some((p) => p.startsWith(`${atom.dir}/`));
    if (touched) markNew(head, lintAtom(atom, baseFiles(base, atom)));
    for (const f of [...problems, ...head]) {
      const fails = args.strict || strictAtoms.has(atom.slug) || f.rule === 'atom.lint_allow' || f.isNew === true;
      results.push({ ...f, atom: atom.slug, severity: fails ? 'error' : 'warning' });
    }
  }
  return { results, allowed, atoms, base };
}

function report({ results, allowed, atoms, base }, quiet) {
  const errors = results.filter((r) => r.severity === 'error');
  const warnings = results.filter((r) => r.severity === 'warning');
  const line = (r) => `${r.severity} ${r.rule}: ${WHAT[r.rule]} ${r.file}:${r.line} "${r.match}"`;

  for (const r of errors) {
    console.error(line(r));
    if (process.env.GITHUB_ACTIONS) {
      console.log(`::error file=${r.file},line=${r.line}::${r.rule}: ${WHAT[r.rule]} ("${r.match}")`);
    }
  }
  if (!quiet) for (const r of warnings) console.log(line(r));

  const byRule = new Map();
  for (const r of results) {
    const row = byRule.get(r.rule) || { error: 0, warning: 0 };
    row[r.severity]++;
    byRule.set(r.rule, row);
  }
  const shared = new Set(CONFIG.shared_atoms);
  const sharedCounts = new Map();
  for (const r of results) if (shared.has(r.atom)) sharedCounts.set(r.atom, (sharedCounts.get(r.atom) || 0) + 1);

  const summary = [
    `Atom lint: ${atoms.length} atoms, ${errors.length} errors, ${warnings.length} warnings, ${allowed} allowed${base ? `, compared with ${base.slice(0, 9)}` : ', no base (old debt only warns)'}.`,
    '',
    '| Rule | Errors | Warnings |',
    '|---|---:|---:|',
    ...[...byRule.entries()].sort().map(([rule, c]) => `| ${rule} | ${c.error} | ${c.warning} |`),
    '',
    `Shared atoms with findings: ${
      [...sharedCounts.entries()].sort().map(([slug, n]) => `${slug} ${n}`).join(', ') || 'none'
    }.`,
  ].join('\n');
  console.log(`\n${summary}`);
  if (process.env.GITHUB_STEP_SUMMARY) {
    fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${summary}\n\n`);
  }
  return errors.length;
}

if (require.main === module) {
  let errorCount;
  try {
    const args = parseArgs(process.argv.slice(2));
    errorCount = report(run(process.argv.slice(2)), args.quiet);
  } catch (err) {
    console.error(`atom-lint: ${err.message}`);
    process.exit(2);
  }
  process.exit(errorCount > 0 ? 1 : 0);
}

module.exports = { lintAtom, markNew, TEXT_RULES };
