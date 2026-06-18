# Example kickoff — Notion Calendar, with existing-ad analysis + imagery

Paste into your agent:

```
Research Notion (product: Notion Calendar, https://notion.so/product/calendar)
with the brand-research skill into ./notion. I've dropped three of their ads in
./notion/existing-ads/ — analyze each. This product has notable UI, so also write
ui-references.md. Then generate 4 product stills and 6 lifestyle stills with the
optional image step (FAL_KEY is in .env).

Phases: disambiguate, scaffold, web research → fill all four brand-research files
+ asset-urls.md + ui-references.md, analyze each existing ad and fold the patterns
into concept-brief.md, source the logo + reference photos, run the image step for
the stills, register everything in brand-assets/manifest.json, then verify_pack.py.
```

Expected: the four research files + `ui-references.md`, a `concept-brief.md`
whose "Observed patterns" cites specific moments from each of the three ads, a
populated `brand-assets/` (logo, reference photos, 4 product + 6 lifestyle
generated stills) all registered in `manifest.json`, and a PASS from
`verify_pack.py`.
