#!/usr/bin/env node

/**
 * Fetches full tweet text (including long-form notes) by loading the actual tweet page.
 * Uses Playwright to render x.com and extract the complete text.
 *
 * Usage:
 *   node fetch-full-tweet.js <tweet-url-or-id>
 *
 * Output: JSON with { text, author, handle } to stdout.
 */

const { chromium } = require('playwright');

function extractTweetId(input) {
    if (/^\d+$/.test(input)) return input;
    const match = input.match(/(?:x\.com|twitter\.com)\/(\w+)\/status\/(\d+)/);
    if (match) return match[2];
    console.error(`Error: Could not extract tweet ID from "${input}"`);
    process.exit(1);
}

function extractHandle(input) {
    const match = input.match(/(?:x\.com|twitter\.com)\/(\w+)\/status/);
    return match ? match[1] : null;
}

async function fetchFullTweet(tweetId, handle) {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
        viewport: { width: 1280, height: 2400 },
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    });
    const page = await context.newPage();

    try {
        const url = handle
            ? `https://x.com/${handle}/status/${tweetId}`
            : `https://x.com/i/status/${tweetId}`;

        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });

        // Wait for tweet content to load
        await page.waitForTimeout(5000);

        // Extract tweet text from the page
        const tweetData = await page.evaluate(() => {
            // On x.com, the main tweet text is in [data-testid="tweetText"]
            // The first one on the page is usually the main tweet
            const tweetTextEls = document.querySelectorAll('[data-testid="tweetText"]');

            if (tweetTextEls.length > 0) {
                // Get the first (main) tweet text
                const mainText = tweetTextEls[0].innerText;

                // Also try to get the author info
                const userNameEl = document.querySelector('[data-testid="User-Name"]');
                let authorName = null;
                let authorHandle = null;
                if (userNameEl) {
                    const spans = userNameEl.querySelectorAll('span');
                    for (const span of spans) {
                        const text = span.textContent.trim();
                        if (text.startsWith('@')) {
                            authorHandle = text;
                        } else if (text.length > 1 && !text.includes('·') && !text.match(/^\d/)) {
                            if (!authorName) authorName = text;
                        }
                    }
                }

                return {
                    text: mainText,
                    author: authorName,
                    handle: authorHandle,
                    source: 'x.com',
                };
            }

            // Fallback
            return { text: document.body.innerText.substring(0, 2000), source: 'body-fallback' };
        });

        await browser.close();
        return tweetData;
    } catch (error) {
        await browser.close();
        return { text: null, error: error.message };
    }
}

async function main() {
    const input = process.argv[2];
    if (!input) {
        console.error('Usage: node fetch-full-tweet.js <tweet-url-or-id>');
        process.exit(1);
    }

    const tweetId = extractTweetId(input);
    const handle = extractHandle(input);
    const result = await fetchFullTweet(tweetId, handle);
    console.log(JSON.stringify(result, null, 2));
}

main().catch(e => { console.error(e.message); process.exit(1); });
