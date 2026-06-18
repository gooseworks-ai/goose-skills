---
name: newsletter-monitor
description: >
  Scan an AgentMail inbox for newsletter signals using configurable keyword
  campaigns. Extracts matched keywords, context snippets, and company mentions
  from incoming emails. Use for monitoring accounting industry newsletters
  for buying signals like acquisitions, migrations, and staffing news.
---

# Newsletter Monitor

Scan an AgentMail inbox for newsletter signals using configurable keyword campaigns. Designed for monitoring accounting industry newsletters for buying signals like acquisitions, Sage Intacct migrations, staffing challenges, and technology adoption.

## Quick Start

```bash
# Set your API key
export AGENTMAIL_API_KEY="your_key_here"

# Scan inbox with all campaigns (summary view)
python3 skills/newsletter-monitor/scripts/scan_newsletters.py --output summary

# Scan specific campaign, last 7 days
python3 skills/newsletter-monitor/scripts/scan_newsletters.py --campaign acquisitions --days 7 --output summary

# JSON output for downstream processing
python3 skills/newsletter-monitor/scripts/scan_newsletters.py --output json --limit 50
```

## Dependencies

```
pip3 install agentmail python-dotenv
```

## Configuration

Keyword campaigns are defined in `config/campaigns.json`. Each campaign has a description and a list of keywords for case-insensitive substring matching.

Built-in campaigns:
- **acquisitions** - CPA firm M&A activity
- **sage_intacct** - Sage Intacct migration and implementation signals
- **staffing** - Accounting talent and staffing challenges
- **technology** - Accounting technology adoption

## CLI Options

| Flag | Description | Default |
|------|-------------|---------|
| `--campaign NAME` | Run only a specific campaign | All campaigns |
| `--days N` | Only scan emails from last N days | No limit |
| `--keywords "a,b,c"` | Custom keywords (overrides campaigns) | Use campaigns.json |
| `--output json\|summary` | Output format | `json` |
| `--inbox ADDRESS` | Override inbox address | `AGENTMAIL_INBOX` env or `supergoose@agentmail.to` |
| `--limit N` | Max messages to fetch | `100` |

## Output

### JSON mode (default)

Returns an array of matched messages with:
- `message_id`, `from`, `subject`, `date`
- `matched_campaigns` - which campaigns triggered
- `matched_keywords` - specific keywords found
- `context_snippets` - 200-char window around each match
- `companies_mentioned` - capitalized multi-word phrases near matches

### Summary mode

Human-readable report showing matched emails grouped by campaign with snippets and detected companies.

## Downstream Skills

When newsletter signals are found, chain to:
- **company-contact-finder** - look up contacts at mentioned companies
- **accounting-news-monitor** - combine with direct news monitoring for fuller signal coverage
