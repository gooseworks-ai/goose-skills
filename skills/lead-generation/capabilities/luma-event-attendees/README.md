# Conference & Event Attendee Prospecting

Find speakers, hosts, and sponsors at conferences and events for outreach prospecting.

## Quick Start

```bash
# 1. Set your Apify API token
export APIFY_API_TOKEN="your_token_here"

# 2. Scrape speakers from an event
python3 scripts/scrape_event.py https://lu.ma/abc123

# 3. Discover AI events in SF
python3 scripts/scrape_event.py --discover sf --topic ai

# 4. Export to CSV
python3 scripts/scrape_event.py https://lu.ma/abc123 --output speakers.csv
```

## Get API Token

1. Sign up: https://apify.com (free tier: $5/month credits)
2. Get token: https://console.apify.com/account/integrations
3. Set env var: `export APIFY_API_TOKEN="your_token"`

## Features

- Scrape speakers, hosts, sponsors from Luma and Eventbrite events
- Discover upcoming events by city and topic
- Export to CSV or JSON
- Smart caching (24h default)
- Designed for AI agent prospecting workflows

## Full Docs

See [SKILL.md](SKILL.md) for complete documentation, workflow steps, and example prompts.

---

**Cost**: ~$0.01-0.05 per event | **Free tier**: $5/month on Apify
