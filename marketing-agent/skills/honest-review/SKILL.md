---
name: honest-review
description: >-
  Shared step of the marketing playbooks (make-static-ads, run-organic-social): how to review
  generated images and video honestly. Covers what was seen by eye versus read automatically, findings
  framed as things for the human to confirm, remakes only after a yes to the price, and at most two
  tries per item. Loaded by those playbooks; not for direct use.
version: 0.1.1
---

# honest-review

Used by: make-static-ads (its render-review step) and run-organic-social. The rubric — what to check — lives in each playbook; this atom is how to check and how to report.

## 1. Know what you can perceive

| You can | How | Say |
|---|---|---|
| See images | The host shows them, or a shell host downloads the file and opens it | "checked by eye" |
| Read an automatic description | `gooseworks:media_analyze` on the asset (description, visible text, for video a word-timed transcript and sampled shots) | "the automatic read shows…" |
| Watch motion or hear audio | Almost never — a transcript and sampled frames are not watching | never claim it |

Decide the mode at the start and label every item with how it was checked. Never present the engine's own "passed" or "checked" as your review.

## 2. Compare against the truth, not against expectations

- Product: the brand's real product photos (curated — never an earlier generated image as the reference).
- Words: the approved text (script, the image brief's exact on-image text, on-image copy) word for word.
- Claims: the signed claims; anything drawn or spoken that is not on the approved text is a finding.
- When you cannot see: compare the automatic read of the output with the automatic read of the reference **on named fields** — part or item count, readable label or on-screen text, colour words, which product is in which scene — and report each mismatch specifically ("the reference reads 'DIVE DEEP' on the label; the output read shows 'DIVE DEEEP'").

## 3. Report findings honestly

- Each finding: what, where (region, scene, time), how it was found. From an automatic read: "the automatic read shows X at <place> — please confirm". Text absent from sampled frames is "not seen", never "missing"; a transcript difference may be the speech-to-text.
- Items not checked by eye get a three-item checklist for the human, specific to that item ("zoom on the logo; count the lid loops; does the green match your Sage?").
- Never call generated media "ready" on automatic reads alone — "ready for your look" / "ready for your watch-through".
- Say plainly what only the human can judge (taste, motion, voice, pacing, music, overall feel).

## 4. Remakes

- Only for a defect that is real (seen by eye, or confirmed by the human).
- Only on a yes to the engine's quote for that remake, shown as given; never an unquoted paid edit, never your own price.
- At most two tries per item; then drop it (or hand the choice to the human) and say why.
- Changed words or claims in a remake are shown before it is made, even when an earlier yes covers the money.

## 5. Record

- Feedback to the engine (where the tool takes it): negative ratings and reason codes only for engine faults (garbled text, wrong product, distortion); strategy choices go in the comment.
- A durable lesson the human states becomes a brand rule only through the `save-learning` skill (`../save-learning/SKILL.md`).
