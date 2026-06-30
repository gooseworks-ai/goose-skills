#!/usr/bin/env node
/**
 * render.js — entry point for create-chatgpt-mockup.
 *
 *   node render.js --thread examples/text-qa.json
 *   node render.js --thread my-thread.json --output ./exports --name my-mockup
 */

const fs = require('fs');
const path = require('path');
const { renderHTML } = require('./generate');
const { capture } = require('./screenshot');

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    switch (a) {
      case '--thread': args.thread = argv[++i]; break;
      case '--output': args.output = argv[++i]; break;
      case '--name':   args.name   = argv[++i]; break;
      case '-h':
      case '--help':   args.help = true; break;
      default: break;
    }
  }
  return args;
}

const HELP = `
create-chatgpt-mockup — render a pixel-accurate ChatGPT mobile screen.

Usage:
  node render.js --thread <path.json> [--name slug] [--output dir]

Output:
  <output>/<YYYY-MM-DD>-<slug>/index.html + screenshot.png + thread.json

Default <output> is ./chatgpt-mockup-exports/ in the cwd.
`;

function slugify(s) {
  return (s || 'mockup')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 40) || 'mockup';
}

function pickFirstUserText(thread) {
  const t = (thread.messages || []).find(m => m.type === 'user-text');
  return t ? t.text : null;
}

async function main() {
  const args = parseArgs(process.argv);
  if (args.help) { console.log(HELP); return; }
  if (!args.thread) { console.error(HELP); process.exit(1); }

  const threadPath = path.resolve(args.thread);
  if (!fs.existsSync(threadPath)) {
    console.error(`Thread file not found: ${threadPath}`);
    process.exit(1);
  }
  const thread = JSON.parse(fs.readFileSync(threadPath, 'utf-8'));

  // Resolve any relative image src in messages against the thread.json's dir,
  // so examples can ship with sibling `assets/` folders.
  const threadDir = path.dirname(threadPath);
  for (const m of (thread.messages || [])) {
    if (m.type === 'user-image' && m.src && !/^([a-z]+:|\/)/i.test(m.src)) {
      m.src = `file://${path.resolve(threadDir, m.src)}`;
    }
  }

  const today = new Date().toISOString().slice(0, 10);
  const slug = slugify(args.name || pickFirstUserText(thread) || 'mockup');
  const outDir = args.output
    ? path.resolve(args.output, `${today}-${slug}`)
    : path.resolve(process.cwd(), 'chatgpt-mockup-exports', `${today}-${slug}`);

  fs.mkdirSync(outDir, { recursive: true });
  const htmlPath = path.join(outDir, 'index.html');
  const pngPath = path.join(outDir, 'screenshot.png');

  const html = renderHTML(thread);
  fs.writeFileSync(htmlPath, html);
  console.log(`HTML  → ${htmlPath}`);

  await capture({ input: htmlPath, output: pngPath, fontDelay: 600 });
  fs.copyFileSync(threadPath, path.join(outDir, 'thread.json'));
  console.log(`\n✓ ${pngPath}`);
}

main().catch(err => {
  console.error('Render failed:', err.message);
  console.error(err.stack);
  process.exit(1);
});
