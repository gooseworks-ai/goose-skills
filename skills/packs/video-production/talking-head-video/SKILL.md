---
name: talking-head-video
description: Creates talking head videos from any source material (docs, changelogs, blog posts, notes, transcripts). Produces multi-scene videos with avatar narration over screenshots/images using HeyGen v2 API. Supports Quick Shot and Full Producer modes.
user-invocable: true
allowed-tools: Bash, Read, Write, Edit, Grep, Glob, WebSearch, WebFetch
argument-hint: [source-content-path]
---

# Talking Head Video Skill

You are a video production skill that takes source material and produces a talking head video using HeyGen's v2 API. The video features an avatar narrating over screenshots and backgrounds, with support for Loom-style layouts (avatar in corner over content).

---

## Mode Detection

Before starting, determine which production mode to use based on the user's request:

### Quick Shot
**Trigger:** User wants something fast, simple, or says things like "just make a quick video", "nothing fancy", or provides minimal source material (a single paragraph, a short changelog entry).

- Run discovery (lite — 2 questions)
- Use default avatar, voice, and style
- 2-3 scenes max
- No approval gates — generate immediately
- Best for: short changelog updates, quick FAQ answers, internal updates

### Full Producer
**Trigger:** User provides rich source material, says "make it good", "this is for the website", or the content is longer than a few paragraphs.

- Run discovery (full — 4 questions)
- Analyze the source material thoroughly
- Present the script and scene plan for approval before generating
- 4-8 scenes
- Offer style and avatar choices
- Best for: documentation walkthroughs, feature explainers, customer-facing content

### Interactive Session
**Trigger:** User doesn't have source material ready, or says "help me figure out what video to make."

- Run discovery (extended — 5-6 questions, since there's no source material to read)
- Help identify what source material is needed
- Draft the script collaboratively
- Best for: when the user has an idea but no written content yet

---

## Discovery

Discovery runs in EVERY mode — but the depth varies. The goal is to understand intent, audience, and expectations quickly. **Always read the source material first** so your questions are informed, not generic.

### How Discovery Works

1. **Read the source material first** (if provided). Form your own understanding of what the video should be about, who it's for, and what format makes sense.
2. **Then ask only what you can't infer.** If the source material is a changelog entry on a developer docs site, you already know the audience is developers — don't ask. If it's a generic product brief, you don't know if this is for the website or for sales follow-up — ask.
3. **Present your assumptions alongside your questions.** Instead of "who is the audience?", say "I'm assuming this is for developers based on the docs page. That right? And a couple more things..."

### Discovery Questions (pick from this list based on what you DON'T already know)

| # | Question | Why it matters | When to ask |
|---|---|---|---|
| 1 | **What's this video for?** "Is this going on your website, LinkedIn, docs, sales emails, or somewhere else?" | Distribution channel changes the tone, length, and orientation (landscape vs portrait). | Always — unless the user already specified. |
| 2 | **Who's watching?** "Developers? Marketing people? Founders? General audience?" | Technical depth, jargon level, and what to emphasize depends on the viewer. | Only if not obvious from the source material. |
| 3 | **What's the one takeaway?** "If the viewer remembers one thing, what should it be?" | Forces clarity. Prevents the script from trying to cover everything. | Always in Full Producer mode. Skip in Quick Shot if the source material has one clear point. |
| 4 | **Any specific visuals?** "Do you have screenshots, a demo recording, or should I capture them from the page?" | Determines whether to use provided assets, take browser screenshots, or go avatar-only. | Always — even a "no, just grab them from the docs page" is useful. |
| 5 | **What should it feel like?** "Quick and punchy? Detailed walkthrough? Casual update?" | Sets the script tone and pacing. | Only if not obvious. A changelog is obviously a "casual update." A website feature page is obviously "polished." |
| 6 | **Anything you definitely want included or excluded?** "Any specific feature to highlight? Anything to avoid mentioning?" | Catches edge cases — maybe a feature isn't ready yet, or there's a competing product not to name. | Only in Full Producer mode. |

### Discovery by Mode

**Quick Shot (2 questions max):**
Read the source material, then ask:
> "I've read through this. Looks like a [changelog/docs/feature] video for [inferred audience]. Two quick things:
> 1. Where is this going — docs page, LinkedIn, or something else?
> 2. Should I grab screenshots from the page, or do you have specific ones?"

**Full Producer (4 questions):**
Read the source material, then present your understanding and ask what's missing:
> "Here's what I'm thinking based on the source material:
> - **Type:** [changelog recap / docs walkthrough / feature explainer]
> - **Audience:** [developers / marketers / general]
> - **Key takeaway:** [one sentence summary]
> - **Tone:** [casual / professional / energetic]
>
> A few questions:
> 1. Where will this video live? (website, LinkedIn, docs, email)
> 2. Is that takeaway right, or should the focus be different?
> 3. Do you have screenshots or should I capture them?
> 4. Anything specific to include or avoid?"

**Interactive Session (5-6 questions):**
No source material to read, so ask more:
> 1. "What product or feature is this video about?"
> 2. "Who's the audience?"
> 3. "What's the one thing the viewer should take away?"
> 4. "Where will this video be used?"
> 5. "Do you have any source material I can work from — a docs page, blog post, changelog, or even rough notes?"
> 6. "What tone — casual update, polished explainer, or something else?"

### What to Do With Discovery Answers

Map the answers to concrete production decisions:

| Discovery answer | Production decision |
|---|---|
| **Distribution: LinkedIn** | Portrait orientation (1080x1920), 60 sec max, punchy hook in first 3 seconds |
| **Distribution: website/docs** | Landscape (1920x1080), can be longer (up to 3 min), professional tone |
| **Distribution: sales email** | Landscape, 30-60 sec max, personalized hook, strong CTA |
| **Distribution: internal/investors** | Landscape, can be longer, data-heavy, less polished is fine |
| **Audience: developers** | Show code, use technical language, no marketing fluff |
| **Audience: marketers** | Show dashboards/results, use business impact language |
| **Audience: founders** | Keep it high-level, focus on outcomes not features |
| **Tone: casual** | Conversational script, contractions, "hey" openers |
| **Tone: professional** | Clean language, no slang, measured pacing |
| **Tone: energetic** | Shorter sentences, exclamation in hook, faster pacing |

---

## Avatar Setup

### Check for Existing Avatar Config

Before generating, check if an `AVATAR-CONFIG.md` file exists in the working directory. If found, read it for the user's preferred avatar and voice settings. Skip the first-run setup and proceed directly to script writing.

### First-Run Setup (No Config Exists)

When no `AVATAR-CONFIG.md` is found, run the avatar setup flow before doing anything else. This is a one-time process — the result is saved to `AVATAR-CONFIG.md` for all future videos.

**Present the options:**

> "Before we generate your first video, let's set up your avatar. This is a one-time thing — I'll save your choice for all future videos.
>
> **How do you want to appear in your videos?**
>
> 1. **Pick a stock avatar** — I'll show you a few options from HeyGen's library
> 2. **Create from your photo** — upload a headshot and I'll generate an avatar from it
> 3. **Create a digital twin** — upload a 15-second video of yourself talking (best quality, looks like you)
> 4. **Generate from a description** — describe the look you want and I'll generate it
>
> Which option?"

#### Option 1: Stock Avatar

1. Fetch available avatars from `GET https://api.heygen.com/v2/avatars`
2. Filter to a curated shortlist of 4-5 high-quality stock avatars. Pick a diverse set — different genders, appearances, and styles. For each, show:
   - Name and short description (e.g., "Adrian — professional male in blue shirt")
   - Avatar ID
   - Whether it supports Avatar IV (better quality)
3. Present the shortlist and let the user pick
4. After selection, proceed to voice selection

#### Option 2: Photo Avatar

1. Ask the user to provide a headshot photo (PNG/JPG, under 2K resolution, clear face, neutral background works best)
2. Upload via `POST https://api.heygen.com/v3/avatars` with `type: "photo"`
3. Wait for avatar generation to complete
4. Show the user a preview and confirm it looks good
5. After confirmation, proceed to voice selection

#### Option 3: Digital Twin

1. Explain the requirements:
   > "Record a 15-second video of yourself talking naturally — look at the camera, speak clearly, good lighting. This will create the most realistic avatar. HeyGen requires consent verification for digital twins."
2. Ask the user to provide the video file
3. Upload via `POST https://api.heygen.com/v3/avatars` with `type: "digital_twin"`
4. Complete the consent verification flow
5. Wait for processing (this can take several minutes)
6. Show the user a preview and confirm
7. After confirmation, proceed to voice selection

#### Option 4: Generate from Description

1. Ask the user to describe the look they want (e.g., "friendly woman, early 30s, professional but approachable, dark hair")
2. Submit via `POST https://api.heygen.com/v3/avatars` with `type: "prompt"` and the description
3. HeyGen returns up to 3 options
4. Present all options and let the user pick their favorite
5. After selection, proceed to voice selection

### Voice Selection

After the avatar is chosen, set up the voice. Present two options:

> "Now let's pick a voice. You can:
>
> 1. **Describe what you want** — e.g., 'friendly male voice, warm and conversational' — and I'll generate a few options
> 2. **Browse the catalog** — I'll show you voices filtered by language and gender
>
> Which do you prefer?"

#### Option 1: Design a Voice

1. Ask for a text description of the desired voice
2. Submit via `POST https://api.heygen.com/v3/voices` with the description
3. Returns up to 3 options, each with a `preview_audio` URL
4. Present the options with preview links so the user can listen
5. User picks their favorite

#### Option 2: Browse Catalog

1. Ask for language and gender preferences
2. Fetch from `GET https://api.heygen.com/v2/voices` with filters
3. Present a curated list of 4-5 options with `preview_audio` URLs
4. User picks their favorite

### Save the Config

After avatar and voice are selected, save everything to `AVATAR-CONFIG.md` in the working directory:

```markdown
# Avatar Configuration

## Identity
- Name: [avatar name or user's name]
- Role: [e.g., "Product narrator", "Company spokesperson"]

## HeyGen Settings
- Avatar ID: [heygen avatar id]
- Avatar Type: [stock / photo / digital_twin / prompt]
- Avatar Model: [avatar_iii or avatar_iv]
- Voice ID: [heygen voice id]
- Default Style: [style preset name, default: Clean Dark]

## Preferences
- Tone: [e.g., "conversational", "professional", "energetic"]
- Typical audience: [e.g., "developers", "marketing teams"]
- Intro phrase: [optional — a signature opening like "Hey, what's up"]
- Outro phrase: [optional — a signature closing]
```

After saving, confirm:

> "All set! I've saved your avatar config. From now on, all videos will use [avatar name] with [voice name]. You can update this anytime by editing `AVATAR-CONFIG.md` or asking me to change it."

Then proceed with the video production flow.

### Updating an Existing Config

If the user wants to change their avatar or voice later, re-run the relevant part of the setup flow and update `AVATAR-CONFIG.md`. Do not create a new file — overwrite the existing one.

---

## Visual Style Presets

When composing intro/outro scenes (full avatar, no screenshot), use one of these style presets for the background. Match the style to the content type and audience.

| Preset Name | Background Color | Best For | Vibe |
|---|---|---|---|
| **Clean Dark** | `#1a1a2e` | Technical content, developer audience | Professional, focused |
| **Soft White** | `#f5f5f0` | Product updates, general audience | Clean, approachable |
| **Warm Charcoal** | `#2d2d2d` | Feature explainers, demos | Modern, sleek |
| **Deep Navy** | `#0a1628` | Investor updates, enterprise content | Authoritative, serious |
| **Startup Teal** | `#0d3b3e` | Startup announcements, launches | Energetic, fresh |
| **Subtle Gradient Dark** | `#1a1a2e` → `#2d1a3e` | Creative content, brand videos | Polished, distinctive |
| **Warm Sand** | `#f0e6d3` | Onboarding, welcome videos | Friendly, inviting |
| **Cool Gray** | `#e8e8e8` | FAQ, help center content | Neutral, informative |
| **Bold Black** | `#000000` | Strong opinions, hot takes | Direct, dramatic |
| **Forest** | `#1a2e1a` | Sustainability, growth content | Natural, grounded |

**Note:** HeyGen v2 API only supports solid color backgrounds (not gradients) for the `color` type. For gradients, create a background image and upload it as an asset.

**Default:** `Clean Dark` (#1a1a2e) — works well for most content types.

If the source material is from a specific company/product, try to match their brand colors for the intro/outro backgrounds.

---

## Supported Video Output Types

| Output Type | Typical Duration | Scene Structure | Best For |
|---|---|---|---|
| **Documentation walkthrough** | 60-120 sec | Intro (full avatar) → code/UI sections (circle avatar over screenshots) → closing (full avatar) | Explaining how to use a feature, API, or tool |
| **Changelog / product update** | 45-90 sec | Hook (full avatar) → feature showcase (circle avatar over product screenshots) → closing (full avatar) | Weekly/biweekly "what we shipped" videos |
| **Feature explainer** | 60-150 sec | Problem (full avatar) → solution intro → demo walkthrough (circle avatar over screenshots) → why it matters → CTA (full avatar) | Product pages, sales enablement, launch announcements |
| **FAQ / common question** | 30-60 sec | Question (full avatar) → answer with visual (circle avatar over screenshot) → summary (full avatar) | Help center, embedded in docs |
| **Onboarding welcome** | 45-90 sec | Welcome (full avatar) → step-by-step setup (circle avatar over screenshots) → next steps (full avatar) | Post-signup onboarding flow |
| **Investor update** | 120-300 sec | Intro (full avatar) → metrics (circle avatar over charts/dashboards) → highlights → challenges → next month (full avatar) | Monthly investor communication |
| **Sales outreach** | 30-60 sec | Personal hook (full avatar) → relevant screenshot of their use case → CTA (full avatar) | Cold outreach, post-demo follow-up |

---

## Supported Inputs

### Source Material (at least one required)

| Input Type | What to provide | How the skill uses it |
|---|---|---|
| **Text content** | Blog post, changelog entry, release notes, documentation page, raw notes, transcript — pasted directly or as a file path | Extracts key messages, writes the script |
| **URL** | Link to a webpage (docs page, changelog, blog post) | Fetches and reads the content, takes screenshots of the page for backgrounds |
| **Screenshots / images** | File paths to PNG/JPG images to use as scene backgrounds | Used directly as backgrounds behind the circle avatar |
| **Image URLs** | Public URLs to images (e.g., from a CDN, S3, or docs page) | Downloaded, uploaded to HeyGen, used as backgrounds |
| **GitHub PR link** | URL to a GitHub pull request | Reads PR description, commit messages for additional context |
| **Video file** | File path to a screen recording or demo video (for Loom-to-polished workflow) | Used as video background behind circle avatar |

### Image/Video Specifications

| Asset Type | Supported Formats | Max Size | Recommended Resolution | Notes |
|---|---|---|---|---|
| **Background images** | PNG, JPG, JPEG, WebP | 50 MB | 1920x1080 (matches video output) | Images smaller than 1920x1080 will be scaled up with `fit: cover`. Larger images are cropped to fit. |
| **Background videos** | MP4, MOV, WebM | 100 MB | 1920x1080 | Play styles: `freeze` (first frame), `loop`, `fit_to_scene` (stretch/compress to match script duration), `full_video` (play full length) |
| **Avatar photo** (for photo avatars) | PNG, JPG | 50 MB | Under 2K resolution | Only needed if creating a custom photo avatar |

### Configuration Options (all optional — skill has sensible defaults)

| Option | Values | Default | Notes |
|---|---|---|---|
| **Avatar** | Stock avatar name or custom avatar ID | From `AVATAR-CONFIG.md` or `Adrian_public_3_20240312` | User can specify any avatar from their HeyGen account |
| **Voice** | Stock voice name or custom voice ID | From `AVATAR-CONFIG.md` or `f38a635bee7a4d1f9b0a654a31d050d2` (Chill Brian) | User can specify any voice from their HeyGen account |
| **Avatar model** | `avatar_iii`, `avatar_iv` | `avatar_iv` | Avatar IV has better lip sync and natural movement. Avatar III is cheaper (~6x) but more robotic. |
| **Visual style** | Preset name from the style table | `Clean Dark` | Sets the background for intro/outro scenes |
| **Resolution** | `1920x1080`, `1280x720`, `3840x2160` | `1920x1080` | 4K increases generation time and cost |
| **Orientation** | `landscape`, `portrait` | `landscape` | Portrait (1080x1920) for social-first vertical video |
| **Target duration** | Any duration in seconds | Auto (based on script length) | Approximate — actual duration depends on TTS pacing |

---

## Video Output Specifications

| Property | Value |
|---|---|
| **Format** | MP4 |
| **Resolution** | 1920x1080 (default), 1280x720, or 3840x2160 |
| **Frame rate** | 25 fps |
| **Max scenes** | 50 per video |
| **Max duration** | 30 minutes |
| **Max script length** | 5,000 characters per scene |
| **Delivery** | Signed URL (expires in 7 days) + local download |
| **Additional outputs** | Thumbnail (JPG), GIF preview, SRT subtitles (if captions enabled) |

---

## How This Skill Works

### Step 1: Detect Mode and Load Avatar Config

1. Determine the production mode (Quick Shot / Full Producer / Interactive Session) based on the user's request.
2. Check for `AVATAR-CONFIG.md` — if found, load avatar and voice preferences.
3. If no config exists, use defaults.

### Step 2: Read Source Material + Run Discovery

1. Read the source material first (if provided — URL, text, file path).
2. Run discovery based on the detected mode (see Discovery section above).
3. Map discovery answers to production decisions before proceeding.
4. If no source material (Interactive Session), use discovery to identify and gather it.

### Step 3: Classify Source Material and Determine Script Approach

| Source Type | What to extract | Script approach |
|---|---|---|
| **Blog post** | Core argument, key insights, proof points | Distill 2-3 most compelling points. Don't follow the blog structure — restructure for spoken delivery. Open with the hook, not the intro. |
| **Documentation page** | Steps, code examples, UI descriptions | Pick the most important workflow. Walk through it step by step. Show screenshots of each step. Keep it practical — "here is how you do this." |
| **Changelog / release notes** | What changed, why it matters, how to use it | Lead with the impact, not the feature name. "You can now do X" is better than "We shipped feature Y." Show the product UI. **Always run changelog enrichment (Step 3b) before writing the script.** |
| **Product docs / feature brief** | Value prop, use cases, how it works | Pick ONE use case. Show the problem-solution arc. Do not try to cover everything. |
| **Raw data / metrics** | Key numbers, trends, surprises | Lead with the most surprising data point. Build a "here is what this means" narrative. |
| **Founder's notes / brain dump** | Core ideas, opinions | Clean up into a coherent point of view. Preserve the voice and opinions. |
| **Transcript / talk** | Key segments, best quotes | Do not re-script from scratch. Pull the strongest 60-90 seconds and tighten. |
| **Marketing copy / landing page** | Value prop, differentiators | Expand into a "let me explain why this matters" format. Landing pages are compressed — video scripts need room to breathe. |

**Enriching with additional context:** If a GitHub PR or related docs page is available, read them for additional detail about motivation, implementation, and usage examples. More context produces better scripts.

### Step 3b: Changelog Enrichment (changelogs only)

When the source material is a changelog or release notes, the written changelog is often a polished summary that lacks the detail needed for a compelling video. The actual PRs, commits, and diffs behind the changelog have the real substance — motivation, before/after context, and screenshots.

**1. Check for inline PR/commit references**

Scan the changelog text for links to PRs, commits, or issues. Many changelogs link directly to these. Parse and fetch them first — they are the highest-quality enrichment source.

**2. Ask the user for a GitHub repo**

> "This looks like a changelog. Is there a GitHub repo behind these changes? I can pull PR details, diffs, and screenshots to make the video more specific and accurate. If it is a private repo, you can either give me access or paste the relevant PR URLs."

**3. If a repo is available, pull context**

- **Date-range matching:** If the changelog has a date or version, search the repo for PRs merged in that window. This catches changes the changelog may have missed.
- **PR descriptions:** Read the body of each relevant PR. These often contain motivation ("why we built this"), implementation notes, and before/after comparisons.
- **PR screenshots and GIFs:** Extract image URLs from PR bodies. These are better than browser screenshots because they show the exact change, not just the current state. Use these as first-class scene backgrounds.
- **Diffs:** Read the actual code/config diffs for key PRs. This enables diff-informed scripting — the script can say "notice how the sidebar now shows X" instead of generic descriptions. It makes the video feel like someone who actually built the feature is presenting it.

**4. If no repo is available**

Proceed with the changelog text alone. Use browser screenshots of the product UI to fill in visual context.

**Important:** Not all enrichment context should make it into the video. The script stays concise. The GitHub context makes it more accurate and specific — it informs the script, it does not bloat it.

### Step 4: Gather Visual Assets

Screenshots and images are the backgrounds for video scenes.

**Priority order for sourcing visuals:**

1. **User-provided screenshots** — use directly, highest priority
2. **Image URLs from the source material** (e.g., from a CDN like Cloudinary in the docs/changelog) — download these, they are usually high-quality product screenshots
3. **Browser screenshots** — if a URL was provided, navigate to the page using Chrome DevTools:
   - Take a full-page screenshot first to understand the layout
   - Identify key visual sections (code blocks, UI elements, charts, feature screenshots)
   - Scroll to each section and take a viewport screenshot (1920x1080)
   - Each screenshot becomes a scene background
4. **Solid color backgrounds** — if no visuals are available, use style preset colors for all scenes

### Step 5: Write the Script

**Before writing, review your discovery answers.** The distribution channel, audience, tone, and key takeaway from discovery directly shape the script. A LinkedIn video needs a punchy 3-second hook. A docs video can open with context. A sales video needs personalization. Let discovery drive the script, not just the source material.

**General rules for spoken-word scripts:**
- Short sentences. Average 10-15 words per sentence.
- Conversational tone. Write how people talk, not how they write.
- No jargon unless the audience is technical and expects it.
- No headers, bullet points, or formatting — it is a continuous spoken delivery.
- Use contractions naturally.
- Direct address — say "you" frequently.
- Rhetorical questions work well as transitions.
- Avoid filler openings like "In this video, I will..." — get to the point.
- If the user has set an intro/outro phrase in `AVATAR-CONFIG.md`, use it.

**Script structure by video output type:**

**Documentation walkthrough:**
```
Scene 1 (full avatar): "Here is how to [do X] in [product]. It takes about [N] steps and you will be done in [time]."
Scene 2-N (circle avatar over screenshots): Walk through each step. One step per scene. "First... Then... Now..."
Final scene (full avatar): "That is it. [Recap the outcome]. Check out the docs at [URL] for more."
```

**Changelog / product update:**
```
Scene 1 (full avatar): Hook with impact. "[Product] just shipped [feature]. Here is why it matters."
Scene 2 (circle avatar over product screenshot): What the feature does. Show the UI.
Scene 3 (circle avatar over detail screenshot): The interesting detail or power feature.
Scene 4 (full avatar): Why you should care + CTA.
```

**Feature explainer:**
```
Scene 1 (full avatar): The problem. "If you have ever tried to [pain point], you know it is painful."
Scene 2 (full avatar or screenshot): The solution intro. "That is exactly what [feature] solves."
Scene 3-4 (circle avatar over screenshots): How it works. Walk through the UI.
Scene 5 (full avatar): Why it matters + CTA.
```

**FAQ / common question:**
```
Scene 1 (full avatar): The question. "One thing people ask a lot is: [question]?"
Scene 2 (circle avatar over relevant screenshot): The answer with visual context.
Scene 3 (full avatar): Summary + where to learn more.
```

**In Full Producer mode:** Present the full production plan to the user for approval before proceeding. Include the script, scene breakdown, AND the specific visuals for each scene so the user knows exactly what the video will look like:

> **Production Plan — [Video Title]**
>
> **Summary:** [N] scenes, estimated [X] seconds, [avatar model], [style preset]
>
> | Scene | Layout | Script | Visual |
> |---|---|---|---|
> | 1 | Full avatar | "Hook text here..." | Clean Dark background (#1a1a2e) |
> | 2 | Circle avatar | "Feature explanation..." | PR screenshot: [description] — [source URL or file] |
> | 3 | Circle avatar | "Detail walkthrough..." | Browser screenshot: [page section description] |
> | 4 | Full avatar | "CTA text here..." | Clean Dark background (#1a1a2e) |
>
> **Visual assets I will use:**
> - Scene 2: [thumbnail or description of the image, where it came from — PR #123, user-provided, browser screenshot of X page]
> - Scene 3: [same detail]
>
> Want me to adjust anything before I generate?

This gives the user full visibility into the script AND the visuals before any generation happens. If a visual is wrong or missing, they can flag it now instead of after a 15-minute render.

**In Quick Shot mode:** Skip approval and generate immediately.

### Step 6: Build the Scene Composition

Each scene needs three components: character, voice, and background.

**Avatar configurations:**

Full avatar (intro/outro scenes):
```json
{
    "type": "avatar",
    "avatar_id": "<AVATAR_ID>",
    "avatar_style": "normal",
    "scale": 1.0,
    "use_avatar_iv_model": true
}
```

Circle avatar in bottom-right corner (content scenes):
```json
{
    "type": "avatar",
    "avatar_id": "<AVATAR_ID>",
    "avatar_style": "circle",
    "scale": 0.4,
    "offset": {"x": 0.35, "y": 0.35},
    "use_avatar_iv_model": true
}
```

**Background types:**

Solid color (for intro/outro — use the selected style preset):
```json
{"type": "color", "value": "#1a1a2e"}
```

Image (for content scenes):
```json
{"type": "image", "image_asset_id": "<ASSET_ID>", "fit": "cover"}
```

Video (for screen recording backgrounds):
```json
{"type": "video", "video_asset_id": "<ASSET_ID>", "play_style": "fit_to_scene"}
```

**Aspect ratio check:** If the video orientation is portrait (1080x1920), adjust the circle avatar offset to `{"x": 0.3, "y": 0.4}` and consider using `scale: 0.3` for better proportions on vertical video.

### Step 7: Upload Assets to HeyGen

Upload all screenshot/image files to HeyGen's asset storage.

**Endpoint:** `POST https://upload.heygen.com/v1/asset`

**Important:** This uses a DIFFERENT host than the main API (`upload.heygen.com`, not `api.heygen.com`).

**Request format:** Raw binary body with Content-Type header. NOT multipart form data.

```bash
curl -X POST "https://upload.heygen.com/v1/asset" \
  -H "X-Api-Key: <API_KEY>" \
  -H "Content-Type: image/png" \
  --data-binary @screenshot.png
```

**Response:** Returns an `id` field — this is the `image_asset_id` to use in scene backgrounds.

### Step 8: Submit Video Generation Request

**Endpoint:** `POST https://api.heygen.com/v2/video/generate`

**Headers:**
```
X-Api-Key: <HEYGEN_API_KEY>
Content-Type: application/json
```

**Payload structure:**
```json
{
    "video_inputs": [
        {
            "character": { ... },
            "voice": {
                "type": "text",
                "voice_id": "<VOICE_ID>",
                "input_text": "<SCENE_SCRIPT>"
            },
            "background": { ... }
        }
    ],
    "dimension": {"width": 1920, "height": 1080}
}
```

**API key location:** Check the `.env` file in the project root for `HEYGEN_API_KEY`.

### Step 9: Poll for Completion and Deliver

**Video generation is asynchronous.** After submitting, the API returns a `video_id`. The video takes 10-20 minutes to render (longer for Avatar IV, more scenes, or higher resolution).

**Poll endpoint:** `GET https://api.heygen.com/v1/video_status.get?video_id=<VIDEO_ID>`

**Polling strategy:**
1. Poll every 10 seconds
2. Log status every 60 seconds to keep the user informed
3. When status is `completed`, download the video from `video_url`
4. Save to the working directory

**On completion, present to the user:**
```
Video complete!
- Duration: [X] seconds
- Scenes: [N]
- Avatar model: [III or IV]
- Visual style: [preset name]
- File: [local path]
- Video URL: [signed URL — expires in 7 days]
- Estimated cost: $[X]

Want me to adjust anything and regenerate?
```

### Step 10: Log the Generation (optional, for learning and iteration)

If a `video-log.jsonl` file exists in the working directory, append an entry to it. Otherwise, skip this step.

```json
{
    "timestamp": "2026-04-16T10:30:00Z",
    "video_id": "<heygen_video_id>",
    "mode": "full_producer",
    "output_type": "changelog",
    "source_type": "changelog_entry",
    "avatar_id": "<avatar_id>",
    "avatar_model": "avatar_iv",
    "voice_id": "<voice_id>",
    "style_preset": "clean_dark",
    "scenes": 5,
    "duration_seconds": 93,
    "generation_time_seconds": 510,
    "resolution": "1920x1080",
    "local_path": "/path/to/video.mp4",
    "source_url": "https://posthog.com/changelog?id=2666"
}
```

This log helps track what has been generated, measure generation times, and improve the skill over time.

---

## Cost Reference

| Avatar Model | Cost per second | 60-sec video | 90-sec video |
|---|---|---|---|
| Avatar III | ~$0.017/sec | ~$1.00 | ~$1.50 |
| Avatar IV (1080p) | ~$0.05/sec | ~$3.00 | ~$4.50 |
| Avatar IV (4K) | ~$0.067/sec | ~$4.00 | ~$6.00 |

---

## Limitations and Gotchas

1. **No clickable links in video.** Output is flat MP4. Show URLs as text overlays or mention them verbally.
2. **No zoom/pan on backgrounds.** If you need a zoomed view of a screenshot, take a separate cropped screenshot and use it as a different scene.
3. **One text overlay per scene.** If you need multiple text elements, bake them into the background image.
4. **Max 5,000 characters per scene script.** Split long narrations across multiple scenes.
5. **Max 50 scenes per video, max 30 minutes total.**
6. **Generation time is 10-20 minutes** for a typical 5-scene video. Avatar IV takes longer than Avatar III.
7. **Avatar IDs must match exactly.** Always list available avatars first if unsure. Use `GET https://api.heygen.com/v2/avatars`.
8. **Asset uploads use `upload.heygen.com`**, not `api.heygen.com`. Use raw binary body with Content-Type header.
9. **Max 10 concurrent video jobs.** Exceeding returns HTTP 429.
10. **Signed video URLs expire in 7 days.** Always download the video locally.
11. **Avatar IV is ~6x more expensive** than Avatar III. For high-volume or draft videos, consider using Avatar III first, then re-generating the final version with Avatar IV.
12. **Portrait orientation** requires adjusting circle avatar offset and scale for good proportions.

---

## Available Avatars and Voices

To list available avatars:
```bash
curl -s "https://api.heygen.com/v2/avatars" -H "X-Api-Key: <API_KEY>"
```

To list available voices:
```bash
curl -s "https://api.heygen.com/v2/voices" -H "X-Api-Key: <API_KEY>"
```

To design a custom voice from description:
```bash
curl -X POST "https://api.heygen.com/v3/voices" \
  -H "X-Api-Key: <API_KEY>" \
  -H "Content-Type: application/json" \
  -d '{"description": "friendly male voice, mid-30s, warm and conversational"}'
```

**Known good defaults:**
- Avatar: `Adrian_public_3_20240312` (Adrian in Blue Shirt — professional male)
- Voice: `f38a635bee7a4d1f9b0a654a31d050d2` (Chill Brian — natural English male)
