/**
 * The entry skills (skills/entry/) are what `gooseworks install` puts in every
 * agent and what chat apps fetch first, so they carry the strictest rules:
 * real action names only, credits only, no install lines, no recipe slugs or
 * render atoms, and a size budget (scripts/lib/entry-lint.js).
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {
  CUSTOM_VIDEO_MAX_CHARS,
  ENTRY_SKILL_MAX_CHARS,
  ROUTER_MAX_CHARS,
  lintSkill,
} = require('../scripts/lib/entry-lint');

const ENTRY_DIR = path.join(__dirname, '..', 'skills', 'entry');
const ENTRY_SKILLS = ['goose-ads', 'goose-product-photos', 'goose-video', 'goose-video-local', 'gooseworks', 'make-custom-video'];
const limitFor = (name) =>
  name === 'gooseworks' ? ROUTER_MAX_CHARS : name === 'make-custom-video' ? CUSTOM_VIDEO_MAX_CHARS : ENTRY_SKILL_MAX_CHARS;

test('the entry skills are exactly the six the CLI installs', () => {
  const onDisk = fs.readdirSync(ENTRY_DIR).filter((d) => fs.existsSync(path.join(ENTRY_DIR, d, 'SKILL.md'))).sort();
  assert.deepEqual(onDisk, ENTRY_SKILLS);
});

for (const name of ENTRY_SKILLS) {
  test(`${name} passes the entry-skill lint`, () => {
    const text = fs.readFileSync(path.join(ENTRY_DIR, name, 'SKILL.md'), 'utf8');
    assert.deepEqual(lintSkill(text, { maxChars: limitFor(name) }), []);
  });
}

test('the size limit is enforced', () => {
  assert.deepEqual(lintSkill('x'.repeat(5001), { maxChars: 5000 }), ['author.size_limits: 5001 characters, over 5000']);
});

const failing = [
  ['a dollar sign', 'The full video is about $8.20.', 'money.credits_only'],
  ['a currency word', 'It costs about 8 dollars.', 'money.credits_only'],
  ['an install command', 'Run `npm install -g gooseworks` first.', 'setup.no_install'],
  ['an install request', 'Install the GooseWorks plugin, then come back.', 'setup.no_install'],
  ['an old tool name', 'Save the plan with video_project_upsert.', 'action.real_names_only'],
  ['a server-prefixed old tool name', 'Call mcp__gooseworks__video_render_run.', 'action.real_names_only'],
  ['a render atom', 'Fetch render-podcast-skit for the frames.', 'GV-43 render atom'],
  ['a recipe slug', 'Use create-podcast-skit-video-from-refs for this.', 'GV-43 recipe'],
  ['a dollar sign as an entity', 'About &#36;8 for the video.', 'money.credits_only'],
  ['a fullwidth dollar sign', 'About ＄8 for the video.', 'money.credits_only'],
  ['an install command with an entity space', 'Run npm&#32;i first.', 'setup.no_install'],
  ['a fullwidth install command', 'Run ｎｐｍ install first.', 'setup.no_install'],
  ['an old tool name with escaped underscores', 'Save it with video&#95;project&#95;upsert.', 'action.real_names_only'],
  ['an old tool name with Markdown escapes', 'Save it with video\\_project\\_upsert.', 'action.real_names_only'],
  ['an install request with a direction mark', 'Please in‎stall the plugin.', 'setup.no_install'],
  ['an install request with a soft-hyphen entity', 'Please in&shy;stall the plugin.', 'setup.no_install'],
  ['a dollar sign as a named entity', 'About &dollar;8 for the video.', 'money.credits_only'],
];
for (const [label, text, rule] of failing) {
  test(`fails on ${label}`, () => {
    assert.deepEqual([...new Set(lintSkill(text).map((problem) => problem.split(':')[0]))], [rule]);
  });
}

test('allows the rulebook saying what never to do', () => {
  assert.deepEqual(lintSkill('Money is a credit number: never dollars. Never ask for an install. Use the installed copy.'), []);
  assert.deepEqual(lintSkill('Never ask the customer to install anything.'), []);
});

test('counts a negation only when it governs the phrase', () => {
  const rules = lintSkill('No discount: pay 8 dollars and install the plugin.').map((problem) => problem.split(':')[0]);
  assert.deepEqual(rules, ['money.credits_only', 'setup.no_install']);
});
