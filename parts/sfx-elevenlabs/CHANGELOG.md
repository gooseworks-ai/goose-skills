# sfx-elevenlabs

## 1.0.2

- A file path may be a Windows path (`C:\...` or `C:/...`). Every file going in or out was refused on Windows before, because a path had to start with `/`. Rebuilt with the shared path fix; nothing else changed from 1.0.1.

## 1.0.1

- Shared library fixes: piece names stay unique when an id and a fallback collide, and the loudness meter no longer logs every frame.

## 1.0.0

- First version: ElevenLabs text-to-sound effects at fixed lengths (the generic sound-effect step GV-32 asks for).
