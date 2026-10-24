#!/usr/bin/env node

/**
 * Keep GooseWorks routing in one place: skills/entry/gooseworks/routes.json.
 *
 * Rewrites, from that file:
 *   - the "Skill routes" and "Marketing playbooks" tables in
 *     skills/entry/gooseworks/SKILL.md (the router every install gets), and
 *   - collections/brand-growth/routes.json (the collection's view of it).
 *
 *   node scripts/build-router.js           write both
 *   node scripts/build-router.js --check   exit 1 when either is stale (CI)
 */

const fs = require('fs');
const path = require('path');

const ROOT = process.env.GOOSE_SKILLS_ROOT
  ? path.resolve(process.env.GOOSE_SKILLS_ROOT)
  : path.resolve(__dirname, '..');
const ROUTER_DIR = path.join(ROOT, 'skills', 'entry', 'gooseworks');
const SOURCE = path.join(ROUTER_DIR, 'routes.json');
const ROUTER = path.join(ROUTER_DIR, 'SKILL.md');
const COLLECTION_ROUTES = path.join(ROOT, 'collections', 'brand-growth', 'routes.json');

const routes = JSON.parse(fs.readFileSync(SOURCE, 'utf8'));

const domainRows = routes.domain_routes.map((r) => `| ${r.when} | **\`${r.skill}\`** | ${r.how} |`);
const playbookRows = routes.brand_growth_routes.map(
  (r) => `| ${r.job} | ${r.skills.map((s) => `\`${s}\``).join(', ')} |`,
);

/** Replace the body rows of the first table under `heading`, keeping rows that match `keep`. */
function replaceTableRows(text, heading, rows, keep = () => false) {
  const lines = text.split('\n');
  const start = lines.indexOf(heading);
  if (start < 0) throw new Error(`${path.relative(ROOT, ROUTER)} has no "${heading}" section`);
  const sep = lines.findIndex((l, i) => i > start && /^\| ?-+/.test(l));
  if (sep < 0) throw new Error(`No table under "${heading}"`);
  let end = sep + 1;
  while (end < lines.length && lines[end].startsWith('|')) end++;
  const kept = lines.slice(sep + 1, end).filter(keep);
  lines.splice(sep + 1, end - sep - 1, ...rows, ...kept);
  return lines.join('\n');
}

let router = fs.readFileSync(ROUTER, 'utf8');
router = replaceTableRows(router, '## Skill routes', domainRows, (l) => l.includes('(stay here)'));
router = replaceTableRows(router, '## Marketing playbooks', playbookRows);

const brandGrowthSkills = [...new Set(routes.brand_growth_routes.flatMap((r) => r.skills))].sort();
const entrySkills = fs
  .readdirSync(path.join(ROOT, 'skills', 'entry'))
  .filter((d) => fs.existsSync(path.join(ROOT, 'skills', 'entry', d, 'SKILL.md')))
  .sort();
const collectionRoutes = `${JSON.stringify({
  $comment:
    'DERIVED by scripts/build-router.js from skills/entry/gooseworks/routes.json, the single source for GooseWorks routing. Do not hand-edit.',
  source: { file: 'skills/entry/gooseworks/routes.json' },
  route_table_version: routes.version,
  $comment_entry_skills:
    'Installed into every agent by `gooseworks install`; they are the entry points into this collection, not members of it.',
  entry_skills: entrySkills,
  brand_growth_routes: routes.brand_growth_routes,
  brand_growth_skills: brandGrowthSkills,
}, null, 2)}\n`;

const outputs = [
  [ROUTER, router],
  [COLLECTION_ROUTES, collectionRoutes],
];

if (process.argv.includes('--check')) {
  const stale = outputs.filter(([file, text]) => fs.readFileSync(file, 'utf8') !== text);
  if (stale.length) {
    console.error(
      `Routing is stale in ${stale.map(([f]) => path.relative(ROOT, f)).join(' and ')}. ` +
        'Edit skills/entry/gooseworks/routes.json, then run `node scripts/build-router.js`.',
    );
    process.exit(1);
  }
  console.log('Routing is in sync with skills/entry/gooseworks/routes.json.');
} else {
  for (const [file, text] of outputs) fs.writeFileSync(file, text);
  console.log('Wrote the router tables and collections/brand-growth/routes.json.');
}
