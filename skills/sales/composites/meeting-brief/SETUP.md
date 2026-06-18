# Meeting Brief - Setup Guide

Quick setup guide for the meeting-brief skill.

## 1. Install the Skill

If you received a .skill file:
```bash
# The skill should already be installed in your skills directory
ls ~/.openclaw/workspace/skills/meeting-brief
```

## 2. Configure Team Members

Edit `config.json` to set your preferences:

```json
{
  "team_members": [
    "alice@yourcompany.com",
    "bob@yourcompany.com"
  ],
  "team_domains": [
    "@yourcompany.com"
  ],
  "schedule": "0 7 * * *",
  "timezone": "America/Los_Angeles",
  "your_email": "you@yourcompany.com",
  "brief_from": "Meeting Brief <you@yourcompany.com>",
  "include_calendar_details": true,
  "research_depth": "standard"
}
```

**Important:**
- Add all team members' emails to `team_members`
- Add your company domain(s) to `team_domains`
- Set `your_email` to where you want briefs sent
- Choose `research_depth`: `quick`, `standard`, or `deep`

## 3. Test Calendar Access

Make sure gcalcli is working:

```bash
gcalcli agenda today tomorrow
```

If you see an OAuth error, re-authenticate:
```bash
gcalcli init
```

## 4. Test the Skill Manually

Ask OpenClaw to run the meeting brief:

```
Run the meeting-brief skill for today's meetings
```

OpenClaw will:
1. Check your calendar
2. Research external attendees
3. Generate briefs
4. Send them to your email

## 5. Set Up Daily Automation (Optional)

To run automatically every morning, ask OpenClaw to create a cron job:

```
Create a daily cron job for the meeting-brief skill at 7am Pacific time
```

Or manually via the cron tool:

```javascript
{
  name: "Meeting Brief - Daily",
  schedule: {
    kind: "cron",
    expr: "0 14 * * *",  // 7 AM Pacific = 14:00 UTC (during standard time)
    tz: "UTC"
  },
  payload: {
    kind: "agentTurn",
    message: "Run the meeting-brief skill for today's meetings",
    timeoutSeconds: 600
  },
  sessionTarget: "isolated"
}
```

## 6. Verify It Works

Check the data directory:
```bash
ls skills/meeting-brief/data/sent/
```

You should see a JSON file for today with sent briefs logged.

## Troubleshooting

**No briefs sent:**
- Check gcalcli: `gcalcli agenda today tomorrow`
- Verify you have meetings with external attendees today
- Check logs: `cat skills/meeting-brief/logs/run.log`

**OAuth errors:**
- Re-authenticate: `gcalcli init`
- Make sure OAuth credentials are valid

**Missing information in briefs:**
- Try increasing `research_depth` to `deep`
- Check that web_search and GitHub CLI are working

**Too many briefs:**
- Add more emails/domains to team filter in config.json

## Customization

**Change brief format:**
- Edit `scripts/generate_brief.js` prompt to customize structure

**Adjust research sources:**
- Edit `scripts/research_person.js` prompt to add/remove sources

**Change schedule:**
- Update `schedule` in config.json
- Recreate the cron job with new time

## Privacy

- All research data is stored locally in `data/`
- No external APIs except web_search (Brave Search)
- Briefs sent only to your configured email
- Team filtering prevents internal info leakage

Enjoy your automated meeting preparation! 🎯
