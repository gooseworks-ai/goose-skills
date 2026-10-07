---
name: footage-cutlist
description: Watch a brand's own product footage (screen recording, product film), pick the moment that proves each line with the user, and render those picks as a product layer — free, local. survey.py turns footage into timestamped contact sheets + scene cuts + motion so the agent can actually look at it; the agent writes a cut list (beat → source window + framing); preview.py draws it as a review sheet the user corrects round by round; cut.py renders the approved list into a silent 1080x1920 layer with the creator's area left as a plate. Also frames footage as a filmed screen (keystone, bezel, handheld drift) with dissolves between beats, and takes still screenshots as sources. Use for any format that shows real product footage beside, between or instead of a creator (split-screen, screen inserts, walkthroughs).
status: active
---

# footage-cutlist

Picking which moment of a customer's footage plays under which line is a **judgement**,
not a formula. A position map ("beat 3 is 40% through the reel, so take the footage 40%
through") was measured up to 5.7s off a person's picks on a reference build. So this
capability does the free, mechanical parts and leaves the decision to the agent and the
user:

| Step | Script | Who decides |
|---|---|---|
| Look at the footage | `survey.py` | nobody; it just shows it |
| Choose a window per line | the agent writes `cutlist.json` | agent, then the user |
| Show the choices | `preview.py` | the user corrects them |
| Render the approved choices | `cut.py` | nobody |

All free. ffmpeg + Pillow + numpy only.

## Run

```bash
python survey.py --video footage.mp4 --out work/survey            # whole clip, ~1 frame/s
python survey.py --video footage.mp4 --out work/s-12 --from 12 --to 18 --every 0.25 --frames
python preview.py --cutlist work/cutlist.json --out work/review.png
python cut.py --cutlist work/cutlist.json --out work/layer.mp4 [--draft]
```

`survey.json` lists `cuts` (scene changes), `motion` (change per second) and `still`
(runs of 1.5s+ with nothing moving: a dead screen reads as a frozen video). Read the
sheets; open a single `frame-*.png` (from `--frames`) when you need to read small UI text.

## The cut list

```json
{
  "size": [1080, 1920], "fps": 30, "seam": 768, "creator_side": "bottom", "bg": "auto",
  "sources": {"demo": "footage/demo.mp4"},
  "beats": [
    {"id": "b1", "start": 0.0, "end": 3.1, "state": "creator", "vo": "..."},
    {"id": "b2", "start": 3.1, "end": 7.4, "state": "split", "vo": "...",
     "source": "demo", "in": 12.0, "out": 16.3, "fit": "width", "why": "the brand kit fills in at 13.4s"}
  ]
}
```

- `state`: `creator` (creator full frame), `split` (footage in the product zone, creator in
  the other), `product` (footage full frame).
- `in` is where the window starts in the source; `out` defaults to `in + slot` (1.0x). A
  window may play between 0.5x and 2x; it is never looped or frozen to fill a slot.
- `fit`: `width` (whole frame, letterboxed; the default), `cover` (fill + crop around
  `focus`), `crop` (a source box `[x0,y0,x1,y1]` in fractions, then fit by width).
- `bg`: `auto` samples the footage's own corner colour so the letterbox and the footage read
  as one surface; `blur`; or `#rrggbb`.
- `look: "screen"`: frame the footage as a screen filmed at close range (thin bezel, dark
  room, faint moire, grain, slow handheld drift). `crop` picks the source region,
  `screen: {rot, keystone, fill, fit, drift}` the geometry, `mask` boxes are blurred in the
  source (an email, a customer name). Inserts over a creator: `keystone ~0.007`,
  `rot` within ±1°. Walkthroughs: `keystone ~0.024`, `rot` -1.5..0, `fill ~0.80`. Never
  bigger angles and never alternate them between beats (read as a wonky camera).
- `transition: {"dissolve_frames": 7}` (top level): cross-dissolve every beat into the next.
  A hard cut between two screens reads as an edit; 6-7 frames reads as the camera moving.
- A source can be a still image (png/jpg/webp): it holds for its slot. Give it
  `look: "screen"` so the drift keeps it alive.
- `why`: one line on what the window shows. It is printed on the review sheet so the user
  can see the reasoning, and it makes the agent say what it saw.

Beats must tile the timeline from 0 with no gaps. `cut.py` refuses a list that does not.

## Rules that were learned the hard way

1. **Watch the whole thing before choosing anything.** Look at every sheet of the whole-clip
   survey first. The moment that proves a line is often not where the recording's order
   suggests.
2. **Never commit a window from a 1fps glance.** Re-survey that range at `--every 0.25` and
   look at every frame. A click, a page load or a half-typed field lives between the
   samples, and it is exactly what a user then points out ("you didn't look at the video
   properly").
3. **The line must be true of the footage while it is said.** If a line says "it pulls your
   brand colours", the colours must be on screen during that line, not a second later.
   Name what is visible in `why`.
4. **Never crop footage that has copy in it.** Cropping a UI panel into a narrower zone
   slices through words. Default to `fit: width`; use `crop` only to isolate a small
   subject, and check the review sheet for cut-off text.
5. **Avoid dead screens.** A window inside a `still` run reads as the video having stopped.
   Start it where something moves, or shorten it.
6. **A screen region should be roughly the box's shape.** A 9:16 box is filled by a source
   region of ~0.6-0.8 aspect: crop fewer COLUMNS at full height. A wide, short crop floats
   in black. For a complete panel with copy, use `fit: width` and let the room fill.
7. **Watch for a third party inside the footage.** A customer logo row or another company's
   name in the recording ends up in the ad. Crop above it or `mask` it.
8. **Don't reuse footage.** `cut.py` warns when two beats overlap in the same source: it
   reads as a loop.
9. **After the takes exist, re-check.** Line timing moves when the real voice is aligned
   (`align_beats.py`). Re-run `preview.py` + `cut.py` on the aligned list and look again.

## Going back and forth with the user

Expect several rounds. Each round:

1. Show `review.png` (and a `--draft` layer if they want to see motion).
2. The user names beats: "b4 is wrong, use the part where the report loads."
3. Re-survey just that stretch densely, find the moment, and change **only** that beat's
   window. Say what you changed and why.
4. Re-render the review sheet and show it again.

Picking is free, so take as many rounds as the user needs. Never spend on the creator
until the user has approved the cut list.

Source paths resolve relative to the cut-list file, never the shell working directory. Use absolute source paths when preparing a run. Save explicit inspected in/out bounds; defaults are compatibility behavior, not evidence that a window was watched. Screen framing defaults to width to preserve UI text; height fitting is an explicit reviewed choice.
