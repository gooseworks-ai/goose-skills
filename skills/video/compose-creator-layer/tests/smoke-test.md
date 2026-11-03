# Smoke Test

Free, local. `compose.py --layer layer.mp4 --beats cutlist.aligned.json --creator creator.mp4 --out reel.mp4`

Pass when the output matches the last beat's end, the creator fills the creator zone on `split` beats and the whole frame on `creator` beats, is hidden on `product` beats, the audio is the creator's voice at about -14 LUFS, and a `--draft` layer is refused.
