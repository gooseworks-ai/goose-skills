# Human version

**Summary.** New in 1.4.0: an optional `lead_s` puts that much silence before the first line and moves every speech, word and scene timing later by the same amount, so the picture can open clean and the captions still land on the voice. Narration now uses Eleven v4 by default. Every line reports how fast it was read, measured from the timestamps. Give `pace.target_wps` (usually the reference's rate) and a read more than 10 % slower than it is sped up, by at most 1.25x, before any lip-sync step. A lip-synced or native talking clip is never retimed. A tagged read without a reviewed alignment still returns the whole read as one pending, untimed track, and generated speech stays pending listening.

---

# Agent version

## Model and performance

`model` accepts `eleven_v4` (the default since 1.3.0), `eleven_v3`, `eleven_multilingual_v2` and `eleven_v4_turbo`. 1.2.x defaulted to `eleven_v3`; a plan that locked v3 must say `model: eleven_v3`. Do not silently change a locked model. V4 and V4 Turbo need no `model_support` evidence; an old `model_support` input is accepted and ignored.

V4 voice settings are `stability` and `similarity_boost` only. Style, Speed, speaker boost and SSML are refused, so a v3-era `voice_settings.style` now fails unless the plan names `eleven_v3`. V3/V4 accept bracketed delivery tags; v2 does not. V3 Speed is refused. Plain per-scene `performance_tags`, such as `content` or `curious`, compile only for a supported model and never appear in captions. Literal "uh" belongs in the approved line, not an automatic effect.

Use the approved voice ID from the existing voice/cast store, matched to the on-screen character (create-creator-takes-h3's `voice_pair` in `character.json`). Read confirmed brand pronunciations before spending; captions keep the written names.

## Measured pace and target_wps

Every timed read returns, from the provider (or reviewed) timestamps:

- `lines[].measured_words_per_second`: that line's heard words over its first word's start to its last word's end, before any tempo; `lines[].words_per_second` is the same after tempo.
- `measured_words_per_second`: the whole read's heard words over the lines' summed spans, before tempo. `words_per_second` stays check-layer's read_rate measure (written words over each scene's span), after tempo.

Words are counted the way goose-studio's `reference_rate.py` counts an ElevenLabs alignment: a run of characters between spaces that holds a letter or digit is one word (a lone dash or full stop is not), and it ends at its last letter or digit. Measure the reference with `reference_rate.py` too (it joins whisper's sub-word tokens and skips punctuation), so both sides count real words.
- `pace_report`: `target_wps`, `measured_wps`, `delivered_wps`, `tempo`, `tempo_applied`, `tempo_applied_before_lipsync: true` and a plain `note`.

`pace.target_wps` is the rate to aim for, normally the reference's words per second from `reference_rate.py`. When the read measures more than 10 % below it, the part applies `atempo = target / measured`, capped at 1.25 (or a lower `pace.max_tempo`), to the whole narration, and scales every timing, the track and each line file. A read still slow at the cap is returned with a `note` that says so: direct a faster read or cut words. A read within 10 % is left as performed. `target_wps` and `tempo` cannot both be given. `min_wps` / `max_wps` still check the paced read and never stretch it on their own.

The tempo happens here, on newly generated narration, before any lip-sync job. A lip-synced clip, or a native talking take's soundtrack, never enters this part and is never retimed. Listen again after any tempo change. A tagged read waiting for a reviewed alignment is not measured, so `pace_report.tempo_applied` is false until the run with `reviewed_alignments`.

## Lead-in (lead_s)

`lead_s` (seconds, 0 to 2, default 0) puts that much silence at the start of the voice track. Every timing this part returns moves later by the same amount: `speech[].start_s` and `end_s`, every word, `scenes[]` and `seconds`. The first scene still starts at 0, so the scenes tile the whole track and a picture step covers the lead-in with its first shot. Steps that time themselves from this part's `speech` (html-frames, captions-layer) stay in sync with no change of their own.

Use it when the first frame must be clean before the voice starts, for example a whiteboard that starts writing at once with the voice 0.4 s later. Do not also delay the voice in the mix (`audio-mix` `voice_start_s`): the silence is already in the track, and doing both delays the voice twice.

The silence is added locally, in whole samples at 48 kHz, after any tempo; nothing extra is ordered. The per-line files in `lines[]` stay as they were, each holding just its line. Rates and tempo are unchanged, since silence is not speech. `lead_s` counts toward `max_seconds`. A pending tagged read gets the same lead-in on its preview track. `provenance.lead_s` records it when it is above 0. With `lead_s` 0 or absent the output is byte for byte what 1.3.0 gave.

## Connected speech and honest timing

`join: sentence` is the default; `join: one` reads a same-voice script together. `gap_s` defaults to 0.08 and applies only between requests. Do not add silence merely to reach a planned scene length.

Tagged provider alignments can assign times to unspoken markup. A tagged request without a reviewed alignment returns pending audio of the whole read (every request in order, with the same `gap_s`), empty speech/scene timing and `timing_status: requires_reviewed_alignment`; do not use that preview as a finished narration track. `sources` and `source_files` preserve every actual request audio.

Supply `reviewed_alignments` by piece and source checksum, with actual full-file listening, reviewer, coverage, method (`forced_alignment` or `reviewed_transcription`) and character alignment of the tag-free spoken text. Missing or mismatched timing fails rather than inventing captions.

Provider timing is labeled as provider timing. It does not prove word correctness, tone, pronunciation or absence of unwanted sounds. All generated outputs retain `content_review_status: pending` until the separate listening review.

## Sources and release limits

Controls: [Eleven voice guide](https://elevenlabs.io/docs/eleven-creative/playground/text-to-speech), [audio tags](https://elevenlabs.io/docs/help-center/product/core-capabilities/text-to-speech/how-do-audio-tags-work-with-eleven-v3-and-v4), [timestamp endpoint](https://elevenlabs.io/docs/api-reference/text-to-speech/convert-with-timestamps). Static list prices are from [Eleven API pricing](https://elevenlabs.io/pricing/api), checked 2026-10-14; obtain the current managed quote in credits before spending.

Existing published bundles are unchanged. 1.4.0 passes the part lint and the part's own tests. No paid generation was run.
