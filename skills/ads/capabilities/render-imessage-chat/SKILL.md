---
name: render-imessage-chat
description: Render a configurable iMessage conversation inside a properly framed phone, then a brand end card. Uses the original send/receive sounds and a shared frame timeline for text, typing, scrolling and sound. Free local Playwright + ffmpeg assembly; optional image/music generation belongs to separate gated capabilities.
status: superseded
version: "2.0.1"
updated: 2026-10-06
superseded_by: phone-chat@1.1.4
---

> **Superseded:** the video kit now does this with the phone-chat part, version 1.1.4, in the parts folder of this repository. Every phone-chat style is a style file that draws the same screen frame by frame from the plan's scenes, with the original sounds, in the kit's browser. This atom stays, unchanged in behaviour, for skills outside the kit until they move; its scripts still run.

# Human version

Make a texting-story ad with the chosen contact names and phone time, a
proportional phone, an inset Dynamic Island and the original iMessage sounds.
The brand, story and background can change. Images are optional and can appear
anywhere in the conversation; product links and music are optional too.

This rebuild preserves the shell and sounds from the approved Clinikally Goa
build. It fixes missing identity binding, the island touching the screen edge,
light-mode header colors, early/missing group names and capture timing drift.
Every movie frame and sound cue uses the same timeline; browser startup cannot
trim the beginning or ending. No paid API is needed to render or repair the UI.

On a 9:16 canvas the phone now sits clear of the TikTok/Reels controls by
default: the newest message, including the punchline, always stays above the
bottom caption band and left of the button rail (`safe_area`).

---

# Agent version

Read [the reference and authoring rules](references/imessage-reference.md).
The calling recipe supplies NEW names, copy, brand facts and real assets.
`scripts/config.example.json` is a fictional, runnable example, never defaults.

## Choices and bindings

- Relationship, contact names and group title → `thread.participants`, `thread.title`.
- Displayed phone time → `thread.clock`, preserving the user's chosen text.
- Story, tone and language → `thread.messages`. Casual spelling and emojis are allowed.
- Chat images → zero or more `attachment` entries at their authored positions in
  `thread.messages`; either participant may send them. Never reorder by type.
- Theme → `theme: "dark" | "light"`.
- Background → optional local `background_image`; neutral when absent.
- Hardware → `dynamic_island: true | false`; true floats inside the screen.
- Music → optional existing bed passed to `render.sh --music`; no bed means SFX only.

Exactly one participant is `self:true`. A DM has two participants; its header
reads the other participant's `name` and derives the first initial unless supplied.
A group requires a title and named contacts. Missing names fail before capture.
There is no demo-name fallback. Changing the config changes the visible name.
When a name changes, update any derived initials too. Keep explicit user-supplied
initials only when they still match the requested identity.

## Run

Requires Node 18+, Python 3, ffmpeg with libx264, ffprobe and Playwright Chromium.
Install dependencies in the fetched **scripts folder**, then launch/close that
script's own Chromium before any optional paid image/music call. Preserve its
cwd, NODE_PATH and PLAYWRIGHT_BROWSERS_PATH. `gooseworks doctor --renderer-script
"/absolute/path/scripts/record-chat.js"` can check that runtime. If unavailable,
use a bounded free `createRequire(actualScript)` launch/close probe (15-second
launch timeout, 20-second whole-process limit). Cache presence alone is not proof.

```bash
cd scripts
npm ci
# Install Chromium only if the free launch probe says it is missing:
# npx playwright install chromium
node record-chat.js --config /absolute/path/config.json --out-dir /absolute/path/working/preview --preview-only
bash render.sh --config /absolute/path/config.json --out /absolute/path/finals/master-final.mp4
# Optional: append --music /absolute/path/bed.mp3
```

Preview produces `chat.html`, `chat-preview.png` and
`master-chat.safe-area.json`; the HTML exposes `window.__renderAt(seconds)` and
`window.__safeAreaReport()` (canvas-pixel boxes of the newest row and any
`data-safe-keep` sheet or dialog) for frame inspection. Full render keeps those,
`master-chat.mp4`, `.timeline.json`, `.sfx.json`, the end-card HTML/PNG/MP4 and
the finished master. The recorder checks the safe area on every output frame and
fails on a violation. `check-render.py` verifies dimensions, audio stream,
frame count, complete ending and the safe-area report;
`python3 scripts/check-render.py --safe-area <work>/master-chat.safe-area.json`
checks a preview alone. Review the ACTUAL master after every repair;
these technical checks do not establish creative acceptance.

Individual `record-chat.js`, `render-end-card.js` and `stitch.sh` commands remain
available. `render.sh` produces the 1080×1920 recipe master. The chat recorder
also supports even preview dimensions; the phone must fit with a margin.

## Config contract

- Inline `thread` or `thread_path`. Relative files resolve against config.json.
- Unique message IDs and valid `from` participants. Types: text, typing, timestamp,
  attachment, tapback. Reactions target an earlier message ID and carry an emoji. Typing immediately precedes a received text/attachment from the same
  person. Self messages type in the composer, including complete emoji graphemes.
- Short messages read best. Longer words wrap; real overflow fails preflight.
- Optional attachment: `src` local image/data URI, `presentation:"photo"` for a
  photo or `"rich-link"` for image + flush meta card + title/domain/chevron.
  Optional `dwell_sec` overrides its default 3.6-second reading hold.
  Text-only chats need no images. One or several attachments can come first,
  between any messages or last; preserve the user's placement and sender.
  Never require an opening photo or a product image at a fixed beat.
- Optional `thread.clock` sets the displayed status-bar time, such as `10:24` or
  `18:07`. Bind the chosen time; do not replace it with a demo time. Only when
  absent does the shell use its neutral `9:41` fallback. In-chat timestamp labels
  are separate message inputs, not a required fixed timestamp.
- End card: approved `image_path`, or real `logo_svg_path`, `logo_image_path`,
  inline `logo_svg` or `wordmark_text`, brand colors, CTA and optional benefits.
  `stars` defaults to **0**. Ratings require approved `proof_text`.
  An artwork path replaces the complete template; check its copy and CTA first.
- Default outer canvas 1080×1920; zoom fits the 393×852 phone proportionally.
  Excess zoom fails rather than cropping the phone. `timing` can override the
  named pacing fields in record-chat.js; ending hold must be at least 0.5 seconds.
- `safe_area` keeps the conversation clear of the platform controls (QA-60).
  Omitted: **on** for 9:16 canvases, off for other shapes. `true` uses the
  review-finished-ad bands (top 220, bottom 400, right 140, left 0 px at
  1080×1920, scaled to the canvas). An object such as `{"bottom":480}` overrides
  single bands in output pixels; omitted keys keep the defaults. `false` restores
  the old centred full-height phone exactly.
- With `safe_area` on, the phone is the largest proportional size whose
  conversation viewport sits inside the zone (an 8 px inset) while the phone
  stays in the middle of the canvas. At 1080×1920 that is zoom about 1.648 with
  258 px above and below the phone. `phone_fit: "largest"` gives the biggest
  safe phone instead (zoom about 1.97), which has to sit 16 px from the top with
  a wide gap under it. Every row is clipped to that viewport,
  so the newest row is safe on every frame. The composer, home bar and group
  avatars may sit in the bands; typed text reappears as the newest row.
- An explicit `zoom` is a ceiling while `safe_area` is on: kept when safe,
  otherwise lowered to the safe maximum with a log line (the recipe seed
  `zoom: 2.1` becomes about 1.648). Set `safe_area:false` to keep it exactly.
- The framed phone draws the home indicator, with the 34 px strip iOS keeps
  under the composer for it.
- `timing.tail_hold` (default 2 s) is how long the finished thread holds before
  the end card. With the gap that follows the last message, the last line is on
  screen about 2.7 s; at 1 s a nine-word punchline had 1.7 s.

## Original sound contract

The send/receive MP3s are byte-identical to both archived Clinikally and Wonderbly
builds. Keep them. No substitute ringtone, notification-cascade sound or generated
pop. One cue per real text/attachment; none for typing or composer keystrokes.
Picture reveals and cues share fixed output-frame times; the audible onset follows
the first visible reveal frame. The mixer strips leading silence and limits peaks.

Full checkouts use `assets/sfx`. Text-only catalog packages use the hash-checked
`scripts/sfx-embedded.json` fallback. Keep that file byte for byte. `--sfx-dir`
can override the source explicitly. Missing, silent, corrupt or LFS-pointer audio
stops the render. After an intentional MP3 replacement, regenerate the embedded
copy with `python3 tests/test_stitch.py --write-embedded`.

## Verification and failures

Run `node --test tests/test_chat.js`, `node --test tests/test_safe_area.js` and
`python3 -m pytest tests/test_stitch.py`. Run one test file at a time; each test
opens and closes one Chromium.
Browser tests cover changing names/time/background, text-only chats, attachment
placement, blank-name rejection, inset hardware, dark/light chrome, group labels
after typing, Unicode composer text and long threads. `test_safe_area.js` walks
every frame of `tests/fixtures/long-group-thread.json` (16-message group thread,
wrapped punchline) and asserts the newest row stays above y 1520 and left of
x 940, that a bottom sheet in the band fails, and that `safe_area:false` keeps
the old layout. CI runs both browser files. Audio tests cover
fetched-package delivery and limited overlapping cues.

Fix the configuration error and rerender locally. UI defects never justify paid
generation. Watch the final for the selected name, readable bubbles, smooth scroll,
correct sender labels and sounds, complete last message and correct brand end card.
Use `review-finished-ad` for brand/copy review when called by the recipe.

## Critical knowledge

The current renderer combines the fixed-frame repair with the lessons from the live-capture audit. Read [[references::references/imessage-reference.md]] before authoring.

1. Browser startup and CPU load must never change movie time. Fixed output frames replace capture-clock guesses, sync curtains and picture-snapping retries.
2. Measure each sound's audible onset. The original send file includes lead-in; trim silence before placing it on the visible reveal frame.
3. Keep the original receive chime. Shorten it only when another message follows quickly, so its second note cannot mask that next message.
4. Check the text Range against the bubble bounds. Bubble tails intentionally extend beyond the box.
5. Use Apple emoji assets for recordings on hosts whose native emoji differ. Cache and inline them before capture; keep complete Unicode graphemes while typing.
6. Scratch directory templates must work on macOS and GNU systems.
7. Start short conversations under the header. Keep the input fixed at the bottom and scroll only the conversation.
8. Picture and sounds share output-frame time. Reactions use that same timeline and must target an earlier real message.
9. Do not zoom into a link as if a camera were moving across the phone screen.
10. Editorial endings use the brand's own fonts, headlines, benefits, URL and footnote. Approved complete artwork can replace the template.
11. Show Delivered only beneath the newest sent text or attachment.
12. Typed text must equal sent text. The deterministic composer completes before sending and wraps long lines.
13. Download and inline requested end-card fonts before capture. A missing font fails the render instead of silently changing the brand.
14. Read approved brand colours from the brand kit or site styling. Preserve the selected background and contact names.
15. Keep the quieter audit mix with the existing peak limiter. Unsupported ratings remain absent unless approved proof is supplied.
16. Inspect the actual encoded ending and sound alignment. Frame counts and a passing stream probe do not establish creative acceptance.
17. Keep the newest message out of the platform controls (QA-60). A full-height phone put the punchline under the TikTok/Reels caption band. Fit the conversation viewport, not the whole phone, into the safe zone: the phone stays large and native. A future skin with bottom sheets must extend `PHONE.keep` to the screen bottom and mark sheets `data-safe-keep`.
