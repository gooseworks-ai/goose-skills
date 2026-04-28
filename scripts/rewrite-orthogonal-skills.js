#!/usr/bin/env node

/**
 * Rewrite Orthogonal SKILL.md files for GooseWorks CLI proxy.
 *
 * Transforms `orth` CLI commands into `curl` calls through the GooseWorks
 * proxy endpoints, and replaces auth setup with GooseWorks credentials.
 *
 * Usage:
 *   node rewrite-orthogonal-skills.js --input ./orth-skills --output ./skills/capabilities
 *   node rewrite-orthogonal-skills.js --input ./orth-skills --dry-run
 */

const fs = require('fs');
const path = require('path');

// ---------------------------------------------------------------------------
// CLI arg parsing
// ---------------------------------------------------------------------------

function parseArgs(argv) {
  const args = { input: null, output: null, dryRun: false, force: false };
  for (let i = 2; i < argv.length; i++) {
    switch (argv[i]) {
      case '--input':
        args.input = argv[++i];
        break;
      case '--output':
        args.output = argv[++i];
        break;
      case '--dry-run':
        args.dryRun = true;
        break;
      case '--force':
        args.force = true;
        break;
      default:
        console.error(`Unknown flag: ${argv[i]}`);
        process.exit(1);
    }
  }
  if (!args.input) {
    console.error('--input <dir> is required');
    process.exit(1);
  }
  if (!args.output) {
    args.output = path.resolve(__dirname, '..', 'skills', 'capabilities');
  }
  return args;
}

// ---------------------------------------------------------------------------
// Frontmatter parsing (minimal, no dependencies)
// ---------------------------------------------------------------------------

function parseFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return { frontmatter: {}, body: content, raw: '' };

  const raw = match[1];
  const body = content.slice(match[0].length).replace(/^\r?\n/, '');
  const frontmatter = {};

  for (const line of raw.split('\n')) {
    const kv = line.match(/^(\w[\w-]*):\s*(.*)/);
    if (!kv) continue;
    let value = kv[2].trim().replace(/^['"]|['"]$/g, '');
    if (value.startsWith('[') && value.endsWith(']')) {
      value = value
        .slice(1, -1)
        .split(',')
        .map((s) => s.trim().replace(/^['"]|['"]$/g, ''));
    }
    frontmatter[kv[1]] = value;
  }

  return { frontmatter, body, raw };
}

function serializeFrontmatter(fm) {
  const lines = [];
  for (const [key, value] of Object.entries(fm)) {
    if (Array.isArray(value)) {
      lines.push(`${key}: [${value.join(', ')}]`);
    } else if (typeof value === 'string' && value.includes('\n')) {
      lines.push(`${key}: >`);
      for (const l of value.split('\n')) {
        lines.push(`  ${l}`);
      }
    } else {
      lines.push(`${key}: ${value}`);
    }
  }
  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Auth block replacement
// ---------------------------------------------------------------------------

const GOOSEWORKS_AUTH_BLOCK = `## Setup

Read your credentials from ~/.gooseworks/credentials.json:
\`\`\`bash
export GOOSEWORKS_API_KEY=$(python3 -c "import json;print(json.load(open('$HOME/.gooseworks/credentials.json'))['api_key'])")
export GOOSEWORKS_API_BASE=$(python3 -c "import json;print(json.load(open('$HOME/.gooseworks/credentials.json')).get('api_base','https://api.gooseworks.ai'))")
\`\`\`

If ~/.gooseworks/credentials.json does not exist, tell the user to run: \`npx gooseworks login\`

All endpoints use Bearer auth: \`-H "Authorization: Bearer $GOOSEWORKS_API_KEY"\``;

/**
 * Remove Orthogonal auth setup blocks and replace with GooseWorks credentials.
 */
function replaceAuthBlocks(body) {
  // Remove `orth login` instructions
  let result = body.replace(/^.*orth\s+login.*$/gm, '');

  // Remove ORTHOGONAL_API_KEY references (env var setup lines)
  result = result.replace(/^.*ORTHOGONAL_API_KEY.*$/gm, '');

  // Remove `orth` auth/setup sections (whole section if header matches)
  result = result.replace(
    /^##\s*(Auth(entication)?|Setup|Prerequisites)\s*\n([\s\S]*?)(?=^##\s|\Z)/gm,
    '',
  );

  // Insert GooseWorks auth block after the first heading
  const firstHeading = result.match(/^#\s+.+$/m);
  if (firstHeading) {
    const idx = firstHeading.index + firstHeading[0].length;
    result = result.slice(0, idx) + '\n\n' + GOOSEWORKS_AUTH_BLOCK + '\n' + result.slice(idx);
  }

  return result;
}

// ---------------------------------------------------------------------------
// Command rewriting
// ---------------------------------------------------------------------------

const CURL_HEADERS =
  '-H "Authorization: Bearer $GOOSEWORKS_API_KEY" \\\n  -H "Content-Type: application/json"';

const UNWRAPPER =
  "python3 -c \"import json,sys;d=json.load(sys.stdin);print(json.dumps(d.get('data',d)))\"";

/**
 * Parse a query string like 'k=v&k2=v2' into a JSON object string.
 */
function queryStringToJson(qs) {
  const obj = {};
  for (const pair of qs.split('&')) {
    const [k, ...rest] = pair.split('=');
    obj[k.trim()] = rest.join('=').trim();
  }
  return JSON.stringify(obj);
}

/**
 * Rewrite a single `orth run ...` command to a curl call.
 */
function rewriteOrthRun(cmd) {
  // Parse: orth run <slug> <path> [-b '<json>'] [-q 'k=v'] [| <pipe>]
  const pipeIdx = cmd.indexOf('|');
  let mainCmd = pipeIdx >= 0 ? cmd.slice(0, pipeIdx).trim() : cmd.trim();
  const pipeRest = pipeIdx >= 0 ? cmd.slice(pipeIdx + 1).trim() : null;

  // Remove `orth run` or `orth api run` prefix
  mainCmd = mainCmd.replace(/^orth\s+(?:api\s+)?run\s+/, '').trim();

  // Remove --dry-run flag
  mainCmd = mainCmd.replace(/--dry-run\s*/, '').trim();

  // Extract slug and path (first two tokens)
  const tokens = [];
  let remaining = mainCmd;

  // Parse tokens, respecting quotes
  while (remaining.length > 0) {
    remaining = remaining.trimStart();
    if (remaining.startsWith("'") || remaining.startsWith('"')) {
      const quote = remaining[0];
      const end = remaining.indexOf(quote, 1);
      if (end >= 0) {
        tokens.push(remaining.slice(1, end));
        remaining = remaining.slice(end + 1);
        continue;
      }
    }
    if (remaining.startsWith('-')) break;
    const spaceIdx = remaining.search(/\s/);
    if (spaceIdx < 0) {
      tokens.push(remaining);
      remaining = '';
    } else {
      tokens.push(remaining.slice(0, spaceIdx));
      remaining = remaining.slice(spaceIdx);
    }
  }

  const slug = tokens[0] || '';
  const apiPath = tokens[1] || '';

  // Extract -b / -d / --body (body) flag
  const bodyMatch =
    remaining.match(/(?:-b|-d|--body)\s+'([^']*)'/) ||
    remaining.match(/(?:-b|-d|--body)\s+"([^"]*)"/);
  const bodyJson = bodyMatch ? bodyMatch[1] : null;

  // Extract -q / --query (query) flag — supports 'k=v&k2=v2' and space-separated 'k=v k2=v2'
  const queryMatch =
    remaining.match(/(?:-q|--query)\s+'([^']*)'/) ||
    remaining.match(/(?:-q|--query)\s+"([^"]*)"/) ||
    remaining.match(/(?:-q|--query)\s+((?:\S+=\S+\s*)+)/);
  let queryStr = queryMatch ? queryMatch[1].trim() : null;
  // Normalize space-separated key=val pairs to &-delimited
  if (queryStr && !queryStr.includes('&') && queryStr.includes(' ')) {
    queryStr = queryStr.split(/\s+/).join('&');
  }

  // Build the JSON payload
  const payload = { api: slug, path: apiPath };
  if (bodyJson) {
    try {
      payload.body = JSON.parse(bodyJson);
    } catch {
      payload.body = bodyJson;
    }
  }
  if (queryStr) {
    try {
      payload.query = JSON.parse(queryStringToJson(queryStr));
    } catch {
      payload.query = queryStr;
    }
  }

  let curl = `curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \\\n  ${CURL_HEADERS} \\\n  -d '${JSON.stringify(payload)}'`;

  if (pipeRest) {
    curl += ` | ${UNWRAPPER} | ${pipeRest}`;
  }

  return curl;
}

/**
 * Rewrite `orth api search "<prompt>"` to a curl call.
 */
function rewriteOrthSearch(cmd) {
  const match = cmd.match(/orth\s+api\s+search\s+["']([^"']+)["']/);
  const prompt = match ? match[1] : 'search query';

  return `curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/search \\\n  ${CURL_HEADERS} \\\n  -d '${JSON.stringify({ prompt })}'`;
}

/**
 * Rewrite `orth api show <slug> <path>` to a curl call.
 */
function rewriteOrthShow(cmd) {
  const matchFull = cmd.match(/orth\s+api\s+show\s+(\S+)\s+(\/\S+)/);
  const matchSlugOnly = cmd.match(/orth\s+api\s+show\s+(\S+)/);

  if (matchFull) {
    const api = matchFull[1];
    const apiPath = matchFull[2];
    return `curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/details \\\n  ${CURL_HEADERS} \\\n  -d '${JSON.stringify({ api, path: apiPath })}'`;
  }
  // slug-only: search for that API's endpoints
  const api = matchSlugOnly ? matchSlugOnly[1] : 'api-slug';
  return `curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/search \\\n  ${CURL_HEADERS} \\\n  -d '${JSON.stringify({ prompt: `${api} API endpoints` })}'`;
}

/**
 * Rewrite all orth commands in a body string.
 */
function rewriteCommands(body) {
  // Replace orth api run / orth run commands (may span a code block line or inline)
  // Match `orth api run` first (longer match) to avoid partial replacement
  let result = body.replace(
    /orth\s+(?:api\s+)?run\s+[^\n]+/g,
    (match) => rewriteOrthRun(match),
  );

  // Replace orth api search commands
  result = result.replace(
    /orth\s+api\s+search\s+["'][^"']+["']/g,
    (match) => rewriteOrthSearch(match),
  );

  // Replace orth api show / orth api list commands (show endpoint details)
  result = result.replace(
    /orth\s+api\s+show\s+\S+(?:\s+\S+)?/g,
    (match) => rewriteOrthShow(match),
  );

  return result;
}

// ---------------------------------------------------------------------------
// Full skill rewrite
// ---------------------------------------------------------------------------

/**
 * Rewrite a single SKILL.md content string.
 * Returns the transformed content.
 */
function rewriteSkill(content) {
  const { frontmatter, body } = parseFrontmatter(content);

  // Add source marker
  frontmatter.source = 'orthogonal';

  // Rewrite commands in the body
  let newBody = rewriteCommands(body);

  // Replace auth blocks
  newBody = replaceAuthBlocks(newBody);

  // Reassemble
  return `---\n${serializeFrontmatter(frontmatter)}\n---\n\n${newBody}`;
}

/**
 * Generate a skill.meta.json for an Orthogonal skill.
 */
function generateMeta(slug, frontmatter) {
  return {
    slug,
    category: 'capabilities',
    tags: Array.isArray(frontmatter.tags) ? frontmatter.tags : [],
    source: 'orthogonal',
    installation: {
      base_command: `npx goose-skills install ${slug}`,
      supports: ['claude', 'cursor', 'codex'],
    },
  };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  const args = parseArgs(process.argv);

  if (!fs.existsSync(args.input)) {
    console.error(`Input directory not found: ${args.input}`);
    process.exit(1);
  }

  const entries = fs.readdirSync(args.input);
  let processed = 0;
  let skipped = 0;

  for (const entry of entries) {
    const entryPath = path.join(args.input, entry);
    let skillMdPath;

    if (fs.statSync(entryPath).isDirectory()) {
      skillMdPath = path.join(entryPath, 'SKILL.md');
      if (!fs.existsSync(skillMdPath)) continue;
    } else if (entry.endsWith('.md')) {
      skillMdPath = entryPath;
    } else {
      continue;
    }

    const content = fs.readFileSync(skillMdPath, 'utf8');
    const { frontmatter } = parseFrontmatter(content);
    const slug = frontmatter.slug || frontmatter.name || path.basename(entry, '.md');

    const outDir = path.join(args.output, slug);

    if (fs.existsSync(outDir) && !args.force) {
      console.log(`SKIP (exists): ${slug} → ${outDir}`);
      skipped++;
      continue;
    }

    const rewritten = rewriteSkill(content);
    const meta = generateMeta(slug, frontmatter);

    if (args.dryRun) {
      console.log(`DRY-RUN: ${slug}`);
      console.log('--- Rewritten SKILL.md ---');
      console.log(rewritten.slice(0, 500) + (rewritten.length > 500 ? '\n...' : ''));
      console.log('--- Meta ---');
      console.log(JSON.stringify(meta, null, 2));
      console.log('');
    } else {
      fs.mkdirSync(outDir, { recursive: true });
      fs.writeFileSync(path.join(outDir, 'SKILL.md'), rewritten, 'utf8');
      fs.writeFileSync(path.join(outDir, 'skill.meta.json'), JSON.stringify(meta, null, 2) + '\n', 'utf8');
      console.log(`WROTE: ${slug} → ${outDir}`);
    }

    processed++;
  }

  console.log(`\nDone. Processed: ${processed}, Skipped: ${skipped}`);
}

// ---------------------------------------------------------------------------
// Exports (for testing)
// ---------------------------------------------------------------------------

module.exports = {
  parseFrontmatter,
  serializeFrontmatter,
  replaceAuthBlocks,
  rewriteOrthRun,
  rewriteOrthSearch,
  rewriteOrthShow,
  rewriteCommands,
  rewriteSkill,
  generateMeta,
  queryStringToJson,
  parseArgs,
};

// Run if executed directly
if (require.main === module) {
  main();
}
