---
name: skill-creator
description: Create, structure, and package agent skills. Use when designing new skills, updating existing skills, or helping users build skills with scripts, references, and assets. Triggers on requests to create skills, write SKILL.md files, or structure skill directories.
source: orthogonal
---


# Skill Creator

## Setup

Read your credentials from ~/.gooseworks/credentials.json:
```bash
export GOOSEWORKS_API_KEY=$(python3 -c "import json;print(json.load(open('$HOME/.gooseworks/credentials.json'))['api_key'])")
export GOOSEWORKS_API_BASE=$(python3 -c "import json;print(json.load(open('$HOME/.gooseworks/credentials.json')).get('api_base','https://api.gooseworks.ai'))")
```

If ~/.gooseworks/credentials.json does not exist, tell the user to run: `npx gooseworks login`

All endpoints use Bearer auth: `-H "Authorization: Bearer $GOOSEWORKS_API_KEY"`


Create modular, self-contained skill packages that extend agent capabilities.

## Core Principle: Concise is Key

The context window is shared. Only add what the agent doesn't already know. Challenge every paragraph: "Does this justify its token cost?" Prefer concise examples over verbose explanations.

## Skill Structure

```
skill-name/
├── SKILL.md              # Required: frontmatter + instructions
├── scripts/              # Optional: executable code (deterministic tasks)
├── references/           # Optional: docs loaded on-demand
└── assets/               # Optional: files used in output (templates, images)
```

## SKILL.md Format

```markdown
---
name: skill-name
description: What it does + when to use it. This is the trigger mechanism.
---

# Skill Name

[Instructions for using the skill]
```

### Frontmatter Rules
- `name`: lowercase, hyphens, under 64 chars (e.g., `pdf-editor`, `gh-review-pr`)
- `description`: Include BOTH what it does AND when to trigger. The body isn't loaded until after triggering, so all "when to use" info must be here.

## Degrees of Freedom

Match specificity to task fragility:

| Freedom | Use When | Format |
|---------|----------|--------|
| High | Multiple valid approaches | Text instructions |
| Medium | Preferred pattern exists | Pseudocode, parameterized scripts |
| Low | Fragile/error-prone ops | Specific scripts, few params |

## Creation Process

1. **Understand** - Gather concrete usage examples
2. **Plan** - Identify reusable scripts, references, assets
3. **Initialize** - Run `orth skills init <name>`
4. **Implement** - Write SKILL.md, add resources
5. **Submit** - Run `orth skills submit <path>`
6. **Iterate** - Test on real tasks, refine

### Quick Start

```bash
# Create new skill
orth skills init my-skill

# Or with path
orth skills init my-skill --path ~/.openclaw/skills

# Submit to Orthogonal
orth skills submit ./my-skill

# Update existing skill
orth skills update <slug> ./my-skill
```

## What NOT to Include

- README.md, CHANGELOG.md, INSTALLATION_GUIDE.md
- Setup/testing procedures
- User-facing documentation
- Anything not needed for the agent to do the job

## Progressive Disclosure

Keep SKILL.md under 500 lines. Split into reference files when approaching this limit.

**Pattern: High-level guide with references**
```markdown
## Quick start
[Core workflow here]

## Advanced
- **Complex feature**: See references/feature.md
- **API details**: See references/api.md
```

**Pattern: Domain organization**
```
bigquery-skill/
├── SKILL.md (overview + navigation)
└── references/
    ├── finance.md
    ├── sales.md
    └── product.md
```

Agent loads only the relevant reference file.
