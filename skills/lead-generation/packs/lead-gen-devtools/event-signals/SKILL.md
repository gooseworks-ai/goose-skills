---
name: event-signals
description: Extract leads from conferences, meetups, hackathons, and podcasts by analyzing speaker lists, sponsor lists, hackathon entries, and podcast guests. Discovers events via Sessionize, Confs.tech, Meetup, Luma, ListenNotes, and Devpost. Looks back 90 days and forward 180 days.
user-invocable: true
allowed-tools: Bash, Read, Write, Edit, Grep, Glob, WebFetch, WebSearch
argument-hint: [config-json-path]
---

# Event Signals

Extract leads from the conference and events ecosystem. Events represent public declarations of priorities — a VP speaking about "scaling our infrastructure" is a stronger signal than a Reddit comment, and a company sponsoring a conference category has committed real budget.

## When to Use

- User wants to find leads from conferences, meetups, or developer events
- User wants speaker lists, sponsor lists, or attendee data from events
- User mentions KubeCon, AWS re:Invent, DevOpsDays, or any industry conference
- User wants to find people who spoke or presented about relevant topics
- User asks about hackathon participants using relevant technologies
- User wants podcast guests who discussed relevant challenges
- User describes prospects who attend industry events or speak at conferences

## Prerequisites

- Python 3.9+ with `requests` and optionally `python-dotenv`
- Apify API token in `.env` (for Meetup and Luma — optional)
- ListenNotes API key in `.env` as `LISTENNOTES_API_KEY` (for podcast search — optional, free tier gives 300 req/mo)
- Working directory: the project root containing this skill

## Phase 1: Collect Context

### Step 1: Gather Product & ICP Information

If not already available from prior skills:

> "To find the right event-based leads, I need:
> 1. **What does your product do?** (one-liner)
> 2. **What industry/vertical are you in?** (this determines which conferences matter)
> 3. **What technologies or keywords are in your space?**
> 4. **Who is your ideal buyer?** (their role, what conferences they'd attend)
> 5. **Any specific conferences or events you know about?** (names, URLs)
> 6. **Are you registered on Luma or Meetup for any events?** (if yes, we may be able to access attendee lists)"

## Phase 2: Discover Relevant Events

This is the most agent-driven phase. The agent must actively research to find the right events.

### Step 2: Discover Conferences

Use multiple approaches in parallel:

**2a. Confs.tech (automated):**
The tool can query confs.tech for conferences by topic. Common topics available: `devops`, `javascript`, `ruby`, `python`, `golang`, `rust`, `java`, `php`, `css`, `data`, `security`, `ux`, `android`, `ios`, `general`, `dotnet`, `elixir`, `networking`, `cloud`, `ai`.

**2b. Web search (agent-driven):**
Search for conferences in the user's space. Queries to try:
- "[industry/technology] conferences 2026"
- "[technology] developer conference"
- "[vertical] summit 2026"
- "best [topic] conferences for engineers"
- "[competitor name] conference" (competitors often host their own events)

**2c. Check for Sessionize events:**
Many tech conferences use Sessionize for their schedule. When you find a conference:
1. Check if their schedule page links to Sessionize
2. Look for URLs like `sessionize.com/api/v2/EVENTID` in the page source
3. If Sessionize is used, note the event ID — we can extract all speakers programmatically

**2d. Check for upcoming events (forward-looking 180 days):**
Search for events happening in the next 6 months. The user wants to reach prospects BEFORE the event.
- Search: "[conference name] 2026 dates"
- Check conference websites for published schedules and speaker announcements
- CFP (Call for Papers) deadlines indicate upcoming conferences

**2e. Check for recent events (backward-looking 90 days):**
Recent event speakers/sponsors still have the same priorities. Search for:
- "[conference name] 2025 2026 speakers"
- "[conference name] recap" or "what I learned at [conference]"

### Step 3: Discover Meetups and Local Events

**3a. Meetup.com (automated):**
Generate search queries based on the user's space:
- Technology-specific: "Kubernetes meetup", "WebRTC meetup"
- Industry-specific: "DevOps meetup", "cloud native meetup"
- Location-specific (if user has a target geography)

**3b. Luma (automated via `matyascimbulka/luma-event-scraper`):**
Search Luma for events by category and city. The Luma actor accepts `slugs` (categories) and `cities` instead of free-text search.
- Available categories: `tech`, `food`, `ai`, `arts`, `climate`, `fitness`, `wellness`, `crypto`
- City slugs: `san-francisco`, `new-york`, `london`, etc.
- Luma is popular for: AI/ML community events, startup demo days, developer community gatherings, tech talks and fireside chats

**3c. Ask the user about their registrations:**
> "Are you registered for any events on Luma or Meetup? If you're registered for a Luma event, the attendee list is often publicly visible — I can extract it. For some Meetup events, RSVP lists are public too."

### Step 4: Discover Podcasts

**4a. Identify relevant podcasts:**
Do a web search to find podcasts in the user's space:
- "[technology/industry] podcast"
- "best podcasts for [role/topic]"
- "[competitor name] podcast" (competitors often appear as guests)

**4b. Search for specific episodes:**
Use ListenNotes to search for episodes by keyword:
- "[competitor] review" or "[competitor] experience"
- "[problem space] challenges"
- "[technology] at scale"
- "building [thing the product does]"

### Step 5: Discover Hackathons

**5a. Devpost:**
Search Devpost for hackathons with projects using relevant technologies:
- Go to devpost.com and search for hackathon names in the user's space
- Note the hackathon slug (URL path) for the tool to scrape

**5b. Other hackathon platforms:**
- MLH season events (mlh.io/seasons)
- Company-hosted hackathons (many companies run their own)
- University hackathons (if targeting younger engineers)

### Step 6: Present Discovery Results

Present all discovered events to the user in a table:

```
CONFERENCES (Sessionize available):
  Event                    | Date         | Location      | Sessionize ID
  KubeCon NA 2026          | Oct 13-16    | Salt Lake City| abc123
  DevOpsDays NYC           | Jun 5-6      | New York      | def456

CONFERENCES (need website scraping):
  Event                    | Date         | URL
  AWS re:Invent            | Nov 30-Dec 4 | reinvent.awsevents.com

MEETUP QUERIES: "kubernetes meetup", "cloud native meetup"
LUMA CATEGORIES: "tech", "ai"  |  CITIES: "san-francisco", "new-york"
PODCAST QUERIES: "kubernetes scaling", "infrastructure challenges"
DEVPOST HACKATHONS: "cloud-native-hack-2026", "kubernetes-challenge"
```

Ask the user to review and approve. Also ask if they want to add or remove any events.

### Step 7: Scrape Conference Websites (Agent-Driven)

For conferences NOT on Sessionize, the agent should manually extract:

**Speaker lists:**
- Navigate to the conference website's "Speakers" or "Schedule" page
- Extract: speaker name, company, title, talk title, bio
- Use Chrome DevTools MCP or web fetching tools

**Sponsor lists:**
- Navigate to the "Sponsors" or "Partners" page
- Extract: company name, sponsorship tier (platinum/gold/silver/bronze)
- Higher tiers = more invested in the space

**Save scraped data** to `${CLAUDE_SKILL_DIR}/../.tmp/manual_event_signals.json` in this format:
```json
[
    {
        "person_name": "Jane Smith",
        "company": "Acme Corp",
        "signal_type": "conference_speaker",
        "signal_label": "Conference Speaker",
        "event_name": "KubeCon NA 2026",
        "event_type": "Conference",
        "talk_or_role": "Scaling Kubernetes to 10,000 Nodes",
        "bio": "VP of Infrastructure at Acme Corp",
        "url": "https://kubecon.io/speakers/jane-smith",
        "linkedin": "",
        "twitter": "@janesmith",
        "website": "",
        "date": "2026-10-14",
        "source": "Manual"
    }
]
```

## Phase 3: Execute Scan

### Step 8: Save Config File

```bash
cat > ${CLAUDE_SKILL_DIR}/../.tmp/event_signals_config.json << 'CONFIGEOF'
{
    "keywords": ["kubernetes", "cloud native", "infrastructure"],
    "sessionize_event_ids": ["abc123", "def456"],
    "confstech_topics": ["devops", "cloud"],
    "meetup_queries": ["kubernetes meetup", "cloud native meetup"],
    "meetup_location": "",
    "luma_categories": ["tech", "ai"],
    "luma_cities": ["san-francisco", "new-york"],
    "podcast_queries": ["kubernetes scaling", "infrastructure challenges"],
    "devpost_slugs": ["cloud-native-hack-2026"],
    "manual_signals_file": "${CLAUDE_SKILL_DIR}/../.tmp/manual_event_signals.json",
    "skip": []
}
CONFIGEOF
```

### Step 9: Run the Tool

```bash
python3 ${CLAUDE_SKILL_DIR}/scripts/event_signals.py \
    --config ${CLAUDE_SKILL_DIR}/../.tmp/event_signals_config.json \
    --output ${CLAUDE_SKILL_DIR}/../.tmp/event_signals.csv
```

The tool handles structured sources. The agent handles conference website scraping in Step 7 (before running the tool), saving results to the manual signals file.

**To skip specific sources:**
Add to the config's `skip` array: `"sessionize"`, `"confstech"`, `"meetup"`, `"luma"`, `"podcast"`, `"devpost"`

## Phase 4: Analyze & Recommend

### Step 11: Analyze Results

**11a. Overall Stats**
- Total signals by type (speakers, sponsors, meetup organizers, hackathon entries, podcast guests)
- Total unique people and companies
- Signal source breakdown

**11b. Speaker Analysis**
- Who is speaking about topics relevant to the user's product?
- What companies are they from? (company clustering)
- What are the most common talk themes?
- Any speakers who appear at multiple events? (repeat speakers = thought leaders with influence)

**11c. Sponsor Analysis**
- Which companies are sponsoring events in this space? (they have budget committed)
- Tier analysis — platinum/gold sponsors are the most invested
- Companies sponsoring multiple events = deeply committed to the space

**11d. Hackathon & Community Analysis**
- What technologies are hackathon teams using?
- Which teams built projects most relevant to the user's product?

**11e. Podcast Analysis**
- What topics are being discussed most?
- Which podcast guests talked about problems the user's product solves?

**11f. Time-Based Urgency**
- Upcoming events (next 30 days) = outreach should happen NOW, before the event
- Recent events (last 30 days) = speakers still have the topic top-of-mind
- Events 30-90 days out = time to prepare personalized outreach

### Step 12: Recommend Next Steps

1. **For conference speakers:**
   - Highest-value leads. They publicly declared their priorities.
   - Outreach angle: "I saw your talk on [topic] at [event] — we solve exactly that problem"
   - Recommend enriching via SixtyFour to get contact info
   - If the event is upcoming: "I'll be at [event] too — would love to chat about [topic]"

2. **For sponsors:**
   - These are companies, not individuals. Use SixtyFour `/enrich-company` first, then find the right person.
   - Outreach angle: "I noticed [company] sponsored [event] — you're clearly investing in [space]"

3. **For meetup organizers/attendees:**
   - Community influencers. Good for partnerships, not just sales.
   - Consider having the user attend these meetups for warm intros.

4. **For hackathon participants:**
   - Active builders using relevant tech. Often at startups or building side projects that become companies.
   - Outreach angle: Reference their project specifically.

5. **For podcast guests:**
   - Similar to conference speakers — public thought leaders.
   - Outreach angle: "Listened to your episode on [podcast] about [topic]"

6. **Cross-signal validation:**
   - If a person appeared as both a conference speaker AND was found in GitHub signals or community signals, that's a very high-confidence lead.
   - Check if any companies from event signals also appeared in job signals (hiring + sponsoring = maximum budget commitment).

### Step 13: Ask for Go-Ahead

> "Would you like me to:
> 1. Enrich the top speakers/companies via SixtyFour
> 2. Cross-reference with GitHub/community/job signals data
> 3. Scrape more conference websites for additional speakers/sponsors
> 4. Set up monitoring for upcoming events (recurring scan)
> 5. Export for manual review first"

## Output Schema (Single Sheet)

| Column | Description |
|--------|-------------|
| person_name | Speaker name, organizer, podcast guest, or team member |
| company | Company/organization |
| signal_type | Internal signal type code |
| signal_label | Human-readable signal label |
| event_name | Conference/meetup/hackathon/podcast name |
| event_type | Conference, Meetup, Hackathon, Podcast, Luma Event |
| talk_or_role | Talk title, sponsorship tier, project name, episode title |
| bio | Speaker bio or event/project description |
| linkedin | LinkedIn URL (if available from Sessionize) |
| twitter | Twitter/X handle (if available) |
| website | Personal/company website (if available) |
| date | Event date or episode date |
| signal_score | Weight based on signal type |
| source | Sessionize, Meetup, Luma, ListenNotes, Devpost, Manual |
| url | Link to the event/talk/episode/project |

## Signal Scoring

| Signal Type | Score | Rationale |
|---|---|---|
| Conference Speaker | 9 | Company-approved public statement of priorities |
| Workshop Host | 9 | Deep expertise + company investment in teaching |
| Podcast Guest | 8 | Public discussion of challenges and stack |
| Panel Participant | 8 | Industry voice, often reveals pain points |
| Conference Sponsor | 8 | Committed budget to the space |
| Meetup Organizer | 7 | Community leader and influencer |
| Hackathon Entry | 7 | Active builder using relevant tech |
| Podcast Host | 6 | Creates content in the space — influencer |
| Meetup Attendee | 5 | Interest signal but lower commitment |
| Event Attendee | 5 | Interest signal |

## Event Type Guidelines for the Agent

When discovering events, consider ALL of these event types based on the user's ICP:

**Major Developer Conferences:**
KubeCon, AWS re:Invent, Google Cloud Next, Microsoft Build, QCon, DevOpsDays, GopherCon, PyCon, RustConf, JSConf, ReactConf, DockerCon, HashiConf, Datadog DASH, GitLab Commit, GitHub Universe, Vercel Ship

**Industry/Vertical Conferences:**
SaaStr (SaaS), MWC (mobile), CES (consumer tech), RSA (security), Black Hat (security), Gartner summits, Forrester events

**Startup Events:**
YC Demo Day, TechCrunch Disrupt, Web Summit, Collision, SXSW Interactive, Product Hunt launches

**Meetup Platforms:**
Meetup.com, Luma, Eventbrite, Bevy (community-led events)

**Hackathon Platforms:**
Devpost, MLH events, Devfolio, company-hosted hackathons

**Podcast Networks:**
Changelog, Software Engineering Daily, The New Stack, InfoQ podcasts, a16z podcast, industry-specific pods

The agent should adapt this list based on the user's specific vertical.

## Cost Estimates

| Source | Cost | Notes |
|--------|------|-------|
| Sessionize | Free | Public API, no auth |
| Confs.tech | Free | JSON on GitHub |
| Meetup (Apify) | ~$0.05-0.10/search | Pay-per-event |
| Luma (Apify) | $29/mo + usage or pay-per-event | Depends on actor |
| ListenNotes | Free (300 req/mo) | Free tier sufficient for most |
| Devpost | Free | Custom scraping |
| Manual scraping | Free | Agent uses web tools |
| **Typical run** | **$1-5 total** | Most sources are free |

## Time Window

- **Backward:** 90 days (recent events — speakers still have topic top-of-mind)
- **Forward:** 180 days (upcoming events — reach prospects before the event for maximum impact)
