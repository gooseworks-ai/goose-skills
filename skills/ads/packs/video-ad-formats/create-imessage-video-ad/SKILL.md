---
name: create-imessage-video-ad
description: Produce a 9:16 social-native ad that recreates an iMessage conversation reveal — bubbles pop in over time, composer types char-by-char, real Apple iMessage SFX hit on every send/receive, music bed underneath, brand end card with FREEPACK-style CTA. One continuous Playwright recording (no scene-cuts/glitches) in plain-chat or iPhone-framed (Dynamic Island over a background) variants, assembled to a master MP4 plus 9:16 / 1×1 export variants.
---

# create-imessage-video-ad

> Built from these proven iMessage builds: `the Clinikally build` (newest), `the Catchback Cards build`, and `the Peloton build`. Adapt paths to your project.

## Purpose

Use this skill when an ad concept calls for an authentic iMessage thread reveal: someone screenshots a product/result, sends it to a friend, the friend reacts and asks what app/service it is, and the conversation surfaces the brand + a CTA code. Produces a 9:16 social-native ad with real Apple iMessage SFX, optional music bed, and brand end card — one continuous Playwright recording assembled into a master MP4 plus 9:16 / 1×1 variants.

## Reference builds

Three reference builds — copy the closest one as your starting point:

- `the Clinikally build` — **NEWEST; default starting point.** iPhone-frame variant (Variant B: framed phone + Dynamic Island over a brand-relevant background photo), dark theme, **native 1080×1920 recording**, full composer drives on every sent bubble, NB2-generated hook/background/end-card-base assets, reference-styled end card. Friend-asks-friend inverse angle. 21.2s.
- `the Catchback Cards build` — **abstract-glow end card**, gray peer avatar, product-flex hook (screenshot of a graded card with a price). 20.6s. Playful brand voice. Plain-chat variant.
- `the Peloton build` — **photo-background end card** with real Peloton wordmark, indigo peer avatar, result-flex hook (Strava finish-line summary rendered locally as HTML→PNG). 19.0s. Grounded brand voice. Plain-chat variant.

## When to use

- Reaction/discovery ads where the punchline is the *recipient's* curiosity ("what app is that?", "wait this is real?")
- Promo-code reveals (FREEPACK / FIRSTPACK / WELCOME10) — the conversational delivery feels far less ad-like than a hard CTA card alone
- Any time the brief mentions "fake DM", "screenshot of a chat", "iMessage style", "Tyler/peer"

If the chat is just one beat (a single screenshot), reach for the atom `create-imessage-mockup` directly. Use *this* molecule only when you need a **multi-bubble timeline animated to video**.

## Composed Atoms

- `create-imessage-mockup` — renders the iMessage HTML (plain or `with-iphone-frame` mode); this skill drives it via Playwright
- `stitch-videos-ffmpeg` — final concat + crossfade
- `scripts/fal_helpers.py` — (optional) NB2 (`fal-ai/nano-banana-2`) generation of photographic hook / background / end-card-base assets, Clinikally-style
- (optional) ElevenLabs music generation OR a music asset already in the repo (search `**/music*.mp3`)

## Inputs

1. **`brief`** (required) — what the ad is selling, the CTA code, the peer's name (e.g. "Tyler"), the screenshot subject (product image path or AI-generated frame)
2. **`output_folder`** — usually `<brand>/ads/video-NN-imessage-<slug>/`
3. **`render_variant`** — `plain` (full-bleed chat, the catchback/peloton builds) or `iphone-frame` (framed phone + Dynamic Island over a background photo — the Clinikally build; **default for new builds**, it reads more native in-feed). `iphone-frame` additionally needs a `background_asset` (brand-relevant photo; NB2-generate if none exists).
4. **`peer_persona`** — name + 2-letter monogram/initials + avatar bg color (hex) — i.e. the non-self entry in the thread's `participants[]`
5. **`screenshot_asset`** — path to the image that gets sent in the first attachment bubble
6. **`bubbles`** — list of `{from: me|peer, text: string, delivered?: bool, typing_before?: bool}`
7. **`composer_drives`** — the composer text for **every** sent bubble (`{bubble_id, text, dur_sec}`). The typed text must equal the sent text — see Critical knowledge #13.
8. **`end_card`** — `{wordmark, code, tagline}` (+ optionally a `reference_image` for the reference-styled variant) — used to render the brand slate

The master `thread.json` schema is identical to the `create-imessage-mockup` atom (typed `messages[]` — `text` / `typing` / `attachment` with `src`/`title`/`subtitle` — plus `participants[]`, `theme`, `header`); this skill adds **no new data structure**. The only new artifact is the **timeline** (see Workflow step 3).

## Critical knowledge — read before producing your first ad

These are mistakes that have already been made and fixed in the canonical builds. Do not re-introduce them.

### 0. Use the real brand wordmark on the end card, never styled text

CSS approximations of brand wordmarks look amateur even when typeface and kerning are close. The Peloton build caught this on first preview: a hand-styled "peloton" lowercase + manual dot got rejected immediately in favor of the real Wikimedia SVG. Drop the official SVG at `assets/<brand>-logo.svg` (sources: Wikimedia Commons, `brandfetch.com/<brand>.com`, brand press kit) and the bundled `render-end-card.template.js` injects it via the `<!--{{BRAND_LOGO_SVG}}-->` placeholder. Your only job is to color the paths.

See `references/end-card-recipe.md` for the full end-card playbook (CTA pill color, logo contrast tricks, photo-background composition).

### 1. Use the real Apple iMessage SFX, not generic notification sounds

**The "iMessage feel" is 70% the SFX.** Generic notification sounds break the illusion immediately. The Apple sounds are CC0 on BigSoundBank:

- **Send (whoosh-up):** `https://bigsoundbank.com/UPLOAD/mp3/1313.mp3` — Apple "Message Sent" (~0.5s)
- **Receive (tritone):** `https://bigsoundbank.com/UPLOAD/mp3/1111.mp3` — Apple "Note" (raw is 6s; trim to **1.4s with a 400ms fade-out**)

Pre-bundled copies live at `assets/sfx/imessage-send.mp3` and `assets/sfx/imessage-receive.mp3` in this skill. **Reuse those** instead of re-downloading. Both are loudness-normalized to **-9 LUFS, peak 0dB** so they cut through the music bed without further tweaking.

**LFS gotcha:** these files are git-lfs-tracked. If you `cp` them into a fresh ad folder and ffmpeg later reports `Invalid data found when processing input`, you got a 130-byte pointer file instead of the audio. Recover by running `git lfs pull --include="assets/sfx/*"` from the repo root, OR re-fetch from BigSoundBank with the recipe in #1 above.

### 2. NEVER play SFX on the typing indicator

The typing-dots bubble appearing is a **silent state change** — iOS does not chime when someone starts typing. Adding a soft "receive" cue on the typing-pop sounds wrong even when quiet. Only fire `receive` SFX when the *actual text bubble* lands (i.e. on `typing-swap`).

This was caught on review of the canonical build and explicitly removed.

### 3. Record the entire chat as ONE continuous Playwright session

Do **not** record scene-by-scene and concat. Every page reload causes a micro-flicker at the cut, and "scrolling" has to be faked by *removing older bubbles* between scenes — which looks janky because it is janky.

Architecture:
- Render the full thread HTML with all messages present but each marked `popState: 'pending'` (which the CSS turns into `data-pending="1"` → `display:none`).
- A single embedded driver script walks a `TIMELINE` array on `requestAnimationFrame`, removing `data-pending` and adding `pop-now` at the right moment for each event.
- Auto-scroll the body via custom easing whenever a new bubble lands; do not rely on `scrollIntoView` (inconsistent in headless).
- Compute the SFX cue list **deterministically from the timeline** (do not capture cues via `performance.now()` inside the page — there's a race with `setContent`'s load event that drops cues).

`scripts/record-master.template.js` implements this end-to-end. Adapt the `TIMELINE` array and reuse the rest verbatim.

### 4. Pop-pending must remove rows from layout, not just hide them

If `pop-pending` only sets `opacity: 0`, the row still occupies its full height — so the conversation pre-allocates all 15 bubbles' worth of space at frame 0, the auto-scroll has nothing to scroll to, and bubbles "pop into pre-allocated holes" instead of *arriving*. Use `display: none` (via `data-pending="1"`) so the conversation grows naturally as messages arrive.

The atom's chat.css now has this rule baked in:

```css
.row[data-pending="1"], .delivered-caption[data-pending="1"] {
  display: none !important;
}
```

### 5. End card stays static — no Ken-Burns, no zoom-pan

The brand slate must **land hard**. A drifting end card reads as filler and undercuts the punch of the FREEPACK reveal. Render the end-card PNG once and ffmpeg it to a fixed-frame MP4:

```bash
ffmpeg -y -loop 1 -i end-card.png -t 3.5 -r 30 \
  -vf "scale=720:1280,format=yuv420p" \
  -c:v libx264 -pix_fmt yuv420p -movflags +faststart end-card.mp4
```

Crossfade from chat → end card with a **300ms** `xfade` in the stitch step (longer feels mushy, shorter feels like a hard cut).

### 6. ffmpeg amix divides by N inputs by default

If you `amix` the music + the silent base + 11 SFX, every input gets divided by 13 unless you pass `normalize=0`. The audio will sound mysteriously quiet. Always:

```
amix=inputs=N:duration=first:dropout_transition=0:normalize=0
```

Then take the mix through `volume=2.5,alimiter=limit=0.95` so it peaks at 0dB without clipping.

### 7. Music bed: lofi/hip-hop, 60Hz highpass, ~-10dB

Keep the bed unobtrusive — `volume=0.30` plus `highpass=f=60` to clear room for the SFX. Fade out 1.5s before the end so the FREEPACK reveal can land in (relative) silence. If the bed is shorter than the ad, loop it in the mix with `aloop=loop=-1:size=2147483647,atrim=duration=<total>` (the Clinikally stitch does this) instead of hunting for a longer track. Any short lofi/hip-hop instrumental at `<your-project>/audio/music-bed.mp3` works (lab example: `coca-cola/ad-runs/video-01-museum-painting/audio/variants/A_hiphop/music.mp3`); generate one via ElevenLabs music if the repo has none.

### 8. Hook asset — HTML-mimic for app UIs, NB2 for photographic shots

Route by what the hook *is*:

- **App-UI screenshots** (Strava, Slack, a cancellation email, a statement): write an HTML file
  that mimics the real app's UI and render it to PNG with Playwright (~5 lines of script).
  AI-generating fake app UIs is unreliable — garbled chrome reads as slop.
- **Photographic / lifestyle shots** (a throwback beach photo, a selfie-ish flex, the framed
  variant's background): generate with **Nano Banana 2** (`fal-ai/nano-banana-2/text-to-image`,
  via `scripts/fal_helpers.py`) — the Clinikally build generated its Goa throwback,
  beach background, and end-card base this way. Write each generator as a small
  `working/gen_<asset>.py` and save a `<asset>.meta.json` sidecar (prompt + model) next to the
  output for provenance.

Two rules:

1. **Mimic the actual UI patterns, not just the vibe.** Abstract gradients + silhouettes read as "AI slop" (the first Peloton Strava attempt). Specific UI conventions (Strava-orange brand strip, polyline route, "Public · 2h ago" timestamp, real-feeling stats grid) read as real (the second attempt).
2. **Match the app's brand colors and typography exactly.** Get them from the app's marketing site or screenshots.

See `examples/strava-card.example.html` for the canonical pattern. Render with:

```js
const { chromium } = require('playwright');
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 720, height: 880 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
await page.setContent(fs.readFileSync('strava-card.html', 'utf8'), { waitUntil: 'load' });
await page.waitForTimeout(150);
await page.screenshot({ path: 'strava-card.png' });
```

### 9. Pacing curve — not flat 700ms gaps

Real iMessage banter has rhythm:
- One-word reactions ("bro no way" → "is that on an app"): **250–450ms** apart
- Sentence reveals (after composer typing): **600–900ms** before the next event
- Beat of silence (~600ms) before the final "bet" so it lands

The canonical timeline in `record-master.template.js` is a good starting point — adjust event times rather than redesigning from scratch.

### 10. Variant B — iPhone-frame mode (the Clinikally pattern; default for new builds)

Render with the atom's framed mode — `renderHTML(thread, { mode: 'with-iphone-frame' })` — so the
chat plays inside a phone (Dynamic Island + status bar) over a brand-relevant background photo.
Three gotchas the Clinikally build hit:

- **The atom's framed branch hard-codes light mode.** Inject dark manually after render:
  `html.replace('<html>', '<html class="theme-dark">').replace('<body class="framed">', '<body class="framed theme-dark">')`.
- **Layout math:** the framed UI is laid out at **514×914 logical** and scaled to the 1080×1920
  output via `html { zoom: 2.10 }` (514 × 2.10 ≈ 1080). Use **fixed-px heights, not vh**, in
  every override.
- **Scoped style overrides** (see the Clinikally `styleB()`): background photo as a data-URI on
  `body.framed`, compact `conv-header` (min-height 66px, 42px avatar), `.conversation` with
  `overflow: hidden; justify-content: flex-end`, attachment cards capped at `max-width: 58%`.

In framed mode **the scroller is `.conversation`, not the document** — the driver must scroll
that element. And the framed keyboard's `.input` starts empty: rebuild it on the first composer
keystroke (inject `.composer-text` + caret + send button — the driver's `composerSpan()` does
this).

### 11. Record at the NATIVE output resolution

Playwright's `recordVideo` **cannot upscale** — set `viewport == recordVideo.size == the output
size (1080×1920, deviceScaleFactor 1)` and let the `zoom` carry the layout to full size. The old
720×1280-then-lanczos-upscale flow ships a soft master; native recording is visibly crisper,
especially bubble text.

### 12. Trim the paint offset so SFX cues align exactly

`recordVideo` starts rolling at `newContext()`, but the page doesn't paint the iMessage shell
until ~500ms later — so MP4 t=0 ≠ TIMELINE t=0 and every SFX cue lands late. Measure the delta
(`Date.now()` at context creation → `__driverReady` after `setContent`), then trim it off the
head: `ffmpeg -ss <offset> -i <recording> -t <TOTAL_DURATION> …`. After the trim, the cue list's
`t` values line up with the video exactly.

### 13. EVERY sent bubble gets a full composer drive

The composer-typed text must **equal** the sent bubble's text — a partial composer preview that
"sends" a longer bubble reads as fake on a second watch. Pace at ~12–15 chars/sec with ±30%
per-character jitter (`perChar * (0.7 + Math.random() * 0.6)`) so the typing feels like thumbs,
not a metronome. Pair each send: `composer` (dur ≈ chars/14) → `pop` + `composer-clear` at the
same `t`.

## Concept catalog

Most iMessage ads fit one of these six angles. Use them as a brainstorming menu, not a checklist. Strongest hooks across all six: a specific number, a small act of self-trust, or a physically novel product mechanic.

| Angle | Hook (the attachment) | Reveal |
|---|---|---|
| **Result-as-screenshot** | a number that brags by itself — race time, app summary, dashboard, FTP score | "X mins a day. that's it." |
| **Setup flex** | photo of your space — tiny apartment, race-kit corner, home gym in a closet | "this is the whole gym" |
| **Cancellation moment** | confirmation receipt — gym cancellation email, subscription cancelled page | "$X → $Y, do the math" |
| **Feature-as-punchline** | short video clip of the feature in motion — rotating screen, transforming product | the mechanic *is* the brand |
| **Friend-asks-friend (inverse)** | the peer initiates with the wow — "how are you doing this 😭" | you reply with the brand |
| **Receipt-as-hook** | mundane financial document — credit-card statement, App Store receipt | small act of self-trust |

Pick the strongest angle for the brand voice *before* writing copy. Most "the script is fine but feels off" feedback comes from picking the wrong angle, not bad copy. Catching that here is 30 seconds; catching it after recording is 30 minutes.

## End-card variants — which to pick

The molecule ships two templates. Pick by brand voice, not aesthetic preference. See `references/end-card-recipe.md` for the full playbook.

| Template | When to pick |
|---|---|
| `end-card.template.html` (abstract glow + product) | Brand voice is playful or product-led. Hook is a *thing* (CatchBack). |
| `end-card-photo-bg.template.html` (athlete/persona photo) | Brand voice is grounded or lifestyle-led. Hook is a *person* (Peloton). |
| Reference-styled (NB2 base + HTML overlay) | A specific end-card look is requested or referenced. NB2-generate the base image from the reference (Clinikally: `working/gen_endcard_v2.py` from `source/pellops-endcard-reference.jpeg`), then overlay the real wordmark + CTA in `end-card.html`. Text/logo stay HTML-crisp; only the backdrop is generated. |

## Workflow

### State 0 — Brainstorm angles (skip only if direct port of a reference)

Generate 4–5 concept angles from the catalog above before writing thread.json. For each:

- One-line hook (what gets screenshotted)
- 8–14 bubble script as a markdown table
- Why it works in one sentence

Show the menu to the user. Lock the angle before writing State 1's full script.

### State 1 — Capture the script + screenshot asset

Either transcribe a reference ad with `/watch <reference.mp4>` or write the script from scratch. You need:

- The verbatim text of every bubble in order
- Who sends each one (me / peer)
- Where typing indicators belong (typically before each peer reply that's a sentence, optional for short reactions)
- The composer-text snippets (mid-typing previews of selected sent bubbles)
- The exact CTA code

### State 2 — Build `threads/full-thread.json` + pick the render variant

Match the schema in `the create-imessage-mockup skill (its SKILL.md)` — extended with:

- `theme: "dark"` (mandatory for this format)
- `header.style: "conversation"` and `header.unread: <number>` (the "252" badge in the reference)
- The first message is usually `{type: "attachment", from: <whoever drops the hook>, src, title, subtitle}` — the screenshot/photo the chat is *about* (the inverse angle has the PEER drop it)
- Inline `[[link:CODE]]` markers in the bubble text where iOS would auto-detect a code/email/URL — they render with the link-detector underline

Pick the **render variant** now (it changes the recorder, not the thread): `iphone-frame`
(default — Clinikally pattern, needs a background photo; see Critical knowledge #10) or `plain`
(full-bleed chat — catchback/peloton pattern). Attachment `src` paths get base64-inlined by the
recorder (`inlineAttachments`) so `setContent` never chases relative file paths.

See `examples/full-thread.example.json` (CatchBack, plain) and
`the Clinikally build (threads/full-thread.json)` (framed, inverse
angle) for canonical threads.

### State 3 — Define the `TIMELINE`

In `clips/record-master.js`, the `TIMELINE` array is the **single source of truth** for both the recording schedule and the SFX cue list. Each event:

```js
{ t: <seconds>, kind: '<kind>', id: '<msg-id>', sfx: '<send|receive|null>' }
```

Kinds:
- `pop` — reveal a text or attachment bubble (`sfx: 'send'` or `'receive'` per direction)
- `typing-pop` — reveal a typing-dots bubble (**ALWAYS `sfx: null`** — see knowledge #2)
- `typing-swap` — replace a typing bubble with the actual text (`sfx: 'receive'` here)
- `composer` — type characters into the composer over `dur` seconds
- `composer-clear` — wipe the composer (paired with the `pop` of the message that was being composed)
- `scroll` — smooth-scroll over `dur_ms`; place ~100ms after every `pop` and `typing-pop`

Pacing tip: the recorder's clock is `t0 + ev.t * 1000`, so all event times are absolute seconds. Sketch the whole timeline in a notepad first; the canonical 17.4s flow is in `scripts/record-master.template.js`.

### State 4 — Record + stitch

```bash
# 1) Record the chat as ONE continuous video (writes master-chat.mp4 and master-chat.sfx.json)
NODE_PATH=<create-imessage-mockup-skill-dir>/node_modules \
  node clips/record-master.js

# 2) Render the end card (static, no Ken-Burns)
NODE_PATH=<create-imessage-mockup-skill-dir>/node_modules \
  node clips/render-end-card.js

# 3) Stitch chat + end card with crossfade + music + SFX
bash edits/stitch.sh
```

`scripts/stitch.template.sh` is an exact copy of the canonical stitch — it consumes `master-chat.sfx.json` to layer the SFX deterministically.

### State 5 — Export variants

Recording natively at 1080×1920 (Critical knowledge #11) means the 9:16 export is a clean
re-mux, not an upscale:

```bash
ffmpeg -y -i edits/master-final.mp4 \
  -c:v libx264 -pix_fmt yuv420p -c:a copy -movflags +faststart \
  meta-upload/master-9x16-1080.mp4
ffmpeg -y -i edits/master-final.mp4 -vf "crop=1080:1080:0:420" \
  -c:v libx264 -pix_fmt yuv420p -c:a copy -movflags +faststart \
  meta-upload/master-1x1-1080.mp4
```

(Legacy 720×1280 masters need the old `scale=1080:1920:flags=lanczos` upscale + `crop=720:720:0:280`
— avoid by recording native.)

### State 6 — Review

Open `storyboard.html` in a browser; play the master against the original brief. Re-time individual events by editing the `TIMELINE` and re-running step 4 — no other steps need re-running.

## Output

```
<output_folder>/
  storyboard.html                # the canvas — Idea / Design / Implementation tabs
  threads/full-thread.json       # the script as data
  assets/<hook>.{png,jpg}        # the image attached in bubble 1
  assets/<asset>.meta.json       # provenance sidecar for every NB2-generated asset
  assets/<background>.jpg        # iphone-frame variant only — the backdrop photo
  audio/imessage-{send,receive}.mp3  # copied from this skill's assets/sfx/
  audio/music-bed.mp3            # optional lofi/hip-hop bed
  source/<reference>.jpeg        # any reference images (e.g. end-card reference)
  working/gen_<asset>.py         # NB2 generators for AI-made assets (optional)
  clips/
    record-master.js             # adapted from this skill's template
    master-chat.mp4              # 17–22s continuous chat recording (1080×1920 native)
    master-chat.sfx.json         # deterministic cue list (paint-offset-aligned)
    end-card.html                # adapted from this skill's template
    render-end-card.js           # adapted from this skill's template
    end-card.png                 # static brand slate
    scene-end-endcard.mp4        # the static MP4 for stitching
  edits/
    stitch.sh                    # adapted from this skill's template
    master-final.mp4             # 1080×1920, ~21s, h.264 + AAC, 0dB peak
  meta-upload/
    master-9x16-1080.mp4
    master-1x1-1080.mp4
```

## Quality Checks

Before declaring the ad shippable:

- [ ] Audio peaks at 0dB (`ffmpeg -af volumedetect`); mean roughly -10 to -12dB
- [ ] **No SFX on any `typing-pop` event** — verify in `master-chat.sfx.json` (every cue's matching event in the timeline must NOT be `typing-pop`)
- [ ] **SFX cues land ON the bubble pops** — paint offset was measured and trimmed (Critical knowledge #12); spot-check the first and last cue against the video
- [ ] No micro-flicker at any cut — there should be NO scene-by-scene boundaries inside the chat portion. Only one cut: chat → end card (crossfade).
- [ ] All bubbles popped in the right order matching the script verbatim
- [ ] **Every sent bubble had a full composer drive and the typed text equals the sent text** (Critical knowledge #13); composer clears on each send (no ghost text)
- [ ] FREEPACK (or your code) is link-detector underlined in the bubble that contains it
- [ ] Master is **native 1080×1920** (`ffprobe -show_streams`), not an upscaled 720
- [ ] iphone-frame variant: dark theme actually applied (bubbles dark, not white), status bar legible against the background, attachment cards ≤58% width, conversation bottom-anchored
- [ ] End card is **static** — no Ken-Burns drift
- [ ] Chat→end-card crossfade is 300ms (not 0ms hard cut, not >500ms slow fade)
- [ ] Last bubble (usually the peer's "bet"/reaction) gets ~600–800ms to breathe before the crossfade starts

## Failure Modes

| Symptom | Cause | Fix |
|---|---|---|
| Glitchy / micro-flicker between bubbles | Recorded scene-by-scene with page reloads | Use the continuous-recording pattern in `scripts/record-master.template.js` |
| Framed variant renders LIGHT bubbles on the phone | The atom's framed branch hard-codes light mode | Inject `theme-dark` onto `<html>` and `<body class="framed">` after `renderHTML` (Critical knowledge #10) |
| Soft / blurry master, mushy bubble text | Recorded at 720 and upscaled, or viewport ≠ recordVideo size | Record native: viewport == recordVideo.size == 1080×1920, layout via `html { zoom: 2.10 }` (Critical knowledge #11) |
| SFX consistently ~0.5s late vs the bubbles | recordVideo starts at `newContext()` but the page paints later | Measure the paint offset and `ffmpeg -ss` it off the head (Critical knowledge #12) |
| Composer never shows text in framed mode | The framed keyboard `.input` has no text span until built | Rebuild the input on first keystroke — `composerSpan()` injects `.composer-text` + caret + send button |
| Conversation doesn't scroll in framed mode | Driver scrolled the document; the framed scroller is `.conversation` | Scroll the `.conversation` element with the eased `scrollTop` pattern |
| SFX too quiet, audio sounds weak | `amix` divided by N inputs | Add `:normalize=0` to the amix filter; chase with `volume=2.5,alimiter=limit=0.95` |
| Stray "Delivered" labels appear in empty space | Pop-pending didn't propagate to the caption | The atom now sets `data-pending="1"` on the caption alongside the bubble — make sure the atom version is current |
| Bubbles all pre-allocate space, conversation doesn't grow | Pop-pending only hid via `opacity: 0` | Use `display: none` (via `data-pending="1"`) — already in the atom's CSS |
| End card drifts / feels like filler | Ken-Burns zoompan in the end-card render | Use the static `scale=720:1280` ffmpeg invocation in `scripts/render-end-card.template.js` |
| Typing dots silently appear in 1 frame and skip | The driver swapped typing→text without the typing being visible long enough | Hold typing-pop ~700ms before typing-swap |
| FREEPACK doesn't render underlined | Forgot the `[[link:FREEPACK]]` marker | Wrap any auto-detected code/email/URL in the marker |
| Receiver avatar clipped at top of viewport | conv-header content stack (avatar + name-pill) overflows the default conv-header height when `position: fixed` | The bundled `styleOverride` in `record-master.template.js` pads the header to `min-height: 110px` and anchors the `.center` stack from `top: 14px` (not transform centroid). Don't shrink those values without re-testing. |
| ffmpeg fails on SFX with `Invalid data found when processing input` | LFS smudge gave you a 130-byte pointer file instead of audio | `git lfs pull --include="assets/sfx/*"` or re-fetch from BigSoundBank (see Critical knowledge #1). |
| End-card logo looks like styled text, not the brand | Used CSS-styled fallback instead of injecting the real SVG | Drop the real SVG at `assets/<brand>-logo.svg` and the bundled `render-end-card.template.js` injects it via `<!--{{BRAND_LOGO_SVG}}-->`. See `references/end-card-recipe.md`. |
| Hook screenshot looks like AI slop (gradient + silhouette) | Tried to render an "app screenshot" with abstract elements instead of the real app's UI | See `examples/strava-card.example.html` — mimic the actual app's brand strip, typography, and stats grid. |

## Decision Rules

- Use this molecule for a **multi-bubble timeline animated to video**; a single static chat
  screenshot is the `create-imessage-mockup` atom directly.
- **Render variant:** default to `iphone-frame` (Clinikally pattern — reads native in-feed and
  carries brand context via the background). Use `plain` when the chat itself must fill the
  frame (dense threads, small text) or when matching the catchback/peloton look.
- Use the real brand wordmark SVG on the end card — never CSS-styled text.
- Use the real Apple iMessage SFX (`assets/sfx/imessage-{send,receive}.mp3`) — never generic
  notification sounds.
- Never play SFX on a `typing-pop` event — iOS does not chime when someone starts typing.
- Every sent bubble gets a **full** composer drive (typed text == sent text).
- Hook asset routing: HTML-mimic for app-UI screenshots; NB2 for photographic/lifestyle shots
  (Critical knowledge #8).

## Reference run

Three canonical examples. Copy the closest one and swap script + assets:

- `the Clinikally build` — **newest**: iphone-frame variant, dark theme, native 1080 recording, paint-offset trim, full composer drives, NB2-generated assets, reference-styled end card, friend-asks-friend inverse angle.
- `the Catchback Cards build` — playful brand voice, abstract-glow end card, gray peer avatar, product-flex hook. Plain variant.
- `the Peloton build` — grounded brand voice, photo-background end card with real wordmark, indigo peer avatar, result-flex hook + locally-rendered Strava attachment. Plain variant.

All share the recorder architecture, stitch script, atom, and SFX. The parameters that change per build: the render variant (+ background asset), the end-card variant, the brand logo SVG, the hook asset, and the `TIMELINE` array.
