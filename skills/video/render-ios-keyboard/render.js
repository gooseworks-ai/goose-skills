#!/usr/bin/env node
/**
 * render.js — Standalone CLI for visual testing the iOS keyboard.
 *   node render.js --out /tmp/kb.html
 *   node render.js --out /tmp/kb.html --suggestions 'I,The,I'\''m' --layout qwerty-lower
 */
const fs = require('fs');
const path = require('path');
const { renderKeyboardHTML, renderKeyboardCSS } = require('./generate');

function parseArgs(argv) {
  const a = {};
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === '--out') a.out = argv[++i];
    else if (argv[i] === '--suggestions') a.suggestions = argv[++i];
    else if (argv[i] === '--layout') a.layout = argv[++i];
  }
  return a;
}

function main() {
  const args = parseArgs(process.argv);
  if (!args.out) {
    console.error('Usage: node render.js --out path.html [--suggestions "a,b,c"] [--layout qwerty-lower]');
    process.exit(1);
  }
  const suggestions = args.suggestions ? args.suggestions.split(',') : undefined;
  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
  html, body { margin: 0; padding: 0; background: #F4F4F4; }
  .stage { width: 750px; margin: 0 auto; background: #FFFFFF; min-height: 1334px; display: flex; flex-direction: column; justify-content: flex-end; }
  ${renderKeyboardCSS()}
</style></head>
<body><div class="stage">
${renderKeyboardHTML({ suggestions, layout: args.layout })}
</div></body></html>`;
  fs.mkdirSync(path.dirname(args.out), { recursive: true });
  fs.writeFileSync(args.out, html);
  console.log(`Wrote ${args.out}`);
}

if (require.main === module) main();
