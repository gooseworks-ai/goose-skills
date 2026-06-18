---
name: social-kit
description: >
  End-to-end composite that turns a single brief into voice-tuned X post variants,
  LinkedIn post variants, and a matching social graphic. Orchestrates
  create-x-content + create-linkedin-content + goose-graphics in one invocation.
  Asks about graphic format when not specified, with heuristic-driven
  recommendations.
tags: [content, social]
---

# Social Kit

One command → X variants + LinkedIn variants + a graphic. A thin orchestrator that chains `create-x-content`, `create-linkedin-content`, and `goose-graphics`, with sensible defaults and a pre-flight check for voice guides.

## Invocation

Full args:
```
/social-kit --brief "..." --format poster --style matt-gray --output ./content/2026-04-21-my-topic/
```

Partial (asks for format):
```
/social-kit --brief "..."
```

Interactive:
```
/social-kit
```

## Inputs

| Flag | Required | Default |
|------|----------|---------|
| `--brief` | Yes (asked if missing) | — |
| `--format` | No | Asked with recommendations |
| `--style` | No | `matt-gray` if the user has no stated preference; otherwise asked |
| `--output` | No | `./content/YYYY-MM-DD-<topic-slug>/` |
| `--variants-x` | No | `create-x-content` decides |
| `--variants-linkedin` | No | `create-linkedin-content` decides |
| `--skip-graphic` | No | false |
| `--skip-x` | No | false |
| `--skip-linkedin` | No | false |

## Workflow

### Step 1 — Intake

1. Resolve the brief (prompt if missing).
2. Derive a `topic-slug` from the brief (short kebab-case, 2–4 words).
3. Resolve `<output>` — default `./content/YYYY-MM-DD-<topic-slug>/`. Create the directory if it doesn't exist.

### Step 2 — Pre-flight voice guide check

Check `~/.goose-skills/config.json` for `voice_guides.x` and `voice_guides.linkedin`. If either is missing and that platform isn't skipped:

```
Missing voice guide for <platform>.
  (a) Generate one now via /generate-voice-guide --platforms <platform>
  (b) Paste an existing path
  (c) Skip <platform> for this run
```

Do not proceed without resolving every non-skipped platform.

### Step 3 — Draft X variants

Invoke `/create-x-content` with:
```
--brief "<brief>"
--output <resolved-output>
[--variants <N>]
```

Wait for completion. Capture the list of created files + the most substantive variant for use in Step 5's graphic brief.

Skip if `--skip-x`.

### Step 4 — Draft LinkedIn variants

Invoke `/create-linkedin-content` with the same args. Wait for completion.

Skip if `--skip-linkedin`.

### Step 5 — Pick a graphic format

If `--format` was passed, use it.

Otherwise, analyse the brief and recommend 1–2 formats using this heuristic:

| Brief shape | Recommended format |
|-------------|-------------------|
| One strong claim, stat, or launch announcement | **poster** (1080×1350) |
| Numbered steps, how-to, or sequential process | **carousel** (1080×1080 per slide) |
| Mechanism/data/timeline with multiple sections | **infographic** (1080×variable) |
| Single testimonial, quote, or result metric | **tweet** (1080×1080) |
| Vertical, mobile-first, under 6 beats | **story** (1080×1920) |
| Widescreen presentation or demo | **slides** (1920×1080) |
| Chart or data visualization | **chart** (1080×1080) |

Present recommendations as a short menu:

```
Based on the brief, I'd recommend one of these:
  1. poster — single strong claim, fits the "X costs $0.01 to run" shape
  2. carousel — if you want to walk through the how-it-works steps

Which? (or paste another format name)
```

Skip this step if `--skip-graphic`.

### Step 6 — Pick a style

If `--style` was passed, use it.

Otherwise, default to `matt-gray` unless the user stops the skill to pick another. To change the default per-user, a future enhancement can add a `style_default` key to `~/.goose-skills/config.json`.

### Step 7 — Generate the graphic

Invoke `/goose-graphics` with:
```
--style <style>
--format <format>
--brief "<distilled-brief>"
```

Point output at `<resolved-output>/graphic/`. The distilled brief should include:
- The headline/hook from the most substantive X variant
- 2–4 key beats (steps, numbers, or sections)
- Any specific strings that must appear verbatim (tool names, commands, prices)

Wait for completion. Capture paths to PNG exports + index.html.

Skip if `--skip-graphic`.

### Step 8 — Deliver

Print a summary:

```
Social kit ready at <resolved-output>/

X drafts (N variants):
  - variant-a-<framing>.md
  - variant-b-<framing>.md
  - ...

LinkedIn drafts (N variants):
  - linkedin-a-<framing>.md
  - linkedin-b-<framing>.md
  - ...

Graphic (<format>, <style>):
  - graphic/slides/          (HTML source)
  - graphic/exports/         (PNG files, N files)
  - graphic/index.html       (preview in browser)

Next steps:
  - Open graphic/index.html to review visuals
  - Open any variant-*.md to copy/paste
  - Pair a variant with a graphic for LinkedIn/X
```

## Output Layout

```
content/YYYY-MM-DD-<topic>/
├── variant-a-<framing>.md        # X drafts
├── variant-b-<framing>.md
├── ...
├── linkedin-a-<framing>.md       # LinkedIn drafts
├── linkedin-b-<framing>.md
└── graphic/
    ├── slides/                   # HTML source (1+ files depending on format)
    ├── exports/                  # PNG exports
    └── index.html                # preview
```

## Dependencies

Required skills:
- `create-x-content`
- `create-linkedin-content`
- `goose-graphics`

Recommended:
- `generate-voice-guide` (create voice guides once before first use of social-kit)

Voice guides + config at `~/.goose-skills/voice-guides/` and `~/.goose-skills/config.json` are discovered automatically.

## Examples

**Typical run (format asked):**
```
/social-kit --brief "Claude can now verify email deliverability for $0.01 per check. Install gooseworks and ask. Runs MX, SMTP, RCPT TO, catch-all, disposable, blocklist checks."
```
→ Drafts X + LinkedIn variants → asks "poster or carousel?" → generates graphic → delivers.

**Full args (one-shot):**
```
/social-kit --brief "Someone vibe-coded a full lead gen tool in Claude Code in 2 weeks. Scrapes every business off Google Maps with 30+ data fields, pulls verified emails, reads up to 50 reviews to find pain points. Running $4200 ACV deals." --format carousel --style heatwave-orange
```
→ Runs end-to-end with no prompts.

**Skip graphic:**
```
/social-kit --brief "..." --skip-graphic
```
→ Just the X + LinkedIn drafts.

## Tips

- **First-time users:** run `/generate-voice-guide` once before your first `/social-kit` invocation. This is a one-time setup.
- **When the recommended format feels off, it probably is.** The heuristic is a starting point — trust your read of the brief more than the recommendation.
- **Pair drafts with graphics intentionally.** A long `mechanism-breakdown` X variant pairs with a carousel. A short `hype` variant pairs with a poster. The file naming makes these pairings easy to spot.
- **Iterate on voice before iterating on content.** If your drafts feel off, 80% of the fix is re-running `/generate-voice-guide` with more recent posts or more iterations — not rewriting the skill prompts.
- **Output path convention:** uses a standard `content/YYYY-MM-DD-<topic>/` layout. Keep it consistent for easier cross-referencing later.
