# References and remix — every ad is a remix of a real ad

**In short**
- **Every ad is a remix.** Each ad starts from a template — a real static ad — and the composer recreates its layout and signature mechanic for this brand (`composer.md`). There is no "from scratch" path and no ad without a template.
- **Fresh templates every run, from Meta.** Like the custom-video flow, the agent finds real statics running on Meta (the brand's competitors and category leaders, plus the template library) and shows them to the marketer as templates to remix.
- **The marketer picks; if they don't, the agent picks** — templates likely to work (long-running, or run in several versions) that the brand **has not already tried**.
- **The template's pixels follow the server's rule:** a template the brand doesn't own is turned into a written layout blueprint and never shown to the image model (`structure-blueprint.md`); the brand's own ads are shown as images.

Taxonomy terms: `creative-taxonomy.md`.

## 1. What makes a good template

- **Fits one concept slot** in the grid: its framework, visual style and composition suit the row.
- **A static:** a single image, or one card of a carousel or flexible ad.
- **Likely working** — any one of these:
  - it has run **14+ days**;
  - the advertiser runs **several versions** of the same idea (they iterated, so it likely worked);
  - it is among the **first ads** on a category leader's Ad Library page (the default order is by impressions — the ads they put the most money behind).
- **New for this brand:** not a layout the brand already runs on Meta, and not a template already used for this brand in GooseWorks (the concept inventory's "made before" list, §2a).
- **From a real brand**, legible on a phone, one clear focal point.
- **Buildable:** its signature mechanic can carry this brand's product and facts (a testimonial-card layout needs a real review; a before/after layout needs a category that allows it). If not, pick another.

Skip look-alike ad farms (many pages with person names running the same long story ad) and ads whose whole idea is a celebrity's face.

## 2. Where to look

### a. The brand's own Meta ads (free) — the concept inventory
- `gooseworks:ads_template_read` `mode: "mine"` (`filters.format: "image"`, small `limit`): keep rows imported from Meta (`source_kind: "scraped_meta"`), merge rows with the same primary text. **Check the advertiser is the brand** — a wrong page id on the brand imports someone else's ads; if so, say so and skip them.
- None imported, or the import is more than ~7 days old → `gooseworks:ads_library_scrape` with `brand_id` (free, GooseWorks pays), then poll `gooseworks:job_get` `kind: "library_scrape"`.
- **Ads already made in GooseWorks** (live or not): the brand's batch files (`gooseworks:file_list` `ads/batches`, read the ones for this brand) and its recent creatives (`gooseworks:ads_creative_read`, small `limit`; a playbook-made creative's `src:` tag names its template; an untagged one, made in the app, gets its detail read with `include: ["plan"]`). Take each ad's reason from its batch file (a `concept:` tag is only a number inside one batch). Note per ad: reason to buy, template (id, advertiser and Ad Library link or image — the same Meta ad registered twice gets two ids, so match on advertiser and link or image too), hook, and the example content shown (a search query, names, numbers, UI text).
- Write the **concept inventory**: each running own static in one line (reason to buy, persona, offer, framework), then a **made before** list from GooseWorks. A fresh batch or a "new look" rotation uses templates the brand has **not** used, fills reasons it has not tried first and gives proven reasons a new look (the `make-static-ads-concept-grid` skill (`../../make-static-ads-concept-grid/SKILL.md`) step 3), and never repeats a past ad's example content (a new search query, new names, new numbers on screen). An iterate set keeps the winner's template on purpose.

### b. Competitors and category leaders
- Imported competitor ads: `ads_template_read` `mode: "competitor"` (`filters.format: "image"`). A tracked competitor with nothing imported → `ads_library_scrape` with its `source_id` (free).
- **Category leaders** (3–5 best-known brands in the category, e.g. Gymshark and Alo for activewear, AG1 for supplements):
  - **Free, by eye** on a host with a browser: the public Ad Library page (`facebook.com/ads/library/?active_status=active&ad_type=all&country=<CC>&view_all_page_id=<page id>`; find the page id by typing the name in the library's search box and choosing it under "Advertisers").
  - **Proxy** (one yes to a ceiling, the `spend-gate` skill (`../../spend-gate/SKILL.md`) branch B): `gooseworks:data_call_provider` `provider: "scrapecreators"` — `/v1/facebook/adLibrary/search/companies` `{query}` for the page id; `/v1/facebook/adLibrary/company/ads` `{pageId, status: "ACTIVE", media_type: "all", trim: "true"}` for its ads (keep `snapshot.display_format` `IMAGE`, `DCO`, `CAROUSEL`; image = `snapshot.images[0].original_image_url` or `snapshot.cards[].original_image_url`; `start_date_string` = run start). `media_type: "IMAGE"` returns nothing — use `"all"` and filter.

### c. The template library (free)
`ads_template_read` `mode: "static_library"` with a short query for the slot's framework and look, and `mode: "community"`. Read each candidate's detail (`template_id`) before using it.

### d. Keyword search (proxy, last resort)
`/v1/facebook/adLibrary/search/ads` `{query: "<category phrase>", country, media_type: "image", status: "active", trim: "true"}` — category words, never the brand's name. Noisy: dedupe by `collation_id` and body text; keep real brands only.

## 3. Show them as templates — the marketer picks

1. Pull 3–5 candidates per ad slot from §2. **Look at every candidate image yourself** before showing it.
2. Show them as a **gallery of templates** the marketer can scan in one screen — each with the image, the advertiser, how long it has run (or "several versions"), a one-line "what it does" (framework, style), and the concept it would carry. Shell host: one HTML page with a link; hosted chat: an artifact where supported, else a table with image links.
3. Mark the agent's suggestion for each slot. **The marketer picks.** If they don't pick (or say "you choose"), the agent uses its suggestions: likely-working templates the brand hasn't tried, spread across different frameworks and looks (`creative-taxonomy.md` §3).
4. A slot where nothing fits → show more candidates for that slot (another leader, the library, a keyword search on a yes); keep going until each ad has a template.
5. **The template gives the shape; the concept keeps the message.** When the marketer picks a template other than the suggestion — including one shown for another slot — the slot keeps its concept: persona, reason to buy, proof and hook direction. The agent updates the row's look columns (framework, visual style, composition) to the new template, re-runs the diversity checks (`creative-taxonomy.md` §4) and picks the angle directive again, then checks that the template's mechanic can carry the concept. If it can't, say so in one line and offer the nearest template that can, or move the concept to the slot whose template fits. Never take on the template's own message, metaphor or audience in place of the concept.
6. **A template already used for this brand** (the "made before" list) is never the suggestion. If the marketer picks it anyway, say once which ad used it, and change everything inside the layout: the example content, the picture and the words.

## 4. Register each picked template

The composer works from a GooseWorks template record (its detail gives title, description, layout, style and mood tags, text density and `remix_spec` — `composer.md` inputs).
- **Already a template** (library, community, imported competitor or own ad) → use its `template_id`.
- **A Meta ad found in §2b–d** → re-host the image (`gooseworks:media_upload` `source: {type: "fetch"}`; ad-library links expire) and register it with `gooseworks:ads_template_create` (`source: {type: "media"}`, a title naming the advertiser and framework, tags `ref:meta`, `src:<advertiser-slug>`). `rights_attested: true` only for the brand's own ads, on the marketer's word. Wait until the template's detail shows its remix fields.
- **Pixels:** the server's rule decides what the image model sees (`structure-blueprint.md`): a template the brand doesn't own → the agent looks at it only to write the layout blueprint (as the server's blueprint step does), composes from the blueprint, and never sends the template image to the image model; the brand's own ad → the template image goes first in the image list.

Record per ad: template id, advertiser and Ad Library link, and whether it ran structure-only, in the grid row and the batch file (`src:` tag = first 8 characters of the template id).

## 5. Rights

Borrow layout and mechanic, never another brand's words, claims, logo, packaging, people or signature look. A celebrity, doctor or athlete in a template is a slot for the brand's own endorser with permission on file — never a generated lookalike. Keep each template's Ad Library link in the batch file.

**Direct competitors — layout only.** A direct competitor is a tracked competitor, or any brand selling the same kind of product to the same buyer. From its ad, borrow only the grid (where the image, headline and button sit) and the kind of mechanic (a calendar, a search bar, a stat). Never borrow:
- its central picture idea or prop (binoculars, a fishbowl, a person in disguise);
- its photo treatment when that is its look (a colour-washed portrait);
- its headline or opening line, even reworded ("If you want to find hard-to-reach talent" → "For hard-to-fill reqs" is still theirs).

**The side-by-side test:** cover both logos and put our ad next to the competitor's. If a buyer could mistake ours for theirs, or think we copied, change the picture idea and the words before rendering. Ads from leaders in *other* categories may lend their picture idea; it is new to this buyer.
