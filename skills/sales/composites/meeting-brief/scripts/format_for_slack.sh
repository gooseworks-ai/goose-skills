#!/bin/bash
# Convert markdown brief to Slack mrkdwn format
# Slack mrkdwn doesn't support # headers or ** bold
# Use this to clean up before sending to Slack

INPUT_FILE="$1"

if [ ! -f "$INPUT_FILE" ]; then
  echo "Error: File not found: $INPUT_FILE"
  exit 1
fi

cat "$INPUT_FILE" | \
  # Remove # headers - just use bold text instead
  sed 's/^### \(.*\)$/\*\1\*/' | \
  sed 's/^## \(.*\)$/\n\*\1\*/' | \
  sed 's/^# \(.*\)$/\*\*\1\*\*/' | \
  # Convert **bold** to *bold* (Slack uses single asterisks)
  sed 's/\*\*\([^*]*\)\*\*/\*\1\*/g' | \
  # Remove horizontal rules (Slack doesn't support them well)
  sed 's/^---$//' | \
  sed 's/^___$//'
