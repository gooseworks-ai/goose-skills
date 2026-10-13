# speech-recut

## 1.0.2

- Heard speech in no line (transcribe-whisper 1.1.2's speech entries with no `scene_id` and empty `text`: a repeated line, a filler) is cut out with `drop: repeats`, with the silence around it down to `max_gap_s` (the join on a picture cut when one is in reach; at the head or tail with the trim; inside a silent beat only the words). New cut kind `extra`. 1.0.1 kept such words, and with 1.1.1's placement a repeated question made later lines look unheard, so the take was refused as needing a re-roll (staging, 13 Oct 2026).

## 1.0.1

- A short shot (under `min_shot_s`) that holds speech no longer ships as a flash of picture. It first takes back the dead air cut beside it, up to its shortfall (a little more pause, never past a picture cut inside that dead air, edges on the take's frames). A removal whose edge on the shot is itself a picture cut is not taken from: its time would go to the shot beyond that cut, so the dead air on the other side is used. When that cannot reach the minimum (the take's own shot is that short), its picture is covered by the shot before it (its last frame held; the edit's first shot by the shot after it) and its sound plays on, so no word is lost. 1.0.0 kept it with a warning: a 0.17 s shot left next to a dead-air join read as a jump. Only an edit with no shot long enough to cover from still warns.

## 1.0.0

- First version, from render-street-interview's `recut.py` and `phone_look_video.py`: dead air cut down on the take's own picture cuts, repeats and stutters dropped inside a line, a minimum shot, 30 fps, a room-tone bed from the take's quietest speech-free window, the `street-light` grade and the 180 MB size cap.
- Before publish (GOOSE-4015 FX-04): `speech` is optional and defaults to `timeline.speech`, because a style can only bind `step.<id>.<output>`; `room_tone`'s key is `source` (was `from`, which a style reads as a reference). `{from: ...}` is refused.
- Before publish (GOOSE-4015 W1-15b review): the room-tone search also skips gaps that hold heard speech with no timings (a repeated line the transcript gave to the next line), and the speech refusals run before any probe or ffmpeg work. The output is a whole number of output frames (rounded up, so a word at the end of the take is never trimmed), and `seconds`, `timeline.duration_s`, the last scene and the speech carry that same length; scratch files go to tmpDir.
