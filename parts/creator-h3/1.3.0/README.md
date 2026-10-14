# Human version

**Summary.** H3 production now starts with one take. The remaining takes wait for a review of its actual picture and sound. Assembly accepts only reviewed sources with actual word timings, keeps native audio attached to its picture, and leaves the finished edit pending a separate review.

Phone and studio capture are explicit choices. A sharper face, a transcript match or a working video file cannot establish natural acting, correct actions or lip-sync.

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

`capture` is `phone_counter`, `phone_selfie` or `studio`, from the approved brief. Use the existing shared `make_character.py` builder. No random scars or distinctive marks. Background focus follows the approved reference. Six historical H3 Max trials failed eye contact/set consistency; sharper faces did not clear those failures. This route remains controlled by actual acceptance.

## Speech and provenance

Keep wanted filler words such as “uh” in the approved spoken copy. Performance directions stay outside `<d>`; automatic `<inhale>` and `<pause>` insertions were removed. Local angle-tag experiments do not constitute a portable provider schema. Confirm pronunciations through the existing brand-facts flow; captions retain written names.

Native picture and sound share source trims and speed 1. Short matched head/tail holds and dissolves are declared in provenance and `assembly_timeline`. Never independently stretch, reorder or replace the soundtrack of a speaking face. `source_files` registers the actual source FileRefs; paths alone are insufficient evidence.

`creative_contract_revision` binds the out-of-band assembly record to the approved contract. `timeline` retains its legacy shape. `assembly_timeline` uses `gooseworks-assembly-timeline/1`, including source clocks, native cues and declared visual overrides. The completed export still has `content_review_status: pending`; source reviews do not certify a new edit.

This release supports talking creators only. It refuses clips mode; use a separately qualified non-speaking route and review its sources. Older immutable releases keep their interfaces.

## Release notes

Existing 1.2.3 and older bundles are unchanged. This version changes provider payloads and production gates and declares no cross-version piece reuse. Quote the selected stage through the attributed host; the static manifest budget is an upper bound, not a fresh credit quote.

Packaging only was performed for this change. No tests, lint, validators, type checks, media generation or benchmarks were run, as requested.
