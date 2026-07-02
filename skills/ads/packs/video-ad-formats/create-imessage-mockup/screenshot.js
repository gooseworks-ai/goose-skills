#!/usr/bin/env node
/**
 * screenshot.js — Capture a generated iMessage HTML page as a PNG.
 *
 * Adapted from the goose-graphics screenshot pipeline. Three modes match
 * generate.js: `minimal`, `with-keyboard`, `with-iphone-frame`.
 *
 * Usage:
 *   node screenshot.js --mode <minimal|with-keyboard|with-iphone-frame> \
 *                      --input /path/to/index.html \
 *                      --output /path/to/screenshot.png \
 *                      [--font-delay 500]
 */

const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

const MODE_CONFIGS = {
  'minimal': {
    width: 750,
    height: 100,        // small initial; fullPage extends to actual content
    deviceScaleFactor: 3,
    fullPage: true,
  },
  'with-keyboard': {
    width: 750,
    height: 100,        // small initial; fullPage extends to content+keyboard
    deviceScaleFactor: 3,
    fullPage: true,
  },
  'with-iphone-frame': {
    width: 525,         // 393 (phone) + ~66px gradient padding each side
    height: 980,        // 852 (phone) + ~64px padding each side
    deviceScaleFactor: 3,
    fullPage: false,
  },
};

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === '--mode' && argv[i + 1]) args.mode = argv[++i];
    else if (argv[i] === '--input' && argv[i + 1]) args.input = argv[++i];
    else if (argv[i] === '--output' && argv[i + 1]) args.output = argv[++i];
    else if (argv[i] === '--font-delay' && argv[i + 1]) args.fontDelay = parseInt(argv[++i], 10);
  }
  return args;
}

function validateArgs(args) {
  if (!args.mode || !MODE_CONFIGS[args.mode]) {
    console.error(`Error: --mode must be one of: ${Object.keys(MODE_CONFIGS).join(', ')}`);
    process.exit(1);
  }
  if (!args.input || !fs.existsSync(args.input)) {
    console.error(`Error: --input path missing or not found: ${args.input}`);
    process.exit(1);
  }
  if (!args.output) {
    console.error('Error: --output is required.');
    process.exit(1);
  }
  return {
    mode: args.mode,
    input: path.resolve(args.input),
    output: path.resolve(args.output),
    fontDelay: args.fontDelay || 500,
  };
}

async function ensureChromium() {
  let chromium;
  try {
    ({ chromium } = require('playwright'));
  } catch (err) {
    if (err && err.code === 'MODULE_NOT_FOUND') {
      console.error('Error: playwright not installed. Run `npm install` in the skill directory.');
      process.exit(1);
    }
    throw err;
  }
  try {
    chromium.executablePath();
  } catch {
    console.log('Installing chromium via playwright...');
    execSync('npx playwright install chromium', { stdio: 'inherit' });
  }
  return chromium;
}

async function capture(args) {
  const config = MODE_CONFIGS[args.mode];
  const chromium = await ensureChromium();
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: config.width, height: config.height },
    deviceScaleFactor: config.deviceScaleFactor,
  });
  const page = await context.newPage();

  fs.mkdirSync(path.dirname(args.output), { recursive: true });

  await page.goto(`file://${args.input}`, { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(args.fontDelay);

  await page.screenshot({
    path: args.output,
    type: 'png',
    fullPage: config.fullPage,
    omitBackground: false,
  });

  await browser.close();

  const stats = fs.statSync(args.output);
  return { bytes: stats.size };
}

async function main() {
  const args = validateArgs(parseArgs(process.argv));
  console.log(`mode=${args.mode}  input=${args.input}  output=${args.output}`);
  const { bytes } = await capture(args);
  console.log(`done — ${Math.round(bytes / 1024)} KB → ${args.output}`);
}

if (require.main === module) {
  main().catch(err => {
    console.error('Screenshot failed:', err.message);
    process.exit(1);
  });
}

module.exports = { capture, MODE_CONFIGS };
