---
name: create-linkedin-content
description: >
  Draft voice-tuned LinkedIn post variants from a free-form brief. Reads a personal
  voice guide (generated via generate-voice-guide), produces 2–5 variants with
  distinct framings, applies LinkedIn-specific defaults (arrow bullets, "why this
  matters" beat, 150–500 words), and self-checks against the voice guide's banned
  phrases before returning.
tags: [content, social]
---

# Create LinkedIn Content

Draft LinkedIn post variants that sound like a real human practitioner, not a LinkedIn thought-leader persona. Reads a voice guide the user has already generated (or prompts to create one), produces multiple framings of the same idea, and saves each variant as its own markdown file with frontmatter.

**This is an agent-executed skill** — the agent does the drafting and self-check inline. No Python script.

Mirrors `create-x-content` structurally; differences are marked ★.

## Quick Start

```
/create-linkedin-content --brief "New open-source CLI that turns Figma files into React components. Called figma2react. Free, MIT licensed."
```

Or interactively:
```
/create-linkedin-content
```

## Inputs

| Flag | Required | Default |
|------|----------|---------|
| `--brief` | Yes (asked interactively if missing) | — |
| `--variants` | No | Skill decides based on brief richness (2–5) |
| `--voice-guide` | No | Resolved via chain below |
| `--output` | No | `./content/YYYY-MM-DD-<topic-slug>/` |
| `--topic` | No | Derived from brief |

## Voice Guide Resolution

Resolve in this order, stop at first hit:

1. `--voice-guide <path>` flag
2. `~/.goose-skills/config.json` → `voice_guides.linkedin`
3. `~/.goose-skills/voice-guides/voice-linkedin.md` (default path)
4. **Fallback prompt** — no guide found. Three options:
   - (a) Paste a path to an existing guide
   - (b) Run `/generate-voice-guide --platforms linkedin` now to create one (recommended)
   - (c) Proceed with a neutral default (warn that variants will sound generic)

## LinkedIn-Specific Defaults ★

Apply these unless the voice guide explicitly says otherwise:

- **Length:** 150–500 words per variant (LinkedIn rewards longer than X but shorter than a blog post)
- **Bullets:** arrow style (`→`) for workflow steps — this is LinkedIn-native
- **Numbered steps:** emoji numbers `1️⃣ 2️⃣ 3️⃣` allowed sparingly for installation/quickstart type posts
- **"Why this matters" beat:** every post should have one — LinkedIn audiences want the *so what?* more explicitly than X audiences
- **Hashtags:** 0–2 max. Prefer zero.
- **CTAs:** "Link in comments" pattern is LinkedIn-native; inline links are fine too. Avoid "Follow me for more."
- **Openings:** more scene-setting is ok (1–2 lines of context before the hook). Unlike X, you don't have to hook-first.

## Workflow

### Phase 1 — Load the voice guide

Same as `create-x-content` Phase 1 — load voice guide, extract banned phrases, hook patterns, format rules, dos/don'ts, examples.

### Phase 2 — Parse the brief and decide variant count

Same 2–5 decision rubric. LinkedIn briefs often warrant fewer variants than X because LinkedIn posts are longer and the audience expects more narrative coherence — 3 strong framings usually beats 5.

### Phase 3 — Generate variants with LinkedIn-appropriate framings

Framings tuned for LinkedIn (subset of the X framings, plus a few LinkedIn-native ones):

| Framing | Structure | When to use |
|---------|-----------|-------------|
| `builder-story` ★ | "I built X. Here's why. Here's what I learned." | LinkedIn-native — builder stories outperform tactical posts here |
| `product-launch` ★ | Clear hook + 2-step quickstart + link | New tool/product announcements |
| `problem-first` | Open with the pain, then solution | Universal |
| `ecosystem-map` | Curated list of N related tools/companies | Landscape posts |
| `contrarian-insight` | "Your X might be worth more than Y" | Opinion pieces with a fresh take |
| `workflow-tutorial` | Arrow-bulleted step-by-step, with numbers | Tactical how-tos (denser than X version) |

### Phase 4 — Self-check against the voice guide

Same 4 checks as `create-x-content`:
1. Banned phrase check
2. Length check (150–500 for LinkedIn)
3. "Meat" check — specific tools/numbers/builds
4. Voice-match spot check

Plus LinkedIn-specific:
5. **Arrow-bullet check** — if the post uses lists, are they `→` style (or numbered emojis), matching the LinkedIn convention?
6. **"Why this matters" check** — does the post explain the stakes, or does it just state the facts? Add a "why this matters" beat if missing.
7. **No corporate tone** — does it sound like a press release? If yes, rewrite to sound like a human practitioner.

### Phase 5 — Save outputs

File naming (the `linkedin-` prefix distinguishes from X variants when they live in the same folder):
```
linkedin-<letter>-<framing-slug>.md
```
Examples: `linkedin-a-builder-story.md`, `linkedin-b-product-launch.md`.

Frontmatter:
```yaml
---
id: <topic-slug>-li-<letter>
platform: linkedin
format: standard | long
topic: <slug>
framing: <framing-slug>
status: draft
---
```

### Phase 6 — Deliver

Print output directory, file list, framing summary, suggested next step.

## Outputs

- `<output>/linkedin-<letter>-<framing>.md` per variant

## Examples

**Builder story brief:**
```
/create-linkedin-content --brief "Built a CRM for my AI agents using just markdown files and Claude Code. No Salesforce, no HubSpot. Works better than both."
```
→ 3 variants (builder-story, contrarian-insight, workflow-tutorial)

**Launch brief:**
```
/create-linkedin-content --brief "Launching goose-aeo — open-source CLI that measures your brand's visibility on AI search engines like ChatGPT, Perplexity, Gemini. npm install, three commands to run."
```
→ 3 variants (product-launch, problem-first, workflow-tutorial)

## Dependencies

- A voice guide at the resolved path
- `generate-voice-guide` skill (for creating one when missing)

## Tips

- **Arrow bullets are a LinkedIn signal.** When in doubt, use them. They make the post scan-friendly and land as "LinkedIn-native."
- **Never open with "I'm humbled" or "Grateful for..."** — LinkedIn performative cringe. The voice guide should flag these; honor it.
- **Cross-reference ecosystems.** LinkedIn readers like knowing the landscape. If you mention a tool, it's fine to note 1–2 comparable ones.
- **End with a forward-looking line.** "Fast-forward 3 model generations" or "This will change X over the next 12 months" — beats a soft "thoughts?"
