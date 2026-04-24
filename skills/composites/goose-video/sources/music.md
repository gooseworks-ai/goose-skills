# Source: Music

Select and integrate royalty-free music for video backgrounds.

## Providers

### Pixabay Music (free, API key required)
- Part of the Pixabay API
- Requires `PIXABAY_API_KEY` env var
- Good for: generic background music, broad genre coverage
- Attribution: not required

### Free Music Archive (free, no API key)
- Public collection of CC-licensed tracks
- Good for: editorial, documentary, and lo-fi content
- Attribution: varies by license (check each track)

### Epidemic Sound (paid subscription)
- Higher production quality; broader trending-sound coverage
- Requires active subscription + API key
- Good for: commercial use, social-ready tracks

### Platform-native trending sounds
- For TikTok/Reels: use trending platform-native audio if available via Orthogonal's TikTok/Instagram scrapers
- Native sounds boost algorithmic reach

## Style → genre mapping

| Style | Music genre hints |
|-------|-------------------|
| cinematic | cinematic, ambient, trailer, indie film score |
| energetic | hip-hop, edm, trap, hyperpop, trending |
| minimal | ambient, piano, lo-fi, (or none) |
| documentary | documentary, emotional, inspirational, corporate soft |
| tutorial | lo-fi, ambient, corporate background, (or none) |
| ugc-handheld | trending, pop, viral, or platform-native sound |
| motion-graphic | motion graphic, corporate upbeat, electronic, explainer |
| kinetic-type | hip-hop, rhythmic, percussion, drum and bass |

## Selection workflow

1. Map the chosen style → genre tags
2. Query the provider(s) for matching tracks
3. Filter by:
   - BPM (match to format's target pace — 120–160 for energetic, 80–100 for documentary)
   - Duration (at least as long as the video; trim to fit)
   - Energy level
4. Auto-select top candidate; let user swap if desired
5. Fade-in (500ms) at start, fade-out (500ms) at end unless the style dictates otherwise

## Licensing

Always confirm the license covers the intended use (commercial, organic social, paid ads). Some royalty-free tracks exclude paid advertising or broadcast.
