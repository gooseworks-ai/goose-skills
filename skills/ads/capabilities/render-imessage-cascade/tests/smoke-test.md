# Smoke test — render-imessage-cascade

Verifies the free PIL + ffmpeg assembly end-to-end from the bundled example config.
No paid calls. Needs: Python 3 with Pillow, ffmpeg/ffprobe, and macOS system fonts
(SF Pro `SFNS.ttf`, Times). A clean phone-on-desk plate PNG.

## Setup

```bash
cd scripts
python3 -m pip install pillow            # if not present
mkdir -p /tmp/imsg-cascade-smoke
# Point config.json at a real plate: copy config.example.json → config.json and set
# "plate" to any 1080x1920 phone-on-desk PNG (lock screen on, no notification), and
# fill in end_card.{line1,line2,wordmark_text,url,accent}. Run --no-audio to stay $0.
cp config.example.json /tmp/imsg-cascade-smoke/config.json
```

## Run

```bash
python3 build_assets.py --config /tmp/imsg-cascade-smoke/config.json \
                        --work-dir /tmp/imsg-cascade-smoke
python3 compose.py      --config /tmp/imsg-cascade-smoke/config.json \
                        --work-dir /tmp/imsg-cascade-smoke \
                        --out /tmp/imsg-cascade-smoke/final.mp4 --no-audio
```

## Expect

- `build_assets.py` writes `nb-1..N.png`, `pill.png`, `endcard.png` into the work dir.
  Banners are the warm TRANSLUCENT greige (NOT white / no white bloom) with a green
  Apple Messages icon and a soft box-shadow; **title/body/NOW/handle render in SF Pro**
  (bold title, regular body, italic handle), pixel-crisp. The pill reads
  "⌄ Show less / ✕", right-aligned.
- `final.mp4` — 1080×1920, ~14s. The plate Ken-Burns push-ins; banners spring in at the
  BOTTOM one-by-one and push the stack UP (banner 1 ends on TOP); the ✕ clears the stack;
  a serif end card (line1 white, line2 accent) with the real wordmark + url resolves.
- `ffprobe` confirms dimensions/duration; run the `watch` skill on the master to confirm
  beat order, the warm greige banners, the ✕-clear, and the end card.

## Fail signals

- Banners read as WHITE / have a white bloom → the `fill` isn't the warm greige (check
  `FILL` / `config.fill`).
- Banner text looks like Helvetica/Arial, not the iOS system font → SF Pro didn't load;
  confirm `SFNS.ttf` exists and `set_variation_by_name` succeeded (Arial is fallback only).
- Newest banner appears at the TOP / stack pushes DOWN → arrival order or the `ybanner`
  push expression is inverted (newest must enter at the bottom).
- Text baked into the banner is smeared/warped → something AI-rendered the UI; this engine
  is PIL-only, never a video model.
