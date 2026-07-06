# Sample Input

## Brief
A "value prop" ad for **Som Sleep** (VP-SWAP archetype) — five short benefit claims
revealed one per beat over the four flavor sachets, hero rotating beat to beat, closing
on the Som wordmark end card, over a calm instrumental bed. Vertical 9:16, ~17s. Built
to read fully **sound-off**; the only paid step is the music.

## Assets (git-LFS — fetch+checkout first)
- per-SKU cutout PNGs (≥3): `source/sachets/{berry,cherry,mango,tangerine}.png`
- brand wordmark for the end card: `source/logo-som-blue.png` (≥1200×600, no `?width=N`)

## Claims (≤4 words each, 3-5 total) — one beat each
1. NSF Certified — *Independently tested — trusted by 100+ pro sports teams.* (row)
2. Drug-Free — *Works without the pharma-class side effects.* (hero: berry)
3. Non-Habit Forming — *Take it when you need it — no dependency.* (hero: cherry)
4. Zero Sugar — *10 calories per stick — no bedtime sugar crash.* (hero: mango)
5. No Artificial Flavors — *Naturally flavored — Berry, Cherry, Mango, Tangerine.* (row)

## Hook + end card + music
- hook sticker: "Better Sleep. Better Mornings." (eyebrow "🌙 The Sleep Drink 🌙")
- end card: Som wordmark + tagline "Better Sleep. Better Mornings." + CTA "Click to See More"
- music: calm ambient instrumental ~60 BPM, mixed at −14 dB (pass `null` to ship silent)

Full config: `scripts/config.example.json`. Reference render:
`demo/finals/som-sleep-value-prop.mp4`.
