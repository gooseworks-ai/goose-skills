# Source: Stock Footage

Embed royalty-free stock video for B-roll, transitions, and atmospheric scenes.

## Providers

### Pexels Videos (free, no API key required for basic)
- API: https://www.pexels.com/api/documentation/
- Requires `PEXELS_API_KEY` env var for programmatic access
- Good for: broad lifestyle/nature/urban footage
- Attribution: not required but appreciated

### Pixabay Videos (free, API key required)
- API: https://pixabay.com/api/docs/
- Requires `PIXABAY_API_KEY` env var
- Good for: CC0-style permissive licensing
- Attribution: not required

### Orthogonal video search (if available)
- Check `orthogonal-scrapecreators` or `orthogonal-search` for video asset search via Orthogonal's API surface

## Search workflow

1. Extract keywords from the `--brief` or the user's described scenes
2. Query the chosen provider with each keyword
3. Filter results by:
   - Minimum resolution (1920×1080 for landscape, 1080×1920 for vertical)
   - Duration match (within ±3s of required scene length, or trimmable)
   - License compatibility
4. Download top candidates to a local `stock-footage/` directory
5. Present to the user for approval before compositing

## Embedding

- Download full-resolution, then re-encode to match project output specs
- Trim to scene length
- Apply style's color grade during compositing
- Credit the creator in the final export's metadata (optional but good practice)

## When to skip stock footage

- `polish` mode — the source recording is the content; stock footage would be awkward
- `talking-head` mode — the avatar + slides are self-contained; stock is rarely needed
- Kinetic-type / motion-graphic styles — no live footage by definition
