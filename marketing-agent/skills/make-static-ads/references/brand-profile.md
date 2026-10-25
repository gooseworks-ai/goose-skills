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
- **Meta Ad Library:** type the brand's name in the search box and choose it under "Advertisers" (keyword search returns other advertisers), then `facebook.com/ads/library/?active_status=active&ad_type=all&country=<CC>&view_all_page_id=<page id>`. Most-shown ads come first. Don't filter to "Images": many statics run as dynamic ads. Look closely at up to 20 statics for the profile; for the no-repeat test, also skim the rest of the live statics (picture and headline) and write the count ("30 of 30 live ads checked for repeats").
- **Other platforms the brand uses:** LinkedIn `linkedin.com/ad-library/search?accountOwner=<brand>` (check the advertiser is the brand), TikTok `library.tiktok.com/ads` (Europe and UK only), Google `adstransparency.google.com`.
- **Imported into GooseWorks:** `gooseworks:ads_template_read` `mode: "mine"`, `filters.format: "image"`, `limit: 20`; check the advertiser is the brand. Nothing imported, or older than a week → `gooseworks:ads_library_scrape` with `brand_id` (free), poll `gooseworks:job_get` `kind: "library_scrape"` with `brand_id` and `job_id` = the returned `source_id`.
- **No browser and nothing imported:** a paid read. Don't run it at Step 1: mark the brand's ads "not checked", put its "up to N credits" ask in the Step 2 question (the `spend-gate` skill (`../../spend-gate/SKILL.md`) branch B), and after a yes read them and update the profile before Step 3. The calls: the Meta rows of `../../spend-gate/proxy-endpoints.md` (Ad libraries): `company/ads` with `companyName` or `pageId`, `status: "ACTIVE"`.
- **Made before in GooseWorks:** the calls in `engine-notes.md` (the last 10).
- **Customers:** the voice-of-customer bank (`reading-the-brain.md` §2), else 10–20 public reviews (product page, Amazon, Reddit). Note the moments people describe.

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
Formats and styles: <e.g. founder photo + one line; product on flat colour; screen recording; which styles from `levels.md` they use>
Colours, type: <what the ads actually use; note where it differs from the kit>
Recurring devices: <e.g. the mascot in a circle; handwritten notes; before/after>
How they write on-image text: <length, case, voice, how many text elements, where they sit>

## Five product truths
1. <what is true about the product, one plain sentence> (source)

## Customer lines (up to five; never made up)
1. "<a customer's own words, or a moment they describe>" (source, e.g. V-07, an Amazon review)

## Never
<every dont/must rule; anything their ads clearly avoid>
```

## 3. Conflicts

**The brand's own ads win over the kit** on look, colours, fonts and on-image text, unless the marketer says otherwise: the kit is often generated (its font is often a guess) and the ads are what the brand actually runs. Every other file points here for this rule.

When sources disagree on anything else (the kit says one positioning, the website another), don't pick one. Put the conflict in the Step 2 questions to the marketer (playbook Step 2), with your recommendation: for positioning, usually the newest public source. A look or font conflict goes in the question too, recommending the ads' version. "Your choice" → use the recommendation and say which you used on the board.
