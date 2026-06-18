#!/usr/bin/env node
/**
 * Generate AI brief for a person based on research data
 * This generates a prompt for OpenClaw to execute
 * 
 * Usage: node generate_brief.js <research_json_file> <meeting_context_json>
 */

const fs = require('fs');
const path = require('path');

const [,, researchFile, meetingFile] = process.argv;

if (!researchFile || !meetingFile) {
  console.error('Usage: node generate_brief.js <research_json_file> <meeting_context_json>');
  process.exit(1);
}

const research = JSON.parse(fs.readFileSync(researchFile, 'utf8'));
const meeting = JSON.parse(fs.readFileSync(meetingFile, 'utf8'));

const prompt = `Generate a personalized meeting brief email based on this research and meeting context.

**Meeting Context:**
- Title: ${meeting.title}
- Date/Time: ${meeting.start_date} ${meeting.start_time}
- Location: ${meeting.location || 'Not specified'}

**Person Research:**
${JSON.stringify(research, null, 2)}

**Generate a brief email with the following structure:**

Subject: Meeting Brief: ${research.person.name} - ${meeting.title}

Email Body (HTML format):

1. **Quick Overview** (2-3 sentences)
   - Who they are (name, title, company)
   - Meeting context (why you're meeting)

2. **Background** (3-5 bullet points)
   - Professional background (from LinkedIn)
   - Company context
   - Technical expertise (from GitHub if applicable)
   - Recent activity

3. **Conversation Starters** (3-4 items)
   - Based on their recent work/activity
   - Shared interests or connections
   - Relevant topics from research

4. **Notes** (if applicable)
   - Past interactions (from memory search)
   - Things to remember
   - Action items or follow-ups

5. **Meeting Details** (footer)
   - Meeting title
   - Time and location
   - Any other relevant details

**Style Guidelines:**
- Professional but conversational
- Concise and scannable (use bullets)
- Highlight the most interesting/relevant insights
- Include specific details from research (not generic)
- Make it actionable (what to ask/discuss)

**Output format:**
Return a JSON object with:
{
  "subject": "Meeting Brief: ...",
  "html": "Full HTML email body",
  "text": "Plain text version (optional)"
}

Generate the brief now:
`;

console.log(prompt);
