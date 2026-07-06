# Sample Input

## Brief
A clinical-luxury **Vignette** ad for **Mother Science** — three skincare SKUs shown as
clean cutouts floating over a real-time kinetic background bloom, with a cold-open text
card, a product carousel, and an annotated specimen-sheet end card, over an instrumental
music bed with NO voiceover. Vertical 9:16, ~10.5s. Sub-archetype **V-CARD**.

## Assets (git-LFS — fetch+checkout first)
- product PDP shots (→ birefnet cutouts): `source/scraped-product-images/{molecular-hero-serum,molecular-genesis-barrier-repair-moisturizer,retinol-synergist}.png`
- brand logo SVG: `assets/end-cards/mother-science-logo-cream.svg` (+ a white variant for dark BGs)
- fonts: `assets/fonts/{Boska-Black,SpaceGrotesk-Medium,SpaceGrotesk-SemiBold}.ttf`

## Background (Pexels FIRST, then T2V fallback)
- Try Pexels stock first: `ink in water`, `liquid bloom`, `sheer fabric wind` (free,
  native 9:16 — the cost lever, validated $0.66 on Clinikally).
- On weak Pexels coverage (skincare/luxury), fall back to T2V — 2 concepts × 3 models:
  - alpha: "Chrome Molecular Swarm on cream gradient" (heavy dim)
  - beta: "Black Ink in Cream Bloom, overhead" (light dim)
  - models: Veo 3.1, Kling v2.5 Turbo Pro, Seedance 2.0

## Overlays + music
- cold-open card: `["100%","PROVEN","RESULTS"]` (Boska Black, cream, dead-center)
- end card: EST 2023 / MOTHER SCIENCE / MAL·UH·SAY·ZIN / NOVEL MOLECULE / 10× claim
- music: ambient minimal electronic ~90 BPM, instrumental only

Full config: `scripts/config.example.json`. Reference render:
`demo/finals/mother-science-vignette.mp4` (the winning `beta-SEED` variant).

## Minimal input (defaults handle the rest)
```yaml
brand_url: "https://motherscience.com"
products: [molecular-hero-serum, molecular-genesis-barrier-repair-moisturizer, retinol-synergist]
```
Everything else autonomous: `aspect_ratio=9:16`, `duration_s=10.5`, `sub_archetype=V-CARD`,
`bg_source=pexels` (then t2v), concept derived from category, `bg_concepts_count=2`,
cold-open/end-card/music derived from brand.
