---
name: render-whiteboard-explainer
description: Assemble a whiteboard explainer video ad from a beats file — a narrator explains one idea while a real whiteboard fills up in black marker, with a hand-lettered title, bulleted rows down the left, a drawing filling the right, and a payoff that letters the closing line and rings the claim. The board is a PHOTOGRAPH and the ink is multiplied onto it, so the surface sheen and window light come through the strokes; the drawings are generated as line art and traced to ordered strokes, then revealed in drawing order on the word they belong to. The layout is SOLVED from the beats, never hand-placed. FREE assembly (Pillow plus ffmpeg) apart from one board photo and one drawing per subject, both one-time per brand. Use for the whiteboard format.
status: draft
---

# render-whiteboard-explainer

The renderer for the **whiteboard** video ad format: a voice explains one idea while a board
fills up in marker, the way a graphic recorder works a room. Every mark lands on the word it
belongs to, and the board is wiped and reused between sections.

Siblings in the chat-UI family are `render-imessage-chat`, `render-chatgpt-chat` and
`render-apple-notes-chat`, where a screen is the creative. Reach for this one when the creative
is **someone explaining a thing by drawing it**.

## The three decisions that make this format work

**The board is a photograph.** A drawn board reads as a drawn board, and a plain white frame
reads as a sketch film. Both were built and both were rejected. One generated still of a real
blank whiteboard in a real room is the plate, and the ink is multiplied onto it so the surface
sheen and the window light come through the strokes rather than sitting on top as flat black.
The handheld drift is generated over both layers at once, so nothing can slide against anything.

**The drawings are generated as line art, then traced.** Do not hand-code them, and do not trace
painterly images. Art traced from a photograph carries every contour the photograph had and
reads as clip-art; art generated as a marker drawing traces to a handful of confident paths. An
open hand came back as a single continuous stroke. Chain each generation off the first so the
line weight matches across the set.

**There is no colour.** Black marker throughout. Do not add an accent.

## Choices

The recipe asks these before any paid step; this renderer only draws what the beats say.

- **the script** — what the narrator says. Everything downstream is anchored to its word
  timings, so it is settled first and never changed afterwards.
- **the beats** — for each moment, what is SAID and what is DRAWN. A row of text, a drawing, or
  both. One number can be marked as the hero, which letters it large instead of as another row.
- **the title and subtitle** — lettered on the first board.
- **the payoff** — the closing line, lettered on the last board, with a ring closing around the
  claim it refers to.
- **the boards** — how many times the board is wiped and reused. Three suits a half-minute.

Brand facts come from the brand kit.

## What it renders

1. **The plate.** One photograph of a blank board in a room, generated once per brand, then
   cropped so the board fills the frame with its side edges running out of shot. The writable
   surface is measured off the image and pulled inside the caption safe zone before anything is
   mapped through it.
2. **The drawings.** One black line drawing per subject the script names, generated once per
   brand and traced into ordered stroke paths.
3. **The layout.** Solved from the beats, not authored. Rows go down a left column, drawings
   down a right one, with an enforced gutter between them, and the content runs the full height
   of the board. Boards are split at a pause near a balanced boundary, which is where a person
   would wipe.
4. **The video.** Marks appear stroke by stroke in drawing order, each starting on its own word.
   Text is written letter by letter. The board wipes between sections. Captions sit inside the
   safe zone and never run ahead of the voice.
5. **The master.** Gentle compression before a measured two-pass loudness normalisation, then a
   limiter. Targets minus fourteen LUFS with true peak under minus one and a half, and keeps the
   payoff hold intact.

## Non-negotiables

- **Every mark lands on its own word.** The voiceover is the clock. An anchor that resolves to
  the wrong word does not look wrong, it silently reorders the video: one that matched an early
  word instead of a late one once dragged a whole section to the front, and the ad played its
  ending first with nothing reporting a problem. Anchors are resolved once, shared by the solver
  and the renderer, and an ambiguous one is refused rather than guessed at.
- **Nothing is hand-placed.** Anything that refers to something else — an arrow, a note, a
  ring — takes its target as an argument and works out its own position. Anything sharing space
  with a drawing is bounded by that drawing's box. Two things placed at coordinates chosen
  independently will eventually meet.
- **Copy a reference's grammar, never its content.** The reference board bullets its rows with
  a drawn eye and fans emphasis marks beside its phrases, but those belong to that board's
  brand. Reproduced on another script they are decoration that means nothing. Filler has to be
  about something: a drawing of what the line refers to, never abstract specks.
- **Two reviews, both human.** The storyboard still costs seconds and is where relevance is
  judged — whether a mark is about the line it sits under, whether the payoff says the closing
  line. No automated check decides that. Then the finished cut, watched end to end with the
  `watch` skill.

## Inputs

- the spoken audio and its **word-level timings**, as described below
- a beats file — see the example beside the scripts
- a brand kit for the facts

**The voice comes with its word timings.** `create-vo-elevenlabs` returns audio only, and this
format needs a timing for every word. `scripts/gen-voice.py --project <dir>` reads `vo` and `voice`
from `beats.json` and calls the proxy's `/with-timestamps` route, writing `voice/vo.mp3` and
`voice/words.json`, which `make-episode.py` requires. A dry run prints the character count and the
cost; `--yes` spends. It routes through the GooseWorks proxy (`scripts/media_proxy.py`), never the
speech provider directly, and refuses a payload it has already paid for.

## Checks it runs itself

The build refuses to continue when any of these fail, and names what broke:

- every anchor resolves to exactly one intended word
- sections start in script order
- every mark finishes being drawn before its board is wiped
- rows stay inside the column and cannot reach a drawing
- loudness, true peak and the payoff hold

## Cost

The board photo and the drawings are **one-time per brand**. A second video for the same brand
costs only the voiceover. Everything else — the layout, the lettering, the tracing, the render
and the master — is free and local. Rendering a half-minute takes under three minutes.

## Honest ceiling

Measured against the filmed reference this reaches about a fifth of its ink cover, because the
reference is a time-lapse of a much longer drawing session while every mark here waits for its
word. Filler narrows that and does not close it. If a brief needs a genuinely full board, the
script has to be longer or the marks have to stop waiting for words.
