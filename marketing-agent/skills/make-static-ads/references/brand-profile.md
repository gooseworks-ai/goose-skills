# Brand profile — how this brand already talks and looks

Before any idea, write down how the brand advertises today. Ads that ignore this read as someone else's ads with this logo on them: creative, maybe, but the brand would never run them. Every concept on the board must fit this profile, or be marked as a deliberate new angle.

## 1. Where to look (free)

Look at the actual images and posts, not titles or metadata.

| Source | How | What it gives |
|---|---|---|
| The brand's own ads | Meta Ad Library page, imported own ads (`research.md` §2), ads made before in GooseWorks | Angles they pay for, their ad look, how they write headlines |
| The brand's social posts | `brand_read` `sections: ["organic"]`; the linked social accounts in the host browser (X, LinkedIn, Instagram, TikTok): the latest 10–20 posts | How they talk day to day, recurring themes, formats |
| The website | Homepage hero, main product page, about page | The current positioning line, in their words |
| The brand kit and brain | `brand_read` kit and learnings; `brand_knowledge_browse` core rules | Colours, fonts, logo, every `must` / `dont` |

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
How they write on-image text: <length, case, voice, one line or two, support line or none>

## Never
<every dont/must rule; anything their ads clearly avoid>
```

## 3. Conflicts

When sources disagree (the kit says one positioning, the website another; the kit font differs from the font in their ads), don't pick one. Put the conflict in the combined question to the marketer (playbook Step 2), with your recommendation: usually the newest public source. "Your choice" → use the recommendation and say which you used on the board.

## 4. How the profile is used

- **Angles:** the angle picker (Step 2) offers the profile's angles first, plus at most two new ones, marked new.
- **Concepts:** every board row names the profile angle it serves, or "new angle".
- **Look and text:** the profile's look and on-image text style feed the prompt (`prompts.md`), so the ad looks like it came from this brand.
- **No repeats:** the profile's live ads plus the last 5–10 ads made in GooseWorks are the history a new ad must not repeat (`ideas.md` §4).
- **Critic and judge:** both check brand fit against this profile.
