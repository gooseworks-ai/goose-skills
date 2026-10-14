# Human version

Choose the voice and mouth route before making the performance. Keep a speaking
take's picture and audio linked, including under cutaways. No speech and no soundtrack
are separate choices. A model is usable only for the shot types actually qualified.

---

# Agent version

## Shared sound semantics

Use speech_mode: native_dialogue, audio_driven_lipsync, narration, singing, mixed or
none. Use soundtrack_modes: source_ambience, music, sfx or intentional_silence, with
timed cues and provenance. Mixed speech resolves each interval/speaker to its actual
mode. An explicitly present empty soundtrack_modes list means voice-only with no
additional soundtrack. A missing field remains unresolved. intentional_silence requires
speech_mode none for its resolved interval and a range/reason; it does not mean create an empty
AAC track and call music reviewed. These are shared contract semantics; map them to
the selected host's actual supported schema rather than invent wire fields.

Legacy audio_strategy remains a compatibility field, not the routing authority:
vo-narrator usually maps to narration but requires source inspection to distinguish
native speech; song-as-script maps to singing; hybrid maps to timed mixed speech;
silent means no speech only when the saved plan establishes it. Resolve soundtrack
separately. Empty ASR output cannot infer speech absence or total silence. Ambiguous
legacy records remain incomplete until reconciled; do not automatically strip sound.

| Visible performance and voice requirement | Route | Acceptance condition |
|---|---|---|
| Usable authorized recorded speech exists | Preserve recording | Check source picture/audio timing and full performance |
| Non-speaking picture needs explanation | External narration | Accept voice and measured speech before final scene timing |
| Generated creator speaks; voice flexible | Qualified native dialogue | Review first face/voice/performance; retain checked native audio |
| Speaking creator must use exact supplied audio | Qualified audio-driven lip-sync | Lock the exact driver, verify documented task and matched result |
| Speaking creator needs timbre/accent but no exact recording | Supported native voice-reference route, otherwise accepted external voice plus lip-sync | Audition actual voice; timbre conditioning is not waveform reuse |
| No speech wanted | Non-speaking picture | Choose ambience/music/SFX or intentional silence independently |
| Multiple speakers | Qualified dialogue/per-speaker route | Supported speaker control and correct voice-to-mouth assignment |

An unrelated narrator over speaking-looking footage is not a fallback. Do not switch
voices when B-roll begins. Native speech continues under the cutaway; return to the
face at the corresponding source position. External speech stays the same accepted
performance under both its lip-synced picture and non-speaking coverage.

## Source-linked editing and performance

Use the shared assembly_timeline, format gooseworks-assembly-timeline/1. Preserve
creative_contract_revision; stable scene IDs; destination intervals; source asset IDs,
checksums, in/out and speed; depicts_speech; native_audio preserve or muted; exact
speech_driver where required; audio_cues; and planned pauses. The runtime owner defines
the exact JSON shape. Keep speaking picture and its driver on linked clocks/rates;
document media time bases and codec latency. Matched source positions prevent edit
drift but cannot certify the generator's phonemes.

Before audio stripping or retiming, branch on the resolved speech route. Never drop
native dialogue, rearrange talking pictures and stretch complete voice files into
estimated slots. Changed exact driver audio requires renewed synchronization. An
explicit speed change transforms matched speaking picture/audio together, is heard
and watched afterward, and realigns captions; it is not a default pacing repair.

Write connected thoughts/exchanges, not spoken headings or bullet-point stamps.
Short natural replies remain valid. Caption chunks and scene boundaries do not split
the underlying thought. Ordinary UGC starts brisk and conversational; reference and
accepted performance resolve actual pace. Preserve intentional slower proof and pauses.
Prefer a suitable performance and tighter authorized words over automatic speed-up.

Keep exact words separate from energy/emotion/emphasis/pauses. Save pronunciations
for names, ingredients, numbers and abbreviations, with normal caption spelling.
Use only endpoint-supported markup/settings. Eleven v3/v4 tags are not H3 line syntax;
the current creator wrapper rejects square brackets in spoken lines and uses delivery.
Literal uh/laughter becomes content only when intended. Eleven v4 requires its own
documented controls, not inherited Style/Speed or SSML assumptions. Listen to the
whole audition, difficult words, every join and ending, isolated and mixed.

## Qualification by endpoint and shot type

Record model, endpoint/version, task, accepted source examples, input conditions,
critical failures and last actual review. Transport success, price and a routing row
do not qualify content. Repeated source-critical failures suspend that use until a
corrected representative take is reviewed. Diagnose editor damage separately.

| Existing route | Current restriction |
|---|---|
| Kling 2.5 Turbo generic B-roll | No automatic exact application/dispensing/stateful demo; simple non-speaking motion remains conditional on complete checks |
| Veed Fabric 1.0 | No automatic realistic close-up fallback; representative first take and full final lip-sync required |
| H3 Max creator | No unconditional exact-script default or unchecked batch; retain evaluated configurations with first-take acceptance, voice consistency and linked audio |
| Veo/Seedance complex actions | Representative action/product-fidelity qualification; no trusted default merely from this table |
| Grounded stills/cards/overlays | Valid for their own jobs; cannot substitute for unapproved motion/physical proof |
| Image-family substitution | Preserve selected family; a changed family needs applicable qualification and current ingredient authorization |
| ElevenLabs narration | Preserve accepted voice/settings and actual full listening/measured placement; no provider-wide defect inferred from bad editing |

Reuse the existing fetched H3 avatar builder's phone/studio capture branch and
accepted identity/output. Do not invent a second realism formula or silently switch
its image family. A still pass does not qualify animated gaze, expression or handling.
Use the package's actual delivery and reference schema. Voice-reference conditioning
is distinct from exact audio reuse.

## Selected new part interfaces

Use creator-h3@1.3.0 fields only with that version or a compatible newer contract.
Carry creative_contract_revision and capture phone_counter, phone_selfie or studio.
Its generation_stage first_take is the default and returns pending source. Only
remaining_takes may chain generation after accepted_sources includes the first take
with actual AV review, real word timing and the qualified model/shot record. assemble
uses all accepted sources without new generation. Never assert acceptance from ASR
or a returned URL alone, or send new fields to an older frozen version.

For voice-elevenlabs@1.2.0, selecting V4 requires current model_support evidence:
provider elevenlabs, exact model/endpoint, status verified, evidence and quote_id.
Resolve the real with-timestamps endpoint through the managed binding. Only supported
V4 controls apply. Tagged audio remains pending until independently reviewed word
alignment; tag-stripped planned text is not evidence of spoken words.

As of 14 October 2026, Eleven v4 (eleven_v4), Gemini Omni Flash
(gemini-omni-1.1-flash) and Seedance 2.5 are candidates, not promoted defaults.
Recheck the current managed endpoint/schema/pricing before a separately authorized
trial. Google's documented Omni limitations exclude uploaded audio references/voice
editing and ignore video-reference audio, so do not prescribe exact outside-audio
lip-sync through that route. Official identities/capabilities are not acceptance evidence.

Candidate source guides: [ElevenLabs models](https://elevenlabs.io/docs/overview/models),
[Google Omni](https://ai.google.dev/gemini-api/docs/omni.md),
[Seedance 2.5](https://seed.bytedance.com/en/seedance2_5).
Qualification requires actual AV perception, representative script/product/action,
attempt and rework records, and the current approved trial scope. A speech audition
does not qualify physical video; a good raw take does not clear an edited final.
