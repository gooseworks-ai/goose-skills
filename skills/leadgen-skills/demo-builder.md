---
name: demo-builder
description: After lead generation, builds personalized demo assets for top prospects using the founder's own product API/MCP. Researches the prospect's business, proposes demo concepts that show the founder's product solving the prospect's specific problem, builds a working prototype, tests it, and generates a polished comparison report with a live demo link. Works with any product that has API or MCP access.
---

# Demo Builder

Turn scored leads into personalized demo assets that sell. Instead of sending cold emails, send a working prototype built on your product that solves the prospect's actual problem — with a comparison report and live demo link.

## When to Use

- User has completed a lead generation run (any signal skill) and has a prospect list
- User asks "what do I do with these leads", "how do I reach out", or "help me with outreach"
- User wants to create sales collateral, demo assets, or proof-of-concepts for prospects
- User asks to "build a demo", "create an asset", or "personalize outreach"
- User has a product with API access, SDK, MCP server, or CLI and wants to demonstrate it to a prospect
- User wants to move from "list of names" to "active sales pipeline"

## Prerequisites

- A completed lead generation run with at least one xlsx output from any signal skill
- The shared context object from lead-discovery (product description, ICP, competitors)
- API access, MCP access, SDK, or CLI for the user's product — the agent needs to be able to actually build something
- Access to the product's documentation (API docs URL, SDK readme, or MCP tool list)

## Phase 1: Select a Prospect

### Step 1: Review the Lead Data

Read the xlsx outputs from prior signal runs. Identify the top prospects by looking for:

**Highest-priority prospects for a demo (in order):**

1. **Multi-signal leads** — prospects that appeared in 2+ signal sources (e.g., showed up in both GitHub signals AND job signals). These have the strongest buying intent.
2. **Switching signals** — from competitor-signals, anyone flagged as "switching from" a competitor. They are actively evaluating alternatives RIGHT NOW.
3. **Build-vs-buy signals** — from job-signals, companies with "build our own" or "greenfield" language. They're about to invest engineering time you could save them.
4. **High interaction score** — from github-repo-signals, users with scores of 15+ who interacted deeply with competitor repos.
5. **Community pain signals** — from community-signals, users who posted about problems your product solves.
6. **Company clusters** — from github-repo-signals, companies with 3+ engaged users (organizational adoption signal).

### Step 2: Shortlist 3-5 Candidates

Present the user with 3-5 prospect candidates, each with:

```
PROSPECT: [Company Name]
  Signal sources: [which signal skills flagged them]
  Key signal: [the strongest signal — e.g., "opened GitHub issue about latency in competitor X"]
  Contact: [name, role if known, email if enriched]
  Why this prospect: [1-2 sentences on why they'd be receptive to a demo]
  Demo feasibility: [HIGH/MEDIUM/LOW — based on whether their use case is clear enough to build something]
```

Ask the user:
> "These are the prospects I'd recommend building a demo for. Which one should we start with? I'll build a working prototype on your platform tailored to their specific use case."

### Step 3: User Picks One

Once the user selects a prospect, proceed to Phase 2. Only build for ONE prospect initially — this is a trial run to validate the approach before scaling.

---

## Phase 2: Research the Prospect

### Step 4: Deep-Dive the Prospect's Business

Research the selected prospect company thoroughly. Use web search, their website, and any data from the signal outputs.

**Gather:**

1. **What the company does** — one-liner description, industry, target market
2. **Their customers** — who do they serve (B2B, B2C, enterprise, SMB)
3. **Scale indicators** — employee count, funding, customer volume (from website copy like "trusted by X companies" or "X million users")
4. **Current tech stack** — from job postings, GitHub repos, blog posts, or the signal data itself
5. **Pain points relevant to your product** — from the signal that surfaced them (the issue they opened, the job they posted, the forum complaint they made, the competitor they're using)
6. **Regulatory or compliance needs** — especially important for healthcare, fintech, government (e.g., HIPAA, SOC 2, PCI-DSS)
7. **Public-facing workflows** — how do their customers interact with them today? (website flows, onboarding, support, booking, etc.)

**Key sources to check:**
- Company website (homepage, about, pricing, customers/case studies pages)
- Job postings (from job-signals data or their careers page) — these reveal priorities and tech stack
- Their GitHub org (if they have one) — reveals what they build and what they use
- The original signal data — the specific issue, post, or job that flagged them
- News/press about the company — recent funding, launches, or initiatives
- LinkedIn company page (for size and industry confirmation)

Present a brief to the user:
> "Here's what I found about [Company]. Based on this, here are my ideas for what we could build."

---

## Phase 3: Propose Demo Concepts

### Step 5: Generate Demo Ideas

Based on the intersection of (a) what the user's product does and (b) what the prospect needs, propose 2-3 demo concepts.

**Framework for generating ideas:**

Ask yourself: "If I were a solutions engineer at [user's company] preparing for a meeting with [prospect], what would I build to show them the product solves their specific problem?"

**The demo should:**
- Solve a real, visible problem the prospect has (not a hypothetical one)
- Use the prospect's actual business context (their company name, their industry terms, their workflows)
- Be functional enough that the prospect can interact with it (not a mockup — a working prototype)
- Be buildable with the user's product API/MCP/SDK in a single session
- Showcase 2-3 key differentiators of the user's product vs. competitors

**Common demo patterns by product type:**

| Product Type | Demo Pattern | Example |
|---|---|---|
| Voice/Communication API | Build an AI agent for the prospect's use case | Appointment scheduler for a healthcare company |
| Observability tool | Set up monitoring on a sample app mimicking the prospect's stack | Dashboard showing the metrics they'd care about |
| API platform | Build a small integration the prospect would actually need | Connect two tools they use and show data flowing |
| Developer tool / SDK | Build a mini-app using the prospect's domain | A prototype feature their customers would use |
| Infrastructure / DevOps | Configure a deployment pipeline for their stack | Working CI/CD or infra-as-code for their tech |
| Data / Analytics | Build a dashboard or pipeline using their public data | Analysis of their public metrics, app store data, etc. |
| Security tool | Run a scan or audit on their public-facing assets | Security report on their website or API |
| AI/ML platform | Build a model or agent for their domain | Trained on their public content, solving their problem |

**Present to the user:**

```
DEMO CONCEPT 1: [Name]
  What it does: [2-3 sentences]
  Why it resonates: [connects to the signal that surfaced this prospect]
  Prospect's reaction: [what they'll think when they see this]
  Complexity: [LOW / MEDIUM / HIGH]
  Build time: [rough estimate]

DEMO CONCEPT 2: [Name]
  ...

DEMO CONCEPT 3: [Name]
  ...
```

Ask:
> "Which concept should I build? I'll use your [API/MCP/SDK] to create a working version. Once it's ready, I'll test it and generate a comparison report you can send to [prospect contact name]."

### Step 6: User Approves a Concept

Once the user picks a concept, confirm the scope:
> "I'll build [concept]. To do this, I need:
> 1. Access to your API docs at [URL] (or confirm MCP tools are available)
> 2. Any API keys or credentials I should use
> 3. Any constraints — features to highlight, competitors to compare against, branding preferences
>
> Anything else I should know before I start building?"

---

## Phase 4: Build the Demo

### Step 7: Study the Product's API/SDK/MCP

Before writing any code, thoroughly understand the user's product capabilities.

**If the product has API docs:**
- Read the API reference — endpoints, authentication, request/response formats
- Identify which endpoints are needed for the demo concept
- Check for rate limits, sandbox/test modes, free tier limits
- Look for quickstart guides or example code

**If the product has MCP tools:**
- List available MCP tools and their parameters
- Understand which tools chain together for the demo flow
- Check if any tools require specific setup or configuration

**If the product has an SDK:**
- Read the SDK readme and installation instructions
- Find relevant code examples
- Identify the language and framework to use

**Important:** Do NOT guess at API behavior. Read the docs. If docs are unclear, ask the user. A broken demo is worse than no demo.

### Step 8: Build the Prototype

Build the working demo. The implementation depends entirely on the product type and demo concept.

**General principles:**

1. **Use the prospect's real context** — their company name, their industry terms, their specific workflows. "Acme Corp Appointment Scheduler" not "Demo Scheduler."
2. **Keep it focused** — demonstrate 2-3 capabilities well, not 10 capabilities poorly. The demo should take <5 minutes to understand.
3. **Make it interactive** — the prospect should be able to try it themselves (a live link, a callable phone number, a shareable dashboard, an API endpoint they can hit).
4. **Handle edge cases that matter to the prospect** — if they're in healthcare, handle HIPAA-relevant scenarios. If they're in fintech, handle compliance scenarios. Show you understand their world.
5. **Include a "wow moment"** — one thing in the demo that makes the prospect stop and think "wait, it can do that?" This is what gets the demo forwarded internally.

**Save all demo artifacts to `.tmp/demos/[prospect-company-name]/`**

```bash
mkdir -p .tmp/demos/[prospect-company-name]
```

### Step 9: Test the Demo

After building, test the demo yourself to verify it works.

**Test checklist:**
- [ ] Does the demo start/load without errors?
- [ ] Does it handle the primary use case correctly?
- [ ] Does it handle at least 2 edge cases relevant to the prospect's industry?
- [ ] Is there anything that could fail or look broken when the prospect tries it?
- [ ] Does the interactive element work (link loads, agent responds, dashboard displays)?

**If the product supports call/interaction recording:**
- Run a test interaction and save the recording
- This becomes part of the deliverable — the prospect can hear/see the demo working before they try it themselves

**Document the test results:**
```
TEST RESULTS
  Primary use case: PASS/FAIL — [details]
  Edge case 1 ([describe]): PASS/FAIL — [details]
  Edge case 2 ([describe]): PASS/FAIL — [details]
  Interactive element: WORKING/BROKEN — [details]
  Recording available: YES/NO — [path or link]
```

Fix any failures before proceeding. If a critical feature is broken and unfixable, discuss with the user before continuing.

---

## Phase 5: Generate the Comparison Report

### Step 10: Research Competitors for the Report

The demo alone is strong. The demo PLUS a comparison report that positions the user's product against alternatives is a complete sales package.

**Research 3-5 competitors relevant to the prospect's use case:**

For each competitor, gather:
- Pricing (per-unit, per-seat, enterprise-only)
- Key features relevant to the prospect's use case
- Compliance/regulatory capabilities (HIPAA, SOC 2, etc. — whatever the prospect needs)
- Deployment complexity (API calls to deploy, setup time, learning curve)
- Limitations or gaps relevant to this prospect
- Public reviews or complaints (from the community-signals data if available)

**Important:** Be factual. Pull from public documentation, pricing pages, and published reviews. Do not fabricate competitor weaknesses. The report should be defensible if the prospect checks the claims.

### Step 11: Collect Performance Metrics

From the test in Step 9, gather quantitative metrics to include in the report:

**Common metrics by product type:**
- **Voice/Communication:** response latency (best/median/average/worst), transcription accuracy, cost per minute, call duration
- **API platform:** response time, uptime, API calls to deploy, time to first working call
- **Developer tool:** build time, setup complexity, lines of code needed
- **Infrastructure:** deployment time, resource usage, cost per unit
- **AI/ML:** accuracy, latency, token usage, cost per inference

These real numbers from your actual test are what make the report credible. "We measured 1.65s average latency" beats "low latency" every time.

### Step 12: Build the HTML Report

Generate a polished HTML report. The report is the deliverable the user sends to the prospect.

**Report structure:**

```
1. HEADER
   - Title: "[Product Category] for [Prospect's Use Case]"
   - Subtitle: "Technical Comparison Report"
   - Prepared for: [Prospect Company] Engineering / [Prospect Contact Name]
   - Date

2. KEY METRICS (4 big numbers)
   - Pick the 4 most impressive metrics from your test
   - These should be the first thing the prospect sees

3. LIVE TEST RESULTS
   - What you built: 2-3 sentence description using the prospect's terminology
   - Test results grid: PASS/FAIL for each scenario tested
   - If applicable: latency distribution, quality metrics
   - If applicable: sample transcript or interaction log

4. COMPARISON MATRIX
   - Feature-by-feature table: user's product vs. 3-5 competitors
   - Focus on features relevant to THIS prospect (not a generic feature list)
   - Use clear visual indicators: YES/NO/PARTIAL with color coding

5. PLATFORM DEEP DIVES (optional, if report needs more substance)
   - 2-3 sentence summary of each platform
   - Best-for statement for each

6. INDUSTRY-SPECIFIC REQUIREMENTS (if applicable)
   - Compliance table (HIPAA, SOC 2, etc.)
   - Industry-specific features

7. RECOMMENDATION
   - Clear statement: "For [prospect]'s [use case], [product] is the strongest fit"
   - 3 numbered reasons, tied to the prospect's specific needs
   - Cost projection if data is available

8. CTA
   - Link to the live demo
   - "Try it yourself" messaging
   - Contact info or next step
```

**Design principles for the HTML:**
- Clean, professional, minimal design — this is a technical report, not a marketing page
- Monospace fonts for labels and data, sans-serif for body text
- Black and white with color only for status indicators (green/yellow/red)
- Mobile-responsive — the prospect might open this on their phone
- Self-contained — no external dependencies except fonts (inline all CSS)
- No JavaScript required — pure HTML/CSS so it loads instantly and works everywhere

**Save the report:**
```bash
# Save to demos folder
cp .tmp/demos/[prospect-company-name]/report.html /path/to/output/

# Also keep in .tmp for reference
```

### Step 13: Assemble the Demo Link

The report needs a working link where the prospect can try the demo.

**Depending on the product type:**
- **Voice AI:** a shareable call link or embedded web widget
- **Web app / dashboard:** a public URL or shareable link
- **API:** a hosted endpoint with example curl commands in the report
- **CLI tool:** a GitHub repo or gist they can clone and run

If the user's product has a sharing/demo feature (like VAPI's share links), use it. If not, discuss with the user how to make the demo accessible.

Update the CTA section of the report with the correct demo link.

---

## Phase 6: Package and Deliver

### Step 14: Present the Complete Package to the User

Show the user everything that was created:

```
DEMO PACKAGE FOR [PROSPECT COMPANY]
====================================

1. Working Demo
   - [Description of what was built]
   - Demo link: [URL]
   - Test recording: [path, if available]

2. Comparison Report
   - Report file: [path to HTML]
   - Key metrics highlighted: [list the 4 headline numbers]
   - Competitors compared: [list]

3. Outreach Context
   - Prospect contact: [name, role, email]
   - Signal that surfaced them: [the original signal]
   - Suggested angle: [1-2 sentences on how to frame the outreach]
```

### Step 15: Draft the Outreach Message

Draft a short outreach message the user can send to the prospect. Tailor it based on the signal that surfaced this prospect.

**Outreach message framework:**

```
Subject: [Something specific to their situation, not generic]

[First name],

[One sentence connecting to the signal — how you know about their need.
 Do NOT say "I found you through GitHub scraping." Instead, reference
 the underlying need: their job posting, their open-source usage,
 their forum post, their conference talk.]

[One sentence about what you built for them.]

[Link to the report or demo.]

[One sentence CTA — specific and low-friction.]

[Signature]
```

**Signal-specific angles:**

| Signal Source | Outreach Angle |
|---|---|
| GitHub repo signals | "I saw your team is building with [technology]. We built [demo] that shows how [product] handles [their use case]." |
| Job signals (competitor mentioned) | "I noticed you're hiring for [role] with [competitor] experience. We put together a comparison showing how [product] compares for [their use case]." |
| Job signals (build vs buy) | "I saw you're building [capability] in-house. Before your team invests the engineering time, here's a working version we built in 60 seconds using [product]." |
| Community signals (pain) | "I came across your post about [problem]. We built a working solution for [their company] on [product] — here's a demo you can try." |
| Competitor signals (switching) | "I noticed you're evaluating alternatives to [competitor]. We put together a hands-on comparison for [their specific use case]." |
| Event signals (speaker) | "Loved your talk on [topic] at [event]. We built a [demo] that solves the [problem] you mentioned — would love your take on it." |

**Important:** The outreach message is a draft. Tell the user to personalize it further. The agent should NOT send anything on behalf of the user without explicit permission.

### Step 16: Recommend Scaling

After the trial run is complete and the user has reviewed the package:

> "This was a trial run for one prospect. Here's how to scale this:
>
> 1. **Pick your next 5-10 prospects** from the lead list — I can build demo packages for each
> 2. **Templatize what worked** — the report structure and demo pattern can be reused with prospect-specific customization
> 3. **Track responses** — which prospects opened the report, tried the demo, replied
>
> Want me to build the next one?"

---

## Key Rules

1. **The demo must be real.** A working prototype on the user's actual platform, not a mockup, screenshot, or slide deck. The whole point is proving the product works for the prospect's use case.

2. **Use the prospect's context everywhere.** Their company name, their industry terms, their specific workflows, their compliance requirements. Generic demos don't close deals.

3. **Factual competitor comparisons only.** Every claim in the comparison report should be verifiable from public documentation. If you're unsure about a competitor's capability, say "unconfirmed" rather than guessing.

4. **Get user approval before building.** Present the concept, confirm the scope, then build. Don't spend 30 minutes building something the user didn't want.

5. **One prospect at a time to start.** The first demo is a trial run. Get the user's feedback, refine the approach, then scale to more prospects.

6. **Never send outreach without permission.** Draft messages, don't send them. The user decides when and how to reach out.

7. **Adapt to the product type.** This skill works with any product that has API/MCP/SDK access. The demo patterns, metrics, and report structure should adapt to what the product actually does — not force every product into the same template.

8. **Cost awareness.** If building the demo costs money (API usage, compute, etc.), estimate the cost and confirm with the user before proceeding. A demo that costs $0.50 to build is fine. A demo that costs $50 needs a conversation first.

## Error Handling

- **API docs are unclear or incomplete:** Ask the user to clarify. Don't guess at API behavior — a broken demo is counterproductive.
- **Demo concept is too complex for one session:** Simplify. A focused demo that works perfectly beats an ambitious one that's half-broken.
- **Prospect's use case doesn't clearly map to the product:** Go back to Step 5 and pick a different prospect. Not every lead is a good demo candidate.
- **Product doesn't have a sharing mechanism:** Discuss alternatives with the user — screen recording, hosted link, GitHub repo, or a live walkthrough offer instead.
- **Competitor data is hard to find:** Use what's publicly available. It's better to compare against 3 well-documented competitors than 5 with guessed data.
