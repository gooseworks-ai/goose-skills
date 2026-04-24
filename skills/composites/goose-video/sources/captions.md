# Source: Captions

Generate and style burned-in captions for muted autoplay and accessibility.

## Transcription

### OpenAI Whisper (API or local)
- API: `openai.Audio.transcriptions.create(model="whisper-1", file=...)`
- Local: `openai-whisper` Python package (works offline, slower)
- Output: SRT, VTT, or JSON with word-level timestamps

### Remotion Captions (for polish mode)
- Built into the video-polish sub-skill
- Uses Whisper under the hood
- Renders captions as part of the Remotion composition

## Caption styling by style preset

| Style | Caption treatment |
|-------|-------------------|
| cinematic | lower-third, thin sans, 70–85% opacity, fade in/out |
| energetic | large, centered, word-by-word reveal, bounce/pop |
| minimal | centered, static, fade in/out, single line |
| documentary | lower-third, clean sans, includes speaker name |
| tutorial | bottom-center, large, word-by-word for technical terms |
| ugc-handheld | TikTok-style (white + black stroke, or black + yellow highlight), word-by-word |
| motion-graphic | integrated into the motion-graphic system (no separate caption layer) |
| kinetic-type | captions ARE the content; no separate layer |

## Workflow

1. **Transcribe** — run Whisper on the audio track, get word-level timestamps
2. **Segment** — break into caption chunks (max 2 lines, max ~7 words per line, respect sentence boundaries)
3. **Style** — apply the chosen style's caption treatment
4. **Burn in** — render captions into the video (preferred for social), OR produce a sidecar SRT/VTT for platforms that support overlays (YouTube)

## Best practices

- **Bake captions in for social** — most muted autoplay won't use platform-native CC
- **Provide a sidecar SRT for YouTube** — helps SEO and accessibility
- **Keep lines short** — 2 lines max, readable at a glance
- **Respect language direction** — RTL languages need aligned treatment
- **Proofread names and jargon** — Whisper struggles with brand names and technical terms; post-edit these
