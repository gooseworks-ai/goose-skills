---
name: make-static-ads
description: >-
  Use when the marketer says: I need fresh ads this week, make me ten static or image ads, ads for Meta / Instagram / TikTok / LinkedIn, my ads all look the same, refresh my fatiguing ads, more like my winning ad, same image with different text, my image ad got rejected — fix it, ads for our sale, I have no designer, a header image or social graphic in our brand style. Delivers a launch-ready static set of a few strong, truly different concepts (who it's for, why they buy, the proof), each in different looks, shaped on real ads running on Meta that the agent matches and the marketer approves, composed and judged by the agent exactly like GooseWorks' own ad engine, every claim checked against the brand brain and ad rules, and a batch file ready to launch. Never invents an offer, claim or review; never launches or spends ad budget. Not for video — make-video-ads; not for product photos — make-product-photos; not for search text ads (not covered yet); not for launching — run-paid-campaigns.
---

# make-static-ads

This playbook **is GooseWorks' static-ad pipeline, run by the agent**: it reads the brand, picks a template, composes the image prompt exactly as the server's composer does (`references/composer.md`), sends it through the thin `ads_render` tool, judges every render with the server's rubric and retries the same way (`references/judge.md`). On top of that copy it adds three improvements: concepts that are truly different (who, why, what proof), fresh templates from ads running on Meta, and the brand brain for what may be claimed.

**One prompt.** What the marketer types in this chat is the composer's "User instructions (highest priority)" — exactly like the prompt box in the app. The agent never writes a second prompt on top of it; each ad's concept goes in the composer's own per-ad "Messaging angle / Variant brief" slot (`composer.md` §6.6–6.7).

## What you get

A **static ad set** — default ten ads, fewer for a small test budget. **A concept** = one persona, one reason to buy, one proof. **An ad** = one execution of a concept: one look (framework, visual style, composition), one copy set, in every ratio its placements need. Default shape: 3–5 concepts × 2–3 ads each. Each ad: renders per placement (Meta default 4:5 + 9:16; LinkedIn 1:1), two primary texts, headline, description, CTA, destination; its concept row (persona, reason to buy and its source, emotion, stage, framework, visual style), the real reference ad it was built from, its font and palette; and a plain-words check line (safe to say · cut and what would restore it · needs your call — policy or taste only · please look at…). Plus a coverage note (what the brand already runs vs what is new), a recommended test structure and a batch file in the workspace. Optional: extra text versions of the best images. Example of excellent output: `references/handoff-format.md` §5.

## Before you start

**Hard rules:**

1. **Claims — the server composer's rule, checked against the brain** (`references/claims-and-policy.md` §2): a factual claim may appear only when it is in the brand context (the brand kit's proof points and value props, the brand's own website facts, product details) and the brand brain does not mark it as a guess. `confirmed` → use it; `found` on the brand's website or kit → use it; `guess` or `unknown` → cut it and say what would confirm it. Never invent, round up or embellish a claim.
2. **Money:** nothing generates before the marketer's yes to the engine's own quotes, shown as given (`../../atoms/spend-gate/ATOM.md`, branch A). The yes covers the judge's one retry per image at the same price, said plainly up front. Paid ad-library reads use branch B (one yes to a ceiling). Layer splits and copy variants are asked separately. Never your own sum.
3. **People:** no generated person presented as a customer, doctor or reviewer; no review that isn't real, verbatim and attributed.
4. **Every ad is a remix of a template**, and templates the brand doesn't own are used as a written layout only — their image never reaches the image model (`references/structure-blueprint.md`). Never another brand's words, claims, logo, product or people.
5. **Run decision:** the human picks what runs. This playbook never launches or spends ad budget.
6. **Talk to the marketer in plain words:** never name a playbook, tool, id or model; credits only as GooseWorks prints them.
7. **Server vs playbook:** follow each answer's `next_step` for tool order and wording; where it would skip Steps 1–7 or present the agent's choice as the marketer's, this playbook wins.

**Setup:**

1. **Connection.** No `gooseworks:` tools (after one `gooseworks:tools_load` for a missing group: `brand`, `ads`, `media`, `campaigns`, `meta`, `social`, `files`, `data`) → say only: "Connect GooseWorks first — I make your ads through it."
2. **Server start.** `gooseworks:get_started` with `wants: "image"` and the marketer's words; its answer settles setup and the brand only. A card → wait for the press (`gooseworks:card_wait`), then Step 1.
3. Load `references/engine-notes.md` (research status, read size, the thin render tool, tags) and `references/creative-taxonomy.md` (the nine levers).
4. **Mode** (from the ask): **fresh batch** · **iterate on a winner** (keep reason and proof, change one lever) · **rotation** (an open `Rotation needed: for make-static-ads` line in `ads/campaigns/<slug>/rotation-requests.md`, or pasted) · **copy variants** of an approved image (Step 11 only, after reading the creative) · **rejected ad — fix it** (Step 7b) · **stock or price change** (list every delivered ad showing it, flag them to pause, offer substitutes) · **graphic request** — from a sibling's request line or asked directly ("a header image for my newsletter") — `atoms/graphic-request/ATOM.md` in place of Steps 1–12 (it reads the kit and claims itself).

## Steps

### 1. Read the brand, the brain, the account and what the brand already says — before asking anything
Load `references/reading-the-brain.md`. Reads: `gooseworks:brand_read` (summary, kit, products, competitors, learnings; `product_ids` for the featured product; `sections: ["organic"]` for recent posts — topics only, skip giveaways and posts older than six months); the brand brain (`gooseworks:brain_map`, then `gooseworks:brain_search` for this product's claims and proof with their statuses — `references/claims-and-policy.md` §2); customer words (§2), the angle bank (§3), the weekly performance read, rotation requests and campaign record (§4); `gooseworks:meta_read` `view: "performance"`; the brand's own Meta ads (`references/references-and-remix.md` §2a — check the advertiser is this brand); the ads already made for this brand in GooseWorks (its batch files and recent creatives, §2a).
Writes: a short **state note** — winners, fatigue, the product's price and eligibility, what may be claimed (with brain status) — and the **concept inventory**: each running own static in one line (reason to buy, persona, offer, framework), plus a **made before** list of past GooseWorks ads (reason, template, hook, example content shown).

### 2. Ask the questions — always, in one form, before anything is made
Reads: the state note, the brand brain, the kit. Writes: the brief and the answers. Use the host's question form (`AskUserQuestion` or the host's equivalent; in plain chat, one numbered message). Every question has a suggested answer first, so "use your suggestions" is a full reply. Always ask:
1. **Logo:** with the brand logo / no logo.
2. **Colours:** brand colours / the template's colours / a fresh palette (new colours, different on every ad).
3. **Font:** the brand font (only offered when it is a real font file the agent can use — Google Fonts or a file in the kit) / upload your font file / pick from 2–3 fonts that suit the brand (`references/fonts-and-color.md` §2) / no specific font (the model chooses).
4. **Templates:** you pick from real ads running on Meta that I'll show you / I pick for you.
5. **How many ads and where** (default: 3, Meta feed 4:5) — skip when the ask already says.
Ask too, only when it applies: a claim the concepts need that the brain marks `guess` or `unknown` ("can the ads say this?" — a yes is saved as a learning in the marketer's words, `../../atoms/save-learning/ATOM.md`); a sale price or offer on the product record ("show the $60 price?"); two sources that disagree on price or stock.
Physical product without usable photos → stop, say real product photos come first, and write a `Product imagery needed:` request line (`reading-the-brain.md` §7). Software → the kit's screenshots or real screenshots the marketer gives.

### 3. Build the concept grid
Reads: the brief, the concept inventory, `references/creative-taxonomy.md`, `references/angles-and-hooks.md`, `references/formats-and-placements.md` §1–2. Writes: the grid. Run `atoms/concept-grid/ATOM.md`: a few strong concepts, each in different looks (default 3–5 × 2–3 for ten ads; for a small ask like three ads, three ads on two or three concepts), every reason to buy with its source, customer words first. No two ads share reason + framework + style; covering the text, no two look alike. Then the **concept gate** (`creative-taxonomy.md` §4). Each concept is written as the server's per-ad angle (`references/composer.md` §6.7, "Variant brief").

### 4. Show templates from the Meta Ad Library — the marketer picks
Reads: the grid, the Step 2 answers, `references/references-and-remix.md`. Writes: the gallery, one template per ad. Run `atoms/find-references/ATOM.md`. **Default source: the Meta Ad Library** — static ads from the brand's competitors and the category's leading brands that have run longest (or run in several versions, or sit first on the advertiser's page), read free in the host's browser, else through the data proxy on one yes to a small ceiling. Show 8–12 as a gallery (image, advertiser, days running, the concept it would carry), the agent's suggestion marked. The marketer picks; "you pick" → the agent's suggestions (long-running, not already used by this brand on Meta or in GooseWorks, different looks). Prefer templates that carry a headline. **The template gives the shape; each ad keeps its concept** — a different pick never changes the persona, reason or proof (`references-and-remix.md` §3). A direct competitor's ad lends its layout only, never its picture idea or words (§5). Each picked Meta ad is registered as a template (`references-and-remix.md` §4). Every ad has a template.

### 5. Write the copy around the image
Reads: grid, voice, banned words, customer words. Writes: a copy row per ad. Run `atoms/ad-copy/ATOM.md` for the parts the platform shows around the image — two primary texts, headline, description, CTA, destination — and the hook direction that goes into the ad's Variant brief. The **on-image words are written by the composer** in Step 6, under its text-density, coherent-copy and claims rules.

### 6. Compose every ad exactly as the server does
Reads: `references/composer.md` (inputs §1, decisions §2, colour scheme §3, references §4, instructions §5, context §6, output §7, final prompt §8), `references/structure-blueprint.md` (templates the brand doesn't own), `references/font-specimen.md`. Writes: per ad, the composer's answer and the final prompt and ordered image list. Run `atoms/compose/ATOM.md`. The marketer's chat words are the User instructions; the concept is the ad's Variant brief; nothing else is added.

### 7. Check claims and policy on what was composed — before any money is spent
Reads: `references/claims-and-policy.md`, the composed prompts. Writes: check results and the cut list. `atoms/claims-extract/ATOM.md` pulls every claim-bearing span from the copy rows and the composed on-image text; each is kept by the brain rule (hard rule 1) or cut, and the ad is re-composed without it; `../../atoms/ad-policy-check/ATOM.md` checks platform and category rules.
**7b. Rejected ad — fix it** (image ads; a rejected video is the video job): read the open `Fix needed: for make-static-ads` line and the health line of `ads/campaigns/<slug>/state.md`, or ask for the ad and the platform's exact reason; find it (`ads_creative_read` by tag, or `ads_template_read` `mode: "mine"`); map the reason to the line or element; copy-only → rewritten copy, free; image text → re-compose with the creative's render as the template and a quoted `ads_render`; nothing violates → suggest a review request; re-run both checks; write the fix into the batch file and answer `Fix ready:` under the request; offer to save the lesson (`../../atoms/save-learning/ATOM.md`). Steps 3–6 do not run.

### 8. Show the plan and the quotes — the spend gate
Reads: composed ads, check results, templates. Writes: the plan table (`references/handoff-format.md` §3), cuts, flags, coverage note, test question. One `gooseworks:ads_render` `dry_run: true` per ad and ratio (`composer.md` §10–11). Show each quote as returned, one by one, and say: "If an image fails my check I redo it once, at the same price." Ask "Go ahead with these quotes?" and wait for the explicit yes.

### 9. Generate
Reads: the quoted calls and the yes. Writes: jobs, creatives. Submit each call exactly as quoted. Poll `gooseworks:job_get` (`kind: "ads_batch"`) until nothing is pending; a failed job is reported, never resubmitted silently.

### 10. Judge every render; retry the way the server does
Reads: each render (`ads_creative_read` `creative_id`, `include: ["renders","plan"]`), `references/judge.md`, `references/review-rubric.md`. Writes: verdicts, retries, the drop list. Run `atoms/render-review/ATOM.md`: the server's judge on every render (a fresh subagent where the host has one), its pass rule, and its retry note on a fail — one retry, inside the yes already given. A render refused by the model's content policy is re-composed without the line or visual that triggered it and sent once more; that counts as the retry. Then the playbook's extra checks (rubric 1–23) and the set-diversity check. Still failing after the retry → drop it and say why.

### 11. Copy variants — optional, offered
Reads: the approved renders, the spare hooks from Step 5. Writes: variant images under their parent ad. For the one or two images the marketer likes most, offer `atoms/copy-variants/ATOM.md`: the same picture with other hooks or another font. These test copy, not concepts; each paid step on its own yes.

### 12. Package and hand over
Reads: `references/handoff-format.md`; the product record again. Writes: lower-case tags on every creative (`gooseworks:ads_creative_update`, read-merge-write); the batch file `ads/batches/<YYYY-MM-DD>-<slug>.md` (`gooseworks:file_write`) with the full per-ad copy, concept row, template and Ad Library link, the final prompt, the judge result; a `Rotation ready:` answer under a served rotation request; the hand-off in chat in plain words — coverage note, set table, cuts, flags, recommended test structure, what to look at yourself, each creative's link. Ask which to run. Then judge whether a standing weekly refresh would help (steady spend, fatiguing creative); offer it only then, created paused with `gooseworks:automation_upsert` (`../../atoms/spend-gate/ATOM.md`, automation rule).

## Approval gates

1. **Spend** — the yes to the engine's quotes as given, covering one judge retry per image; one yes to a ceiling for paid ad-library reads; layer splits and copy variants asked separately.
2. **Questions and templates** — the Step 2 form is always shown and answered (or "use your suggestions"); the marketer sees the template gallery and picks, or says "you pick", before any quote.
3. **Claims** — only what hard rule 1 allows; every cut line is listed with what would confirm it. A claim the marketer confirms in this chat is saved in their words as a learning before it is used.
4. **The run decision** — record a pick only on the human's words: feedback `rating: "happy"` on the chosen render, `picked` added to its tags, and the pick in the batch file.

## Output and write-back

- Tagged creatives in GooseWorks; registered templates; the batch file in the workspace; the hand-off in chat.
- Judge results go in the batch file and the creative's tags (`judge.md` §8). Render feedback (`gooseworks:ads_creative_update` `feedback`) is the human's channel — it trains the brand's learned rules — so it carries only the marketer's own ratings and words.
- **Brand learnings** only through `../../atoms/save-learning/ATOM.md` — the human's own words, one idea per learning, own superseded ones retired, text starting `[ads YYYY-MM-DD]` (disapproval lessons, reference or template lessons, look rules the marketer states — "no lo-fi", "always our serif"). Reasons to buy the founder states stay in the batch file and the angle record. Claims are never written here.

## Done when

- **Fresh batch:** the human would put money behind at least half; every ad is a remix of a template the marketer saw or the agent chose; every concept passed the concept gate; no two ads share reason + framework + style, and covering the text no two look alike; at least one concept the brand has not run before.
- **Every ad:** composed by `composer.md` with the marketer's words as the only User instructions; judged by `judge.md`; at most one retry; no line — including text drawn in the image — outside hard rule 1; tagged and in the batch file.
- **Iterate / rotation:** one named lever changed per ad from the winner.
- **Copy variants:** same picture, only the words or font changed, each line through the claims check.
- **Disapproval fix:** the violating line or element is gone and both checks pass.

## Out of scope

- Launching, audiences, budgets, kill/scale, scanning the account for rejections — **run-paid-campaigns** (this playbook recommends a test structure and fixes rejected image ads).
- Search text ads (Google / Bing RSA headlines, keywords) — not covered yet.
- Which ad won — **analyze-performance**. Video — **make-video-ads**. Product photography — **make-product-photos**.
- A full competitor teardown and the angle bank — **research-competitors** (this playbook reads live ads only to find references and reasons to buy); customer language — **research-market**.
- Landing pages — analyze-performance's page audit (this playbook flags a destination that does not match).
- Approving claims — **learn-my-brand**. Retail-media creative for marketplaces; decks, print, packaging, multi-page layouts.
