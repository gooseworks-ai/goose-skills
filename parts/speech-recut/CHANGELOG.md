# speech-recut

## 1.0.0

- First version, from render-street-interview's `recut.py` and `phone_look_video.py`: dead air cut down on the take's own picture cuts, repeats and stutters dropped inside a line, a minimum shot, 30 fps, a room-tone bed from the take's quietest speech-free window, the `street-light` grade and the 180 MB size cap.
- Before publish (GOOSE-4015 FX-04): `speech` is optional and defaults to `timeline.speech`, because a style can only bind `step.<id>.<output>`; `room_tone`'s key is `source` (was `from`, which a style reads as a reference). `{from: ...}` is refused.
