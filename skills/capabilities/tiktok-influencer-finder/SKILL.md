---
name: tiktok-influencer-finder
description: Find TikTok influencers using Apify's Influencer Discovery Agent. Use when the user wants to discover TikTok creators or influencers in any niche.
argument-hint: [niche/description]
disable-model-invocation: true
---

# TikTok Influencer Finder

Search for TikTok influencers matching a specific niche using Apify's Influencer Discovery Agent.

## Step 1: Gather Criteria

Before running the search, ask the user for their filtering criteria using AskUserQuestion. Collect ALL of the following:

1. **Niche/Description**: What type of influencer? (use $ARGUMENTS if provided, otherwise ask)
2. **Minimum follower count**: e.g. 5K, 10K, 50K
3. **Maximum follower count**: e.g. 50K, 100K, 500K
4. **Location filter**: e.g. US only, US + Canada, any English-speaking country
5. **Sub-niche preferences**: Any specific content focus within the broader niche

Ask all 5 criteria in a single AskUserQuestion call to minimize back-and-forth. Provide sensible default options but always allow custom input.

## Step 2: Run the Apify Influencer Discovery Agent

Use the `mcp__apify__apify-slash-influencer-discovery-agent` tool with:

- **influencerDescription**: Compose a detailed description combining the user's niche, content style preferences, and target audience. Be specific and descriptive.
- **generatedKeywords**: 5 (maximum for best coverage)
- **profilesPerKeyword**: 10 (maximum for best coverage)

If the MCP connection fails, instruct the user to run `/mcp` to reconnect, then retry.

## Step 3: Filter Results

After receiving results, apply ALL the user's criteria strictly:

- **Remove** profiles below minimum follower count
- **Remove** profiles above maximum follower count
- **Remove** profiles outside the specified location(s)
- **Remove** profiles that don't match the sub-niche (use the `fit` score and `fitDescription` to judge relevance; generally exclude fit < 0.6)
- **Sort** remaining results by fit score (descending), then by follower count (descending)

## Step 4: Present Results

Present filtered results in a clean markdown table with these columns:

| Creator | Handle | Followers | Engagement | Location | Focus | Fit Score |

Include:
- Clickable TikTok profile links
- Follower count formatted readably (e.g. 46.3K)
- Engagement rate as percentage
- Brief description of their content focus
- The AI-generated fit score

After the table, include:
- **Total profiles analyzed** vs **profiles matching criteria**
- A note if very few results matched (suggest adjusting criteria)
- Offer to run another search with different keywords or adjusted criteria

## Notes

- This skill requires the Apify MCP server to be connected. If not connected, tell the user to run `/mcp` first.
- The tool searches TikTok specifically. If the user wants other platforms, let them know this is TikTok-only and suggest alternatives.
- Engagement rates above 100% can occur when viral posts drive disproportionate interaction relative to follower count.
