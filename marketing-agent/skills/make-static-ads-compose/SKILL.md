---
name: make-static-ads-compose
description: >-
  Step of make-static-ads: writes each ad's render prompt and ordered image list from its concept-board row, one per ad and ratio, ready for a quoted render. Run make-static-ads instead; not for direct use.
version: 0.8.0
---

# compose

**Read first:** `../make-static-ads/references/prompts.md`.
**Reads:** the `board.md` row with its final copy, level and template; `profile.md` (the brand's real look); `../make-static-ads/references/levels.md`; the product record and photos, the logo, the brand kit's colours and fonts, every `must` and `dont` rule.
**Writes:** per ad and ratio, the exact prompt and `image_urls` into the batch file, plus a `render-<ad>-<ratio>.json` holding the `gooseworks:ads_render` arguments on a host with files.

1. **Product images.** Pick the official photo(s) that show the label most clearly from the angle the scene needs; for software, real UI screenshots, the logo or the mascot (`../make-static-ads/SKILL.md`, Before you start). Public https URLs only; a local or attached file goes through `gooseworks:media_upload` first. Look at each one before using it.
2. **Shared foundation.** Write it once for the batch (`prompts.md` §2) with the brand's look from `profile.md`, its fonts and rules. Reuse it word for word.
3. **Layout and scene.** For each ad, write `prompts.md` §3 from the board row: the template's layout as the level keeps it, then the scene. Attach the logo file unless the marketer said none, and the template image only at close and only for the brand's own ad (`prompts.md` §1). The physical event and the protected choice go in as concrete sentences; the protected choice also appears word for word.
4. **Copy.** Every word to be drawn is in quotes, exactly as the board has it, placed in its slot. Nothing else is asked to be drawn.
5. **Ratios.** One prompt per ratio the placements need (`prompts.md` §4, `../make-static-ads/references/formats-and-placements.md`).
6. **Read it back** (`prompts.md` §5). Then hand it to the claims check.

Engine: leave `engine` unset (the default) unless the marketer asked for another or the default refused the content. A changed prompt after the claims check goes through the check again.

**Done:** each ad and ratio has its prompt, image list and render arguments; each passed the read-back.
