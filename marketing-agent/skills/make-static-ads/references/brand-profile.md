# Brand profile — how this brand already talks and looks

Before any idea, write down how the brand advertises today. Ads that ignore this read as someone else's ads with this logo on them: creative, maybe, but the brand would never run them. Every concept on the board must fit this profile, or be marked as a deliberate new angle.

## 1. Where to look (free)

Look at the actual images and posts, not titles or metadata.

| Source | How | What it gives |
|---|---|---|
| The brand's own ads | Meta Ad Library page, imported own ads (routes below), ads made before in GooseWorks | Angles they pay for, their ad look, how they write headlines |
| The brand's social posts | `brand_read` `sections: ["organic"]`; the linked social accounts in the host browser (X, LinkedIn, Instagram, TikTok): the latest 10–20 posts | How they talk day to day, recurring themes, formats |
| The website | Homepage hero, main product page, about page | The current positioning line, in their words |
| The brand kit and brain | `brand_read` kit and learnings; `brand_knowledge_browse` core rules | Colours, fonts, logo, every `must` / `dont` |

**Routes** (free, by eye, host browser):
- **Meta Ad Library:** type the brand's name in the search box and choose it under "Advertisers" (keyword search returns other advertisers), then `facebook.com/ads/library/?active_status=active&ad_type=all&country=<CC>&view_all_page_id=<page id>`. Most-shown ads come first. Don't filter to "Images": many statics run as dynamic ads. Up to 20 statics.
- **Other platforms the brand uses:** LinkedIn `linkedin.com/ad-library/search?accountOwner=<brand>` (check the advertiser is the brand), TikTok `library.tiktok.com/ads` (Europe and UK only), Google `adstransparency.google.com`.
- **Imported into GooseWorks:** `gooseworks:ads_template_read` `mode: "mine"`, `filters.format: "image"`, `limit: 20`; check the advertiser is the brand. Nothing imported, or older than a week → `gooseworks:ads_library_scrape` with `brand_id` (free), poll `gooseworks:job_get` `kind: "library_scrape"`.
- **No browser and nothing imported:** the proxy, on one yes to a ceiling (the `spend-gate` skill (`../../spend-gate/SKILL.md`) branch B): `gooseworks:data_call_provider` `provider: "scrapecreators"`, `/v1/facebook/adLibrary/search/companies` `{query}`, then `/v1/facebook/adLibrary/company/ads` `{pageId, status: "ACTIVE", media_type: "all", trim: "true"}`.
- **Made before in GooseWorks:** `gooseworks:ads_creative_read` `tags: ["made-by:make-static-ads"]`, `limit: 20`, and the three latest batch files in `ads/batches/`.
- **Customers:** the voice-of-customer bank (`reading-the-brain.md` §2), else 10–20 public reviews (product page, Amazon, Reddit). Note the moments people describe. Customer words are situations and hooks, never product proof.

A source you couldn't open goes in the profile as "not checked" with the reason. A brand with no ads and no posts gets its profile from the website and kit alone, and says so.

## 2. What to write (`profile.md`, under one page)

```markdown
# Brand profile — <brand>, <date>

Read: <sources, with counts: "12 of ~40 live Meta ads, 15 X posts, homepage, kit">

## Positioning
<the current line, word for word, with its source>
Conflicts: <source A says X, source B says Y> → ask the marketer

## Angles they use
| Angle | Example headline or post line (source) | How often |
|---|---|---|

## How their ads look
Formats: <e.g. founder photo + one line; product on flat colour; screen recording>
Colours, type: <what the ads actually use; note where it differs from the kit>
Recurring devices: <e.g. the mascot in a circle; handwritten notes; before/after>
How they write on-image text: <length, case, voice, how many text elements, where they sit>

## Never
<every dont/must rule; anything their ads clearly avoid>
```

## 3. Conflicts

When sources disagree (the kit says one positioning, the website another; the kit font differs from the font in their ads), don't pick one. Put the conflict in the combined question to the marketer (playbook Step 2), with your recommendation: for positioning, usually the newest public source; for look and fonts, what the brand's own ads use. "Your choice" → use the recommendation and say which you used on the board.

## 4. How the profile is used

It feeds the angle picker (playbook Step 2), every board row's angle and the no-repeat history (the concept-grid step), the prompt's look and text style (`prompts.md`), and the brand-fit checks of the critic and the judge.
