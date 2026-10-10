# cut-footage

## 1.0.2

- `audio: true` keeps the footage's sound in step above 2x: atempo steps are chained so their product is the speed (1.0.1 capped it at 2x, so 4x footage played its sound at half speed). The sound is named stereo for the AAC encode.
- A streaming WebM or Matroska clip with no container length is measured from its streams or packets instead of being refused.

## 1.0.1

- Shared library fixes: piece names stay unique when an id and a fallback collide, and the loudness meter no longer logs every frame.

## 1.0.0

- First version: a sped window of plan footage laid into a band, for logo-equation-card.
