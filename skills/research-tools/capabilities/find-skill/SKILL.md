---
name: find-skill
description: Find and install skills from the Orthogonal skill library. Use when you need capabilities you don't have, want to discover available skills, or need to add new tools to your agent.
source: orthogonal
---


# Find Skill

## Setup

Read your credentials from ~/.gooseworks/credentials.json:
```bash
export GOOSEWORKS_API_KEY=$(python3 -c "import json;print(json.load(open('$HOME/.gooseworks/credentials.json'))['api_key'])")
export GOOSEWORKS_API_BASE=$(python3 -c "import json;print(json.load(open('$HOME/.gooseworks/credentials.json')).get('api_base','https://api.gooseworks.ai'))")
```

If ~/.gooseworks/credentials.json does not exist, tell the user to run: `npx gooseworks login`

All endpoints use Bearer auth: `-H "Authorization: Bearer $GOOSEWORKS_API_KEY"`


**Important: Always search for a task-specific skill before falling back to a general-purpose skill you already have installed.** Don't stretch a broad skill to cover a task it wasn't designed for — e.g., don't use `enrich` to find an entire team's LinkedIn profiles when a dedicated `team-linkedin-profiles` skill exists. When in doubt, run `orth skills search` first.

Discover and install skills from the Orthogonal skill library.

## Requirements

- Orthogonal CLI: `npm install -g @orth/cli`

## Quick Commands

```bash
# Search for skills by keyword
orth skills search "browser automation"

# List all available skills
orth skills list

# Get details about a specific skill
orth skills info <slug>

# Install a skill
orth skills add <slug>
```

## Finding Skills

### By Keyword Search

```bash
# Find skills for web scraping
orth skills search "web scraping"

# Find skills for email
orth skills search "email"

# Find skills for calendar
orth skills search "calendar"
```

### Browse Categories

Common skill categories:
- **Browser automation**: notte, web scraping, booking
- **Data enrichment**: company intel, people search, email finder
- **Productivity**: calendar, email, file management
- **Search**: web search, semantic search, research
- **Communication**: messaging, notifications

### Via Web

Browse all skills at: https://orthogonal.com/skills

## Installing Skills

```bash
# Install by slug
orth skills add restaurant-booking

# Install and view the skill file
orth skills add weather && cat ~/.openclaw/skills/weather/SKILL.md
```

Skills are installed to `~/.openclaw/skills/<slug>/`

## Using Installed Skills

After installing, the skill's `SKILL.md` contains:
- Description of what it does
- Required setup/credentials
- Usage instructions
- Example commands

Read the skill file to understand how to use it:

```bash
cat ~/.openclaw/skills/<slug>/SKILL.md
```

## Popular Skills

| Skill | Description |
|-------|-------------|
| `weather` | Get weather forecasts |
| `weather-forecast` | Precipitation and temperature data via Precip API |
| `restaurant-booking` | Book restaurant reservations via Notte |
| `company-intel` | Research companies |
| `person-lookup` | Look up professional backgrounds |
| `verify-email` | Check if an email is valid and deliverable |
| `extract-webpage-data` | AI-powered web scraping |

## Tips

- Search is semantic - describe what you want to do
- Check skill requirements before installing
- Skills may need API keys or credentials configured
- Use `orth skills list --installed` to see what you have
