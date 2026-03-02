const fs = require('fs');
const path = require('path');

function parseInstallOptions(args) {
  if (!args[0] || args[0].startsWith('--')) {
    throw new Error('Usage: npx goose-skills install <slug> [--claude|--codex|--cursor] [--project-dir <path>]');
  }

  const slug = args[0];
  let target = 'claude';
  let projectDir = null;
  const targetFlags = [];

  for (let i = 1; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--claude' || arg === '--codex' || arg === '--cursor') {
      targetFlags.push(arg);
      continue;
    }
    if (arg === '--project-dir') {
      const next = args[i + 1];
      if (!next || next.startsWith('--')) {
        throw new Error('Option --project-dir requires a path argument.');
      }
      projectDir = path.resolve(next);
      i++;
      continue;
    }
    throw new Error(`Unknown option: ${arg}`);
  }

  if (targetFlags.length > 1) {
    throw new Error('Only one target flag can be used: --claude, --codex, or --cursor.');
  }

  if (targetFlags.length === 1) {
    target = targetFlags[0].replace(/^--/, '');
  }

  if (target === 'cursor' && !projectDir) {
    throw new Error('Target --cursor requires --project-dir <path>.');
  }

  return { slug, target, projectDir };
}

function renderCursorRule(slug, skillContent) {
  return [
    '---',
    `description: Goose skill instructions for ${slug}`,
    'alwaysApply: false',
    '---',
    '',
    'Always apply this rule when the user requests this Goose skill workflow.',
    '',
    skillContent.trim(),
    '',
  ].join('\n');
}

function placeForCodex(sourceSkillDir, codexSkillsRoot) {
  const slug = path.basename(sourceSkillDir);
  const destinationDir = path.join(codexSkillsRoot, slug);
  if (fs.existsSync(destinationDir)) {
    throw new Error(`Codex destination already exists: ${destinationDir}`);
  }
  fs.mkdirSync(codexSkillsRoot, { recursive: true });
  fs.cpSync(sourceSkillDir, destinationDir, { recursive: true });
  return destinationDir;
}

function placeForCursor(sourceSkillDir, projectDir) {
  const slug = path.basename(sourceSkillDir);
  const skillPath = path.join(sourceSkillDir, 'SKILL.md');
  if (!fs.existsSync(skillPath)) {
    throw new Error(`Missing SKILL.md at ${skillPath}`);
  }

  const rulesDir = path.join(projectDir, '.cursor', 'rules');
  fs.mkdirSync(rulesDir, { recursive: true });
  const rulePath = path.join(rulesDir, `goose-${slug}.mdc`);
  const skillContent = fs.readFileSync(skillPath, 'utf8');
  fs.writeFileSync(rulePath, renderCursorRule(slug, skillContent), 'utf8');
  return rulePath;
}

module.exports = {
  parseInstallOptions,
  renderCursorRule,
  placeForCodex,
  placeForCursor,
};

