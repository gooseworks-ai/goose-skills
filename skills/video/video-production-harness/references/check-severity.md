# Human version

**Quality checks warn and never block.** Each finding gets a severity, and the severity sets what happens:

- **must_fix** is always redone and never delivered.
- **ask** is shown to the customer with what a re-make costs.
- **fine** is kept and not mentioned.

When the customer says "just make it" (`review_mode: auto`), the agent decides the `ask` items itself and delivers the video without stopping. Only money, consent, safety and broken files stay hard. The customer pays for a redo: it comes out of the approved total when it fits; otherwise they give a new yes to its price. A scene is never dropped.

---

# Agent version

Rules decided by Akhil on 16 Oct 2026. Every check in this harness uses this grade, and so do the host's own checks.

## The three grades

| Severity | What it covers | What you do |
|---|---|---|
| **must_fix** | **Hallucinations:** invented objects, people or text. **Misspelled brand or product text:** a wrong label or logo, or a blank, unprinted or back-facing pack. **Wrong product shape or parts:** extra or missing parts, the wrong size or scale. **Impossible or unnatural scenes and poses:** physics breaks, such as a label upright on an upside-down bottle or a leg through a spa; an unnatural action or pose. **Warped anatomy:** an extra or missing hand or finger, a hand without a body, a warped or stretched face. Also: lost or changed script words (brand names above all); cut first or last words; digital silence or a tone where sound is planned; a planned speaking face without matched native or audio-driven speech; a voice of the opposite gender; a different person between scenes. | Redo it, never deliver it, and tell the customer in one line. This holds in both review modes. |
| **ask** | Unwanted artificial appearance relative to the approved look (for phone footage: waxy skin, studio blur or a showroom set); noticeable product drift; off the reference (people, action, sound type, camera, length); a promised inset or overlay missing on the final; wardrobe or setting that doesn't fit; an age gap in the voice; unknown product size; extra speech; a gap inside a sentence; unplanned silence; a frozen picture; a repeated shot; a planned freeze too long; crop zoom over the limit; a weak hook (below 7); a world break between scenes; a score of 2 or less with no named defect. | `review_mode: ask`: show it with one plain reason and the price of the fix, and let the customer choose. `review_mode: auto`: decide it yourself. When the fix is free (a re-mix, a re-assembly, a caption retime), just make it in either mode. |
| **fine** | Slightly AI-looking; small flaws a viewer won't notice; a planned pause a little long; speech rate or setup count against the reference; staged-look words in a prompt; minor taste. | Keep it. Don't mention it unless asked. |

When a finding fits two rows, the higher one wins. One check can grade differently by stage: fewer shots or setups than the reference is `ask` at the storyboard (adding shots is cheap before any clip) and `fine` on the final. When you aren't sure whether a defect is must_fix, look again at full resolution. Grade what you can point to at a timecode, never a hunch.

## Review mode

- `review_mode` is the customer's choice for the whole project: `ask` (the default) or `auto`. Set `auto` when they say "just make it", "don't ask me" or the like, and record their words. On GooseWorks the host stores it ([capabilities](../capabilities.md)).
- **`ask`:** the two owner approvals (script, ingredients) and every `ask` finding that costs credits wait for the customer.
- **`auto`:** go end to end. Get one yes up front to the full total (the script approval's total, which covers the clips). Then don't wait at the ingredient gate: when its total is still inside that yes, record the ingredient approval with the customer's "just make it" words and that total (on GooseWorks the host records it itself), show the ingredients as information, and go on. Redo `must_fix` items. Decide each `ask` item yourself: redo it when the fix fits the approved total and will clearly help, otherwise keep it. Never stop for a quality approval. At delivery, list in one line each what you fixed and what you kept.
- **Money holds in both modes.** Nothing is charged without the customer's yes to a total, and nothing goes past the approved total. In `auto`, a new or higher total still stops for a new yes; that is the only stop.

## Redo rules

- **Redo only must_fix,** plus the `ask` items the customer picks (or that you pick in `auto`). Never redo a `fine` item.
- **Redo the smallest piece that fixes it,** on the cheapest layer that can ([shot routing](shot-routing.md)): an edit or re-assembly before a new still, and a new still before a new clip.
- **Never drop a scene.** If a redo still has a must_fix, keep the best take, flagged, and tell the customer. They can pay for another redo or say "keep it anyway" (Akhil, 16 Oct: a video with an open must_fix is saved as needing a fix, and sharing or pinning it as final needs the fix or the customer's "keep anyway"). You never deliver a must_fix on your own, in either mode; only the customer's own words, recorded, release it.
- **The customer pays for a redo.** First price it with the free price check (`data_price_provider` on GooseWorks), exactly as you will send it.
  - **It fits** when what is already charged plus this price stays inside the approved total. Make it, paid from that total, and tell them in one line.
  - **It doesn't fit:** ask for a new yes, showing the price and the new total. Don't make it before they say yes.
  - Never absorb a redo cost, and never go past the approved total without a yes. A host refusal on budget (`custom_video_budget_exceeded`, with the call's price in `this_call_credits`) means it didn't fit: ask.
- **A voice that differs in heritage or accent** is never a reason to change the person. Voice Design stays the first choice; the closest listed voice is used when Voice Design can't run or the customer picks it (it's free), and you tell them in one line.

## What stays hard

These are the only things that stop the run or refuse an approval:

1. **Money and consent:** the customer's yes to a credit total, the approved total and its band, the host's cap, and the wallet and plan.
2. **Safety and legal:** provider safety refusals, and rights to references and excerpts.
3. **Broken data:** missing or unowned files, broken media, missing authentication, and a final that can't be played, has the wrong length, or has no sound when sound is planned (`../scripts/qc_evidence.py` exits 1 only for these).

Everything else is a finding with a severity. A quality finding never blocks a save, an approval or completion; it is fixed, asked about or kept as above.

## Where findings come from

- **The host's checks.** On GooseWorks: the person-still grade at each draft save (`person_stills`), `clip_check` on each clip (`clip_checks[].severity` when the host grades it), the voice check in the ingredient phases (`voice_findings`: a wrong-gender voice is `must_fix` and is re-paired, an age gap is `ask`), and the final check on complete. Read their findings and act on each by its severity; don't re-run them with your own paid vision calls.
- **Your own inspection.** Extract frames with FFmpeg at full resolution and look. A defect you can point to at a timecode gets graded by the table above.
- **`../scripts/qc_evidence.py`.** It reports every final measurement with its severity in `findings` and exits 1 only for a broken file.
- **Never send finished videos or frames to a vision model yourself** (no direct fal calls with a local key). Mark the video complete and read the host's final check.

## On GooseWorks

- **Review mode:** `video_change` custom `review_mode {mode: "ask" | "auto", user_quote}` with `expected_revision` (the owner only; `video_create` has no field for it). In `auto` the host records the ingredient approval itself when its total is inside the script yes; above that it asks.
- **Completion:** `video_make` custom `{render_id, status: "complete", output_url}` waits about 20 s for the final check. `custom_video_final_checking` means send the same call again after `retry_after_s`. Only integrity is refused (`custom_video_final_check_failed`, `custom_video_production_required`, `custom_video_output_required`). `video_read` `final_findings {render_id, quality_status, findings}` lists the `must_fix` and `ask` findings (`severity`, `line`, `fix`, `fix_credits`); `quality_status` is `passed` or `needs_fix`. The completion preflight (`video_read` include `blockers`) lists them as `custom_video_finding_<code>`, never as blockers.
- **Keep anyway:** only on the customer's own words, `video_make` custom `{render_id, accept_findings: {user_quote}, pin: true}` with `expected_revision`. Until then pinning is refused `custom_video_needs_fix` and sharing `needs_fix`.
- Clip `checks`, clip and final `content_review`, and `quality_report` are optional notes, never required.

## Review notes and P-levels

The notes file keeps the `## P0`, `## P1` and `## P2` headings that [auto-fix-from-review-notes](../auto-fix-from-review-notes.md) parses. **P0 holds must_fix items, P1 ask items, and P2 fine items.** Something that blocked as "P0" before but isn't on the must_fix list is an `ask` item now (a reference mismatch, a missing overlay, a world break or a weak hook).

## Customer wording

One plain line per finding, with what it costs to fix. For example:

- must_fix: "Scene 3's hand had an extra finger, so I re-made it (from your approved total)."
- ask: "The presenter looks a bit AI-made. Re-make her? About 8 credits."
- A redo that doesn't fit: "Re-making scene 2 costs 42 credits, which takes the total from 540 to 582. OK?"

Never mention tools, models or check names to the customer.
