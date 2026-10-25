#!/usr/bin/env node

/**
 * Checks every published skill (all families: marketing, video, shared, entry)
 * as the catalog ships them.
 *
 * Each skill ships only its own folder, and an install puts skills side by side
 * (~/.agents/skills/<slug>/, the archive's agent-config/skills/<slug>/). So this
 * rebuilds that layout from skills-index.json and checks, for every published file:
 *   - every file the entry lists sits inside the skill's own folder;
 *   - every relative reference (markdown link or `./…` / `../…` path) resolves in
 *     the side-by-side layout;
 *   - a reference into another skill names a skill listed in requires_skills (or,
 *     for a playbook's step, the playbook that runs it), because only listed
 *     dependencies are delivered with the skill;
 *   - no old-layout path (`ATOM.md`, `../../atoms/…`, `foundation/…`) is left;
 *   - no goose-lab wikilink (`[[type::slug]]`): readers of this catalog cannot follow one,
 *     so name the skill in words ("the `slug` skill");
 *   - requires_skills is flat: a skill also lists what each skill it requires
 *     needs (a required playbook is not expanded).
 *
 * A backticked folder path (`./exports/`) that does not exist in the repo is a
 * folder the skill makes in the working directory, not a shipped file, so it is
 * skipped. Markdown links are always checked.
 *
 * It also checks, in every published markdown file, that a skill named in prose
 * exists: "the `x` skill" (or atom, playbook, molecule, renderer), "`x` skill",
 * and a backticked `create-…` / `render-…` name or a backticked name ending in a
 * provider (`…-fal`, `…-elevenlabs`, `…-higgsfield`…), which is how skills are
 * named. A name passes when it is a skill in the index, a retired name
 * (retired-skills.json), a video recipe (test/fixtures/entry-lint/
 * video-recipe-slugs.json), a part id (parts/<id>/), the name of a file some
 * skill ships (a harness step such as create-clips.md), or in NOT_SKILLS below.
 * A name that is none of these is a skill a reader cannot get from this
 * catalog (often one that lives only in goose-studio), so it fails.
 *
 * Last, every relative markdown link in the repo's own docs (docs/, drafts/,
 * evals/ and the top-level *.md files) resolves to a file in the repo. Fenced
 * code blocks are skipped there: they hold examples, not links.
 *
 * Usage: node scripts/check-skill-links.js   (run after build-index.js)
 */

const fs = require('fs');
const path = require('path');

const ROOT = process.env.GOOSE_SKILLS_ROOT
  ? path.resolve(process.env.GOOSE_SKILLS_ROOT)
  : path.resolve(__dirname, '..');
const index = JSON.parse(fs.readFileSync(path.join(ROOT, 'skills-index.json'), 'utf8'));
const entries = index.skills;

const errors = [];
const installed = new Set(); // "<slug>/<file>" and every parent dir
for (const e of entries) {
  installed.add(e.slug);
  for (const f of e.files) {
    if (!f.startsWith(`${e.path}/`)) {
      errors.push(`${e.slug}: lists ${f}, which is outside its folder ${e.path}/`);
      continue;
    }
    const rel = `${e.slug}/${f.slice(e.path.length + 1)}`;
    installed.add(rel);
    let d = path.posix.dirname(rel);
    while (d && d !== '.') {
      installed.add(d);
      d = path.posix.dirname(d);
    }
  }
}

const LINK = /\]\(([^)\s]+)\)/g;
const TICK = /`(\.{1,2}\/[^`\s]+)`/g;
const STALE = [/\bATOM\.md\b/, /(^|[^\w-])\.\.\/\.\.\/atoms\//, /`foundation\/(guide|data-access)/];
const PLACEHOLDER = /[<>*…]|\.\.\.|\{/;

let checked = 0;
for (const e of entries) {
  const allowed = new Set([e.slug, ...(e.metadata.requires_skills || [])]);
  if (e.metadata.playbook) allowed.add(e.metadata.playbook);
  for (const f of e.files) {
    if (!f.endsWith('.md')) continue;
    const text = fs.readFileSync(path.join(ROOT, f), 'utf8');
    const rel = `${e.slug}/${f.slice(e.path.length + 1)}`;
    for (const re of STALE) {
      const m = text.match(re);
      if (m) errors.push(`${rel}: old-layout path "${m[0].trim()}"`);
    }
    for (const m of text.matchAll(/\[\[[a-z-]+::[a-z0-9-]+\]\]/g)) {
      errors.push(`${rel}: goose-lab wikilink ${m[0]}; write "the \`${m[0].slice(2, -2).split('::')[1]}\` skill"`);
    }
    const targets = [];
    for (const m of text.matchAll(LINK)) targets.push(m[1]);
    for (const m of text.matchAll(TICK)) {
      const t = m[1];
      const inRepo = path.join(ROOT, path.dirname(f), t);
      if (t.endsWith('/') && !fs.existsSync(inRepo)) continue; // a working-directory folder
      targets.push(t);
    }
    for (let t of targets) {
      if (/^[a-z]+:/i.test(t) || t.startsWith('#') || PLACEHOLDER.test(t) || !/[./]/.test(t)) continue;
      t = t.split('#')[0].replace(/[.,;:]+$/, '');
      if (!t) continue;
      checked++;
      const resolved = path.posix.normalize(path.posix.join(path.posix.dirname(rel), t)).replace(/\/$/, '');
      if (resolved.startsWith('..') || !installed.has(resolved)) {
        errors.push(`${rel}: "${t}" does not resolve in the installed layout`);
        continue;
      }
      const target = resolved.split('/')[0];
      if (!allowed.has(target)) {
        errors.push(`${rel}: refers to the ${target} skill, which is not in requires_skills`);
      }
    }
  }
}

// Some installers deliver only one level of dependencies, so a skill also lists
// what each skill it requires needs (a required playbook is not expanded).
const bySlug = new Map(entries.map((e) => [e.slug, e]));
function needs(slug, seen = new Set()) {
  // Everything a required skill brings with it; a required playbook's own list is not expanded.
  for (const dep of bySlug.get(slug)?.metadata.requires_skills || []) {
    if (seen.has(dep)) continue;
    seen.add(dep);
    const d = bySlug.get(dep);
    if (d && d.metadata.tier !== 'playbook') needs(dep, seen);
  }
  return seen;
}
for (const e of entries) {
  const have = new Set([e.slug, ...(e.metadata.requires_skills || [])]);
  const missing = [...needs(e.slug)].filter((s) => !have.has(s)).sort();
  if (missing.length) {
    errors.push(`${e.slug}: requires_skills is not flat; also list ${missing.join(', ')}`);
  }
}

// ── Skills named in prose must exist ──────────────────────────────────────
// Names that look like skills but are not, and are fine to name. Keep it short,
// and give each a reason; a goose-studio-only skill does not belong here
// (publish it, or describe the step without the name).
const NOT_SKILLS = new Map([
  // ['example-name', 'why it is fine to name'],
]);

function readJsonIfAny(rel) {
  const p = path.join(ROOT, rel);
  return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf8')) : null;
}
const knownNames = new Set(entries.map((e) => e.slug));
for (const r of (readJsonIfAny('retired-skills.json') || {}).retired || []) knownNames.add(r.slug);
for (const r of (readJsonIfAny('test/fixtures/entry-lint/video-recipe-slugs.json') || {}).recipes || []) knownNames.add(r);
const partsDir = path.join(ROOT, 'parts');
if (fs.existsSync(partsDir)) {
  for (const d of fs.readdirSync(partsDir)) if (fs.statSync(path.join(partsDir, d)).isDirectory()) knownNames.add(d);
}
for (const e of entries) for (const f of e.files) knownNames.add(path.posix.basename(f).replace(/\.[^.]+$/, ''));

const NAME = '[a-z0-9]+(?:-[a-z0-9]+)+';
const PROVIDERS = '(?:fal|elevenlabs|higgsfield|ffmpeg|veo3|kling|gemini|openai|replicate|runway)';
const SKILL_WORD = '(?:skill|atom|playbook|molecule|renderer)s?\\b';
const NAMED = new RegExp(`\\b[Tt]he\\s+\`?(${NAME})\`?\\s+${SKILL_WORD}|\`(${NAME})\`\\s+${SKILL_WORD}`, 'g');
const SKILL_SHAPED = new RegExp(`\`((?:create|render)-[a-z0-9]+(?:-[a-z0-9]+)*|${NAME}-${PROVIDERS})\``, 'g');

let named = 0;
for (const e of entries) {
  for (const f of e.files) {
    if (!f.endsWith('.md')) continue;
    const rel = `${e.slug}/${f.slice(e.path.length + 1)}`;
    const lines = fs.readFileSync(path.join(ROOT, f), 'utf8').split('\n');
    lines.forEach((line, i) => {
      const seen = new Set();
      for (const m of [...line.matchAll(NAMED), ...line.matchAll(SKILL_SHAPED)]) {
        const name = m[1] || m[2];
        if (seen.has(name)) continue;
        seen.add(name);
        named++;
        if (knownNames.has(name) || NOT_SKILLS.has(name)) continue;
        errors.push(`${rel}:${i + 1}: names a skill "${name}" that is not in this catalog (nor retired); publish it, or describe the step without the name`);
      }
    });
  }
}

// ── Relative links in the repo's own docs resolve ─────────────────────────
const DOC_DIRS = ['docs', 'drafts', 'evals'];
const SKIP_DOC_DIRS = new Set(['node_modules', '.git', '__pycache__', '.tmp']);
function markdownUnder(rel) {
  const out = [];
  const abs = path.join(ROOT, rel);
  if (!fs.existsSync(abs)) return out;
  for (const entry of fs.readdirSync(abs, { withFileTypes: true })) {
    const child = `${rel}/${entry.name}`;
    if (entry.isDirectory()) {
      if (!SKIP_DOC_DIRS.has(entry.name)) out.push(...markdownUnder(child));
    } else if (entry.name.endsWith('.md')) out.push(child);
  }
  return out;
}
const docs = [
  ...fs.readdirSync(ROOT).filter((n) => n.endsWith('.md') && fs.statSync(path.join(ROOT, n)).isFile()),
  ...DOC_DIRS.flatMap(markdownUnder),
].sort();
let docLinks = 0;
for (const doc of docs) {
  const text = fs.readFileSync(path.join(ROOT, doc), 'utf8').replace(/^```[\s\S]*?^```/gm, '');
  for (const m of text.matchAll(LINK)) {
    let t = m[1];
    if (/^[a-z]+:/i.test(t) || t.startsWith('#') || PLACEHOLDER.test(t)) continue;
    t = t.split('#')[0].split('?')[0];
    if (!t) continue;
    docLinks++;
    const target = t.startsWith('/') ? t.slice(1) : path.posix.join(path.posix.dirname(doc), t);
    const resolved = path.posix.normalize(target);
    if (resolved.startsWith('..') || !fs.existsSync(path.join(ROOT, resolved))) {
      errors.push(`${doc}: link "${m[1]}" does not resolve in the repo`);
    }
  }
}

if (errors.length) {
  console.error(`Skill link check failed (${errors.length}):`);
  for (const msg of errors) console.error(`- ${msg}`);
  process.exit(1);
}
console.log(
  `Skill link check passed: ${entries.length} skills, ${checked} references, 0 broken; ${named} skill names, all known; ${docs.length} docs, ${docLinks} links, 0 broken.`,
);
