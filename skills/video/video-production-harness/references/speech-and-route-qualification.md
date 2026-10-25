# Human version

Choose the voice and mouth route before making the performance. Keep a speaking
take's picture and audio linked, even under cutaways. A model is usable only for
the shot types it qualified on.

---

# Agent version

## Shared sound semantics

speech_mode is native_dialogue, audio_driven_lipsync, narration, singing, mixed or
none. soundtrack_modes is source_ambience, music, sfx or intentional_silence, with
timed cues. An empty list means voice only; a missing field is unresolved.
intentional_silence needs speech_mode none plus a range and reason, never an empty
AAC track called music.

Legacy audio_strategy is compatibility only (vo-narrator → narration after checking
for native speech, song-as-script → singing, hybrid → mixed); ambiguous records stay
incomplete, and empty ASR output never proves silence.

| Visible performance and voice requirement | Route | Standard / Best | Acceptance condition |
|---|---|---|---|
| Usable authorized recorded speech exists | Preserve recording | same | Check source picture/audio timing and full performance |
| Non-speaking picture needs explanation | External narration | same voice (ElevenLabs v4); picture per [shot routing](shot-routing.md) | Accept voice and measured speech before final scene timing |
| Generated creator must use the exact approved audio across clips | Voice first: `exact_audio_lipsync`, final ElevenLabs line then one lip-sync per line, one line per clip | Fabric **480p** / **720p** | Accept every line before lip-sync; each clip within 0.5 s of its line |
| Generated creator speaks in one take of 15 s or less | `qualified_native` H3 | not in a tier quote (it prices talking as Fabric): ask the owner first | At most 3.2 words/s; cut only between sentences; never retimed; review the take's face, voice and words |
| Speaking creator must use exact supplied audio | Qualified audio-driven lip-sync | Fabric 480p / 720p | Lock the exact driver, verify documented task and matched result |
| Realistic speaking creator needs timbre/accent but no exact recording | Prefer qualified joint voice-and-picture generation with the approved voice as reference; otherwise propose accepted external voice plus lip-sync | Quote the actual route; Fabric's tier price does not cover H3 | Play the audition; compare the generated voice, words and performance; timbre conditioning is not waveform reuse |
| No speech wanted | Non-speaking picture | H3 768P / 768P; Seedance 720p (no face) or any 1080p only with the customer's new yes | Choose ambience/music/SFX or intentional silence independently |
| Multiple speakers | Qualified dialogue/per-speaker route | not in a tier quote (it prices talking as Fabric): ask the owner first | Supported speaker control and correct voice-to-mouth assignment |

**Quality tier.** The customer's Standard or Best (`quality_tier`) sets the column above; the
lip-sync model is the same at both, only the resolution changes. A talking shot that fails its
check at 480p is retried at 480p after a prompt or still fix; moving it to 720p is a video upgrade,
so it needs the customer's new yes to its price ([quality tier](quality-tier.md)). Record the
one-line reason with the failed attempt. Choose the resolution before the first
lip-sync or take: switching re-rolls it.

For realistic on-camera speech, read [talking-actor production](talking-actor.md) before selecting either route. Its audition and first-take checks apply inside the existing gates. Longer mixed-format videos can contain several short qualified native takes; preserve voice consistency and linked clocks across them. The kit's unconditioned single-take H3 interface retains its limits below. Do not claim audio-reference support in a part that lacks those inputs.

## Lip-sync only for a speaking face

1. Lip-sync (`veed/fabric-1.0` or any exact-audio lip-sync) is used **only** on a shot
   where the person's face is on screen **and** they speak that line. A visible face that
   isn't speaking is never lip-synced: it is a normal clip (video-h3max `broll: true`,
   "nobody speaks, lips closed", with a named action). Voiceover over B-roll is never
   lip-synced.
2. Lip-sync runs only after the voice line is final (rate-checked and approved), once
   per line. Never re-sync after a picture edit; re-time the picture instead.
3. At the script approval, in the same message (no new gate), ask the owner: "Do you
   want an on-camera person speaking, or voiceover over footage?" Suggest
   what the reference does. Record the answer in `voice_plan.route`
   (`exact_audio_lipsync`, `qualified_native` or `external_narration`); list it in `changes_from_reference`
   when it differs from the reference.
4. The shot plan marks each shot `speaking_on_camera: true|false`. In review, a
   lip-synced clip on a shot not marked speaking is `ask`; a speaking shot without a qualified native or matched audio-driven performance is `must_fix` ([check severity](check-severity.md)). Native speech does not need an additional lip-sync pass.

An unrelated narrator over speaking-looking footage is not a fallback. Native speech
continues under a cutaway; the face returns at the matching source position.

## Source-linked editing and performance

Assemble with the shared assembly_timeline (fields in [recipe format](recipe-format.md));
speaking picture and its driver stay on linked clocks. Matched source positions prevent
edit drift but cannot certify the generator's phonemes.

Never drop native dialogue, rearrange talking pictures, place voice files at scene
starts or stretch them into slots. A changed driver needs new sync. After lip-sync or
picture timing, a speed change moves speaking picture and audio together and is never
a pacing repair.

Write connected thoughts, not spoken headings; scene boundaries never split a thought.
The reference sets the pace, measured by `../scripts/reference_rate.py`; for a slow voice
prefer tighter words, then `eleven_v4`, then at most 1.25× tempo on the new narration. Save pronunciations
for names, ingredients and numbers. Eleven tags are not H3 line syntax (the creator
wrapper rejects square brackets), and Eleven v4 has its own controls. Listen to the
whole audition, hard words, every join and the ending.

## Qualification by endpoint and shot type

Record model, endpoint/version, task, accepted examples, critical failures and the last
real review. A routing row or transport success does not qualify content; repeated
failures suspend that use until a corrected take is reviewed.

| Existing route | Current restriction |
|---|---|
| Kling 2.5 Turbo | **Withdrawn.** Creator B-roll uses `video-h3max` stills mode (native audio muted, "nobody speaks, lips closed"); product-only motion uses `video-seedance-2` |
| Veo 3.1 Fast | fal retires the endpoint on 17 Nov 2026 (noted 15 Oct 2026); keep it until a bake-off picks a replacement; refused on a tiered custom video (`custom_video_tier_setting`) |
| Nano Banana | Cartoons only; real people and real products use `image-gpt-image-2` edit, and packaging comes from the real photo through `overlay` |
| Veed Fabric 1.0 | Not a close-up fallback; review a first take and the final lip-sync; 480p under Standard, 720p under Best or as a one-shot upgrade |
| H3 Max creator | No unconditional exact-script default or unchecked batch; keep evaluated configurations with first-take acceptance, voice consistency and linked audio |
| Veo/Seedance complex actions | Representative action and product-fidelity qualification first; Seedance only for shots with no face, at 720p (1080p only when the customer asks) |
| Grounded stills/cards/overlays | Valid for their own jobs; never a substitute for motion or physical proof |
| Image-family substitution | Keep the selected family; a change needs qualification and ingredient approval |
| ElevenLabs narration | Keep the accepted voice and settings |

Reuse the H3 avatar builder's capture branch and accepted identity; a still pass does
not qualify animated gaze or handling.

## Selected new part interfaces

Use creator-h3@1.8.0 fields only with that version or a compatible newer contract (1.7.0 added `quality_tier`, with takes at 768P by default; 1.8.0 accepts a measured take review).
Carry creative_contract_revision and `reference_words_per_second` (from `../scripts/reference_rate.py`).
This kit interface is unconditioned. Native speech has no voice pair: the person is made with `--no-voice-pair`, and the take's
own voice is accepted or rejected with the first take. A separate voice (voice-elevenlabs)
uses `character.voice_pair` (from pair_voice.py, which make_character.py runs). Capture is
phone_counter, also for two-hand actions (it has no phone_observer); focus is deep.
Its generation_stage first_take is the default and returns pending source. Only
remaining_takes may chain generation after accepted_sources includes the first take
with a review of its whole length, real word timing and the qualified model/shot record. The review records `coverage.motion` (`watched` | `measured`) and `coverage.audio` (`listened` | `measured`); `measured` (full-resolution frames plus real word timing against the line) is enough, and nobody has to claim a watch or a listen. assemble
uses all accepted sources without new generation. Never assert acceptance from ASR
or a returned URL alone, or send new fields to an older frozen version.

Use voice-elevenlabs@1.3.0 (`eleven_v4` by default) with `pace.target_wps` set to the reference's
rate. 1.2.0 is withdrawn: a tagged read returned only its first request's audio. Resolve the real
with-timestamps endpoint through the managed binding. Only supported V4 controls apply. Tagged audio remains pending until independently reviewed word
alignment; tag-stripped planned text is not evidence of spoken words.

`eleven_v4_turbo` is also available. Gemini Omni Flash (gemini-omni-1.1-flash) and Seedance 2.5 are
unproven candidates, not defaults; Omni ignores uploaded audio, so never route exact
lip-sync through it. Sources:
[ElevenLabs models](https://elevenlabs.io/docs/overview/models),
[Google Omni](https://ai.google.dev/gemini-api/docs/omni.md),
[Seedance 2.5](https://seed.bytedance.com/en/seedance2_5).
Qualification needs real AV review of a representative script, product and action in
an approved trial. A good raw take does not clear an edited final.
