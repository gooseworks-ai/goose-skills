# Smoke Test

Given one native talking-head clip per beat (voice + lips generated together — no separate VO), the
brand's real UGC PiP clips, the real product photos, and the brand palette,
`render-creator-pip-listicle` assembles the master: build the Ken-Burns product macros + product
cards, cut each product beat into two shots (creator + PiP top-right + card, then a full-frame
product cutaway), mux the creator beat's native audio continuous under both shots, hard-concat all
beats @ 30fps, and burn the captions last → 1080×1920 h264+aac (~46s).

Pass when the assembly runs to a valid MP4 and:
- structure is a hook → N product beats → CTA; every product beat is cut into two shots
  (creator+PiP+card, then a full-frame product cutaway), hard-concat on the cut;
- the real UGC PiP sits top-right with a hairline border and is **MUTED**; the product card is
  pinned bottom and legible; a counting rank badge rides the PiP on product beats; the title pill is
  present only on beats with `show_title`;
- the creator's native audio is continuous under both shots of each beat — the sung/spoken voice is
  the entire audio (no separate VO); the same creator face holds across every beat;
- captions are white 2-ish-word chunks in the lower third with the brand accent, brand tokens
  spelled correctly;
- the products are the REAL product photos / real UGC — never AI-regenerated (no mangled labels);
- **no paid call is made in the composite/stitch stage** — the creator anchor and the N native
  clips come from the paid capabilities (create-image-gpt-image-fal / create-video-fal); this
  assembly is $0 except the optional ~$1 caption burn, and a re-cut reuses the existing native clips
  + overlays.
