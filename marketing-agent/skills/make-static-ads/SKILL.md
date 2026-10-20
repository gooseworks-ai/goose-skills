---
name: make-static-ads
description: >-
  Static image ads for Meta, Instagram, TikTok or LinkedIn: a few truly different concepts, each built on a real ad from the Meta Ad Library, composed, rendered, judged and claim-checked against the brand brain. Use for: new static or image ads ("ten fresh ads this week", "make me some ads", "ads for our sale"); "my ads all look the same"; refreshing fatiguing ads; more like a winning ad; the same image with new text or another font; a rejected image ad to fix; a price or stock change on running ads; a header image or social graphic in the brand's style. Use this, not goose-ads, for any static ad. Not for video (goose-video), product photos (goose-product-photos) or launching (run-paid-campaigns).
version: 0.4.2
---

# make-static-ads

The agent runs GooseWorks' static-ad pipeline itself. It plans truly different concepts, picks a template from real ads running on Meta, composes each image prompt with the server's own composer rules, renders through `gooseworks:ads_render`, and judges every render with the server's own judge. The server only renders and saves.

**One prompt.** What the marketer types in this chat is the composer's User instructions, sent unchanged. Each ad's concept travels in its own Variant brief (Step 6). The agent never writes a second prompt on top.

**The template is the shape; the concept is the message.** A template decides the layout. Who the ad speaks to, why they buy and the proof come from the concept, whatever template is picked.

## What you get

The number of ads and placements chosen at Step 2. **A concept** = one persona, one reason to buy, one proof. **An ad** = one look for a concept (framework, visual style, composition) and one copy set, in every ratio its placements need.

- **Per ad:** the renders, two primary texts, headline, description, CTA, destination, its concept row, the Meta ad it was built from, its font and palette, and a plain-words check line.
- **Per set:** a coverage note (what the brand already runs vs what is new), a recommended test structure, and a batch file in the workspace (fields: `references/reading-the-brain.md` §7; a worked example: `references/handoff-format.md` §5).
- **Optional:** extra text versions of the best images.

## Before you start

**Hard rules:**

1. **Every factual line is a usable fact** (`references/claims-and-policy.md` §2). Anything else is cut, and the hand-off says what would confirm it.
2. **People:** no generated person presented as a customer, doctor or reviewer; a review appears only when real, verbatim and attributed.
3. **Other brands' ads lend their layout only.** Every ad is a remix of a template. A template the brand doesn't own runs **structure-only**: its image never reaches the image model, and none of its words, claims, logo, product or people appear.
4. **Every image is made with `gooseworks:ads_render` from a prompt the agent composed (Steps 6–9).** Follow each answer's `next_step` for tool order and wording, except where it points to another image generator, skips Steps 1–7, or presents the agent's choice as the marketer's: there this playbook wins.

**Setup:**

1. **Connection.** Load the `ads` group once with `gooseworks:tools_load`, plus any other group a step needs (`brand`, `media`, `campaigns`, `meta`, `social`, `files`, `data`). Done when `gooseworks:ads_render` is listed. No `gooseworks:` tools at all → say only: "Connect GooseWorks first — I make your ads through it." Tools but no `ads_render` → say: "Image ads can't be made on this connection yet." and stop.
2. **Server start.** `gooseworks:get_started` with `wants: "image"` and the marketer's words; its answer settles setup and the brand only. A card → wait for the press (`gooseworks:card_wait`).
3. **Research complete.** `gooseworks:brand_read` → `research_status` must be `complete`, or every render fails after the yes. `running` → wait (`gooseworks:job_get` `kind: "brand_research"`); `none` → say the brand isn't set up yet; no website or store link → images can't be made yet, so offer the concepts, templates and copy alone.
4. Load `references/engine-notes.md`.
5. Pick the **mode**:

| Mode | Trigger | What runs |
|---|---|---|
| Fresh batch | new ads | Steps 1–12 |
| Iterate on a winner | "more like this ad" | Steps 1–12; the grid keeps the winner's reason and proof and changes one named lever per ad |
| Rotation | an open `Rotation needed: for make-static-ads` line in `ads/campaigns/<slug>/rotation-requests.md`, or pasted | Steps 1–12, the reason taken from the request (the `make-static-ads-concept-grid` skill (`../make-static-ads-concept-grid/SKILL.md`) step 7) |
| Copy variants | "same image, different text / font" on an approved image | read the creative (`gooseworks:ads_creative_read`), then Step 11 |
| Rejected ad | "my ad got rejected", or an open `Fix needed: for make-static-ads` line in `ads/campaigns/<slug>/rotation-requests.md` | the `make-static-ads-fix-rejected` skill (`../make-static-ads-fix-rejected/SKILL.md`) |
| Price or stock change | a price, offer or stock change on ads already delivered | list every delivered ad that shows the old fact (batch files; creatives by `offer-ends` and product tags) and flag each to pause; offer remakes with the new fact through Steps 6–10 on a new quote |
| Graphic request | a header, social or blog image, asked or from a sibling's `Graphic needed:` line | the `make-static-ads-graphic-request` skill (`../make-static-ads-graphic-request/SKILL.md`) |

## Steps

### 1. Read the brand, the brain, the account and what was made before
Load `references/reading-the-brain.md`. Reads: `gooseworks:brand_read` lean (summary, kit, products with `product_ids`, competitors, learnings; `sections: ["organic"]` for post topics from the last six months, giveaways skipped); the brand brain (`gooseworks:brain_map`, then `gooseworks:brain_search` for this product's claims and proof, §1); customer words, the angle bank, the performance read, rotation requests and campaign record (§2–5); `gooseworks:meta_read` `view: "performance"`; the brand's own Meta ads and its past GooseWorks ads (`references/references-and-remix.md` §2a).
Writes: a **state note** (winners, fatigue, the product's price and eligibility, the usable facts) and the **concept inventory**: each running own static in one line (reason, persona, offer, framework), plus the **made-before list** (reason, template, hook, example content shown).
Done when every source above is read or named as missing.

### 2. Ask the questions in one form
Reads: the state note, the kit. Writes: the brief and the answers. Use the host's question form (`AskUserQuestion` or its equivalent; in plain chat, one numbered message). Each question has a suggested answer first, so "use your suggestions" is a full reply. Ask:
1. **Logo:** with the brand logo / no logo.
2. **Colours:** brand colours / the template's colours / a fresh palette (different on every ad).
3. **Font:** the brand font (offered only when it is on Google Fonts or has a metric clone, `references/fonts-and-color.md` §1) / one of 2–3 fonts that suit the brand (§2) / no specific font.
4. **Templates:** you pick from a gallery of real ads running on Meta / I pick and show you what I chose.
5. **How many ads and where** — suggested: 3 ads, Meta feed 4:5. Skip it when the ask already says. This is the playbook's only default count.

Also ask, only when it applies: a claim the concepts need that is not a usable fact ("can the ads say this?" — a yes is saved in the marketer's words through the `save-learning` skill (`../save-learning/SKILL.md`)); a sale price or offer on the product record ("show the $60 price?"); two sources that disagree on price or stock.
A physical product with no usable photos → stop: real product photos come first. Ask the marketer for them, or offer the **goose-product-photos** skill to make product shots first. Software → the kit's screenshots or real ones the marketer gives.
Done when every question has an answer.

### 3. Build the concept grid
Load `references/creative-taxonomy.md`. Reads: the brief, the concept inventory. Writes: the grid. Run the `make-static-ads-concept-grid` skill (`../make-static-ads-concept-grid/SKILL.md`). Done when every concept passed the concept gate and no two ads share reason + framework + style.

### 4. Show templates from the Meta Ad Library; the marketer picks
Reads: the grid, the Step 2 answers. Writes: the gallery and one template per ad. Run the `make-static-ads-find-references` skill (`../make-static-ads-find-references/SKILL.md`). Done when every ad has a registered template that the marketer picked (or the agent picked and showed), its concept unchanged, and structure-only yes/no recorded.

### 5. Write the copy around the image
Reads: the grid, voice, customer words. Writes: a copy row per ad. Run the `make-static-ads-ad-copy` skill (`../make-static-ads-ad-copy/SKILL.md`): primary texts, headline, description, CTA, destination, and the hook direction for the Variant brief. The on-image words are the composer's (Step 6). Done when every ad has a copy row.

### 6. Compose every ad as the server does
Reads: the grid, copy rows, templates, Step 2 answers. Writes: per ad and ratio, the final prompt and ordered image list. Run the `make-static-ads-compose` skill (`../make-static-ads-compose/SKILL.md`). Done when every ad × ratio passes the placeholder check (`references/composer.md` §7) and no `image_urls` holds another brand's template image.

### 7. Check claims and policy before any money is spent
Reads: copy rows, composed prompts. Writes: check results and the cut list. Run Pass A of the `make-static-ads-claims-extract` skill (`../make-static-ads-claims-extract/SKILL.md`) and the `ad-policy-check` skill (`../ad-policy-check/SKILL.md`). A cut on-image line → re-compose that ad (Step 6) and check it again. Done when every span is a usable fact or cut, and every ad has a claims line and a policy line.

### 8. Show the plan and the quotes
Reads: composed ads, check results. Writes: the plan table (`references/handoff-format.md` §3). One `gooseworks:ads_render` `dry_run: true` per ad and ratio (`composer.md` §10–11). Show each quote as returned and say: "If an image fails my check I redo it once, at the same price." Ask "Go ahead with these quotes?" Done when the marketer says yes.

### 9. Generate
Submit each call exactly as quoted. Poll `gooseworks:job_get` (`kind: "ads_batch"`) until every `pending` is 0. Report a failed job; resubmit only on a new quote and yes. Done when every job is complete or reported.

### 10. Judge every render; retry the server's way
Reads: each render, its compose record. Writes: verdicts, retries, the drop list. Run the `make-static-ads-render-review` skill (`../make-static-ads-render-review/SKILL.md`): the **blind judge** on every render, one retry inside the yes, then the playbook's checks and the set-diversity check. Done when every render is passed, flagged `needs_review`, or dropped with its reason.

### 11. Copy variants — offered
For the one or two images the marketer likes most, offer the `make-static-ads-copy-variants` skill (`../make-static-ads-copy-variants/SKILL.md`): the same picture with other hooks or another font. They test copy, not concepts; each paid step gets its own yes.

### 12. Package and hand over
Load `references/handoff-format.md`; re-read the product record. Writes: lower-case tags on every creative (`gooseworks:ads_creative_update`, read-merge-write); the batch file `ads/batches/<YYYY-MM-DD>-<slug>.md` (`gooseworks:file_write`); a `Rotation ready:` answer under a served rotation request; the hand-off in chat in plain words, with each creative's link. Ask which to run. Offer a standing weekly refresh only when spend is steady and creative is fatiguing, created paused with `gooseworks:automation_upsert` (the `spend-gate` skill (`../spend-gate/SKILL.md`), automation rule).

## Approval gates

1. **Spend** — nothing renders before the marketer's yes to the quotes as GooseWorks gives them (the `spend-gate` skill (`../spend-gate/SKILL.md`), branch A), never your own sum. That yes covers one retry per image at the same price, said up front. Paid ad-library reads: branch B, one yes to a ceiling. Layer splits and copy variants: each its own yes.
2. **Questions and templates** — the Step 2 form is answered before any quote; the marketer picks from the gallery or sees the agent's picks.
3. **Claims** — every cut line is listed with what would confirm it. A claim the marketer confirms in this chat is saved in their words as a learning before it is used.
4. **The run decision** — the human picks what runs; this playbook never launches or spends ad budget. Record a pick only on the human's words: feedback `rating: "happy"` on the chosen render, `picked` in its tags, and the pick in the batch file.

## Output and write-back

- Tagged creatives in GooseWorks, registered templates, the batch file in the workspace, the hand-off in chat.
- Judge results go in the batch file and the creative's tags (`references/judge.md` §8). Render `feedback` carries only the marketer's own ratings and words, because it trains the brand's learned rules.
- **Brand learnings** only through the `save-learning` skill (`../save-learning/SKILL.md`): the human's own words, one idea per learning, own superseded ones retired, text starting `[ads YYYY-MM-DD]` (disapproval lessons, template lessons, look rules the marketer states — "no lo-fi", "always our serif"). Reasons to buy the founder states go in the batch file and the angle record. A claim is saved only as gate 3 says.

## Done when

- **Fresh batch:** every concept passed the concept gate; no two ads share reason + framework + style, and with the text covered no two look alike; at least one concept the brand has not run before; every ad is built on a template the marketer saw or the agent picked and showed; the picks are recorded.
- **Every ad:** composed with the marketer's words as the only User instructions; judged blind; at most one retry; passed, flagged or dropped with its reason; every line, including text drawn in the image, a usable fact; tagged and in the batch file.
- **Iterate / rotation:** one named lever changed per ad from the winner; rotation answered under its request.
- **Copy variants:** same picture, only the words or font changed, each line through the claims check.
- **Rejected ad:** the violating line or element is gone, both checks pass, and `Fix ready:` is answered.
- **Price or stock change:** every affected ad is listed with a pause flag; remakes only on a yes.

## Out of scope

- Launching, audiences, budgets, kill/scale, scanning the account for rejections — **run-paid-campaigns** (this playbook recommends a test structure and fixes rejected image ads).
- Search text ads (Google / Bing RSA headlines, keywords) — not covered yet.
- Which ad won — **analyze-performance**. Video ads — **goose-video**. Product photography — **goose-product-photos** (GooseWorks skills, not playbooks).
- A full competitor teardown and the angle bank — **research-competitors** (this playbook reads live ads only to find templates and reasons to buy); customer language — **research-market**.
- Landing pages — analyze-performance's page audit (this playbook flags a destination that does not match).
- Approving claims in bulk — not covered yet; the lines this batch needs go through the **claims-gate** skill. Retail-media creative for marketplaces; decks, print, packaging, multi-page layouts.
