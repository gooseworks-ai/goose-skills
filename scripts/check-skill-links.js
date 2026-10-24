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
 *   - requires_skills is flat: a skill also lists what each skill it requires
 *     needs (a required playbook is not expanded).
 *
 * A backticked folder path (`./exports/`) that does not exist in the repo is a
 * folder the skill makes in the working directory, not a shipped file, so it is
 * skipped. Markdown links are always checked.
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

if (errors.length) {
  console.error(`Skill link check failed (${errors.length}):`);
  for (const msg of errors) console.error(`- ${msg}`);
  process.exit(1);
}
console.log(
  `Skill link check passed: ${entries.length} skills, ${checked} references, 0 broken.`,
);
