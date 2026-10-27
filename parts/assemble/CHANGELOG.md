# assemble

## 1.3.1

- A file path may be a Windows path (`C:\...` or `C:/...`). Every file going in or out was refused on Windows before, because a path had to start with `/`. Rebuilt with the shared path fix; nothing else changed from 1.3.0.

## 1.3.0

- `clips[].keep_clear`: where the product is in a still, as shares of the picture. Each box is moved onto the cut the way `fit` places the still and grown to cover the Ken Burns push, then returned in `timeline.keep_clear` for that clip's span, so captions-layer 1.4.0 and later keep the captions off the label. Without it the cut and timeline are 1.2.0's.

## 1.2.0

- Shot recipes per scene tag: `shots` (still, clip, video, montage, freeze; seconds, fill, zoom, speed limits, `skip_first`), drawn from `sources` and matched to `scenes` and `products`. `clips` is no longer required.
- `marks` output: where a shot with `mark` starts, for sounds in audio-mix.
- `snap`: cuts that land inside a word move to the nearer gap, within `max_shift_s` and keeping `min_shot_s`.
- `card_from` (`{tag}` or `{scene_id}`): the card span (`timeline.end_card`, no captions, no grade) starts at that scene, so a grid + offer card and the end card read as one card.

## 1.1.0

- Pictures timed to a voice or song: `spans` matched to clips by id, cuts on the frame at or before each line, `tail_s`, and `silent` (`share_previous` or `fixed`) for scenes with no line.
- `speech` and a whole `timeline` passed through, so captions skip transcription and a cut that was already timed keeps its scenes and safe zones.
- An end card: `ending`, `ending_timeline` (its logo box kept) and `ending_fills` (`after` or `last_span`); the output marks `timeline.end_card`.
- `motion: {stills: ken_burns, to}`: a slow centred push on stills.
- `grade: phone-grain | phonecam` on the body cuts.
- Size rule: the final encode is capped at 16 Mbps (8 Mbps with grain), and a cut over 180 MB is refused.

## 1.0.2

- A streaming WebM or Matroska clip with no container length is measured from its streams or packets instead of being refused; one ffprobe reports as cut off or damaged is refused, never measured short.

## 1.0.1

- Shared library fixes: piece names stay unique when an id and a fallback collide, and the loudness meter no longer logs every frame.

## 1.0.0

- First version, from the stitch-videos-ffmpeg montage assembler.
