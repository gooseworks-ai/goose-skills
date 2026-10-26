# check-layer

## 1.9.1

- A file path may be a Windows path (`C:\...` or `C:/...`). Every file going in or out was refused on Windows before, because a path had to start with `/`. Rebuilt with the shared path fix; nothing else changed from 1.9.0.

## 1.9.0

- `speech_extra_words` (GOOSE-4034): fails when the transcript has words the script does not, and says whether they repeat the script or are new. Three H3 takes of one creator review said made-up words ("It's Popiclin Xiao Fistazin") or repeated an earlier line and passed; on a local stand-in take that said "glugging" twice, `speech_matches_script` scored 0.984 and passed, because a few extra words barely move the similarity. Fillers alone (um, uh, er, ah, hmm) and Whisper's "thank you" or "thanks for watching" as the very last words heard do not count; a changed word is still `speech_matches_script`'s.
- `flag:no_unscripted_speech`, for a style that lists it in `qc_flags`: on on-camera speech with word timings for every line, fails a voice between the timed scripted words, which the transcript never shows because Whisper drops sounds that are not words. A voice is at least 3 windows (0.15 s) in one gap whose 300 Hz to 3.4 kHz level (50 ms windows) is 3 dB or more over the median inside the words; 0.15 s around each word belongs to the word, and the end card is not judged. On the "glugging" take it fails 6.8 to 8.8 s with no bed and under three real music beds (audio-mix 1.0.1, then the sound layer); the beds alone reach +0.3 dB over the voice. The same take with the extra word muted passes, and six clean H3 takes had no gap over the bar. It is a flag, not a default, until street ambience and unscripted reactions in other formats are measured.
- Declares the `highpass` and `lowpass` filters the voice-band read uses.
- A minor version: it reaches new quotes through layers.json.

## 1.8.0

- `setup_count_vs_reference`: with `expect.reference_setups`, fails when the final cut has more than 30 % fewer distinct setups than the reference; otherwise `not_applicable`. Setups are shot keyframes (one per shot of at least 0.5 s, flat cards skipped) clustered by 64-bit dHash within 10 bits. A test video had 4 setups against about 10 in the reference.
- `repeated_shot`: a `callback:` intent alone no longer clears a repeat. Its name must be in the new `expect.approved_callbacks` (from the approved creative contract). The same test video relabelled five repeats as callbacks after the check failed and then passed.
- A minor version: it reaches new quotes through layers.json.

## 1.7.0

- `speech_rate_vs_reference`: with both `expect.reference_words` and `expect.final_words`, fails when the final cut speaks more than 15 % slower than the reference; otherwise `not_applicable`. Words are counted as goose-studio's `reference_rate.py` counts them (whisper sub-word tokens joined, markers and punctuation dropped), over the first word's start to the last word's end. A test video read at 2.62 words a second against the reference's 3.20. A minor version: it reaches new quotes through layers.json.

## 1.6.0

- The final measurements (`gooseworks-final-measure/1`): `digital_silence`, `tone_only`, `unplanned_silence`, `planned_pause_too_long`, `frozen_picture`, `planned_freeze_too_long` and `repeated_shot`, with the contract's thresholds and its 15 Oct amendments (1.5 s start / 3.0 s end allowance, 2.0 s mid-video freeze, 80 Hz-8 kHz tone band, still share relative to the reference, intentional silence, end-card freeze up to 3.0 s). They fail on a custom, source-linked edit and warn on a template video for one release. Declares `timeline.assembly_timeline` so the kit passes the linked edit, and returns `final_measure`. A minor version: it reaches new quotes through layers.json.

## 1.5.0

- A measured miss that breaks an earlier part's promise fails instead of warning, and names the layer to re-run: loudness off -14 LUFS by more than 2 on a cut above -50 LUFS when the kit says the sound layer is on (`expect.layers.sound` true; a kit that sends no switches gets a warning; the layer levels such a cut to -14 within 1 or fails), and a caption across a scene cut or into the end card (the captions layer stops captions there when the style lists `captions_cross_cuts`). A quiet cut the sound layer passed through (at or below -50 LUFS), loudness with the sound layer off, and a caption across a retained-body join still warn, as does every taste range 1.4.2 made a warning, `min_shot` included. A minor version: only new quotes get it, through layers.json.

## 1.4.3

- Declares the `crop` filter and the `rawvideo` encoder it already used for logo boxes and frame reads, so the computer check catches a toolchain without them.
- `speech_matches_script` checks each spoken line too (a speech entry with a `scene_id` and a heard `spoken`): a line that lost 2 words in a row, or its last 2 words, fails naming the script line ("Line 2 of the script is missing the words ..."), and the whole script losing 3 words in a row fails whatever its similarity. 1.4.2 judged only the whole script, so a clause lost where two takes join (about 11 words, a similarity of 0.901) passed. Words lost from a line's start that the nearest heard line before it ends with, or from its end that the nearest heard line after it starts with, count as said (whole words, in order); words lost from a line's middle always count. A line with no heard words placed with it (the transcriber could not match it, so its words went to a later line) is left to the whole-script checks. The script's end said as fewer, other words counts as lost too, and a repeated line is numbered as the copy that lost words. A patch, so videos approved on 1.4.x move onto it.

## 1.4.2

- `sounds_match_messages` hears a message's sound by its loudest 50 ms (from 0.05 s before the scene starts to 0.3 s after) against the median 50 ms of the quiet in the 0.55 s before it, and needs 8 dB. Every scene start before the end card or kept body is judged, the opening's included (1.4.1 skipped the first 0.4 s and the 0.1 s before the card). A cue stops where the next message's starts (two messages under 0.1 s apart split the time) and at the end card. Quiet is time outside every message's own span, so earlier messages never raise the bed; with under 0.15 s of it the bed is the quiet after the cue, then all the quiet before the card. 1.4.1 compared the mean of the 0.25 s after a message with the mean of the 0.3 s before it and needed 4 dB: a 0.1 s send sound, levelled by the sound layer's limiter over a music bed with typing clicks before it, read 3.7 dB and failed a ChatGPT cut whose send sound was there (it reads 12.6 dB now). It is an energy check and needs a steady bed: a message with no sound of its own over a steady bed fails, but a beat in the music that lands on a message can pass it.
- A measured taste check outside its range warns instead of failing, so the video is delivered with the warning: the length range (a 29.4 s cut of a 30 to 48 s style), loudness off -14 LUFS by more than 2, a still opening or held picture, `footage_moves` (measured low motion), `read_rate`, `cut_rate`, `min_shot`, `cuts_between_words`, `captions_cross_cuts`, `cut_contrast`, `distinct_adjacent_shots`, `ambience_floor` and a `text_led` cut with blank time over 25 %. A warning names no layer to re-run, so loudness off the mark no longer re-runs the sound layer.
- `sound` judges as the server does: silence is a missing track or one at or below -60 LUFS (it was -50), and it passes only when nothing is planned to sound: no speech, and no music or voice (`expect.music` and `expect.voice`, read when the kit passes them). A track whose loudness cannot be read fails; it used to count as silence.
- Still failing: a file that does not play, a length that cannot be measured or is outside 1 to 600 s (the server's limits for any video, with no slack), the wrong size, no sound when speech, music or a voice is planned, a loudness that cannot be read, missing captions, untranscribed or mismatched speech, black or blank stretches, a wholly blank `text_led` cut, a missing end card, an unmarked `retained_body` opening, a message whose sound does not rise over the bed, captions outside the safe zone, the logo checks as in 1.4.1, and frames that could not be read at all.

## 1.4.1

- Remove the undocumented 40,000-pixel area requirement that rejected valid wide logos such as 281 × 88.
- A source logo below the recommended 256 px long side emits a non-blocking resolution warning without a repair instruction. Actual logo visibility and identity checks still run.

## 1.4.0

- Per-shot style flags (a shot runs from one scene start to the next; the end card is not one): `captions_cross_cuts` (no caption cue runs across a cut, 0.15 s allowed either side; the end card's start counts), `min_shot` (no shot under 0.4 s), `ambience_floor` (each shot's room tone from -52 to -32 dB full scale, with its speech at least 6 dB above it), `cut_contrast` (the frames 80 ms either side of each cut differ by at least 25, a warning under 32) and `distinct_adjacent_shots` (two scenes in a row never open on the same picture).
- With `retained_body` the new flags judge only the new opening. Without them the verdict is the same as 1.3.0.

## 1.3.0

- Style flags: `text_led` (black_frames judges blank frames, black or one flat colour with no text, instead of dark ones: 1.0 s between beats, 0.3 s at the edges, under 25 % in all), `read_rate` (2.1 to 3.1 spoken words a second), `cuts_between_words` (no cut inside a word), `cut_rate` (0.5 to 0.7 cuts a second, end card excluded) and `retained_body` (content checks only inside the first scene, the new opening; the kept body is not judged).
- A flag this version does not measure stays `not_applicable`; only `text_legible` and `products_visible` say they need eyes.
- `retained_body` counts the opening as marked only when the first scene starts the video and leaves a kept body after it; the speech check then compares the opening's speech with the plan's first line only.
- A flag check code is `flag:<name>` for any flag name the input allows, so a flag with a name this version has never seen is reported, not refused.
- `read_rate` counts overlapping speech time once. With `retained_body`, speech running on past the opening is cut to its timed words; an untimed entry that runs on cannot be cut, so `read_rate` and the speech check report `not_applicable`.

## 1.2.0

- The logo is looked for where it is drawn: when the timeline declares a logo box (`safe_zones` use logo), the box plus a margin is cut from the full-resolution frame and matched at sizes from 40 % of the box up to the box and small turns, a wordmark by its shape and by its picture on white and on black, a badge or tile (mostly opaque past its clear padding) by its artwork inside its outline, so a logo drawn small, in a badge or on a tilted card is measured and another logo, a badge of the same shape included, is not. With no box declared, a logo the whole-frame search misses is a warning (`warn`), not a failure, unless the brand layer is on (`expect.layers.brand`), the one fix the failure could name.
- Every failed or warned check carries its own `message` in plain words, beside `reasons`.

## 1.1.2

- A cut at or below -50 LUFS counts as silent, the sound layer's line: a speech-free style with no music is not failed for sound.
- A still scene may hold for as long as it lasts: a held picture over 4 s fails only when it runs on past a scene start, or when the style asks for footage_moves or the timeline names no scenes.

## 1.1.1

- logo_visible is checked across the whole video (the end card included), apart from the end-card logo check.

## 1.1.0

- Free: on-camera speech is checked from the transcript a transcribe step puts in the timeline; an unmarked end card the style needs fails; logo_visible is checked on its own; a declared logo zone bounds the match.

## 1.0.0

- First version: the server's five checks plus black and frozen frames, end card and speech against the script.
