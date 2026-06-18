#!/usr/bin/env node

/**
 * Tweet Data Fetcher for Graphic Design Skill Pack
 *
 * Fetches tweet data including full text (even for long-form notes/threads).
 * Uses two sources:
 *   1. Twitter syndication API — for profile photo, metrics, date (fast, no auth)
 *   2. Playwright render of x.com — for the full untruncated tweet text
 *
 * Usage:
 *   node fetch-tweet.js <tweet-url-or-id>
 *
 * Examples:
 *   node fetch-tweet.js https://x.com/shivsakhuja/status/2039963598244716919
 *   node fetch-tweet.js 2039963598244716919
 *
 * Output: JSON object with tweet data printed to stdout.
 */

const path = require('path');

function extractTweetId(input) {
    if (/^\d+$/.test(input)) return input;
    const match = input.match(/(?:x\.com|twitter\.com)\/\w+\/status\/(\d+)/);
    if (match) return match[1];
    console.error(`Error: Could not extract tweet ID from "${input}"`);
    process.exit(1);
}

function extractHandle(input) {
    const match = input.match(/(?:x\.com|twitter\.com)\/(\w+)\/status/);
    return match ? match[1] : null;
}

// ---------------------------------------------------------------------------
// Source 1: Syndication API (fast — profile photo, metrics, date, short text)
// ---------------------------------------------------------------------------

async function fetchSyndicationData(tweetId) {
    const url = `https://cdn.syndication.twimg.com/tweet-result?id=${tweetId}&token=x`;
    const response = await fetch(url);
    if (!response.ok) return null;

    const data = await response.json();
    if (!data || !data.user) return null;

    const profileImageSmall = data.user.profile_image_url_https || '';
    const profileImage = profileImageSmall.replace('_normal.', '_400x400.');

    let text = data.text || '';
    text = text.replace(/\s*https:\/\/t\.co\/\w+\s*$/g, '').trim();

    const date = new Date(data.created_at);
    const formattedDate = date.toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric',
    });
    const formattedTime = date.toLocaleTimeString('en-US', {
        hour: 'numeric', minute: '2-digit', hour12: true,
    });

    // Detect if tweet is truncated (has note_tweet field)
    const isLongForm = !!(data.note_tweet && data.note_tweet.id);

    return {
        id: data.id_str,
        text,
        isLongForm,
        author: {
            name: data.user.name,
            handle: `@${data.user.screen_name}`,
            profileImage,
            profileImageSmall,
            isVerified: data.user.is_blue_verified || data.user.verified || false,
            verifiedType: data.user.verified_type || null,
        },
        metrics: {
            likes: data.favorite_count || 0,
            retweets: data.retweet_count || 0,
            replies: data.reply_count || 0,
            quotes: data.quote_count || 0,
            bookmarks: data.bookmark_count || 0,
            views: data.views_count || null,
        },
        date: {
            iso: data.created_at,
            formatted: `${formattedTime} · ${formattedDate}`,
            dateOnly: formattedDate,
        },
        media: (data.mediaDetails || []).map(m => ({
            type: m.type || 'photo',
            url: m.media_url_https,
        })),
    };
}

// ---------------------------------------------------------------------------
// Source 2: Playwright render of x.com (slow — full untruncated text)
// ---------------------------------------------------------------------------

async function fetchFullText(tweetId, handle) {
    let chromium;
    try {
        ({ chromium } = require('playwright'));
    } catch {
        console.error('Warning: Playwright not available, cannot fetch full tweet text');
        return null;
    }

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
        await page.waitForTimeout(5000);

        const tweetData = await page.evaluate(() => {
            const tweetTextEls = document.querySelectorAll('[data-testid="tweetText"]');
            if (tweetTextEls.length > 0) {
                let text = tweetTextEls[0].innerText;
                text = text.replace(/\n?Show more\s*$/, '').replace(/\n?Show less\s*$/, '').trim();
                return text;
            }
            return null;
        });

        await browser.close();
        return tweetData;
    } catch (error) {
        await browser.close();
        console.error('Warning: Failed to fetch full text from x.com:', error.message);
        return null;
    }
}

// ---------------------------------------------------------------------------
// Format helpers
// ---------------------------------------------------------------------------

function formatCount(n) {
    if (n === null || n === undefined) return null;
    if (n >= 1000000) return (n / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    return String(n);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
    const input = process.argv[2];
    if (!input) {
        console.error('Usage: node fetch-tweet.js <tweet-url-or-id>');
        process.exit(1);
    }

    const tweetId = extractTweetId(input);
    const handle = extractHandle(input);

    // Step 1: Fast syndication API for metadata
    console.error('Fetching tweet metadata...');
    const tweet = await fetchSyndicationData(tweetId);

    if (!tweet) {
        console.error('Error: Could not fetch tweet data from syndication API');
        process.exit(1);
    }

    // Step 2: If long-form, use Playwright to get full text
    if (tweet.isLongForm) {
        console.error('Long-form tweet detected, fetching full text via Playwright...');
        const fullText = await fetchFullText(tweetId, handle);
        if (fullText && fullText.length > tweet.text.length) {
            tweet.text = fullText;
            tweet.textSource = 'x.com (full)';
        } else {
            tweet.textSource = 'syndication (truncated)';
        }
    } else {
        tweet.textSource = 'syndication';
    }

    // Add formatted metric strings
    tweet.metrics.likesFormatted = formatCount(tweet.metrics.likes);
    tweet.metrics.retweetsFormatted = formatCount(tweet.metrics.retweets);
    tweet.metrics.repliesFormatted = formatCount(tweet.metrics.replies);
    tweet.metrics.quotesFormatted = formatCount(tweet.metrics.quotes);
    tweet.metrics.bookmarksFormatted = formatCount(tweet.metrics.bookmarks);
    tweet.metrics.viewsFormatted = formatCount(tweet.metrics.views);

    // Output to stdout (logs go to stderr)
    console.log(JSON.stringify(tweet, null, 2));
}

main().catch(error => {
    console.error('Failed to fetch tweet:', error.message);
    process.exit(1);
});
