---
name: contact-cache
description: >
  Track all identified/contacted people across strategies. CSV-backed contact
  database with dedup by LinkedIn URL or email. Prevents duplicate outreach
  when running strategies on a recurring cadence.
tags: [lead-generation]
---

# Contact Cache

Track all identified/contacted people across strategies. CSV-backed contact database with dedup by LinkedIn URL or email. Prevents duplicate outreach when running strategies on a recurring cadence.

## Usage

```bash
# Check if contacts are already cached
python3 skills/contact-cache/scripts/cache.py check --linkedin-urls "https://linkedin.com/in/person1,https://linkedin.com/in/person2"
python3 skills/contact-cache/scripts/cache.py check --emails "john@example.com,jane@example.com"

# Add a single contact
python3 skills/contact-cache/scripts/cache.py add --name "John Smith" --linkedin-url "https://linkedin.com/in/johnsmith" --email "john@example.com" --company "Acme Corp" --title "VP Finance" --strategy "2A-hiring-signal"

# Bulk import from CSV
python3 skills/contact-cache/scripts/cache.py add --csv /path/to/leads.csv --strategy "2A-hiring-signal"

# Update a contact's status
python3 skills/contact-cache/scripts/cache.py update --linkedin-url "https://linkedin.com/in/johnsmith" --status contacted --notes "Sent intro email 2026-02-24"

# Export the full cache
python3 skills/contact-cache/scripts/cache.py export --format csv
python3 skills/contact-cache/scripts/cache.py export --format json
python3 skills/contact-cache/scripts/cache.py export --status contacted
python3 skills/contact-cache/scripts/cache.py export --strategy "2A-hiring-signal"

# Print summary statistics
python3 skills/contact-cache/scripts/cache.py stats
```

## Data

Contacts are stored in `skills/contact-cache/data/contacts.csv`. The file is auto-created on first use.

Dedup is by LinkedIn URL (preferred) or email. Both are normalized and hashed (SHA256, first 16 chars) to produce a stable `contact_id`.

## Valid Statuses

`new`, `qualified`, `contacted`, `replied`, `meeting_booked`, `converted`, `not_interested`
