#!/usr/bin/env node
/**
 * render.js — entry point for the create-imessage-mockup skill.
 *
 *   node render.js --thread <path.json>          [--minimal|--with-keyboard|--with-iphone-frame] \
 *                  [--dm|--group] [--name slug] [--output ./imessage-mockup-exports/]
 *   node render.js --prompt "<freeform brief>"  [...]
 *
 * --prompt mode is a thin convenience wrapper: it prints a JSON schema doc and
 * exits with a non-zero code, asking the calling agent to compose a thread JSON
 * itself. The skill is deliberately deterministic and does not embed an LLM.
 */

const fs = require('fs');
const path = require('path');
const { renderHTML } = require('./generate');
const { capture } = require('./screenshot');

function parseArgs(argv) {
  const args = { mode: null, modeFlag: null };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    switch (a) {
      case '--thread':       args.thread = argv[++i]; break;
      case '--prompt':       args.prompt = argv[++i]; break;
      case '--output':       args.output = argv[++i]; break;
      case '--name':         args.name   = argv[++i]; break;
      case '--minimal':            args.modeFlag = 'minimal'; break;
      case '--with-keyboard':      args.modeFlag = 'with-keyboard'; break;
      case '--with-iphone-frame':  args.modeFlag = 'with-iphone-frame'; break;
      case '--dm':           args.forceMode = 'dm'; break;
      case '--group':        args.forceMode = 'group'; break;
      case '-h':
      case '--help':         args.help = true; break;
      default:
        // ignore unknown flags rather than failing the orchestration
        break;
    }
  }
  return args;
}

const HELP = `
create-imessage-mockup — render a pixel-accurate iMessage screenshot.

Usage:
  node render.js --thread <path.json>     [--minimal|--with-keyboard|--with-iphone-frame]
                                          [--dm|--group] [--name slug] [--output dir]
  node render.js --prompt "<brief>"       (prints JSON schema, agent must compose thread.json)

Frame flags (mutually exclusive, default --with-keyboard):
  --minimal             chat bubbles only, no header, no keyboard, no frame
  --with-keyboard       header + bubbles + iOS keyboard chrome
  --with-iphone-frame   full iPhone 15 Pro bezel + Dynamic Island + status bar

Output:
  default → ./imessage-mockup-exports/<YYYY-MM-DD>-<slug>/index.html + screenshot.png
  override with --output <dir>
`;

const SCHEMA_DOC = `
This skill is deterministic — it does not call an LLM. To use --prompt, the
orchestrating agent must translate the brief into a thread.json matching:

{
  "mode": "dm" | "group",
  "title": "Karaoke Crew",                          // group only
  "participants": [
    { "id": "me",    "name": "Me",     "self": true },
    { "id": "sarah", "name": "Sarah",  "color": "#FF9500", "initials": "S" }
  ],
  "messages": [
    { "type": "timestamp", "label": "iMessage\\nToday 9:41 AM" },
    { "type": "text",      "from": "sarah", "text": "Did we crash it?" },
    { "type": "text",      "from": "me",    "text": "Couldn't withstand our friendship", "delivered": true },
    { "type": "typing",    "from": "sarah" }
  ],
  "keyboard": { "leftIcon": "plus" | "camera" }     // optional
}

Save it to a path and re-invoke with --thread <path>.
`.trimStart();

function slugify(s) {
  return (s || 'mockup')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 40) || 'mockup';
}

function pickFirstText(thread) {
  const t = (thread.messages || []).find(m => m.type === 'text');
  return t ? t.text : null;
}

async function main() {
  const args = parseArgs(process.argv);

  if (args.help) {
    console.log(HELP);
    return;
  }

  if (args.prompt && !args.thread) {
    console.error(SCHEMA_DOC);
    console.error(`\nReceived --prompt: "${args.prompt.slice(0, 120)}${args.prompt.length > 120 ? '…' : ''}"`);
    console.error(`Compose a thread.json matching the schema above, then re-run with --thread <path>.`);
    process.exit(2);
  }

  if (!args.thread) {
    console.error(HELP);
    process.exit(1);
  }

  const threadPath = path.resolve(args.thread);
  if (!fs.existsSync(threadPath)) {
    console.error(`Thread file not found: ${threadPath}`);
    process.exit(1);
  }
  const thread = JSON.parse(fs.readFileSync(threadPath, 'utf-8'));

  // Force mode if --dm or --group specified
  if (args.forceMode) thread.mode = args.forceMode;
  // Auto-detect mode if missing
  if (!thread.mode) {
    const others = (thread.participants || []).filter(p => !p.self);
    thread.mode = others.length > 1 ? 'group' : 'dm';
  }

  const mode = args.modeFlag || 'with-keyboard';

  const today = new Date().toISOString().slice(0, 10);
  const slug = slugify(args.name || pickFirstText(thread) || 'mockup');
  const outDir = args.output
    ? path.resolve(args.output, `${today}-${slug}`)
    : path.resolve(process.cwd(), 'imessage-mockup-exports', `${today}-${slug}`);

  fs.mkdirSync(outDir, { recursive: true });
  const htmlPath = path.join(outDir, 'index.html');
  const pngPath = path.join(outDir, 'screenshot.png');

  const html = renderHTML(thread, { mode });
  fs.writeFileSync(htmlPath, html);
  console.log(`HTML  → ${htmlPath}`);

  await capture({ mode, input: htmlPath, output: pngPath, fontDelay: 600 });

  // Copy thread for reproducibility
  fs.copyFileSync(threadPath, path.join(outDir, 'thread.json'));

  console.log(`\n✓ ${pngPath}`);
}

main().catch(err => {
  console.error('Render failed:', err.message);
  console.error(err.stack);
  process.exit(1);
});
