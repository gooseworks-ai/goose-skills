# Sample Input — create-image-gpt-image-fal

## Prompt

```
A single ripe red apple on a plain white studio background, soft daylight, centered, photoreal.
```

## Run parameters

```yaml
# Run 1 — default model
prompt: <the prompt above>
output: <run>/g1.png
aspect_ratio: "1:1"
quality: low

# Run 2 — gpt-image-2 with a custom size
prompt: <the prompt above>
output: <run>/g2.png
model: gpt-image-2
image_size: 1024x1536
quality: low
```

A small, safe, non-branded prompt at `low` quality keeps test spend minimal.
