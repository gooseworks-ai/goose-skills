# Example kickoff — Liquid Death (Sparkling Water), research-only

Paste into your agent:

```
Research the brand Liquid Death (product: Sparkling Water, https://liquiddeath.com)
using the brand-research skill. Write the full brand-context pack into ./liquid-death.
No existing ads to analyze and skip image generation — research + sourced logo +
2–4 reference photos only.

Follow the SKILL.md phases: disambiguate, scaffold, web research → fill all four
brand-research/*.md files (with the exact headers) + asset-urls.md, source the
logo + reference photos and register each in brand-assets/manifest.json, write a
concept-brief.md, then run scripts/verify_pack.py and show me the result.
```

Expected: `./liquid-death/brand-research/{brand-summary,visual-identity,competitors,audience}.md`
fully filled (Liquid Death's deadpan-metal voice should be unmistakable in
brand-summary), `asset-urls.md` with dated sources, a logo + 2–4 photos
registered in `brand-assets/manifest.json`, a `concept-brief.md`, and a PASS from
`verify_pack.py`.
