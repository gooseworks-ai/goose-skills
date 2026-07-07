---
name: render-imessage-cascade
description: Assemble an iMessage notification-cascade video ad (≈14s, 9:16) from a phone-on-desk plate + 3–5 messages — authentic Apple Messages banners composited in PIL (SF Pro text, green Messages icon, warm translucent-greige fill, soft shadow) spring in one-by-one at the BOTTOM and push the stack UP, a right-aligned Show-less/X pill rides above, the X clears the stack, then a serif end card resolves. FREE assembly (PIL + ffmpeg); the recipe supplies the per-brand plate, notifications, and end-card config and gates the paid plate-clean/music calls to their own capabilities. Use for the imessage-notification-cascade format.
status: active
---

# render-imessage-cascade

The free, deterministic renderer for the **imessage-notification-cascade** video ad
format — the viral iOS trend where a phone sits on a desk and Apple Messages
notifications STACK IN one after another. The signature mechanic is the **bottom-up
push**: each new banner springs in at the bottom (nearest the phone) and shoves every
existing one UP a row; the iOS grouped "⌄ Show less / ✕" pill rides above the stack;
the ✕ clears the stack; then a serif end card resolves.

This is a DETERMINISTIC composite — **no generative video of the UI**. Authentic
iMessage banners are drawn in PIL and animated in FFmpeg over a Ken-Burns plate, so
the notification text + wordmark stay pixel-crisp (a video model would smear type).
The template recipe supplies the per-brand `plate`, `notifications`, and `end_card`
config and gates the only paid steps — cleaning the plate (→ `create-image-fal`) and
the music bed/pop (→ `create-music-elevenlabs`) — to their own capabilities. This
capability itself makes **no paid calls**.

## Scripts (free)

- `scripts/build_assets.py` — draws the assets from `config`: `nb-1..N.png` (authentic
  banners — green Messages icon, warm translucent-greige fill, soft box-shadow,
  title/body/NOW/handle), `pill.png` (right-aligned "⌄ Show less / ✕"), `endcard.png`
  (serif CTA + wordmark lockup + url). **Fonts are load-bearing: SF Pro (`SFNS.ttf`)
  via `set_variation_by_name` for the banner title/body/NOW/handle** (Arial fallback),
  Times/serif for the end-card CTA. Do NOT swap in Helvetica/Arial as the primary —
  the banners must read as the real iOS system font.
- `scripts/compose.py` — Ken-Burns push-in on the plate → each banner springs in at the
  BOTTOM while later arrivals push the stack UP (FFmpeg overlay `y` expressions) → pill
  rides above → ✕-clear swipes the stack up + fades → serif end card fades in → optional
  audio (bed + pop per arrival + a free FFmpeg swoosh on the clear) → encode h264 + aac.
- `scripts/config.example.json` — the shape of the brand `config` the recipe binds.

## Geometry contract (load-bearing — build_assets.py and compose.py MUST share it)

`W=1080 H=1920`, `SIDE=135` → banner width `BODY_W=810`, `BANNER_H=176`, `PAD=60`,
row pitch `H=214`, bottom anchor `YB=1200`. Icon ~100px at a ~24px left inset; body
text starts ~150px from the banner's left edge. Change one, change both.

## Craft rules (faithful to the source molecule)

- Keep the REAL iMessage UI: green Apple Messages icon, warm TRANSLUCENT greige banner
  (NOT white, no white bloom), soft dark box-shadow. Do NOT rebrand the banner to the
  brand's colors — the brand lives ONLY on the handle (bottom-right) + the end card.
- **SF Pro for all banner text** (title Semibold ~38, body Regular ~36, NOW/handle ~25).
  Never AI-render text.
- 3–5 notifications (more crowds the top / clips the pill); newest enters at the BOTTOM,
  so banner 1 is the oldest and ends up on TOP.
- ✕-clear then end card (a real hand-swipe needs a paid i2v — out of scope here).

## Requires

`watch` (QC the final master). The recipe gates `create-image-fal` (plate clean) and
`create-music-elevenlabs` (bed/pop) — both paid, proxy-routed, billed to the Ads agent.
