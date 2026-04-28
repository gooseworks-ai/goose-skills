---
name: github-repo-signals
description: Extract and score leads from GitHub repositories by analyzing stars, forks, issues, PRs, comments, and contributions. Produces unified multi-repo CSV with deduplicated user profiles. No paid API credits required.
user-invocable: true
allowed-tools: Bash, Read, Write, Edit, Grep, Glob
argument-hint: "[owner/repo1,owner/repo2] [limit]"
---

# GitHub Repository Signals

Extract high-intent leads from one or more GitHub repositories by analyzing every type of user interaction. This skill uses only free GitHub API data — no enrichment credits are spent.

## When to Use

- User wants to find leads from open-source GitHub repositories
- User wants to identify people who interact with competitor or category repos
- User wants cross-repo interaction analysis to find high-intent prospects
- User asks for GitHub-based lead generation without paid enrichment
- User says their ICP, target audience, or buyers are developers, engineers, or technical people who are active on GitHub
- User describes prospects who use open-source tools, contribute to open source, or build with specific technologies — and those technologies have public GitHub repos
- User wants to find leads in a technical space (e.g., "real-time communication", "AI agents", "infrastructure") where the community congregates around GitHub repositories

**Note:** If the user describes their ICP as GitHub-active but hasn't identified specific repositories yet, this skill still applies. In that case, ask the user which repositories their ICP is likely to interact with, or help them identify relevant repos based on the technology/space they describe.

## Prerequisites

- `gh` CLI authenticated (`gh auth status` to verify)
- Python 3.9+ with `PyYAML` installed
- Working directory: the project root containing this skill

## Inputs to Collect from User

Before running, ask the user for:

1. **Repositories** (required): One or more GitHub repository URLs or `owner/repo` strings
2. **User limit** (required): How many top users to include in the output. Explain that more users = longer runtime due to GitHub profile fetching (~5,000 profiles/hour). Suggest 500 as a good starting point for testing.

## Execution Steps

### Step 1: Verify Environment

```bash
gh auth status
```

### Step 2: Run the Tool

```bash
python3 ${CLAUDE_SKILL_DIR}/scripts/gh_repo_signals.py \
    --repos "owner1/repo1,owner2/repo2" \
    --limit <USER_LIMIT> \
    --output ${CLAUDE_SKILL_DIR}/../.tmp/repo_signals.csv
```

Replace the repos and limit with user-provided values.

The tool will:
1. **Extract** all interaction types per repo (stars, forks, contributors, issues, PRs, comments, watchers, commit emails)
2. **Filter out** bots and org members automatically (fetches org member lists and detects org email domains)
3. **Score** each user by interaction depth using these weights:
   - Issue opener: 5 points
   - PR author: 5 points
   - Contributor: 4 points
   - Issue commenter: 3 points
   - Forker: 3 points
   - Watcher: 2 points
   - Stargazer: 1 point
4. **Rank** users by (repos_interacted desc, total_score desc) — multi-repo users surface first
5. **Fetch** GitHub profiles for the top N users (name, email, company, location, blog, twitter, bio, followers)
6. **Export** two CSV files: `_users.csv` and `_interactions.csv`

### Step 3: Review Output

The tool produces two CSV files:

**`repo_signals_users.csv`** — One row per person, deduplicated across all repos
| Column | Description |
|--------|-------------|
| username | GitHub login |
| name | Display name |
| email | Public GitHub email |
| commit_email | Email from git commits (if different from public) |
| company | Company from GitHub profile |
| location | Location from GitHub profile |
| blog | Website/blog URL |
| twitter | Twitter/X handle |
| bio | GitHub bio |
| followers | Follower count |
| public_repos | Number of public repos |
| total_repos_interacted | Number of input repos this user interacted with |
| interaction_score | Weighted score across all repos |

**`repo_signals_interactions.csv`** — One row per user x repo combination
| Column | Description |
|--------|-------------|
| username | GitHub login |
| repository | Which repo this row is about |
| is_contributor | YES/NO |
| is_stargazer | YES/NO |
| is_forker | YES/NO |
| is_watcher | YES/NO |
| is_issue_opener | YES/NO |
| is_pr_author | YES/NO |
| is_issue_commenter | YES/NO |
| contribution_count | Number of commits (0 if not contributor) |
| starred_at | Date starred (if applicable) |
| forked_at | Date forked (if applicable) |
| repo_score | Interaction score for this specific repo |

## Phase 3: Analyze & Recommend

Once the CSV files are generated, **do not stop**. Immediately proceed to analyze the data and brief the user.

### Step 5: Collect Company Context

Check if you already know the user's company and intent from prior conversation. If not, ask:

> "Before I analyze these results, I need to understand who you're finding leads for:
> 1. **What does your company/product do?** (one-liner is fine)
> 2. **Who is your ideal customer?** (role, company size, industry, tech stack — whatever is relevant)
> 3. **What's the goal for these leads?** (outbound sales, partnership, hiring, community building, etc.)"

Do NOT proceed to analysis until you have this context. It directly shapes the recommendations.

### Step 6: Analyze the Data

Read the generated .csv file and compute the following analysis. Present it to the user as a structured briefing.

**6a. Overall Stats**
- Total users in the sheet
- Score distribution (how many at 15+, 10-14, below 10)
- Email coverage: how many have any email (public or commit)
- Company coverage: how many have a company listed

**6b. Multi-Repo Users (if multiple repos were scanned)**
- How many users interacted with 2+ repos
- List the top 10 multi-repo users with their names, companies, and which repos they touched
- This is the highest-signal segment — call it out explicitly

**6c. Top Companies**
- Extract all company names from the Users sheet
- Group users by company (normalize company names — strip @, leading/trailing whitespace, lowercase comparison)
- List the top 15 companies by number of engaged users
- For each, note how many users, their average score, and which interaction types are most common
- Flag companies with 3+ engaged users as "organizational adoption signals"

**6d. Interaction Patterns**
- How many users are issue openers (highest intent)
- How many are PR authors (deep practitioners)
- How many are stargazer-only (lowest signal)
- Any notable patterns (e.g., a burst of recent stars, many forkers from one company)

**6e. Data Gaps**
- What percentage lack email — this determines enrichment priority
- What percentage lack company — affects ability to do company-level targeting
- How many have a blog/website or twitter that could help with manual research

### Step 7: Recommend Next Steps

Based on the analysis AND the user's company context/intent, recommend specific next steps. Tailor recommendations to what the data actually shows — do not give generic advice.

**Framework for recommendations:**

1. **If multi-repo users exist (2+ repos):**
   - These are the #1 priority segment. Recommend enriching them first.
   - Estimate credit cost: N users x cost per enrichment call.

2. **If company clusters exist (3+ users from same company):**
   - Recommend company-level enrichment via SixtyFour `/enrich-company`
   - Then use `/enrich-lead` to find the decision-maker at those companies (not the developer who starred — the person who signs off on purchases)
   - This is the "find the buyer, not the user" play

3. **If high email coverage (>40%):**
   - Can start outreach directly for users with emails
   - Recommend SixtyFour `/qa-agent` to qualify them against ICP before reaching out
   - Suggest segmenting by interaction type for personalized outreach (issue openers get a different message than stargazers)

4. **If low email coverage (<40%):**
   - Recommend SixtyFour `/find-email` for the top-scored users first
   - Estimate cost: N users x $0.05 (professional) or $0.20 (personal)
   - Suggest starting with a small batch (50-100) to validate quality before scaling

5. **If the user's goal is outbound sales:**
   - Prioritize: company clusters -> multi-repo users -> issue openers -> PR authors -> forkers -> stargazers
   - Recommend enriching companies first, then finding decision-makers
   - Suggest personalization angles based on interaction type (e.g., "I noticed your team has been active in the [repo] community...")

6. **If the user's goal is community/partnerships:**
   - Prioritize: PR authors -> contributors -> issue commenters who help others
   - These are potential advocates, not just buyers

7. **Always include a cost estimate:**
   - Break down what each enrichment step would cost
   - Suggest a phased approach: start small, validate, then scale

**Format the recommendation as a clear action plan with numbered steps, estimated costs, and expected outcomes.**

### Step 8: Ask for Go-Ahead

After presenting the analysis and recommendations, ask:

> "Would you like me to proceed with any of these steps? I can start with [recommended first action] — it would cost approximately [estimate] and take [time estimate]."

Wait for user confirmation before spending any credits or running enrichment tools.

## Output Interpretation Reference

- **total_repos_interacted > 1**: High-intent signal — user engages with multiple repos in the same category
- **interaction_score >= 15**: Deep engagement — multiple interaction types
- **is_issue_opener = YES**: Active user with real use case and pain points
- **is_pr_author = YES (non-org member)**: Technical practitioner invested in the ecosystem
- **is_forker = YES**: Taking code to build something — stronger than starring
- **is_stargazer only**: Lowest signal — casual interest

## Rate Limits & Runtime Estimates

- GitHub API: 5,000 requests/hour for authenticated users
- Each repo extraction uses ~500-2,000 API calls depending on repo size
- Profile fetching: 1 API call per user
- **Estimate for 1 repo, 500 users**: ~15-30 minutes
- **Estimate for 3 repos, 500 users**: ~45-90 minutes
