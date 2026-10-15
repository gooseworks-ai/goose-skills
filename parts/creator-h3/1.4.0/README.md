# Human version

**Summary.** 1.4.0 restores the realism defaults and the shared feature names. Without a stated capture, a take is an ordinary phone recording in a real lived-in room, with deep focus, no bokeh and no retouching. Studio capture and shallow focus happen only when the approved brief explicitly chooses them. Takes are at most 15 s and never planned faster than 3.2 words a second.

H3 production starts with one take. The remaining takes wait for a review of its actual picture and sound. Assembly accepts only reviewed sources with actual word timings, keeps native audio attached to its picture, and leaves the finished edit pending a separate review.

A sharper face, a transcript match or a working video file cannot establish natural acting, correct actions or lip-sync.

---

# Agent version

## Review and resume

Default `generation_stage: reviewed_pipeline` reads accepted source evidence injected by the kit from `final/source-reviews.json`, keyed by step. With no accepted t1 it requests the first trial; with an accepted t1 it produces remaining candidates; with all accepted sources it assembles. `review_request` contains source checksums, exact next-stage qualification fingerprint, expected spoken words and required coverage/checks. The agent records actual review after playback and listening; this is the existing ingredient review, not a third owner approval.

The frozen script, capture, model, references and maximum spend do not change. The review revision changes the step cache, while identical provider bodies retain their paid piece cache. A script, anchor, seed, model or delivery change is a new production input and follows the normal approved change/cost flow. Do not manually replace the frozen style to resume review.

## Three stages

1. `generation_stage: first_take` (explicit trial): generate only `t1`. Return its raw FileRef, `script_sha256` and pending review. This is a qualification trial, not an approved batch.
2. `remaining_takes`: supply `accepted_sources` for the first take and a qualification for `fal` + `minimax/h3-max/reference-to-video` + `talking_creator`. Generate remaining candidates, retaining their raw files and pending reviews. First-take audio conditions voice/timbre; it is not exact audio reuse or proof that later voices match.
3. `assemble`: supply every accepted source. This stage makes no provider generation calls. Every review binds actual source/script checksums, the actual reviewer, complete video playback and listening, and passing script, voice, lip-sync, identity, framing, performance and product/action checks. Failed or incomplete sources are excluded.

Qualification binds the exact configuration checksum returned with the first source and its actual accepted SHA. It cannot borrow a passing unrelated example. Capture, reference bytes, voice-conditioning source, templates, dialogue, seeds, durations and provider settings are part of that fingerprint.

Each `accepted_sources` entry has `id`, `video`, `review`, `timing_method` and `words`. Words are `{scene_id,text,start_s,end_s}` in source seconds. `timing_method` is `reviewed_transcription` or `forced_alignment`; a silence envelope is an energy estimate, not word timing. Resolve extra, repeated or missing speech against actual listening before submitting an accepted entry.

## Capture, focus and limits (1.4.0)

- `capture` defaults to `phone_counter` (`phone_selfie` when `character.recording` is `selfie`; `studio` only when `character.capture` is `studio`). Phone captures keep the real lived-in room from the anchor, never a plain backdrop or white void.
- `focus` defaults to `deep`: everything sharp, no bokeh, no portrait-mode blur. `shallow` only when the approved reference is shot that way.
- Every take asks for real skin: no retouching, no skin smoothing, no beauty filter, no cinematic grade.
- Distinctive marks only when the user chose them (`make_character.py --marks ... --marks-approved`); never random scars or flaws.
- **H3 limits:** a take is at most 15 s (about 14.2 s of speech plus a 0.6 s tail); takes split only between lines; plans never run faster than 3.2 words a second (H3 was heard at 2.3 to 3.2).
- For a talking face across several clips, the default route is voice first (`voice-elevenlabs`) then a per-line lip-sync, one line per clip. Native H3 dialogue is for a single take of 15 s or less.

## Required features

`required_features` uses the shared vocabulary: `speaking_face, product, scale, hands, application, dispensing, pour, physical_demo, readable_text` (at most 12). Any product action (`application, dispensing, pour, physical_demo, hands`) needs a passing `product_action` review; `not_applicable` is refused. The 1.3.x names are read as aliases: `product_action`, `physical_action` and `stateful_demo` mean `physical_demo`; `precise_product_action` means `application`.

## Make the anchor

Use the shared `make_character.py` builder (GPT Image 2, phone capture, deep focus). Six historical H3 Max trials failed eye contact/set consistency; sharper faces did not clear those failures. This route remains controlled by actual acceptance.

## Speech and provenance

Keep wanted filler words such as “uh” in the approved spoken copy. Performance directions stay outside `<d>`; automatic `<inhale>` and `<pause>` insertions were removed. Local angle-tag experiments do not constitute a portable provider schema. Confirm pronunciations through the existing brand-facts flow; captions retain written names.

Native picture and sound share source trims and speed 1. Short matched head/tail holds and dissolves are declared in provenance and `assembly_timeline`. Never independently stretch, reorder or replace the soundtrack of a speaking face. `source_files` registers the actual source FileRefs; paths alone are insufficient evidence.

`creative_contract_revision` binds the out-of-band assembly record to the approved contract. `timeline` retains its legacy shape. `assembly_timeline` uses `gooseworks-assembly-timeline/1`, including source clocks, native cues and declared visual overrides. The completed export still has `content_review_status: pending`; source reviews do not certify a new edit.

This release supports talking creators only. It refuses clips mode; use a separately qualified non-speaking route and review its sources. Older immutable releases keep their interfaces.

## Release notes

Version 1.4.0: phone capture and deep focus defaults with the realism directions restored in the take prompt, the `focus` input, and the shared `required_features` vocabulary with aliases. The prompt template, capture and focus texts match `create-creator-takes-h3/scripts/plan_takes.py` word for word (a test checks it). Includes 1.3.1's freeze lineage. Older published bundles are unchanged. This release declares no cross-version piece reuse: the prompt changed. The part's tests cover the reviewed pipeline, the defaults and the vocabulary; no paid generation was run. Keep staging styles on 1.2.3 until the app's creative-contract revision (gooseworks-app #2048) is deployed.
