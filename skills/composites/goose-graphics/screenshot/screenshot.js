#!/usr/bin/env node

/**
 * Unified Screenshot Tool for Graphic Design Skill Pack
 *
 * Captures HTML files as PNG images at format-specific dimensions.
 *
 * Usage:
 *   node screenshot.js --format <carousel|infographic|slides|poster|story|chart|tweet> --input <path> --output <path> [--font-delay <ms>]
 *
 * Formats:
 *   carousel     1080x1080px per slide, directory of HTML files -> numbered PNGs
 *   infographic  1080px wide, variable height, single HTML file -> single PNG
 *   slides       1920x1080px per slide, directory of HTML files -> numbered PNGs
 *   poster       1080x1350px, single HTML file -> single PNG
 *   story        1080x1920px per slide, directory of HTML files -> numbered PNGs
 *   chart        1080x1080px, single HTML file -> single PNG
 *   tweet        1080x1080px, single HTML file -> single PNG
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
        console.error('Usage: node screenshot.js --format <carousel|infographic|slides|poster|story|chart|tweet> --input <path> --output <path> [--font-delay <ms>]');
        process.exit(1);
    }
    if (!FORMAT_CONFIGS[args.format]) {
        console.error(`Error: Invalid format "${args.format}". Must be one of: ${Object.keys(FORMAT_CONFIGS).join(', ')}`);
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

    return {
        format: args.format,
        input: inputPath,
        output: path.resolve(args.output),
        fontDelay: args.fontDelay || 500,
    };
}

// ---------------------------------------------------------------------------
// Chromium auto-install check
// ---------------------------------------------------------------------------

async function ensureChromium() {
    try {
        const { chromium } = require('playwright');
        // Try to get the executable path; throws if not installed
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
    const config = FORMAT_CONFIGS[args.format];

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
