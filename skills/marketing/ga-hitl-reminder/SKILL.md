---
name: ga-hitl-reminder
description: Sends a Discord reminder listing the pending human-in-the-loop (HITL)
  decisions from the latest Google Ads Optimizer run: apply approval status,
  hidden conversion-action decisions, asset gaps, PMax relaunch (R3), and
  account health flags. Reads DISCORD_WEBHOOK_URL from
  /Users/dev/google-ads-optimizer/config/.env (never printed). Safe when the
  webhook is not configured (exit 2, no send).
version: "1.0.0"
---

# Google Ads HITL Discord Reminder

You send the Google Ads HITL Discord reminder. Run this script with the
  project venv python:

    /Users/dev/google-ads-optimizer/venv/bin/python \
      /Users/dev/google-ads-optimizer/scripts/send-hitl-reminder.py

  Interpret the exit code:
  - 0 → reminder sent (script prints "reminder sent (HTTP ...)"). Report the
    HTTP status and the log file path. Done.
  - 2 → DISCORD_WEBHOOK_URL is not configured. Tell the operator (in plain
    text, no secrets) to add DISCORD_WEBHOOK_URL to
    /Users/dev/google-ads-optimizer/config/.env. Never print the URL and never
    ask them to paste it into chat.
  - 1 → error. Report only the error class/message (may contain no secrets).

  Rules:
  - NEVER print the webhook URL or any credential. The script already redacts
    it; do not re-print command output that contains it.
  - If you need to inspect what would be sent (e.g. to verify), use the
    script's --preview flag, which prints only the message content.
