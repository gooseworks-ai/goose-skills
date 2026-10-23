# Hand-off format — what the human and the sibling playbooks receive


## 1. Definitions

- **An idea** = one starting point (product fact or customer situation) made visible as one physical event (`ideas.md`). Tag it `concept:c<n>`.
- **An ad** = one execution of an idea: one scene, one headline, one copy set, delivered in every ratio its placements need. One dry run per ad and ratio (each ratio is its own prompt, `prompts.md` §4).
- **A cell** = several ads of one idea, so the idea wins or loses as a unit. For five ads or fewer, every ad is its own idea.

## 2. Tags and naming (so results trace back)

Write with `gooseworks:ads_creative_update` `patch.tags`. **Everything lower-case** (the server stores tags lower-case, and queries must match): keys and values, hyphenated:

`made-by:make-static-ads` (on every creative this playbook makes, so later runs can list them cheaply) · `concept:<c1, c2, …>` (the concept the ad executes — results are read per concept) · `angle:<a-nn from the angle bank (e.g. angle:a-07), else a short slug>` · `persona:<slug>` · `emotion:<slug>` · `style:<lofi|hifi|graphic|illustrated|lifestyle>` · `type:<angle type, e.g. problem_fix>` · `archetype:<slug>` · `hook:<n>` · `stage:<unaware|problem|solution|product|most>` · `batch:<yyyy-mm-dd>` · `mode:<fresh|iterate|rotation|fix>` · `test:<short-slug>` · `offer-ends:<yyyymmdd>` (e.g. `offer-ends:20261031`) (promo ads) · `claims:<pass|cuts|facts-only>` · `src:<first 8 characters of the template or creative id>` · `structure-only` (templates the brand doesn't own) · the judge's tags `judge:<pass|needs-review|unjudged>`, `try:<1|2>`, `superseded` (`judge.md` §8) · `picked` (only on the human's run decision)

**Tags replace the whole set.** Read the creative's current tags, merge, and write the full set once; add `picked` later the same way. Tags save to the creative's `user_tags`; picks are also written in the batch file, which stays the record of truth.

Readable name for the human and the ad account: `brand_product_angle_stage_hook#_archetype_ratio_yyyy-mm-dd` (lower-case).

## 3. The board at the spend gate (Step 7)

Show the concept board from `board.md`, trimmed for the marketer. **Show the templates as images** (a gallery page on a shell host, an artifact in hosted chat, else image links): each ad's chosen template, marked, plus two alternates. The marketer may swap any template or change the creativity level; a swap means a new prompt and a new free quote, not another stop.

| # | Angle (yours / new) | The idea in one line | What you'll see | On-image text | Template it's built on | Why it's ours (fact or customer words, source) | Quote |
|---|---|---|---|---|---|---|---|

Above it: what was read ("Read: 14 reviews, 20 of ~300 live Meta ads, 15 X posts, the homepage; LinkedIn not checked"), the creativity level and who chose it, the angles and who chose them, and a short version of the brand profile (positioning, angles, look) so the marketer can see the ads were built to fit it. Below it: the critic's main objection and what changed, cut lines with what would confirm them, open flags, the sentence "If an image fails my check I redo it once, at the same price.", and one question: "Go ahead with these quotes?" Prompts, fonts and palettes stay in the batch file; show them when asked.

## 4. The finished set (Step 9)

Per ad:

| # | Idea · starting point (source) | Physical event | References (role) | On-image text (as drawn) | Primary text (2 versions) | Headline | Description | CTA | Destination | Safe to say? | Platform rules | Check result | Look at | Link |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|

Write the check columns in plain words ("safe to say", "cut 'never oily' — nothing on file confirms it", "rewritten for Meta's rule on personal traits", "passed my check on the second try", "please read the headline letter by letter"). Brain statuses, judge checklists and check names go into tags and the batch file, not the chat.

Then, in this order (and the same content into `ads/batches/<YYYY-MM-DD>-<slug>.md` with creative ids, each ad's final prompt and image list per ratio, and its judge result per try — `reading-the-brain.md` §7):
1. **Cut lines** — `line → ad → why → proof that would restore it`.
2. **Copy variants** (if made) — under each parent ad: the image, its text, its font; to run as text options inside one flexible ad.
3. **Flags for the human** — taste calls, regulated-category notes, renders that still failed the judge after the retry (`needs_review`), "not visually checked" items.
4. **Recommended test structure** for run-paid-campaigns — e.g. "Cell A: angle test, one ad per angle, same copy; Cell B: two hooks inside the winning angle". Structure is theirs to decide; this is a suggestion.
5. **What I checked / what you should check.**
6. **Your pick** — "Tell me which to run; I'll mark them approved for launch."
