---
name: vid-motion-graphics
description: Generate motion-graphics videos in HeyGen from a brief or scene-by-scene prompt. Best for animated text, icon, stat-reveal, brand-intro, explainer, and social-ad videos with no talking head. Prefer HeyGen Video Agent for quick one-off videos; use HeyGen AI Studio templates when reusable brand-controlled motion graphics or square exports are required.
tags: [content, design, social]
---

# Vid Motion Graphics

Create motion-graphics-first video in HeyGen. The default output is a graphic-driven MP4 with animated text, icons, shapes, transitions, optional voiceover, and optional background audio. Do not use a presenter unless the user explicitly asks for one.

## Best Fit

- Brand intros and end cards
- Explainer snippets and feature teasers
- Stat reveals, timelines, comparisons, and listicles
- Social ads for LinkedIn, Instagram, TikTok, and YouTube Shorts
- Short launch videos where visual polish matters more than a human face

## Use Something Else

- If the user wants a human presenter, lip-sync avatar, or Loom-style delivery, use `talking-head-video`.
- If the user only needs still graphics, slides, posters, or carousels, use `goose-graphics`.
- If the user wants product-image reels with beat-synced cuts, use `beat-sync-reel` or `product-reel-generator`.

## Core Constraint

As of April 29, 2026, HeyGen documents v3 as the active platform, but also states that the Studio API and Template API remain the key exceptions and are still supported on legacy endpoints through October 31, 2026. This skill intentionally uses:

- `Video Agent` for fast prompt-native generation
- `AI Studio template generation` for strict reusable motion-graphics layouts

That split is expected and correct for HeyGen right now.

## Inputs

| Parameter | Required | Default | Notes |
|-----------|----------|---------|-------|
| `prompt` | Yes | - | Content topic and motion brief |
| `style` | No | `clean-slate` | Visual direction, mood, and brand feel |
| `duration` | No | `30` | Seconds |
| `music` | No | `auto` | Genre, energy, or a concrete audio asset |
| `aspect_ratio` | No | `16:9` | `16:9`, `9:16`, or `1:1` |
| `voiceover` | No | none | Optional narration script |
| `brand_kit` | No | none | Logo, colors, font preferences, icon style |
| `text_animation` | No | `fade` | `fade`, `slide`, `typewriter`, `bounce`, or specific timing notes |
| `assets` | No | none | Logos, screenshots, icons, diagrams, reference videos, PDF briefs |

## Mode Selection

Choose one path before generating anything.

| Mode | Use When | Why |
|------|----------|-----|
| `Agent Cut` | One-off video, fast turnaround, no existing template, user is okay with prompt-native visuals | HeyGen Video Agent can produce motion graphics, overlays, B-roll, and narration from a structured prompt |
| `Template Cut` | Reusable brand system, exact text positions, locked scenes, repeat campaigns, strict icon/logo control, or square output | AI Studio templates let you replace text, image, video, audio, and voice variables predictably |

### Choose `Agent Cut` by default

Use `Agent Cut` unless one of these is true:

- The user already has a HeyGen template they want to reuse
- The user needs exact reusable layout control
- The user needs `1:1` square output or another nonstandard motion-graphics layout
- The user needs exact asset replacement across many variants
- The user needs a music bed or scene media controlled as explicit template variables

## Step 1 - Intake

Ask only for what is missing. Keep it conversational, not form-like.

Collect:

1. The message and CTA
2. Audience and channel
3. Duration target
4. Aspect ratio
5. Whether this is voiceover-led or text-only
6. Brand kit details: logo, colors, fonts, icon style
7. Exact on-screen copy the user wants to appear
8. Music direction: energy, genre, or actual file
9. Whether this is a one-off cut or a reusable template workflow

If the user gives vague copy like "make a video about AI", do not jump straight to generation. Get the actual headline, the actual stats, and the actual CTA first.

## Step 2 - Build the Motion Blueprint

Before generating, turn the request into a scene plan. This is the load-bearing artifact for both paths.

Use a structure like:

| Scene | Seconds | Visual | On-screen text | Motion | Audio |
|-------|---------|--------|----------------|--------|-------|
| 1 | 0-3 | Intro card | "..." | logo reveal, text fade | music swell |
| 2 | 3-8 | Stat reveal | "..." | counter up, icon slide | VO line 1 |
| 3 | 8-14 | Comparison | "..." | split-screen wipe | VO line 2 |
| 4 | 14-18 | CTA | "..." | button pulse, logo lockup | VO line 3 |

Blueprint rules:

- One main idea per scene
- Use the exact text the user wants on screen
- Keep most scenes between 3 and 8 seconds
- For social ads, front-load the hook in the first 2 to 3 seconds
- If the user provided voiceover, pace visuals to the script
- If the user did not provide voiceover, make the on-screen copy carry the message
- Prefer motion graphics for stats, lists, timelines, chapter cards, callouts, and CTA moments

If the video is longer than 30 seconds, brand-sensitive, or packed with exact copy, show the blueprint to the user for approval before rendering.

## Step 3 - Transport Preflight

Pick one transport and stay on it for the whole run.

### For `Agent Cut`

Use this order:

1. HeyGen MCP if the agent host exposes HeyGen MCP tools and the user has not intentionally forced API-key billing
2. `heygen` CLI if installed and authenticated

Important billing rule from HeyGen's own agent-install guide:

- If `HEYGEN_API_KEY` is set, treat that as an explicit direct-API / CLI preference
- Do not silently assume MCP billing once the API key is present

CLI checks:

- `heygen --version`
- `heygen auth status`
- Optional but useful: `heygen user me get`

### For `Template Cut`

Require HeyGen API access plus template ownership. Current HeyGen CLI docs do not expose template-generation commands, so use the official template endpoints documented by HeyGen for this path.

If the user does not already have a suitable template:

- Stop and ask them to create or duplicate one in the HeyGen dashboard first
- Template creation and editing happen in the HeyGen interface, not through the template API

## Step 4A - Agent Cut Workflow

Use this when speed matters more than exact reusable layout control.

### A.1 Prompt Construction Rules

The prompt must be explicit. For pure motion graphics, include the phrase `no avatar`. HeyGen's own prompt guide says avatar-free output requires saying that directly.

Build the prompt from these parts:

1. Goal
2. Audience
3. Duration
4. Orientation
5. `No avatar` or `voice-over only` if the video should stay graphic-only
6. Visual language
7. Brand system
8. Music direction
9. Scene-by-scene blueprint
10. Asset usage notes

Prompt-writing rules:

- Say what appears on screen and when
- Specify energy level: calm, punchy, cinematic, technical, editorial
- Use exact color hex codes when known
- Name the font family when known
- Say whether icons should be thin-line, filled, flat, geometric, or playful
- Tell HeyGen to use motion graphics as the primary visual language
- Only request AI or stock footage if the user actually wants it

### A.2 Asset Rules

If the user provides supporting files:

- Attach logos, screenshots, product UI, diagrams, or PDFs
- Tell HeyGen how to use them, not just that they exist
- Example: "Use the attached screenshots as B-roll during the feature walkthrough"

If the user provides local icons or logos, prefer PNG or JPEG for compatibility. Do not assume SVG upload support.

### A.3 Submission

If using the CLI, the normal pattern is:

1. Optionally inspect styles with `heygen video-agent styles list`
2. Create with `heygen video-agent create`
3. Use `--wait` for simple runs or poll the resulting video with `heygen video get`
4. Download the final asset with `heygen video download`

Use `landscape` for `16:9` and `portrait` for `9:16`.

Do not promise `1:1` square output on the `Agent Cut` path. HeyGen's current agentic tooling documents landscape and portrait orientation; if square is a hard requirement, switch to `Template Cut`.

### A.4 Revision Loop

If the first cut is close but not right:

- Keep the same session if possible
- Request targeted revisions instead of rewriting the whole prompt
- Focus revision notes on one of: pacing, text timing, brand colors, icon style, scene order, CTA clarity

## Step 4B - Template Cut Workflow

Use this when the user needs repeatable, exact, brand-controlled motion graphics.

### B.1 Template Requirements

The template must already exist in HeyGen AI Studio.

Create or verify:

- Correct aspect ratio
- Correct scene count
- Correct static brand styling
- API variables assigned to every element that will change between versions

Template creation facts from HeyGen docs:

- Template creation is done in the HeyGen interface
- You can assign API variables to text, image, video, audio, voice, and avatar elements
- Template generation is then driven through the Template API

### B.2 Variable Design

Use predictable variable names. Example schema:

- `headline_1`
- `subhead_1`
- `stat_1_value`
- `stat_1_label`
- `icon_1_image`
- `bg_1_video`
- `logo_image`
- `music_track`
- `narration_voice`
- `cta_text`

Do not use vague names like `text1` or `asset2` if you can avoid it.

### B.3 API Sequence

For template-based motion graphics, use HeyGen's documented sequence:

1. `GET /v2/templates` to find the template
2. `GET /v3/template/{template_id}` to inspect variables and scene mapping
3. `POST https://upload.heygen.com/v1/asset` for local image, video, or audio assets when needed
4. `POST /v2/template/{template_id}/generate` to render the personalized video
5. `GET /v1/video_status.get?video_id=...` until completion

That v2 + v3 mix is expected. It matches HeyGen's current template documentation.

### B.4 Variable Mapping Rules

- Text variable -> `content`
- Voice variable -> `voice_id`
- Image variable -> `asset_id` or URL
- Video variable -> `asset_id` or URL, plus `play_style` when relevant
- Audio variable -> `asset_id` or URL

For local assets:

- Export icons and logos as PNG or JPEG before upload
- Upload the actual media asset, not a local file path string
- Reuse asset IDs across variants when the same file stays constant

### B.5 When Template Cut Is Mandatory

Use `Template Cut` if any of these are hard requirements:

- Square `1:1` export
- Exact text positions across many versions
- Exact logo or icon placement
- Repeatable stat-card campaigns
- Template-controlled background music or audio tracks
- Locked intro/outro packages for a brand

## Step 5 - Delivery

Default local output name:

- `motion-graphics.mp4`

If there are revisions:

- `motion-graphics-v2.mp4`
- `motion-graphics-v3.mp4`

Deliver:

- Local file path
- Video URL or share URL if available
- Aspect ratio
- Duration
- Which path was used: one-off agent cut or reusable template cut
- Any known caveat, such as "square output required the template path"

## Output Expectations

- Format: MP4
- Preferred resolution: 1080p when the chosen HeyGen path exposes that control
- If the chosen path does not expose direct codec or resolution control, accept HeyGen's standard export and report the actual result back to the user

Do not promise H.264 knobs or explicit render settings unless the active path actually exposes them.

## Guardrails

- Do not invent stats, claims, or CTA copy
- Do not use a presenter unless the user explicitly wants one
- Do not promise square output on the Video Agent path
- Do not attempt template generation without a real template
- Do not assume a generic prompt will yield good motion graphics
- Do not skip the blueprint step when exact pacing matters
- If the user gives no brand kit, use a neutral clean direction and say so

## Prompt Tips

Good prompt shape:

```text
Create a 30-second motion graphics video. No avatar. Style: terminal. Audience: software teams. Aspect ratio: 16:9. Music: ambient tech. Scene 1: headline fades in: "AI is rewriting how teams work." Scene 2: three stats appear one by one with counter animations: "73% faster workflows", "40% lower ops cost", "10x output". Scene 3: logo lockup and CTA: "Build with GooseWorks". Use charcoal, green, and off-white. Use monospaced typography and thin-line icons.
```

Bad prompt shape:

```text
make a motion graphics video about AI
```

## Practical Default

If the user gives a decent brief but not a full storyboard, use this default shape:

1. Hook card
2. Main idea reveal
3. One to three proof points
4. CTA end card

This keeps most motion-graphics videos clean, fast, and useful.
