# Human version

This format recreates the feel of the approved Clinikally Goa texting ad: a
proportional phone over a background, a believable conversation, real message
sounds and a brand ending. Contact names, phone time, background and story are
editable for every run.

Keep the approved visual mechanics. Choose new people, words and brand facts.
Images can appear anywhere in the chat, or be omitted entirely. Backgrounds,
product links and music are optional. The chat itself supplies the copy.

---

# Agent version

## What to preserve

- A 393×852 phone shell inside a 1080×1920 outer video. Scale together, with a
  margin on all four edges. The island sits **12 logical pixels inside the screen**,
  after the bezel. It is never attached to the canvas edge or bezel.
- On 9:16 the conversation sits inside the platform-safe zone (`safe_area`, on by
  default): the newest message stays above the bottom 400 px caption band and
  left of the right 140 px button rail. Never push it back under the controls.
- Contact avatar/name, status bar, left received bubbles, blue sent bubbles,
  composer typing for self messages and received-only typing dots.
- Bottom-anchored short threads, followed by scrolling when the conversation fills.
  The conversation clips beneath the fixed header and above the composer.
- Original send and receive files, one cue per real message/attachment.
- A readable complete final message before the 300ms end-card crossfade.

## What changes with the story

Bind `thread.participants[].name` from the user's names choice. DM header identity
comes from the non-self participant. Initials derive from that name; an explicit
initial must match the requested identity. Never keep Rachel, Sam or Riya just
because they appeared in a demo. Blank names fail. Group title is separate from
individual names; sender labels appear with each sender's first real message,
including after typing dots and after another person speaks.

Bind the user's displayed phone time to `thread.clock`; both 12-hour and 24-hour
display text work. An omitted clock uses the neutral shell fallback, not a story
requirement. Timestamp messages have their own editable labels. The outer
background is optional `background_image`: replace it with the user's chosen
local image, or omit it for the neutral background. A text-only conversation
does not require a chat image or a background image.

Use natural texting in the chosen language and tone. Do not force capitalization,
formal English or a particular script. The thread is illustrative; do not claim
that it documents a real customer. Brand claims, prices, coupon codes and ratings
must come from current approved facts. The archived demo's sunscreen advice and
offer are historical example copy, not reusable product claims.

Use zero, one or several images. Insert each `attachment` directly in
`thread.messages` where it belongs, from either participant: first, between any
messages or last. Preserve the authored order. There is no required photo opening,
midpoint product image or attachment sequence. A photo uses `presentation:"photo"`;
a product URL preview uses `presentation:"rich-link"`, a real image, short title
and correct brand domain. Files are local or data URIs; resolve intended assets
before rendering and check LFS files are real.

## Timing and repair

The recorder captures each fixed movie time as an image and encodes 30 frames per
second. Loading assets or running on a slow machine takes wall time but cannot
shift movie time. Never restore a Date.now/browser-startup trim, a guessed offset
or a separately authored sound list. There is no sound on typing dots/keystrokes.

The sound files are SHA256:

| File | SHA256 |
|---|---|
| imessage-send.mp3 | 67a51c884a10e16efb64dd3cdf0bfe7123b08205daafe490e92601e38f86a7b2 |
| imessage-receive.mp3 | d8018578447e698ddac6080b1737c0666520a0d91ccbd556ca735aeb5ccd6945 |

Leading silence is removed during mixing; the actual tone is preserved. An absent
or damaged embedded copy requires a fresh package, not a made-up sound.

Review `chat-preview.png` first. The preview's HTML can seek with
`window.__renderAt(seconds)`; the timeline lists the reveal/composer times. Fix
names, copy, wrapping, files or pacing in config. Then use `render.sh`, review
the ACTUAL final MP4, and keep the timeline and sound cues with the deliverable.
No paid retry is needed for a deterministic layout or timing repair.

## Evidence and limits

Lineage: [[derived-from::create-imessage-mockup]] and the archived Clinikally
Goa build. Private project files are optional maintainer evidence; this package
contains the entire runtime and is sufficient from an empty customer folder.

The operator supplied https://make.gooseworks.ai/sample/clinikally-imessage-goa-sunscreen.
On 2026-10-04 that URL served a Wonderbly/Rachel clip, despite the Clinikally slug.
Do not infer media identity from a URL's name. The maintenance rebuild used the
original local Clinikally master, source thread and sound hashes. Source demos
are references, not generic creative defaults.

Technical checks cover layout and stream integrity. They do not prove that copy
is persuasive or that a sound level is pleasing. Review those in the finished
master and record any operator feedback. Native emoji fonts vary by operating
system; check the customer's actual rendered result before delivery.
