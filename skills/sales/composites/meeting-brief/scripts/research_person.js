#!/usr/bin/env node
/**
 * Research a person for meeting brief
 * This generates a research prompt for OpenClaw to execute
 * 
 * Usage: node research_person.js <name> <email> <company> <research_depth>
 */

const fs = require('fs');
const path = require('path');

const [,, name, email, company, researchDepth = 'standard'] = process.argv;

if (!name) {
  console.error('Usage: node research_person.js <name> <email> <company> <research_depth>');
  process.exit(1);
}

// Generate research prompt for OpenClaw
const prompt = `Research this person for a meeting brief:

**Person:** ${name}
**Email:** ${email || 'Unknown'}
**Company:** ${company || 'Unknown'}
**Research Depth:** ${researchDepth}

Execute the following research steps and return structured JSON:

${researchDepth === 'quick' ? `
1. Web search for LinkedIn profile: "${name} ${company} LinkedIn"
2. Web search for company info: "${company}"
` : ''}

${researchDepth === 'standard' || researchDepth === 'deep' ? `
1. Web search for LinkedIn profile: "${name} ${company} LinkedIn"
2. Web search for company info: "${company}"
3. GitHub search: Try to find GitHub profile (search by name/email if available)
4. Web search for recent news: "${name} ${company} news"
` : ''}

${researchDepth === 'deep' ? `
5. Memory search: Search MEMORY.md and daily notes for past interactions with "${name}"
6. Web search for professional background: "${name} background career"
` : ''}

**Output format (JSON):**
\`\`\`json
{
  "person": {
    "name": "${name}",
    "email": "${email || ''}",
    "company": "${company || ''}",
    "title": "extracted from LinkedIn or web search"
  },
  "linkedin": {
    "url": "LinkedIn profile URL",
    "bio": "Brief bio",
    "current_role": "Current position",
    "experience": ["Previous roles"]
  },
  "github": {
    "username": "GitHub username if found",
    "profile_url": "GitHub profile URL",
    "bio": "GitHub bio",
    "top_languages": ["Language1", "Language2"],
    "notable_repos": [
      {
        "name": "repo name",
        "description": "repo description",
        "stars": 0
      }
    ]
  },
  "company": {
    "name": "${company || ''}",
    "industry": "Industry from web search",
    "description": "What the company does",
    "recent_news": ["Recent news item 1", "Recent news item 2"]
  },
  "recent_activity": [
    "Recent blog post, talk, or publication"
  ],
  "past_interactions": [
    "Past meeting notes or interactions from memory search (deep mode only)"
  ],
  "conversation_starters": [
    "Suggested conversation starter 1",
    "Suggested conversation starter 2"
  ]
}
\`\`\`

If any information is not found, use empty string or empty array. Be concise but thorough.
`;

console.log(prompt);
