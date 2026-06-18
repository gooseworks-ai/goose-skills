#!/usr/bin/env node

/**
 * Workflow Diagram Screenshot Tool
 *
 * Captures an HTML workflow diagram as a PNG image.
 *
 * Usage:
 *   node screenshot-diagram.js <diagram-folder-name>
 *
 * Example:
 *   node screenshot-diagram.js lead-gen-pipeline
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

// Default diagram dimensions
const SIZES = {
    'landscape': { width: 1920, height: 1080 },
    'square': { width: 1080, height: 1080 },
    'wide': { width: 1200, height: 630 },
};

async function screenshotDiagram(diagramName, sizeKey = 'landscape') {
    const diagramDir = path.join(process.cwd(), diagramName);
    const diagramPath = path.join(diagramDir, 'diagram.html');
    const outputDir = path.join(diagramDir, 'exports');

    // Validate diagram file exists
    if (!fs.existsSync(diagramPath)) {
        console.error(`Error: Diagram not found: ${diagramPath}`);
        console.error('Make sure the diagram HTML has been generated first.');
        process.exit(1);
    }

    // Get dimensions
    const size = SIZES[sizeKey] || SIZES['landscape'];

    // Create exports directory
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
        console.log(`Created exports directory: ${outputDir}`);
    }

    console.log(`\nCapturing diagram at ${size.width}x${size.height}...\n`);

    // Launch browser
    const browser = await chromium.launch({ headless: true });

    const context = await browser.newContext({
        viewport: {
            width: size.width,
            height: size.height,
        },
        deviceScaleFactor: 2, // Retina quality
    });

    const page = await context.newPage();

    try {
        // Navigate to diagram
        await page.goto(`file://${path.resolve(diagramPath)}`, {
            waitUntil: 'networkidle',
            timeout: 15000,
        });

        // Wait for fonts to render
        await page.waitForTimeout(800);

        const outputPath = path.join(outputDir, 'diagram.png');

        // Take screenshot
        await page.screenshot({
            path: outputPath,
            type: 'png',
            fullPage: false,
        });

        // Get file size
        const stats = fs.statSync(outputPath);
        const fileSizeKB = Math.round(stats.size / 1024);

        console.log(`Saved: ${outputPath} (${fileSizeKB} KB)`);

    } catch (error) {
        console.error(`Failed: ${error.message}`);
    }

    await browser.close();

    console.log(`\nDiagram captured!\n`);
    console.log(`PNG saved to: ${outputDir}/diagram.png`);
}

// Parse command line arguments
const diagramName = process.argv[2];
const sizeArg = process.argv[3] || 'landscape';

if (!diagramName) {
    console.error('\nUsage: node screenshot-diagram.js <diagram-folder-name> [landscape|square|wide]\n');
    console.error('Examples:');
    console.error('  node screenshot-diagram.js lead-gen-pipeline');
    console.error('  node screenshot-diagram.js lead-gen-pipeline square');
    console.error('  node screenshot-diagram.js lead-gen-pipeline wide\n');
    process.exit(1);
}

// Run screenshot
screenshotDiagram(diagramName, sizeArg)
    .catch(error => {
        console.error('\nScreenshot capture failed:', error.message);
        process.exit(1);
    });
