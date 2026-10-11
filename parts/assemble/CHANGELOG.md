# assemble

## 1.0.2

- A streaming WebM or Matroska clip with no container length is measured from its streams or packets instead of being refused; one ffprobe reports as cut off or damaged is refused, never measured short.

## 1.0.1

- Shared library fixes: piece names stay unique when an id and a fallback collide, and the loudness meter no longer logs every frame.

## 1.0.0

- First version, from the stitch-videos-ffmpeg montage assembler.
