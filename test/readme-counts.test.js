'use strict';

// The README's catalog table states counts; this keeps them true.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const readme = fs.readFileSync(path.join(ROOT, 'README.md'), 'utf8');
const retired = JSON.parse(fs.readFileSync(path.join(ROOT, 'retired-skills.json'), 'utf8'));

const folders = (family) => fs.readdirSync(path.join(ROOT, 'skills', family), { withFileTypes: true })
  .filter((d) => d.isDirectory() && !d.name.startsWith('.')).map((d) => d.name);
const row = (family) => readme.split('\n').find((line) => line.startsWith(`| \`skills/${family}/\``));

test('each family row states its folder count', () => {
  for (const family of ['marketing', 'video', 'shared', 'entry']) {
    const line = row(family);
    assert.ok(line, `README has a row for skills/${family}/`);
    const stated = Number(line.trim().split('|').filter(Boolean).pop().trim());
    assert.equal(stated, folders(family).length, `README says ${stated} skills in skills/${family}/`);
  }
});

test('the marketing and shared rows state their inner counts', () => {
  const tiers = {};
  for (const slug of folders('marketing')) {
    const { tier } = JSON.parse(fs.readFileSync(path.join(ROOT, 'skills/marketing', slug, 'skill.meta.json'), 'utf8'));
    tiers[tier] = (tiers[tier] || 0) + 1;
  }
  const marketing = row('marketing');
  assert.match(marketing, new RegExp(`\\*\\*${tiers.playbook} marketing playbooks\\*\\*`));
  assert.match(marketing, new RegExp(`the ${tiers.atom} steps`));
  assert.match(marketing, new RegExp(`${tiers.foundation} foundation skills`));
  const shared = row('shared');
  assert.match(shared, new RegExp(`the ${retired.current_shared.length} current`));
  assert.match(shared, new RegExp(`${retired.retained.length} older skills`));
});
