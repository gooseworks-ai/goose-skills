#!/bin/bash
# Main orchestration script for daily meeting briefs
# This script is designed to be invoked BY OpenClaw (via cron or manually)
# It outputs instructions for OpenClaw to execute

set -e

SKILL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CONFIG_FILE="$SKILL_DIR/config.json"
DATA_DIR="$SKILL_DIR/data"
LOGS_DIR="$SKILL_DIR/logs"

mkdir -p "$DATA_DIR/meetings" "$DATA_DIR/research" "$DATA_DIR/sent" "$LOGS_DIR"

DATE=$(date +%Y-%m-%d)
LOG_FILE="$LOGS_DIR/run.log"

echo "[$(date)] Starting daily meeting brief run" | tee -a "$LOG_FILE"

# Check if config exists
if [ ! -f "$CONFIG_FILE" ]; then
  echo "ERROR: config.json not found. Please configure the skill first." | tee -a "$LOG_FILE"
  exit 1
fi

# Load config
RESEARCH_DEPTH=$(jq -r '.research_depth // "standard"' "$CONFIG_FILE")
YOUR_EMAIL=$(jq -r '.your_email' "$CONFIG_FILE")

echo "Configuration loaded: research_depth=$RESEARCH_DEPTH, your_email=$YOUR_EMAIL" | tee -a "$LOG_FILE"

# Step 1: Get today's meetings
echo "[$(date)] Fetching today's meetings..." | tee -a "$LOG_FILE"
MEETINGS_FILE="$DATA_DIR/meetings/$DATE.json"

# Use gcalcli to get meetings (this requires OpenClaw to execute)
echo "Execute: bash $SKILL_DIR/scripts/check_calendar.sh > $MEETINGS_FILE"

# Step 2: Extract external attendees
echo "[$(date)] Processing meetings and filtering attendees..." | tee -a "$LOG_FILE"

# Output: Instructions for OpenClaw to follow
cat << 'EOF'

# Daily Meeting Brief Workflow

Follow these steps to generate and send meeting briefs:

## 1. Fetch Today's Meetings

Run the check_calendar.sh script:
```bash
cd /home/ubuntu/.openclaw/workspace/skills/meeting-brief
bash scripts/check_calendar.sh > data/meetings/$(date +%Y-%m-%d).json
```

## 2. Load Configuration and Meetings

Read:
- `config.json` - For team members to filter
- `data/meetings/YYYY-MM-DD.json` - Today's meetings

## 3. Filter External Attendees

For each meeting, extract attendees and filter out:
- Emails in `config.team_members`
- Emails matching `config.team_domains` patterns

Create a list of unique external people to research.

## 4. Check Already-Sent Briefs

Read `data/sent/YYYY-MM-DD.json` to see if briefs were already sent today.
Skip people who already have briefs sent.

## 5. Research Each Person

For each external attendee:

a) Generate research using the research_person.js prompt generator:
```bash
node scripts/research_person.js "Person Name" "email@example.com" "Company Name" "standard"
```

b) Execute the research (use web_search, GitHub CLI, memory_search as appropriate)

c) Save research results to: `data/research/person-name-YYYY-MM-DD.json`

## 6. Generate Brief for Each Person

For each researched person:

a) Prepare meeting context JSON:
```json
{
  "title": "Meeting Title",
  "start_date": "2026-02-21",
  "start_time": "14:00",
  "location": "Zoom"
}
```

b) Generate brief prompt:
```bash
node scripts/generate_brief.js data/research/person-name-YYYY-MM-DD.json meeting_context.json
```

c) Execute AI brief generation (use the generated prompt)

d) Save brief to: `data/sent/YYYY-MM-DD/person-name-brief.json`

## 7. Send Briefs via Email

For each generated brief:

Use the gmail skill to send email:
- To: [your_email from config]
- From: [brief_from from config]
- Subject: [from brief.subject]
- Body: [from brief.html]

## 8. Log Sent Briefs

Update `data/sent/YYYY-MM-DD.json` with:
```json
{
  "date": "2026-02-21",
  "briefs_sent": [
    {
      "person": "Person Name",
      "email": "email@example.com",
      "meeting": "Meeting Title",
      "sent_at": "2026-02-21T08:15:00Z"
    }
  ]
}
```

## 9. Summary

Report:
- Number of meetings today
- Number of external attendees
- Number of briefs generated and sent
- Any errors or skipped people

---

**Note:** This is an orchestration workflow. Execute each step in order, using OpenClaw's tools (web_search, gh CLI, memory_search, gmail skill, etc.) as needed.

EOF

echo "[$(date)] Daily meeting brief workflow output complete" | tee -a "$LOG_FILE"
