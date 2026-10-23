# Sample Input

Prompt (truncated for sample — real prompts are 80+ lines, see `prompt-example.md`):

```
📱 UGC INFLUENCER SUNSCREEN REVIEW REEL (SELFIE-STYLE, NOT A COMMERCIAL)

This is NOT a cinematic commercial, NOT a beauty ad. This is a real Instagram
Reel filmed by a 20-something American female creator on her iPhone front camera.

Use @Image1 as the influencer's face. Use @Image2 as the sunscreen product —
a yellow-and-white squeeze tube with black cap. Label MUST be readable.

FORMAT: Vertical 9:16, slight handheld micro-shake, cream linen tank, casual
bedroom with morning window light. Real slightly imperfect skin, light golden tan.

SCENE: She holds the product near her face, gives a warm relaxed smile, says:
"This sunscreen is honestly my favorite — feels so light."

AUDIO: Soft warm conversational American voice, NOT bubbly, NOT loud. NO music.

GLOBAL RULES: Lips remain closed between dialogue beats. Wardrobe identical.
Product clearly visible in her hand. NO water, NO lather.

STRICT REALISM: Tiny natural imperfections, subtle peach fuzz, faint fine lines.
NOT plastic, NOT airbrushed, NOT doll-like, NOT porcelain.
```

References:
- `--image-ref` portrait.png — locked avatar identity
- `--image-ref` sunscreen.png — product reference

CLI:
```bash
python3 scripts/generate.py \
  --prompt "$(cat sample-prompt.txt)" \
  --output coworkers/test-runs/$(date +%s)/create-video-seedance-2-fal/clip.mp4 \
  --image-ref /path/to/portrait.png \
  --image-ref /path/to/sunscreen.png \
  --duration 4 \
  --resolution 720p \
  --aspect-ratio 9:16
```
