---
name: linkedin-profile-post-scraper
description: >
  Scrape recent posts from LinkedIn profiles using Apify. Use when you need to
  monitor what specific people are posting on LinkedIn, track founder/exec activity,
  or gather LinkedIn content for competitive intelligence.
---

# LinkedIn Profile Post Scraper

Scrape recent posts from specific LinkedIn profiles using the Apify `harvestapi/linkedin-profile-posts` actor.

## Quick Start

Requires `APIFY_API_TOKEN` env var (or `--token` flag). Install dependency: `pip install requests`.

```bash
# Scrape recent posts from a profile
python3 skills/linkedin-profile-post-scraper/scripts/scrape_linkedin_posts.py \
  --profiles "https://www.linkedin.com/in/marcelsantilli" --max-posts 10

# Multiple profiles with keyword filtering
python3 skills/linkedin-profile-post-scraper/scripts/scrape_linkedin_posts.py \
  --profiles "https://www.linkedin.com/in/person1,https://www.linkedin.com/in/person2" \
  --keywords "AI,growth" --days 30

# Summary table
python3 skills/linkedin-profile-post-scraper/scripts/scrape_linkedin_posts.py \
  --profiles "https://www.linkedin.com/in/marcelsantilli" --output summary
```

## CLI Reference

| Flag | Default | Description |
|------|---------|-------------|
| `--profiles` | *required* | LinkedIn profile URL(s), comma-separated |
| `--max-posts` | 20 | Max posts to scrape per profile |
| `--keywords` | none | Keywords to filter (comma-separated, OR logic) |
| `--days` | 30 | Only include posts from last N days |
| `--output` | json | Output format: `json` or `summary` |
| `--token` | env var | Apify token (prefer `APIFY_API_TOKEN` env var) |
| `--timeout` | 300 | Max seconds to wait for the Apify run |

## Cost

~$2 per 1,000 posts scraped. The script prints a cost estimate before running.

## Notes

- No native date filtering — dates are filtered client-side on `postedAt`/`postedDate`
- Profile URLs must be full LinkedIn URLs (e.g. `https://www.linkedin.com/in/username`)
