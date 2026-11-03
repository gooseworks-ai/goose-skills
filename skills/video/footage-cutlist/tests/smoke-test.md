# Smoke Test

Free, local (ffmpeg + Pillow + numpy). No credentials.

1. `survey.py --video footage.mp4 --out survey` writes `survey/survey.json` and `sheet-NN.png`; every tile is labelled with its time.
2. Write a `cutlist.json` with one beat of each state (`creator`, `split`, `product`) and each fit (`width`, `cover`, `crop`).
3. `preview.py --cutlist cutlist.json --out review.png` draws one row per beat with three framed frames.
4. `cut.py --cutlist cutlist.json --out layer.mp4` writes a silent 1080x1920 track whose duration equals the last beat's end, plus `layer.json`.

Pass when the layer's duration matches the cut list to within 0.05s, the product sits in the product zone on split beats, the creator zone is a flat plate, and a bad cut list (a gap between beats, a window outside the footage, a 3x speed) is refused with a named reason.
