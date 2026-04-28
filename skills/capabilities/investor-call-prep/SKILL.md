---
name: investor-call-prep
description: Prepare for investor calls by pulling upcoming meetings from Google Calendar, deeply researching each investor and their firm (website scraping, portfolio analysis, thesis extraction), checking for competitor conflicts, and outputting an honest prep sheet with compatibility assessments. Use when asked to prep for investor meetings, fundraising calls, VC meetings, or demo day.
source: orthogonal
---


# Investor Call Prep

## Setup

Read your credentials from ~/.gooseworks/credentials.json:
```bash
export GOOSEWORKS_API_KEY=$(python3 -c "import json;print(json.load(open('$HOME/.gooseworks/credentials.json'))['api_key'])")
export GOOSEWORKS_API_BASE=$(python3 -c "import json;print(json.load(open('$HOME/.gooseworks/credentials.json')).get('api_base','https://api.gooseworks.ai'))")
```

If ~/.gooseworks/credentials.json does not exist, tell the user to run: `npx gooseworks login`

All endpoints use Bearer auth: `-H "Authorization: Bearer $GOOSEWORKS_API_KEY"`


Pull investor meetings from Google Calendar, deep-research each firm (scrape their website, analyze portfolio, extract thesis), and output an honest prep sheet that says which investors are a real fit and which aren't.

**Read-only calendar access. Never creates, modifies, or deletes events.**

## Input

- **domain** (required) — user's company website (provided in the prompt, e.g. "prep my investor calls for orthogonal.com")
- **competitors** (optional) — auto-detected if not provided

Always export to Google Sheets at the end — it's free and takes seconds.

## Step 1: Pull Investor Meetings

Pull from today through Demo Day (March 24, 2026). All W26 companies are fundraising now through Demo Day. Make multiple calls if needed to avoid truncation — e.g. split into week 1 and week 2.

```bash
# Adjust timeMin to today's date
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"google-calendar","path":"/list-events"}'
  "calendarId": "primary",
  "timeMin": "{today}T00:00:00Z",
  "timeMax": "{midpoint}T23:59:59Z",
  "maxResults": 100,
  "singleEvents": true,
  "orderBy": "startTime"
}'

curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"google-calendar","path":"/list-events"}'
  "calendarId": "primary",
  "timeMin": "{midpoint+1}T00:00:00Z",
  "timeMax": "2026-03-24T23:59:59Z",
  "maxResults": 100,
  "singleEvents": true,
  "orderBy": "startTime"
}'
```

### Filtering — be precise, not greedy

The keyword approach catches false positives (personal meetings, mock pitches, etc.). Use this priority order:

1. **Strong signal (auto-include):** Title starts with "Investors between" — this is the standard Cal.com booking format for investor meetings.
2. **Medium signal (auto-include):** Attendee email domain is a known VC domain (e.g. `@moonfire.com`, `@a16z.com`, `@accel.com`) OR the event description contains VC firm names.
3. **Weak signal (requires confirmation):** Title contains keywords like `invest`, `vc`, `fund`, `capital`, `ventures`, `angel`, `seed`, `series` — BUT does NOT match pattern #1. These need manual review.
4. **Exclude:** Events with "mock" or "practice" in title/description (these are rehearsals, not real meetings). Also exclude batch/group events with no attendees (e.g. "Fundraising Open Mic", "Demo Day") — these are YC events, not 1:1 investor calls.

Extract: title, date/time, attendee emails (non-company = investor contacts), description (often has investor names/emails even when attendee list doesn't).

**Present filtered list to user for confirmation before proceeding.**

### Create the Google Sheet immediately after confirmation

Before starting any research, create the spreadsheet and populate it with all confirmed investor rows (date/time, firm name, investor name, firm website — leave research columns blank). Share the link with the user so they can watch results fill in live as each investor is researched. This is much better UX than waiting for all research to complete.

## Step 2: Research the User's Company

**Ask the user to describe their company in 1-2 sentences** rather than relying on Perplexity, which often confuses companies with similar names (e.g. orthogonal.com vs orthogonal.io). The user's own description is always more accurate than a web search for early-stage startups.

Then auto-detect competitors:

```bash
# Auto-detect competitors (skip if user provided)
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"perplexity","path":"/chat/completions"}'
  "model": "sonar",
  "messages": [{"role": "user", "content": "Top 5-10 competitors of {company_name} ({domain})? {user_provided_description}. Company names and domains only."}]
}'
```

**Verify the competitor list with the user** before proceeding. Perplexity often returns enterprise incumbents (MuleSoft, Workato) rather than actual startup competitors. The user knows their competitive landscape better.

Save the company description and confirmed competitor list — use them for every investor assessment.

### Step 2b: Reverse-lookup competitor investors (one-time, cheap)

Instead of asking each investor "have you invested in X?" (unreliable), do a single reverse lookup for each competitor. This is 1 Perplexity call per competitor — not per investor.

```bash
# Run one call per competitor (e.g. 5 competitors = 5 calls total)
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"perplexity","path":"/chat/completions"}'
  "model": "sonar",
  "messages": [{"role": "user", "content": "Who are the investors in {competitor_name} ({competitor_domain})? List all known venture capital firms and angel investors who have invested in them, with round details if available."}]
}'
```

Build a lookup table: `{investor_firm -> [competitors they backed]}`. Cross-reference this against the meeting list. This catches conflicts that per-investor Perplexity queries miss, at a fraction of the cost.

## Step 3: Research Each Investor

Run ALL of these in parallel per investor. Every source adds unique data.

### 3a. Apollo — investor profile from email

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"apollo","path":"/api/v1/people/match"}'
  "email": "{investor_email}",
  "reveal_personal_emails": true
}'
```

**No attendee email? Don't stop.** Parse firm name from event title, then:

```bash
# Firm enrichment
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"apollo","path":"/api/v1/organizations/enrich","query":{"domain":"{firm_domain}"}}'

# Find key people
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"apollo","path":"/api/v1/mixed_people/search"}'
  "q_organization_domains": "{firm_domain}",
  "person_titles": ["Partner", "Principal", "Managing Director", "GP", "General Partner", "Investor"],
  "page": 1,
  "per_page": 10
}'
```

### 3b. Scrape the firm's website (most reliable source)

VC websites are the ground truth. Perplexity and Apollo often have gaps for smaller firms.

```bash
# Main page — thesis, overview, portfolio
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"scrapegraph","path":"/v1/smartscraper"}'
  "website_url": "https://{firm_website}",
  "user_prompt": "Extract ALL information: investment thesis, fund size, check size, stage focus, sector focus, geographic focus, every portfolio company listed, team members with titles and LinkedIn URLs, contact info."
}'

# Portfolio page (try /portfolio, /companies, /investments — skip on 404)
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"scrapegraph","path":"/v1/smartscraper"}'
  "website_url": "https://{firm_website}/portfolio",
  "user_prompt": "Extract every portfolio company: name, sector, funding stage, description, website URL."
}'

# Team page (try /team, /people, /about — skip on 404)
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"scrapegraph","path":"/v1/smartscraper"}'
  "website_url": "https://{firm_website}/team",
  "user_prompt": "Extract every team member: full name, title, LinkedIn URL, bio summary, background."
}'
```

### 3c. Perplexity — thesis, portfolio, competitor check

**Critical: use context-rich prompts.** Include location, GP names, aliases. "Tell me about e2vc" gets nothing. "Tell me about e2vc, formerly 500 Emerging Europe, based in Turkey" gets rich results.

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"perplexity","path":"/chat/completions"}'
  "model": "sonar",
  "messages": [{"role": "user", "content": "Tell me about {firm_name}, a venture capital firm{location_context}{gp_context}{alias_context}. I am raising for {company_name}, {company_description}. Answer:
1. Investment thesis and typical check size?
2. Notable portfolio companies in {company_sectors}?
3. Have they invested in any of these competitors: {competitor_list}?
4. What stage?
5. Recent investments or news?
6. Key partners and backgrounds?
7. Would {company_name} be a good fit for them? Why or why not?"}]
}'
```


## Step 4: Classify Before Compiling

Before writing up the prep sheet, classify each meeting into one of these categories based on research:

1. **VC Fund** — traditional venture capital firm (GP, Partner, Principal, Associate)
2. **Angel** — individual investor (current/former founder, operator, or executive investing personally)
3. **NOT an investor** — flag prominently. This includes:
   - Founders of other startups (potential BD/partnership, not fundraise)
   - Researchers/academics with no investing track record
   - Operators at companies (not investing personally)
   - Mock pitch / practice sessions

For non-investors, still include them in the sheet but mark the Compatibility column as "NOT AN INVESTOR" and explain what the meeting likely is (BD, partnership, mock pitch, etc.). This prevents the user from wasting prep time on a fundraise pitch when the meeting is something else.

### Surface ecosystem investments, not just competitor conflicts

When an investor has portfolio companies that are **adjacent** to the user's space (not direct competitors but in the same ecosystem), surface these as **Ecosystem Signals** rather than ignoring them. These are actually positive — they show the investor understands the space.

Examples:
- An investor backed CrewAI (AI agent framework) → they understand agents need API access → good hook for Orthogonal
- An investor backed Arcade.dev (AI tooling) → adjacent, not a conflict → shows thesis alignment
- An investor backed Langbase (AI agents) → ecosystem overlap → talking point

Only flag as **Competitor Conflict** if the portfolio company is a direct competitor (same product, same customer, same use case). Adjacent/ecosystem companies go in the Talking Points column as conversation hooks.

## Step 5: Compile Prep Sheet

Cross-reference all sources. When they conflict, prefer: **website > Apollo > Perplexity**.

### Output format per meeting:

```
## {Firm Name} — {Date/Time}

**Investor:** {Name}, {Title}
**LinkedIn:** {linkedin_url}
**Firm:** {firm_name} | {firm_linkedin_url} | {firm_website}

**Thesis:** {specific, not generic}
**Stage:** {seed, Series A, etc.} | **Check Size:** {range} | **Fund Size:** {if known}
**Geographic Focus:** {regions}

**Portfolio ({count}):** {most relevant to user's space}
**Competitor Conflicts:** {names} or None found

**Compatibility: {verdict}**
{honest, company-specific assessment}

**Talking Points:**
1. {angle from portfolio overlap}
2. {angle from partner's background}
3. {angle from thesis alignment}
```

### Compatibility — Be Honest and Specific

Every rating must reference the user's specific company, product, and sector. Generic assessments are useless.

**Strong Fit** — Thesis covers user's sector AND stage. Adjacent portfolio companies (not competitors). Partner has relevant domain expertise.
> "Strong fit — Revo invests in B2B SaaS + AI from Turkey/CEE at seed-Series A ($500K-$5M). Their marketplace portfolio companies are adjacent. Melis's M&A background means she gets platform economics."

**Moderate Fit** — Partial overlap. Be specific about what's missing.
> "Moderate fit — right stage but portfolio leans fintech/industrial tech, no developer tools. You'll need to educate them on the API marketplace space."

**Weak Fit** — Wrong thesis, stage, geography, or has funded a competitor. Don't sugarcoat.
> "Weak fit — consumer apps focus, Series B+ checks. No dev tools portfolio. May not be worth your limited pre-demo-day time."

**Competitor Conflict** — Flag prominently.
> "They backed Composio — a direct competitor. Ask early whether this creates a conflict."

## Step 6: Google Sheets Export

The spreadsheet was already created in Step 1. Update each row as research completes — use `curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"google-sheets","path":"/update-values`"}'

**Important:** Always use `curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"google-sheets`","path":"for"}'

## Tips

- **Parallelize everything**: Apollo, Scrapegraph, Perplexity, Fiber are independent — run all in parallel per investor, and process investors simultaneously.
- **Website > all other sources**: Firm websites are ground truth. Always scrape.
- **No email? Parse the firm name** from the event title → derive domain → Apollo org enrich + people search + website scrape.
- **Context in Perplexity prompts**: Include location, GP names, "formerly known as" — massively improves results for smaller firms.
- **Be brutal on fit**: User has limited time. Say which meetings to prioritize and which to skip.
- **Firm domain from email**: `investor@somefirm.com` → domain is `somefirm.com`.
- **Multiple attendees**: Run Apollo on each. Most senior person = decision-maker.
