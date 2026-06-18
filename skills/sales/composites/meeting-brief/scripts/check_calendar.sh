#!/bin/bash
# Fetch today's meetings from Google Calendar via gcalcli

set -e

SKILL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DATA_DIR="$SKILL_DIR/data/meetings"
mkdir -p "$DATA_DIR"

DATE=$(date +%Y-%m-%d)
OUTPUT_FILE="$DATA_DIR/$DATE.json"

echo "Fetching today's meetings..." >&2

# Get today's agenda in TSV format for easier parsing
AGENDA=$(gcalcli --nocolor --tsv agenda today tomorrow 2>/dev/null || true)

if [ -z "$AGENDA" ]; then
  echo "No meetings today or gcalcli error" >&2
  echo "[]" > "$OUTPUT_FILE"
  cat "$OUTPUT_FILE"
  exit 0
fi

# Parse TSV into JSON
# Format: start_date	start_time	end_date	end_time	title	location	description	calendar

python3 << 'PYTHON_EOF'
import sys
import json
import re
from datetime import datetime

meetings = []
input_data = """$AGENDA"""

for line in input_data.strip().split('\n'):
    if not line.strip():
        continue
    
    parts = line.split('\t')
    if len(parts) < 5:
        continue
    
    start_date = parts[0]
    start_time = parts[1]
    end_date = parts[2] if len(parts) > 2 else start_date
    end_time = parts[3] if len(parts) > 3 else ""
    title = parts[4] if len(parts) > 4 else "Untitled"
    location = parts[5] if len(parts) > 5 else ""
    description = parts[6] if len(parts) > 6 else ""
    calendar = parts[7] if len(parts) > 7 else ""
    
    # Extract attendees from description (gcalcli doesn't expose attendees directly in TSV)
    # Look for email patterns in description
    attendees = []
    email_pattern = r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}'
    if description:
        attendees = list(set(re.findall(email_pattern, description)))
    
    meeting = {
        "title": title,
        "start_date": start_date,
        "start_time": start_time,
        "end_date": end_date,
        "end_time": end_time,
        "location": location,
        "description": description,
        "calendar": calendar,
        "attendees": attendees,
        "datetime_iso": f"{start_date}T{start_time or '00:00:00'}"
    }
    
    meetings.append(meeting)

print(json.dumps(meetings, indent=2))
PYTHON_EOF

# Save to file
python3 << PYTHON_EOF2 > "$OUTPUT_FILE"
import sys
import json
import re
from datetime import datetime

meetings = []
input_data = """$AGENDA"""

for line in input_data.strip().split('\n'):
    if not line.strip():
        continue
    
    parts = line.split('\t')
    if len(parts) < 5:
        continue
    
    start_date = parts[0]
    start_time = parts[1]
    end_date = parts[2] if len(parts) > 2 else start_date
    end_time = parts[3] if len(parts) > 3 else ""
    title = parts[4] if len(parts) > 4 else "Untitled"
    location = parts[5] if len(parts) > 5 else ""
    description = parts[6] if len(parts) > 6 else ""
    calendar = parts[7] if len(parts) > 7 else ""
    
    attendees = []
    email_pattern = r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}'
    if description:
        attendees = list(set(re.findall(email_pattern, description)))
    
    meeting = {
        "title": title,
        "start_date": start_date,
        "start_time": start_time,
        "end_date": end_date,
        "end_time": end_time,
        "location": location,
        "description": description,
        "calendar": calendar,
        "attendees": attendees,
        "datetime_iso": f"{start_date}T{start_time or '00:00:00'}"
    }
    
    meetings.append(meeting)

print(json.dumps(meetings, indent=2))
PYTHON_EOF2

echo "Saved ${#meetings[@]} meetings to $OUTPUT_FILE" >&2
cat "$OUTPUT_FILE"
