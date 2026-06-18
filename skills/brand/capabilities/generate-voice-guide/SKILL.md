---
name: generate-voice-guide
description: >
  Generate a personal voice guide for X (Twitter) and/or LinkedIn by scanning a user's
  past posts and iteratively refining with sample-and-feedback loops. Produces a
  structured markdown voice guide that sibling skills (create-x-content,
  create-linkedin-content) consume to draft in-voice posts. Different from
  brand-voice-extractor, which analyses company blogs/landing pages — this skill is
  for personal social voice.
tags: [content, social]
---

# Generate Voice Guide

Turn a real person's past posts into a structured voice guide that other skills can use to draft in-voice content. Produces one guide per platform (X, LinkedIn, or both) with persona, dos/don'ts, banned phrases, hook patterns, format rules, and example posts.

**This is an agent-executed skill** — the agent handles scraping, analysis, drafting, and iteration via the tools available in the session. No bundled Python script.

## When to use

- A user wants to build a personal voice guide for social content
- Another skill (e.g. `create-x-content`, `create-linkedin-content`, `social-kit`) needs a voice guide and one doesn't exist
- The user wants to mimic someone else's public voice (for ghostwriting, parody, or study)

**When NOT to use:** For analysing a company's blog/landing-page voice, use `brand-voice-extractor` instead. That's for corporate marketing voice; this one is for individual social voice.

## Quick Start

Interactive:
```
/generate-voice-guide
```

Args mode:
```
/generate-voice-guide --profile @GooseworksAI --platforms x,linkedin --output ~/.goose-skills/voice-guides
```

## Discovery Questions (front-loaded)

Ask these up front if not supplied via flags:

1. **Whose voice?** "Paste an X/Twitter handle (e.g. `@GooseworksAI`), a LinkedIn profile URL, or both. You can mimic your own voice or someone else's."
2. **Which platforms?** "Generate a voice guide for X, LinkedIn, or both?"
3. **How many posts to scan?** "Default: 50 X posts / 25 LinkedIn posts. Higher = more signal, more tokens, slower."
4. **Save location?** "Default: `~/.goose-skills/voice-guides/voice-{x,linkedin}.md`. Ok to use that, or prefer a different path?"

## Workflow

### Phase 1 — Scrape past posts

**For X:**
- Use Apify actor `apidojo/twitter-user-tweets-scraper` (or whichever X scraper is available in the session) keyed to the handle.
- Fetch the target count (default 50). Exclude replies, retweets, and quote tweets unless the user specifies otherwise — we want original voice.
- Requires `APIFY_API_TOKEN` env var. If missing, surface a clear error with the setup link.

**For LinkedIn:**
- Use Apify actor `harvestapi/linkedin-profile-posts` keyed to the profile URL.
- Fetch the target count (default 25). Include only original posts (no reshares).

**Fallback (no scraper available or posts paywalled):** ask the user to paste 15–25 posts as plain text.

Store raw post text, engagement metrics (likes, views if available), and timestamps.

### Phase 2 — Generate v1 voice guide

Use `voice-x.md` / `voice-linkedin.md` template references (see "Template Skeleton" below) to produce v1 of the guide. Do NOT copy content from them — only the *structure*.

Analyse the scraped posts for:

- **Persona** — inferred role, audience, credentials, tone spectrum
- **The "meat" principle** — what concrete substance typically appears: tools, numbers, builds, steps, links
- **Dos** — observed hook patterns, connective phrases, list style, casual asides, emoji usage, CTA patterns
- **Don'ts** — patterns the author conspicuously avoids (no threads, no engagement bait, etc.)
- **Banned phrases** — common LLM-speak the author never uses (`excited to share`, `leverage`, `game-changing`, `thrilled`, etc.). List 10–20.
- **Hook patterns** — 5–8 distinct opening-line templates drawn from real posts
- **Format rules** — word count ranges, bullet style, density, line-break rhythm
- **Tone calibration** — educator vs conversational ratio; when each applies
- **Example posts with analysis** — pull 4–6 real posts and explain *why* each works, what pattern it exemplifies

### Phase 3 — Sample + feedback loop (5+ iterations)

This is where voice-guide quality is made. Do NOT skip iterations.

Each iteration:

1. **Generate 3 sample posts** from the current guide, each using a different hook pattern from the guide. Use topics from the user's own posting history so they're easy to judge (e.g. if they post about AI agents, draft on AI agents).
2. **Show the user:**
   - Which hook pattern each sample used
   - The 3 sample posts
   - 1–2 lines from the current guide that most influenced the samples
3. **Ask for feedback** — specific prompts:
   - "Which samples sound like you? Which don't?"
   - "What's the most off-sounding phrase or pattern?"
   - "What's missing — a hook you use, a rule you follow?"
4. **Apply feedback** — revise the guide. Update dos/don'ts, hook patterns, banned phrases, examples. Note what changed in a short changelog at the top of the guide during iteration.
5. **Repeat.**

**Stopping rule:** continue until the user explicitly says "this is good" AND at least 5 iterations have completed. 5 is a floor, not a ceiling. If the user says "good enough" at iteration 2, push back: "Voice guides need at least 5 rounds to actually lock in. Can we do 3 more?"

### Phase 4 — Save + register

1. Write the final guide to the resolved output path (default `~/.goose-skills/voice-guides/voice-<platform>.md`).
2. Strip the iteration changelog — only keep the final clean guide.
3. Update `~/.goose-skills/config.json`:
   ```json
   {
     "voice_guides": {
       "x": "<absolute path to voice-x.md>",
       "linkedin": "<absolute path to voice-linkedin.md>"
     }
   }
   ```
   Create the directory/file if missing. Merge with existing config if present (don't overwrite other keys).
4. Print a confirmation with the saved paths and a next-step suggestion: "You can now run `/create-x-content --brief \"...\"` and it'll use this voice guide automatically."

## Template Skeleton

Every generated voice guide should have these top-level sections, in order:

```
# Voice Guide: <Platform> — <Handle or Name>

## Persona
## The "Meat" Principle
## Dos
## Don'ts
## Banned Phrases
## Hook Patterns
## CTA Guidelines
## Format Rules
## Tone Calibration
## Example Posts That Exemplify The Voice
```

Match the depth and specificity of a well-written voice guide — prose for persona, numbered lists for dos/don'ts, quoted examples with analysis. Aim for 120–250 lines.

## Config File

`~/.goose-skills/config.json` is a lightweight cross-skill config. Schema:

```json
{
  "voice_guides": {
    "x": "/absolute/path/to/voice-x.md",
    "linkedin": "/absolute/path/to/voice-linkedin.md"
  }
}
```

Sibling skills read this to discover voice guide paths. Always use absolute paths.

## Inputs

| Input | Required | Default |
|-------|----------|---------|
| `--profile` | Yes (one of X handle, LinkedIn URL, or both) | — |
| `--platforms` | No | `x,linkedin` if both profiles given, else matches supplied profiles |
| `--posts-x` | No | 50 |
| `--posts-linkedin` | No | 25 |
| `--output` | No | `~/.goose-skills/voice-guides` |
| `--iterations-min` | No | 5 |

## Outputs

- `<output>/voice-x.md` and/or `<output>/voice-linkedin.md`
- Updated `~/.goose-skills/config.json` with voice guide paths
- Stdout summary: paths written + quick-start command for next step

## Dependencies

- Apify API token (`APIFY_API_TOKEN`) for scraping
- No other paid services required
- Voice guide *structural* references (open via `WebFetch` or read locally if the user has them) — not required to run

## Tips

- **5+ iterations is the floor.** If the user pushes to stop early, explain that voice guides are only good after ~5 rounds.
- **Use the user's own topics for samples.** Draft samples on subjects they've posted about — makes it much easier for them to spot an off-key line.
- **Quote real posts in the examples section.** Never paraphrase — use direct verbatim quotes with a source link.
- **Call out ghost-writing or assistant-authored posts.** If some posts feel dramatically different, flag it: "These 3 posts read differently — worth checking if they're yours or ghost-written."
- **Don't lean on LLM clichés in the banned-phrases list.** Derive bans from actual absence in the user's writing, not a generic blocklist.
