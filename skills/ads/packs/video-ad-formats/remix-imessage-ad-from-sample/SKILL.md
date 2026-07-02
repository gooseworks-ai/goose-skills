---
name: remix-imessage-ad-from-sample
description: Remix a published iMessage video ad from the Goose Ads library for a new brand — keep the source's conversation structure and pacing, swap in the brand's product, voice, and promo code, get the thread approved in-session, then render with create-imessage-video-ad and publish the MP4 back to Gooseworks with live stage reporting. The video counterpart to remix-graphic-ad-from-reference; this is what the app's iMessage format tab calls.
---

# remix-imessage-ad-from-sample

> First end-to-end validated 2026-06-11 (local, no-backend loop): a **Brightroot Daily Greens**
> remix of a friend-asks-friend inverse iMessage source — iphone-frame variant, 14-bubble thread,
> HTML-mimic readiness-card hook, injected SVG wordmark end card. 24.5s master (21.3s chat +
> 3.5s end card, 300ms crossfade), audio mean -10.6 dB / peak -0.1 dB, 12 SFX cues (5 send /
> 7 receive), no SFX on any typing-pop. The Gooseworks MCP publish steps (Phase 4) were stubbed
> in that loop; everything up to and including `meta-upload/` exports ran clean.

## Purpose

Given **one published iMessage ad sample** (from the Goose Ads library) + a **researched brand**,
produce a finished iMessage chat-reveal video for that brand. The source sample defines the
*shape* — bubble count, beat structure, hook type (product-flex vs result-flex), pacing, end-card
recipe — and this skill swaps the *substance*: the conversation is rewritten in the brand's voice,
the screenshot/attachment becomes the brand's product or result, and the end card carries the
brand's real wordmark + CTA code.

This skill is **orchestration**: it derives + gets approval for the conversation, then hands
rendering to [`create-imessage-video-ad`](../create-imessage-video-ad/SKILL.md) and handles all
Gooseworks I/O (render rows, stage reporting, durable upload, final pin). Creative craft rules
(SFX, composer typing, end-card recipe) live in the create molecule — do not duplicate or
override them here.

It runs on the **user's machine inside their Claude Code session** (the goose-video local-worker
model). The runtime contract — MCP tools, proxies, durable URLs — is the installed `ads-remix`
master skill; this recipe assumes it.

## Inputs

| Input | Required | Notes |
|---|---|---|
| `project_id` | yes (app flow) | A draft Gooseworks ad project with `source_sample_id` + `format_key: "imessage"`. The paste-prompt carries it. Without one, `create_ad_project { brand_id, name, source_sample_id, format_key: "imessage" }` first. |
| source sample | from project | `get_ad_template { template_id: <source_sample_id or slug> }` → `recipe.thread` (the source thread.json: bubbles, peer persona, end card), `extracted_script`, `how_to`, `media_url` (watch it if the structure is unclear). |
| brand | yes | Researched brand pack (`research_status: "complete"`); else run the brand-research recipe first. Needs: voice/tone, product imagery (for the attachment bubble), wordmark/logo, CTA code or tagline. |
| `angle` | optional | User-supplied steer ("sell the trial", "code SUMMER20", "make the friend skeptical"). Folded into the conversation draft. |
| machine | yes | `ffmpeg` + Playwright Chromium on the user's machine (preflight below). |

## Composed Atoms

- `create-imessage-video-ad` — the renderer (sibling molecule): continuous Playwright recording, real Apple SFX, end card, exports. This skill never re-implements its steps.
- `watch` — watch the rendered MP4 (frames + transcript) for the output QC pass.
- `create-music-elevenlabs` — optional music bed, only when the source sample carries one (route through the Gooseworks ElevenLabs proxy locally).
- `mix-master` — bed + SFX mix, invoked via the create molecule's workflow.

## Workflow

### Phase 0 — Fetch + gates (no render row yet)
1. `get_ad_project { project_id }` → keep `source_sample_id`, `app_url`, `brand_url`, `brand_id`.
2. `get_ad_template { template_id: source_sample_id }` → keep `recipe.thread`, `extracted_script`,
   `how_to`, `media_url`. If `recipe.thread` is missing, reconstruct the beat structure from
   `extracted_script` (one bubble per line, `me`/`peer` from the speaker prefix) and `/watch` the
   `media_url` to confirm pacing.
3. Brand gate: `get_ad_brand { brand_id }`.
   - `research_status: "complete"` → **REUSE the existing pack — do NOT re-run research.** Read it
     over MCP: `agent-config/brands/<slug>/brand-research/*.md` (voice, palette, never-say) +
     `brand-assets/manifest.json` (product imagery, wordmark). Re-research is a ~10-minute spend
     the user already paid for; repeating it on a complete brand is a bug, not thoroughness.
   - Not `complete` → run the master skill's "Set up a brand" workflow (idempotent), then
     continue. For `failed` specifically: the pack on disk is usually fine (the last run crashed
     before finalize) — inventory it first and patch only the gap (often assets + manifest +
     `finalize_brand_research`, ~30s, zero research).
   - Only exception: the status says complete but the pack files are missing/unreadable, or the
     user explicitly asked to refresh the research — say which case applies before re-running.
4. **Machine preflight** (video renders locally — fail fast and friendly):
   `ffmpeg -version` and `npx playwright --version` + a Chromium launch check, **and** confirm the
   renderer atom resolves — `create-imessage-video-ad` `require()`s the `create-imessage-mockup`
   atom's `generate.js` (the framed-chat renderer; see *Local render contract* below). If any of
   the three is missing, tell the user exactly what to install (`brew install ffmpeg`,
   `npx playwright install chromium`) or to run `goose-video doctor`, and STOP — do not open a
   render row that can only fail.

### Phase 1 — Derive the brand's thread.json
Map the source thread onto the brand. Rules:
- **Keep the source's structure**: same bubble count (±1), same sender alternation, same beat
  types (hook attachment → reaction → curiosity question → brand reveal + code), same
  `typing_before` and `composer_drives` placements. The structure is *why this ad works*.
- **Swap the substance**: texting-register copy in the brand's voice (lowercase ok, no marketing
  speak — it must read like two friends), the attachment becomes the brand's product/result image
  (pull from `brand-assets/manifest.json`; for a result/app-screenshot hook with no photographic
  asset — or to stay offline and skip fal/NB2 credits — render an HTML-mimic card to PNG per the
  create molecule's Critical knowledge #8, the way the source did; the validation run used an
  Oura-style readiness card), the reveal bubble carries the brand name + CTA code from the brand
  pack or `angle`.
- **End card**: brand's REAL wordmark file (never CSS-faked text — see the create molecule's
  critical-knowledge section), CTA code, one tagline line. Peer persona: new name + monogram +
  avatar color that fits the brand palette.
- **Compliance**: zero source-brand leakage — no source product, name, code, or competitor
  reference may survive anywhere in the thread or end card.

### Phase 1.5 — Approval gate (in-session)
Show the user the drafted conversation as a readable script (sender: text, one per line, plus the
end-card line) and ask them to approve or edit. Persist the draft so the app can see it:
`write_file` → `agent-config/brands/<slug>/projects/<project_id>/working/thread.json`,
`append_project_message { role: "agent", content: <the script> }`, **and mirror it to the project
row so the APP's Review panel shows it**: `update_ad_project_script { project_id, script_drafts:
{ format: "imessage", render_variant, thread, audio: { treatment: "sfx" | "silent" | "bed",
bed_label? }, materials: [...] }, script: <the readable "sender: text" lines + end card> }`.
**Ingredients for the in-app review** — the user reviews on the project page, not in the CLI. An
ingredient with a `path` shows a **real thumbnail / player**; one with `pending: true` shows only a
grey "composed at render time" line. So the images the user asked about are visible ONLY if you
upload them. **Generate the review stills NOW and upload them** — the hook image and end card are
free, local, deterministic renders (no credits, no dependency on the chat recording), so they are
ALWAYS `path` ingredients and **NEVER `pending`**:
- **Hook / attachment image** → the product/result image shown in the attachment bubble.
- **End card** → render the COMPOSED slate now (the create molecule's end-card step is a free local
  Playwright HTML→PNG) so the user reviews the real card — wordmark placement, CTA pill, backdrop.
- The chosen background photo (iphone-frame variant) and music bed, if any.

For each: `get_upload_url` → PUT to `working/review/<name>`, then list it. **Prefer the
container-tagged shape** so the app renders each piece the right way:
`ingredients: [{ container: "image" | "endcard" | "background" | "music", label, subtitle?, path:
"working/review/<name>" }]` (the legacy `materials: [{ kind, label, path }]` still works). Reserve
`pending: true` ONLY for what genuinely cannot exist before the long paid render — the recorded chat
clip and the final mixed audio — as `{ container/kind, label, pending: true, note: "<what gets
generated>" }`. The hook image and end card are NOT in that set. **Do not render until the user says
go** — a render is minutes of their machine time.
If they edit, update thread.json + re-mirror and re-confirm once.

**Draft-only mode (free review):** if the user's instruction says "draft only" / "script only" /
"just the draft", STOP right after the mirror above — no render row, no asset generation, zero
credits spent. Tell the user the draft is now visible on the project page in the app, and that
re-running the prompt (or replying "render it") completes the ad.

### Phase 2 — Render (open the row FIRST, report stages)
Video runs are long, so unlike the static flow the render row opens BEFORE generating:
1. `submit_render { project_id, kind: "full" }` → keep `render_id`.
2. `update_render_status { render_id, status: "running", stage: "script" }` — then keep the
   stage current as you work. The app shows it live; a silent >10 min run shows as stalled:

   | stage | when |
   |---|---|
   | `script` | thread approved, assets being lined up |
   | `assets` | attachment image / end-card wordmark / SFX downloads ready |
   | `record` | Playwright recording the conversation |
   | `assemble` | concat + end card |
   | `mix` | SFX (+ optional bed) mix-master |
   | `export` | 9:16 master + 1:1 variant encode |

3. Follow [`create-imessage-video-ad`](../create-imessage-video-ad/SKILL.md) end-to-end with the
   approved thread.json. **Local translations:**
   - Scaffold a temp working dir (NOT a brand repo folder) in the create molecule's layout:
     `threads/full-thread.json`; `assets/` (attachment image, iphone-frame backdrop, wordmark
     SVG); `audio/` (the create molecule's bundled `imessage-{send,receive}.mp3` + optional bed);
     `clips/` (`record-master.js`, `render-end-card.js`, `end-card.html` → `master-chat.mp4` +
     `master-chat.sfx.json`, `scene-end-endcard.mp4`); `edits/stitch.sh` → `master-final.mp4`;
     `meta-upload/` (the 9:16 + 1:1 exports). Copy the closest reference build and swap.
   - Run the recorder/end-card scripts with the messaging atom's deps on `NODE_PATH`
     (`NODE_PATH=<atom>/node_modules node clips/record-master.js`) — the recorder `require()`s the
     atom's `generate.js` and reuses its Playwright; the recipe folder bundles no `node_modules`.
   - Music bed only if the source had one — generate via the Gooseworks **ElevenLabs proxy**
     (`<apiBase>/api/internal/elevenlabs-proxy` + `?token=`, same pattern as the FAL helper) or
     reuse a stored asset; this bills the user's credits, so skip the bed when the source is
     SFX-only.

**Local render contract.** Rendering is the create molecule's two Node scripts + one stitch script
driving the **`create-imessage-mockup` atom** — that atom (`generate.js` + `templates/`) is the
framed-chat renderer, and it must be present on the machine. It ships with the installed
`ads-remix` master skill (the goose-video local-worker installs it alongside this recipe), **not**
inside the recipe folder. A bare clone of the canonical skills repo currently carries only the
`render-ios-lockscreen` proxy, so do not try to render from one — point the
recorder's atom `require()` + `NODE_PATH` at the installed atom (or the lab atom in a dev loop).
The atom's DOM contract the recorder depends on: `data-anim-id` rows, `data-pending="1"` hide,
`.conversation` scroller, `.keyboard .input` composer, `theme-dark`. The framed branch hard-codes
light mode — inject `theme-dark` after `renderHTML` (create molecule Critical knowledge #10).

### Phase 3 — QC by watching
Run `watch` on the rendered master (or step its frames + audio directly): every
bubble lands in order with its send/receive sound, composer typing is visible before the driven
sends, the attachment is the brand's (not the source's), the end card shows the real wordmark +
code, duration is within ±20% of the source. Fix-and-re-render at most once per issue; then run
the create molecule's own Quality Checks list.

### Phase 4 — Publish (durable URLs, then the links)
1. `get_upload_url` → PUT the master MP4 to
   `agent-config/brands/<slug>/projects/<project_id>/working/final.mp4`
   (`content_type: video/mp4`); grab a poster frame (`ffmpeg -ss 1 -frames:v 1`) and PUT it as
   `working/final-thumb.jpg`.
2. `update_render_status { render_id, status: "complete", output_url:
   "/api/ads/projects/<project_id>/render-file?path=working/final.mp4", thumbnail_url:
   "/api/ads/projects/<project_id>/render-file?path=working/final-thumb.jpg", stage: "export",
   duration_sec: <ffprobe seconds> }` — the render-file path is the DURABLE form; never store a
   CDN or raw S3 URL.
3. One render → done (latest shows by default). Multiple kept versions → `set_final_render` with
   the best `render_id`.
4. End with BOTH links exactly as the master skill requires: `app_url` + `brand_url`, verbatim.

## Decision Rules

- **This skill vs `create-imessage-video-ad`:** remixing a library sample for a brand → this
  skill (it feeds the create molecule). A net-new iMessage ad from a brief with no source sample
  → the create molecule directly.
- **Thread derivation source:** `recipe.thread` when present (normal); else `extracted_script` +
  watching `media_url`. Never invent a structure the source doesn't have.
- **Music bed:** only if the source sample has one. SFX-only sources stay SFX-only (cheaper,
  faster, and the iMessage feel is mostly the SFX).
- **Approval:** always pause at Phase 1.5 on the first render of a project. On an explicit
  re-run where the user already gave thread edits in the same message, apply them and proceed
  without a second pause. **No-review escape:** if the user's instruction says to skip review
  ("no review", "single-shot", "don't ask for approval"), skip the pause entirely — still write
  `working/thread.json` + the `append_project_message` script mirror, then render immediately.
- **Render variant:** honor the source sample's `recipe.render_variant` — a phone-frame source
  remixes as phone-frame, a plain source as plain (the variant is sample DATA, not a separate
  format or molecule). When the source doesn't declare one, default to `iphone-frame`.
- **Batch runs** (the prompt lists several project ids): run Phases 0–1.5 for each first (collect
  all approvals in one message), then render sequentially — Playwright recordings fight for the
  display, and parallel ffmpeg encodes thrash laptop CPUs.

## Output

- `working/thread.json` — the approved brand thread (in the project's Gooseworks folder).
- `working/final.mp4` (9:16 master) + `working/final-thumb.jpg` in the project folder; the 1:1
  export variant uploaded alongside when produced (`working/final-1x1.mp4`).
- A `complete` render row carrying the render-file `output_url`, `thumbnail_url`,
  `duration_sec`, and final `stage`; `set_final_render` pin when >1 version.
- A closing message with the project `app_url` + brand `brand_url`.

## Quality Checks

- Conversation reads like real texting (register, rhythm, lowercase) — not ad copy in bubbles.
- Source structure preserved: beat count/order, typing moments, hook type match the sample.
- Zero source-brand leakage anywhere (bubbles, attachment, end card) — compliance-critical.
- Attachment bubble shows the brand's actual product/result, legible at phone scale.
- End card uses the brand's real wordmark file + correct CTA code; passes the create molecule's
  end-card recipe checks.
- Every send/receive has its Apple SFX; audio mix passes the create molecule's loudness check.
- `duration_sec` reported matches ffprobe; render row carries render-file URLs, not CDN links.

## Failure Modes

- **ffmpeg / Playwright missing** → caught in Phase 0 preflight; user told the install commands
  (`goose-video doctor`); no render row opened.
- **Renderer atom missing** (`Cannot find module '.../create-imessage-mockup/generate.js'`) → the
  framed-chat renderer isn't installed (a bare canonical skills-repo clone ships only the
  `render-ios-lockscreen` proxy). Caught in Phase 0 preflight — point at the atom installed by the
  `ads-remix` master skill (see *Local render contract*) before opening a render row.
- **Sample has no `recipe.thread` and no usable `extracted_script`** → tell the user this sample
  isn't remix-ready yet and stop; do not improvise a structure (the admin needs to fill the
  sample's remix payload).
- **Brand pack lacks a product/result image** → ask the user for one image (or a URL) before the
  approval gate; the hook bubble cannot be generic stock.
- **Render dies mid-run** (Playwright crash, encode failure) → one retry of the failed phase;
  on second failure `update_render_status { status: "failed", error_message }` and report — never
  leave the row `running`.
- **Upload fails** → retry the presigned PUT once; persistent failure → mark the render `failed`
  with the local file path in `error_message` so nothing is lost.

## Tests

See `tests/` — structural smoke, a sample project/sample input pair, the expected artifact list,
a manual end-to-end script, and the verifier checklist.

## Skill Location & Related

- This skill: `skills/ads/composites/remix-imessage-ad-from-sample/`
- Renderer: [`create-imessage-video-ad`](../create-imessage-video-ad/SKILL.md)
- Static counterpart: [`remix-graphic-ad-from-reference`](../remix-graphic-ad-from-reference/SKILL.md)
- Registry entry: `formats.json` → `"imessage"` (the app + CLI route here through it)
