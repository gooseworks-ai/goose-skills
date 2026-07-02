#!/usr/bin/env node
/**
 * screenshot.js — Capture a generated ChatGPT mobile HTML page as a PNG.
 *
 * Fixed 9:16 viewport (750 x 1334), DSF 3 → 2250 x 4002 PNG.
 */

const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

const VIEWPORT = { width: 750, height: 1624 };
const DEVICE_SCALE = 3;

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === '--input' && argv[i + 1]) args.input = argv[++i];
    else if (argv[i] === '--output' && argv[i + 1]) args.output = argv[++i];
    else if (argv[i] === '--font-delay' && argv[i + 1]) args.fontDelay = parseInt(argv[++i], 10);
  }
  return args;
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
  const chromium = await ensureChromium();
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: DEVICE_SCALE,
  });
  const page = await context.newPage();

  fs.mkdirSync(path.dirname(args.output), { recursive: true });

  await page.goto(`file://${args.input}`, { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(args.fontDelay || 600);

  await page.screenshot({
    path: args.output,
    type: 'png',
    fullPage: false,
    omitBackground: false,
  });

  await browser.close();
  return { bytes: fs.statSync(args.output).size };
}

async function main() {
  const args = parseArgs(process.argv);
  if (!args.input || !args.output) {
    console.error('Usage: node screenshot.js --input page.html --output out.png [--font-delay 600]');
    process.exit(1);
  }
  args.input = path.resolve(args.input);
  args.output = path.resolve(args.output);
  console.log(`input=${args.input}  output=${args.output}`);
  const { bytes } = await capture(args);
  console.log(`done — ${Math.round(bytes / 1024)} KB → ${args.output}`);
}

if (require.main === module) {
  main().catch(err => {
    console.error('Screenshot failed:', err.message);
    process.exit(1);
  });
}

module.exports = { capture, VIEWPORT, DEVICE_SCALE };
