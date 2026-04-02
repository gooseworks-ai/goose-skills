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

async function downloadSkillFiles(skill, installDir) {
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
      console.log(`    ${path.relative(installDir, localPath)}`);
    } catch (err) {
      console.error(`    [FAILED] ${filePath}: ${err.message}`);
    }
  }
  return downloaded;
}

async function installPack(pack, options) {
  const { target, projectDir } = options;

  console.log(`Installing pack "${pack.name}" (${pack.skills.length} skills)...\n`);

  // Download shared files once
  const sharedContents = {};
  for (const sharedPath of pack.shared_files || []) {
    const url = `${RAW_BASE}/${sharedPath}`;
    try {
      sharedContents[path.basename(sharedPath)] = await fetch(url);
    } catch (err) {
      console.error(`  [WARN] Could not fetch shared file ${sharedPath}: ${err.message}`);
    }
  }

  for (const subSkill of pack.skills) {
    const installDir = getInstallDir(subSkill.slug);
    const isRegistry = subSkill.source === 'registry';
    const label = isRegistry ? `${subSkill.slug} (registry)` : subSkill.slug;
    console.log(`  ${label} → ${installDir}`);
    fs.mkdirSync(installDir, { recursive: true });

    await downloadSkillFiles(subSkill, installDir);

    // Copy shared files into pack-local skills only (registry skills are self-contained)
    if (!isRegistry) {
      for (const [filename, content] of Object.entries(sharedContents)) {
        fs.writeFileSync(path.join(installDir, filename), content);
        console.log(`    ${filename} (shared)`);
      }
    }

    if (target === 'codex') {
      placeForCodex(installDir, getCodexSkillsRoot());
    } else if (target === 'cursor') {
      placeForCursor(installDir, projectDir);
    }
  }

  console.log(`\nInstalled ${pack.skills.length} skills from pack "${pack.name}".`);

  if (target === 'codex') {
    console.log('\nNext step (Codex):');
    console.log('  Restart Codex to pick up the new skills.');
  } else if (target === 'cursor') {
    console.log('\nNext step (Cursor):');
    console.log('  Open Cursor in that project to load the new rules.');
  } else {
    console.log(`\nNext step (Claude Code):`);
    for (const subSkill of pack.skills) {
      console.log(`  cp -r ${getInstallDir(subSkill.slug)}/SKILL.md .claude/skills/${subSkill.slug}.md`);
    }
  }
}

async function installSkill(options) {
  const { slug, target, projectDir } = options;
  const index = await fetchIndex();

  // Check packs first
  const pack = (index.packs || []).find((p) => p.slug === slug);
  if (pack) {
    return installPack(pack, options);
  }

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

  const downloaded = await downloadSkillFiles(skill, installDir);

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
  const packs = index.packs || [];

  console.log(`Available skills (${index.skills.length}) and packs (${packs.length}):\n`);

  // List packs first
  if (packs.length > 0) {
    console.log(`  PACKS (${packs.length})`);
    for (const pack of packs) {
      const desc = pack.description.length > 70
        ? pack.description.slice(0, 67) + '...'
        : pack.description;
      console.log(`    ${pack.slug.padEnd(35)} ${desc}`);
      console.log(`      Skills: ${pack.skills.map((s) => s.slug).join(', ')}`);
    }
    console.log('');
  }

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
  const pack = (index.packs || []).find((p) => p.slug === slug);

  if (!skill && !pack) {
    console.error(`Skill "${slug}" not found.`);
    process.exit(1);
  }

  if (pack) {
    const totalFiles = pack.skills.reduce((sum, s) => sum + s.files.length, 0);
    console.log(`${pack.name} (pack)`);
    console.log(`${'='.repeat(pack.name.length + 7)}`);
    console.log(`Description: ${pack.description}`);
    if (pack.tags) console.log(`Tags: ${pack.tags}`);
    console.log(`Files: ${totalFiles} across ${pack.skills.length} skills`);
    console.log(`\nSkills (${pack.skills.length}):`);
    for (const s of pack.skills) {
      const desc = s.description.length > 60
        ? s.description.slice(0, 57) + '...'
        : s.description;
      console.log(`  ${s.slug.padEnd(25)} ${desc}`);
    }
    console.log(`\nInstall all: npx goose-skills install ${pack.slug}`);
    console.log(`GitHub: https://github.com/${REPO}/tree/${BRANCH}/${pack.path}`);
    return;
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
    console.log('  install <slug>   Install a skill or skill pack');
    console.log('  list             List available skills and packs');
    console.log('  info <slug>      Show skill or pack details');
    console.log('\nExamples:');
    console.log('  npx goose-skills list');
    console.log('  npx goose-skills install reddit-scraper');
    console.log('  npx goose-skills install reddit-scraper --codex');
    console.log('  npx goose-skills install reddit-scraper --cursor --project-dir /path/to/project');
    console.log('  npx goose-skills install lead-gen-devtools          # Install a skill pack');
    break;
}
