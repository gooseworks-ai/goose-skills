# video-seedance-2

## 1.3.1

- A file path may be a Windows path (`C:\...` or `C:/...`). Every file going in or out was refused on Windows before, because a path had to start with `/`. A template that cannot be read is named by its file name on Windows too (the whole path was shown). Nothing else changed from 1.3.0.

## 1.3.0

- The default resolution is now 720p (1.2.0: 1080p). Custom videos run no video above 720p/768p unless the customer asks (16 Oct 2026); send `resolution: 1080p` explicitly then. Seedance stays for shots with no face: it refuses photoreal faces.
- The request body changed, so no `reuses_pieces_of`.

## 1.2.0

- `mode: take`: one take of up to 4 plan scenes, written as time-windowed beats with their dialogue; refuses too many words, beats that do not fit, and a line on a beat that keeps the face off screen (`off_screen_lines: voiceover` writes it as voice-over).
- `mode: takes`: `takes {count, first, later}` (template keys), scenes split by `extra.take` or evenly; `chain {crop: "bottom_45"}` hands a face-free still of take 1 to every later take.
- `pronunciations`, `words_per_second`, `max_words`, `off_screen_tags`.
- Outputs `takes`, `seconds` and `timeline`; `video` is the takes joined in order (one transcription, critic #23). 1.1.0 inputs order the same pieces.
- Take bodies send `duration` as fal's string enum (`"4"`..`"15"`); reference and image_to_video bodies are unchanged.
- Carries 1.1.0's review fixes: `mode` defaults to `reference`; a 1.0.1-shaped call sends braces as written, any 1.1.0-shaped call fills or refuses its placeholders; `start_image: "product"` starts on the product the scene names.

## 1.1.0

- `mode: image_to_video` (fal `bytedance/seedance-2.0/image-to-video`): `clips[].start_image` (`"product"` or a picture) and `clips[].end_image` (`"start"` or a picture).
- Prompt templates (`parts/_lib/prompt.mjs`): `template`, `look`, `answers`, `brand`, `cast`, `products`, `scenes`; placeholders filled in `clips[].prompt`, or the prompt taken from the template. Everything refuses before the first piece.
- One clip per picked plan scene when no `clips` are given (`pick`, `skip_first`, `skip_last`, `seconds`). Scene lines may be null.
- `seed` input: a new seed is a new piece. A top-level `video` output (the first clip). Prompts up to 12,000 characters.
- `clips[].prompt` and `clips[].references` are no longer required; a 1.0.1 clip list orders the same pieces.

## 1.0.1

- Shared library fixes: piece names stay unique when an id and a fallback collide, and the loudness meter no longer logs every frame.

## 1.0.0

- First version, from create-video-seedance-2-fal.
