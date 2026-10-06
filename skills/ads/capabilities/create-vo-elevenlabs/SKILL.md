---
name: create-vo-elevenlabs
description: Generate a voiceover (VO) clip via ElevenLabs text-to-speech, ROUTED THROUGH THE elevenlabs-proxy so it bills the Ads agent. Voice id + script text come from the template recipe. Use for the spoken narration of VO-driven video-ad formats (cgi-app-sizzle, flat-vector-explainer, hypermotion). Never call ElevenLabs directly — the proxy attribution is required.
status: active
---

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

## Character timings for video

The bundled generator supports timestamped voiceover with per-voice settings.
Use the timestamp option for podcast dialogue and other edits that must follow
speech. It saves an MP3 and a character-alignment JSON beside it, sharing the
same filename stem. The existing audio-only invocation keeps its behavior.
A missing alignment is an error; do not render captions from guessed timings.
See the bundled timestamp tests for the request and output contract.
