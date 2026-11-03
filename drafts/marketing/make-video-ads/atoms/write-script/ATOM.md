---
name: write-script
description: Internal step of make-video-ads. Writes 4–5 whole candidate scripts for one committed angle inside the chosen style's plan — same angle type, different hook families, lead first — checks them before saving, saves them, and keeps the checked lead.
---

# write-script

**Reads:** the angle record (Step 3), the style's `plan_limits` and plan note (from `gooseworks:video_create`), the template details (`gooseworks:catalog_fetch` `type: "template"`) when length or ratio matter, the voice-of-customer rows and signed claims (`references/reading-the-brain.md`), brand voice and video learnings, `references/script-craft.md`, `references/excellent-script-example.md`.
**Writes:** the plan via `gooseworks:video_change` (free; `expected_revision` when asked).

1. **Fit the style.** Scenes, speakers, products, word limits, `extra` fields, picture tags, banned phrases, the length range it actually makes, whether it renders persistent on-screen text (a dramatisation label needs it). Set the style's `answers` deliberately — leave tagline and offer empty unless signed or a plain fact. Pick the voice for the audience (`video_formats` `show: "voices"`) when the style takes one. Write inside them.
2. **Mine the sources** for this angle: the pain moment in the customer's words (row ids), the objection, the switching story — or the labelled brand source. These supply texture and the hook, never the benefit.
3. **Hooks:** 4–5 from different hook families; pick the lead by fit with the account.
4. **Lead script** on the beat table for the length; each scene's `line`, `on_screen` (≤ 8 words), `picture` (including which real image is used — a clean packshot), `speaker` (a cast key) where the style has people. Spoken words ≤ ~2.5 per second; product in frame by ~3s; the story reads with the sound off.
5. **Candidates:** 4–5 whole scripts, the lead first, all the committed `angle_type`, each with its own `hook_family` and `brief_field`. Two that say the same thing will be refused (`candidates_too_similar`); if same-type candidates are refused, send the committed angle as the lead and the rest as other angle types, still checked.
6. **Check before saving:** run `atoms/script-check` on every candidate; fix or drop the ones that fail.
7. **Save** with `video_change` (`candidates`, the music mood the style needs, the video `name`). Custom: one timed draft as the server's next step directs.
8. **Keep the checked lead:** read back once as the answer says (the judge takes up to ~90 seconds) and diff the shown words against your checked lead; if it picked another script or rewrote yours, swap your checked lead back (`use_candidate` or whole `scenes`) unless the marketer prefers the judge's — then script-check it and re-set the `name` if the angle or hook family changed. Engine advice that breaks policy is ignored and named at the gate.
