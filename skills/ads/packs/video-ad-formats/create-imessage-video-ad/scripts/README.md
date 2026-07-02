# scripts/

Templates for the executable artifacts that get copied into every iMessage-ad output folder. Adapt the parts that depend on your specific ad; copy the rest verbatim.

| File | Copy verbatim? | What you change |
|---|---|---|
| `record-master.template.js` | mostly | The `TIMELINE` array (event times, message ids, composer text). Also: peer avatar color via `participants[].color` in thread.json. |
| `end-card.template.html` | sometimes | Abstract-glow variant (CatchBack-style). Pick this when the brand voice is playful + the hook is a thing. |
| `end-card-photo-bg.template.html` | sometimes | Photo-background variant (Peloton-style). Pick this when the brand voice is grounded + the hook is a person. Requires `assets/hero.png`. |
| `render-end-card.template.js` | mostly | Adjust `LOGO_PATH` and (optional) `HERO_PATH` constants for your brand. The renderer auto-injects the SVG and hero photo into whichever end-card.html you ship. |
| `stitch.template.sh` | yes | Nothing — it consumes whatever cue list `record-master.js` produced |

Picking between the two end-card variants: see `../references/end-card-recipe.md`.

## Standard rename

When copying into a new ad folder, drop the `.template` suffix:

```bash
TARGET=<brand>/ads/video-NN-imessage-<slug>
mkdir -p $TARGET/clips $TARGET/edits $TARGET/audio/sfx $TARGET/threads
cp scripts/record-master.template.js $TARGET/clips/record-master.js
cp scripts/end-card.template.html $TARGET/clips/end-card.html
cp scripts/render-end-card.template.js $TARGET/clips/render-end-card.js
cp scripts/stitch.template.sh $TARGET/edits/stitch.sh
cp assets/sfx/imessage-send.mp3 $TARGET/audio/sfx/
cp assets/sfx/imessage-receive.mp3 $TARGET/audio/sfx/
chmod +x $TARGET/edits/stitch.sh
```

## NODE_PATH gotcha

`record-master.js` and `render-end-card.js` both `require('playwright')` and the
`create-imessage-mockup` renderer (`generate.js`). They expect Playwright from that skill's
`node_modules`. Point `MOCKUP_DIR` at wherever you fetched/installed `create-imessage-mockup`
(run `npm install` there first), then run from the ad folder with:

```bash
MOCKUP_DIR=<create-imessage-mockup-dir> \
  NODE_PATH=$MOCKUP_DIR/node_modules \
  node clips/record-master.js
```

(Or `npm install playwright` inside the ad folder if you want it self-contained — the templates resolve `playwright` via Node's normal module search either way.)

## Path assumptions inside the templates

The templates assume the standard output layout from `SKILL.md`:

```
<output>/
  threads/full-thread.json
  assets/<screenshot>.png
  audio/sfx/{imessage-send,imessage-receive}.mp3
  audio/music-bed.mp3
  clips/
    record-master.js
    end-card.html
    render-end-card.js
    master-chat.mp4         ← created by record-master.js
    master-chat.sfx.json    ← created by record-master.js
    end-card.png            ← created by render-end-card.js
    scene-09-endcard.mp4    ← created by render-end-card.js
  edits/
    stitch.sh
    master-final.mp4        ← created by stitch.sh
```

Deviate from this layout and you'll need to update the relative paths in all four scripts. Don't.
