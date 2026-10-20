---
name: make-content-two-pass-edit
description: >-
  Edits an existing draft in order: a substance pass (arguable thesis, swap test, fakes removed, CTA
  fit), a claims and fact check that cuts or softens unproven lines, a readability and voice-match
  pass, then an AI-tell sweep, with an edit note listing open gaps. Use alone when you already have a
  finished draft and the brand's voice samples and approved claims; otherwise run make-content.
version: 0.1.0
---

# Edit, check, edit

Run on every fresh draft, refresh redline and repurposed set. The full checklists are in `../make-content/references/editing.md`.

1. **Substance pass.** Write four answers into the edit note:
   - the thesis in one arguable sentence;
   - the swap test (pass, or what fails);
   - the fakes removed;
   - whether the CTA matches the intent.

   Run the rest of Pass 1 (so-what, proof density, skeptic, order, hedging) as checks. Fix what fails without writing it up.
2. **Claims check:** the shared claims gate (the `claims-gate` skill, `../claims-gate/SKILL.md`) for brand claims, plus `../make-content/references/fact-rules.md` for world facts, competitor facts, stories, sensitive topics and third-party rights. When the piece is sponsored, affiliate, gifted or a creator collaboration, also load `../ad-policy-check/disclosure.md` (in the `ad-policy-check` skill) and apply it (disclosure in the piece itself, before "more"). It cuts and softens lines, which leaves gaps.
3. **Readability pass** on the post-cut text: smooth the gaps, headline, lede, H2s as claims, scannability, ending. Then **voice match** against the best voice sample available, in this order:
   1. the named author's voice card (bylined pieces);
   2. the kit's voice example lines;
   3. the brand's own post captions (`brand_read organic`);
   4. "From the site" lines in product notes;
   5. three lines the human pastes on request.

   If none exist, write "voice unmatched: no real samples" in the note and keep the copy plain rather than guessing at personality.
4. **AI-tell check** (mechanical) on the final text. Anything the brand's real writing uses stays; with no real samples, everything on the list goes.

## Edit note (attached to the piece)

```
Edit note — <title>
Thesis: … · Swap test: pass | fails because … → fixed by … | still fails (see top) · Fakes removed: … · CTA fits intent: yes/no
Voice matched against: <source> | voice unmatched
AI-tells removed: <list with counts>
Open gaps: [PROOF NEEDED …] [STORY NEEDED …] [FOUNDER: …] [CUSTOMER APPROVAL NEEDED …]
```

**If the swap test still fails** after the substance pass (no brand-specific proof or POV exists), the piece can still be delivered, but the first line must say "Generic: no brand-specific proof or POV available. This would fix it: …". Never hide it. If most of the piece would be gaps, the proof gate in SKILL.md step 4 applies: stop at the brief.
