---
name: render-imessage-chat
description: Render a configurable iMessage conversation inside a properly framed phone, then a brand end card. Uses the original send/receive sounds and a shared frame timeline for text, typing, scrolling and sound. Free local Playwright + ffmpeg assembly; optional image/music generation belongs to separate gated capabilities.
status: active
---

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

Preview produces `chat.html` and `chat-preview.png`; the HTML exposes
`window.__renderAt(seconds)` for frame inspection. Full render keeps those,
`master-chat.mp4`, `.timeline.json`, `.sfx.json`, the end-card HTML/PNG/MP4 and
the finished master. `check-render.py` verifies dimensions, audio stream,
frame count and complete ending. Review the ACTUAL master after every repair;
these technical checks do not establish creative acceptance.

Individual `record-chat.js`, `render-end-card.js` and `stitch.sh` commands remain
available. `render.sh` produces the 1080×1920 recipe master. The chat recorder
also supports even preview dimensions; the phone must fit with a margin.

## Config contract

- Inline `thread` or `thread_path`. Relative files resolve against config.json.
- Unique message IDs and valid `from` participants. Types: text, typing, timestamp,
  attachment. Typing immediately precedes a received text/attachment from the same
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

Run `node --test tests/test_chat.js` and `python3 -m pytest tests/test_stitch.py`.
Browser tests cover changing names/time/background, text-only chats, attachment
placement, blank-name rejection, inset hardware, dark/light chrome, group labels
after typing, Unicode composer text and long threads. Audio tests cover
fetched-package delivery and limited overlapping cues.

Fix the configuration error and rerender locally. UI defects never justify paid
generation. Watch the final for the selected name, readable bubbles, smooth scroll,
correct sender labels and sounds, complete last message and correct brand end card.
Use `review-finished-ad` for brand/copy review when called by the recipe.
