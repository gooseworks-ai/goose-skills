---
name: remix-apple-notes-ad-from-sample
description: Remix a published Apple Notes video ad from the Goose Ads library for a new brand — keep the source's note structure and typing pacing, swap in the brand's product, voice, and promo code, get the note approved in-session, then render with create-apple-notes-video-ad and publish the MP4 back to Gooseworks with live stage reporting. The Apple Notes typing-reveal counterpart to remix-imessage-ad-from-sample; this is what the app's Apple Notes format tab calls.
---

# remix-apple-notes-ad-from-sample

> First end-to-end validated 2026-06-08 (local, no-backend loop): two **Bioma** remixes of
> Apple Notes typing-reveal sources — a "subscriptions to cancel" memo (2 pre-typed lines + 6
> typed paragraphs, 18.97s master) and a "things nobody told me about 45" diary (0 pre-typed + 7
> typed paragraphs, 24.87s master). Both at 1180×2100 native 9:16, one continuous Playwright
> typing recording crossfading (300ms) into a scrapbook end card with the injected brand wordmark
> SVG + product bottle. Per-keystroke iPhone keyboard SFX (`kb-tick`/`kb-space`/`kb-return`) on
> the subscriptions cut, `--no-sfx` calm mix on the diary cut, optional music bed highpassed at
> 60Hz / -11dB on both. The Gooseworks MCP publish steps (Phase 4) were stubbed in that loop;
> everything up to and including `meta-upload/` exports ran clean.

## Purpose

Given **one published Apple Notes ad sample** (from the Goose Ads library) + a **researched
brand**, produce a finished Apple Notes typing-reveal video for that brand. The source sample
defines the *shape* — pre-typed vs typed paragraph counts, typing pace, pre-pauses, end-card
recipe — and this skill swaps the *substance*: the note copy is rewritten in the brand's voice,
the written-out CTA code becomes the brand's, and the end card carries the brand's real wordmark +
CTA code.

This skill is **orchestration**: it derives + gets approval for the note, then hands rendering to
[`create-apple-notes-video-ad`](../create-apple-notes-video-ad/SKILL.md) and handles all
Gooseworks I/O (render rows, stage reporting, durable upload, final pin). Creative craft rules
(per-keystroke SFX, seeded typing rhythm, end-card recipe) live in the create molecule — do not
duplicate or override them here.

It runs on the **user's machine inside their Claude Code session** (the goose-video local-worker
model). The runtime contract — MCP tools, proxies, durable URLs — is the installed `ads-remix`
master skill; this recipe assumes it.

## Inputs

| Input | Required | Notes |
|---|---|---|
| `project_id` | yes (app flow) | A draft Gooseworks ad project with `source_sample_id` + `format_key: "apple-notes"`. The paste-prompt carries it. Without one, `create_ad_project { brand_id, name, source_sample_id, format_key: "apple-notes" }` first. |
| source sample | from project | `get_ad_template { template_id: <source_sample_id or slug> }` → `recipe.note` (the source note.json: `title`, `pre_typed_body`, `typed_body`, `end_card`, optional `music_bed_path`), `extracted_script` (the note's text), `how_to`, `media_url` (watch it if the structure is unclear). |
| brand | yes | Researched brand pack (`research_status: "complete"`); else run the brand-research recipe first. Needs: voice/tone, wordmark/logo, product bottle/hero image (for the end card), CTA code or tagline. |
| `angle` | optional | User-supplied steer ("sell the trial", "code SUMMER20", "make it a memo to self"). Folded into the note draft. |
| machine | yes | `ffmpeg` + Playwright Chromium on the user's machine (preflight below). |

## Composed Atoms

- `create-apple-notes-video-ad` — the renderer (sibling molecule): one continuous Playwright typing recording, per-keystroke iPhone keyboard SFX, scrapbook end card, exports. This skill never re-implements its steps.
- `create-apple-notes-mockup` — the deterministic light-mode Apple Notes renderer (`generate.js` + `templates/`) the create molecule drives character-by-character; the Phase 0 preflight confirms it resolves on the machine.
- `render-ios-keyboard` — supplies the iOS QWERTY keyboard chrome shown during typing; the source note's `keyboard_state` carries forward unchanged.
- `watch` — watch the rendered MP4 (frames + transcript) for the output QC pass.
- `create-music-elevenlabs` — optional music bed, only when the source sample carries one (route through the Gooseworks ElevenLabs proxy locally).
- `mix-master` — bed + per-keystroke SFX mix, invoked via the create molecule's stitch workflow.

## Workflow

### Phase 0 — Fetch + gates (no render row yet)
1. `get_ad_project { project_id }` → keep `source_sample_id`, `app_url`, `brand_url`, `brand_id`.
2. `get_ad_template { template_id: source_sample_id }` → keep `recipe.note`, `extracted_script`,
   `how_to`, `media_url`. If `recipe.note` is missing, reconstruct the structure from
   `extracted_script` (one paragraph per line; treat the first 1–2 lines as `pre_typed_body` and
   the rest as `typed_body`) and `/watch` the `media_url` to confirm the typing pace.
3. Brand gate: `get_ad_brand { brand_id }`.
   - `research_status: "complete"` → **REUSE the existing pack — do NOT re-run research.** Read it
     over MCP: `agent-config/brands/<slug>/brand-research/*.md` (voice, palette, never-say) +
     `brand-assets/manifest.json` (wordmark, product imagery). Re-research is a ~10-minute spend
     the user already paid for; repeating it on a complete brand is a bug, not thoroughness.
   - Not `complete` → run the master skill's "Set up a brand" workflow (idempotent), then continue.
   - Only exception: the status says complete but the pack files are missing/unreadable, or the
     user explicitly asked to refresh the research — say which case applies before re-running.
4. **Machine preflight** (video renders locally — fail fast and friendly):
   `ffmpeg -version` and `npx playwright --version` + a Chromium launch check, **and** confirm the
   renderer atom resolves — `create-apple-notes-video-ad` `require()`s the `create-apple-notes-mockup`
   atom's `generate.js` (the light-mode Notes renderer; see *Local render contract* below). If any
   of the three is missing, tell the user exactly what to install (`brew install ffmpeg`,
   `npx playwright install chromium`) or to run `goose-video doctor`, and STOP — do not open a
   render row that can only fail.

### Phase 1 — Derive the brand's note.json
Map the source note onto the brand. Rules:
- **Keep the source's structure**: same `pre_typed_body` count (the lines visible at t=0), same
  `typed_body` paragraph count (±1), same per-paragraph `type_seconds` / `pre_pause_seconds`
  pacing and `post_hold_seconds`, same end-card recipe (headline shape, 3-item checklist,
  background/ink colors). The structure is *why this ad works* — the hook here is the **note
  itself** (no attachment image, unlike iMessage), so the pacing of the reveal is the whole effect.
- **Swap the substance**: write the note copy in the brand's voice — calm/considered/personal
  monologue or memo-to-self register (lowercase ok, list items as `•` not `—`; the format suits a
  measured voice, not rapid-fire marketing). The written-out CTA code and the reveal line carry the
  brand name + CTA code from the brand pack or `angle`. Smart quotes stay straight in the JSON
  (`'`, `"`) — the atom converts them. Keep `autocorrect_underline` tokens exact-case.
- **End card**: brand's REAL wordmark file (never CSS-faked text — see the create molecule's
  critical-knowledge #0) plus the brand's product bottle/hero image, the CTA code, and the
  scrapbook checklist mapped to the note's payoff. Match `background_color` / `ink_color` to the
  brand palette.
- **Compliance**: zero source-brand leakage — no source product, name, code, or competitor
  reference may survive anywhere in the note text or end card.

### Phase 1.5 — Approval gate (in-session)
Show the user the drafted note as a readable script (title, then each pre-typed and typed
paragraph one per line, plus the end-card line) and ask them to approve or edit. Persist the draft
so the app can see it: `write_file` →
`agent-config/brands/<slug>/projects/<project_id>/working/note.json`,
`append_project_message { role: "agent", content: <the script> }`, **and mirror it to the project
row so the APP's Review panel shows it**: `update_ad_project_script { project_id, script_drafts:
{ format: "apple-notes", note, audio: { treatment: "silent" | "ticks" | "bed", bed_label? },
materials: [...] }, script: <the readable title + paragraph lines + end card> }`.
**Materials for the in-app review** (the user can't see images/clips/audio in the CLI): upload a
copy of every CHOSEN visual/audio input to `working/review/<name>` via `get_upload_url` and list
it as `{ kind: "image" | "video" | "audio", label, path: "working/review/<name>" }` — the brand
wordmark/logo for the end card, any product image, the music bed if one is planned. **Also render
the COMPOSED end card now** (the create molecule's end-card step — a free local HTML→PNG render,
independent of the typing recording) and include it as `{ kind: "image", label: "End card
preview", path: "working/review/end-card.png" }` so the user reviews the actual slate, not just
its ingredients. Assets that will only exist after generation get
`{ kind, label, pending: true, note }` instead. **Do not render until the user says go** — a render is minutes
of their machine time. If they edit, update note.json + re-mirror and re-confirm once.

**Draft-only mode (free review):** if the user's instruction says "draft only" / "script only" /
"just the draft", STOP right after the mirror above — no render row, no asset generation, zero
credits spent. Tell the user the draft is now visible on the project page in the app, and that
re-running the prompt (or replying "render it") completes the ad. **No-review escape:** if the user's instruction says to skip review ("no review",
"single-shot", "don't ask for approval"), skip the pause entirely — still write `working/note.json`
+ the `append_project_message` script mirror, then render immediately.

### Phase 2 — Render (open the row FIRST, report stages)
Video runs are long, so unlike the static flow the render row opens BEFORE generating:
1. `submit_render { project_id, kind: "full" }` → keep `render_id`.
2. `update_render_status { render_id, status: "running", stage: "script" }` — then keep the
   stage current as you work. The app shows it live; a silent >10 min run shows as stalled:

   | stage | when |
   |---|---|
   | `script` | note approved, assets being lined up |
   | `assets` | end-card wordmark / product bottle / keyboard SFX downloads ready |
   | `record` | Playwright recording the typing |
   | `assemble` | crossfade typing → end card |
   | `mix` | per-keystroke SFX (+ optional bed) mix-master |
   | `export` | 9:16 master + social cut encode |

3. Follow [`create-apple-notes-video-ad`](../create-apple-notes-video-ad/SKILL.md) end-to-end with
   the approved note.json. **Local translations:**
   - Scaffold a temp working dir (NOT a brand repo folder) in the create molecule's layout:
     `notes/note.json`; `assets/` (brand-logo SVG, product-bottle PNG); `audio/sfx/`
     (the create molecule's bundled `kb-{tick,space,return}.mp3` + optional `music-bed.mp3`);
     `clips/` (`record-master.js`, `render-end-card.js`, `end-card.template.html` →
     `master-typing.mp4` + `master-typing.sfx.json`, `end-card.mp4`); `edits/stitch.sh` →
     `master-final.mp4`; `meta-upload/` (the 9:16 export). Copy the closest reference build and swap.
   - Run the recorder/end-card scripts with the messaging atom's deps on `NODE_PATH`
     (`NODE_PATH=<atom>/node_modules node clips/record-master.js`) — the recorder `require()`s the
     atom's `generate.js` and reuses its Playwright; the recipe folder bundles no `node_modules`.
   - Music bed only if the source had one (`recipe.note.music_bed_path` present) — generate via the
     Gooseworks **ElevenLabs proxy** (`<apiBase>/api/internal/elevenlabs-proxy` + `?token=`, same
     pattern as the FAL helper) or reuse a stored asset; this bills the user's credits, so skip the
     bed when the source is SFX-only (and pass `--no-sfx` for calm/diary cuts where ticks intrude).

**Local render contract.** Rendering is the create molecule's two Node scripts + one stitch script
driving the **`create-apple-notes-mockup` atom** — that atom (`generate.js` + `templates/`) is the
light-mode Notes renderer, and it must be present on the machine. It ships with the installed
`ads-remix` master skill (the goose-video local-worker installs it alongside this recipe), **not**
inside the recipe folder. The recorder walks up to 8 levels looking for the atom's `generate.js`,
so point its atom `require()` + `NODE_PATH` at the installed atom (or the lab atom in a dev loop).
The atom's DOM contract the recorder depends on: `p.note-paragraph[data-typed-pid]` typed rows,
a growing `span.typed`, the yellow `#FFCC00` cursor, the `.note` scroller, and the iOS keyboard
chrome anchored `bottom: 0` at the shortened `VIEW_H = 2100` canvas. When changing `VIEW_H`, move
all three files together (`record-master.template.js`, `render-end-card.template.js`,
`end-card.template.html`) or the typing↔end-card xfade fails silently (create molecule Critical
knowledge #11).

### Phase 3 — QC by watching
Run `watch` on the rendered master (or step its frames + audio directly): every
character in `typed_body` shows up on screen exactly once with no per-paragraph flicker (the only
cut is the 300ms typing → end-card crossfade), the yellow cursor sits at the end of the
actively-typing paragraph, autocorrect underlines land on the intended exact-case words, the end
card shows the real wordmark + product bottle + code, and duration is within ±20% of the source.
Per-keystroke SFX (when not `--no-sfx`) lands with the visible keystrokes. Fix-and-re-render at most
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

- **This skill vs `create-apple-notes-video-ad`:** remixing a library sample for a brand → this
  skill (it feeds the create molecule). A net-new Apple Notes ad from a brief with no source
  sample → the create molecule directly.
- **Note derivation source:** `recipe.note` when present (normal); else `extracted_script` +
  watching `media_url`. Never invent a structure the source doesn't have.
- **Audio matches the SOURCE sample by default** — watch/probe the source first: a silent (or
  effectively silent) source remixes silent (`--no-sfx`); keyboard ticks only when the source
  audibly carries them or the user asks. **State the planned audio treatment (silent / ticks /
  bed) in the Phase-1.5 approval message** — it's part of what the user approves, never a
  silent decision. If the SFX assets are LFS stubs or unsourceable, ship silent and say so —
  **never fabricate stand-in sounds** (live incident 2026-06-11, Alitu: synthesized noise-burst
  clicks shipped on a calm diary cut).
- **Music bed:** only if the source sample has one (`recipe.note.music_bed_path`). SFX-only
  sources stay SFX-only (cheaper, faster). For calm/diary cuts where keyboard ticks intrude, pass
  the create molecule's `--no-sfx` flag and let the bed carry the audio.
- **Approval:** always pause at Phase 1.5 on the first render of a project. On an explicit re-run
  where the user already gave note edits in the same message, apply them and proceed without a
  second pause. **No-review escape:** if the user's instruction says to skip review ("no review",
  "single-shot", "don't ask for approval"), skip the pause entirely — still write `working/note.json`
  + the `append_project_message` script mirror, then render immediately.
- **Render variant:** Apple Notes has no plain/iphone-frame variant axis — the format is always the
  light-mode Notes screen recorded at the 9:16-native `VIEW_H = 2100` canvas. There is no variant to
  honor from the sample; do not branch on `recipe.render_variant` for this format.
- **Batch runs** (the prompt lists several project ids): run Phases 0–1.5 for each first (collect
  all approvals in one message), then render sequentially — Playwright recordings fight for the
  display, and parallel ffmpeg encodes thrash laptop CPUs.

## Output

- `working/note.json` — the approved brand note (in the project's Gooseworks folder).
- `working/final.mp4` (9:16 master) + `working/final-thumb.jpg` in the project folder; the social
  9:16 export uploaded alongside when produced (`working/final-9x16-1080.mp4`).
- A `complete` render row carrying the render-file `output_url`, `thumbnail_url`,
  `duration_sec`, and final `stage`; `set_final_render` pin when >1 version.
- A closing message with the project `app_url` + brand `brand_url`.

## Quality Checks

- Note reads in the brand's voice — a calm/considered monologue or memo-to-self, not ad copy.
- Source structure preserved: pre-typed vs typed paragraph counts, typing pace, pre-pauses, and
  end-card recipe match the sample.
- Zero source-brand leakage anywhere (note text, end card) — compliance-critical.
- The note itself is the hook; copy is legible at phone scale and the reveal line carries the
  brand name + CTA code.
- End card uses the brand's real wordmark file + product image + correct CTA code; passes the
  create molecule's end-card recipe checks.
- Every character types in once with no per-paragraph flicker; per-keystroke SFX (when enabled)
  lines up with the keystrokes; audio mix passes the create molecule's loudness check.
- `duration_sec` reported matches ffprobe; render row carries render-file URLs, not CDN links.

## Failure Modes

- **ffmpeg / Playwright missing** → caught in Phase 0 preflight; user told the install commands
  (`goose-video doctor`); no render row opened.
- **Renderer atom missing** (`cannot locate create-apple-notes-mockup/generate.js`) → the
  light-mode Notes renderer isn't installed/reachable within 8 levels of the working dir. Caught in
  Phase 0 preflight — point at the atom installed by the `ads-remix` master skill (see *Local
  render contract*) before opening a render row.
- **Sample has no `recipe.note` and no usable `extracted_script`** → tell the user this sample
  isn't remix-ready yet and stop; do not improvise a structure (the admin needs to fill the
  sample's remix payload).
- **Brand pack lacks a wordmark or product image** → ask the user for the official SVG + a product
  bottle/hero (or a URL) before the approval gate; the end card cannot be CSS-styled lookalike text
  or a generic stock photo.
- **Render dies mid-run** (Playwright crash, encode failure) → one retry of the failed phase;
  on second failure `update_render_status { status: "failed", error_message }` and report — never
  leave the row `running`.
- **Upload fails** → retry the presigned PUT once; persistent failure → mark the render `failed`
  with the local file path in `error_message` so nothing is lost.

## Tests

See `tests/` — structural smoke, a sample project/sample input pair, the expected artifact list,
a manual end-to-end script, and the verifier checklist.

## Skill Location & Related

- This skill: `skills/ads/packs/video-ad-formats/remix-apple-notes-ad-from-sample/`
- Renderer: [`create-apple-notes-video-ad`](../create-apple-notes-video-ad/SKILL.md)
- Note renderer atom: [`create-apple-notes-mockup`](../../atoms/messaging/create-apple-notes-mockup/SKILL.md)
- iMessage counterpart: [`remix-imessage-ad-from-sample`](../remix-imessage-ad-from-sample/SKILL.md)
- Registry entry: `formats.json` → `"apple-notes"` (the app + CLI route here through it)
