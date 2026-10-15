---
name: create-vo-elevenlabs
description: Generate a voiceover (VO) clip via ElevenLabs text-to-speech, ROUTED THROUGH THE elevenlabs-proxy so it bills the Ads agent. Voice id + script text come from the template recipe. Use for the spoken narration of VO-driven video-ad formats (cgi-app-sizzle, flat-vector-explainer, hypermotion). Never call ElevenLabs directly — the proxy attribution is required.
status: superseded
superseded_by: voice-elevenlabs@1.3.0
---

> **Superseded:** the video kit now does this with the voice-elevenlabs part, version 1.3.0 (`voice-elevenlabs@1.3.0`), in the parts folder of this repository. It speaks every scene's line through the private line, keeps character timings as word timings and swaps in confirmed pronunciations the same way. The compatibility generator also supports Eleven v4 controls and pending timing provenance. Existing frozen part versions are unchanged.

# create-vo-elevenlabs

VO via the elevenlabs-proxy (bills the Ads agent). `gen_vo.py --text "..." --voice <id> --out vo.mp3`.
The template recipe supplies the voice + text; paid call routes through media_proxy.

## Brand pronunciations

A brand name or product name the voice gets wrong is spoken from its phonetic
spelling, never from a `(pronounced …)` note (the voice reads notes aloud):

```bash
gen_vo.py --text "Meet Drinkag1." --voice <id> --out vo.mp3 --rules working/brand-rules.json
# or: --say-as "Drinkag1=drink A G one"
```

Only the SPOKEN text changes. Captions, on-screen text and the approved script
keep the written name. When captions are timed from this VO, map the spoken words
back to the written term.


## Read confirmed pronunciation before spending

At the start of every video, read the selected brand's persistent facts, including user-authored pronunciation rules. A previous video's notes or a cached rules file do not establish current pronunciation. For an unknown or ambiguous name, resolve how it is said before the paid voice step. Save the user's confirmed choice in the existing brand-facts store, update an existing rule by its id, then make a separate read and confirm it survived. Never infer successful persistence from a write acknowledgement.

The bundled `read_pronunciations.py` exports user-authored must rules from a fresh context snapshot (the brand read's payload, its `{"result": …}` wrapper, or the whole tool result). A rule's text is `Pronounce "<term>" as "<say_as>"`; the older `Pronunciation: <term> => <say_as>` is also read. It rejects a different brand, conflicting rules and required names that remain unknown. The resulting local rules file is a per-run voice input; the brand store remains the durable source. `gen_vo.py` supports a free dry run to review the resulting spoken text. Captions retain written names.

## Model-specific performance and timing

Eleven v4 is the default (since 1.3.0; it was v3). V4 and V4 Turbo always use the timestamped endpoint, so `--with-timestamps` is turned on for them. `eleven_v3` only when the plan locked it; never silently swap a locked model. `--model-support` is ignored.

## Pace: measured, and --target-wps

A timestamped read writes `measured_words_per_second` into `.provenance.json`: real words, counted as goose-studio's `reference_rate.py` counts them (punctuation alone is not a word), over the first word's start to the last word's last letter. Pass `--target-wps` with the reference's rate from `reference_rate.py`, which joins whisper's sub-word tokens. A read more than 10% below it is sped up to the target, at most 1.25x, with ffmpeg `atempo`; the raw read is kept as `<stem>.raw.mp3` and the timestamps are scaled to match. The provenance records `tempo`, `tempo_applied` and `tempo_applied_before_lipsync: true`. This retimes only the new narration, before any lip-sync step; never a lip-synced or native talking clip. A tagged read is not paced from provider timings. A read still slow at 1.25x needs a faster direction or fewer words.

V4 supports Stability and Similarity settings; Style, Speed, speaker boost and SSML are refused. V3/V4 accept bracketed audio tags and plain `--tag` delivery cues. V2 does not accept those tags. A literal wanted “uh” is spoken copy that needs approval and time. Tags guide performance; do not accept their effect without listening to the actual selected voice.

Keep a connected read rather than isolated sentences padded to planned scene lengths. New kit narration defaults to `join: sentence` and a 0.08 s gap only between separate requests. Use `join: one` for an appropriate same-voice script. Do not generate six takes by default or fit a poor voice performance with automatic time stretching. Deliberate narration tempo changes happen before any lip-sync generation and need listening afterward; never retime a native speaking face's audio separately.

The generator saves `.provenance.json` separately from raw provider timestamps. Tagged audio has `timing_status: requires_reviewed_alignment`; tag characters can receive invented times. Use actual reviewed transcription or forced alignment for final caption/edit timing. A timestamp response is not a content review or proof that every word was spoken. Listen to every file, including the first seconds, joins and endings, and preserve the exact voice/model/settings and checksum in the existing library record.

## Character timings for video

The bundled generator supports timestamped voiceover with per-voice settings.
Use the timestamp option for podcast dialogue and other edits that must follow
speech. It saves an MP3 and a character-alignment JSON beside it, sharing the
same filename stem. The existing audio-only invocation keeps its behavior.
A missing alignment is an error; do not render captions from guessed timings.
See the bundled timestamp tests for the request and output contract.
