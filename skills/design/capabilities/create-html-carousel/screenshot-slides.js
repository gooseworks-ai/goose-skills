#!/usr/bin/env node

/**
 * LinkedIn Carousel Screenshot Tool
 * 
 * Automatically captures all HTML slides as 1080x1080px PNG images
 * for uploading to LinkedIn carousel posts.
 * 
 * Usage:
 *   node screenshot-slides.js <carousel-folder-name>
 * 
 * Example:
 *   node screenshot-slides.js ai-gtm-workflows
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

// Output directory is alongside the slides

async function screenshotSlides(carouselName) {
    const carouselDir = path.join(process.cwd(), carouselName);
    const slidesDir = path.join(carouselDir, 'slides');
    const outputDir = path.join(carouselDir, 'exports');

    // Validate slides directory exists
    if (!fs.existsSync(slidesDir)) {
        console.error(`❌ Error: Slides directory not found: ${slidesDir}`);
        console.error('Make sure the carousel HTML files have been generated first.');
        process.exit(1);
    }

    // Create exports directory
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
        console.log(`📁 Created exports directory: ${outputDir}`);
    }

    // Find all HTML files in slides directory
    const slideFiles = fs.readdirSync(slidesDir)
        .filter(f => f.endsWith('.html'))
        .sort(); // Ensure slides are in order

    if (slideFiles.length === 0) {
        console.error(`❌ No HTML files found in ${slidesDir}`);
        process.exit(1);
    }

    console.log(`\n🚀 Starting screenshot capture for ${slideFiles.length} slides...\n`);

    // Launch browser
    const browser = await chromium.launch({
        headless: true,
    });

    const context = await browser.newContext({
        viewport: {
            width: 1080,
            height: 1080,
        },
        deviceScaleFactor: 2, // Retina quality for crisp text
    });

    const page = await context.newPage();

    // Process each slide
    for (let i = 0; i < slideFiles.length; i++) {
        const slideFile = slideFiles[i];
        const slideNum = String(i + 1).padStart(2, '0');
        const slidePath = path.join(slidesDir, slideFile);
        const outputName = `slide-${slideNum}.png`;
        const outputPath = path.join(outputDir, outputName);

        process.stdout.write(`📸 Capturing slide ${i + 1}/${slideFiles.length}: ${slideFile}...`);

        try {
            // Navigate to slide
            await page.goto(`file://${path.resolve(slidePath)}`, {
                waitUntil: 'networkidle', // Wait for fonts and assets
                timeout: 10000,
            });

            // Extra wait for web fonts to render
            await page.waitForTimeout(500);

            // Take screenshot
            await page.screenshot({
                path: outputPath,
                type: 'png',
                fullPage: false, // Exact viewport capture
            });

            // Get file size for feedback
            const stats = fs.statSync(outputPath);
            const fileSizeKB = Math.round(stats.size / 1024);

            console.log(` ✓ (${fileSizeKB} KB)`);

        } catch (error) {
            console.log(` ❌ Failed`);
            console.error(`   Error: ${error.message}`);
        }
    }

    await browser.close();

    console.log(`\n✨ All slides captured!\n`);
    console.log(`📁 PNG files saved to: ${outputDir}`);
    console.log(`\n📤 Ready to upload to LinkedIn:\n`);
    console.log(`   1. Create new LinkedIn post`);
    console.log(`   2. Click "Add media" → Upload images`);
    console.log(`   3. Select all PNGs from exports/ folder`);
    console.log(`   4. Write your post copy`);
    console.log(`   5. Publish!\n`);
}

// Parse command line arguments
const carouselName = process.argv[2];

if (!carouselName) {
    console.error('\n❌ Usage: node screenshot-slides.js <carousel-folder-name>\n');
    console.error('Example:');
    console.error('  node screenshot-slides.js ai-gtm-workflows\n');
    process.exit(1);
}

// Run screenshot capture
screenshotSlides(carouselName)
    .catch(error => {
        console.error('\n❌ Screenshot capture failed:', error.message);
        process.exit(1);
    });
