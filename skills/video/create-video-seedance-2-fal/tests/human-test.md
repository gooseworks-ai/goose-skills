# Human Test

After the smoke test, open `clip.mp4` and verify by eye + ear:

1. **Identity preservation.** Face in the clip visibly inherits from `--image-ref` portrait. Not a different person.
2. **Product preservation.** Product in the clip matches the product reference (color, shape, label).
3. **Prompt adherence.** Wardrobe, setting, lighting, framing match the prompt directives.
4. **Lip-sync.** Mouth movement aligns with spoken audio within ~100ms (when `--generate-audio` on).
5. **Audio quality.** VO clearly intelligible, not robotic, matches the audio-direction block.
6. **Lips closed between beats.** No idle mouth movement when not speaking (if specified in Global Rules).
7. **No NSFW leakage.** No water / lather / body-application unless prompt explicitly approves.
8. **Realism.** Skin texture has natural imperfections — not plastic / airbrushed / porcelain.

Pass: 6 of 8 yes. Fail: identity drift to a different person, OR `content_policy_violation` was silently retried.
