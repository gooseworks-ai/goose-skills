# video-kling

## 1.1.1

- A file path may be a Windows path (`C:\...` or `C:/...`). Every file going in or out was refused on Windows before, because a path had to start with `/`. Rebuilt with the shared path fix; nothing else changed from 1.1.0.

## 1.1.0

- Withdraws Kling 2.5 Turbo (`fal-ai/kling-video/v2.5-turbo/pro/image-to-video`): removed from `model`, `needs.models` and the rates (fix-forward contract section 5). v2.1 standard and v3 standard are unchanged. A minor version: styles move to it through their pins.

## 1.0.0

- First version: Kling image-to-video (v2.1 standard, v2.5 turbo pro, v3 standard) on fal, in scenes mode (one clip per plan scene, timed to the voice or song spans) and images mode (one clip per still), with a keep window and a still fallback. Built on the new `_lib/scene-clips.mjs`.
