#!/usr/bin/env node

/**
 * Unified Screenshot Tool for Graphic Design Skill Pack
 *
 * Captures HTML files as PNG images at format-specific dimensions.
 *
 * Usage:
 *   node screenshot.js --format <slug> --input <path> --output <path> [--font-delay <ms>]
 *
 * Built-in formats (must be one of these — slug is a strict allow-list):
 *   carousel     1080x1080px per slide
 *   infographic  1080px wide, variable height (full-page)
 *   slides       1920x1080px per slide
 *   poster       1080x1350px
 *   story        1080x1920px per slide
 *   chart        1080x1080px
 *   tweet        1080x1080px
 *
 * Input modes:
 *   - If --input is a directory, every .html file is rendered to numbered
 *     PNGs (slide-01.png, slide-02.png, …) in the --output directory. This
 *     is the "multi-file" mode used for carousel/slides/story.
 *   - If --input is a single .html file, one PNG is written to the --output
 *     path (any format). For carousel/slides/story this captures a single
 *     representative slide.
 *
 * To render a brand-new custom format (e.g. linkedin-banner 1584×396),
 * extend FORMAT_CONFIGS below with the new slug + dimensions before running.
 * The same allow-list is used by hub-side rendering, so unknown slugs are
 * rejected on purpose.
 */

const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

// ---------------------------------------------------------------------------
// Format configurations
// ---------------------------------------------------------------------------

const FORMAT_CONFIGS = {
    carousel: {
        width: 1080,
        height: 1080,
        deviceScaleFactor: 2,
        fullPage: false,
        multiFile: true,
    },
    infographic: {
        width: 1080,
        height: 1080, // initial viewport; fullPage captures actual height
        deviceScaleFactor: 2,
        fullPage: true,
        multiFile: false,
    },
    slides: {
        width: 1920,
        height: 1080,
        deviceScaleFactor: 2,
        fullPage: false,
        multiFile: true,
    },
    poster: {
        width: 1080,
        height: 1350,
        deviceScaleFactor: 2,
        fullPage: false,
        multiFile: false,
    },
    story: {
        width: 1080,
        height: 1920,
        deviceScaleFactor: 2,
        fullPage: false,
        multiFile: true,
    },
    chart: {
        width: 1080,
        height: 1080,
        deviceScaleFactor: 2,
        fullPage: false,
        multiFile: false,
    },
    tweet: {
        width: 1080,
        height: 1080,
        deviceScaleFactor: 2,
        fullPage: false,
        multiFile: false,
    },
};

// ---------------------------------------------------------------------------
// Argument parsing
// ---------------------------------------------------------------------------

function parseArgs(argv) {
    const args = {};
    for (let i = 2; i < argv.length; i++) {
        if (argv[i] === '--format' && argv[i + 1]) {
            args.format = argv[++i];
        } else if (argv[i] === '--input' && argv[i + 1]) {
            args.input = argv[++i];
        } else if (argv[i] === '--output' && argv[i + 1]) {
            args.output = argv[++i];
        } else if (argv[i] === '--font-delay' && argv[i + 1]) {
            args.fontDelay = parseInt(argv[++i], 10);
        }
    }
    return args;
}

function validateArgs(args) {
    if (!args.format) {
        console.error('Error: Missing required --format flag.');
        console.error('Usage: node screenshot.js --format <slug> --input <path> --output <path> [--font-delay <ms>]');
        process.exit(1);
    }
    if (!FORMAT_CONFIGS[args.format]) {
        console.error(`Error: Invalid format "${args.format}". Must be one of: ${Object.keys(FORMAT_CONFIGS).join(', ')}`);
        console.error('To render a brand-new custom format, add the slug + dimensions to FORMAT_CONFIGS in this file first.');
        process.exit(1);
    }
    if (!args.input) {
        console.error('Error: Missing required --input flag.');
        process.exit(1);
    }
    if (!args.output) {
        console.error('Error: Missing required --output flag.');
        process.exit(1);
    }

    const inputPath = path.resolve(args.input);
    if (!fs.existsSync(inputPath)) {
        console.error(`Error: Input path not found: ${inputPath}`);
        process.exit(1);
    }

    const config = { ...FORMAT_CONFIGS[args.format] };
    const inputIsDirectory = fs.statSync(inputPath).isDirectory();

    // A single-file input always runs in single-file mode regardless of the
    // format's default multiFile setting. This lets carousel/slides/story
    // render one representative slide when --input points at a single .html.
    if (!inputIsDirectory) {
        config.multiFile = false;
    }
    // The inverse — passing a directory to a single-file format — is a
    // misuse and would otherwise fail deep inside the renderer with an
    // unhelpful page.goto() error. Reject it up front.
    if (inputIsDirectory && !config.multiFile) {
        console.error(`Error: Format "${args.format}" expects a single HTML file as --input, not a directory.`);
        process.exit(1);
    }

    return {
        format: args.format,
        input: inputPath,
        output: path.resolve(args.output),
        fontDelay: args.fontDelay || 500,
        config,
    };
}

// ---------------------------------------------------------------------------
// Chromium auto-install check
// ---------------------------------------------------------------------------

async function ensureChromium() {
    let chromium;
    try {
        ({ chromium } = require('playwright'));
    } catch (err) {
        if (err && err.code === 'MODULE_NOT_FOUND') {
            const screenshotDir = __dirname;
            console.error('Error: The "playwright" npm package is not installed.');
            console.error(`Run first-run setup before using the screenshot tool:\n`);
            console.error(`  cd "${screenshotDir}" && npm install && npx playwright install chromium\n`);
            process.exit(1);
        }
        throw err;
    }
    try {
        chromium.executablePath();
    } catch {
        console.log('Chromium not found. Installing via Playwright...');
        execSync('npx playwright install chromium', { stdio: 'inherit' });
        console.log('Chromium installed successfully.\n');
    }
}

// ---------------------------------------------------------------------------
// Screenshot helpers
// ---------------------------------------------------------------------------

async function screenshotMultiFile(config, inputDir, outputDir, fontDelay) {
    const htmlFiles = fs.readdirSync(inputDir)
        .filter(f => f.endsWith('.html'))
        .sort();

    if (htmlFiles.length === 0) {
        console.error(`Error: No HTML files found in ${inputDir}`);
        process.exit(1);
    }

    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
        console.log(`Created output directory: ${outputDir}`);
    }

    console.log(`\nStarting screenshot capture for ${htmlFiles.length} files (${config.width}x${config.height}px)...\n`);

    const { chromium } = require('playwright');
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
        viewport: { width: config.width, height: config.height },
        deviceScaleFactor: config.deviceScaleFactor,
    });
    const page = await context.newPage();

    let totalSize = 0;

    for (let i = 0; i < htmlFiles.length; i++) {
        const htmlFile = htmlFiles[i];
        const slideNum = String(i + 1).padStart(2, '0');
        const outputName = `slide-${slideNum}.png`;
        const outputPath = path.join(outputDir, outputName);

        process.stdout.write(`  Capturing ${i + 1}/${htmlFiles.length}: ${htmlFile}...`);

        try {
            await page.goto(`file://${path.join(inputDir, htmlFile)}`, {
                waitUntil: 'networkidle',
                timeout: 15000,
            });

            await page.waitForTimeout(fontDelay);

            await page.screenshot({
                path: outputPath,
                type: 'png',
                fullPage: config.fullPage,
            });

            const stats = fs.statSync(outputPath);
            const fileSizeKB = Math.round(stats.size / 1024);
            totalSize += stats.size;

            console.log(` done (${fileSizeKB} KB)`);
        } catch (error) {
            console.log(` FAILED`);
            console.error(`    Error: ${error.message}`);
        }
    }

    await browser.close();

    return { fileCount: htmlFiles.length, totalSize };
}

async function screenshotSingleFile(config, inputFile, outputPath, fontDelay) {
    // Ensure output directory exists
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
        console.log(`Created output directory: ${outputDir}`);
    }

    console.log(`\nStarting screenshot capture (${config.width}x${config.fullPage ? 'auto' : config.height}px)...\n`);

    const { chromium } = require('playwright');
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
        viewport: { width: config.width, height: config.height },
        deviceScaleFactor: config.deviceScaleFactor,
    });
    const page = await context.newPage();

    process.stdout.write(`  Capturing: ${path.basename(inputFile)}...`);

    try {
        await page.goto(`file://${inputFile}`, {
            waitUntil: 'networkidle',
            timeout: 15000,
        });

        await page.waitForTimeout(fontDelay);

        await page.screenshot({
            path: outputPath,
            type: 'png',
            fullPage: config.fullPage,
        });

        const stats = fs.statSync(outputPath);
        const fileSizeKB = Math.round(stats.size / 1024);

        console.log(` done (${fileSizeKB} KB)`);

        await browser.close();

        return { fileCount: 1, totalSize: stats.size };
    } catch (error) {
        console.log(` FAILED`);
        console.error(`    Error: ${error.message}`);
        await browser.close();
        process.exit(1);
    }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
    const rawArgs = parseArgs(process.argv);
    const args = validateArgs(rawArgs);
    const config = args.config;

    await ensureChromium();

    console.log(`Format: ${args.format}`);
    console.log(`Input:  ${args.input}`);
    console.log(`Output: ${args.output}`);
    console.log(`Font delay: ${args.fontDelay}ms`);

    let result;

    if (config.multiFile) {
        result = await screenshotMultiFile(config, args.input, args.output, args.fontDelay);
    } else {
        result = await screenshotSingleFile(config, args.input, args.output, args.fontDelay);
    }

    const totalKB = Math.round(result.totalSize / 1024);

    console.log('\n--- Summary ---');
    console.log(`  Files exported: ${result.fileCount}`);
    console.log(`  Total size:     ${totalKB} KB`);
    console.log(`  Output:         ${args.output}`);
    console.log('');
}

main().catch(error => {
    console.error('Screenshot capture failed:', error.message);
    process.exit(1);
});
