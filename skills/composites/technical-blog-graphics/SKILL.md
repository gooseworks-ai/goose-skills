---
name: technical-blog-graphics
description: Create accurate technical graphics and diagrams for blog posts from a draft, outline, URL, or section brief. Best for system diagrams, signal pipelines, process maps, comparison charts, architecture visuals, funnels, and annotated technical explainers. Route workflow-like visuals to create-workflow-diagram and polished static blog visuals to goose-graphics.
tags: [content, design]
---

# Technical Blog Graphics

Turn a technical blog post into accurate, polished visuals that explain the mechanism instead of decorating the page.

This skill is for blog-post graphics like the Stormy examples: signal pipelines, comparison matrices, framework diagrams, architecture maps, anti-pattern vs best-practice callouts, and step-by-step GTM or engineering flows.

## Best Fit

- Technical blog posts with architecture or workflow sections
- GTM systems posts with signal flows, routing logic, enrichment chains, or automation maps
- Developer or RevOps explainers that need comparison charts, layered diagrams, or funnel graphics
- Blog posts where each major section should get one supporting visual

## Use Something Else

- If the user only wants one simple workflow diagram from a plain-text flow, use `create-workflow-diagram`.
- If the user already knows the exact visual format and just wants it rendered in a chosen style, use `goose-graphics`.
- If the user wants motion graphics video, use `vid-motion-graphics`.

## Core Principle

Accuracy beats ornament.

Do not generate a technical diagram until the underlying system, sequence, and labels are unambiguous. The visual should compress understanding, not invent it.

## Accepted Inputs

At least one of:

- Blog post URL
- Markdown draft
- Google Doc / pasted article text
- Outline with section headings
- One paragraph describing the concept to visualize

Helpful optional inputs:

- Existing brand style or reference image
- Preferred output size
- Existing product screenshots or logos
- Specific section headings that need graphics
- Whether the output is for inline blog embeds, social promotion, or both

## Output Types

This skill should choose the visual type deliberately. Common options:

| Visual Type | Best For | Preferred Tool |
|-------------|----------|----------------|
| Workflow / pipeline diagram | Sequential steps, signal routing, ETL, lead flows | `create-workflow-diagram` |
| Comparison chart | Old way vs new way, tool comparisons, tradeoffs | `goose-graphics` |
| Layered architecture diagram | Stack layers, mesh diagrams, platform architecture | `goose-graphics` |
| Funnel / progression visual | Awareness to action, signal to meeting, lead qualification stages | `goose-graphics` |
| Callout / protocol visual | Rules, anti-pattern vs best practice, security guardrails | `goose-graphics` |
| Section explainer graphic | One mechanism from a subsection, with labels and arrows | `goose-graphics` |

## Graphic Heuristics

Map the writing to a visual type before rendering:

- If the section explains a sequence of steps, use a workflow or pipeline diagram.
- If the section compares two systems, use a comparison chart.
- If the section explains components and their relationships, use an architecture diagram.
- If the section describes a progression with dropoff or conversion, use a funnel.
- If the section teaches rules, use a protocol or checklist visual.
- If the section makes one strong technical point with 2 to 4 supporting mechanics, use an annotated explainer graphic.

For a strong technical post, prefer **2 to 5 graphics total** rather than over-illustrating every paragraph.

## Workflow

### Step 1 - Read the Source Material

Read the article or section first. Do not ask the user what should be visualized until you have your own view of:

1. The core thesis
2. The major mechanisms
3. The sections that are hardest to understand from text alone
4. The claims that need visual support

Create a working list like:

- Section title
- What the reader needs to understand
- Best visual type
- Rough caption

### Step 2 - Select the Right Sections

Pick the sections that most deserve visuals. Prioritize:

- Workflows with multiple steps
- Comparisons where the contrast matters
- Architectures with multiple moving parts
- Frameworks the reader may want to remember later
- Dense technical sections that become clearer when spatialized

Do not make visuals for filler sections like intros, conclusions, or generic trend statements unless the user explicitly asks.

### Step 3 - Extract the Diagram Facts

For each chosen visual, extract only factual content from the source:

- Node labels
- Tool or system names
- Sequence order
- Inputs and outputs
- Conditional branches
- Metrics or stats
- Rules or protocol steps

Then create a compact spec:

```text
Visual: Signal-to-Ship pipeline
Type: workflow
Purpose: show how a product signal becomes a routed GTM action
Nodes: detect signal -> enrich in Clay -> score in Claude -> write to CRM -> notify Slack
Supporting details: "under 5 minutes", "ephemeral campaign-specific connector"
Caption: "The signal-to-ship pipeline compresses latency between detection and action."
```

If anything important is implied but not stated clearly, stop and ask. Do not fill the gap from intuition.

### Step 4 - Run the Accuracy Check

Before rendering, verify:

- Every node and label exists in the source material or was explicitly provided by the user
- Step order matches the article
- Comparisons are fair and not exaggerated
- Metrics are quoted exactly
- Brand or product names are spelled correctly
- The visual does not imply unsupported system behavior

For technical diagrams, accuracy review is mandatory.

### Step 5 - Choose the Renderer

Use `create-workflow-diagram` when:

- The visual is primarily sequential
- The value comes from clean nodes and directional arrows
- The post section reads like `A -> B -> C -> D`

Use `goose-graphics` when:

- The visual is a comparison chart, architecture map, funnel, protocol card, layered stack, or annotated explainer
- The output needs more layout control than the workflow skill provides
- The visual is for a polished blog embed with stronger typography and composition

### Step 6 - Style Selection

If the post already has a visual style, mirror it.

If not, use this guidance:

- Technical, dark, system-like: prefer structural or blueprint-like styles
- Editorial but technical: prefer clean high-contrast styles
- Friendly GTM or ops content: prefer modern corporate styles with restrained accent colors

If using `goose-graphics`, always search the style catalog first instead of assuming a slug exists:

```bash
npx gooseworks styles list
npx gooseworks styles search "technical blueprint"
npx gooseworks styles search "editorial technical"
```

If none fit, use a neutral technical direction and explain the choice.

### Step 7 - Render

For `create-workflow-diagram`:

- Pass a clean step sequence
- Choose layout intentionally: left-to-right for 4 to 8 steps, top-to-bottom for short flows, snake for longer flows
- Prefer the `Blueprint` or `Minimal White` style for technical blog content

For `goose-graphics`:

- Choose the correct format first
- `infographic` is usually the best default for tall inline blog visuals
- `poster` works for single-concept explainers
- `chart` works for simple matrices or compact comparisons
- Use exact copy for labels and captions

### Step 8 - Deliver with Editorial Context

For each visual, deliver:

- File path(s)
- Suggested section placement
- Suggested alt text
- One-sentence caption
- Brief note on what the graphic clarifies

## Default Output Recommendations

For inline blog graphics:

- Primary format: tall `infographic` or compact `poster`
- Width: blog-friendly and readable on desktop and mobile
- Keep labels large enough to survive responsive scaling

For social derivatives:

- Repurpose into `carousel`, `story`, or `tweet` only after the blog graphic is approved

## Recommended Multi-Graphic Pattern

If the user says "make graphics for this post" and does not specify count, default to:

1. One hero mechanism graphic for the main thesis
2. One process or workflow diagram for the central system
3. One comparison or protocol visual for the most actionable section

This is usually enough for a 1,000 to 2,000 word technical blog post.

## Accuracy Guardrails

- Do not invent architecture components
- Do not infer a data flow that the article does not support
- Do not upgrade a simple sequence into a complex system diagram without evidence
- Do not paraphrase metrics when exact numbers are available
- Do not use decorative stock photos in place of explanatory graphics unless the user asks
- Do not create visuals so dense that the blog embed becomes illegible

## Example Mappings

For a post like "Using OpenClaw for Reddit Lead Generation":

- "Reddit post -> intent filter -> OpenClaw processing -> human review -> meeting" -> workflow diagram
- "Manual monitoring vs OpenClaw + Pulse" -> comparison chart
- "Anti-shilling protocol" -> protocol / rules visual

For a post like "Building the Agentic GTM Mesh":

- "Signal -> enrichment -> routing -> CRM -> Slack" -> workflow diagram
- "Traditional SaaS stack vs Agentic GTM mesh" -> comparison chart
- "Mesh architecture across Claude Code, Clay, Segment, CRM" -> layered architecture graphic

## Useful Invocation Shapes

```text
/technical-blog-graphics --url <blog-post-url>
```

```text
/technical-blog-graphics --draft <markdown-file> --sections "Signal-to-Ship Pipeline, Ops Debt"
```

```text
/technical-blog-graphics --brief "Create an architecture diagram for our GTM mesh section"
```

## Dependencies

Required skills:

- `goose-graphics`
- `create-workflow-diagram`

## Success Criteria

A good output from this skill should make a reader say:

- "Now I understand the system faster."
- "This diagram matches the article exactly."
- "I could reuse this graphic in a presentation without re-explaining it."
