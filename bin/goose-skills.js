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
const { parseInstallOptions } = require('./lib/targets');
const { installSkill } = require('./lib/install');

const REPO = 'gooseworks-ai/goose-skills';
const BRANCH = 'main';
const RAW_BASE = `https://raw.githubusercontent.com/${REPO}/${BRANCH}`;

// Resolves with the response body as a Buffer: files are written byte for byte,
// so images, fonts and audio survive.
function fetch(url) {
  return new Promise((resolve, reject) => {
    const get = (u) => {
      https.get(u, { headers: { 'User-Agent': 'goose-skills-cli' } }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          res.resume();
          get(new URL(res.headers.location, u).toString());
          return;
        }
        if (res.statusCode !== 200) {
          res.resume();
          reject(new Error(`HTTP ${res.statusCode} for ${u}`));
          return;
        }
        const chunks = [];
        res.on('data', (chunk) => chunks.push(chunk));
        res.on('end', () => resolve(Buffer.concat(chunks)));
      }).on('error', reject);
    };
    get(url);
  });
}

async function fetchIndex() {
  try {
    return JSON.parse((await fetch(`${RAW_BASE}/skills-index.json`)).toString('utf8'));
  } catch (err) {
    console.error(`Failed to fetch skill index: ${err.message}`);
    console.error('Make sure you have internet access.');
    process.exit(1);
  }
}

async function listSkills() {
  const index = await fetchIndex();

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
      installSkill(options, { fetch, rawBase: RAW_BASE, home: process.env.HOME || process.env.USERPROFILE })
        .then((result) => {
          if (!result) {
            console.error(`Skill "${options.slug}" not found.`);
            console.error('Run "npx goose-skills list" to see available skills.');
            process.exit(1);
          }
          if (result.failed) process.exitCode = 1;
        })
        .catch((err) => {
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
    console.log('goose-skills — GooseWorks marketing playbooks and video skills for your coding agent\n');
    console.log('Commands:');
    console.log('  install <slug>   Install a skill and the skills it requires');
    console.log('  list             List available skills');
    console.log('  info <slug>      Show skill details');
    console.log('\nExamples:');
    console.log('  npx goose-skills list');
    console.log('  npx goose-skills install research-competitors');
    console.log('  npx goose-skills install make-static-ads --codex');
    console.log('  npx goose-skills install research-market --cursor --project-dir /path/to/project');
    break;
}
