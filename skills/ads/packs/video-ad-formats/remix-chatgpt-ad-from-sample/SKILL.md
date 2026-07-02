---
name: remix-chatgpt-ad-from-sample
description: Remix a published ChatGPT video ad from the Goose Ads library for a new brand — keep the source's conversation structure and pacing (the single ask → streamed answer beat), swap in the brand's product as the natural recommendation and the promo code woven into the response, get the conversation approved in-session, then render with create-chatgpt-video-ad and publish the MP4 back to Gooseworks with live stage reporting. The ChatGPT chat-reveal / ask-ChatGPT counterpart to remix-imessage-ad-from-sample; this is what the app's ChatGPT format tab calls.
---

# remix-chatgpt-ad-from-sample

> First end-to-end validated 2026-06-11 (local, no-backend loop): a **Bioma-style
> perimenopause** remix of a single-question ChatGPT source — 750×1624 record (tagged 9:16),
> 3-message conversation (one user question → one loading dot → one streamed assistant answer),
> education-only response that lands the brand as the natural recommendation, no end card. ~14s
> master (3.2s typing + ~0.6s send/dot + ~9s streamed answer + 1s hold), **silent by default**
> (empty SFX cue list, stitch stream-copies the video). The Gooseworks MCP publish steps (Phase 4)
> were stubbed in that loop; everything up to and including `meta-upload/` exports ran clean.

## Purpose

Given **one published ChatGPT ad sample** (from the Goose Ads library) + a **researched brand**,
produce a finished ChatGPT chat-reveal video for that brand. The source sample defines the
*shape* — the single user question → one loading dot → one streamed assistant response, the
response length and streaming pace — and this skill swaps the *substance*: the question is
rewritten as something a real person would ask ChatGPT in the brand's world, and the streamed
answer is rewritten so the BRAND surfaces as the natural recommendation, with the CTA woven into
the response. The punchline is the **streamed response**.

This skill is **orchestration**: it derives + gets approval for the conversation, then hands
rendering to [`create-chatgpt-video-ad`](../create-chatgpt-video-ad/SKILL.md) and handles all
Gooseworks I/O (render rows, stage reporting, durable upload, final pin). Creative craft rules
(word streaming, the one-frame send-tap, the single loading dot, SFX policy) live in the create
molecule — do not duplicate or override them here.

It runs on the **user's machine inside their Claude Code session** (the goose-video local-worker
model). The runtime contract — MCP tools, proxies, durable URLs — is the installed `ads-remix`
master skill; this recipe assumes it.

## Inputs

| Input | Required | Notes |
|---|---|---|
| `project_id` | yes (app flow) | A draft Gooseworks ad project with `source_sample_id` + `format_key: "chatgpt"`. The paste-prompt carries it. Without one, `create_ad_project { brand_id, name, source_sample_id, format_key: "chatgpt" }` first. |
| source sample | from project | `get_ad_template { template_id: <source_sample_id or slug> }` → `recipe.conversation` (the source thread JSON: header, keyboard, the user question / loading dot / streamed assistant message), `extracted_script` (the question + the answer), `how_to`, `media_url` (watch it if the structure is unclear). |
| brand | yes | Researched brand pack (`research_status: "complete"`); else run the brand-research recipe first. Needs: voice/tone, the product/category the answer should recommend, CTA code or tagline to weave into the response. |
| `angle` | optional | User-supplied steer ("ask about bloating", "code SUMMER20", "make the question late-night"). Folded into the conversation draft. |
| machine | yes | `ffmpeg` + Playwright Chromium on the user's machine (preflight below). |

## Composed Atoms

- `create-chatgpt-video-ad` — the renderer (sibling molecule): continuous Playwright recording of the typing + send-tap + streamed response, the subliminal/silent SFX policy, 9:16 + 1×1 exports. This skill never re-implements its steps. (`skills/ads/packs/video-ad-formats/create-chatgpt-video-ad`)
- `create-chatgpt-mockup` — the framed-chat renderer the create molecule drives: `renderHTML(thread)` builds the light-mode ChatGPT iOS HTML with every message `popState: "pending"`, the word-stream wrapper, and the inlined keyboard. This must be present on the machine. (`create-chatgpt-mockup`)
- `render-ios-keyboard` — the iOS QWERTY keyboard fragment (suggestion bar + alpha/shift/backspace/123/space/return rows) slid up on `keyboard-show` / down at the send-tap; the chatgpt-mockup atom inlines this same `.kbd` block. (`render-ios-keyboard`)
- `watch` — watch the rendered MP4 (frames + transcript) for the output QC pass.
- `mix-master` — the near-noop mix stage (the format is silent by default; only an optional subliminal SFX pass routes through here), invoked via the create molecule's workflow.

## Workflow

### Phase 0 — Fetch + gates (no render row yet)
1. `get_ad_project { project_id }` → keep `source_sample_id`, `app_url`, `brand_url`, `brand_id`.
2. `get_ad_template { template_id: source_sample_id }` → keep `recipe.conversation`,
   `extracted_script`, `how_to`, `media_url`. If `recipe.conversation` is missing, reconstruct the
   beat from `extracted_script` (the user question line + the assistant answer) and `/watch` the
   `media_url` to confirm the streaming pace.
3. Brand gate: `get_ad_brand { brand_id }`.
   - `research_status: "complete"` → **REUSE the existing pack — do NOT re-run research.** Read it
     over MCP: `agent-config/brands/<slug>/brand-research/*.md` (voice, palette, never-say) +
     `brand-assets/manifest.json` (product/category, wordmark, CTA code). Re-research is a
     ~10-minute spend the user already paid for; repeating it on a complete brand is a bug, not
     thoroughness.
   - Not `complete` → run the master skill's "Set up a brand" workflow (idempotent), then continue.
   - Only exception: the status says complete but the pack files are missing/unreadable, or the
     user explicitly asked to refresh the research — say which case applies before re-running.
4. **Machine preflight** (video renders locally — fail fast and friendly):
   `ffmpeg -version` and `npx playwright --version` + a Chromium launch check, **and** confirm the
   renderer atom resolves — `create-chatgpt-video-ad` `require()`s the `create-chatgpt-mockup`
   atom's `generate.js` (the framed-chat renderer; see *Local render contract* below). If any of
   the three is missing, tell the user exactly what to install (`brew install ffmpeg`,
   `npx playwright install chromium`) or to run `goose-video doctor`, and STOP — do not open a
   render row that can only fail.

### Phase 1 — Derive the brand's conversation
Map the source conversation onto the brand. Rules:
- **Keep the source's structure**: the single user question → one loading dot → one streamed
  assistant response beat, the same response length and streaming pacing, the same `header`
  (`plain-title` "ChatGPT", `rightIcons` → `rightIconsAlt`), `keyboard`, and `composer`. The
  structure is *why this ad works* — one ask, one streamed answer, the answer is the punch.
- **Swap the substance into the BRAND's world**: the user question is something a real person
  would actually type into ChatGPT (8–12 words, lowercase ok, a contraction, no marketing tone),
  and the streamed assistant answer is rewritten as an education-first response where the BRAND
  surfaces as the *natural recommendation* — lead with validation, then the why, then 2–3 short
  bullets that map to the brand's USP, with the CTA (code or tagline) woven into the response.
  Set `stream: true` on the assistant message so its words wrap for the reveal.
- **No end card**: this format has none by default — the answer carries the whole brand load.
  Surface the brand inside the streamed response (the natural recommendation + CTA), not on a slate.
- **Compliance**: zero source-brand leakage — no source product, name, code, or competitor
  reference may survive anywhere in the question or the response.

### Phase 1.5 — Approval gate (in-session)
Show the user the drafted conversation as a readable script (the user question, then the assistant
answer, formatted as it streams) and ask them to approve or edit. Persist the draft so the app can
see it: `write_file` →
`agent-config/brands/<slug>/projects/<project_id>/working/conversation.json`,
`append_project_message { role: "agent", content: <the script> }`, **and mirror it to the project
row so the APP's Review panel shows it**: `update_ad_project_script { project_id, script_drafts:
{ format: "chatgpt", conversation, audio: { treatment: "silent" | "sfx" }, materials: [...] },
script: <the readable question + answer text> }`.
**Ingredients for the in-app review** — the user reviews on the project page, not in the CLI. A
`path` ingredient shows a **real thumbnail / player**; a `pending: true` one shows only a grey
placeholder line. This format is usually pure UI, so list whatever visual inputs ARE chosen (an
avatar, an attachment image, an end card if the template has one) as `{ container: "image" |
"endcard", label, path: "working/review/<name>" }` (legacy `{ kind, label, path }` still works)
after `get_upload_url` → PUT to `working/review/`; render any composed end card now so it previews
as a real image, **never `pending`**. Omit ingredients entirely when there truly are none. **Do not
render until the user says go** — a render is minutes of their machine time. If they edit, update
conversation.json + re-mirror and re-confirm once.

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
   | `script` | conversation approved, assets being lined up |
   | `assets` | keyboard/streaming HTML + (optional) SFX downloads ready |
   | `record` | Playwright recording the typing + send-tap + streamed response |
   | `assemble` | concat / mux of the continuous chat recording |
   | `mix` | **near-noop — silent by default** (the create molecule ships an empty SFX cue list and stitch stream-copies the video; only an optional subliminal SFX pass touches audio here) |
   | `export` | 9:16 master + 1:1 variant encode (tagged 9:16, recorded 750×1624) |

3. Follow [`create-chatgpt-video-ad`](../create-chatgpt-video-ad/SKILL.md) end-to-end with the
   approved conversation. **Local translations:**
   - Scaffold a temp working dir (NOT a brand repo folder) in the create molecule's layout:
     `thread.json` + `timeline.json` at the run root (the recorder reads them from the root, not
     `working/`); `clips/` (`record-master.js` → `master-chat.mp4` + `master-chat.sfx.json`);
     `edits/stitch.sh` → `master-final.mp4`; `meta-upload/` (the 9:16 + 1:1 exports). Copy the
     closest reference build and swap.
   - Run the recorder with the messaging atom's deps on `NODE_PATH`
     (`NODE_PATH=<atom>/node_modules node clips/record-master.js`) — the recorder `require()`s the
     atom's `generate.js` and reuses its Playwright; the recipe folder bundles no `node_modules`.
   - **Audio: silent by default.** No Apple chime, no music bed, no end card. The create molecule
     emits `{"cues": []}` and stitch stream-copies the video, so the `mix` stage is a near-noop —
     only opt into the bundled subliminal SFX (key-tap −28dB / send-tap −20dB / stream-tick −32dB /
     response-done −22dB) at the create molecule's pre-normalized levels if the brief explicitly
     asks. Do not add a bed or an end card.

**Local render contract.** Rendering is the create molecule's record script + one stitch script
driving the **`create-chatgpt-mockup` atom** — that atom (`generate.js` + `templates/`) is the
framed-chat renderer, and it must be present on the machine. It ships with the installed
`ads-remix` master skill (the goose-video local-worker installs it alongside this recipe), **not**
inside the recipe folder. A bare clone of the canonical skills repo currently carries only the
`atoms/messaging/render-ios-lockscreen` proxy, so do not try to render from one — point the
recorder's atom `require()` + `NODE_PATH` at the installed atom (or the lab atom in a dev loop).
The atom's DOM contract the recorder depends on: `data-pending` rows the timeline pops, the
`.conversation` scroller, the inlined `.kbd` keyboard slid by `data-state`, `.word[data-stream]`
spans for the streamed reveal (set `stream: true` on the assistant message), and light mode
(this atom renders light mode only — do not inject a dark theme).

### Phase 3 — QC by watching
Run `watch` on the rendered master (or step its frames + audio directly): the keyboard
is up the whole time the user types and slides down on the send-tap beat, the send-tap is one beat
(bubble pop + keyboard-down + header right-cluster swap on the same frame), exactly one gray
loading dot holds ~500ms (not three), the response streams word-by-word with the soft opacity ramp
and auto-scrolls to stay in view, the brand surfaces inside the answer as the natural recommendation
(not the source's), no OpenAI spiral appears above any assistant title, the track is silent (or
subliminal if you opted in), and duration is within ±20% of the source. Fix-and-re-render at most
once per issue; then run the create molecule's own Quality Checks list.

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

- **This skill vs `create-chatgpt-video-ad`:** remixing a library sample for a brand → this
  skill (it feeds the create molecule). A net-new ChatGPT ad from a brief with no source sample
  → the create molecule directly.
- **Conversation derivation source:** `recipe.conversation` when present (normal); else
  `extracted_script` + watching `media_url`. Never invent a structure the source doesn't have.
- **Audio:** silent by default — no Apple chime, no music bed, no end card. Only opt into the
  create molecule's subliminal SFX pass (the four bundled wavs at their pre-normalized levels) when
  the brief explicitly asks; the `mix` stage is otherwise a near-noop (stitch stream-copies).
- **Render variant:** ChatGPT has **no plain/iphone-frame variant axis** — the format always
  records at 750×1624 and is tagged/exported 9:16. Ignore any `recipe.render_variant` on a ChatGPT
  sample; it does not apply here (that axis is iMessage-only).
- **Approval:** always pause at Phase 1.5 on the first render of a project. On an explicit
  re-run where the user already gave conversation edits in the same message, apply them and proceed
  without a second pause. **No-review escape:** if the user's instruction says to skip review
  ("no review", "single-shot", "don't ask for approval"), skip the pause entirely — still write
  `working/conversation.json` + the `append_project_message` script mirror, then render immediately.
- **Batch runs** (the prompt lists several project ids): run Phases 0–1.5 for each first (collect
  all approvals in one message), then render sequentially — Playwright recordings fight for the
  display, and parallel ffmpeg encodes thrash laptop CPUs.

## Output

- `working/conversation.json` — the approved brand conversation (in the project's Gooseworks
  folder): header + keyboard + the user question / loading dot / streamed assistant answer.
- `working/final.mp4` (9:16 master) + `working/final-thumb.jpg` in the project folder; the 1:1
  export variant uploaded alongside when produced (`working/final-1x1.mp4`).
- A `complete` render row carrying the render-file `output_url`, `thumbnail_url`,
  `duration_sec`, and final `stage`; `set_final_render` pin when >1 version.
- A closing message with the project `app_url` + brand `brand_url`.

## Quality Checks

- The user question reads like a real person typing into ChatGPT (8–12 words, lowercase ok, a
  contraction) — not ad copy.
- Source structure preserved: the single ask → one loading dot → one streamed answer beat, the
  response length/pacing match the sample.
- The brand surfaces inside the streamed answer as the natural recommendation, with the CTA woven
  in — never on an end card (there is none).
- Zero source-brand leakage anywhere (question, response) — compliance-critical.
- Send-tap is one beat (bubble pop + keyboard-down + header right-cluster swap), exactly one gray
  loading dot (~500ms), response streams word-by-word with auto-scroll; passes the create
  molecule's checks.
- Track is **silent** by default (`{"cues": []}`, stitch stream-copies) — or every cue sits at the
  bundled subliminal level if the optional SFX pass was used; no cue on the loading dot.
- Recorded 750×1624 and the SHIPPED file preserves that exact ratio — native, or an aspect-true
  upscale like 1080×2338 (`scale=1080:-2`). A 1080×1920 export is a horizontal stretch (live
  incident 2026-06-11, Alitu) — ffprobe the PUBLISHED file, not just the master. Tagged 9:16;
  `duration_sec` reported matches ffprobe; render row carries render-file URLs, not CDN links.

## Failure Modes

- **ffmpeg / Playwright missing** → caught in Phase 0 preflight; user told the install commands
  (`goose-video doctor`); no render row opened.
- **Renderer atom missing** (`Cannot find module '.../create-chatgpt-mockup/generate.js'`) → the
  framed-chat renderer isn't installed (a bare canonical skills-repo clone ships only the
  `render-ios-lockscreen` proxy). Caught in Phase 0 preflight — point at the atom installed by the
  `ads-remix` master skill (see *Local render contract*) before opening a render row.
- **Sample has no `recipe.conversation` and no usable `extracted_script`** → tell the user this
  sample isn't remix-ready yet and stop; do not improvise a structure (the admin needs to fill the
  sample's remix payload).
- **Assistant text appears all at once / not streaming** → `stream: true` is missing on the
  assistant message; set it so the atom wraps every word in a `.word[data-stream]` span.
- **Render dies mid-run** (Playwright crash, encode failure) → one retry of the failed phase;
  on second failure `update_render_status { status: "failed", error_message }` and report — never
  leave the row `running`.
- **Upload fails** → retry the presigned PUT once; persistent failure → mark the render `failed`
  with the local file path in `error_message` so nothing is lost.

## Tests

See `tests/` — structural smoke, a sample project/sample input pair, the expected artifact list,
a manual end-to-end script, and the verifier checklist.

## Skill Location & Related

- This skill: `skills/ads/packs/video-ad-formats/remix-chatgpt-ad-from-sample/`
- Renderer: [`create-chatgpt-video-ad`](../create-chatgpt-video-ad/SKILL.md)
- iMessage sibling: [`remix-imessage-ad-from-sample`](../remix-imessage-ad-from-sample/SKILL.md)
- Registry entry: `formats.json` → `"chatgpt"` (the app + CLI route here through it)
