# Human version

**Summary.** Narration uses a connected sentence read by default, with a short gap only between separate requests. Eleven v4 and v4 Turbo are generally available and selectable like any listed model. A tagged read without a reviewed alignment returns the whole read as one pending, untimed track. Delivery tags remain model-specific, and generated speech stays pending listening.

---

# Agent version

## Model and performance

`model` accepts `eleven_v3` (default), `eleven_multilingual_v2`, `eleven_v4` and `eleven_v4_turbo`. Since 1.2.1 V4 and V4 Turbo need no `model_support` evidence: both are generally available. An old `model_support` input is accepted and ignored. Do not silently change a locked model.

V4 voice settings are `stability` and `similarity_boost` only. Style, Speed, speaker boost and SSML are refused. V3/V4 accept bracketed delivery tags; v2 does not. V3 Speed is refused. Plain per-scene `performance_tags`, such as `content` or `curious`, compile only for a supported model and never appear in captions. Natural-language tags guide performance; they do not guarantee it. Literal “uh” belongs in the approved line, not an automatic effect.

Use the approved voice ID and audition from the existing voice/cast store. Match accent, identity and intended delivery. Read confirmed brand pronunciations before spending, using the existing pronunciation map; retain written names in captions.

## Connected speech and honest timing

`join: sentence` is the default; `join: one` reads a same-voice script together. `gap_s` defaults to 0.08 and applies only between requests. Do not add silence merely to reach a planned scene length.

Rate bounds check the original read. Automatic tempo fitting was removed. An explicit `pace.tempo` affects newly generated narration before any lip-sync job; do not feed native source dialogue into this part for independent retiming. Listen again after a deliberate tempo change.

Tagged provider alignments can assign times to unspoken markup. A tagged request without a reviewed alignment returns pending audio of the whole read (every request in order, with the same `gap_s`), empty speech/scene timing and `timing_status: requires_reviewed_alignment`; do not use that preview as a finished narration track. 1.2.0 returned only the first request's audio here, which is why it is withdrawn. `sources` and `source_files` preserve every actual request audio.

Supply `reviewed_alignments` by piece and source checksum, with actual full-file listening, reviewer, coverage, method (`forced_alignment` or `reviewed_transcription`) and character alignment of the tag-free spoken text. Reusing the same provider requests permits timing completion without authorizing another generation. Missing or mismatched timing fails rather than inventing captions.

Provider timing is labeled as provider timing. It does not prove word correctness, tone, pronunciation or absence of unwanted sounds. All generated outputs retain `content_review_status: pending` until the separate listening review.

## Sources and release limits

Controls: [Eleven voice guide](https://elevenlabs.io/docs/eleven-creative/playground/text-to-speech), [audio tags](https://elevenlabs.io/docs/help-center/product/core-capabilities/text-to-speech/how-do-audio-tags-work-with-eleven-v3-and-v4), [timestamp endpoint](https://elevenlabs.io/docs/api-reference/text-to-speech/convert-with-timestamps). Static list prices are from [Eleven API pricing](https://elevenlabs.io/pricing/api), checked 2026-10-14; obtain the current managed quote in credits before spending.

Existing published bundles are unchanged. 1.2.1 passes the part lint (every request's `model_id` is a listed model constant) and the part's own tests. No paid generation was run.
