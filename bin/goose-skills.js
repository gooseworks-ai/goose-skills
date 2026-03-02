#!/usr/bin/env node

/**
 * goose-skills CLI
 *
 * Install Claude Code skills from the goose-skills registry.
 *
 * Usage:
 *   npx goose-skills install <slug> [--claude|--codex|--cursor] [--project-dir <path>]
 *   npx goose-skills list             # List available skills
 *   npx goose-skills info <slug>      # Show skill details
 */

const https = require('https');
const fs = require('fs');
const path = require('path');
const {
  parseInstallOptions,
  placeForCodex,
  placeForCursor,
} = require('./lib/targets');

const REPO = 'athina-ai/goose-skills';
const BRANCH = 'main';
const RAW_BASE = `https://raw.githubusercontent.com/${REPO}/${BRANCH}`;
const INDEX_URL = `${RAW_BASE}/skills-index.json`;

function fetch(url) {
  return new Promise((resolve, reject) => {
    const get = (u) => {
      https.get(u, { headers: { 'User-Agent': 'goose-skills-cli' } }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          get(res.headers.location);
          return;
        }
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode} for ${u}`));
          return;
        }
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => resolve(data));
      }).on('error', reject);
    };
    get(url);
  });
}

async function fetchIndex() {
  try {
    const data = await fetch(INDEX_URL);
    return JSON.parse(data);
  } catch (err) {
    console.error(`Failed to fetch skill index: ${err.message}`);
    console.error('Make sure you have internet access.');
    process.exit(1);
  }
}

function getInstallDir(slug) {
  const home = process.env.HOME || process.env.USERPROFILE;
  return path.join(home, '.claude', 'skills', slug);
}

function getCodexSkillsRoot() {
  const home = process.env.HOME || process.env.USERPROFILE;
  return path.join(home, '.codex', 'skills');
}

async function installSkill(options) {
  const { slug, target, projectDir } = options;
  const index = await fetchIndex();
  const skill = index.skills.find((s) => s.slug === slug);

  if (!skill) {
    console.error(`Skill "${slug}" not found.`);
    console.error(`Run "npx goose-skills list" to see available skills.`);
    process.exit(1);
  }

  const installDir = getInstallDir(slug);
  console.log(`Installing ${skill.name} to ${installDir}...`);

  // Create install directory
  fs.mkdirSync(installDir, { recursive: true });

  // Download each file
  let downloaded = 0;
  for (const filePath of skill.files) {
    const url = `${RAW_BASE}/${filePath}`;
    const localPath = path.join(installDir, path.relative(skill.path, filePath));
    const localDir = path.dirname(localPath);

    fs.mkdirSync(localDir, { recursive: true });

    try {
      const content = await fetch(url);
      fs.writeFileSync(localPath, content);
      downloaded++;
      console.log(`  ${path.relative(installDir, localPath)}`);
    } catch (err) {
      console.error(`  [FAILED] ${filePath}: ${err.message}`);
    }
  }

  console.log(`\nInstalled ${downloaded}/${skill.files.length} files.`);
  console.log(`Primary location: ${installDir}`);

  if (target === 'codex') {
    const codexDir = placeForCodex(installDir, getCodexSkillsRoot());
    console.log(`Codex location: ${codexDir}`);
    console.log('\nNext step (Codex):');
    console.log('  Restart Codex to pick up the new skill.');
    return;
  }

  if (target === 'cursor') {
    const cursorRule = placeForCursor(installDir, projectDir);
    console.log(`Cursor rule: ${cursorRule}`);
    console.log('\nNext step (Cursor):');
    console.log('  Open Cursor in that project so it can load the new rule.');
    return;
  }

  console.log(`\nNext step (Claude Code):`);
  console.log(`  cp -r ${installDir}/SKILL.md .claude/skills/${slug}.md`);
  console.log(`  # Or reference directly: ${installDir}/SKILL.md`);
}

async function listSkills() {
  const index = await fetchIndex();
  const maxName = Math.max(...index.skills.map((s) => s.name.length));

  console.log(`Available skills (${index.skills.length}):\n`);

  const categories = {};
  for (const skill of index.skills) {
    if (!categories[skill.category]) categories[skill.category] = [];
    categories[skill.category].push(skill);
  }

  for (const [cat, skills] of Object.entries(categories)) {
    console.log(`  ${cat.toUpperCase()} (${skills.length})`);
    for (const skill of skills) {
      const desc = skill.description.length > 70
        ? skill.description.slice(0, 67) + '...'
        : skill.description;
      console.log(`    ${skill.slug.padEnd(35)} ${desc}`);
    }
    console.log('');
  }

  console.log(`Install: npx goose-skills install <slug>`);
}

async function showInfo(slug) {
  const index = await fetchIndex();
  const skill = index.skills.find((s) => s.slug === slug);

  if (!skill) {
    console.error(`Skill "${slug}" not found.`);
    process.exit(1);
  }

  console.log(`${skill.name}`);
  console.log(`${'='.repeat(skill.name.length)}`);
  console.log(`Category: ${skill.category}`);
  console.log(`Description: ${skill.description}`);
  if (skill.tags) console.log(`Tags: ${skill.tags}`);
  console.log(`Files: ${skill.files.length}`);
  console.log(`\nInstall: npx goose-skills install ${skill.slug}`);
  console.log(`GitHub: https://github.com/${REPO}/tree/${BRANCH}/${skill.path}`);
}

// CLI routing
const [,, command, ...args] = process.argv;

switch (command) {
  case 'install':
    try {
      const options = parseInstallOptions(args);
      installSkill(options).catch((err) => {
        console.error(err.message);
        process.exit(1);
      });
    } catch (err) {
      console.error(err.message);
      console.error('Usage: npx goose-skills install <slug> [--claude|--codex|--cursor] [--project-dir <path>]');
      process.exit(1);
    }
    break;
  case 'list':
    listSkills();
    break;
  case 'info':
    if (!args[0]) {
      console.error('Usage: npx goose-skills info <slug>');
      process.exit(1);
    }
    showInfo(args[0]);
    break;
  default:
    console.log('goose-skills — GTM skills for Claude Code\n');
    console.log('Commands:');
    console.log('  install <slug>   Install a skill');
    console.log('  list             List available skills');
    console.log('  info <slug>      Show skill details');
    console.log('\nExamples:');
    console.log('  npx goose-skills list');
    console.log('  npx goose-skills install reddit-scraper');
    console.log('  npx goose-skills install reddit-scraper --codex');
    console.log('  npx goose-skills install reddit-scraper --cursor --project-dir /path/to/project');
    break;
}
