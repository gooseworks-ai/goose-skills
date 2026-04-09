---
name: conference-speaker-scraper
description: >
  Extract speaker names, titles, companies, and bios from conference websites.
  Supports direct HTML scraping and Apify web scraper fallback for JS-heavy sites.
  Use for pre-event research and outreach targeting.
---

# Conference Speaker Scraper

Extract speaker names, titles, companies, and bios from conference website /speakers pages. Supports direct HTML scraping with multiple extraction strategies, plus Apify fallback for JS-heavy sites.

## Quick Start

No API key needed for direct scraping mode.

```bash
# Scrape speakers from a conference page
python3 skills/conference-speaker-scraper/scripts/scrape_speakers.py \
  --url "https://example.com/speakers"

# Use Apify for JS-heavy sites
python3 skills/conference-speaker-scraper/scripts/scrape_speakers.py \
  --url "https://example.com/speakers" --mode apify

# Custom conference name (otherwise inferred from URL)
python3 skills/conference-speaker-scraper/scripts/scrape_speakers.py \
  --url "https://example.com/speakers" --conference "Sage Future 2026"

# Output formats
python3 skills/conference-speaker-scraper/scripts/scrape_speakers.py --url URL --output json     # default
python3 skills/conference-speaker-scraper/scripts/scrape_speakers.py --url URL --output csv
python3 skills/conference-speaker-scraper/scripts/scrape_speakers.py --url URL --output summary
```

## How It Works

### Direct Mode (default)

Fetches the page HTML and tries multiple extraction strategies in order, using whichever returns the most results:

1. **Strategy A -- CSS class hints:** Looks for speaker cards with class names containing "speaker", "presenter", "faculty", "panelist", "team-member"
2. **Strategy B -- Heading + paragraph patterns:** Looks for repeated `<h2>`/`<h3>` + `<p>` structures
3. **Strategy C -- JSON-LD structured data:** Checks for `<script type="application/ld+json">` with speaker data
4. **Strategy D -- Platform embeds:** Detects Sched.com/Sessionize patterns used by many conferences

### Apify Mode

Uses `apify/cheerio-scraper` actor with a custom page function that targets common speaker card selectors. Standard POST/poll/GET dataset pattern.

## CLI Reference

| Flag | Default | Description |
|------|---------|-------------|
| `--url` | *required* | Conference speakers page URL |
| `--conference` | inferred | Conference name (otherwise inferred from URL domain) |
| `--mode` | direct | `direct` (HTML scraping) or `apify` (Apify cheerio scraper) |
| `--output` | json | Output format: `json`, `csv`, or `summary` |
| `--token` | env var | Apify token (only needed for apify mode) |
| `--timeout` | 300 | Max seconds for Apify run |

## Output Schema

```json
{
  "name": "Jane Smith",
  "title": "VP of Finance",
  "company": "Acme Corp",
  "bio": "Jane leads the finance transformation at...",
  "linkedin_url": "https://linkedin.com/in/janesmith",
  "image_url": "https://...",
  "conference": "Sage Future 2026",
  "source_url": "https://sagefuture2026.com/speakers"
}
```

## Cost

- **Direct mode:** Free (no API, no tokens)
- **Apify mode:** Uses `apify/cheerio-scraper` -- minimal Apify credits

## Testing Notes

HTML scraping is inherently fragile across conference sites. The multi-strategy approach maximizes coverage, but JS-heavy sites will require Apify mode. When direct scraping returns 0 results, try `--mode apify`.
