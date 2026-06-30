#!/usr/bin/env node
// render.js — CLI entry: spec JSON → HTML + PNG.
//
// Usage:
//   node render.js --note examples/mid.json
//   node render.js --note examples/mid.json --with-keyboard --output ./out --name myrun
//   node render.js --note examples/mid.json --viewport 1080x1920
//
// Output goes to ./apple-notes-mockup-exports/<YYYY-MM-DD>-<slug>/ unless --output is set.

const fs = require('fs');
const path = require('path');
const { generateHtml } = require('./generate.js');
const { screenshotHtml } = require('./screenshot.js');

function parseArgs(argv) {
  const out = { flags: {}, viewport: { width: 1180, height: 2556 } };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--note') out.flags.note = argv[++i];
    else if (a === '--with-keyboard') out.flags.with_keyboard = true;
    else if (a === '--with-iphone-frame') out.flags.with_iphone_frame = true;
    else if (a === '--no-frame') out.flags.no_frame = true;
    else if (a === '--output') out.flags.output = argv[++i];
    else if (a === '--name') out.flags.name = argv[++i];
    else if (a === '--out-html') out.flags.outHtml = argv[++i];
    else if (a === '--out-png') out.flags.outPng = argv[++i];
    else if (a === '--viewport') {
      const [w, h] = argv[++i].split('x').map(Number);
      out.viewport = { width: w, height: h };
    }
    else if (a === '--dpr') out.flags.dpr = Number(argv[++i]);
  }
  return out;
}

function dateSlug() {
  return new Date().toISOString().slice(0, 10);
}

async function main() {
  const { flags, viewport } = parseArgs(process.argv);
  if (!flags.note) {
    console.error('error: --note <spec.json> is required');
    console.error('usage: node render.js --note examples/mid.json [--with-keyboard] [--output dir] [--name slug] [--viewport WxH]');
    process.exit(1);
  }
  const specPath = path.resolve(flags.note);
  const specDir = path.dirname(specPath);
  const spec = JSON.parse(fs.readFileSync(specPath, 'utf8'));
  // Resolve any relative image src in body blocks against the spec file's directory
  // and convert to data: URIs so the output HTML is self-contained.
  for (const b of spec.body || []) {
    if (b.type === 'image' && b.src && !/^(data:|https?:|file:)/.test(b.src)) {
      const abs = path.resolve(specDir, b.src);
      if (fs.existsSync(abs)) {
        const buf = fs.readFileSync(abs);
        const ext = path.extname(abs).slice(1).toLowerCase();
        const mime = ext === 'jpg' ? 'image/jpeg' : ext === 'png' ? 'image/png' : `image/${ext}`;
        b.src = `data:${mime};base64,${buf.toString('base64')}`;
      }
    }
  }
  if (flags.with_keyboard) spec.show_keyboard = true;
  if (flags.with_iphone_frame) spec.with_iphone_frame = true;
  if (flags.no_frame) spec.with_iphone_frame = false;

  const html = generateHtml(spec);

  let outHtml, outPng;
  if (flags.outHtml || flags.outPng) {
    outHtml = flags.outHtml ? path.resolve(flags.outHtml) : null;
    outPng = flags.outPng ? path.resolve(flags.outPng) : null;
  } else {
    const outRoot = path.resolve(flags.output || './apple-notes-mockup-exports');
    const slug = flags.name || path.basename(flags.note).replace(/\.json$/, '');
    const dir = path.join(outRoot, `${dateSlug()}-${slug}`);
    fs.mkdirSync(dir, { recursive: true });
    outHtml = path.join(dir, 'index.html');
    outPng = path.join(dir, 'screenshot.png');
    fs.writeFileSync(path.join(dir, 'spec.json'), JSON.stringify(spec, null, 2));
  }

  if (outPng) {
    await screenshotHtml({
      html,
      outPath: outPng,
      htmlBasePath: outHtml,
      viewport,
      dpr: flags.dpr || 2,
    });
  } else if (outHtml) {
    fs.writeFileSync(outHtml, html);
  }

  console.log('html:', outHtml || '(skipped)');
  console.log('png: ', outPng || '(skipped)');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
